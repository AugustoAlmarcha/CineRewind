import React from 'react';

export default function VistaCatalogoTotal({ 
  obras, 
  resolverImagen, 
  onSeleccionarSerie, 
  onAbrirDetalleTimeline 
}) {
  if (obras.length === 0) {
    return (
      <div className="py-24 text-center text-neutral-500 italic">
        No se encontraron obras en tu catálogo histórico.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 pt-4">
      {obras.map((obra) => {
        const urlPoster = resolverImagen(obra.poster_path);
        const esSerie = obra.tipo?.toLowerCase() === 'serie';
        const esSaga = Boolean(obra.esSaga);
        const cantPeliculasDistintas = obra.peliculasDistintas?.length || 1;

        return (
          <div
            key={obra.obra_id || obra.id_agrupador || obra.titulo}
            onClick={() => {
              // Tanto series como películas y sagas se abren en la vista cronológica con fechas y carátulas
              onSeleccionarSerie(obra);
            }}
            className="aspect-[2/3] relative rounded-3xl overflow-hidden cursor-pointer border border-neutral-300/80 dark:border-white/10 bg-neutral-900 shadow-md hover:scale-[1.02] hover:border-rose-500 transition-all duration-300 group select-none"
          >
            {urlPoster ? (
              <img
                src={urlPoster}
                alt={obra.titulo}
                loading="lazy"
                className="w-full h-full object-cover group-hover:scale-105 transition duration-300 brightness-[0.95]"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center p-4 text-center font-bold text-neutral-400">
                {obra.titulo}
              </div>
            )}

            <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/30 to-transparent flex flex-col justify-between p-4 pointer-events-none">
              <div className="flex justify-between items-center gap-1">
                <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-lg border ${
                  esSaga 
                    ? 'bg-amber-500 text-neutral-950 font-black border-amber-300 shadow'
                    : 'bg-black/70 text-white border-white/10'
                }`}>
                  {esSerie 
                    ? 'Serie' 
                    : (esSaga ? `Saga · ${cantPeliculasDistintas} pelis` : 'Película')}
                </span>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-lg bg-rose-600 text-white shadow">
                  {obra.registros.length} {obra.registros.length === 1 ? 'visto' : 'vistos'}
                </span>
              </div>

              <div>
                <h3 className="text-base font-black text-white truncate drop-shadow" title={obra.titulo}>
                  {obra.titulo}
                </h3>
                <p className="text-[11px] text-neutral-300 mt-0.5 font-bold">
                  {esSerie 
                    ? 'Toca para abrir capítulos' 
                    : esSaga 
                    ? `Toca para abrir saga (${cantPeliculasDistintas} películas)`
                    : (obra.registros.length > 1 
                        ? `Toca para ver fechas (${obra.registros.length} vistos)` 
                        : 'Toca para abrir fecha')}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}