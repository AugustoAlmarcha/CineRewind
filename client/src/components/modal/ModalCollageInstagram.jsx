import React, { useState, useRef, useMemo } from 'react';
import { toPng } from 'html-to-image';
import { X, Share2, Layers, Tv, Film, Crown, Download } from 'lucide-react';

const obtenerUrlProxy = (url) => {
  if (!url) return 'https://images.unsplash.com/photo-1594909122845-11baa439b7bf?auto=format&fit=crop&w=500&q=80';
  const fullUrl = url.startsWith('http') ? url : `https://image.tmdb.org/t/p/w500${url.startsWith('/') ? url : `/${url}`}`;
  return `http://localhost:5000/api/historial/proxy-image?url=${encodeURIComponent(fullUrl)}`;
};

export default function ModalCollageInstagram({ abierto, alCerrar, stats }) {
  const [filtro, setFiltro] = useState('todas');
  const [procesando, setProcesando] = useState(false);
  const collageRef = useRef(null);

  const titulos = useMemo(() => {
    if (!stats) return [];
    if (filtro === 'series') return stats.seriesVistas || [];
    if (filtro === 'peliculas') return stats.peliculasVistas || [];
    return stats.todasObras?.length > 0 ? stats.todasObras : [...(stats.seriesVistas || []), ...(stats.peliculasVistas || [])];
  }, [stats, filtro]);

  const columnas = useMemo(() => {
    const total = titulos.length;
    if (total <= 4) return 2;
    if (total <= 9) return 3;
    if (total <= 16) return 4;
    return 5;
  }, [titulos]);

  const huecosRelleno = useMemo(() => {
    const total = titulos.length;
    if (total === 0) return 0;
    const resto = total % columnas;
    return resto === 0 ? 0 : columnas - resto;
  }, [titulos, columnas]);

  const compartirInstagram = async () => {
    if (!collageRef.current) return;
    setProcesando(true);
    try {
      const dataUrl = await toPng(collageRef.current, { quality: 0.98, pixelRatio: 2.5, skipFonts: true, cacheBust: true });
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], `CineRewind-Collage-${stats?.anio}.png`, { type: 'image/png' });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: `Mi CineRewind Collage ${stats?.anio}`,
          text: `¡Todas las historias que devoré en mi ${stats?.anio}! 🍿✨ #CineRewind`,
          files: [file]
        });
      } else {
        const a = document.createElement('a');
        a.download = `CineRewind-Collage-${stats?.anio}.png`;
        a.href = dataUrl;
        a.click();
        alert('📸 ¡Collage en alta definición guardado en tu galería!');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setProcesando(false);
    }
  };

  if (!abierto || !stats) return null;

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-6 bg-black/95 backdrop-blur-2xl">
      <div className="w-full max-w-lg lg:max-w-xl max-h-[94vh] bg-[#0c0c14] border-2 border-[#facc15] rounded-3xl p-4 sm:p-5 flex flex-col justify-between shadow-[0_0_50px_rgba(250,204,21,0.4)] overflow-hidden">
        
        {/* Cabecera con Logo Oficial */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-black border border-white/20 flex items-center justify-center shadow">
              <span className="text-[#ff385c] font-black text-xs tracking-tighter">&lt;&lt;</span>
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black text-white tracking-tight leading-none">
                <span className="text-[#ff385c]">Cine</span><span className="text-[#fbbf24]">Rewind</span> · {stats.anio}
              </h3>
              <span className="text-[10px] font-mono text-zinc-400">Póster fotográfico para Instagram</span>
            </div>
          </div>
          <button onClick={alCerrar} className="w-8 h-8 rounded-full bg-zinc-900 hover:bg-zinc-800 text-zinc-400 flex items-center justify-center cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Pestañas de Filtro */}
        <div className="flex items-center gap-2 mb-3 bg-zinc-950 p-1 rounded-2xl border border-white/10">
          <button onClick={() => setFiltro('todas')} className={`flex-1 py-1.5 rounded-xl text-xs font-black transition cursor-pointer flex items-center justify-center gap-1 ${filtro === 'todas' ? 'bg-[#facc15] text-black shadow' : 'text-zinc-400 hover:text-white'}`}>
            <Layers className="w-3 h-3" />
            <span>Todas ({stats.todasObras?.length || stats.totalObras})</span>
          </button>
          <button onClick={() => setFiltro('series')} className={`flex-1 py-1.5 rounded-xl text-xs font-black transition cursor-pointer flex items-center justify-center gap-1 ${filtro === 'series' ? 'bg-[#38bdf8] text-black shadow' : 'text-zinc-400 hover:text-white'}`}>
            <Tv className="w-3 h-3" />
            <span>Series ({stats.seriesVistas?.length || 0})</span>
          </button>
          <button onClick={() => setFiltro('peliculas')} className={`flex-1 py-1.5 rounded-xl text-xs font-black transition cursor-pointer flex items-center justify-center gap-1 ${filtro === 'peliculas' ? 'bg-[#f97316] text-black shadow' : 'text-zinc-400 hover:text-white'}`}>
            <Film className="w-3 h-3" />
            <span>Películas ({stats.peliculasVistas?.length || 0})</span>
          </button>
        </div>

        {/* Cuadrícula Exportable en Caja Rojo Terciopelo */}
        <div className="flex-1 overflow-y-auto pr-1 flex items-center justify-center py-2">
          <div ref={collageRef} className="w-full bg-gradient-to-b from-[#2a0610] via-[#1e030b] to-[#120207] border-2 border-rose-500/30 p-4 rounded-3xl shadow-2xl text-center">
            <div className="flex justify-between items-center border-b border-rose-500/20 pb-2 mb-3">
              <div className="flex items-center gap-1.5 text-left">
                <div className="w-5 h-5 rounded bg-black text-[#ff385c] font-black text-[9px] flex items-center justify-center border border-white/20">&lt;&lt;</div>
                <div>
                  <p className="text-[10px] font-black uppercase text-white tracking-widest leading-none">
                    <span className="text-[#ff385c]">Cine</span><span className="text-[#fbbf24]">Rewind</span> · {stats.anio}
                  </p>
                  <span className="text-[8px] font-mono text-amber-300">@{stats.usuario.username}</span>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-rose-950/60 border border-rose-500/30 text-[8px] font-mono text-rose-300 font-bold uppercase">
                {filtro === 'series' ? 'Mural Series' : filtro === 'peliculas' ? 'Mural Películas' : 'Cartelera Completa'}
              </span>
            </div>

            {titulos.length > 0 ? (
              <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${columnas}, minmax(0, 1fr))` }}>
                {titulos.map((item, idx) => (
                  <div key={idx} className="aspect-[2/3] rounded-xl overflow-hidden bg-zinc-900 border border-white/15 shadow-md relative">
                    <img src={obtenerUrlProxy(item.poster_path)} alt={item.titulo} crossOrigin="anonymous" className="w-full h-full object-cover" />
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/60 to-transparent p-1 text-[8px] font-black text-white truncate text-left">
                      {item.titulo}
                    </div>
                  </div>
                ))}
                {Array.from({ length: huecosRelleno }).map((_, i) => (
                  <div key={`fill-${i}`} className="aspect-[2/3] rounded-xl bg-rose-500/10 border border-rose-400/30 flex flex-col items-center justify-center p-2 text-center shadow-inner">
                    <Crown className="w-5 h-5 text-amber-400 mb-1 animate-pulse" />
                    <span className="text-[8px] font-mono text-amber-300 font-black tracking-widest uppercase">GALA</span>
                    <strong className="text-xs font-black text-white font-mono">{stats.anio}</strong>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-zinc-500 text-xs">Sin títulos en esta categoría.</div>
            )}

            <div className="mt-3 pt-2 border-t border-rose-500/20 flex justify-between items-center text-[8px] font-mono text-zinc-400">
              <span>🍿 {titulos.length} Obras en cartelera</span>
              <span className="text-[#fbbf24] font-black">#CineRewind{stats.anio}</span>
            </div>
          </div>
        </div>

        {/* Botón de Compartir */}
        <div className="pt-2 border-t border-white/10">
          <button
            onClick={compartirInstagram}
            disabled={procesando}
            className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-pink-500 via-rose-500 to-amber-400 hover:opacity-95 text-white font-black text-xs flex items-center justify-center gap-2 cursor-pointer shadow-xl transition-transform hover:scale-105"
          >
            <Share2 className="w-4 h-4" />
            <span>{procesando ? 'Generando...' : '📸 COMPARTIR EN INSTAGRAM / REDES'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}