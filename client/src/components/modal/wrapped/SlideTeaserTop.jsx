import React from 'react';
import { ArrowRight, Flame } from 'lucide-react';

export default function SlideTeaserTop({ stats, onSiguiente }) {
  const totalSeries = stats?.totalSeries || (stats?.seriesVistas?.length || 0);
  const cantTexto = totalSeries >= 5 ? '5 historias' : totalSeries > 1 ? `${totalSeries} historias` : 'una historia';

  return (
    <div className="w-full h-full flex flex-col items-center justify-between text-center bg-gradient-to-b from-[#09090e] via-[#050508] to-[#020204] rounded-3xl p-4 sm:p-6 relative overflow-hidden text-white shadow-2xl select-none">
      <style>{`
        @keyframes subtleBeam {
          0%, 100% {
            opacity: 0.15;
            transform: scale(0.95);
          }
          50% {
            opacity: 0.35;
            transform: scale(1.08);
          }
        }
        @keyframes pulseTrack {
          0%, 100% {
            opacity: 0.4;
          }
          50% {
            opacity: 0.9;
          }
        }
      `}</style>

      {/* 1. LUZ DE PROYECTOR MINIMALISTA EN EL FONDO */}
      <div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[380px] sm:w-[500px] h-[380px] sm:h-[500px] rounded-full bg-gradient-to-b from-cyan-500/10 via-violet-500/10 to-transparent blur-[110px] pointer-events-none -z-0"
        style={{ animation: 'subtleBeam 7s ease-in-out infinite' }}
      />

      {/* 2. CABECERA EDITORIAL ESTILO DEEZER */}
      <div className="relative z-10 flex flex-col items-center shrink-0 pt-2 sm:pt-4">
        <span className="text-base sm:text-lg font-black tracking-tight text-white drop-shadow-md">
          #MiCineRewindAño
        </span>
      </div>

      {/* 3. HERO: TIPOGRAFÍA MONUMENTAL CENTRADA (INSPIRADA EN DEEZER YEAR) */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center w-full max-w-sm sm:max-w-md min-h-0 px-3 my-auto">
        <div className="space-y-3 sm:space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] sm:text-xs font-mono font-bold text-cyan-300">
            <Flame className="w-3.5 h-3.5 text-cyan-400" />
            <span>TUS GRANDES MARATONES</span>
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight uppercase leading-[1.1] font-sans">
            Pero hubo {cantTexto}<br />
            que realmente<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-sky-300 to-indigo-300">
              marcaron tu camino
            </span><br />
            este año.
          </h2>

          <p className="text-xs sm:text-sm text-zinc-400 max-w-xs mx-auto leading-relaxed pt-2">
            De esas tramas que no te dejaron soltar el sillón ni apagar la pantalla a medianoche.
          </p>

          {/* CINTA DE CONTEO REGRESIVO ESTILIZADA */}
          <div className="flex items-center justify-center gap-2 pt-4 opacity-75" style={{ animation: 'pulseTrack 3s ease-in-out infinite' }}>
            <span className="text-[11px] font-mono px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-zinc-400">05</span>
            <span className="text-[11px] font-mono px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-zinc-400">04</span>
            <span className="text-[11px] font-mono px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-zinc-400">03</span>
            <span className="text-[11px] font-mono px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-zinc-400">02</span>
            <span className="text-[11px] font-mono px-2.5 py-1 rounded-lg bg-cyan-400/20 border border-cyan-400/40 text-cyan-300 font-bold">01 👑</span>
          </div>
        </div>
      </div>

      {/* 4. BOTÓN DE ACCIÓN */}
      <div className="relative z-10 shrink-0 pb-1 sm:pb-2 pt-1">
        <button 
          onClick={onSiguiente} 
          className="group inline-flex items-center gap-2 px-8 sm:px-10 py-2.5 sm:py-3 rounded-full bg-white hover:bg-zinc-100 text-black font-black text-xs sm:text-sm uppercase tracking-wide cursor-pointer shadow-[0_10px_30px_rgba(255,255,255,0.2)] transition-all hover:scale-105 active:scale-95"
        >
          <span>Descubrir el Top</span>
          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
        </button>
      </div>
    </div>
  );
}
