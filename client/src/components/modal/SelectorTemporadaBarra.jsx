import React from 'react';
import { Star } from 'lucide-react';

export default function SelectorTemporadaBarra({
  listaTemporadas,
  temporadaSeleccionada,
  onCambiarTemporada,
  faltantesCount,
  onMarcarRestantes,
  onAbrirCalificarTemporada
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2.5">
      {/* Botones de número de temporada con scroll elegante */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-elegante max-w-full">
        {listaTemporadas.map((num) => (
          <button
            key={num}
            type="button"
            onClick={() => onCambiarTemporada(num)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex-shrink-0 ${
              temporadaSeleccionada === num
                ? 'bg-rose-600 text-white shadow-md font-black'
                : 'bg-neutral-200/80 dark:bg-[#1e1e24] text-neutral-600 dark:text-neutral-400 hover:bg-neutral-300 dark:hover:bg-white/10'
            }`}
          >
            Temporada {num}
          </button>
        ))}
      </div>

      {/* Botones de acción: Calificar temporada y marcar restantes */}
      <div className="flex items-center gap-2 flex-wrap">
        {onAbrirCalificarTemporada && (
          <button
            type="button"
            onClick={onAbrirCalificarTemporada}
            className="px-3 py-1.5 rounded-xl text-xs font-black bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-600 dark:text-amber-400 transition cursor-pointer flex items-center gap-1.5 flex-shrink-0 active:scale-95 shadow-xs"
            title={`Calificar Temporada ${temporadaSeleccionada} o la Serie Completa`}
          >
            <Star className="w-3.5 h-3.5 fill-current" />
            <span>Calificar T{temporadaSeleccionada} / Serie</span>
          </button>
        )}

        <button
          type="button"
          onClick={onMarcarRestantes}
          className="px-3.5 py-1.5 rounded-xl text-xs font-extrabold bg-neutral-200/80 dark:bg-white/10 hover:bg-neutral-300 dark:hover:bg-white/20 transition cursor-pointer flex-shrink-0"
        >
          {faltantesCount > 0 
            ? `✓ Marcar restantes (${faltantesCount})` 
            : '↺ Marcar completa'}
        </button>
      </div>
    </div>
  );
}