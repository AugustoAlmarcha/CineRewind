import React, { useState } from 'react';

export default function TimelineScrubber({ puntos = [] }) {
  const [hoverIndex, setHoverIndex] = useState(null);

  if (puntos.length <= 1) return null;

  const scrollToElement = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const total = puntos.length;
  // Cálculo dinámico de altura: la cápsula crece adaptada a la cantidad de capítulos/fechas
  const alturaCalculada = Math.min(
    680,
    Math.max(180, total * (total > 40 ? 11 : total > 25 ? 14 : total > 12 ? 18 : 24))
  );

  return (
    <div className="hidden md:flex fixed right-3 top-1/2 -translate-y-1/2 z-40 items-center select-none group">
      
      {/* Contenedor vertical interactivo: crece con la cantidad y contiene todos los puntos */}
      <div 
        style={{ height: `${alturaCalculada}px` }}
        className="relative py-3.5 px-2 flex flex-col items-center justify-between max-h-[82vh] bg-neutral-900/70 hover:bg-neutral-900/95 backdrop-blur-md border border-white/15 rounded-full shadow-2xl transition-all duration-300 overflow-hidden"
      >
        
        {/* Línea central guía */}
        <div className="absolute top-4 bottom-4 w-[2px] bg-white/10 group-hover:bg-rose-500/30 transition-colors pointer-events-none" />

        {/* Nodos de fecha / capítulos */}
        {puntos.map((punto, index) => {
          const isHovered = hoverIndex === index;

          return (
            <div
              key={punto.id}
              onMouseEnter={() => setHoverIndex(index)}
              onMouseLeave={() => setHoverIndex(null)}
              onClick={() => scrollToElement(punto.id)}
              className="relative flex items-center justify-center w-5 flex-1 min-h-0 cursor-pointer z-10"
            >
              {/* Punto indicador */}
              <div
                className={`rounded-full transition-all duration-200 shrink-0 ${
                  isHovered
                    ? 'w-3 h-3 bg-rose-500 ring-4 ring-rose-500/30 scale-125'
                    : total > 40
                      ? 'w-1 h-1 bg-neutral-400 group-hover:bg-white'
                      : 'w-1.5 h-1.5 bg-neutral-400 group-hover:bg-white'
                }`}
              />

              {/* Tooltip flotante */}
              {isHovered && (
                <div className="absolute right-8 top-1/2 -translate-y-1/2 bg-neutral-900 border border-white/20 text-white text-xs font-black py-1.5 px-3 rounded-xl shadow-2xl whitespace-nowrap flex items-center gap-2 pointer-events-none animate-fadeIn z-50">
                  <span className="text-rose-500">{punto.icono || '📅'}</span>
                  <span>{punto.etiqueta}</span>
                  {punto.subtexto && (
                    <span className="text-[10px] text-neutral-400 font-bold">
                      ({punto.subtexto})
                    </span>
                  )}
                  <div className="absolute -right-1 top-1/2 -translate-y-1/2 w-2 h-2 bg-neutral-900 border-t border-r border-white/20 rotate-45" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}