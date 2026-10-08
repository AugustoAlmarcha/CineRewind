import React from 'react';
import { Tv, Film, PenTool, ArrowRight } from 'lucide-react';

export default function SlideHoras({ stats, onSiguiente }) {
  return (
    <div className="w-full h-full flex flex-col items-center justify-between text-center bg-gradient-to-b from-[#0d0d15] via-[#09090e] to-[#040407] rounded-3xl p-4 sm:p-6 relative overflow-hidden text-white shadow-2xl select-none">
      <style>{`
        @keyframes rotateOpticalRings {
          0% {
            transform: rotate(0deg) scale(1);
          }
          50% {
            transform: rotate(180deg) scale(1.05);
          }
          100% {
            transform: rotate(360deg) scale(1);
          }
        }
        @keyframes pulseGlowRing {
          0%, 100% {
            opacity: 0.35;
            transform: scale(0.97);
          }
          50% {
            opacity: 0.7;
            transform: scale(1.03);
          }
        }
      `}</style>

      {/* 1. ARTE ÓPTICO CINÉTICO ESTILO SPOTIFY WRAPPED (ANILLOS CONCÉNTRICOS HIPNÓTICOS) */}
      <div className="absolute -bottom-28 -right-28 sm:-bottom-32 sm:-right-32 w-[340px] sm:w-[460px] h-[340px] sm:h-[460px] pointer-events-none -z-0 opacity-40 select-none">
        <svg 
          viewBox="0 0 400 400" 
          className="w-full h-full"
          style={{ 
            animation: 'rotateOpticalRings 32s linear infinite',
            transformOrigin: '200px 200px'
          }}
        >
          {/* Anillos concéntricos de alto contraste */}
          <circle cx="200" cy="200" r="190" fill="none" stroke="#ffffff" strokeWidth="8" strokeOpacity="0.15" />
          <circle cx="200" cy="200" r="170" fill="none" stroke="#ffffff" strokeWidth="10" strokeOpacity="0.25" />
          <circle cx="200" cy="200" r="150" fill="none" stroke="#8b5cf6" strokeWidth="12" strokeOpacity="0.7" />
          <circle cx="200" cy="200" r="130" fill="none" stroke="#ffffff" strokeWidth="10" strokeOpacity="0.3" />
          <circle cx="200" cy="200" r="110" fill="none" stroke="#c084fc" strokeWidth="8" strokeOpacity="0.6" />
          <circle cx="200" cy="200" r="90" fill="none" stroke="#ffffff" strokeWidth="9" strokeOpacity="0.4" />
          <circle cx="200" cy="200" r="70" fill="none" stroke="#ffffff" strokeWidth="10" strokeOpacity="0.5" />
          <circle cx="200" cy="200" r="50" fill="none" stroke="#8b5cf6" strokeWidth="12" strokeOpacity="0.9" />
          <circle cx="200" cy="200" r="30" fill="none" stroke="#ffffff" strokeWidth="12" strokeOpacity="0.6" />
        </svg>

        {/* Resplandor violeta profundo detrás de los anillos */}
        <div 
          className="absolute inset-0 rounded-full bg-violet-600/30 blur-3xl -z-10"
          style={{ animation: 'pulseGlowRing 7s ease-in-out infinite' }}
        />
      </div>

      {/* Resplandor ambiental superior */}
      <div className="absolute -top-24 -left-20 w-80 h-80 rounded-full bg-indigo-600/15 blur-3xl pointer-events-none -z-0" />

      {/* 2. CABECERA EDITORIAL ESTILO SPOTIFY */}
      <div className="relative z-10 flex flex-col items-center shrink-0 pt-1 sm:pt-2">
        <span className="text-[10px] sm:text-xs uppercase font-black tracking-[0.25em] text-violet-400 bg-violet-500/10 border border-violet-500/20 px-3.5 py-1 rounded-full shadow-sm mb-2">
          TIEMPO TOTAL EN PANTALLA · {stats.anio}
        </span>

        <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-white tracking-tight leading-tight mt-1 max-w-sm">
          Tú le diste play.<br />
          <span className="text-violet-300">Aquí están tus números.</span>
        </h2>
      </div>

      {/* 3. HERO MÉTRICO: HORAS ENORMES + REALITY CHECK */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center w-full max-w-md min-h-0 px-2 my-auto">
        <div className="text-center">
          <div className="text-7xl sm:text-8xl md:text-9xl font-black tracking-tighter text-white drop-shadow-[0_15px_40px_rgba(139,92,246,0.3)] leading-none select-none">
            {stats.totalHoras}
          </div>
          <span className="text-xs sm:text-sm md:text-base font-black uppercase text-violet-300 tracking-[0.2em] block mt-1.5">
            HORAS EN PANTALLA
          </span>
          <span className="text-[11px] sm:text-xs text-zinc-400 font-mono block mt-0.5">
            ({stats.totalMinutos.toLocaleString()} minutos devorados)
          </span>
        </div>

        {/* Frase de comparación cinematográfica */}
        <p className="text-xs sm:text-sm text-zinc-300 mt-3.5 max-w-xs leading-relaxed text-center">
          En {stats.anio}, pasaste el equivalente a{' '}
          <strong className="px-2 py-0.5 rounded-lg bg-violet-600/30 text-violet-200 border border-violet-500/30 font-black inline-block shadow-sm">
            {stats.diasEquivalentes} días completos
          </strong>{' '}
          viviendo dentro del cine.
        </p>

        {/* 4. TRES TARJETAS TELEMÉTRICAS VIDRIADAS (GLASSMORPHISM) */}
        <div className="grid grid-cols-3 gap-2 sm:gap-2.5 w-full mt-4 max-w-md">
          {/* Capítulos */}
          <div className="p-2 sm:p-2.5 rounded-2xl bg-white/[0.04] backdrop-blur-md border border-white/10 flex flex-col items-center shadow-lg hover:border-cyan-500/40 transition-colors">
            <div className="w-7 h-7 rounded-xl bg-cyan-500/15 flex items-center justify-center text-cyan-400 mb-1">
              <Tv className="w-3.5 h-3.5" />
            </div>
            <span className="text-base sm:text-xl font-black text-white leading-tight">{stats.totalEpisodios}</span>
            <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-zinc-400">Capítulos</span>
          </div>

          {/* Películas */}
          <div className="p-2 sm:p-2.5 rounded-2xl bg-white/[0.04] backdrop-blur-md border border-white/10 flex flex-col items-center shadow-lg hover:border-amber-500/40 transition-colors">
            <div className="w-7 h-7 rounded-xl bg-amber-500/15 flex items-center justify-center text-amber-400 mb-1">
              <Film className="w-3.5 h-3.5" />
            </div>
            <span className="text-base sm:text-xl font-black text-white leading-tight">{stats.totalPeliculas}</span>
            <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-zinc-400">Películas</span>
          </div>

          {/* Reseñas */}
          <div className="p-2 sm:p-2.5 rounded-2xl bg-white/[0.04] backdrop-blur-md border border-white/10 flex flex-col items-center shadow-lg hover:border-pink-500/40 transition-colors">
            <div className="w-7 h-7 rounded-xl bg-pink-500/15 flex items-center justify-center text-pink-400 mb-1">
              <PenTool className="w-3.5 h-3.5" />
            </div>
            <span className="text-base sm:text-xl font-black text-white leading-tight">{stats.totalResenias}</span>
            <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-zinc-400">Reseñas</span>
          </div>
        </div>
      </div>

      {/* 5. BOTÓN CONTINUAR: ESTILIZADO PILL */}
      <div className="relative z-10 shrink-0 pb-2 sm:pb-3 pt-2">
        <button 
          onClick={onSiguiente} 
          className="px-8 sm:px-10 py-3 sm:py-3.5 rounded-full bg-white hover:bg-neutral-100 text-neutral-900 font-black text-xs sm:text-sm uppercase cursor-pointer shadow-[0_10px_30px_rgba(255,255,255,0.15)] transition-all hover:scale-105 active:scale-95 tracking-wider flex items-center justify-center gap-2"
        >
          <span>Continuar</span>
          <ArrowRight className="w-4 h-4 stroke-[2.5]" />
        </button>
      </div>
    </div>
  );
}