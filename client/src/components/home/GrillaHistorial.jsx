import React, { useMemo } from 'react';
import CollagePortadas from '../CollagePortadas';

const NOMBRES_MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

export default function GrillaHistorial({
  modoVistaGeneral, // 'timeline' | 'series_global'
  verTodoElAnio,
  anioSeleccionado,
  mesSeleccionado,
  arbolHistorial,
  listaAnios,
  timelineCompleto = [],
  onSeleccionarAnio,
  onSeleccionarMes,
  modoSeleccion,
  seleccionadosParaBorrar,
  onToggleItem,
  onAbrirDetalleTimeline,
  vistaAgrupada,
  onAbrirResumenTemporada,
}) {
  // MODO 1: BIBLIOTECA DE SERIES (Hilo continuo sin importar año ni mes)
  const seriesContinuas = useMemo(() => {
    if (modoVistaGeneral !== 'series_global') return [];
    
    const mapa = new Map();
    timelineCompleto
      .filter((it) => it.tipo === 'serie')
      .forEach((it) => {
        if (!mapa.has(it.obra_id)) {
          mapa.set(it.obra_id, {
            obra_id: it.obra_id,
            titulo: it.titulo,
            poster: it.poster_obra || it.poster_path,
            items: [],
          });
        }
        mapa.get(it.obra_id).items.push(it);
      });

    return Array.from(mapa.values());
  }, [timelineCompleto, modoVistaGeneral]);

  if (modoVistaGeneral === 'series_global') {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 animate-fadeIn">
        {seriesContinuas.map((serie) => {
          // Extraer temporadas distintas vistas en cualquier momento
          const temporadasVistas = [...new Set(serie.items.map((i) => i.temporada))].sort((a, b) => a - b);

          return (
            <div
              key={serie.obra_id}
              onClick={() => onAbrirResumenTemporada({
                titulo: serie.titulo,
                temporada: temporadasVistas.join(', '),
                poster: serie.poster,
                items: serie.items,
              })}
              className="aspect-square relative rounded-3xl overflow-hidden shadow-lg border border-neutral-300/40 dark:border-white/10 hover:scale-105 transition-all duration-300 cursor-pointer group"
            >
              <img src={serie.poster} alt={serie.titulo} className="w-full h-full object-cover group-hover:scale-110 transition duration-300 brightness-90" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/30 to-transparent flex flex-col justify-between p-4 pointer-events-none">
                <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 bg-rose-600 text-white rounded-lg self-start shadow">
                  {serie.items.length} capítulos vistos
                </span>
                <div>
                  <h4 className="text-sm font-black text-white truncate drop-shadow">{serie.titulo}</h4>
                  <p className="text-[11px] text-rose-400 font-bold mt-0.5">
                    Temporadas: {temporadasVistas.map((t) => `T${t}`).join(' · ')}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // MODO 2: TIMELINE POR AÑOS (Nivel 1)
  if (!anioSeleccionado) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
        {listaAnios.map((anio) => {
          const meses = Object.keys(arbolHistorial[anio] || {});
          const todasLasObras = meses.flatMap((m) => arbolHistorial[anio][m]);

          return (
            <div
              key={anio}
              onClick={() => onSeleccionarAnio(anio)}
              className="aspect-square relative rounded-3xl overflow-hidden shadow-lg border border-neutral-300/40 dark:border-white/10 cursor-pointer group hover:scale-105 transition-all duration-300"
            >
              <CollagePortadas items={todasLasObras} />
              <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px] flex flex-col items-center justify-center p-4 text-center group-hover:bg-black/40 transition-colors pointer-events-none">
                <span className="text-5xl font-black text-white drop-shadow-xl tracking-tight">{anio}</span>
                <span className="mt-2 text-xs font-black px-3.5 py-1 bg-rose-600 text-white rounded-full shadow-lg">
                  {todasLasObras.length} {todasLasObras.length === 1 ? 'obra' : 'obras'}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // MODO 3: MESES DEL AÑO (Nivel 2, si no eligió "Ver Todo el Año")
  if (anioSeleccionado && mesSeleccionado === null && !verTodoElAnio) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6 animate-fadeIn">
        {Object.keys(arbolHistorial[anioSeleccionado] || {})
          .sort((a, b) => b - a)
          .map((mesNum) => {
            const obrasDelMes = arbolHistorial[anioSeleccionado][mesNum];
            return (
              <div
                key={mesNum}
                onClick={() => onSeleccionarMes(mesNum)}
                className="aspect-square relative rounded-3xl overflow-hidden shadow-lg border border-neutral-300/40 dark:border-white/10 cursor-pointer group hover:scale-105 transition-all duration-300"
              >
                <CollagePortadas items={obrasDelMes} />
                <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px] flex flex-col items-center justify-center p-4 text-center group-hover:bg-black/40 transition-colors pointer-events-none">
                  <span className="text-xs font-black uppercase tracking-widest text-rose-400 mb-1">Mes</span>
                  <h3 className="text-3xl font-black text-white drop-shadow-xl">{NOMBRES_MESES[mesNum]}</h3>
                  <span className="mt-2 text-xs font-semibold text-neutral-300">
                    {obrasDelMes.length} {obrasDelMes.length === 1 ? 'vista' : 'vistas'}
                  </span>
                </div>
              </div>
            );
          })}
      </div>
    );
  }

  // MODO 4: LISTADO DE OBRAS (Sea dentro de un Mes o de Todo el Año Completo)
  const itemsActivos = verTodoElAnio
    ? Object.keys(arbolHistorial[anioSeleccionado] || {}).flatMap((m) => arbolHistorial[anioSeleccionado][m])
    : (arbolHistorial[anioSeleccionado]?.[mesSeleccionado] || []);

  if (vistaAgrupada) {
    const agrupados = [];
    const mapa = new Map();
    itemsActivos.forEach((it) => {
      const clave = it.tipo === 'serie' ? `${it.obra_id}_T${it.temporada}` : `peli_${it.visualizacion_id}`;
      if (!mapa.has(clave)) {
        mapa.set(clave, {
          titulo: it.titulo,
          tipo: it.tipo,
          temporada: it.temporada,
          poster: it.poster_obra || it.poster_path,
          items: [],
        });
      }
      mapa.get(clave).items.push(it);
    });

    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5 animate-fadeIn">
        {Array.from(mapa.values()).map((grupo, idx) => (
          <div
            key={idx}
            onClick={() => onAbrirResumenTemporada(grupo)}
            className="aspect-square relative rounded-3xl overflow-hidden shadow-lg border border-neutral-300/40 dark:border-white/10 hover:scale-105 transition-all duration-300 cursor-pointer group"
          >
            <img src={grupo.poster} alt={grupo.titulo} className="w-full h-full object-cover group-hover:scale-110 transition duration-300 brightness-90" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/30 to-transparent flex flex-col justify-between p-4 pointer-events-none">
              <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 bg-amber-500 text-black rounded-lg self-start shadow font-mono">
                {grupo.tipo === 'serie' ? `T${grupo.temporada} · ${grupo.items.length} eps` : 'Película'}
              </span>
              <div>
                <h4 className="text-sm font-black text-white truncate drop-shadow">{grupo.titulo}</h4>
                <p className="text-[11px] text-rose-400 font-bold mt-0.5">Ver balance</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Lista de capítulos individuales (con hitos)
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5 animate-fadeIn">
      {itemsActivos.map((item) => {
        const id = item.visualizacion_id || item.id;
        const estaSeleccionado = seleccionadosParaBorrar.includes(id);
        const urlFoto = item.poster_path;

        const bordeEspecial = item.es_final_serie 
          ? 'ring-2 ring-amber-400 border-transparent shadow-amber-500/20 shadow-lg' 
          : item.es_final_temporada 
            ? 'ring-2 ring-emerald-400 border-transparent shadow-emerald-500/20 shadow-md' 
            : 'border-neutral-200 dark:border-white/10 hover:scale-105';

        return (
          <div
            key={id}
            onClick={() => modoSeleccion ? onToggleItem(id) : onAbrirDetalleTimeline(item)}
            className={`aspect-square relative rounded-3xl overflow-hidden shadow-md group cursor-pointer border transition-all duration-300 ${
              estaSeleccionado ? 'ring-4 ring-rose-600 border-transparent scale-95' : bordeEspecial
            }`}
          >
            {urlFoto ? (
              <img src={urlFoto} alt={item.titulo} className="w-full h-full object-cover group-hover:scale-110 transition duration-300" />
            ) : (
              <div className="w-full h-full bg-[#1c1c22] flex items-center justify-center p-4 text-center text-xs font-bold text-neutral-400">{item.titulo}</div>
            )}

            <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/30 to-transparent flex flex-col justify-between p-3.5 pointer-events-none">
              <div className="flex justify-between items-center">
                {item.es_final_serie ? (
                  <span className="text-[9px] font-black uppercase px-2 py-0.5 bg-gradient-to-r from-amber-500 to-yellow-300 text-neutral-900 rounded-md shadow">👑 Serie Fin</span>
                ) : item.es_final_temporada ? (
                  <span className="text-[9px] font-black uppercase px-2 py-0.5 bg-emerald-500 text-white rounded-md shadow">🏆 T{item.temporada} Fin</span>
                ) : (
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 bg-rose-600 text-white rounded-md shadow">
                    {item.tipo === 'serie' ? `T${item.temporada} E${item.episodio}` : 'Película'}
                  </span>
                )}

                {item.calificacion && (
                  <span className="text-xs font-black text-amber-400 drop-shadow">★ {Number(item.calificacion).toFixed(1)}</span>
                )}
              </div>

              <div>
                <h4 className="text-xs font-black text-white truncate drop-shadow">{item.titulo}</h4>
                <p className="text-[10px] text-neutral-300">{new Date(item.fecha_visto).toLocaleDateString()}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}