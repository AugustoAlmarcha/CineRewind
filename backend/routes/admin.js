// backend/routes/admin.js
const express = require('express');
const router = express.Router();
const { verificarToken } = require('../middlewares/authMiddleware');
const { esAdmin } = require('../middlewares/adminMiddleware');
const {
  obtenerMetricasGlobales,
  actualizarRolUsuario,
  eliminarUsuario,
  obtenerReseniasAdmin,
  eliminarTextoResenia,
  eliminarVisualizacionAdmin,
} = require('../controllers/adminController');

// Todas las rutas están protegidas con doble candado:
// 1. verificarToken (usuario autenticado)
// 2. esAdmin (rol === 'admin' en PostgreSQL)
router.use(verificarToken, esAdmin);

// Métricas y directorio general
router.get('/metricas', obtenerMetricasGlobales);

// Gestión de usuarios
router.put('/usuarios/:id/rol', actualizarRolUsuario);
router.delete('/usuarios/:id', eliminarUsuario);

// Moderación de reseñas y visualizaciones
router.get('/resenias', obtenerReseniasAdmin);
router.delete('/resenias/:id', eliminarTextoResenia);
router.delete('/visualizaciones/:id', eliminarVisualizacionAdmin);

module.exports = router;