import React from 'react';
import ViendoCard from './ViendoCard';

export default function CarruselViendo({ 
  seriesActivas = [], 
  onAvanzar, 
  onDescartar, 
  onAbrirDetalle, 
  onVerInfoEpisodio 
}) {
  return (
    <section className="relative z-20 space-y-4">
      <h2 className="text-xl font-extrabold tracking-tight text-neutral-900 dark:text-white">
        Viendo Actualmente
      </h2>

      {/* Se agrega px-6 -mx-6 para darle margen lateral al pop-up de la primera y última tarjeta */}
      <div className="flex gap-4 overflow-x-auto scrollbar-elegante py-10 -my-10 pb-7 px-6 -mx-6 scroll-smooth items-center">
        {seriesActivas.length > 0 ? (
          seriesActivas.map((serie, index) => (
            <ViendoCard 
              key={serie.obra_id || serie.tmdb_id} 
              index={index}
              totalSeries={seriesActivas.length}
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