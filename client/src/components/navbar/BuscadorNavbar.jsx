import React, { useState, useEffect, useRef } from 'react';
import { buscarPeliculasAPI } from '../../api';
import { Search, X, Film, Sparkles } from 'lucide-react';

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
        setResultados(Array.isArray(data) ? data : []);
        setMostrarMenu(true);
      } catch (err) {
        console.error('Error al buscar títulos:', err);
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
    <div className="w-full relative" ref={containerRef}>
      {/* Campo de Entrada con Icono Vectorial */}
      <div className="relative flex items-center">
        <Search className="w-4 h-4 text-neutral-400 dark:text-neutral-500 absolute left-3.5 pointer-events-none" />
        
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.trim().length >= 2 && setMostrarMenu(true)}
          placeholder="Buscar películas, series..."
          className="w-full bg-neutral-200/60 dark:bg-[#18181c] border border-neutral-300/80 dark:border-white/10 focus:border-rose-500 text-neutral-900 dark:text-white rounded-xl pl-9 pr-9 py-2 text-xs sm:text-sm placeholder-neutral-400 dark:placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-rose-500/20 transition-all"
        />

        {query && (
          <button 
            type="button"
            onClick={() => { setQuery(''); setMostrarMenu(false); }}
            className="absolute right-3 text-neutral-400 hover:text-neutral-700 dark:hover:text-white p-1 rounded-md transition cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Menú Desplegable Adaptable (Fixed en móvil / Anclado en desktop) */}
      {mostrarMenu && (
        <div className="fixed sm:absolute top-[72px] sm:top-full inset-x-3 sm:inset-x-0 mt-1 sm:mt-2 bg-[#fbf9f5]/95 dark:bg-[#16161a]/95 backdrop-blur-xl border border-neutral-300 dark:border-white/15 rounded-2xl shadow-2xl max-h-[75vh] sm:max-h-[520px] overflow-y-auto z-50 p-2 sm:p-3 space-y-1.5 divide-y divide-neutral-200/60 dark:divide-white/5">
          {cargando ? (
            <div className="py-12 text-center text-xs text-neutral-500 flex flex-col items-center justify-center gap-2">
              <Sparkles className="w-5 h-5 text-rose-500 animate-spin" />
              <span className="font-semibold">Buscando en catálogo de TMDb...</span>
            </div>
          ) : resultados.length > 0 ? (
            resultados.map((item) => (
              <div
                key={item.tmdb_id || item.id}
                onClick={() => {
                  if (onSeleccionarObra) onSeleccionarObra(item);
                  setMostrarMenu(false);
                  setQuery('');
                }}
                className="flex items-center gap-3.5 p-2.5 sm:p-3 hover:bg-neutral-200/60 dark:hover:bg-white/5 rounded-xl cursor-pointer transition-colors group pt-3 first:pt-2"
              >
                {/* Póster */}
                <div className="w-12 sm:w-14 aspect-[2/3] bg-neutral-300 dark:bg-neutral-800 rounded-lg overflow-hidden flex-shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                  {item.poster_path ? (
                    <img 
                      src={item.poster_path.startsWith('http') ? item.poster_path : `https://image.tmdb.org/t/p/w185${item.poster_path}`} 
                      alt={item.titulo} 
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[10px] text-neutral-400 font-mono text-center p-1">
                      Sin póster
                    </div>
                  )}
                </div>

                {/* Info de la Obra */}
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-rose-600/15 text-rose-600 dark:text-rose-400 border border-rose-600/20">
                      {item.tipo}
                    </span>
                    {item.anio && (
                      <span className="text-[11px] font-mono text-neutral-500 dark:text-neutral-400 font-semibold">
                        {item.anio}
                      </span>
                    )}
                  </div>
                  
                  <h4 className="text-sm font-extrabold text-neutral-900 dark:text-white group-hover:text-rose-500 transition-colors truncate">
                    {item.titulo}
                  </h4>

                  {item.sinopsis && (
                    <p className="text-xs text-neutral-600 dark:text-neutral-400 line-clamp-2 leading-relaxed">
                      {item.sinopsis}
                    </p>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="py-10 text-center text-xs text-neutral-500 font-medium">
              No encontramos títulos que coincidan con tu búsqueda.
            </div>
          )}
        </div>
      )}
    </div>
  );
}