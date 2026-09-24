import React from 'react';

export default function ListaEpisodios({
  episodios = [],
  episodiosYaVistos = [],
  episodiosSeleccionados = [],
  onToggleEpisodio,
  onVerActoresCapitulo,
}) {
  if (!episodios || episodios.length === 0) {
    return (
      <div className="py-12 text-center text-neutral-500 text-sm">
        No hay episodios disponibles para esta temporada.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {episodios.map((ep) => {
        const num = ep.episodio_numero;
        const yaVistoPreviamente = episodiosYaVistos.includes(num);
        const estaSeleccionado = episodiosSeleccionados.includes(num);

        return (
          <div
            key={num}
            onClick={() => onToggleEpisodio(num)}
            className={`p-3.5 rounded-2xl border transition-all duration-200 flex items-center justify-between gap-4 cursor-pointer select-none ${
              estaSeleccionado
                ? 'bg-rose-500/10 border-rose-500/50 dark:bg-rose-950/30 dark:border-rose-500/50 shadow-sm'
                : yaVistoPreviamente
                  ? 'bg-emerald-500/5 border-emerald-500/25 dark:bg-emerald-950/15 dark:border-emerald-500/20 hover:border-emerald-500/40'
                  : 'bg-white dark:bg-[#1a1a20] border-neutral-200 dark:border-white/5 hover:border-neutral-300 dark:hover:border-white/10 shadow-xs'
            }`}
          >
            {/* Izquierda: Checkbox + Miniatura + Título */}
            <div className="flex items-center gap-3.5 min-w-0 flex-1">
              <div
                className={`w-6 h-6 rounded-lg border flex items-center justify-center flex-shrink-0 transition-colors ${
                  estaSeleccionado
                    ? 'bg-rose-600 border-rose-600 text-white'
                    : yaVistoPreviamente
                      ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-500'
                      : 'border-neutral-300 dark:border-white/20 bg-neutral-100 dark:bg-white/5'
                }`}
              >
                {estaSeleccionado ? (
                  <span className="text-xs font-black">✓</span>
                ) : yaVistoPreviamente ? (
                  <span className="text-[10px] font-black">✓</span>
                ) : null}
              </div>

              <div className="w-24 h-14 bg-neutral-200 dark:bg-neutral-800 rounded-xl overflow-hidden flex-shrink-0 relative shadow-inner">
                {ep.still_path ? (
                  <img
                    src={ep.still_path}
                    alt={ep.nombre}
                    loading="lazy"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[10px] text-neutral-400 font-bold">
                    E{num}
                  </div>
                )}
                <span className="absolute bottom-1 right-1 bg-black/80 px-1 rounded text-[9px] font-black text-white">
                  E{num}
                </span>
              </div>

              <div className="min-w-0 flex-1 pr-2">
                <div className="flex items-center gap-2">
                  <h4 className="text-xs sm:text-sm font-black text-neutral-900 dark:text-white truncate">
                    {num}. {ep.nombre}
                  </h4>

                  {onVerActoresCapitulo && (
                    <button
                      type="button"
                      onClick={(e) => onVerActoresCapitulo(e, num, ep.nombre)}
                      className="flex-shrink-0 text-[10px] font-extrabold px-2 py-0.5 rounded-lg bg-neutral-200/90 dark:bg-white/10 hover:bg-rose-600 hover:text-white dark:hover:bg-rose-600 transition flex items-center gap-1 cursor-pointer text-neutral-700 dark:text-neutral-300"
                      title="Ver actores que actuaron en este capítulo"
                    >
                      <span>🎭</span>
                      <span>Actores</span>
                    </button>
                  )}
                </div>

                <p className="text-[11px] text-neutral-500 dark:text-neutral-400 line-clamp-1 mt-0.5">
                  {ep.sinopsis || 'Sin descripción disponible para este episodio.'}
                </p>
              </div>
            </div>

            {/* Derecha: Badge de estado (permite volver a marcar) */}
            <div className="flex-shrink-0">
              {estaSeleccionado ? (
                <span className="text-[11px] font-black uppercase px-2.5 py-1 bg-rose-600 text-white rounded-lg shadow-xs">
                  Seleccionado
                </span>
              ) : yaVistoPreviamente ? (
                <span 
                  className="text-[11px] font-bold uppercase px-2 py-0.5 bg-emerald-600/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25 rounded-md hover:bg-rose-600 hover:text-white hover:border-transparent transition"
                  title="Haz clic para volver a registrar este capítulo en la nueva fecha"
                >
                  ✓ Visto · Repetir
                </span>
              ) : (
                <span className="text-[11px] font-bold text-neutral-400 dark:text-neutral-500 px-2 py-1">
                  Marcar
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}