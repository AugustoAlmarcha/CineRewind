const express = require('express');
const router = express.Router();
const {
  obtenerFavoritosPorUsername,
  guardarFavorito,
  eliminarFavorito,
} = require('../controllers/favoritosController');
const { verificarToken } = require('../middlewares/authMiddleware');

// Obtener el Top 4 (Público, para ver en cualquier perfil)
router.get('/:username', obtenerFavoritosPorUsername);

// Modificar Top 4 (Requiere estar logueado)
router.post('/', verificarToken, guardarFavorito);
router.delete('/:posicion', verificarToken, eliminarFavorito);

module.exports = router;