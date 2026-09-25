const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const clientGoogle = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const generarToken = (usuario) => {
  return jwt.sign(
    { 
      id: usuario.id, 
      email: usuario.email, 
      username: usuario.username 
    },
    process.env.JWT_SECRET || 'cinerewind_super_secreto_2026_key_jwt',
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
      INSERT INTO usuarios (nombre, username, email, password_hash, avatar_url)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, nombre, username, email, avatar_url, biografia, banner_url, creado_en;
    `;
    const avatarDefault = `https://api.dicebear.com/7.x/bottts/svg?seed=${usernameLimpio}`;
    const resultado = await pool.query(nuevoUsuarioQuery, [
      nombre.trim(),
      usernameLimpio,
      emailLimpio,
      passwordHash,
      avatarDefault,
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
      SELECT id, nombre, username, email, password_hash, avatar_url, biografia, banner_url, rol, creado_en
      FROM usuarios 
      WHERE email = $1 OR username = $1;
    `;
    const resultado = await pool.query(consulta, [queryLimpia]);

    if (resultado.rows.length === 0) {
      return res.status(401).json({ error: 'El usuario o correo electrónico no coinciden con ninguna cuenta.' });
    }

    const usuario = resultado.rows[0];

    if (!usuario.password_hash) {
      return res.status(400).json({ 
        error: 'Esta cuenta fue creada con Google. Inicia sesión usando el botón "Continuar con Google".' 
      });
    }

    const passwordValida = await bcrypt.compare(password, usuario.password_hash);
    if (!passwordValida) {
      return res.status(401).json({ error: 'La contraseña ingresada es incorrecta.' });
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
      'SELECT id, nombre, username, email, avatar_url, biografia, banner_url, rol FROM usuarios WHERE email = $1',
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
        INSERT INTO usuarios (nombre, username, email, password_hash, avatar_url)
        VALUES ($1, $2, $3, NULL, $4)
        RETURNING id, nombre, username, email, avatar_url, biografia, banner_url, rol;
      `;
      const nuevoRes = await pool.query(insertQuery, [
        name || usernameFinal,
        usernameFinal,
        emailLimpio,
        picture || `https://api.dicebear.com/7.x/bottts/svg?seed=${usernameFinal}`,
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

// GET: /api/auth/perfil (Para validar si el token sigue activo al recargar la página)
const obtenerPerfilActual = async (req, res) => {
  const usuarioId = req.usuario?.id;
  if (!usuarioId) {
    return res.status(401).json({ error: 'Sesión no autorizada o token inválido' });
  }

  try {
    const consulta = `
      SELECT id, nombre, username, email, avatar_url, biografia, banner_url, creado_en
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

module.exports = {
  registrarUsuario,
  iniciarSesion,
  loginGoogle,
  obtenerPerfilActual, // Es indispensable para que AuthContext sepa quién está logueado al refrescar F5
};