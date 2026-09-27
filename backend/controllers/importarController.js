const pool = require('../config/db');

// 1. Limpieza de texto (sin tildes, signos ni espacios extra)
function limpiarTexto(str) {
  if (!str) return '';
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// 2. Diccionario de alias conocidos para evitar confusiones de búsqueda en TMDb
const ALIAS_TITULOS = {
  'dr. house': 'House',
  'dr house': 'House',
  'la ley y el orden: unidad de victimas especiales': 'Law & Order: Special Victims Unit',
  'la ley y el orden: unidad de víctimas especiales': 'Law & Order: Special Victims Unit',
  'el juego del calamar': 'Squid Game'
};

// 3. Consultar obra en TMDb con alias y fallback
async function buscarObraEnTMDb(titulo, tipoSugerido) {
  const TMDB_API_KEY = process.env.TMDB_API_KEY;
  if (!TMDB_API_KEY) return null;

  const tituloLimpio = titulo.toLowerCase().trim();
  const queryFinal = ALIAS_TITULOS[tituloLimpio] || titulo;

  const buscarTipo = async (tipo) => {
    try {
      const endpoint = tipo === 'serie' ? 'search/tv' : 'search/movie';
      const url = `https://api.themoviedb.org/3/${endpoint}?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(queryFinal)}&language=es-ES`;
      const res = await fetch(url);
      if (!res.ok) return null;
      const data = await res.json();

      if (data.results && data.results.length > 0) {
        let elegido = data.results[0];

        // Forzar selección exacta si se busca House
        if (queryFinal.toLowerCase() === 'house') {
          const matchHouse = data.results.find(
            (r) => (r.name || r.title || '').toLowerCase() === 'house'
          );
          if (matchHouse) elegido = matchHouse;
        }

        return {
          tmdb_id: elegido.id,
          tipo: tipo,
          titulo: elegido.title || elegido.name || titulo,
          poster_path: elegido.poster_path
        };
      }
    } catch {
      return null;
    }
    return null;
  };

  let resultado = await buscarTipo(tipoSugerido);
  if (!resultado) {
    resultado = await buscarTipo(tipoSugerido === 'serie' ? 'pelicula' : 'serie');
  }
  return resultado;
}

// 4. Traer lista completa de episodios de la temporada (en inglés y español)
async function obtenerEpisodiosDeTemporada(tmdb_id, temporada) {
  const TMDB_API_KEY = process.env.TMDB_API_KEY;
  if (!TMDB_API_KEY || !tmdb_id || !temporada) return [];

  try {
    const urlEn = `https://api.themoviedb.org/3/tv/${tmdb_id}/season/${temporada}?api_key=${TMDB_API_KEY}&language=en-US`;
    const resEn = await fetch(urlEn);
    const dataEn = resEn.ok ? await resEn.json() : { episodes: [] };

    const urlEs = `https://api.themoviedb.org/3/tv/${tmdb_id}/season/${temporada}?api_key=${TMDB_API_KEY}&language=es-ES`;
    const resEs = await fetch(urlEs);
    const dataEs = resEs.ok ? await resEs.json() : { episodes: [] };

    const listaEn = dataEn.episodes || [];
    const listaEs = dataEs.episodes || [];

    return listaEn.map((ep, idx) => {
      const epEs = listaEs[idx] || {};
      return {
        numero: ep.episode_number,
        nombreEn: limpiarTexto(ep.name),
        nombreEs: limpiarTexto(epEs.name || '')
      };
    });
  } catch {
    return [];
  }
}

// 5. Formatear Fecha de CSV (MM/DD/YY o DD/MM/YY) a YYYY-MM-DD
function parsearFechaNetflix(fechaStr) {
  if (!fechaStr) return new Date().toISOString().split('T')[0];
  const limpia = fechaStr.replace(/"/g, '').trim();
  const partes = limpia.split('/');
  if (partes.length === 3) {
    let mes = partes[0].padStart(2, '0');
    let dia = partes[1].padStart(2, '0');
    let anio = partes[2];
    if (parseInt(partes[0], 10) > 12) {
      dia = partes[0].padStart(2, '0');
      mes = partes[1].padStart(2, '0');
    }
    if (anio.length === 2) {
      anio = parseInt(anio, 10) > 50 ? `19${anio}` : `20${anio}`;
    }
    return `${anio}-${mes}-${dia}`;
  }
  return new Date().toISOString().split('T')[0];
}

// 6. Desarmar línea de Netflix
function clasificarFilaNetflix(tituloCompleto) {
  const partes = tituloCompleto.split(':').map((p) => p.trim());

  if (partes.length === 1) {
    return {
      tipo: 'pelicula',
      titulo: partes[0],
      temporada: null,
      nombresEpisodio: [],
      episodioDirecto: null
    };
  }

  const tituloPrincipal = partes[0];
  let temporada = 1;
  let episodioDirecto = null;
  const nombresEpisodio = [];

  for (let i = 1; i < partes.length; i++) {
    const parte = partes[i];

    // Detección de temporada
    const matchTempNum = parte.match(/(?:temporada|season|parte|part|volumen|volume|\b\w+\b)\s*(\d+)/i);
    if (matchTempNum) {
      temporada = parseInt(matchTempNum[1], 10);
      continue;
    }

    if (/first\s*year/i.test(parte)) { temporada = 1; continue; }
    if (/second\s*year/i.test(parte)) { temporada = 2; continue; }
    if (/third\s*year/i.test(parte)) { temporada = 3; continue; }
    if (/fourth\s*year/i.test(parte)) { temporada = 4; continue; }
    if (/fifth\s*year/i.test(parte)) { temporada = 5; continue; }
    if (/sixth\s*year/i.test(parte)) { temporada = 6; continue; }
    if (/miniserie/i.test(parte)) { temporada = 1; continue; }

    // Detección de número explícito de episodio
    const matchCapNum = parte.match(/(?:cap[ií]tulo|episodio|episode|ep\.?)\s*(\d+)/i);
    if (matchCapNum) {
      episodioDirecto = parseInt(matchCapNum[1], 10);
      continue;
    }

    // Números en palabras
    if (/cap[ií]tulo\s+uno\b/i.test(parte)) episodioDirecto = 1;
    else if (/cap[ií]tulo\s+dos\b/i.test(parte)) episodioDirecto = 2;
    else if (/cap[ií]tulo\s+tres\b/i.test(parte)) episodioDirecto = 3;
    else if (/cap[ií]tulo\s+cuatro\b/i.test(parte)) episodioDirecto = 4;
    else if (/cap[ií]tulo\s+cinco\b/i.test(parte)) episodioDirecto = 5;
    else if (/cap[ií]tulo\s+seis\b/i.test(parte)) episodioDirecto = 6;
    else if (/cap[ií]tulo\s+siete\b/i.test(parte)) episodioDirecto = 7;
    else if (/cap[ií]tulo\s+ocho\b/i.test(parte)) episodioDirecto = 8;
    else if (/cap[ií]tulo\s+nueve\b/i.test(parte)) episodioDirecto = 9;
    else if (/cap[ií]tulo\s+diez\b/i.test(parte)) episodioDirecto = 10;
    else {
      nombresEpisodio.push(parte);
    }
  }

  return {
    tipo: 'serie',
    titulo: tituloPrincipal,
    temporada,
    nombresEpisodio,
    episodioDirecto
  };
}

// Memoria de sesión para deducir secuencias decrecientes (Netflix lee del más nuevo al más viejo)
const memoriaUltimoEpisodio = new Map();

// 7. Comparación bilingüe con fallback secuencial
function resolverNumeroEpisodio(nombresEpisodio, listaEpisodiosTmdb, claveSecuencia) {
  // A. Coincidencias en TMDb
  if (nombresEpisodio.length && listaEpisodiosTmdb.length) {
    for (const nombre of nombresEpisodio) {
      const limpio = limpiarTexto(nombre);
      if (!limpio) continue;

      // 1. Probar en Inglés
      const matchEn = listaEpisodiosTmdb.find(
        (ep) =>
          ep.nombreEn === limpio ||
          (limpio.length > 3 && ep.nombreEn.includes(limpio)) ||
          (ep.nombreEn.length > 3 && limpio.includes(ep.nombreEn))
      );
      if (matchEn) {
        memoriaUltimoEpisodio.set(claveSecuencia, matchEn.numero);
        return matchEn.numero;
      }

      // 2. Probar en Español
      const matchEs = listaEpisodiosTmdb.find(
        (ep) =>
          ep.nombreEs === limpio ||
          (limpio.length > 3 && ep.nombreEs.includes(limpio)) ||
          (ep.nombreEs.length > 3 && limpio.includes(ep.nombreEs))
      );
      if (matchEs) {
        memoriaUltimoEpisodio.set(claveSecuencia, matchEs.numero);
        return matchEs.numero;
      }
    }
  }

  // B. Casos especiales frecuentes
  const total = nombresEpisodio.join(' ').toLowerCase();
  if (total.includes('broken') && total.includes('parte 2')) return 2;
  if (total.includes('broken') && total.includes('parte 1')) return 1;
  if (total.includes('euphoria') && total.includes('parte 2')) return 21;
  if (total.includes('euphoria') && total.includes('parte 1')) return 20;

  // C. Inferencia secuencial: si veníamos de un episodio mayor, deducir el anterior
  if (memoriaUltimoEpisodio.has(claveSecuencia)) {
    const ultimoVisto = memoriaUltimoEpisodio.get(claveSecuencia);
    if (ultimoVisto > 1) {
      const deducido = ultimoVisto - 1;
      memoriaUltimoEpisodio.set(claveSecuencia, deducido);
      return deducido;
    }
  }

  return 1;
}

// 8. Controlador por lotes principal
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
    if (!linea || !linea.trim()) continue;

    const ultimaComa = linea.lastIndexOf(',');
    if (ultimaComa === -1) continue;

    const rawTitulo = linea.substring(0, ultimaComa).replace(/^"|"$/g, '').trim();
    const rawFecha = linea.substring(ultimaComa + 1).replace(/^"|"$/g, '').trim();
    if (!rawTitulo) continue;

    const obraInfo = clasificarFilaNetflix(rawTitulo);
    const fechaVisto = parsearFechaNetflix(rawFecha);

    try {
      // 1. Obtener o crear obra en catálogo local
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
          const porTmdb = await pool.query(
            'SELECT id, tmdb_id, tipo FROM obras_catalogo WHERE tmdb_id = $1 LIMIT 1',
            [datosTmdb.tmdb_id]
          );

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

      // 2. Determinar número de episodio
      let numeroEpisodio = obraInfo.episodioDirecto;
      const claveSecuencia = `${usuarioId}_${obraId}_T${obraInfo.temporada}`;

      if (tipoFinal === 'serie' && !numeroEpisodio && tmdbId && obraInfo.temporada) {
        const claveTemporada = `${tmdbId}_T${obraInfo.temporada}`;
        let listaEpisodios = cacheTemporadas.get(claveTemporada);

        if (!listaEpisodios) {
          listaEpisodios = await obtenerEpisodiosDeTemporada(tmdbId, obraInfo.temporada);
          cacheTemporadas.set(claveTemporada, listaEpisodios);
        }

        numeroEpisodio = resolverNumeroEpisodio(
          obraInfo.nombresEpisodio,
          listaEpisodios,
          claveSecuencia
        );
      } else if (numeroEpisodio) {
        memoriaUltimoEpisodio.set(claveSecuencia, numeroEpisodio);
      }

      if (tipoFinal === 'serie' && !numeroEpisodio) {
        numeroEpisodio = 1;
      }

      // 3. Verificación Anti-Duplicados (mismo episodio el mismo día)
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

      // 4. Inserción en historial
      await pool.query(
        `INSERT INTO historial_visualizaciones 
           (usuario_id, obra_id, temporada, episodio, fecha_visto, plataforma)
         VALUES ($1, $2, $3, $4, $5, 'Netflix')`,
        [
          usuarioId,
          obraId,
          tipoFinal === 'serie' ? obraInfo.temporada : null,
          tipoFinal === 'serie' ? numeroEpisodio : null,
          fechaVisto
        ]
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