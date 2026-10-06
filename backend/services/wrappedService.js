const pool = require('../config/db');
const axios = require('axios');

// ========================================================
// SERVICIO DEDICADO: CINEREWIND WRAPPED (GALA ANUAL INTERACTIVA)
// ========================================================

const cacheCreditos = new Map();

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

    if (tipo === 'pelicula') {
      const res = await axios.get(`https://api.themoviedb.org/3/movie/${tmdb_id}/credits`, {
        params: { api_key: apiKey, language: 'es-ES' },
        timeout: 3500
      });
      cast = res.data.cast || [];
      crew = res.data.crew || [];
    } else {
      // 1. En series: aggregate_credits para tener el elenco de TODAS las temporadas con su total_episode_count
      const resCast = await axios.get(`https://api.themoviedb.org/3/tv/${tmdb_id}/aggregate_credits`, {
        params: { api_key: apiKey, language: 'es-ES' },
        timeout: 3500
      });
      cast = resCast.data.cast || [];
      crew = resCast.data.crew || [];

      // 2. Buscar al CREADOR / SHOWRUNNER (David Shore, David Chase, Vince Gilligan, etc.)
      try {
        const resTv = await axios.get(`https://api.themoviedb.org/3/tv/${tmdb_id}`, {
          params: { api_key: apiKey, language: 'es-ES' },
          timeout: 3500
        });
        const createdBy = resTv.data.created_by;
        if (Array.isArray(createdBy) && createdBy.length > 0) {
          creador = {
            id: createdBy[0].id,
            name: createdBy[0].name,
            profile_path: createdBy[0].profile_path,
            cargo: 'CREADOR & SHOWRUNNER'
          };
        }
      } catch (e) {}
    }

    const resultado = { cast, crew, creador };
    cacheCreditos.set(cacheKey, resultado);
    return resultado;
  } catch (err) {
    return { cast: [], crew: [], creador: null };
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
    LEFT JOIN obras_catalogo oc ON hv.obra_id = oc.id OR hv.obra_id = oc.tmdb_id
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
    JOIN obras_catalogo oc ON hv.obra_id = oc.id OR hv.obra_id = oc.tmdb_id
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

  // 3. Top Película
  const queryPeli = `
    SELECT oc.id as obra_id, oc.tmdb_id, oc.titulo, oc.poster_path, COALESCE(hv.calificacion, 0) as calificacion
    FROM historial_visualizaciones hv
    JOIN obras_catalogo oc ON hv.obra_id = oc.id OR hv.obra_id = oc.tmdb_id
    WHERE hv.usuario_id = $1 AND LOWER(oc.tipo) = 'pelicula' AND ${filtroFecha}
    ORDER BY hv.calificacion DESC, hv.fecha_visto DESC
    LIMIT 1
  `;
  const resPeli = await pool.query(queryPeli, params);
  const topPelicula = resPeli.rows[0] ? {
    titulo: resPeli.rows[0].titulo,
    poster_path: resPeli.rows[0].poster_path
  } : null;

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
    JOIN obras_catalogo oc ON hv.obra_id = oc.id OR hv.obra_id = oc.tmdb_id
    WHERE hv.usuario_id = $1 AND ${filtroFecha}
    GROUP BY oc.id, oc.tmdb_id, oc.tipo, oc.titulo, oc.poster_path
  `;
  const resObras = await pool.query(queryObrasConCapitulos, params);
  const obrasVistas = resObras.rows;

  const mapaActores = new Map();
  const mapaActrices = new Map();
  const mapaDirectores = new Map();

  for (const obra of obrasVistas) {
    if (!obra.tmdb_id) continue;
    const { cast, crew, creador } = await obtenerCreditosTMDb(obra.tmdb_id, obra.tipo);
    
    const vistas = parseInt(obra.cantidad_vistas, 10) || 1;
    const puntosObra = obra.tipo === 'pelicula' ? (vistas * 2) : (vistas * 1);

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

  // Obras para collage
  const queryTodasSeries = `
    SELECT 
      COALESCE(oc.tmdb_id, oc.id) as id,
      oc.tmdb_id, 
      oc.titulo, 
      oc.poster_path, 
      COUNT(DISTINCT hv.id) as episodios_vistos
    FROM historial_visualizaciones hv
    JOIN obras_catalogo oc ON hv.obra_id = oc.id OR hv.obra_id = oc.tmdb_id
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
      COUNT(DISTINCT hv.id) as veces_vista
    FROM historial_visualizaciones hv
    JOIN obras_catalogo oc ON hv.obra_id = oc.id OR hv.obra_id = oc.tmdb_id
    WHERE hv.usuario_id = $1 AND LOWER(oc.tipo) = 'pelicula' AND ${filtroFecha}
    GROUP BY COALESCE(oc.tmdb_id, oc.id), oc.tmdb_id, oc.titulo, oc.poster_path
    ORDER BY veces_vista DESC;
  `;
  const resTodasPeliculas = await pool.query(queryTodasPeliculas, params);

  const normalizarP = (p) => p ? (p.startsWith('http') ? p : `https://image.tmdb.org/t/p/w500${p.startsWith('/') ? p : `/${p}`}`) : null;

  const seriesVistas = resTodasSeries.rows.map(r => ({ ...r, poster_path: normalizarP(r.poster_path), tipo: 'serie' }));
  const peliculasVistas = resTodasPeliculas.rows.map(r => ({ ...r, poster_path: normalizarP(r.poster_path), tipo: 'pelicula' }));
  const todasLasObras = [...seriesVistas, ...peliculasVistas];

  // Arquetipo Cinéfilo
  const titulosTexto = todasLasObras.map(o => (o.titulo || '').toLowerCase()).join(' ');

  let arquetipo = {
    titulo: 'El Jurado de Cannes',
    lema: 'Analizas cada plano con pasión y devoras historias con auténtico criterio de festival.'
  };

  if (/spider|avenger|batman|superman|marvel|dc|comic|iron man|thor|hulk|guardians|vengadores|deadpool|x-men|wolverine|multiverse|doom|aquaman|flash/.test(titulosTexto)) {
    arquetipo = {
      titulo: 'El Guardián del Multiverso',
      lema: 'Tu año estuvo repleto de capas, superpoderes y batallas épicas por salvar el universo.'
    };
  } else if (/demon|terror|evil|conjuring|saw|miedo|scream|halloween|resident|silent hill|pesadilla|fantasma|witch|sinister|exorcist|creepy|hereditary|nosferatu/.test(titulosTexto)) {
    arquetipo = {
      titulo: 'El Amante de las Pesadillas',
      lema: 'Miras cine de terror a oscuras con luces apagadas y ni pestañeas ante el monstruo.'
    };
  } else if (/dune|star wars|interstellar|alien|matrix|blade runner|avatar|galaxy|space|cosmos|sci-fi|terminator|cyberpunk/.test(titulosTexto)) {
    arquetipo = {
      titulo: 'El Viajero Intergaláctico',
      lema: 'La Tierra te queda chica; tu hábitat natural son las naves cósmicas y los futuros distópicos.'
    };
  } else if (/love|amor|romance|kiss|heart|coraz|boda|wedding|pareja|enamorad|notebook|lalaland|bridgerton|orgullo/.test(titulosTexto)) {
    arquetipo = {
      titulo: 'El Romántico Incorregible',
      lema: 'Lloras con los finales felices, con los desamores y con cualquier historia que te robe el corazón.'
    };
  } else if (/fast|furios|rápido|misi[oó]n|mission|wick|die hard|mad max|bullet|gun|furia|escape|rescate|al límite|gladiator|top gun/.test(titulosTexto)) {
    arquetipo = {
      titulo: 'Adicto a la Adrenalina',
      lema: 'Si no hay explosiones, persecuciones a toda velocidad y tiros, para ti no es cine de verdad.'
    };
  } else if (/sherlock|detective|crime|crimen|asesino|murder|mystery|misterio|knives out|mindhunter|fargo|true detective|thriller|se7en|zodiac/.test(titulosTexto)) {
    arquetipo = {
      titulo: 'Cazador de Misterios & Giros',
      lema: 'Sospechas de todos desde el minuto uno y descifras el culpable antes del clímax final.'
    };
  } else if (/potter|rings|westeros|thrones|drag[oó]n|witcher|narnia|percy|magic|fantas[ií]a|lord of/.test(titulosTexto)) {
    arquetipo = {
      titulo: 'Señor de Reinos Fantásticos',
      lema: 'Espadas ancestrales, hechizos y criaturas legendarias: tu mente vive en otras eras mágicas.'
    };
  } else if (/comedy|comedia|laugh|ted|friends|office|b99|brooklyn|hangover|scary movie|superbad|mario|barbie/.test(titulosTexto)) {
    arquetipo = {
      titulo: 'El Rey de la Risa',
      lema: 'El cine es tu terapia de felicidad: cada maratón debe tener humor, risas y carcajadas garantizadas.'
    };
  } else if (/oppenheimer|napoleon|historia|history|war|guerra|churchill|crown|biopic|drama|padrino|godfather/.test(titulosTexto)) {
    arquetipo = {
      titulo: 'El Historiador Cinéfilo',
      lema: 'Fascinado por los hechos reales, los dramas de época y las obras que marcaron la historia humana.'
    };
  } else if (/shrek|toy story|pixar|disney|monsters|nemo|dragon|mario|spider-verse|minion|anime|ghibli|encanto|coco|ghibli|naruto|one piece/.test(titulosTexto)) {
    arquetipo = {
      titulo: 'El Niño Eterno',
      lema: 'Entiendes que la animación es verdadero arte cinematográfico que emociona a cualquier edad.'
    };
  } else if (totalResenias >= 3) {
    arquetipo = {
      titulo: 'El Crítico de Sillón',
      lema: 'No solo disfrutas cada obra; juzgas cada plano con precisión quirúrgica, estrellas y buen gusto.'
    };
  } else if (totalHoras >= 30) {
    arquetipo = {
      titulo: 'El Maratonista Legendario',
      lema: 'Capaz de devorar trilogías enteras y temporadas completas en un solo fin de semana.'
    };
  } else if (totalPeliculas > 0 && totalPeliculas >= totalEpisodios * 1.3) {
    arquetipo = {
      titulo: 'El Purista del Séptimo Arte',
      lema: 'Para ti la verdadera magia se concentra en dos horas perfectas de pantalla grande y palomitas.'
    };
  } else if (totalEpisodios >= 15) {
    arquetipo = {
      titulo: 'El Devorador de Temporadas',
      lema: 'Para ti un capítulo más nunca fue suficiente; el botón de siguiente episodio es tu mejor amigo.'
    };
  } else if (topSerie && (topSerie.titulo.toLowerCase().includes('house') || topSerie.titulo.toLowerCase().includes('grey'))) {
    arquetipo = {
      titulo: 'Diagnóstico Reservado',
      lema: 'Adicto a las batas blancas, los diagnósticos imposibles y el drama hospitalario.'
    };
  } else if (copiloto && copiloto.veces >= 3) {
    arquetipo = {
      titulo: 'El Anfitrión del Cineclub',
      lema: 'El buen cine se multiplica cuando se comparten palomitas, debates y sillón en compañía.'
    };
  } else if (copiloto && copiloto.esSolitario) {
    arquetipo = {
      titulo: 'El Espectador Supremo',
      lema: 'Disfrutas del cine en su estado más puro: tú, la pantalla y tus obras favoritas sin interrupciones.'
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
    todas_las_obras: todasLasObras
  };
};

module.exports = {
  calcularWrapped
};
