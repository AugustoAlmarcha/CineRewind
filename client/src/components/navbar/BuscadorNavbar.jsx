import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { buscarPeliculasAPI } from '../../api';
import { Search, X, Film, Sparkles, Tv, Star, ZoomIn, Check } from 'lucide-react';

export default function BuscadorNavbar({ onSeleccionarObra }) {
  const [query, setQuery] = useState('');
  const [resultados, setResultados] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [mostrarMenu, setMostrarMenu] = useState(false);
  const [obraParaPrevisualizar, setObraParaPrevisualizar] = useState(null);
  const obraParaPrevisualizarRef = useRef(null);
  obraParaPrevisualizarRef.current = obraParaPrevisualizar;

  const containerRef = useRef(null);
  const modalZoomRef = useRef(null);

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

  // Cerrar menú al hacer clic afuera (ignorando clicks dentro del modal de zoom)
  useEffect(() => {
    const handleClickAfuera = (e) => {
      if (obraParaPrevisualizarRef.current) return;
      if (modalZoomRef.current && modalZoomRef.current.contains(e.target)) return;
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setMostrarMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickAfuera);
    return () => document.removeEventListener('mousedown', handleClickAfuera);
  }, []);

  // Limpiar búsqueda tras registrar o recibir evento de limpieza
  useEffect(() => {
    const handleLimpiar = () => {
      setQuery('');
      setMostrarMenu(false);
    };
    window.addEventListener('cinerewind:limpiar-busqueda', handleLimpiar);
    return () => window.removeEventListener('cinerewind:limpiar-busqueda', handleLimpiar);
  }, []);

  const abrirPrevisualizacion = (item, e) => {
    if (e) e.stopPropagation();
    setObraParaPrevisualizar(item);
  };

  const cerrarPrevisualizacion = (e) => {
    if (e) e.stopPropagation();
    setObraParaPrevisualizar(null);
    setMostrarMenu(true);
  };

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
            title="Borrar búsqueda"
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
                {/* Póster con opción de zoom */}
                <div 
                  onClick={(e) => abrirPrevisualizacion(item, e)}
                  className="w-13 sm:w-15 aspect-[2/3] bg-neutral-300 dark:bg-neutral-800 rounded-lg overflow-hidden flex-shrink-0 shadow-sm group-hover:scale-105 transition-transform relative group/poster cursor-zoom-in"
                  title="Clic para ampliar portada y sinopsis"
                >
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
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/poster:opacity-100 transition-opacity flex items-center justify-center text-white">
                    <ZoomIn className="w-4 h-4 drop-shadow" />
                  </div>
                </div>

                {/* Info de la Obra */}
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {/* Badge distintivo de tipo */}
                    {item.tipo === 'serie' ? (
                      <span className="px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider bg-purple-600/15 text-purple-600 dark:text-purple-400 border border-purple-500/30 flex items-center gap-1 shadow-xs">
                        <Tv className="w-3 h-3 text-purple-500" />
                        <span>SERIE TV</span>
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider bg-rose-600/15 text-rose-600 dark:text-rose-400 border border-rose-500/30 flex items-center gap-1 shadow-xs">
                        <Film className="w-3 h-3 text-rose-500" />
                        <span>PELÍCULA</span>
                      </span>
                    )}

                    {item.anio && (
                      <span className="text-[11px] font-mono text-neutral-600 dark:text-neutral-400 font-bold bg-neutral-200/60 dark:bg-white/5 px-1.5 py-0.5 rounded-md">
                        {item.anio}
                      </span>
                    )}

                    {item.voto_promedio && (
                      <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1 bg-amber-500/10 px-1.5 py-0.5 rounded-md border border-amber-500/20">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                        <span>{item.voto_promedio}</span>
                      </span>
                    )}
                  </div>
                  
                  <h4 className="text-sm font-black text-neutral-900 dark:text-white group-hover:text-rose-500 transition-colors truncate">
                    {item.titulo}
                  </h4>

                  {item.titulo_original && item.titulo_original.toLowerCase() !== (item.titulo || '').toLowerCase() && (
                    <p className="text-[11px] text-neutral-500 dark:text-neutral-400 italic truncate font-sans">
                      Original: {item.titulo_original}
                    </p>
                  )}

                  {item.sinopsis && (
                    <p className="text-xs text-neutral-600 dark:text-neutral-400 line-clamp-2 leading-relaxed">
                      {item.sinopsis}
                    </p>
                  )}
                </div>

                {/* Botón directo de Zoom / Previsualización */}
                <button
                  type="button"
                  onClick={(e) => abrirPrevisualizacion(item, e)}
                  className="p-2 sm:px-2.5 sm:py-1.5 rounded-xl bg-neutral-200/80 dark:bg-white/10 hover:bg-rose-600 hover:text-white text-neutral-600 dark:text-neutral-300 transition cursor-pointer flex-shrink-0 flex items-center gap-1 text-[11px] font-bold border border-neutral-300 dark:border-white/10 shadow-xs"
                  title="Ver portada grande y sinopsis antes de elegir"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Zoom</span>
                </button>
              </div>
            ))
          ) : (
            <div className="py-10 text-center text-xs text-neutral-500 font-medium">
              No encontramos títulos que coincidan con tu búsqueda.
            </div>
          )}
        </div>
      )}

      {/* MODAL DE ZOOM / PREVISUALIZACIÓN DE OBRA */}
      {obraParaPrevisualizar && typeof document !== 'undefined' && createPortal(
        <div 
          onClick={cerrarPrevisualizacion}
          className="fixed inset-0 z-[10000] bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-fadeIn select-none"
        >
          <div 
            ref={modalZoomRef}
            onClick={(e) => e.stopPropagation()}
            className="bg-[#fcfaf7] dark:bg-[#141418] border border-neutral-300 dark:border-white/15 rounded-3xl max-w-md w-full overflow-hidden shadow-2xl flex flex-col max-h-[92vh] animate-scaleUp text-neutral-900 dark:text-white"
          >
            {/* Cabecera modal con botón cerrar */}
            <div className="p-3 sm:p-4 border-b border-neutral-200 dark:border-white/10 flex items-center justify-between gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-rose-500">
                Previsualización de obra
              </span>
              <button
                type="button"
                onClick={cerrarPrevisualizacion}
                className="w-8 h-8 rounded-full bg-neutral-200/80 dark:bg-white/10 hover:bg-rose-600 hover:text-white flex items-center justify-center transition cursor-pointer"
                title="Cerrar y volver a la búsqueda"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Contenido con póster grande y detalles */}
            <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
              <div className="flex gap-4 items-start">
                <div className="w-28 sm:w-36 aspect-[2/3] rounded-2xl overflow-hidden bg-neutral-800 shadow-xl flex-shrink-0 border border-black/10 dark:border-white/10">
                  {obraParaPrevisualizar.poster_path ? (
                    <img 
                      src={obraParaPrevisualizar.poster_path.startsWith('http') 
                        ? obraParaPrevisualizar.poster_path 
                        : `https://image.tmdb.org/t/p/w500${obraParaPrevisualizar.poster_path}`
                      } 
                      alt={obraParaPrevisualizar.titulo}
                      className="w-full h-full object-cover" 
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs text-neutral-500 font-bold">
                      Sin póster
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1 space-y-1.5">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider bg-rose-600/15 text-rose-600 dark:text-rose-400 border border-rose-500/30">
                      {obraParaPrevisualizar.tipo}
                    </span>
                    {obraParaPrevisualizar.anio && (
                      <span className="text-xs font-mono text-neutral-500 dark:text-neutral-400 font-bold">
                        {obraParaPrevisualizar.anio}
                      </span>
                    )}
                    {obraParaPrevisualizar.voto_promedio && (
                      <span className="text-[10px] font-bold text-amber-500 flex items-center gap-0.5">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                        {obraParaPrevisualizar.voto_promedio}
                      </span>
                    )}
                  </div>

                  <h3 className="text-base sm:text-lg font-black text-neutral-900 dark:text-white leading-tight">
                    {obraParaPrevisualizar.titulo}
                  </h3>

                  {obraParaPrevisualizar.titulo_original && obraParaPrevisualizar.titulo_original.toLowerCase() !== (obraParaPrevisualizar.titulo || '').toLowerCase() && (
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 italic">
                      Original: {obraParaPrevisualizar.titulo_original}
                    </p>
                  )}
                </div>
              </div>

              {/* Sinopsis completa */}
              <div className="p-3.5 rounded-2xl bg-neutral-200/50 dark:bg-white/5 border border-neutral-300/80 dark:border-white/5 space-y-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-neutral-500 dark:text-neutral-400 block">
                  Sinopsis
                </span>
                <p className="text-xs sm:text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed font-normal">
                  {obraParaPrevisualizar.sinopsis || 'Sin descripción disponible.'}
                </p>
              </div>
            </div>

            {/* Botonera de acción */}
            <div className="p-3 sm:p-4 border-t border-neutral-200 dark:border-white/10 bg-neutral-100 dark:bg-[#101014] flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={cerrarPrevisualizacion}
                className="px-4 py-2 rounded-xl border border-neutral-300 dark:border-white/10 text-xs font-bold text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-white/5 transition cursor-pointer"
              >
                Volver a la lista
              </button>

              <button
                type="button"
                onClick={() => {
                  const seleccionada = obraParaPrevisualizar;
                  setObraParaPrevisualizar(null);
                  setMostrarMenu(false);
                  setQuery('');
                  if (onSeleccionarObra) onSeleccionarObra(seleccionada);
                }}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 active:scale-95 text-xs font-black uppercase tracking-wider text-white rounded-xl shadow-lg transition cursor-pointer flex items-center gap-1.5"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span>Registrar esta obra</span>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}