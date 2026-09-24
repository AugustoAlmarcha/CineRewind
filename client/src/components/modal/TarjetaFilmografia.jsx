import React from 'react';

export default function TarjetaFilmografia({ obra, yaVista, onSeleccionar }) {
  return (
    <div
      onClick={() => onSeleccionar(obra)}
      className={`relative aspect-[2/3] rounded-2xl overflow-hidden shadow-md group cursor-pointer border border-neutral-200 dark:border-white/10 transition-all duration-300 hover:scale-105 ${
        yaVista ? 'ring-2 ring-emerald-500 shadow-emerald-500/20' : ''
      }`}
    >
      <img
        src={obra.poster_path}
        alt={obra.titulo}
        loading="lazy"
        className={`w-full h-full object-cover group-hover:scale-110 transition duration-300 ${
          yaVista ? 'brightness-90' : ''
        }`}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/25 to-transparent flex flex-col justify-between p-3 pointer-events-none">
        <div className="flex justify-between items-start">
          <span className="text-[9px] font-black uppercase px-2 py-0.5 bg-rose-600 text-white rounded shadow">
            {obra.tipo}
          </span>
          {yaVista && (
            <span className="text-[9px] font-black uppercase px-2 py-0.5 bg-emerald-600 text-white rounded shadow-md flex items-center gap-0.5 backdrop-blur-sm">
              ✓ Vista
            </span>
          )}
        </div>
        <div>
          <h4 className="text-xs font-black text-white truncate drop-shadow">{obra.titulo}</h4>
          <p className="text-[10px] text-rose-400 font-bold truncate mt-0.5">
            {obra.personaje || obra.anio}
          </p>
        </div>
      </div>
    </div>
  );
}