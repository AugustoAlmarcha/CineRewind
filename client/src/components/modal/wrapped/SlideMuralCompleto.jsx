import React, { useState, useRef } from 'react';
import { Layers, Download, Share2 } from 'lucide-react';
import { FloatingEmojis } from '../../SpotifyDecorations';
import LogoCineRewind from './LogoCineRewind';

export default function SlideMuralCompleto({
  stats,
  obtenerUrlImagenSegura,
  descargarElemento,
  compartirEnRedes,
  descargando,
  onSiguiente
}) {
  const collageRef = useRef(null);
  const [formato, setFormato] = useState('story');
  const todas = stats.todasLasObras || [];
  const cantidad = todas.length;

  const gridCols = cantidad <= 6 
    ? 'grid-cols-3' 
    : cantidad <= 12 
      ? 'grid-cols-4' 
      : cantidad <= 20 
        ? 'grid-cols-4 sm:grid-cols-5' 
        : 'grid-cols-5 sm:grid-cols-6';

  return (
    <div className="w-full h-full flex flex-col items-center justify-between text-center bg-gradient-to-br from-[#1e1b4b] via-[#311042] to-[#120726] rounded-3xl p-3 sm:p-5 relative overflow-hidden text-white shadow-2xl">
      <FloatingEmojis emojis={['🍿', '🎬', '📺', '✨', '👑']} count={8} />
      
      <div className="relative z-10 flex flex-col items-center max-w-lg mx-auto w-full">
        <div className="mb-1.5">
          <LogoCineRewind tamano="md" />
        </div>

        <span className="px-3.5 py-1 rounded-full bg-[#facc15] text-black text-[11px] font-black uppercase mb-1 shadow-lg">
          MURAL MAESTRO DE CARTELERA · {stats.anio}
        </span>
        <h3 className="text-xl sm:text-2xl font-black uppercase tracking-tight">
          Series & Películas Juntas ({cantidad})
        </h3>

        <div className="flex items-center gap-1.5 p-1 bg-black/80 rounded-xl border border-white/20 mt-1.5 shadow">
          <button
            onClick={() => setFormato('story')}
            className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase transition-all ${
              formato === 'story' ? 'bg-[#facc15] text-black shadow' : 'text-zinc-300 hover:text-white'
            }`}
          >
            Historia (9:16)
          </button>
          <button
            onClick={() => setFormato('feed')}
            className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase transition-all ${
              formato === 'feed' ? 'bg-[#facc15] text-black shadow' : 'text-zinc-300 hover:text-white'
            }`}
          >
            Post Cuadrado (1:1)
          </button>
        </div>
      </div>

      <div 
        ref={collageRef}
        className={`relative z-10 w-full max-w-md sm:max-w-xl p-4 rounded-3xl bg-gradient-to-b from-[#1c1228] to-[#0a0512] border-2 border-[#facc15]/80 shadow-2xl my-auto transition-all ${
          formato === 'story' ? 'aspect-[9/16] max-h-[520px] flex flex-col justify-between' : 'aspect-square max-h-[460px] flex flex-col justify-between'
        }`}
      >
        <div className="flex justify-between items-center pb-2 mb-2 border-b border-white/10">
          <LogoCineRewind tamano="sm" />
          <div className="flex items-center gap-1.5 bg-[#facc15] text-black px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase shadow">
            <Layers className="w-3 h-3 fill-black" />
            <span>{cantidad} OBRAS COMPLETAS</span>
          </div>
        </div>

        {cantidad > 0 ? (
          <div className={`grid ${gridCols} gap-1.5 sm:gap-2 my-auto overflow-hidden`}>
            {todas.map((obra, idx) => (
              <div key={idx} className="group relative aspect-[2/3] rounded-lg overflow-hidden border border-white/20 bg-zinc-900 shadow-sm">
                {obra.poster_path ? (
                  <img 
                    src={obtenerUrlImagenSegura(obra.poster_path)} 
                    alt={obra.titulo} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center p-1 bg-zinc-800 text-center">
                    <span className="text-[8px] font-bold text-white line-clamp-2">{obra.titulo}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="py-12 text-center text-zinc-400 text-xs">
            No hay obras registradas en este período.
          </div>
        )}

        <div className="pt-2 border-t border-white/10 flex justify-between items-center text-[10px] font-mono text-zinc-400">
          <span>@{stats.usuario.username}</span>
          <span className="text-amber-300 font-bold">#CINEREWIND{stats.anio}</span>
        </div>
      </div>

      <div className="flex items-center justify-center gap-2 w-full max-w-md mx-auto pt-2 z-30">
        <button
          onClick={() => descargarElemento(collageRef, `CineRewind-Mural-Completo-${formato}-${stats.anio}`)}
          disabled={descargando}
          className="flex-1 py-2.5 px-3 rounded-xl bg-[#facc15] hover:bg-[#eab308] text-black font-black text-xs flex items-center justify-center gap-1.5 shadow-lg cursor-pointer"
        >
          <Download className="w-3.5 h-3.5" />
          <span>{descargando ? 'Generando...' : 'Descargar Mural'}</span>
        </button>
        <button
          onClick={() => compartirEnRedes(collageRef, `CineRewind-Mural-Completo-${stats.anio}`)}
          className="py-2.5 px-3 rounded-xl bg-black/70 hover:bg-black text-white font-bold text-xs flex items-center justify-center gap-1.5 border border-white/20 cursor-pointer shadow-lg"
        >
          <Share2 className="w-3.5 h-3.5 text-amber-300" />
          <span>Compartir</span>
        </button>
        <button
          onClick={onSiguiente}
          className="py-2.5 px-4 rounded-xl bg-white text-black font-black text-xs cursor-pointer shadow-lg"
        >
          Ver Hábitos →
        </button>
      </div>
    </div>
  );
}