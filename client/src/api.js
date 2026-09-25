// Helper interno para adjuntar el JWT automáticamente si existe
const getHeaders = (extraHeaders = {}) => {
  const token = localStorage.getItem('cinerewind_token');
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...extraHeaders
  };
};

/* =========================================================================
   1. RUTAS PÚBLICAS / TMDB (Catálogo, Detalles, Búsquedas)
   ========================================================================= */

export const buscarPeliculasAPI = async (query) => {
  const res = await fetch(`/api/peliculas/buscar?query=${encodeURIComponent(query)}`);
  if (!res.ok) throw new Error('Error al buscar obras');
  return res.json();
};

export const obtenerEpisodiosTemporadaAPI = async (tmdbId, seasonNumber) => {
  const res = await fetch(`/api/peliculas/serie/${tmdbId}/temporada/${seasonNumber}`);
  if (!res.ok) throw new Error('Error al cargar episodios');
  return res.json();
};

export const obtenerDetalleEpisodioAPI = async (tmdbId, temp, ep) => {
  const res = await fetch(`/api/peliculas/serie/${tmdbId}/temporada/${temp}/episodio/${ep}`);
  if (!res.ok) throw new Error('Error al cargar detalle del capítulo');
  return res.json();
};

export const obtenerDetallePeliculaAPI = async (tipo, tmdb_id) => {
  const res = await fetch(`/api/peliculas/detalle/${tipo}/${tmdb_id}`);
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Error al obtener detalles de la obra');
  }
  return res.json();
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

export const obtenerTendenciasAPI = async (tipo = 'movie', pais = 'GLOBAL', pagina = 1) => {
  const res = await fetch(`/api/peliculas/tendencias?tipo=${tipo}&pais=${pais}&pagina=${pagina}`);
  if (!res.ok) throw new Error('Error al obtener tendencias');
  return res.json();
};

export const obtenerFilmografiaActorAPI = async (personId) => {
  const res = await fetch(`/api/peliculas/actor/${personId}/obras`);
  if (!res.ok) throw new Error('Error al obtener la filmografía del actor');
  return res.json();
};

/* =========================================================================
   2. RUTAS PRIVADAS / HISTORIAL DEL USUARIO (Requieren JWT)
   ========================================================================= */

export const obtenerViendoActualmenteAPI = async (usuarioId) => {
  if (!usuarioId) return [];
  const res = await fetch(`/api/historial/viendo-actualmente/${usuarioId}`, {
    headers: getHeaders()
  });
  if (!res.ok) throw new Error('Error al obtener series en curso');
  return res.json();
};

export const obtenerTimelineAPI = async (usuarioId, tipo = '') => {
  if (!usuarioId) return [];
  const url = tipo 
    ? `/api/historial/timeline/${usuarioId}?tipo=${tipo}` 
    : `/api/historial/timeline/${usuarioId}`;
    
  const res = await fetch(url, { headers: getHeaders() });
  if (!res.ok) throw new Error('Error al obtener timeline');
  return res.json();
};

export const avanzarCapituloAPI = async (datos) => {
  const res = await fetch('/api/historial/avanzar-capitulo', {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(datos),
  });
  if (!res.ok) throw new Error('Error al avanzar capítulo');
  return res.json();
};

export const registrarVisualizacionAPI = async (datos) => {
  const res = await fetch('/api/historial/registrar', {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(datos),
  });
  if (!res.ok) throw new Error('Error al registrar visualización');
  return res.json();
};

export const eliminarVisualizacionAPI = async (id) => {
  const res = await fetch(`/api/historial/${id}`, {
    method: 'DELETE',
    headers: getHeaders(),
  });
  if (!res.ok) throw new Error('Error al eliminar la visualización');
  return res.json();
};

export const descartarViendoAPI = async (usuarioId, obraId) => {
  const res = await fetch(`/api/historial/viendo-actualmente/${usuarioId}/${obraId}`, {
    method: 'DELETE',
    headers: getHeaders(),
  });
  if (!res.ok) throw new Error('Error al descartar de viendo actualmente');
  return res.json();
};

export const registrarLoteAPI = async (datos) => {
  const res = await fetch('/api/historial/registrar-lote', {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(datos),
  });
  if (!res.ok) throw new Error('Error al registrar los capítulos');
  return res.json();
};

export const obtenerEpisodiosVistosAPI = async (usuarioId, tmdbId, temporada) => {
  const res = await fetch(`/api/historial/vistos/${usuarioId}/${tmdbId}/${temporada}`, {
    headers: getHeaders()
  });
  if (!res.ok) throw new Error('Error al cargar capítulos vistos');
  return res.json();
};

export const guardarReseniaAPI = async (id, datos) => {
  if (!id) throw new Error('ID de visualización no válido');
  const res = await fetch(`/api/historial/${id}/resenia`, {
    method: 'PATCH',
    headers: getHeaders(),
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
    headers: getHeaders(),
    body: JSON.stringify({ ids }),
  });
  if (!res.ok) throw new Error('Error al eliminar los registros seleccionados');
  return res.json();
};

export const actualizarPlataformaSerieAPI = async ({ obra_id, plataforma, solo_vacios = true }) => {
  const res = await fetch('/api/historial/actualizar-plataforma-serie', {
    method: 'PATCH',
    headers: getHeaders(),
    body: JSON.stringify({ obra_id, plataforma, solo_vacios }),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Error al actualizar las plataformas de la serie');
  }
  return res.json();
};

/* =========================================================================
   3. HELPERS DE IMAGEN
   ========================================================================= */

export const formatearImagenTMDb = (ruta, tamano = 'w500') => {
  if (!ruta) return null;
  if (ruta.startsWith('http')) return ruta;
  return `https://image.tmdb.org/t/p/${tamano}${ruta.startsWith('/') ? ruta : `/${ruta}`}`;
};

// Actualizar datos del perfil de usuario
export const actualizarPerfilAPI = async (datos) => {
  const token = localStorage.getItem('cinerewind_token');
  const res = await fetch('/api/auth/perfil', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(datos),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Error al actualizar el perfil');
  }

  return data;
};

// Comprobar disponibilidad de username en tiempo real
export const comprobarUsernameAPI = async (username) => {
  const token = localStorage.getItem('cinerewind_token');
  const res = await fetch(`/api/auth/comprobar-username?username=${encodeURIComponent(username)}`, {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    }
  });
  if (!res.ok) return { disponible: false };
  return res.json();
};

// Obtener los favoritos del Top 4 de un usuario
export const obtenerFavoritosAPI = async (username) => {
  const res = await fetch(`/api/favoritos/${username}`);
  if (!res.ok) return [];
  return res.json();
};

// Guardar o reemplazar una posición (1 al 4)
export const guardarFavoritoAPI = async (datos) => {
  const token = localStorage.getItem('cinerewind_token');
  const res = await fetch('/api/favoritos', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(datos)
  });
  if (!res.ok) throw new Error('Error al guardar el favorito');
  return res.json();
};

// Quitar un favorito de una ranura
export const eliminarFavoritoAPI = async (posicion) => {
  const token = localStorage.getItem('cinerewind_token');
  const res = await fetch(`/api/favoritos/${posicion}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  if (!res.ok) throw new Error('Error al eliminar el favorito');
  return res.json();
};

// Obtener las estadísticas acumuladas del usuario
export const obtenerEstadisticasAPI = async () => {
  const token = localStorage.getItem('cinerewind_token');
  const res = await fetch('/api/historial/estadisticas', {
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  });
  if (!res.ok) return { total_series: 0, total_episodios: 0, total_peliculas: 0, horas_totales: 0 };
  return res.json();
};