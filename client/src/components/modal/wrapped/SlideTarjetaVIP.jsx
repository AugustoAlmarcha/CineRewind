import React, { useState, useRef, useMemo } from 'react';
import { Download, Share2, Copy, Check, Crown, Sparkles } from 'lucide-react';
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
  const [formato, setFormato] = useState('story'); // 'story' (9:16) | 'feed' (4:5)

  const actorFoto = stats.sobres[0]?.foto ? obtenerUrlImagenSegura(stats.sobres[0].foto) : null;
  const actrizFoto = stats.sobres[1]?.foto ? obtenerUrlImagenSegura(stats.sobres[1].foto) : null;
  
  // Dúo estelar inteligente: Si no tiene series, mostramos su Top 1 y Top 2 de películas para que nunca quede un hueco vacío
  const { card1, card2 } = useMemo(() => {
    const topPeli = stats.topPelicula;
    const topSer = stats.topSerie;

    if (topPeli && topSer) {
      return {
        card1: {
          titulo: topPeli.titulo,
          badge: '★ PELÍCULA DEL AÑO',
          foto: topPeli.poster_path ? obtenerUrlImagenSegura(topPeli.poster_path) : null,
          borde: 'border-amber-400',
          textColor: 'text-amber-300',
          bgBadge: 'bg-amber-400 text-black'
        },
        card2: {
          titulo: topSer.titulo,
          badge: '★ SERIE DEL AÑO',
          foto: topSer.poster_path ? obtenerUrlImagenSegura(topSer.poster_path) : null,
          borde: 'border-cyan-400',
          textColor: 'text-cyan-300',
          bgBadge: 'bg-cyan-400 text-black'
        }
      };
    }

    if (topPeli) {
      const segundaPeli = (stats.peliculasVistas || []).find(p => p.titulo !== topPeli.titulo);
      return {
        card1: {
          titulo: topPeli.titulo,
          badge: '★ PELÍCULA DEL AÑO',
          foto: topPeli.poster_path ? obtenerUrlImagenSegura(topPeli.poster_path) : null,
          borde: 'border-amber-400',
          textColor: 'text-amber-300',
          bgBadge: 'bg-amber-400 text-black'
        },
        card2: {
          titulo: segundaPeli?.titulo || 'Favorita Destacada',
          badge: '★ PELÍCULA TOP #2',
          foto: segundaPeli?.poster_path ? obtenerUrlImagenSegura(segundaPeli.poster_path) : null,
          borde: 'border-rose-400',
          textColor: 'text-rose-300',
          bgBadge: 'bg-rose-400 text-black'
        }
      };
    }

    if (topSer) {
      const segundaSerie = (stats.seriesVistas || []).find(s => s.titulo !== topSer.titulo);
      return {
        card1: {
          titulo: topSer.titulo,
          badge: '★ SERIE DEL AÑO',
          foto: topSer.poster_path ? obtenerUrlImagenSegura(topSer.poster_path) : null,
          borde: 'border-cyan-400',
          textColor: 'text-cyan-300',
          bgBadge: 'bg-cyan-400 text-black'
        },
        card2: {
          titulo: segundaSerie?.titulo || 'Serie Destacada',
          badge: '★ SERIE TOP #2',
          foto: segundaSerie?.poster_path ? obtenerUrlImagenSegura(segundaSerie.poster_path) : null,
          borde: 'border-purple-400',
          textColor: 'text-purple-300',
          bgBadge: 'bg-purple-400 text-black'
        }
      };
    }

    return { card1: null, card2: null };
  }, [stats, obtenerUrlImagenSegura]);

  const totalSeriesNum = stats.totalSeries ?? (stats.seriesVistas?.length || 0);

  return (
    <div className="w-full h-full flex flex-col items-center justify-between text-center bg-gradient-to-br from-[#7f1d1d] via-[#4c0519] to-[#20050e] rounded-3xl p-2 sm:p-4 text-white shadow-2xl relative overflow-hidden select-none">
      <PolkaDotsOverlay color="#facc15" opacity={0.15} />
      
      {/* 1. CABECERA Y SELECTOR PROTEGIDOS (NUNCA QUEDAN TAPADOS) */}
      <div className="relative z-30 flex flex-col items-center shrink-0 pt-0.5 mb-1">
        <LogoCineRewind tamano="md" />

        {/* Selector de solo 2 formatos: Historia y Feed */}
        <div className="flex items-center gap-1.5 p-1 bg-black/85 rounded-xl border border-white/25 mt-1 shadow-lg">
          <button
            onClick={() => setFormato('story')}
            className={`px-3 py-1 rounded-lg text-[9px] sm:text-[10px] font-black uppercase transition-all ${
              formato === 'story' ? 'bg-[#facc15] text-black shadow-md' : 'text-zinc-300 hover:text-white'
            }`}
          >
            Historia (9:16)
          </button>
          <button
            onClick={() => setFormato('feed')}
            className={`px-3 py-1 rounded-lg text-[9px] sm:text-[10px] font-black uppercase transition-all ${
              formato === 'feed' ? 'bg-[#facc15] text-black shadow-md' : 'text-zinc-300 hover:text-white'
            }`}
          >
            Feed (4:5)
          </button>
        </div>
      </div>

      {/* 2. TARJETA EDITORIAL VIP CON FONDO CINEMATOGRÁFICO Y ACTORES DESTACADOS */}
      <div className="relative z-10 flex-1 flex items-center justify-center my-auto min-h-0 w-full py-0.5">
        <div 
          ref={cardRef} 
          className={`p-2 sm:p-2.5 rounded-2xl bg-gradient-to-b from-[#2e081d] via-[#1c0828] to-[#0d0216] border-2 border-[#facc15] text-left shadow-2xl flex flex-col justify-between overflow-hidden transition-all ${
            formato === 'story' 
              ? 'w-[240px] sm:w-[275px] aspect-[9/16] max-h-[420px] sm:max-h-[460px]' 
              : 'w-[280px] sm:w-[325px] aspect-[4/5] max-h-[365px] sm:max-h-[405px]'
          }`}
          style={{ boxShadow: '0 0 35px rgba(250,204,21,0.45)' }}
        >
          {/* 1. Encabezado oficial */}
          <div className="flex justify-between items-center border-b border-white/15 pb-1 shrink-0">
            <LogoCineRewind tamano="sm" />
            <div className="flex items-center gap-1 bg-gradient-to-r from-amber-400 to-yellow-300 text-black px-1.5 py-0.5 rounded-full text-[7.5px] sm:text-[8px] font-black uppercase shadow">
              <Crown className="w-2.5 h-2.5 fill-black" />
              <span>GALA VIP {stats.anio}</span>
            </div>
          </div>

          {/* 2. SELLO DESTACADO: DIAGNÓSTICO OFICIAL (PROMINENTE, NUNCA TAPADO) */}
          <div className="my-1 p-1 sm:p-1.5 rounded-xl bg-gradient-to-r from-amber-500/25 via-purple-500/25 to-pink-500/25 border border-amber-400/60 shadow flex items-center justify-between gap-1.5 shrink-0">
            <div className="min-w-0 flex-1">
              <span className="text-[6.5px] font-black uppercase text-amber-300 tracking-wider flex items-center gap-1">
                <Sparkles className="w-2 h-2 fill-amber-300" />
                DIAGNÓSTICO OFICIAL
              </span>
              <h4 className="text-[9px] sm:text-[10px] font-black text-white truncate leading-tight mt-0.5">
                "{stats.arquetipo?.titulo || 'El Jurado de Cannes'}"
              </h4>
            </div>
            <span className="bg-[#facc15] text-black text-[6.5px] font-black px-1.5 py-0.5 rounded shadow uppercase shrink-0">
              OFICIAL
            </span>
          </div>

          {/* 3. DÚO ESTELAR DE CARTELERAS */}
          <div className="grid grid-cols-2 gap-1.5 my-0.5 shrink-0">
            {/* Tarjeta 1 */}
            {card1 && (
              <div className={`relative rounded-lg overflow-hidden border ${card1.borde} bg-black/75 p-0.5 shadow group`}>
                <div className="relative aspect-[3/4] max-h-[88px] sm:max-h-[98px] w-full rounded-md overflow-hidden bg-zinc-950 flex items-center justify-center">
                  {card1.foto ? (
                    <>
                      <img src={card1.foto} alt="" crossOrigin="anonymous" aria-hidden="true" className="absolute inset-0 w-full h-full object-cover blur-sm opacity-35 scale-110" />
                      <img src={card1.foto} alt={card1.titulo} crossOrigin="anonymous" className="relative z-10 w-full h-full object-contain p-0.5 drop-shadow-md" onError={(e) => { e.target.style.display = 'none'; }} />
                    </>
                  ) : (
                    <div className="text-xs">🎬</div>
                  )}
                  <span className={`absolute top-0.5 left-0.5 z-20 ${card1.bgBadge} px-1 py-0.2 rounded text-[6px] font-black uppercase tracking-wider shadow`}>
                    {card1.badge}
                  </span>
                </div>
                <div className="mt-0.5 px-0.5">
                  <span className={`text-[8px] sm:text-[9px] font-black ${card1.textColor} truncate block leading-tight`}>
                    {card1.titulo}
                  </span>
                </div>
              </div>
            )}

            {/* Tarjeta 2 */}
            {card2 && (
              <div className={`relative rounded-lg overflow-hidden border ${card2.borde} bg-black/75 p-0.5 shadow group`}>
                <div className="relative aspect-[3/4] max-h-[88px] sm:max-h-[98px] w-full rounded-md overflow-hidden bg-zinc-950 flex items-center justify-center">
                  {card2.foto ? (
                    <>
                      <img src={card2.foto} alt="" crossOrigin="anonymous" aria-hidden="true" className="absolute inset-0 w-full h-full object-cover blur-sm opacity-35 scale-110" />
                      <img src={card2.foto} alt={card2.titulo} crossOrigin="anonymous" className="relative z-10 w-full h-full object-contain p-0.5 drop-shadow-md" onError={(e) => { e.target.style.display = 'none'; }} />
                    </>
                  ) : (
                    <div className="text-xs">📺</div>
                  )}
                  <span className={`absolute top-0.5 left-0.5 z-20 ${card2.bgBadge} px-1 py-0.2 rounded text-[6px] font-black uppercase tracking-wider shadow`}>
                    {card2.badge}
                  </span>
                </div>
                <div className="mt-0.5 px-0.5">
                  <span className={`text-[8px] sm:text-[9px] font-black ${card2.textColor} truncate block leading-tight`}>
                    {card2.titulo}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* 4. CUADRO DE HONOR: ACTOR TOP Y ACTRIZ TOP (FOTO CUADRADA GRANDE + NOMBRE DEBAJO) */}
          <div className="grid grid-cols-2 gap-1.5 shrink-0 my-0.5">
            {/* ACTOR TOP */}
            <div className="flex flex-col items-center p-1 rounded-xl bg-gradient-to-b from-amber-950/80 to-zinc-950/90 border border-amber-400/60 shadow text-center">
              <span className="text-[6.5px] uppercase font-black text-amber-300 tracking-wider block mb-0.5">★ ACTOR TOP</span>
              <div className="w-full aspect-square max-h-[75px] sm:max-h-[85px] rounded-lg overflow-hidden border border-amber-400 bg-zinc-900 shadow">
                {actorFoto ? (
                  <img src={actorFoto} alt="" crossOrigin="anonymous" className="w-full h-full object-cover" onError={(e) => { e.target.style.display = 'none'; }} />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs">🎭</div>
                )}
              </div>
              <span className="text-[8.5px] sm:text-[9.5px] font-black text-white text-center block mt-0.5 tracking-tight leading-tight truncate w-full px-0.5">
                {stats.sobres[0]?.ganador || 'Sin actor'}
              </span>
            </div>

            {/* ACTRIZ TOP */}
            <div className="flex flex-col items-center p-1 rounded-xl bg-gradient-to-b from-pink-950/80 to-zinc-950/90 border border-pink-400/60 shadow text-center">
              <span className="text-[6.5px] uppercase font-black text-pink-300 tracking-wider block mb-0.5">★ ACTRIZ TOP</span>
              <div className="w-full aspect-square max-h-[75px] sm:max-h-[85px] rounded-lg overflow-hidden border border-pink-400 bg-zinc-900 shadow">
                {actrizFoto ? (
                  <img src={actrizFoto} alt="" crossOrigin="anonymous" className="w-full h-full object-cover" onError={(e) => { e.target.style.display = 'none'; }} />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs">🌟</div>
                )}
              </div>
              <span className="text-[8.5px] sm:text-[9.5px] font-black text-white text-center block mt-0.5 tracking-tight leading-tight truncate w-full px-0.5">
                {stats.sobres[1]?.ganador || 'Sin actriz'}
              </span>
            </div>
          </div>

          {/* 5. 4 MÉTRICAS CON NÚMEROS EXTRA GORDOS / GRUESOS */}
          <div className="grid grid-cols-4 gap-1 py-1 px-1 rounded-xl bg-black/80 border border-white/20 text-center shadow-inner shrink-0 my-0.5">
            <div className="flex flex-col items-center">
              <span className="text-sm sm:text-base md:text-lg font-black font-mono text-yellow-400 leading-none tracking-tight">
                {stats.totalHoras}h
              </span>
              <span className="text-[6.5px] text-zinc-300 uppercase font-black tracking-wider mt-0.5">Horas</span>
            </div>
            <div className="flex flex-col items-center border-l border-white/10">
              <span className="text-sm sm:text-base md:text-lg font-black font-mono text-purple-300 leading-none tracking-tight">
                {totalSeriesNum}
              </span>
              <span className="text-[6.5px] text-zinc-300 uppercase font-black tracking-wider mt-0.5">Series</span>
            </div>
            <div className="flex flex-col items-center border-l border-white/10">
              <span className="text-sm sm:text-base md:text-lg font-black font-mono text-amber-300 leading-none tracking-tight">
                {stats.totalPeliculas}
              </span>
              <span className="text-[6.5px] text-zinc-300 uppercase font-black tracking-wider mt-0.5">Pelis</span>
            </div>
            <div className="flex flex-col items-center border-l border-white/10">
              <span className="text-sm sm:text-base md:text-lg font-black font-mono text-cyan-300 leading-none tracking-tight">
                {stats.totalEpisodios}
              </span>
              <span className="text-[6.5px] text-zinc-300 uppercase font-black tracking-wider mt-0.5">Caps</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. BOTONES DE ACCIÓN VISIBLES */}
      <div className="relative z-30 flex items-center justify-center gap-1.5 shrink-0 pb-1 sm:pb-2 w-full max-w-sm pt-1">
        <button
          onClick={() => descargarElemento(cardRef, `CineRewind-Resumen-VIP-${formato}-${stats.anio}`)}
          disabled={descargando}
          className="flex-1 py-2 px-3 rounded-xl font-black text-[11px] sm:text-xs text-black bg-[#facc15] hover:bg-[#eab308] flex items-center justify-center gap-1.5 cursor-pointer shadow-lg transition-transform hover:scale-102"
        >
          <Download className="w-3.5 h-3.5 stroke-[3]" />
          <span>{descargando ? 'Generando...' : 'Descargar'}</span>
        </button>
        <button
          onClick={() => compartirEnRedes(cardRef, `CineRewind-Resumen-${stats.anio}`)}
          className="py-2 px-3 rounded-xl font-black text-[11px] sm:text-xs text-white bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 flex items-center justify-center gap-1 cursor-pointer shadow"
          title="Compartir Historia en Redes"
        >
          <Share2 className="w-3.5 h-3.5" />
          <span>Compartir</span>
        </button>
        <button
          onClick={copiarResumen}
          className="py-2 px-3 rounded-xl font-black text-[11px] sm:text-xs text-white bg-black/70 hover:bg-black border border-white/20 flex items-center justify-center gap-1 cursor-pointer"
          title="Copiar texto resumen"
        >
          {copiado ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
        </button>
      </div>
    </div>
  );
}
