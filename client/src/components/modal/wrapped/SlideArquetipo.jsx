import React from 'react';
import { Award } from 'lucide-react';
import { FloatingEmojis } from '../../SpotifyDecorations';
import LogoCineRewind from './LogoCineRewind';

export default function SlideArquetipo({ stats, onSiguiente }) {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center text-center bg-gradient-to-br from-[#1e1b4b] via-[#4c1d95] to-[#831843] rounded-3xl p-4 sm:p-8 text-white shadow-2xl">
      <FloatingEmojis emojis={['🔮', '⚡', '🎩', '👑', '✨']} count={10} />
      
      <div className="relative z-10 flex flex-col items-center max-w-lg mx-auto w-full">
        <div className="mb-2">
          <LogoCineRewind tamano="md" />
        </div>

        <span className="text-xs font-black uppercase text-[#38bdf8] mb-2 px-3.5 py-1 rounded-full bg-black/60 border border-cyan-400/40">
          DIAGNÓSTICO OFICIAL {stats.anio}
        </span>
        <h3 className="text-2xl sm:text-4xl font-black uppercase tracking-tight mb-4">
          Tu Arquetipo Cinéfilo
        </h3>

        <div className="w-full p-6 sm:p-7 rounded-3xl bg-black/90 border-3 border-[#facc15] shadow-2xl text-center">
          <Award className="w-12 h-12 text-[#facc15] mx-auto mb-2" />
          <h4 className="text-2xl sm:text-3xl font-black uppercase text-white tracking-tight">
            "{stats.arquetipo.titulo}"
          </h4>
          <p className="text-xs sm:text-sm text-amber-200 italic mt-2 font-serif">
            "{stats.arquetipo.lema}"
          </p>
        </div>

        <button 
          onClick={onSiguiente} 
          className="mt-5 px-6 py-2.5 rounded-xl bg-[#facc15] hover:bg-[#eab308] text-black font-black text-xs uppercase cursor-pointer shadow-lg transition-transform hover:scale-105"
        >
          Ver Cartelera Final VIP →
        </button>
      </div>
    </div>
  );
}