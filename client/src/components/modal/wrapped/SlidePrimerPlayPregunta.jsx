import React from 'react';
import { Sparkles, Film, ArrowRight, Play } from 'lucide-react';

export default function SlidePrimerPlayPregunta({ stats, onSiguiente }) {
  const anio = stats?.anio || new Date().getFullYear();

  return (
    <div className="w-full h-full flex flex-col items-center justify-between text-center bg-gradient-to-b from-[#0e0c1f] via-[#070611] to-[#030308] rounded-3xl p-5 sm:p-8 relative overflow-hidden text-white shadow-2xl select-none">
      <style>{`
        @keyframes projectorBeam {
          0%, 100% {
            opacity: 0.25;
            transform: scale(0.96) rotate(-2deg);
          }
          50% {
            opacity: 0.65;
            transform: scale(1.06) rotate(2deg);
          }
        }
        @keyframes reelSpin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes floatPlayIcon {
          0%, 100% {
            transform: translateY(0px) scale(1);
          }
          50% {
            transform: translateY(-8px) scale(1.05);
          }
        }
      `}</style>

      {/* 1. LUZ DE PROYECTOR Y RESPLANDOR AMBIENTAL */}
      <div 
        className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[340px] sm:w-[500px] h-[340px] sm:h-[500px] rounded-full bg-gradient-to-b from-amber-500/20 via-orange-500/10 to-transparent blur-[100px] pointer-events-none -z-0"
        style={{ animation: 'projectorBeam 7s ease-in-out infinite' }}
      />

      {/* 2. CABECERA: BRANDING EDITORIAL (#MiCineRewindAño) */}
      <div className="relative z-10 flex flex-col items-center shrink-0 pt-2 sm:pt-4">
        <span className="text-base sm:text-lg font-black tracking-tight text-white drop-shadow-md mb-2">
          #MiCineRewindAño
        </span>
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-amber-400/10 border border-amber-400/25 text-[10px] sm:text-xs font-mono font-bold text-amber-300">
          <Film className="w-3.5 h-3.5 text-amber-400" />
          <span>FOTOGRAMA 01 · EL COMIENZO</span>
        </div>
      </div>

      {/* 3. HERO: ANIMACIÓN Y PREGUNTA MONUMENTAL */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center w-full max-w-sm sm:max-w-md min-h-0 px-3 my-auto">
        {/* ÍCONO CINÉTICO DE PLAY / BOBINA */}
        <div 
          className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-gradient-to-tr from-amber-500 to-orange-400 p-0.5 shadow-[0_15px_40px_rgba(245,158,11,0.4)] mb-6 flex items-center justify-center"
          style={{ animation: 'floatPlayIcon 5s ease-in-out infinite' }}
        >
          <div className="w-full h-full rounded-[22px] bg-black/80 backdrop-blur-md flex items-center justify-center border border-white/20">
            <Play className="w-9 h-9 sm:w-11 sm:h-11 text-amber-400 fill-amber-400 ml-1" />
          </div>
        </div>

        {/* TEXTO MONUMENTAL */}
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight leading-[1.1] uppercase font-sans">
          ¿Recuerdas cómo<br />
          arrancó tu{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-orange-300 to-rose-300">
            {anio}?
          </span>
        </h2>

        <p className="text-xs sm:text-sm text-zinc-300 mt-4 max-w-xs leading-relaxed">
          Antes de las maratones de fin de semana y los días enteros viviendo en el cine... hubo una primera historia.
        </p>
      </div>

      {/* 4. BOTÓN DE ACCIÓN */}
      <div className="relative z-10 shrink-0 pb-2 sm:pb-3 pt-1">
        <button 
          onClick={onSiguiente} 
          className="group inline-flex items-center gap-2 px-8 sm:px-10 py-3 sm:py-3.5 rounded-full bg-gradient-to-r from-amber-400 via-orange-400 to-rose-400 hover:from-amber-300 hover:to-rose-300 text-black font-black text-xs sm:text-sm uppercase tracking-wide cursor-pointer shadow-[0_10px_30px_rgba(245,158,11,0.4)] transition-all hover:scale-105 active:scale-95"
        >
          <span>Descubrir el primer título</span>
          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
        </button>
      </div>
    </div>
  );
}
