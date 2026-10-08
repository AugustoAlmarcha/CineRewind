import React from 'react';
import { Play } from 'lucide-react';

export default function SlideClaqueta({ stats, onIniciar }) {
  const anioStr = String(stats?.anio || new Date().getFullYear());
  const parte1 = anioStr.slice(0, 2);
  const parte2 = anioStr.slice(2);

  return (
    <div className="w-full h-full flex flex-col items-center justify-between text-center bg-gradient-to-b from-[#cf276a] via-[#8e104e] to-[#43042c] rounded-3xl p-4 sm:p-6 relative overflow-hidden text-white shadow-2xl select-none">
      <style>{`
        @keyframes organicPulse {
          0%, 100% {
            transform: scale(1) translate(0px, 0px);
            opacity: 0.85;
          }
          50% {
            transform: scale(1.08) translate(-6px, -8px);
            opacity: 1;
          }
        }
        @keyframes organicPulseReverse {
          0%, 100% {
            transform: scale(1) translate(0px, 0px);
            opacity: 0.8;
          }
          50% {
            transform: scale(1.12) translate(8px, 6px);
            opacity: 0.95;
          }
        }
        @keyframes subtleGlow {
          0%, 100% {
            opacity: 0.45;
            transform: scale(0.95);
          }
          50% {
            opacity: 0.75;
            transform: scale(1.05);
          }
        }
      `}</style>

      {/* 1. CAPAS DE CÍRCULOS Y ONDAS ORGÁNICAS ESTILO DEEZER */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        {/* Resplandor central profundo */}
        <div 
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[340px] sm:w-[460px] h-[340px] sm:h-[460px] rounded-full bg-rose-500/30 blur-3xl"
          style={{ animation: 'subtleGlow 6s ease-in-out infinite' }}
        />

        {/* Círculo orgánico superior derecho */}
        <div 
          className="absolute -top-16 -right-16 w-80 sm:w-96 h-80 sm:h-96 rounded-full bg-gradient-to-br from-[#f43f5e]/80 via-[#db2777]/60 to-transparent blur-xl"
          style={{ animation: 'organicPulse 7s ease-in-out infinite' }}
        />

        {/* Círculo orgánico inferior izquierdo */}
        <div 
          className="absolute -bottom-20 -left-16 w-96 sm:w-[420px] h-96 sm:h-[420px] rounded-full bg-gradient-to-tr from-[#be123c]/90 via-[#9d174d]/70 to-transparent blur-xl"
          style={{ animation: 'organicPulseReverse 8s ease-in-out infinite' }}
        />

        {/* Curvas concéntricas de pétalos SVG tipo Deezer */}
        <svg 
          viewBox="0 0 400 700" 
          className="absolute inset-0 w-full h-full opacity-65 mix-blend-screen"
          preserveAspectRatio="xMidYMid slice"
        >
          {/* Cúpula curva superior */}
          <ellipse 
            cx="200" 
            cy="160" 
            rx="240" 
            ry="180" 
            fill="url(#gradientePetaloSuperior)"
            style={{ 
              animation: 'organicPulse 6.5s ease-in-out infinite',
              transformOrigin: '200px 160px'
            }}
          />

          {/* Cintura / Onda media */}
          <ellipse 
            cx="200" 
            cy="360" 
            rx="270" 
            ry="160" 
            fill="url(#gradientePetaloMedio)"
            style={{ 
              animation: 'organicPulseReverse 7.5s ease-in-out infinite',
              transformOrigin: '200px 360px'
            }}
          />

          {/* Arco inferior */}
          <ellipse 
            cx="200" 
            cy="540" 
            rx="250" 
            ry="200" 
            fill="url(#gradientePetaloInferior)"
            style={{ 
              animation: 'organicPulse 8s ease-in-out infinite',
              transformOrigin: '200px 540px'
            }}
          />

          <defs>
            <radialGradient id="gradientePetaloSuperior" cx="50%" cy="30%" r="60%">
              <stop offset="0%" stopColor="#fb7185" stopOpacity="0.75" />
              <stop offset="60%" stopColor="#e11d48" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#9f1239" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="gradientePetaloMedio" cx="50%" cy="50%" r="70%">
              <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.6" />
              <stop offset="50%" stopColor="#be123c" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#4c0519" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="gradientePetaloInferior" cx="50%" cy="60%" r="65%">
              <stop offset="0%" stopColor="#fda4af" stopOpacity="0.7" />
              <stop offset="55%" stopColor="#db2777" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#831843" stopOpacity="0" />
            </radialGradient>
          </defs>
        </svg>

        {/* Textura sutil de ruido / grano cinematográfico */}
        <div 
          className="absolute inset-0 opacity-[0.06] mix-blend-overlay"
          style={{
            backgroundImage: `radial-gradient(rgba(255,255,255,0.7) 1px, transparent 1px)`,
            backgroundSize: '8px 8px'
          }}
        />
      </div>

      {/* 2. CABECERA: BRANDING EDITORIAL ESTILO DEEZER (#MydeezerYear) */}
      <div className="relative z-10 flex flex-col items-center shrink-0 pt-2 sm:pt-4">
        <span className="text-base sm:text-lg font-black tracking-tight text-white drop-shadow-md">
          #MiCineRewindAño
        </span>
      </div>

      {/* 3. HERO: TIPOGRAFÍA MONUMENTAL APILADA (20 / 26) */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center my-auto w-full select-none py-4">
        <div className="flex flex-col items-center leading-[0.80] font-black text-white tracking-tighter drop-shadow-[0_15px_45px_rgba(0,0,0,0.5)]">
          <span className="text-[32vw] sm:text-[155px] md:text-[185px] font-black tracking-tight select-none">
            {parte1}
          </span>
          <span className="text-[32vw] sm:text-[155px] md:text-[185px] font-black tracking-tight select-none">
            {parte2}
          </span>
        </div>

        {/* Sutil bajada de línea editorial */}
        <p className="mt-4 sm:mt-5 text-[10px] sm:text-xs font-bold uppercase tracking-[0.28em] text-rose-100/95 text-center drop-shadow-sm max-w-[260px] leading-relaxed">
          La historia de tu año en pantalla
        </p>
      </div>

      {/* 4. BOTÓN DE INICIO: PILL BLANCO ELEGANTE CON PLAY */}
      <div className="relative z-20 shrink-0 pb-3 sm:pb-6 pt-2">
        <button
          type="button"
          onClick={onIniciar}
          className="group px-8 sm:px-11 py-3.5 sm:py-4 rounded-full font-black text-xs sm:text-sm text-neutral-900 bg-white hover:bg-neutral-100 shadow-[0_12px_35px_rgba(0,0,0,0.4)] hover:shadow-[0_18px_50px_rgba(0,0,0,0.55)] flex items-center justify-center gap-2.5 cursor-pointer transition-all duration-300 hover:scale-105 active:scale-95 uppercase tracking-wider border border-white/60"
        >
          <Play className="w-4 h-4 fill-neutral-900 text-neutral-900 transition-transform group-hover:scale-110" />
          <span>¡Comienza ahora!</span>
        </button>
      </div>
    </div>
  );
}