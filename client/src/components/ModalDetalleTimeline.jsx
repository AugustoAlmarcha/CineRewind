import React, { useState, useEffect } from 'react';
import { guardarReseniaAPI, obtenerDetalleEpisodioAPI } from '../api';

export default function ModalDetalleTimeline({ item, onClose, onActualizado }) {
  const visualizacionId = item.visualizacion_id || item.id;
  const [calificacion, setCalificacion] = useState(item.calificacion ? Number(item.calificacion) : 0);
  const [resenia, setResenia] = useState(item.resenia || '');
  const [guardando, setGuardando] = useState(false);
  const [detalle, setDetalle] = useState(null);
  const [cargandoDetalle, setCargandoDetalle] = useState(false);
  const [mostrarActores, setMostrarActores] = useState(false);

  const esSerie = item.tipo?.toLowerCase() === 'serie';

useEffect(() => {
    if (!esSerie) return;
    // Extraer el identificador correcto venga como tmdb_id u obra_tmdb_id
    const tmdbId = item.tmdb_id || item.obra_tmdb_id;
    if (!tmdbId || !item.temporada || !item.episodio) return;

    const cargar = async () => {
      setCargandoDetalle(true);
      try {
        const data = await obtenerDetalleEpisodioAPI(tmdbId, item.temporada, item.episodio);
        setDetalle(data);
      } catch (err) {
        console.warn('Detalle de capítulo no disponible:', err.message);
      } finally {
        setCargandoDetalle(false);
      }
    };
    cargar();
  }, [item, esSerie]);

  // Clic en la mitad izquierda o derecha de la estrella
  const handleStarClick = (e, index) => {
    const { left, width } = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - left;
    const isHalf = clickX < width / 2;
    const value = isHalf ? index - 0.5 : index;
    setCalificacion(value === calificacion ? 0 : value);
  };

  const handleGuardar = async () => {
    if (!visualizacionId) {
      alert('Error: No se encontró el identificador del registro.');
      return;
    }
    setGuardando(true);
    try {
      await guardarReseniaAPI(visualizacionId, {
        calificacion: calificacion > 0 ? Number(calificacion) : null,
        resenia: resenia.trim() || null,
      });
      onActualizado();
      onClose();
    } catch (err) {
      alert(err.message);
    } finally {
      setGuardando(false);
    }
  };

  const fotoCabecera = detalle?.still_path || item.poster_path;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-[#fcfaf7] dark:bg-[#141418] border border-neutral-300 dark:border-white/10 rounded-3xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-neutral-900 dark:text-white my-auto">
        
        {/* Banner con foto del capítulo */}
        <div className="relative w-full h-52 bg-neutral-900 flex-shrink-0">
          {fotoCabecera ? (
            <img src={fotoCabecera} alt={item.titulo} className="w-full h-full object-cover opacity-85" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-neutral-500">Sin foto</div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#fcfaf7] dark:from-[#141418] via-black/30 to-transparent flex justify-between items-start p-5">
            <span className="bg-rose-600 text-white font-black text-xs px-2.5 py-1 rounded-lg uppercase tracking-wider shadow">
              {item.tipo} {item.temporada ? `· T${item.temporada} E${item.episodio}` : ''}
            </span>
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-black/60 hover:bg-rose-600 text-white flex items-center justify-center transition cursor-pointer">
              ✕
            </button>
          </div>
          <div className="absolute bottom-3 left-6 right-6">
            <h2 className="text-2xl font-black text-neutral-900 dark:text-white drop-shadow-md truncate">{item.titulo}</h2>
            {detalle?.nombre && (
              <p className="text-sm font-bold text-rose-600 dark:text-rose-400 truncate">Capítulo {item.episodio}: {detalle.nombre}</p>
            )}
          </div>
        </div>

        {/* Cuerpo */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Sinopsis */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Sinopsis</label>
            <p className="text-xs leading-relaxed text-neutral-700 dark:text-neutral-300">
              {cargandoDetalle ? 'Cargando información oficial...' : (detalle?.sinopsis || item.sinopsis || 'Sin descripción disponible.')}
            </p>
          </div>

          {/* Reparto de actores */}
          {detalle?.actores?.length > 0 && (
            <div className="border border-neutral-300 dark:border-white/10 rounded-2xl p-4 bg-neutral-100/60 dark:bg-white/5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold flex items-center gap-2">
                  <span>🎭</span> Elenco del capítulo ({detalle.actores.length})
                </span>
                <button
                  type="button"
                  onClick={() => setMostrarActores(!mostrarActores)}
                  className="text-xs font-bold text-rose-600 dark:text-rose-400 hover:underline cursor-pointer"
                >
                  {mostrarActores ? 'Ocultar' : 'Ver actores'}
                </button>
              </div>

            {mostrarActores && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 pt-3">
                {detalle.actores.map((actor) => (
                  <div 
                    key={actor.id} 
                    className="bg-white dark:bg-neutral-900/90 rounded-2xl overflow-hidden border border-neutral-200 dark:border-white/10 shadow-sm hover:scale-105 transition duration-200 flex flex-col"
                  >
                    {/* Foto de actor en formato póster vertical grande */}
                    <div className="w-full aspect-[2/3] bg-neutral-800 overflow-hidden relative">
                      {actor.foto ? (
                        <img 
                          src={actor.foto} 
                          alt={actor.nombre} 
                          className="w-full h-full object-cover" 
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-neutral-500 text-xs gap-1">
                          <span className="text-2xl">🎭</span>
                          <span>Sin foto</span>
                        </div>
                      )}
                    </div>
                    <div className="p-3 flex flex-col justify-between flex-1">
                      <p className="text-xs font-black truncate text-neutral-900 dark:text-white" title={actor.nombre}>
                        {actor.nombre}
                      </p>
                      <p className="text-[11px] text-rose-600 dark:text-rose-400 font-bold truncate mt-0.5" title={actor.personaje}>
                        {actor.personaje}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
            </div>
          )}

          {/* Calificación interactiva con clic y slider */}
          <div className="space-y-3 bg-neutral-100 dark:bg-white/5 p-4 rounded-2xl border border-neutral-200 dark:border-white/5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Tu Puntuación</label>
              <span className="text-lg font-black text-amber-500">★ {calificacion > 0 ? calificacion.toFixed(1) : '0.0'} / 5.0</span>
            </div>

            {/* 5 Estrellas clickeables por mitades */}
            <div className="flex justify-center gap-2 py-1">
              {[1, 2, 3, 4, 5].map((index) => {
                const fillPercentage = Math.min(100, Math.max(0, (calificacion - (index - 1)) * 100));
                return (
                  <div
                    key={index}
                    onClick={(e) => handleStarClick(e, index)}
                    className="relative text-3xl select-none cursor-pointer transition-transform hover:scale-110"
                    title={`Seleccionar ${index - 0.5} o ${index}`}
                  >
                    <span className="text-neutral-300 dark:text-neutral-700">★</span>
                    <span 
                      className="absolute top-0 left-0 overflow-hidden text-amber-400 whitespace-nowrap"
                      style={{ width: `${fillPercentage}%` }}
                    >
                      ★
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Slider de apoyo para decimales finos (ej. 2.6) */}
            <input 
              type="range" 
              min="0" 
              max="5" 
              step="0.1"
              value={calificacion}
              onChange={(e) => setCalificacion(parseFloat(e.target.value))}
              className="w-full accent-rose-600 cursor-pointer"
            />
          </div>

          {/* Reseña */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Reseña o Diario Personal</label>
            <textarea
              rows="3"
              value={resenia}
              onChange={(e) => setResenia(e.target.value)}
              placeholder="¿Qué te pareció este capítulo? Escribe tus notas..."
              className="w-full bg-white dark:bg-[#1c1c22] border border-neutral-300 dark:border-white/10 rounded-2xl p-3 text-xs focus:outline-none focus:border-rose-500 resize-none"
            />
          </div>
        </div>

        {/* Pie */}
        <div className="p-4 border-t border-neutral-200 dark:border-white/10 flex justify-end gap-3 bg-neutral-50 dark:bg-[#101014]">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl border border-neutral-300 dark:border-white/10 text-xs font-bold hover:bg-neutral-200 dark:hover:bg-white/5 transition cursor-pointer">
            Cancelar
          </button>
          <button
            type="button"
            disabled={guardando}
            onClick={handleGuardar}
            className="px-6 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-xs font-bold text-white shadow-lg transition cursor-pointer disabled:opacity-50"
          >
            {guardando ? 'Guardando...' : 'Guardar Opinión'}
          </button>
        </div>

      </div>
    </div>
  );
}