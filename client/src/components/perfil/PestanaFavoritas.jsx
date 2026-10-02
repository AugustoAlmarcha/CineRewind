import React from 'react';

export default function PestanaFavoritas({
  favoritos = [],
  arrastrandoSlot,
  setArrastrandoSlot,
  handleDropIntercambio,
  handleEliminarFavorito,
  setRanuraSeleccionada,
  setTipoFavorito,
  setModalFavoritoAbierto,
}) {
  const renderSlot = (slot, tipo) => {
    const fav = favoritos.find((f) => f.posicion === slot && f.tipo === tipo);
    const poster = fav?.poster_path
      ? (fav.poster_path.startsWith('http') ? fav.poster_path : `https://image.tmdb.org/t/p/w500${fav.poster_path}`)
      : null;
    const esSerie = tipo === 'serie';

    return (
      <div
        key={`${tipo}-slot-${slot}`}
        draggable={Boolean(fav)}
        onDragStart={() => setArrastrandoSlot(slot)}
        onDragOver={(e) => e.preventDefault()}
        onDrop={() => handleDropIntercambio(slot, tipo)}
        onClick={() => {
          setRanuraSeleccionada(slot);
          setTipoFavorito(tipo);
          setModalFavoritoAbierto(true);
        }}
        className={`group relative aspect-[2/3] rounded-2xl bg-[#141419] border transition-all cursor-pointer shadow-lg overflow-hidden flex flex-col justify-between ${
          arrastrandoSlot === slot ? 'opacity-40 border-rose-500 scale-95' : 'border-white/10 hover:border-rose-500'
        }`}
      >
        {poster ? (
          <>
            <img
              src={poster}
              alt={fav.titulo}
              className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
            />
            {/* Badge de Tipo */}
            <div className="absolute top-3 left-3 z-10 pointer-events-none">
              <span className="text-[9px] font-black uppercase px-2 py-0.5 bg-black/70 backdrop-blur-md border border-white/20 text-white rounded-md tracking-wider">
                {esSerie ? 'SERIE' : 'PELÍCULA'}
              </span>
            </div>

            {/* Gradiente y acciones */}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent p-4 flex flex-col justify-between">
              <div className="flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  type="button"
                  onClick={(e) => handleEliminarFavorito(e, fav.posicion, tipo)}
                  className="w-7 h-7 rounded-full bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center text-xs font-bold transition shadow"
                  title="Quitar de favoritos"
                >
                  ✕
                </button>
              </div>
              <div>
                <p className="text-sm font-black text-white truncate drop-shadow">
                  {fav.titulo}
                </p>
                <p className="text-[10px] text-neutral-400 font-mono">Top #{slot}</p>
              </div>
            </div>
          </>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center hover:bg-white/5 transition">
            <span className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-neutral-400 mb-2 group-hover:bg-rose-600 group-hover:text-white transition">
              +
            </span>
            <span className="text-xs font-mono font-bold text-neutral-400 group-hover:text-white transition">
              Elegir {esSerie ? 'Serie' : 'Película'} {slot}
            </span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-12 animate-fadeIn">
      {/* 1. TOP 4 SERIES FAVORITAS */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-black uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
            Series Favoritas (Top 4)
          </h3>
          <span className="text-[11px] font-mono text-neutral-400">SELECCIÓN PERSONAL</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((slot) => renderSlot(slot, 'serie'))}
        </div>
      </div>

      {/* 2. TOP 4 PELÍCULAS FAVORITAS */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-black uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
            Películas Favoritas (Top 4)
          </h3>
          <span className="text-[11px] font-mono text-neutral-400">CINE</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((slot) => renderSlot(slot, 'pelicula'))}
        </div>
      </div>
    </div>
  );
}