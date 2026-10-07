import React, { useState } from 'react';
import ViendoCard from './ViendoCard';

export default function CarruselViendo({ 
  seriesActivas = [], 
  onAvanzar, 
  onDescartar, 
  onAbrirDetalle, 
  onVerInfoEpisodio 
}) {
  const [serieActivaId, setSerieActivaId] = useState(null);

  return (
    <section className="relative z-30 space-y-4">
      <h2 className="text-xl font-extrabold tracking-tight text-neutral-900 dark:text-white">
        Viendo Actualmente
      </h2>

      {/* Contenedor del carrusel con margen limpio y pointer-events para no tapar los botones inferiores */}
      <div className="flex gap-4 overflow-x-auto scrollbar-elegante pt-3 -mt-3 sm:pb-36 sm:-mb-32 pb-2 -mb-2 px-6 -mx-6 scroll-smooth items-start sm:pointer-events-none">
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
          <p className="text-sm text-neutral-500 italic py-2 sm:pointer-events-auto">
            No tienes series activas en curso.
          </p>
        )}
      </div>
    </section>
  );
}