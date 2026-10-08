import React, { useState, useRef, useMemo } from 'react';
import { Share2, Film, Tv, Sparkles, Layers } from 'lucide-react';

export default function SlideMuralCompleto({
  stats,
  obtenerUrlImagenSegura,
  descargarElemento,
  compartirEnRedes,
  descargando,
  onSiguiente
}) {
  const tarjetaRef = useRef(null);
  const [filtro, setFiltro] = useState('todo'); // 'todo' | 'series' | 'peliculas'
  const anio = stats?.anio || new Date().getFullYear();

  // Listas de obras filtradas
  const todas = stats?.todasLasObras || [];
  const series = stats?.seriesVistas || todas.filter(o => o.tipo === 'serie');
  const peliculas = stats?.peliculasVistas || todas.filter(o => o.tipo === 'pelicula');

  const obrasActivas = useMemo(() => {
    if (filtro === 'series') return series;
    if (filtro === 'peliculas') return peliculas;
    return todas;
  }, [filtro, todas, series, peliculas]);

  // Grilla de 5 columnas x 6 filas = 30 celdas
  // Si la cantidad de obras es menor a 30 (ej: 14 series), se ciclan para que NUNCA queden huecos negros
  const totalCeldas = 30;
  const itemsMural = useMemo(() => {
    if (obrasActivas.length === 0) return [];
    const lista = [];
    for (let i = 0; i < totalCeldas; i++) {
      lista.push(obrasActivas[i % obrasActivas.length]);
    }
    return lista;
  }, [obrasActivas]);

  const handleCompartir = () => {
    const sufijo = filtro === 'series' ? 'Series' : filtro === 'peliculas' ? 'Peliculas' : 'Todo';
    const nombre = `Mi_Año_CineRewind_${sufijo}_${anio}`;
    if (compartirEnRedes) {
      compartirEnRedes(tarjetaRef, nombre);
    } else if (descargarElemento) {
      descargarElemento(tarjetaRef, nombre);
    }
  };

  return (
    <div 
      ref={tarjetaRef}
      className="w-full h-full flex flex-col justify-between items-center rounded-3xl p-3 xs:p-4 sm:p-6 relative overflow-hidden text-white shadow-2xl select-none bg-gradient-to-b from-[#1b0a2a] via-[#0d0317] to-[#05010a]"
    >
      {/* 🌟 EFECTOS DE FONDO Y ORBES ESTILO DEEZER */}
      <style>{`
        @keyframes muralGlowTop {
          0%, 100% { transform: scale(1) translate(0, 0); opacity: 0.6; }
          50% { transform: scale(1.15) translate(15px, -10px); opacity: 0.85; }
        }
        @keyframes muralGlowBottom {
          0%, 100% { transform: scale(1) translate(0, 0); opacity: 0.5; }
          50% { transform: scale(1.2) translate(-15px, 15px); opacity: 0.8; }
        }
        @keyframes sparkleTwinkle {
          0%, 100% { opacity: 0.25; transform: scale(0.8) rotate(0deg); }
          50% { opacity: 0.95; transform: scale(1.2) rotate(15deg); }
        }
      `}</style>

      {/* Orbe superior violeta/fucsia */}
      <div 
        className="absolute -top-16 -left-16 w-80 h-80 sm:w-96 sm:h-96 rounded-full blur-[85px] pointer-events-none -z-0"
        style={{
          background: 'radial-gradient(circle, rgba(168,85,247,0.65) 0%, rgba(217,70,239,0.3) 60%, transparent 100%)',
          animation: 'muralGlowTop 9s ease-in-out infinite'
        }}
      />

      {/* Orbe inferior ámbar/naranja cálido */}
      <div 
        className="absolute -bottom-20 -right-16 w-88 h-88 sm:w-104 sm:h-104 rounded-full blur-[95px] pointer-events-none -z-0"
        style={{
          background: 'radial-gradient(circle, rgba(245,158,11,0.55) 0%, rgba(225,29,72,0.3) 70%, transparent 100%)',
          animation: 'muralGlowBottom 11s ease-in-out infinite'
        }}
      />

      {/* Estrellas vectoriales brillantes */}
      <div className="absolute inset-0 w-full h-full pointer-events-none -z-0 overflow-hidden">
        <svg viewBox="0 0 24 24" className="absolute top-[8%] right-[12%] w-4.5 h-4.5 text-amber-300 drop-shadow-[0_0_8px_rgba(251,191,36,0.8)]" style={{ animation: 'sparkleTwinkle 3.2s ease-in-out infinite' }}>
          <path d="M12 0 C12 7, 17 12, 24 12 C17 12, 12 17, 12 24 C12 17, 7 12, 0 12 C7 12, 12 7, 12 0 Z" fill="currentColor"/>
        </svg>
        <svg viewBox="0 0 24 24" className="absolute top-[26%] left-[8%] w-4 h-4 text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.9)]" style={{ animation: 'sparkleTwinkle 4.5s ease-in-out infinite 1s' }}>
          <path d="M12 0 C12 7, 17 12, 24 12 C17 12, 12 17, 12 24 C12 17, 7 12, 0 12 C7 12, 12 7, 12 0 Z" fill="currentColor"/>
        </svg>
        <svg viewBox="0 0 24 24" className="absolute bottom-[24%] right-[8%] w-5 h-5 text-purple-300 drop-shadow-[0_0_9px_rgba(216,180,254,0.8)]" style={{ animation: 'sparkleTwinkle 3.8s ease-in-out infinite 0.7s' }}>
          <path d="M12 0 C12 7, 17 12, 24 12 C17 12, 12 17, 12 24 C12 17, 7 12, 0 12 C7 12, 12 7, 12 0 Z" fill="currentColor"/>
        </svg>
      </div>

      {/* 1. CABECERA & SELECTOR DE PESTAÑAS (TODO / SERIES / PELIS) */}
      <div className="relative z-10 flex flex-col items-center shrink-0 pt-0.5 w-full">
        <span className="text-sm xs:text-base font-black tracking-tight text-white drop-shadow-md">
          #MiCineRewindAño
        </span>
        <span className="text-[10px] font-mono text-zinc-300 font-semibold tracking-wider mt-0.5">
          cinerewind.com.ar · {anio}
        </span>

        {/* SELECTOR INTERACTIVO CON PESTAÑAS (data-no-capture para exportación limpia de historia) */}
        <div 
          data-no-capture="true"
          className="flex items-center gap-1 p-0.5 bg-black/60 backdrop-blur-md rounded-full border border-white/20 mt-1.5 shadow-lg"
        >
          <button
            onClick={() => setFiltro('todo')}
            className={`px-3 py-1 rounded-full text-[9px] xs:text-[10px] font-black uppercase transition-all cursor-pointer ${
              filtro === 'todo'
                ? 'bg-amber-400 text-black shadow-md scale-102'
                : 'text-zinc-300 hover:text-white hover:bg-white/10'
            }`}
          >
            Todo ({todas.length})
          </button>
          <button
            onClick={() => setFiltro('series')}
            className={`px-3 py-1 rounded-full text-[9px] xs:text-[10px] font-black uppercase transition-all cursor-pointer flex items-center gap-1 ${
              filtro === 'series'
                ? 'bg-purple-500 text-white shadow-md scale-102'
                : 'text-zinc-300 hover:text-white hover:bg-white/10'
            }`}
          >
            <Tv className="w-3 h-3" />
            <span>Series ({series.length})</span>
          </button>
          <button
            onClick={() => setFiltro('peliculas')}
            className={`px-3 py-1 rounded-full text-[9px] xs:text-[10px] font-black uppercase transition-all cursor-pointer flex items-center gap-1 ${
              filtro === 'peliculas'
                ? 'bg-orange-500 text-white shadow-md scale-102'
                : 'text-zinc-300 hover:text-white hover:bg-white/10'
            }`}
          >
            <Film className="w-3 h-3" />
            <span>Películas ({peliculas.length})</span>
          </button>
        </div>
      </div>

      {/* 2. CUERPO CENTRAL: TITULAR MONUMENTAL + MOSAICO DEEZER (5X6) + RESUMEN */}
      <div className="relative z-10 w-full max-w-sm sm:max-w-md flex flex-col items-center my-auto min-h-0 py-1">
        
        {/* 🌟 TITULAR MONUMENTAL CON LA CANTIDAD ANTES DE EMPEZAR LAS FOTOS (MISMA TIPOGRAFÍA DE "ASÍ FUE TU AÑO") */}
        <div className="text-center mb-1.5 xs:mb-2 px-2">
          {filtro === 'series' && (
            <h2 className="text-xl xs:text-2xl sm:text-3xl font-black uppercase tracking-tight text-white leading-tight drop-shadow-[0_2px_10px_rgba(168,85,247,0.6)]">
              <span className="text-purple-400 mr-1">{series.length}</span>
              SERIES VISTAS
            </h2>
          )}
          {filtro === 'peliculas' && (
            <h2 className="text-xl xs:text-2xl sm:text-3xl font-black uppercase tracking-tight text-white leading-tight drop-shadow-[0_2px_10px_rgba(249,115,22,0.6)]">
              <span className="text-orange-400 mr-1">{peliculas.length}</span>
              PELÍCULAS VISTAS
            </h2>
          )}
          {filtro === 'todo' && (
            <h2 className="text-lg xs:text-xl sm:text-2xl font-black uppercase tracking-tight text-white leading-tight drop-shadow-[0_2px_10px_rgba(251,191,36,0.5)]">
              <span className="text-orange-400">{peliculas.length}</span> PELIS · <span className="text-purple-400">{series.length}</span> SERIES
            </h2>
          )}
        </div>

        {/* CONTENEDOR DEL MOSAICO ESTILO TAPESTRY */}
        <div 
          className="w-full max-w-[250px] xs:max-w-[275px] sm:max-w-[310px] aspect-[5/6] rounded-2xl overflow-hidden p-1.5 bg-black/60 border border-white/20 shadow-[0_12px_35px_rgba(0,0,0,0.85)] flex items-center justify-center"
        >
          {itemsMural.length > 0 ? (
            <div className="w-full h-full grid grid-cols-5 gap-1 justify-center items-center content-center">
              {itemsMural.map((obra, idx) => (
                <div 
                  key={`deezer-item-${idx}-${obra.tmdb_id || obra.id}`}
                  className="relative aspect-square w-full rounded-md overflow-hidden bg-zinc-900 border border-white/10 shadow-sm group"
                >
                  {obra.poster_path ? (
                    <img 
                      src={obtenerUrlImagenSegura(obra.poster_path)} 
                      alt={obra.titulo || ''} 
                      crossOrigin="anonymous" 
                      className="w-full h-full object-cover object-top transition-transform duration-300 group-hover:scale-105" 
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-zinc-500 bg-zinc-900 p-0.5 text-center">
                      <span className="text-[7px] font-bold text-zinc-400 line-clamp-1">{obra.titulo}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="py-6 text-center text-zinc-400 text-xs">
              No hay obras en esta categoría.
            </div>
          )}
        </div>

        {/* TIPOGRAFÍA MONUMENTAL INFERIOR ESTILO DEEZER */}
        <div className="flex flex-col items-center text-center mt-2 xs:mt-2.5 mb-0.5 px-2">
          <h3 className="text-2xl xs:text-3xl sm:text-4xl font-black uppercase tracking-tight text-white leading-none drop-shadow-md">
            Así fue tu año
          </h3>
          <p className="text-xs xs:text-sm sm:text-base font-black uppercase tracking-tight text-amber-300 drop-shadow mt-0.5">
            {filtro === 'series' 
              ? 'de series en CineRewind' 
              : filtro === 'peliculas' 
              ? 'de cine en CineRewind' 
              : 'de cine y series en CineRewind'}
          </p>
        </div>

        {/* Footer del usuario dentro de la imagen */}
        <div className="flex items-center gap-1.5 text-[9px] font-mono text-zinc-400 tracking-wider">
          <span>@{stats?.usuario?.username || 'usuario'}</span>
          <span>•</span>
          <span className="text-zinc-300 font-bold">{obrasActivas.length} títulos disfrutados</span>
        </div>
      </div>

      {/* 3. BOTONES DE ACCIÓN (CON data-no-capture="true" PARA QUE NO SALGAN EN LA IMAGEN) */}
      <div 
        data-no-capture="true"
        className="relative z-30 flex items-center justify-center gap-2.5 shrink-0 pb-1 pt-1 w-full max-w-xs mt-auto"
      >
        <button
          onClick={handleCompartir}
          disabled={descargando}
          data-no-capture="true"
          className="flex-1 py-2.5 px-5 rounded-full bg-white hover:bg-zinc-100 text-black font-black text-xs sm:text-sm uppercase flex items-center justify-center gap-2 cursor-pointer shadow-xl transition-all hover:scale-105 active:scale-98"
        >
          <Share2 className="w-4 h-4 text-black" />
          <span>{descargando ? 'Generando...' : 'Compartir'}</span>
        </button>
        <button
          onClick={onSiguiente}
          data-no-capture="true"
          className="py-2.5 px-4 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold text-xs sm:text-sm cursor-pointer shadow border border-white/20 transition-all hover:scale-105"
        >
          Hábitos →
        </button>
      </div>

      {/* 4. FOOTER: cinerewind.com.ar AL BORDE INFERIOR */}
      <div className="relative z-10 shrink-0 w-full text-center pb-1">
        <span className="text-[10px] sm:text-xs font-mono font-bold tracking-widest text-zinc-400 uppercase">
          cinerewind.com.ar
        </span>
      </div>
    </div>
  );
}