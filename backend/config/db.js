const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
require('dotenv').config();

let activeEngine = null; // 'pg' or 'pglite'
let realPool = null;
let pgliteInstance = null;
let pgliteInitPromise = null;

const eventListeners = {
  connect: [],
  error: [],
};

// Check if external Postgres credentials are provided
const hasExternalPostgres = Boolean(
  process.env.DATABASE_URL ||
  (process.env.DB_HOST && process.env.DB_USER && process.env.DB_NAME)
);

if (hasExternalPostgres) {
  try {
    const configConexion = process.env.DATABASE_URL
      ? {
          connectionString: process.env.DATABASE_URL,
          ssl: (process.env.NODE_ENV === 'production' || process.env.DATABASE_URL.includes('sslmode') || process.env.DATABASE_URL.includes('neon.tech'))
            ? { rejectUnauthorized: false }
            : false,
        }
      : {
          user: process.env.DB_USER,
          password: process.env.DB_PASSWORD,
          host: process.env.DB_HOST,
          port: process.env.DB_PORT || 5432,
          database: process.env.DB_NAME,
        };

    realPool = new Pool(configConexion);
    realPool.on('connect', (client) => {
      eventListeners.connect.forEach((cb) => cb(client));
    });
    realPool.on('error', (err, client) => {
      console.error('[PostgreSQL] Error inesperado en pool:', err.message);
      eventListeners.error.forEach((cb) => cb(err, client));
    });
    activeEngine = 'pg';
  } catch (err) {
    console.warn('[PostgreSQL] Failed to initialize pg.Pool, falling back to in-memory PGlite:', err.message);
    realPool = null;
    activeEngine = 'pglite';
  }
} else {
  activeEngine = 'pglite';
}

async function getPGlite() {
  if (pgliteInstance) return pgliteInstance;
  if (pgliteInitPromise) return pgliteInitPromise;

  pgliteInitPromise = (async () => {
    try {
      console.log('[Database] Starting in-memory PostgreSQL engine (PGlite)...');
      const { PGlite } = await import('@electric-sql/pglite');
      const db = new PGlite();

      // Load schema
      const schemaPath = path.join(__dirname, '../database/schema.sql');
      if (fs.existsSync(schemaPath)) {
        const schemaSql = fs.readFileSync(schemaPath, 'utf-8');
        await db.exec(schemaSql);
        console.log('[Database] Schema loaded successfully into in-memory PostgreSQL.');
      }

      // Seed default admin user if none exists
      try {
        const existingUsers = await db.query('SELECT COUNT(*) as count FROM usuarios');
        if (Number(existingUsers.rows[0]?.count || 0) === 0) {
          const passHash = bcrypt.hashSync('admin123', 10);
          await db.query(`
            INSERT INTO usuarios (nombre, username, email, password_hash, rol, biografia, banner_url)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
          `, [
            'Admin CineRewind',
            'admin',
            'admin@cinerewind.com',
            passHash,
            'admin',
            'Cuenta administradora por defecto de CineRewind.',
            'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1600&q=80'
          ]);
          console.log('[Database] Seeded default user: admin@cinerewind.com / admin123');
        } else {
          // If any user has null banner_url, set default cinema banner
          await db.query(`
            UPDATE usuarios 
            SET banner_url = 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1600&q=80'
            WHERE banner_url IS NULL
          `);
        }
      } catch (seedErr) {
        console.warn('[Database] Seeding notice:', seedErr.message);
      }

      pgliteInstance = db;
      eventListeners.connect.forEach((cb) => cb(db));
      return db;
    } catch (err) {
      console.error('[Database] Failed to initialize PGlite:', err.message);
      throw err;
    }
  })();

  return pgliteInitPromise;
}

// Unified Pool interface
const pool = {
  query: async (text, params = []) => {
    if (activeEngine === 'pg' && realPool) {
      try {
        return await realPool.query(text, params);
      } catch (err) {
        // If external postgres connection refused/failed, switch to PGlite
        if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND' || err.message.includes('connect')) {
          console.warn('[Database] External Postgres unreachable, switching to in-memory PGlite:', err.message);
          activeEngine = 'pglite';
          const pglite = await getPGlite();
          return await pglite.query(text, params);
        }
        throw err;
      }
    }

    const pglite = await getPGlite();
    return await pglite.query(text, params);
  },

  connect: async () => {
    if (activeEngine === 'pg' && realPool) {
      try {
        return await realPool.connect();
      } catch (err) {
        console.warn('[Database] External Postgres connect failed, switching to PGlite:', err.message);
        activeEngine = 'pglite';
      }
    }

    const pglite = await getPGlite();
    return {
      query: (t, p) => pglite.query(t, p),
      release: () => {},
    };
  },

  on: (event, callback) => {
    if (eventListeners[event]) {
      eventListeners[event].push(callback);
    }
    if (realPool) {
      realPool.on(event, callback);
    }
  },
};

// Warm up DB in background only if using PGlite
if (activeEngine === 'pglite') {
  getPGlite().catch(() => {});
}

module.exports = pool;