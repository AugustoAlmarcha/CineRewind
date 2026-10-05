import React from 'react';
import { Plus } from 'lucide-react';

export default function VitrinaTop4({
  favoritos,
  top4Mode,
  setTop4Mode,
  arrastrandoSlot,
  setArrastrandoSlot,
  handleDropIntercambio,
  handleEliminarFavorito,
  onSeleccionarSlot,
  esMiPerfil = true
}) {
  return (
    <section className="w-full bg-[#12121a]/95 border border-zinc-800/90 rounded-3xl p-6 sm:p-7 shadow-xl space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800/80 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-amber-400 font-bold text-sm">★</span>
            <h3 className="text-base font-black text-white tracking-tight uppercase">
              Top 4 de Honor
            </h3>
          </div>
          <p className="text-xs text-zinc-400 mt-0.5">
            {esMiPerfil ? 'Tus cuatro obras cumbre en vitrina' : 'Las cuatro obras cumbre en vitrina'}
          </p>
        </div>

        <div className="flex items-center p-1 bg-zinc-900 rounded-xl border border-zinc-800 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setTop4Mode('serie')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              top4Mode === 'serie'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Series Favoritas
          </button>
          <button
            type="button"
            onClick={() => setTop4Mode('pelicula')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              top4Mode === 'pelicula'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Películas
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((slot) => {
          const fav = favoritos.find((f) => f.posicion === slot && f.tipo === top4Mode);
          const poster = fav?.poster_path
            ? (fav.poster_path.startsWith('http') ? fav.poster_path : `https://image.tmdb.org/t/p/w500${fav.poster_path}`)
            : null;

          return (
            <div
              key={`${top4Mode}-slot-${slot}`}
              draggable={esMiPerfil && Boolean(fav)}
              onDragStart={esMiPerfil ? () => setArrastrandoSlot(slot) : undefined}
              onDragOver={esMiPerfil ? (e) => e.preventDefault() : undefined}
              onDrop={esMiPerfil ? () => handleDropIntercambio(slot, top4Mode) : undefined}
              onClick={esMiPerfil ? () => onSeleccionarSlot(slot, top4Mode) : undefined}
              className={`group relative aspect-[2/3] rounded-2xl bg-zinc-950 border border-zinc-800 ${
                esMiPerfil ? 'hover:border-amber-400/80 cursor-pointer' : 'cursor-default'
              } transition-all shadow-lg overflow-hidden flex flex-col justify-between ${
                arrastrandoSlot === slot ? 'opacity-40 border-rose-500 scale-95' : ''
              }`}
            >
              <div className="absolute top-2.5 left-2.5 z-20">
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-md shadow-md ${
                  slot === 1 ? 'bg-amber-400 text-black' :
                  slot === 2 ? 'bg-zinc-200 text-black' :
                  slot === 3 ? 'bg-amber-700 text-white' :
                  'bg-zinc-800 text-zinc-300'
                }`}>
                  #{slot}
                </span>
              </div>

              {poster ? (
                <>
                  <img
                    src={poster}
                    alt={fav.titulo}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  />

                  {esMiPerfil && (
                    <div className="absolute top-2.5 right-2.5 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={(e) => handleEliminarFavorito(e, fav.posicion, top4Mode)}
                        className="w-6 h-6 rounded-full bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center text-xs font-bold transition shadow cursor-pointer"
                        title="Quitar"
                      >
                        ✕
                      </button>
                    </div>
                  )}

                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent p-3 flex flex-col justify-end">
                    <p className="text-xs font-bold text-white truncate drop-shadow">
                      {fav.titulo}
                    </p>
                    <span className="text-[10px] text-zinc-400 font-mono">
                      {fav.anio || 'CineRewind'}
                    </span>
                  </div>
                </>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center">
                  <div className={`w-8 h-8 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 mb-2 ${
                    esMiPerfil ? 'group-hover:bg-rose-600 group-hover:text-white transition' : ''
                  }`}>
                    <Plus className="w-4 h-4" />
                  </div>
                  <span className="text-[11px] font-mono font-bold text-zinc-400 transition">
                    {esMiPerfil ? `Elegir #${slot}` : `Sin obra #${slot}`}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}