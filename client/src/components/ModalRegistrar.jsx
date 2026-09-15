import React, { useState, useEffect } from 'react';
import { 
  obtenerDetallePeliculaAPI,
  obtenerEpisodiosTemporadaAPI, 
  registrarVisualizacionAPI, 
  registrarLoteAPI,
  obtenerEpisodiosVistosAPI,
  obtenerProveedoresAPI
} from '../api';
import { obtenerFechaHoyLocal } from '../utils/fechas';
import SelectorPlataformaFecha from './modal/SelectorPlataformaFecha';
import ListaEpisodios from './modal/ListaEpisodios';
import ModalFilmografiaActor from './ModalFilmografiaActor';

export default function ModalRegistrar({ obra, onClose, onRegistroCompletado, onCambiarObra }) {
  const esSerie = obra.tipo?.toLowerCase() === 'serie';
  const tmdbIdReal = obra.tmdb_id || obra.id || obra.obra_tmdb_id;

  const [temporadaSeleccionada, setTemporadaSeleccionada] = useState(1);
  const [totalTemporadas, setTotalTemporadas] = useState(1);
  const [datosTemporada, setDatosTemporada] = useState(null);
  const [cargandoEpisodios, setCargandoEpisodios] = useState(false);
  
  // Inicia sin plataforma predeterminada
  const [plataforma, setPlataforma] = useState(null);
  
  const [fechaVisto, setFechaVisto] = useState(obtenerFechaHoyLocal());
  const [noRecuerdaFecha, setNoRecuerdaFecha] = useState(false);

  const [episodiosYaVistos, setEpisodiosYaVistos] = useState([]);
  const [episodiosSeleccionados, setEpisodiosSeleccionados] = useState([]);

  // Estados para UI, control de errores y actores
  const [errorRegistro, setErrorRegistro] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [repartoActores, setRepartoActores] = useState([]);
  const [mostrarActores, setMostrarActores] = useState(false);
  const [actorParaFilmografia, setActorParaFilmografia] = useState(null);

  // 1. Obtener detalles de la obra (total de temporadas y reparto de actores)
  useEffect(() => {
    if (!tmdbIdReal) return;

    let cancelado = false;

    const cargarDetallesYCreditos = async () => {
      try {
        const tipoConsulta = esSerie ? 'serie' : 'pelicula';
        const detalle = await obtenerDetallePeliculaAPI(tipoConsulta, tmdbIdReal);
        
        if (!cancelado && detalle) {
          if (esSerie) {
            const cantidad = Number(detalle.total_temporadas) || 1;
            setTotalTemporadas(cantidad);
          }
          if (Array.isArray(detalle.reparto)) {
            setRepartoActores(detalle.reparto);
          }
        }
      } catch (err) {
        console.error('Error al obtener ficha de la obra:', err);
      }
    };

    cargarDetallesYCreditos();

    return () => {
      cancelado = true;
    };
  }, [tmdbIdReal, esSerie]);

  // 2. Obtener episodios de la temporada seleccionada
  useEffect(() => {
    if (!esSerie || !tmdbIdReal) return;

    const cargarEpisodios = async () => {
      setCargandoEpisodios(true);
      setEpisodiosSeleccionados([]);
      setErrorRegistro(null);

      try {
        const tmdbData = await obtenerEpisodiosTemporadaAPI(tmdbIdReal, temporadaSeleccionada);
        setDatosTemporada(tmdbData);
      } catch (err) {
        console.error('Error al cargar episodios:', err);
      } finally {
        setCargandoEpisodios(false);
      }

      try {
        const vistosData = await obtenerEpisodiosVistosAPI(1, tmdbIdReal, temporadaSeleccionada);
        setEpisodiosYaVistos(Array.isArray(vistosData) ? vistosData : []);
      } catch {
        setEpisodiosYaVistos([]);
      }
    };

    cargarEpisodios();
  }, [tmdbIdReal, temporadaSeleccionada, esSerie]);

  // Autodetección de plataforma de streaming
  useEffect(() => {
    if (!tmdbIdReal) return;
    let cancelado = false;

    const detectarPlataforma = async () => {
      const tipoObra = esSerie ? 'serie' : 'pelicula';
      const proveedores = await obtenerProveedoresAPI(tipoObra, tmdbIdReal);

      if (!cancelado && Array.isArray(proveedores)) {
        if (proveedores.length === 1) {
          setPlataforma(proveedores[0]);
        }
      }
    };

    detectarPlataforma();

    return () => {
      cancelado = true;
    };
  }, [tmdbIdReal, esSerie]);

  const handleToggleNoRecuerda = () => {
    const nuevoEstado = !noRecuerdaFecha;
    setNoRecuerdaFecha(nuevoEstado);
    setFechaVisto(nuevoEstado ? (obra.anio ? `${obra.anio}-01-01` : '2020-01-01') : obtenerFechaHoyLocal());
  };

  const toggleSeleccionEpisodio = (num) => {
    setErrorRegistro(null);
    setEpisodiosSeleccionados((prev) =>
      prev.includes(num) ? prev.filter((e) => e !== num) : [...prev, num]
    );
  };

  const handleSeleccionarPendientes = () => {
    if (!datosTemporada?.episodios) return;
    setErrorRegistro(null);
    const faltantes = datosTemporada.episodios
      .map((ep) => ep.episodio_numero)
      .filter((num) => !episodiosYaVistos.includes(num));

    setEpisodiosSeleccionados(episodiosSeleccionados.length === faltantes.length ? [] : faltantes);
  };

  const handleGuardarSeleccionados = async () => {
    if (episodiosSeleccionados.length === 0) return;
    setGuardando(true);
    setErrorRegistro(null);

    try {
      const fotosMapa = {};
      datosTemporada?.episodios?.forEach((ep) => {
        if (episodiosSeleccionados.includes(ep.episodio_numero)) {
          fotosMapa[ep.episodio_numero] = ep.still_path;
        }
      });

      await registrarLoteAPI({
        usuario_id: 1,
        tmdb_id: tmdbIdReal,
        titulo: obra.titulo,
        poster_path: datosTemporada?.poster_temporada || obra.poster_path,
        plataforma: plataforma || null,
        temporada: temporadaSeleccionada,
        episodios: episodiosSeleccionados,
        fecha_visto: fechaVisto,
        fotos_episodios: fotosMapa,
      });

      onRegistroCompletado();
      onClose();
    } catch (err) {
      setErrorRegistro(err.message || 'Error al guardar los capítulos.');
    } finally {
      setGuardando(false);
    }
  };

  const handleGuardarPelicula = async () => {
    setGuardando(true);
    setErrorRegistro(null);

    try {
    await registrarVisualizacionAPI({
            usuario_id: 1,
            tmdb_id: tmdbIdReal,
            tipo: 'pelicula',
            titulo: obra.titulo,
            poster_path: obra.poster_path,
            fecha_visto: fechaVisto,
            plataforma: plataforma || null,
          });

      onRegistroCompletado();
      onClose();
    } catch (err) {
      setErrorRegistro(err.message || 'Error al registrar la película.');
    } finally {
      setGuardando(false);
    }
  };

  const totalEpisodios = datosTemporada?.episodios?.length || 0;
  const faltantesCount = totalEpisodios - episodiosYaVistos.length;
  const listaTemporadas = Array.from({ length: Math.max(1, totalTemporadas) }, (_, i) => i + 1);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-[#fcfaf7] dark:bg-[#141418] border border-neutral-300 dark:border-white/10 rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-neutral-900 dark:text-white my-auto transition-colors">
        
        {/* Cabecera */}
        <div className="p-6 border-b border-neutral-200 dark:border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img 
              src={obra.poster_path} 
              alt={obra.titulo} 
              className="w-14 h-20 object-cover rounded-xl shadow-md border border-black/10 dark:border-white/10" 
            />
            <div>
              <span className="text-xs font-bold text-rose-600 dark:text-rose-500 uppercase tracking-wider">{obra.tipo}</span>
              <h2 className="text-2xl font-black">{obra.titulo}</h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">{obra.anio}</p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose} 
            className="w-9 h-9 rounded-full bg-neutral-200 dark:bg-white/10 hover:bg-rose-600 hover:text-white flex items-center justify-center transition cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Plataforma y Fecha */}
        <SelectorPlataformaFecha 
          plataforma={plataforma}
          setPlataforma={setPlataforma}
          fechaVisto={fechaVisto}
          setFechaVisto={setFechaVisto}
          noRecuerdaFecha={noRecuerdaFecha}
          onToggleNoRecuerda={handleToggleNoRecuerda}
        />

        {/* Botón para alternar reparto de actores */}
        {repartoActores.length > 0 && (
          <div className="px-6 pt-3 pb-1">
            <button
              type="button"
              onClick={() => setMostrarActores(!mostrarActores)}
              className="text-xs font-bold px-3 py-1.5 rounded-xl border border-neutral-300 dark:border-white/10 bg-neutral-100 dark:bg-white/5 hover:bg-rose-600 hover:text-white dark:hover:bg-rose-600 transition flex items-center gap-1.5 cursor-pointer"
            >
              <span>🎭</span>
              <span>{mostrarActores ? 'Ocultar Reparto' : `Ver Reparto y Actores (${repartoActores.length})`}</span>
            </button>
          </div>
        )}

        {/* Galería desplegable de Actores y Actrices con Clic Interactivo */}
        {mostrarActores && repartoActores.length > 0 && (
          <div className="px-6 py-4 border-b border-neutral-200 dark:border-white/10 bg-neutral-50/50 dark:bg-black/20 animate-fadeIn">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-neutral-500">
                Elenco Principal
              </h4>
              <span className="text-[11px] text-neutral-400">
                Toca a un actor para ver sus películas
              </span>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 max-h-56 overflow-y-auto pr-1 scrollbar-thin">
              {repartoActores.map((actor) => (
                <div 
                  key={actor.id} 
                  onClick={() => setActorParaFilmografia(actor)}
                  className="bg-white dark:bg-neutral-900 rounded-xl overflow-hidden border border-neutral-200 dark:border-white/10 shadow-xs flex flex-col cursor-pointer hover:scale-105 hover:border-rose-500/50 transition-all duration-200 group"
                >
                  <div className="w-full aspect-[2/3] bg-neutral-800">
                    {actor.foto ? (
                      <img 
                        src={actor.foto} 
                        alt={actor.nombre} 
                        loading="lazy" 
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-lg">🎭</div>
                    )}
                  </div>
                  <div className="p-2">
                    <p className="text-[11px] font-black truncate text-neutral-900 dark:text-white group-hover:text-rose-600 transition-colors" title={actor.nombre}>
                      {actor.nombre}
                    </p>
                    <p className="text-[10px] text-neutral-500 truncate" title={actor.personaje}>
                      {actor.personaje || 'Personaje'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Alerta de Error integrada en la UI */}
        {errorRegistro && (
          <div className="mx-6 mt-4 p-3.5 bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-bold rounded-2xl flex items-center justify-between gap-3 animate-fadeIn">
            <span>⚠️ {errorRegistro}</span>
            <button 
              type="button" 
              onClick={() => setErrorRegistro(null)} 
              className="text-rose-500 hover:text-rose-700 font-black cursor-pointer px-1"
            >
              ✕
            </button>
          </div>
        )}

        {/* Contenido Principal */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {!esSerie ? (
            <div className="text-center py-10 space-y-5">
              <p className="text-neutral-600 dark:text-neutral-300 max-w-xl mx-auto text-sm leading-relaxed">
                {obra.sinopsis}
              </p>
              <button 
                type="button"
                disabled={guardando}
                onClick={handleGuardarPelicula} 
                className="bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-bold px-8 py-3 rounded-xl shadow-lg transition cursor-pointer disabled:opacity-50"
              >
                {guardando ? 'Guardando...' : '✓ Registrar Película en Mi Timeline'}
              </button>
            </div>
          ) : (
            <>
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
                  {listaTemporadas.map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setTemporadaSeleccionada(num)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex-shrink-0 ${
                        temporadaSeleccionada === num
                          ? 'bg-rose-600 text-white shadow-md'
                          : 'bg-neutral-200/80 dark:bg-[#1e1e24] text-neutral-600 dark:text-neutral-400'
                      }`}
                    >
                      Temporada {num}
                    </button>
                  ))}
                </div>

                {faltantesCount > 0 && (
                  <button
                    type="button"
                    onClick={handleSeleccionarPendientes}
                    className="px-4 py-2 rounded-xl text-xs font-extrabold bg-neutral-200 dark:bg-white/10 hover:bg-neutral-300 dark:hover:bg-white/20 transition cursor-pointer"
                  >
                    ✓ Marcar episodios restantes ({faltantesCount})
                  </button>
                )}
              </div>

              {cargandoEpisodios ? (
                <div className="py-16 text-center text-neutral-400 text-sm animate-pulse">
                  Cargando capítulos...
                </div>
              ) : (
                <ListaEpisodios 
                  episodios={datosTemporada?.episodios}
                  episodiosYaVistos={episodiosYaVistos}
                  episodiosSeleccionados={episodiosSeleccionados}
                  onToggleEpisodio={toggleSeleccionEpisodio}
                />
              )}
            </>
          )}
        </div>

        {/* Barra Flotante Inferior */}
        {esSerie && episodiosSeleccionados.length > 0 && (
          <div className="p-4 bg-neutral-100 dark:bg-[#18181e] border-t border-neutral-200 dark:border-white/10 flex items-center justify-between px-8">
            <span className="text-sm font-bold text-neutral-700 dark:text-neutral-300">
              {episodiosSeleccionados.length} {episodiosSeleccionados.length === 1 ? 'capítulo restante seleccionado' : 'capítulos restantes seleccionados'}
            </span>
            <button
              type="button"
              disabled={guardando}
              onClick={handleGuardarSeleccionados}
              className="bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-extrabold px-6 py-2.5 rounded-xl shadow-lg transition cursor-pointer text-sm disabled:opacity-50"
            >
              {guardando ? 'Guardando...' : '✓ Guardar seleccionados'}
            </button>
          </div>
        )}

        {/* Modal de Filmografía del Actor Superpuesto */}
        {actorParaFilmografia && (
          <ModalFilmografiaActor
            actor={actorParaFilmografia}
            onClose={() => setActorParaFilmografia(null)}
            onSeleccionarObra={(nuevaObra) => {
              setActorParaFilmografia(null);
              if (onCambiarObra) {
                onCambiarObra(nuevaObra);
              }
            }}
          />
        )}

      </div>
    </div>
  );
}