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

// 2. Coeficiente de Sørensen–Dice para Fuzzy Matching (Similitud aproximada)
function calcularSimilitud(str1, str2) {
  if (!str1 || !str2) return 0;
  const s1 = limpiarTexto(str1);
  const s2 = limpiarTexto(str2);
  if (s1 === s2) return 1.0;
  if (!s1 || !s2) return 0;

  // Si una contiene a la otra directamente
  if ((s1.length > 3 && s2.includes(s1)) || (s2.length > 3 && s1.includes(s2))) {
    const minLen = Math.min(s1.length, s2.length);
    const maxLen = Math.max(s1.length, s2.length);
    return Math.max(0.85, minLen / maxLen);
  }

  // Generación de bigramas
  const getBigrams = (str) => {
    const s = str.replace(/\s+/g, '');
    const bigrams = new Set();
    for (let i = 0; i < s.length - 1; i++) {
      bigrams.add(s.substring(i, i + 2));
    }
    return bigrams;
  };

  const b1 = getBigrams(s1);
  const b2 = getBigrams(s2);
  if (b1.size === 0 || b2.size === 0) return 0;

  let intersection = 0;
  for (const item of b1) {
    if (b2.has(item)) intersection++;
  }

  return (2 * intersection) / (b1.size + b2.size);
}

// 3. Diccionario de alias conocidos para evitar confusiones de búsqueda en TMDb
const ALIAS_TITULOS = {
  'dr. house': 'House',
  'dr house': 'House',
  'la ley y el orden: unidad de victimas especiales': 'Law & Order: Special Victims Unit',
  'la ley y el orden: unidad de víctimas especiales': 'Law & Order: Special Victims Unit',
  'el juego del calamar': 'Squid Game',
};

// 4. Consultar obra en TMDb con alias y fallback
async function buscarObraEnTMDb(titulo, tipoSugerido) {
  const TMDB_API_KEY = process.env.TMDB_API_KEY;
  if (!TMDB_API_KEY || !titulo || !titulo.trim()) return null;

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

// 5. Traer lista completa de episodios de la temporada (en inglés y español con nombres originales)
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
        nombreEs: limpiarTexto(epEs.name || ''),
        nombreEnOriginal: ep.name || '',
        nombreEsOriginal: epEs.name || ep.name || ''
      };
    });
  } catch {
    return [];
  }
}

// 6. Formatear Fecha de CSV (MM/DD/YY o DD/MM/YY) a YYYY-MM-DD
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

// 7. Desarmar línea de Netflix
function clasificarFilaNetflix(tituloCompleto) {
  if (!tituloCompleto || !tituloCompleto.trim()) return null;

  const partes = tituloCompleto.split(':').map((p) => p.trim());
  if (!partes[0]) return null;

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
  let temporada = null;
  let temporadaYaEncontrada = false;
  let episodioDirecto = null;
  const nombresEpisodio = [];

  for (let i = 1; i < partes.length; i++) {
    const parte = partes[i];

    // Detección de temporada (solo si aún no se detectó una)
    if (!temporadaYaEncontrada) {
      const matchTempNum = parte.match(/(?:temporada|season|parte|part|volumen|volume)\s*(\d+)/i);
      if (matchTempNum) {
        temporada = parseInt(matchTempNum[1], 10);
        temporadaYaEncontrada = true;
        continue;
      }

      if (/first\s*year/i.test(parte)) { temporada = 1; temporadaYaEncontrada = true; continue; }
      if (/second\s*year/i.test(parte)) { temporada = 2; temporadaYaEncontrada = true; continue; }
      if (/third\s*year/i.test(parte)) { temporada = 3; temporadaYaEncontrada = true; continue; }
      if (/fourth\s*year/i.test(parte)) { temporada = 4; temporadaYaEncontrada = true; continue; }
      if (/fifth\s*year/i.test(parte)) { temporada = 5; temporadaYaEncontrada = true; continue; }
      if (/sixth\s*year/i.test(parte)) { temporada = 6; temporadaYaEncontrada = true; continue; }
      if (/miniserie/i.test(parte)) { temporada = 1; temporadaYaEncontrada = true; continue; }
    }

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
    temporada: temporadaYaEncontrada ? temporada : null,
    temporadaDetectada: temporadaYaEncontrada,
    nombresEpisodio,
    episodioDirecto
  };
}

// Memoria de sesión inteligente: mapea usuario_obra -> { ultimaTemp, ultimoEp, ultimaFecha }
const memoriaSecuenciaImportacion = new Map();

// Buscar un episodio en TODAS las temporadas de la serie en TMDb (si Netflix no especificó temporada)
async function buscarEpisodioEnTodasLasTemporadas(tmdbId, nombresEpisodio, cacheTemporadas) {
  if (!tmdbId || !nombresEpisodio || nombresEpisodio.length === 0) return null;

  try {
    const TMDB_API_KEY = process.env.TMDB_API_KEY;
    const urlDetalle = `https://api.themoviedb.org/3/tv/${tmdbId}?api_key=${TMDB_API_KEY}&language=es-MX`;
    const resDetalle = await fetch(urlDetalle);
    if (!resDetalle.ok) return null;
    const datosSerie = await resDetalle.json();
    const temporadas = (datosSerie.seasons || []).filter((s) => s.season_number > 0);

    for (const t of temporadas) {
      const tempNum = t.season_number;
      const claveCache = `${tmdbId}_T${tempNum}`;
      let episodiosTemp = cacheTemporadas.get(claveCache);
      if (!episodiosTemp) {
        episodiosTemp = await obtenerEpisodiosDeTemporada(tmdbId, tempNum);
        cacheTemporadas.set(claveCache, episodiosTemp);
      }

      for (const nombre of nombresEpisodio) {
        const limpio = limpiarTexto(nombre);
        if (!limpio) continue;

        for (const ep of episodiosTemp) {
          if (ep.nombreEn === limpio || ep.nombreEs === limpio) {
            return {
              temporada: tempNum,
              episodio: ep.numero,
              confianza: 'alta',
              nombreEpisodio: ep.nombreEsOriginal || ep.nombreEnOriginal || nombre
            };
          }
          const sim = Math.max(calcularSimilitud(limpio, ep.nombreEn), calcularSimilitud(limpio, ep.nombreEs));
          if (sim >= 0.75) {
            return {
              temporada: tempNum,
              episodio: ep.numero,
              confianza: sim >= 0.85 ? 'alta' : 'media',
              nombreEpisodio: ep.nombreEsOriginal || ep.nombreEnOriginal || nombre
            };
          }
        }
      }
    }
  } catch {
    return null;
  }
  return null;
}

// 8. Comparación bilingüe con Fuzzy Matching y fallback secuencial progresivo
function resolverNumeroEpisodio(nombresEpisodio, listaEpisodiosTmdb, claveSecuencia, sugerenciaAnterior = null) {
  let mejorMatch = null;
  let maxSimilitud = 0;

  if (nombresEpisodio.length && listaEpisodiosTmdb.length) {
    for (const nombre of nombresEpisodio) {
      const limpio = limpiarTexto(nombre);
      if (!limpio) continue;

      for (const ep of listaEpisodiosTmdb) {
        if (ep.nombreEn === limpio || ep.nombreEs === limpio) {
          memoriaSecuenciaImportacion.set(claveSecuencia, ep.numero);
          return {
            numero: ep.numero,
            confianza: 'alta',
            nombreEpisodio: ep.nombreEsOriginal || ep.nombreEnOriginal || nombre
          };
        }

        const simEn = calcularSimilitud(limpio, ep.nombreEn);
        if (simEn > maxSimilitud) {
          maxSimilitud = simEn;
          mejorMatch = ep;
        }

        const simEs = calcularSimilitud(limpio, ep.nombreEs);
        if (simEs > maxSimilitud) {
          maxSimilitud = simEs;
          mejorMatch = ep;
        }
      }
    }

    if (maxSimilitud >= 0.70 && mejorMatch) {
      memoriaSecuenciaImportacion.set(claveSecuencia, mejorMatch.numero);
      return {
        numero: mejorMatch.numero,
        confianza: maxSimilitud >= 0.85 ? 'alta' : 'media',
        nombreEpisodio: mejorMatch.nombreEsOriginal || mejorMatch.nombreEnOriginal || nombresEpisodio[0]
      };
    }
  }

  // Casos especiales frecuentes
  const total = nombresEpisodio.join(' ').toLowerCase();
  if (total.includes('broken') && total.includes('parte 2')) return { numero: 2, confianza: 'media', nombreEpisodio: 'Broken: Parte 2' };
  if (total.includes('broken') && total.includes('parte 1')) return { numero: 1, confianza: 'alta', nombreEpisodio: 'Broken: Parte 1' };
  if (total.includes('euphoria') && total.includes('parte 2')) return { numero: 21, confianza: 'media', nombreEpisodio: 'Euphoria: Parte 2' };
  if (total.includes('euphoria') && total.includes('parte 1')) return { numero: 20, confianza: 'alta', nombreEpisodio: 'Euphoria: Parte 1' };

  // Inferencia secuencial progresiva (avanza 1, 2, 3... en vez de quedarse clavado en 1)
  if (memoriaSecuenciaImportacion.has(claveSecuencia)) {
    const ultimoVisto = memoriaSecuenciaImportacion.get(claveSecuencia);
    const siguiente = (ultimoVisto || 0) + 1;
    memoriaSecuenciaImportacion.set(claveSecuencia, siguiente);
    return {
      numero: siguiente,
      confianza: 'media',
      nombreEpisodio: nombresEpisodio[0] || `Episodio ${siguiente}`
    };
  }

  // Si hay sugerencia anterior en la misma racha
  if (sugerenciaAnterior && sugerenciaAnterior > 0) {
    const siguiente = sugerenciaAnterior + 1;
    memoriaSecuenciaImportacion.set(claveSecuencia, siguiente);
    return {
      numero: siguiente,
      confianza: 'media',
      nombreEpisodio: nombresEpisodio[0] || `Episodio ${siguiente}`
    };
  }

  memoriaSecuenciaImportacion.set(claveSecuencia, 1);
  return {
    numero: 1,
    confianza: 'baja',
    nombreEpisodio: nombresEpisodio[0] || 'Episodio 1'
  };
}

// 9. PASO 1: Analizar lote de CSV sin guardar en base de datos (Previsualización)
const analizarLoteCSV = async (req, res) => {
  const usuarioId = req.usuario?.id;
  if (!usuarioId) return res.status(401).json({ error: 'No autorizado' });

  const { lineas } = req.body;
  if (!lineas || !Array.isArray(lineas)) {
    return res.status(400).json({ error: 'Datos no válidos' });
  }

  const cacheTemporadas = new Map();
  const cacheObras = new Map();
  const resultados = [];

  for (let index = 0; index < lineas.length; index++) {
    const linea = lineas[index];
    if (!linea || !linea.trim()) continue;

    const ultimaComa = linea.lastIndexOf(',');
    if (ultimaComa === -1) continue;

    const rawTitulo = linea.substring(0, ultimaComa).replace(/^"|"$/g, '').trim();
    const rawFecha = linea.substring(ultimaComa + 1).replace(/^"|"$/g, '').trim();
    if (!rawTitulo) continue;

    const obraInfo = clasificarFilaNetflix(rawTitulo);
    if (!obraInfo || !obraInfo.titulo) {
      resultados.push({
        id: `row_${Date.now()}_${index}`,
        rawTitulo,
        rawFecha,
        fechaVisto: parsearFechaNetflix(rawFecha),
        obra: null,
        temporada: null,
        episodio: null,
        nombreEpisodio: null,
        estado: 'no_encontrado',
        motivo: 'Título vacío o formato no reconocido'
      });
      continue;
    }

    const fechaVisto = parsearFechaNetflix(rawFecha);

    try {
      // 1. Buscar en cache local o TMDb
      let datosTmdb = cacheObras.get(obraInfo.titulo.toLowerCase());
      if (datosTmdb === undefined) {
        datosTmdb = await buscarObraEnTMDb(obraInfo.titulo, obraInfo.tipo);
        cacheObras.set(obraInfo.titulo.toLowerCase(), datosTmdb);
      }

      if (!datosTmdb) {
        resultados.push({
          id: `row_${Date.now()}_${index}`,
          rawTitulo,
          rawFecha,
          fechaVisto,
          obra: null,
          temporada: null,
          episodio: null,
          nombreEpisodio: null,
          estado: 'no_encontrado',
          motivo: 'No se encontró en la base de datos de películas/series'
        });
        continue;
      }

      // 2. Determinar número de episodio y confianza
      let numeroEpisodio = obraInfo.episodioDirecto;
      let confianza = 'alta';
      let nombreEpisodio = obraInfo.nombresEpisodio[0] || null;

      const claveSecuencia = `${usuarioId}_${datosTmdb.tmdb_id}_T${obraInfo.temporada}`;

      if (datosTmdb.tipo === 'serie' && !numeroEpisodio && obraInfo.temporada) {
        const claveTemporada = `${datosTmdb.tmdb_id}_T${obraInfo.temporada}`;
        let listaEpisodios = cacheTemporadas.get(claveTemporada);

        if (!listaEpisodios) {
          listaEpisodios = await obtenerEpisodiosDeTemporada(datosTmdb.tmdb_id, obraInfo.temporada);
          cacheTemporadas.set(claveTemporada, listaEpisodios);
        }

        const resEp = resolverNumeroEpisodio(
          obraInfo.nombresEpisodio,
          listaEpisodios,
          claveSecuencia
        );
        numeroEpisodio = resEp.numero;
        confianza = resEp.confianza;
        nombreEpisodio = resEp.nombreEpisodio;
      } else if (numeroEpisodio) {
        memoriaUltimoEpisodio.set(claveSecuencia, numeroEpisodio);
        confianza = 'alta';
      }

      if (datosTmdb.tipo === 'serie' && !numeroEpisodio) {
        numeroEpisodio = 1;
        confianza = 'baja';
      }

      // 3. Comprobar si ya existe en la base de datos
      let yaVisto = false;
      const checkSql = datosTmdb.tipo === 'serie'
        ? `SELECT h.id FROM historial_visualizaciones h
           JOIN obras_catalogo o ON h.obra_id = o.id
           WHERE h.usuario_id = $1 AND o.tmdb_id = $2 AND h.temporada = $3 AND h.episodio = $4 AND h.fecha_visto = $5 LIMIT 1`
        : `SELECT h.id FROM historial_visualizaciones h
           JOIN obras_catalogo o ON h.obra_id = o.id
           WHERE h.usuario_id = $1 AND o.tmdb_id = $2 AND h.fecha_visto = $3 LIMIT 1`;

      const checkParams = datosTmdb.tipo === 'serie'
        ? [usuarioId, datosTmdb.tmdb_id, obraInfo.temporada, numeroEpisodio, fechaVisto]
        : [usuarioId, datosTmdb.tmdb_id, fechaVisto];

      const resCheck = await pool.query(checkSql, checkParams);
      yaVisto = resCheck.rows.length > 0;

      // Estado de recomendación
      let estado = 'seguro'; // 🟢
      if (yaVisto) {
        estado = 'ya_visto'; // ⚪
      } else if (confianza === 'baja' || confianza === 'media') {
        estado = 'dudoso'; // 🟡
      }

      resultados.push({
        id: `row_${Date.now()}_${index}`,
        rawTitulo,
        rawFecha,
        fechaVisto,
        obra: datosTmdb,
        temporada: datosTmdb.tipo === 'serie' ? obraInfo.temporada : null,
        episodio: datosTmdb.tipo === 'serie' ? numeroEpisodio : null,
        nombreEpisodio,
        confianza,
        estado
      });

    } catch (err) {
      console.error('Error al analizar línea de CSV:', err.message);
      resultados.push({
        id: `row_${Date.now()}_${index}`,
        rawTitulo,
        rawFecha,
        fechaVisto,
        obra: null,
        temporada: null,
        episodio: null,
        nombreEpisodio: null,
        estado: 'no_encontrado',
        motivo: err.message
      });
    }
  }

  res.json({ analizados: resultados });
};

// 10. PASO 2: Confirmar e Insertar en Lote la Selección Aprobada por el Usuario
const confirmarImportacionCSV = async (req, res) => {
  const usuarioId = req.usuario?.id;
  if (!usuarioId) return res.status(401).json({ error: 'No autorizado' });

  const { items } = req.body;
  if (!items || !Array.isArray(items)) {
    return res.status(400).json({ error: 'Lista de obras no válida' });
  }

  let guardados = 0;
  let omitidos = 0;

  for (const item of items) {
    if (!item.obra || !item.obra.tmdb_id) {
      omitidos++;
      continue;
    }

    try {
      // 1. Obtener o crear obra en catálogo
      let obraRes = await pool.query(
        'SELECT id FROM obras_catalogo WHERE tmdb_id = $1 LIMIT 1',
        [item.obra.tmdb_id]
      );

      let obraId = obraRes.rows[0]?.id;
      if (!obraId) {
        const nueva = await pool.query(
          `INSERT INTO obras_catalogo (tmdb_id, tipo, titulo, poster_path)
           VALUES ($1, $2, $3, $4) RETURNING id`,
          [item.obra.tmdb_id, item.obra.tipo, item.obra.titulo, item.obra.poster_path]
        );
        obraId = nueva.rows[0].id;
      }

      // 2. Verificar duplicado exacto
      const esSerie = item.obra.tipo === 'serie';
      let check = null;

      if (esSerie) {
        check = await pool.query(
          `SELECT id FROM historial_visualizaciones 
           WHERE usuario_id = $1 AND obra_id = $2 AND temporada = $3 AND episodio = $4 AND fecha_visto = $5 LIMIT 1`,
          [usuarioId, obraId, item.temporada, item.episodio, item.fechaVisto]
        );
      } else {
        check = await pool.query(
          `SELECT id FROM historial_visualizaciones 
           WHERE usuario_id = $1 AND obra_id = $2 AND fecha_visto = $3 LIMIT 1`,
          [usuarioId, obraId, item.fechaVisto]
        );
      }

      if (check.rows.length > 0) {
        omitidos++;
        continue;
      }

      // 3. Insertar visualización en historial
      await pool.query(
        `INSERT INTO historial_visualizaciones 
           (usuario_id, obra_id, temporada, episodio, fecha_visto, plataforma)
         VALUES ($1, $2, $3, $4, $5, 'Netflix')`,
        [
          usuarioId,
          obraId,
          esSerie ? item.temporada : null,
          esSerie ? item.episodio : null,
          item.fechaVisto
        ]
      );
      guardados++;

    } catch (err) {
      console.warn(`Error al guardar item ${item.obra?.titulo}:`, err.message);
      omitidos++;
    }
  }

  res.json({
    mensaje: `Se importaron ${guardados} obras exitosamente`,
    guardados,
    omitidos
  });
};

// 11. Controlador legado por lotes directo (conservado por compatibilidad)
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
  let listaOmitidos = [];

  const cacheTemporadas = new Map();

  for (const linea of lineas) {
    if (!linea || !linea.trim()) continue;

    const ultimaComa = linea.lastIndexOf(',');
    if (ultimaComa === -1) continue;

    const rawTitulo = linea.substring(0, ultimaComa).replace(/^"|"$/g, '').trim();
    const rawFecha = linea.substring(ultimaComa + 1).replace(/^"|"$/g, '').trim();
    if (!rawTitulo) continue;

    const obraInfo = clasificarFilaNetflix(rawTitulo);
    if (!obraInfo || !obraInfo.titulo) {
      omitidos++;
      fallidos.push(rawTitulo);
      listaOmitidos.push({
        titulo: rawTitulo,
        motivo: 'Formato o título no reconocido',
        tipo: 'no_encontrado'
      });
      continue;
    }

    const fechaVisto = parsearFechaNetflix(rawFecha);

    try {
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
               VALUES ($1, $2, $3, $4)
               ON CONFLICT (tmdb_id) DO UPDATE SET titulo = EXCLUDED.titulo
               RETURNING id, tmdb_id, tipo`,
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
        listaOmitidos.push({
          titulo: rawTitulo,
          motivo: 'No encontrado en TMDb',
          tipo: 'no_encontrado'
        });
        continue;
      }

      let temporadaFinal = obraInfo.temporada;
      let numeroEpisodio = obraInfo.episodioDirecto;

      if (tipoFinal === 'serie') {
        const claveSerie = `${usuarioId}_${obraId}`;
        const tracker = memoriaSecuenciaImportacion.get(claveSerie) || { ultimaTemp: 1, ultimoEp: 0 };

        // 1. Si Netflix no puso temporada explícita (ej. Good Girls: Egg Rolls), buscar en TODAS las temporadas de TMDb
        if (!obraInfo.temporadaDetectada && obraInfo.nombresEpisodio?.length > 0 && tmdbId) {
          const matchGlobal = await buscarEpisodioEnTodasLasTemporadas(tmdbId, obraInfo.nombresEpisodio, cacheTemporadas);
          if (matchGlobal) {
            temporadaFinal = matchGlobal.temporada;
            numeroEpisodio = matchGlobal.episodio;
          }
        }

        // 2. Si aún no tenemos temporada, heredar la temporada de la racha actual o 1
        if (!temporadaFinal) {
          temporadaFinal = tracker.ultimaTemp || 1;
        }

        // 3. Si aún no tenemos episodio, buscar en la temporada específica
        if (!numeroEpisodio && tmdbId && temporadaFinal) {
          const claveTemporada = `${tmdbId}_T${temporadaFinal}`;
          let listaEpisodios = cacheTemporadas.get(claveTemporada);
          if (!listaEpisodios) {
            listaEpisodios = await obtenerEpisodiosDeTemporada(tmdbId, temporadaFinal);
            cacheTemporadas.set(claveTemporada, listaEpisodios);
          }

          const claveSecuencia = `${usuarioId}_${obraId}_T${temporadaFinal}`;
          const resEp = resolverNumeroEpisodio(
            obraInfo.nombresEpisodio,
            listaEpisodios,
            claveSecuencia,
            tracker.ultimaTemp === temporadaFinal ? tracker.ultimoEp : 0
          );
          numeroEpisodio = resEp.numero;
        }

        // 4. Fallback secuencial progresivo (1, 2, 3... en vez de quedarse clavado en 1)
        if (!numeroEpisodio) {
          numeroEpisodio = (tracker.ultimaTemp === temporadaFinal ? tracker.ultimoEp : 0) + 1;
        }

        // Actualizar tracker de racha
        memoriaSecuenciaImportacion.set(claveSerie, {
          ultimaTemp: temporadaFinal,
          ultimoEp: numeroEpisodio,
          fecha: fechaVisto
        });
      }

      let existe = false;
      if (tipoFinal === 'serie') {
        const check = await pool.query(
          `SELECT id FROM historial_visualizaciones 
           WHERE usuario_id = $1 AND obra_id = $2 AND temporada = $3 AND episodio = $4 AND fecha_visto = $5 LIMIT 1`,
          [usuarioId, obraId, temporadaFinal, numeroEpisodio, fechaVisto]
        );
        existe = check.rows.length > 0;
      } else {
        const check = await pool.query(
          `SELECT id FROM historial_visualizaciones 
           WHERE usuario_id = $1 AND obra_id = $2 AND fecha_visto = $3 LIMIT 1`,
          [usuarioId, obraId, fechaVisto]
        );
        existe = check.rows.length > 0;
      }

      if (existe) {
        omitidos++;
        listaOmitidos.push({
          titulo: rawTitulo,
          motivo: tipoFinal === 'serie'
            ? `Ya registrado (T${temporadaFinal}: Ep. ${numeroEpisodio})`
            : 'Ya registrado previamente',
          tipo: 'ya_visto'
        });
        continue;
      }

      await pool.query(
        `INSERT INTO historial_visualizaciones 
           (usuario_id, obra_id, temporada, episodio, fecha_visto, plataforma)
         VALUES ($1, $2, $3, $4, $5, 'Netflix')`,
        [
          usuarioId,
          obraId,
          tipoFinal === 'serie' ? temporadaFinal : null,
          tipoFinal === 'serie' ? numeroEpisodio : null,
          fechaVisto
        ]
      );
      importados++;

    } catch (err) {
      console.error('Error insertando fila:', err.message);
      omitidos++;
      fallidos.push(obraInfo.titulo);
      listaOmitidos.push({
        titulo: rawTitulo,
        motivo: 'Error al registrar en base de datos',
        tipo: 'error'
      });
    }
  }

  res.json({ importados, omitidos, fallidos, listaOmitidos });
};

module.exports = { 
  importarLoteCSV,
  analizarLoteCSV,
  confirmarImportacionCSV
};
