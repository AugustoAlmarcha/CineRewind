import React from 'react';
import { Film, ArrowRight, Clapperboard } from 'lucide-react';

export default function SlideTeaserPeliculas({ stats, onSiguiente }) {
  const totalPelis = stats?.totalPeliculas || (stats?.peliculasVistas?.length || 0);
  const cantTexto = totalPelis >= 5 ? '5 películas' : totalPelis > 1 ? `${totalPelis} películas` : 'una película';

  return (
    <div className="w-full h-full flex flex-col items-center justify-between text-center bg-gradient-to-b from-[#140b07] via-[#090503] to-[#040201] rounded-3xl p-5 sm:p-8 relative overflow-hidden text-white shadow-2xl select-none">
      <style>{`
        @keyframes cinemaBeam {
          0%, 100% {
            opacity: 0.2;
            transform: scale(0.95);
          }
          50% {
            opacity: 0.55;
            transform: scale(1.08);
          }
        }
        @keyframes pulseTrackPeli {
          0%, 100% {
            opacity: 0.4;
          }
          50% {
            opacity: 0.9;
          }
        }
      `}</style>

      {/* 1. LUZ CÁLIDA DE CINE EN EL FONDO */}
      <div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[380px] sm:w-[500px] h-[380px] sm:h-[500px] rounded-full bg-gradient-to-b from-orange-500/15 via-rose-500/10 to-transparent blur-[110px] pointer-events-none -z-0"
        style={{ animation: 'cinemaBeam 7s ease-in-out infinite' }}
      />

      {/* 2. CABECERA EDITORIAL */}
      <div className="relative z-10 flex flex-col items-center shrink-0 pt-2 sm:pt-4">
        <span className="text-base sm:text-lg font-black tracking-tight text-white drop-shadow-md mb-2">
          #MiCineRewindAño
        </span>
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-orange-500/10 border border-orange-500/25 text-[10px] sm:text-xs font-mono font-bold text-orange-300">
          <Clapperboard className="w-3.5 h-3.5 text-orange-400" />
          <span>LARGOMETRAJES & CINE</span>
        </div>
      </div>

      {/* 3. HERO: TIPOGRAFÍA MONUMENTAL CENTRADA */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center w-full max-w-sm sm:max-w-md min-h-0 px-3 my-auto">
        <div className="space-y-3 sm:space-y-4">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight uppercase leading-[1.1] font-sans">
            Y en la<br />
            pantalla grande...<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-300 via-amber-300 to-rose-300">
              las {cantTexto}
            </span><br />
            que marcaron tu año.
          </h2>

          <p className="text-xs sm:text-sm text-zinc-400 max-w-xs mx-auto leading-relaxed pt-1">
            Dos horas de pantalla, palomitas y emociones que no se olvidan.
          </p>

          {/* CINTA DE CONTEO REGRESIVO ESTILIZADA */}
          <div className="flex items-center justify-center gap-2 pt-3 opacity-80" style={{ animation: 'pulseTrackPeli 3s ease-in-out infinite' }}>
            <span className="text-[11px] font-mono px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-zinc-400">05</span>
            <span className="text-[11px] font-mono px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-zinc-400">04</span>
            <span className="text-[11px] font-mono px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-zinc-400">03</span>
            <span className="text-[11px] font-mono px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-zinc-400">02</span>
            <span className="text-[11px] font-mono px-2.5 py-1 rounded-lg bg-orange-400/20 border border-orange-400/40 text-orange-300 font-bold">01 🎬</span>
          </div>
        </div>
      </div>

      {/* 4. BOTÓN DE ACCIÓN */}
      <div className="relative z-10 shrink-0 pb-2 sm:pb-3 pt-1">
        <button 
          onClick={onSiguiente} 
          className="group inline-flex items-center gap-2 px-8 sm:px-10 py-3 sm:py-3.5 rounded-full bg-white hover:bg-zinc-100 text-black font-black text-xs sm:text-sm uppercase tracking-wide cursor-pointer shadow-[0_10px_30px_rgba(255,255,255,0.2)] transition-all hover:scale-105 active:scale-95"
        >
          <span>Descubrir el Top de Películas</span>
          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
        </button>
      </div>
    </div>
  );
}
