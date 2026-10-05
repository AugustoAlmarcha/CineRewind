import React from 'react';
import { Calendar, Monitor } from 'lucide-react';
import { FloatingEmojis } from '../../SpotifyDecorations';
import LogoCineRewind from './LogoCineRewind';

export default function SlideHabitos({ stats, onSiguiente }) {
  return (
    <div className="w-full h-full flex flex-col items-center justify-between text-center bg-gradient-to-br from-[#6d28d9] via-[#5b21b6] to-[#3b0764] rounded-3xl p-2 sm:p-4 md:p-5 text-white shadow-2xl relative overflow-hidden select-none">
      <FloatingEmojis emojis={['🗓️', '🦉', '🕯️', '🍿', '✨']} count={8} />
      
      {/* 1. CABECERA */}
      <div className="relative z-10 flex flex-col items-center shrink-0 pt-0.5">
        <LogoCineRewind tamano="md" />
        <span className="px-3.5 py-0.5 rounded-full bg-[#fde047] text-black text-[10px] sm:text-xs font-black uppercase mt-1 shadow-lg">
          RITUALES & SESIONES · {stats.anio}
        </span>
      </div>

      {/* 2. CONTENIDO PRINCIPAL */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center my-auto w-full max-w-lg min-h-0 px-2">
        <h3 className="text-xl sm:text-2xl md:text-3xl font-black uppercase mb-3 tracking-tight">
          Tus Hábitos Cinéfilos
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3.5 w-full text-left">
          <div className="p-3 sm:p-4 rounded-2xl bg-black/85 border-2 border-[#facc15] shadow-xl">
            <div className="flex items-center gap-1.5 text-xs text-amber-300 font-bold mb-1">
              <Calendar className="w-4 h-4" />
              <span>DÍA SAGRADO</span>
            </div>
            <strong className="text-2xl sm:text-3xl font-black text-white block">{stats.diaSagrado}</strong>
            <p className="text-[11px] sm:text-xs text-zinc-300 mt-1">El día que más reproducciones tuviste en tu historial real.</p>
          </div>
          
          <div className="p-3 sm:p-4 rounded-2xl bg-black/85 border-2 border-cyan-400 shadow-xl">
            <div className="flex items-center gap-1.5 text-xs text-cyan-300 font-bold mb-1">
              <Monitor className="w-4 h-4" />
              <span>PANTALLA HOGAR</span>
            </div>
            <strong className="text-2xl sm:text-3xl font-black text-white block truncate">{stats.plataforma}</strong>
            <p className="text-[11px] sm:text-xs text-zinc-300 mt-1">Tu santuario preferido para cada maratón.</p>
          </div>
        </div>
      </div>

      {/* 3. BOTÓN */}
      <div className="relative z-10 shrink-0 pb-1 sm:pb-2 pt-1">
        <button 
          onClick={onSiguiente} 
          className="px-8 sm:px-10 py-2.5 sm:py-3 rounded-2xl bg-[#fde047] hover:bg-[#eab308] text-black font-black text-xs sm:text-sm uppercase cursor-pointer shadow-xl transition-all hover:scale-105 active:scale-95"
        >
          Ver Arquetipo →
        </button>
      </div>
    </div>
  );
}
