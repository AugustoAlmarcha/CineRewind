import React, { useRef } from 'react';
import { Share2, Film, Tv, ArrowRight } from 'lucide-react';

export default function SlideTop5Collage({
  stats,
  items = [], // Array de hasta 5 obras [1, 2, 3, 4, 5]
  tipo = 'series', // 'series' | 'peliculas'
  obtenerUrlImagenSegura,
  descargarElemento,
  compartirEnRedes,
  descargando,
  onSiguiente
}) {
  const tarjetaRef = useRef(null);
  const esPeliculas = tipo === 'peliculas';
  const anio = stats?.anio || new Date().getFullYear();

  // Aseguramos hasta 5 elementos ordenados 1 al 5
  const top5 = items.slice(0, 5);
  const item1 = top5[0];
  const item2 = top5[1];
  const item3 = top5[2];
  const item4 = top5[3];
  const item5 = top5[4];

  // Configuración de estilo cinematográfico por tipo (Series vs Películas)
  const config = esPeliculas ? {
    bgGradient: 'bg-gradient-to-b from-[#2a0e05] via-[#170602] to-[#0a0301]',
    pillBg: 'bg-orange-500/20 border-orange-400/40 text-orange-200',
    accentColor: 'text-orange-400',
    titulo: 'TUS PELÍCULAS MÁS VISTAS',
    metricaLabel: (it) => `${it?.veces_vista || 1} ${it?.veces_vista === 1 ? 'función' : 'funciones'}`
  } : {
    bgGradient: 'bg-gradient-to-b from-[#220a35] via-[#120421] to-[#090212]',
    pillBg: 'bg-purple-500/20 border-purple-400/40 text-purple-200',
    accentColor: 'text-amber-400',
    titulo: 'TUS SERIES MÁS VISTAS',
    metricaLabel: (it) => `${it?.episodios_vistos || 1} capítulos vistos`
  };

  const handleCompartir = () => {
    if (compartirEnRedes) {
      compartirEnRedes(tarjetaRef, `Mi_Top5_${tipo}_CineRewind_${anio}`);
    } else if (descargarElemento) {
      descargarElemento(tarjetaRef, `Mi_Top5_${tipo}_CineRewind_${anio}`);
    }
  };

  return (
    <div 
      ref={tarjetaRef}
      className={`w-full h-full flex flex-col justify-between items-center rounded-3xl p-3 xs:p-4 sm:p-6 relative overflow-hidden text-white shadow-2xl select-none ${config.bgGradient}`}
    >
      {/* 🌟 KEYFRAMES Y DISEÑO DE FONDO ESTILO DEEZER (CÍRCULOS VIBRANTES, ESTRELLAS Y ONDAS) */}
      <style>{`
        @keyframes deezerOrb1 {
          0%, 100% { transform: translate(0px, 0px) scale(1); opacity: 0.65; }
          50% { transform: translate(-25px, 20px) scale(1.2); opacity: 0.9; }
        }
        @keyframes deezerOrb2 {
          0%, 100% { transform: translate(0px, 0px) scale(1); opacity: 0.55; }
          50% { transform: translate(20px, -25px) scale(1.22); opacity: 0.85; }
        }
        @keyframes deezerOrbCenter {
          0%, 100% { transform: translate(-50%, -50%) scale(0.95); opacity: 0.45; }
          50% { transform: translate(-50%, -50%) scale(1.15); opacity: 0.75; }
        }
        @keyframes sparkleTwinkle {
          0%, 100% { opacity: 0.25; transform: scale(0.8) rotate(0deg); }
          50% { opacity: 0.95; transform: scale(1.2) rotate(15deg); }
        }
      `}</style>

      {/* Orbe superior derecho (Rosa/Violeta o Coral vibrante) */}
      <div 
        className="absolute -top-12 -right-12 w-72 h-72 sm:w-88 sm:h-88 rounded-full blur-[75px] pointer-events-none -z-0"
        style={{
          background: esPeliculas 
            ? 'radial-gradient(circle, rgba(249,115,22,0.7) 0%, rgba(225,29,72,0.4) 60%, transparent 100%)'
            : 'radial-gradient(circle, rgba(236,72,153,0.7) 0%, rgba(147,51,234,0.45) 60%, transparent 100%)',
          animation: 'deezerOrb1 8s ease-in-out infinite'
        }}
      />

      {/* Orbe inferior izquierdo (Índigo/Azul o Ámbar dorado) */}
      <div 
        className="absolute -bottom-16 -left-12 w-80 h-80 sm:w-96 sm:h-96 rounded-full blur-[85px] pointer-events-none -z-0"
        style={{
          background: esPeliculas 
            ? 'radial-gradient(circle, rgba(245,158,11,0.65) 0%, rgba(194,65,12,0.35) 70%, transparent 100%)'
            : 'radial-gradient(circle, rgba(99,102,241,0.65) 0%, rgba(168,85,247,0.4) 70%, transparent 100%)',
          animation: 'deezerOrb2 10s ease-in-out infinite'
        }}
      />

      {/* Glow central ambiental vibrante */}
      <div 
        className="absolute top-1/2 left-1/2 w-88 h-88 sm:w-104 sm:h-104 rounded-full blur-[90px] pointer-events-none -z-0"
        style={{
          background: esPeliculas 
            ? 'radial-gradient(circle, rgba(234,88,12,0.35) 0%, transparent 70%)'
            : 'radial-gradient(circle, rgba(217,70,239,0.35) 0%, transparent 70%)',
          animation: 'deezerOrbCenter 7s ease-in-out infinite'
        }}
      />

      {/* Estrellas vectoriales brillantes de gala */}
      <div className="absolute inset-0 w-full h-full pointer-events-none -z-0 overflow-hidden">
        <svg viewBox="0 0 24 24" className="absolute top-[12%] left-[10%] w-4 h-4 text-amber-300 drop-shadow-[0_0_8px_rgba(251,191,36,0.8)]" style={{ animation: 'sparkleTwinkle 3s ease-in-out infinite' }}>
          <path d="M12 0 C12 7, 17 12, 24 12 C17 12, 12 17, 12 24 C12 17, 7 12, 0 12 C7 12, 12 7, 12 0 Z" fill="currentColor"/>
        </svg>
        <svg viewBox="0 0 24 24" className="absolute top-[22%] right-[12%] w-5 h-5 text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.9)]" style={{ animation: 'sparkleTwinkle 4s ease-in-out infinite 1s' }}>
          <path d="M12 0 C12 7, 17 12, 24 12 C17 12, 12 17, 12 24 C12 17, 7 12, 0 12 C7 12, 12 7, 12 0 Z" fill="currentColor"/>
        </svg>
        <svg viewBox="0 0 24 24" className="absolute bottom-[28%] left-[12%] w-4.5 h-4.5 text-pink-300 drop-shadow-[0_0_8px_rgba(244,114,182,0.8)]" style={{ animation: 'sparkleTwinkle 3.5s ease-in-out infinite 0.5s' }}>
          <path d="M12 0 C12 7, 17 12, 24 12 C17 12, 12 17, 12 24 C12 17, 7 12, 0 12 C7 12, 12 7, 12 0 Z" fill="currentColor"/>
        </svg>
      </div>

      {/* Ondas y aros concéntricos vectoriales estilo Deezer */}
      <div className="absolute inset-0 w-full h-full pointer-events-none -z-0 opacity-25 overflow-hidden">
        <svg viewBox="0 0 400 700" preserveAspectRatio="none" className="w-full h-full">
          <circle cx="340" cy="110" r="160" fill="none" stroke="currentColor" strokeWidth="2" className={esPeliculas ? "text-orange-400" : "text-pink-400"} />
          <circle cx="340" cy="110" r="215" fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="6 6" className={esPeliculas ? "text-orange-300" : "text-purple-300"} />
          <circle cx="60" cy="590" r="150" fill="none" stroke="currentColor" strokeWidth="2" className={esPeliculas ? "text-amber-400" : "text-indigo-400"} />
          <circle cx="60" cy="590" r="205" fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="6 6" className={esPeliculas ? "text-amber-300" : "text-indigo-300"} />
        </svg>
      </div>

      {/* 1. CABECERA EDITORIAL */}
      <div className="relative z-10 flex flex-col items-center shrink-0 pt-1">
        <span className="text-sm xs:text-base font-black tracking-tight text-white drop-shadow-md">
          #MiCineRewindAño
        </span>
        <div className={`mt-1 inline-flex items-center gap-1.5 px-3.5 py-0.5 rounded-full border text-[10px] xs:text-xs font-mono font-bold uppercase shadow-sm ${config.pillBg}`}>
          {esPeliculas ? <Film className="w-3.5 h-3.5 text-orange-400" /> : <Tv className="w-3.5 h-3.5 text-purple-400" />}
          <span>{config.titulo}</span>
        </div>
        <span className="text-[10px] font-mono text-zinc-300 font-semibold tracking-wider mt-0.5">
          CineRewind · {anio}
        </span>
      </div>

      {/* 2. CUERPO CENTRAL: MOSAICO SPOTIFY (5 PORTADAS VERTICALES COMPLETAS) + LISTA NUMERADA */}
      <div className="relative z-10 w-full max-w-sm sm:max-w-md flex flex-col items-center my-auto min-h-0 py-1">
        
        {/* MOSAICO DE 5 PÓSTERS EN PROPORCIÓN REAL DE CARTELERA (100% COMPLETAS, SIN CORTES NI BORDES VACÍOS) */}
        <div className="w-full flex flex-col items-center space-y-2 mb-1.5">
          {/* Fila 1: Puestos 1 y 2 (Líderes destacados) */}
          <div className="grid grid-cols-2 gap-2.5 w-full max-w-[210px] xs:max-w-[230px] sm:max-w-[250px]">
            {[item1, item2].map((it, idx) => (
              <div 
                key={idx} 
                className="relative aspect-[2/3] rounded-2xl overflow-hidden bg-zinc-900 border-2 border-white/20 shadow-[0_10px_25px_rgba(0,0,0,0.7)] group"
              >
                {it?.poster_path ? (
                  <img 
                    src={obtenerUrlImagenSegura(it.poster_path)} 
                    alt={it?.titulo || ''} 
                    crossOrigin="anonymous" 
                    className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-105" 
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-zinc-500 bg-zinc-900">
                    {esPeliculas ? <Film className="w-8 h-8 opacity-40" /> : <Tv className="w-8 h-8 opacity-40" />}
                  </div>
                )}
                {/* Badge de número blanco nítido */}
                <div className="absolute bottom-1.5 right-1.5 z-20 w-6 h-6 rounded-lg bg-white text-black font-black text-xs font-mono flex items-center justify-center shadow-lg border border-black/10">
                  {idx + 1}
                </div>
              </div>
            ))}
          </div>

          {/* Fila 2: Puestos 3, 4 y 5 (Agrandados para verse con mayor presencia y claridad) */}
          <div className="grid grid-cols-3 gap-2 w-full max-w-[265px] xs:max-w-[285px] sm:max-w-[310px]">
            {[item3, item4, item5].map((it, idx) => (
              <div 
                key={idx} 
                className="relative aspect-[2/3] rounded-xl overflow-hidden bg-zinc-900 border border-white/20 shadow-[0_8px_20px_rgba(0,0,0,0.6)] group"
              >
                {it?.poster_path ? (
                  <img 
                    src={obtenerUrlImagenSegura(it.poster_path)} 
                    alt={it?.titulo || ''} 
                    crossOrigin="anonymous" 
                    className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-105" 
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-zinc-500 bg-zinc-900">
                    {esPeliculas ? <Film className="w-6 h-6 opacity-40" /> : <Tv className="w-6 h-6 opacity-40" />}
                  </div>
                )}
                {/* Badge de número */}
                <div className="absolute bottom-1 right-1 z-20 w-5 h-5 rounded-md bg-white text-black font-black text-[11px] font-mono flex items-center justify-center shadow-md border border-black/10">
                  {idx + 3}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* LISTA NUMERADA 1 AL 5 (TEXTO BLANCO NÍTIDO DE ALTO CONTRASTE) */}
        <div className="w-full max-w-[260px] xs:max-w-[280px] sm:max-w-[310px] space-y-0.5 text-left px-1">
          {top5.map((it, idx) => (
            <div key={idx} className="flex items-center gap-2 py-0.5">
              <span className={`text-xs xs:text-sm font-black font-mono w-4 text-center shrink-0 ${idx === 0 ? 'text-amber-400' : 'text-zinc-300'}`}>
                {idx + 1}
              </span>
              <div className="min-w-0 flex-1 leading-snug">
                <span className="text-xs xs:text-sm font-black uppercase text-white block truncate tracking-tight">
                  {it?.titulo || 'Título'}
                </span>
                <span className="text-[10px] xs:text-[11px] text-zinc-300 font-mono block">
                  {config.metricaLabel(it)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. BOTONES FLOTANTES: NO SALEN EN LA DESCARGA (data-no-capture) */}
      <div 
        data-no-capture="true" 
        className="relative z-30 shrink-0 pt-0.5 pb-0.5 flex items-center justify-center gap-2.5 w-full"
      >
        <button 
          onClick={handleCompartir} 
          disabled={descargando}
          className="group inline-flex items-center justify-center gap-2 px-7 sm:px-9 py-2.5 sm:py-3 rounded-full bg-white text-black hover:bg-zinc-100 font-black text-xs sm:text-sm uppercase tracking-wide cursor-pointer shadow-[0_10px_25px_rgba(255,255,255,0.25)] transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
        >
          <Share2 className="w-4 h-4 text-black transition-transform group-hover:rotate-12" />
          <span>{descargando ? 'Generando...' : 'Compartir'}</span>
        </button>

        {onSiguiente && (
          <button
            onClick={onSiguiente}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 sm:py-3 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold text-xs uppercase cursor-pointer border border-white/20 transition-all hover:scale-105 active:scale-95"
            title="Siguiente diapositiva"
          >
            <span>Siguiente</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* 4. FOOTER: DOMINIO cinerewind.com.ar AL BORDE INFERIOR (Debajo de los botones en pantalla, y al pie en la descarga) */}
      <div className="relative z-10 shrink-0 w-full text-center pb-1 pt-0.5">
        <span className="text-[10px] sm:text-xs font-mono font-bold tracking-widest text-zinc-400 uppercase">
          cinerewind.com.ar
        </span>
      </div>
    </div>
  );
}
