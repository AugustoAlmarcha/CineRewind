import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { 
  Users, Check, X, Sparkles, Loader2, Calendar, Tv, Layers, 
  UserCheck, AlertCircle, CheckSquare, Square, UserX
} from 'lucide-react';
import { obtenerAmigosAPI, asignarAcompananteLoteSerieAPI } from '../../api';

export default function ModalAsignarAcompananteSerie({
  obra,
  temporadaPreseleccionada = null,
  onClose,
  onAsignado
}) {
  const obraId = obra?.obra_id || obra?.registros?.[0]?.obra_id || obra?.id;
  const titulo = obra?.titulo || 'Serie';
  const posterPath = obra?.poster_serie || obra?.poster_path || obra?.poster_obra || obra?.foto_episodio;

  // Lista normalizada de todos los registros que tiene el usuario de esta serie
  const todosLosRegistros = useMemo(() => {
    if (!Array.isArray(obra?.registros)) return [];
    return [...obra.registros].sort((a, b) => {
      const tA = Number(a.temporada) || 0;
      const tB = Number(b.temporada) || 0;
      if (tA !== tB) return tA - tB;
      const eA = Number(a.episodio) || 0;
      const eB = Number(b.episodio) || 0;
      return eA - eB;
    });
  }, [obra?.registros]);

  // Temporadas con registros vistos
  const mapaTemporadas = useMemo(() => {
    const mapa = {};
    todosLosRegistros.forEach((r) => {
      const t = Number(r.temporada) || 1;
      if (!mapa[t]) mapa[t] = [];
      mapa[t].push(r);
    });
    return mapa;
  }, [todosLosRegistros]);

  const listaTemporadasDisponibles = useMemo(() => {
    return Object.keys(mapaTemporadas)
      .map(Number)
      .sort((a, b) => a - b);
  }, [mapaTemporadas]);

  // Modo de selección de capítulos: 'serie' | 'temporada' | 'episodios'
  const [alcance, setAlcance] = useState(
    temporadaPreseleccionada ? 'temporada' : 'serie'
  );
  const [temporadaSeleccionada, setTemporadaSeleccionada] = useState(
    temporadaPreseleccionada || (listaTemporadasDisponibles[0] || 1)
  );
  const [episodiosSeleccionadosIds, setEpisodiosSeleccionadosIds] = useState([]);

  // Amigos y acompañantes
  const [amigosDisponibles, setAmigosDisponibles] = useState([]);
  const [amigosSeleccionados, setAmigosSeleccionados] = useState([]);
  const [nombreManual, setNombreManual] = useState('');

  // Estados de proceso
  const [cargandoAmigos, setCargandoAmigos] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState(null);

  // Cargar lista de amigos confirmados del usuario
  useEffect(() => {
    let cancelado = false;
    obtenerAmigosAPI()
      .then((data) => {
        if (!cancelado && Array.isArray(data)) {
          setAmigosDisponibles(data);
        }
      })
      .catch((err) => console.warn('No se pudieron cargar amigos:', err))
      .finally(() => {
        if (!cancelado) setCargandoAmigos(false);
      });
    return () => { cancelado = true; };
  }, []);

  // Calcular cuántos capítulos serán afectados
  const capsAfectados = useMemo(() => {
    if (alcance === 'serie') {
      return todosLosRegistros;
    }
    if (alcance === 'temporada') {
      return mapaTemporadas[temporadaSeleccionada] || [];
    }
    // 'episodios'
    return todosLosRegistros.filter((r) => {
      const idReal = r.id || r.historial_id;
      return episodiosSeleccionadosIds.includes(idReal);
    });
  }, [alcance, temporadaSeleccionada, episodiosSeleccionadosIds, todosLosRegistros, mapaTemporadas]);

  // Manejo de toggle para amigos de la app
  const toggleAmigo = (amigoId) => {
    setAmigosSeleccionados((prev) =>
      prev.includes(amigoId) ? prev.filter((id) => id !== amigoId) : [...prev, amigoId]
    );
  };

  // Manejo de checkboxes para capítulos individuales
  const toggleEpisodioCheck = (idReal) => {
    setEpisodiosSeleccionadosIds((prev) =>
      prev.includes(idReal) ? prev.filter((id) => id !== idReal) : [...prev, idReal]
    );
  };

  const seleccionarTodosLosCaps = () => {
    const todosIds = todosLosRegistros.map((r) => r.id || r.historial_id).filter(Boolean);
    setEpisodiosSeleccionadosIds(todosIds);
  };

  const desmarcarTodosLosCaps = () => {
    setEpisodiosSeleccionadosIds([]);
  };

  // Ejecutar asignación masiva
  const handleGuardar = async (e) => {
    e.preventDefault();
    if (!obraId) return;

    if (amigosSeleccionados.length === 0 && !nombreManual.trim()) {
      setError('Selecciona al menos un amigo o escribe un nombre para asignar.');
      return;
    }

    if (capsAfectados.length === 0) {
      setError('Debes seleccionar al menos un capítulo para asignar.');
      return;
    }

    setGuardando(true);
    setError(null);

    try {
      const targetIds = capsAfectados.map((r) => r.id || r.historial_id).filter(Boolean);

      const res = await asignarAcompananteLoteSerieAPI({
        obraId,
        alcance,
        temporada: alcance === 'temporada' ? temporadaSeleccionada : null,
        historialIds: alcance === 'episodios' ? targetIds : [],
        amigosEtiquetados: amigosSeleccionados,
        vistoConTexto: nombreManual.trim() || '',
      });

      if (onAsignado) {
        await onAsignado(res.total_actualizados || capsAfectados.length);
      }
      onClose();
    } catch (err) {
      console.error('Error al asignar acompañante:', err);
      setError(err.message || 'No se pudo asignar el acompañante.');
    } finally {
      setGuardando(false);
    }
  };

  // Quitar acompañantes y co-visiones en lote
  const handleQuitarAcompanantes = async () => {
    if (!obraId || capsAfectados.length === 0) return;
    const mensajeConfirm = amigosSeleccionados.length > 0
      ? `¿Quitar a los amigos seleccionados de los ${capsAfectados.length} capítulos?\n(Tus registros y los de tus amigos permanecerán guardados en sus historiales)`
      : `¿Quitar todos los acompañantes y co-visiones de los ${capsAfectados.length} capítulos seleccionados?\n(Tus registros y los de tus amigos permanecerán guardados en sus historiales)`;
    if (!window.confirm(mensajeConfirm)) return;

    setGuardando(true);
    setError(null);
    try {
      const targetIds = capsAfectados.map((r) => r.id || r.historial_id).filter(Boolean);
      const res = await asignarAcompananteLoteSerieAPI({
        obraId,
        alcance,
        temporada: alcance === 'temporada' ? temporadaSeleccionada : null,
        historialIds: alcance === 'episodios' ? targetIds : [],
        amigosEtiquetados: amigosSeleccionados,
        accion: 'quitar',
      });
      if (onAsignado) {
        await onAsignado(res.total_actualizados || capsAfectados.length);
      }
      onClose();
    } catch (err) {
      console.error('Error al quitar acompañantes:', err);
      setError(err.message || 'No se pudieron quitar los acompañantes.');
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
        className="bg-[#fcfaf7] dark:bg-[#181820] border border-neutral-300 dark:border-white/10 rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden flex flex-col text-neutral-900 dark:text-white max-h-[92vh]"
      >
        {/* CABECERA */}
        <div className="p-4 sm:p-5 border-b border-neutral-200 dark:border-white/10 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500 shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-mono uppercase tracking-widest font-black text-rose-500 block truncate">
                {titulo}
              </span>
              <h2 className="text-base sm:text-lg font-black tracking-tight leading-tight truncate">
                Asignar «Visto con...» en lote
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

        {/* CONTENIDO SCROLLEABLE */}
        <form onSubmit={handleGuardar} className="p-4 sm:p-5 overflow-y-auto space-y-5 scrollbar-thin">
          {error && (
            <div className="p-3 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* PASO 1: ALCANCE DE CAPÍTULOS */}
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-wider text-neutral-500 dark:text-neutral-400 block">
              1. ¿Qué capítulos viste acompañado?
            </label>

            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setAlcance('serie')}
                className={`p-3 rounded-2xl border text-center transition cursor-pointer flex flex-col items-center justify-center gap-1 ${
                  alcance === 'serie'
                    ? 'bg-rose-600 border-rose-500 text-white font-bold shadow-md'
                    : 'bg-neutral-100 dark:bg-white/5 border-neutral-300 dark:border-white/10 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-white/10'
                }`}
              >
                <Sparkles className="w-4 h-4" />
                <span className="text-xs font-black leading-tight">Toda la serie</span>
                <span className="text-[10px] opacity-80">{todosLosRegistros.length} caps</span>
              </button>

              <button
                type="button"
                onClick={() => setAlcance('temporada')}
                className={`p-3 rounded-2xl border text-center transition cursor-pointer flex flex-col items-center justify-center gap-1 ${
                  alcance === 'temporada'
                    ? 'bg-rose-600 border-rose-500 text-white font-bold shadow-md'
                    : 'bg-neutral-100 dark:bg-white/5 border-neutral-300 dark:border-white/10 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-white/10'
                }`}
              >
                <Tv className="w-4 h-4" />
                <span className="text-xs font-black leading-tight">Temporada</span>
                <span className="text-[10px] opacity-80">
                  {mapaTemporadas[temporadaSeleccionada]?.length || 0} caps
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setAlcance('episodios');
                  if (episodiosSeleccionadosIds.length === 0) {
                    seleccionarTodosLosCaps();
                  }
                }}
                className={`p-3 rounded-2xl border text-center transition cursor-pointer flex flex-col items-center justify-center gap-1 ${
                  alcance === 'episodios'
                    ? 'bg-rose-600 border-rose-500 text-white font-bold shadow-md'
                    : 'bg-neutral-100 dark:bg-white/5 border-neutral-300 dark:border-white/10 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-white/10'
                }`}
              >
                <CheckSquare className="w-4 h-4" />
                <span className="text-xs font-black leading-tight">A elección</span>
                <span className="text-[10px] opacity-80">
                  {episodiosSeleccionadosIds.length} elegidos
                </span>
              </button>
            </div>
          </div>

          {/* SELECTOR SUB-TEMPORADA (Si alcance === 'temporada') */}
          {alcance === 'temporada' && (
            <div className="p-3 bg-neutral-100 dark:bg-white/5 rounded-2xl border border-neutral-200 dark:border-white/10 space-y-2">
              <span className="text-[11px] font-bold text-neutral-500 dark:text-neutral-400 block">
                Selecciona la temporada a asignar:
              </span>
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
                {listaTemporadasDisponibles.map((tempNum) => {
                  const esActiva = temporadaSeleccionada === tempNum;
                  const cant = mapaTemporadas[tempNum]?.length || 0;
                  return (
                    <button
                      key={tempNum}
                      type="button"
                      onClick={() => setTemporadaSeleccionada(tempNum)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer shrink-0 ${
                        esActiva
                          ? 'bg-rose-600 text-white shadow'
                          : 'bg-neutral-200 dark:bg-white/10 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-300 dark:hover:bg-white/15'
                      }`}
                    >
                      T{tempNum} ({cant})
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* LISTA CON CHECKBOXES (Si alcance === 'episodios') */}
          {alcance === 'episodios' && (
            <div className="p-3 bg-neutral-100 dark:bg-white/5 rounded-2xl border border-neutral-200 dark:border-white/10 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-neutral-500 dark:text-neutral-400">
                  Elige los capítulos:
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={seleccionarTodosLosCaps}
                    className="text-[10px] font-bold text-rose-500 hover:underline cursor-pointer"
                  >
                    Marcar todos
                  </button>
                  <span className="text-neutral-300 dark:text-neutral-700">·</span>
                  <button
                    type="button"
                    onClick={desmarcarTodosLosCaps}
                    className="text-[10px] font-bold text-neutral-400 hover:underline cursor-pointer"
                  >
                    Desmarcar
                  </button>
                </div>
              </div>

              <div className="max-h-40 overflow-y-auto space-y-1 pr-1 scrollbar-thin">
                {todosLosRegistros.map((r) => {
                  const idReal = r.id || r.historial_id;
                  const checked = episodiosSeleccionadosIds.includes(idReal);
                  return (
                    <button
                      key={idReal || `${r.temporada}-${r.episodio}`}
                      type="button"
                      onClick={() => toggleEpisodioCheck(idReal)}
                      className={`w-full flex items-center justify-between p-2 rounded-xl text-xs transition cursor-pointer ${
                        checked
                          ? 'bg-rose-500/15 border border-rose-500/30 text-rose-600 dark:text-rose-400 font-bold'
                          : 'hover:bg-neutral-200 dark:hover:bg-white/5 text-neutral-700 dark:text-neutral-300'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        {checked ? (
                          <CheckSquare className="w-4 h-4 text-rose-500 shrink-0" />
                        ) : (
                          <Square className="w-4 h-4 text-neutral-400 shrink-0" />
                        )}
                        <span className="font-mono">T{r.temporada}·E{r.episodio}</span>
                        {r.fecha_visto && (
                          <span className="text-[10px] text-neutral-400 font-normal truncate">
                            ({r.fecha_visto.split('T')[0]})
                          </span>
                        )}
                      </div>
                      {r.visto_con_texto && (
                        <span className="text-[10px] text-neutral-400 truncate max-w-[90px]">
                          {r.visto_con_texto}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* PASO 2: CON QUIÉN LA VISTE */}
          <div className="space-y-3">
            <label className="text-xs font-black uppercase tracking-wider text-neutral-500 dark:text-neutral-400 block">
              2. ¿Con quién la viste?
            </label>

            {/* Amigos de la app */}
            {cargandoAmigos ? (
              <div className="py-2 text-center text-xs text-neutral-400 flex items-center justify-center gap-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Cargando amigos...</span>
              </div>
            ) : amigosDisponibles.length > 0 ? (
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block px-1">
                  Amigos en CineRewind (Genera co-visión)
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {amigosDisponibles.map((a) => {
                    const seleccionado = amigosSeleccionados.includes(a.id);
                    return (
                      <button
                        key={a.id}
                        type="button"
                        onClick={() => toggleAmigo(a.id)}
                        className={`p-2.5 rounded-2xl border transition cursor-pointer flex items-center justify-between gap-2 ${
                          seleccionado
                            ? 'bg-rose-600 border-rose-500 text-white font-bold shadow-md'
                            : 'bg-neutral-100 dark:bg-white/5 border-neutral-200 dark:border-white/10 hover:border-neutral-300 dark:hover:border-white/20 text-neutral-800 dark:text-neutral-200'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          {a.avatar_url ? (
                            <img src={a.avatar_url} alt={a.username} className="w-6 h-6 rounded-full object-cover shrink-0" />
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-rose-500/20 text-rose-500 text-xs font-black flex items-center justify-center shrink-0">
                              {(a.nombre || a.username || '?').charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div className="min-w-0 text-left">
                            <p className="text-xs font-bold truncate leading-tight">{a.nombre || a.username}</p>
                            <p className={`text-[10px] truncate ${seleccionado ? 'text-white/80' : 'text-neutral-400'}`}>@{a.username}</p>
                          </div>
                        </div>
                        {seleccionado && <Check className="w-3.5 h-3.5 shrink-0 stroke-[3]" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}

            {/* Acompañante manual escrito */}
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block px-1">
                O escribe un acompañante manual:
              </span>
              <input
                type="text"
                value={nombreManual}
                onChange={(e) => setNombreManual(e.target.value)}
                placeholder="Ej: Mamá, Amigos del laburo, Lucas..."
                className="w-full bg-neutral-100 dark:bg-white/5 border border-neutral-300 dark:border-white/10 rounded-2xl px-3.5 py-2.5 text-xs text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:border-rose-500 transition"
              />
            </div>
          </div>

          {/* BOTÓN SUBMIT FINAL */}
          <div className="pt-2 space-y-2">
            <button
              type="submit"
              disabled={guardando || capsAfectados.length === 0}
              className="w-full py-3 rounded-2xl bg-rose-600 hover:bg-rose-500 active:scale-98 text-white font-black text-xs uppercase tracking-wider transition shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
            >
              {guardando ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Guardando...</span>
                </>
              ) : (
                <>
                  <Users className="w-4 h-4" />
                  <span>
                    Asignar a {capsAfectados.length} {capsAfectados.length === 1 ? 'capítulo' : 'capítulos'}
                  </span>
                </>
              )}
            </button>

            <button
              type="button"
              disabled={guardando || capsAfectados.length === 0}
              onClick={handleQuitarAcompanantes}
              className="w-full py-2.5 rounded-2xl bg-transparent hover:bg-rose-500/10 text-neutral-500 hover:text-rose-600 dark:hover:text-rose-400 font-bold text-xs transition border border-transparent hover:border-rose-500/20 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <UserX className="w-3.5 h-3.5" />
              <span>
                {amigosSeleccionados.length > 0 
                  ? `Quitar amigos seleccionados de estos ${capsAfectados.length} caps` 
                  : `Quitar acompañantes de estos ${capsAfectados.length} caps`}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
