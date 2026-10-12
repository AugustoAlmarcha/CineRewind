import React, { useState } from 'react';
import ViendoCard from './ViendoCard';
import useDragScroll from '../../hooks/useDragScroll';

export default function CarruselViendo({ 
  seriesActivas = [], 
  onAvanzar, 
  onDescartar, 
  onAbrirDetalle, 
  onVerInfoEpisodio 
}) {
  const [serieActivaId, setSerieActivaId] = useState(null);
  const carruselRef = useDragScroll();

  return (
    <section className="relative z-10">
      <h2 className="text-xl font-extrabold tracking-tight text-neutral-900 dark:text-white mb-2 relative z-20">
        Viendo Actualmente
      </h2>

      {/* Contenedor del carrusel con soporte para arrastre con ratón (drag-to-scroll) y margen holgado */}
      <div 
        ref={carruselRef}
        className="flex gap-4 overflow-x-auto scrollbar-elegante pt-10 -mt-6 pb-12 -mb-8 px-6 -mx-6 scroll-smooth items-start cursor-grab"
      >
        {seriesActivas.length > 0 ? (
          seriesActivas.map((serie, index) => {
            const idActual = serie.obra_id || serie.tmdb_id || serie.id;

            return (
              <ViendoCard 
                key={idActual || index} 
                index={index}
                totalSeries={seriesActivas.length}
                serie={serie} 
                estaActivo={serieActivaId === idActual}
                onAlternarActivo={(id) => setSerieActivaId(prev => prev === id ? null : id)}
                onCerrarActivo={() => setSerieActivaId(null)}
                onAvanzar={onAvanzar} 
                onDescartar={onDescartar}
                onVerInfoEpisodio={onVerInfoEpisodio}
                onAbrirDetalle={onAbrirDetalle}
              />
            );
          })
        ) : (
          <p className="text-sm text-neutral-500 italic py-2">
            No tienes series activas en curso.
          </p>
        )}
      </div>
    </section>
  );
}