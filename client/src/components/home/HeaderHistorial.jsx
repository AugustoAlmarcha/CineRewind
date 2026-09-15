import React from 'react';

export default function HeaderHistorial({
  modoVistaGeneral,       // 'timeline' | 'series_global'
  setModoVistaGeneral,
  verTodoElAnio,          // booleano: si está dentro de un año, ver todo junto o por meses
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
}) {
  return (
    <div className="space-y-4 border-b border-neutral-300 dark:border-white/10 pb-4">
{/* Selector de Nivel Superior */}
<div className="flex items-center justify-between">
  <div className="flex items-center gap-4">
    <button
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
      onClick={() => { setModoVistaGeneral('series_global'); onVolverAnios(); }}
      className={`text-sm font-black pb-1 border-b-2 transition cursor-pointer ${
        modoVistaGeneral === 'series_global'
          ? 'text-rose-600 border-rose-600'
          : 'text-neutral-500 border-transparent hover:text-neutral-300'
      }`}
    >
      Series
    </button>
  </div>
</div>

      {/* Barra de Controles y Migas de Pan */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {modoVistaGeneral === 'timeline' && anioSeleccionado && (
            <button 
              onClick={onVolverAnios}
              className="text-xs font-bold text-rose-600 hover:underline cursor-pointer"
            >
              ← Todos los años
            </button>
          )}

          {modoVistaGeneral === 'timeline' && anioSeleccionado && !verTodoElAnio && mesSeleccionado !== null && (
            <button 
              onClick={onVolverMeses}
              className="text-xs font-bold text-rose-600 hover:underline cursor-pointer"
            >
              ← Meses de {anioSeleccionado}
            </button>
          )}

          {/* Alternar dentro de un año: Ver por meses o ver el año completo */}
          {modoVistaGeneral === 'timeline' && anioSeleccionado && mesSeleccionado === null && (
            <div className="flex bg-neutral-200 dark:bg-white/5 p-1 rounded-xl border border-neutral-300 dark:border-white/10">
              <button
                onClick={() => setVerTodoElAnio(false)}
                className={`px-3 py-1 text-[11px] font-bold rounded-lg transition cursor-pointer ${
                  !verTodoElAnio ? 'bg-rose-600 text-white shadow' : 'text-neutral-400'
                }`}
              >
                Por Meses
              </button>
              <button
                onClick={() => setVerTodoElAnio(true)}
                className={`px-3 py-1 text-[11px] font-bold rounded-lg transition cursor-pointer ${
                  verTodoElAnio ? 'bg-rose-600 text-white shadow' : 'text-neutral-400'
                }`}
              >
                Ver Todo {anioSeleccionado}
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Subvistas de agrupación */}
          {(mesSeleccionado !== null || verTodoElAnio) && modoVistaGeneral === 'timeline' && (
            <div className="flex bg-neutral-200 dark:bg-white/5 p-1 rounded-xl border border-neutral-300 dark:border-white/10">
              <button
                onClick={() => setVistaAgrupada(false)}
                className={`px-3 py-1 text-[11px] font-bold rounded-lg transition cursor-pointer ${
                  !vistaAgrupada ? 'bg-rose-600 text-white shadow' : 'text-neutral-400'
                }`}
              >
                Capítulos
              </button>
              <button
                onClick={() => setVistaAgrupada(true)}
                className={`px-3 py-1 text-[11px] font-bold rounded-lg transition cursor-pointer ${
                  vistaAgrupada ? 'bg-rose-600 text-white shadow' : 'text-neutral-400'
                }`}
              >
                Por Serie/Pelicula
              </button>
            </div>
          )}

          {modoVistaGeneral === 'timeline' && (mesSeleccionado !== null || verTodoElAnio) && !vistaAgrupada && (
            <button
              onClick={() => {
                setModoSeleccion(!modoSeleccion);
                setSeleccionadosParaBorrar([]);
              }}
              className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition cursor-pointer ${
                modoSeleccion ? 'bg-neutral-800 text-white' : 'bg-white dark:bg-white/5 border-neutral-300 dark:border-white/10'
              }`}
            >
              {modoSeleccion ? 'Cancelar selección' : 'Seleccionar varios'}
            </button>
          )}

          {modoVistaGeneral === 'timeline' && (
            <div className="flex gap-1 bg-neutral-200 dark:bg-[#18181c] p-1 rounded-xl">
              {['', 'pelicula', 'serie'].map((t) => (
                <button
                  key={t}
                  onClick={() => setFiltroTipo(t)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold capitalize transition cursor-pointer ${
                    filtroTipo === t ? 'bg-rose-600 text-white' : 'text-neutral-500'
                  }`}
                >
                  {t === '' ? 'Todos' : t}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}