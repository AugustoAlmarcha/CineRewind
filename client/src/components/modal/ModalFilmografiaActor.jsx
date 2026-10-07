import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../../context/AuthContext';
import { obtenerFilmografiaActorAPI, obtenerTimelineAPI, registrarVisualizacionAPI } from '../../api';
import TarjetaFilmografia from './TarjetaFilmografia';
import { CheckSquare, Check, Calendar, Tv, Sparkles, X, Users, Film } from 'lucide-react';
import { obtenerFechaHoyLocal, obtenerFechaAyerLocal } from '../../utils/fechas';

export default function ModalFilmografiaActor({ actor, onClose, onSeleccionarObra }) {
  const { usuario } = useAuth();
  const [obras, setObras] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [idsVistos, setIdsVistos] = useState(new Set());

  // Modo selección múltiple
  const [modoSeleccion, setModoSeleccion] = useState(false);
  const [obrasSeleccionadas, setObrasSeleccionadas] = useState([]);
  const [modalLoteAbierto, setModalLoteAbierto] = useState(false);
  const [fechaLote, setFechaLote] = useState(obtenerFechaHoyLocal());
  const [plataformaLote, setPlataformaLote] = useState('');
  const [guardandoLote, setGuardandoLote] = useState(false);
  const [notificacion, setNotificacion] = useState(null);

  const actorId = actor?.id;
  const usuarioId = usuario?.id;

  useEffect(() => {
    if (!actorId) return;
    let cancelado = false;

    const cargarDatos = async () => {
      setCargando(true);
      try {
        const peticionHistorial = usuarioId 
          ? obtenerTimelineAPI(usuarioId) 
          : Promise.resolve([]);

        const [historial, filmografia] = await Promise.all([
          peticionHistorial,
          obtenerFilmografiaActorAPI(actorId)
        ]);

        if (!cancelado) {
          if (Array.isArray(historial) && historial.length > 0) {
            setIdsVistos(new Set(historial.map((h) => Number(h.tmdb_id))));
          } else {
            setIdsVistos(new Set());
          }
          setObras(Array.isArray(filmografia) ? filmografia : []);
        }
      } catch (err) {
        if (!cancelado) {
          console.error('Error al cargar filmografía:', err);
        }
      } finally {
        if (!cancelado) setCargando(false);
      }
    };

    cargarDatos();
    return () => { cancelado = true; };
  }, [actorId, usuarioId]);

  const toggleSeleccion = (obra) => {
    const obraId = obra.tmdb_id || obra.id;
    setObrasSeleccionadas((prev) => {
      const existe = prev.some((o) => (o.tmdb_id || o.id) === obraId);
      if (existe) {
        return prev.filter((o) => (o.tmdb_id || o.id) !== obraId);
      } else {
        return [...prev, obra];
      }
    });
  };

  const handleConfirmarLote = async () => {
    if (!usuarioId || obrasSeleccionadas.length === 0) return;
    setGuardandoLote(true);
    let guardadas = 0;

    try {
      for (const obra of obrasSeleccionadas) {
        try {
          const esSerie = obra.tipo?.toLowerCase() === 'serie';
          await registrarVisualizacionAPI({
            tmdb_id: obra.tmdb_id || obra.id,
            tipo: esSerie ? 'serie' : 'pelicula',
            titulo: obra.titulo,
            poster_path: obra.poster_path,
            fecha_visto: fechaLote,
            plataforma: plataformaLote || null,
            temporada: esSerie ? 1 : null,
            episodio: esSerie ? 1 : null,
          });
          guardadas++;
        } catch (err) {
          console.warn(`No se pudo registrar ${obra.titulo}:`, err.message);
        }
      }

      // Actualizar los IDs vistos inmediatamente en la vista actual
      setIdsVistos((prev) => {
        const nuevo = new Set(prev);
        obrasSeleccionadas.forEach((o) => nuevo.add(Number(o.tmdb_id || o.id)));
        return nuevo;
      });

      setNotificacion(`¡Se guardaron ${guardadas} título(s) en tu diario!`);
      setTimeout(() => setNotificacion(null), 4000);

      setObrasSeleccionadas([]);
      setModalLoteAbierto(false);
      setModoSeleccion(false);
    } catch (err) {
      console.error('Error al registrar lote:', err);
    } finally {
      setGuardandoLote(false);
    }
  };

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 z-[10002] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto">
      <div className="bg-[#fcfaf7] dark:bg-[#141418] border border-neutral-300 dark:border-white/10 rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-neutral-900 dark:text-white my-auto animate-fadeIn relative">
        
        {/* Notificación Toast superior */}
        {notificacion && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-2xl bg-emerald-600 text-white font-black text-xs shadow-xl animate-fadeIn flex items-center gap-2">
            <span>✓</span>
            <span>{notificacion}</span>
          </div>
        )}

        {/* Cabecera */}
        <div className="p-5 sm:p-6 border-b border-neutral-200 dark:border-white/10 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-full overflow-hidden bg-neutral-800 border-2 border-rose-600 shadow-md flex-shrink-0 flex items-center justify-center">
              {actor.foto ? (
                <img src={actor.foto} alt={actor.nombre} className="w-full h-full object-cover" />
              ) : (
                <Users className="w-6 h-6 text-neutral-400" />
              )}
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-rose-600">Filmografía destacada</span>
              <h2 className="text-xl sm:text-2xl font-black">{actor.nombre}</h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Botón Activar / Desactivar Selección Múltiple */}
            {obras.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setModoSeleccion(!modoSeleccion);
                  setObrasSeleccionadas([]);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border ${
                  modoSeleccion
                    ? 'bg-rose-600 text-white border-rose-500 shadow-md'
                    : 'bg-neutral-200/80 dark:bg-white/10 hover:bg-neutral-300 dark:hover:bg-white/15 text-neutral-800 dark:text-neutral-200 border-neutral-300 dark:border-white/10'
                }`}
              >
                <CheckSquare className="w-3.5 h-3.5" />
                <span>{modoSeleccion ? 'Cancelar selección' : 'Seleccionar varias'}</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-neutral-200 dark:bg-white/10 hover:bg-rose-600 hover:text-white flex items-center justify-center transition cursor-pointer"
              title="Cerrar"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Grilla con scroll */}
        <div className="p-6 overflow-y-auto flex-1 scrollbar-thin">
          {cargando ? (
            <div className="py-20 text-center text-sm text-neutral-400 animate-pulse">
              Cargando catálogo del actor...
            </div>
          ) : obras.length === 0 ? (
            <div className="py-20 text-center text-sm text-neutral-400">
              No se encontraron obras disponibles.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {obras.map((obra) => {
                const obraKey = obra.tmdb_id || obra.id;
                const estaSeleccionada = obrasSeleccionadas.some((o) => (o.tmdb_id || o.id) === obraKey);
                return (
                  <TarjetaFilmografia
                    key={obraKey}
                    obra={obra}
                    yaVista={idsVistos.has(Number(obraKey))}
                    modoSeleccion={modoSeleccion}
                    seleccionada={estaSeleccionada}
                    onSeleccionar={(o) => {
                      if (modoSeleccion) {
                        toggleSeleccion(o);
                      } else if (onSeleccionarObra) {
                        onSeleccionarObra(o);
                      }
                    }}
                  />
                );
              })}
            </div>
          )}
        </div>

        {/* Barra flotante inferior de selección múltiple */}
        {modoSeleccion && obrasSeleccionadas.length > 0 && (
          <div className="p-4 bg-white dark:bg-[#181822] border-t border-neutral-200 dark:border-white/10 flex items-center justify-between gap-3 animate-fadeIn">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-rose-600 text-white font-black text-xs flex items-center justify-center shadow">
                {obrasSeleccionadas.length}
              </span>
              <span className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
                {obrasSeleccionadas.length === 1 ? 'obra seleccionada' : 'obras seleccionadas'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setObrasSeleccionadas([])}
                className="text-xs font-bold text-neutral-500 hover:text-neutral-900 dark:hover:text-white px-2.5 py-1.5 cursor-pointer"
              >
                Limpiar
              </button>
              <button
                type="button"
                onClick={() => setModalLoteAbierto(true)}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs shadow-lg shadow-rose-900/20 transition flex items-center gap-1.5 cursor-pointer active:scale-95"
              >
                <Check className="w-4 h-4" />
                <span>Marcar como vistas ({obrasSeleccionadas.length})</span>
              </button>
            </div>
          </div>
        )}

        {/* MODAL / PANEL DE GUARDADO EN LOTE */}
        {modalLoteAbierto && (
          <div className="fixed inset-0 z-[10004] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn">
            <div className="bg-[#fcfaf7] dark:bg-[#181822] border border-neutral-300 dark:border-white/10 rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl text-neutral-900 dark:text-white my-auto">
              <div className="flex items-center justify-between pb-3 border-b border-neutral-200 dark:border-white/10">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-rose-500" />
                  <h3 className="font-black text-lg">
                    Marcar {obrasSeleccionadas.length} {obrasSeleccionadas.length === 1 ? 'título' : 'títulos'} como {obrasSeleccionadas.length === 1 ? 'visto' : 'vistos'}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setModalLoteAbierto(false)}
                  className="w-7 h-7 rounded-full bg-neutral-200 dark:bg-white/10 hover:bg-rose-600 hover:text-white flex items-center justify-center transition cursor-pointer text-xs"
                >
                  ✕
                </button>
              </div>

              {/* Obras seleccionadas (chips preview) */}
              <div className="space-y-1.5">
                <p className="text-[10px] font-black uppercase text-neutral-400">Obras a registrar en tu diario:</p>
                <div className="max-h-28 overflow-y-auto flex flex-wrap gap-1.5 p-2 bg-neutral-100 dark:bg-white/5 rounded-2xl border border-neutral-200 dark:border-white/5">
                  {obrasSeleccionadas.map((o) => {
                    const esSerie = o.tipo?.toLowerCase() === 'serie';
                    return (
                      <span 
                        key={o.tmdb_id || o.id}
                        className="px-2.5 py-1 rounded-xl bg-white dark:bg-neutral-800 text-[11px] font-bold border border-neutral-200 dark:border-white/10 shadow-sm truncate max-w-[220px] flex items-center gap-1.5"
                      >
                        {esSerie ? (
                          <Tv className="w-3 h-3 text-purple-500 shrink-0" />
                        ) : (
                          <Film className="w-3 h-3 text-rose-500 shrink-0" />
                        )}
                        <span className="truncate">{o.titulo}</span>
                        {esSerie && (
                          <span className="text-[9px] text-purple-600 dark:text-purple-400 font-extrabold shrink-0 bg-purple-50 dark:bg-purple-950/40 px-1 py-0.5 rounded">
                            T1 · E1
                          </span>
                        )}
                      </span>
                    );
                  })}
                </div>
              </div>

              {/* Selector de fecha */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black uppercase text-neutral-500 dark:text-neutral-400 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-rose-500" />
                    <span>Fecha de visualización</span>
                  </label>
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => setFechaLote(obtenerFechaHoyLocal())}
                      className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-neutral-200 dark:bg-white/10 hover:bg-rose-600 hover:text-white transition cursor-pointer"
                    >
                      Hoy
                    </button>
                    <button
                      type="button"
                      onClick={() => setFechaLote(obtenerFechaAyerLocal())}
                      className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-neutral-200 dark:bg-white/10 hover:bg-rose-600 hover:text-white transition cursor-pointer"
                    >
                      Ayer
                    </button>
                  </div>
                </div>
                <input
                  type="date"
                  value={fechaLote}
                  max={obtenerFechaHoyLocal()}
                  onChange={(e) => setFechaLote(e.target.value)}
                  className="w-full bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-white/10 rounded-xl px-3.5 py-2.5 text-xs font-bold text-neutral-900 dark:text-white focus:outline-none focus:border-rose-500 cursor-pointer"
                />
                <p className="text-[10px] text-neutral-500 dark:text-neutral-400">
                  {obrasSeleccionadas.some((o) => o.tipo?.toLowerCase() === 'serie')
                    ? 'Las series se registrarán con el Capítulo 1 (T1 · E1) e iniciarán su seguimiento en tu perfil.'
                    : 'Podrás cambiar la fecha de cualquiera de ellas más tarde desde tu diario al tocar la película.'}
                </p>
              </div>

              {/* Selector de plataforma opcional */}
              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase text-neutral-500 dark:text-neutral-400 flex items-center gap-1.5">
                  <Tv className="w-3.5 h-3.5 text-rose-500" />
                  <span>Plataforma (opcional)</span>
                </label>
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                  {['Netflix', 'Max', 'Disney+', 'Prime Video', 'Apple TV+', 'Cine', 'Paramount+'].map((plat) => (
                    <button
                      key={plat}
                      type="button"
                      onClick={() => setPlataformaLote(plataformaLote === plat ? '' : plat)}
                      className={`text-xs px-2.5 py-1 rounded-xl font-bold border transition cursor-pointer ${
                        plataformaLote === plat
                          ? 'bg-rose-600 text-white border-rose-600 shadow'
                          : 'bg-neutral-100 dark:bg-white/5 border-neutral-200 dark:border-white/10 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                      }`}
                    >
                      {plat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Botones de acción */}
              <div className="flex items-center justify-end gap-3 pt-2 border-t border-neutral-200 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => setModalLoteAbierto(false)}
                  disabled={guardandoLote}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmarLote}
                  disabled={guardandoLote}
                  className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 active:scale-95 text-white font-black text-xs shadow-lg shadow-rose-950/20 transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {guardandoLote ? (
                    <span>Guardando {obrasSeleccionadas.length} obras...</span>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Confirmar y Guardar ({obrasSeleccionadas.length})</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>,
    document.body
  );
}