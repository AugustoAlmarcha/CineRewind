const pool = require('../config/db');
const axios = require('axios');

// 🛡️ Helper seguro: Prioriza SIEMPRE el token autenticado para evitar suplantaciones
const resolverUsuarioId = (req) => {
  return req.usuario?.id || req.params?.usuario_id || null;
};

// ========================================================
// 1. REGISTRO INDIVIDUAL (USADO EN INICIO / BUSCADOR / MODAL)
// ========================================================
const registrarVisualizacion = async (req, res) => {
  const usuario_id = req.usuario?.id;
  if (!usuario_id) {
    return res.status(401).json({ error: 'Acceso no autorizado: debes iniciar sesión' });
  }

  const {
    tmdb_id,
    tipo,
    titulo,
    poster_path,
    fecha_visto,
    plataforma,
    pais,
    temporada,
    episodio,
    es_final_temporada,
    amigos_etiquetados,
    visto_con_texto,
  } = req.body;

  if (!tmdb_id || !tipo || !titulo || !fecha_visto) {
    return res.status(400).json({ error: 'Faltan campos obligatorios' });
  }

  const posterNormalizado = poster_path
    ? (poster_path.startsWith('http') ? poster_path : `https://image.tmdb.org/t/p/w500${poster_path.startsWith('/') ? poster_path : `/${poster_path}`}`)
    : null;

  try {
    const queryObra = `
      INSERT INTO obras_catalogo (tmdb_id, tipo, titulo, poster_path)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (tmdb_id) DO UPDATE SET 
        titulo = EXCLUDED.titulo,
        poster_path = COALESCE(EXCLUDED.poster_path, obras_catalogo.poster_path)
      RETURNING id;
    `;
    const resObra = await pool.query(queryObra, [
      tmdb_id,
      tipo.toLowerCase(),
      titulo,
      posterNormalizado,
    ]);
    const obra_id = resObra.rows[0].id;

    const tempNum = temporada !== undefined && temporada !== null ? parseInt(temporada, 10) : null;
    const epNum = episodio !== undefined && episodio !== null ? parseInt(episodio, 10) : null;

    if (tipo.toLowerCase() === 'serie') {
      const existeCap = await pool.query(
        `SELECT id FROM historial_visualizaciones 
         WHERE usuario_id = $1 AND obra_id = $2 AND temporada = $3 AND episodio = $4 AND fecha_visto = $5`,
        [usuario_id, obra_id, tempNum, epNum, fecha_visto]
      );
      if (existeCap.rows.length > 0) {
        return res.status(409).json({ 
          error: `Ya registraste el capítulo ${epNum} de la temporada ${tempNum} en esta misma fecha.` 
        });
      }
    } else {
      const existePeli = await pool.query(
        `SELECT id FROM historial_visualizaciones 
         WHERE usuario_id = $1 AND obra_id = $2 AND fecha_visto = $3`,
        [usuario_id, obra_id, fecha_visto]
      );
      if (existePeli.rows.length > 0) {
        return res.status(409).json({ 
          error: 'Esta película ya fue registrada en esa fecha.' 
        });
      }
    }

    const queryHistorial = `
      INSERT INTO historial_visualizaciones 
        (usuario_id, obra_id, fecha_visto, plataforma, pais, temporada, episodio, es_final_temporada, visto_con_texto)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *;
    `;
    const resHistorial = await pool.query(queryHistorial, [
      usuario_id,
      obra_id,
      fecha_visto,
      plataforma || null,
      pais || null,
      tempNum,
      epNum,
      Boolean(es_final_temporada),
      visto_con_texto ? String(visto_con_texto).trim() : null
    ]);

    const visualizacionId = resHistorial.rows[0].id;

    // Guardar invitaciones de co-visualización
    if (Array.isArray(amigos_etiquetados) && amigos_etiquetados.length > 0) {
      for (const amigoId of amigos_etiquetados) {
        const idAmigoNum = parseInt(amigoId, 10);
        if (idAmigoNum && idAmigoNum !== usuario_id) {
          await pool.query(
            `INSERT INTO covisualizaciones (visualizacion_id, amigo_id, estado)
             VALUES ($1, $2, 'pendiente')
             ON CONFLICT (visualizacion_id, amigo_id) DO NOTHING;`,
            [visualizacionId, idAmigoNum]
          );
        }
      }
    }

    if (tipo.toLowerCase() === 'serie') {
      const fechaRegistro = resHistorial.rows[0].creado_en;

      await pool.query(
        `INSERT INTO seguimiento_series (usuario_id, obra_id, activo, fecha_reinicio, actualizado_en)
         VALUES ($1, $2, true, $5, CURRENT_TIMESTAMP)
         ON CONFLICT (usuario_id, obra_id) DO UPDATE SET 
            activo = true,
            fecha_reinicio = CASE 
              WHEN seguimiento_series.activo = false THEN $5
              WHEN $3 = 1 AND $4 = 1 THEN $5
              ELSE COALESCE(seguimiento_series.fecha_reinicio, $5)
            END,
            actualizado_en = CURRENT_TIMESTAMP;`,
        [usuario_id, obra_id, tempNum, epNum, fechaRegistro]
      );
    }

    res.status(201).json({
      mensaje: 'Visualización guardada con éxito',
      registro: resHistorial.rows[0],
    });
  } catch (error) {
    console.error('Error al registrar:', error.message);
    res.status(500).json({ error: 'Error al registrar la visualización' });
  }
};

// ========================================================
// 2. TIMELINE CRONOLÓGICO (INICIO Y RESEÑAS CON ESTRELLAS)
// ========================================================
const obtenerTimeline = async (req, res) => {
  const usuario_id = req.params.usuario_id || req.usuario?.id;
  const { tipo } = req.query;

  if (!usuario_id) {
    return res.status(400).json({ error: 'ID de usuario requerido' });
  }

  try {
    let query = `
      SELECT 
        h.id,
        h.id AS visualizacion_id,
        h.usuario_id,
        h.fecha_visto,
        h.plataforma,
        h.temporada,
        h.episodio,
        h.es_final_temporada,
        h.calificacion,
        h.resenia,
        h.foto_episodio,
        h.visto_con_texto,
        o.id AS obra_id,
        o.tmdb_id,
        o.tipo,
        o.titulo,
        o.poster_path AS poster_serie,
        o.poster_path AS poster_obra,
        COALESCE(h.foto_episodio, o.poster_path, '') AS poster_path,
        COALESCE(
          (
            SELECT json_agg(
              json_build_object(
                'covisualizacion_id', c.id,
                'amigo_id', u.id,
                'nombre', u.nombre,
                'username', u.username,
                'avatar_url', u.avatar_url,
                'estado', c.estado
              )
            )
            FROM covisualizaciones c
            INNER JOIN usuarios u ON c.amigo_id = u.id
            WHERE c.visualizacion_id = h.id
          ),
          '[]'::json
        ) AS amigos_covision
      FROM historial_visualizaciones h
      INNER JOIN obras_catalogo o ON h.obra_id = o.id
      WHERE h.usuario_id = $1
    `;

    const params = [usuario_id];

    if (tipo && (tipo === 'pelicula' || tipo === 'serie')) {
      query += ` AND o.tipo = $2`;
      params.push(tipo);
    }

    query += ` ORDER BY h.fecha_visto DESC, h.creado_en DESC, h.id DESC;`;

    const resultado = await pool.query(query, params);

    const timelineProcesado = resultado.rows.map((row) => {
      let poster = row.poster_path;
      if (poster && !poster.startsWith('http')) {
        poster = `https://image.tmdb.org/t/p/w500${poster.startsWith('/') ? poster : `/${poster}`}`;
      }

      let posterSerie = row.poster_serie;
      if (posterSerie && !posterSerie.startsWith('http')) {
        posterSerie = `https://image.tmdb.org/t/p/w500${posterSerie.startsWith('/') ? posterSerie : `/${posterSerie}`}`;
      }

      return {
        ...row,
        poster_path: poster,
        poster_serie: posterSerie,
        poster_obra: posterSerie,
        es_final_temporada: Boolean(row.es_final_temporada),
        amigos_covision: row.amigos_covision || [],
      };
    });

    res.json(timelineProcesado);
  } catch (error) {
    console.error('Error al obtener timeline:', error.message);
    res.status(500).json({ error: 'Error al consultar el timeline' });
  }
};

// ========================================================
// 3. ELIMINAR VISUALIZACIÓN
// ========================================================
const eliminarVisualizacion = async (req, res) => {
  const { id } = req.params;
  const usuario_id = req.usuario?.id;

  if (!usuario_id) {
    return res.status(401).json({ error: 'No autorizado' });
  }

  try {
    const query = 'DELETE FROM historial_visualizaciones WHERE id = $1 AND usuario_id = $2 RETURNING *;';
    const resultado = await pool.query(query, [id, usuario_id]);

    if (resultado.rowCount === 0) {
      return res.status(404).json({ error: 'El registro no existe o no tienes permiso para eliminarlo' });
    }
    res.json({ mensaje: 'Visualización eliminada', registro: resultado.rows[0] });
  } catch (error) {
    console.error('Error al eliminar visualización:', error.message);
    res.status(500).json({ error: 'Error al eliminar de la base de datos' });
  }
};

// ========================================================
// 4. REGISTRAR LOTE DE EPISODIOS
// ========================================================
const registrarLoteVisualizaciones = async (req, res) => {
  const usuario_id = req.usuario?.id;
  if (!usuario_id) {
    return res.status(401).json({ error: 'No autorizado' });
  }

  const { 
    tmdb_id, 
    titulo, 
    poster_path, 
    plataforma, 
    temporada, 
    episodios, 
    fecha_visto, 
    fotos_episodios, 
    total_episodios_temporada,
    amigos_etiquetados,
    visto_con_texto,
  } = req.body;

  if (!tmdb_id || !titulo || !temporada || !Array.isArray(episodios) || episodios.length === 0) {
    return res.status(400).json({ error: 'Faltan datos requeridos para el registro múltiple' });
  }

  const posterNormalizado = poster_path
    ? (poster_path.startsWith('http') ? poster_path : `https://image.tmdb.org/t/p/w500${poster_path.startsWith('/') ? poster_path : `/${poster_path}`}`)
    : null;

  const tempNum = parseInt(temporada, 10);
  const episodiosNumeros = episodios.map((e) => parseInt(e, 10));
  const totalRealTemp = total_episodios_temporada ? parseInt(total_episodios_temporada, 10) : null;
  const maxEpisodioEnviado = Math.max(...episodiosNumeros);

  try {
    const queryObra = `
      INSERT INTO obras_catalogo (tmdb_id, tipo, titulo, poster_path)
      VALUES ($1, 'serie', $2, $3)
      ON CONFLICT (tmdb_id) DO UPDATE SET 
        titulo = EXCLUDED.titulo,
        poster_path = COALESCE(EXCLUDED.poster_path, obras_catalogo.poster_path)
      RETURNING id;
    `;
    const resObra = await pool.query(queryObra, [tmdb_id, titulo, posterNormalizado]);
    const obra_id = resObra.rows[0].id;

    for (const ep of episodiosNumeros) {
      const fotoEp = fotos_episodios && fotos_episodios[ep] ? fotos_episodios[ep] : null;
      const esFinTemp = Boolean(totalRealTemp && ep === totalRealTemp);

      const existe = await pool.query(
        `SELECT id FROM historial_visualizaciones 
         WHERE usuario_id = $1 AND obra_id = $2 AND temporada = $3 AND episodio = $4 AND fecha_visto = $5`,
        [usuario_id, obra_id, tempNum, ep, fecha_visto]
      );

      let visualizacionId;

      if (existe.rows.length === 0) {
        const insercion = await pool.query(
          `INSERT INTO historial_visualizaciones 
             (usuario_id, obra_id, fecha_visto, plataforma, temporada, episodio, foto_episodio, es_final_temporada, visto_con_texto)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
           RETURNING id;`,
          [
            usuario_id, 
            obra_id, 
            fecha_visto, 
            plataforma || null, 
            tempNum, 
            ep, 
            fotoEp, 
            esFinTemp,
            visto_con_texto ? String(visto_con_texto).trim() : null
          ]
        );
        visualizacionId = insercion.rows[0].id;
      } else {
        visualizacionId = existe.rows[0].id;
      }

      if (Array.isArray(amigos_etiquetados) && amigos_etiquetados.length > 0) {
        for (const amigoId of amigos_etiquetados) {
          const idAmigoNum = parseInt(amigoId, 10);
          if (idAmigoNum && idAmigoNum !== usuario_id) {
            await pool.query(
              `INSERT INTO covisualizaciones (visualizacion_id, amigo_id, estado)
               VALUES ($1, $2, 'pendiente')
               ON CONFLICT (visualizacion_id, amigo_id) DO NOTHING;`,
              [visualizacionId, idAmigoNum]
            );
          }
        }
      }
    }

    const incluyePrimerCapitulo = tempNum === 1 && episodiosNumeros.includes(1);
    const fechaLote = new Date();

    await pool.query(
      `INSERT INTO seguimiento_series (usuario_id, obra_id, activo, fecha_reinicio, total_episodios_temporada, actualizado_en)
       VALUES ($1, $2, true, $4, $5, CURRENT_TIMESTAMP)
       ON CONFLICT (usuario_id, obra_id) DO UPDATE SET 
         activo = true,
         total_episodios_temporada = COALESCE($5, seguimiento_series.total_episodios_temporada),
         fecha_reinicio = CASE 
           WHEN seguimiento_series.activo = false THEN $4
           WHEN $3 = true THEN $4
           ELSE COALESCE(seguimiento_series.fecha_reinicio, $4)
         END,
         actualizado_en = CURRENT_TIMESTAMP;`,
      [usuario_id, obra_id, incluyePrimerCapitulo, fechaLote, totalRealTemp]
    );

    res.status(201).json({ 
      mensaje: `Se procesaron ${episodios.length} capítulos exitosamente.`,
      ultimo_capitulo: maxEpisodioEnviado 
    });
  } catch (error) {
    console.error('Error al registrar lote de episodios:', error.message);
    res.status(500).json({ error: 'Error al registrar capítulos múltiples' });
  }
};

// ========================================================
// 5. EPISODIOS VISTOS DE UNA TEMPORADA
// ========================================================
const obtenerEpisodiosVistosTemporada = async (req, res) => {
  const usuario_id = req.usuario?.id || req.params.usuario_id;
  const { tmdb_id, temporada } = req.params;

  if (!usuario_id) {
    return res.status(400).json({ error: 'ID de usuario requerido' });
  }

  try {
    const query = `
      SELECT h.episodio 
      FROM historial_visualizaciones h
      INNER JOIN obras_catalogo o ON h.obra_id = o.id
      WHERE h.usuario_id = $1 AND o.tmdb_id = $2 AND h.temporada = $3;
    `;
    const resultado = await pool.query(query, [usuario_id, tmdb_id, temporada]);
    const vistos = resultado.rows.map((r) => r.episodio);
    res.json(vistos);
  } catch (error) {
    console.error('Error al consultar episodios vistos:', error.message);
    res.status(500).json({ error: 'Error al consultar episodios vistos' });
  }
};

// ========================================================
// 6. ACTUALIZAR RESEÑA Y CALIFICACIÓN
// ========================================================
const actualizarReseniaYCalificacion = async (req, res) => {
  const { id } = req.params;
  const { calificacion, resenia, plataforma, amigos_etiquetados, visto_con_texto } = req.body;
  const usuario_id = req.usuario?.id;

  if (!usuario_id) {
    return res.status(401).json({ error: 'Sesión no válida o usuario no autenticado' });
  }

  const visualizacionIdNum = parseInt(id, 10);
  if (isNaN(visualizacionIdNum)) {
    return res.status(400).json({ error: 'El ID de la visualización debe ser un número válido' });
  }

  try {
    const campos = [];
    const valores = [];
    let idx = 1;

    if (calificacion !== undefined) {
      campos.push(`calificacion = $${idx++}`);
      valores.push(calificacion !== null && Number(calificacion) > 0 ? Number(calificacion) : null);
    }
    if (resenia !== undefined) {
      campos.push(`resenia = $${idx++}`);
      valores.push(resenia !== null && typeof resenia === 'string' && resenia.trim() !== '' ? resenia.trim() : null);
    }
    if (plataforma !== undefined) {
      campos.push(`plataforma = $${idx++}`);
      valores.push(plataforma !== null && typeof plataforma === 'string' && plataforma.trim() !== '' ? plataforma.trim() : null);
    }
    if (visto_con_texto !== undefined) {
      campos.push(`visto_con_texto = $${idx++}`);
      valores.push(visto_con_texto ? String(visto_con_texto).trim() : null);
    }

    let resultado;
    if (campos.length > 0) {
      valores.push(visualizacionIdNum, usuario_id);
      const query = `
        UPDATE historial_visualizaciones
        SET ${campos.join(', ')}
        WHERE id = $${idx++} AND usuario_id = $${idx++}
        RETURNING *;
      `;
      resultado = await pool.query(query, valores);
    } else {
      resultado = await pool.query(
        'SELECT * FROM historial_visualizaciones WHERE id = $1 AND usuario_id = $2',
        [visualizacionIdNum, usuario_id]
      );
    }

    if (resultado.rowCount === 0) {
      return res.status(404).json({ error: 'Registro no encontrado o no pertenece a tu cuenta' });
    }

    if (Array.isArray(amigos_etiquetados)) {
      const actualesRes = await pool.query(
        'SELECT amigo_id FROM covisualizaciones WHERE visualizacion_id = $1',
        [visualizacionIdNum]
      );
      const actualesIds = actualesRes.rows.map((r) => r.amigo_id);
      const nuevosIds = amigos_etiquetados.map((id) => Number(id)).filter((id) => id && id !== usuario_id);

      const paraEliminar = actualesIds.filter((id) => !nuevosIds.includes(id));
      if (paraEliminar.length > 0) {
        await pool.query(
          'DELETE FROM covisualizaciones WHERE visualizacion_id = $1 AND amigo_id = ANY($2::int[])',
          [visualizacionIdNum, paraEliminar]
        );
      }

      for (const amigoId of nuevosIds) {
        await pool.query(
          `INSERT INTO covisualizaciones (visualizacion_id, amigo_id, estado)
           VALUES ($1, $2, 'pendiente')
           ON CONFLICT (visualizacion_id, amigo_id) DO NOTHING;`,
          [visualizacionIdNum, amigoId]
        );
      }
    }

    res.json({
      mensaje: 'Registro actualizado con éxito',
      registro: resultado.rows[0],
    });
  } catch (error) {
    console.error('Error al actualizar reseña/plataforma:', error.message);
    res.status(500).json({ error: 'Error al actualizar el registro' });
  }
};

// ========================================================
// 7. ELIMINAR LOTE
// ========================================================
const eliminarLoteVisualizaciones = async (req, res) => {
  const { ids } = req.body;
  const usuario_id = req.usuario?.id;

  if (!usuario_id) {
    return res.status(401).json({ error: 'No autorizado' });
  }

  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: 'Debes enviar un arreglo de IDs a eliminar' });
  }

  try {
    const query = 'DELETE FROM historial_visualizaciones WHERE id = ANY($1::int[]) AND usuario_id = $2 RETURNING id;';
    const resultado = await pool.query(query, [ids, usuario_id]);

    res.json({
      mensaje: `Se eliminaron ${resultado.rowCount} registros correctamente`,
      eliminados: resultado.rows.map((r) => r.id),
    });
  } catch (error) {
    console.error('Error al eliminar lote de visualizaciones:', error.message);
    res.status(500).json({ error: 'Error interno al eliminar registros en lote' });
  }
};

// ========================================================
// 8. ACTUALIZAR PLATAFORMA DE SERIE
// ========================================================
const actualizarPlataformaSerie = async (req, res) => {
  const usuario_id = req.usuario?.id;
  const { obra_id, plataforma, solo_vacios } = req.body;

  if (!usuario_id || !obra_id || !plataforma) {
    return res.status(400).json({ error: 'Faltan parámetros obligatorios' });
  }

  try {
    let query = `
      UPDATE historial_visualizaciones
      SET plataforma = $1
      WHERE usuario_id = $2 AND obra_id = $3
    `;
    const params = [plataforma, usuario_id, obra_id];

    if (solo_vacios === true || solo_vacios === 'true') {
      query += ` AND (
        plataforma IS NULL 
        OR TRIM(plataforma) = '' 
        OR LOWER(TRIM(plataforma)) = 'sin plataforma'
      )`;
    }

    const resultado = await pool.query(query, params);

    res.json({
      mensaje: 'Plataforma actualizada correctamente',
      modificados: resultado.rowCount,
    });
  } catch (error) {
    console.error('Error al actualizar plataformas de la serie:', error.message);
    res.status(500).json({ error: 'Error al actualizar plataformas' });
  }
};

// ========================================================
// 9. CATÁLOGO DEL USUARIO
// ========================================================
const obtenerCatalogoUsuario = async (req, res) => {
  const usuarioId = req.usuario?.id;
  const { tipo } = req.query;

  if (!usuarioId) {
    return res.status(401).json({ error: 'No autorizado' });
  }

  try {
    const consulta = `
      SELECT DISTINCT 
        o.id, 
        o.tmdb_id, 
        o.tipo, 
        o.titulo, 
        o.poster_path
      FROM obras_catalogo o
      INNER JOIN historial_visualizaciones h ON h.obra_id = o.id
      WHERE h.usuario_id = $1 ${tipo ? 'AND o.tipo = $2' : ''}
      ORDER BY o.titulo ASC;
    `;
    const params = tipo ? [usuarioId, tipo] : [usuarioId];
    const resultado = await pool.query(consulta, params);
    res.json(resultado.rows);
  } catch (error) {
    console.error('Error al obtener catálogo guardado del usuario:', error.message);
    res.status(500).json({ error: 'Error del servidor' });
  }
};

// ========================================================
// 10. ESTADÍSTICAS DEL USUARIO
// ========================================================
const obtenerEstadisticasUsuario = async (req, res) => {
  const usuarioId = req.query.usuario_id || req.usuario?.id;
  if (!usuarioId) {
    return res.status(401).json({ error: 'No autorizado' });
  }

  try {
    const seriesRes = await pool.query(`
      SELECT COUNT(DISTINCT o.id) AS total_series
      FROM historial_visualizaciones h
      INNER JOIN obras_catalogo o ON h.obra_id = o.id
      WHERE h.usuario_id = $1 AND o.tipo = 'serie';
    `, [usuarioId]);

    const episodiosRes = await pool.query(`
      SELECT COUNT(h.id) AS total_episodios
      FROM historial_visualizaciones h
      INNER JOIN obras_catalogo o ON h.obra_id = o.id
      WHERE h.usuario_id = $1 AND o.tipo = 'serie';
    `, [usuarioId]);

    const peliculasRes = await pool.query(`
      SELECT COUNT(h.id) AS total_peliculas
      FROM historial_visualizaciones h
      INNER JOIN obras_catalogo o ON h.obra_id = o.id
      WHERE h.usuario_id = $1 AND o.tipo = 'pelicula';
    `, [usuarioId]);

    const totalSeries = parseInt(seriesRes.rows[0].total_series, 10) || 0;
    const totalEpisodios = parseInt(episodiosRes.rows[0].total_episodios, 10) || 0;
    const totalPeliculas = parseInt(peliculasRes.rows[0].total_peliculas, 10) || 0;

    const horasPeliculas = totalPeliculas * 1.75;
    const horasSeries = totalEpisodios * 0.75;
    const horasTotales = Math.round(horasPeliculas + horasSeries);

    res.json({
      total_series: totalSeries,
      total_episodios: totalEpisodios,
      total_peliculas: totalPeliculas,
      horas_totales: horasTotales,
    });
  } catch (error) {
    console.error('Error al calcular estadísticas:', error.message);
    res.status(500).json({ error: 'Error del servidor al calcular estadísticas' });
  }
};

// ========================================================
// 11. RÉCORDS DEL USUARIO
// ========================================================
const obtenerRecordsUsuario = async (req, res) => {
  const usuarioId = req.query.usuario_id || req.usuario?.id;
  if (!usuarioId) {
    return res.status(401).json({ error: 'No autorizado' });
  }

  try {
    const serieQuery = `
      SELECT 
        o.id,
        o.tmdb_id,
        o.titulo,
        o.poster_path,
        COUNT(h.id) AS total_capitulos
      FROM historial_visualizaciones h
      INNER JOIN obras_catalogo o ON h.obra_id = o.id
      WHERE h.usuario_id = $1 AND o.tipo = 'serie'
      GROUP BY o.id, o.tmdb_id, o.titulo, o.poster_path
      ORDER BY total_capitulos DESC
      LIMIT 1;
    `;
    const serieRes = await pool.query(serieQuery, [usuarioId]);

    const peliQuery = `
      SELECT 
        o.id,
        o.tmdb_id,
        o.titulo,
        o.poster_path,
        COUNT(h.id) AS veces_vista
      FROM historial_visualizaciones h
      INNER JOIN obras_catalogo o ON h.obra_id = o.id
      WHERE h.usuario_id = $1 AND o.tipo = 'pelicula'
      GROUP BY o.id, o.tmdb_id, o.titulo, o.poster_path
      HAVING COUNT(h.id) > 1
      ORDER BY veces_vista DESC
      LIMIT 1;
    `;
    const peliRes = await pool.query(peliQuery, [usuarioId]);

    res.json({
      maratonSerie: serieRes.rows[0] || null,
      rewatchPelicula: peliRes.rows[0] || null,
    });
  } catch (error) {
    console.error('Error al calcular récords del usuario:', error.message);
    res.status(500).json({ error: 'Error del servidor al obtener récords' });
  }
};

// ========================================================
// 12. CINEREWIND WRAPPED (GALA ANUAL INTERACTIVA)
// ========================================================
const cacheCreditos = new Map();

// Consulta inteligente: Para series consulta AGGREGATE CREDITS (reparto completo con conteo real de episodios)
// y los detalles de la serie para extraer a los CREADORES (David Shore, David Chase, etc.)
const obtenerCreditosTMDb = async (tmdb_id, tipo) => {
  if (!tmdb_id) return { cast: [], crew: [], creador: null };
  const cacheKey = `${tipo}_${tmdb_id}`;
  if (cacheCreditos.has(cacheKey)) {
    return cacheCreditos.get(cacheKey);
  }

  const apiKey = process.env.TMDB_KEY || process.env.TMDB_API_KEY || '1b4f4c9c2771d9ff8d2345a557b7899d';
  try {
    let cast = [];
    let crew = [];
    let creador = null;

    if (tipo === 'pelicula') {
      const res = await axios.get(`https://api.themoviedb.org/3/movie/${tmdb_id}/credits`, {
        params: { api_key: apiKey, language: 'es-ES' },
        timeout: 3500
      });
      cast = res.data.cast || [];
      crew = res.data.crew || [];
    } else {
      // 1. En series: aggregate_credits para tener el elenco de TODAS las temporadas con su total_episode_count
      const resCast = await axios.get(`https://api.themoviedb.org/3/tv/${tmdb_id}/aggregate_credits`, {
        params: { api_key: apiKey, language: 'es-ES' },
        timeout: 3500
      });
      cast = resCast.data.cast || [];
      crew = resCast.data.crew || [];

      // 2. Buscar al CREADOR / SHOWRUNNER (David Shore, David Chase, Vince Gilligan, etc.)
      try {
        const resTv = await axios.get(`https://api.themoviedb.org/3/tv/${tmdb_id}`, {
          params: { api_key: apiKey, language: 'es-ES' },
          timeout: 3500
        });
        const createdBy = resTv.data.created_by;
        if (Array.isArray(createdBy) && createdBy.length > 0) {
          creador = {
            id: createdBy[0].id,
            name: createdBy[0].name,
            profile_path: createdBy[0].profile_path,
            cargo: 'CREADOR & SHOWRUNNER'
          };
        }
      } catch (e) {}
    }

    const resultado = { cast, crew, creador };
    cacheCreditos.set(cacheKey, resultado);
    return resultado;
  } catch (err) {
    return { cast: [], crew: [], creador: null };
  }
};

const obtenerWrappedPeriodo = async (req, res) => {
  try {
    const usuario_id = req.usuario.id;
    const { anio, mes } = req.query;

    if (!anio) {
      return res.status(400).json({ error: 'El parámetro anio es obligatorio' });
    }

    let filtroFecha = 'EXTRACT(YEAR FROM hv.fecha_visto) = $2';
    const params = [usuario_id, parseInt(anio, 10)];

    if (mes && parseInt(mes, 10) >= 1 && parseInt(mes, 10) <= 12) {
      params.push(parseInt(mes, 10));
      filtroFecha += ` AND EXTRACT(MONTH FROM hv.fecha_visto) = $${params.length}`;
    }

    // 1. Métricas Generales (Películas, Capítulos, Horas y Reseñas)
    const queryMetricas = `
      SELECT 
        COUNT(DISTINCT CASE WHEN LOWER(oc.tipo) = 'pelicula' THEN hv.obra_id END) as total_peliculas,
        COUNT(CASE WHEN LOWER(oc.tipo) = 'serie' THEN 1 END) as total_episodios,
        COUNT(CASE WHEN hv.resenia IS NOT NULL AND TRIM(hv.resenia) != '' THEN 1 END) as total_resenias,
        COALESCE(SUM(CASE WHEN LOWER(oc.tipo) = 'pelicula' THEN 115 ELSE 45 END), 0) as total_minutos
      FROM historial_visualizaciones hv
      LEFT JOIN obras_catalogo oc ON hv.obra_id = oc.id OR hv.obra_id = oc.tmdb_id
      WHERE hv.usuario_id = $1 AND ${filtroFecha}
    `;
    const resMetricas = await pool.query(queryMetricas, params);
    const m = resMetricas.rows[0];

    const totalPeliculas = parseInt(m.total_peliculas, 10) || 0;
    const totalEpisodios = parseInt(m.total_episodios, 10) || 0;
    const totalResenias = parseInt(m.total_resenias, 10) || 0;
    const totalMinutos = parseInt(m.total_minutos, 10) || 0;
    const totalObras = totalPeliculas + totalEpisodios;

    if (totalObras === 0) {
      return res.json({ sin_datos: true, anio: parseInt(anio, 10), mes: mes ? parseInt(mes, 10) : null });
    }

    const totalHoras = parseFloat((totalMinutos / 60).toFixed(1));

    // 2. Top Serie
    const querySerie = `
      SELECT oc.id as obra_id, oc.tmdb_id, oc.titulo, oc.poster_path, COUNT(*) as episodios_vistos
      FROM historial_visualizaciones hv
      JOIN obras_catalogo oc ON hv.obra_id = oc.id OR hv.obra_id = oc.tmdb_id
      WHERE hv.usuario_id = $1 AND LOWER(oc.tipo) = 'serie' AND ${filtroFecha}
      GROUP BY oc.id, oc.tmdb_id, oc.titulo, oc.poster_path
      ORDER BY episodios_vistos DESC
      LIMIT 1
    `;
    const resSerie = await pool.query(querySerie, params);
    const topSerie = resSerie.rows[0] ? {
      titulo: resSerie.rows[0].titulo,
      poster_path: resSerie.rows[0].poster_path,
      episodios_vistos: parseInt(resSerie.rows[0].episodios_vistos, 10)
    } : null;

    // 3. Top Película
    const queryPeli = `
      SELECT oc.id as obra_id, oc.tmdb_id, oc.titulo, oc.poster_path, COALESCE(hv.calificacion, 0) as calificacion
      FROM historial_visualizaciones hv
      JOIN obras_catalogo oc ON hv.obra_id = oc.id OR hv.obra_id = oc.tmdb_id
      WHERE hv.usuario_id = $1 AND LOWER(oc.tipo) = 'pelicula' AND ${filtroFecha}
      ORDER BY hv.calificacion DESC, hv.fecha_visto DESC
      LIMIT 1
    `;
    const resPeli = await pool.query(queryPeli, params);
    const topPelicula = resPeli.rows[0] ? {
      titulo: resPeli.rows[0].titulo,
      poster_path: resPeli.rows[0].poster_path
    } : null;

    // 4. ALGORITMO PONDERADO (Capítulo = 1 punto | Película = 2 puntos)
    const queryObrasConCapitulos = `
      SELECT 
        oc.id, 
        oc.tmdb_id, 
        LOWER(oc.tipo) as tipo, 
        oc.titulo, 
        oc.poster_path,
        COUNT(hv.id) as cantidad_vistas
      FROM historial_visualizaciones hv
      JOIN obras_catalogo oc ON hv.obra_id = oc.id OR hv.obra_id = oc.tmdb_id
      WHERE hv.usuario_id = $1 AND ${filtroFecha}
      GROUP BY oc.id, oc.tmdb_id, oc.tipo, oc.titulo, oc.poster_path
    `;
    const resObras = await pool.query(queryObrasConCapitulos, params);
    const obrasVistas = resObras.rows;

    const mapaActores = new Map();
    const mapaActrices = new Map();
    const mapaDirectores = new Map();

    for (const obra of obrasVistas) {
      if (!obra.tmdb_id) continue;
      const { cast, crew, creador } = await obtenerCreditosTMDb(obra.tmdb_id, obra.tipo);
      
      const vistas = parseInt(obra.cantidad_vistas, 10) || 1;
      const puntosObra = obra.tipo === 'pelicula' ? (vistas * 2) : (vistas * 1);

      const obraItem = {
        titulo: obra.titulo,
        poster_path: obra.poster_path,
        tipo: obra.tipo,
        vistas: vistas
      };

      // Top 7 del reparto
      const topCast = cast.slice(0, 7);
      for (const actor of topCast) {
        const id = actor.id;
        const nombre = actor.name;
        const foto = actor.profile_path ? `https://image.tmdb.org/t/p/w500${actor.profile_path}` : null;
        const mapa = actor.gender === 1 ? mapaActrices : mapaActores;

        if (!mapa.has(id)) {
          mapa.set(id, { nombre, foto, puntos: 0, capitulos: 0, peliculas: 0, obras: [] });
        }
        const item = mapa.get(id);
        item.puntos += puntosObra;
        if (obra.tipo === 'serie') item.capitulos += vistas;
        else item.peliculas += vistas;

        if (!item.obras.some(o => o.titulo === obra.titulo)) {
          item.obras.push(obraItem);
        }
      }

      // DETERMINAR DIRECTOR / CREADOR:
      // Si es SERIE, priorizamos al Creador / Showrunner (David Shore en House, David Chase en Sopranos)
      if (obra.tipo === 'serie' && creador) {
        const id = creador.id;
        if (!mapaDirectores.has(id)) {
          mapaDirectores.set(id, {
            nombre: creador.name,
            foto: creador.profile_path ? `https://image.tmdb.org/t/p/w500${creador.profile_path}` : null,
            cargo: 'CREADOR & SHOWRUNNER',
            puntos: 0,
            capitulos: 0,
            peliculas: 0,
            obras: []
          });
        }
        const item = mapaDirectores.get(id);
        item.puntos += puntosObra;
        item.capitulos += vistas;
        if (!item.obras.some(o => o.titulo === obra.titulo)) {
          item.obras.push(obraItem);
        }
      } else {
        // Si es PELÍCULA (o serie sin creador listado), buscamos al Director de cine
        const director = crew.find(c => c.job === 'Director') || crew.find(c => c.department === 'Directing');
        if (director) {
          const id = director.id;
          if (!mapaDirectores.has(id)) {
            mapaDirectores.set(id, {
              nombre: director.name,
              foto: director.profile_path ? `https://image.tmdb.org/t/p/w500${director.profile_path}` : null,
              cargo: obra.tipo === 'pelicula' ? 'DIRECTOR DE CINE' : 'DIRECTOR',
              puntos: 0,
              capitulos: 0,
              peliculas: 0,
              obras: []
            });
          }
          const item = mapaDirectores.get(id);
          item.puntos += puntosObra;
          if (obra.tipo === 'pelicula') item.peliculas += vistas;
          else item.capitulos += vistas;

          if (!item.obras.some(o => o.titulo === obra.titulo)) {
            item.obras.push(obraItem);
          }
        }
      }
    }

    // Ordenar de mayor a menor por PUNTOS ACUMULADOS
    const rankingActores = Array.from(mapaActores.values()).sort((a, b) => b.puntos - a.puntos);
    const rankingActrices = Array.from(mapaActrices.values()).sort((a, b) => b.puntos - a.puntos);
    const rankingDirectores = Array.from(mapaDirectores.values()).sort((a, b) => b.puntos - a.puntos);

    const ganadorActor = rankingActores[0] || null;
    const ganadorActriz = rankingActrices[0] || null;
    const ganadorDirector = rankingDirectores[0] || null;

    // Generador seguro de frases sin posibilidad de "undefined"
    const formatearFrase = (g) => {
      if (!g) return 'Presente en tus mejores momentos';
      if (g.capitulos > 0 && g.peliculas > 0) return `${g.capitulos} episodios y ${g.peliculas} películas en tu pantalla`;
      if (g.capitulos > 0) return `${g.capitulos} episodios acompañándote en tu año`;
      if (g.peliculas > 0) return `${g.peliculas} películas protagonizadas en tu año`;
      return `${g.obras.length || 1} obra destacada en tu historial`;
    };

    // 5. Copiloto de Sillón (Pepito vs Mamá con tabla 'covisualizaciones' y 'usuarios')
    let copiloto = { 
      nombre: 'Lobo Solitario del Cine', 
      veces: 0, 
      foto: null, 
      esSolitario: true, 
      esAmigoTexto: false,
      frase: 'Tus sesiones privadas donde cada plano y cada palomita son 100% para ti.' 
    };
    try {
      const queryCopiloto = `
        SELECT u.nombre as nombre, u.avatar_url as foto, COUNT(*) as veces
        FROM covisualizaciones c
        JOIN usuarios u ON c.amigo_id = u.id
        JOIN historial_visualizaciones hv ON c.visualizacion_id = hv.id
        WHERE hv.usuario_id = $1 AND ${filtroFecha}
        GROUP BY u.nombre, u.avatar_url
        ORDER BY veces DESC
        LIMIT 1
      `;
      const resCopiloto = await pool.query(queryCopiloto, params);

      if (resCopiloto.rows.length > 0) {
        copiloto = {
          nombre: resCopiloto.rows[0].nombre,
          veces: parseInt(resCopiloto.rows[0].veces, 10),
          foto: resCopiloto.rows[0].foto || null,
          esSolitario: false,
          esAmigoTexto: false,
          frase: `${resCopiloto.rows[0].veces} sesiones de sofá compartidas con risas y debates.`
        };
      } else {
        const queryTexto = `
          SELECT TRIM(hv.visto_con_texto) as nombre, COUNT(*) as veces
          FROM historial_visualizaciones hv
          WHERE hv.usuario_id = $1 AND hv.visto_con_texto IS NOT NULL AND TRIM(hv.visto_con_texto) != '' AND ${filtroFecha}
          GROUP BY TRIM(hv.visto_con_texto)
          ORDER BY veces DESC
          LIMIT 1
        `;
        const resTexto = await pool.query(queryTexto, params);
        if (resTexto.rows.length > 0 && resTexto.rows[0].nombre) {
          copiloto = {
            nombre: resTexto.rows[0].nombre,
            veces: parseInt(resTexto.rows[0].veces, 10),
            foto: null,
            esSolitario: false,
            esAmigoTexto: true,
            frase: `${resTexto.rows[0].veces} obras disfrutadas en familia o con amigos en casa.`
          };
        } else {
          copiloto = {
            nombre: 'Lobo Solitario del Cine',
            veces: 0,
            foto: null,
            esSolitario: true,
            esAmigoTexto: false,
            frase: 'Tus sesiones privadas donde cada plano y cada palomita son 100% para ti.'
          };
        }
      }
    } catch (e) {
      console.warn('Error al calcular copiloto:', e.message);
    }

    // 7. Plataforma favorita
    let plataformaFavorita = 'Cine & Streaming';
    try {
      const queryPlat = `
        SELECT hv.plataforma, COUNT(*) as veces
        FROM historial_visualizaciones hv
        WHERE hv.usuario_id = $1 AND hv.plataforma IS NOT NULL AND ${filtroFecha}
        GROUP BY hv.plataforma
        ORDER BY veces DESC
        LIMIT 1
      `;
      const resPlat = await pool.query(queryPlat, params);
      if (resPlat.rows.length > 0 && resPlat.rows[0].plataforma) {
        plataformaFavorita = resPlat.rows[0].plataforma;
      }
    } catch (e) {}

    // 8. 🌟 CÁLCULO REAL DEL DÍA CON MÁS REPRODUCCIONES (DÍA SAGRADO)
    let diaSagrado = 'Domingo';
    try {
      const queryDia = `
        SELECT 
          EXTRACT(DOW FROM hv.fecha_visto) as dia_num,
          COUNT(*) as total_vistos
        FROM historial_visualizaciones hv
        WHERE hv.usuario_id = $1 AND ${filtroFecha}
        GROUP BY dia_num
        ORDER BY total_vistos DESC, dia_num ASC
        LIMIT 1;
      `;
      const resDia = await pool.query(queryDia, params);
      if (resDia.rows.length > 0 && resDia.rows[0].dia_num !== null) {
        const diasSemana = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
        const diaIndex = parseInt(resDia.rows[0].dia_num, 10);
        if (diasSemana[diaIndex]) {
          diaSagrado = diasSemana[diaIndex];
        }
      }
    } catch (e) {
      console.warn('Error al calcular día sagrado:', e.message);
    }

    // 🌟 TODAS LAS SERIES Y PELÍCULAS PARA EL COLLAGE (Deduplicadas estrictamente)
    const queryTodasSeries = `
      SELECT 
        COALESCE(oc.tmdb_id, oc.id) as id,
        oc.tmdb_id, 
        oc.titulo, 
        oc.poster_path, 
        COUNT(DISTINCT hv.id) as episodios_vistos
      FROM historial_visualizaciones hv
      JOIN obras_catalogo oc ON hv.obra_id = oc.id OR hv.obra_id = oc.tmdb_id
      WHERE hv.usuario_id = $1 AND LOWER(oc.tipo) = 'serie' AND ${filtroFecha}
      GROUP BY COALESCE(oc.tmdb_id, oc.id), oc.tmdb_id, oc.titulo, oc.poster_path
      ORDER BY episodios_vistos DESC;
    `;
    const resTodasSeries = await pool.query(queryTodasSeries, params);

    const queryTodasPeliculas = `
      SELECT 
        COALESCE(oc.tmdb_id, oc.id) as id,
        oc.tmdb_id, 
        oc.titulo, 
        oc.poster_path, 
        COUNT(DISTINCT hv.id) as veces_vista
      FROM historial_visualizaciones hv
      JOIN obras_catalogo oc ON hv.obra_id = oc.id OR hv.obra_id = oc.tmdb_id
      WHERE hv.usuario_id = $1 AND LOWER(oc.tipo) = 'pelicula' AND ${filtroFecha}
      GROUP BY COALESCE(oc.tmdb_id, oc.id), oc.tmdb_id, oc.titulo, oc.poster_path
      ORDER BY veces_vista DESC;
    `;
    const resTodasPeliculas = await pool.query(queryTodasPeliculas, params);

    const normalizarP = (p) => p ? (p.startsWith('http') ? p : `https://image.tmdb.org/t/p/w500${p.startsWith('/') ? p : `/${p}`}`) : null;

    const seriesVistas = resTodasSeries.rows.map(r => ({ ...r, poster_path: normalizarP(r.poster_path), tipo: 'serie' }));
    const peliculasVistas = resTodasPeliculas.rows.map(r => ({ ...r, poster_path: normalizarP(r.poster_path), tipo: 'pelicula' }));
    const todasLasObras = [...seriesVistas, ...peliculasVistas];

    // 🌟 6. SISTEMA RICO DE ARQUETIPOS CINEMATOGRÁFICOS BASADO EN GÉNEROS Y TÍTULOS
    const titulosTexto = todasLasObras.map(o => (o.titulo || '').toLowerCase()).join(' ');

    let arquetipo = {
      titulo: 'El Jurado de Cannes',
      lema: 'Analizas cada plano con pasión y devoras historias con auténtico criterio de festival.'
    };

    if (/spider|avenger|batman|superman|marvel|dc|comic|iron man|thor|hulk|guardians|vengadores|deadpool|x-men|wolverine|multiverse|doom|aquaman|flash/.test(titulosTexto)) {
      arquetipo = {
        titulo: 'El Guardián del Multiverso',
        lema: 'Tu año estuvo repleto de capas, superpoderes y batallas épicas por salvar el universo.'
      };
    } else if (/demon|terror|evil|conjuring|saw|miedo|scream|halloween|resident|silent hill|pesadilla|fantasma|witch|sinister|exorcist|creepy|hereditary|nosferatu/.test(titulosTexto)) {
      arquetipo = {
        titulo: 'El Amante de las Pesadillas',
        lema: 'Miras cine de terror a oscuras con luces apagadas y ni pestañeas ante el monstruo.'
      };
    } else if (/dune|star wars|interstellar|alien|matrix|blade runner|avatar|galaxy|space|cosmos|sci-fi|terminator|cyberpunk/.test(titulosTexto)) {
      arquetipo = {
        titulo: 'El Viajero Intergaláctico',
        lema: 'La Tierra te queda chica; tu hábitat natural son las naves cósmicas y los futuros distópicos.'
      };
    } else if (/love|amor|romance|kiss|heart|coraz|boda|wedding|pareja|enamorad|notebook|lalaland|bridgerton|orgullo/.test(titulosTexto)) {
      arquetipo = {
        titulo: 'El Romántico Incorregible',
        lema: 'Lloras con los finales felices, con los desamores y con cualquier historia que te robe el corazón.'
      };
    } else if (/fast|furios|rápido|misi[oó]n|mission|wick|die hard|mad max|bullet|gun|furia|escape|rescate|al límite|gladiator|top gun/.test(titulosTexto)) {
      arquetipo = {
        titulo: 'Adicto a la Adrenalina',
        lema: 'Si no hay explosiones, persecuciones a toda velocidad y tiros, para ti no es cine de verdad.'
      };
    } else if (/sherlock|detective|crime|crimen|asesino|murder|mystery|misterio|knives out|mindhunter|fargo|true detective|thriller|se7en|zodiac/.test(titulosTexto)) {
      arquetipo = {
        titulo: 'Cazador de Misterios & Giros',
        lema: 'Sospechas de todos desde el minuto uno y descifras el culpable antes del clímax final.'
      };
    } else if (/potter|rings|westeros|thrones|drag[oó]n|witcher|narnia|percy|magic|fantas[ií]a|lord of/.test(titulosTexto)) {
      arquetipo = {
        titulo: 'Señor de Reinos Fantásticos',
        lema: 'Espadas ancestrales, hechizos y criaturas legendarias: tu mente vive en otras eras mágicas.'
      };
    } else if (/comedy|comedia|laugh|ted|friends|office|b99|brooklyn|hangover|scary movie|superbad|mario|barbie/.test(titulosTexto)) {
      arquetipo = {
        titulo: 'El Rey de la Risa',
        lema: 'El cine es tu terapia de felicidad: cada maratón debe tener humor, risas y carcajadas garantizadas.'
      };
    } else if (/oppenheimer|napoleon|historia|history|war|guerra|churchill|crown|biopic|drama|padrino|godfather/.test(titulosTexto)) {
      arquetipo = {
        titulo: 'El Historiador Cinéfilo',
        lema: 'Fascinado por los hechos reales, los dramas de época y las obras que marcaron la historia humana.'
      };
    } else if (/shrek|toy story|pixar|disney|monsters|nemo|dragon|mario|spider-verse|minion|anime|ghibli|encanto|coco|ghibli|naruto|one piece/.test(titulosTexto)) {
      arquetipo = {
        titulo: 'El Niño Eterno',
        lema: 'Entiendes que la animación es verdadero arte cinematográfico que emociona a cualquier edad.'
      };
    } else if (totalResenias >= 3) {
      arquetipo = {
        titulo: 'El Crítico de Sillón',
        lema: 'No solo disfrutas cada obra; juzgas cada plano con precisión quirúrgica, estrellas y buen gusto.'
      };
    } else if (totalHoras >= 30) {
      arquetipo = {
        titulo: 'El Maratonista Legendario',
        lema: 'Capaz de devorar trilogías enteras y temporadas completas en un solo fin de semana.'
      };
    } else if (totalPeliculas > 0 && totalPeliculas >= totalEpisodios * 1.3) {
      arquetipo = {
        titulo: 'El Purista del Séptimo Arte',
        lema: 'Para ti la verdadera magia se concentra en dos horas perfectas de pantalla grande y palomitas.'
      };
    } else if (totalEpisodios >= 15) {
      arquetipo = {
        titulo: 'El Devorador de Temporadas',
        lema: 'Para ti un capítulo más nunca fue suficiente; el botón de siguiente episodio es tu mejor amigo.'
      };
    } else if (topSerie && (topSerie.titulo.toLowerCase().includes('house') || topSerie.titulo.toLowerCase().includes('grey'))) {
      arquetipo = {
        titulo: 'Diagnóstico Reservado',
        lema: 'Adicto a las batas blancas, los diagnósticos imposibles y el drama hospitalario.'
      };
    } else if (copiloto && copiloto.veces >= 3) {
      arquetipo = {
        titulo: 'El Anfitrión del Cineclub',
        lema: 'El buen cine se multiplica cuando se comparten palomitas, debates y sillón en compañía.'
      };
    } else if (copiloto && copiloto.esSolitario) {
      arquetipo = {
        titulo: 'El Espectador Supremo',
        lema: 'Disfrutas del cine en su estado más puro: tú, la pantalla y tus obras favoritas sin interrupciones.'
      };
    }

    return res.json({
      sin_datos: false,
      anio: parseInt(anio, 10),
      mes: mes ? parseInt(mes, 10) : null,
      usuario: {
        nombre: req.usuario.nombre || 'Cinéfilo',
        username: req.usuario.username || 'usuario'
      },
      total_horas: totalHoras,
      total_minutos: totalMinutos,
      total_peliculas: totalPeliculas,
      total_episodios: totalEpisodios,
      total_resenias: totalResenias,
      dias_equivalentes: `${(totalHoras / 24).toFixed(1)} días`,
      top_serie: topSerie,
      top_pelicula: topPelicula,
      dia_sagrado: diaSagrado,
      plataforma_favorita: plataformaFavorita,
      actor_fetiche: {
        nombre: ganadorActor ? ganadorActor.nombre : 'Sin actor destacado',
        foto: ganadorActor ? ganadorActor.foto : null,
        dato: formatearFrase(ganadorActor),
        obras_destacadas: ganadorActor ? ganadorActor.obras : []
      },
      actriz_favorita: {
        nombre: ganadorActriz ? ganadorActriz.nombre : 'Sin actriz destacada',
        foto: ganadorActriz ? ganadorActriz.foto : null,
        dato: formatearFrase(ganadorActriz),
        obras_destacadas: ganadorActriz ? ganadorActriz.obras : []
      },
      director_favorito: {
        nombre: ganadorDirector ? ganadorDirector.nombre : 'Sin creador/director destacado',
        foto: ganadorDirector ? ganadorDirector.foto : null,
        cargo: ganadorDirector ? ganadorDirector.cargo : 'CREADOR & DIRECTOR',
        dato: ganadorDirector?.cargo?.includes('CREADOR') 
          ? `Mente maestra y creador de ${ganadorDirector.obras[0]?.titulo || 'tu serie favorita'}` 
          : `${ganadorDirector?.obras?.length || 1} película(s) dirigida(s) en tu año`,
        obras_destacadas: ganadorDirector ? ganadorDirector.obras : []
      },
      copiloto: copiloto,
      arquetipo: arquetipo,
      series_vistas: seriesVistas,
      peliculas_vistas: peliculasVistas,
      todas_las_obras: todasLasObras
    });

  } catch (error) {
    console.error('Error en obtenerWrappedPeriodo:', error);
    res.status(500).json({ error: 'Error interno al calcular el CineRewind Wrapped' });
  }
};

// 🛡️ Proxy para descargar imágenes de TMDb sin error de CORS en html-to-image
const proxyImagen = async (req, res) => {
  let targetUrl = '';
  try {
    let { url } = req.query;
    // Soporte para parámetros en la ruta /api/historial/proxy-image/{*path}
    if (!url && req.params && (req.params.path || req.params[0])) {
      const paramVal = req.params.path || req.params[0];
      const ruta = Array.isArray(paramVal) ? paramVal.join('/') : String(paramVal || '');
      if (ruta.startsWith('http')) {
        url = ruta;
      } else if (ruta.startsWith('t/p/')) {
        url = `https://image.tmdb.org/${ruta}`;
      } else if (ruta.startsWith('/')) {
        url = `https://image.tmdb.org/t/p/w500${ruta}`;
      } else {
        url = `https://image.tmdb.org/t/p/${ruta}`;
      }
    }
    if (!url) return res.status(400).send('Falta URL');

    // Limpia cualquier parámetro residual de cache bust inyectado por librerías (ej: ?_=123 o &_123)
    targetUrl = String(url).trim().replace(/([?&])_=\d+/, '');

    const respuesta = await axios.get(targetUrl, {
      responseType: 'arraybuffer',
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
      }
    });

    const contentType = respuesta.headers['content-type'] || 'image/jpeg';
    res.setHeader('Content-Type', contentType);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', '*');
    res.setHeader('Cache-Control', 'public, max-age=604800, immutable');

    res.send(Buffer.from(respuesta.data));
  } catch (e) {
    console.error('[proxyImagen Error]:', e.message, 'targetUrl:', targetUrl);
    res.status(500).send(`Error al obtener imagen: ${e.message}`);
  }
};


module.exports = {
  registrarVisualizacion,
  obtenerTimeline,
  eliminarVisualizacion,
  obtenerEstadisticasUsuario,
  obtenerRecordsUsuario,
  obtenerCatalogoUsuario,
  registrarLoteVisualizaciones,
  obtenerEpisodiosVistosTemporada,
  actualizarReseniaYCalificacion,
  eliminarLoteVisualizaciones,
  actualizarPlataformaSerie,
  obtenerWrappedPeriodo,
  proxyImagen
};