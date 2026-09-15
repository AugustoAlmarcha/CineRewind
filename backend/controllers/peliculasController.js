// backend/controllers/peliculasController.js

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

// 1. Buscador de Películas y Series
const buscarPeliculas = async (req, res) => {
  const { query } = req.query;

  if (!query) {
    return res.status(400).json({ error: 'Debes ingresar un término de búsqueda' });
  }

  try {
    const url = `${TMDB_BASE_URL}/search/multi?api_key=${process.env.TMDB_API_KEY}&language=es-MX&query=${encodeURIComponent(query)}&page=1&include_adult=false`;

    const respuesta = await fetch(url);
    const data = await respuesta.json();

    const resultados = (data.results || [])
      .filter((item) => item.media_type === 'movie' || item.media_type === 'tv')
      .map((item) => ({
        tmdb_id: item.id,
        tipo: item.media_type === 'movie' ? 'PELICULA' : 'SERIE',
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
    res.status(500).json({ error: 'Error interno al consultar el catálogo de películas' });
  }
};

// 2. Ficha y créditos de Película o Serie
const obtenerDetallePelicula = async (req, res) => {
  const { tipo, tmdb_id } = req.params;
  const endpointTipo = tipo.toLowerCase() === 'serie' || tipo.toLowerCase() === 'tv' ? 'tv' : 'movie';

  try {
    // Agregamos append_to_response=credits para traer el elenco en una sola llamada
    const url = `https://api.themoviedb.org/3/${endpointTipo}/${tmdb_id}?api_key=${process.env.TMDB_API_KEY}&language=es-MX&append_to_response=credits`;
    const respuesta = await fetch(url);
    if (!respuesta.ok) {
      return res.status(respuesta.status).json({ error: 'Obra no encontrada en TMDb' });
    }

    const data = await respuesta.json();

    // Mapear los primeros 12 actores principales
    const reparto = (data.credits?.cast || []).slice(0, 12).map((actor) => ({
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
      poster_path: data.poster_path
        ? `https://image.tmdb.org/t/p/w500${data.poster_path}`
        : null,
      duracion_minutos: data.runtime || (data.episode_run_time ? data.episode_run_time[0] : null),
      generos: (data.genres || []).map((g) => g.name),
      total_temporadas: data.number_of_seasons || null,
      total_episodios: data.number_of_episodes || null,
      reparto, // <-- agregado
    };

    res.json(detalle);
  } catch (error) {
    console.error('Error al obtener detalle de TMDb:', error.message);
    res.status(500).json({ error: 'Error al consultar detalles de la obra' });
  }
};

// 3. Detalle de Temporada (con portadas horizontales still_path por capítulo)
const obtenerDetalleTemporada = async (req, res) => {
  const { tmdb_id, season_number } = req.params;

  try {
    let url = `${TMDB_BASE_URL}/tv/${tmdb_id}/season/${season_number}?api_key=${process.env.TMDB_API_KEY}&language=es-MX`;
    let respuesta = await fetch(url);

    if (!respuesta.ok) {
      url = `${TMDB_BASE_URL}/tv/${tmdb_id}/season/${season_number}?api_key=${process.env.TMDB_API_KEY}`;
      respuesta = await fetch(url);
    }

    if (!respuesta.ok) {
      return res.status(respuesta.status).json({ error: 'Temporada no encontrada en TMDb' });
    }

    const data = await respuesta.json();

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
      poster_temporada: data.poster_path 
        ? `https://image.tmdb.org/t/p/w500${data.poster_path}` 
        : null,
      episodios,
    });
  } catch (error) {
    console.error('Error al obtener episodios:', error.message);
    res.status(500).json({ error: 'Error al consultar episodios en TMDb' });
  }
};

// 4. Detalle Completo de Episodio (Con sinopsis, captura horizontal y elenco de actores)
const obtenerDetalleEpisodioCompleto = async (req, res) => {
  const { tmdb_id, temporada, episodio } = req.params;
  const apiKey = process.env.TMDB_API_KEY;

  if (!tmdb_id || tmdb_id === 'undefined' || !temporada || !episodio) {
    return res.status(400).json({ error: 'Faltan parámetros de consulta del episodio' });
  }

  try {
    let url = `${TMDB_BASE_URL}/tv/${tmdb_id}/season/${temporada}/episode/${episodio}?api_key=${apiKey}&language=es-MX&append_to_response=credits`;
    let respuesta = await fetch(url);

    // Si no responde en español, recurrir a idioma por defecto para no romper fotos ni actores
    if (!respuesta.ok) {
      url = `${TMDB_BASE_URL}/tv/${tmdb_id}/season/${temporada}/episode/${episodio}?api_key=${apiKey}&append_to_response=credits`;
      respuesta = await fetch(url);
    }

    if (!respuesta.ok) {
      return res.status(respuesta.status).json({ error: 'Episodio no encontrado en TMDb' });
    }

    const data = await respuesta.json();

    const elencoTotal = [
      ...(data.credits?.cast || []),
      ...(data.guest_stars || []),
    ];

    res.json({
      nombre: data.name,
      sinopsis: data.overview || 'Sin descripción disponible.',
      still_path: data.still_path ? `https://image.tmdb.org/t/p/w780${data.still_path}` : null,
      calificacion_tmdb: data.vote_average,
      actores: elencoTotal.slice(0, 15).map((a) => ({
        id: a.id,
        nombre: a.name,
        personaje: a.character || 'Reparto',
        foto: a.profile_path ? `https://image.tmdb.org/t/p/w185${a.profile_path}` : null,
      })),
    });
  } catch (error) {
    console.error('Error al obtener detalle del episodio TMDb:', error.message);
    res.status(500).json({ error: 'Fallo al conectar con el servicio de TMDb' });
  }
};
// 5. Obtener proveedores de streaming en Argentina (TMDb / JustWatch)
const obtenerProveedoresStreaming = async (req, res) => {
  const { tipo, tmdb_id } = req.params;
  const endpointTipo = tipo.toLowerCase() === 'serie' || tipo.toLowerCase() === 'tv' ? 'tv' : 'movie';
  const apiKey = process.env.TMDB_API_KEY;

  try {
    const url = `${TMDB_BASE_URL}/${endpointTipo}/${tmdb_id}/watch/providers?api_key=${apiKey}`;
    const respuesta = await fetch(url);
    if (!respuesta.ok) return res.json([]);

    const data = await respuesta.json();
    // Tomar las plataformas por suscripción plana (flatrate) disponibles en Argentina (AR)
    const proveedoresAR = data.results?.AR?.flatrate || [];

    // Mapear los nombres de TMDb/JustWatch a los IDs exactos de nuestro sistema
    const nombresNormalizados = proveedoresAR.map((p) => {
      const nom = p.provider_name.toLowerCase();
      if (nom.includes('netflix')) return 'Netflix';
      if (nom.includes('max') || nom.includes('hbo')) return 'Max';
      if (nom.includes('disney')) return 'Disney+';
      if (nom.includes('amazon') || nom.includes('prime')) return 'Prime Video';
      if (nom.includes('apple')) return 'Apple TV+';
      return null;
    }).filter(Boolean);

    // Retornar lista de plataformas únicas reconocidas
    const unicas = [...new Set(nombresNormalizados)];
    res.json(unicas);
  } catch (error) {
    console.error('Error al obtener proveedores TMDb:', error.message);
    res.json([]);
  }
};

// 6. Obtener Tendencias Globales o Populares Disponibles en Streaming por País
// 6. Obtener Tendencias Globales o Top Histórico por País de Origen
const obtenerTendencias = async (req, res) => {
  const { tipo = 'movie', pais = 'GLOBAL', pagina = 1 } = req.query;
  const endpointTipo = tipo.toLowerCase() === 'serie' || tipo.toLowerCase() === 'tv' ? 'tv' : 'movie';
  const apiKey = process.env.TMDB_API_KEY;

  try {
    let url = '';

    if (pais === 'GLOBAL') {
      // Lo más popular y comentado en el mundo esta semana
      url = `${TMDB_BASE_URL}/trending/${endpointTipo}/week?api_key=${apiKey}&language=es-MX&page=${pagina}`;
    } else {
      // Top de producciones originarias de ese país específico
      url = `${TMDB_BASE_URL}/discover/${endpointTipo}?api_key=${apiKey}&language=es-MX&sort_by=popularity.desc&with_origin_country=${pais}&vote_count.gte=50&page=${pagina}&include_adult=false`;
    }

    const respuesta = await fetch(url);
    if (!respuesta.ok) {
      return res.status(respuesta.status).json({ error: 'Error al consultar catálogo en TMDb' });
    }

    const data = await respuesta.json();

    const resultados = (data.results || []).slice(0, 20).map((item) => ({
      tmdb_id: item.id,
      tipo: endpointTipo === 'tv' ? 'serie' : 'pelicula',
      titulo: item.title || item.name,
      anio: (item.release_date || item.first_air_date || '').substring(0, 4),
      sinopsis: item.overview || 'Sin descripción disponible.',
      poster_path: item.poster_path
        ? `https://image.tmdb.org/t/p/w500${item.poster_path}`
        : null,
      calificacion: item.vote_average ? item.vote_average.toFixed(1) : null,
    }));

    res.json(resultados);
  } catch (error) {
    console.error('Error al obtener producciones:', error.message);
    res.status(500).json({ error: 'Error interno al consultar catálogo' });
  }
};

// Obtener créditos combinados (películas y series) de un actor/actriz
const obtenerCreditosActor = async (req, res) => {
  const { person_id } = req.params;
  const apiKey = process.env.TMDB_API_KEY;

  try {
    const url = `${TMDB_BASE_URL}/person/${person_id}/combined_credits?api_key=${apiKey}&language=es-MX`;
    const r = await fetch(url);
    if (!r.ok) return res.status(404).json({ error: 'Actor no encontrado en TMDb' });
    const data = await r.json();

    // Filtramos solo películas y series, ordenadas por popularidad
    const obras = (data.cast || [])
      .filter((item) => item.media_type === 'movie' || item.media_type === 'tv')
      .sort((a, b) => (b.vote_count || 0) - (a.vote_count || 0))
      .slice(0, 24)
      .map((item) => ({
        tmdb_id: item.id,
        tipo: item.media_type === 'tv' ? 'serie' : 'pelicula',
        titulo: item.title || item.name,
        personaje: item.character || 'Reparto',
        anio: (item.release_date || item.first_air_date || '').substring(0, 4),
        poster_path: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : null,
        calificacion: item.vote_average ? item.vote_average.toFixed(1) : null,
      }));

    res.json(obras);
  } catch (error) {
    console.error('Error al obtener filmografía:', error.message);
    res.status(500).json({ error: 'Error interno al consultar filmografía' });
  }
};

// GET: Obtener filmografía combinada de un actor
const obtenerFilmografiaActor = async (req, res) => {
  const { persona_id } = req.params;
  const apiKey = process.env.TMDB_API_KEY;

  try {
    const url = `https://api.themoviedb.org/3/person/${persona_id}/combined_credits?api_key=${apiKey}&language=es-MX`;
    const resp = await fetch(url);
    if (!resp.ok) {
      return res.status(resp.status).json({ error: 'Error al consultar actor en TMDb' });
    }
    const data = await resp.json();

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
  obtenerCreditosActor,
  obtenerFilmografiaActor,
};