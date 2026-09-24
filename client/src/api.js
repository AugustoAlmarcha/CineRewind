// client/src/api.js

export const buscarPeliculasAPI = async (query) => {
  const res = await fetch(`/api/peliculas/buscar?query=${encodeURIComponent(query)}`);
  if (!res.ok) throw new Error('Error al buscar obras');
  return res.json();
};

export const obtenerViendoActualmenteAPI = async (usuarioId = 1) => {
  const res = await fetch(`/api/historial/viendo-actualmente/${usuarioId}`);
  if (!res.ok) throw new Error('Error al obtener series en curso');
  return res.json();
};

export const avanzarCapituloAPI = async (datos) => {
  const res = await fetch('/api/historial/avanzar-capitulo', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(datos),
  });
  if (!res.ok) throw new Error('Error al avanzar capítulo');
  return res.json();
};

export const obtenerTimelineAPI = async (usuarioId = 1, tipo = '') => {
  const url = tipo 
    ? `/api/historial/timeline/${usuarioId}?tipo=${tipo}` 
    : `/api/historial/timeline/${usuarioId}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Error al obtener timeline');
  return res.json();
};

export const registrarVisualizacionAPI = async (datos) => {
  const res = await fetch('/api/historial/registrar', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(datos),
  });
  if (!res.ok) throw new Error('Error al registrar visualización');
  return res.json();
};

export const eliminarVisualizacionAPI = async (id) => {
  const res = await fetch(`/api/historial/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Error al eliminar la visualización');
  return res.json();
};

export const descartarViendoAPI = async (usuarioId, obraId) => {
  const res = await fetch(`/api/historial/viendo-actualmente/${usuarioId}/${obraId}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Error al descartar de viendo actualmente');
  return res.json();
};

// Obtener episodios y fotos de una temporada concreta
export const obtenerEpisodiosTemporadaAPI = async (tmdbId, seasonNumber) => {
  const res = await fetch(`/api/peliculas/serie/${tmdbId}/temporada/${seasonNumber}`);
  if (!res.ok) throw new Error('Error al cargar episodios');
  return res.json();
};

export const registrarLoteAPI = async (datos) => {
  const res = await fetch('/api/historial/registrar-lote', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(datos),
  });
  if (!res.ok) throw new Error('Error al registrar los capítulos');
  return res.json();
};

export const obtenerEpisodiosVistosAPI = async (usuarioId, tmdbId, temporada) => {
  const res = await fetch(`/api/historial/vistos/${usuarioId}/${tmdbId}/${temporada}`);
  if (!res.ok) throw new Error('Error al cargar capítulos vistos');
  return res.json();
};

export const obtenerDetalleEpisodioAPI = async (tmdbId, temp, ep) => {
  const res = await fetch(`/api/peliculas/serie/${tmdbId}/temporada/${temp}/episodio/${ep}`);
  if (!res.ok) throw new Error('Error al cargar detalle del capítulo');
  return res.json();
};

export const guardarReseniaAPI = async (id, datos) => {
  if (!id) throw new Error('ID de visualización no válido');
  const res = await fetch(`/api/historial/${id}/resenia`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(datos),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Error al guardar la reseña');
  }
  return res.json();
};

export const eliminarLoteAPI = async (ids) => {
  const res = await fetch('/api/historial/lote/eliminar', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ids }),
  });
  if (!res.ok) throw new Error('Error al eliminar los registros seleccionados');
  return res.json();
};
export const formatearImagenTMDb = (ruta, tamano = 'w500') => {
  if (!ruta) return null;
  if (ruta.startsWith('http')) return ruta;
  return `https://image.tmdb.org/t/p/${tamano}${ruta.startsWith('/') ? ruta : `/${ruta}`}`;
};

// GET: Detalle de película o serie desde TMDb (temporadas, géneros, actores)
export const obtenerDetallePeliculaAPI = async (tipo, tmdb_id) => {
  const res = await fetch(`/api/peliculas/detalle/${tipo}/${tmdb_id}`);
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Error al obtener detalles de la obra');
  }
  return await res.json();
};

export const obtenerProveedoresAPI = async (tipo, tmdbId, usuarioId) => {
  try {
    const queryUser = usuarioId ? `?usuario_id=${usuarioId}` : '';
    const res = await fetch(`/api/peliculas/proveedores/${tipo}/${tmdbId}${queryUser}`);
    if (!res.ok) return { plataformas: [], ultima_plataforma: null };
    return await res.json();
  } catch {
    return { plataformas: [], ultima_plataforma: null };
  }
};

// En client/src/api.js
export const obtenerTendenciasAPI = async (tipo = 'movie', pais = 'GLOBAL', pagina = 1) => {
  const res = await fetch(`/api/peliculas/tendencias?tipo=${tipo}&pais=${pais}&pagina=${pagina}`);
  if (!res.ok) throw new Error('Error al obtener tendencias');
  return res.json();
};

// Obtener películas y series de un actor/actriz
export const obtenerFilmografiaActorAPI = async (personId) => {
  const res = await fetch(`/api/peliculas/actor/${personId}/obras`);
  if (!res.ok) throw new Error('Error al obtener la filmografía del actor');
  return res.json();
};