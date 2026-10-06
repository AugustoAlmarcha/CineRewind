import React from 'react';

export default function TarjetaFilmografia({ 
  obra, 
  yaVista, 
  onSeleccionar,
  modoSeleccion = false,
  seleccionada = false
}) {
  return (
    <div
      onClick={() => onSeleccionar(obra)}
      className={`relative aspect-[2/3] rounded-2xl overflow-hidden shadow-md group cursor-pointer border transition-all duration-300 hover:scale-105 ${
        seleccionada
          ? 'ring-4 ring-rose-500 shadow-xl shadow-rose-500/30 scale-[1.03] border-rose-500'
          : yaVista
          ? 'ring-2 ring-emerald-500 shadow-emerald-500/20 border-emerald-500/40'
          : 'border-neutral-200 dark:border-white/10'
      }`}
    >
      <img
        src={obra.poster_path}
        alt={obra.titulo}
        loading="lazy"
        className={`w-full h-full object-cover group-hover:scale-110 transition duration-300 ${
          yaVista && !seleccionada ? 'brightness-90' : ''
        }`}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/25 to-transparent flex flex-col justify-between p-3 pointer-events-none">
        <div className="flex justify-between items-start gap-1">
          <span className="text-[9px] font-black uppercase px-2 py-0.5 bg-rose-600 text-white rounded shadow">
            {obra.tipo}
          </span>
          <div className="flex items-center gap-1.5">
            {yaVista && (
              <span className="text-[9px] font-black uppercase px-2 py-0.5 bg-emerald-600 text-white rounded shadow-md flex items-center gap-0.5 backdrop-blur-sm">
                ✓ Vista
              </span>
            )}
            {modoSeleccion && (
              <div 
                className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-black transition-all shadow-md ${
                  seleccionada 
                    ? 'bg-rose-600 text-white ring-2 ring-white scale-110' 
                    : 'bg-black/60 text-transparent border border-white/60'
                }`}
              >
                ✓
              </div>
            )}
          </div>
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