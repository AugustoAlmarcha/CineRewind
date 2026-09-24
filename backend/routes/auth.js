const express = require('express');
const router = express.Router();
const { 
  registrarUsuario, 
  iniciarSesion, 
  obtenerPerfilActual 
} = require('../controllers/authController');
const { verificarToken } = require('../middlewares/authMiddleware');

router.post('/registro', registrarUsuario);
router.post('/login', iniciarSesion);
router.get('/perfil', verificarToken, obtenerPerfilActual);

module.exports = router;