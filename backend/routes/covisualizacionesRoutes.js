const express = require('express');
const router = express.Router();
const { verificarToken } = require('../middlewares/authMiddleware');
const {
  obtenerInvitacionesPendientes,
  responderInvitacion,
} = require('../controllers/covisualizacionesController');

// Todas las rutas de co-visualizaciones requieren sesión iniciada
router.use(verificarToken);

// GET /api/covisualizaciones/pendientes -> Lista de invitaciones para el usuario logueado
router.get('/pendientes', obtenerInvitacionesPendientes);

// PUT /api/covisualizaciones/responder -> Aceptar o rechazar invitación
router.put('/responder', responderInvitacion);

module.exports = router;