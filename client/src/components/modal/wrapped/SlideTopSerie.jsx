import React from 'react';
import { Crown, Sparkles, Flame, Tv, ArrowRight } from 'lucide-react';

export default function SlideTopSerie({ stats, obtenerUrlImagenSegura, onSiguiente }) {
  const topSerie = stats?.topSerie;
  const titulo = topSerie?.titulo || 'Tu Serie Favorita';
  const episodios = topSerie?.episodios_vistos || stats?.totalEpisodios || 0;
  const posterUrl = topSerie?.poster_path ? obtenerUrlImagenSegura(topSerie.poster_path) : null;

  return (
    <div className="w-full h-full flex flex-col items-center justify-between text-center bg-gradient-to-b from-[#181305] via-[#0d0b04] to-[#040406] rounded-3xl p-3 sm:p-5 relative overflow-hidden text-white shadow-2xl select-none">
      <style>{`
        @keyframes goldenAura {
          0%, 100% {
            opacity: 0.35;
            transform: scale(0.95);
          }
          50% {
            opacity: 0.7;
            transform: scale(1.08);
          }
        }
        @keyframes float3DPoster {
          0%, 100% {
            transform: translateY(0px) rotateY(-3deg) rotateX(2deg);
          }
          50% {
            transform: translateY(-8px) rotateY(3deg) rotateX(-2deg);
          }
        }
      `}</style>

      {/* 1. RESPLANDOR DORADO DE ALFOMBRA ROJA Y FESTIVAL */}
      <div 
        className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[360px] sm:w-[520px] h-[360px] sm:h-[520px] rounded-full bg-amber-500/20 blur-[110px] pointer-events-none -z-0"
        style={{ animation: 'goldenAura 8s ease-in-out infinite' }}
      />
      <div className="absolute -bottom-20 -left-10 w-64 h-64 rounded-full bg-yellow-600/10 blur-3xl pointer-events-none -z-0" />

      {/* 2. CABECERA: BRANDING EDITORIAL (#MiCineRewindAño) */}
      <div className="relative z-10 flex flex-col items-center shrink-0 pt-1">
        <span className="text-base sm:text-lg font-black tracking-tight text-white drop-shadow-md mb-1">
          #MiCineRewindAño
        </span>
        <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-amber-400/10 border border-amber-400/30 text-[10px] sm:text-xs font-mono font-black text-amber-300">
          <Crown className="w-3.5 h-3.5 text-amber-400" />
          <span>LA SERIE SUPREMA DE TU AÑO</span>
        </div>
      </div>

      {/* 3. HERO: SPOTLIGHT DE LA SERIE #1 CON PÓSTER FLOTANTE 3D */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center w-full max-w-sm sm:max-w-md min-h-0 px-2 my-auto">
        <div className="mb-2 text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight uppercase leading-tight">
            Tu Gran Obsesión
          </h2>
          <p className="text-[11px] sm:text-xs text-amber-200/80 font-medium">
            La historia que dominó tu pantalla este año.
          </p>
        </div>

        {topSerie ? (
          <div className="relative w-full max-w-[310px] sm:max-w-[350px] p-3.5 sm:p-4 rounded-3xl bg-zinc-950/85 border border-amber-400/40 backdrop-blur-xl shadow-[0_20px_50px_rgba(0,0,0,0.9)] flex flex-col items-center text-center">
            {/* PÓSTER CON EFECTO 3D Y AMBIENT BACKLIGHT */}
            <div 
              className="relative w-28 sm:w-36 aspect-[2/3] rounded-2xl overflow-hidden bg-zinc-900 border-2 border-amber-400/70 shadow-[0_15px_35px_rgba(245,158,11,0.3)] mb-3"
              style={{ animation: 'float3DPoster 7s ease-in-out infinite' }}
            >
              {posterUrl ? (
                <>
                  <img 
                    src={posterUrl} 
                    alt="" 
                    crossOrigin="anonymous" 
                    aria-hidden="true" 
                    className="absolute inset-0 w-full h-full object-cover blur-sm opacity-40 scale-110" 
                  />
                  <img 
                    src={posterUrl} 
                    alt={titulo} 
                    crossOrigin="anonymous" 
                    className="relative z-10 w-full h-full object-cover" 
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                </>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center p-2 text-zinc-500">
                  <Tv className="w-8 h-8 mb-1 text-amber-400" />
                  <span className="text-[10px] font-bold">Sin Póster</span>
                </div>
              )}
            </div>

            {/* TÍTULO OFICIAL */}
            <div className="w-full px-1">
              <span className="text-[9px] font-mono uppercase text-amber-400 font-bold tracking-wider block mb-0.5">
                SERIE MÁS MARATONEADA
              </span>
              <h3 className="text-lg sm:text-xl font-black text-white uppercase tracking-tight leading-snug line-clamp-2">
                {titulo}
              </h3>
            </div>

            {/* MÉTRICA DE CAPÍTULOS ENORME */}
            <div className="mt-2.5 px-4 py-2 rounded-2xl bg-gradient-to-r from-amber-500/10 via-amber-400/15 to-amber-500/10 border border-amber-400/30 w-full">
              <div className="flex items-center justify-center gap-1.5">
                <Flame className="w-4 h-4 text-amber-400" />
                <span className="text-lg sm:text-2xl font-black text-amber-300 font-mono">
                  {episodios}
                </span>
                <span className="text-xs sm:text-sm font-bold text-white uppercase tracking-wide">
                  capítulos
                </span>
              </div>
              <span className="text-[10px] sm:text-[11px] text-zinc-400 block mt-0.5">
                {episodios >= 40 
                  ? 'Más de dos temporadas completas devoradas' 
                  : 'Una maratón inolvidable en tu historial'}
              </span>
            </div>

            {/* Cita cinematográfica con estilo */}
            <p className="text-[11px] sm:text-xs text-zinc-300 italic mt-2.5">
              "El botón de 'Siguiente episodio en 5 segundos' fue tu perdición."
            </p>
          </div>
        ) : (
          <p className="text-sm text-zinc-400">No registraste series en este año.</p>
        )}
      </div>

      {/* 4. BOTÓN DE ACCIÓN */}
      <div className="relative z-10 shrink-0 pb-1 sm:pb-2 pt-1">
        <button 
          onClick={onSiguiente} 
          className="group inline-flex items-center gap-2 px-8 sm:px-10 py-2.5 sm:py-3 rounded-full bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-300 hover:to-yellow-300 text-black font-black text-xs sm:text-sm uppercase tracking-wide cursor-pointer shadow-[0_10px_30px_rgba(245,158,11,0.35)] transition-all hover:scale-105 active:scale-95"
        >
          <span>Abrir los Sobres de Honor</span>
          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
        </button>
      </div>
    </div>
  );
}