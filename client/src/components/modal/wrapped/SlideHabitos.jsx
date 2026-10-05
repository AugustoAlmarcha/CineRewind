import React from 'react';
import { Calendar, Monitor } from 'lucide-react';
import { FloatingEmojis } from '../../SpotifyDecorations';
import LogoCineRewind from './LogoCineRewind';

export default function SlideHabitos({ stats, onSiguiente }) {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center text-center bg-gradient-to-br from-[#6d28d9] via-[#5b21b6] to-[#3b0764] rounded-3xl p-4 sm:p-8 text-white shadow-2xl">
      <FloatingEmojis emojis={['🗓️', '🦉', '🕯️', '🍿', '✨']} count={10} />
      
      <div className="relative z-10 flex flex-col items-center max-w-lg mx-auto w-full">
        <div className="mb-2">
          <LogoCineRewind tamano="md" />
        </div>

        <span className="px-4 py-1.5 rounded-full bg-[#fde047] text-black text-xs font-black uppercase mb-2 shadow-lg">
          RITUALES & SESIONES · {stats.anio}
        </span>
        <h3 className="text-2xl sm:text-3xl font-black uppercase mb-4 tracking-tight">
          Tus Hábitos Cinéfilos
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 w-full text-left">
          <div className="p-4 rounded-2xl bg-black/85 border-2 border-[#facc15] shadow-xl">
            <div className="flex items-center gap-1.5 text-xs text-amber-300 font-bold mb-1">
              <Calendar className="w-4 h-4" />
              <span>DÍA SAGRADO</span>
            </div>
            <strong className="text-xl font-black text-white">{stats.diaSagrado}</strong>
            <p className="text-xs text-zinc-300 mt-1">El día que más reproducciones tuviste en tu historial.</p>
          </div>
          <div className="p-4 rounded-2xl bg-black/85 border-2 border-cyan-400 shadow-xl">
            <div className="flex items-center gap-1.5 text-xs text-cyan-300 font-bold mb-1">
              <Monitor className="w-4 h-4" />
              <span>PANTALLA HOGAR</span>
            </div>
            <strong className="text-xl font-black text-white">{stats.plataforma}</strong>
            <p className="text-xs text-zinc-300 mt-1">Tu santuario preferido para cada maratón.</p>
          </div>
        </div>

        <button 
          onClick={onSiguiente} 
          className="mt-5 px-6 py-2.5 rounded-xl bg-[#fde047] hover:bg-[#eab308] text-black font-black text-xs uppercase cursor-pointer shadow-lg transition-transform hover:scale-105"
        >
          Ver Arquetipo →
        </button>
      </div>
    </div>
  );
}