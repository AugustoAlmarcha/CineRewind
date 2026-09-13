const express = require('express');
const router = express.Router();
const {
  registrarVisualizacion,
  obtenerViendoActualmente,
  avanzarCapitulo,
  obtenerTimeline,
  eliminarVisualizacion,
  descartarDeViendo,
  registrarLoteVisualizaciones,
  obtenerEpisodiosVistosTemporada, // <-- 1. Importar aquí
} = require('../controllers/historialController');

router.post('/registrar', registrarVisualizacion);
router.get('/viendo-actualmente/:usuario_id', obtenerViendoActualmente);
router.post('/avanzar-capitulo', avanzarCapitulo);
router.get('/timeline/:usuario_id', obtenerTimeline);
router.delete('/:id', eliminarVisualizacion);
router.delete('/viendo-actualmente/:usuario_id/:obra_id', descartarDeViendo);

// Rutas para selección múltiple y capítulos vistos:
router.post('/registrar-lote', registrarLoteVisualizaciones);
router.get('/vistos/:usuario_id/:tmdb_id/:temporada', obtenerEpisodiosVistosTemporada); // <-- 2. Esta es la ruta que da 404

module.exports = router;