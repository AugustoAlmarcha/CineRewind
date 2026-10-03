require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const pool = require('./config/db');

// Rutas
const peliculasRoutes = require('./routes/peliculasRoutes');
const historialRoutes = require('./routes/historialRoutes');
const favoritosRoutes = require('./routes/favoritosRoutes');
const pendientesRoutes = require('./routes/pendientesRoutes');
const authRutas = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const amigosRoutes = require('./routes/amigosRoutes');
const covisualizacionesRoutes = require('./routes/covisualizacionesRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// ==========================================
// 🛡️ 1. CAPA DE SEGURIDAD: CABECERAS HTTP
// ==========================================
// Oculta "X-Powered-By: Express" y añade políticas anti-inyección / anti-clickjacking
app.use(helmet());

// ==========================================
// 🛡️ 2. CAPA DE SEGURIDAD: RATE LIMITERS (Anti-Fuerza Bruta y DoS)
// ==========================================
// A) Limiter estricto para Login y Registro (evita adivinar contraseñas)
const limiterAutenticacion = rateLimit({
  windowMs: 15 * 60 * 1000, // Ventana de 15 minutos
  max: 5, // Máximo 5 intentos por IP
  standardHeaders: true, // Devuelve cabeceras estándar con el tiempo restante
  legacyHeaders: false,
  message: {
    error: 'Has intentado demasiadas veces. Por motivos de seguridad, tu acceso está pausado por 15 minutos.'
  }
});

// B) Limiter general para la API (protección contra saturación de servidor)
const limiterGeneral = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 200, // Máximo 200 peticiones por IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Demasiadas solicitudes enviadas al servidor. Por favor intenta de nuevo en unos minutos.'
  }
});

// Middlewares globales
app.use(cors());
app.use(express.json());

// Aplicar limitador general a toda la API
app.use('/api', limiterGeneral);

// Aplicar el limitador estricto específicamente a los intentos de inicio de sesión
app.use('/api/auth/login', limiterAutenticacion);

// ==========================================
// 3. MONTAJE DE RUTAS API
// ==========================================
app.use('/api/peliculas', peliculasRoutes);
app.use('/api/historial', historialRoutes);
app.use('/api/auth', authRutas);
app.use('/api/favoritos', favoritosRoutes);
app.use('/api/pendientes', pendientesRoutes);
app.use('/api/amigos', amigosRoutes);
app.use('/api/covisualizaciones', covisualizacionesRoutes);
app.use('/api/admin', adminRoutes);

// Endpoint de prueba rápida para la base de datos
app.get('/api/test-db', async (req, res) => {
  try {
    const resultado = await pool.query('SELECT NOW()');
    res.json({
      estado: 'Conexión exitosa',
      fecha_servidor: resultado.rows[0].now,
    });
  } catch (error) {
    console.error('Error al conectar con la base de datos:', error.message);
    res.status(500).json({ error: 'No se pudo conectar a la base de datos' });
  }
});

// Middleware para capturar rutas no encontradas (404)
app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada en el servidor' });
});

// Middleware de manejo de errores interno (500)
app.use((err, req, res, next) => {
  console.error('Error no controlado en el servidor:', err.stack);
  res.status(500).json({ error: 'Error interno del servidor' });
});

app.listen(PORT, () => {
  console.log(`Servidor CineRewind corriendo en http://localhost:${PORT}`);
});