import React from 'react';
import { Star, Check, RotateCcw, Info, Calendar } from 'lucide-react';

export default function SelectorTemporadaBarra({
  listaTemporadas,
  temporadaSeleccionada,
  onCambiarTemporada,
  faltantesCount,
  onMarcarRestantes,
  onAbrirCalificarTemporada,
  notaEspecial,
  episodiosSeleccionadosCount = 0,
  onAbrirDistribuir,
  panelDistribuirAbierto = false,
}) {
  return (
    <div className="space-y-2 select-none">
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

          {episodiosSeleccionadosCount > 1 && onAbrirDistribuir && (
            <button
              type="button"
              onClick={onAbrirDistribuir}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1.5 flex-shrink-0 active:scale-95 shadow-xs border ${
                panelDistribuirAbierto
                  ? 'bg-rose-600 border-rose-600 text-white'
                  : 'bg-rose-500/15 hover:bg-rose-500/25 border-rose-500/30 text-rose-600 dark:text-rose-400'
              }`}
              title="Distribuir fechas automáticamente por ritmo (1 por semana, 1 por día, etc.)"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Distribuir fechas ({episodiosSeleccionadosCount})</span>
            </button>
          )}

          <button
            type="button"
            onClick={onMarcarRestantes}
            className="px-3.5 py-1.5 rounded-xl text-xs font-extrabold bg-neutral-200/80 dark:bg-white/10 hover:bg-neutral-300 dark:hover:bg-white/20 transition cursor-pointer flex-shrink-0 flex items-center gap-1.5"
          >
            {faltantesCount > 0 ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Marcar restantes ({faltantesCount})</span>
              </>
            ) : (
              <>
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Marcar completa</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Nota explicativa de formato si la serie tiene discrepancias de temporadas */}
      {notaEspecial && (
        <div className="flex items-start gap-2 p-2.5 rounded-2xl bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/20 text-amber-700 dark:text-amber-300 text-xs animate-fadeIn">
          <Info className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
          <div className="leading-snug">
            <span className="font-bold mr-1">Nota de formato:</span>
            <span>{typeof notaEspecial === 'string' ? notaEspecial : notaEspecial.nota}</span>
          </div>
        </div>
      )}
    </div>
  );
}