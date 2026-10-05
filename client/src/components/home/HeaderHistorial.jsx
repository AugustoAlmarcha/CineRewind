import React, { useState, useEffect, useRef } from 'react';
import { obtenerAmigosAPI } from '../../api';
import { Calendar, Layers, Film, Tv, Users, Trash2, X , Search} from 'lucide-react';
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
}) {
  const puedeSeleccionar = (!vistaTotal && mesSeleccionado !== null) || (vistaTotal && serieSeleccionadaTotal !== null);
  const [amigosDisponibles, setAmigosDisponibles] = useState([]);
  const [menuAmigosAbierto, setMenuAmigosAbierto] = useState(false);
  const menuAmigosRef = useRef(null);

  // Cargar lista de amigos confirmados
  useEffect(() => {
    obtenerAmigosAPI()
      .then((data) => {
        if (Array.isArray(data)) setAmigosDisponibles(data);
      })
      .catch(() => {});
  }, []);

  // Cierra el menú al hacer clic en cualquier parte afuera
  useEffect(() => {
    const handleClickAfuera = (e) => {
      if (menuAmigosRef.current && !menuAmigosRef.current.contains(e.target)) {
        setMenuAmigosAbierto(false);
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
          <div className="flex items-center gap-2 text-xs font-black">
            <button
              type="button"
              onClick={() => {
                setSerieSeleccionadaTotal(null);
                setModoSeleccion(false);
                setSeleccionadosParaBorrar([]);
              }}
              className="text-rose-600 dark:text-rose-500 hover:underline cursor-pointer"
            >
              ← Volver al catálogo
            </button>
            <span className="text-neutral-400">/ {serieSeleccionadaTotal.titulo}</span>
          </div>
        )}

        {/* Migas de pan en Diario por Fechas */}
        {!vistaTotal && anioSeleccionado && (
          <div className="flex items-center gap-2 text-xs font-black">
            <button
              type="button"
              onClick={onVolverAnios}
              className="text-rose-600 dark:text-rose-500 hover:underline cursor-pointer"
            >
              ← {anioSeleccionado}
            </button>

            {mesSeleccionado !== null && (
              <button
                type="button"
                onClick={onVolverMeses}
                className="text-neutral-500 hover:text-neutral-900 dark:hover:text-white cursor-pointer"
              >
                / Volver a Meses
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
            <div className="absolute right-0 top-12 bg-white dark:bg-[#1a1a24] border border-neutral-200 dark:border-white/15 rounded-2xl p-3 shadow-2xl w-60 z-50 animate-fadeIn">
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

              {amigosDisponibles.length === 0 ? (
                <p className="text-xs text-neutral-400 italic py-2 text-center">No tienes amigos agregados.</p>
              ) : (
                <div className="max-h-48 overflow-y-auto space-y-1">
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
                        <span className="truncate">@{a.username}</span>
                        {activo && <span>✓</span>}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Botón Seleccionar (borrado masivo) */}
        {puedeSeleccionar && (
          <button
            type="button"
            onClick={() => {
              setModoSeleccion(!modoSeleccion);
              setSeleccionadosParaBorrar([]);
            }}
            className={`text-xs font-black px-3 py-2 rounded-xl border transition cursor-pointer ${
              modoSeleccion 
                ? 'bg-neutral-800 text-white border-neutral-700' 
                : 'bg-neutral-100 dark:bg-white/5 border-neutral-300 dark:border-white/10 text-neutral-700 dark:text-neutral-300'
            }`}
          >
            {modoSeleccion ? 'Cancelar' : 'Seleccionar'}
          </button>
        )}

        {/* Selector de medio: Todos / Películas / Series */}
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

      </div>
    </div>
  );
}