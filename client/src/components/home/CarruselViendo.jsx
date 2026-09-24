import React from 'react';
import ViendoCard from '../ViendoCard';

export default function CarruselViendo({ 
  seriesActivas = [], 
  onAvanzar, 
  onDescartar, 
  onAbrirDetalle, 
  onVerInfoEpisodio 
}) {
  return (
    <section className="space-y-4">
      <h2 className="text-xl font-extrabold tracking-tight text-neutral-900 dark:text-white">
        Viendo Actualmente
      </h2>

      {/* py-12 y px-8 dan suficiente espacio para la tarjeta ampliada */}
      <div className="flex gap-7 overflow-x-auto py-12 px-8 scrollbar-thin">
        {seriesActivas.length > 0 ? (
          seriesActivas.map((serie, index) => (
            <ViendoCard 
              key={serie.obra_id} 
              index={index}
              serie={serie} 
              onAvanzar={onAvanzar} 
              onDescartar={onDescartar}
              onVerInfoEpisodio={onVerInfoEpisodio}
              onAbrirDetalle={onAbrirDetalle}
            />
          ))
        ) : (
          <p className="text-sm text-neutral-500 italic py-2">
            No tienes series activas en curso.
          </p>
        )}
      </div>
    </section>
  );
}