const pool = require('../config/db');

// Helper para obtener el ID real desde el token JWT o respaldo en body/params
const resolverUsuarioId = (req) => {
  return req.usuario?.id || req.body?.usuario_id || req.params?.usuario_id;
};

// POST: Registrar una película o serie individual (con soporte para Co-visualización)
const registrarVisualizacion = async (req, res) => {
  const usuario_id = resolverUsuarioId(req);
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
    amigos_etiquetados, // <-- Array de IDs de amigos: [2, 5]
    visto_con_texto,
  } = req.body;

  if (!usuario_id || !tmdb_id || !tipo || !titulo || !fecha_visto) {
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
      visto_con_texto || null
    ]);

    const visualizacionId = resHistorial.rows[0].id;

    // HU-10: Guardar invitaciones de co-visualización pendientes
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

// GET: Timeline cronológico con soporte de "Visto con..."
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
        -- Subconsulta para traer los amigos etiquetados
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

// DELETE: Eliminar una fila individual
const eliminarVisualizacion = async (req, res) => {
  const { id } = req.params;
  const usuario_id = req.usuario?.id;

  try {
    const query = usuario_id
      ? 'DELETE FROM historial_visualizaciones WHERE id = $1 AND usuario_id = $2 RETURNING *;'
      : 'DELETE FROM historial_visualizaciones WHERE id = $1 RETURNING *;';
    const params = usuario_id ? [id, usuario_id] : [id];

    const resultado = await pool.query(query, params);

    if (resultado.rowCount === 0) {
      return res.status(404).json({ error: 'El registro no existe o no tienes permiso para eliminarlo' });
    }
    res.json({ mensaje: 'Visualización eliminada', registro: resultado.rows[0] });
  } catch (error) {
    console.error('Error al eliminar visualización:', error.message);
    res.status(500).json({ error: 'Error al eliminar de la base de datos' });
  }
};

// POST: Registrar lote de capítulos con etiquetado de amigos
const registrarLoteVisualizaciones = async (req, res) => {
  const usuario_id = resolverUsuarioId(req);
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
    amigos_etiquetados, // <-- Array de IDs de amigos
    visto_con_texto,    // <-- Acompañantes manuales sin cuenta ("Mamá", "Hermana")
  } = req.body;

  if (!usuario_id || !tmdb_id || !titulo || !temporada || !Array.isArray(episodios) || episodios.length === 0) {
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
            visto_con_texto ? String(visto_con_texto).trim() : null // <-- $9
          ]
        );
        visualizacionId = insercion.rows[0].id;
      } else {
        visualizacionId = existe.rows[0].id;
      }

      // HU-10: Asignar amigos a cada capítulo procesado
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

// GET: Obtener capítulos ya vistos de una temporada
const obtenerEpisodiosVistosTemporada = async (req, res) => {
  const usuario_id = req.params.usuario_id || req.usuario?.id;
  const { tmdb_id, temporada } = req.params;

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

// PATCH: Guardar o actualizar reseña y puntuación
// PATCH: Guardar o actualizar reseña, calificación, plataforma y co-visualizaciones
const actualizarReseniaYCalificacion = async (req, res) => {
  const { id } = req.params;
  const { calificacion, resenia, plataforma, amigos_etiquetados,visto_con_texto } = req.body;
  const usuario_id = resolverUsuarioId(req);

  if (!usuario_id) {
    return res.status(401).json({ error: 'Sesión no válida o usuario no autenticado' });
  }

  const visualizacionIdNum = parseInt(id, 10);
  if (isNaN(visualizacionIdNum)) {
    return res.status(400).json({ error: 'El ID de la visualización debe ser un número válido' });
  }

  try {
    // 1. Actualizar datos propios de la visualización
    const query = `
      UPDATE historial_visualizaciones
      SET 
        calificacion = COALESCE($1, calificacion),
        resenia = COALESCE($2, resenia),
        plataforma = COALESCE($3, plataforma)
        visto_con_texto = $4
      WHERE id = $5 AND usuario_id = $6
      RETURNING *;
    `;

    const resultado = await pool.query(query, [
      calificacion !== undefined && calificacion !== null && calificacion > 0 ? Number(calificacion) : null,
      resenia !== undefined && resenia !== null && resenia.trim() !== '' ? resenia.trim() : null,
      plataforma !== undefined && plataforma !== null && plataforma.trim() !== '' ? plataforma.trim() : null,
      visto_con_texto !== undefined ? (visto_con_texto ? String(visto_con_texto).trim() : null) : null,
      visualizacionIdNum,
      usuario_id
    ]);

    if (resultado.rowCount === 0) {
      return res.status(404).json({ error: 'Registro no encontrado o no pertenece al usuario' });
    }

    // 2. Sincronizar amigos en covisualizaciones si se pasaron en el cuerpo
    if (Array.isArray(amigos_etiquetados)) {
      // Amigos que ya estaban asignados a esta visualización
      const actualesRes = await pool.query(
        'SELECT amigo_id FROM covisualizaciones WHERE visualizacion_id = $1',
        [visualizacionIdNum]
      );
      const actualesIds = actualesRes.rows.map((r) => r.amigo_id);
      const nuevosIds = amigos_etiquetados.map((id) => Number(id)).filter((id) => id && id !== usuario_id);

      // Eliminar amigos desmarcados
      const paraEliminar = actualesIds.filter((id) => !nuevosIds.includes(id));
      if (paraEliminar.length > 0) {
        await pool.query(
          'DELETE FROM covisualizaciones WHERE visualizacion_id = $1 AND amigo_id = ANY($2::int[])',
          [visualizacionIdNum, paraEliminar]
        );
      }

      // Insertar nuevos amigos etiquetados en estado 'pendiente'
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

// DELETE: Eliminar lote
const eliminarLoteVisualizaciones = async (req, res) => {
  const { ids } = req.body;
  const usuario_id = req.usuario?.id;

  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: 'Debes enviar un arreglo de IDs a eliminar' });
  }

  try {
    const query = usuario_id
      ? 'DELETE FROM historial_visualizaciones WHERE id = ANY($1::int[]) AND usuario_id = $2 RETURNING id;'
      : 'DELETE FROM historial_visualizaciones WHERE id = ANY($1::int[]) RETURNING id;';
    const params = usuario_id ? [ids, usuario_id] : [ids];

    const resultado = await pool.query(query, params);

    res.json({
      mensaje: `Se eliminaron ${resultado.rowCount} registros correctamente`,
      eliminados: resultado.rows.map((r) => r.id),
    });
  } catch (error) {
    console.error('Error al eliminar lote de visualizaciones:', error.message);
    res.status(500).json({ error: 'Error interno al eliminar registros en lote' });
  }
};

// PATCH: Actualizar plataforma masivamente para una serie
const actualizarPlataformaSerie = async (req, res) => {
  const usuario_id = resolverUsuarioId(req);
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

// GET: /api/historial/catalogo-usuario?tipo=serie
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

// GET: /api/historial/estadisticas
const obtenerEstadisticasUsuario = async (req, res) => {
  const usuarioId = req.usuario?.id;
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

// GET: /api/historial/records
const obtenerRecordsUsuario = async (req, res) => {
  const usuarioId = req.usuario?.id;
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
// HU-13: Wrapped Anual / Mensual con Elenco Real de TMDb y Diagnóstico de IA
const obtenerWrappedPeriodo = async (req, res) => {
  try {
    const usuarioId = req.usuario?.id;
    if (!usuarioId) {
      return res.status(401).json({ error: 'Sesión no autorizada' });
    }

    const { anio, mes } = req.query;
    if (!anio) {
      return res.status(400).json({ error: 'El parámetro anio es obligatorio' });
    }

    const anioNum = parseInt(anio, 10);
    const mesNum = mes ? parseInt(mes, 10) : null;

    let fechaInicio, fechaFin;
    if (mesNum !== null && mesNum >= 1 && mesNum <= 12) {
      const mesStr = String(mesNum).padStart(2, '0');
      fechaInicio = `${anioNum}-${mesStr}-01`;
      const ultimoDia = new Date(anioNum, mesNum, 0).getDate();
      fechaFin = `${anioNum}-${mesStr}-${ultimoDia} 23:59:59`;
    } else {
      fechaInicio = `${anioNum}-01-01`;
      fechaFin = `${anioNum}-12-31 23:59:59`;
    }

    // 1. Conteo de horas y obras
    const queryTotales = `
      SELECT 
        COUNT(CASE WHEN LOWER(o.tipo) = 'pelicula' THEN 1 END) AS total_peliculas,
        COUNT(CASE WHEN LOWER(o.tipo) = 'serie' THEN 1 END) AS total_episodios,
        COUNT(DISTINCT DATE(h.fecha_visto)) AS dias_activos
      FROM historial_visualizaciones h
      JOIN obras_catalogo o ON h.obra_id = o.id
      WHERE h.usuario_id = $1 
        AND h.fecha_visto >= $2 
        AND h.fecha_visto <= $3;
    `;
    const resTotales = await pool.query(queryTotales, [usuarioId, fechaInicio, fechaFin]);
    const resumen = resTotales.rows[0] || {};
    
    const peliculas = parseInt(resumen.total_peliculas, 10) || 0;
    const episodios = parseInt(resumen.total_episodios, 10) || 0;
    const minutosTotales = (peliculas * 100) + (episodios * 45);
    const horasTotales = Math.round((minutosTotales / 60) * 10) / 10;

    const formatearPoster = (path) => {
      if (!path) return null;
      return path.startsWith('http') ? path : `https://image.tmdb.org/t/p/w500${path.startsWith('/') ? path : `/${path}`}`;
    };

    // 2. Top Serie
    const queryTopSerie = `
      SELECT o.id, o.tmdb_id, o.titulo, o.poster_path, COUNT(h.id) AS episodios_vistos
      FROM historial_visualizaciones h
      JOIN obras_catalogo o ON h.obra_id = o.id
      WHERE h.usuario_id = $1 
        AND LOWER(o.tipo) = 'serie'
        AND h.fecha_visto >= $2 AND h.fecha_visto <= $3
      GROUP BY o.id, o.tmdb_id, o.titulo, o.poster_path
      ORDER BY episodios_vistos DESC, MAX(h.fecha_visto) DESC
      LIMIT 1;
    `;
    const resTopSerie = await pool.query(queryTopSerie, [usuarioId, fechaInicio, fechaFin]);
    const topSerie = resTopSerie.rows[0]
      ? { ...resTopSerie.rows[0], poster_path: formatearPoster(resTopSerie.rows[0].poster_path) }
      : null;

    // 3. Top Película
    const queryTopPeli = `
      SELECT o.id, o.tmdb_id, o.titulo, o.poster_path, COUNT(h.id) AS veces_vista
      FROM historial_visualizaciones h
      JOIN obras_catalogo o ON h.obra_id = o.id
      WHERE h.usuario_id = $1 
        AND LOWER(o.tipo) = 'pelicula'
        AND h.fecha_visto >= $2 AND h.fecha_visto <= $3
      GROUP BY o.id, o.tmdb_id, o.titulo, o.poster_path
      ORDER BY veces_vista DESC, MAX(h.fecha_visto) DESC
      LIMIT 1;
    `;
    const resTopPeli = await pool.query(queryTopPeli, [usuarioId, fechaInicio, fechaFin]);
    const topPelicula = resTopPeli.rows[0]
      ? { ...resTopPeli.rows[0], poster_path: formatearPoster(resTopPeli.rows[0].poster_path) }
      : null;

    // 4. Plataforma y día
    const resPlataforma = await pool.query(`
      SELECT h.plataforma, COUNT(h.id) AS cantidad
      FROM historial_visualizaciones h
      WHERE h.usuario_id = $1 AND h.plataforma IS NOT NULL AND TRIM(h.plataforma) <> ''
        AND h.fecha_visto >= $2 AND h.fecha_visto <= $3
      GROUP BY h.plataforma ORDER BY cantidad DESC LIMIT 1;
    `, [usuarioId, fechaInicio, fechaFin]);

    const resDiaSemana = await pool.query(`
      SELECT EXTRACT(DOW FROM h.fecha_visto)::INT AS dia_numero, COUNT(h.id) AS total_vistos
      FROM historial_visualizaciones h
      WHERE h.usuario_id = $1 AND h.fecha_visto >= $2 AND h.fecha_visto <= $3
      GROUP BY dia_numero ORDER BY total_vistos DESC LIMIT 1;
    `, [usuarioId, fechaInicio, fechaFin]);
    const diasNombres = ['Domingos', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábados'];
    const diaTop = resDiaSemana.rows[0] ? diasNombres[resDiaSemana.rows[0].dia_numero] : null;

    // 5. OBTENER AÑOS REALES QUE TIENEN HISTORIAL (Para el selector dinámico)
    const resAnios = await pool.query(`
      SELECT DISTINCT EXTRACT(YEAR FROM fecha_visto)::INT AS anio
      FROM historial_visualizaciones
      WHERE usuario_id = $1
      ORDER BY anio DESC;
    `, [usuarioId]);
    const aniosDisponibles = resAnios.rows.map((r) => r.anio);

    // 6. BUSCAR EL ACTOR Y DIRECTOR REAL EN TMDB (Para que nunca más invente nombres)
    let actorReal = null;
    let directorReal = null;
    const apiKeyTMDB = process.env.TMDB_API_KEY;

    // Buscamos el protagonista de la serie reina o la película reina en TMDb
    const obraParaCreditos = topSerie || topPelicula;
    if (obraParaCreditos && obraParaCreditos.tmdb_id && apiKeyTMDB) {
      try {
        const tipoEndpoint = topSerie ? 'tv' : 'movie';
        const tmdbUrl = `https://api.themoviedb.org/3/${tipoEndpoint}/${obraParaCreditos.tmdb_id}/credits?api_key=${apiKeyTMDB}&language=es-ES`;
        const resCreditos = await fetch(tmdbUrl);
        if (resCreditos.ok) {
          const dataCreditos = await resCreditos.json();
          // Actor principal (Top 1 del cast)
          if (dataCreditos.cast && dataCreditos.cast.length > 0) {
            const p = dataCreditos.cast[0];
            actorReal = {
              nombre: p.name,
              personaje: p.character || 'Protagonista',
              foto: p.profile_path ? `https://image.tmdb.org/t/p/w185${p.profile_path}` : null,
              obra: obraParaCreditos.titulo
            };
          }
          // Director / Creador
          const dir = dataCreditos.crew?.find((c) => c.job === 'Director' || c.job === 'Executive Producer');
          if (dir) {
            directorReal = {
              nombre: dir.name,
              rol: dir.job === 'Director' ? 'Dirección' : 'Creador / Showrunner',
              obra: obraParaCreditos.titulo
            };
          }
        }
      } catch (errTMDB) {
        console.warn('No se pudieron obtener créditos de TMDb:', errTMDB.message);
      }
    }

    // 7. CONSULTAR A GEMINI PARA EL VEREDICTO CINÉFILO REAL
    let veredictoIA = null;
    const geminiKey = process.env.GEMINI_API_KEY;

    if (geminiKey) {
      try {
        const resumen = `
          El usuario consumió en el año/período ${anioNum}:
          - Horas de pantalla: ${horasTotales}h
          - Capítulos de series: ${episodios}
          - Películas: ${peliculas}
          - Serie más vista: ${topSerie ? topSerie.titulo : 'Ninguna'}
          - Película más vista: ${topPelicula ? topPelicula.titulo : 'Ninguna'}
          - Actor estrella: ${actorReal ? actorReal.nombre : 'No especificado'}
          - Día de preferencia: ${diaTop || 'Cualquiera'}
        `;

        const prompt = `
          Eres un crítico de cine prestigioso, mordaz y con un humor sofisticado de festival internacional (estilo Letterboxd / premios Oscar).
          Evalúa el siguiente historial:
          ${resumen}

          Genera un diagnóstico en formato JSON puro (sin etiquetas markdown ni texto extra):
          {
            "arquetipo": "Un título honorífico o satírico sobre sus hábitos (ej: 'El Maratonista Sombrío', 'Devorador Compulsivo de Ficción')",
            "discurso": "Una crítica breve de 2 oraciones, divertida y personalizada según los títulos específicos que vio.",
            "fraseCierre": "Un lema cinéfilo memorable para compartir"
          }
        `;

        const geminiRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: { responseMimeType: 'application/json' }
            }),
          }
        );

        if (geminiRes.ok) {
          const geminiData = await geminiRes.json();
          const rawText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
          if (rawText) veredictoIA = JSON.parse(rawText);
        } else {
          const errBody = await geminiRes.text();
          console.error('Error devuelto por la API de Gemini:', geminiRes.status, errBody);
        }
      } catch (errIA) {
        console.error('Fallo en la llamada a Gemini:', errIA.message);
      }
    }

    // Respaldo de seguridad solo si no hay internet o clave
    if (!veredictoIA) {
      veredictoIA = {
        arquetipo: horasTotales > 40 ? 'Espectador Obsesivo' : 'Cinéfilo Selecto',
        discurso: `Dedicaste ${horasTotales} horas de tu vida frente a la pantalla con ${topSerie?.titulo || 'grandes historias'}. Tu sillón ya tiene la marca de tu silueta grabada.`,
        fraseCierre: 'El cine no se mira, se devora.'
      };
    }

    res.json({
      periodo: { anio: anioNum, mes: mesNum, esAnual: mesNum === null },
      metricas: {
        totalPeliculas: peliculas,
        totalEpisodios: episodios,
        horasTotales,
        minutosTotales,
        diasActivos: parseInt(resumen.dias_activos, 10) || 0,
      },
      topPelicula,
      topSerie,
      actorReal,
      directorReal,
      plataformaTop: resPlataforma.rows[0] || null,
      diaTop,
      aniosDisponibles,
      veredictoIA,
    });
  } catch (error) {
    console.error('Error al generar wrapped del periodo:', error.message);
    res.status(500).json({ error: 'Error del servidor al calcular estadísticas del período' });
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
};