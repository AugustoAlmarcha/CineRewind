import React from 'react';
import { Tv, Film, PenTool } from 'lucide-react';
import { FloatingEmojis } from '../../SpotifyDecorations';
import LogoCineRewind from './LogoCineRewind';

export default function SlideHoras({ stats, onSiguiente }) {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center text-center bg-gradient-to-br from-[#bef264] via-[#a3e635] to-[#84cc16] rounded-3xl p-4 sm:p-8 relative overflow-hidden text-black shadow-2xl">
      <FloatingEmojis emojis={['⚡', '⏱️', '🚀', '🍿', '🎬', '💥']} count={10} />
      
      <div className="relative z-10 flex flex-col items-center max-w-lg mx-auto w-full">
        <div className="mb-2">
          <LogoCineRewind tamano="md" />
        </div>

        <span className="px-4 py-1 rounded-full bg-black text-[#bef264] text-xs font-black uppercase mb-3 shadow-md">
          TIEMPO TOTAL DEVORADO · {stats.anio}
        </span>
        
        {/* Número de Horas ULTRA GRUESO */}
        <div className="my-1 text-center">
          <div className="text-6xl sm:text-7xl lg:text-8xl font-black font-sans tracking-tight text-black drop-shadow-sm leading-none">
            {stats.totalHoras}
          </div>
          <span className="text-xl sm:text-2xl font-black uppercase text-black block mt-1 tracking-tight">
            HORAS EN PANTALLA
          </span>
        </div>

        <span className="text-sm font-bold text-zinc-900 font-mono">
          ({stats.totalMinutos.toLocaleString()} minutos devorados)
        </span>
        <p className="text-xs sm:text-sm font-semibold text-zinc-900 mt-1 max-w-sm">
          En {stats.anio}, pasaste el equivalente a <strong className="bg-black text-[#fde047] px-2 py-0.5 rounded font-black">{stats.diasEquivalentes}</strong> frente al reproductor.
        </p>

        {/* 3 Métricas: Capítulos Vistos, Películas Vistas y Reseñas Hechas */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 w-full mt-5">
          <div className="p-3.5 rounded-2xl bg-black text-white flex flex-col items-center shadow-lg border border-white/10">
            <Tv className="w-5 h-5 text-[#38bdf8] mb-1" />
            <span className="text-2xl font-black text-[#bae6fd]">{stats.totalEpisodios}</span>
            <span className="text-[10px] font-bold uppercase text-zinc-300">Capítulos Vistos</span>
          </div>
          <div className="p-3.5 rounded-2xl bg-black text-white flex flex-col items-center shadow-lg border border-white/10">
            <Film className="w-5 h-5 text-[#f97316] mb-1" />
            <span className="text-2xl font-black text-[#fed7aa]">{stats.totalPeliculas}</span>
            <span className="text-[10px] font-bold uppercase text-zinc-300">Películas Vistas</span>
          </div>
          <div className="col-span-2 sm:col-span-1 p-3.5 rounded-2xl bg-black text-white flex flex-col items-center shadow-lg border border-white/10">
            <PenTool className="w-5 h-5 text-pink-400 mb-1" />
            <span className="text-2xl font-black text-pink-300">{stats.totalResenias}</span>
            <span className="text-[10px] font-bold uppercase text-zinc-300">Reseñas Hechas</span>
          </div>
        </div>

        <button 
          onClick={onSiguiente} 
          className="mt-5 px-7 py-2.5 rounded-xl bg-black hover:bg-zinc-900 text-white font-black text-xs uppercase cursor-pointer shadow-lg transition-transform hover:scale-105"
        >
          Continuar →
        </button>
      </div>
    </div>
  );
}