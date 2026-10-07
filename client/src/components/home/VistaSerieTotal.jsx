import React, { useState, useEffect, useMemo, useCallback } from 'react';
import TimelineScrubber from './TimelineScrubber';
import { Award, Star, Trash2, CheckCircle2, AlertTriangle, RotateCcw, Loader2, Plus } from 'lucide-react';
import ModalCalificarSerie from '../modal/ModalCalificarSerie';
import { 
  obtenerCalificacionesSerieAPI, 
  obtenerDetallePeliculaAPI, 
  limpiarDuplicadosSerieAPI 
} from '../../api';
import { calcularProgresoSerie } from '../../utils/seriesProgreso';

export default function VistaSerieTotal({ 
  serie, 
  gruposPorDia, 
  resolverImagen, 
  onAbrirDetalleTimeline,
  modoSeleccion = false,
  seleccionadosParaBorrar = [],
  onToggleItem = () => {},
  onEliminarSerieDirecto = null,
  onEliminarItemDirecto = null,
  onRecargarDatos = null,
  onAbrirRegistrar = null,
}) {
  const esSerie = serie?.tipo?.toLowerCase() === 'serie';
  const esSaga = Boolean(serie?.esSaga);

  const tmdbId = Number(serie?.tmdb_id || serie?.registros?.[0]?.tmdb_id || serie?.obra_id);

  const [calificacionesSerie, setCalificacionesSerie] = useState({ serie: null, temporadas: {} });
  const [modalCalificarAbierto, setModalCalificarAbierto] = useState(false);
  const [temporadaSeleccionadaModal, setTemporadaSeleccionadaModal] = useState(null);
  const [metadatosExtra, setMetadatosExtra] = useState(null);

  // Cargar metadatos TMDb si faltan en la obra
  useEffect(() => {
    if (!esSerie || !tmdbId) return;
    if (serie?.total_temporadas && serie?.seasons_info) return;

    obtenerDetallePeliculaAPI('serie', tmdbId)
      .then((det) => {
        if (det) {
          setMetadatosExtra({
            total_temporadas: det.total_temporadas,
            total_episodios: det.total_episodios,
            estado_serie: det.estado_serie,
            seasons_info: det.seasons,
          });
          if (onRecargarDatos) onRecargarDatos();
        }
      })
      .catch(() => {});
  }, [esSerie, tmdbId, serie?.total_temporadas, serie?.seasons_info, onRecargarDatos]);

  const serieConMetadatos = useMemo(() => {
    return {
      ...serie,
      ...(metadatosExtra || {}),
    };
  }, [serie, metadatosExtra]);

  const progreso = useMemo(() => {
    return esSerie ? calcularProgresoSerie(serieConMetadatos) : null;
  }, [esSerie, serieConMetadatos]);

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

  // Detección inteligente de episodios duplicados
  const duplicadosInfo = useMemo(() => {
    if (!esSerie || !Array.isArray(serie?.registros)) {
      return { tieneDuplicados: false, cantidad: 0, countT1E1: 0, esMuchosT1E1: false };
    }
    const conteoClaves = {};
    let repetidos = 0;
    let countT1E1 = 0;

    serie.registros.forEach((reg) => {
      const t = Number(reg.temporada) || 1;
      const e = Number(reg.episodio) || 1;
      const clave = `T${t}-E${e}`;
      if (t === 1 && e === 1) countT1E1++;
      if (!conteoClaves[clave]) {
        conteoClaves[clave] = 1;
      } else {
        conteoClaves[clave]++;
        repetidos++;
      }
    });

    return {
      tieneDuplicados: repetidos > 0,
      cantidad: repetidos,
      countT1E1,
      esMuchosT1E1: countT1E1 > 2,
    };
  }, [esSerie, serie?.registros]);

  const [cargandoAccionSerie, setCargandoAccionSerie] = useState(null);
  const [mensajeExitoSerie, setMensajeExitoSerie] = useState(null);
  const [modalConfirmacion, setModalConfirmacion] = useState({
    abierto: false,
    titulo: '',
    mensaje: '',
    onConfirmar: null,
  });

  const obraIdReal = serie?.obra_id || serie?.registros?.[0]?.obra_id;

  const ejecutarLimpiarDuplicados = async (modo) => {
    if (!obraIdReal) return;
    setCargandoAccionSerie(modo);
    try {
      const res = await limpiarDuplicadosSerieAPI(obraIdReal, modo);
      setMensajeExitoSerie(res.mensaje || 'Duplicados procesados con éxito.');
      if (onRecargarDatos) await onRecargarDatos();
    } catch (err) {
      console.error('Error al limpiar duplicados:', err);
      alert(err.message || 'Error al procesar duplicados');
    } finally {
      setCargandoAccionSerie(null);
    }
  };

  const confirmarLimpiarDuplicados = (modo) => {
    const esReordenar = modo === 'reordenar_secuencia';
    setModalConfirmacion({
      abierto: true,
      titulo: esReordenar ? '¿Reordenar episodios en secuencia?' : '¿Eliminar registros duplicados?',
      mensaje: esReordenar
        ? 'Esta acción tomará los capítulos repetidos que se importaron como T1 E1 y los numerará progresivamente como 1, 2, 3... según la fecha en que los viste.'
        : 'Esta acción conservará un único registro de cada capítulo repetido y eliminará los duplicados.',
      onConfirmar: () => ejecutarLimpiarDuplicados(modo),
    });
  };

  const handleAbrirRegistrar = (temporadaInicial = null) => {
    if (!onAbrirRegistrar) return;
    onAbrirRegistrar({
      tmdb_id: tmdbId,
      id: tmdbId,
      obra_id: obraIdReal,
      titulo: serie.titulo,
      poster_path: serie.poster_path || serie.registros?.[0]?.poster_path,
      tipo: 'serie',
      plataforma: serie.plataforma || serie.registros?.[0]?.plataforma,
      total_temporadas: serie.total_temporadas || metadatosExtra?.total_temporadas,
      siguiente_temporada: temporadaInicial || undefined,
    });
  };

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
      <div className="space-y-3 border-b border-neutral-200 dark:border-white/10 pb-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="min-w-0">
            <span className="text-[11px] font-black uppercase tracking-wider text-rose-600">
              {esSerie ? 'Historial de serie' : (esSaga ? 'Saga cinematográfica' : 'Historial de película')}
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-neutral-900 dark:text-white leading-tight truncate">
              {serie.titulo}
            </h2>
          </div>

          <div className="flex items-center gap-2 flex-wrap shrink-0">
            <span className="text-xs font-black px-3 py-1.5 bg-neutral-200 dark:bg-white/10 text-neutral-800 dark:text-neutral-200 rounded-xl shrink-0">
              {esSerie 
                ? `${serie.registros.length} caps vistos`
                : esSaga 
                ? `${serie.registros.length} vistas · ${serie.peliculasDistintas?.length || 1} pelis`
                : `${serie.registros.length} ${serie.registros.length === 1 ? 'vista' : 'vistas'}`}
            </span>

            {/* ACCESO DIRECTO: ABRIR MODAL PARA REGISTRAR CAPÍTULOS FALTANTES */}
            {onAbrirRegistrar && (
              <button
                type="button"
                onClick={() => handleAbrirRegistrar()}
                className="px-3.5 py-1.5 rounded-xl text-xs font-black bg-rose-600 hover:bg-rose-500 active:scale-95 text-white transition shadow-sm flex items-center gap-1.5 cursor-pointer"
                title={`Abrir ${serie.titulo} para registrar capítulos`}
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>Registrar capítulos</span>
              </button>
            )}

            {/* Botón rápido para calificar serie */}
            {esSerie && (
              <button
                type="button"
                onClick={() => {
                  setTemporadaSeleccionadaModal(null);
                  setModalCalificarAbierto(true);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition flex items-center gap-1.5 cursor-pointer active:scale-95 border ${
                  calificacionesSerie.serie?.calificacion
                    ? 'bg-amber-500/15 border-amber-500/40 text-amber-600 dark:text-amber-400'
                    : 'bg-white dark:bg-white/5 border-neutral-300 dark:border-white/10 text-neutral-700 dark:text-neutral-300 hover:border-amber-500'
                }`}
                title="Calificar serie completa"
              >
                <Star className="w-3.5 h-3.5 text-amber-500 fill-current" />
                <span>{calificacionesSerie.serie?.calificacion ? `★ ${Number(calificacionesSerie.serie.calificacion).toFixed(1)}` : 'Calificar'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Banner de Duplicados Detectados (si los hay) */}
        {esSerie && duplicadosInfo.tieneDuplicados && (
          <div className="p-3 sm:p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-start gap-2.5 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 mt-0.5 font-bold">
                <AlertTriangle className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0">
                <h4 className="text-xs sm:text-sm font-black text-neutral-900 dark:text-white truncate">
                  {duplicadosInfo.cantidad} {duplicadosInfo.cantidad === 1 ? 'capítulo duplicado detectado' : 'capítulos duplicados detectados'}
                </h4>
                <p className="text-[11px] text-neutral-600 dark:text-neutral-400 font-medium">
                  {duplicadosInfo.esMuchosT1E1
                    ? `Hay ${duplicadosInfo.countT1E1} registros marcados como "T1 E1". Puedes reordenarlos cronológicamente como 1, 2, 3... o borrar las repeticiones.`
                    : 'Hay episodios repetidos con la misma temporada y capítulo en tu historial.'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap shrink-0">
              <button
                type="button"
                disabled={Boolean(cargandoAccionSerie)}
                onClick={() => confirmarLimpiarDuplicados('eliminar_duplicados')}
                className="px-3 py-1.5 rounded-xl text-xs font-black bg-rose-600 hover:bg-rose-500 text-white shadow-xs transition cursor-pointer active:scale-95 flex items-center gap-1.5"
              >
                {cargandoAccionSerie === 'eliminar_duplicados' ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Trash2 className="w-3 h-3" />
                )}
                <span>Borrar duplicados</span>
              </button>

              <button
                type="button"
                disabled={Boolean(cargandoAccionSerie)}
                onClick={() => confirmarLimpiarDuplicados('reordenar_secuencia')}
                className="px-3 py-1.5 rounded-xl text-xs font-black bg-white dark:bg-white/10 hover:bg-neutral-100 dark:hover:bg-white/20 text-neutral-800 dark:text-neutral-100 border border-neutral-300 dark:border-white/10 shadow-xs transition cursor-pointer active:scale-95 flex items-center gap-1.5"
              >
                {cargandoAccionSerie === 'reordenar_secuencia' ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <RotateCcw className="w-3 h-3" />
                )}
                <span>Reordenar (1, 2, 3...)</span>
              </button>
            </div>
          </div>
        )}

        {/* Banner de Notificación de Éxito */}
        {mensajeExitoSerie && (
          <div className="p-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-xs font-black flex items-center justify-between gap-2 shadow-xs">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>{mensajeExitoSerie}</span>
            </div>
            <button
              type="button"
              onClick={() => setMensajeExitoSerie(null)}
              className="text-neutral-400 hover:text-white text-xs px-2 py-0.5 cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {/* Banner Compacto de Progreso y Estado de la Serie */}
        {esSerie && progreso && (
          <div className={`p-3 sm:p-3.5 rounded-2xl border transition shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 ${
            progreso.estaCompletada
              ? 'bg-emerald-500/10 border-emerald-500/30'
              : progreso.estaAlDia
              ? 'bg-cyan-500/10 border-cyan-500/30'
              : 'bg-amber-500/10 border-amber-500/30'
          }`}>
            <div className="flex items-center gap-2.5 min-w-0">
              <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-lg border shrink-0 ${
                progreso.estaCompletada
                  ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                  : progreso.estaAlDia
                  ? 'bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 border-cyan-500/30'
                  : 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30'
              }`}>
                {progreso.estaCompletada ? '✓ Terminada' : progreso.estaAlDia ? '🎬 Al día' : `⏳ T${progreso.maxTempRegistrada || 1}/${progreso.totalTemporadas || '?'}`}
              </span>

              <p className="text-xs text-neutral-700 dark:text-neutral-300 font-bold truncate">
                {progreso.estaCompletada
                  ? `Viste todas las ${progreso.totalTemporadas} temporadas (${progreso.capsUnicosVistos} caps).`
                  : progreso.estaAlDia
                  ? `Al día con la serie (${progreso.totalTemporadas} temporadas estrenadas).`
                  : `Viste ${progreso.capsUnicosVistos} caps · ${progreso.temporadasConVistosCount} de ${progreso.totalTemporadas} temps vistas.`}
              </p>
            </div>

            {/* Barra y porcentaje compactos */}
            <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-auto">
              <div className="w-24 sm:w-28 bg-black/10 dark:bg-white/10 h-2 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    progreso.estaCompletada
                      ? 'bg-emerald-500'
                      : progreso.estaAlDia
                      ? 'bg-cyan-500'
                      : 'bg-amber-500'
                  }`}
                  style={{ width: `${Math.max(6, progreso.porcentajeGlobal)}%` }}
                />
              </div>
              <span className="text-xs font-black min-w-[32px] text-right">
                {progreso.porcentajeGlobal}%
              </span>
            </div>
          </div>
        )}

        {/* Fila compacta de Temporadas y Calificaciones (Scroll horizontal en celular) */}
        {esSerie && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-0.5 no-scrollbar">
            <span className="text-[10px] font-black uppercase text-neutral-400 shrink-0 mr-1 hidden sm:inline">
              Temporadas:
            </span>

            {(progreso?.temporadas || temporadasVistas.map((t) => ({ numero: t, cantVistos: 1, estaCompleta: false, totalEpisodios: null }))).map((tempObj) => {
              const num = tempObj.numero;
              const califT = calificacionesSerie.temporadas[num]?.calificacion;
              const estaVista = tempObj.cantVistos > 0;
              const estaCompleta = tempObj.estaCompleta;
              const cantVistos = tempObj.cantVistos;
              const totalCaps = tempObj.totalEpisodios;

              return (
                <button
                  key={`temp-pill-${num}`}
                  type="button"
                  onClick={() => {
                    setTemporadaSeleccionadaModal(num);
                    setModalCalificarAbierto(true);
                  }}
                  className={`px-2.5 py-1 rounded-xl text-xs font-black transition flex items-center gap-1.5 cursor-pointer shadow-2xs active:scale-95 shrink-0 border ${
                    !estaVista
                      ? 'opacity-60 border-dashed border-neutral-400/40 dark:border-white/15 text-neutral-500 dark:text-neutral-400 bg-black/5 dark:bg-white/[0.02] hover:opacity-100 hover:border-rose-400'
                      : estaCompleta
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
                      : 'bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-300'
                  }`}
                  title={
                    estaVista
                      ? `Temporada ${num}: ${cantVistos}${totalCaps ? `/${totalCaps}` : ''} caps vistos${califT ? ` · Nota: ★${califT}` : ''} (Toca para calificar)`
                      : `Temporada ${num} pendiente (Toca para calificar)`
                  }
                >
                  <span>T{num}:</span>
                  {califT && (
                    <span className="text-amber-500 font-black">★{Number(califT).toFixed(1)}</span>
                  )}
                  {estaVista && estaCompleta && (
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                      ✓ {totalCaps || cantVistos}
                    </span>
                  )}
                  {estaVista && !estaCompleta && (
                    <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400">
                      {cantVistos}{totalCaps ? `/${totalCaps}` : ''}
                    </span>
                  )}
                  {!estaVista && (
                    <span className="text-[10px] text-neutral-400 italic font-medium">Pendiente</span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {modalCalificarAbierto && (
        <ModalCalificarSerie
          obra={serie}
          temporadaInicial={temporadaSeleccionadaModal}
          temporadasDisponibles={progreso?.totalTemporadas || temporadasVistas}
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
                    className={`${esSerie ? 'aspect-square' : 'aspect-[2/3]'} relative rounded-3xl overflow-hidden cursor-pointer transition-all duration-200 select-none shadow-sm group ${
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

                    {/* Botón de borrado directo individual */}
                    {!modoSeleccion && onEliminarItemDirecto && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onEliminarItemDirecto(item);
                        }}
                        className="absolute top-2.5 right-2.5 w-7 h-7 rounded-xl bg-black/75 hover:bg-rose-600 text-neutral-300 hover:text-white border border-white/20 hover:border-rose-500 backdrop-blur-md flex items-center justify-center transition-all duration-150 cursor-pointer shadow-lg active:scale-90 opacity-70 sm:opacity-0 sm:group-hover:opacity-100 z-10"
                        title={esSerie ? `Eliminar T${item.temporada} E${item.episodio}` : `Eliminar este registro`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Modal de Confirmación de Acciones de Serie */}
      {modalConfirmacion.abierto && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#181a20] border border-neutral-200 dark:border-white/10 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-lg font-black text-neutral-900 dark:text-white">
              {modalConfirmacion.titulo}
            </h3>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
              {modalConfirmacion.mensaje}
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setModalConfirmacion({ abierto: false, titulo: '', mensaje: '', onConfirmar: null })}
                className="px-4 py-2 rounded-xl text-xs font-bold text-neutral-600 dark:text-neutral-400 hover:bg-black/5 dark:hover:bg-white/5 transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  const accion = modalConfirmacion.onConfirmar;
                  setModalConfirmacion({ abierto: false, titulo: '', mensaje: '', onConfirmar: null });
                  if (accion) accion();
                }}
                className="px-4 py-2 rounded-xl text-xs font-black bg-rose-600 hover:bg-rose-500 text-white shadow transition cursor-pointer active:scale-95"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
