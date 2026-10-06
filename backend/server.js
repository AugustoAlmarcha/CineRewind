require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const pool = require('./config/db');
const axios = require('axios');
const { esUrlImagenPermitida } = require('./utils/seguridad');

// 1. IMPORTACIÓN DE RUTAS
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
// crossOriginResourcePolicy en false permite cargar carátulas y avatares externos
app.use(helmet({
  crossOriginResourcePolicy: false
}));

// ==========================================
// 🛡️ 2. RATE LIMITERS (Protección Anti-Ataques)
// ==========================================
// A) Login y Registro: Máximo 10 intentos fallidos cada 15 min (evita fuerza bruta de contraseñas)
const limiterAutenticacion = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Demasiados intentos de acceso. Por seguridad, espera 15 minutos.'
  }
});

// B) Toda la API: 5.000 peticiones cada 15 minutos por IP (navegación súper fluida sin bloqueos)
const limiterGeneral = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5000,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Demasiadas solicitudes enviadas al servidor. Intenta de nuevo en unos momentos.'
  }
});

// Redirección HTTPS forzada en producción (compatible con Railway, Render, etc.)
if (process.env.NODE_ENV === 'production') {
  app.enable('trust proxy');
  app.use((req, res, next) => {
    if (req.headers['x-forwarded-proto'] && req.headers['x-forwarded-proto'] !== 'https') {
      return res.redirect(301, `https://${req.hostname}${req.originalUrl}`);
    }
    next();
  });
}

// Middlewares globales
// 🛡️ Política de CORS: Protege contra orígenes no autorizados permitiendo desarrollo y producción
const origenesPermitidos = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:3000',
  'https://cinerewind.com.ar',
  'https://www.cinerewind.com.ar',
  'https://cine-rewind.vercel.app',
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Permitir peticiones sin header Origin (apps móviles, curl, Postman o SSR)
    if (!origin) return callback(null, true);
    
    // Permitir si coincide con la whitelist o si es localhost en desarrollo
    const esValido = origenesPermitidos.some(o => origin === o || origin.startsWith(o)) ||
      (process.env.NODE_ENV !== 'production' && origin.includes('localhost'));

    if (esValido) {
      return callback(null, true);
    }
    return callback(new Error('CORS: Origen bloqueado por política de seguridad'));
  },
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Aplicación de los limitadores
app.use('/api', limiterGeneral);
app.use('/api/auth/login', limiterAutenticacion);
app.use('/api/auth/registro', limiterAutenticacion);

// ==========================================
// 3. MONTAJE DE RUTAS DE LA APLICACIÓN
// ==========================================
app.use('/api/peliculas', peliculasRoutes);
app.use('/api/historial', historialRoutes);
app.use('/api/auth', authRutas);
app.use('/api/favoritos', favoritosRoutes);
app.use('/api/pendientes', pendientesRoutes);
app.use('/api/amigos', amigosRoutes);
app.use('/api/covisualizaciones', covisualizacionesRoutes);
app.use('/api/admin', adminRoutes);

// ==========================================
// 4. PROXY DE IMÁGENES (Para exportar historias sin error de CORS)
// ==========================================
app.get('/api/proxy-image', async (req, res) => {
  try {
    const { url } = req.query;
    if (!url) {
      return res.status(400).json({ error: 'Falta el parámetro url' });
    }

    // 🛡️ Anti-SSRF: Bloquea solicitudes a servidores locales, IPs privadas o dominios no autorizados
    if (!esUrlImagenPermitida(url)) {
      return res.status(403).json({ 
        error: 'Dominio de imagen no permitido por la política de seguridad (Anti-SSRF)' 
      });
    }

    const response = await axios.get(url, { 
      responseType: 'arraybuffer',
      timeout: 8000,
      maxContentLength: 10 * 1024 * 1024 // Máximo 10 MB por imagen
    });

    res.set('Content-Type', response.headers['content-type'] || 'image/jpeg');
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Cache-Control', 'public, max-age=604800, immutable');
    res.send(response.data);
  } catch (error) {
    console.error('Error en proxy-image:', error.message);
    res.status(500).send('Error al obtener la imagen');
  }
});

// ==========================================
// 5. TEST DE CONEXIÓN A POSTGRESQL
// ==========================================
app.get('/api/test-db', async (req, res) => {
  try {
    const resultado = await pool.query('SELECT NOW()');
    res.json({
      estado: 'Conexión exitosa a la base de datos',
      fecha_servidor: resultado.rows[0].now,
    });
  } catch (error) {
    console.error('Error en base de datos:', error.message);
    res.status(500).json({ error: 'No se pudo conectar a la base de datos' });
  }
});

// ==========================================
// 6. MANEJO DE RUTAS NO ENCONTRADAS Y ERRORES
// ==========================================
app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada en el servidor' });
});

app.use((err, req, res, next) => {
  console.error('Error no controlado en Express:', err.stack);
  res.status(500).json({ error: 'Error interno del servidor' });
});

// Asegurar columnas de recuperación de contraseña en PostgreSQL
pool.query(`
  ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS token_recuperacion TEXT;
  ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS token_recuperacion_expira TIMESTAMP WITH TIME ZONE;
`).catch((err) => {
  console.warn('[DB Init] Columnas de recuperación:', err.message);
});

// ==========================================
// 7. ARRANQUE DEL SERVIDOR
// ==========================================
app.listen(PORT, () => {
  console.log(`Servidor CineRewind corriendo en http://localhost:${PORT}`);
});