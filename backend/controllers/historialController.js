// backend/controllers/historialController.js
const pool = require('../config/db');

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
    // 1. Guardar o actualizar la obra en la tabla catálogo local
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

    // 2. Insertar en el historial de visualizaciones
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

    res.status(201).json({
      mensaje: 'Visualización guardada con éxito en PostgreSQL',
      registro: resHistorial.rows[0],
    });
  } catch (error) {
    console.error('Error al registrar en PostgreSQL:', error.message);
    res.status(500).json({ error: 'Error al registrar la visualización' });
  }
};

// GET: Series activas para el carrusel "Viendo Actualmente" (HU-02)
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
      WHERE h.usuario_id = $1 AND o.tipo = 'serie' AND h.temporada IS NOT NULL
      ORDER BY o.id, h.fecha_visto DESC, h.id DESC;
    `;

    const resultado = await pool.query(query, [usuario_id]);
    res.json(resultado.rows);
  } catch (error) {
    console.error('Error al obtener viendo actualmente:', error.message);
    res.status(500).json({ error: 'Error al consultar series en progreso' });
  }
};

// POST: Acción rápida "+1 Capítulo"
const avanzarCapitulo = async (req, res) => {
  const { usuario_id, obra_id, temporada, episodio_actual, plataforma, pais } = req.body;

  if (!usuario_id || !obra_id || temporada === undefined || episodio_actual === undefined) {
    return res.status(400).json({ error: 'Faltan parámetros requeridos' });
  }

  const nuevoEpisodio = parseInt(episodio_actual, 10) + 1;

  try {
    const query = `
      INSERT INTO historial_visualizaciones 
        (usuario_id, obra_id, temporada, episodio, fecha_visto, plataforma, pais)
      VALUES ($1, $2, $3, $4, CURRENT_DATE, $5, $6)
      RETURNING *;
    `;

    const resultado = await pool.query(query, [
      usuario_id,
      obra_id,
      temporada,
      nuevoEpisodio,
      plataforma || null,
      pais || null,
    ]);

    res.status(201).json({
      mensaje: `Capítulo avanzado exitosamente a E${nuevoEpisodio}`,
      registro: resultado.rows[0],
    });
  } catch (error) {
    console.error('Error al avanzar capítulo:', error.message);
    res.status(500).json({ error: 'Error al actualizar el progreso del episodio' });
  }
};

// GET: Timeline vertical con orden cronológico y filtro opcional (?tipo=pelicula|serie) (HU-03)
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
    res.status(500).json({ error: 'Error al consultar el timeline cronológico' });
  }
};

module.exports = {
  registrarVisualizacion,
  obtenerViendoActualmente,
  avanzarCapitulo,
  obtenerTimeline,
};