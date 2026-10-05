const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const clientGoogle = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// 🛡️ Asegurar que JWT_SECRET exista en producción
const obtenerJwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    console.warn('⚠️ ADVERTENCIA DE SEGURIDAD: JWT_SECRET no está definida en las variables de entorno (.env). Usando clave temporal.');
    return 'cinerewind_super_secreto_2026_key_jwt';
  }
  return secret;
};

const generarToken = (usuario) => {
  return jwt.sign(
    { 
      id: usuario.id, 
      email: usuario.email, 
      username: usuario.username 
    },
    obtenerJwtSecret(),
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

// POST: /api/auth/registro
const registrarUsuario = async (req, res) => {
  const { nombre, username, email, password } = req.body;

  if (!nombre || !username || !email || !password) {
    return res.status(400).json({ error: 'Todos los campos son obligatorios' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
  }

  if (password.length > 72) {
    // Bcrypt solo procesa hasta 72 bytes; evitar ataques DoS por longitud de contraseña
    return res.status(400).json({ error: 'La contraseña no puede superar los 72 caracteres' });
  }

  const usernameLimpio = username.toLowerCase().trim().replace(/\s+/g, '_').replace(/[^a-z0-9_.-]/g, '');
  const emailLimpio = email.toLowerCase().trim();

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(emailLimpio)) {
    return res.status(400).json({ error: 'El formato del correo electrónico no es válido' });
  }

  if (usernameLimpio.length < 3 || usernameLimpio.length > 15) {
    return res.status(400).json({ error: 'El nombre de usuario debe tener entre 3 y 15 caracteres' });
  }

  if (nombre.trim().length > 20) {
    return res.status(400).json({ error: 'El nombre no puede superar los 20 caracteres' });
  }

  try {
    const existe = await pool.query(
      'SELECT id, email, username FROM usuarios WHERE email = $1 OR username = $2',
      [emailLimpio, usernameLimpio]
    );

    if (existe.rows.length > 0) {
      const duplicado = existe.rows[0];
      if (duplicado.email === emailLimpio) {
        return res.status(409).json({ error: 'Este correo electrónico ya está registrado' });
      }
      if (duplicado.username === usernameLimpio) {
        return res.status(409).json({ error: 'Este nombre de usuario ya está en uso' });
      }
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const nuevoUsuarioQuery = `
      INSERT INTO usuarios (nombre, username, email, password_hash, avatar_url, banner_url)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, nombre, username, email, rol, avatar_url, biografia, banner_url, creado_en;
    `;
    const avatarDefault = `https://api.dicebear.com/7.x/bottts/svg?seed=${usernameLimpio}`;
    const bannerDefault = 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1600&q=80';
    const resultado = await pool.query(nuevoUsuarioQuery, [
      nombre.trim(),
      usernameLimpio,
      emailLimpio,
      passwordHash,
      avatarDefault,
      bannerDefault,
    ]);

    const usuarioCreado = resultado.rows[0];
    const token = generarToken(usuarioCreado);

    res.status(201).json({
      mensaje: 'Usuario registrado exitosamente',
      usuario: usuarioCreado,
      token,
    });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ error: 'El correo electrónico o nombre de usuario ya se encuentra registrado' });
    }
    console.error('Error al registrar usuario:', error.message);
    res.status(500).json({ error: 'Error del servidor al crear la cuenta' });
  }
};

// POST: /api/auth/login
const iniciarSesion = async (req, res) => {
  const { identificador, password } = req.body;

  if (!identificador || !password) {
    return res.status(400).json({ error: 'Ingresa tu usuario/correo y contraseña' });
  }

  const queryLimpia = identificador.toLowerCase().trim();

  try {
    const consulta = `
      SELECT id, nombre, username, email, rol, password_hash, avatar_url, biografia, banner_url, creado_en
      FROM usuarios 
      WHERE email = $1 OR username = $1;
    `;
    const resultado = await pool.query(consulta, [queryLimpia]);

    // 🛡️ Anti-Enumeración: Si no existe, damos el mismo mensaje genérico que si la contraseña falla
    if (resultado.rows.length === 0) {
      return res.status(401).json({ error: 'Usuario o contraseña incorrectos.' });
    }

    const usuario = resultado.rows[0];

    // Caso de cuenta creada exclusivamente con Google
    if (!usuario.password_hash) {
      return res.status(400).json({ 
        error: 'Esta cuenta fue creada con Google. Inicia sesión usando el botón "Continuar con Google".' 
      });
    }

    const passwordValida = await bcrypt.compare(password, usuario.password_hash);
    if (!passwordValida) {
      // 🛡️ Mismo mensaje genérico
      return res.status(401).json({ error: 'Usuario o contraseña incorrectos.' });
    }

    delete usuario.password_hash;

    const token = generarToken(usuario);

    res.json({
      mensaje: 'Inicio de sesión exitoso',
      usuario,
      token,
    });
  } catch (error) {
    console.error('Error al iniciar sesión:', error.message);
    res.status(500).json({ error: 'Error del servidor al procesar el ingreso' });
  }
};

// POST: /api/auth/google
const loginGoogle = async (req, res) => {
  const { credential } = req.body;

  if (!credential) {
    return res.status(400).json({ error: 'Token de Google requerido' });
  }

  try {
    const ticket = await clientGoogle.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { email, name, picture } = payload;
    const emailLimpio = email.toLowerCase().trim();

    let resultado = await pool.query(
      'SELECT id, nombre, username, email, rol, avatar_url, biografia, banner_url, creado_en FROM usuarios WHERE email = $1',
      [emailLimpio]
    );

    let usuario;

    if (resultado.rows.length > 0) {
      usuario = resultado.rows[0];
    } else {
      let usernameBase = (emailLimpio.split('@')[0] || 'user').replace(/[^a-z0-9_.-]/g, '');
      if (usernameBase.length < 3) usernameBase += '_user';

      const existeUsername = await pool.query('SELECT id FROM usuarios WHERE username = $1', [usernameBase]);
      const usernameFinal = existeUsername.rows.length > 0 
        ? `${usernameBase}_${Math.floor(100 + Math.random() * 900)}` 
        : usernameBase;

      const insertQuery = `
        INSERT INTO usuarios (nombre, username, email, password_hash, avatar_url, banner_url)
        VALUES ($1, $2, $3, NULL, $4, $5)
        RETURNING id, nombre, username, email, rol, avatar_url, biografia, banner_url, creado_en;
      `;
      const bannerDefault = 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1600&q=80';
      const nuevoRes = await pool.query(insertQuery, [
        name || usernameFinal,
        usernameFinal,
        emailLimpio,
        picture || `https://api.dicebear.com/7.x/bottts/svg?seed=${usernameFinal}`,
        bannerDefault,
      ]);
      usuario = nuevoRes.rows[0];
    }

    const token = generarToken(usuario);

    res.json({
      mensaje: 'Autenticación con Google exitosa',
      usuario,
      token,
    });
  } catch (error) {
    console.error('Error al autenticar con Google:', error.message);
    res.status(401).json({ error: 'Token de Google inválido o expirado' });
  }
};

// GET: /api/auth/perfil
const obtenerPerfilActual = async (req, res) => {
  const usuarioId = req.usuario?.id;
  if (!usuarioId) {
    return res.status(401).json({ error: 'Sesión no autorizada o token inválido' });
  }

  try {
    const consulta = `
      SELECT id, nombre, username, email, rol, avatar_url, biografia, banner_url, creado_en
      FROM usuarios 
      WHERE id = $1;
    `;
    const resultado = await pool.query(consulta, [usuarioId]);

    if (resultado.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json(resultado.rows[0]);
  } catch (error) {
    console.error('Error al obtener perfil:', error.message);
    res.status(500).json({ error: 'Error del servidor al cargar perfil' });
  }
};

// PUT: /api/auth/perfil
const actualizarPerfil = async (req, res) => {
  const usuarioId = req.usuario?.id;
  const { nombre, username, biografia, avatar_url, banner_url } = req.body;

  if (!usuarioId) {
    return res.status(401).json({ error: 'Sesión no autorizada' });
  }

  if (!nombre || !nombre.trim()) {
    return res.status(400).json({ error: 'El nombre visible es obligatorio' });
  }

  const nombreLimpio = nombre.trim();
  if (nombreLimpio.length > 20) {
    return res.status(400).json({ error: 'El nombre no puede superar los 20 caracteres' });
  }

  let usernameLimpio = undefined;
  if (username) {
    usernameLimpio = username.toLowerCase().trim().replace(/[^a-z0-9_.-]/g, '');
    if (usernameLimpio.length < 3 || usernameLimpio.length > 20) {
      return res.status(400).json({ error: 'El usuario debe tener entre 3 y 20 caracteres' });
    }

    const existe = await pool.query(
      'SELECT id FROM usuarios WHERE username = $1 AND id != $2',
      [usernameLimpio, usuarioId]
    );
    if (existe.rows.length > 0) {
      return res.status(409).json({ error: 'Ese nombre de usuario ya está en uso' });
    }
  }

  try {
    const query = `
      UPDATE usuarios
      SET 
        nombre = $1,
        username = COALESCE($2, username),
        biografia = $3,
        avatar_url = $4,
        banner_url = CASE WHEN $5::boolean THEN $6 ELSE banner_url END
      WHERE id = $7
      RETURNING id, nombre, username, email, rol, avatar_url, biografia, banner_url, creado_en;
    `;

    const resultado = await pool.query(query, [
      nombreLimpio,
      usernameLimpio || null,
      biografia ? biografia.trim() : null,
      avatar_url || null,
      banner_url !== undefined,
      banner_url || null,
      usuarioId
    ]);

    if (resultado.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json({
      mensaje: 'Perfil actualizado con éxito',
      usuario: resultado.rows[0]
    });
  } catch (error) {
    console.error('Error al actualizar perfil:', error.message);
    res.status(500).json({ error: 'Error del servidor al actualizar perfil' });
  }
};

// GET: /api/auth/comprobar-username?username=augusto
const comprobarDisponibilidadUsername = async (req, res) => {
  const { username } = req.query;
  const usuarioActualId = req.usuario?.id;

  if (!username) {
    return res.status(400).json({ error: 'Username requerido' });
  }

  const limpio = username.toLowerCase().trim().replace(/[^a-z0-9_.-]/g, '');

  if (limpio.length < 3) {
    return res.json({ disponible: false, motivo: 'Mínimo 3 caracteres' });
  }

  try {
    const consulta = `
      SELECT id FROM usuarios 
      WHERE username = $1 AND id != COALESCE($2, -1);
    `;
    const resultado = await pool.query(consulta, [limpio, usuarioActualId || -1]);
    
    res.json({ disponible: resultado.rows.length === 0, username: limpio });
  } catch (error) {
    console.error('Error al comprobar username:', error.message);
    res.status(500).json({ error: 'Error del servidor' });
  }
};

// PUT: /api/auth/cambiar-password
const cambiarPassword = async (req, res) => {
  const usuarioId = req.usuario?.id;
  const { passwordActual, passwordNueva } = req.body;

  if (!usuarioId) {
    return res.status(401).json({ error: 'Sesión no autorizada' });
  }

  if (!passwordActual || !passwordNueva) {
    return res.status(400).json({ error: 'Debes ingresar tu contraseña actual y la nueva' });
  }

  if (passwordNueva.length < 6) {
    return res.status(400).json({ error: 'La nueva contraseña debe tener al menos 6 caracteres' });
  }

  if (passwordNueva.length > 72) {
    return res.status(400).json({ error: 'La nueva contraseña no puede superar los 72 caracteres' });
  }

  try {
    const userRes = await pool.query(
      'SELECT id, password_hash FROM usuarios WHERE id = $1',
      [usuarioId]
    );

    if (userRes.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const usuario = userRes.rows[0];

    if (!usuario.password_hash) {
      return res.status(400).json({ 
        error: 'Esta cuenta fue creada con Google. No posee una contraseña clásica para modificar.' 
      });
    }

    const coincide = await bcrypt.compare(passwordActual, usuario.password_hash);
    if (!coincide) {
      return res.status(401).json({ error: 'La contraseña actual no es correcta' });
    }

    const salt = await bcrypt.genSalt(10);
    const nuevoHash = await bcrypt.hash(passwordNueva, salt);

    await pool.query(
      'UPDATE usuarios SET password_hash = $1 WHERE id = $2',
      [nuevoHash, usuarioId]
    );

    res.json({ mensaje: 'Contraseña actualizada con éxito' });
  } catch (error) {
    console.error('Error al cambiar contraseña:', error.message);
    res.status(500).json({ error: 'Error del servidor al cambiar la contraseña' });
  }
};

// GET: /api/auth/usuario/:username (Perfil público de cualquier cinéfilo con estado de relación)
const obtenerPerfilPublico = async (req, res) => {
  const { username } = req.params;
  const usuarioActualId = req.usuario?.id || null;

  if (!username) {
    return res.status(400).json({ error: 'Nombre de usuario requerido' });
  }

  try {
    const query = `
      SELECT 
        u.id,
        u.nombre,
        u.username,
        u.avatar_url,
        u.biografia,
        u.banner_url,
        u.rol,
        u.creado_en,
        CASE
          WHEN $1::int IS NULL THEN 'ninguno'
          WHEN u.id = $1 THEN 'propio'
          WHEN a.estado = 'aceptada' THEN 'amigos'
          WHEN a.estado = 'pendiente' AND a.remitente_id = $1 THEN 'solicitud_enviada'
          WHEN a.estado = 'pendiente' AND a.destinatario_id = $1 THEN 'solicitud_recibida'
          ELSE 'ninguno'
        END AS estado_relacion,
        a.id AS amistad_id
      FROM usuarios u
      LEFT JOIN amistades a ON (
        (a.remitente_id = $1 AND a.destinatario_id = u.id)
        OR
        (a.remitente_id = u.id AND a.destinatario_id = $1)
      )
      WHERE LOWER(u.username) = LOWER($2)
      LIMIT 1;
    `;

    const resultado = await pool.query(query, [usuarioActualId, username.trim()]);

    if (resultado.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json(resultado.rows[0]);
  } catch (error) {
    console.error('Error al obtener perfil público:', error.message);
    res.status(500).json({ error: 'Error del servidor al cargar el perfil' });
  }
};

module.exports = {
  registrarUsuario,
  iniciarSesion,
  loginGoogle,
  comprobarDisponibilidadUsername,
  actualizarPerfil,
  obtenerPerfilActual,
  obtenerPerfilPublico,
  cambiarPassword,
};