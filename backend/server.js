require('dotenv').config();
const express = require('express');
const cors = require('cors');
const pool = require('./config/db');

// Rutas
const peliculasRoutes = require('./routes/peliculasRoutes');
const historialRoutes = require('./routes/historialRoutes');
const favoritosRoutes = require('./routes/favoritosRoutes'); 
const authRutas = require('./routes/auth');

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares globales
app.use(cors());
app.use(express.json());

// Montaje de rutas API
app.use('/api/peliculas', peliculasRoutes);
app.use('/api/historial', historialRoutes);
app.use('/api/auth', authRutas);
app.use('/api/favoritos', favoritosRoutes);

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