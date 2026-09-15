import React, { useState, useEffect } from 'react';
import { obtenerFilmografiaActorAPI, obtenerTimelineAPI } from '../api';

export default function ModalFilmografiaActor({ actor, onClose, onSeleccionarObra }) {
  const [obras, setObras] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [idsVistos, setIdsVistos] = useState(new Set());

  useEffect(() => {
    if (!actor?.id) return;
    let cancelado = false;

    const cargarDatos = async () => {
      setCargando(true);
      try {
        const [historial, filmografia] = await Promise.all([
          obtenerTimelineAPI(1),
          obtenerFilmografiaActorAPI(actor.id)
        ]);

        if (!cancelado) {
          if (Array.isArray(historial)) {
            setIdsVistos(new Set(historial.map((h) => Number(h.tmdb_id))));
          }
          setObras(Array.isArray(filmografia) ? filmografia : []);
        }
      } catch (err) {
        console.error('Error al cargar filmografía:', err);
      } finally {
        if (!cancelado) setCargando(false);
      }
    };

    cargarDatos();
    return () => { cancelado = true; };
  }, [actor]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto">
      <div className="bg-[#fcfaf7] dark:bg-[#141418] border border-neutral-300 dark:border-white/10 rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-neutral-900 dark:text-white my-auto animate-fadeIn">
        <div className="p-6 border-b border-neutral-200 dark:border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full overflow-hidden bg-neutral-800 border-2 border-rose-600 shadow-md">
              {actor.foto ? (
                <img src={actor.foto} alt={actor.nombre} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xl">🎭</div>
              )}
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-rose-600">Filmografía destacada</span>
              <h2 className="text-2xl font-black">{actor.nombre}</h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-neutral-200 dark:bg-white/10 hover:bg-rose-600 hover:text-white flex items-center justify-center transition cursor-pointer"
          >
            ✕
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          {cargando ? (
            <div className="py-20 text-center text-sm text-neutral-400 animate-pulse">
              Cargando catálogo del actor...
            </div>
          ) : obras.length === 0 ? (
            <div className="py-20 text-center text-sm text-neutral-400">
              No se encontraron obras disponibles.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {obras.map((obra) => {
                const yaVista = idsVistos.has(Number(obra.tmdb_id));

                return (
                  <div
                    key={obra.tmdb_id}
                    onClick={() => onSeleccionarObra(obra)}
                    className={`relative aspect-[2/3] rounded-2xl overflow-hidden shadow-md group cursor-pointer border border-neutral-200 dark:border-white/10 transition-all duration-300 hover:scale-105 ${
                      yaVista ? 'ring-2 ring-emerald-500 shadow-emerald-500/20' : ''
                    }`}
                  >
                    <img
                      src={obra.poster_path}
                      alt={obra.titulo}
                      className={`w-full h-full object-cover group-hover:scale-110 transition duration-300 ${
                        yaVista ? 'brightness-90' : ''
                      }`}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/25 to-transparent flex flex-col justify-between p-3 pointer-events-none">
                      <div className="flex justify-between items-start">
                        <span className="text-[9px] font-black uppercase px-2 py-0.5 bg-rose-600 text-white rounded shadow">
                          {obra.tipo}
                        </span>
                        {yaVista && (
                          <span className="text-[9px] font-black uppercase px-2 py-0.5 bg-emerald-600 text-white rounded shadow-md flex items-center gap-0.5 backdrop-blur-sm">
                            ✓ Vista
                          </span>
                        )}
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-white truncate drop-shadow">{obra.titulo}</h4>
                        <p className="text-[10px] text-rose-400 font-bold truncate mt-0.5">
                          {obra.personaje || obra.anio}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}