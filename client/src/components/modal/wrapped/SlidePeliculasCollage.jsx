import React, { useState, useRef, useMemo } from 'react';
import { Film, Download, Share2 } from 'lucide-react';
import { FloatingEmojis } from '../../SpotifyDecorations';
import LogoCineRewind from './LogoCineRewind';

export default function SlidePeliculasCollage({
  stats,
  obtenerUrlImagenSegura,
  descargarElemento,
  compartirEnRedes,
  descargando,
  onSiguiente
}) {
  const collageRef = useRef(null);
  const [formato, setFormato] = useState('story'); // 'story' (9:16) | 'feed' (4:5)
  const [imagenesFallidas, setImagenesFallidas] = useState(new Set());

  // Filtra, deduplica estrictamente y elimina películas sin foto real o caídas
  const peliculas = useMemo(() => {
    const vistas = new Set();
    const lista = [];
    for (const p of (stats.peliculasVistas || [])) {
      if (!p || !p.poster_path) continue;
      const url = String(p.poster_path).trim();
      if (url.length < 5 || imagenesFallidas.has(url)) continue;
      const key = String(p.tmdb_id || p.id || p.titulo || '').toLowerCase().trim();
      if (key && !vistas.has(key)) {
        vistas.add(key);
        lista.push(p);
      }
    }
    return lista;
  }, [stats.peliculasVistas, imagenesFallidas]);

  const cantidad = peliculas.length;

  // Configuración de grilla inteligente según formato y cantidad para evitar cualquier desborde o solapamiento
  const gridConfig = useMemo(() => {
    if (formato === 'feed') {
      if (cantidad <= 2) return { cols: 'grid-cols-2 max-w-[200px]', maxH: 'max-h-[135px]' };
      if (cantidad <= 4) return { cols: 'grid-cols-4 max-w-full', maxH: 'max-h-[110px]' };
      if (cantidad <= 8) return { cols: 'grid-cols-4 max-w-full', maxH: 'max-h-[85px]' };
      if (cantidad <= 12) return { cols: 'grid-cols-4 sm:grid-cols-6 max-w-full', maxH: 'max-h-[68px]' };
      return { cols: 'grid-cols-5 sm:grid-cols-6 max-w-full', maxH: 'max-h-[58px]' };
    }
    // Story (9:16)
    if (cantidad <= 2) return { cols: 'grid-cols-2 max-w-[210px]', maxH: 'max-h-[150px]' };
    if (cantidad <= 4) return { cols: 'grid-cols-2 max-w-[210px]', maxH: 'max-h-[125px]' };
    if (cantidad <= 6) return { cols: 'grid-cols-3 max-w-full', maxH: 'max-h-[98px]' };
    if (cantidad <= 9) return { cols: 'grid-cols-3 max-w-full', maxH: 'max-h-[84px]' };
    if (cantidad <= 12) return { cols: 'grid-cols-4 max-w-full', maxH: 'max-h-[72px]' };
    return { cols: 'grid-cols-4 max-w-full', maxH: 'max-h-[60px]' };
  }, [formato, cantidad]);

  const marcarImagenFallida = (path) => {
    setImagenesFallidas((prev) => new Set(prev).add(path));
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-between text-center bg-gradient-to-br from-[#881337] via-[#5c0b24] to-[#2e0512] rounded-3xl p-2 sm:p-4 relative overflow-hidden text-white shadow-2xl select-none">
      <FloatingEmojis emojis={['🎬', '🍿', '🎟️', '✨', '👑']} count={8} />
      
      {/* 1. CABECERA Y SELECTOR ELEVADOS Y PROTEGIDOS */}
      <div className="relative z-30 flex flex-col items-center shrink-0 pt-0.5 mb-1">
        <LogoCineRewind tamano="md" />

        <span className="px-3 py-0.5 rounded-full bg-rose-400 text-black text-[9px] sm:text-[10px] font-black uppercase shadow mt-1">
          CARTELERA DE PELÍCULAS · {stats.anio} ({cantidad})
        </span>

        {/* SELECTOR EXCLUSIVO DE FORMATOS */}
        <div className="flex items-center gap-1.5 p-1 bg-black/85 rounded-xl border border-white/25 mt-1.5 shadow-lg">
          <button
            onClick={() => setFormato('story')}
            className={`px-3 py-1 rounded-lg text-[9px] sm:text-[10px] font-black uppercase transition-all cursor-pointer ${
              formato === 'story' ? 'bg-rose-400 text-black shadow-md' : 'text-zinc-300 hover:text-white'
            }`}
          >
            Historia (9:16)
          </button>
          <button
            onClick={() => setFormato('feed')}
            className={`px-3 py-1 rounded-lg text-[9px] sm:text-[10px] font-black uppercase transition-all cursor-pointer ${
              formato === 'feed' ? 'bg-rose-400 text-black shadow-md' : 'text-zinc-300 hover:text-white'
            }`}
          >
            Feed (4:5)
          </button>
        </div>
      </div>

      {/* 2. TARJETA DESCARGABLE CON CARTELERA LIMPIA SIN NINGUNA SUPERPOSICIÓN */}
      <div className="relative z-10 flex-1 flex items-center justify-center my-auto min-h-0 w-full py-0.5">
        <div 
          ref={collageRef}
          className={`p-2.5 sm:p-3 rounded-2xl bg-gradient-to-b from-[#2e0512] via-[#1c030b] to-[#0d0105] border-2 border-rose-400/80 shadow-2xl flex flex-col justify-between overflow-hidden transition-all ${
            formato === 'story' 
              ? 'w-[240px] sm:w-[270px] aspect-[9/16] max-h-[410px] sm:max-h-[450px]' 
              : 'w-[280px] sm:w-[320px] aspect-[4/5] max-h-[360px] sm:max-h-[400px]'
          }`}
          style={{ boxShadow: '0 0 30px rgba(244, 63, 94, 0.35)' }}
        >
          {/* Header del post */}
          <div className="flex justify-between items-center pb-1 border-b border-white/10 shrink-0">
            <LogoCineRewind tamano="sm" />
            <div className="flex items-center gap-1 bg-rose-400 text-black px-1.5 py-0.5 rounded-full text-[8px] font-black uppercase shadow">
              <Film className="w-2.5 h-2.5 fill-black" />
              <span>{cantidad} PELÍCULAS</span>
            </div>
          </div>

          {/* Grilla matemática anti-superposición */}
          {cantidad > 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center my-auto overflow-hidden w-full min-h-0 py-1">
              <div className={`grid ${gridConfig.cols} gap-1.5 justify-center items-center content-center w-full mx-auto`}>
                {peliculas.map((peli, idx) => (
                  <div 
                    key={`peli-card-${peli.tmdb_id || peli.id || idx}`} 
                    className={`relative aspect-[2/3] ${gridConfig.maxH} w-full rounded-md overflow-hidden border border-rose-400/40 bg-zinc-950 shadow flex items-center justify-center group shrink-0 mx-auto`}
                  >
                    <img 
                      src={obtenerUrlImagenSegura(peli.poster_path)} 
                      alt="" 
                      crossOrigin="anonymous" 
                      aria-hidden="true" 
                      className="absolute inset-0 w-full h-full object-cover blur-sm opacity-30 scale-110" 
                    />
                    <img 
                      src={obtenerUrlImagenSegura(peli.poster_path)} 
                      alt={peli.titulo} 
                      crossOrigin="anonymous"
                      className="relative z-10 w-full h-full object-contain p-0.5 transition-transform duration-300 group-hover:scale-105 drop-shadow"
                      onError={() => marcarImagenFallida(peli.poster_path)}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-0.5 z-20">
                      <span className="text-[6.5px] font-bold text-white line-clamp-1 leading-none">{peli.titulo}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="my-auto py-4 text-center text-xs text-zinc-400">
              No hay películas registradas en este período.
            </div>
          )}

          {/* Footer del post */}
          <div className="flex justify-between items-center pt-1 border-t border-white/10 text-[7.5px] font-mono text-zinc-400 shrink-0">
            <span className="truncate max-w-[110px]">@{stats.usuario.username}</span>
            <span className="text-rose-300 font-bold">#CineRewind{stats.anio}</span>
          </div>
        </div>
      </div>

      {/* 3. BOTONES DE ACCIÓN VISIBLES */}
      <div className="relative z-30 flex items-center justify-center gap-1.5 shrink-0 pb-1 sm:pb-2 w-full max-w-xs pt-1">
        <button
          onClick={() => descargarElemento(collageRef, `CineRewind-Peliculas-${formato}-${stats.anio}`)}
          disabled={descargando}
          className="flex-1 py-2 px-3 rounded-xl bg-rose-400 hover:bg-rose-300 text-black font-black text-[11px] sm:text-xs uppercase flex items-center justify-center gap-1.5 cursor-pointer shadow-lg transition-transform hover:scale-102"
        >
          <Download className="w-3.5 h-3.5 stroke-[3]" />
          <span>{descargando ? 'Generando...' : 'Descargar'}</span>
        </button>
        <button
          onClick={() => compartirEnRedes(collageRef, `CineRewind-Peliculas-${stats.anio}`)}
          className="py-2 px-3 rounded-xl bg-black/70 hover:bg-black text-white font-bold text-[11px] sm:text-xs border border-white/20 flex items-center justify-center gap-1 cursor-pointer shadow"
          title="Compartir en Redes"
        >
          <Share2 className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={onSiguiente}
          className="py-2 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-[11px] sm:text-xs border border-white/20 cursor-pointer"
        >
          Siguiente →
        </button>
      </div>
    </div>
  );
}
