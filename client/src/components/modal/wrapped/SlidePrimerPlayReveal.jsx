import React from 'react';
import { Film, Calendar, ArrowRight } from 'lucide-react';

export default function SlidePrimerPlayReveal({ stats, obtenerUrlImagenSegura, onSiguiente }) {
  const primerPlay = stats?.primerPlay || (stats?.todasLasObras?.length > 0 ? stats.todasLasObras[0] : null);

  const formatearFecha = (fechaStr) => {
    if (!fechaStr) return '1 de enero';
    try {
      const limpio = String(fechaStr).split('T')[0].trim();
      const partes = limpio.split('-');
      if (partes.length === 3) {
        const mesNum = parseInt(partes[1], 10);
        const diaNum = parseInt(partes[2], 10);
        const meses = [
          'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
          'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
        ];
        if (mesNum === 12 && diaNum === 31) return '1 de enero';
        if (meses[mesNum - 1]) return `${diaNum} de ${meses[mesNum - 1]}`;
      }
      return '1 de enero';
    } catch {
      return '1 de enero';
    }
  };

  const fechaFormateada = formatearFecha(primerPlay?.fecha_visto);
  const esSerie = primerPlay?.tipo === 'serie' || Boolean(primerPlay?.temporada || primerPlay?.episodio);
  const posterUrl = primerPlay?.poster_path ? obtenerUrlImagenSegura(primerPlay.poster_path) : null;

  return (
    <div className="w-full h-full flex flex-col items-center justify-between text-center bg-gradient-to-b from-[#181308] via-[#0b0a13] to-[#040407] rounded-3xl p-4 sm:p-6 relative overflow-hidden text-white shadow-2xl select-none">
      <style>{`
        @keyframes floatBigPoster {
          0%, 100% {
            transform: translateY(0px) scale(1);
          }
          50% {
            transform: translateY(-6px) scale(1.02);
          }
        }
        @keyframes warmAmbientGlow {
          0%, 100% {
            opacity: 0.35;
            transform: scale(0.96);
          }
          50% {
            opacity: 0.7;
            transform: scale(1.06);
          }
        }
      `}</style>

      {/* 1. RESPLANDOR AMBIENTAL CÁLIDO */}
      <div 
        className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[340px] sm:w-[500px] h-[340px] sm:h-[500px] rounded-full bg-amber-500/20 blur-[100px] pointer-events-none -z-0"
        style={{ animation: 'warmAmbientGlow 7s ease-in-out infinite' }}
      />

      {/* 2. CABECERA: BRANDING EDITORIAL (#MiCineRewindAño) */}
      <div className="relative z-10 flex flex-col items-center shrink-0 pt-1 sm:pt-2">
        <span className="text-base sm:text-lg font-black tracking-tight text-white drop-shadow-md mb-1.5">
          #MiCineRewindAño
        </span>
        <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-amber-400/10 border border-amber-400/25 text-[10px] sm:text-xs font-mono font-bold text-amber-300 shadow-sm">
          <Calendar className="w-3 h-3 text-amber-400" />
          <span>VISTO EL {fechaFormateada.toUpperCase()}</span>
        </div>
      </div>

      {/* 3. HERO: PÓSTER MUCHO MÁS GRANDE + TÍTULO LIMPIO SIN EMOJI DE TV */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center w-full max-w-sm sm:max-w-md min-h-0 px-2 my-auto">
        {/* PÓSTER PROTAGONISTA EN GRAN FORMATO */}
        <div 
          className="relative w-44 xs:w-48 sm:w-56 md:w-60 aspect-[2/3] rounded-2xl sm:rounded-3xl overflow-hidden bg-zinc-900 border-2 sm:border-3 border-amber-400/60 shadow-[0_20px_50px_rgba(245,158,11,0.35)] mb-3 transition-all"
          style={{ animation: 'floatBigPoster 6s ease-in-out infinite' }}
        >
          {posterUrl ? (
            <>
              <img 
                src={posterUrl} 
                alt="" 
                crossOrigin="anonymous" 
                aria-hidden="true" 
                className="absolute inset-0 w-full h-full object-cover blur-sm opacity-40 scale-110" 
              />
              <img 
                src={posterUrl} 
                alt={primerPlay?.titulo || 'Primera obra'} 
                crossOrigin="anonymous" 
                className="relative z-10 w-full h-full object-cover" 
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            </>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center p-2 text-zinc-500">
              <Film className="w-12 h-12 mb-2 text-amber-400" />
              <span className="text-xs font-bold text-zinc-400">Sin Póster</span>
            </div>
          )}
        </div>

        {/* TÍTULO Y DETALLES */}
        <div className="w-full text-center px-2">
          <span className="text-[10px] sm:text-xs font-mono uppercase font-black text-amber-400 tracking-widest block mb-1">
            {esSerie ? 'PRIMER CAPÍTULO REPRODUCIDO' : 'PRIMERA PELÍCULA REPRODUCIDA'}
          </span>
          <h3 className="text-xl sm:text-2xl md:text-3xl font-black text-white uppercase tracking-tight leading-snug drop-shadow-md">
            {primerPlay?.titulo || 'Tu Primera Historia'}
          </h3>
          {esSerie && (primerPlay?.temporada || primerPlay?.episodio) && (
            <span className="text-xs sm:text-sm font-mono text-zinc-300 font-semibold block mt-1">
              Temporada {primerPlay?.temporada || 1} · Episodio {primerPlay?.episodio || 1}
            </span>
          )}
          <p className="text-xs text-zinc-400 italic mt-2">
            "Le diste play, te acomodaste en el sillón... y encendiste el año."
          </p>
        </div>
      </div>

      {/* 4. BOTÓN DE ACCIÓN */}
      <div className="relative z-10 shrink-0 pb-1 sm:pb-2 pt-1">
        <button 
          onClick={onSiguiente} 
          className="group inline-flex items-center gap-2 px-8 sm:px-10 py-2.5 sm:py-3 rounded-full bg-gradient-to-r from-amber-400 via-orange-400 to-rose-400 hover:from-amber-300 hover:to-rose-300 text-black font-black text-xs sm:text-sm uppercase tracking-wide cursor-pointer shadow-[0_10px_30px_rgba(245,158,11,0.35)] transition-all hover:scale-105 active:scale-95"
        >
          <span>¿Y qué vino después?</span>
          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
        </button>
      </div>
    </div>
  );
}
