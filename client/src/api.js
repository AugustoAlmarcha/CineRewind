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

export const guardarCalificacionSerieTemporadaAPI = async (datos) => {
  const res = await fetch('/api/historial/calificaciones-series', {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(datos),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Error al guardar la calificación');
  }
  return res.json();
};

export const obtenerCalificacionesSerieAPI = async (tmdbId, usuarioId = null) => {
  if (!tmdbId) return { serie: null, temporadas: {} };
  const url = usuarioId
    ? `/api/historial/calificaciones-series/${tmdbId}?usuario_id=${usuarioId}`
    : `/api/historial/calificaciones-series/${tmdbId}`;
  const res = await fetch(url, { headers: getHeaders() });
  if (!res.ok) return { serie: null, temporadas: {} };
  return res.json();
};

export const obtenerCalificacionesSeriesUsuarioAPI = async (usuarioId) => {
  if (!usuarioId) return [];
  const res = await fetch(`/api/historial/calificaciones-series-usuario/${usuarioId}`, { headers: getHeaders() });
  if (!res.ok) return [];
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

// Solicitar correo de recuperación de contraseña
export const solicitarRecuperacionAPI = async (email) => {
  const res = await fetch('/api/auth/solicitar-recuperacion', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email })
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'No se pudo enviar la solicitud de recuperación');
  return data;
};

// Restablecer contraseña con el token recibido por email
export const restablecerPasswordAPI = async (token, passwordNueva) => {
  const res = await fetch('/api/auth/restablecer-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, passwordNueva })
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'No se pudo restablecer la contraseña');
  return data;
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
export const eliminarFavoritoAPI = async (posicion, tipo) => {
  const token = localStorage.getItem('cinerewind_token');
  const res = await fetch(`/api/favoritos/${posicion}?tipo=${tipo}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    }
  });
  if (!res.ok) throw new Error('Error al eliminar favorito');
  return await res.json();
};

// Obtener perfil público de cualquier usuario (con estado de amistad)
export const obtenerPerfilPublicoAPI = async (username) => {
  const token = localStorage.getItem('cinerewind_token');
  const res = await fetch(`/api/auth/usuario/${encodeURIComponent(username)}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    }
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Usuario no encontrado');
  }
  return res.json();
};

// Obtener las estadísticas acumuladas del usuario (o de un perfil visitado)
export const obtenerEstadisticasAPI = async (usuarioId = null) => {
  const token = localStorage.getItem('cinerewind_token');
  const url = usuarioId 
    ? `/api/historial/estadisticas?usuario_id=${usuarioId}`
    : '/api/historial/estadisticas';
  const res = await fetch(url, {
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  });
  if (!res.ok) return { total_series: 0, total_episodios: 0, total_peliculas: 0, horas_totales: 0 };
  return res.json();
};

// Obtener lista de pendientes (propia o de un perfil visitado)
export const obtenerPendientesAPI = async (usuarioId = null) => {
  const token = localStorage.getItem('cinerewind_token');
  const url = usuarioId 
    ? `/api/pendientes?usuario_id=${usuarioId}`
    : '/api/pendientes';
  const res = await fetch(url, {
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  });
  if (!res.ok) return [];
  return res.json();
};

// Alternar obra en pendientes (guardar / quitar)
export const alternarPendienteAPI = async (obra) => {
  const token = localStorage.getItem('cinerewind_token');
  const res = await fetch('/api/pendientes', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(obra)
  });
  if (!res.ok) throw new Error('Error al actualizar pendientes');
  return res.json();
};

// Eliminar obra de pendientes
export const eliminarPendienteAPI = async (tmdb_id) => {
  const token = localStorage.getItem('cinerewind_token');
  const res = await fetch(`/api/pendientes/${tmdb_id}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  if (!res.ok) throw new Error('Error al eliminar de pendientes');
  return res.json();
};

// Obtener récords personales (Maratón y Rewatch)
export const obtenerRecordsAPI = async () => {
  const token = localStorage.getItem('cinerewind_token');
  const res = await fetch('/api/historial/records', {
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  });
  if (!res.ok) return { maratonSerie: null, rewatchPelicula: null };
  return res.json();
};

// Importar historial desde CSV de Netflix
export const importarNetflixAPI = async (archivoCSV) => {
  const token = localStorage.getItem('cinerewind_token');
  const formData = new FormData();
  formData.append('archivo', archivoCSV);

  const res = await fetch('/api/historial/importar-netflix', {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Error al importar el archivo CSV');
  }

  return res.json();
};

// ==========================================
// RED SOCIAL: AMISTADES Y BÚSQUEDA DE CINÉFILOS
// ==========================================

export const buscarCinefilosAPI = async (termino) => {
  const token = localStorage.getItem('cinerewind_token');
  const res = await fetch(`/api/amigos/buscar?q=${encodeURIComponent(termino)}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new Error('Error al buscar usuarios');
  return await res.json();
};

export const enviarSolicitudAmistadAPI = async (destinatarioId) => {
  const token = localStorage.getItem('cinerewind_token');
  const res = await fetch('/api/amigos/solicitar', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ destinatario_id: destinatarioId }),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Error al enviar solicitud');
  }
  return await res.json();
};

export const obtenerSolicitudesPendientesAPI = async () => {
  const token = localStorage.getItem('cinerewind_token');
  const res = await fetch('/api/amigos/pendientes', {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new Error('Error al obtener solicitudes pendientes');
  return await res.json();
};

export const responderSolicitudAmistadAPI = async (solicitudId, accion) => {
  const token = localStorage.getItem('cinerewind_token');
  const res = await fetch('/api/amigos/responder', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ solicitud_id: solicitudId, accion }),
  });
  if (!res.ok) throw new Error('Error al responder solicitud');
  return await res.json();
};

export const obtenerAmigosAPI = async () => {
  const token = localStorage.getItem('cinerewind_token');
  const res = await fetch('/api/amigos', {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new Error('Error al obtener amigos');
  return await res.json();
};

export const eliminarAmigoAPI = async (amistadId) => {
  const token = localStorage.getItem('cinerewind_token');
  const res = await fetch(`/api/amigos/${amistadId}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Error al eliminar amigo');
  }
  return data;
};


// ==========================================
// CO-VISUALIZACIONES (HU-11)
// ==========================================

export const obtenerInvitacionesCovisionAPI = async () => {
  const token = localStorage.getItem('cinerewind_token');
  const res = await fetch('/api/covisualizaciones/pendientes', {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new Error('Error al obtener invitaciones');
  return await res.json();
};

export const responderInvitacionCovisionAPI = async (covisualizacionId, accion) => {
  const token = localStorage.getItem('cinerewind_token');
  const res = await fetch('/api/covisualizaciones/responder', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ covisualizacion_id: covisualizacionId, accion }),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Error al responder invitación');
  }
  return await res.json();
};

export const responderTodasInvitacionesCovisionAPI = async (accion = 'aceptar') => {
  const token = localStorage.getItem('cinerewind_token');
  const res = await fetch('/api/covisualizaciones/responder-todas', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ accion }),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Error al responder invitaciones');
  }
  return await res.json();
};

// Cambiar contraseña de la cuenta activa
export const cambiarPasswordAPI = async ({ passwordActual, passwordNueva }) => {
  const token = localStorage.getItem('cinerewind_token');
  const res = await fetch('/api/auth/cambiar-password', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ passwordActual, passwordNueva }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Error al cambiar la contraseña');
  }

  return data;
};

// Asignar contraseña a cuenta de Google o sin clave previa
export const asignarPasswordAPI = async ({ passwordNueva }) => {
  const token = localStorage.getItem('cinerewind_token');
  const res = await fetch('/api/auth/asignar-password', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ passwordNueva }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Error al asignar la contraseña');
  }

  return data;
};

// Obtener métricas globales del panel de administración
export const obtenerMetricasAdminAPI = async () => {
  const token = localStorage.getItem('cinerewind_token');
  const res = await fetch('/api/admin/metricas', {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Error al obtener métricas de administrador');
  }
  return data;
};

export const obtenerWrappedPeriodoAPI = async (anio, mes = null) => {
  const token = localStorage.getItem('cinerewind_token');
  const url = mes 
    ? `/api/historial/wrapped-periodo?anio=${anio}&mes=${mes}`
    : `/api/historial/wrapped-periodo?anio=${anio}`;

  const res = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    }
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Error al obtener Wrapped');
  }

  return await res.json();
};

// ==========================================
// ACCIONES DE ADMINISTRACIÓN
// ==========================================

// Actualizar rol de usuario (Admin)
export const actualizarRolUsuarioAdminAPI = async (usuarioId, rol) => {
  const token = localStorage.getItem('cinerewind_token');
  const res = await fetch(`/api/admin/usuarios/${usuarioId}/rol`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ rol }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Error al actualizar rol de usuario');
  }
  return data;
};

// Eliminar usuario (Admin)
export const eliminarUsuarioAdminAPI = async (usuarioId) => {
  const token = localStorage.getItem('cinerewind_token');
  const res = await fetch(`/api/admin/usuarios/${usuarioId}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Error al eliminar usuario');
  }
  return data;
};

// Obtener lista de reseñas para moderación (Admin)
export const obtenerReseniasAdminAPI = async () => {
  const token = localStorage.getItem('cinerewind_token');
  const res = await fetch('/api/admin/resenias', {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Error al obtener reseñas para moderar');
  }
  return data;
};

// Limpiar texto de reseña ofensiva (Admin)
export const eliminarTextoReseniaAdminAPI = async (reseniaId) => {
  const token = localStorage.getItem('cinerewind_token');
  const res = await fetch(`/api/admin/resenias/${reseniaId}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Error al eliminar texto de reseña');
  }
  return data;
};

// Eliminar registro de visualización fraudulento (Admin)
export const eliminarVisualizacionAdminAPI = async (visId) => {
  const token = localStorage.getItem('cinerewind_token');
  const res = await fetch(`/api/admin/visualizaciones/${visId}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Error al eliminar visualización');
  }
  return data;
};

// =========================================================================
// GESTIÓN AVANZADA DE SERIES (Completar y Limpiar)
// =========================================================================
export const completarTemporadaSerieAPI = async (obraId, temporada, fechaVisto = null, plataforma = null) => {
  const res = await fetch('/api/historial/series/completar-temporada', {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ obra_id: obraId, temporada, fecha_visto: fechaVisto, plataforma }),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Error al completar temporada');
  }
  return res.json();
};

export const completarSerieTotalAPI = async (obraId, fechaVisto = null, plataforma = null) => {
  const res = await fetch('/api/historial/series/completar-serie', {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ obra_id: obraId, fecha_visto: fechaVisto, plataforma }),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Error al completar serie');
  }
  return res.json();
};

export const limpiarDuplicadosSerieAPI = async (obraId, modo = 'eliminar_duplicados') => {
  const res = await fetch('/api/historial/series/limpiar-duplicados', {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ obra_id: obraId, modo }),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Error al limpiar duplicados');
  }
  return res.json();
};

export const asignarAcompananteLoteSerieAPI = async ({
  obraId,
  alcance = 'serie',
  temporada = null,
  historialIds = [],
  amigosEtiquetados = [],
  vistoConTexto = '',
  accion = 'asignar',
}) => {
  const res = await fetch('/api/historial/series/asignar-acompanante-lote', {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({
      obra_id: obraId,
      alcance,
      temporada,
      historial_ids: historialIds,
      amigos_etiquetados: amigosEtiquetados,
      visto_con_texto: vistoConTexto,
      accion,
    }),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Error al procesar acompañantes de la serie');
  }
  return res.json();
};
