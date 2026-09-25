const express = require('express');
const router = express.Router();
const { 
  registrarUsuario, 
  iniciarSesion, 
  loginGoogle,
  obtenerPerfilActual 
} = require('../controllers/authController');
const { verificarToken } = require('../middlewares/authMiddleware');

// Rutas de autenticación pública
router.post('/registro', registrarUsuario);
router.post('/login', iniciarSesion);
router.post('/google', loginGoogle);

// Verificación de sesión activa (JWT)
router.get('/perfil', verificarToken, obtenerPerfilActual);

module.exports = router;