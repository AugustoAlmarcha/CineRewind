// backend/controllers/peliculasController.js

const buscarPeliculas = async (req, res) => {
  const { query } = req.query;

  if (!query) {
    return res.status(400).json({ error: 'Debes ingresar un término de búsqueda' });
  }

  try {
    const url = `https://api.themoviedb.org/3/search/multi?api_key=${process.env.TMDB_API_KEY}&language=es-MX&query=${encodeURIComponent(query)}&page=1&include_adult=false`;

    const respuesta = await fetch(url);
    const data = await respuesta.json();

    const resultados = (data.results || [])
      .filter((item) => item.media_type === 'movie' || item.media_type === 'tv')
      .map((item) => ({
        tmdb_id: item.id,
        tipo: item.media_type === 'movie' ? 'PELICULA' : 'SERIE',
        titulo: item.title || item.name,
        anio: (item.release_date || item.first_air_date || '').substring(0, 4),
        sinopsis: item.overview,
        poster_path: item.poster_path
          ? `https://image.tmdb.org/t/p/w500${item.poster_path}`
          : null,
      }));

    res.json(resultados);
  } catch (error) {
    console.error('Error al conectar con TMDb:', error.message);
    res.status(500).json({ error: 'Error interno al consultar el catálogo de películas' });
  }
};

const obtenerDetallePelicula = async (req, res) => {
  const { tipo, tmdb_id } = req.params;
  const endpointTipo = tipo.toLowerCase() === 'serie' || tipo.toLowerCase() === 'tv' ? 'tv' : 'movie';

  try {
    const url = `https://api.themoviedb.org/3/${endpointTipo}/${tmdb_id}?api_key=${process.env.TMDB_API_KEY}&language=es-MX`;

    const respuesta = await fetch(url);
    if (!respuesta.ok) {
      return res.status(respuesta.status).json({ error: 'Obra no encontrada en TMDb' });
    }

    const data = await respuesta.json();

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
    };

    res.json(detalle);
  } catch (error) {
    console.error('Error al obtener detalle de TMDb:', error.message);
    res.status(500).json({ error: 'Error al consultar detalles de la obra' });
  }
};

// Obtener episodios de una temporada con sus fotos horizontales
const obtenerDetalleTemporada = async (req, res) => {
  const { tmdb_id, season_number } = req.params;

  try {
    const url = `https://api.themoviedb.org/3/tv/${tmdb_id}/season/${season_number}?api_key=${process.env.TMDB_API_KEY}&language=es-MX`;
    const respuesta = await fetch(url);

    if (!respuesta.ok) {
      return res.status(respuesta.status).json({ error: 'Temporada no encontrada en TMDb' });
    }

    const data = await respuesta.json();

    const episodios = (data.episodes || []).map((ep) => ({
      episodio_numero: ep.episode_number,
      nombre: ep.name,
      sinopsis: ep.overview,
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

module.exports = {
  buscarPeliculas,
  obtenerDetallePelicula,
  obtenerDetalleTemporada,
};