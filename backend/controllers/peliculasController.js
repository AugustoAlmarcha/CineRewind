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

// backend/controllers/peliculasController.js
const obtenerDetallePelicula = async (req, res) => {
  const { tipo, tmdb_id } = req.params;
  const endpointTipo = tipo.toLowerCase() === 'serie' || tipo.toLowerCase() === 'tv' ? 'tv' : 'movie';

  try {
    const url = `https://api.themoviedb.org/3/${endpointTipo}/${tmdb_id}?api_key=${process.env.TMDB_API_KEY}&language=es-MX`;
    let respuesta = await fetch(url);
    if (!respuesta.ok) {
      respuesta = await fetch(`https://api.themoviedb.org/3/${endpointTipo}/${tmdb_id}?api_key=${process.env.TMDB_API_KEY}`);
    }

    if (!respuesta.ok) return res.status(404).json({ error: 'Obra no encontrada' });
    const data = await respuesta.json();

    res.json({
      tmdb_id: data.id,
      tipo: endpointTipo === 'tv' ? 'serie' : 'pelicula',
      titulo: data.title || data.name,
      anio: (data.release_date || data.first_air_date || '').substring(0, 4),
      sinopsis: data.overview,
      poster_path: data.poster_path ? `https://image.tmdb.org/t/p/w500${data.poster_path}` : null,
      total_temporadas: data.number_of_seasons || (data.seasons ? data.seasons.filter(s => s.season_number > 0).length : 1),
      seasons: (data.seasons || []).filter(s => s.season_number > 0).map(s => ({
        season_number: s.season_number,
        nombre: s.name,
        total_episodios: s.episode_count
      }))
    });
  } catch (error) {
    console.error('Error al obtener detalle:', error.message);
    res.status(500).json({ error: 'Error al consultar TMDb' });
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

module.exports = {
  buscarPeliculas,
  obtenerDetallePelicula,
  obtenerDetalleTemporada,
  obtenerDetalleEpisodioCompleto,
};