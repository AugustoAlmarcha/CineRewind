import React from 'react';

export default function PestanaPendientes({
  pendientes = [],
  cargandoPendientes,
  handleQuitarPendiente,
  setObraParaRegistrar,
}) {
  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-black uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
          Mi Lista ({pendientes.length})
        </h3>
        <span className="text-[11px] font-mono text-neutral-400">VER MÁS TARDE</span>
      </div>

      {cargandoPendientes && (
        <p className="text-xs text-center text-neutral-400 py-16 font-mono animate-pulse">
          Cargando títulos guardados...
        </p>
      )}

      {!cargandoPendientes && pendientes.length === 0 && (
        <div className="p-16 text-center rounded-3xl border-2 border-dashed border-neutral-300 dark:border-white/10 bg-white/40 dark:bg-white/[0.01] space-y-2">
          <p className="text-sm font-bold text-neutral-700 dark:text-neutral-300">
            Tu lista de pendientes está vacía.
          </p>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            Abre cualquier película o serie desde Tendencias o el Buscador y toca "Ver más tarde".
          </p>
        </div>
      )}

      {!cargandoPendientes && pendientes.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-4">
          {pendientes.map((item) => {
            const poster = item.poster_path
              ? (item.poster_path.startsWith('http') ? item.poster_path : `https://image.tmdb.org/t/p/w500${item.poster_path}`)
              : null;
            const esSerie = item.tipo === 'serie';

            return (
              <div
                key={`pendiente-${item.tmdb_id}`}
                onClick={() => {
                  setObraParaRegistrar({
                    tmdb_id: item.tmdb_id,
                    id: item.tmdb_id,
                    tipo: item.tipo,
                    titulo: item.titulo,
                    poster_path: poster,
                  });
                }}
                className="group relative aspect-[2/3] rounded-2xl bg-[#141419] border border-white/10 hover:border-rose-500 transition-all shadow-lg overflow-hidden flex flex-col justify-between cursor-pointer hover:-translate-y-1"
              >
                {poster ? (
                  <img
                    src={poster}
                    alt={item.titulo}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs font-mono text-neutral-500 p-2 text-center">
                    Sin Póster
                  </div>
                )}

                <div className="absolute top-3 left-3 z-10 pointer-events-none">
                  <span className="text-[9px] font-black uppercase px-2 py-0.5 bg-black/70 backdrop-blur-md border border-white/20 text-white rounded-md tracking-wider">
                    {esSerie ? 'SERIE' : 'PELÍCULA'}
                  </span>
                </div>

                <div className="absolute top-3 right-3 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    type="button"
                    onClick={(e) => handleQuitarPendiente(e, item.tmdb_id)}
                    className="w-7 h-7 rounded-full bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center text-xs font-bold transition shadow cursor-pointer active:scale-90"
                    title="Quitar de mi lista"
                  >
                    ✕
                  </button>
                </div>

                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent p-4 flex flex-col justify-end pointer-events-none">
                  <p className="text-sm font-black text-white truncate drop-shadow">
                    {item.titulo}
                  </p>
                  <span className="text-[10px] text-rose-400 font-bold group-hover:text-white transition">
                    ▶ Toca para ver / registrar
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}