import React from 'react';
import { Film } from 'lucide-react';

export default function PestanaResenias({ resenias = [] }) {
  if (resenias.length === 0) {
    return (
      <div className="p-16 text-center rounded-3xl border border-dashed border-zinc-800 bg-zinc-950/40 space-y-2 animate-fadeIn">
        <p className="text-base font-bold text-zinc-200">Aún no has escrito ninguna reseña.</p>
        <p className="text-xs text-zinc-500">
          Al registrar una película o serie desde Inicio o el Buscador, escribe tu opinión y aparecerá aquí.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fadeIn">
      {resenias.map((item) => {
        const calif = Number(item.calificacion);
        const fechaTexto = item.fecha_visto ? item.fecha_visto.split('T')[0] : '2026-09-28';

        return (
          <div 
            key={item.id} 
            className="bg-[#13131c] border border-white/5 rounded-3xl p-5 sm:p-6 flex flex-col sm:flex-row gap-5 relative hover:border-white/15 transition shadow-lg"
          >
            {/* Póster a la izquierda */}
            <div className="w-20 h-28 sm:w-24 sm:h-36 rounded-2xl overflow-hidden bg-[#181824] border border-white/10 shrink-0 flex items-center justify-center shadow-md">
              {item.poster_path ? (
                <img
                  src={item.poster_path}
                  alt={item.titulo}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex flex-col items-center justify-center p-2 text-center text-zinc-600">
                  <Film className="w-6 h-6 mb-1 text-rose-500" />
                  <span className="text-[9px] font-mono leading-tight">{item.titulo}</span>
                </div>
              )}
            </div>

            {/* Cuerpo de la reseña */}
            <div className="flex-1 flex flex-col justify-between space-y-3">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="text-base sm:text-lg font-bold text-white tracking-tight">
                      {item.titulo}
                    </h4>
                    <span className="text-zinc-500 font-normal text-sm font-mono">
                      ({item.anio || (item.fecha_visto ? item.fecha_visto.split('-')[0] : '2024')})
                    </span>
                  </div>

                  {item.temporada && (
                    <span className="inline-block mt-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-300 border border-white/5">
                      T{item.temporada} : E{item.episodio}
                    </span>
                  )}
                </div>

                {/* Medalla de Nota Dorada */}
                {!isNaN(calif) && calif > 0 && (
                  <div className="bg-amber-400/10 border border-amber-400/30 text-amber-400 font-black px-3 py-1 rounded-xl text-xs sm:text-sm flex items-center gap-1.5 shadow-sm shrink-0">
                    <span className="text-amber-400">★</span>
                    <span>{calif}</span>
                  </div>
                )}
              </div>

              <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed font-normal italic">
                "{item.resenia}"
              </p>

              <div className="flex items-center justify-between pt-2 border-t border-white/5 flex-wrap gap-2 text-xs">
                <div className="flex items-center gap-3 text-zinc-400 font-mono text-[11px]">
                  <span>📅 {fechaTexto}</span>
                  {item.plataforma && <span>· {item.plataforma}</span>}
                </div>

                {item.visto_con_texto && (
                  <div className="bg-pink-950/40 border border-pink-500/30 text-pink-300 text-xs px-3.5 py-1 rounded-full font-medium flex items-center gap-1.5 shadow-sm">
                    <span>🍿</span>
                    <span>Visto con {item.visto_con_texto}</span>
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