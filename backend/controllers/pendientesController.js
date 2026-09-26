const pool = require('../config/db');

// GET: /api/pendientes (Obtener todas las pendientes del usuario logueado)
const obtenerPendientes = async (req, res) => {
  const usuarioId = req.usuario?.id;
  if (!usuarioId) {
    return res.status(401).json({ error: 'No autorizado' });
  }

  try {
    const consulta = `
      SELECT 
        p.id AS pendiente_id,
        p.creado_en AS fecha_guardado,
        c.id AS obra_id,
        c.tmdb_id,
        c.tipo,
        c.titulo,
        c.poster_path
      FROM obras_pendientes p
      INNER JOIN obras_catalogo c ON p.obra_id = c.id
      WHERE p.usuario_id = $1
      ORDER BY p.creado_en DESC;
    `;
    const resultado = await pool.query(consulta, [usuarioId]);
    res.json(resultado.rows);
  } catch (error) {
    console.error('Error al obtener obras pendientes:', error.message);
    res.status(500).json({ error: 'Error del servidor al obtener pendientes' });
  }
};

// POST: /api/pendientes (Alternar o Guardar en pendientes)
const alternarPendiente = async (req, res) => {
  const usuarioId = req.usuario?.id;
  const { tmdb_id, tipo, titulo, poster_path } = req.body;

  if (!usuarioId) {
    return res.status(401).json({ error: 'No autorizado' });
  }

  if (!tmdb_id || !tipo || !titulo) {
    return res.status(400).json({ error: 'Datos incompletos de la obra' });
  }

  try {
    // 1. Asegurar en obras_catalogo
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

    // 2. Comprobar si ya la tiene en pendientes
    const existeRes = await pool.query(
      'SELECT id FROM obras_pendientes WHERE usuario_id = $1 AND obra_id = $2',
      [usuarioId, obraId]
    );

    if (existeRes.rows.length > 0) {
      // Si ya existe, la quitamos (toggle)
      await pool.query(
        'DELETE FROM obras_pendientes WHERE usuario_id = $1 AND obra_id = $2',
        [usuarioId, obraId]
      );
      return res.json({ guardado: false, mensaje: 'Eliminado de pendientes' });
    } else {
      // Si no existe, la agregamos
      await pool.query(
        'INSERT INTO obras_pendientes (usuario_id, obra_id) VALUES ($1, $2)',
        [usuarioId, obraId]
      );
      return res.json({ guardado: true, mensaje: 'Guardado en pendientes' });
    }
  } catch (error) {
    console.error('Error al alternar pendiente:', error.message);
    res.status(500).json({ error: 'Error del servidor al guardar pendiente' });
  }
};

// DELETE: /api/pendientes/:tmdb_id (Eliminar explícitamente por tmdb_id)
const eliminarPendiente = async (req, res) => {
  const usuarioId = req.usuario?.id;
  const { tmdb_id } = req.params;

  if (!usuarioId) {
    return res.status(401).json({ error: 'No autorizado' });
  }

  try {
    await pool.query(`
      DELETE FROM obras_pendientes p
      USING obras_catalogo c
      WHERE p.obra_id = c.id AND p.usuario_id = $1 AND c.tmdb_id = $2
    `, [usuarioId, tmdb_id]);

    res.json({ mensaje: 'Obra eliminada de pendientes' });
  } catch (error) {
    console.error('Error al eliminar pendiente:', error.message);
    res.status(500).json({ error: 'Error del servidor al eliminar de pendientes' });
  }
};

module.exports = {
  obtenerPendientes,
  alternarPendiente,
  eliminarPendiente
};