import React from 'react';
import { Flame } from 'lucide-react';
import { FloatingEmojis } from '../../SpotifyDecorations';
import LogoCineRewind from './LogoCineRewind';

export default function SlideTopSerie({ stats, obtenerUrlImagenSegura, onSiguiente }) {
  return (
    <div className="w-full h-full flex flex-col items-center justify-between text-center bg-gradient-to-br from-[#065f46] via-[#059669] to-[#022c22] rounded-3xl p-2 sm:p-4 md:p-5 relative overflow-hidden text-white shadow-2xl select-none">
      <FloatingEmojis emojis={['📺', '🛋️', '🍕', '🌙', '🔥']} count={8} />
      
      {/* 1. CABECERA */}
      <div className="relative z-10 flex flex-col items-center shrink-0 pt-0.5">
        <LogoCineRewind tamano="md" />
        <span className="px-3.5 py-0.5 rounded-full bg-[#facc15] text-black text-[10px] sm:text-xs font-black uppercase mt-1 shadow-lg">
          #1 SERIE MÁS MARATONEADA EN {stats.anio}
        </span>
      </div>

      {/* 2. CONTENIDO PRINCIPAL */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center my-auto w-full max-w-lg min-h-0 px-2">
        <h3 className="text-xl sm:text-2xl md:text-3xl font-black uppercase tracking-tight">
          La que no pudiste soltar
        </h3>
        <p className="text-[11px] sm:text-xs text-emerald-200 mb-3 font-medium italic">
          "Aquel botón de 'Siguiente episodio en 5 segundos' fue tu perdición 🍿"
        </p>

        {stats.topSerie ? (
          <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-2xl bg-black/85 backdrop-blur-xl border-2 sm:border-3 border-[#facc15] shadow-2xl w-full text-left">
            <div className="w-24 sm:w-32 aspect-[2/3] rounded-xl overflow-hidden bg-zinc-900 shrink-0 border-2 border-amber-400 shadow-xl relative">
              <img 
                src={obtenerUrlImagenSegura(stats.topSerie.poster_path)} 
                alt="" 
                crossOrigin="anonymous" 
                aria-hidden="true" 
                className="absolute inset-0 w-full h-full object-cover blur-sm opacity-35 scale-110" 
              />
              <img 
                src={obtenerUrlImagenSegura(stats.topSerie.poster_path)} 
                alt={stats.topSerie.titulo} 
                crossOrigin="anonymous" 
                className="relative z-10 w-full h-full object-contain p-0.5" 
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            </div>
            <div className="space-y-1.5 flex-1 min-w-0">
              <span className="text-[9px] font-mono uppercase text-amber-400 font-bold block">TÍTULO OFICIAL</span>
              <h4 className="text-lg sm:text-xl font-black text-white leading-tight uppercase truncate">{stats.topSerie.titulo}</h4>
              <div className="p-2 rounded-xl bg-zinc-900 border border-white/10 text-xs font-mono">
                <span className="text-zinc-400 block text-[9px]">EPISODIOS DEVORADOS</span>
                <strong className="text-base sm:text-lg font-black text-emerald-400">
                  {stats.topSerie.episodios_vistos || stats.totalEpisodios} capítulos
                </strong>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-rose-400 font-bold">
                <Flame className="w-3.5 h-3.5" />
                <span>Maratón estelar de tu año</span>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-sm text-zinc-300">No registraste series en este año.</p>
        )}
      </div>

      {/* 3. BOTÓN */}
      <div className="relative z-10 shrink-0 pb-1 sm:pb-2 pt-1">
        <button 
          onClick={onSiguiente} 
          className="px-8 sm:px-10 py-2.5 sm:py-3 rounded-2xl bg-[#facc15] hover:bg-[#eab308] text-black font-black text-xs sm:text-sm uppercase cursor-pointer shadow-xl transition-all hover:scale-105 active:scale-95"
        >
          Continuar a los Sobres de Honor →
        </button>
      </div>
    </div>
  );
}