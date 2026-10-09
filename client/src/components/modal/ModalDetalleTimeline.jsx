import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  guardarReseniaAPI, 
  obtenerDetalleEpisodioAPI,
  obtenerDetallePeliculaAPI,
  actualizarPlataformaSerieAPI 
} from '../../api';
import CalificadorEstrellas from '../common/CalificadorEstrellas';
import ModalFilmografiaActor from './ModalFilmografiaActor';
import ModalCalificarSerie from './ModalCalificarSerie';
import SelectorAmigosEtiquetar from './SelectorAmigosEtiquetar';
import { Tv, Users, Clapperboard, BookOpen, ChevronDown, Calendar, Award, Star } from 'lucide-react';
import { obtenerFechaHoyLocal, obtenerFechaAyerLocal, formatearFechaLarga } from '../../utils/fechas';


const PLATAFORMAS_DISPONIBLES = [
  'Netflix', 'Max', 'Disney+', 'Prime Video', 'Apple TV+', 'Cine', 'Paramount+', 'Mubi', 'Crunchyroll'
];

export default function ModalDetalleTimeline({ 
  item, 
  todasLasVisualizaciones = [], 
  onClose, 
  onActualizado, 
  onSeleccionarObra 
}) {
  const [obraActual, setObraActual] = useState(item);
  useEffect(() => {
    setObraActual(item);
  }, [item]);

  const visualizacionId = item.visualizacion_id || item.id;
  const esSerie = item.tipo?.toLowerCase() === 'serie';
  const obraIdReal = item.obra_id;

  const [calificacion, setCalificacion] = useState(item.calificacion ? Number(item.calificacion) : 0);
  const [resenia, setResenia] = useState(item.resenia || '');
  const [plataforma, setPlataforma] = useState(item.plataforma || '');
  const [alcancePlataforma, setAlcancePlataforma] = useState('solo_este');
  const [amigosSeleccionados, setAmigosSeleccionados] = useState(
    item.amigos_covision ? item.amigos_covision.map((a) => a.amigo_id) : []
  );
  const [vistoConTexto, setVistoConTexto] = useState(item.visto_con_texto || '');
  const [fechaVisto, setFechaVisto] = useState(item.fecha_visto ? item.fecha_visto.split('T')[0] : '');
  const [guardando, setGuardando] = useState(false);
  const [detalle, setDetalle] = useState(null);
  const [actores, setActores] = useState([]);
  const [sinopsisTexto, setSinopsisTexto] = useState(item.sinopsis || '');
  const [cargandoActores, setCargandoActores] = useState(false);
  const [actorSeleccionado, setActorSeleccionado] = useState(null);
  const [modalCalificarSerieAbierto, setModalCalificarSerieAbierto] = useState(false);

  // Sección desplegable activa (estilo pills compactos como ModalRegistrar)
  const [seccionExpandida, setSeccionExpandida] = useState(null);
  const dateInputRef = useRef(null);

  const abrirSelectorFecha = (e) => {
    if (e) e.stopPropagation();
    setSeccionExpandida((prev) => (prev === 'fecha' ? null : 'fecha'));
    setTimeout(() => {
      if (dateInputRef.current) {
        if (typeof dateInputRef.current.showPicker === 'function') {
          try {
            dateInputRef.current.showPicker();
          } catch {
            dateInputRef.current.focus();
          }
        } else {
          dateInputRef.current.focus();
        }
      }
    }, 100);
  };

  const formatearFecha = (fechaStr) => {
    return formatearFechaLarga(fechaStr);
  };

  useEffect(() => {
    let cancelado = false;
    setDetalle(null);
    setActores([]);
    setSinopsisTexto(obraActual.sinopsis || '');
    setCalificacion(obraActual.calificacion ? Number(obraActual.calificacion) : 0);
    setResenia(obraActual.resenia || '');
    setPlataforma(obraActual.plataforma || '');
    setFechaVisto(obraActual.fecha_visto ? obraActual.fecha_visto.split('T')[0] : '');

    const idParaTMDb = obraActual.tmdb_id || 
                       obraActual.obra_tmdb_id || 
                       obraActual.id_tmdb || 
                       (obraActual.tipo?.toLowerCase() === 'pelicula' && !obraActual.temporada ? obraActual.tmdb_id || obraActual.obra_id : null) ||
                       obraActual.id;

    if (!idParaTMDb) return;

    const cargar = async () => {
      setCargandoActores(true);
      try {
        if (esSerie) {
          if (obraActual.temporada && obraActual.episodio) {
            const dataEp = await obtenerDetalleEpisodioAPI(idParaTMDb, obraActual.temporada, obraActual.episodio);
            if (!cancelado && dataEp) {
              setDetalle(dataEp);
              if (dataEp.sinopsis) setSinopsisTexto(dataEp.sinopsis);
              if (dataEp.actores) setActores(dataEp.actores);
            }
          }
        } else {
          let dataPeli = null;
          try {
            dataPeli = await obtenerDetallePeliculaAPI('movie', idParaTMDb);
          } catch {
            dataPeli = await obtenerDetallePeliculaAPI('pelicula', idParaTMDb);
          }

          if (!cancelado && dataPeli) {
            setDetalle(dataPeli);
            if (dataPeli.overview || dataPeli.sinopsis) {
              setSinopsisTexto(dataPeli.overview || dataPeli.sinopsis);
            }

            const castCrudo = dataPeli.actores || 
                              dataPeli.reparto || 
                              dataPeli.cast || 
                              dataPeli.credits?.cast || 
                              [];

            const normalizados = castCrudo.slice(0, 16).map((a) => ({
              id: a.id || a.actor_id,
              nombre: a.nombre || a.name,
              personaje: a.personaje || a.character,
              foto: a.foto 
                ? (a.foto.startsWith('http') ? a.foto : `https://image.tmdb.org/t/p/w185${a.foto}`)
                : (a.profile_path ? `https://image.tmdb.org/t/p/w185${a.profile_path}` : null)
            }));

            setActores(normalizados);
          }
        }
      } catch (err) {
        console.warn('Error cargando actores o detalle:', err);
      } finally {
        if (!cancelado) setCargandoActores(false);
      }
    };

    cargar();
    return () => { cancelado = true; };
  }, [obraActual, esSerie]);

  const handleGuardar = async () => {
    if (!visualizacionId) return;
    setGuardando(true);
    try {
      await guardarReseniaAPI(visualizacionId, {
        calificacion: calificacion > 0 ? Number(calificacion) : null,
        resenia: resenia.trim() || null,
        plataforma: plataforma || null,
        amigos_etiquetados: amigosSeleccionados,
        visto_con_texto: vistoConTexto.trim() || null,
        fecha_visto: fechaVisto || null,
      });

      if (esSerie && obraIdReal && plataforma && plataforma !== 'Sin plataforma' && alcancePlataforma !== 'solo_este') {
        try {
          await actualizarPlataformaSerieAPI({
            obra_id: obraIdReal,
            plataforma: plataforma,
            solo_vacios: alcancePlataforma === 'solo_sin_plataforma',
          });
        } catch (errPlat) {
          console.warn('Error al actualizar masivamente:', errPlat.message);
        }
      }

      if (onActualizado) onActualizado();
      onClose();
    } catch (err) {
      console.error('Error al guardar los cambios:', err.message);
    } finally {
      setGuardando(false);
    }
  };

  const bannerImg = detalle?.still_path 
    ? `https://image.tmdb.org/t/p/w780${detalle.still_path}`
    : detalle?.backdrop_path 
    ? `https://image.tmdb.org/t/p/w780${detalle.backdrop_path}`
    : (item.foto_episodio || item.obra_poster || item.poster_path);

  const totalAcompanantes = amigosSeleccionados.length + (vistoConTexto?.trim() ? 1 : 0);

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 overflow-y-auto">
        <div className="bg-[#fcfaf7] dark:bg-[#141418] border border-neutral-300 dark:border-white/10 rounded-3xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-neutral-900 dark:text-white my-auto animate-fadeIn">
          
          {/* Cabecera / Banner Cinemático */}
          <div className="relative w-full h-44 sm:h-52 bg-neutral-900 flex-shrink-0">
            {bannerImg ? (
              <img src={bannerImg} alt={item.titulo} className="w-full h-full object-cover opacity-85" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-neutral-500 font-bold">
                {item.titulo}
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-[#fcfaf7] dark:from-[#141418] via-black/40 to-black/25 flex justify-between items-start p-4 sm:p-5">
              <span className="bg-rose-600 text-white font-black text-[11px] px-2.5 py-1 rounded-lg uppercase tracking-wider shadow">
                {item.tipo} {item.temporada ? `· T${item.temporada} E${item.episodio}` : ''}
              </span>
              <button 
                type="button" 
                onClick={onClose} 
                className="w-8 h-8 rounded-full bg-black/60 hover:bg-rose-600 text-white flex items-center justify-center transition cursor-pointer"
                title="Cerrar"
              >
                ✕
              </button>
            </div>
            <div className="absolute bottom-3 left-4 right-4 sm:left-6 sm:right-6">
              <h2 className="text-xl sm:text-2xl font-black text-neutral-900 dark:text-white drop-shadow-md truncate">
                {item.titulo}
              </h2>
              <div className="flex items-center gap-2 text-xs font-bold text-neutral-700 dark:text-neutral-300 mt-0.5 truncate">
                {detalle?.nombre && (
                  <>
                    <span className="text-rose-600 dark:text-rose-400 truncate">Cap. {item.episodio}: {detalle.nombre}</span>
                    <span>·</span>
                  </>
                )}
                {item.fecha_visto && (
                  <button
                    type="button"
                    onClick={abrirSelectorFecha}
                    className="text-[11px] text-neutral-600 dark:text-neutral-400 hover:text-rose-500 font-medium cursor-pointer transition flex items-center gap-1.5 group"
                    title="Toca para cambiar la fecha"
                  >
                    <Calendar className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                    <span>{formatearFecha(fechaVisto || item.fecha_visto)}</span>
                    <span className="text-[9px] font-bold text-rose-500 bg-rose-500/10 dark:bg-rose-500/20 px-1 rounded border border-rose-500/20 group-hover:underline">(cambiar)</span>
                  </button>
                )}
                {item.plataforma && (
                  <span className="px-1.5 py-0.5 rounded bg-neutral-200/90 dark:bg-white/10 text-[10px] font-mono font-bold text-neutral-700 dark:text-neutral-300">
                    {item.plataforma}
                  </span>
                )}
                {vistoConTexto?.trim() && (
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-500/10 border border-purple-500/20 text-[10px] font-black text-purple-600 dark:text-purple-300">
                    <span className="w-3.5 h-3.5 rounded-full overflow-hidden ring-1 ring-purple-400/40 inline-flex items-center justify-center">
                      <img
                        src={`https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(vistoConTexto.split(',')[0].trim())}&backgroundColor=b6e3f4`}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    </span>
                    <span>Visto con {vistoConTexto}</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Cuerpo Principal del Modal */}
          <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1 scrollbar-thin">
            
            {/* 1. SECCIÓN PRINCIPAL: PUNTUACIÓN Y RESEÑA (ACCESO DIRECTO SIN SCROLL) */}
            <div className="space-y-4">
              <CalificadorEstrellas 
                valor={calificacion} 
                onChange={setCalificacion} 
              />

              {esSerie && (
                <div className="flex items-center justify-between p-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs">
                  <span className="font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-amber-500 shrink-0" />
                    <span>¿Quieres calificar la temporada {item.temporada} o la serie completa?</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setModalCalificarSerieAbierto(true)}
                    className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-black transition cursor-pointer text-xs shrink-0 shadow-xs"
                  >
                    Calificar T{item.temporada} / Serie
                  </button>
                </div>
              )}


              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                    Tu opinión o reseña
                  </label>
                  {calificacion > 0 && (
                    <span className="text-xs font-black text-amber-500">
                      ★ {Number(calificacion).toFixed(1)} / 5.0
                    </span>
                  )}
                </div>
                <textarea
                  rows="3"
                  value={resenia}
                  onChange={(e) => setResenia(e.target.value)}
                  placeholder={esSerie ? "¿Qué te pareció este capítulo? Escribe tus notas..." : "¿Qué te pareció la película? Escribe tus notas..."}
                  className="w-full bg-white dark:bg-[#181820] border border-neutral-300 dark:border-white/10 rounded-2xl p-3.5 text-xs text-neutral-900 dark:text-neutral-100 focus:outline-none focus:border-rose-500 resize-none transition shadow-sm"
                />
              </div>
            </div>

            {/* 2. BARRA DE OPCIONES COMPACTAS (Paneles se abren hacia arriba sobre la opinión) */}
            <div className="pt-2 border-t border-neutral-200 dark:border-white/10 space-y-3">

              {/* PANEL DESPLEGABLE: CAMBIAR FECHA */}
              {seccionExpandida === 'fecha' && (
                <div className="space-y-3 p-4 rounded-2xl bg-neutral-100/90 dark:bg-[#1a1a24] border-2 border-rose-500/30 shadow-xl animate-fadeIn">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-rose-500" />
                      <label className="text-xs font-black text-neutral-800 dark:text-neutral-200 uppercase tracking-wider">
                        Fecha en que la viste
                      </label>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setFechaVisto(obtenerFechaHoyLocal())}
                        className={`text-xs font-bold px-3 py-1 rounded-xl transition cursor-pointer border ${
                          fechaVisto === obtenerFechaHoyLocal()
                            ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                            : 'bg-neutral-200/80 dark:bg-white/10 text-neutral-800 dark:text-neutral-200 border-transparent hover:bg-rose-600 hover:text-white'
                        }`}
                      >
                        Hoy
                      </button>
                      <button
                        type="button"
                        onClick={() => setFechaVisto(obtenerFechaAyerLocal())}
                        className={`text-xs font-bold px-3 py-1 rounded-xl transition cursor-pointer border ${
                          fechaVisto === obtenerFechaAyerLocal()
                            ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                            : 'bg-neutral-200/80 dark:bg-white/10 text-neutral-800 dark:text-neutral-200 border-transparent hover:bg-rose-600 hover:text-white'
                        }`}
                      >
                        Ayer
                      </button>
                    </div>
                  </div>

                  {/* Campo de fecha táctil de alto contraste y clickeable en cualquier parte */}
                  <div
                    onClick={() => {
                      if (dateInputRef.current) {
                        try {
                          dateInputRef.current.showPicker();
                        } catch {
                          dateInputRef.current.focus();
                        }
                      }
                    }}
                    className="relative flex items-center justify-between bg-white dark:bg-black/70 border-2 border-neutral-300 dark:border-white/20 hover:border-rose-500 dark:hover:border-rose-500 rounded-xl px-3.5 py-2.5 transition cursor-pointer shadow-inner group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Calendar className="w-5 h-5 text-rose-500 shrink-0 group-hover:scale-110 transition-transform" />
                      <span className="text-xs sm:text-sm font-black text-neutral-900 dark:text-white truncate">
                        {fechaVisto ? formatearFecha(fechaVisto) : 'Toca para abrir calendario'}
                      </span>
                    </div>

                    <span className="text-[10px] uppercase font-black text-rose-500 bg-rose-500/10 px-2 py-0.5 rounded-md border border-rose-500/20 shrink-0">
                      Cambiar 📅
                    </span>

                    <input
                      ref={dateInputRef}
                      type="date"
                      value={fechaVisto}
                      max={obtenerFechaHoyLocal()}
                      onChange={(e) => setFechaVisto(e.target.value)}
                      style={{ colorScheme: 'dark' }}
                      className="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-10"
                    />
                  </div>

                  {fechaVisto && fechaVisto !== (item.fecha_visto ? item.fecha_visto.split('T')[0] : '') && (
                    <p className="text-[11px] text-amber-600 dark:text-amber-400 font-bold flex items-center gap-1.5">
                      <span>⚡</span>
                      <span>Al guardar, se moverá automáticamente al <strong>{formatearFecha(fechaVisto)}</strong> en tu diario.</span>
                    </p>
                  )}
                </div>
              )}

              {/* PANEL DESPLEGABLE: PLATAFORMA */}
              {seccionExpandida === 'plataforma' && (
                <div className="space-y-3 p-4 rounded-2xl bg-neutral-100/70 dark:bg-white/5 border border-neutral-200 dark:border-white/10 animate-fadeIn">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-black text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                      Selecciona la plataforma
                    </label>
                    {plataforma && (
                      <button
                        type="button"
                        onClick={() => {
                          setPlataforma('');
                          setAlcancePlataforma('solo_este');
                        }}
                        className="text-[11px] font-bold text-neutral-500 hover:text-rose-500 cursor-pointer"
                      >
                        Quitar plataforma
                      </button>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {PLATAFORMAS_DISPONIBLES.map((plat) => {
                      const seleccionada = plataforma === plat;
                      return (
                        <button
                          key={plat}
                          type="button"
                          onClick={() => setPlataforma(plat)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer border ${
                            seleccionada
                              ? 'bg-rose-600 border-rose-600 text-white shadow-md scale-105'
                              : 'bg-white dark:bg-neutral-800 border-neutral-300 dark:border-white/10 text-neutral-700 dark:text-neutral-300 hover:border-rose-500/50'
                          }`}
                        >
                          {plat}
                        </button>
                      );
                    })}
                  </div>

                  {esSerie && plataforma && plataforma !== 'Sin plataforma' && (
                    <div className="pt-3 border-t border-neutral-200 dark:border-white/10 space-y-2">
                      <p className="text-[11px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                        ¿A qué episodios aplicar "{plataforma}"?
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <label onClick={() => setAlcancePlataforma('solo_este')} className={`flex items-center gap-2 p-2 rounded-xl border text-xs cursor-pointer ${alcancePlataforma === 'solo_este' ? 'bg-rose-500/10 border-rose-500 text-rose-500 font-black' : 'border-neutral-300 dark:border-white/10'}`}>
                          <input type="radio" checked={alcancePlataforma === 'solo_este'} onChange={() => {}} className="accent-rose-600" />
                          <span>Solo este capítulo</span>
                        </label>
                        <label onClick={() => setAlcancePlataforma('solo_sin_plataforma')} className={`flex items-center gap-2 p-2 rounded-xl border text-xs cursor-pointer ${alcancePlataforma === 'solo_sin_plataforma' ? 'bg-rose-500/10 border-rose-500 text-rose-500 font-black' : 'border-neutral-300 dark:border-white/10'}`}>
                          <input type="radio" checked={alcancePlataforma === 'solo_sin_plataforma'} onChange={() => {}} className="accent-rose-600" />
                          <span>Solo sin plataforma</span>
                        </label>
                        <label onClick={() => setAlcancePlataforma('toda_la_serie')} className={`flex items-center gap-2 p-2 rounded-xl border text-xs cursor-pointer ${alcancePlataforma === 'toda_la_serie' ? 'bg-amber-500/10 border-amber-500 text-amber-500 font-black' : 'border-neutral-300 dark:border-white/10'}`}>
                          <input type="radio" checked={alcancePlataforma === 'toda_la_serie'} onChange={() => {}} className="accent-amber-600" />
                          <span>Toda la serie</span>
                        </label>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* PANEL DESPLEGABLE: ACOMPAÑANTES */}
              {seccionExpandida === 'amigos' && (
                <div className="p-3.5 rounded-2xl bg-neutral-100/70 dark:bg-white/5 border border-neutral-200 dark:border-white/10 animate-fadeIn">
                  <SelectorAmigosEtiquetar
                    amigosSeleccionados={amigosSeleccionados}
                    setAmigosSeleccionados={setAmigosSeleccionados}
                    vistoConTexto={vistoConTexto}
                    setVistoConTexto={setVistoConTexto}
                  />
                </div>
              )}

              {/* PANEL DESPLEGABLE: REPARTO */}
              {seccionExpandida === 'reparto' && (
                <div className="p-4 rounded-2xl bg-neutral-100/70 dark:bg-white/5 border border-neutral-200 dark:border-white/10 space-y-3 animate-fadeIn">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase text-neutral-500 dark:text-neutral-400 flex items-center gap-1.5">
                      <Clapperboard className="w-3.5 h-3.5 text-rose-500" />
                      <span>{esSerie ? 'Elenco del capítulo' : 'Elenco Principal'} {actores.length > 0 ? `(${actores.length})` : ''}</span>
                    </span>
                  </div>

                  {cargandoActores ? (
                    <p className="text-xs text-neutral-400 italic py-3 text-center">Buscando reparto en TMDb...</p>
                  ) : actores.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-h-60 overflow-y-auto pr-1 scrollbar-thin">
                      {actores.map((actor, idx) => (
                        <div 
                          key={`${actor.id}-${idx}`}
                          onClick={() => setActorSeleccionado(actor)}
                          className="bg-white dark:bg-neutral-900 rounded-xl overflow-hidden border border-neutral-200 dark:border-white/10 shadow-sm flex flex-col cursor-pointer hover:scale-102 hover:border-rose-500 transition duration-200"
                        >
                          <div className="w-full aspect-[2/3] bg-neutral-800 overflow-hidden relative">
                            {actor.foto ? (
                              <img src={actor.foto} alt={actor.nombre} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex flex-col items-center justify-center text-neutral-500 text-xs">
                                <Users className="w-6 h-6 mb-1 text-neutral-600" />
                                <span className="text-[10px]">Sin foto</span>
                              </div>
                            )}
                          </div>
                          <div className="p-2 flex flex-col justify-between flex-1">
                            <p className="text-xs font-black truncate text-neutral-900 dark:text-white" title={actor.nombre}>
                              {actor.nombre}
                            </p>
                            <p className="text-[10px] text-rose-600 dark:text-rose-400 font-bold truncate mt-0.5" title={actor.personaje}>
                              {actor.personaje || 'Actor'}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-neutral-400 italic py-2">No se encontraron créditos registrados para esta obra.</p>
                  )}
                </div>
              )}

              {/* PANEL DESPLEGABLE: SINOPSIS */}
              {seccionExpandida === 'sinopsis' && sinopsisTexto && (
                <div className="p-4 rounded-2xl bg-neutral-100/70 dark:bg-white/5 border border-neutral-200 dark:border-white/10 space-y-1.5 animate-fadeIn">
                  <label className="text-xs font-black text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                    Sinopsis oficial
                  </label>
                  <p className="text-xs leading-relaxed text-neutral-700 dark:text-neutral-300">
                    {sinopsisTexto}
                  </p>
                </div>
              )}

              {/* BARRA DE MICRO-CHIPS (UBICADOS ABAJO DEL PANEL PARA QUE EL PANEL ABRA HACIA ARRIBA) */}
              <div className="flex items-center gap-2 flex-wrap pt-1">
                {/* Botón Fecha */}
                <button
                  type="button"
                  onClick={abrirSelectorFecha}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold border transition cursor-pointer ${
                    seccionExpandida === 'fecha'
                      ? 'bg-rose-600/15 border-rose-500 text-rose-500'
                      : fechaVisto && fechaVisto !== (item.fecha_visto ? item.fecha_visto.split('T')[0] : '')
                      ? 'bg-amber-50 dark:bg-amber-500/10 border-amber-300 dark:border-amber-500/30 text-amber-600 dark:text-amber-400'
                      : 'bg-neutral-100 dark:bg-white/5 border-neutral-300 dark:border-white/10 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                  }`}
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{fechaVisto ? formatearFecha(fechaVisto) : 'Fecha'}</span>
                  <ChevronDown className={`w-3 h-3 transition-transform ${seccionExpandida === 'fecha' ? 'rotate-180' : ''}`} />
                </button>

                {/* Botón Plataforma */}
                <button
                  type="button"
                  onClick={() => setSeccionExpandida(seccionExpandida === 'plataforma' ? null : 'plataforma')}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold border transition cursor-pointer ${
                    seccionExpandida === 'plataforma'
                      ? 'bg-rose-600/15 border-rose-500 text-rose-500'
                      : plataforma
                      ? 'bg-rose-50 dark:bg-rose-500/10 border-rose-300 dark:border-rose-500/30 text-rose-600 dark:text-rose-400'
                      : 'bg-neutral-100 dark:bg-white/5 border-neutral-300 dark:border-white/10 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                  }`}
                >
                  <Tv className="w-3.5 h-3.5" />
                  <span>{plataforma || 'Plataforma'}</span>
                  <ChevronDown className={`w-3 h-3 transition-transform ${seccionExpandida === 'plataforma' ? 'rotate-180' : ''}`} />
                </button>

                {/* Botón Acompañantes */}
                <button
                  type="button"
                  onClick={() => setSeccionExpandida(seccionExpandida === 'amigos' ? null : 'amigos')}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold border transition cursor-pointer ${
                    seccionExpandida === 'amigos'
                      ? 'bg-rose-600/15 border-rose-500 text-rose-500'
                      : totalAcompanantes > 0
                      ? 'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-300 dark:border-indigo-500/30 text-indigo-600 dark:text-indigo-400'
                      : 'bg-neutral-100 dark:bg-white/5 border-neutral-300 dark:border-white/10 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>
                    {totalAcompanantes > 0 
                      ? `Acompañantes (${totalAcompanantes})` 
                      : 'Acompañantes'}
                  </span>
                  <ChevronDown className={`w-3 h-3 transition-transform ${seccionExpandida === 'amigos' ? 'rotate-180' : ''}`} />
                </button>

                {/* Botón Reparto */}
                <button
                  type="button"
                  onClick={() => setSeccionExpandida(seccionExpandida === 'reparto' ? null : 'reparto')}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold border transition cursor-pointer ${
                    seccionExpandida === 'reparto'
                      ? 'bg-rose-600/15 border-rose-500 text-rose-500'
                      : 'bg-neutral-100 dark:bg-white/5 border-neutral-300 dark:border-white/10 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                  }`}
                >
                  <Clapperboard className="w-3.5 h-3.5" />
                  <span>Reparto {actores.length > 0 ? `(${actores.length})` : ''}</span>
                  <ChevronDown className={`w-3 h-3 transition-transform ${seccionExpandida === 'reparto' ? 'rotate-180' : ''}`} />
                </button>

                {/* Botón Sinopsis */}
                {sinopsisTexto && (
                  <button
                    type="button"
                    onClick={() => setSeccionExpandida(seccionExpandida === 'sinopsis' ? null : 'sinopsis')}
                    className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold border transition cursor-pointer ${
                      seccionExpandida === 'sinopsis'
                        ? 'bg-rose-600/15 border-rose-500 text-rose-500'
                        : 'bg-neutral-100 dark:bg-white/5 border-neutral-300 dark:border-white/10 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                    }`}
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>Sinopsis</span>
                    <ChevronDown className={`w-3 h-3 transition-transform ${seccionExpandida === 'sinopsis' ? 'rotate-180' : ''}`} />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Footer del Modal */}
          <div className="p-4 border-t border-neutral-200 dark:border-white/10 flex justify-end gap-3 bg-neutral-50 dark:bg-[#101014] flex-shrink-0">
            <button 
              type="button" 
              onClick={onClose} 
              className="px-4 py-2 rounded-xl border border-neutral-300 dark:border-white/10 text-xs font-bold hover:bg-neutral-200 dark:hover:bg-white/5 transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={guardando}
              onClick={handleGuardar}
              className="px-6 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-xs font-bold text-white shadow-lg transition cursor-pointer disabled:opacity-50"
            >
              {guardando ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>

        </div>
      </div>

      {actorSeleccionado && (
        <ModalFilmografiaActor
          actor={actorSeleccionado}
          onClose={() => setActorSeleccionado(null)}
          onSeleccionarObra={(obraDelActor) => {
            setActorSeleccionado(null);
            if (onSeleccionarObra) {
              onSeleccionarObra(obraDelActor);
            }
          }}
        />
      )}

      {modalCalificarSerieAbierto && (
        <ModalCalificarSerie
          obra={obraActual}
          temporadaInicial={item.temporada}
          temporadasDisponibles={[item.temporada]}
          onClose={() => setModalCalificarSerieAbierto(false)}
          onActualizado={() => {
            if (onActualizado) onActualizado();
          }}
        />
      )}

    </>
  );
}
