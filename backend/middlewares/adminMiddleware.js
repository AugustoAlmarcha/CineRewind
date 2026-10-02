// backend/middlewares/adminMiddleware.js
const pool = require('../config/db');

// Middleware para verificar que el usuario autenticado sea Administrador
const esAdmin = async (req, res, next) => {
  try {
    // 1. Verificar que venga el ID desde el middleware de token previo
    const usuarioId = req.usuario?.id;

    if (!usuarioId) {
      return res.status(401).json({ error: 'Acceso no autorizado. Inicia sesión.' });
    }

    // 2. Consultar directamente a PostgreSQL el rol real del usuario
    const resultado = await pool.query(
      'SELECT id, rol FROM usuarios WHERE id = $1',
      [usuarioId]
    );

    if (resultado.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado.' });
    }

    const usuario = resultado.rows[0];

    // 3. Validar si tiene permisos de administrador
    if (usuario.rol !== 'admin') {
      return res.status(403).json({ 
        error: 'Acceso denegado: Se requieren permisos de administrador.' 
      });
    }

    // Si es admin, continúa a la ruta protegida
    next();
  } catch (error) {
    console.error('Error en middleware esAdmin:', error.message);
    res.status(500).json({ error: 'Error del servidor al verificar permisos.' });
  }
};

module.exports = { esAdmin };