import React from 'react';

export default function SelectorTemporadaBarra({
  listaTemporadas,
  temporadaSeleccionada,
  onCambiarTemporada,
  faltantesCount,
  onMarcarRestantes
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      {/* Botones de número de temporada con scroll elegante */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-elegante max-w-full">
        {listaTemporadas.map((num) => (
          <button
            key={num}
            type="button"
            onClick={() => onCambiarTemporada(num)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex-shrink-0 ${
              temporadaSeleccionada === num
                ? 'bg-rose-600 text-white shadow-md'
                : 'bg-neutral-200/80 dark:bg-[#1e1e24] text-neutral-600 dark:text-neutral-400 hover:bg-neutral-300 dark:hover:bg-white/10'
            }`}
          >
            Temporada {num}
          </button>
        ))}
      </div>

      {/* Botón para marcar pendientes o rewatch */}
      <button
        type="button"
        onClick={onMarcarRestantes}
        className="px-4 py-2 rounded-xl text-xs font-extrabold bg-neutral-200 dark:bg-white/10 hover:bg-neutral-300 dark:hover:bg-white/20 transition cursor-pointer flex-shrink-0"
      >
        {faltantesCount > 0 
          ? `✓ Marcar episodios restantes (${faltantesCount})` 
          : '↺ Volver a marcar temporada completa'}
      </button>
    </div>
  );
}