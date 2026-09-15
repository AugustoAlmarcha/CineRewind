import React, { useState, useEffect, useRef } from 'react';
import { obtenerTendenciasAPI, obtenerTimelineAPI } from '../api';

const PAISES = [
  { codigo: 'AR', nombre: 'Argentina', banderaUrl: 'https://flagcdn.com/w40/ar.png' },
  { codigo: 'ES', nombre: 'España', banderaUrl: 'https://flagcdn.com/w40/es.png' },
  { codigo: 'US', nombre: 'Estados Unidos', banderaUrl: 'https://flagcdn.com/w40/us.png' },
  { codigo: 'MX', nombre: 'México', banderaUrl: 'https://flagcdn.com/w40/mx.png' },
  { codigo: 'JP', nombre: 'Japón', banderaUrl: 'https://flagcdn.com/w40/jp.png' },
  { codigo: 'BR', nombre: 'Brasil', banderaUrl: 'https://flagcdn.com/w40/br.png' },
  { codigo: 'GB', nombre: 'Reino Unido', banderaUrl: 'https://flagcdn.com/w40/gb.png' },
  { codigo: 'FR', nombre: 'Francia', banderaUrl: 'https://flagcdn.com/w40/fr.png' },
  { codigo: 'IT', nombre: 'Italia', banderaUrl: 'https://flagcdn.com/w40/it.png' },
  { codigo: 'KR', nombre: 'Corea del Sur', banderaUrl: 'https://flagcdn.com/w40/kr.png' },
];

export default function Tendencias({ onSeleccionarObra , actualizarTrigger = 0}) {
  const [tipoTendencia, setTipoTendencia] = useState('movie'); // 'movie' | 'tv'
  const [modoGlobal, setModoGlobal] = useState(true);
  const [paisSeleccionado, setPaisSeleccionado] = useState(PAISES[0]);
  const [mostrarPopUpPaises, setMostrarPopUpPaises] = useState(false);

  const [obras, setObras] = useState([]);
  const [pagina, setPagina] = useState(1);
  const [cargando, setCargando] = useState(true);
  const [cargandoMas, setCargandoMas] = useState(false);

  const menuPaisesRef = useRef(null);

  // Conjunto de IDs de obras vistas para verificación rápida en O(1)
  const [idsVistos, setIdsVistos] = useState(new Set());

  // Cargar historial del usuario para detectar qué títulos ya fueron vistos
  useEffect(() => {
    let cancelado = false;
    const cargarHistorial = async () => {
      try {
        const historial = await obtenerTimelineAPI(1);
        if (!cancelado && Array.isArray(historial)) {
          const conjunto = new Set(historial.map((item) => Number(item.tmdb_id)));
          setIdsVistos(conjunto);
        }
      } catch (e) {
        console.error('Error al cargar historial para tendencias:', e);
      }
    };
    cargarHistorial();
    return () => { 
      cancelado = true;
    };
  }, [actualizarTrigger]);

  // Cerrar menú flotante de banderas al hacer clic afuera
  useEffect(() => {
    const clickAfuera = (e) => {
      if (menuPaisesRef.current && !menuPaisesRef.current.contains(e.target)) {
        setMostrarPopUpPaises(false);
      }
    };
    document.addEventListener('mousedown', clickAfuera);
    return () => document.removeEventListener('mousedown', clickAfuera);
  }, []);

  // Carga inicial o reinicio al cambiar tipo o país (vuelve a página 1)
  useEffect(() => {
    let cancelado = false;

    const cargarTendencias = async () => {
      setCargando(true);
      setPagina(1);
      const codigoPais = modoGlobal ? 'GLOBAL' : paisSeleccionado.codigo;

      try {
        const datos = await obtenerTendenciasAPI(tipoTendencia, codigoPais, 1);
        if (!cancelado) {
          setObras(Array.isArray(datos) ? datos : []);
        }
      } catch (err) {
        console.error('Error al cargar tendencias:', err);
      } finally {
        if (!cancelado) setCargando(false);
      }
    };

    cargarTendencias();

    return () => {
      cancelado = true;
    };
  }, [tipoTendencia, modoGlobal, paisSeleccionado]);

  // Cargar páginas adicionales acumulando resultados (hasta 100 obras)
  const handleCargarMas = async () => {
    if (cargandoMas || pagina >= 5) return;
    setCargandoMas(true);
    const siguientePagina = pagina + 1;
    const codigoPais = modoGlobal ? 'GLOBAL' : paisSeleccionado.codigo;

    try {
      const nuevasObras = await obtenerTendenciasAPI(tipoTendencia, codigoPais, siguientePagina);
      setObras((prev) => [...prev, ...nuevasObras]);
      setPagina(siguientePagina);
    } catch (err) {
      console.error('Error al cargar más títulos:', err);
    } finally {
      setCargandoMas(false);
    }
  };

  return (
    <main className="max-w-7xl mx-auto px-8 py-10 space-y-8 animate-fadeIn">
      
      {/* Cabecera y Controles */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-neutral-300/80 dark:border-white/10 pb-6">
        <div>
          <div className="flex items-center gap-3">
            {modoGlobal ? (
              <span className="text-3xl">🌐</span>
            ) : (
              <img 
                src={paisSeleccionado.banderaUrl} 
                alt={paisSeleccionado.nombre} 
                className="w-8 h-6 object-cover rounded shadow-sm"
              />
            )}
            <h1 className="text-3xl font-black tracking-tight text-neutral-900 dark:text-white">
              {modoGlobal ? 'Tendencias Globales' : `Lo Mejor de ${paisSeleccionado.nombre}`}
            </h1>
          </div>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1.5">
            {modoGlobal
              ? `Las ${tipoTendencia === 'movie' ? 'películas' : 'series'} más vistas y comentadas esta semana en todo el mundo.`
              : `Producciones destacadas y cine icónico originario de ${paisSeleccionado.nombre}.`} Mostrando {obras.length} títulos.
          </p>
        </div>

        {/* Filtros */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex bg-neutral-200 dark:bg-white/5 p-1 rounded-xl border border-neutral-300 dark:border-white/10 shadow-sm">
            <button
              type="button"
              onClick={() => setTipoTendencia('movie')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                tipoTendencia === 'movie'
                  ? 'bg-rose-600 text-white shadow'
                  : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              Películas
            </button>
            <button
              type="button"
              onClick={() => setTipoTendencia('tv')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                tipoTendencia === 'tv'
                  ? 'bg-rose-600 text-white shadow'
                  : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              Series
            </button>
          </div>

          <div className="flex items-center gap-2 relative" ref={menuPaisesRef}>
            <button
              type="button"
              onClick={() => {
                setModoGlobal(true);
                setMostrarPopUpPaises(false);
              }}
              title="Tendencias Globales"
              className={`h-10 px-3.5 rounded-xl border flex items-center gap-2 transition cursor-pointer shadow-sm ${
                modoGlobal
                  ? 'bg-white dark:bg-neutral-800 border-rose-600 text-rose-600 dark:text-rose-400 ring-2 ring-rose-500/20 shadow'
                  : 'bg-neutral-200/80 dark:bg-white/5 border-neutral-300 dark:border-white/10 text-neutral-500 hover:text-neutral-800 dark:hover:text-white'
              }`}
            >
              <span className="text-base leading-none">🌐</span>
              <span className="text-xs font-bold hidden sm:inline">Mundo</span>
            </button>

            <button
              type="button"
              onClick={() => setMostrarPopUpPaises(!mostrarPopUpPaises)}
              title={`País actual: ${paisSeleccionado.nombre}`}
              className={`h-10 px-3 rounded-xl border flex items-center justify-center gap-2 transition cursor-pointer shadow-sm ${
                !modoGlobal
                  ? 'bg-white dark:bg-neutral-800 border-rose-600 ring-2 ring-rose-500/20 shadow'
                  : 'bg-neutral-200/80 dark:bg-white/5 border-neutral-300 dark:border-white/10 opacity-80 hover:opacity-100'
              }`}
            >
              <img 
                src={paisSeleccionado.banderaUrl} 
                alt={paisSeleccionado.nombre} 
                className="w-6 h-4.5 object-cover rounded shadow-xs"
              />
              <span className="text-xs font-black text-neutral-700 dark:text-neutral-300">
                {paisSeleccionado.codigo}
              </span>
              <span className="text-[10px] text-neutral-400">▾</span>
            </button>

            {mostrarPopUpPaises && (
              <div className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-[#16161a] border border-neutral-300 dark:border-white/15 rounded-2xl shadow-2xl p-3 z-50 animate-fadeIn space-y-2">
                <p className="text-[11px] font-black uppercase tracking-wider text-neutral-400 px-1">
                  Seleccionar País
                </p>

                <div className="grid grid-cols-2 gap-1.5 max-h-60 overflow-y-auto pr-1 scrollbar-thin">
                  {PAISES.map((p) => {
                    const esSeleccionado = !modoGlobal && paisSeleccionado.codigo === p.codigo;
                    return (
                      <button
                        key={p.codigo}
                        type="button"
                        onClick={() => {
                          setPaisSeleccionado(p);
                          setModoGlobal(false);
                          setMostrarPopUpPaises(false);
                        }}
                        className={`flex items-center gap-2.5 p-2 rounded-xl transition cursor-pointer text-left ${
                          esSeleccionado
                            ? 'bg-rose-600 text-white font-black shadow-sm'
                            : 'hover:bg-neutral-100 dark:hover:bg-white/5 text-neutral-700 dark:text-neutral-300 font-bold'
                        }`}
                      >
                        <img 
                          src={p.banderaUrl} 
                          alt={p.nombre} 
                          className="w-5 h-3.5 object-cover rounded shadow-xs flex-shrink-0"
                        />
                        <span className="text-xs truncate">{p.nombre}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Grilla de Resultados */}
      {cargando ? (
        <div className="py-24 text-center text-neutral-400 text-sm animate-pulse">
          Cargando títulos...
        </div>
      ) : obras.length > 0 ? (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {obras.map((obra, index) => {
              const tmdbIdNum = Number(obra.tmdb_id || obra.id);
              const yaVista = idsVistos.has(tmdbIdNum);

              return (
                <div
                  key={`${obra.tmdb_id || obra.id}-${index}`}
                  onClick={() => onSeleccionarObra(obra)}
                  className={`aspect-[2/3] relative rounded-3xl overflow-hidden shadow-lg border transition-all duration-300 cursor-pointer group bg-[#141418] hover:-translate-y-1.5 hover:shadow-2xl ${
                    yaVista 
                      ? 'ring-2 ring-emerald-500 border-emerald-500/40 shadow-emerald-500/20' 
                      : 'border-neutral-300/40 dark:border-white/10'
                  }`}
                >
                  {obra.poster_path ? (
                    <img 
                      src={obra.poster_path} 
                      alt={obra.titulo} 
                      loading="lazy" 
                      className={`w-full h-full object-cover group-hover:scale-105 transition duration-300 ${
                        yaVista ? 'brightness-90' : 'brightness-95'
                      }`}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center p-4 text-center text-xs font-bold text-neutral-400">
                      {obra.titulo}
                    </div>
                  )}

                  {/* Capa de información y badges */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/30 to-transparent flex flex-col justify-between p-4 pointer-events-none">
                    <div className="flex justify-between items-start">
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 bg-rose-600 text-white rounded-md shadow">
                        {obra.tipo}
                      </span>

                      {/* Insignia esmeralda si está en el historial */}
                      {yaVista && (
                        <span className="text-[10px] font-black uppercase px-2 py-0.5 bg-emerald-600 text-white rounded-md shadow flex items-center gap-1 backdrop-blur-sm">
                          ✓ Vista
                        </span>
                      )}

                      {!yaVista && obra.calificacion && (
                        <span className="text-xs font-black text-amber-400 drop-shadow">
                          ★ {obra.calificacion}
                        </span>
                      )}
                    </div>

                    <div>
                      <h4 className="text-sm font-black text-white truncate drop-shadow">{obra.titulo}</h4>
                      <p className="text-[11px] text-neutral-300 font-bold mt-0.5">
                        {obra.anio} · Clic para registrar
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Botón Cargar Más */}
          {pagina < 5 && (
            <div className="pt-6 pb-12 flex justify-center">
              <button
                type="button"
                disabled={cargandoMas}
                onClick={handleCargarMas}
                className="bg-neutral-200 dark:bg-white/10 hover:bg-rose-600 hover:text-white dark:hover:bg-rose-600 text-neutral-800 dark:text-white font-extrabold px-8 py-3 rounded-2xl shadow-md transition-all duration-200 cursor-pointer text-xs disabled:opacity-50"
              >
                {cargandoMas ? 'Cargando más títulos...' : `Cargar más títulos (${obras.length} de 100)`}
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="py-20 text-center text-neutral-500 text-sm">
          No se encontraron obras para esta selección.
        </div>
      )}

    </main>
  );
}