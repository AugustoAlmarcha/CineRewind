import React, { useState, useEffect } from 'react';
import { obtenerDetalleEpisodioAPI } from '../api';

export default function ModalDetalleEpisodioViendo({ serie, onClose, onMarcarVisto }) {
  const [detalle, setDetalle] = useState(null);
  const [cargando, setCargando] = useState(true);

  const temporada = serie.siguiente_temporada ?? serie.temporada;
  const episodio = serie.siguiente_episodio ?? (parseInt(serie.episodio, 10) + 1);
  const tmdbId = serie.tmdb_id;

  useEffect(() => {
    if (!tmdbId) return;

    const cargarDatos = async () => {
      setCargando(true);
      try {
        const data = await obtenerDetalleEpisodioAPI(tmdbId, temporada, episodio);
        setDetalle(data);
      } catch (err) {
        console.warn('Error al cargar detalle del capítulo:', err.message);
      } finally {
        setCargando(false);
      }
    };

    cargarDatos();
  }, [tmdbId, temporada, episodio]);

  const fotoCabecera = detalle?.still_path || serie.foto_siguiente || serie.poster_path;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 overflow-y-auto">
      <div className="bg-[#121216] border border-white/10 rounded-3xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-white my-auto animate-fadeIn">
        
        {/* Cabecera Cinemática con Foto Grande */}
        <div className="relative w-full h-72 sm:h-80 bg-neutral-900 flex-shrink-0">
          {fotoCabecera ? (
            <img 
              src={fotoCabecera} 
              alt={serie.titulo} 
              className="w-full h-full object-cover brightness-[0.85]" 
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-neutral-500">Sin captura disponible</div>
          )}
          
          <div className="absolute inset-0 bg-gradient-to-t from-[#121216] via-[#121216]/40 to-transparent flex flex-col justify-between p-6">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="bg-rose-600 text-white font-black text-xs px-3 py-1 rounded-lg uppercase tracking-wider shadow">
                  T{temporada} · E{episodio}
                </span>
                {serie.plataforma && (
                  <span className="bg-black/60 backdrop-blur-md border border-white/20 text-white font-bold text-xs px-2.5 py-1 rounded-lg">
                    {serie.plataforma}
                  </span>
                )}
              </div>

              <button 
                onClick={onClose} 
                className="w-9 h-9 rounded-full bg-black/60 hover:bg-rose-600 text-white flex items-center justify-center transition cursor-pointer border border-white/20"
              >
                ✕
              </button>
            </div>

            {/* Título de Serie y Nombre del Capítulo */}
            <div>
              <p className="text-xs font-black tracking-widest text-rose-400 uppercase drop-shadow">
                {serie.titulo}
              </p>
              <h2 className="text-2xl sm:text-3xl font-black text-white leading-tight drop-shadow-md">
                {detalle?.nombre ? `${episodio}. ${detalle.nombre}` : `Capítulo ${episodio}`}
              </h2>
            </div>
          </div>
        </div>

        {/* Cuerpo tipo Prime Video X-Ray */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 scrollbar-thin">
          
          {/* Sinopsis del capítulo */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-black uppercase tracking-widest text-neutral-400">
              Descripción del Episodio
            </span>
            <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed">
              {cargando ? 'Cargando información oficial...' : (detalle?.sinopsis || 'Sin descripción disponible para este episodio.')}
            </p>
          </div>

          {/* Elenco de Actores del Capítulo con Fotos Grandes */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-widest text-neutral-400 flex items-center gap-2">
                <span>🎭</span> Reparto del Capítulo ({detalle?.actores?.length || 0})
              </span>
              <span className="text-[11px] text-neutral-500 font-semibold">X-Ray Cast</span>
            </div>

            {cargando ? (
              <p className="text-xs text-neutral-500 italic py-4">Buscando actores en TMDb...</p>
            ) : detalle?.actores?.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5 pt-1">
                {detalle.actores.map((actor) => (
                  <div 
                    key={actor.id} 
                    className="bg-white/5 rounded-2xl overflow-hidden border border-white/5 hover:border-rose-500/40 transition group flex flex-col"
                  >
                    <div className="w-full aspect-[2/3] bg-neutral-900 overflow-hidden relative">
                      {actor.foto ? (
                        <img 
                          src={actor.foto} 
                          alt={actor.nombre} 
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-300" 
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-neutral-600 text-xs">
                          <span>🎭</span>
                          <span className="text-[10px]">Sin foto</span>
                        </div>
                      )}
                    </div>
                    <div className="p-2.5 flex flex-col justify-between flex-1">
                      <p className="text-xs font-black truncate text-white" title={actor.nombre}>
                        {actor.nombre}
                      </p>
                      <p className="text-[10px] text-rose-400 font-bold truncate mt-0.5" title={actor.personaje}>
                        {actor.personaje}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-neutral-500 italic">No hay créditos específicos registrados para este capítulo.</p>
            )}
          </div>
        </div>

        {/* Botonera Inferior */}
        <div className="p-4 border-t border-white/10 bg-[#0c0c0f] flex items-center justify-between">
          <button 
            type="button" 
            onClick={onClose} 
            className="px-4 py-2 rounded-xl border border-white/10 text-xs font-bold text-neutral-300 hover:bg-white/5 transition cursor-pointer"
          >
            Cerrar
          </button>
          
          <button
            type="button"
            onClick={() => {
              onMarcarVisto(serie);
              onClose();
            }}
            className="px-6 py-2.5 bg-rose-600 hover:bg-rose-700 active:scale-95 text-xs font-black uppercase tracking-wider rounded-xl shadow-lg transition cursor-pointer flex items-center gap-1.5"
          >
            <span>✓</span> Marcar T{temporada} E{episodio} Visto
          </button>
        </div>

      </div>
    </div>
  );
}