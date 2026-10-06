import React from 'react';
import CollagePortadas from './CollagePortadas';
import { Trash2, Check } from 'lucide-react';

export default function VistaSelectorCarpetas({
  carpetas = [],
  tituloVacio = 'No hay registros disponibles.',
  onSeleccionar,
  modoSeleccion = false,
  seleccionadosParaBorrar = [],
  onToggleCarpeta,
  onEliminarCarpetaDirecto
}) {
  if (carpetas.length === 0) {
    return (
      <div className="py-24 text-center text-neutral-500 italic">
        {tituloVacio}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 pt-4">
      {carpetas.map((c) => {
        const idsDeLaCarpeta = (c.items || [])
          .map((item) => (item.id !== undefined ? item.id : item.historial_id))
          .filter((id) => id !== undefined && id !== null);

        const totalIds = idsDeLaCarpeta.length;
        const totalSeleccionados = idsDeLaCarpeta.filter((id) => seleccionadosParaBorrar.includes(id)).length;
        const todosSeleccionados = totalIds > 0 && totalSeleccionados === totalIds;
        const parcialSeleccionados = totalSeleccionados > 0 && !todosSeleccionados;

        const handleClick = () => {
          if (modoSeleccion) {
            if (onToggleCarpeta) onToggleCarpeta(c.items);
          } else {
            onSeleccionar(c.valor);
          }
        };

        return (
          <div
            key={c.id}
            onClick={handleClick}
            className={`group relative aspect-square rounded-3xl overflow-hidden cursor-pointer border shadow-lg transition-all duration-300 select-none ${
              modoSeleccion && todosSeleccionados
                ? 'border-rose-500 ring-4 ring-rose-500/30 scale-[1.02]'
                : modoSeleccion && parcialSeleccionados
                ? 'border-rose-400 ring-2 ring-rose-400/20'
                : 'border-neutral-300 dark:border-white/10 hover:border-rose-500/50 hover:scale-[1.02]'
            } bg-neutral-950`}
          >
            {/* 1. Portadas de fondo */}
            <div className="w-full h-full opacity-65 group-hover:opacity-80 transition duration-300">
              <CollagePortadas items={c.items} />
            </div>

            {/* 2. Capa oscura elegante para resaltar el año/mes y las obras */}
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 group-hover:bg-black/25 transition duration-300 p-4">
              <h3 className="text-3xl sm:text-4xl font-black text-white tracking-tight drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)] group-hover:scale-105 transition-transform duration-300 text-center">
                {c.etiqueta}
              </h3>
              <span className="mt-2 text-xs font-black px-3 py-1 bg-rose-600 text-white rounded-full shadow-md drop-shadow">
                {c.subtexto}
              </span>

              {/* Indicador contextual en modo selección */}
              {modoSeleccion && (
                <span className="mt-3 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-black/75 backdrop-blur-sm border border-white/10 text-white/90">
                  {todosSeleccionados 
                    ? '✓ Todo seleccionado' 
                    : parcialSeleccionados 
                    ? `${totalSeleccionados}/${totalIds} seleccionados` 
                    : 'Toca para seleccionar todo'}
                </span>
              )}
            </div>

            {/* 3. Indicador de selección circular (cuando modoSeleccion está activo) */}
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

            {/* 4. Botón directo de eliminar carpeta completa (cuando modoSeleccion no está activo) */}
            {!modoSeleccion && onEliminarCarpetaDirecto && totalIds > 0 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onEliminarCarpetaDirecto(c);
                }}
                className="absolute top-3.5 right-3.5 z-20 w-8 h-8 rounded-full bg-black/70 hover:bg-rose-600 text-neutral-300 hover:text-white flex items-center justify-center backdrop-blur-md border border-white/15 hover:border-rose-500 shadow-xl transition-all cursor-pointer opacity-90 sm:opacity-0 sm:group-hover:opacity-100"
                title={`Eliminar todo ${c.etiqueta} (${totalIds} ${totalIds === 1 ? 'obra' : 'obras'})`}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}