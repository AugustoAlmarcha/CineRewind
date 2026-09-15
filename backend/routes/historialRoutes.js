const express = require('express');
const router = express.Router();

// Controlador de Historial y Reseñas
const {
  registrarVisualizacion,
  obtenerTimeline,
  eliminarVisualizacion,
  registrarLoteVisualizaciones,
  obtenerEpisodiosVistosTemporada,
  actualizarReseniaYCalificacion,
  eliminarLoteVisualizaciones,
} = require('../controllers/historialController');

// Controlador de Seguimiento de Series (Carrusel)
const {
  obtenerViendoActualmente,
  avanzarCapitulo,
  descartarDeViendo,
} = require('../controllers/seguimientoController');

// Rutas de Seguimiento
router.get('/viendo-actualmente/:usuario_id', obtenerViendoActualmente);
router.post('/avanzar-capitulo', avanzarCapitulo);
router.delete('/viendo-actualmente/:usuario_id/:obra_id', descartarDeViendo);

// Rutas de Historial
router.post('/registrar', registrarVisualizacion);
router.post('/registrar-lote', registrarLoteVisualizaciones);
router.get('/timeline/:usuario_id', obtenerTimeline);
router.get('/vistos/:usuario_id/:tmdb_id/:temporada', obtenerEpisodiosVistosTemporada);
router.patch('/:id/resenia', actualizarReseniaYCalificacion);
router.delete('/lote/eliminar', eliminarLoteVisualizaciones);
router.delete('/:id', eliminarVisualizacion);

module.exports = router;