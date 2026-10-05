const express = require('express');
const router = express.Router();
const {
  obtenerPendientes,
  alternarPendiente,
  eliminarPendiente
} = require('../controllers/pendientesController');
const { verificarToken, extraerTokenOpcional } = require('../middlewares/authMiddleware');

router.get('/', extraerTokenOpcional, obtenerPendientes);
router.post('/', verificarToken, alternarPendiente);
router.delete('/:tmdb_id', verificarToken, eliminarPendiente);

module.exports = router;