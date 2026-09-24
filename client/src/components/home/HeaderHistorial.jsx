import React from 'react';

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
}) {
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
            }}
            className={`text-xs font-black px-4 py-2 rounded-xl transition cursor-pointer ${
              !vistaTotal
                ? 'bg-rose-600 text-white shadow-md'
                : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            Diario por Fechas
          </button>
          
          <button
            type="button"
            onClick={() => {
              setVistaTotal(true);
              setSerieSeleccionadaTotal(null);
              onVolverAnios();
            }}
            className={`text-xs font-black px-4 py-2 rounded-xl transition cursor-pointer ${
              vistaTotal
                ? 'bg-rose-600 text-white shadow-md'
                : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            Total Histórico
          </button>
        </div>

        {/* Migas de pan en Total Histórico si estás adentro de una serie */}
        {vistaTotal && serieSeleccionadaTotal && (
          <div className="flex items-center gap-2 text-xs font-black">
            <button
              type="button"
              onClick={() => setSerieSeleccionadaTotal(null)}
              className="text-rose-600 dark:text-rose-500 hover:underline cursor-pointer"
            >
              ← Volver al catálogo de series
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

      {/* Derecha: Buscador contextual + Filtro [ Todos | Películas | Series ] */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative">
          <input
            type="text"
            value={busquedaHistorial}
            onChange={(e) => setBusquedaHistorial(e.target.value)}
            placeholder="🔍 Buscar título..."
            className="bg-neutral-100 dark:bg-[#18181e] border border-neutral-300 dark:border-white/10 text-neutral-900 dark:text-white text-xs rounded-xl px-3 py-2 w-44 sm:w-52 focus:outline-none focus:border-rose-500 transition"
          />
          {busquedaHistorial && (
            <button
              type="button"
              onClick={() => setBusquedaHistorial('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-neutral-400 hover:text-white"
            >
              ✕
            </button>
          )}
        </div>

        {!vistaTotal && mesSeleccionado !== null && (
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

        <div className="flex bg-neutral-200 dark:bg-[#16161c] p-1 rounded-xl border border-neutral-300 dark:border-white/10">
          <button
            type="button"
            onClick={() => setFiltroTipo('')}
            className={`px-3 py-1.5 rounded-lg text-xs font-black transition cursor-pointer ${
              filtroTipo === '' 
                ? 'bg-rose-600 text-white shadow' 
                : 'text-neutral-600 dark:text-neutral-400 hover:text-white'
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
                : 'text-neutral-600 dark:text-neutral-400 hover:text-white'
            }`}
          >
            Películas
          </button>
          <button
            type="button"
            onClick={() => setFiltroTipo('serie')}
            className={`px-3 py-1.5 rounded-lg text-xs font-black transition cursor-pointer ${
              filtroTipo === 'serie' 
                ? 'bg-rose-600 text-white shadow' 
                : 'text-neutral-600 dark:text-neutral-400 hover:text-white'
            }`}
          >
            Series
          </button>
        </div>

      </div>
    </div>
  );
}