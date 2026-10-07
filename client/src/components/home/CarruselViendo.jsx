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
    <section className="relative z-20 space-y-4">
      <h2 className="text-xl font-extrabold tracking-tight text-neutral-900 dark:text-white">
        Viendo Actualmente
      </h2>

      {/* Se agrega padding vertical generoso para que el hover expandido nunca se corte */}
      <div className="flex gap-4 overflow-x-auto scrollbar-elegante pt-6 -mt-6 pb-48 -mb-44 px-6 -mx-6 scroll-smooth items-start">
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