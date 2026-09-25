const express = require('express');
const router = express.Router();

// Middleware de Autenticación JWT
const { verificarToken } = require('../middlewares/authMiddleware');

// Controlador de Historial y Reseñas
const {
  registrarVisualizacion,
  obtenerTimeline,
  eliminarVisualizacion,
  registrarLoteVisualizaciones,
  obtenerEpisodiosVistosTemporada,
  actualizarReseniaYCalificacion,
  eliminarLoteVisualizaciones,
  actualizarPlataformaSerie,
  obtenerCatalogoUsuario,
  obtenerEstadisticasUsuario,
} = require('../controllers/historialController');

// Controlador de Seguimiento de Series (Carrusel)
const {
  obtenerViendoActualmente,
  avanzarCapitulo,
  descartarDeViendo,
} = require('../controllers/seguimientoController');

/* =========================================================================
   1. RUTAS DE SEGUIMIENTO (Carrusel "Viendo Actualmente")
   ========================================================================= */
router.get('/viendo-actualmente/:usuario_id', obtenerViendoActualmente);
router.post('/avanzar-capitulo', verificarToken, avanzarCapitulo);
router.delete('/viendo-actualmente/:usuario_id/:obra_id', verificarToken, descartarDeViendo);

/* =========================================================================
   2. RUTAS DE HISTORIAL Y LECTURA
   ========================================================================= */
router.get('/timeline/:usuario_id', obtenerTimeline);
router.get('/vistos/:usuario_id/:tmdb_id/:temporada', obtenerEpisodiosVistosTemporada);
router.get('/catalogo-usuario', verificarToken, obtenerCatalogoUsuario);
router.get('/estadisticas', verificarToken, obtenerEstadisticasUsuario);
/* =========================================================================
   3. RUTAS DE ESCRITURA Y REGISTRO (Protegidas con JWT)
   ========================================================================= */
router.post('/registrar', verificarToken, registrarVisualizacion);
router.post('/registrar-lote', verificarToken, registrarLoteVisualizaciones);

/* =========================================================================
   4. RUTAS DE ACTUALIZACIÓN (Orden estricto: específicas antes de dinámicas :id)
   ========================================================================= */
router.patch('/actualizar-plataforma-serie', verificarToken, actualizarPlataformaSerie);
router.patch('/:id/resenia', verificarToken, actualizarReseniaYCalificacion);

/* =========================================================================
   5. RUTAS DE ELIMINACIÓN (Orden estricto: lote antes de dinámica :id)
   ========================================================================= */
router.delete('/lote/eliminar', verificarToken, eliminarLoteVisualizaciones);
router.delete('/:id', verificarToken, eliminarVisualizacion);

module.exports = router;