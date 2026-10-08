import React, { useState } from 'react';
import { Tv, Film, ChevronLeft, ChevronRight, ArrowRight, Crown, Flame } from 'lucide-react';

export default function SlideTopSeriesRanking({ stats, obtenerUrlImagenSegura, onSiguiente }) {
  // Obtenemos hasta las 5 mejores series (o películas como fallback si no vio series)
  const items = React.useMemo(() => {
    if (stats?.seriesVistas && stats.seriesVistas.length > 0) {
      return stats.seriesVistas.slice(0, 5).map((s, idx) => ({
        ...s,
        tipoNombre: 'serie',
        posicion: idx + 1,
        conteo: s.episodios_vistos || 1,
        etiquetaConteo: 'capítulos devorados'
      }));
    }
    if (stats?.peliculasVistas && stats.peliculasVistas.length > 0) {
      return stats.peliculasVistas.slice(0, 5).map((p, idx) => ({
        ...p,
        tipoNombre: 'película',
        posicion: idx + 1,
        conteo: p.veces_vista || 1,
        etiquetaConteo: 'veces reproducida'
      }));
    }
    return [];
  }, [stats]);

  // Posición seleccionada en el top (por defecto comenzamos mostrando el top 1 o el top más bajo)
  // Iniciamos en 0 (el #1) pero permitimos recorrer fácilmente todo el podio
  const [indiceActivo, setIndiceActivo] = useState(0);

  const itemActual = items[indiceActivo] || items[0] || null;
  const esSerie = itemActual?.tipoNombre !== 'película';

  const coloresPosicion = [
    { text: 'text-amber-400', border: 'border-amber-400/50', bg: 'bg-amber-400/10', glow: 'rgba(245, 158, 11, 0.35)', badge: 'bg-amber-400 text-black' },
    { text: 'text-slate-300', border: 'border-slate-300/40', bg: 'bg-slate-300/10', glow: 'rgba(203, 213, 225, 0.25)', badge: 'bg-slate-300 text-black' },
    { text: 'text-amber-600', border: 'border-amber-600/40', bg: 'bg-amber-600/10', glow: 'rgba(217, 119, 6, 0.25)', badge: 'bg-amber-600 text-white' },
    { text: 'text-cyan-400', border: 'border-cyan-400/35', bg: 'bg-cyan-400/10', glow: 'rgba(6, 182, 212, 0.25)', badge: 'bg-cyan-400 text-black' },
    { text: 'text-violet-400', border: 'border-violet-400/35', bg: 'bg-violet-400/10', glow: 'rgba(139, 92, 246, 0.25)', badge: 'bg-violet-400 text-black' }
  ];

  const estiloActual = coloresPosicion[indiceActivo] || coloresPosicion[0];

  return (
    <div className="w-full h-full flex flex-col items-center justify-between text-center bg-gradient-to-b from-[#0b0f19] via-[#070a12] to-[#030509] rounded-3xl p-3 sm:p-5 relative overflow-hidden text-white shadow-2xl select-none">
      <style>{`
        @keyframes podioGlow {
          0%, 100% {
            opacity: 0.35;
            transform: scale(0.96);
          }
          50% {
            opacity: 0.7;
            transform: scale(1.04);
          }
        }
      `}</style>

      {/* 1. RESPLANDOR AMBIENTAL DINÁMICO */}
      <div 
        className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[340px] sm:w-[460px] h-[340px] sm:h-[460px] rounded-full blur-[100px] pointer-events-none -z-0 transition-all duration-700"
        style={{ 
          backgroundColor: estiloActual.glow,
          animation: 'podioGlow 7s ease-in-out infinite' 
        }}
      />

      {/* 2. CABECERA: BRANDING EDITORIAL (#MiCineRewindAño) */}
      <div className="relative z-10 flex flex-col items-center shrink-0 pt-1">
        <span className="text-base sm:text-lg font-black tracking-tight text-white drop-shadow-md mb-1">
          #MiCineRewindAño
        </span>
        <div className="flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/25 text-[10px] sm:text-xs font-mono font-black text-cyan-300">
          <Tv className="w-3 h-3 text-cyan-400" />
          <span>PODIO DE SERIES MARATONEADAS</span>
        </div>
      </div>

      {/* 3. HERO: NAVEGADOR DE TOP 5 ESTILO DEEZER */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center w-full max-w-sm sm:max-w-md min-h-0 px-2 my-auto">
        {/* SELECTOR DE PUESTOS (TOP 5 AL TOP 1) */}
        <div className="flex items-center justify-center gap-1.5 sm:gap-2 mb-3 w-full">
          {items.map((it, idx) => {
            const activo = idx === indiceActivo;
            return (
              <button
                key={idx}
                onClick={() => setIndiceActivo(idx)}
                className={`flex-1 py-1 sm:py-1.5 px-1 rounded-xl text-[10px] sm:text-xs font-mono font-black transition-all cursor-pointer border ${
                  activo 
                    ? `${coloresPosicion[idx].badge} border-white shadow-lg scale-105` 
                    : 'bg-white/5 border-white/10 text-zinc-400 hover:text-white hover:bg-white/10'
                }`}
              >
                #{idx + 1} {idx === 0 && '👑'}
              </button>
            );
          })}
        </div>

        {/* TARJETA DESTACADA DEL PUESTO ACTUAL */}
        {itemActual ? (
          <div className="relative w-full max-w-[310px] sm:max-w-[340px] p-3.5 sm:p-4 rounded-3xl bg-zinc-950/85 border border-white/15 backdrop-blur-xl shadow-2xl flex flex-col items-center text-center transition-all">
            {/* NÚMERO DE POSICIÓN MONUMENTAL DE FONDO */}
            <div className={`absolute top-2 right-4 text-6xl sm:text-7xl font-black font-sans opacity-25 select-none pointer-events-none ${estiloActual.text}`}>
              #{itemActual.posicion}
            </div>

            {/* Badge de Posición */}
            <div className="flex items-center gap-1.5 mb-2.5">
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-black uppercase ${estiloActual.badge}`}>
                {itemActual.posicion === 1 ? '👑 PUESTO #1 ABSOLUTO' : `TOP #${itemActual.posicion} DEL AÑO`}
              </span>
            </div>

            {/* Póster con marco y halo de color */}
            <div className="relative w-28 sm:w-32 aspect-[2/3] rounded-2xl overflow-hidden bg-zinc-900 border-2 border-white/20 shadow-xl mb-3">
              {itemActual.poster_path ? (
                <>
                  <img 
                    src={obtenerUrlImagenSegura(itemActual.poster_path)} 
                    alt="" 
                    crossOrigin="anonymous" 
                    aria-hidden="true" 
                    className="absolute inset-0 w-full h-full object-cover blur-sm opacity-40 scale-110" 
                  />
                  <img 
                    src={obtenerUrlImagenSegura(itemActual.poster_path)} 
                    alt={itemActual.titulo} 
                    crossOrigin="anonymous" 
                    className="relative z-10 w-full h-full object-cover" 
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                </>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center p-2 text-zinc-500">
                  <Tv className="w-8 h-8 mb-1 text-cyan-400" />
                  <span className="text-[10px] font-bold">Sin Póster</span>
                </div>
              )}
            </div>

            {/* Título y Estadística */}
            <div className="w-full px-1">
              <h3 className="text-base sm:text-lg font-black text-white uppercase tracking-tight leading-snug line-clamp-1 mb-1">
                {itemActual.titulo}
              </h3>

              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/5 border border-white/10 text-xs font-mono">
                <Flame className={`w-3.5 h-3.5 ${estiloActual.text}`} />
                <strong className={`font-black ${estiloActual.text}`}>
                  {itemActual.conteo}
                </strong>
                <span className="text-zinc-300 text-[11px]">{itemActual.etiquetaConteo}</span>
              </div>
            </div>

            {/* Mini controles previo / siguiente para interactuar cómodamente */}
            <div className="flex items-center justify-between w-full pt-3 mt-2 border-t border-white/10 text-xs text-zinc-400">
              <button
                onClick={() => setIndiceActivo((prev) => (prev > 0 ? prev - 1 : items.length - 1))}
                className="hover:text-white p-1 rounded-lg hover:bg-white/5 transition-all flex items-center gap-1 cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Anterior</span>
              </button>
              <span className="text-[10px] font-mono text-zinc-500">
                {indiceActivo + 1} de {items.length}
              </span>
              <button
                onClick={() => setIndiceActivo((prev) => (prev < items.length - 1 ? prev + 1 : 0))}
                className="hover:text-white p-1 rounded-lg hover:bg-white/5 transition-all flex items-center gap-1 cursor-pointer"
              >
                <span>Siguiente</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-zinc-400">No registraste series en este año.</p>
        )}
      </div>

      {/* 4. BOTÓN DE ACCIÓN */}
      <div className="relative z-10 shrink-0 pb-1 sm:pb-2 pt-1">
        <button 
          onClick={onSiguiente} 
          className="group inline-flex items-center gap-2 px-8 sm:px-10 py-2.5 sm:py-3 rounded-full bg-cyan-400 hover:bg-cyan-300 text-black font-black text-xs sm:text-sm uppercase tracking-wide cursor-pointer shadow-[0_10px_30px_rgba(6,182,212,0.3)] transition-all hover:scale-105 active:scale-95"
        >
          <span>Coronar a tu Serie #1</span>
          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
        </button>
      </div>
    </div>
  );
}
