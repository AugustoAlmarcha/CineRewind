import React from 'react';
import { Play } from 'lucide-react';
import { FloatingEmojis, PolkaDotsOverlay } from '../../SpotifyDecorations';
import LogoCineRewind from './LogoCineRewind';

export default function SlideClaqueta({ stats, claquetaGolpeada, onGolpearClaqueta, onIniciar }) {
  return (
    <div className="w-full h-full flex flex-col items-center justify-between text-center bg-gradient-to-br from-[#4c1d95] via-[#3b0764] to-[#1e1035] rounded-3xl p-3 sm:p-4 md:p-5 relative overflow-hidden text-white shadow-2xl select-none">
      <PolkaDotsOverlay color="#facc15" opacity={0.16} />
      <FloatingEmojis emojis={['🍿', '🎬', '🎟️', '⚡', '✨', '🏆', '🔥']} count={10} />
      
      {/* 1. CABECERA: LOGO + GALA + TEXTO "DEJÉMONOS DE TANTO..." ESTRICTAMENTE ARRIBA */}
      <div className="relative z-30 flex flex-col items-center shrink-0 pt-1 pb-1">
        <LogoCineRewind tamano="md" className="hover:scale-105 transition-transform" />
        <span className="text-[10px] sm:text-xs uppercase font-black tracking-widest px-3.5 py-0.5 rounded-full bg-[#facc15] text-black shadow-md mt-1 mb-1 border border-yellow-200">
          CINEREWIND GALA · {stats.anio}
        </span>

        {/* FRASES JUSTO DEBAJO DE CINE REWIND (NUNCA DETRÁS DE LA CLAQUETA) */}
        <div className="text-center px-2 mt-0.5">
          <h2 className="text-lg sm:text-2xl md:text-3xl font-black uppercase text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.95)] tracking-tight leading-tight">
            Dejémonos de tanto {stats.anio}.
          </h2>
          <p className="text-xs sm:text-sm md:text-base font-black text-[#facc15] drop-shadow-[0_2px_8px_rgba(0,0,0,0.95)] mt-0.5">
            ¡Hablemos de tus títulos reales!
          </p>
        </div>
      </div>

      {/* 2. CÍRCULO GIRATORIO GIGANTE EN EL FONDO + CLAQUETA AL CENTRO */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center my-auto w-full max-w-lg min-h-0 py-1">
        <div className="relative flex flex-col items-center justify-center w-full">
          <style>{`
            @keyframes spinStarburst {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
          `}</style>
          
          {/* CÍRCULO CON PUNTAS (STARBURST) GIGANTE DETRÁS DE LA CLAQUETA */}
          <svg
            viewBox="0 0 200 200"
            className="w-80 h-80 sm:w-[420px] sm:h-[420px] md:w-[480px] md:h-[480px] filter drop-shadow-[0_0_50px_rgba(249,115,22,0.6)] pointer-events-none absolute -z-10"
            style={{ animation: 'spinStarburst 50s linear infinite' }}
          >
            <polygon
              points="
                100,0 120,40 160,25 155,70 195,80 170,120 195,160 150,165 
                140,205 100,180 60,205 50,165 5,160 30,120 5,80 45,70 
                40,25 80,40
              "
              fill="#f97316"
            />
          </svg>

          {/* CLAQUETA AL CENTRO */}
          <div 
            onClick={onGolpearClaqueta} 
            className="cursor-pointer transform hover:scale-103 active:scale-98 transition-all select-none z-20"
            title="¡Toca para accionar la claqueta!"
          >
            {/* Brazo móvil de la claqueta */}
            <div 
              className="w-52 sm:w-64 md:w-72 h-5.5 sm:h-7 bg-zinc-950 rounded-t-lg border-2 border-white flex items-center overflow-hidden transition-transform duration-300 origin-bottom-left shadow-xl"
              style={{ transform: claquetaGolpeada ? 'rotate(0deg)' : 'rotate(-16deg)' }}
            >
              <div className="flex w-full h-full">
                {Array.from({ length: 9 }).map((_, i) => (
                  <div key={i} className={`flex-1 h-full skew-x-[-30deg] ${i % 2 === 0 ? 'bg-[#fbbf24]' : 'bg-black'}`} />
                ))}
              </div>
            </div>

            {/* Tablero de la claqueta */}
            <div className="w-52 sm:w-64 md:w-72 bg-black border-2 border-white rounded-b-2xl p-2 sm:p-2.5 flex flex-col justify-between text-left shadow-2xl relative">
              <div className="flex justify-between items-center text-[8px] sm:text-[9.5px] font-mono text-[#facc15] font-black border-b border-zinc-800 pb-1">
                <span className="tracking-wider">CINEREWIND PRODUCCIÓN</span>
                <span className="bg-[#facc15] text-black px-1.5 py-0.2 rounded font-black">TAKE 01</span>
              </div>

              <div className="my-1 space-y-0.5">
                <p className="text-base sm:text-xl font-black text-white uppercase tracking-tight leading-none">
                  {stats.totalObras} OBRAS VISTAS
                </p>
                <div className="flex flex-wrap items-center gap-1.5 text-[9px] sm:text-[10.5px] font-mono text-zinc-200 pt-0.5">
                  <span className="text-amber-400 font-extrabold">{stats.totalHoras}h</span>
                  <span className="text-zinc-600">•</span>
                  <span className="text-cyan-300 font-bold">{stats.totalPeliculas} Pelis</span>
                  <span className="text-zinc-600">•</span>
                  <span className="text-emerald-300 font-bold">{stats.totalEpisodios} Caps</span>
                </div>
              </div>

              <div className="text-[7.5px] sm:text-[9px] font-mono text-zinc-400 border-t border-zinc-800 pt-1 flex justify-between items-center">
                <span className="truncate max-w-[130px] sm:max-w-[160px]">CINÉFILO: {stats.usuario.nombre}</span>
                <span className="text-emerald-400 font-black">● LISTO</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. BOTÓN DE INICIO VISIBLE SIEMPRE */}
      <div className="relative z-30 shrink-0 pb-1 sm:pb-2 pt-1">
        <button
          onClick={onIniciar}
          className="px-8 sm:px-10 py-2.5 sm:py-3 rounded-2xl font-black text-xs sm:text-sm text-black bg-[#bef264] hover:bg-[#a3e635] shadow-xl border-2 border-black flex items-center justify-center gap-2 cursor-pointer transition-all hover:scale-105 active:scale-95 uppercase tracking-wider"
        >
          <Play className="w-4 h-4 fill-current" />
          <span>INICIAR PROYECCIÓN</span>
        </button>
      </div>
    </div>
  );
}