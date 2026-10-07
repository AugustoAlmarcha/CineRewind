import React from 'react';
import { Trash2, Check } from 'lucide-react';

export default function VistaCatalogoTotal({ 
  obras, 
  resolverImagen, 
  onSeleccionarSerie, 
  onAbrirDetalleTimeline,
  modoSeleccion = false,
  seleccionadosParaBorrar = [],
  onToggleSerie = () => {},
  onEliminarSerieDirecto = null
}) {
  if (obras.length === 0) {
    return (
      <div className="py-24 text-center text-neutral-500 italic">
        No se encontraron obras en tu catálogo histórico.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 pt-4">
      {obras.map((obra) => {
        const urlPoster = resolverImagen(obra.poster_path);
        const esSerie = obra.tipo?.toLowerCase() === 'serie';
        const esSaga = Boolean(obra.esSaga);
        const cantPeliculasDistintas = obra.peliculasDistintas?.length || 1;

        const idsDeLaObra = (obra.registros || [])
          .map((r) => (r.id !== undefined ? r.id : r.historial_id))
          .filter((id) => id !== undefined && id !== null);
        const totalIds = idsDeLaObra.length;
        const totalSeleccionados = idsDeLaObra.filter((id) => seleccionadosParaBorrar.includes(id)).length;
        const todosSeleccionados = totalIds > 0 && totalSeleccionados === totalIds;
        const parcialSeleccionados = totalSeleccionados > 0 && !todosSeleccionados;

        const handleClick = () => {
          if (modoSeleccion) {
            if (onToggleSerie) onToggleSerie(obra.registros);
          } else {
            onSeleccionarSerie(obra);
          }
        };

        return (
          <div
            key={obra.obra_id || obra.id_agrupador || obra.titulo}
            onClick={handleClick}
            className={`aspect-[2/3] relative rounded-3xl overflow-hidden cursor-pointer border shadow-md transition-all duration-300 group select-none ${
              modoSeleccion && todosSeleccionados
                ? 'border-rose-500 ring-4 ring-rose-500/30 scale-[1.02]'
                : modoSeleccion && parcialSeleccionados
                ? 'border-rose-400 ring-2 ring-rose-400/20'
                : 'border-neutral-300/80 dark:border-white/10 hover:border-rose-500 hover:scale-[1.02]'
            } bg-neutral-900`}
          >
            {urlPoster ? (
              <img
                src={urlPoster}
                alt={obra.titulo}
                loading="lazy"
                className="w-full h-full object-cover group-hover:scale-105 transition duration-300 brightness-[0.95]"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center p-4 text-center font-bold text-neutral-400">
                {obra.titulo}
              </div>
            )}

            {/* 1. Indicador de selección circular (cuando modoSeleccion está activo) */}
            {modoSeleccion && (
              <div className="absolute top-3.5 right-3.5 z-20">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center transition shadow-lg ${
                    todosSeleccionados
                      ? 'bg-rose-600 text-white border-2 border-white'
                      : parcialSeleccionados
                      ? 'bg-rose-500/80 text-white border-2 border-white/60'
                      : 'bg-black/60 border-2 border-white/40 text-transparent'
                  }`}
                >
                  {todosSeleccionados && <Check className="w-4 h-4 stroke-[3]" />}
                  {parcialSeleccionados && <span className="text-xs font-bold leading-none">-</span>}
                </div>
              </div>
            )}

            {/* 2. Botón directo de eliminar serie/obra completa (cuando modoSeleccion no está activo) */}
            {!modoSeleccion && onEliminarSerieDirecto && totalIds > 0 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onEliminarSerieDirecto(obra);
                }}
                className="absolute top-3.5 right-3.5 z-20 w-8 h-8 rounded-full bg-black/70 hover:bg-rose-600 text-neutral-300 hover:text-white flex items-center justify-center backdrop-blur-md border border-white/15 hover:border-rose-500 shadow-xl transition-all cursor-pointer opacity-90 sm:opacity-0 sm:group-hover:opacity-100 active:scale-95"
                title={`Eliminar toda ${esSerie ? 'la serie' : (esSaga ? 'la saga' : 'la obra')} "${obra.titulo}" (${totalIds} ${totalIds === 1 ? 'visto' : 'vistos'})`}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}

            <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/30 to-transparent flex flex-col justify-between p-4 pointer-events-none">
              <div className="flex justify-between items-center gap-1">
                <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-lg border ${
                  esSaga 
                    ? 'bg-amber-500 text-neutral-950 font-black border-amber-300 shadow'
                    : 'bg-black/70 text-white border-white/10'
                }`}>
                  {esSerie 
                    ? 'Serie' 
                    : (esSaga ? `Saga · ${cantPeliculasDistintas} pelis` : 'Película')}
                </span>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-lg bg-rose-600 text-white shadow">
                  {obra.registros.length} {obra.registros.length === 1 ? 'visto' : 'vistos'}
                </span>
              </div>

              <div>
                <h3 className="text-base font-black text-white truncate drop-shadow" title={obra.titulo}>
                  {obra.titulo}
                </h3>
                <p className="text-[11px] text-neutral-300 mt-0.5 font-bold">
                  {modoSeleccion
                    ? (todosSeleccionados 
                        ? '✓ Todos seleccionados' 
                        : parcialSeleccionados 
                        ? `${totalSeleccionados}/${totalIds} seleccionados` 
                        : 'Toca para seleccionar todo')
                    : (esSerie 
                        ? 'Toca para abrir capítulos' 
                        : esSaga 
                        ? `Toca para abrir saga (${cantPeliculasDistintas} películas)`
                        : (obra.registros.length > 1 
                            ? `Toca para ver fechas (${obra.registros.length} vistos)` 
                            : 'Toca para abrir fecha'))}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}