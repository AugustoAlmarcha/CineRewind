const pool = require('../config/db');

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

// Caché en memoria para evitar saturar TMDb (expira en 12 horas)
const cacheTMDB = new Map();

const fetchTMDBConTimeout = async (url, tiempoMs = 2500) => {
  const ahora = Date.now();
  if (cacheTMDB.has(url)) {
    const { data, expira } = cacheTMDB.get(url);
    if (ahora < expira) return data;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), tiempoMs);

    const resp = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!resp.ok) return null;
    const data = await resp.json();
    cacheTMDB.set(url, { data, expira: ahora + 1000 * 60 * 60 * 12 });
    return data;
  } catch (err) {
    return null;
  }
};

// 1. Buscador (con timeout de 3s para respuesta rápida)
const buscarPeliculas = async (req, res) => {
  const { query } = req.query;

  if (!query || !query.trim()) {
    return res.status(400).json({ error: 'Debes ingresar un término de búsqueda' });
  }

  try {
    const url = `${TMDB_BASE_URL}/search/multi?api_key=${process.env.TMDB_API_KEY}&language=es-MX&query=${encodeURIComponent(query.trim())}&page=1&include_adult=false`;
    const data = await fetchTMDBConTimeout(url, 3000);

    if (!data || !data.results) {
      return res.json([]);
    }

    const resultados = data.results
      .filter((item) => item.media_type === 'movie' || item.media_type === 'tv')
      .map((item) => ({
        tmdb_id: item.id,
        tipo: item.media_type === 'movie' ? 'pelicula' : 'serie',
        titulo: item.title || item.name,
        anio: (item.release_date || item.first_air_date || '').substring(0, 4),
        sinopsis: item.overview || 'Sin descripción disponible.',
        poster_path: item.poster_path
          ? `https://image.tmdb.org/t/p/w500${item.poster_path}`
          : null,
      }));

    res.json(resultados);
  } catch (error) {
    console.error('Error al conectar con TMDb (buscar):', error.message);
    res.status(500).json({ error: 'Error interno al consultar el catálogo' });
  }
};

// 2. Detalle de Película o Serie
const obtenerDetallePelicula = async (req, res) => {
  const { tipo, tmdb_id } = req.params;
  if (!tmdb_id || tmdb_id === 'undefined' || tmdb_id === 'null') {
    return res.status(400).json({ error: 'Identificador tmdb_id no válido' });
  }

  const endpointTipo = tipo && (tipo.toLowerCase() === 'serie' || tipo.toLowerCase() === 'tv') ? 'tv' : 'movie';

  try {
    const url = `${TMDB_BASE_URL}/${endpointTipo}/${tmdb_id}?api_key=${process.env.TMDB_API_KEY}&language=es-MX&append_to_response=credits`;
    let data = await fetchTMDBConTimeout(url, 3000);

    if (!data) {
      const urlFallback = `${TMDB_BASE_URL}/${endpointTipo}/${tmdb_id}?api_key=${process.env.TMDB_API_KEY}&append_to_response=credits`;
      data = await fetchTMDBConTimeout(urlFallback, 2500);
    }

    if (!data) {
      return res.status(404).json({ error: 'Obra no encontrada en TMDb' });
    }

    const reparto = (data.credits?.cast || []).slice(0, 15).map((actor) => ({
      id: actor.id,
      nombre: actor.name,
      personaje: actor.character,
      foto: actor.profile_path ? `https://image.tmdb.org/t/p/w185${actor.profile_path}` : null,
    }));

    const detalle = {
      tmdb_id: data.id,
      tipo: endpointTipo === 'tv' ? 'serie' : 'pelicula',
      titulo: data.title || data.name,
      anio: (data.release_date || data.first_air_date || '').substring(0, 4),
      sinopsis: data.overview,
      poster_path: data.poster_path ? `https://image.tmdb.org/t/p/w500${data.poster_path}` : null,
      duracion_minutos: data.runtime || (data.episode_run_time ? data.episode_run_time[0] : null),
      generos: (data.genres || []).map((g) => g.name),
      total_temporadas: data.number_of_seasons || null,
      total_episodios: data.number_of_episodes || null,
      reparto,
    };

    res.json(detalle);
  } catch (error) {
    console.error('Error al obtener detalle:', error.message);
    res.status(500).json({ error: 'Error al consultar detalles de la obra' });
  }
};

// 3. Detalle de Temporada (resuelve esperas prolongadas)
const obtenerDetalleTemporada = async (req, res) => {
  const { tmdb_id, season_number } = req.params;

  if (!tmdb_id || tmdb_id === 'undefined' || season_number === undefined) {
    return res.status(400).json({ error: 'Parámetros incompletos de temporada' });
  }

  try {
    const url = `${TMDB_BASE_URL}/tv/${tmdb_id}/season/${season_number}?api_key=${process.env.TMDB_API_KEY}&language=es-MX`;
    let data = await fetchTMDBConTimeout(url, 2500);

    if (!data) {
      const urlSinIdioma = `${TMDB_BASE_URL}/tv/${tmdb_id}/season/${season_number}?api_key=${process.env.TMDB_API_KEY}`;
      data = await fetchTMDBConTimeout(urlSinIdioma, 2000);
    }

    if (!data) {
      return res.status(404).json({ error: 'Temporada no encontrada en TMDb' });
    }

    const episodios = (data.episodes || []).map((ep) => ({
      episodio_numero: ep.episode_number,
      nombre: ep.name,
      sinopsis: ep.overview || 'Sin descripción disponible.',
      still_path: ep.still_path ? `https://image.tmdb.org/t/p/w500${ep.still_path}` : null,
      duracion: ep.runtime,
    }));

    res.json({
      temporada_numero: data.season_number,
      nombre: data.name,
      poster_temporada: data.poster_path ? `https://image.tmdb.org/t/p/w500${data.poster_path}` : null,
      episodios,
    });
  } catch (error) {
    console.error('Error al obtener episodios:', error.message);
    res.status(500).json({ error: 'Error al consultar episodios en TMDb' });
  }
};

// 4. Detalle de Episodio Completo
const obtenerDetalleEpisodioCompleto = async (req, res) => {
  const { tmdb_id, temporada, episodio } = req.params;
  const apiKey = process.env.TMDB_API_KEY;

  if (!tmdb_id || tmdb_id === 'undefined' || !temporada || !episodio) {
    return res.status(400).json({ error: 'Faltan parámetros del episodio' });
  }

  try {
    const url = `${TMDB_BASE_URL}/tv/${tmdb_id}/season/${temporada}/episode/${episodio}?api_key=${apiKey}&language=es-MX&append_to_response=credits`;
    let data = await fetchTMDBConTimeout(url, 2500);

    if (!data) {
      const urlSinIdioma = `${TMDB_BASE_URL}/tv/${tmdb_id}/season/${temporada}/episode/${episodio}?api_key=${apiKey}&append_to_response=credits`;
      data = await fetchTMDBConTimeout(urlSinIdioma, 2000);
    }

    if (!data) {
      return res.status(404).json({ error: 'Episodio no encontrado en TMDb' });
    }

    const elencoTotal = [
      ...(data.credits?.cast || []),
      ...(data.guest_stars || []),
    ];

    res.json({
      nombre: data.name,
      sinopsis: data.overview || 'Sin descripción disponible.',
      still_path: data.still_path ? `https://image.tmdb.org/t/p/w780${data.still_path}` : null,
      calificacion_tmdb: data.vote_average,
      actores: elencoTotal.slice(0, 20).map((a) => ({
        id: a.id,
        nombre: a.name,
        personaje: a.character || 'Reparto',
        foto: a.profile_path ? `https://image.tmdb.org/t/p/w185${a.profile_path}` : null,
      })),
    });
  } catch (error) {
    console.error('Error al obtener detalle del episodio:', error.message);
    res.status(500).json({ error: 'Fallo al conectar con el servicio de TMDb' });
  }
};

// 5. Proveedores de Streaming (timeout estricto para evitar cuelgues)
const obtenerProveedoresStreaming = async (req, res) => {
  const { tipo, tmdb_id } = req.params;
  const usuario_id = req.usuario?.id || req.query.usuario_id;
  const endpointTipo = tipo && (tipo.toLowerCase() === 'serie' || tipo.toLowerCase() === 'tv') ? 'tv' : 'movie';
  const apiKey = process.env.TMDB_API_KEY;

  if (!tmdb_id || tmdb_id === 'undefined') {
    return res.json({ plataformas: [], ultima_plataforma: null });
  }

  try {
    const url = `${TMDB_BASE_URL}/${endpointTipo}/${tmdb_id}/watch/providers?api_key=${apiKey}`;
    const data = await fetchTMDBConTimeout(url, 2000);
    let plataformasOficiales = [];

    if (data) {
      const proveedoresAR = data.results?.AR?.flatrate || [];
      const nombresNormalizados = proveedoresAR.map((p) => {
        const nom = p.provider_name.toLowerCase();
        if (nom.includes('netflix')) return 'Netflix';
        if (nom.includes('max') || nom.includes('hbo')) return 'Max';
        if (nom.includes('disney')) return 'Disney+';
        if (nom.includes('amazon') || nom.includes('prime')) return 'Prime Video';
        if (nom.includes('apple')) return 'Apple TV+';
        return null;
      }).filter(Boolean);

      plataformasOficiales = [...new Set(nombresNormalizados)];
    }

    let ultimaPlataformaUsada = null;
    if (usuario_id) {
      const consultaUltima = `
        SELECT h.plataforma 
        FROM historial_visualizaciones h
        INNER JOIN obras_catalogo o ON h.obra_id = o.id
        WHERE h.usuario_id = $1 AND o.tmdb_id = $2 AND h.plataforma IS NOT NULL
        ORDER BY h.fecha_visto DESC, h.id DESC
        LIMIT 1;
      `;
      const resUltima = await pool.query(consultaUltima, [usuario_id, tmdb_id]);
      if (resUltima.rows.length > 0) {
        ultimaPlataformaUsada = resUltima.rows[0].plataforma;
      }
    }

    res.json({
      plataformas: plataformasOficiales,
      ultima_plataforma: ultimaPlataformaUsada,
    });
  } catch (error) {
    console.error('Error al obtener proveedores:', error.message);
    res.json({ plataformas: [], ultima_plataforma: null });
  }
};

// 6. Tendencias
const obtenerTendencias = async (req, res) => {
  const { tipo = 'movie', pais = 'GLOBAL', pagina = 1 } = req.query;
  const endpointTipo = tipo.toLowerCase() === 'serie' || tipo.toLowerCase() === 'tv' ? 'tv' : 'movie';
  const apiKey = process.env.TMDB_API_KEY;

  try {
    let url = '';
    if (pais === 'GLOBAL') {
      url = `${TMDB_BASE_URL}/trending/${endpointTipo}/week?api_key=${apiKey}&language=es-MX&page=${pagina}`;
    } else {
      url = `${TMDB_BASE_URL}/discover/${endpointTipo}?api_key=${apiKey}&language=es-MX&sort_by=popularity.desc&with_origin_country=${pais}&vote_count.gte=50&page=${pagina}&include_adult=false`;
    }

    const data = await fetchTMDBConTimeout(url, 3000);
    if (!data) {
      return res.status(500).json({ error: 'Error al consultar catálogo en TMDb' });
    }

    const resultados = (data.results || []).slice(0, 20).map((item) => ({
      tmdb_id: item.id,
      tipo: endpointTipo === 'tv' ? 'serie' : 'pelicula',
      titulo: item.title || item.name,
      anio: (item.release_date || item.first_air_date || '').substring(0, 4),
      sinopsis: item.overview || 'Sin descripción disponible.',
      poster_path: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : null,
      calificacion: item.vote_average ? item.vote_average.toFixed(1) : null,
    }));

    res.json(resultados);
  } catch (error) {
    console.error('Error al obtener tendencias:', error.message);
    res.status(500).json({ error: 'Error interno al consultar tendencias' });
  }
};

// 7. Filmografía combinada del Actor
const obtenerFilmografiaActor = async (req, res) => {
  const persona_id = req.params.persona_id || req.params.person_id;
  const apiKey = process.env.TMDB_API_KEY;

  try {
    const url = `${TMDB_BASE_URL}/person/${persona_id}/combined_credits?api_key=${apiKey}&language=es-MX`;
    const data = await fetchTMDBConTimeout(url, 3000);

    if (!data) {
      return res.status(404).json({ error: 'Actor no encontrado' });
    }

    const obras = (data.cast || [])
      .filter((it) => it.poster_path && (it.media_type === 'movie' || it.media_type === 'tv'))
      .sort((a, b) => (b.vote_count || 0) - (a.vote_count || 0))
      .slice(0, 30)
      .map((it) => ({
        tmdb_id: it.id,
        id: it.id,
        titulo: it.title || it.name,
        tipo: it.media_type === 'tv' ? 'serie' : 'pelicula',
        anio: (it.release_date || it.first_air_date || '').substring(0, 4),
        poster_path: `https://image.tmdb.org/t/p/w500${it.poster_path}`,
        sinopsis: it.overview,
        personaje: it.character,
        calificacion: it.vote_average ? it.vote_average.toFixed(1) : null,
      }));

    res.json(obras);
  } catch (err) {
    console.error('Error al obtener filmografía de actor:', err.message);
    res.status(500).json({ error: 'Error al procesar la filmografía' });
  }
};

module.exports = {
  buscarPeliculas,
  obtenerDetallePelicula,
  obtenerDetalleTemporada,
  obtenerDetalleEpisodioCompleto,
  obtenerProveedoresStreaming,
  obtenerTendencias,
  obtenerFilmografiaActor,
  obtenerCreditosActor: obtenerFilmografiaActor,
};