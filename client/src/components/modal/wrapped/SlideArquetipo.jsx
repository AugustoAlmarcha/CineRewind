import React from 'react';
import { Award } from 'lucide-react';
import { FloatingEmojis } from '../../SpotifyDecorations';
import LogoCineRewind from './LogoCineRewind';

export default function SlideArquetipo({ stats, onSiguiente }) {
  return (
    <div className="w-full h-full flex flex-col items-center justify-between text-center bg-gradient-to-br from-[#1e1b4b] via-[#4c1d95] to-[#831843] rounded-3xl p-2 sm:p-4 md:p-5 text-white shadow-2xl relative overflow-hidden select-none">
      <FloatingEmojis emojis={['🔮', '⚡', '🎩', '👑', '✨']} count={8} />
      
      {/* 1. CABECERA */}
      <div className="relative z-10 flex flex-col items-center shrink-0 pt-0.5">
        <LogoCineRewind tamano="md" />
        <span className="text-[10px] sm:text-xs font-black uppercase text-[#38bdf8] mt-1 px-3.5 py-0.5 rounded-full bg-black/60 border border-cyan-400/40">
          DIAGNÓSTICO OFICIAL {stats.anio}
        </span>
      </div>

      {/* 2. TARJETA DE ARQUETIPO */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center my-auto w-full max-w-lg min-h-0 px-2">
        <h3 className="text-xl sm:text-3xl md:text-4xl font-black uppercase tracking-tight mb-3">
          Tu Arquetipo Cinéfilo
        </h3>

        <div className="w-full p-4 sm:p-6 rounded-3xl bg-black/90 border-3 border-[#facc15] shadow-2xl text-center">
          <Award className="w-10 h-10 sm:w-12 sm:h-12 text-[#facc15] mx-auto mb-1.5" />
          <h4 className="text-xl sm:text-2xl md:text-3xl font-black uppercase text-white tracking-tight">
            "{stats.arquetipo.titulo}"
          </h4>
          <p className="text-xs sm:text-sm text-amber-200 italic mt-2 font-serif max-w-sm mx-auto">
            "{stats.arquetipo.lema}"
          </p>
        </div>
      </div>

      {/* 3. BOTÓN */}
      <div className="relative z-10 shrink-0 pb-1 sm:pb-2 pt-1">
        <button 
          onClick={onSiguiente} 
          className="px-8 sm:px-10 py-2.5 sm:py-3 rounded-2xl bg-[#facc15] hover:bg-[#eab308] text-black font-black text-xs sm:text-sm uppercase cursor-pointer shadow-xl transition-all hover:scale-105 active:scale-95"
        >
          Ver Cartelera Final VIP →
        </button>
      </div>
    </div>
  );
}