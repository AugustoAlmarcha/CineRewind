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

export default function ViendoCard({ 
  serie, 
  index = 0, 
  totalSeries = 1,
  onAvanzar, 
  onDescartar, 
  onAbrirDetalle, 
  onVerInfoEpisodio 
}) {
  const proximaTemporada = serie.siguiente_temporada ?? serie.temporada;
  const proximoEpisodio = serie.siguiente_episodio ?? (parseInt(serie.episodio, 10) + 1);

  const rutaPoster = serie.poster_temporada || serie.poster_path;
  const posterUrl = rutaPoster
    ? (rutaPoster.startsWith('http') 
        ? rutaPoster 
        : `https://image.tmdb.org/t/p/w500${rutaPoster.startsWith('/') ? rutaPoster : `/${rutaPoster}`}`)
    : null;

  const rutaFotoSiguiente = serie.foto_siguiente;
  const fotoCapituloUrl = rutaFotoSiguiente
    ? (rutaFotoSiguiente.startsWith('http') 
        ? rutaFotoSiguiente 
        : `https://image.tmdb.org/t/p/w780${rutaFotoSiguiente.startsWith('/') ? rutaFotoSiguiente : `/${rutaFotoSiguiente}`}`)
    : posterUrl;

  // Alineación inteligente:
  // - Si es la primera: anclada a la izquierda (left-0)
  // - Si es la última (y hay más de 1): anclada a la derecha (right-0 left-auto)
  // - Si está en el medio: centrada (left-1/2 -translate-x-1/2)
  let alineacionHorizontal = 'left-1/2 -translate-x-1/2';
  if (index === 0) {
    alineacionHorizontal = 'left-0 translate-x-0';
  } else if (index === totalSeries - 1 && totalSeries > 1) {
    alineacionHorizontal = 'right-0 left-auto translate-x-0';
  }

  return (
    <div 
      onClick={() => onAbrirDetalle(serie)}
      className="relative w-56 h-84 flex-shrink-0 cursor-pointer group select-none"
    >
      {/* TARJETA BASE */}
      <div className="w-full h-full rounded-2xl overflow-hidden shadow-lg border border-neutral-300/40 dark:border-white/10 bg-[#141418] relative transition-opacity duration-200 group-hover:opacity-0">
        {posterUrl ? (
          <img 
            src={posterUrl} 
            alt={serie.titulo} 
            className="w-full h-full object-cover brightness-[0.95]" 
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center p-4 text-center text-xs font-bold text-neutral-400">
            {serie.titulo}
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/30 to-transparent flex flex-col justify-between p-4 pointer-events-none">
          <div className="flex justify-between items-center">
            <LogoPlataforma nombre={serie.plataforma} />
          </div>
          <div>
            <h3 className="text-sm font-black text-white truncate drop-shadow">{serie.titulo}</h3>
            <p className="text-xs font-bold text-rose-400 mt-0.5">
              T{proximaTemporada} · E{proximoEpisodio}
            </p>
          </div>
        </div>
      </div>

      {/* POP-UP GRANDE EN HOVER */}
      <div className={`absolute top-1/2 -translate-y-1/2 ${alineacionHorizontal} w-96 rounded-3xl overflow-hidden shadow-2xl border border-white/20 bg-[#16161c] z-30 opacity-0 pointer-events-none scale-95 group-hover:opacity-100 group-hover:pointer-events-auto group-hover:scale-105 transition-all duration-300 ease-out flex flex-col`}>
        
        <div className="w-full aspect-video bg-neutral-900 relative overflow-hidden flex-shrink-0">
          {fotoCapituloUrl ? (
            <img 
              src={fotoCapituloUrl} 
              alt={`Capítulo ${proximoEpisodio}`} 
              className="w-full h-full object-cover" 
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-xs text-neutral-500 font-bold">
              Foto de capítulo no disponible
            </div>
          )}

          <div className="absolute top-3 left-3 right-3 flex justify-between items-center z-10">
            <LogoPlataforma nombre={serie.plataforma} />

            <div className="flex items-center gap-1.5">
              {onVerInfoEpisodio && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onVerInfoEpisodio(serie);
                  }}
                  className="w-7 h-7 rounded-full bg-black/70 hover:bg-white hover:text-black text-white flex items-center justify-center text-xs font-bold transition cursor-pointer border border-white/20 backdrop-blur-sm"
                  title="Ver sinopsis y actores (X-Ray)"
                >
                  ℹ
                </button>
              )}

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDescartar(serie.obra_id);
                }}
                className="w-7 h-7 rounded-full bg-black/70 hover:bg-rose-600 text-white flex items-center justify-center text-xs transition cursor-pointer border border-white/20 backdrop-blur-sm"
                title="Quitar de Viendo Actualmente"
              >
                ✕
              </button>
            </div>
          </div>

          <span className="absolute bottom-2.5 left-3 px-2.5 py-0.5 rounded-md bg-black/80 backdrop-blur-md text-[10px] font-black text-white border border-white/10 uppercase tracking-wider">
            Siguiente Episodio
          </span>
        </div>

        <div className="p-5 space-y-3.5 bg-[#16161c]">
          <div>
            <h3 className="text-lg font-black text-white truncate" title={serie.titulo}>
              {serie.titulo}
            </h3>
            <p className="text-xs font-extrabold text-rose-500 mt-0.5">
              Temporada {proximaTemporada} · Episodio {proximoEpisodio}
            </p>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onAvanzar(serie);
            }}
            className="w-full bg-rose-600 hover:bg-rose-700 active:scale-95 text-white text-xs font-black py-2.5 px-4 rounded-xl shadow-lg transition duration-200 cursor-pointer flex items-center justify-center gap-1.5"
          >
            <span>✓</span> Marcar T{proximaTemporada} E{proximoEpisodio} visto
          </button>
        </div>

      </div>
    </div>
  );
}