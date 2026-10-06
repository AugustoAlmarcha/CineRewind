import React, { useEffect } from 'react';
import { Sparkles, Film, Tv, Star, RotateCcw, CheckCircle2, X, Play } from 'lucide-react';

export default function ModalRecomendacionAzar({
  abierto,
  obra,
  alCerrar,
  alSeleccionar,
  alGirarDeNuevo,
  origen = 'tendencias', // 'tendencias' | 'pendientes'
}) {
  useEffect(() => {
    if (!abierto) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') alCerrar();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [abierto, alCerrar]);

  if (!abierto || !obra) return null;

  const resolverPoster = (ruta) => {
    if (!ruta) return null;
    if (ruta.startsWith('http')) return ruta;
    return `https://image.tmdb.org/t/p/w500${ruta.startsWith('/') ? ruta : `/${ruta}`}`;
  };

  const poster = resolverPoster(obra.poster_path);
  const esSerie = obra.tipo === 'tv' || obra.tipo === 'serie';
  const anio = obra.anio || (obra.release_date ? obra.release_date.split('-')[0] : (obra.first_air_date ? obra.first_air_date.split('-')[0] : null));
  const calificacion = obra.calificacion || obra.vote_average;
  const sinopsis = obra.sinopsis || obra.overview;

  return (
    <div
      onClick={alCerrar}
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn select-none"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg bg-[#14141a] border border-amber-500/40 rounded-3xl shadow-2xl p-6 sm:p-7 overflow-hidden animate-scaleUp"
      >
        {/* Resplandor dorado de fondo */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-80 h-48 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Botón de cerrar */}
        <button
          type="button"
          onClick={alCerrar}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white flex items-center justify-center transition cursor-pointer border border-white/10 z-10"
          title="Cerrar"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Encabezado */}
        <div className="text-center space-y-2 mb-6 relative">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-gradient-to-r from-amber-500/20 via-rose-500/20 to-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin" />
            <span>{origen === 'pendientes' ? 'De tu lista de pendientes' : 'Sorteo de tendencias'}</span>
          </div>

          <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight drop-shadow">
            ¡Hoy te recomendamos ver!
          </h3>

          <p className="text-xs text-neutral-400 max-w-sm mx-auto">
            {origen === 'pendientes'
              ? 'La ruleta seleccionó este título que guardaste para ver más tarde.'
              : 'La ruleta cinematográfica eligió este título para tu próxima sesión.'}
          </p>
        </div>

        {/* Tarjeta de la obra ganadora */}
        <div className="flex flex-col sm:flex-row gap-5 items-center sm:items-start bg-neutral-900/70 border border-white/10 rounded-2xl p-4 sm:p-5 relative mb-6">
          {/* Póster con marco dorado */}
          <div className="w-28 sm:w-32 aspect-[2/3] rounded-xl overflow-hidden flex-shrink-0 bg-neutral-950 shadow-xl border-2 border-amber-400/60 relative group">
            {poster ? (
              <img
                src={poster}
                alt={obra.titulo}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center p-2 text-center text-xs text-neutral-500">
                {esSerie ? <Tv className="w-6 h-6 mb-1 text-neutral-600" /> : <Film className="w-6 h-6 mb-1 text-neutral-600" />}
                <span>{obra.titulo}</span>
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
          </div>

          {/* Información */}
          <div className="flex-1 space-y-2 text-center sm:text-left min-w-0">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <span className="inline-flex items-center gap-1 text-[11px] font-black uppercase px-2.5 py-0.5 rounded-md bg-rose-600/90 text-white shadow-sm">
                {esSerie ? <Tv className="w-3 h-3" /> : <Film className="w-3 h-3" />}
                {esSerie ? 'Serie' : 'Película'}
              </span>

              {anio && (
                <span className="text-xs font-mono font-bold text-neutral-400">
                  {anio}
                </span>
              )}

              {calificacion && Number(calificacion) > 0 && (
                <span className="inline-flex items-center gap-1 text-xs font-black text-amber-400">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  {Number(calificacion).toFixed(1)}
                </span>
              )}
            </div>

            <h4 className="text-lg sm:text-xl font-black text-white leading-tight break-words">
              {obra.titulo}
            </h4>

            {sinopsis ? (
              <p className="text-xs text-neutral-300 line-clamp-3 sm:line-clamp-4 leading-relaxed font-normal">
                {sinopsis}
              </p>
            ) : (
              <p className="text-xs text-neutral-500 italic">
                Sin descripción disponible.
              </p>
            )}
          </div>
        </div>

        {/* Botones de acción */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={() => {
              alCerrar();
              alSeleccionar(obra);
            }}
            className="flex-1 bg-gradient-to-r from-amber-500 via-rose-600 to-rose-700 hover:from-amber-400 hover:to-rose-600 text-white font-black py-3.5 px-5 rounded-2xl shadow-lg shadow-rose-900/30 flex items-center justify-center gap-2 transition cursor-pointer text-xs uppercase tracking-wider"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Ver detalles / Registrar</span>
          </button>

          <a
            href={`https://www.youtube.com/results?search_query=${encodeURIComponent(`${obra.titulo} trailer oficial`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-red-600 hover:bg-red-500 text-white font-bold py-3.5 px-4 rounded-2xl flex items-center justify-center gap-2 transition cursor-pointer text-xs shadow-md shrink-0"
            title="Ver trailer en YouTube"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Trailer</span>
          </a>

          <button
            type="button"
            onClick={alGirarDeNuevo}
            className="bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-white font-bold py-3.5 px-4 rounded-2xl border border-white/10 flex items-center justify-center gap-2 transition cursor-pointer text-xs shrink-0"
          >
            <RotateCcw className="w-4 h-4 text-amber-400" />
            <span>Girar</span>
          </button>
        </div>
      </div>
    </div>
  );
}
