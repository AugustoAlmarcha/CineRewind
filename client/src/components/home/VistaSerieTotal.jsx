import React, { useState, useEffect, useMemo, useCallback } from 'react';
import TimelineScrubber from './TimelineScrubber';
import { Award, Star } from 'lucide-react';
import ModalCalificarSerie from '../modal/ModalCalificarSerie';
import { obtenerCalificacionesSerieAPI } from '../../api';

export default function VistaSerieTotal({ 
  serie, 
  gruposPorDia, 
  resolverImagen, 
  onAbrirDetalleTimeline,
  modoSeleccion = false,
  seleccionadosParaBorrar = [],
  onToggleItem = () => {}
}) {
  const esSerie = serie?.tipo?.toLowerCase() === 'serie';
  const esSaga = Boolean(serie?.esSaga);

  const tmdbId = Number(serie?.tmdb_id || serie?.registros?.[0]?.tmdb_id || serie?.obra_id);

  const [calificacionesSerie, setCalificacionesSerie] = useState({ serie: null, temporadas: {} });
  const [modalCalificarAbierto, setModalCalificarAbierto] = useState(false);
  const [temporadaSeleccionadaModal, setTemporadaSeleccionadaModal] = useState(null);

  const temporadasVistas = useMemo(() => {
    if (!esSerie || !Array.isArray(serie?.registros)) return [];
    const temps = serie.registros
      .map((r) => Number(r.temporada))
      .filter((t) => !isNaN(t) && t > 0);
    return [...new Set(temps)].sort((a, b) => a - b);
  }, [esSerie, serie?.registros]);

  const cargarCalificaciones = useCallback(async () => {
    if (!esSerie || !tmdbId) return;
    try {
      const data = await obtenerCalificacionesSerieAPI(tmdbId);
      if (data) {
        setCalificacionesSerie({
          serie: data.serie || null,
          temporadas: data.temporadas || {}
        });
      }
    } catch (err) {
      console.warn('Error al cargar calificaciones de serie:', err);
    }
  }, [esSerie, tmdbId]);

  useEffect(() => {
    cargarCalificaciones();
  }, [cargarCalificaciones]);

  const puntosScrubberSerie = gruposPorDia.map(([fecha, items]) => {
    const [y, m, d] = fecha.split('-');
    const fechaObj = new Date(y, m - 1, d);
    const nombreMes = !isNaN(fechaObj.getTime())
      ? fechaObj.toLocaleDateString('es-ES', { month: 'short' }).toUpperCase()
      : '';
    const subtexto = esSerie
      ? `${items.length} cap.`
      : `${items.length} ${items.length === 1 ? 'peli' : 'pelis'}`;
    return {
      id: `serie-fecha-${fecha}`,
      etiqueta: `${d} ${nombreMes} ${y}`,
      subtexto,
      icono: esSerie ? '🎬' : (esSaga ? '🍿' : '🎥'),
    };
  });

  return (
    <div className="space-y-8 sm:space-y-12 pt-4 relative">
      <TimelineScrubber puntos={puntosScrubberSerie} />

      {/* Cabecera de la obra / saga / serie */}
      <div className="space-y-4 border-b border-neutral-200 dark:border-white/10 pb-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <span className="text-xs font-black uppercase tracking-wider text-rose-600">
              {esSerie ? 'Historial de serie' : (esSaga ? 'Saga cinematográfica' : 'Historial de película')}
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-neutral-900 dark:text-white leading-tight">
              {serie.titulo}
            </h2>
          </div>
          <span className="text-xs font-black px-3 py-1.5 bg-rose-600 text-white rounded-xl shadow shrink-0">
            {esSerie 
              ? `${serie.registros.length} capítulos vistos`
              : esSaga 
              ? `${serie.registros.length} visualizaciones · ${serie.peliculasDistintas?.length || 1} películas`
              : `${serie.registros.length} ${serie.registros.length === 1 ? 'visualización registrada' : 'visualizaciones registradas'}`}
          </span>
        </div>

        {/* Panel de Veredicto & Calificaciones (Serie Completa y Temporadas) */}
        {esSerie && (
          <div className="p-3.5 sm:p-4 rounded-2xl sm:rounded-3xl bg-neutral-200/60 dark:bg-white/[0.03] border border-neutral-300 dark:border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xs">
            <div className="space-y-1.5 min-w-0">
              <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-neutral-500 dark:text-neutral-400 flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                <span>Calificaciones & Veredicto</span>
              </span>

              <div className="flex flex-wrap items-center gap-2 pt-0.5">
                {/* Botón / Pill Serie Completa */}
                <button
                  type="button"
                  onClick={() => {
                    setTemporadaSeleccionadaModal(null);
                    setModalCalificarAbierto(true);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black transition flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95 border ${
                    calificacionesSerie.serie?.calificacion
                      ? 'bg-amber-500/15 border-amber-500/40 text-amber-600 dark:text-amber-400 font-black'
                      : 'bg-white dark:bg-white/5 border-neutral-300 dark:border-white/10 text-neutral-700 dark:text-neutral-300 hover:border-rose-500'
                  }`}
                  title="Calificar la serie completa"
                >
                  <Award className="w-3 h-3 text-amber-500" />
                  <span>Serie Completa:</span>
                  <span className="text-amber-500 font-black">
                    {calificacionesSerie.serie?.calificacion 
                      ? `★ ${Number(calificacionesSerie.serie.calificacion).toFixed(1)}` 
                      : '+ Calificar'}
                  </span>
                </button>

                {/* Pills interactivos de Temporadas */}
                {temporadasVistas.map((temp) => {
                  const califT = calificacionesSerie.temporadas[temp]?.calificacion;
                  return (
                    <button
                      key={`temp-pill-${temp}`}
                      type="button"
                      onClick={() => {
                        setTemporadaSeleccionadaModal(temp);
                        setModalCalificarAbierto(true);
                      }}
                      className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer shadow-xs active:scale-95 border ${
                        califT
                          ? 'bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400 font-black'
                          : 'bg-white dark:bg-white/5 border-neutral-300 dark:border-white/10 text-neutral-600 dark:text-neutral-400 hover:border-rose-500'
                      }`}
                      title={`Calificar Temporada ${temp}`}
                    >
                      <span>T{temp}:</span>
                      <span className={califT ? 'text-amber-500 font-black' : 'text-neutral-400'}>
                        {califT ? `★ ${Number(califT).toFixed(1)}` : '+ Nota'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setTemporadaSeleccionadaModal(null);
                setModalCalificarAbierto(true);
              }}
              className="text-xs font-black px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white transition cursor-pointer shadow flex items-center justify-center gap-1.5 active:scale-95 shrink-0 self-start md:self-auto"
            >
              <Star className="w-3.5 h-3.5 fill-current" />
              <span>Calificar Serie / Temporada</span>
            </button>
          </div>
        )}
      </div>

      {modalCalificarAbierto && (
        <ModalCalificarSerie
          obra={serie}
          temporadaInicial={temporadaSeleccionadaModal}
          temporadasDisponibles={temporadasVistas}
          onClose={() => setModalCalificarAbierto(false)}
          onActualizado={cargarCalificaciones}
        />
      )}


      {gruposPorDia.map(([fecha, itemsDelDia]) => {
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
              <div className="h-[1px] flex-1 bg-neutral-300/80 dark:bg-white/10" />
              <span className="text-xs font-bold text-neutral-400">
                {itemsDelDia.length} {esSerie 
                  ? (itemsDelDia.length === 1 ? 'capítulo' : 'capítulos') 
                  : (itemsDelDia.length === 1 ? 'visualización' : 'visualizaciones')}
              </span>
            </div>

            <div className={`grid gap-6 ${esSerie ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5' : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5'}`}>
              {itemsDelDia.map((item) => {
                const fullUrl = resolverImagen(item.foto_episodio || item.obra_poster || item.poster_path);
                const itemIdReal = item.id !== undefined ? item.id : item.historial_id;
                const seleccionado = itemIdReal !== undefined && seleccionadosParaBorrar.includes(itemIdReal);

                // Detección para series (fin de temporada)
                const esFinTemporada = Boolean(item.es_final_temporada);

                const estiloBorde = esFinTemporada
                  ? 'border-2 border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.45)] ring-1 ring-amber-400/60 dark:border-slate-200 dark:shadow-[0_0_15px_rgba(226,232,240,0.45)] dark:ring-1 dark:ring-white/50'
                  : 'border-neutral-200 dark:border-white/10 hover:border-rose-500/60';

                return (
                  <div
                    key={itemIdReal || `${item.titulo}-${item.temporada}-${item.episodio}-${item.fecha_visto}`}
                    onClick={(e) => {
                      if (modoSeleccion) {
                        e.stopPropagation();
                        if (itemIdReal !== undefined) onToggleItem(itemIdReal);
                      } else {
                        onAbrirDetalleTimeline(item);
                      }
                    }}
                    className={`${esSerie ? 'aspect-square' : 'aspect-[2/3]'} relative rounded-3xl overflow-hidden cursor-pointer transition-all duration-200 select-none shadow-sm ${
                      seleccionado
                        ? 'ring-4 ring-rose-600 border-transparent scale-95'
                        : `bg-neutral-900 hover:scale-[1.02] ${estiloBorde}`
                    }`}
                  >
                    {fullUrl ? (
                      <img 
                        src={fullUrl} 
                        alt={item.titulo} 
                        loading="lazy" 
                        className="w-full h-full object-cover brightness-[0.92] hover:brightness-100 transition duration-300" 
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center p-3 text-xs text-neutral-400 font-bold text-center">
                        {esSerie ? `E${item.episodio}` : item.titulo}
                      </div>
                    )}

                    <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/25 to-transparent flex flex-col justify-between p-4 pointer-events-none">
                      <div className="flex justify-between items-center gap-1">
                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md border truncate max-w-[130px] ${
                          esFinTemporada
                            ? 'bg-slate-200 text-neutral-900 border-white shadow-sm font-extrabold'
                            : 'bg-black/70 text-white border-white/10'
                        }`}>
                          {esSerie 
                            ? `T${item.temporada} · E${item.episodio}`
                            : (esSaga ? item.titulo : 'Película')}
                        </span>

                        <div className="flex items-center gap-1 flex-shrink-0">
                          {esFinTemporada && (
                            <span className="text-[9px] font-black tracking-wider uppercase px-1.5 py-0.5 rounded bg-amber-500 text-white border border-amber-300 shadow dark:bg-slate-300/90 dark:text-neutral-900 dark:border-white">
                              FIN TEMP
                            </span>
                          )}

                          {item.calificacion && (
                            <span className="text-[11px] font-black text-amber-400 bg-black/70 px-2 py-0.5 rounded-md border border-white/10 flex items-center gap-1">
                              ★ {Number(item.calificacion).toFixed(1)}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-end justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <h4 className="text-xs font-black text-white truncate drop-shadow">{item.titulo}</h4>
                          <p className="text-[10px] font-bold text-neutral-400 truncate mt-0.5">{item.plataforma || 'Sin plataforma'}</p>
                        </div>

                        {/* COMPAÑÍA: Amigos con cuenta y/o acompañantes sin cuenta (Mamá) con carita */}
                        {((Array.isArray(item.amigos_covision) && item.amigos_covision.length > 0) || item.visto_con_texto) && (
                          <div className="flex flex-col items-end gap-1 flex-shrink-0">
                            <div className="flex -space-x-1.5 overflow-hidden flex-shrink-0">
                              {/* 1. Amigos con cuenta */}
                              {Array.isArray(item.amigos_covision) && item.amigos_covision.map((amigo) => (
                                <div
                                  key={amigo.amigo_id || amigo.covisualizacion_id}
                                  title={`Visto con @${amigo.username || amigo.nombre}`}
                                  className="w-6 h-6 rounded-full ring-2 ring-black/80 bg-neutral-800 overflow-hidden flex items-center justify-center shadow-md flex-shrink-0"
                                >
                                  {amigo.avatar_url ? (
                                    <img src={amigo.avatar_url} alt={amigo.username} className="w-full h-full object-cover" />
                                  ) : (
                                    <span className="text-[9px] font-black text-rose-500">
                                      {(amigo.nombre || amigo.username || '?').charAt(0).toUpperCase()}
                                    </span>
                                  )}
                                </div>
                              ))}

                              {/* 2. Caritas de acompañantes sin cuenta (Mamá, etc.) */}
                              {item.visto_con_texto && item.visto_con_texto.split(',').map((s) => s.trim()).filter(Boolean).map((nombre, idx) => (
                                <div
                                  key={`manual-${idx}-${nombre}`}
                                  title={`Visto con ${nombre}`}
                                  className="w-6 h-6 rounded-full ring-2 ring-black/80 bg-gradient-to-tr from-purple-600 via-rose-500 to-amber-400 overflow-hidden flex items-center justify-center shadow-md flex-shrink-0"
                                >
                                  <img
                                    src={`https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(nombre)}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`}
                                    alt={nombre}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              ))}
                            </div>

                            {item.visto_con_texto && (
                              <span
                                title={`Visto con ${item.visto_con_texto}`}
                                className="text-[9px] font-black px-1.5 py-0.5 rounded-md bg-black/85 text-rose-300 border border-white/10 backdrop-blur-xs truncate max-w-[80px] shadow-sm"
                              >
                                {item.visto_con_texto}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {modoSeleccion && (
                      <div 
                        onClick={(e) => {
                          e.stopPropagation();
                          if (itemIdReal !== undefined) onToggleItem(itemIdReal);
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
