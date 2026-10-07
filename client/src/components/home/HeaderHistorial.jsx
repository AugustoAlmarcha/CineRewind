import React, { useState, useEffect, useRef, useMemo } from 'react';
import { obtenerAmigosAPI } from '../../api';
import { 
  Calendar, Layers, Film, Tv, Users, Trash2, X, Search, ArrowUpDown, ArrowLeft,
  Flame, TrendingDown, Clock, History, CheckCircle2, Hourglass, ArrowDownAZ, ArrowUpZA, ChevronDown, Check
} from 'lucide-react';

const OPCIONES_ORDEN = [
  { id: 'mas_vistos', label: 'Más vistos', icon: Flame, iconColor: 'text-rose-500' },
  { id: 'menos_vistos', label: 'Menos vistos', icon: TrendingDown, iconColor: 'text-cyan-500' },
  { id: 'recientes', label: 'Más recientes', icon: Clock, iconColor: 'text-amber-500' },
  { id: 'antiguos', label: 'Más antiguas', icon: History, iconColor: 'text-neutral-400' },
  { id: 'finalizadas', label: 'Finalizadas primero', icon: CheckCircle2, iconColor: 'text-emerald-500' },
  { id: 'no_finalizadas', label: 'No finalizadas (En curso)', icon: Hourglass, iconColor: 'text-amber-500' },
  { id: 'az', label: 'A - Z (Alfabético)', icon: ArrowDownAZ, iconColor: 'text-indigo-400' },
  { id: 'za', label: 'Z - A (Alfabético)', icon: ArrowUpZA, iconColor: 'text-indigo-400' },
];
export default function HeaderHistorial({
  vistaTotal,
  setVistaTotal,
  serieSeleccionadaTotal,
  setSerieSeleccionadaTotal,
  anioSeleccionado,
  mesSeleccionado,
  onVolverAnios,
  onVolverMeses,
  filtroTipo,
  setFiltroTipo,
  busquedaHistorial,
  setBusquedaHistorial,
  modoSeleccion,
  setModoSeleccion,
  setSeleccionadosParaBorrar,
  soloConAmigos,
  setSoloConAmigos,
  amigosFiltro = [],
  setAmigosFiltro,
  ordenTotal = 'mas_vistos',
  setOrdenTotal,
  timelineCompleto = [],
}) {
  const puedeSeleccionar = true;
  const [amigosDisponibles, setAmigosDisponibles] = useState([]);
  const [menuAmigosAbierto, setMenuAmigosAbierto] = useState(false);
  const menuAmigosRef = useRef(null);
  const [menuOrdenAbierto, setMenuOrdenAbierto] = useState(false);
  const menuOrdenRef = useRef(null);

  // Cargar lista de amigos confirmados
  useEffect(() => {
    obtenerAmigosAPI()
      .then((data) => {
        if (Array.isArray(data)) setAmigosDisponibles(data);
      })
      .catch(() => {});
  }, []);

  // Cierra los menús al hacer clic en cualquier parte afuera
  useEffect(() => {
    const handleClickAfuera = (e) => {
      if (menuAmigosRef.current && !menuAmigosRef.current.contains(e.target)) {
        setMenuAmigosAbierto(false);
      }
      if (menuOrdenRef.current && !menuOrdenRef.current.contains(e.target)) {
        setMenuOrdenAbierto(false);
      }
    };
    document.addEventListener('mousedown', handleClickAfuera);
    return () => document.removeEventListener('mousedown', handleClickAfuera);
  }, []);

  const alternarAmigoFiltro = (id) => {
    if (!setAmigosFiltro) return;
    setAmigosFiltro((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Extraer acompañantes manuales guardados en el historial real
  const acompanantesManuales = useMemo(() => {
    if (!Array.isArray(timelineCompleto)) return [];
    const mapa = new Map();
    timelineCompleto.forEach((item) => {
      if (item.visto_con_texto && typeof item.visto_con_texto === 'string') {
        const nombres = item.visto_con_texto.split(',').map((s) => s.trim()).filter(Boolean);
        nombres.forEach((nombre) => {
          const key = nombre.toLowerCase();
          if (!mapa.has(key)) {
            mapa.set(key, nombre);
          }
        });
      }
    });
    return Array.from(mapa.values()).sort((a, b) => a.localeCompare(b));
  }, [timelineCompleto]);

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-200 dark:border-white/10 pb-5">
      
      {/* Izquierda: Selector Diario / Total Histórico + Migas de pan */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-1 bg-neutral-200/80 dark:bg-neutral-900 p-1 rounded-2xl border border-neutral-300 dark:border-white/10">
          <button
            type="button"
            onClick={() => {
              setVistaTotal(false);
              setSerieSeleccionadaTotal(null);
              setModoSeleccion(false);
              setSeleccionadosParaBorrar([]);
            }}
            className={`text-xs font-black px-4 py-2 rounded-xl transition cursor-pointer ${
              !vistaTotal
                ? 'bg-rose-600 text-white shadow-md'
                : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            <span className="flex items-center gap-1.5"> Diario por Fecha</span>
          </button>
          
          <button
            type="button"
            onClick={() => {
              setVistaTotal(true);
              setSerieSeleccionadaTotal(null);
              setModoSeleccion(false);
              setSeleccionadosParaBorrar([]);
              onVolverAnios();
            }}
            className={`text-xs font-black px-4 py-2 rounded-xl transition cursor-pointer ${
              vistaTotal
                ? 'bg-rose-600 text-white shadow-md'
                : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            <span className="flex items-center gap-1.5"> Total Histórico</span>
          </button>
        </div>

        {/* Migas de pan en Total Histórico si estás dentro de una serie */}
        {vistaTotal && serieSeleccionadaTotal && (
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => {
                setSerieSeleccionadaTotal(null);
                setModoSeleccion(false);
                setSeleccionadosParaBorrar([]);
              }}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-neutral-200 dark:bg-white/10 hover:bg-rose-600 hover:text-white dark:hover:bg-rose-600 text-neutral-800 dark:text-neutral-100 font-black text-xs transition-all shadow-sm border border-neutral-300 dark:border-white/15 cursor-pointer active:scale-95 group"
            >
              <ArrowLeft className="w-4 h-4 text-rose-500 group-hover:text-white transition-colors" />
              <span>Volver al catálogo</span>
            </button>
            <span className="text-xs font-bold text-neutral-400 dark:text-neutral-500 truncate max-w-[200px] sm:max-w-xs">
              / {serieSeleccionadaTotal.titulo}
            </span>
          </div>
        )}

        {/* Migas de pan en Diario por Fechas */}
        {!vistaTotal && anioSeleccionado && (
          <div className="flex items-center gap-2 text-xs font-black">
            <button
              type="button"
              onClick={onVolverAnios}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-200 dark:bg-white/10 hover:bg-rose-600 hover:text-white dark:hover:bg-rose-600 text-neutral-800 dark:text-neutral-100 font-black text-xs transition-all shadow-sm border border-neutral-300 dark:border-white/15 cursor-pointer active:scale-95 group"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-rose-500 group-hover:text-white transition-colors" />
              <span>← {anioSeleccionado}</span>
            </button>

            {mesSeleccionado !== null && (
              <button
                type="button"
                onClick={onVolverMeses}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-200 dark:bg-white/10 hover:bg-rose-600 hover:text-white dark:hover:bg-rose-600 text-neutral-800 dark:text-neutral-100 font-black text-xs transition-all shadow-sm border border-neutral-300 dark:border-white/15 cursor-pointer active:scale-95 group"
                title="Volver a los meses de este año"
              >
                <span>{mesSeleccionado === 'todos' ? `Todo ${anioSeleccionado} (← Volver)` : 'Volver a Meses'}</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Derecha: Buscador + Botón Con Amigos + Selección masiva + Filtro tipo */}
      <div className="flex items-center gap-3 flex-wrap">
        
{/* Buscador de título */}
        <div className="relative flex items-center">
          <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 pointer-events-none" />
          <input
            type="text"
            value={busquedaHistorial}
            onChange={(e) => setBusquedaHistorial(e.target.value)}
            placeholder="Buscar título..."
            className="bg-neutral-100 dark:bg-[#18181e] border border-neutral-300 dark:border-white/10 text-neutral-900 dark:text-white text-xs rounded-xl pl-8 pr-7 py-2 w-44 sm:w-52 focus:outline-none focus:border-rose-500 transition"
          />
          {busquedaHistorial && (
            <button
              type="button"
              onClick={() => setBusquedaHistorial('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-neutral-400 hover:text-neutral-900 dark:hover:text-white cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>

        {/* BOTÓN FILTRO SOCIAL: CON AMIGOS CON CIERRE AUTOMÁTICO */}
        <div className="relative" ref={menuAmigosRef}>
          <div className="flex items-center">
            <button
              type="button"
              onClick={() => {
                const nuevoEstado = !soloConAmigos;
                setSoloConAmigos(nuevoEstado);
                if (!nuevoEstado) {
                  if (setAmigosFiltro) setAmigosFiltro([]);
                  setMenuAmigosAbierto(false);
                }
              }}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black border transition cursor-pointer select-none ${
                soloConAmigos
                  ? 'bg-rose-600 border-rose-600 text-white shadow-md'
                  : 'bg-neutral-100 dark:bg-white/5 border-neutral-300 dark:border-white/10 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
              } ${soloConAmigos ? 'rounded-r-none' : ''}`}
              title="Filtrar por co-visualizaciones"
            >
              <Users className="w-4 h-4" />
              <span>
                {soloConAmigos
                  ? amigosFiltro.length > 0
                    ? `Con (${amigosFiltro.length})`
                    : 'Con amigos'
                  : 'Con amigos'}
              </span>
            </button>

            {/* Pequeño botón para desplegar/ocultar el menú solo cuando está activo */}
            {soloConAmigos && (
              <button
                type="button"
                onClick={() => setMenuAmigosAbierto(!menuAmigosAbierto)}
                className="px-2 py-2 bg-rose-700 hover:bg-rose-800 text-white border-y border-r border-rose-600 rounded-r-xl text-xs font-bold transition cursor-pointer"
                title={menuAmigosAbierto ? "Cerrar lista" : "Filtrar por amigos específicos"}
              >
                {menuAmigosAbierto ? '▲' : '▼'}
              </button>
            )}
          </div>

          {/* Menú flotante: se cierra al hacer clic afuera o al tocar la flechita */}
          {menuAmigosAbierto && soloConAmigos && (
            <div className="absolute right-0 top-12 bg-white dark:bg-[#1a1a24] border border-neutral-200 dark:border-white/15 rounded-2xl p-3 shadow-2xl w-64 sm:w-72 z-50 animate-fadeIn">
              <div className="flex justify-between items-center mb-2 pb-1.5 border-b border-neutral-100 dark:border-white/5">
                <p className="text-[10px] font-black uppercase text-neutral-400">Ver vistas con:</p>
                <div className="flex items-center gap-2">
                  {amigosFiltro.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setAmigosFiltro([])}
                      className="text-[10px] font-bold text-rose-500 hover:underline cursor-pointer"
                    >
                      Todos
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setMenuAmigosAbierto(false)}
                    className="text-xs text-neutral-400 hover:text-white cursor-pointer px-1"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {amigosDisponibles.length === 0 && acompanantesManuales.length === 0 ? (
                <p className="text-xs text-neutral-400 italic py-3 text-center">No hay amigos ni acompañantes registrados en tu historial.</p>
              ) : (
                <div className="max-h-60 overflow-y-auto space-y-3 pr-1 scrollbar-thin">
                  {/* 1. Amigos registrados en la app */}
                  {amigosDisponibles.length > 0 && (
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-wider text-neutral-400 dark:text-neutral-500 mb-1 px-1">
                        Amigos en la app
                      </p>
                      <div className="space-y-1">
                        {amigosDisponibles.map((a) => {
                          const activo = amigosFiltro.includes(a.id);
                          return (
                            <button
                              key={a.id}
                              type="button"
                              onClick={() => alternarAmigoFiltro(a.id)}
                              className={`w-full flex items-center justify-between p-2 rounded-xl text-xs transition cursor-pointer ${
                                activo 
                                  ? 'bg-rose-600 text-white font-bold' 
                                  : 'hover:bg-neutral-100 dark:hover:bg-white/5 text-neutral-700 dark:text-neutral-300'
                              }`}
                            >
                              <div className="flex items-center gap-2 truncate">
                                {a.avatar_url ? (
                                  <img src={a.avatar_url} alt={a.username} className="w-5 h-5 rounded-full object-cover shrink-0" />
                                ) : (
                                  <div className="w-5 h-5 rounded-full bg-rose-500/20 text-rose-500 text-[10px] font-black flex items-center justify-center shrink-0">
                                    {(a.nombre || a.username || '?').charAt(0).toUpperCase()}
                                  </div>
                                )}
                                <span className="truncate">@{a.username}</span>
                              </div>
                              {activo && <span className="ml-1 text-xs">✓</span>}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* 2. Acompañantes manuales guardados en la BD */}
                  {acompanantesManuales.length > 0 && (
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-wider text-neutral-400 dark:text-neutral-500 mb-1 px-1">
                        Acompañantes guardados
                      </p>
                      <div className="space-y-1">
                        {acompanantesManuales.map((nombre) => {
                          const filtroKey = `texto:${nombre.toLowerCase()}`;
                          const activo = amigosFiltro.includes(filtroKey);
                          return (
                            <button
                              key={filtroKey}
                              type="button"
                              onClick={() => alternarAmigoFiltro(filtroKey)}
                              className={`w-full flex items-center justify-between p-2 rounded-xl text-xs transition cursor-pointer ${
                                activo 
                                  ? 'bg-rose-600 text-white font-bold' 
                                  : 'hover:bg-neutral-100 dark:hover:bg-white/5 text-neutral-700 dark:text-neutral-300'
                              }`}
                            >
                              <div className="flex items-center gap-2 truncate">
                                <img
                                  src={`https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(nombre)}&backgroundColor=e11d48,ff7043`}
                                  alt={nombre}
                                  className="w-5 h-5 rounded-full bg-neutral-200 dark:bg-neutral-800 shrink-0"
                                />
                                <span className="truncate">{nombre}</span>
                              </div>
                              {activo && <span className="ml-1 text-xs">✓</span>}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Botón Seleccionar para eliminar (borrado masivo) */}
        {puedeSeleccionar && (
          <button
            type="button"
            onClick={() => {
              setModoSeleccion(!modoSeleccion);
              setSeleccionadosParaBorrar([]);
            }}
            className={`flex items-center gap-1.5 text-xs font-black px-3 py-2 rounded-xl border transition cursor-pointer select-none ${
              modoSeleccion 
                ? 'bg-rose-600 text-white border-rose-500 shadow-md hover:bg-rose-700' 
                : 'bg-neutral-100 dark:bg-white/5 border-neutral-300 dark:border-white/10 text-neutral-700 dark:text-neutral-300 hover:text-rose-600 dark:hover:text-rose-400 hover:border-rose-300 dark:hover:border-rose-500/30'
            }`}
            title="Seleccionar obras, meses o años para eliminar"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>
              {modoSeleccion 
                ? 'Cancelar' 
                : (vistaTotal && !serieSeleccionadaTotal ? 'Eliminar series' : 'Eliminar obras')}
            </span>
          </button>
        )}

        {/* Selector de medio: Todos / Películas / Series (oculto si ya estás dentro de una serie) */}
        {(!vistaTotal || !serieSeleccionadaTotal) && (
          <div className="flex bg-neutral-200 dark:bg-[#16161c] p-1 rounded-xl border border-neutral-300 dark:border-white/10">
            <button
              type="button"
              onClick={() => setFiltroTipo('')}
              className={`px-3 py-1.5 rounded-lg text-xs font-black transition cursor-pointer ${
                filtroTipo === '' 
                  ? 'bg-rose-600 text-white shadow' 
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              Todos
            </button>
            <button
              type="button"
              onClick={() => setFiltroTipo('pelicula')}
              className={`px-3 py-1.5 rounded-lg text-xs font-black transition cursor-pointer ${
                filtroTipo === 'pelicula' 
                  ? 'bg-rose-600 text-white shadow' 
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              <span className="flex items-center gap-1.5"><Film className="w-3.5 h-3.5" /> Películas</span>
            </button>
            <button
              type="button"
              onClick={() => setFiltroTipo('serie')}
              className={`px-3 py-1.5 rounded-lg text-xs font-black transition cursor-pointer ${
                filtroTipo === 'serie' 
                  ? 'bg-rose-600 text-white shadow' 
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              <span className="flex items-center gap-1.5"><Tv className="w-3.5 h-3.5" /> Series</span>
            </button>
          </div>
        )}

        {/* Selector estilizado de ordenamiento en Total Histórico con iconos Lucide */}
        {vistaTotal && !serieSeleccionadaTotal && (
          <div className="relative" ref={menuOrdenRef}>
            <button
              type="button"
              onClick={() => setMenuOrdenAbierto(!menuOrdenAbierto)}
              className="flex items-center gap-2 bg-neutral-200 dark:bg-[#16161c] hover:bg-neutral-300/70 dark:hover:bg-[#1f1f27] px-3 py-2 rounded-xl border border-neutral-300 dark:border-white/10 text-xs font-bold text-neutral-800 dark:text-neutral-200 transition cursor-pointer shadow-xs active:scale-95"
              title="Ordenar obras del catálogo"
            >
              {(() => {
                const actual = OPCIONES_ORDEN.find((o) => o.id === ordenTotal) || OPCIONES_ORDEN[0];
                const IconActual = actual.icon;
                return (
                  <>
                    <IconActual className={`w-3.5 h-3.5 ${actual.iconColor} shrink-0`} />
                    <span>{actual.label}</span>
                    <ChevronDown className={`w-3.5 h-3.5 text-neutral-400 transition-transform duration-200 ${menuOrdenAbierto ? 'rotate-180' : ''}`} />
                  </>
                );
              })()}
            </button>

            {menuOrdenAbierto && (
              <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-[#181820] border border-neutral-200 dark:border-white/10 rounded-2xl shadow-2xl p-1.5 z-50 animate-fadeIn backdrop-blur-md">
                <p className="text-[10px] font-black uppercase tracking-wider text-neutral-400 dark:text-neutral-500 px-2.5 py-1.5">
                  Ordenar por
                </p>
                <div className="space-y-0.5">
                  {OPCIONES_ORDEN.map((opcion) => {
                    const esSeleccionado = ordenTotal === opcion.id;
                    const Icono = opcion.icon;
                    return (
                      <button
                        key={opcion.id}
                        type="button"
                        onClick={() => {
                          if (setOrdenTotal) setOrdenTotal(opcion.id);
                          setMenuOrdenAbierto(false);
                        }}
                        className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                          esSeleccionado
                            ? 'bg-rose-600 text-white shadow-sm'
                            : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-white/5'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 truncate">
                          <Icono className={`w-4 h-4 shrink-0 ${esSeleccionado ? 'text-white' : opcion.iconColor}`} />
                          <span className="truncate">{opcion.label}</span>
                        </div>
                        {esSeleccionado && <Check className="w-3.5 h-3.5 stroke-[3] shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}