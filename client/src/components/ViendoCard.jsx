import React from 'react';

// Renderizado de Logos Oficiales en SVG
function LogoPlataforma({ nombre }) {
  const normalizado = (nombre || '').toLowerCase();

  if (normalizado.includes('netflix')) {
    return (
      <span className="bg-[#E50914] text-white font-black text-[10px] px-2 py-0.5 rounded shadow tracking-tighter">
        NETFLIX
      </span>
    );
  }
  if (normalizado.includes('max') || normalizado.includes('hbo')) {
    return (
      <span className="bg-[#002BE7] text-white font-black text-[10px] px-2 py-0.5 rounded shadow tracking-wider">
        MAX
      </span>
    );
  }
  if (normalizado.includes('disney')) {
    return (
      <span className="bg-[#113CCF] text-white font-black text-[10px] px-2 py-0.5 rounded shadow tracking-tight">
        Disney+
      </span>
    );
  }
  if (normalizado.includes('prime') || normalizado.includes('amazon')) {
    return (
      <span className="bg-[#00A8E1] text-white font-black text-[10px] px-2 py-0.5 rounded shadow tracking-tight">
        prime
      </span>
    );
  }
  if (normalizado.includes('apple')) {
    return (
      <span className="bg-neutral-900 text-white font-bold text-[10px] px-2 py-0.5 rounded border border-white/20 shadow">
         tv+
      </span>
    );
  }

  // Plataforma genérica / Cine
  return (
    <span className="bg-black/60 backdrop-blur-md text-white text-[10px] font-bold px-2 py-0.5 rounded border border-white/20">
      {nombre || 'Streaming'}
    </span>
  );
}

export default function ViendoCard({ serie, onAvanzar, onDescartar }) {
  const capituloPendiente = parseInt(serie.episodio, 10) + 1;
  const rutaPoster = serie.poster_temporada || serie.poster_path;
  const imagenUrl = rutaPoster
    ? (rutaPoster.startsWith('http') 
        ? rutaPoster 
        : `https://image.tmdb.org/t/p/w500${rutaPoster}`)
    : null;

  return (
    <div className="relative w-56 h-84 rounded-2xl overflow-hidden shadow-lg border border-neutral-300/40 dark:border-white/10 group flex-shrink-0 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl">
      {imagenUrl ? (
        <img 
          src={imagenUrl} 
          alt={serie.titulo} 
          className="w-full h-full object-cover brightness-[0.98] group-hover:brightness-105 group-hover:scale-105 transition-all duration-500" 
        />
      ) : (
        <div className="w-full h-full bg-neutral-800 flex items-center justify-center text-xs text-neutral-400">
          Sin Portada
        </div>
      )}

      {/* Capa de control */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent flex flex-col justify-between p-4 pointer-events-none">
        <div className="flex justify-between items-center pointer-events-auto">
          <LogoPlataforma nombre={serie.plataforma} />
          
          {/* Botón para quitar de Viendo Actualmente */}
          <button
            onClick={() => onDescartar(serie.obra_id)}
            className="w-7 h-7 rounded-full bg-black/60 hover:bg-rose-600 text-white flex items-center justify-center text-xs transition cursor-pointer border border-white/20"
            title="Quitar de Viendo Actualmente"
          >
            ✕
          </button>
        </div>

        <div className="space-y-2.5 pointer-events-auto">
          <div>
            <h3 className="text-base font-black text-white leading-snug drop-shadow-md truncate" title={serie.titulo}>
              {serie.titulo}
            </h3>
            <p className="text-xs font-bold text-rose-400 drop-shadow">
              Siguiente: T{serie.temporada} · E{capituloPendiente}
            </p>
          </div>

          <button
            onClick={() => onAvanzar(serie)}
            className="w-full bg-rose-600 hover:bg-rose-700 active:scale-[0.98] text-white text-xs font-bold py-2.5 px-3 rounded-xl shadow-lg transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5"
          >
            <span>✓</span> Marcar E{capituloPendiente} visto
          </button>
        </div>
      </div>
    </div>
  );
}