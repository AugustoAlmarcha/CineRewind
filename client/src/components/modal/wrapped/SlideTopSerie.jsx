import React from 'react';
import { Flame } from 'lucide-react';
import { FloatingEmojis } from '../../SpotifyDecorations';
import LogoCineRewind from './LogoCineRewind';

export default function SlideTopSerie({ stats, obtenerUrlImagenSegura, onSiguiente }) {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center text-center bg-gradient-to-br from-[#065f46] via-[#059669] to-[#022c22] rounded-3xl p-4 sm:p-8 relative overflow-hidden text-white shadow-2xl">
      <FloatingEmojis emojis={['📺', '🛋️', '🍕', '🌙', '🔥']} count={10} />
      
      <div className="relative z-10 flex flex-col items-center max-w-lg mx-auto w-full">
        <div className="mb-2">
          <LogoCineRewind tamano="md" />
        </div>

        <span className="px-4 py-1 rounded-full bg-[#facc15] text-black text-xs font-black uppercase mb-1 shadow-lg">
          #1 SERIE MÁS MARATONEADA EN {stats.anio}
        </span>
        <h3 className="text-2xl sm:text-4xl font-black uppercase mb-1 tracking-tight">
          La que no pudiste soltar
        </h3>
        <p className="text-xs sm:text-sm text-emerald-200 mb-4 font-medium italic">
          "Aquel botón de 'Siguiente episodio en 5 segundos' fue tu perdición 🍿"
        </p>

        {stats.topSerie ? (
          <div className="flex flex-col sm:flex-row items-center gap-5 p-5 rounded-3xl bg-black/85 backdrop-blur-xl border-3 border-[#facc15] shadow-2xl w-full text-left">
            <div className="w-28 sm:w-36 aspect-[2/3] rounded-2xl overflow-hidden bg-zinc-900 shrink-0 border-2 border-amber-400 shadow-xl">
              <img 
                src={obtenerUrlImagenSegura(stats.topSerie.poster_path)} 
                alt={stats.topSerie.titulo} 
                className="w-full h-full object-cover object-top" 
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            </div>
            <div className="space-y-2 flex-1">
              <span className="text-[10px] font-mono uppercase text-amber-400 font-bold block">TÍTULO OFICIAL</span>
              <h4 className="text-xl sm:text-2xl font-black text-white leading-tight uppercase">{stats.topSerie.titulo}</h4>
              <div className="p-2.5 rounded-xl bg-zinc-900 border border-white/10 text-xs font-mono">
                <span className="text-zinc-400 block text-[10px]">EPISODIOS DEVORADOS</span>
                <strong className="text-lg font-black text-emerald-400">
                  {stats.topSerie.episodios_vistos || stats.totalEpisodios} capítulos
                </strong>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-rose-400 font-bold">
                <Flame className="w-3.5 h-3.5" />
                <span>Maratón estelar de tu año</span>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-sm text-zinc-300">No registraste series en este año.</p>
        )}

        <button 
          onClick={onSiguiente} 
          className="mt-5 px-6 py-2.5 rounded-xl bg-[#facc15] hover:bg-[#eab308] text-black font-black text-xs uppercase cursor-pointer shadow-lg transition-transform hover:scale-105"
        >
          Continuar a los Sobres de Honor →
        </button>
      </div>
    </div>
  );
}