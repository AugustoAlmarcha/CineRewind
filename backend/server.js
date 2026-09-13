const express = require('express');
const cors = require('cors');
const pool = require('./config/db');
const peliculasRoutes = require('./routes/peliculasRoutes');
const historialRoutes = require('./routes/historialRoutes');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares globales
app.use(cors());
app.use(express.json());

// Montaje de rutas con el estándar /api/...
app.use('/api/peliculas', peliculasRoutes);
app.use('/api/historial', historialRoutes);

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

app.listen(PORT, () => {
  console.log(`Servidor CineRewind corriendo en http://localhost:${PORT}`);
});