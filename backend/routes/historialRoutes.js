const express = require('express');
const router = express.Router();
const {
  registrarVisualizacion,
  obtenerViendoActualmente,
  avanzarCapitulo,
  obtenerTimeline,
} = require('../controllers/historialController');

// POST /api/historial/registrar
router.post('/registrar', registrarVisualizacion);

// GET /api/historial/viendo-actualmente/:usuario_id
router.get('/viendo-actualmente/:usuario_id', obtenerViendoActualmente);

// POST /api/historial/avanzar-capitulo
router.post('/avanzar-capitulo', avanzarCapitulo);

// GET /api/historial/timeline/:usuario_id
router.get('/timeline/:usuario_id', obtenerTimeline);

module.exports = router;