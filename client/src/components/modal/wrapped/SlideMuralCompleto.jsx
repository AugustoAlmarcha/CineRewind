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
  const [formato, setFormato] = useState('story'); // 'story' (9:16) | 'feed' (4:5)
  const todas = stats.todasLasObras || [];
  const cantidad = todas.length;

  const gridConfig = React.useMemo(() => {
    if (formato === 'feed') {
      if (cantidad <= 4) return { cols: 'grid-cols-4 max-w-full', maxH: 'max-h-[110px]' };
      if (cantidad <= 8) return { cols: 'grid-cols-4 max-w-full', maxH: 'max-h-[85px]' };
      if (cantidad <= 15) return { cols: 'grid-cols-5 sm:grid-cols-6 max-w-full', maxH: 'max-h-[64px]' };
      return { cols: 'grid-cols-6 sm:grid-cols-7 max-w-full', maxH: 'max-h-[52px]' };
    }
    // Story (9:16)
    if (cantidad <= 4) return { cols: 'grid-cols-2 max-w-[210px]', maxH: 'max-h-[130px]' };
    if (cantidad <= 6) return { cols: 'grid-cols-3 max-w-full', maxH: 'max-h-[98px]' };
    if (cantidad <= 12) return { cols: 'grid-cols-4 max-w-full', maxH: 'max-h-[75px]' };
    if (cantidad <= 20) return { cols: 'grid-cols-4 sm:grid-cols-5 max-w-full', maxH: 'max-h-[62px]' };
    return { cols: 'grid-cols-5 sm:grid-cols-6 max-w-full', maxH: 'max-h-[50px]' };
  }, [formato, cantidad]);

  return (
    <div className="w-full h-full flex flex-col items-center justify-between text-center bg-gradient-to-br from-[#1e1b4b] via-[#311042] to-[#120726] rounded-3xl p-2 sm:p-4 relative overflow-hidden text-white shadow-2xl select-none">
      <FloatingEmojis emojis={['🍿', '🎬', '📺', '✨', '👑']} count={8} />
      
      {/* 1. CABECERA Y SELECTOR ELEVADOS Y PROTEGIDOS */}
      <div className="relative z-30 flex flex-col items-center shrink-0 pt-0.5 mb-1">
        <LogoCineRewind tamano="md" />

        <span className="px-3 py-0.5 rounded-full bg-[#facc15] text-black text-[9px] sm:text-[10px] font-black uppercase shadow mt-1">
          MURAL MAESTRO DE CARTELERA · {stats.anio} ({cantidad})
        </span>

        {/* SELECTOR EXCLUSIVO DE FORMATOS */}
        <div className="flex items-center gap-1.5 p-1 bg-black/85 rounded-xl border border-white/25 mt-1.5 shadow-lg">
          <button
            onClick={() => setFormato('story')}
            className={`px-3 py-1 rounded-lg text-[9px] sm:text-[10px] font-black uppercase transition-all cursor-pointer ${
              formato === 'story' ? 'bg-[#facc15] text-black shadow-md' : 'text-zinc-300 hover:text-white'
            }`}
          >
            Historia (9:16)
          </button>
          <button
            onClick={() => setFormato('feed')}
            className={`px-3 py-1 rounded-lg text-[9px] sm:text-[10px] font-black uppercase transition-all cursor-pointer ${
              formato === 'feed' ? 'bg-[#facc15] text-black shadow-md' : 'text-zinc-300 hover:text-white'
            }`}
          >
            Feed (4:5)
          </button>
        </div>
      </div>

      {/* 2. MURAL DESCARGABLE CON TAMAÑO SEGURO Y CROSSORIGIN */}
      <div className="relative z-10 flex-1 flex items-center justify-center my-auto min-h-0 w-full py-0.5">
        <div 
          ref={collageRef}
          className={`p-2.5 sm:p-3 rounded-2xl bg-gradient-to-b from-[#1c1228] to-[#0a0512] border-2 border-[#facc15]/80 shadow-2xl flex flex-col justify-between overflow-hidden transition-all ${
            formato === 'story' 
              ? 'w-[240px] sm:w-[270px] aspect-[9/16] max-h-[410px] sm:max-h-[450px]' 
              : 'w-[280px] sm:w-[320px] aspect-[4/5] max-h-[360px] sm:max-h-[400px]'
          }`}
          style={{ boxShadow: '0 0 30px rgba(250, 204, 21, 0.35)' }}
        >
          {/* Header del mural */}
          <div className="flex justify-between items-center pb-1 border-b border-white/10 shrink-0">
            <LogoCineRewind tamano="sm" />
            <div className="flex items-center gap-1 bg-[#facc15] text-black px-1.5 py-0.5 rounded-full text-[8px] font-black uppercase shadow">
              <Layers className="w-2.5 h-2.5 fill-black" />
              <span>{cantidad} OBRAS</span>
            </div>
          </div>

          {/* Grilla compacta sin cortes y con crossOrigin */}
          {cantidad > 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center my-auto overflow-hidden w-full min-h-0 py-1">
              <div className={`grid ${gridConfig.cols} gap-1 justify-center items-center content-center w-full mx-auto`}>
                {todas.map((obra, idx) => (
                  <div key={`mural-item-${obra.tmdb_id || obra.id || idx}`} className={`group relative aspect-[2/3] ${gridConfig.maxH} w-full rounded-md overflow-hidden border border-white/20 bg-zinc-900 shadow-sm shrink-0 mx-auto`}>
                    {obra.poster_path ? (
                      <>
                        <img 
                          src={obtenerUrlImagenSegura(obra.poster_path)} 
                          alt="" 
                          crossOrigin="anonymous" 
                          aria-hidden="true" 
                          className="absolute inset-0 w-full h-full object-cover blur-sm opacity-30 scale-110" 
                        />
                        <img 
                          src={obtenerUrlImagenSegura(obra.poster_path)} 
                          alt={obra.titulo} 
                          crossOrigin="anonymous"
                          className="relative z-10 w-full h-full object-contain p-0.5 group-hover:scale-105 transition-transform duration-300 drop-shadow"
                          onError={(e) => { e.target.style.display = 'none'; }}
                        />
                      </>
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center p-0.5 bg-zinc-800 text-center">
                        <span className="text-[6.5px] font-bold text-white line-clamp-1">{obra.titulo}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="py-4 text-center text-zinc-400 text-xs my-auto">
              No hay obras registradas en este período.
            </div>
          )}

          {/* Footer del mural */}
          <div className="pt-1 border-t border-white/10 flex justify-between items-center text-[7.5px] font-mono text-zinc-400 shrink-0">
            <span className="truncate max-w-[110px]">@{stats.usuario.username}</span>
            <span className="text-amber-300 font-bold">#CINEREWIND{stats.anio}</span>
          </div>
        </div>
      </div>

      {/* 3. BOTONES DE ACCIÓN VISIBLES */}
      <div className="relative z-30 flex items-center justify-center gap-1.5 shrink-0 pb-1 sm:pb-2 w-full max-w-xs pt-1">
        <button
          onClick={() => descargarElemento(collageRef, `CineRewind-Mural-Completo-${formato}-${stats.anio}`)}
          disabled={descargando}
          className="flex-1 py-2 px-3 rounded-xl bg-[#facc15] hover:bg-[#eab308] text-black font-black text-[11px] sm:text-xs uppercase flex items-center justify-center gap-1.5 cursor-pointer shadow-lg transition-transform hover:scale-102"
        >
          <Download className="w-3.5 h-3.5" />
          <span>{descargando ? 'Generando...' : 'Descargar'}</span>
        </button>
        <button
          onClick={() => compartirEnRedes(collageRef, `CineRewind-Mural-Completo-${stats.anio}`)}
          className="py-2 px-3 rounded-xl bg-black/70 hover:bg-black text-white font-bold text-[11px] sm:text-xs border border-white/20 flex items-center justify-center gap-1 cursor-pointer shadow"
          title="Compartir en Redes"
        >
          <Share2 className="w-3.5 h-3.5 text-amber-300" />
        </button>
        <button
          onClick={onSiguiente}
          className="py-2 px-3 rounded-xl bg-white text-black font-black text-[11px] sm:text-xs cursor-pointer shadow-lg hover:bg-zinc-200"
        >
          Hábitos →
        </button>
      </div>
    </div>
  );
}