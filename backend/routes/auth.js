const express = require('express');
const router = express.Router();
const { 
  registrarUsuario, 
  iniciarSesion, 
  loginGoogle,
  obtenerPerfilActual,
  actualizarPerfil,
  comprobarDisponibilidadUsername
} = require('../controllers/authController');
const { verificarToken } = require('../middlewares/authMiddleware');

// Rutas de autenticación pública
router.post('/registro', registrarUsuario);
router.post('/login', iniciarSesion);
router.post('/google', loginGoogle);
router.get('/comprobar-username', comprobarDisponibilidadUsername);

// Verificación y actualización de sesión activa (JWT)
router.get('/perfil', verificarToken, obtenerPerfilActual);
router.put('/perfil', verificarToken, actualizarPerfil);

module.exports = router;