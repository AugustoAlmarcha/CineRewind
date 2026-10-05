import React, { useState, useRef, useMemo } from 'react';
import { Tv, Download, Share2 } from 'lucide-react';
import { FloatingEmojis } from '../../SpotifyDecorations';
import LogoCineRewind from './LogoCineRewind';

export default function SlideSeriesCollage({
  stats,
  obtenerUrlImagenSegura,
  descargarElemento,
  compartirEnRedes,
  descargando,
  onSiguiente
}) {
  const collageRef = useRef(null);
  const [formato, setFormato] = useState('story');
  const [imagenesFallidas, setImagenesFallidas] = useState(new Set());

  // Filtra y elimina series sin foto real o caídas (como "Una noche de terror")
  const series = useMemo(() => {
    return (stats.seriesVistas || []).filter((s) => {
      if (!s || !s.poster_path) return false;
      const url = String(s.poster_path).trim();
      return url.length > 5 && !imagenesFallidas.has(url);
    });
  }, [stats.seriesVistas, imagenesFallidas]);

  const cantidad = series.length;

  const gridCols = cantidad <= 4 
    ? 'grid-cols-2' 
    : cantidad <= 6 
      ? 'grid-cols-3' 
      : cantidad <= 9 
        ? 'grid-cols-3' 
        : 'grid-cols-4';

  const marcarImagenFallida = (path) => {
    setImagenesFallidas((prev) => new Set(prev).add(path));
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-between text-center bg-gradient-to-br from-[#4338ca] via-[#312e81] to-[#1e1b4b] rounded-3xl p-2 sm:p-4 relative overflow-y-auto text-white shadow-2xl">
      <FloatingEmojis emojis={['📺', '✨', '🎬', '🍿', '🔥']} count={8} />
      
      <div className="relative z-10 flex flex-col items-center max-w-lg mx-auto w-full my-auto">
        <div className="mb-1">
          <LogoCineRewind tamano="md" />
        </div>

        <span className="px-3 py-0.5 rounded-full bg-cyan-400 text-black text-[10px] sm:text-xs font-black uppercase mb-1 shadow-lg">
          CARTELERA EXCLUSIVA DE SERIES · {stats.anio}
        </span>
        <h3 className="text-lg sm:text-2xl font-black uppercase tracking-tight">
          Tus Series del Año ({cantidad})
        </h3>

        {/* Selector de formato: Historia (9:16) vs Post Cuadrado (1:1) */}
        <div className="flex items-center gap-1.5 p-1 bg-black/85 rounded-xl border border-white/20 my-1.5 shadow">
          <button
            onClick={() => setFormato('story')}
            className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase transition-all ${
              formato === 'story' ? 'bg-cyan-400 text-black shadow' : 'text-zinc-300 hover:text-white'
            }`}
          >
            Historia (9:16)
          </button>
          <button
            onClick={() => setFormato('feed')}
            className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase transition-all ${
              formato === 'feed' ? 'bg-cyan-400 text-black shadow' : 'text-zinc-300 hover:text-white'
            }`}
          >
            Post Cuadrado (1:1)
          </button>
        </div>

        {/* CONTENEDOR EN VERDADERO FORMATO INSTAGRAM 9:16 O 1:1 */}
        <div 
          ref={collageRef}
          className={`relative z-10 p-3.5 sm:p-4 rounded-3xl bg-gradient-to-b from-[#181533] via-[#100e26] to-[#0c0a1a] border-2 border-cyan-400/80 shadow-2xl my-2 flex flex-col justify-between overflow-hidden transition-all ${
            formato === 'story' 
              ? 'w-[320px] sm:w-[340px] aspect-[9/16]' 
              : 'w-[320px] sm:w-[360px] aspect-square'
          }`}
          style={{ boxShadow: '0 0 30px rgba(34, 211, 238, 0.35)' }}
        >
          <div className="flex justify-between items-center pb-2 mb-2 border-b border-white/10 shrink-0">
            <LogoCineRewind tamano="sm" />
            <div className="flex items-center gap-1.5 bg-cyan-400 text-black px-2.5 py-0.5 rounded-full text-[9px] sm:text-[10px] font-black uppercase shadow">
              <Tv className="w-3 h-3 fill-black" />
              <span>{cantidad} SERIES VISTAS</span>
            </div>
          </div>

          {cantidad > 0 ? (
            <div className={`grid ${gridCols} gap-2 my-auto overflow-hidden content-center items-center justify-center`}>
              {series.map((serie, idx) => (
                <div 
                  key={serie.id || idx} 
                  className="group relative aspect-[2/3] w-full rounded-xl overflow-hidden border border-cyan-400/40 bg-zinc-950 shadow-md flex items-center justify-center"
                >
                  <img 
                    src={obtenerUrlImagenSegura(serie.poster_path)} 
                    alt={serie.titulo} 
                    crossOrigin="anonymous"
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    onError={() => marcarImagenFallida(serie.poster_path)}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-1">
                    <span className="text-[8px] font-bold text-white line-clamp-1">{serie.titulo}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="my-auto py-8 text-center text-xs text-zinc-400">
              No hay series registradas con portada válida.
            </div>
          )}

          <div className="flex justify-between items-center pt-2 mt-2 border-t border-white/10 text-[9px] font-mono text-zinc-400 shrink-0">
            <span>CineRewind · {stats.usuario.nombre}</span>
            <span className="text-cyan-300 font-bold">#CineRewind{stats.anio}</span>
          </div>
        </div>

        {/* Botones de Acción */}
        <div className="flex items-center justify-center gap-2 mt-2 w-full max-w-xs">
          <button
            onClick={() => descargarElemento(collageRef, `CineRewind-Series-${formato}-${stats.anio}`)}
            disabled={descargando}
            className="flex-1 py-2.5 px-3.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-black font-black text-xs uppercase flex items-center justify-center gap-1.5 cursor-pointer shadow-lg transition-transform hover:scale-102"
          >
            <Download className="w-3.5 h-3.5 stroke-[3]" />
            <span>{descargando ? 'Generando...' : 'Descargar Foto'}</span>
          </button>
          <button
            onClick={() => compartirEnRedes(collageRef, `CineRewind-Series-${stats.anio}`)}
            className="py-2.5 px-3 rounded-xl bg-black/70 hover:bg-black text-white font-bold text-xs border border-white/20 flex items-center justify-center gap-1 cursor-pointer shadow"
            title="Compartir en Redes"
          >
            <Share2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onSiguiente}
            className="py-2.5 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/20 cursor-pointer"
          >
            Siguiente →
          </button>
        </div>
      </div>
    </div>
  );
}