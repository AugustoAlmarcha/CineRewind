import React, { useState, useEffect } from 'react';
import { buscarPeliculasAPI } from '../../api';

export default function ModalElegirFavorito({ posicion, tipoEsperado = 'serie', onClose, onSeleccionar }) {
  const [query, setQuery] = useState('');
  const [resultados, setResultados] = useState([]);
  const [misObras, setMisObras] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [vista, setVista] = useState('guardadas'); // 'guardadas' o 'catalogo'

  // 1. Cargar las obras que ya tienes en tu base de datos
  useEffect(() => {
    const cargarObrasLocales = async () => {
      setCargando(true);
      try {
        const token = localStorage.getItem('cinerewind_token');
        const res = await fetch(`/api/historial/catalogo-usuario?tipo=${tipoEsperado}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        if (res.ok) {
          const data = await res.json();
          setMisObras(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        console.error('Error al cargar obras guardadas:', err);
      } finally {
        setCargando(false);
      }
    };
    cargarObrasLocales();
  }, [tipoEsperado]);

  // 2. Buscador en catálogo general (TMDb) solo si escribes algo
  useEffect(() => {
    if (!query.trim()) {
      setResultados([]);
      return;
    }
    setVista('catalogo');
    const timer = setTimeout(async () => {
      setCargando(true);
      try {
        const data = await buscarPeliculasAPI(query);
        const lista = Array.isArray(data) ? data : (data?.resultados || []);
        // Filtramos para sugerir preferentemente el tipo de esta ranura
        setResultados(lista.filter(item => {
          const esSerie = item.tipo?.toLowerCase() === 'serie' || Boolean(item.first_air_date);
          return tipoEsperado === 'serie' ? esSerie : !esSerie;
        }));
      } catch (err) {
        console.error('Error buscando obras:', err);
        setResultados([]);
      } finally {
        setCargando(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, tipoEsperado]);

  const obrasAMostrar = query.trim() ? resultados : misObras;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-[#141419] border border-white/10 rounded-3xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[88vh]">
        {/* Cabecera */}
        <div className="p-5 border-b border-white/10 flex justify-between items-center bg-[#181820]">
          <div>
            <span className="text-[11px] font-mono text-rose-500 uppercase font-black tracking-widest">
              TOP 4 • {tipoEsperado === 'serie' ? 'SERIES' : 'PELÍCULAS'} • RANURA #{posicion}
            </span>
            <h3 className="text-xl font-black text-white">
              Elegir {tipoEsperado === 'serie' ? 'Serie Favorita' : 'Película Favorita'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-rose-600 text-white flex items-center justify-center text-sm font-bold transition cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Buscador y selector de pestaña */}
        <div className="p-4 border-b border-white/5 space-y-3 bg-[#16161c]">
          <input
            type="text"
            placeholder={`Buscar en TMDb o filtrar tus ${tipoEsperado === 'serie' ? 'series' : 'películas'}...`}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full px-4 py-3 rounded-2xl bg-[#20202a] border border-white/10 text-white placeholder-neutral-500 focus:outline-none focus:border-rose-500 text-sm font-bold"
          />

          {!query && (
            <div className="flex gap-2">
              <span className="text-xs font-mono font-bold text-neutral-400">
                Mostrando tus títulos ya registrados en CineRewind ({misObras.length})
              </span>
            </div>
          )}
        </div>

        {/* Grilla con pósteres grandes (Estilo de tus Vistas) */}
        <div className="p-5 overflow-y-auto flex-1">
          {cargando && (
            <p className="text-xs text-center text-neutral-400 py-12 font-mono">
              Cargando títulos...
            </p>
          )}

          {!cargando && obrasAMostrar.length === 0 && (
            <div className="text-center py-16 space-y-2">
              <p className="text-sm font-bold text-neutral-300">
                {query ? 'No se encontraron resultados.' : `Aún no tienes ${tipoEsperado === 'serie' ? 'series' : 'películas'} registradas.`}
              </p>
              <p className="text-xs text-neutral-500">
                Escribe en el buscador de arriba para elegir directamente del catálogo global.
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {obrasAMostrar.map((obra) => {
              const poster = obra.poster_path
                ? (obra.poster_path.startsWith('http') ? obra.poster_path : `https://image.tmdb.org/t/p/w500${obra.poster_path}`)
                : null;
              const esSerie = tipoEsperado === 'serie';

              return (
                <div
                  key={`${obra.tmdb_id || obra.id}-${posicion}`}
                  onClick={() => {
                    onSeleccionar({
                      posicion,
                      tmdb_id: obra.tmdb_id || obra.id,
                      tipo: esSerie ? 'serie' : 'pelicula',
                      titulo: obra.titulo || obra.title || obra.name,
                      poster_path: obra.poster_path || null,
                    });
                  }}
                  className="group relative aspect-[2/3] rounded-2xl overflow-hidden bg-neutral-900 border border-white/10 hover:border-rose-500 cursor-pointer shadow-lg transition-transform hover:-translate-y-1"
                >
                  {poster ? (
                    <img
                      src={poster}
                      alt={obra.titulo}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-neutral-600 text-xs font-mono p-2 text-center">
                      Sin Póster
                    </div>
                  )}

                  {/* Gradiente y etiquetas estilo CineRewind */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent p-3 flex flex-col justify-between">
                    <span className="self-start text-[9px] font-black uppercase px-2 py-0.5 bg-neutral-900/80 border border-white/20 text-white rounded-md tracking-wider">
                      {esSerie ? 'SERIE' : 'PELÍCULA'}
                    </span>

                    <div>
                      <p className="text-xs font-black text-white truncate drop-shadow">
                        {obra.titulo || obra.title || obra.name}
                      </p>
                      <span className="text-[10px] text-rose-400 font-bold group-hover:text-white transition">
                        ✓ Seleccionar
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}