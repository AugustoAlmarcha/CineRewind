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

  return (
    <div className="fixed right-3 top-1/2 -translate-y-1/2 z-40 flex items-center select-none group">
      
      {/* Contenedor de la barra vertical interactiva */}
      <div className="relative py-4 px-2 flex flex-col items-center justify-between h-64 sm:h-80 bg-neutral-900/60 hover:bg-neutral-900/90 backdrop-blur-md border border-white/10 rounded-full transition-all duration-300">
        
        {/* Línea central guía */}
        <div className="absolute top-4 bottom-4 w-[2px] bg-white/10 group-hover:bg-rose-500/30 transition-colors pointer-events-none" />

        {/* Nodos de fecha */}
        {puntos.map((punto, index) => {
          const isHovered = hoverIndex === index;

          return (
            <div
              key={punto.id}
              onMouseEnter={() => setHoverIndex(index)}
              onMouseLeave={() => setHoverIndex(null)}
              onClick={() => scrollToElement(punto.id)}
              className="relative flex items-center justify-center w-5 h-5 cursor-pointer z-10"
            >
              {/* Punto indicador */}
              <div
                className={`rounded-full transition-all duration-200 ${
                  isHovered
                    ? 'w-3 h-3 bg-rose-500 ring-4 ring-rose-500/30 scale-125'
                    : 'w-1.5 h-1.5 bg-neutral-400 group-hover:bg-white'
                }`}
              />

              {/* Burbuja flotante estilo Google Fotos (Tooltip) */}
              {isHovered && (
                <div className="absolute right-8 top-1/2 -translate-y-1/2 bg-neutral-900 border border-white/20 text-white text-xs font-black py-1.5 px-3 rounded-xl shadow-2xl whitespace-nowrap flex items-center gap-2 pointer-events-none animate-fadeIn">
                  <span className="text-rose-500">{punto.icono || '📅'}</span>
                  <span>{punto.etiqueta}</span>
                  {punto.subtexto && (
                    <span className="text-[10px] text-neutral-400 font-bold">
                      ({punto.subtexto})
                    </span>
                  )}
                  {/* Flechita del tooltip */}
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