import React from 'react';

function LogoPlataforma({ nombre }) {
  const normalizado = (nombre || '').toLowerCase();

  if (normalizado.includes('netflix')) {
    return <span className="bg-[#E50914] text-white font-black text-[10px] px-2 py-0.5 rounded shadow tracking-tighter">NETFLIX</span>;
  }
  if (normalizado.includes('max') || normalizado.includes('hbo')) {
    return <span className="bg-[#002BE7] text-white font-black text-[10px] px-2 py-0.5 rounded shadow tracking-wider">MAX</span>;
  }
  if (normalizado.includes('disney')) {
    return <span className="bg-[#113CCF] text-white font-black text-[10px] px-2 py-0.5 rounded shadow tracking-tight">Disney+</span>;
  }
  if (normalizado.includes('prime') || normalizado.includes('amazon')) {
    return <span className="bg-[#00A8E1] text-white font-black text-[10px] px-2 py-0.5 rounded shadow tracking-tight">prime</span>;
  }
  if (normalizado.includes('apple')) {
    return <span className="bg-neutral-900 text-white font-bold text-[10px] px-2 py-0.5 rounded border border-white/20 shadow">tv+</span>;
  }
  return (
    <span className="bg-black/60 backdrop-blur-md text-white text-[10px] font-bold px-2 py-0.5 rounded border border-white/20">
      {nombre || 'Streaming'}
    </span>
  );
}

export default function ViendoCard({ serie, onAvanzar, onDescartar, onAbrirDetalle, onVerInfoEpisodio }) {
  const proximaTemporada = serie.siguiente_temporada ?? serie.temporada;
  const proximoEpisodio = serie.siguiente_episodio ?? (parseInt(serie.episodio, 10) + 1);

  const rutaImagen = serie.foto_siguiente || serie.foto_episodio || serie.poster_path;
  const imagenUrl = rutaImagen
    ? (rutaImagen.startsWith('http') 
        ? rutaImagen 
        : `https://image.tmdb.org/t/p/w500${rutaImagen.startsWith('/') ? rutaImagen : `/${rutaImagen}`}`)
    : null;

  return (
    <div 
      onClick={() => onAbrirDetalle && onAbrirDetalle(serie)}
      className="relative w-72 aspect-[5/6] rounded-3xl overflow-hidden shadow-lg border border-neutral-300/40 dark:border-white/10 group flex-shrink-0 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl cursor-pointer bg-[#141418]"
    >
      {/* Captura con proporción ampliada */}
      {imagenUrl ? (
        <img 
          src={imagenUrl} 
          alt={serie.titulo} 
          onError={(e) => { e.currentTarget.style.display = 'none'; }}
          className="w-full h-full object-cover brightness-[0.95] group-hover:brightness-105 group-hover:scale-105 transition-all duration-500" 
        />
      ) : (
        <div className="w-full h-full bg-[#1c1c22] flex items-center justify-center p-4 text-center text-xs font-bold text-neutral-400">
          {serie.titulo}
        </div>
      )}

      {/* Capa de controles y degradado */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/35 to-transparent flex flex-col justify-between p-4 pointer-events-none">
        
        {/* Cabecera superior */}
        <div className="flex justify-between items-center pointer-events-auto">
          <LogoPlataforma nombre={serie.plataforma} />

          <div className="flex items-center gap-1.5">
            {onVerInfoEpisodio && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onVerInfoEpisodio(serie);
                }}
                className="w-7 h-7 rounded-full bg-black/60 hover:bg-neutral-800 text-white flex items-center justify-center text-xs transition cursor-pointer border border-white/20"
                title="Ver detalles y actores del episodio"
              >
                ℹ
              </button>
            )}

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDescartar && onDescartar(serie.obra_id);
              }}
              className="w-7 h-7 rounded-full bg-black/60 hover:bg-rose-600 text-white flex items-center justify-center text-xs transition cursor-pointer border border-white/20"
              title="Quitar de Viendo Actualmente"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Bloque inferior con más amplitud horizontal */}
        <div className="space-y-2.5 pointer-events-auto">
          <div>
            <h3 className="text-base font-black text-white leading-snug drop-shadow-md truncate" title={serie.titulo}>
              {serie.titulo}
            </h3>
            <p className="text-xs font-bold text-rose-400 drop-shadow">
              Siguiente: T{proximaTemporada} · E{proximoEpisodio}
            </p>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onAvanzar && onAvanzar(serie);
            }}
            className="w-full bg-rose-600 hover:bg-rose-700 active:scale-[0.98] text-white text-xs font-bold py-2.5 px-3 rounded-xl shadow-lg transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5"
          >
            <span>✓</span> Marcar T{proximaTemporada} E{proximoEpisodio} visto
          </button>
        </div>

      </div>
    </div>
  );
}