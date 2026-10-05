import React from 'react';
import { Tv, Film, PenTool } from 'lucide-react';
import { FloatingEmojis } from '../../SpotifyDecorations';
import LogoCineRewind from './LogoCineRewind';

export default function SlideHoras({ stats, onSiguiente }) {
  return (
    <div className="w-full h-full flex flex-col items-center justify-between text-center bg-gradient-to-br from-[#bef264] via-[#a3e635] to-[#84cc16] rounded-3xl p-2 sm:p-4 md:p-5 relative overflow-hidden text-black shadow-2xl select-none">
      <FloatingEmojis emojis={['⚡', '⏱️', '🚀', '🍿', '🎬', '💥']} count={8} />
      
      {/* 1. CABECERA Y PRIMERA FRASE JUNTAS MÁS ARRIBA */}
      <div className="relative z-10 flex flex-col items-center shrink-0 pt-1 sm:pt-2 space-y-1">
        <LogoCineRewind tamano="lg" className="hover:scale-105 transition-transform" />
        <span className="px-4 py-1 rounded-full bg-black text-[#bef264] text-xs sm:text-sm font-black uppercase shadow-lg border border-black/30 tracking-wider">
          TIEMPO TOTAL DEVORADO · {stats.anio}
        </span>
      </div>

      {/* 2. NÚCLEO DE HORAS Y FRASES DESTACADAS */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center w-full max-w-lg min-h-0 px-2 my-auto">
        <div className="text-center">
          <div className="text-7xl sm:text-8xl md:text-9xl font-black font-mono tracking-tighter text-black drop-shadow-sm leading-none">
            {stats.totalHoras}
          </div>
          <span className="text-xl sm:text-2xl md:text-3xl font-black uppercase text-black block mt-1 tracking-tight">
            HORAS EN PANTALLA
          </span>
          <span className="text-xs sm:text-sm font-black text-black/85 font-mono block mt-0.5">
            ({stats.totalMinutos.toLocaleString()} minutos devorados)
          </span>
        </div>

        <p className="text-xs sm:text-sm md:text-base font-black text-black mt-2 max-w-sm leading-snug">
          En {stats.anio}, pasaste el equivalente a{' '}
          <strong className="bg-black text-[#fde047] px-2.5 py-0.5 rounded-lg font-black inline-block shadow">
            {stats.diasEquivalentes}
          </strong>{' '}
          frente al reproductor.
        </p>

        {/* 3 TARJETAS COMPACTAS Y GRUESAS */}
        <div className="grid grid-cols-3 gap-2 w-full mt-3 max-w-md">
          <div className="p-2 sm:p-2.5 rounded-xl bg-black text-white flex flex-col items-center shadow-md border border-white/10">
            <Tv className="w-4 h-4 sm:w-5 sm:h-5 text-[#38bdf8] mb-0.5" />
            <span className="text-xl sm:text-2xl font-black text-[#bae6fd] leading-tight">{stats.totalEpisodios}</span>
            <span className="text-[9px] sm:text-[10px] font-black uppercase text-zinc-300">Capítulos</span>
          </div>
          <div className="p-2 sm:p-2.5 rounded-xl bg-black text-white flex flex-col items-center shadow-md border border-white/10">
            <Film className="w-4 h-4 sm:w-5 sm:h-5 text-[#f97316] mb-0.5" />
            <span className="text-xl sm:text-2xl font-black text-[#fed7aa] leading-tight">{stats.totalPeliculas}</span>
            <span className="text-[9px] sm:text-[10px] font-black uppercase text-zinc-300">Películas</span>
          </div>
          <div className="p-2 sm:p-2.5 rounded-xl bg-black text-white flex flex-col items-center shadow-md border border-white/10">
            <PenTool className="w-4 h-4 sm:w-5 sm:h-5 text-pink-400 mb-0.5" />
            <span className="text-xl sm:text-2xl font-black text-pink-300 leading-tight">{stats.totalResenias}</span>
            <span className="text-[9px] sm:text-[10px] font-black uppercase text-zinc-300">Reseñas</span>
          </div>
        </div>
      </div>

      {/* 3. BOTÓN CONTINUAR */}
      <div className="relative z-10 shrink-0 pb-1 sm:pb-2 pt-1">
        <button 
          onClick={onSiguiente} 
          className="px-8 sm:px-10 py-2.5 sm:py-3 rounded-2xl bg-black hover:bg-zinc-900 text-white font-black text-xs sm:text-sm uppercase cursor-pointer shadow-xl transition-all hover:scale-105 active:scale-95 tracking-wider"
        >
          Continuar →
        </button>
      </div>
    </div>
  );
}