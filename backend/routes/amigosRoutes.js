const express = require('express');
const router = express.Router();

// Importante: con las llaves { }
const { verificarToken } = require('../middlewares/authMiddleware');

const {
  buscarUsuarios,
  enviarSolicitud,
  obtenerSolicitudesPendientes,
  responderSolicitud,
  obtenerAmigos,
  eliminarAmigo
} = require('../controllers/amigosController');

// Todas las rutas requieren sesión iniciada
router.use(verificarToken);

// Búsqueda de cinéfilos
router.get('/buscar', buscarUsuarios);

// Gestión de solicitudes
router.post('/solicitar', enviarSolicitud);
router.get('/pendientes', obtenerSolicitudesPendientes);
router.put('/responder', responderSolicitud);

// Lista de amigos confirmados
router.get('/', obtenerAmigos);
router.delete('/:amistad_id', eliminarAmigo);

module.exports = router;