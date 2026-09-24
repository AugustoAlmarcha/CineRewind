const { Pool } = require('pg');
require('dotenv').config();

// Permite conexión directa por variables individuales o por DATABASE_URL única (producción)
const configConexion = process.env.DATABASE_URL
  ? {
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    }
  : {
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      host: process.env.DB_HOST,
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME,
    };

const pool = new Pool(configConexion);

pool.on('connect', () => {
  console.log('Conectado a la base de datos PostgreSQL');
});

// Evita que el servidor colapse si un cliente inactivo en el pool pierde conexión
pool.on('error', (err) => {
  console.error('Error inesperado en cliente inactivo de PostgreSQL:', err);
});

module.exports = pool;