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