import React from 'react';
import { Play } from 'lucide-react';
import { FloatingEmojis, PolkaDotsOverlay, SpotifyStarburst } from '../../SpotifyDecorations';
import LogoCineRewind from './LogoCineRewind';

export default function SlideClaqueta({ stats, claquetaGolpeada, onGolpearClaqueta, onIniciar }) {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center text-center bg-gradient-to-br from-[#581c87] via-[#4c1d95] to-[#2e1065] rounded-3xl p-4 sm:p-8 relative overflow-hidden text-white shadow-2xl">
      <PolkaDotsOverlay color="#facc15" opacity={0.25} />
      <FloatingEmojis emojis={['🍿', '🎬', '🎟️', '⚡', '✨', '🏆', '🔥']} count={12} />
      
      <div className="relative z-10 flex flex-col items-center max-w-lg mx-auto">
        <div className="mb-3">
          <LogoCineRewind tamano="md" />
        </div>

        <span className="text-[11px] uppercase font-black tracking-widest px-4 py-1 rounded-full bg-[#facc15] text-black shadow-lg mb-3">
          CINEREWIND GALA · {stats.anio}
        </span>

        <div className="mb-4">
          <SpotifyStarburst 
            text={`Dejémonos de tanto ${stats.anio}.`} 
            subtext="¡Hablemos de tus títulos reales!" 
            bgFill="#f97316" 
          />
        </div>

        <div onClick={onGolpearClaqueta} className="cursor-pointer transform hover:scale-105 transition-transform my-2">
          <div 
            className="w-60 sm:w-72 h-8 bg-zinc-950 rounded-t-lg border-2 border-white flex items-center overflow-hidden transition-transform duration-300 origin-bottom-left"
            style={{ transform: claquetaGolpeada ? 'rotate(0deg)' : 'rotate(-18deg)' }}
          >
            <div className="flex w-full h-full">
              {Array.from({ length: 9 }).map((_, i) => (
                <div key={i} className={`flex-1 h-full skew-x-[-30deg] ${i % 2 === 0 ? 'bg-[#fbbf24]' : 'bg-black'}`} />
              ))}
            </div>
          </div>
          <div className="w-60 sm:w-72 h-32 bg-black border-2 border-white rounded-b-2xl p-3 flex flex-col justify-between text-left shadow-2xl">
            <div className="flex justify-between items-center text-[10px] font-mono text-[#facc15] font-bold border-b border-zinc-800 pb-1">
              <span>CINEREWIND PRODUCCIÓN</span>
              <span className="bg-[#facc15] text-black px-1.5 py-0.5 rounded font-black">TAKE 01</span>
            </div>
            <div className="space-y-0.5">
              <p className="text-xl font-black text-white uppercase">{stats.totalObras} OBRAS VISTAS</p>
              <div className="flex items-center gap-2 text-xs font-mono text-zinc-300">
                <span className="text-amber-400 font-bold">{stats.totalHoras}h</span>
                <span>•</span>
                <span className="text-pink-400 font-bold">{stats.totalResenias} Reseñas</span>
              </div>
            </div>
            <div className="text-[9px] font-mono text-zinc-400 border-t border-zinc-800 pt-1 flex justify-between">
              <span>CINÉFILO: {stats.usuario.nombre}</span>
              <span className="text-emerald-400">LISTO</span>
            </div>
          </div>
        </div>

        <button
          onClick={onIniciar}
          className="mt-5 px-8 py-3.5 rounded-2xl font-black text-sm text-black bg-[#bef264] hover:bg-[#a3e635] shadow-2xl border-2 border-black flex items-center gap-2 cursor-pointer transition-all hover:scale-105"
        >
          <Play className="w-4 h-4 fill-current" />
          <span>INICIAR PROYECCIÓN</span>
        </button>
      </div>
    </div>
  );
}