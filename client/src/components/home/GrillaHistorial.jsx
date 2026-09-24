import React, { useMemo } from 'react';
import TimelineScrubber from './TimelineScrubber'; // <-- Importar el Scrubber

const NOMBRES_MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

export default function GrillaHistorial({
  vistaTotal = false,
  serieSeleccionadaTotal,
  setSerieSeleccionadaTotal,
  anioSeleccionado,
  mesSeleccionado,
  arbolHistorial,
  listaAnios,
  timelineCompleto = [],
  onSeleccionarAnio,
  onSeleccionarMes,
  modoSeleccion,
  seleccionadosParaBorrar = [],
  onToggleItem,
  onAbrirDetalleTimeline,
  busquedaHistorial = '',
}) {

  // HOOK 1: Catálogo unificado histórico con póster oficial de serie garantizado
  const obrasTotalesUnificadas = useMemo(() => {
    if (!vistaTotal) return [];
    
    const mapaObras = {};
    timelineCompleto.forEach((item) => {
      if (busquedaHistorial && !item.titulo?.toLowerCase().includes(busquedaHistorial.toLowerCase())) {
        return;
      }

      const clave = item.obra_id || item.tmdb_id || item.titulo;
      if (!mapaObras[clave]) {
        // PRIORIDAD: poster_serie (de la tabla obras_catalogo) > obra_poster > poster_path
        const posterOficialSerie = item.poster_serie || item.obra_poster || item.poster_path;

        mapaObras[clave] = {
          obra_id: item.obra_id,
          titulo: item.titulo,
          tipo: item.tipo,
          poster_path: posterOficialSerie,
          plataforma: item.plataforma,
          registros: [],
        };
      }
      mapaObras[clave].registros.push(item);
    });

    Object.values(mapaObras).forEach((obra) => {
      obra.registros.sort((a, b) => new Date(b.fecha_visto) - new Date(a.fecha_visto));
    });

    return Object.values(mapaObras).sort((a, b) => b.registros.length - a.registros.length);
  }, [vistaTotal, timelineCompleto, busquedaHistorial]);

  // HOOK 2: Agrupación diaria para cuando se abre una serie en Total Histórico
  const gruposSerieTotalPorDia = useMemo(() => {
    if (!serieSeleccionadaTotal) return [];
    const mapa = {};
    serieSeleccionadaTotal.registros.forEach((item) => {
      const fecha = item.fecha_visto ? item.fecha_visto.split('T')[0] : 'Sin Fecha';
      if (!mapa[fecha]) mapa[fecha] = [];
      mapa[fecha].push(item);
    });
    return Object.entries(mapa).sort((a, b) => new Date(b[0]) - new Date(a[0]));
  }, [serieSeleccionadaTotal]);

  // HOOK 3: Agrupación del Diario por Fechas
  const itemsDelMes = useMemo(() => {
    if (anioSeleccionado === null || mesSeleccionado === null) return [];
    return (arbolHistorial[anioSeleccionado]?.[mesSeleccionado] || []).filter((item) => {
      if (!busquedaHistorial.trim()) return true;
      return item.titulo?.toLowerCase().includes(busquedaHistorial.trim().toLowerCase());
    });
  }, [arbolHistorial, anioSeleccionado, mesSeleccionado, busquedaHistorial]);

  // HOOK 4: Grupos diarios del Diario por Fechas
  const gruposPorDia = useMemo(() => {
    if (itemsDelMes.length === 0) return [];
    const mapa = {};
    itemsDelMes.forEach((item) => {
      const fecha = item.fecha_visto ? item.fecha_visto.split('T')[0] : 'Sin Fecha';
      if (!mapa[fecha]) mapa[fecha] = [];
      mapa[fecha].push(item);
    });
    return Object.entries(mapa).sort((a, b) => new Date(b[0]) - new Date(a[0]));
  }, [itemsDelMes]);

  // Helper para resolver la URL de imagen
  const resolverImagen = (ruta) => {
    if (!ruta) return null;
    if (ruta.startsWith('http')) return ruta;
    return `https://image.tmdb.org/t/p/w500${ruta.startsWith('/') ? ruta : `/${ruta}`}`;
  };

// --------------------------------------------------------------------------
  // CASO 1: TOTAL HISTÓRICO - DENTRO DE UNA SERIE SELECCIONADA
  // --------------------------------------------------------------------------
  if (vistaTotal && serieSeleccionadaTotal) {
    const puntosScrubberSerie = gruposSerieTotalPorDia.map(([fecha, items]) => {
      const [y, m, d] = fecha.split('-');
      const fechaObj = new Date(y, m - 1, d);
      const nombreMes = !isNaN(fechaObj.getTime())
        ? fechaObj.toLocaleDateString('es-ES', { month: 'short' }).toUpperCase()
        : '';
      return {
        id: `serie-fecha-${fecha}`,
        etiqueta: `${d} ${nombreMes} ${y}`,
        subtexto: `${items.length} cap.`,
        icono: '🎬',
      };
    });

    return (
      <div className="space-y-12 pt-4 relative">
        <TimelineScrubber puntos={puntosScrubberSerie} />

        {/* Cabecera de la serie seleccionada */}
        <div className="flex items-center justify-between border-b border-neutral-200 dark:border-white/10 pb-4">
          <div>
            <span className="text-xs font-black uppercase tracking-wider text-rose-600">Historial completo</span>
            <h2 className="text-3xl font-black text-neutral-900 dark:text-white">{serieSeleccionadaTotal.titulo}</h2>
          </div>
          <span className="text-xs font-black px-3 py-1.5 bg-rose-600 text-white rounded-xl shadow">
            {serieSeleccionadaTotal.registros.length} capítulos vistos
          </span>
        </div>

        {gruposSerieTotalPorDia.map(([fecha, capitulosDelDia]) => {
          const [y, m, d] = fecha.split('-');
          const fechaObj = new Date(y, m - 1, d);
          const diaNumero = !isNaN(fechaObj.getTime()) ? fechaObj.getDate() : d;
          const nombreMesTexto = !isNaN(fechaObj.getTime()) 
            ? fechaObj.toLocaleDateString('es-ES', { month: 'long' }).toUpperCase()
            : '';
          const anioTexto = !isNaN(fechaObj.getTime()) ? fechaObj.getFullYear() : '';

          return (
            <div key={fecha} id={`serie-fecha-${fecha}`} className="space-y-5 scroll-mt-24">
              <div className="flex items-center gap-4">
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black text-rose-600 dark:text-rose-500">{diaNumero}</span>
                  <span className="text-xs font-black text-neutral-900 dark:text-white tracking-widest uppercase">{nombreMesTexto}</span>
                  <span className="text-[11px] font-bold text-neutral-400 uppercase">· {anioTexto}</span>
                </div>
                <div className="h-[1px] flex-1 bg-neutral-300/80 dark:bg-white/10"></div>
                <span className="text-xs font-bold text-neutral-400">
                  {capitulosDelDia.length} {capitulosDelDia.length === 1 ? 'capítulo' : 'capítulos'}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                {capitulosDelDia.map((item) => {
                  const fullUrl = resolverImagen(item.foto_episodio || item.poster_path);

                  return (
                    <div
                      key={item.id}
                      onClick={() => onAbrirDetalleTimeline(item)}
                      className="aspect-square relative rounded-3xl overflow-hidden cursor-pointer border border-neutral-200 dark:border-white/10 bg-neutral-900 shadow-sm hover:border-rose-500/60 hover:scale-[1.02] transition-all duration-200 select-none"
                    >
                      {fullUrl ? (
                        <img src={fullUrl} alt={item.titulo} className="w-full h-full object-cover brightness-[0.92] hover:brightness-100 transition" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center p-3 text-xs text-neutral-400 font-bold text-center">
                          E{item.episodio}
                        </div>
                      )}

                      <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/25 to-transparent flex flex-col justify-between p-4 pointer-events-none">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-black/70 text-white border border-white/10">
                            T{item.temporada} · E{item.episodio}
                          </span>
                          {item.calificacion && (
                            <span className="text-[11px] font-black text-amber-400 bg-black/70 px-2 py-0.5 rounded-md border border-white/10">
                              ★ {Number(item.calificacion).toFixed(1)}
                            </span>
                          )}
                        </div>
                        <div>
                          <h4 className="text-xs font-black text-white truncate drop-shadow">{item.titulo}</h4>
                          <p className="text-[10px] font-bold text-neutral-400 truncate mt-0.5">{item.plataforma || 'Sin plataforma'}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // CASO 2: TOTAL HISTÓRICO - CATÁLOGO GENERAL (PORTADAS OFICIALES DE LA SERIE)
  // --------------------------------------------------------------------------
  if (vistaTotal) {
    if (obrasTotalesUnificadas.length === 0) {
      return (
        <div className="py-24 text-center text-neutral-500 italic">
          No se encontraron obras en tu catálogo histórico.
        </div>
      );
    }

    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 pt-4">
        {obrasTotalesUnificadas.map((obra) => {
          const urlPoster = resolverImagen(obra.poster_path);
          const esSerie = obra.tipo?.toLowerCase() === 'serie';

          return (
            <div
              key={obra.obra_id || obra.titulo}
              onClick={() => {
                if (esSerie) {
                  setSerieSeleccionadaTotal(obra);
                } else {
                  onAbrirDetalleTimeline(obra.registros[0]);
                }
              }}
              className="aspect-[2/3] relative rounded-3xl overflow-hidden cursor-pointer border border-neutral-300/80 dark:border-white/10 bg-neutral-900 shadow-md hover:scale-[1.02] hover:border-rose-500 transition-all duration-300 group select-none"
            >
              {urlPoster ? (
                <img
                  src={urlPoster}
                  alt={obra.titulo}
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-300 brightness-[0.95]"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center p-4 text-center font-bold text-neutral-400">
                  {obra.titulo}
                </div>
              )}

              <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/30 to-transparent flex flex-col justify-between p-4 pointer-events-none">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-lg bg-black/70 text-white border border-white/10">
                    {esSerie ? 'Serie' : 'Película'}
                  </span>
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-lg bg-rose-600 text-white shadow">
                    {obra.registros.length} {obra.registros.length === 1 ? 'visto' : 'vistos'}
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-black text-white truncate drop-shadow">{obra.titulo}</h3>
                  <p className="text-[11px] text-neutral-300 mt-0.5 font-bold">
                    {esSerie ? 'Toca para abrir capítulos' : 'Toca para ver ficha'}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // CASO 3: DIARIO POR FECHAS - SELECTOR DE AÑOS
  // --------------------------------------------------------------------------
  if (!anioSeleccionado) {
    if (listaAnios.length === 0) {
      return (
        <div className="py-24 text-center text-neutral-500 italic">
          No hay registros en tu historial todavía.
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 pt-4">
        {listaAnios.map((anio) => {
          const meses = arbolHistorial[anio] || {};
          let totalObras = 0;
          const portadas = [];

          Object.values(meses).forEach((items) => {
            totalObras += items.length;
            items.forEach((it) => {
              const foto = it.poster_serie || it.poster_path || it.foto_episodio;
              if (foto && !portadas.includes(foto) && portadas.length < 4) {
                portadas.push(foto);
              }
            });
          });

          return (
            <div
              key={anio}
              onClick={() => onSeleccionarAnio(anio)}
              className="group relative aspect-square rounded-3xl overflow-hidden cursor-pointer border border-neutral-300 dark:border-white/10 bg-neutral-900 shadow-md hover:scale-[1.02] hover:border-rose-500/50 transition-all duration-300 select-none"
            >
              <div className="grid grid-cols-2 grid-rows-2 w-full h-full opacity-40 group-hover:opacity-60 transition duration-500">
                {[0, 1, 2, 3].map((idx) => (
                  <div key={idx} className="w-full h-full bg-neutral-800 overflow-hidden">
                    {portadas[idx] && (
                      <img
                        src={resolverImagen(portadas[idx])}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                ))}
              </div>

              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 group-hover:bg-black/20 transition p-4">
                <h3 className="text-4xl font-black text-white tracking-tight drop-shadow-lg group-hover:scale-110 transition">
                  {anio}
                </h3>
                <span className="mt-2 text-xs font-black px-3 py-1 bg-rose-600 text-white rounded-full shadow-md">
                  {totalObras} {totalObras === 1 ? 'obra' : 'obras'}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // CASO 4: DIARIO POR FECHAS - SELECTOR DE MESES
  // --------------------------------------------------------------------------
  if (mesSeleccionado === null) {
    const mesesDelAnio = arbolHistorial[anioSeleccionado] || {};
    const mesesIndices = Object.keys(mesesDelAnio).sort((a, b) => b - a);

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 pt-4">
        {mesesIndices.map((mesIdx) => {
          const items = mesesDelAnio[mesIdx] || [];
          const portadas = [];
          items.forEach((it) => {
            const foto = it.poster_serie || it.poster_path || it.foto_episodio;
            if (foto && !portadas.includes(foto) && portadas.length < 4) {
              portadas.push(foto);
            }
          });

          return (
            <div
              key={mesIdx}
              onClick={() => onSeleccionarMes(Number(mesIdx))}
              className="group relative aspect-square rounded-3xl overflow-hidden cursor-pointer border border-neutral-300 dark:border-white/10 bg-neutral-900 shadow-md hover:scale-[1.02] hover:border-rose-500/50 transition-all duration-300 select-none"
            >
              <div className="grid grid-cols-2 grid-rows-2 w-full h-full opacity-40 group-hover:opacity-60 transition duration-500">
                {[0, 1, 2, 3].map((idx) => (
                  <div key={idx} className="w-full h-full bg-neutral-800 overflow-hidden">
                    {portadas[idx] && (
                      <img
                        src={resolverImagen(portadas[idx])}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                ))}
              </div>

              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 group-hover:bg-black/20 transition p-4">
                <h3 className="text-2xl font-black text-white tracking-tight drop-shadow-lg group-hover:scale-110 transition">
                  {NOMBRES_MESES[mesIdx]}
                </h3>
                <span className="mt-2 text-xs font-black px-3 py-1 bg-rose-600 text-white rounded-full shadow-md">
                  {items.length} {items.length === 1 ? 'registro' : 'registros'}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    );
  }
// --------------------------------------------------------------------------
  // CASO 5: DIARIO POR FECHAS - DETALLE DEL MES (CON TIMELINE SCRUBBER)
  // --------------------------------------------------------------------------
  if (itemsDelMes.length === 0) {
    return (
      <div className="py-24 text-center text-neutral-500 italic">
        {busquedaHistorial ? `No hay obras con "${busquedaHistorial}" en este mes.` : 'No hay registros en este mes.'}
      </div>
    );
  }

  // Preparamos los puntos para el Scrubber de días
  const puntosScrubberDias = gruposPorDia.map(([fecha, obras]) => {
    const [y, m, d] = fecha.split('-');
    const fechaObj = new Date(y, m - 1, d);
    const diaSemana = !isNaN(fechaObj.getTime())
      ? fechaObj.toLocaleDateString('es-ES', { weekday: 'short' })
      : '';
    return {
      id: `dia-seccion-${fecha}`,
      etiqueta: `${d} de ${NOMBRES_MESES[Number(m) - 1]}`,
      subtexto: `${diaSemana}, ${obras.length} obras`,
      icono: '📌',
    };
  });

  return (
    <div className="space-y-12 pt-4 relative">
      
      {/* Barra Scrubber flotante a la derecha tipo Google Fotos */}
      <TimelineScrubber puntos={puntosScrubberDias} />

      {gruposPorDia.map(([fecha, obrasDelDia]) => {
        const [y, m, d] = fecha.split('-');
        const fechaObj = new Date(y, m - 1, d);
        
        const diaNumero = !isNaN(fechaObj.getTime()) ? fechaObj.getDate() : d;
        const nombreMesTexto = !isNaN(fechaObj.getTime()) 
          ? fechaObj.toLocaleDateString('es-ES', { month: 'long' }).toUpperCase()
          : '';
        const diaSemanaTexto = !isNaN(fechaObj.getTime())
          ? fechaObj.toLocaleDateString('es-ES', { weekday: 'short' }).toUpperCase()
          : '';

        return (
          <div key={fecha} id={`dia-seccion-${fecha}`} className="space-y-5 scroll-mt-24">
            <div className="flex items-center gap-4">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-rose-600 dark:text-rose-500 tracking-tight">
                  {diaNumero}
                </span>
                <span className="text-xs font-black text-neutral-900 dark:text-white tracking-widest uppercase">
                  {nombreMesTexto}
                </span>
                <span className="text-[11px] font-bold text-neutral-400 uppercase">
                  · {diaSemanaTexto}
                </span>
              </div>
              
              <div className="h-[1px] flex-1 bg-neutral-300/80 dark:bg-white/10"></div>
              
              <span className="text-xs font-bold text-neutral-400">
                {obrasDelDia.length} {obrasDelDia.length === 1 ? 'obra' : 'obras'}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
              {obrasDelDia.map((item) => {
                const esCapitulo = Boolean(item.temporada);
                const imagenPrincipal = item.foto_episodio || item.poster_path;
                const imagenUrl = resolverImagen(imagenPrincipal);

                const itemIdReal = item.id !== undefined ? item.id : item.historial_id;
                const seleccionado = itemIdReal !== undefined && seleccionadosParaBorrar.includes(itemIdReal);

                return (
                  <div
                    key={itemIdReal || `${item.titulo}-${item.temporada}-${item.episodio}`}
                    onClick={(e) => {
                      if (modoSeleccion) {
                        e.stopPropagation();
                        if (itemIdReal !== undefined) {
                          onToggleItem(itemIdReal);
                        }
                      } else {
                        onAbrirDetalleTimeline(item);
                      }
                    }}
                    className={`aspect-square relative rounded-3xl overflow-hidden cursor-pointer border transition-all duration-200 select-none shadow-sm ${
                      seleccionado
                        ? 'ring-4 ring-rose-600 border-transparent scale-95'
                        : 'border-neutral-200 dark:border-white/10 bg-neutral-900 hover:border-rose-500/60 hover:scale-[1.02]'
                    }`}
                  >
                    {imagenUrl ? (
                      <img
                        src={imagenUrl}
                        alt={item.titulo}
                        loading="lazy"
                        className="w-full h-full object-cover brightness-[0.92] hover:brightness-100 transition duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center p-4 text-xs text-neutral-500 text-center font-bold">
                        {item.titulo}
                      </div>
                    )}

                    <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/25 to-transparent flex flex-col justify-between p-4 pointer-events-none">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-black/70 text-white border border-white/10">
                          {esCapitulo ? `T${item.temporada} · E${item.episodio}` : 'Película'}
                        </span>

                        {item.calificacion && (
                          <span className="text-[11px] font-black text-amber-400 bg-black/70 px-2 py-0.5 rounded-md border border-white/10 flex items-center gap-1">
                            ★ {Number(item.calificacion).toFixed(1)}
                          </span>
                        )}
                      </div>

                      <div>
                        <h4 className="text-sm font-black text-white truncate drop-shadow">
                          {item.titulo}
                        </h4>
                        <p className="text-[10px] font-bold text-neutral-400 truncate mt-0.5">
                          {item.plataforma || 'Sin plataforma'}
                        </p>
                      </div>
                    </div>

                    {modoSeleccion && (
                      <div 
                        onClick={(e) => {
                          e.stopPropagation();
                          if (itemIdReal !== undefined) {
                            onToggleItem(itemIdReal);
                          }
                        }}
                        className={`absolute top-3 left-3 w-6 h-6 rounded-lg border flex items-center justify-center transition-colors ${
                          seleccionado 
                            ? 'bg-rose-600 border-rose-600 text-white' 
                            : 'bg-black/70 border-white/30 text-transparent hover:border-white'
                        }`}
                      >
                        <span className="text-xs font-black">✓</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

          </div>
        );
      })}
    </div>
  );
}