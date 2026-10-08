import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../../context/AuthContext';
import { obtenerEpisodiosTemporadaAPI, registrarLoteAPI } from '../../api';
import { formatearFecha, obtenerFechaHoyLocal } from '../../utils/fechas';
import { 
  Zap, Calendar, Check, X, Star, AlertCircle, Loader2, 
  Sparkles, CheckCircle2, Tv, Edit3, ArrowRight, Users
} from 'lucide-react';

/**
 * Algoritmo de interpolación temporal por proximidad (Vecino más cercano)
 * Deduce la fecha más lógica para episodios faltantes basándose en los capítulos ya vistos.
 */
function deducirFechasFaltantes(temporadaNum, episodiosFaltantesNums, todosRegistros) {
  const registrosConFecha = (todosRegistros || [])
    .filter((r) => r.fecha_visto)
    .map((r) => ({
      temp: Number(r.temporada),
      ep: Number(r.episodio),
      fecha: String(r.fecha_visto).split('T')[0],
      plataforma: r.plataforma || null,
      visto_con_texto: r.visto_con_texto || null,
      amigos: Array.isArray(r.amigos_covision) ? r.amigos_covision : [],
    }))
    .sort((a, b) => {
      if (a.temp !== b.temp) return a.temp - b.temp;
      return a.ep - b.ep;
    });

  const registrosMismaTemp = registrosConFecha.filter((r) => r.temp === temporadaNum);
  const mapaFechas = {};
  const hoy = obtenerFechaHoyLocal();

  episodiosFaltantesNums.forEach((epNum) => {
    let referencia = null;

    if (registrosMismaTemp.length > 0) {
      // 1. Buscar en la misma temporada
      const posteriores = registrosMismaTemp
        .filter((r) => r.ep > epNum)
        .sort((a, b) => a.ep - b.ep);

      const anteriores = registrosMismaTemp
        .filter((r) => r.ep < epNum)
        .sort((a, b) => b.ep - a.ep);

      if (anteriores.length > 0 && posteriores.length > 0) {
        const distAnt = epNum - anteriores[0].ep;
        const distPost = posteriores[0].ep - epNum;
        referencia = distAnt <= distPost ? anteriores[0] : posteriores[0];
      } else if (anteriores.length > 0) {
        referencia = anteriores[0];
      } else if (posteriores.length > 0) {
        referencia = posteriores[0];
      }
    }

    // 2. Si no hay ningún capítulo visto en esta temporada, buscar en la temporada más cercana
    if (!referencia && registrosConFecha.length > 0) {
      const ordenadosPorDistTemp = [...registrosConFecha].sort((a, b) => {
        const distA = Math.abs(a.temp - temporadaNum);
        const distB = Math.abs(b.temp - temporadaNum);
        if (distA !== distB) return distA - distB;
        return b.ep - a.ep;
      });
      referencia = ordenadosPorDistTemp[0];
    }

    mapaFechas[epNum] = {
      fecha: referencia?.fecha || hoy,
      plataforma: referencia?.plataforma || null,
      visto_con_texto: referencia?.visto_con_texto || null,
      amigos: referencia?.amigos || [],
      origenReferencia: referencia ? `T${referencia.temp}·E${referencia.ep}` : 'Hoy',
    };
  });

  return mapaFechas;
}

export default function ModalGestionTemporada({
  obra,
  temporadaInicial = 1,
  temporadasDisponibles = [],
  onClose,
  onAbrirRegistrar,
  onAbrirCalificar,
  onAbrirAsignarAcompanante,
  onCompletado,
}) {
  const { usuario } = useAuth();
  const tmdbId = Number(obra?.tmdb_id || obra?.id || obra?.obra_tmdb_id);
  const tituloSerie = obra?.titulo || 'Serie';
  const posterPath = obra?.poster_serie || obra?.poster_path || obra?.poster_obra;

  const [temporadaActiva, setTemporadaActiva] = useState(Number(temporadaInicial) || 1);
  const [cargandoEpisodios, setCargandoEpisodios] = useState(true);
  const [datosTemporadaTMDb, setDatosTemporadaTMDb] = useState(null);
  const [confirmandoAuto, setConfirmandoAuto] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [errorGuardado, setErrorGuardado] = useState(null);

  // Lista normalizada de temporadas para los tabs superiores
  const listaTemporadas = useMemo(() => {
    if (Array.isArray(temporadasDisponibles) && temporadasDisponibles.length > 0) {
      return [...new Set(temporadasDisponibles)].sort((a, b) => a - b);
    }
    const maxT = Number(obra?.total_temporadas) || 1;
    return Array.from({ length: maxT }, (_, i) => i + 1);
  }, [temporadasDisponibles, obra?.total_temporadas]);

  // Registros de la serie pertenecientes a la temporada activa
  const registrosTempActiva = useMemo(() => {
    if (!Array.isArray(obra?.registros)) return [];
    return obra.registros.filter((r) => Number(r.temporada) === temporadaActiva);
  }, [obra?.registros, temporadaActiva]);

  // Set de números de episodios ya vistos en esta temporada
  const setEpisodiosVistos = useMemo(() => {
    const s = new Set();
    registrosTempActiva.forEach((r) => {
      const epNum = Number(r.episodio);
      if (!isNaN(epNum) && epNum > 0) s.add(epNum);
    });
    return s;
  }, [registrosTempActiva]);

  // Cargar episodios oficiales desde TMDb al cambiar de temporada
  useEffect(() => {
    let cancelado = false;
    if (!tmdbId) {
      setCargandoEpisodios(false);
      return;
    }

    setCargandoEpisodios(true);
    setConfirmandoAuto(false);
    setErrorGuardado(null);

    obtenerEpisodiosTemporadaAPI(tmdbId, temporadaActiva)
      .then((data) => {
        if (!cancelado && data) {
          setDatosTemporadaTMDb(data);
        }
      })
      .catch((err) => {
        console.warn('No se pudieron obtener episodios de TMDb para temporada:', err);
      })
      .finally(() => {
        if (!cancelado) setCargandoEpisodios(false);
      });

    return () => { cancelado = true; };
  }, [tmdbId, temporadaActiva]);

  // Lista consolidada de episodios de la temporada
  const listaEpisodiosCompletos = useMemo(() => {
    if (datosTemporadaTMDb?.episodes && Array.isArray(datosTemporadaTMDb.episodes)) {
      return datosTemporadaTMDb.episodes.map((ep) => ({
        numero: Number(ep.episode_number),
        nombre: ep.name || `Episodio ${ep.episode_number}`,
        still_path: ep.still_path,
      }));
    }

    // Fallback: calcular total según metadata o max episodio registrado
    const infoTMDbTemp = Array.isArray(obra?.seasons_info)
      ? obra.seasons_info.find((s) => Number(s.temporada) === temporadaActiva)
      : null;
    const totalCaps = Number(infoTMDbTemp?.episodios) || Math.max(setEpisodiosVistos.size, 1);

    return Array.from({ length: totalCaps }, (_, i) => ({
      numero: i + 1,
      nombre: `Episodio ${i + 1}`,
      still_path: null,
    }));
  }, [datosTemporadaTMDb, obra?.seasons_info, temporadaActiva, setEpisodiosVistos]);

  // Episodios faltantes (los que no están vistos)
  const episodiosFaltantes = useMemo(() => {
    return listaEpisodiosCompletos.filter((ep) => !setEpisodiosVistos.has(ep.numero));
  }, [listaEpisodiosCompletos, setEpisodiosVistos]);

  const estaCompletada = episodiosFaltantes.length === 0;

  // Mapa de fechas inteligentes deducidas para cada episodio faltante
  const mapaFechasDeducidas = useMemo(() => {
    const numsFaltantes = episodiosFaltantes.map((e) => e.numero);
    return deducirFechasFaltantes(temporadaActiva, numsFaltantes, obra?.registros);
  }, [temporadaActiva, episodiosFaltantes, obra?.registros]);

  // Resumen de fechas deducidas (para mostrar al usuario en la confirmación)
  const resumenFechasAuto = useMemo(() => {
    const fechasUnicas = [...new Set(Object.values(mapaFechasDeducidas).map((m) => m.fecha))];
    return fechasUnicas.map((f) => formatearFecha(f)).join(', ');
  }, [mapaFechasDeducidas]);

  // Acción: Ejecutar el autocompletado en lote
  const handleEjecutarAutoCompletar = async () => {
    if (!usuario?.id || episodiosFaltantes.length === 0) return;
    setGuardando(true);
    setErrorGuardado(null);

    try {
      // 1. Agrupar los capítulos faltantes por su fecha calculada
      const gruposPorFecha = {};
      episodiosFaltantes.forEach((ep) => {
        const info = mapaFechasDeducidas[ep.numero];
        const f = info?.fecha || obtenerFechaHoyLocal();

        if (!gruposPorFecha[f]) {
          gruposPorFecha[f] = {
            episodios: [],
            plataforma: info?.plataforma || obra?.plataforma || null,
            visto_con_texto: info?.visto_con_texto || null,
            amigos: (info?.amigos || []).map((a) => a.amigo_id || a.id).filter(Boolean),
          };
        }
        gruposPorFecha[f].episodios.push(ep.numero);
      });

      // Mapa de stills fotográficos si están disponibles
      const fotosMapa = {};
      episodiosFaltantes.forEach((ep) => {
        if (ep.still_path) fotosMapa[ep.numero] = ep.still_path;
      });

      // 2. Guardar cada lote por fecha
      for (const [fecha, datosGrupo] of Object.entries(gruposPorFecha)) {
        await registrarLoteAPI({
          usuario_id: usuario.id,
          tmdb_id: tmdbId,
          titulo: tituloSerie,
          poster_path: datosTemporadaTMDb?.poster_path || posterPath,
          plataforma: datosGrupo.plataforma,
          temporada: temporadaActiva,
          episodios: datosGrupo.episodios,
          fecha_visto: fecha,
          fotos_episodios: fotosMapa,
          total_episodios_temporada: listaEpisodiosCompletos.length,
          amigos_etiquetados: datosGrupo.amigos,
          visto_con_texto: datosGrupo.visto_con_texto,
        });
      }

      if (onCompletado) await onCompletado(episodiosFaltantes.length);
      onClose();
    } catch (err) {
      console.error('Error al autocompletar temporada:', err);
      setErrorGuardado(err.message || 'No se pudieron registrar los episodios.');
    } finally {
      setGuardando(false);
    }
  };

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div 
      onClick={onClose}
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-4 animate-fadeIn"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="bg-[#fcfaf7] dark:bg-[#181820] border border-neutral-300 dark:border-white/10 rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden flex flex-col text-neutral-900 dark:text-white max-h-[90vh]"
      >
        
        {/* CABECERA */}
        <div className="p-4 sm:p-5 border-b border-neutral-200 dark:border-white/10 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500 shrink-0">
              <Tv className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-mono uppercase tracking-widest font-black text-rose-500 block truncate">
                {tituloSerie}
              </span>
              <h2 className="text-base sm:text-lg font-black tracking-tight leading-tight truncate">
                Temporada {temporadaActiva}
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-neutral-200/60 dark:bg-white/10 hover:bg-rose-600 hover:text-white flex items-center justify-center transition cursor-pointer text-xs font-bold shrink-0"
            title="Cerrar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* SELECTOR DE TEMPORADAS (T1, T2, T3...) */}
        <div className="px-4 sm:px-5 pt-3 pb-2 border-b border-neutral-200/60 dark:border-white/5 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
          {listaTemporadas.map((temp) => {
            const esActiva = temporadaActiva === temp;
            const vistosTemp = (obra?.registros || []).filter((r) => Number(r.temporada) === temp);
            const cantVistosTemp = new Set(vistosTemp.map((r) => Number(r.episodio)).filter((n) => !isNaN(n) && n > 0)).size;
            const infoTempTMDb = Array.isArray(obra?.seasons_info)
              ? obra.seasons_info.find((s) => Number(s.temporada) === temp)
              : null;
            const totalTemp = Number(infoTempTMDb?.episodios) || null;
            const completa = totalTemp ? cantVistosTemp >= totalTemp : cantVistosTemp > 0;

            return (
              <button
                key={`tab-temp-modal-${temp}`}
                type="button"
                onClick={() => setTemporadaActiva(temp)}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
                  esActiva
                    ? 'bg-rose-600 text-white shadow-md'
                    : 'bg-neutral-200/70 dark:bg-white/5 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-300'
                }`}
              >
                <span>T{temp}</span>
                {completa && (
                  <span className="text-[10px] text-emerald-400">✓</span>
                )}
                {!completa && totalTemp && (
                  <span className="text-[10px] opacity-75 font-mono">{cantVistosTemp}/{totalTemp}</span>
                )}
              </button>
            );
          })}
        </div>

        {/* CUERPO DEL MODAL */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4">
          
          {cargandoEpisodios ? (
            <div className="py-12 flex flex-col items-center justify-center gap-2.5 text-neutral-500">
              <Loader2 className="w-6 h-6 animate-spin text-rose-500" />
              <p className="text-xs font-bold">Cargando episodios de la Temporada {temporadaActiva}...</p>
            </div>
          ) : estaCompletada ? (
            /* CASO: TEMPORADA COMPLETADA AL 100% */
            <div className="py-6 text-center space-y-4 animate-fadeIn">
              <div className="w-14 h-14 mx-auto rounded-3xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-500 shadow-sm">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-black text-neutral-900 dark:text-white">
                  ¡Temporada {temporadaActiva} completada!
                </h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-sm mx-auto">
                  Registraste todos los episodios ({listaEpisodiosCompletos.length} de {listaEpisodiosCompletos.length}).
                </p>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    if (onAbrirCalificar) onAbrirCalificar(temporadaActiva);
                  }}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-black bg-amber-500 hover:bg-amber-400 text-black shadow-md transition active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Star className="w-3.5 h-3.5 fill-black stroke-black" />
                  <span>Calificar Temporada {temporadaActiva}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    if (onAbrirAsignarAcompanante) onAbrirAsignarAcompanante(temporadaActiva);
                  }}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-bold text-neutral-600 dark:text-neutral-300 bg-neutral-200/80 dark:bg-white/5 hover:bg-neutral-300 dark:hover:bg-white/10 transition cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Users className="w-3.5 h-3.5 text-rose-500" />
                  <span>Visto con...</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    if (onAbrirRegistrar) onAbrirRegistrar(temporadaActiva);
                  }}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-bold text-neutral-600 dark:text-neutral-300 bg-neutral-200/80 dark:bg-white/5 hover:bg-neutral-300 dark:hover:bg-white/10 transition cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Ver en el registro</span>
                </button>
              </div>
            </div>
          ) : (
            /* CASO: FALTAN EPISODIOS EN LA TEMPORADA */
            <div className="space-y-4 animate-fadeIn">
              
              {/* Resumen de progreso */}
              <div className="flex items-center justify-between bg-amber-500/10 border border-amber-500/20 rounded-2xl p-3">
                <div className="flex items-center gap-2">
                  <span className="text-amber-500 text-sm">⏳</span>
                  <div>
                    <p className="text-xs font-black text-amber-700 dark:text-amber-400">
                      Te faltan {episodiosFaltantes.length} de {listaEpisodiosCompletos.length} episodios
                    </p>
                    <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                      Has visto {setEpisodiosVistos.size} capítulos en esta temporada
                    </p>
                  </div>
                </div>
                <span className="text-xs font-mono font-black text-amber-600 dark:text-amber-400">
                  {Math.round((setEpisodiosVistos.size / (listaEpisodiosCompletos.length || 1)) * 100)}%
                </span>
              </div>

              {/* Confirmación desplegada de autocompletado */}
              {confirmandoAuto ? (
                <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 space-y-3 animate-fadeIn">
                  <div className="flex items-start gap-2.5">
                    <Sparkles className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <h4 className="text-xs font-black text-neutral-900 dark:text-white">
                        ¿Confirmar autocompletado de {episodiosFaltantes.length} capítulos?
                      </h4>
                      <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed">
                        Se asignarán automáticamente las fechas de los episodios vecinos vistos:
                        <span className="font-bold text-rose-500 block mt-0.5">
                          📅 {resumenFechasAuto}
                        </span>
                      </p>
                    </div>
                  </div>

                  {errorGuardado && (
                    <p className="text-xs font-bold text-rose-500 bg-rose-500/10 p-2 rounded-xl">
                      {errorGuardado}
                    </p>
                  )}

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      disabled={guardando}
                      onClick={handleEjecutarAutoCompletar}
                      className="px-4 py-2 rounded-xl text-xs font-black bg-rose-600 hover:bg-rose-500 text-white shadow-md transition active:scale-95 disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                    >
                      {guardando ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Guardando...</span>
                        </>
                      ) : (
                        <>
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                          <span>Sí, guardar ahora</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      disabled={guardando}
                      onClick={() => setConfirmandoAuto(false)}
                      className="px-3.5 py-2 rounded-xl text-xs font-bold text-neutral-500 hover:text-neutral-800 dark:hover:text-white transition cursor-pointer"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                /* Botón principal para activar el autocompletado inteligente */
                <button
                  type="button"
                  onClick={() => setConfirmandoAuto(true)}
                  className="w-full p-3.5 rounded-2xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white shadow-lg transition-all active:scale-[0.98] cursor-pointer flex items-center justify-between gap-3 text-left group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                      <Zap className="w-5 h-5 fill-white" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-black tracking-tight leading-tight">
                        ⚡ Completar {episodiosFaltantes.length} faltantes automáticamente
                      </p>
                      <p className="text-[11px] text-white/80 truncate mt-0.5">
                        Detecta las fechas lógicas de los capítulos que ya viste
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 shrink-0 group-hover:translate-x-1 transition-transform" />
                </button>
              )}

              {/* Lista de episodios faltantes con sus fechas estimadas */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-neutral-400 block px-1">
                  Capítulos que te faltan registrar:
                </span>
                
                <div className="max-h-52 overflow-y-auto space-y-1 pr-1 scrollbar-thin">
                  {episodiosFaltantes.map((ep) => {
                    const infoFecha = mapaFechasDeducidas[ep.numero];
                    return (
                      <div
                        key={`faltante-${ep.numero}`}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-neutral-200/50 dark:bg-white/[0.03] border border-neutral-300/60 dark:border-white/5 text-xs"
                      >
                        <div className="min-w-0 flex items-center gap-2">
                          <span className="w-6 h-6 rounded-lg bg-black/10 dark:bg-white/10 font-mono font-black flex items-center justify-center text-[11px] shrink-0">
                            {ep.numero}
                          </span>
                          <span className="font-bold text-neutral-800 dark:text-neutral-200 truncate">
                            {ep.nombre}
                          </span>
                        </div>

                        {infoFecha && (
                          <span className="text-[10px] font-medium text-neutral-500 dark:text-neutral-400 shrink-0 ml-2 bg-neutral-200 dark:bg-white/5 px-2 py-0.5 rounded-md">
                            Fecha est.: {formatearFecha(infoFecha.fecha)}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          )}

        </div>

        {/* ACCIONES INFERIORES */}
        <div className="p-4 sm:p-5 border-t border-neutral-200 dark:border-white/10 bg-neutral-100/50 dark:bg-white/[0.02] flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={() => {
                onClose();
                if (onAbrirCalificar) onAbrirCalificar(temporadaActiva);
              }}
              className="p-2 rounded-xl text-neutral-600 dark:text-neutral-300 hover:text-amber-500 hover:bg-amber-500/10 transition cursor-pointer flex items-center gap-1 text-xs font-bold"
              title="Calificar esta temporada con estrellas y reseña"
            >
              <Star className="w-3.5 h-3.5" />
              <span>Calificar T{temporadaActiva}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onClose();
                if (onAbrirAsignarAcompanante) onAbrirAsignarAcompanante(temporadaActiva);
              }}
              className="p-2 rounded-xl text-neutral-600 dark:text-neutral-300 hover:text-rose-500 hover:bg-rose-500/10 transition cursor-pointer flex items-center gap-1 text-xs font-bold"
              title="Asignar con quién viste esta temporada"
            >
              <Users className="w-3.5 h-3.5 text-rose-500" />
              <span>Visto con...</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {!estaCompletada && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  if (onAbrirRegistrar) onAbrirRegistrar(temporadaActiva);
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold text-neutral-700 dark:text-neutral-200 bg-neutral-200 hover:bg-neutral-300 dark:bg-white/10 dark:hover:bg-white/15 transition cursor-pointer flex items-center gap-1.5"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Marcar manualmente</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2 rounded-xl text-xs font-bold text-neutral-500 hover:text-neutral-800 dark:hover:text-white transition cursor-pointer"
            >
              Cerrar
            </button>
          </div>
        </div>

      </div>
    </div>,
    document.body
  );
}
