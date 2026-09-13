const pool = require('../config/db');
const axios = require('axios');

// POST: Registrar una película o serie vista
const registrarVisualizacion = async (req, res) => {
  const {
    usuario_id,
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

  try {
    // 1. Obtener o registrar la obra en el catálogo local
    const queryObra = `
      INSERT INTO obras_catalogo (tmdb_id, tipo, titulo, poster_path)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (tmdb_id) 
      DO UPDATE SET titulo = EXCLUDED.titulo
      RETURNING id;
    `;
    const resObra = await pool.query(queryObra, [
      tmdb_id,
      tipo.toLowerCase(),
      titulo,
      poster_path || null,
    ]);
    const obra_id = resObra.rows[0].id;

    // 2. Control de duplicados
    if (tipo.toLowerCase() === 'serie') {
      const existeCap = await pool.query(
        `SELECT id FROM historial_visualizaciones 
         WHERE usuario_id = $1 AND obra_id = $2 AND temporada = $3 AND episodio = $4`,
        [usuario_id, obra_id, temporada, episodio]
      );
      if (existeCap.rows.length > 0) {
        return res.status(409).json({ 
          error: `Ya tienes registrado el capítulo ${episodio} de la temporada ${temporada}.` 
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

    // 3. Guardar en el historial
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
      temporada || null,
      episodio || null,
    ]);

    // 4. Si es serie, asegurar que quede activa en seguimiento
    if (tipo.toLowerCase() === 'serie') {
      await pool.query(
        `INSERT INTO seguimiento_series (usuario_id, obra_id, activo)
         VALUES ($1, $2, true)
         ON CONFLICT (usuario_id, obra_id) DO UPDATE SET activo = true;`,
        [usuario_id, obra_id]
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

// GET: Series activas para el carrusel "Viendo Actualmente" (excluye las descartadas sin borrar historial)
const obtenerViendoActualmente = async (req, res) => {
  const { usuario_id } = req.params;

  try {
    const query = `
      SELECT DISTINCT ON (o.id)
        o.id AS obra_id,
        o.tmdb_id,
        o.titulo,
        o.poster_path,
        h.temporada,
        h.episodio,
        h.plataforma,
        h.fecha_visto
      FROM historial_visualizaciones h
      INNER JOIN obras_catalogo o ON h.obra_id = o.id
      LEFT JOIN seguimiento_series s ON s.usuario_id = h.usuario_id AND s.obra_id = o.id
      WHERE h.usuario_id = $1 
        AND o.tipo = 'serie' 
        AND h.temporada IS NOT NULL
        AND (s.activo IS NULL OR s.activo = true)
      ORDER BY o.id, h.fecha_visto DESC, h.id DESC;
    `;

    const resultado = await pool.query(query, [usuario_id]);
    res.json(resultado.rows);
  } catch (error) {
    console.error('Error al obtener viendo actualmente:', error.message);
    res.status(500).json({ error: 'Error al consultar series en progreso' });
  }
};

// POST: Avanzar capítulo verificando límites de temporada con TMDb
const avanzarCapitulo = async (req, res) => {
  const { usuario_id, obra_id, temporada, episodio_actual, plataforma } = req.body;

  if (!usuario_id || !obra_id || !temporada || !episodio_actual) {
    return res.status(400).json({ error: 'Faltan datos requeridos para avanzar' });
  }

  try {
    const obraQuery = await pool.query('SELECT tmdb_id FROM obras_catalogo WHERE id = $1', [obra_id]);
    if (obraQuery.rows.length === 0) {
      return res.status(404).json({ error: 'Obra no encontrada' });
    }
    const tmdbId = obraQuery.rows[0].tmdb_id;

    let nuevaTemporada = parseInt(temporada, 10);
    const epActualNum = parseInt(episodio_actual, 10);
    let nuevoEpisodio = epActualNum + 1;

    try {
      const tmdbRes = await axios.get(
        `https://api.themoviedb.org/3/tv/${tmdbId}?api_key=${process.env.TMDB_API_KEY}&language=es-ES`
      );
      const temporadasInfo = tmdbRes.data.seasons || [];
      const tempActual = temporadasInfo.find((s) => s.season_number === nuevaTemporada);

      // Si el episodio alcanza el total de la temporada, avanza a la siguiente temporada capítulo 1
      if (tempActual && epActualNum >= tempActual.episode_count) {
        const siguienteTempExiste = temporadasInfo.some((s) => s.season_number === nuevaTemporada + 1);
        if (siguienteTempExiste) {
          nuevaTemporada += 1;
          nuevoEpisodio = 1;
        }
      }
    } catch (apiErr) {
      console.warn('No se pudo verificar temporadas con TMDb:', apiErr.message);
    }

    const insertQuery = `
      INSERT INTO historial_visualizaciones 
        (usuario_id, obra_id, fecha_visto, plataforma, temporada, episodio)
      VALUES ($1, $2, CURRENT_DATE, $3, $4, $5)
      RETURNING *;
    `;
    const resultado = await pool.query(insertQuery, [
      usuario_id,
      obra_id,
      plataforma || null,
      nuevaTemporada,
      nuevoEpisodio,
    ]);

    res.status(201).json({
      mensaje: `Avanzado a T${nuevaTemporada} E${nuevoEpisodio}`,
      visualizacion: resultado.rows[0],
    });
  } catch (error) {
    console.error('Error al avanzar capítulo:', error.message);
    res.status(500).json({ error: 'Error al actualizar el capítulo' });
  }
};

// GET: Timeline cronológico con filtro opcional (?tipo=pelicula|serie)
const obtenerTimeline = async (req, res) => {
  const { usuario_id } = req.params;
  const { tipo } = req.query;

  try {
    let query = `
      SELECT 
        h.id AS visualizacion_id,
        h.fecha_visto,
        h.plataforma,
        h.pais,
        h.temporada,
        h.episodio,
        o.id AS obra_id,
        o.tmdb_id,
        o.tipo,
        o.titulo,
        o.poster_path
      FROM historial_visualizaciones h
      INNER JOIN obras_catalogo o ON h.obra_id = o.id
      WHERE h.usuario_id = $1
    `;
    const params = [usuario_id];

    if (tipo && (tipo.toLowerCase() === 'pelicula' || tipo.toLowerCase() === 'serie')) {
      params.push(tipo.toLowerCase());
      query += ` AND o.tipo = $2`;
    }

    query += ` ORDER BY h.fecha_visto DESC, h.id DESC;`;

    const resultado = await pool.query(query, params);
    res.json(resultado.rows);
  } catch (error) {
    console.error('Error al obtener el timeline:', error.message);
    res.status(500).json({ error: 'Error al consultar el timeline' });
  }
};

// DELETE: Eliminar una fila individual del historial por su ID
const eliminarVisualizacion = async (req, res) => {
  const { id } = req.params;
  try {
    const resultado = await pool.query(
      'DELETE FROM historial_visualizaciones WHERE id = $1 RETURNING *;',
      [id]
    );
    if (resultado.rowCount === 0) {
      return res.status(404).json({ error: 'El registro no existe' });
    }
    res.json({ mensaje: 'Visualización eliminada', registro: resultado.rows[0] });
  } catch (error) {
    console.error('Error al eliminar visualización:', error.message);
    res.status(500).json({ error: 'Error al eliminar de la base de datos' });
  }
};

// DELETE / ARCHIVAR: Quita la serie de "Viendo Actualmente" sin borrar nada del historial
const descartarDeViendo = async (req, res) => {
  const { usuario_id, obra_id } = req.params;

  try {
    const query = `
      INSERT INTO seguimiento_series (usuario_id, obra_id, activo)
      VALUES ($1, $2, false)
      ON CONFLICT (usuario_id, obra_id)
      DO UPDATE SET activo = false;
    `;
    await pool.query(query, [usuario_id, obra_id]);

    res.json({ mensaje: 'Serie retirada de Viendo Actualmente. Tu historial permanece intacto.' });
  } catch (error) {
    console.error('Error al descartar serie:', error.message);
    res.status(500).json({ error: 'Error al quitar la serie de seguimiento' });
  }
};

// POST: Registrar lote de capítulos en masa (Batch Insert)
const registrarLoteVisualizaciones = async (req, res) => {
  const { usuario_id, tmdb_id, titulo, poster_path, plataforma, temporada, episodios, fecha_visto } = req.body;

  if (!usuario_id || !tmdb_id || !titulo || !temporada || !Array.isArray(episodios) || episodios.length === 0) {
    return res.status(400).json({ error: 'Faltan datos requeridos para el registro múltiple' });
  }

  try {
    // 1. Asegurar catálogo de la obra
    const queryObra = `
      INSERT INTO obras_catalogo (tmdb_id, tipo, titulo, poster_path)
      VALUES ($1, 'serie', $2, $3)
      ON CONFLICT (tmdb_id) DO UPDATE SET titulo = EXCLUDED.titulo
      RETURNING id;
    `;
    const resObra = await pool.query(queryObra, [tmdb_id, titulo, poster_path || null]);
    const obra_id = resObra.rows[0].id;

    // 2. Insertar cada capítulo ignorando si ya fue registrado previamente (ON CONFLICT DO NOTHING)
    for (const ep of episodios) {
      await pool.query(
        `INSERT INTO historial_visualizaciones 
          (usuario_id, obra_id, fecha_visto, plataforma, temporada, episodio)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT DO NOTHING;`,
        [usuario_id, obra_id, fecha_visto, plataforma || null, temporada, ep]
      );
    }

    // 3. Dejar la serie en seguimiento activo con el último capítulo del lote
    const ultimoEpisodio = Math.max(...episodios);
    await pool.query(
      `INSERT INTO seguimiento_series (usuario_id, obra_id, activo)
       VALUES ($1, $2, true)
       ON CONFLICT (usuario_id, obra_id) DO UPDATE SET activo = true;`,
      [usuario_id, obra_id]
    );

    res.status(201).json({ 
      mensaje: `Se guardaron ${episodios.length} capítulos exitosamente.`,
      ultimo_capitulo: ultimoEpisodio 
    });
  } catch (error) {
    console.error('Error al registrar lote de episodios:', error.message);
    res.status(500).json({ error: 'Error al registrar capítulos múltiples' });
  }
};

// GET: Obtener los números de episodios ya vistos de una temporada para un usuario
const obtenerEpisodiosVistosTemporada = async (req, res) => {
  const { usuario_id, tmdb_id, temporada } = req.params;

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

module.exports = {
  registrarVisualizacion,
  obtenerViendoActualmente,
  avanzarCapitulo,
  descartarDeViendo,
  obtenerTimeline,
  eliminarVisualizacion,
  registrarLoteVisualizaciones,
  obtenerEpisodiosVistosTemporada,
};