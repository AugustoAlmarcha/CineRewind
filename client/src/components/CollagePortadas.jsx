import React, { useMemo } from 'react';

export default function CollagePortadas({ items = [] }) {
  const fotos = useMemo(() => {
    // 1. Extraer portadas únicas agrupando por obra para no repetir la misma serie
    const mapaObras = new Map();

    items.forEach((it) => {
      const clave = it.obra_id || it.titulo;
      if (!mapaObras.has(clave) && it.poster_path) {
        const ruta = it.poster_path;
        const urlFinal = ruta.startsWith('http')
          ? ruta
          : `https://image.tmdb.org/t/p/w500${ruta.startsWith('/') ? ruta : `/${ruta}`}`;
        mapaObras.set(clave, urlFinal);
      }
    });

    const unicas = Array.from(mapaObras.values());

    if (unicas.length === 0) return [];
    if (unicas.length === 1) return [unicas[0]];
    if (unicas.length === 2) return [unicas[0], unicas[1], unicas[0], unicas[1]];
    if (unicas.length === 3) return [unicas[0], unicas[1], unicas[2], unicas[0]];
    
    // Si hay 4 o más distintas, toma las 4 primeras fijas
    return unicas.slice(0, 4);
  }, [items]);

  if (fotos.length === 0) {
    return (
      <div className="w-full h-full bg-[#16161a] flex items-center justify-center text-neutral-500 text-xs">
        Sin obras
      </div>
    );
  }

  // Si solo hay una sola obra registrada en todo el año/mes
  if (fotos.length === 1) {
    return (
      <div className="w-full h-full relative overflow-hidden bg-neutral-900">
        <img 
          src={fotos[0]} 
          alt="Portada" 
          className="w-full h-full object-cover brightness-[0.7] group-hover:scale-105 transition-transform duration-500" 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
      </div>
    );
  }

  // Mosaico 2x2 compuesto por obras distintas
  return (
    <div className="w-full h-full grid grid-cols-2 grid-rows-2 overflow-hidden bg-neutral-900 group-hover:scale-105 transition-transform duration-500">
      {fotos.map((src, i) => (
        <div key={i} className="relative w-full h-full overflow-hidden border-[0.5px] border-black/40">
          <img 
            src={src} 
            alt={`Collage ${i}`} 
            className="w-full h-full object-cover brightness-[0.8]" 
          />
        </div>
      ))}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />
    </div>
  );
}