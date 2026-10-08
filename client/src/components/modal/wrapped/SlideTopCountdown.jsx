import React from 'react';
import { Crown, Flame, Film, Tv, ArrowRight } from 'lucide-react';

export default function SlideTopCountdown({
  posicion,
  obra,
  serie,
  tipo = 'serie', // 'serie' | 'pelicula'
  totalEnPodio = 5,
  obtenerUrlImagenSegura,
  onSiguiente
}) {
  const item = obra || serie;
  const esNumeroUno = posicion === 1;
  const esPelicula = tipo === 'pelicula' || item?.tipo === 'pelicula';
  const titulo = item?.titulo || (esPelicula ? 'Película Destacada' : 'Serie Destacada');
  const capitulos = item?.episodios_vistos || item?.veces_vista || item?.conteo || 1;
  const posterUrl = item?.poster_path ? obtenerUrlImagenSegura(item.poster_path) : null;

  // Paleta de colores Deezer según la posición
  const configuracionPorPuesto = {
    5: {
      gradienteTop: 'from-[#e11d48] to-[#be123c]', // Rojo coral
      colorTexto: 'text-rose-400',
      colorGlow: 'rgba(225, 29, 72, 0.45)',
      botonEstilo: 'bg-white hover:bg-zinc-100 text-black',
      textoBoton: `Siguiente (Top #${posicion - 1})`
    },
    4: {
      gradienteTop: 'from-[#8b5cf6] to-[#6d28d9]', // Violeta eléctrico
      colorTexto: 'text-violet-400',
      colorGlow: 'rgba(139, 92, 246, 0.45)',
      botonEstilo: 'bg-white hover:bg-zinc-100 text-black',
      textoBoton: `Siguiente (Top #${posicion - 1})`
    },
    3: {
      gradienteTop: 'from-[#ec4899] to-[#be185d]', // Magenta vibrante
      colorTexto: 'text-pink-400',
      colorGlow: 'rgba(236, 72, 153, 0.45)',
      botonEstilo: 'bg-white hover:bg-zinc-100 text-black',
      textoBoton: `Siguiente (Top #${posicion - 1})`
    },
    2: {
      gradienteTop: 'from-[#0284c7] to-[#0369a1]', // Azul cielo / cian
      colorTexto: 'text-sky-400',
      colorGlow: 'rgba(2, 132, 199, 0.45)',
      botonEstilo: 'bg-white hover:bg-zinc-100 text-black',
      textoBoton: `Siguiente (Top #1 👑)`
    },
    1: {
      gradienteTop: 'from-[#d97706] via-[#b45309] to-[#78350f]', // Oro de Cannes
      colorTexto: 'text-amber-400',
      colorGlow: 'rgba(245, 158, 11, 0.55)',
      botonEstilo: 'bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-300 hover:to-yellow-300 text-black shadow-[0_10px_30px_rgba(245,158,11,0.4)]',
      textoBoton: esPelicula ? 'Ver Resumen de Películas' : 'Ver Resumen de Series'
    }
  };

  const config = configuracionPorPuesto[posicion] || configuracionPorPuesto[5];

  // Si el título es muy largo (más de 5 palabras o más de 25 caracteres), se ajusta para que no desborde
  const palabras = (titulo || '').trim().split(/\s+/).length;
  const esTituloLargo = palabras >= 6 || (titulo || '').length > 25;

  return (
    <div className="w-full h-full flex flex-col justify-between rounded-3xl relative overflow-hidden text-white shadow-2xl select-none bg-[#07070b]">
      <style>{`
        @keyframes floatPoster {
          0%, 100% {
            transform: translateY(0px) scale(1);
          }
          50% {
            transform: translateY(-5px) scale(1.02);
          }
        }
        @keyframes ambientAura {
          0%, 100% {
            opacity: 0.35;
          }
          50% {
            opacity: 0.7;
          }
        }
      `}</style>

      {/* 1. SECCIÓN SUPERIOR DE COLOR VIBRANTE (ESTILO DEEZER DOS TONOS) */}
      <div className={`relative w-full h-[40%] sm:h-[44%] bg-gradient-to-b ${config.gradienteTop} flex flex-col items-center justify-start pt-2.5 sm:pt-4 px-4`}>
        {/* Header #MiCineRewindAño */}
        <div className="flex flex-col items-center z-10">
          <span className="text-sm sm:text-base font-black tracking-tight text-white drop-shadow-md">
            #MiCineRewindAño
          </span>
          {esNumeroUno ? (
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-black/40 backdrop-blur-md border border-amber-300/40 text-[10px] sm:text-xs font-mono font-black text-amber-300 mt-0.5 shadow-md">
              <Crown className="w-3 h-3 text-amber-400" />
              <span>{esPelicula ? 'PELÍCULA SUPREMA · TOP #1' : 'TU GRAN OBSESIÓN · SERIE #1'}</span>
            </div>
          ) : (
            <span className="text-[10px] sm:text-xs uppercase font-mono font-bold text-white/80 tracking-widest mt-0.5">
              TOP {totalEnPodio} {esPelicula ? 'PELÍCULAS' : 'SERIES'} DEL AÑO
            </span>
          )}
        </div>

        {/* NÚMERO GIGANTE DISPLAY (DEEZER STYLE) */}
        <div className="relative z-10 mt-0.5 sm:mt-1 text-center">
          <div className="text-6xl xs:text-7xl sm:text-8xl md:text-9xl font-black text-white leading-none tracking-tighter drop-shadow-[0_8px_20px_rgba(0,0,0,0.5)] font-sans">
            {posicion}
          </div>
        </div>

        {/* DIVIDER FESTONEADO / SCALLOPED WAVES (CORTE DE ONDAS ESTILO DEEZER) */}
        <div className="absolute -bottom-1 left-0 right-0 w-full overflow-hidden leading-none pointer-events-none z-10">
          <svg viewBox="0 0 100 12" preserveAspectRatio="none" className="w-full h-5 sm:h-7 text-[#07070b] fill-current">
            <path d="M0,0 Q 5,12 10,0 Q 15,12 20,0 Q 25,12 30,0 Q 35,12 40,0 Q 45,12 50,0 Q 55,12 60,0 Q 65,12 70,0 Q 75,12 80,0 Q 85,12 90,0 Q 95,12 100,0 L 100,12 L 0,12 Z" />
          </svg>
        </div>
      </div>

      {/* 2. PÓSTER PROTAGONISTA EN CELULAR Y PC (GRANDE Y PROTAGÓNICO) */}
      <div className="absolute top-[14%] xs:top-[15%] sm:top-[20%] left-1/2 -translate-x-1/2 z-20 flex flex-col items-center pointer-events-none">
        {/* Glow atmosférico detrás del póster */}
        <div 
          className="absolute inset-0 rounded-3xl blur-2xl -z-10 scale-110"
          style={{ 
            backgroundColor: config.colorGlow,
            animation: 'ambientAura 5s ease-in-out infinite'
          }}
        />

        <div 
          className={`relative w-44 xs:w-48 sm:w-56 md:w-60 aspect-[2/3] rounded-2xl sm:rounded-3xl overflow-hidden bg-zinc-900 border-2 sm:border-3 ${esNumeroUno ? 'border-amber-400 shadow-[0_15px_40px_rgba(245,158,11,0.5)]' : 'border-white/25 shadow-[0_20px_50px_rgba(0,0,0,0.85)]'} transition-all pointer-events-auto`}
          style={{ animation: 'floatPoster 6s ease-in-out infinite' }}
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
                alt={titulo} 
                crossOrigin="anonymous" 
                className="relative z-10 w-full h-full object-cover" 
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            </>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center p-2 text-zinc-500">
              {esPelicula ? <Film className="w-12 h-12 mb-2 text-white/50" /> : <Tv className="w-12 h-12 mb-2 text-white/50" />}
              <span className="text-xs font-bold text-white/70">Sin Póster</span>
            </div>
          )}
        </div>
      </div>

      {/* 3. SECCIÓN INFERIOR NEGRA: TÍTULO PEGADO AL PÓSTER, COMPLETO */}
      <div className="relative w-full h-[60%] sm:h-[56%] bg-[#07070b] flex flex-col items-center justify-between sm:justify-end pt-32 xs:pt-36 sm:pt-0 pb-3 sm:pb-4 px-4 z-10">
        <div className="w-full max-w-sm sm:max-w-md text-center flex flex-col items-center mb-1.5 sm:mb-2 px-2">
          {/* TÍTULO OFICIAL COMPLETO (SI TIENE MUCHAS PALABRAS SE REDUCE SUTILMENTE) */}
          <h2 className={`${esTituloLargo ? 'text-base xs:text-lg sm:text-xl md:text-2xl' : 'text-lg xs:text-xl sm:text-2xl md:text-3xl'} font-black text-white uppercase tracking-tight leading-snug drop-shadow-md line-clamp-2`}>
            {titulo}
          </h2>

          {/* MÉTRICA DESTACADA */}
          <div className="inline-flex items-center gap-2 mt-1.5 sm:mt-2 px-3.5 py-1 rounded-full bg-white/5 border border-white/10 text-xs sm:text-sm font-mono shadow-sm">
            <Flame className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${config.colorTexto}`} />
            <span className="text-white font-bold">
              {esPelicula ? (
                <>Reproducida: <strong className={`text-sm sm:text-base font-black ${config.colorTexto}`}>{capitulos}</strong> {capitulos === 1 ? 'vez' : 'veces'}</>
              ) : (
                <>Vistos: <strong className={`text-sm sm:text-base font-black ${config.colorTexto}`}>{capitulos}</strong> capítulos</>
              )}
            </span>
          </div>

          {/* CITA O TEXTO COMPLEMENTARIO */}
          {esNumeroUno ? (
            <p className="text-[11px] sm:text-xs text-amber-200/90 italic mt-1.5 max-w-xs leading-tight">
              {esPelicula 
                ? '"Tu largometraje de cabecera: el que definió tu año frente a la pantalla."'
                : '"El botón de \'Siguiente episodio en 5 segundos\' nunca tuvo oportunidad contra ti."'}
            </p>
          ) : (
            <p className="text-[10px] sm:text-[11px] text-zinc-400 mt-1">
              {esPelicula ? 'Una de tus películas cumbre del año.' : 'Una de tus historias imprescindibles del año.'}
            </p>
          )}
        </div>

        {/* BOTÓN DE ACCIÓN */}
        <div className="w-full max-w-xs flex justify-center pt-0.5 sm:pt-1">
          <button 
            onClick={onSiguiente} 
            className={`group inline-flex items-center justify-center gap-2 px-7 sm:px-9 py-2.5 sm:py-3 rounded-full font-black text-xs sm:text-sm uppercase tracking-wide cursor-pointer transition-all hover:scale-105 active:scale-95 shadow-lg whitespace-nowrap ${config.botonEstilo}`}
          >
            <span>{config.textoBoton}</span>
            <ArrowRight className="w-4 h-4 shrink-0 transition-transform group-hover:translate-x-1" />
          </button>
        </div>
      </div>
    </div>
  );
}
