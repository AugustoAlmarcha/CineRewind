// backend/scripts/backfill_series.js
const { Pool } = require('pg');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ...(process.env.DATABASE_URL
    ? {
        ssl:
          process.env.NODE_ENV === 'production' ||
          process.env.DATABASE_URL.includes('sslmode') ||
          process.env.DATABASE_URL.includes('neon.tech')
            ? { rejectUnauthorized: false }
            : false,
      }
    : {
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        host: process.env.DB_HOST,
        port: process.env.DB_PORT || 5432,
        database: process.env.DB_NAME,
        ssl: false,
      }),
});

const TMDB_API_KEY = process.env.TMDB_API_KEY;

async function backfill() {
  console.log('Iniciando sincronización de metadatos de series...');
  const res = await pool.query(
    "SELECT id, tmdb_id, titulo FROM obras_catalogo WHERE tipo = 'serie' AND (total_temporadas IS NULL OR seasons_info IS NULL)"
  );

  console.log(`Encontradas ${res.rows.length} series pendientes de metadatos.`);

  for (let i = 0; i < res.rows.length; i++) {
    const row = res.rows[i];
    if (!row.tmdb_id) continue;

    try {
      const url = `https://api.themoviedb.org/3/tv/${row.tmdb_id}?api_key=${TMDB_API_KEY}&language=es-MX`;
      const tmdbRes = await fetch(url);
      if (!tmdbRes.ok) {
        console.warn(`[${i + 1}/${res.rows.length}] No se pudo obtener TMDb para ${row.titulo} (${row.tmdb_id})`);
        continue;
      }

      const data = await tmdbRes.json();
      const seasonsData = (data.seasons || [])
        .filter((s) => s.season_number > 0)
        .map((s) => ({
          temporada: s.season_number,
          episodios: s.episode_count,
          nombre: s.name,
        }));

      await pool.query(
        `UPDATE obras_catalogo 
         SET total_temporadas = $1, total_episodios = $2, estado_serie = $3, seasons_info = $4 
         WHERE id = $5`,
        [data.number_of_seasons || seasonsData.length, data.number_of_episodes || null, data.status || null, JSON.stringify(seasonsData), row.id]
      );

      console.log(`[${i + 1}/${res.rows.length}] ✓ ${row.titulo}: ${data.number_of_seasons} temps, ${data.number_of_episodes} eps (${data.status})`);
      // Pequeño delay de 50ms para no saturar rate limit
      await new Promise((r) => setTimeout(r, 60));
    } catch (err) {
      console.error(`Error procesando ${row.titulo}:`, err.message);
    }
  }

  console.log('¡Sincronización finalizada exitosamente!');
  await pool.end();
}

backfill().catch((e) => {
  console.error('Error fatal en backfill:', e);
  process.exit(1);
});
