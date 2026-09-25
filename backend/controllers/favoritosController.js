const pool = require('../config/db');

// GET: /api/favoritos/:username (Obtener el Top 4 de un usuario)
const obtenerFavoritosPorUsername = async (req, res) => {
  const { username } = req.params;

  try {
    const usuarioRes = await pool.query(
      'SELECT id FROM usuarios WHERE LOWER(username) = LOWER($1)',
      [username.trim()]
    );

    if (usuarioRes.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const usuarioId = usuarioRes.rows[0].id;

    const consulta = `
      SELECT 
        f.posicion,
        c.tmdb_id,
        c.tipo,
        c.titulo,
        c.poster_path
      FROM favoritos_top4 f
      INNER JOIN obras_catalogo c ON f.obra_id = c.id
      WHERE f.usuario_id = $1
      ORDER BY f.posicion ASC;
    `;

    const resultado = await pool.query(consulta, [usuarioId]);
    res.json(resultado.rows);
  } catch (error) {
    console.error('Error al obtener favoritos:', error.message);
    res.status(500).json({ error: 'Error del servidor al obtener favoritos' });
  }
};

// POST: /api/favoritos (Guardar o actualizar una posición del 1 al 4)
const guardarFavorito = async (req, res) => {
  const usuarioId = req.usuario?.id;
  const { posicion, tmdb_id, tipo, titulo, poster_path } = req.body;

  if (!usuarioId) {
    return res.status(401).json({ error: 'Sesión no autorizada' });
  }

  if (!posicion || posicion < 1 || posicion > 4) {
    return res.status(400).json({ error: 'La posición debe estar entre 1 y 4' });
  }

  if (!tmdb_id || !tipo || !titulo) {
    return res.status(400).json({ error: 'Datos de la obra incompletos' });
  }

  try {
    // 1. Asegurar la obra en obras_catalogo
    const obraQuery = `
      INSERT INTO obras_catalogo (tmdb_id, tipo, titulo, poster_path)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (tmdb_id) 
      DO UPDATE SET 
        titulo = EXCLUDED.titulo,
        poster_path = COALESCE(EXCLUDED.poster_path, obras_catalogo.poster_path)
      RETURNING id;
    `;
    const obraRes = await pool.query(obraQuery, [
      tmdb_id,
      tipo,
      titulo.trim(),
      poster_path || null
    ]);
    const obraId = obraRes.rows[0].id;

    // 2. Guardar o reemplazar en favoritos_top4 en esa posicion
    const favQuery = `
      INSERT INTO favoritos_top4 (usuario_id, posicion, obra_id)
      VALUES ($1, $2, $3)
      ON CONFLICT (usuario_id, posicion)
      DO UPDATE SET obra_id = EXCLUDED.obra_id
      RETURNING posicion, obra_id;
    `;
    await pool.query(favQuery, [usuarioId, posicion, obraId]);

    res.json({
      mensaje: 'Favorito guardado correctamente',
      favorito: { posicion, tmdb_id, tipo, titulo, poster_path }
    });
  } catch (error) {
    console.error('Error al guardar favorito:', error.message);
    res.status(500).json({ error: 'Error del servidor al guardar favorito' });
  }
};

// DELETE: /api/favoritos/:posicion (Quitar una obra de una ranura)
const eliminarFavorito = async (req, res) => {
  const usuarioId = req.usuario?.id;
  const { posicion } = req.params;

  if (!usuarioId) {
    return res.status(401).json({ error: 'Sesión no autorizada' });
  }

  try {
    await pool.query(
      'DELETE FROM favoritos_top4 WHERE usuario_id = $1 AND posicion = $2',
      [usuarioId, posicion]
    );

    res.json({ mensaje: 'Favorito eliminado con éxito' });
  } catch (error) {
    console.error('Error al eliminar favorito:', error.message);
    res.status(500).json({ error: 'Error del servidor al eliminar favorito' });
  }
};

module.exports = {
  obtenerFavoritosPorUsername,
  guardarFavorito,
  eliminarFavorito,
};