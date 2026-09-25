const pool = require('../config/db');

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

// Caché global en memoria para no saturar TMDb al calcular hitos (expira en 24 horas)
const cacheHitosTMDB = new Map();

const obtenerInfoSerieHitos = async (tmdbId, temporada, apiKey) => {
  const cacheKey = `${tmdbId}_t${temporada}`;
  const ahora = Date.now();

  if (cacheHitosTMDB.has(cacheKey)) {
    const { data, expira } = cacheHitosTMDB.get(cacheKey);
    if (ahora < expira) return data;
  }

  try {
    // Timeout rápido de 1.5s para que si TMDb está lento, NO congele la app
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1500);

    const [rTemp, rSerie] = await Promise.all([
      fetch(`${TMDB_BASE_URL}/tv/${tmdbId}/season/${temporada}?api_key=${apiKey}&language=es-MX`, { signal: controller.signal }),
      fetch(`${TMDB_BASE_URL}/tv/${tmdbId}?api_key=${apiKey}&language=es-MX`, { signal: controller.signal })
    ]);

    clearTimeout(timeoutId);

    const dTemp = rTemp.ok ? await rTemp.json() : null;
    const dSerie = rSerie.ok ? await rSerie.json() : null;

    const info = {
      totalEpisodios: dTemp?.episodes ? dTemp.episodes.length : null,
      totalTemporadas: dSerie?.number_of_seasons || null,
    };

    cacheHitosTMDB.set(cacheKey, { data: info, expira: ahora + 1000 * 60 * 60 * 24 });
    return info;
  } catch (e) {
    return { totalEpisodios: null, totalTemporadas: null };
  }
};

// Helper para obtener el ID real desde el token JWT o respaldo en body/params
const resolverUsuarioId = (req) => {
  return req.usuario?.id || req.body?.usuario_id || req.params?.usuario_id;
};

// POST: Registrar una película o serie individual
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
        (usuario_id, obra_id, fecha_visto, plataforma, pais, temporada, episodio)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
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
    ]);

    // Actualización con reinicio de ciclo vinculado a la fecha real del registro
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

// GET: Timeline cronológico con cálculo de hitos (optimizado con caché)
// GET: Timeline cronológico directo sin sobrecarga
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
        o.id AS obra_id,
        o.tmdb_id,
        o.tipo,
        o.titulo,
        o.poster_path AS poster_serie,
        o.poster_path AS poster_obra,
        COALESCE(h.foto_episodio, o.poster_path, '') AS poster_path
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
    const registros = resultado.rows;

    const timelineProcesado = registros.map((row) => {
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
        es_final_temporada: row.es_final_temporada || false,
        es_final_serie: false,
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

// POST: Registrar lote de capítulos en masa
const registrarLoteVisualizaciones = async (req, res) => {
  const usuario_id = resolverUsuarioId(req);
  const { tmdb_id, titulo, poster_path, plataforma, temporada, episodios, fecha_visto, fotos_episodios } = req.body;

  if (!usuario_id || !tmdb_id || !titulo || !temporada || !Array.isArray(episodios) || episodios.length === 0) {
    return res.status(400).json({ error: 'Faltan datos requeridos para el registro múltiple' });
  }

  const posterNormalizado = poster_path
    ? (poster_path.startsWith('http') ? poster_path : `https://image.tmdb.org/t/p/w500${poster_path.startsWith('/') ? poster_path : `/${poster_path}`}`)
    : null;

  const tempNum = parseInt(temporada, 10);
  const episodiosNumeros = episodios.map((e) => parseInt(e, 10));

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

      const existe = await pool.query(
        `SELECT id FROM historial_visualizaciones 
         WHERE usuario_id = $1 AND obra_id = $2 AND temporada = $3 AND episodio = $4 AND fecha_visto = $5`,
        [usuario_id, obra_id, tempNum, ep, fecha_visto]
      );

      if (existe.rows.length === 0) {
        await pool.query(
          `INSERT INTO historial_visualizaciones 
             (usuario_id, obra_id, fecha_visto, plataforma, temporada, episodio, foto_episodio)
           VALUES ($1, $2, $3, $4, $5, $6, $7);`,
          [usuario_id, obra_id, fecha_visto, plataforma || null, tempNum, ep, fotoEp]
        );
      }
    }

    const ultimoEpisodio = Math.max(...episodiosNumeros);
    const incluyePrimerCapitulo = tempNum === 1 && episodiosNumeros.includes(1);
    const fechaLote = new Date();

    // Sincronización del lote con fecha_reinicio
    await pool.query(
      `INSERT INTO seguimiento_series (usuario_id, obra_id, activo, fecha_reinicio, actualizado_en)
       VALUES ($1, $2, true, $4, CURRENT_TIMESTAMP)
       ON CONFLICT (usuario_id, obra_id) DO UPDATE SET 
         activo = true,
         fecha_reinicio = CASE 
           WHEN seguimiento_series.activo = false THEN $4
           WHEN $3 = true THEN $4
           ELSE COALESCE(seguimiento_series.fecha_reinicio, $4)
         END,
         actualizado_en = CURRENT_TIMESTAMP;`,
      [usuario_id, obra_id, incluyePrimerCapitulo, fechaLote]
    );

    res.status(201).json({ 
      mensaje: `Se procesaron ${episodios.length} capítulos exitosamente.`,
      ultimo_capitulo: ultimoEpisodio 
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
const actualizarReseniaYCalificacion = async (req, res) => {
  const { id } = req.params;
  const { calificacion, resenia, plataforma } = req.body;
  const usuario_id = resolverUsuarioId(req);

  if (!usuario_id) {
    return res.status(401).json({ error: 'Sesión no válida o usuario no autenticado' });
  }

  const visualizacionIdNum = parseInt(id, 10);
  if (isNaN(visualizacionIdNum)) {
    return res.status(400).json({ error: 'El ID de la visualización debe ser un número válido' });
  }

  try {
    const query = `
      UPDATE historial_visualizaciones
      SET 
        calificacion = COALESCE($1, calificacion),
        resenia = COALESCE($2, resenia),
        plataforma = COALESCE($3, plataforma)
      WHERE id = $4 AND usuario_id = $5
      RETURNING *;
    `;

    const resultado = await pool.query(query, [
      calificacion !== undefined && calificacion !== null && calificacion > 0 ? Number(calificacion) : null,
      resenia !== undefined && resenia !== null && resenia.trim() !== '' ? resenia.trim() : null,
      plataforma !== undefined && plataforma !== null && plataforma.trim() !== '' ? plataforma.trim() : null,
      visualizacionIdNum,
      usuario_id
    ]);

    if (resultado.rowCount === 0) {
      return res.status(404).json({ error: 'Registro no encontrado o no pertenece al usuario' });
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

module.exports = {
  registrarVisualizacion,
  obtenerTimeline,
  eliminarVisualizacion,
  registrarLoteVisualizaciones,
  obtenerEpisodiosVistosTemporada,
  actualizarReseniaYCalificacion,
  eliminarLoteVisualizaciones,
  actualizarPlataformaSerie,
};