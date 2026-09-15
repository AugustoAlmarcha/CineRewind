import React from 'react';
import ViendoCard from '../ViendoCard';

export default function CarruselViendo({ 
  seriesActivas, 
  onAvanzar, 
  onDescartar, 
  onAbrirDetalle, 
  onVerInfoEpisodio 
}) {
  return (
    <section className="space-y-5">
      <h2 className="text-xl font-extrabold text-neutral-900 dark:text-white">Viendo Actualmente</h2>
      <div className="flex gap-6 overflow-x-auto pb-4 pt-1 carrusel-scroll">
        {seriesActivas.length > 0 ? (
          seriesActivas.map((serie) => (
            <ViendoCard 
              key={serie.obra_id} 
              serie={serie} 
              onAvanzar={onAvanzar} 
              onDescartar={onDescartar}
              onVerInfoEpisodio={onVerInfoEpisodio}
              onAbrirDetalle={onAbrirDetalle}
            />
          ))
        ) : (
          <p className="text-sm text-neutral-500 italic">No tienes series en curso.</p>
        )}
      </div>
    </section>
  );
}