const jwt = require('jsonwebtoken');

// Middleware estricto: bloquea la petición si no hay token válido
const verificarToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Acceso denegado: No se proporcionó un token de sesión' });
  }

  try {
    const payload = jwt.verify(
      token, 
      process.env.JWT_SECRET || 'cinerewind_super_secreto_2026_key_jwt'
    );
    req.usuario = payload; // { id, email, username }
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Token inválido o expirado. Inicia sesión nuevamente.' });
  }
};

// Middleware blando: si viene token lo inyecta en req.usuario, pero no bloquea si no viene
const extraerTokenOpcional = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    try {
      const payload = jwt.verify(
        token, 
        process.env.JWT_SECRET || 'cinerewind_super_secreto_2026_key_jwt'
      );
      req.usuario = payload;
    } catch {
      // Si el token es inválido o expiró, simplemente se ignora y continúa como invitado
      req.usuario = null;
    }
  }
  next();
};

module.exports = { 
  verificarToken,
  extraerTokenOpcional 
};