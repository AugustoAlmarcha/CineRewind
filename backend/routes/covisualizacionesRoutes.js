const express = require('express');
const router = express.Router();
const { verificarToken } = require('../middlewares/authMiddleware');
const {
  obtenerInvitacionesPendientes,
  responderInvitacion,
  responderTodasInvitaciones,
  desvincularAcompanante,
} = require('../controllers/covisualizacionesController');

// Todas las rutas de co-visualizaciones requieren sesión iniciada
router.use(verificarToken);

// GET /api/covisualizaciones/pendientes -> Lista de invitaciones para el usuario logueado
router.get('/pendientes', obtenerInvitacionesPendientes);

// PUT /api/covisualizaciones/responder -> Aceptar o rechazar invitación
router.put('/responder', responderInvitacion);

// PUT /api/covisualizaciones/responder-todas -> Aceptar o rechazar todas en lote
router.put('/responder-todas', responderTodasInvitaciones);

// POST /api/covisualizaciones/desvincular-acompanante -> Desvincular todas las co-visiones con un usuario o copiloto
router.post('/desvincular-acompanante', desvincularAcompanante);

module.exports = router;