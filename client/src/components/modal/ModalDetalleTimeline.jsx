import React, { useState, useEffect, useMemo } from 'react';
import { 
  guardarReseniaAPI, 
  obtenerDetalleEpisodioAPI,
  obtenerDetallePeliculaAPI,
  actualizarPlataformaSerieAPI 
} from '../../api';
import CalificadorEstrellas from '../common/CalificadorEstrellas';
import ModalFilmografiaActor from './ModalFilmografiaActor';

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
  const visualizacionId = item.visualizacion_id || item.id;
  const esSerie = item.tipo?.toLowerCase() === 'serie';
  const obraIdReal = item.obra_id;
  
  // Detección robusta del ID de TMDb
  const tmdbId = item.tmdb_id || item.obra_tmdb_id || (item.tipo?.toLowerCase() === 'pelicula' ? item.id : null);

  const [calificacion, setCalificacion] = useState(item.calificacion ? Number(item.calificacion) : 0);
  const [resenia, setResenia] = useState(item.resenia || '');
  const [plataforma, setPlataforma] = useState(item.plataforma || '');
  const [alcancePlataforma, setAlcancePlataforma] = useState('solo_este');

  const [guardando, setGuardando] = useState(false);
  const [detalle, setDetalle] = useState(null);
  const [actores, setActores] = useState([]);
  const [sinopsisTexto, setSinopsisTexto] = useState(item.sinopsis || '');
  const [cargandoActores, setCargandoActores] = useState(false);
  const [mostrarActores, setMostrarActores] = useState(false);
  const [mostrarHistorialCompleto, setMostrarHistorialCompleto] = useState(false);
  const [actorSeleccionado, setActorSeleccionado] = useState(null);

  const formatearFecha = (fechaStr) => {
    if (!fechaStr) return '';
    try {
      const f = new Date(fechaStr.includes('T') ? fechaStr : `${fechaStr}T00:00:00`);
      return f.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
    } catch {
      return fechaStr;
    }
  };

  // FILTRO INTELIGENTE DE FECHAS:
  // - En Series: Solo fechas en que viste ESTE capítulo exacto (temporada + episodio)
  // - En Películas: Todas las veces que viste esta película (rewatchs)
  const fechasVistas = useMemo(() => {
    if (!Array.isArray(todasLasVisualizaciones) || todasLasVisualizaciones.length === 0 || !obraIdReal) {
      return [{ fecha_visto: item.fecha_visto, plataforma: item.plataforma }];
    }

    if (esSerie) {
      // Filtrar únicamente el mismo capítulo
      const mismoCapitulo = todasLasVisualizaciones.filter((v) => 
        Number(v.obra_id) === Number(obraIdReal) &&
        Number(v.temporada) === Number(item.temporada) &&
        Number(v.episodio) === Number(item.episodio)
      );
      return mismoCapitulo.length > 0 ? mismoCapitulo : [{ fecha_visto: item.fecha_visto, plataforma: item.plataforma }];
    } else {
      // Es Película: todas las veces que se vio esa película
      const vecesVista = todasLasVisualizaciones
        .filter((v) => Number(v.obra_id) === Number(obraIdReal))
        .sort((a, b) => new Date(b.fecha_visto) - new Date(a.fecha_visto));
      return vecesVista.length > 0 ? vecesVista : [{ fecha_visto: item.fecha_visto, plataforma: item.plataforma }];
    }
  }, [todasLasVisualizaciones, obraIdReal, esSerie, item]);

// 2. CARGAR DETALLE Y ACTORES (TMDb)
  useEffect(() => {
    let cancelado = false;

    // Detectar el ID de TMDb sin importar cómo venga bautizado en el item
    const idParaTMDb = item.tmdb_id || 
                       item.obra_tmdb_id || 
                       item.id_tmdb || 
                       (item.tipo?.toLowerCase() === 'pelicula' && !item.temporada ? item.tmdb_id || item.obra_id : null);

    if (!idParaTMDb && !item.tmdb_id) return;

    const idFinal = item.tmdb_id || item.obra_tmdb_id || idParaTMDb;

    const cargar = async () => {
      setCargandoActores(true);
      try {
        if (esSerie) {
          if (item.temporada && item.episodio) {
            const dataEp = await obtenerDetalleEpisodioAPI(idFinal, item.temporada, item.episodio);
            if (!cancelado && dataEp) {
              setDetalle(dataEp);
              if (dataEp.sinopsis) setSinopsisTexto(dataEp.sinopsis);
              if (dataEp.actores) setActores(dataEp.actores);
            }
          }
        } else {
          // PELÍCULA: probamos primero con 'movie'
          let dataPeli = null;
          try {
            dataPeli = await obtenerDetallePeliculaAPI('movie', idFinal);
          } catch {
            // Si el backend espera 'pelicula' en español en la ruta
            dataPeli = await obtenerDetallePeliculaAPI('pelicula', idFinal);
          }

          if (!cancelado && dataPeli) {
            setDetalle(dataPeli);
            if (dataPeli.overview || dataPeli.sinopsis) {
              setSinopsisTexto(dataPeli.overview || dataPeli.sinopsis);
            }

            // Buscar el array de actores donde sea que venga
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
  }, [item, esSerie]);

  const handleGuardar = async () => {
    if (!visualizacionId) return;
    setGuardando(true);
    try {
      await guardarReseniaAPI(visualizacionId, {
        calificacion: calificacion > 0 ? Number(calificacion) : null,
        resenia: resenia.trim() || null,
        plataforma: plataforma || null,
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
      alert('Error al guardar los cambios: ' + err.message);
    } finally {
      setGuardando(false);
    }
  };

  const bannerImg = detalle?.still_path 
    ? `https://image.tmdb.org/t/p/w780${detalle.still_path}`
    : detalle?.backdrop_path 
    ? `https://image.tmdb.org/t/p/w780${detalle.backdrop_path}`
    : (item.foto_episodio || item.poster_path);

  // La fecha más reciente
  const ultimaFecha = fechasVistas[0] || { fecha_visto: item.fecha_visto, plataforma: item.plataforma };
  const tieneRewatch = !esSerie && fechasVistas.length > 1;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 overflow-y-auto">
        <div className="bg-[#fcfaf7] dark:bg-[#141418] border border-neutral-300 dark:border-white/10 rounded-3xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-neutral-900 dark:text-white my-auto animate-fadeIn">
          
          {/* Cabecera / Banner */}
          <div className="relative w-full h-52 bg-neutral-900 flex-shrink-0">
            {bannerImg ? (
              <img src={bannerImg} alt={item.titulo} className="w-full h-full object-cover opacity-85" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-neutral-500">Sin foto</div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-[#fcfaf7] dark:from-[#141418] via-black/30 to-transparent flex justify-between items-start p-5">
              <span className="bg-rose-600 text-white font-black text-xs px-2.5 py-1 rounded-lg uppercase tracking-wider shadow">
                {item.tipo} {item.temporada ? `· T${item.temporada} E${item.episodio}` : ''}
              </span>
              <button 
                type="button" 
                onClick={onClose} 
                className="w-8 h-8 rounded-full bg-black/60 hover:bg-rose-600 text-white flex items-center justify-center transition cursor-pointer"
              >
                ✕
              </button>
            </div>
            <div className="absolute bottom-3 left-6 right-6">
              <h2 className="text-2xl font-black text-neutral-900 dark:text-white drop-shadow-md truncate">{item.titulo}</h2>
              {detalle?.nombre && (
                <p className="text-sm font-bold text-rose-600 dark:text-rose-400 truncate">Capítulo {item.episodio}: {detalle.nombre}</p>
              )}
            </div>
          </div>

          {/* Cuerpo */}
          <div className="p-6 overflow-y-auto space-y-6 flex-1 scrollbar-thin">
            
            {/* SECCIÓN DE FECHAS (COMPACTA Y DESPLEGABLE) */}
            <div className="p-3.5 rounded-2xl bg-neutral-100/80 dark:bg-white/5 border border-neutral-200 dark:border-white/10 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm">📅</span>
                  <div>
                    <span className="block text-[10px] font-black uppercase tracking-wider text-neutral-400">
                      {esSerie ? 'Visto en tu Timeline' : (tieneRewatch ? `Visto ${fechasVistas.length} veces (Rewatch)` : 'Visto en tu Timeline')}
                    </span>
                    <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200">
                      {formatearFecha(ultimaFecha.fecha_visto)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {ultimaFecha.plataforma && (
                    <span className="px-2 py-0.5 rounded-md bg-neutral-200 dark:bg-white/10 text-[10px] font-mono font-bold text-neutral-600 dark:text-neutral-300">
                      {ultimaFecha.plataforma}
                    </span>
                  )}
                  {/* Botón desplegable si la película se vio más de 1 vez */}
                  {tieneRewatch && (
                    <button
                      type="button"
                      onClick={() => setMostrarHistorialCompleto(!mostrarHistorialCompleto)}
                      className="text-[11px] font-bold text-rose-600 dark:text-rose-400 hover:underline cursor-pointer ml-1"
                    >
                      {mostrarHistorialCompleto ? 'Ocultar fechas' : 'Ver todas'}
                    </button>
                  )}
                </div>
              </div>

              {/* Lista desplegable de rewatchs en películas */}
              {tieneRewatch && mostrarHistorialCompleto && (
                <div className="pt-2 border-t border-neutral-200/60 dark:divide-white/5 divide-y divide-neutral-200/40 dark:divide-white/5">
                  {fechasVistas.map((v, i) => (
                    <div key={i} className="flex items-center justify-between py-1.5 text-xs text-neutral-700 dark:text-neutral-300">
                      <span>• {formatearFecha(v.fecha_visto)}</span>
                      {v.plataforma && (
                        <span className="text-[10px] font-mono text-neutral-400">{v.plataforma}</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Selector de Plataforma */}
            <div className="space-y-3 border border-neutral-300 dark:border-white/10 rounded-2xl p-4 bg-neutral-100/60 dark:bg-white/5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                  Plataforma de visualización
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

              <div className="flex flex-wrap gap-2 pt-1">
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
                    <label onClick={() => setAlcancePlataforma('solo_este')} className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs cursor-pointer ${alcancePlataforma === 'solo_este' ? 'bg-rose-500/10 border-rose-500 text-rose-500 font-black' : 'border-neutral-300 dark:border-white/10'}`}>
                      <input type="radio" checked={alcancePlataforma === 'solo_este'} onChange={() => {}} className="accent-rose-600" />
                      <span>Solo este capítulo</span>
                    </label>
                    <label onClick={() => setAlcancePlataforma('solo_sin_plataforma')} className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs cursor-pointer ${alcancePlataforma === 'solo_sin_plataforma' ? 'bg-rose-500/10 border-rose-500 text-rose-500 font-black' : 'border-neutral-300 dark:border-white/10'}`}>
                      <input type="radio" checked={alcancePlataforma === 'solo_sin_plataforma'} onChange={() => {}} className="accent-rose-600" />
                      <span>Solo sin plataforma</span>
                    </label>
                    <label onClick={() => setAlcancePlataforma('toda_la_serie')} className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs cursor-pointer ${alcancePlataforma === 'toda_la_serie' ? 'bg-amber-500/10 border-amber-500 text-amber-500 font-black' : 'border-neutral-300 dark:border-white/10'}`}>
                      <input type="radio" checked={alcancePlataforma === 'toda_la_serie'} onChange={() => {}} className="accent-amber-600" />
                      <span>Toda la serie</span>
                    </label>
                  </div>
                </div>
              )}
            </div>

            {/* Sinopsis */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Sinopsis</label>
              <p className="text-xs leading-relaxed text-neutral-700 dark:text-neutral-300">
                {sinopsisTexto || 'Sin descripción disponible.'}
              </p>
            </div>

            {/* REPARTO DE ACTORES (BOTÓN SIEMPRE DISPONIBLE) */}
            <div className="border border-neutral-300 dark:border-white/10 rounded-2xl p-4 bg-neutral-100/60 dark:bg-white/5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold flex items-center gap-2">
                  <span>🎭</span> {esSerie ? 'Elenco del capítulo' : 'Elenco Principal'} {actores.length > 0 ? `(${actores.length})` : ''}
                </span>
                <button
                  type="button"
                  onClick={() => setMostrarActores(!mostrarActores)}
                  className="text-xs font-bold text-rose-600 dark:text-rose-400 hover:underline cursor-pointer"
                >
                  {mostrarActores ? 'Ocultar' : 'Ver actores'}
                </button>
              </div>

              {mostrarActores && (
                <div>
                  {cargandoActores ? (
                    <p className="text-xs text-neutral-400 italic py-3 text-center">Buscando actores en TMDb...</p>
                  ) : actores.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5 pt-2">
                      {actores.map((actor, idx) => (
                        <div 
                          key={`${actor.id}-${idx}`}
                          onClick={() => setActorSeleccionado(actor)}
                          className="bg-white dark:bg-neutral-900 rounded-xl overflow-hidden border border-neutral-200 dark:border-white/10 shadow-sm flex flex-col cursor-pointer hover:scale-105 hover:border-rose-500 transition duration-200"
                        >
                          <div className="w-full aspect-[2/3] bg-neutral-800 overflow-hidden relative">
                            {actor.foto ? (
                              <img src={actor.foto} alt={actor.nombre} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex flex-col items-center justify-center text-neutral-500 text-xs">
                                <span>🎭</span>
                                <span className="text-[10px]">Sin foto</span>
                              </div>
                            )}
                          </div>
                          <div className="p-2.5 flex flex-col justify-between flex-1">
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
            </div>

            {/* Calificación */}
            <CalificadorEstrellas 
              valor={calificacion} 
              onChange={setCalificacion} 
            />

            {/* Reseña */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Reseña o Diario Personal</label>
              <textarea
                rows="3"
                value={resenia}
                onChange={(e) => setResenia(e.target.value)}
                placeholder={esSerie ? "¿Qué te pareció este capítulo? Escribe tus notas..." : "¿Qué te pareció la película? Escribe tus notas..."}
                className="w-full bg-white dark:bg-[#1c1c22] border border-neutral-300 dark:border-white/10 rounded-2xl p-3 text-xs focus:outline-none focus:border-rose-500 resize-none"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-neutral-200 dark:border-white/10 flex justify-end gap-3 bg-neutral-50 dark:bg-[#101014]">
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
          onSeleccionarObra={(obra) => {
            setActorSeleccionado(null);
            onClose();
            if (onSeleccionarObra) onSeleccionarObra(obra);
          }}
        />
      )}
    </>
  );
}