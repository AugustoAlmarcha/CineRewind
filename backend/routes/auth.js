const express = require('express');
const router = express.Router();
const { 
  registrarUsuario, 
  iniciarSesion, 
  loginGoogle,
  obtenerPerfilActual,
  obtenerPerfilPublico,
  actualizarPerfil,
  comprobarDisponibilidadUsername,
  cambiarPassword,
  solicitarRecuperacionPassword,
  restablecerPasswordConToken
} = require('../controllers/authController');
const { verificarToken, extraerTokenOpcional } = require('../middlewares/authMiddleware');
const { validarBody } = require('../middlewares/validarSchema');
const { registroSchema, loginSchema, cambiarPasswordSchema } = require('../schemas/authSchemas');

// Rutas de autenticación pública
router.post('/registro', validarBody(registroSchema), registrarUsuario);
router.post('/login', validarBody(loginSchema), iniciarSesion);
router.post('/google', loginGoogle);
router.post('/solicitar-recuperacion', solicitarRecuperacionPassword);
router.post('/restablecer-password', restablecerPasswordConToken);
router.get('/comprobar-username', comprobarDisponibilidadUsername);
router.get('/usuario/:username', extraerTokenOpcional, obtenerPerfilPublico);
router.put('/cambiar-password', verificarToken, validarBody(cambiarPasswordSchema), cambiarPassword);

// Verificación y actualización de sesión activa (JWT)
router.get('/perfil', verificarToken, obtenerPerfilActual);
router.put('/perfil', verificarToken, actualizarPerfil);

module.exports = router;