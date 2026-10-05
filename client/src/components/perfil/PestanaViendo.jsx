import React from 'react';
import { Tv } from 'lucide-react';

export default function PestanaViendo({ obrasViendo = [], onAvanzarCapitulo, esMiPerfil = true }) {
  if (obrasViendo.length === 0) {
    return (
      <div className="p-16 text-center rounded-3xl border border-dashed border-zinc-800 bg-zinc-950/40 animate-fadeIn">
        <p className="text-base font-bold text-zinc-200">
          {esMiPerfil ? 'No tienes series en curso.' : 'Este usuario no tiene series en curso.'}
        </p>
        <p className="text-xs text-zinc-500 mt-1">
          {esMiPerfil 
            ? 'Al registrar el primer capítulo de una serie en Inicio, aparecerá aquí.' 
            : 'Las series que esté siguiendo actualmente se mostrarán aquí.'}
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 animate-fadeIn">
      {obrasViendo.map((serie) => {
        const poster = serie.poster_serie || serie.poster_path;

        return (
          <div 
            key={serie.id || serie.obra_id} 
            className="group aspect-[2/3] rounded-3xl overflow-hidden relative border border-white/10 bg-[#14141d] shadow-2xl flex flex-col justify-between p-5 hover:border-white/20 transition duration-300"
          >
            {poster ? (
              <img 
                src={poster} 
                alt={serie.titulo} 
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition duration-500" 
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
                <div className="w-12 h-12 rounded-2xl bg-rose-600/10 border border-rose-500/30 flex items-center justify-center text-rose-500 mb-2">
                  <Tv className="w-6 h-6" />
                </div>
                <p className="text-xs font-mono text-zinc-500 font-bold">{serie.titulo}</p>
              </div>
            )}

            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/25 to-black/40 group-hover:from-black/90 transition duration-300" />

            {/* Badge superior Streaming y botón +1 Cap (solo propietario) */}
            <div className="relative z-10 flex items-center justify-between">
              <span className="px-3 py-1 rounded-lg bg-black/60 backdrop-blur-md border border-white/15 text-[10px] font-bold text-zinc-300 uppercase tracking-wider">
                Streaming
              </span>
              {esMiPerfil ? (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onAvanzarCapitulo(
                      serie.obra_id || serie.id, 
                      serie.temporada, 
                      serie.ultimo_episodio_visto || serie.episodio
                    );
                  }}
                  className="px-3 py-1 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-[10px] font-black shadow-lg transition active:scale-95 cursor-pointer"
                >
                  +1 Cap.
                </button>
              ) : (
                <span className="px-2.5 py-1 rounded-xl bg-zinc-900/80 border border-white/10 text-rose-400 text-[10px] font-bold font-mono">
                  En progreso
                </span>
              )}
            </div>

            <div className="relative z-10 space-y-1">
              <h4 className="text-base font-bold text-white drop-shadow-md">
                {serie.titulo}
              </h4>
              <p className="text-xs font-mono text-zinc-300">
                Temporada {serie.temporada || 1} · Cap. {serie.ultimo_episodio_visto || serie.episodio || 1}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}