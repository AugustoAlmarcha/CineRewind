const jwt = require('jsonwebtoken');

// 🛡️ Helper para obtener el JWT_SECRET de forma consistente y segura
const obtenerJwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('FATAL: JWT_SECRET no está definida en .env. El servidor no puede operar de forma insegura.');
  }
  return secret;
};

// 🛡️ Middleware estricto: Bloquea la petición si no hay un token Bearer válido
const verificarToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ 
      error: 'Acceso denegado: Formato de autorización inválido o token no proporcionado.' 
    });
  }

  const token = authHeader.split(' ')[1]?.trim();

  if (!token) {
    return res.status(401).json({ 
      error: 'Acceso denegado: Token vacío.' 
    });
  }

  try {
    const payload = jwt.verify(token, obtenerJwtSecret());
    
    // Verificamos que el payload contenga al menos el id del usuario
    if (!payload || !payload.id) {
      return res.status(403).json({ error: 'Token inválido: Sesión corrupta.' });
    }

    req.usuario = {
      id: payload.id,
      email: payload.email,
      username: payload.username
    };

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.' });
    }
    return res.status(403).json({ error: 'Token inválido o manipulado. Inicia sesión nuevamente.' });
  }
};

// 🛡️ Middleware blando: si viene token válido lo inyecta en req.usuario, sino sigue como invitado
const extraerTokenOpcional = (req, res, next) => {
  const authHeader = req.headers['authorization'];

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1]?.trim();

    if (token) {
      try {
        const payload = jwt.verify(token, obtenerJwtSecret());
        if (payload && payload.id) {
          req.usuario = {
            id: payload.id,
            email: payload.email,
            username: payload.username
          };
        }
      } catch {
        // Token inválido o vencido: se continúa como invitado silenciosamente
        req.usuario = null;
      }
    }
  } else {
    req.usuario = null;
  }

  next();
};

module.exports = { 
  verificarToken,
  extraerTokenOpcional 
};