const pool = require('../config/db');
const axios = require('axios');
const { calcularWrapped } = require('../services/wrappedService');
const { esUrlImagenPermitida } = require('../utils/seguridad');

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
    calificacion,
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

    const tempNum = temporada !== undefined && temporada !== null && !isNaN(parseInt(temporada, 10)) ? parseInt(temporada, 10) : null;
    const epNum = episodio !== undefined && episodio !== null && !isNaN(parseInt(episodio, 10)) ? parseInt(episodio, 10) : null;

    if (tipo.toLowerCase() === 'serie') {
      if (tempNum !== null && epNum !== null) {
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
        const existeSerieSinCap = await pool.query(
          `SELECT id FROM historial_visualizaciones 
           WHERE usuario_id = $1 AND obra_id = $2 AND temporada IS NULL AND episodio IS NULL AND fecha_visto = $3`,
          [usuario_id, obra_id, fecha_visto]
        );
        if (existeSerieSinCap.rows.length > 0) {
          return res.status(409).json({ 
            error: 'Esta serie ya fue registrada en esa fecha.' 
          });
        }
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

    const califNum = calificacion !== undefined && calificacion !== null && Number(calificacion) > 0 ? Number(calificacion) : null;

    const queryHistorial = `
      INSERT INTO historial_visualizaciones 
        (usuario_id, obra_id, fecha_visto, plataforma, pais, temporada, episodio, es_final_temporada, visto_con_texto, calificacion)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
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
      visto_con_texto ? String(visto_con_texto).trim() : null,
      califNum
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

    if (tipo.toLowerCase() === 'serie' && tempNum !== null && epNum !== null) {
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
  const { calificacion, resenia, plataforma, amigos_etiquetados, visto_con_texto, fecha_visto } = req.body;
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
    if (fecha_visto !== undefined && fecha_visto) {
      const fechaLimpia = String(fecha_visto).split('T')[0];
      campos.push(`fecha_visto = $${idx++}`);
      valores.push(fechaLimpia);
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
// 12. CINEREWIND WRAPPED (DELEGADO A WRAPPEDSERVICE)
// ========================================================
const obtenerWrappedPeriodo = async (req, res) => {
  try {
    const usuario_id = req.usuario?.id;
    const { anio, mes } = req.query;

    if (!usuario_id) {
      return res.status(401).json({ error: 'Acceso no autorizado' });
    }

    if (!anio) {
      return res.status(400).json({ error: 'El parámetro anio es obligatorio' });
    }

    const resultado = await calcularWrapped(usuario_id, anio, mes);
    return res.json(resultado);
  } catch (error) {
    console.error('Error en obtenerWrappedPeriodo:', error);
    return res.status(500).json({ error: 'Error interno al calcular el CineRewind Wrapped' });
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

    // 🛡️ Anti-SSRF: Valida que la URL provenga de un dominio multimedia de confianza
    if (!esUrlImagenPermitida(targetUrl)) {
      return res.status(403).send('Dominio de imagen bloqueado por política de seguridad (Anti-SSRF)');
    }

    const respuesta = await axios.get(targetUrl, {
      responseType: 'arraybuffer',
      timeout: 8000,
      maxContentLength: 10 * 1024 * 1024,
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

// ========================================================
// 13. CALIFICACIONES Y RESEÑAS DE TEMPORADAS Y SERIES COMPLETAS
// ========================================================
const guardarCalificacionSerieTemporada = async (req, res) => {
  const usuario_id = req.usuario?.id;
  if (!usuario_id) {
    return res.status(401).json({ error: 'Debes iniciar sesión para calificar.' });
  }

  const {
    tmdb_id,
    titulo,
    poster_path,
    temporada,
    calificacion,
    resenia
  } = req.body;

  if (!tmdb_id) {
    return res.status(400).json({ error: 'Falta el tmdb_id de la serie.' });
  }

  const tempNum = (temporada !== undefined && temporada !== null && !isNaN(parseInt(temporada, 10)) && parseInt(temporada, 10) > 0)
    ? parseInt(temporada, 10)
    : null;

  const califNum = (calificacion !== undefined && calificacion !== null) ? parseFloat(calificacion) : null;

  try {
    // 1. Asegurar registro en obras_catalogo
    const posterNormalizado = poster_path
      ? (poster_path.startsWith('http') ? poster_path : `https://image.tmdb.org/t/p/w500${poster_path.startsWith('/') ? poster_path : `/${poster_path}`}`)
      : null;

    const resObra = await pool.query(`
      INSERT INTO obras_catalogo (tmdb_id, tipo, titulo, poster_path)
      VALUES ($1, 'serie', $2, $3)
      ON CONFLICT (tmdb_id) DO UPDATE SET 
        titulo = COALESCE(EXCLUDED.titulo, obras_catalogo.titulo),
        poster_path = COALESCE(EXCLUDED.poster_path, obras_catalogo.poster_path)
      RETURNING id;
    `, [tmdb_id, titulo || 'Serie', posterNormalizado]);

    const obra_id = resObra.rows[0].id;

    // Si la calificación es nula o 0 y no hay reseña, eliminarla
    if ((!califNum || califNum <= 0) && (!resenia || !resenia.trim())) {
      if (tempNum !== null) {
        await pool.query(
          `DELETE FROM calificaciones_series WHERE usuario_id = $1 AND obra_id = $2 AND temporada = $3`,
          [usuario_id, obra_id, tempNum]
        );
      } else {
        await pool.query(
          `DELETE FROM calificaciones_series WHERE usuario_id = $1 AND obra_id = $2 AND temporada IS NULL`,
          [usuario_id, obra_id]
        );
      }
      return res.json({ mensaje: 'Calificación eliminada exitosamente', calificacion: null, resenia: null });
    }

    // 2. Upsert en calificaciones_series
    let resultado;
    if (tempNum !== null) {
      resultado = await pool.query(`
        INSERT INTO calificaciones_series (usuario_id, obra_id, temporada, calificacion, resenia, fecha_calificado)
        VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
        ON CONFLICT (usuario_id, obra_id, temporada) WHERE temporada IS NOT NULL
        DO UPDATE SET 
          calificacion = EXCLUDED.calificacion,
          resenia = EXCLUDED.resenia,
          fecha_calificado = CURRENT_TIMESTAMP
        RETURNING *;
      `, [usuario_id, obra_id, tempNum, califNum, resenia?.trim() || null]);
    } else {
      resultado = await pool.query(`
        INSERT INTO calificaciones_series (usuario_id, obra_id, temporada, calificacion, resenia, fecha_calificado)
        VALUES ($1, $2, NULL, $3, $4, CURRENT_TIMESTAMP)
        ON CONFLICT (usuario_id, obra_id) WHERE temporada IS NULL
        DO UPDATE SET 
          calificacion = EXCLUDED.calificacion,
          resenia = EXCLUDED.resenia,
          fecha_calificado = CURRENT_TIMESTAMP
        RETURNING *;
      `, [usuario_id, obra_id, califNum, resenia?.trim() || null]);
    }

    return res.json({
      mensaje: tempNum ? `Temporada ${tempNum} calificada exitosamente` : 'Serie calificada exitosamente',
      calificacion: resultado.rows[0]
    });
  } catch (err) {
    console.error('Error al guardar calificación de serie/temporada:', err);
    return res.status(500).json({ error: 'Error interno al guardar la calificación.' });
  }
};

const obtenerCalificacionesSerie = async (req, res) => {
  const { tmdb_id } = req.params;
  const usuario_id = req.query.usuario_id || req.usuario?.id;

  if (!tmdb_id) {
    return res.status(400).json({ error: 'Falta tmdb_id' });
  }
  if (!usuario_id) {
    return res.status(401).json({ error: 'Usuario no identificado' });
  }

  try {
    const resCalif = await pool.query(`
      SELECT 
        cs.id,
        cs.temporada,
        cs.calificacion,
        cs.resenia,
        cs.fecha_calificado
      FROM calificaciones_series cs
      INNER JOIN obras_catalogo o ON cs.obra_id = o.id
      WHERE o.tmdb_id = $1 AND cs.usuario_id = $2
      ORDER BY cs.temporada ASC NULLS FIRST;
    `, [parseInt(tmdb_id, 10), usuario_id]);

    let serie = null;
    const temporadas = {};

    resCalif.rows.forEach((row) => {
      if (row.temporada === null) {
        serie = row;
      } else {
        temporadas[row.temporada] = row;
      }
    });

    return res.json({ serie, temporadas });
  } catch (err) {
    console.error('Error al obtener calificaciones de serie:', err);
    return res.status(500).json({ error: 'Error interno al consultar calificaciones.' });
  }
};

const obtenerCalificacionesSeriesUsuario = async (req, res) => {
  const usuario_id = req.params.usuario_id || req.usuario?.id;
  if (!usuario_id) {
    return res.status(400).json({ error: 'ID de usuario requerido' });
  }

  try {
    const resCalif = await pool.query(`
      SELECT 
        cs.id,
        cs.id AS visualizacion_id,
        cs.temporada,
        cs.calificacion,
        cs.resenia,
        cs.fecha_calificado,
        cs.fecha_calificado AS fecha_visto,
        o.id AS obra_id,
        o.tmdb_id,
        o.tipo,
        o.titulo,
        o.poster_path,
        CASE WHEN cs.temporada IS NULL THEN true ELSE false END AS es_serie_completa,
        CASE WHEN cs.temporada IS NOT NULL THEN true ELSE false END AS es_temporada
      FROM calificaciones_series cs
      INNER JOIN obras_catalogo o ON cs.obra_id = o.id
      WHERE cs.usuario_id = $1
      ORDER BY cs.fecha_calificado DESC;
    `, [usuario_id]);

    return res.json(resCalif.rows);
  } catch (err) {
    console.error('Error al obtener calificaciones de series de usuario:', err);
    return res.status(500).json({ error: 'Error interno al consultar calificaciones del usuario.' });
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
  proxyImagen,
  guardarCalificacionSerieTemporada,
  obtenerCalificacionesSerie,
  obtenerCalificacionesSeriesUsuario
};