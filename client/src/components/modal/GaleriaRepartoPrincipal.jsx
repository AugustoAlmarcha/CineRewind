import React from 'react';

export default function GaleriaRepartoPrincipal({ 
  reparto, 
  mostrar, 
  onToggleMostrar, 
  onSeleccionarActor 
}) {
  if (!reparto || reparto.length === 0) return null;

  return (
    <>
      {/* Botón alternador */}
      <div className="px-6 pt-3 pb-1">
        <button
          type="button"
          onClick={onToggleMostrar}
          className="text-xs font-bold px-3 py-1.5 rounded-xl border border-neutral-300 dark:border-white/10 bg-neutral-100 dark:bg-white/5 hover:bg-rose-600 hover:text-white dark:hover:bg-rose-600 transition flex items-center gap-1.5 cursor-pointer"
        >
          <span>🎭</span>
          <span>{mostrar ? 'Ocultar Reparto' : `Ver Reparto General (${reparto.length})`}</span>
        </button>
      </div>

      {/* Grilla desplegable */}
      {mostrar && (
        <div className="px-6 py-4 border-b border-neutral-200 dark:border-white/10 bg-neutral-50/50 dark:bg-black/20 animate-fadeIn">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-neutral-500">
              Elenco Principal
            </h4>
            <span className="text-[11px] text-neutral-400">
              Toca a un actor para ver sus películas
            </span>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 max-h-56 overflow-y-auto pr-1 scrollbar-thin">
            {reparto.map((actor) => (
              <div 
                key={actor.id} 
                onClick={() => onSeleccionarActor(actor)}
                className="bg-white dark:bg-neutral-900 rounded-xl overflow-hidden border border-neutral-200 dark:border-white/10 shadow-xs flex flex-col cursor-pointer hover:scale-105 hover:border-rose-500/50 transition-all duration-200 group"
              >
                <div className="w-full aspect-[2/3] bg-neutral-800">
                  {actor.foto ? (
                    <img 
                      src={actor.foto} 
                      alt={actor.nombre} 
                      loading="lazy" 
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-lg">🎭</div>
                  )}
                </div>
                <div className="p-2">
                  <p className="text-[11px] font-black truncate text-neutral-900 dark:text-white group-hover:text-rose-600 transition-colors" title={actor.nombre}>
                    {actor.nombre}
                  </p>
                  <p className="text-[10px] text-neutral-500 truncate" title={actor.personaje}>
                    {actor.personaje || 'Personaje'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}