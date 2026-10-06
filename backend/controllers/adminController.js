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

    // 4. Conteo de reseñas escritas
    const resResenias = await pool.query(
      `SELECT COUNT(*) AS total_resenias 
       FROM historial_visualizaciones 
       WHERE resenia IS NOT NULL AND TRIM(resenia) != ''`
    );
    const totalResenias = parseInt(resResenias.rows[0].total_resenias, 10) || 0;

    // 5. Top 5 de obras más vistas por toda la comunidad
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

    // 6. Lista de usuarios con avatar y cantidad de visualizaciones
    const queryUsuarios = `
      SELECT 
        u.id,
        u.username,
        u.email,
        u.avatar_url,
        u.rol,
        u.creado_en,
        COUNT(h.id) AS cantidad_vistos
      FROM usuarios u
      LEFT JOIN historial_visualizaciones h ON u.id = h.usuario_id
      GROUP BY u.id, u.username, u.email, u.avatar_url, u.rol, u.creado_en
      ORDER BY u.creado_en DESC;
    `;
    const resListaUsuarios = await pool.query(queryUsuarios);

    res.json({
      resumen: {
        totalUsuarios,
        totalVistos,
        totalObras,
        totalResenias,
      },
      topObras: resTop.rows,
      usuarios: resListaUsuarios.rows,
    });
  } catch (error) {
    console.error('Error al obtener métricas de admin:', error.message);
    res.status(500).json({ error: 'Error del servidor al obtener métricas de administrador' });
  }
};

// PUT /api/admin/usuarios/:id/rol
const actualizarRolUsuario = async (req, res) => {
  const adminId = req.usuario?.id;
  const usuarioIdTarget = parseInt(req.params.id, 10);
  const { rol } = req.body;

  if (!usuarioIdTarget || isNaN(usuarioIdTarget)) {
    return res.status(400).json({ error: 'ID de usuario inválido' });
  }

  if (!rol || (rol !== 'admin' && rol !== 'usuario')) {
    return res.status(400).json({ error: 'El rol debe ser "admin" o "usuario"' });
  }

  // Salvaguarda: El admin no puede quitarse su propio rol de admin
  if (adminId === usuarioIdTarget) {
    return res.status(400).json({ error: 'No puedes modificar tu propio rol de administrador' });
  }

  try {
    const resultado = await pool.query(
      `UPDATE usuarios 
       SET rol = $1 
       WHERE id = $2 
       RETURNING id, username, email, rol`,
      [rol, usuarioIdTarget]
    );

    if (resultado.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json({
      mensaje: `Rol actualizado correctamente a ${rol}`,
      usuario: resultado.rows[0],
    });
  } catch (error) {
    console.error('Error al actualizar rol de usuario:', error.message);
    res.status(500).json({ error: 'Error del servidor al actualizar rol' });
  }
};

// DELETE /api/admin/usuarios/:id
const eliminarUsuario = async (req, res) => {
  const adminId = req.usuario?.id;
  const usuarioIdTarget = parseInt(req.params.id, 10);

  if (!usuarioIdTarget || isNaN(usuarioIdTarget)) {
    return res.status(400).json({ error: 'ID de usuario inválido' });
  }

  // Salvaguarda: El admin no puede borrarse a sí mismo
  if (adminId === usuarioIdTarget) {
    return res.status(400).json({ error: 'No puedes eliminar tu propia cuenta de administrador' });
  }

  try {
    const resultado = await pool.query(
      `DELETE FROM usuarios 
       WHERE id = $1 
       RETURNING id, username`,
      [usuarioIdTarget]
    );

    if (resultado.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json({
      mensaje: `Cuenta de @${resultado.rows[0].username} eliminada con éxito`,
      id: resultado.rows[0].id,
    });
  } catch (error) {
    console.error('Error al eliminar usuario:', error.message);
    res.status(500).json({ error: 'Error del servidor al eliminar usuario' });
  }
};

// GET /api/admin/resenias
const obtenerReseniasAdmin = async (req, res) => {
  try {
    const query = `
      SELECT 
        h.id,
        h.usuario_id,
        u.username,
        u.avatar_url,
        o.id AS obra_id,
        o.titulo AS obra_titulo,
        o.tipo AS obra_tipo,
        o.poster_path,
        h.temporada,
        h.episodio,
        h.calificacion,
        h.resenia,
        h.fecha_visto,
        h.creado_en
      FROM historial_visualizaciones h
      JOIN usuarios u ON h.usuario_id = u.id
      JOIN obras_catalogo o ON h.obra_id = o.id
      WHERE h.resenia IS NOT NULL AND TRIM(h.resenia) != ''
      ORDER BY h.creado_en DESC
      LIMIT 100;
    `;
    const resultado = await pool.query(query);

    res.json({
      resenias: resultado.rows,
    });
  } catch (error) {
    console.error('Error al obtener reseñas para admin:', error.message);
    res.status(500).json({ error: 'Error del servidor al obtener reseñas' });
  }
};

// DELETE /api/admin/resenias/:id (Limpia el texto de la reseña)
const eliminarTextoResenia = async (req, res) => {
  const reseniaId = parseInt(req.params.id, 10);
  if (!reseniaId || isNaN(reseniaId)) {
    return res.status(400).json({ error: 'ID de reseña inválido' });
  }

  try {
    const resultado = await pool.query(
      `UPDATE historial_visualizaciones 
       SET resenia = NULL 
       WHERE id = $1 
       RETURNING id`,
      [reseniaId]
    );

    if (resultado.rows.length === 0) {
      return res.status(404).json({ error: 'Registro no encontrado' });
    }

    res.json({
      mensaje: 'Texto de la reseña eliminado por moderación',
      id: reseniaId,
    });
  } catch (error) {
    console.error('Error al eliminar texto de reseña:', error.message);
    res.status(500).json({ error: 'Error del servidor al moderar reseña' });
  }
};

// DELETE /api/admin/visualizaciones/:id (Elimina el registro de visualización completo)
const eliminarVisualizacionAdmin = async (req, res) => {
  const visId = parseInt(req.params.id, 10);
  if (!visId || isNaN(visId)) {
    return res.status(400).json({ error: 'ID de registro inválido' });
  }

  try {
    const resultado = await pool.query(
      `DELETE FROM historial_visualizaciones 
       WHERE id = $1 
       RETURNING id`,
      [visId]
    );

    if (resultado.rows.length === 0) {
      return res.status(404).json({ error: 'Registro no encontrado' });
    }

    res.json({
      mensaje: 'Registro de visualización eliminado con éxito',
      id: visId,
    });
  } catch (error) {
    console.error('Error al eliminar visualización como admin:', error.message);
    res.status(500).json({ error: 'Error del servidor al eliminar registro' });
  }
};

module.exports = {
  obtenerMetricasGlobales,
  actualizarRolUsuario,
  eliminarUsuario,
  obtenerReseniasAdmin,
  eliminarTextoResenia,
  eliminarVisualizacionAdmin,
};