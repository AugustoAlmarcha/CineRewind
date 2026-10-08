const pool = require('../config/db');
const axios = require('axios');

// ========================================================
// SERVICIO DEDICADO: CINEREWIND WRAPPED (GALA ANUAL INTERACTIVA)
// ========================================================

const cacheCreditos = new Map();

const normalizarP = (p) => p ? (p.startsWith('http') ? p : `https://image.tmdb.org/t/p/w500${p.startsWith('/') ? p : `/${p}`}`) : null;

/**
 * Consulta y almacena en caché en memoria los créditos de TMDb
 * Para series: aggregate_credits y creadores/showrunners
 * Para películas: reparto y dirección
 */
const obtenerCreditosTMDb = async (tmdb_id, tipo) => {
  if (!tmdb_id) return { cast: [], crew: [], creador: null };
  const cacheKey = `${tipo}_${tmdb_id}`;
  if (cacheCreditos.has(cacheKey)) {
    return cacheCreditos.get(cacheKey);
  }

  const apiKey = process.env.TMDB_KEY || process.env.TMDB_API_KEY || '1b4f4c9c2771d9ff8d2345a557b7899d';
  try {
    let cast = [];
    let crew = [];
    let creador = null;

    let genres = [];

    if (tipo === 'pelicula') {
      const res = await axios.get(`https://api.themoviedb.org/3/movie/${tmdb_id}`, {
        params: { api_key: apiKey, language: 'es-MX', append_to_response: 'credits' },
        timeout: 3500
      });
      cast = res.data.credits?.cast || [];
      crew = res.data.credits?.crew || [];
      genres = (res.data.genres || []).map(g => g.name);
    } else {
      // 1. En series: aggregate_credits y created_by en una sola llamada optimizada
      const resTv = await axios.get(`https://api.themoviedb.org/3/tv/${tmdb_id}`, {
        params: { api_key: apiKey, language: 'es-MX', append_to_response: 'aggregate_credits' },
        timeout: 3500
      });
      cast = resTv.data.aggregate_credits?.cast || [];
      crew = resTv.data.aggregate_credits?.crew || [];
      genres = (resTv.data.genres || []).map(g => g.name);

      const createdBy = resTv.data.created_by;
      if (Array.isArray(createdBy) && createdBy.length > 0) {
        creador = {
          id: createdBy[0].id,
          name: createdBy[0].name,
          profile_path: createdBy[0].profile_path,
          cargo: 'CREADOR & SHOWRUNNER'
        };
      }
    }

    const resultado = { cast, crew, creador, genres };
    cacheCreditos.set(cacheKey, resultado);
    return resultado;
  } catch (err) {
    return { cast: [], crew: [], creador: null, genres: [] };
  }
};

/**
 * Calcula todas las estadísticas, arquetipos, podios de actores/directores y copiloto
 * para el período especificado (año y mes opcional).
 */
const calcularWrapped = async (usuario_id, anio, mes) => {
  let filtroFecha = 'EXTRACT(YEAR FROM hv.fecha_visto) = $2';
  const params = [usuario_id, parseInt(anio, 10)];

  if (mes && parseInt(mes, 10) >= 1 && parseInt(mes, 10) <= 12) {
    params.push(parseInt(mes, 10));
    filtroFecha += ` AND EXTRACT(MONTH FROM hv.fecha_visto) = $${params.length}`;
  }

  // Obtenemos información básica del usuario
  const resUsuario = await pool.query(
    'SELECT nombre, username FROM usuarios WHERE id = $1',
    [usuario_id]
  );
  const usuarioInfo = resUsuario.rows[0] || { nombre: 'Cinéfilo', username: 'usuario' };

  // 1. Métricas Generales (Películas, Capítulos, Horas y Reseñas)
  const queryMetricas = `
    SELECT 
      COUNT(DISTINCT CASE WHEN LOWER(oc.tipo) = 'pelicula' THEN hv.obra_id END) as total_peliculas,
      COUNT(CASE WHEN LOWER(oc.tipo) = 'serie' THEN 1 END) as total_episodios,
      COUNT(CASE WHEN (hv.resenia IS NOT NULL AND TRIM(hv.resenia) != '') OR (hv.calificacion IS NOT NULL AND hv.calificacion > 0) THEN 1 END) as total_resenias,
      COALESCE(SUM(CASE WHEN LOWER(oc.tipo) = 'pelicula' THEN 115 ELSE 45 END), 0) as total_minutos
    FROM historial_visualizaciones hv
    LEFT JOIN obras_catalogo oc ON hv.obra_id = oc.id
    WHERE hv.usuario_id = $1 AND ${filtroFecha}
  `;
  const resMetricas = await pool.query(queryMetricas, params);
  const m = resMetricas.rows[0];

  const totalPeliculas = parseInt(m.total_peliculas, 10) || 0;
  const totalEpisodios = parseInt(m.total_episodios, 10) || 0;
  const totalResenias = parseInt(m.total_resenias, 10) || 0;
  const totalMinutos = parseInt(m.total_minutos, 10) || 0;
  const totalObras = totalPeliculas + totalEpisodios;

  if (totalObras === 0) {
    return { sin_datos: true, anio: parseInt(anio, 10), mes: mes ? parseInt(mes, 10) : null };
  }

  const totalHoras = parseFloat((totalMinutos / 60).toFixed(1));

  // 2. Top Serie
  const querySerie = `
    SELECT oc.id as obra_id, oc.tmdb_id, oc.titulo, oc.poster_path, COUNT(*) as episodios_vistos
    FROM historial_visualizaciones hv
    JOIN obras_catalogo oc ON hv.obra_id = oc.id
    WHERE hv.usuario_id = $1 AND LOWER(oc.tipo) = 'serie' AND ${filtroFecha}
    GROUP BY oc.id, oc.tmdb_id, oc.titulo, oc.poster_path
    ORDER BY episodios_vistos DESC
    LIMIT 1
  `;
  const resSerie = await pool.query(querySerie, params);
  const topSerie = resSerie.rows[0] ? {
    titulo: resSerie.rows[0].titulo,
    poster_path: resSerie.rows[0].poster_path,
    episodios_vistos: parseInt(resSerie.rows[0].episodios_vistos, 10)
  } : null;

  // 3. Top Película (La más vista del año; desempata por mejor calificación de estrellas y fecha)
  const queryPeli = `
    SELECT 
      oc.id as obra_id, 
      oc.tmdb_id, 
      oc.titulo, 
      oc.poster_path, 
      COUNT(*) as veces_vista,
      MAX(COALESCE(hv.calificacion, 0)) as calificacion
    FROM historial_visualizaciones hv
    JOIN obras_catalogo oc ON hv.obra_id = oc.id
    WHERE hv.usuario_id = $1 AND LOWER(oc.tipo) = 'pelicula' AND ${filtroFecha}
    GROUP BY oc.id, oc.tmdb_id, oc.titulo, oc.poster_path
    ORDER BY veces_vista DESC, calificacion DESC, MAX(hv.fecha_visto) DESC
    LIMIT 1
  `;
  const resPeli = await pool.query(queryPeli, params);
  const topPelicula = resPeli.rows[0] ? {
    titulo: resPeli.rows[0].titulo,
    poster_path: normalizarP(resPeli.rows[0].poster_path),
    veces_vista: parseInt(resPeli.rows[0].veces_vista, 10)
  } : null;

  // 3b. Primer Play del Año (La primera obra que reprodujo en este período)
  let primerPlay = null;
  try {
    const queryPrimerPlay = `
      SELECT 
        oc.id as obra_id, 
        oc.tmdb_id, 
        LOWER(oc.tipo) as tipo, 
        oc.titulo, 
        oc.poster_path, 
        hv.temporada, 
        hv.episodio, 
        hv.fecha_visto
      FROM historial_visualizaciones hv
      JOIN obras_catalogo oc ON hv.obra_id = oc.id
      WHERE hv.usuario_id = $1 AND ${filtroFecha}
      ORDER BY hv.fecha_visto ASC, hv.id ASC
      LIMIT 1
    `;
    const resPrimerPlay = await pool.query(queryPrimerPlay, params);
    if (resPrimerPlay.rows.length > 0) {
      const p = resPrimerPlay.rows[0];
      primerPlay = {
        titulo: p.titulo,
        poster_path: normalizarP(p.poster_path),
        tipo: p.tipo,
        temporada: p.temporada,
        episodio: p.episodio,
        fecha_visto: p.fecha_visto
      };
    }
  } catch (e) {
    console.warn('Error al calcular primer play:', e.message);
  }

  // 4. ALGORITMO PONDERADO (Capítulo = 1 punto | Película = 2 puntos)
  const queryObrasConCapitulos = `
    SELECT 
      oc.id, 
      oc.tmdb_id, 
      LOWER(oc.tipo) as tipo, 
      oc.titulo, 
      oc.poster_path, 
      COUNT(hv.id) as cantidad_vistas
    FROM historial_visualizaciones hv
    JOIN obras_catalogo oc ON hv.obra_id = oc.id
    WHERE hv.usuario_id = $1 AND ${filtroFecha}
    GROUP BY oc.id, oc.tmdb_id, oc.tipo, oc.titulo, oc.poster_path
  `;
  const resObras = await pool.query(queryObrasConCapitulos, params);
  const obrasVistas = resObras.rows;

  const mapaActores = new Map();
  const mapaActrices = new Map();
  const mapaDirectores = new Map();
  const mapaGeneros = new Map();

  for (const obra of obrasVistas) {
    if (!obra.tmdb_id) continue;
    const { cast, crew, creador, genres } = await obtenerCreditosTMDb(obra.tmdb_id, obra.tipo);
    
    const vistas = parseInt(obra.cantidad_vistas, 10) || 1;
    const puntosObra = obra.tipo === 'pelicula' ? (vistas * 2) : (vistas * 1);

    if (Array.isArray(genres)) {
      for (const g of genres) {
        if (!g) continue;
        mapaGeneros.set(g, (mapaGeneros.get(g) || 0) + vistas);
      }
    }

    const obraItem = {
      titulo: obra.titulo,
      poster_path: obra.poster_path,
      tipo: obra.tipo,
      vistas: vistas
    };

    // Top 7 del reparto
    const topCast = cast.slice(0, 7);
    for (const actor of topCast) {
      const id = actor.id;
      const nombre = actor.name;
      const foto = actor.profile_path ? `https://image.tmdb.org/t/p/w500${actor.profile_path}` : null;
      const mapa = actor.gender === 1 ? mapaActrices : mapaActores;

      if (!mapa.has(id)) {
        mapa.set(id, { nombre, foto, puntos: 0, capitulos: 0, peliculas: 0, obras: [] });
      }
      const item = mapa.get(id);
      item.puntos += puntosObra;
      if (obra.tipo === 'serie') item.capitulos += vistas;
      else item.peliculas += vistas;

      if (!item.obras.some(o => o.titulo === obra.titulo)) {
        item.obras.push(obraItem);
      }
    }

    // DETERMINAR DIRECTOR / CREADOR
    if (obra.tipo === 'serie' && creador) {
      const id = creador.id;
      if (!mapaDirectores.has(id)) {
        mapaDirectores.set(id, {
          nombre: creador.name,
          foto: creador.profile_path ? `https://image.tmdb.org/t/p/w500${creador.profile_path}` : null,
          cargo: 'CREADOR & SHOWRUNNER',
          puntos: 0,
          capitulos: 0,
          peliculas: 0,
          obras: []
        });
      }
      const item = mapaDirectores.get(id);
      item.puntos += puntosObra;
      item.capitulos += vistas;
      if (!item.obras.some(o => o.titulo === obra.titulo)) {
        item.obras.push(obraItem);
      }
    } else {
      const director = crew.find(c => c.job === 'Director') || crew.find(c => c.department === 'Directing');
      if (director) {
        const id = director.id;
        if (!mapaDirectores.has(id)) {
          mapaDirectores.set(id, {
            nombre: director.name,
            foto: director.profile_path ? `https://image.tmdb.org/t/p/w500${director.profile_path}` : null,
            cargo: obra.tipo === 'pelicula' ? 'DIRECTOR DE CINE' : 'DIRECTOR',
            puntos: 0,
            capitulos: 0,
            peliculas: 0,
            obras: []
          });
        }
        const item = mapaDirectores.get(id);
        item.puntos += puntosObra;
        if (obra.tipo === 'pelicula') item.peliculas += vistas;
        else item.capitulos += vistas;

        if (!item.obras.some(o => o.titulo === obra.titulo)) {
          item.obras.push(obraItem);
        }
      }
    }
  }

  // Ordenar de mayor a menor por PUNTOS ACUMULADOS
  const rankingActores = Array.from(mapaActores.values()).sort((a, b) => b.puntos - a.puntos);
  const rankingActrices = Array.from(mapaActrices.values()).sort((a, b) => b.puntos - a.puntos);
  const rankingDirectores = Array.from(mapaDirectores.values()).sort((a, b) => b.puntos - a.puntos);

  const ganadorActor = rankingActores[0] || null;
  const ganadorActriz = rankingActrices[0] || null;
  const ganadorDirector = rankingDirectores[0] || null;

  const formatearFrase = (g) => {
    if (!g) return 'Presente en tus mejores momentos';
    if (g.capitulos > 0 && g.peliculas > 0) return `${g.capitulos} episodios y ${g.peliculas} películas en tu pantalla`;
    if (g.capitulos > 0) return `${g.capitulos} episodios acompañándote en tu año`;
    if (g.peliculas > 0) return `${g.peliculas} películas protagonizadas en tu año`;
    return `${g.obras.length || 1} obra destacada en tu historial`;
  };

  // 5. Copiloto de Sillón
  let copiloto = { 
    nombre: 'Lobo Solitario del Cine', 
    veces: 0, 
    foto: null, 
    esSolitario: true, 
    esAmigoTexto: false, 
    frase: 'Tus sesiones privadas donde cada plano y cada palomita son 100% para ti.' 
  };
  try {
    const queryCopiloto = `
      SELECT u.nombre as nombre, u.avatar_url as foto, COUNT(*) as veces
      FROM covisualizaciones c
      JOIN usuarios u ON c.amigo_id = u.id
      JOIN historial_visualizaciones hv ON c.visualizacion_id = hv.id
      WHERE hv.usuario_id = $1 AND ${filtroFecha}
      GROUP BY u.nombre, u.avatar_url
      ORDER BY veces DESC
      LIMIT 1
    `;
    const resCopiloto = await pool.query(queryCopiloto, params);

    if (resCopiloto.rows.length > 0) {
      copiloto = {
        nombre: resCopiloto.rows[0].nombre,
        veces: parseInt(resCopiloto.rows[0].veces, 10),
        foto: resCopiloto.rows[0].foto || null,
        esSolitario: false,
        esAmigoTexto: false,
        frase: `${resCopiloto.rows[0].veces} sesiones de sofá compartidas con risas y debates.`
      };
    } else {
      const queryTexto = `
        SELECT TRIM(elem) as nombre, COUNT(*) as veces
        FROM historial_visualizaciones hv,
        LATERAL unnest(string_to_array(hv.visto_con_texto, ',')) as elem
        WHERE hv.usuario_id = $1 AND hv.visto_con_texto IS NOT NULL AND TRIM(elem) != '' AND ${filtroFecha}
        GROUP BY TRIM(elem)
        ORDER BY veces DESC
        LIMIT 1
      `;
      const resTexto = await pool.query(queryTexto, params);
      if (resTexto.rows.length > 0 && resTexto.rows[0].nombre) {
        copiloto = {
          nombre: resTexto.rows[0].nombre,
          veces: parseInt(resTexto.rows[0].veces, 10),
          foto: null,
          esSolitario: false,
          esAmigoTexto: true,
          frase: `${resTexto.rows[0].veces} obras disfrutadas en familia o con amigos en casa.`
        };
      }
    }
  } catch (e) {
    console.warn('Error al calcular copiloto:', e.message);
  }

  // 7. Plataforma favorita
  let plataformaFavorita = 'Cine & Streaming';
  try {
    const queryPlat = `
      SELECT hv.plataforma, COUNT(*) as veces
      FROM historial_visualizaciones hv
      WHERE hv.usuario_id = $1 AND hv.plataforma IS NOT NULL AND ${filtroFecha}
      GROUP BY hv.plataforma
      ORDER BY veces DESC
      LIMIT 1
    `;
    const resPlat = await pool.query(queryPlat, params);
    if (resPlat.rows.length > 0 && resPlat.rows[0].plataforma) {
      plataformaFavorita = resPlat.rows[0].plataforma;
    }
  } catch (e) {}

  // 8. Día Sagrado
  let diaSagrado = 'Domingo';
  try {
    const queryDia = `
      SELECT 
        EXTRACT(DOW FROM hv.fecha_visto) as dia_num,
        COUNT(*) as total_vistos
      FROM historial_visualizaciones hv
      WHERE hv.usuario_id = $1 AND ${filtroFecha}
      GROUP BY dia_num
      ORDER BY total_vistos DESC, dia_num ASC
      LIMIT 1;
    `;
    const resDia = await pool.query(queryDia, params);
    if (resDia.rows.length > 0 && resDia.rows[0].dia_num !== null) {
      const diasSemana = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
      const diaIndex = parseInt(resDia.rows[0].dia_num, 10);
      if (diasSemana[diaIndex]) {
        diaSagrado = diasSemana[diaIndex];
      }
    }
  } catch (e) {
    console.warn('Error al calcular día sagrado:', e.message);
  }

  // 9. Estadísticas detalladas de plataformas y Visitas al Cine
  let plataformasStats = [];
  let vecesAlCine = 0;
  try {
    const queryPlatStats = `
      SELECT 
        COALESCE(NULLIF(TRIM(hv.plataforma), ''), 'Otro') as nombre,
        COUNT(*) as cantidad,
        COUNT(CASE WHEN LOWER(oc.tipo) = 'pelicula' THEN 1 END) as peliculas,
        COUNT(CASE WHEN LOWER(oc.tipo) = 'serie' THEN 1 END) as capitulos
      FROM historial_visualizaciones hv
      LEFT JOIN obras_catalogo oc ON hv.obra_id = oc.id
      WHERE hv.usuario_id = $1 AND ${filtroFecha}
      GROUP BY COALESCE(NULLIF(TRIM(hv.plataforma), ''), 'Otro')
      ORDER BY cantidad DESC;
    `;
    const resPlatStats = await pool.query(queryPlatStats, params);
    const totalRegistros = resPlatStats.rows.reduce((acc, r) => acc + parseInt(r.cantidad, 10), 0) || 1;
    
    plataformasStats = resPlatStats.rows.map(r => {
      const cant = parseInt(r.cantidad, 10);
      const esCine = r.nombre.toLowerCase().includes('cine');
      if (esCine) {
        vecesAlCine += cant;
      }
      return {
        nombre: r.nombre,
        cantidad: cant,
        peliculas: parseInt(r.peliculas, 10),
        capitulos: parseInt(r.capitulos, 10),
        porcentaje: Math.round((cant / totalRegistros) * 100),
        esCine
      };
    });
  } catch (e) {
    console.warn('Error al calcular plataformasStats:', e.message);
  }

  // 10. Top Géneros más vistos
  const totalPuntosGeneros = Array.from(mapaGeneros.values()).reduce((a, b) => a + b, 0) || 1;
  const topGeneros = Array.from(mapaGeneros.entries())
    .map(([nombre, cantidad]) => ({
      nombre,
      cantidad,
      porcentaje: Math.round((cantidad / totalPuntosGeneros) * 100)
    }))
    .sort((a, b) => b.cantidad - a.cantidad)
    .slice(0, 5);

  // 11. Meses pico de visualización (Pelis y Series)
  let mesPicoPeliculas = null;
  let mesPicoSeries = null;
  try {
    const queryMeses = `
      SELECT 
        EXTRACT(MONTH FROM hv.fecha_visto) as mes_num,
        COUNT(CASE WHEN LOWER(oc.tipo) = 'pelicula' THEN 1 END) as pelis,
        COUNT(CASE WHEN LOWER(oc.tipo) = 'serie' THEN 1 END) as caps
      FROM historial_visualizaciones hv
      JOIN obras_catalogo oc ON hv.obra_id = oc.id
      WHERE hv.usuario_id = $1 AND ${filtroFecha}
      GROUP BY mes_num
      ORDER BY mes_num ASC;
    `;
    const resMeses = await pool.query(queryMeses, params);
    const nombresMeses = [
      '', 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];

    let maxPelis = -1;
    let maxCaps = -1;

    for (const r of resMeses.rows) {
      const mNum = parseInt(r.mes_num, 10);
      const pCount = parseInt(r.pelis, 10) || 0;
      const cCount = parseInt(r.caps, 10) || 0;
      const nombreMes = nombresMeses[mNum] || `Mes ${mNum}`;

      if (pCount > maxPelis && pCount > 0) {
        maxPelis = pCount;
        mesPicoPeliculas = {
          mes: nombreMes,
          mes_num: mNum,
          cantidad: pCount
        };
      }

      if (cCount > maxCaps && cCount > 0) {
        maxCaps = cCount;
        mesPicoSeries = {
          mes: nombreMes,
          mes_num: mNum,
          cantidad: cCount
        };
      }
    }
  } catch (e) {
    console.warn('Error al calcular meses pico:', e.message);
  }

  // Obras para collage
  const queryTodasSeries = `
    SELECT 
      COALESCE(oc.tmdb_id, oc.id) as id,
      oc.tmdb_id, 
      oc.titulo, 
      oc.poster_path, 
      COUNT(DISTINCT hv.id) as episodios_vistos
    FROM historial_visualizaciones hv
    JOIN obras_catalogo oc ON hv.obra_id = oc.id
    WHERE hv.usuario_id = $1 AND LOWER(oc.tipo) = 'serie' AND ${filtroFecha}
    GROUP BY COALESCE(oc.tmdb_id, oc.id), oc.tmdb_id, oc.titulo, oc.poster_path
    ORDER BY episodios_vistos DESC;
  `;
  const resTodasSeries = await pool.query(queryTodasSeries, params);

  const queryTodasPeliculas = `
    SELECT 
      COALESCE(oc.tmdb_id, oc.id) as id,
      oc.tmdb_id, 
      oc.titulo, 
      oc.poster_path, 
      COUNT(DISTINCT hv.id) as veces_vista,
      MAX(COALESCE(hv.calificacion, 0)) as calificacion
    FROM historial_visualizaciones hv
    JOIN obras_catalogo oc ON hv.obra_id = oc.id
    WHERE hv.usuario_id = $1 AND LOWER(oc.tipo) = 'pelicula' AND ${filtroFecha}
    GROUP BY COALESCE(oc.tmdb_id, oc.id), oc.tmdb_id, oc.titulo, oc.poster_path
    ORDER BY veces_vista DESC, calificacion DESC, MAX(hv.fecha_visto) DESC;
  `;
  const resTodasPeliculas = await pool.query(queryTodasPeliculas, params);

  const seriesVistas = resTodasSeries.rows.map(r => ({ ...r, poster_path: normalizarP(r.poster_path), tipo: 'serie', vistas: parseInt(r.episodios_vistos, 10) || 1 }));
  const peliculasVistas = resTodasPeliculas.rows.map(r => ({ ...r, poster_path: normalizarP(r.poster_path), tipo: 'pelicula', vistas: parseInt(r.veces_vista, 10) || 1 }));
  const todasLasObras = [...seriesVistas, ...peliculasVistas];

  // ==========================================
  // ARQUETIPO CINÉFILO PONDERADO INTELIGENTE
  // ==========================================
  const definicionesArquetipos = [
    {
      id: 'medico',
      titulo: 'El Médico de Guardia',
      lema: 'Adicto a las batas blancas, los diagnósticos imposibles y el drama hospitalario.',
      regex: /house|doctor|greys|grey's|anatomy|hospital|m[eé]dico|urgencias|quirofano|nurse|salud|clinic/i,
      categoria: 'Drama Médico',
      icono: 'Stethoscope',
      generarMotivo: (obraTop) => obraTop ? `Tu gran maratón de ${obraTop} y los diagnósticos intensos definieron tu año.` : 'Dominado por pasillos de hospital, batas blancas y diagnósticos de guardia.'
    },
    {
      id: 'mafia',
      titulo: 'El Padrino del Streaming',
      lema: 'Negocios turbios, lealtad inquebrantable y el control absoluto de cada episodio.',
      regex: /padrino|godfather|soprano|mafia|peaky|narco|gangster|cartel|fargo|breaking bad|better call saul|ozark|wire/i,
      categoria: 'Crimen & Mafia',
      icono: 'Crown',
      generarMotivo: (obraTop) => obraTop ? `Tu obsesión con el universo de ${obraTop} y el crimen organizado.` : 'Marcado por sagas de mafia, familias de poder y códigos de lealtad.'
    },
    {
      id: 'superheroes',
      titulo: 'El Guardián del Multiverso',
      lema: 'Tu año estuvo repleto de capas, superpoderes y batallas épicas por salvar el universo.',
      regex: /spider|avenger|batman|superman|marvel|dc|comic|iron man|thor|hulk|guardians|vengadores|deadpool|x-men|wolverine|doom|aquaman|flash|boys|invincible/i,
      categoria: 'Superhéroes & Cómics',
      icono: 'Shield',
      generarMotivo: (obraTop) => obraTop ? `Inspirado por tus batallas épicas junto a ${obraTop} y el multiverso.` : 'Salvaste el universo incontables veces entre capas y misiones heroicas.'
    },
    {
      id: 'terror',
      titulo: 'El Amante de las Pesadillas',
      lema: 'Miras cine de terror a oscuras con luces apagadas y ni pestañeas ante el monstruo.',
      regex: /demon|terror|evil|conjuring|saw|miedo|scream|halloween|resident|silent hill|pesadilla|fantasma|witch|sinister|exorcist|creepy|hereditary|nosferatu/i,
      categoria: 'Terror & Suspenso',
      icono: 'Ghost',
      generarMotivo: (obraTop) => obraTop ? `Tus sesiones más oscuras e intensas frente a ${obraTop}.` : 'La adrenalina del horror psicológico y los sustos fueron tu hábitat preferido.'
    },
    {
      id: 'scifi',
      titulo: 'El Viajero Intergaláctico',
      lema: 'La Tierra te queda chica; tu hábitat natural son las naves cósmicas y los futuros distópicos.',
      regex: /dune|star wars|interstellar|alien|matrix|blade runner|avatar|galaxy|space|cosmos|sci-fi|terminator|cyberpunk|foundation|expanse|black mirror/i,
      categoria: 'Ciencia Ficción',
      icono: 'Rocket',
      generarMotivo: (obraTop) => obraTop ? `Tus expediciones cósmicas y viajes en el tiempo con ${obraTop}.` : 'Las naves estelares y realidades distópicas gobernaron tu pantalla.'
    },
    {
      id: 'misterio',
      titulo: 'Cazador de Misterios & Giros',
      lema: 'Sospechas de todos desde el minuto uno y descifras al culpable antes del clímax final.',
      regex: /sherlock|detective|crime|crimen|asesino|murder|mystery|misterio|knives out|mindhunter|true detective|thriller|se7en|zodiac|dexter|severance|stranger/i,
      categoria: 'Misterio & Thriller',
      icono: 'Search',
      generarMotivo: (obraTop) => obraTop ? `Desentrañando cada pista y giro narrativo en ${obraTop}.` : 'Ningún misterio ni culpable logró escapar a tu agudeza analítica.'
    },
    {
      id: 'fantasia',
      titulo: 'Señor de Reinos Fantásticos',
      lema: 'Espadas ancestrales, hechizos y criaturas legendarias: tu mente vive en otras eras mágicas.',
      regex: /potter|rings|westeros|thrones|drag[oó]n|witcher|narnia|percy|magic|fantas[ií]a|lord of/i,
      categoria: 'Fantasía Épica',
      icono: 'Sparkles',
      generarMotivo: (obraTop) => obraTop ? `Tu inmersión total en los reinos épicos de ${obraTop}.` : 'Dragones, coronas ancestrales y mundos de magia dominaron tu año.'
    },
    {
      id: 'comedia',
      titulo: 'El Rey de la Risa',
      lema: 'El cine es tu terapia de felicidad: cada maratón debe tener humor, risas y carcajadas garantizadas.',
      regex: /comedy|comedia|laugh|ted|friends|the office|office|b99|brooklyn|hangover|scary movie|superbad|mario|barbie|modern family|how i met|seinfeld/i,
      categoria: 'Comedia & Humor',
      icono: 'Smile',
      generarMotivo: (obraTop) => obraTop ? `Riendo sin parar con las temporadas y momentos de ${obraTop}.` : 'Tu pantalla fue una fábrica inagotable de risas y buen humor.'
    },
    {
      id: 'romance',
      titulo: 'El Romántico Incorregible',
      lema: 'Lloras con los finales felices, con los desamores y con cualquier historia que te robe el corazón.',
      regex: /love|amor|romance|kiss|heart|coraz|boda|wedding|pareja|enamorad|notebook|lalaland|bridgerton|orgullo/i,
      categoria: 'Romance & Drama',
      icono: 'Heart',
      generarMotivo: (obraTop) => obraTop ? `Conmovido de principio a fin con la historia de ${obraTop}.` : 'Historias de amor apasionadas y romances inolvidables que tocan el corazón.'
    },
    {
      id: 'accion',
      titulo: 'Adicto a la Adrenalina',
      lema: 'Si no hay explosiones, persecuciones a toda velocidad y tiros, para ti no es cine de verdad.',
      regex: /fast|furios|r[aá]pido|misi[oó]n|mission|wick|die hard|mad max|bullet|gun|furia|escape|rescate|al l[ií]mite|gladiator|top gun|reacher/i,
      categoria: 'Acción Pura',
      icono: 'Zap',
      generarMotivo: (obraTop) => obraTop ? `Vértigo y adrenalina sin descanso al compás de ${obraTop}.` : 'Persecuciones a toda marcha y acción explosiva de inicio a fin.'
    },
    {
      id: 'animacion',
      titulo: 'El Niño Eterno',
      lema: 'Entiendes que la animación es verdadero arte cinematográfico que emociona a cualquier edad.',
      regex: /shrek|toy story|pixar|disney|monsters|nemo|dragon|mario|spider-verse|minion|anime|ghibli|encanto|coco|naruto|one piece/i,
      categoria: 'Animación',
      icono: 'Film',
      generarMotivo: (obraTop) => obraTop ? `La magia visual y nostalgia infinita de ${obraTop}.` : 'El poder del cine ilustrado y las historias animadas llenaron tu pantalla.'
    },
    {
      id: 'historia',
      titulo: 'El Historiador Cinéfilo',
      lema: 'Fascinado por los hechos reales, los dramas de época y las obras que marcaron la historia humana.',
      regex: /oppenheimer|napoleon|historia|history|war|guerra|churchill|crown|biopic|drama/i,
      categoria: 'Historia & Biopics',
      icono: 'BookOpen',
      generarMotivo: (obraTop) => obraTop ? `Reviviendo grandes momentos históricos a través de ${obraTop}.` : 'Grandes producciones de época y relatos basados en eventos reales.'
    }
  ];

  // Cálculo de puntaje acumulado por arquetipo basado en obras reales
  const puntajes = {};
  const obraTopPorArquetipo = {};

  definicionesArquetipos.forEach(arq => {
    puntajes[arq.id] = 0;
    obraTopPorArquetipo[arq.id] = null;
  });

  for (const obra of todasLasObras) {
    const titulo = (obra.titulo || '').toLowerCase();
    const peso = obra.tipo === 'serie' ? (obra.episodios_vistos || 1) : ((obra.veces_vista || 1) * 2);

    for (const arq of definicionesArquetipos) {
      if (arq.regex.test(titulo)) {
        puntajes[arq.id] += peso;
        if (!obraTopPorArquetipo[arq.id] || peso > (obraTopPorArquetipo[arq.id].peso || 0)) {
          obraTopPorArquetipo[arq.id] = { titulo: obra.titulo, peso };
        }
      }
    }
  }

  // Bonificación especial por las obras más vistas (Top Serie y Top Película)
  if (topSerie) {
    const tituloTopSerie = topSerie.titulo.toLowerCase();
    for (const arq of definicionesArquetipos) {
      if (arq.regex.test(tituloTopSerie)) {
        puntajes[arq.id] += 15; // Gran bonificación de obsesión
        if (!obraTopPorArquetipo[arq.id]) {
          obraTopPorArquetipo[arq.id] = { titulo: topSerie.titulo, peso: 15 };
        }
      }
    }
  }

  if (topPelicula) {
    const tituloTopPeli = topPelicula.titulo.toLowerCase();
    for (const arq of definicionesArquetipos) {
      if (arq.regex.test(tituloTopPeli)) {
        puntajes[arq.id] += 10;
        if (!obraTopPorArquetipo[arq.id]) {
          obraTopPorArquetipo[arq.id] = { titulo: topPelicula.titulo, peso: 10 };
        }
      }
    }
  }

  // Encontrar el arquetipo con mayor puntaje
  let mejorArquetipo = null;
  let maxPuntos = 0;

  for (const arq of definicionesArquetipos) {
    if (puntajes[arq.id] > maxPuntos) {
      maxPuntos = puntajes[arq.id];
      mejorArquetipo = arq;
    }
  }

  let arquetipo = null;

  if (mejorArquetipo && maxPuntos >= 3) {
    const obraDestacada = obraTopPorArquetipo[mejorArquetipo.id]?.titulo;
    arquetipo = {
      titulo: mejorArquetipo.titulo,
      lema: mejorArquetipo.lema,
      categoria: mejorArquetipo.categoria,
      motivo: mejorArquetipo.generarMotivo(obraDestacada),
      icono: mejorArquetipo.icono,
      puntos: maxPuntos
    };
  } else if (totalResenias >= 3) {
    arquetipo = {
      titulo: 'El Crítico de Sillón',
      lema: 'No solo disfrutas cada obra; juzgas cada plano con precisión quirúrgica, estrellas y buen gusto.',
      categoria: 'Crítica de la Comunidad',
      motivo: `Escribiste y valoraste ${totalResenias} obras con tu criterio analítico en la plataforma.`,
      icono: 'Star'
    };
  } else if (totalHoras >= 30) {
    arquetipo = {
      titulo: 'El Maratonista Legendario',
      lema: 'Capaz de devorar trilogías enteras y temporadas completas en un solo fin de semana.',
      categoria: 'Maratón Extremo',
      motivo: `Acumulaste ${totalHoras} horas maratoneando frente a la pantalla con resistencia épica.`,
      icono: 'Flame'
    };
  } else if (totalPeliculas > 0 && totalPeliculas >= totalEpisodios * 1.3) {
    arquetipo = {
      titulo: 'El Purista del Séptimo Arte',
      lema: 'Para ti la verdadera magia se concentra en dos horas perfectas de pantalla grande y palomitas.',
      categoria: 'Cinefilia Pura',
      motivo: `Priorizaste ${totalPeliculas} largometrajes sobre cualquier formato seriado este año.`,
      icono: 'Film'
    };
  } else if (totalEpisodios >= 15) {
    arquetipo = {
      titulo: 'El Devorador de Temporadas',
      lema: 'Para ti un capítulo más nunca fue suficiente; el botón de siguiente episodio es tu mejor amigo.',
      categoria: 'Series en Serie',
      motivo: `Viste ${totalEpisodios} episodios manteniendo viva la llama del maratón continuado.`,
      icono: 'Tv'
    };
  } else {
    arquetipo = {
      titulo: 'El Jurado de Cannes',
      lema: 'Analizas cada plano con pasión y devoras historias con auténtico criterio de festival.',
      categoria: 'Cinefilia Selecta',
      motivo: 'Tu selección diversa y equilibrada demostró un paladar cinematográfico exigente y variado.',
      icono: 'Award'
    };
  }

  return {
    sin_datos: false,
    anio: parseInt(anio, 10),
    mes: mes ? parseInt(mes, 10) : null,
    usuario: {
      nombre: usuarioInfo.nombre || 'Cinéfilo',
      username: usuarioInfo.username || 'usuario'
    },
    total_horas: totalHoras,
    total_minutos: totalMinutos,
    total_peliculas: totalPeliculas,
    total_episodios: totalEpisodios,
    total_resenias: totalResenias,
    dias_equivalentes: `${(totalHoras / 24).toFixed(1)} días`,
    primer_play: primerPlay,
    top_serie: topSerie,
    top_pelicula: topPelicula,
    dia_sagrado: diaSagrado,
    plataforma_favorita: plataformaFavorita,
    actor_fetiche: {
      nombre: ganadorActor ? ganadorActor.nombre : 'Sin actor destacado',
      foto: ganadorActor ? ganadorActor.foto : null,
      dato: formatearFrase(ganadorActor),
      obras_destacadas: ganadorActor ? ganadorActor.obras : []
    },
    actriz_favorita: {
      nombre: ganadorActriz ? ganadorActriz.nombre : 'Sin actriz destacada',
      foto: ganadorActriz ? ganadorActriz.foto : null,
      dato: formatearFrase(ganadorActriz),
      obras_destacadas: ganadorActriz ? ganadorActriz.obras : []
    },
    director_favorito: {
      nombre: ganadorDirector ? ganadorDirector.nombre : 'Sin creador/director destacado',
      foto: ganadorDirector ? ganadorDirector.foto : null,
      cargo: ganadorDirector ? ganadorDirector.cargo : 'CREADOR & DIRECTOR',
      dato: ganadorDirector?.cargo?.includes('CREADOR') 
        ? `Mente maestra y creador de ${ganadorDirector.obras[0]?.titulo || 'tu serie favorita'}` 
        : `${ganadorDirector?.obras?.length || 1} película(s) dirigida(s) en tu año`,
      obras_destacadas: ganadorDirector ? ganadorDirector.obras : []
    },
    copiloto: copiloto,
    arquetipo: arquetipo,
    series_vistas: seriesVistas,
    peliculas_vistas: peliculasVistas,
    todas_las_obras: todasLasObras,
    plataformas_stats: plataformasStats,
    veces_al_cine: vecesAlCine,
    top_generos: topGeneros,
    mes_pico_peliculas: mesPicoPeliculas,
    mes_pico_series: mesPicoSeries
  };
};

module.exports = {
  calcularWrapped
};
