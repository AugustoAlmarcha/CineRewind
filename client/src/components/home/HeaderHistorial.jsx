import React from 'react';

export default function HeaderHistorial({
  modoVistaGeneral, // 'timeline' | 'series_global' | 'peliculas_global'
  setModoVistaGeneral,
  verTodoElAnio,
  setVerTodoElAnio,
  anioSeleccionado,
  mesSeleccionado,
  onVolverAnios,
  onVolverMeses,
  modoSeleccion,
  setModoSeleccion,
  setSeleccionadosParaBorrar,
  filtroTipo,
  setFiltroTipo,
  vistaAgrupada,
  setVistaAgrupada,
  busquedaHistorial = '',
  setBusquedaHistorial,
}) {
  return (
    <div className="space-y-4 border-b border-neutral-300 dark:border-white/10 pb-4">
      {/* 1. Selector de Pestañas Superiores y Buscador en el Historial */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-5">
          <button
            type="button"
            onClick={() => { setModoVistaGeneral('timeline'); onVolverAnios(); }}
            className={`text-sm font-black pb-1 border-b-2 transition cursor-pointer ${
              modoVistaGeneral === 'timeline'
                ? 'text-rose-600 border-rose-600'
                : 'text-neutral-500 border-transparent hover:text-neutral-300'
            }`}
          >
            Diario por Fechas
          </button>
          <button
            type="button"
            onClick={() => { setModoVistaGeneral('series_global'); onVolverAnios(); }}
            className={`text-sm font-black pb-1 border-b-2 transition cursor-pointer ${
              modoVistaGeneral === 'series_global'
                ? 'text-rose-600 border-rose-600'
                : 'text-neutral-500 border-transparent hover:text-neutral-300'
            }`}
          >
            Series
          </button>
          <button
            type="button"
            onClick={() => { setModoVistaGeneral('peliculas_global'); onVolverAnios(); }}
            className={`text-sm font-black pb-1 border-b-2 transition cursor-pointer ${
              modoVistaGeneral === 'peliculas_global'
                ? 'text-rose-600 border-rose-600'
                : 'text-neutral-500 border-transparent hover:text-neutral-300'
            }`}
          >
            Películas
          </button>
        </div>

        {/* Buscador interactivo (activo en series y películas globales) */}
        {modoVistaGeneral !== 'timeline' && setBusquedaHistorial && (
          <div className="relative min-w-[240px]">
            <input
              type="text"
              placeholder={`Buscar en ${modoVistaGeneral === 'series_global' ? 'series' : 'películas'}...`}
              value={busquedaHistorial}
              onChange={(e) => setBusquedaHistorial(e.target.value)}
              className="w-full bg-white dark:bg-[#18181c] border border-neutral-300 dark:border-white/10 rounded-xl px-3.5 py-1.5 pl-8 text-xs font-bold text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500 shadow-sm"
            />
            <span className="absolute left-2.5 top-2 text-neutral-400 text-xs pointer-events-none">🔍</span>
            {busquedaHistorial && (
              <button
                type="button"
                onClick={() => setBusquedaHistorial('')}
                className="absolute right-2.5 top-1.5 text-neutral-400 hover:text-rose-500 text-xs font-black cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>
        )}
      </div>

      {/* 2. Sub-barra de controles contextuales (solo en Diario por Fechas) */}
      {modoVistaGeneral === 'timeline' && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-extrabold text-neutral-900 dark:text-white">Mi Diario Cinemático</h2>
            {anioSeleccionado && (
              <button 
                type="button"
                onClick={onVolverAnios}
                className="text-xs font-bold text-rose-600 hover:underline cursor-pointer"
              >
                ← Todos los años
              </button>
            )}
            {mesSeleccionado !== null && (
              <button 
                type="button"
                onClick={onVolverMeses}
                className="text-xs font-bold text-rose-600 hover:underline cursor-pointer"
              >
                ← Meses de {anioSeleccionado}
              </button>
            )}
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {anioSeleccionado && mesSeleccionado === null && (
              <button
                type="button"
                onClick={() => setVerTodoElAnio(!verTodoElAnio)}
                className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition cursor-pointer ${
                  verTodoElAnio 
                    ? 'bg-rose-600 text-white border-rose-600' 
                    : 'bg-white dark:bg-white/5 border-neutral-300 dark:border-white/10'
                }`}
              >
                {verTodoElAnio ? 'Ver por meses' : `Ver todo ${anioSeleccionado}`}
              </button>
            )}

            {(mesSeleccionado !== null || verTodoElAnio) && (
              <div className="flex bg-neutral-200 dark:bg-white/5 p-1 rounded-xl border border-neutral-300 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => setVistaAgrupada(false)}
                  className={`px-3 py-1 text-[11px] font-bold rounded-lg transition cursor-pointer ${
                    !vistaAgrupada ? 'bg-rose-600 text-white shadow' : 'text-neutral-500 dark:text-neutral-400'
                  }`}
                >
                  Capítulos
                </button>
                <button
                  type="button"
                  onClick={() => setVistaAgrupada(true)}
                  className={`px-3 py-1 text-[11px] font-bold rounded-lg transition cursor-pointer ${
                    vistaAgrupada ? 'bg-rose-600 text-white shadow' : 'text-neutral-500 dark:text-neutral-400'
                  }`}
                >
                  Por Obras
                </button>
              </div>
            )}

            {(mesSeleccionado !== null || verTodoElAnio) && !vistaAgrupada && (
              <button
                type="button"
                onClick={() => {
                  setModoSeleccion(!modoSeleccion);
                  setSeleccionadosParaBorrar([]);
                }}
                className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition cursor-pointer ${
                  modoSeleccion ? 'bg-neutral-800 text-white' : 'bg-white dark:bg-white/5 border-neutral-300 dark:border-white/10'
                }`}
              >
                {modoSeleccion ? 'Cancelar' : 'Seleccionar'}
              </button>
            )}

            <div className="flex gap-1 bg-neutral-200 dark:bg-[#18181c] p-1 rounded-xl">
              {['', 'pelicula', 'serie'].map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setFiltroTipo(t)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold capitalize transition cursor-pointer ${
                    filtroTipo === t ? 'bg-rose-600 text-white' : 'text-neutral-500'
                  }`}
                >
                  {t === '' ? 'Todos' : t}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}