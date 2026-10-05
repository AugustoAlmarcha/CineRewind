import React, { useState, useRef } from 'react';
import { Download, Share2, Copy, Check, Crown, Tv, Film } from 'lucide-react';
import { PolkaDotsOverlay } from '../../SpotifyDecorations';
import LogoCineRewind from './LogoCineRewind';

export default function SlideTarjetaVIP({
  stats,
  obtenerUrlImagenSegura,
  descargarElemento,
  compartirEnRedes,
  copiarResumen,
  copiado,
  descargando
}) {
  const cardRef = useRef(null);
  const [formato, setFormato] = useState('story'); // 'story' (9:16) | 'feed' (1:1) | 'post45' (4:5)

  const actorFoto = stats.sobres[0]?.foto ? obtenerUrlImagenSegura(stats.sobres[0].foto) : null;
  const actrizFoto = stats.sobres[1]?.foto ? obtenerUrlImagenSegura(stats.sobres[1].foto) : null;
  const serieFoto = stats.topSerie?.poster_path ? obtenerUrlImagenSegura(stats.topSerie.poster_path) : null;
  const peliculaFoto = stats.topPelicula?.poster_path ? obtenerUrlImagenSegura(stats.topPelicula.poster_path) : null;

  return (
    <div className="w-full h-full flex flex-col items-center justify-between text-center bg-gradient-to-br from-[#7f1d1d] via-[#991b1b] to-[#450a0a] rounded-3xl p-2 sm:p-4 text-white shadow-2xl overflow-y-auto">
      <PolkaDotsOverlay color="#facc15" opacity={0.15} />
      
      <div className="relative z-10 flex flex-col items-center max-w-md w-full my-auto">
        {/* Logo Oficial CineRewind */}
        <div className="mb-1">
          <LogoCineRewind tamano="md" />
        </div>

        {/* Selector de Formatos de Redes Sociales: 9:16 / 1:1 / 4:5 */}
        <div className="flex items-center gap-1.5 p-1 bg-black/85 rounded-xl border border-white/20 mb-2 shadow-lg">
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
          <button
            onClick={() => setFormato('post45')}
            className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase transition-all ${
              formato === 'post45' ? 'bg-[#facc15] text-black shadow' : 'text-zinc-300 hover:text-white'
            }`}
          >
            Feed (4:5)
          </button>
        </div>

        {/* TARJETA DESCARGABLE VIP EN VERDADERO 9:16, 1:1 O 4:5 */}
        <div 
          ref={cardRef} 
          className={`p-3.5 sm:p-4 rounded-3xl bg-gradient-to-b from-[#1c1214] via-[#120b0c] to-[#0a0506] border-3 border-[#facc15] text-left mb-2 shadow-2xl flex flex-col justify-between overflow-hidden transition-all ${
            formato === 'story' 
              ? 'w-[320px] sm:w-[340px] aspect-[9/16]' 
              : formato === 'post45' 
                ? 'w-[320px] sm:w-[350px] aspect-[4/5]' 
                : 'w-[320px] sm:w-[360px] aspect-square'
          }`}
          style={{ boxShadow: '0 0 35px rgba(250,204,21,0.45)' }}
        >
          {/* Encabezado con Logotipo CineRewind */}
          <div className="flex justify-between items-center border-b border-white/10 pb-2 mb-1 shrink-0">
            <LogoCineRewind tamano="sm" />
            <div className="flex items-center gap-1 bg-[#facc15] text-black px-2.5 py-0.5 rounded-full text-[9px] sm:text-[10px] font-black uppercase shadow">
              <Crown className="w-3 h-3 fill-black" />
              <span>GALA VIP {stats.anio}</span>
            </div>
          </div>

          {/* MATRIZ 2x2: FOTO COMPLETA SIEMPRE, SIN ZOOM EXTRAÑO EN LOS OJOS */}
          <div className="grid grid-cols-2 gap-2 my-auto">
            {/* 1. Top Serie */}
            <div className="text-center group">
              <div className="w-full aspect-[2/3] rounded-xl overflow-hidden border-2 border-cyan-400 bg-zinc-950 shadow-md relative flex items-center justify-center">
                {serieFoto ? (
                  <>
                    <img 
                      src={serieFoto} 
                      alt="" 
                      aria-hidden="true" 
                      className="absolute inset-0 w-full h-full object-cover blur-sm opacity-30" 
                    />
                    <img 
                      src={serieFoto} 
                      alt={stats.topSerie?.titulo || 'Serie'} 
                      crossOrigin="anonymous"
                      className="relative z-10 w-full h-full object-contain" 
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-zinc-900 text-xs">📺</div>
                )}
                <span className="absolute top-1 left-1 z-20 bg-cyan-400 text-black px-1.5 py-0.5 rounded text-[7.5px] font-black uppercase shadow">
                  TOP SERIE
                </span>
              </div>
              <span className="text-[9px] font-black text-cyan-400 block mt-1 truncate uppercase">
                {stats.topSerie?.titulo || 'Serie Destacada'}
              </span>
            </div>

            {/* 2. Top Película */}
            <div className="text-center group">
              <div className="w-full aspect-[2/3] rounded-xl overflow-hidden border-2 border-amber-400 bg-zinc-950 shadow-md relative flex items-center justify-center">
                {peliculaFoto ? (
                  <>
                    <img 
                      src={peliculaFoto} 
                      alt="" 
                      aria-hidden="true" 
                      className="absolute inset-0 w-full h-full object-cover blur-sm opacity-30" 
                    />
                    <img 
                      src={peliculaFoto} 
                      alt={stats.topPelicula?.titulo || 'Película'} 
                      crossOrigin="anonymous"
                      className="relative z-10 w-full h-full object-contain" 
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-zinc-900 text-xs">🎬</div>
                )}
                <span className="absolute top-1 left-1 z-20 bg-amber-400 text-black px-1.5 py-0.5 rounded text-[7.5px] font-black uppercase shadow">
                  TOP PELÍCULA
                </span>
              </div>
              <span className="text-[9px] font-black text-amber-400 block mt-1 truncate uppercase">
                {stats.topPelicula?.titulo || 'Película Destacada'}
              </span>
            </div>

            {/* 3. Actor Top (Foto COMPLETA sin zoom extremo en los ojos) */}
            <div className="text-center group">
              <div className="w-full aspect-[2/3] rounded-xl overflow-hidden border-2 border-yellow-400 bg-zinc-950 shadow-md relative flex items-center justify-center">
                {actorFoto ? (
                  <>
                    <img 
                      src={actorFoto} 
                      alt="" 
                      aria-hidden="true" 
                      className="absolute inset-0 w-full h-full object-cover blur-sm opacity-30" 
                    />
                    <img 
                      src={actorFoto} 
                      alt={stats.sobres[0]?.ganador} 
                      crossOrigin="anonymous"
                      className="relative z-10 w-full h-full object-contain" 
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-zinc-900 text-xs">🎭</div>
                )}
                <span className="absolute top-1 left-1 z-20 bg-yellow-400 text-black px-1.5 py-0.5 rounded text-[7.5px] font-black uppercase shadow">
                  ACTOR TOP
                </span>
              </div>
              <span className="text-[9px] font-black text-yellow-300 block mt-1 truncate uppercase">
                {stats.sobres[0]?.ganador}
              </span>
            </div>

            {/* 4. Actriz Top (Foto COMPLETA sin zoom extremo en los ojos) */}
            <div className="text-center group">
              <div className="w-full aspect-[2/3] rounded-xl overflow-hidden border-2 border-pink-400 bg-zinc-950 shadow-md relative flex items-center justify-center">
                {actrizFoto ? (
                  <>
                    <img 
                      src={actrizFoto} 
                      alt="" 
                      aria-hidden="true" 
                      className="absolute inset-0 w-full h-full object-cover blur-sm opacity-30" 
                    />
                    <img 
                      src={actrizFoto} 
                      alt={stats.sobres[1]?.ganador} 
                      crossOrigin="anonymous"
                      className="relative z-10 w-full h-full object-contain" 
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-zinc-900 text-xs">🌟</div>
                )}
                <span className="absolute top-1 left-1 z-20 bg-pink-400 text-white px-1.5 py-0.5 rounded text-[7.5px] font-black uppercase shadow">
                  ACTRIZ TOP
                </span>
              </div>
              <span className="text-[9px] font-black text-pink-300 block mt-1 truncate uppercase">
                {stats.sobres[1]?.ganador}
              </span>
            </div>
          </div>

          {/* Bloques de Métricas: Horas, Capítulos y RESEÑAS HECHAS */}
          <div className="grid grid-cols-3 gap-1.5 py-1.5 px-2 rounded-2xl bg-zinc-900/90 border border-white/15 text-center my-1 shadow-inner shrink-0">
            <div className="flex flex-col items-center">
              <span className="text-base sm:text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-yellow-400 font-mono tracking-tight leading-tight">
                {stats.totalHoras}h
              </span>
              <span className="text-[7.5px] sm:text-[8px] text-zinc-300 uppercase font-black tracking-wider">Horas</span>
            </div>
            <div className="flex flex-col items-center border-x border-white/10">
              <span className="text-base sm:text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-sky-400 font-mono tracking-tight leading-tight">
                {stats.totalEpisodios}
              </span>
              <span className="text-[7.5px] sm:text-[8px] text-zinc-300 uppercase font-black tracking-wider">Capítulos</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-base sm:text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-rose-400 font-mono tracking-tight leading-tight">
                {stats.totalResenias}
              </span>
              <span className="text-[7.5px] sm:text-[8px] text-zinc-300 uppercase font-black tracking-wider">Reseñas</span>
            </div>
          </div>

          {/* Arquetipo banner protegido contra recortes */}
          <div className="p-1.5 sm:p-2 rounded-xl bg-zinc-950 border border-white/10 flex justify-between items-center text-xs shadow-md shrink-0">
            <span className="text-[9px] sm:text-[10px] font-mono text-amber-200 uppercase font-bold truncate max-w-[170px]">
              "{stats.arquetipo.titulo}"
            </span>
            <span className="text-[8px] font-black text-black bg-[#facc15] px-2 py-0.5 rounded-full shrink-0 shadow">
              #CINEREWIND{stats.anio}
            </span>
          </div>
        </div>

        {/* Botones de acción finales */}
        <div className="flex items-center gap-2 w-full max-w-sm">
          <button
            onClick={() => descargarElemento(cardRef, `CineRewind-Resumen-VIP-${formato}-${stats.anio}`)}
            disabled={descargando}
            className="flex-1 py-2.5 px-3 rounded-xl font-black text-xs text-black bg-[#facc15] hover:bg-[#eab308] flex items-center justify-center gap-1.5 cursor-pointer shadow-lg transition-transform hover:scale-102"
          >
            <Download className="w-3.5 h-3.5 stroke-[3]" />
            <span>{descargando ? 'Generando...' : 'Descargar Foto'}</span>
          </button>
          <button
            onClick={() => compartirEnRedes(cardRef, `CineRewind-Resumen-${stats.anio}`)}
            className="py-2.5 px-3 rounded-xl font-black text-xs text-white bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 flex items-center justify-center gap-1.5 cursor-pointer shadow-lg"
            title="Compartir Historia en Redes"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Compartir</span>
          </button>
          <button
            onClick={copiarResumen}
            className="py-2.5 px-3 rounded-xl font-black text-xs text-white bg-black/70 hover:bg-black border border-white/20 flex items-center justify-center gap-1.5 cursor-pointer"
            title="Copiar texto resumen"
          >
            {copiado ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>
    </div>
  );
}