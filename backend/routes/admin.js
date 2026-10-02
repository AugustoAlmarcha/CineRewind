// backend/routes/admin.js
const express = require('express');
const router = express.Router();
const { verificarToken } = require('../middlewares/authMiddleware');
const { esAdmin } = require('../middlewares/adminMiddleware');
const { obtenerMetricasGlobales } = require('../controllers/adminController');

// Ruta protegida con doble candado:
// 1. verificarToken (que esté logueado)
// 2. esAdmin (que su rol en PostgreSQL sea 'admin')
router.get('/metricas', verificarToken, esAdmin, obtenerMetricasGlobales);

module.exports = router;