import React, { useState, useEffect, useRef } from 'react';
import { buscarPeliculasAPI } from '../../api';

export default function BuscadorNavbar({ onSeleccionarObra }) {
  const [query, setQuery] = useState('');
  const [resultados, setResultados] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [mostrarMenu, setMostrarMenu] = useState(false);

  const containerRef = useRef(null);

  // Búsqueda con debounce
  useEffect(() => {
    if (query.trim().length < 2) {
      setResultados([]);
      setMostrarMenu(false);
      return;
    }

    const timer = setTimeout(async () => {
      setCargando(true);
      try {
        const data = await buscarPeliculasAPI(query);
        setResultados(data);
        setMostrarMenu(true);
      } catch (err) {
        console.error('Error al buscar:', err);
      } finally {
        setCargando(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  // Cerrar menú al hacer clic afuera
  useEffect(() => {
    const handleClickAfuera = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setMostrarMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickAfuera);
    return () => document.removeEventListener('mousedown', handleClickAfuera);
  }, []);

  return (
    <div className="flex-1 max-w-2xl relative" ref={containerRef}>
      <div className="relative flex items-center">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.trim().length >= 2 && setMostrarMenu(true)}
          placeholder="Buscar películas, series, documentales..."
          className="w-full bg-neutral-100 dark:bg-[#18181c] border border-neutral-300 dark:border-white/15 focus:border-rose-600 text-neutral-900 dark:text-white rounded-xl px-5 py-2.5 text-sm placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-rose-600/30 transition-all duration-200"
        />
        {query && (
          <button 
            type="button"
            onClick={() => { setQuery(''); setMostrarMenu(false); }}
            className="absolute right-4 text-neutral-400 hover:text-neutral-600 dark:hover:text-white text-sm cursor-pointer"
          >
            ✕
          </button>
        )}
      </div>

      {mostrarMenu && (
        <div className="absolute top-full left-0 right-0 mt-3 bg-[#fbf9f5] dark:bg-[#16161a] border border-neutral-300/70 dark:border-white/10 rounded-2xl shadow-2xl max-h-[600px] overflow-y-auto z-50 p-4 space-y-3">
          {cargando ? (
            <div className="py-12 text-center text-sm text-neutral-600 dark:text-neutral-400">
              <span className="animate-pulse font-medium">Buscando títulos en TMDb...</span>
            </div>
          ) : resultados.length > 0 ? (
            resultados.map((item) => (
              <div
                key={item.tmdb_id}
                onClick={() => {
                  onSeleccionarObra(item);
                  setMostrarMenu(false);
                  setQuery('');
                }}
                className="flex items-center gap-5 p-3.5 hover:bg-neutral-200/60 dark:hover:bg-white/5 rounded-2xl cursor-pointer transition-all duration-200 group border border-transparent hover:border-neutral-300 dark:hover:border-white/10"
              >
                <div className="w-16 h-24 bg-neutral-300 dark:bg-neutral-800 rounded-xl overflow-hidden flex-shrink-0 shadow-md group-hover:scale-105 transition-transform duration-200">
                  {item.poster_path ? (
                    <img 
                      src={item.poster_path} 
                      alt={item.titulo} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs text-neutral-500 font-semibold">
                      Sin foto
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase bg-rose-600/15 text-rose-600 dark:text-rose-400 border border-rose-600/20">
                      {item.tipo}
                    </span>
                    {item.anio && (
                      <span className="text-xs font-semibold text-neutral-600 dark:text-neutral-400">
                        {item.anio}
                      </span>
                    )}
                  </div>
                  
                  <h4 className="text-base font-extrabold text-neutral-900 dark:text-white group-hover:text-rose-600 transition-colors truncate">
                    {item.titulo}
                  </h4>

                  {item.sinopsis && (
                    <p className="text-xs text-neutral-600 dark:text-neutral-300 line-clamp-2 leading-relaxed">
                      {item.sinopsis}
                    </p>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="py-10 text-center text-sm text-neutral-500">
              No se encontraron resultados coincidentes.
            </div>
          )}
        </div>
      )}
    </div>
  );
}