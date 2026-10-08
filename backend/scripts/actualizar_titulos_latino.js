require('dotenv').config();
const axios = require('axios');
const pool = require('../config/db');

const TMDB_API_KEY = process.env.TMDB_API_KEY;

async function actualizarTitulos() {
  console.log('Iniciando sincronización de títulos a Español Latino (es-MX)...');
  const res = await pool.query(`
    SELECT id, tmdb_id, tipo, titulo 
    FROM obras_catalogo 
    WHERE tmdb_id IS NOT NULL 
    ORDER BY id ASC
  `);

  const obras = res.rows;
  console.log(`Encontradas ${obras.length} obras para revisar.`);

  let actualizados = 0;

  for (const obra of obras) {
    try {
      const endpoint = obra.tipo === 'serie' ? 'tv' : 'movie';
      const url = `https://api.themoviedb.org/3/${endpoint}/${obra.tmdb_id}?api_key=${TMDB_API_KEY}&language=es-MX`;
      
      const resTmdb = await axios.get(url, { timeout: 4000 });
      const tituloLatino = obra.tipo === 'serie' ? resTmdb.data.name : resTmdb.data.title;

      if (tituloLatino && tituloLatino.trim() && tituloLatino.trim() !== obra.titulo.trim()) {
        console.log(`[CAMBIO] "${obra.titulo}" -> "${tituloLatino}" (ID: ${obra.id}, TMDb: ${obra.tmdb_id})`);
        await pool.query(`UPDATE obras_catalogo SET titulo = $1 WHERE id = $2`, [tituloLatino.trim(), obra.id]);
        actualizados++;
      }
      // Small pause to be polite with TMDb rate limits
      await new Promise(r => setTimeout(r, 60));
    } catch (err) {
      console.warn(`Error al obtener TMDb para obra ${obra.id} (${obra.titulo}):`, err.message);
    }
  }

  console.log(`\n¡Sincronización completada! Se actualizaron ${actualizados} títulos a Español Latino.`);
  process.exit(0);
}

actualizarTitulos().catch(err => {
  console.error('Error fatal:', err);
  process.exit(1);
});
