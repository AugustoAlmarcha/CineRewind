import React from 'react';

export default function ListaEpisodios({
  episodios = [],
  episodiosYaVistos = [],
  episodiosSeleccionados = [],
  onToggleEpisodio
}) {
  return (
    <div className="space-y-3">
      {episodios.map((ep) => {
        const yaVisto = episodiosYaVistos.includes(ep.episodio_numero);
        const estaMarcado = episodiosSeleccionados.includes(ep.episodio_numero);

        return (
          <div 
            key={ep.episodio_numero}
            onClick={() => !yaVisto && onToggleEpisodio(ep.episodio_numero)}
            className={`flex items-center justify-between p-3.5 rounded-2xl border transition gap-5 select-none ${
              yaVisto
                ? 'bg-emerald-500/10 border-emerald-500/30 opacity-70 cursor-default'
                : estaMarcado 
                  ? 'bg-rose-600/10 border-rose-500/50 cursor-pointer' 
                  : 'bg-white dark:bg-[#1a1a20] hover:border-neutral-400 border-neutral-200 dark:border-white/5 cursor-pointer shadow-sm'
            }`}
          >
            <div className="flex items-center gap-4 min-w-0">
              <div className={`w-6 h-6 rounded-lg flex items-center justify-center border transition flex-shrink-0 ${
                yaVisto 
                  ? 'bg-emerald-600 border-emerald-600 text-white font-black text-xs'
                  : estaMarcado 
                    ? 'bg-rose-600 border-rose-600 text-white font-black text-xs' 
                    : 'border-neutral-400 dark:border-neutral-600'
              }`}>
                {(yaVisto || estaMarcado) && '✓'}
              </div>

              <div className="w-28 h-16 bg-neutral-200 dark:bg-neutral-800 rounded-xl overflow-hidden flex-shrink-0 relative">
                {ep.still_path ? (
                  <img src={ep.still_path} alt={ep.nombre} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[10px] text-neutral-500">Sin foto</div>
                )}
                <span className="absolute bottom-1 right-1 bg-black/80 px-1.5 py-0.5 rounded text-[10px] font-black text-white">
                  E{ep.episodio_numero}
                </span>
              </div>

              <div className="min-w-0 space-y-1">
                <h4 className="font-bold text-sm truncate">{ep.episodio_numero}. {ep.nombre}</h4>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 line-clamp-2">
                  {ep.sinopsis || 'Sin descripción disponible.'}
                </p>
              </div>
            </div>

            <span className={`text-xs font-bold px-3 py-1.5 rounded-xl border ${
              yaVisto
                ? 'bg-emerald-600/20 text-emerald-600 border-emerald-500/30'
                : estaMarcado 
                  ? 'bg-rose-600 text-white border-rose-600' 
                  : 'bg-neutral-100 dark:bg-white/5 text-neutral-500 border-neutral-300 dark:border-white/10'
            }`}>
              {yaVisto ? 'Ya visto' : estaMarcado ? 'Seleccionado' : 'Seleccionar'}
            </span>
          </div>
        );
      })}
    </div>
  );
}