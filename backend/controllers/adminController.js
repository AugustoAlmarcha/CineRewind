// backend/controllers/adminController.js
const pool = require('../config/db');

// GET /api/admin/metricas
const obtenerMetricasGlobales = async (req, res) => {
  try {
    // 1. Conteo total de usuarios
    const resUsuarios = await pool.query('SELECT COUNT(*) AS total_usuarios FROM usuarios');
    const totalUsuarios = parseInt(resUsuarios.rows[0].total_usuarios, 10) || 0;

    // 2. Conteo total de visualizaciones registradas
    const resVisualizaciones = await pool.query('SELECT COUNT(*) AS total_vistos FROM historial_visualizaciones');
    const totalVistos = parseInt(resVisualizaciones.rows[0].total_vistos, 10) || 0;

    // 3. Conteo de obras únicas en el catálogo
    const resObras = await pool.query('SELECT COUNT(*) AS total_obras FROM obras_catalogo');
    const totalObras = parseInt(resObras.rows[0].total_obras, 10) || 0;

    // 4. Top 5 de obras más vistas por toda la comunidad
    const queryTop = `
      SELECT 
        o.id,
        o.titulo,
        o.tipo,
        o.poster_path,
        COUNT(h.id) AS veces_vista
      FROM historial_visualizaciones h
      JOIN obras_catalogo o ON h.obra_id = o.id
      GROUP BY o.id, o.titulo, o.tipo, o.poster_path
      ORDER BY veces_vista DESC
      LIMIT 5;
    `;
    const resTop = await pool.query(queryTop);

    // 5. Lista de usuarios con su cantidad de visualizaciones
    const queryUsuarios = `
      SELECT 
        u.id,
        u.username,
        u.email,
        u.rol,
        u.creado_en,
        COUNT(h.id) AS cantidad_vistos
      FROM usuarios u
      LEFT JOIN historial_visualizaciones h ON u.id = h.usuario_id
      GROUP BY u.id, u.username, u.email, u.rol, u.creado_en
      ORDER BY u.creado_en DESC;
    `;
    const resListaUsuarios = await pool.query(queryUsuarios);

    res.json({
      resumen: {
        totalUsuarios,
        totalVistos,
        totalObras,
      },
      topObras: resTop.rows,
      usuarios: resListaUsuarios.rows,
    });
  } catch (error) {
    console.error('Error al obtener métricas de admin:', error.message);
    res.status(500).json({ error: 'Error del servidor al obtener métricas de administrador' });
  }
};

module.exports = {
  obtenerMetricasGlobales,
};