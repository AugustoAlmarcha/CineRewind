import React from 'react';
import CollagePortadas from './CollagePortadas';

export default function VistaSelectorCarpetas({
  carpetas = [],
  tituloVacio = 'No hay registros disponibles.',
  onSeleccionar
}) {
  if (carpetas.length === 0) {
    return (
      <div className="py-24 text-center text-neutral-500 italic">
        {tituloVacio}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 pt-4">
      {carpetas.map((c) => (
        <div
          key={c.id}
          onClick={() => onSeleccionar(c.valor)}
          className="group relative aspect-square rounded-3xl overflow-hidden cursor-pointer border border-neutral-300 dark:border-white/10 bg-neutral-950 shadow-lg hover:scale-[1.02] hover:border-rose-500/50 transition-all duration-300 select-none"
        >
          {/* 1. Opacidad equilibrada: 65% en reposo, sube a 80% al pasar el mouse */}
          <div className="w-full h-full opacity-65 group-hover:opacity-80 transition duration-300">
            <CollagePortadas items={c.items} />
          </div>

          {/* 2. Capa oscura elegante para resaltar el año y las obras */}
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 group-hover:bg-black/25 transition duration-300 p-4">
            <h3 className="text-3xl sm:text-4xl font-black text-white tracking-tight drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)] group-hover:scale-105 transition-transform duration-300 text-center">
              {c.etiqueta}
            </h3>
            <span className="mt-2 text-xs font-black px-3 py-1 bg-rose-600 text-white rounded-full shadow-md drop-shadow">
              {c.subtexto}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}