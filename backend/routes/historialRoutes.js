const express = require('express');
const router = express.Router();

// Middleware de Autenticación JWT
const { verificarToken, extraerTokenOpcional } = require('../middlewares/authMiddleware');

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
  obtenerRecordsUsuario,
  obtenerWrappedPeriodo,
  proxyImagen
} = require('../controllers/historialController');

// Controlador de Seguimiento de Series (Carrusel)
const {
  obtenerViendoActualmente,
  avanzarCapitulo,
  descartarDeViendo,
} = require('../controllers/seguimientoController');

const { 
  importarLoteCSV,
  analizarLoteCSV,
  confirmarImportacionCSV 
} = require('../controllers/importarController');

router.post('/importar-lote-csv', verificarToken, importarLoteCSV);
router.post('/analizar-lote-csv', verificarToken, analizarLoteCSV);
router.post('/confirmar-importacion-csv', verificarToken, confirmarImportacionCSV);

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
router.get('/estadisticas', extraerTokenOpcional, obtenerEstadisticasUsuario);
router.get('/records', extraerTokenOpcional, obtenerRecordsUsuario);

// RUTAS DE WRAPPED (Soporta /wrapped y /wrapped-periodo para evitar errores 404)
router.get('/wrapped', verificarToken, obtenerWrappedPeriodo);
router.get('/wrapped-periodo', verificarToken, obtenerWrappedPeriodo);

// 🌟 RUTA PROXY PARA DESCARGAR IMÁGENES SIN BLOQUEO DE CORS
router.get('/proxy-image', proxyImagen);
router.get('/proxy-image/{*path}', proxyImagen);

/* =========================================================================
   3. RUTAS DE ESCRITURA Y REGISTRO (Protegidas con JWT)
   ========================================================================= */
router.post('/registrar', verificarToken, registrarVisualizacion);
router.post('/registrar-lote', verificarToken, registrarLoteVisualizaciones);

/* =========================================================================
   4. RUTAS DE ACTUALIZACIÓN
   ========================================================================= */
router.patch('/actualizar-plataforma-serie', verificarToken, actualizarPlataformaSerie);
router.patch('/:id/resenia', verificarToken, actualizarReseniaYCalificacion);

/* =========================================================================
   5. RUTAS DE ELIMINACIÓN
   ========================================================================= */
router.delete('/lote/eliminar', verificarToken, eliminarLoteVisualizaciones);
router.delete('/:id', verificarToken, eliminarVisualizacion);

module.exports = router;