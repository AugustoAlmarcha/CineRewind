import React from 'react';

export default function ModalActoresEpisodio({ datos, onClose, onSeleccionarActor }) {
  if (!datos) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fadeIn">
      <div className="bg-[#fcfaf7] dark:bg-[#141418] border border-neutral-300 dark:border-white/10 rounded-3xl max-w-4xl w-full max-h-[88vh] flex flex-col shadow-2xl overflow-hidden text-neutral-900 dark:text-white my-auto">
        
        {/* Cabecera */}
        <div className="p-6 border-b border-neutral-200 dark:border-white/10 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-rose-600 dark:text-rose-500">
              Reparto del capítulo
            </span>
            <h3 className="text-xl font-black">
              {datos.episodioTitulo}
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
              Toca a un actor para explorar su filmografía
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-neutral-200 dark:bg-white/10 hover:bg-rose-600 hover:text-white flex items-center justify-center transition cursor-pointer text-sm font-bold"
          >
            ✕
          </button>
        </div>

        {/* Grilla de actores */}
        <div className="p-6 overflow-y-auto flex-1 scrollbar-thin">
          {datos.actores.length === 0 ? (
            <p className="text-center text-neutral-500 dark:text-neutral-400 text-sm py-16">
              No se encontraron créditos registrados para este episodio.
            </p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {datos.actores.map((actor, idx) => (
                <div
                  key={`${actor.id || actor.actor_id}-${idx}`}
                  onClick={() => onSeleccionarActor(actor)}
                  className="bg-white dark:bg-neutral-900/90 rounded-2xl overflow-hidden border border-neutral-200 dark:border-white/10 shadow-xs hover:scale-105 hover:border-rose-500/50 transition-all duration-200 flex flex-col cursor-pointer group"
                >
                  <div className="w-full aspect-[2/3] bg-neutral-200 dark:bg-neutral-800 overflow-hidden relative">
                    {actor.foto ? (
                      <img
                        src={actor.foto}
                        alt={actor.nombre}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-neutral-400 dark:text-neutral-500 text-xs gap-1.5">
                        <span className="text-3xl">🎭</span>
                        <span className="font-bold">Sin foto</span>
                      </div>
                    )}
                  </div>

                  <div className="p-3 flex flex-col justify-between flex-1">
                    <p
                      className="text-xs font-black truncate text-neutral-900 dark:text-white group-hover:text-rose-600 transition-colors"
                      title={actor.nombre}
                    >
                      {actor.nombre}
                    </p>
                    <p
                      className="text-[11px] text-rose-600 dark:text-rose-400 font-bold truncate mt-0.5"
                      title={actor.personaje}
                    >
                      {actor.personaje || 'Personaje'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pie */}
        <div className="p-4 border-t border-neutral-200 dark:border-white/10 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-neutral-200 dark:bg-white/10 hover:bg-rose-600 hover:text-white dark:hover:bg-rose-600 text-xs font-bold transition cursor-pointer"
          >
            Cerrar
          </button>
        </div>

      </div>
    </div>
  );
}