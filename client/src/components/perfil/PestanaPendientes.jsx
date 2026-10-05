import React from 'react';
import { Film } from 'lucide-react';

export default function PestanaPendientes({
  pendientes = [],
  cargandoPendientes,
  onQuitarPendiente,
  onRegistrarObra,
  esMiPerfil = true
}) {
  if (cargandoPendientes) {
    return (
      <p className="text-xs text-center text-zinc-500 py-16 font-mono animate-pulse">
        {esMiPerfil ? 'Cargando tu lista de pendientes...' : 'Cargando lista de pendientes...'}
      </p>
    );
  }

  if (pendientes.length === 0) {
    return (
      <div className="p-16 text-center rounded-3xl border border-dashed border-zinc-800 bg-zinc-950/40 animate-fadeIn">
        <p className="text-base font-bold text-zinc-200">
          {esMiPerfil ? 'Tu lista está vacía.' : 'Este usuario no tiene obras en su lista.'}
        </p>
        <p className="text-xs text-zinc-500 mt-1">
          {esMiPerfil 
            ? 'Añade títulos desde Inicio o el Buscador tocando "Ver más tarde".' 
            : 'Las películas o series que guarde para ver más tarde aparecerán aquí.'}
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 animate-fadeIn">
      {pendientes.map((item) => {
        const poster = item.poster_path
          ? (item.poster_path.startsWith('http') ? item.poster_path : `https://image.tmdb.org/t/p/w500${item.poster_path}`)
          : null;

        return (
          <div
            key={`pen-${item.tmdb_id}`}
            onClick={() => onRegistrarObra({
              tmdb_id: item.tmdb_id,
              id: item.tmdb_id,
              tipo: item.tipo,
              titulo: item.titulo,
              poster_path: poster,
            })}
            className="group aspect-[2/3] rounded-3xl overflow-hidden relative border border-white/10 bg-[#14141d] shadow-2xl flex flex-col justify-between p-5 cursor-pointer hover:border-rose-500/50 transition duration-300"
          >
            {poster ? (
              <img 
                src={poster} 
                alt={item.titulo} 
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition duration-500" 
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
                <div className="w-12 h-12 rounded-2xl bg-zinc-800/80 border border-white/10 flex items-center justify-center text-zinc-400 mb-2">
                  <Film className="w-6 h-6" />
                </div>
                <p className="text-xs font-mono text-zinc-400 font-bold">{item.titulo}</p>
              </div>
            )}

            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/25 to-black/30 group-hover:from-black/90 transition duration-300" />

            <div className="relative z-10 flex justify-end">
              {esMiPerfil && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onQuitarPendiente(e, item.tmdb_id);
                  }}
                  className="w-7 h-7 rounded-full bg-black/70 hover:bg-rose-600 text-white flex items-center justify-center text-xs transition border border-white/10 opacity-0 group-hover:opacity-100 cursor-pointer"
                  title="Quitar de mi lista"
                >
                  ✕
                </button>
              )}
            </div>

            <div className="relative z-10 space-y-0.5">
              <h4 className="text-sm sm:text-base font-bold text-white drop-shadow-md truncate">
                {item.titulo}
              </h4>
              <p className="text-[11px] font-mono text-zinc-400">
                {item.anio || '2025'} · {item.tipo === 'serie' ? 'Serie' : 'Película'}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}