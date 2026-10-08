import React from 'react';
import { Film, Calendar, Sparkles, ArrowRight } from 'lucide-react';

export default function SlidePrimerPlay({ stats, obtenerUrlImagenSegura, onSiguiente }) {
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
        // Si dice 31 de diciembre (desfase) o 1 de enero, aseguramos "1 de enero"
        if (mesNum === 12 && diaNum === 31) {
          return '1 de enero';
        }
        if (meses[mesNum - 1]) {
          return `${diaNum} de ${meses[mesNum - 1]}`;
        }
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
    <div className="w-full h-full flex flex-col items-center justify-between text-center bg-gradient-to-b from-[#131127] via-[#0b0a17] to-[#04040a] rounded-3xl p-4 sm:p-6 relative overflow-hidden text-white shadow-2xl select-none">
      <style>{`
        @keyframes floatTicket {
          0%, 100% {
            transform: translateY(0px) rotate(-0.5deg);
          }
          50% {
            transform: translateY(-8px) rotate(0.8deg);
          }
        }
        @keyframes warmAmbientGlow {
          0%, 100% {
            opacity: 0.3;
            transform: scale(0.95);
          }
          50% {
            opacity: 0.6;
            transform: scale(1.08);
          }
        }
      `}</style>

      {/* 1. RESPLANDORES AMBIENTALES Y TEXTURA */}
      <div 
        className="absolute -top-20 left-1/2 -translate-x-1/2 w-[340px] sm:w-[460px] h-[340px] sm:h-[460px] rounded-full bg-amber-500/15 blur-[90px] pointer-events-none -z-0"
        style={{ animation: 'warmAmbientGlow 8s ease-in-out infinite' }}
      />
      <div className="absolute -bottom-24 -right-16 w-72 h-72 rounded-full bg-rose-600/15 blur-3xl pointer-events-none -z-0" />

      {/* 2. CABECERA: BRANDING EDITORIAL (#MiCineRewindAño) */}
      <div className="relative z-10 flex flex-col items-center shrink-0 pt-1 sm:pt-2">
        <span className="text-base sm:text-lg font-black tracking-tight text-white drop-shadow-md mb-1.5">
          #MiCineRewindAño
        </span>
        <span className="text-[10px] sm:text-xs uppercase font-black tracking-[0.25em] text-amber-300 bg-amber-500/10 border border-amber-500/25 px-3.5 py-0.5 rounded-full shadow-sm">
          EL PRIMER PLAY DEL AÑO
        </span>
      </div>

      {/* 3. HERO: TÍTULO Y BOLETO CINEMATOGRÁFICO DE APERTURA */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center w-full max-w-sm sm:max-w-md min-h-0 px-2 my-auto">
        <div className="mb-3 text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight leading-tight">
            ¿Recuerdas cómo arrancó<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-orange-300 to-rose-300">
              tu {stats.anio}?
            </span>
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Todo este viaje comenzó con un primer fotograma.
          </p>
        </div>

        {/* TARJETA TICKET DE CINE / BOLETO INAUGURAL */}
        <div 
          className="relative w-full max-w-[320px] sm:max-w-[340px] p-4 rounded-3xl bg-zinc-950/85 border border-amber-400/35 backdrop-blur-xl shadow-[0_20px_50px_rgba(0,0,0,0.85)] flex flex-col items-center text-center transition-all"
          style={{ animation: 'floatTicket 6s ease-in-out infinite' }}
        >
          {/* Muescas laterales de boleto de cine */}
          <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-[#0b0a17] border-r border-amber-400/30" />
          <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-[#0b0a17] border-l border-amber-400/30" />

          {/* Badge superior de fecha */}
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] sm:text-xs font-mono font-bold text-amber-300 mb-3">
            <Calendar className="w-3 h-3 text-amber-400" />
            <span>{fechaFormateada ? `Visto el ${fechaFormateada}` : `Función inaugural de ${stats.anio}`}</span>
          </div>

          {/* Póster con marco cinematográfico */}
          <div className="relative w-28 sm:w-32 aspect-[2/3] rounded-xl overflow-hidden bg-zinc-900 border-2 border-amber-400/50 shadow-[0_10px_30px_rgba(245,158,11,0.25)] mb-3">
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
                <Film className="w-8 h-8 mb-1 text-amber-400" />
                <span className="text-[10px] font-bold">Sin Póster</span>
              </div>
            )}
          </div>

          {/* Título y detalle */}
          <div className="w-full px-2">
            <span className="text-[9px] font-mono uppercase font-bold text-amber-400 tracking-wider block mb-0.5">
              {esSerie ? '📺 PRIMER CAPÍTULO REPRODUCIDO' : '🎬 PRIMERA PELÍCULA REPRODUCIDA'}
            </span>
            <h3 className="text-base sm:text-lg font-black text-white uppercase tracking-tight leading-snug line-clamp-2">
              {primerPlay?.titulo || 'Tu Primera Historia'}
            </h3>
            {esSerie && (primerPlay?.temporada || primerPlay?.episodio) && (
              <span className="text-[10px] font-mono text-zinc-400 block mt-0.5">
                Temporada {primerPlay?.temporada || 1} · Episodio {primerPlay?.episodio || 1}
              </span>
            )}
          </div>

          {/* Frase nostálgica */}
          <div className="mt-3 pt-2.5 border-t border-white/10 w-full text-[11px] sm:text-xs text-zinc-300 italic">
            "Le diste play, te acomodaste en el sillón... y encendiste el año."
          </div>
        </div>
      </div>

      {/* 4. BOTÓN DE ACCIÓN */}
      <div className="relative z-10 shrink-0 pb-1 sm:pb-2 pt-1">
        <button 
          onClick={onSiguiente} 
          className="group inline-flex items-center gap-2 px-7 sm:px-9 py-2.5 sm:py-3 rounded-full bg-gradient-to-r from-amber-400 via-orange-400 to-rose-400 hover:from-amber-300 hover:to-rose-300 text-black font-black text-xs sm:text-sm uppercase tracking-wide cursor-pointer shadow-[0_10px_30px_rgba(245,158,11,0.35)] transition-all hover:scale-105 active:scale-95"
        >
          <span>¿Y qué vino después?</span>
          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
        </button>
      </div>
    </div>
  );
}
