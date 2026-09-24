import React from 'react';

export default function CollagePortadas({ items = [] }) {
  // 1. Obtener la imagen puntual de lo que se vio (foto del episodio si es serie, o póster de peli)
  const fotosVistas = [];
  const fotosRegistradas = new Set();

  for (const it of items) {
    // Prioridad total a la captura horizontal del episodio visto
    const img = it.foto_episodio || it.poster_path || it.poster_obra || it.poster_serie;
    
    // Evitamos duplicar la misma foto exacta
    if (img && !fotosRegistradas.has(img)) {
      fotosRegistradas.add(img);
      fotosVistas.push(img);
    }
  }

  // Tomamos hasta 4 capturas distintas
  const seleccion = fotosVistas.slice(0, 4);

  // Fallback si no hay fotos
  if (seleccion.length === 0) {
    return (
      <div className="absolute inset-0 bg-neutral-900 flex items-center justify-center">
        <span className="text-neutral-600 text-xs">Sin imágenes</span>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 overflow-hidden rounded-2xl">
      {/* Grilla visual según cantidad de capturas */}
      {seleccion.length === 1 && (
        <img
          src={seleccion[0]}
          alt=""
          className="w-full h-full object-cover"
        />
      )}

      {seleccion.length === 2 && (
        <div className="w-full h-full grid grid-cols-2">
          {seleccion.map((src, i) => (
            <img key={i} src={src} alt="" className="w-full h-full object-cover" />
          ))}
        </div>
      )}

      {seleccion.length === 3 && (
        <div className="w-full h-full grid grid-cols-2 grid-rows-2">
          <img src={seleccion[0]} alt="" className="w-full h-full object-cover col-span-2" />
          <img src={seleccion[1]} alt="" className="w-full h-full object-cover" />
          <img src={seleccion[2]} alt="" className="w-full h-full object-cover" />
        </div>
      )}

      {seleccion.length >= 4 && (
        <div className="w-full h-full grid grid-cols-2 grid-rows-2">
          {seleccion.map((src, i) => (
            <img key={i} src={src} alt="" className="w-full h-full object-cover" />
          ))}
        </div>
      )}

      {/* Capa de contraste MUCHO más clara: solo un sombreado central sutil para que el texto blanco resalte sin apagar las fotos */}
      <div className="absolute inset-0 bg-radial from-black/20 via-black/40 to-black/60 pointer-events-none" />
    </div>
  );
}