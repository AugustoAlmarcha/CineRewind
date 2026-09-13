import React, { useState, useEffect, useRef } from 'react';
import { buscarPeliculasAPI } from '../api';

export default function Navbar({ onSeleccionarObra, darkMode, onToggleTheme }) {
  const [query, setQuery] = useState('');
  const [resultados, setResultados] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [mostrarMenu, setMostrarMenu] = useState(false);
  const containerRef = useRef(null);

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
    <header className="sticky top-0 z-50 bg-[#f7f4ed]/90 dark:bg-[#0f0f12]/95 backdrop-blur-md border-b border-neutral-300/80 dark:border-white/10 px-8 py-4 transition-colors duration-300">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-8">
        
        {/* Identidad con Logo ampliado */}
        <div className="flex items-center gap-3 cursor-pointer select-none">
          <img 
            src="/logo.png" 
            alt="CineRewind Logo" 
            className="w-14 h-14 object-contain drop-shadow-[0_0_12px_rgba(225,29,72,0.4)] transition-transform hover:scale-105"
          />
          <span className="text-2xl font-black tracking-tight text-neutral-900 dark:text-white">
            Cine<span className="text-rose-600">Rewind</span>
          </span>
        </div>

        {/* Buscador Amplio */}
        <div className="flex-1 max-w-2xl relative" ref={containerRef}>
          <div className="relative flex items-center">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => query.trim().length >= 2 && setMostrarMenu(true)}
              placeholder="Buscar películas, series, documentales..."
              className="w-full bg-neutral-100 dark:bg-[#18181c] border border-neutral-300 dark:border-white/15 focus:border-rose-600 text-neutral-900 dark:text-white rounded-xl px-5 py-3 text-base placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-rose-600/30 transition-all duration-200"
            />
            {query && (
              <button 
                onClick={() => { setQuery(''); setMostrarMenu(false); }}
                className="absolute right-4 text-neutral-400 hover:text-neutral-600 dark:hover:text-white text-sm"
              >
                ✕
              </button>
            )}
          </div>

          {/* Menú Desplegable Cinemático Amplio */}
          {mostrarMenu && (
            <div className="absolute top-full left-0 right-0 mt-3 bg-[#fbf9f5] dark:bg-[#16161a] border border-neutral-300/70 dark:border-white/10 rounded-2xl shadow-2xl max-h-[600px] overflow-y-auto z-50 p-4 space-y-3">
              {cargando ? (
                <div className="py-12 text-center text-base text-neutral-600 dark:text-neutral-400">
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
                    {/* Póster grande */}
                    <div className="w-20 h-28 bg-neutral-300 dark:bg-neutral-800 rounded-xl overflow-hidden flex-shrink-0 shadow-md group-hover:scale-105 transition-transform duration-200">
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

                    {/* Textos grandes y nítidos */}
                    <div className="flex-1 min-w-0 space-y-1.5">
                      <div className="flex items-center gap-2.5">
                        <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-rose-600/15 text-rose-600 dark:text-rose-400 border border-rose-600/20">
                          {item.tipo}
                        </span>
                        {item.anio && (
                          <span className="text-sm font-semibold text-neutral-600 dark:text-neutral-400">
                            {item.anio}
                          </span>
                        )}
                      </div>
                      
                      <h4 className="text-lg font-extrabold text-neutral-900 dark:text-white group-hover:text-rose-600 transition-colors truncate">
                        {item.titulo}
                      </h4>

                      {item.sinopsis && (
                        <p className="text-sm text-neutral-600 dark:text-neutral-300 line-clamp-2 leading-relaxed">
                          {item.sinopsis}
                        </p>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-10 text-center text-base text-neutral-500">
                  No se encontraron resultados coincidentes.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Navegación y Botón de Tema */}
        <div className="flex items-center gap-6">
          <nav className="flex items-center gap-6 text-sm font-semibold text-neutral-600 dark:text-neutral-400">
            <span className="text-neutral-900 dark:text-white hover:text-rose-600 cursor-pointer transition">Inicio</span>
            <span className="hover:text-neutral-900 dark:hover:text-white cursor-pointer transition">Tendencias</span>
            <span className="hover:text-neutral-900 dark:hover:text-white cursor-pointer transition">Mi Perfil</span>
          </nav>

          {/* Botón Sol / Luna en SVG */}
          <button
            onClick={onToggleTheme}
            className="p-2.5 rounded-xl border border-neutral-200 dark:border-white/10 bg-neutral-100 dark:bg-[#18181c] text-neutral-700 dark:text-amber-400 hover:border-rose-500/40 cursor-pointer transition-all duration-200"
            title={darkMode ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
            aria-label="Alternar tema"
          >
            {darkMode ? (
              // Ícono de Sol para volver a claro
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            ) : (
              // Ícono de Luna para volver a oscuro
              <svg className="w-5 h-5 text-neutral-700" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            )}
          </button>
        </div>

      </div>
    </header>
  );
}