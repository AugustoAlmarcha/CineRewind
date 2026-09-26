const pool = require('../config/db'); // Ajusta a la ruta de tu db.js

// 1. Consultar obra en TMDb (con fallback serie <-> pelicula)
async function buscarObraEnTMDb(titulo, tipoSugerido) {
  const TMDB_API_KEY = process.env.TMDB_API_KEY;
  if (!TMDB_API_KEY) return null;

  const buscarTipo = async (tipo) => {
    try {
      const endpoint = tipo === 'serie' ? 'search/tv' : 'search/movie';
      const url = `https://api.themoviedb.org/3/${endpoint}?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(titulo)}&language=es-ES`;
      const res = await fetch(url);
      if (!res.ok) return null;
      const data = await res.json();
      if (data.results && data.results.length > 0) {
        const top = data.results[0];
        return {
          tmdb_id: top.id,
          tipo: tipo,
          titulo: top.title || top.name || titulo,
          poster_path: top.poster_path
        };
      }
    } catch {
      return null;
    }
    return null;
  };

  // Intentar con el tipo sugerido primero
  let resultado = await buscarTipo(tipoSugerido);

  // Si no se encontró, probar con el tipo contrario
  if (!resultado) {
    const alternativo = tipoSugerido === 'serie' ? 'pelicula' : 'serie';
    resultado = await buscarTipo(alternativo);
  }

  return resultado;
}

// 2. Traer capítulos de una temporada en español e inglés
async function obtenerEpisodiosDeTemporada(tmdb_id, temporada) {
  const TMDB_API_KEY = process.env.TMDB_API_KEY;
  if (!TMDB_API_KEY || !tmdb_id || !temporada) return [];

  try {
    const urlEs = `https://api.themoviedb.org/3/tv/${tmdb_id}/season/${temporada}?api_key=${TMDB_API_KEY}&language=es-ES`;
    const resEs = await fetch(urlEs);
    if (!resEs.ok) return [];
    const dataEs = await resEs.json();

    const urlEn = `https://api.themoviedb.org/3/tv/${tmdb_id}/season/${temporada}?api_key=${TMDB_API_KEY}&language=en-US`;
    const resEn = await fetch(urlEn);
    const dataEn = resEn.ok ? await resEn.json() : { episodes: [] };

    return (dataEs.episodes || []).map((ep, idx) => {
      const epEn = dataEn.episodes ? dataEn.episodes[idx] : null;
      return {
        numero: ep.episode_number,
        nombreEs: ep.name ? ep.name.toLowerCase() : '',
        nombreEn: epEn && epEn.name ? epEn.name.toLowerCase() : ''
      };
    });
  } catch {
    return [];
  }
}

// 3. Formatear Fecha "9/24/26" a "2026-09-24"
function parsearFechaNetflix(fechaStr) {
  if (!fechaStr) return new Date().toISOString().split('T')[0];
  const partes = fechaStr.replace(/"/g, '').trim().split('/');
  if (partes.length === 3) {
    const mes = partes[0].padStart(2, '0');
    const dia = partes[1].padStart(2, '0');
    let anio = partes[2];
    if (anio.length === 2) {
      anio = parseInt(anio, 10) > 50 ? `19${anio}` : `20${anio}`;
    }
    return `${anio}-${mes}-${dia}`;
  }
  return new Date().toISOString().split('T')[0];
}

// 4. Analizador flexible para cualquier formato de Netflix
function clasificarFilaNetflix(tituloCompleto) {
  const partes = tituloCompleto.split(':').map((p) => p.trim());

  // Si no tiene ':', es una película directa
  if (partes.length === 1) {
    return {
      tipo: 'pelicula',
      titulo: partes[0],
      temporada: null,
      nombreEpisodio: null,
      episodioDirecto: null
    };
  }

  // Si tiene ':', la primera parte es el título de la obra
  const tituloPrincipal = partes[0];
  let temporada = 1;
  let nombreEpisodio = partes[partes.length - 1];
  let episodioDirecto = null;

  for (let i = 1; i < partes.length; i++) {
    const parte = partes[i];

    // Detección de temporada
    const matchTempNum = parte.match(/(?:temporada|season|parte|part|volumen|volume|\b\w+\b)\s*(\d+)/i);
    if (matchTempNum) {
      temporada = parseInt(matchTempNum[1], 10);
    } else if (/first\s*year/i.test(parte)) temporada = 1;
    else if (/second\s*year/i.test(parte)) temporada = 2;
    else if (/third\s*year/i.test(parte)) temporada = 3;
    else if (/fourth\s*year/i.test(parte)) temporada = 4;
    else if (/fifth\s*year/i.test(parte)) temporada = 5;
    else if (/sixth\s*year/i.test(parte)) temporada = 6;

    // Detección de número de episodio directo o en texto
    const matchCapNum = parte.match(/(?:capítulo|capitulo|episodio|episode|cap\.)\s*(\d+)/i);
    if (matchCapNum) {
      episodioDirecto = parseInt(matchCapNum[1], 10);
    } else {
      if (/capítulo\s+uno\b/i.test(parte)) episodioDirecto = 1;
      else if (/capítulo\s+dos\b/i.test(parte)) episodioDirecto = 2;
      else if (/capítulo\s+tres\b/i.test(parte)) episodioDirecto = 3;
      else if (/capítulo\s+cuatro\b/i.test(parte)) episodioDirecto = 4;
      else if (/capítulo\s+cinco\b/i.test(parte)) episodioDirecto = 5;
      else if (/capítulo\s+seis\b/i.test(parte)) episodioDirecto = 6;
      else if (/capítulo\s+siete\b/i.test(parte)) episodioDirecto = 7;
      else if (/capítulo\s+ocho\b/i.test(parte)) episodioDirecto = 8;
      else if (/capítulo\s+nueve\b/i.test(parte)) episodioDirecto = 9;
      else if (/capítulo\s+diez\b/i.test(parte)) episodioDirecto = 10;
    }
  }

  return {
    tipo: 'serie',
    titulo: tituloPrincipal,
    temporada,
    nombreEpisodio,
    episodioDirecto
  };
}

// 5. Comparar nombre del episodio contra TMDb
function resolverNumeroEpisodio(nombreEpisodio, listaEpisodiosTmdb) {
  if (!nombreEpisodio || !listaEpisodiosTmdb.length) return null;
  const nombreLimpio = nombreEpisodio.toLowerCase().replace(/^(parte|part)\s*\d+:\s*/i, '').trim();

  const encontrado = listaEpisodiosTmdb.find((ep) => {
    return (
      ep.nombreEs.includes(nombreLimpio) ||
      ep.nombreEn.includes(nombreLimpio) ||
      nombreLimpio.includes(ep.nombreEs) ||
      nombreLimpio.includes(ep.nombreEn)
    );
  });

  return encontrado ? encontrado.numero : null;
}

// 6. Controlador principal por lotes
const importarLoteCSV = async (req, res) => {
  const usuarioId = req.usuario?.id;
  if (!usuarioId) return res.status(401).json({ error: 'No autorizado' });

  const { lineas } = req.body;
  if (!lineas || !Array.isArray(lineas)) {
    return res.status(400).json({ error: 'Datos no válidos' });
  }

  let importados = 0;
  let omitidos = 0;
  let fallidos = [];

  const cacheTemporadas = new Map();

  for (const linea of lineas) {
    const partes = linea.match(/^(?:"([^"]+)"|([^,]+)),(?:"([^"]+)"|([^,]+))$/);
    if (!partes) continue;

    const rawTitulo = (partes[1] || partes[2] || '').trim();
    const rawFecha = (partes[3] || partes[4] || '').trim();
    if (!rawTitulo) continue;

    const obraInfo = clasificarFilaNetflix(rawTitulo);
    const fechaVisto = parsearFechaNetflix(rawFecha);

    try {
      // 1. Obtener Obra (Catálogo local o TMDb)
      let obraRes = await pool.query(
        'SELECT id, tmdb_id, tipo FROM obras_catalogo WHERE LOWER(titulo) = LOWER($1) LIMIT 1',
        [obraInfo.titulo]
      );

      let obraId = obraRes.rows[0]?.id;
      let tmdbId = obraRes.rows[0]?.tmdb_id;
      let tipoFinal = obraRes.rows[0]?.tipo || obraInfo.tipo;

      if (!obraId) {
        const datosTmdb = await buscarObraEnTMDb(obraInfo.titulo, obraInfo.tipo);
        if (datosTmdb) {
          tipoFinal = datosTmdb.tipo;
          const porTmdb = await pool.query('SELECT id, tmdb_id, tipo FROM obras_catalogo WHERE tmdb_id = $1 LIMIT 1', [datosTmdb.tmdb_id]);
          if (porTmdb.rows.length > 0) {
            obraId = porTmdb.rows[0].id;
            tmdbId = porTmdb.rows[0].tmdb_id;
            tipoFinal = porTmdb.rows[0].tipo;
          } else {
            const nueva = await pool.query(
              `INSERT INTO obras_catalogo (tmdb_id, tipo, titulo, poster_path)
               VALUES ($1, $2, $3, $4) RETURNING id, tmdb_id, tipo`,
              [datosTmdb.tmdb_id, datosTmdb.tipo, datosTmdb.titulo, datosTmdb.poster_path]
            );
            obraId = nueva.rows[0].id;
            tmdbId = nueva.rows[0].tmdb_id;
          }
        }
      }

      if (!obraId) {
        omitidos++;
        fallidos.push(obraInfo.titulo);
        continue;
      }

      // 2. Determinar número de episodio real si es una serie
      let numeroEpisodio = obraInfo.episodioDirecto;

      if (tipoFinal === 'serie' && !numeroEpisodio && tmdbId && obraInfo.temporada) {
        const claveTemporada = `${tmdbId}_T${obraInfo.temporada}`;
        let listaEpisodios = cacheTemporadas.get(claveTemporada);

        if (!listaEpisodios) {
          listaEpisodios = await obtenerEpisodiosDeTemporada(tmdbId, obraInfo.temporada);
          cacheTemporadas.set(claveTemporada, listaEpisodios);
        }

        numeroEpisodio = resolverNumeroEpisodio(obraInfo.nombreEpisodio, listaEpisodios);
      }

      if (tipoFinal === 'serie' && !numeroEpisodio) {
        numeroEpisodio = 1;
      }

      // 3. Verificación Anti-Duplicados
      let existe = false;

      if (tipoFinal === 'serie') {
        const check = await pool.query(
          `SELECT id FROM historial_visualizaciones 
           WHERE usuario_id = $1 
             AND obra_id = $2 
             AND temporada = $3 
             AND episodio = $4 
             AND fecha_visto = $5 
           LIMIT 1`,
          [usuarioId, obraId, obraInfo.temporada, numeroEpisodio, fechaVisto]
        );
        existe = check.rows.length > 0;
      } else {
        const check = await pool.query(
          `SELECT id FROM historial_visualizaciones 
           WHERE usuario_id = $1 
             AND obra_id = $2 
             AND fecha_visto = $3 
           LIMIT 1`,
          [usuarioId, obraId, fechaVisto]
        );
        existe = check.rows.length > 0;
      }

      if (existe) {
        omitidos++;
        continue;
      }

      // 4. Inserción en historial_visualizaciones
      await pool.query(
        `INSERT INTO historial_visualizaciones 
           (usuario_id, obra_id, temporada, episodio, fecha_visto, plataforma)
         VALUES ($1, $2, $3, $4, $5, 'Netflix')`,
        [usuarioId, obraId, tipoFinal === 'serie' ? obraInfo.temporada : null, tipoFinal === 'serie' ? numeroEpisodio : null, fechaVisto]
      );
      importados++;

    } catch (err) {
      console.error('Error insertando fila:', err.message);
      omitidos++;
      fallidos.push(obraInfo.titulo);
    }
  }

  res.json({ importados, omitidos, fallidos });
};

module.exports = { importarLoteCSV };