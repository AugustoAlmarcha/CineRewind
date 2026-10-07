import React from 'react';
import { Trash2, Check } from 'lucide-react';
import { calcularProgresoSerie } from '../../utils/seriesProgreso';

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
        const progresoSerie = esSerie ? calcularProgresoSerie(obra) : null;

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

            {/* 1. Botón de eliminar serie completa (SOLO cuando modoSeleccion está activo) */}
            {modoSeleccion && onEliminarSerieDirecto && totalIds > 0 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onEliminarSerieDirecto(obra);
                }}
                className="absolute top-3 right-3 z-20 w-8 h-8 rounded-full bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center shadow-xl transition-all cursor-pointer active:scale-90 border border-white/20"
                title={`Eliminar toda ${esSerie ? 'la serie' : (esSaga ? 'la saga' : 'la obra')} "${obra.titulo}"`}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}

            {/* Capa inferior limpia: únicamente el nombre de la serie y la línea de progreso */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/25 to-transparent flex flex-col justify-end p-3 sm:p-3.5 pointer-events-none">
              <div>
                <h3 className="text-sm sm:text-base font-black text-white truncate drop-shadow-md leading-tight" title={obra.titulo}>
                  {obra.titulo}
                </h3>

                {/* Línea minimalista de progreso de serie */}
                {esSerie && progresoSerie && (
                  <div className="w-full bg-white/20 h-1 sm:h-1.5 rounded-full overflow-hidden mt-1.5 backdrop-blur-xs">
                    <div 
                      className={`h-full transition-all duration-500 ${
                        progresoSerie.estaCompletada 
                          ? 'bg-emerald-400' 
                          : progresoSerie.estaAlDia 
                          ? 'bg-cyan-400' 
                          : 'bg-amber-400'
                      }`}
                      style={{ width: `${Math.max(6, progresoSerie.porcentajeGlobal)}%` }}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}