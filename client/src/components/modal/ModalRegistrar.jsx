import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

import { 
  obtenerDetallePeliculaAPI,
  obtenerEpisodiosTemporadaAPI, 
  registrarVisualizacionAPI, 
  registrarLoteAPI,
  obtenerEpisodiosVistosAPI,
  obtenerDetalleEpisodioAPI,
  obtenerProveedoresAPI,
  actualizarPlataformaSerieAPI,
  obtenerPendientesAPI,   
  alternarPendienteAPI    
} from '../../api';
import { obtenerFechaHoyLocal } from '../../utils/fechas';
import BarraConfiguracionRegistro from './BarraConfiguracionRegistro';
import ListaEpisodios from './ListaEpisodios';
import SelectorTemporadaBarra from './SelectorTemporadaBarra';
import VistaRegistroPelicula from './VistaRegistroPelicula';
import ModalFilmografiaActor from './ModalFilmografiaActor';
import ModalActoresEpisodio from './ModalActoresEpisodio';
import { Bookmark, Check, X, AlertCircle, Play } from 'lucide-react';

export default function ModalRegistrar({ obra, onClose, onRegistroCompletado, onCambiarObra }) {
  const { usuario } = useAuth();

  const [obraActual, setObraActual] = useState(obra);

  useEffect(() => {
    setObraActual(obra);
  }, [obra]);

  const tipoNormalizado = obraActual?.tipo?.toLowerCase();
  const esSerie = tipoNormalizado === 'serie' || tipoNormalizado === 'tv';
  const tmdbIdReal = Number(obraActual?.tmdb_id || obraActual?.id || obraActual?.obra_tmdb_id);

  const [temporadaSeleccionada, setTemporadaSeleccionada] = useState(() => {
    const temp = Number(obraActual?.siguiente_temporada || obraActual?.temporada_actual || obraActual?.temporada);
    return !isNaN(temp) && temp > 0 ? temp : 1;
  });

  const [totalTemporadas, setTotalTemporadas] = useState(1);
  const [datosTemporada, setDatosTemporada] = useState(null);
  const [cargandoEpisodios, setCargandoEpisodios] = useState(false);
  
  const [plataforma, setPlataforma] = useState(() => obra?.plataforma || null);
  const [fechaVisto, setFechaVisto] = useState(obtenerFechaHoyLocal());
  const [noRecuerdaFecha, setNoRecuerdaFecha] = useState(false);

  const [episodiosYaVistos, setEpisodiosYaVistos] = useState([]);
  const [episodiosSeleccionados, setEpisodiosSeleccionados] = useState([]);

  const [amigosSeleccionados, setAmigosSeleccionados] = useState([]);
  const [vistoConTexto, setVistoConTexto] = useState('');
  const [errorRegistro, setErrorRegistro] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [esPendiente, setEsPendiente] = useState(false);
  const [cargandoPendiente, setCargandoPendiente] = useState(false);
  const [fichaDetalle, setFichaDetalle] = useState(null);
  const [calificacionDirecta, setCalificacionDirecta] = useState(0);

  // Comprobar estado en pendientes
  useEffect(() => {
    if (!usuario?.id || !tmdbIdReal) return;
    let cancelado = false;

    const verificarPendiente = async () => {
      try {
        const pendientes = await obtenerPendientesAPI();
        if (!cancelado && Array.isArray(pendientes)) {
          const existe = pendientes.some(
            (p) => Number(p.tmdb_id) === tmdbIdReal
          );
          setEsPendiente(existe);
        }
      } catch (err) {
        console.error('Error comprobando estado de pendiente:', err);
      }
    };

    verificarPendiente();
    return () => { cancelado = true; };
  }, [tmdbIdReal, usuario?.id]);

  const handleTogglePendiente = async () => {
    if (!usuario) {
      setErrorRegistro('Debes iniciar sesión para guardar títulos en tus pendientes.');
      return;
    }
    setCargandoPendiente(true);
    try {
      const res = await alternarPendienteAPI({
        tmdb_id: tmdbIdReal,
        tipo: esSerie ? 'serie' : 'pelicula',
        titulo: obraActual.titulo,
        poster_path: obraActual.poster_path || null,
      });
      setEsPendiente(Boolean(res?.guardado));
    } catch (err) {
      console.error('Error al alternar pendiente:', err);
      setErrorRegistro('No se pudo actualizar la lista de pendientes.');
    } finally {
      setCargandoPendiente(false);
    }
  };

  const [repartoActores, setRepartoActores] = useState([]);
  const [actorParaFilmografia, setActorParaFilmografia] = useState(null);
  const [actoresEpisodioModal, setActoresEpisodioModal] = useState(null);

  const handleVerActoresCapitulo = async (e, epNumero, epNombre) => {
    e.stopPropagation();
    try {
      const data = await obtenerDetalleEpisodioAPI(tmdbIdReal, temporadaSeleccionada, epNumero);
      setActoresEpisodioModal({
        episodioTitulo: `E${epNumero} · ${epNombre}`,
        actores: data.actores || []
      });
    } catch (err) {
      console.warn('No se pudo cargar el reparto de este capítulo:', err);
      setErrorRegistro('No se pudo cargar el reparto de este capítulo.');
    }
  };

  // Cargar ficha y plataformas de TMDb
  useEffect(() => {
    if (!tmdbIdReal || isNaN(tmdbIdReal) || tmdbIdReal <= 0) return;
    let cancelado = false;

    const cargarFichaYProveedores = async () => {
      try {
        const tipoConsulta = esSerie ? 'serie' : 'pelicula';
        
        const detalle = await obtenerDetallePeliculaAPI(tipoConsulta, tmdbIdReal);
        if (!cancelado && detalle) {
          setFichaDetalle(detalle);
          setObraActual((prev) => ({
            ...prev,
            ...detalle,
            titulo: prev?.titulo || detalle.titulo,
            sinopsis: detalle.sinopsis || prev?.sinopsis,
            poster_path: prev?.poster_path || detalle.poster_path,
          }));
          if (esSerie) {
            setTotalTemporadas(Number(detalle.total_temporadas) || 1);
          }
          if (Array.isArray(detalle.reparto)) {
            setRepartoActores(detalle.reparto);
          }
        }

        const dataProv = await obtenerProveedoresAPI(tipoConsulta, tmdbIdReal, usuario?.id || null);
        if (!cancelado && dataProv) {
          const lista = Array.isArray(dataProv) ? dataProv : (dataProv?.plataformas || []);
          if (obra?.plataforma) {
            setPlataforma(obra.plataforma);
          } else if (dataProv?.ultima_plataforma) {
            setPlataforma(dataProv.ultima_plataforma);
          } else if (lista.length === 1) {
            setPlataforma(lista[0]);
          }
        }
      } catch (err) {
        if (!cancelado) {
          console.error('Error cargando ficha de obra:', err);
        }
      }
    };

    cargarFichaYProveedores();
    return () => { cancelado = true; };
  }, [tmdbIdReal, esSerie, usuario?.id]);

  // Cargar episodios de la temporada seleccionada
  useEffect(() => {
    if (!esSerie || !tmdbIdReal || isNaN(tmdbIdReal) || tmdbIdReal <= 0 || !temporadaSeleccionada) return;

    let cancelado = false;

    const cargarDatosTemporada = async () => {
      setCargandoEpisodios(true);
      setEpisodiosSeleccionados([]);
      setErrorRegistro(null);

      try {
        const promesas = [
          obtenerEpisodiosTemporadaAPI(tmdbIdReal, temporadaSeleccionada)
        ];

        if (usuario?.id) {
          promesas.push(
            obtenerEpisodiosVistosAPI(usuario.id, tmdbIdReal, temporadaSeleccionada).catch(() => [])
          );
        }

        const [tmdbData, vistosData] = await Promise.all(promesas);

        if (!cancelado) {
          setDatosTemporada(tmdbData);
          setEpisodiosYaVistos(Array.isArray(vistosData) ? vistosData : []);
        }
      } catch (err) {
        if (!cancelado) {
          console.error('Error al cargar episodios de temporada:', err);
        }
      } finally {
        if (!cancelado) {
          setCargandoEpisodios(false);
        }
      }
    };

    cargarDatosTemporada();

    return () => {
      cancelado = true;
    };
  }, [tmdbIdReal, temporadaSeleccionada, esSerie, usuario?.id]);

  const handleToggleNoRecuerda = () => {
    const nuevoEstado = !noRecuerdaFecha;
    setNoRecuerdaFecha(nuevoEstado);
    setFechaVisto(nuevoEstado ? (obraActual?.anio ? `${obraActual.anio}-01-01` : '2020-01-01') : obtenerFechaHoyLocal());
  };

  const toggleSeleccionEpisodio = (num) => {
    setErrorRegistro(null);
    setEpisodiosSeleccionados((prev) =>
      prev.includes(num) ? prev.filter((e) => e !== num) : [...prev, num]
    );
  };

  const handleMarcarRestantes = () => {
    setErrorRegistro(null);
    if (!datosTemporada?.episodios) return;
    
    if (faltantesCount > 0) {
      const faltantes = datosTemporada.episodios
        .map((ep) => ep.episodio_numero)
        .filter((num) => !episodiosYaVistos.includes(num));
      setEpisodiosSeleccionados(episodiosSeleccionados.length === faltantes.length ? [] : faltantes);
    } else {
      const todos = datosTemporada.episodios.map((ep) => ep.episodio_numero);
      setEpisodiosSeleccionados(episodiosSeleccionados.length === todos.length ? [] : todos);
    }
  };

  const handleGuardarSeleccionados = async () => {
    if (!usuario) {
      setErrorRegistro('Debes iniciar sesión para registrar episodios en tu historial.');
      return;
    }
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
        usuario_id: usuario.id,
        tmdb_id: tmdbIdReal,
        titulo: obraActual.titulo,
        poster_path: datosTemporada?.poster_temporada || obraActual.poster_path,
        plataforma: plataforma || null,
        temporada: temporadaSeleccionada,
        episodios: episodiosSeleccionados,
        fecha_visto: fechaVisto,
        fotos_episodios: fotosMapa,
        total_episodios_temporada: datosTemporada?.episodios?.length || null,
        amigos_etiquetados: amigosSeleccionados,
        visto_con_texto: vistoConTexto.trim() || null,
      });

      if (plataforma && plataforma !== 'Sin plataforma') {
        try {
          const obraIdLocal = obraActual?.obra_id || obraActual?.id;
          if (obraIdLocal) {
            await actualizarPlataformaSerieAPI({
              obra_id: obraIdLocal,
              plataforma: plataforma,
              solo_vacios: true,
            });
          }
        } catch (e) {
          console.warn('No se pudieron actualizar los capítulos anteriores:', e);
        }
      }

      onClose();
      onRegistroCompletado();
    } catch (err) {
      setErrorRegistro(err.message || 'Error al guardar los capítulos.');
    } finally {
      setGuardando(false);
    }
  };

  const handleGuardarPelicula = async () => {
    if (!usuario) {
      setErrorRegistro('Debes iniciar sesión para registrar películas en tu historial.');
      return;
    }
    setGuardando(true);
    setErrorRegistro(null);

    try {
      await registrarVisualizacionAPI({
        usuario_id: usuario.id,
        tmdb_id: tmdbIdReal,
        tipo: 'pelicula',
        titulo: obraActual.titulo,
        poster_path: obraActual.poster_path,
        fecha_visto: fechaVisto,
        plataforma: plataforma || null,
        amigos_etiquetados: amigosSeleccionados, 
        visto_con_texto: vistoConTexto.trim() || null,
        calificacion: calificacionDirecta > 0 ? calificacionDirecta : null,
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
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center bg-black/80 backdrop-blur-md pt-1.5 sm:p-4 select-none animate-fadeIn">
      <div className={`bg-[#fcfaf7] dark:bg-[#141418] border-t sm:border border-neutral-300 dark:border-white/10 rounded-t-3xl sm:rounded-3xl max-w-3xl w-full flex flex-col shadow-2xl overflow-hidden text-neutral-900 dark:text-white transition-colors relative ${
        esSerie ? 'h-[94dvh] sm:h-[88vh]' : 'h-auto max-h-[98dvh] sm:max-h-[92vh]'
      }`}>
        
        {/* Cabecera compacta */}
        <div className="p-3 sm:p-4 border-b border-neutral-200 dark:border-white/10 flex items-center justify-between gap-3 bg-[#fcfaf7] dark:bg-[#141418] z-20 flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <img 
              src={obraActual?.poster_path} 
              alt={obraActual?.titulo} 
              className="w-9 h-13 sm:w-11 sm:h-16 object-cover rounded-xl shadow-md border border-black/10 dark:border-white/10 flex-shrink-0" 
            />
            <div className="min-w-0">
              <span className="text-[10px] font-black text-rose-600 dark:text-rose-500 uppercase tracking-widest block">
                {obraActual?.tipo}
              </span>
              <h2 className="text-sm sm:text-xl font-black truncate leading-tight">
                {obraActual?.titulo}
              </h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 font-mono">
                {obraActual?.anio}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Botón Trailer Oficial YouTube */}
            <a
              href={
                fichaDetalle?.trailer_youtube_key
                  ? `https://www.youtube.com/watch?v=${fichaDetalle.trailer_youtube_key}`
                  : `https://www.youtube.com/results?search_query=${encodeURIComponent(`${obraActual?.titulo} trailer oficial`)}`
              }
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 sm:px-3 sm:py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95 bg-red-600/10 hover:bg-red-600 text-red-600 hover:text-white border border-red-500/20"
              title="Ver trailer oficial en YouTube"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span className="hidden sm:inline">Trailer</span>
            </a>

            <button
              type="button"
              disabled={cargandoPendiente}
              onClick={handleTogglePendiente}
              className={`p-2 sm:px-3 sm:py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95 disabled:opacity-50 ${
                esPendiente
                  ? 'bg-rose-600 text-white hover:bg-rose-700'
                  : 'bg-neutral-200/80 dark:bg-white/10 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-300 dark:hover:bg-white/15'
              }`}
              title={esPendiente ? 'Quitar de pendientes' : 'Ver más tarde'}
            >
              {esPendiente ? <Check className="w-3.5 h-3.5" /> : <Bookmark className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{esPendiente ? 'En Pendientes' : 'Ver Más Tarde'}</span>
            </button>

            <button 
              type="button" 
              onClick={onClose} 
              className="w-8 h-8 rounded-xl bg-neutral-200/80 dark:bg-white/10 hover:bg-rose-600 hover:text-white flex items-center justify-center transition cursor-pointer text-neutral-600 dark:text-neutral-300"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Alerta de error estilizada en la interfaz (0 alerts de windows) */}
        {errorRegistro && (
          <div className="mx-4 mt-3 p-3 bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-bold rounded-2xl flex items-center justify-between gap-3 animate-fadeIn flex-shrink-0">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorRegistro}</span>
            </div>
            <button 
              type="button" 
              onClick={() => setErrorRegistro(null)} 
              className="text-rose-500 hover:text-rose-700 font-black cursor-pointer px-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Contenedor con los chips y vistas */}
        <div className={`overflow-y-auto ${
          esSerie 
            ? 'flex-1 p-3.5 sm:p-6 space-y-4' 
            : 'p-3 sm:p-5 space-y-2.5 sm:space-y-3.5'
        }`}>
          <BarraConfiguracionRegistro
            plataforma={plataforma}
            setPlataforma={setPlataforma}
            fechaVisto={fechaVisto}
            setFechaVisto={setFechaVisto}
            noRecuerdaFecha={noRecuerdaFecha}
            onToggleNoRecuerda={handleToggleNoRecuerda}
            amigosSeleccionados={amigosSeleccionados}
            setAmigosSeleccionados={setAmigosSeleccionados}
            vistoConTexto={vistoConTexto}
            setVistoConTexto={setVistoConTexto}
            repartoActores={esSerie ? repartoActores : []}
            onSeleccionarActor={(actor) => setActorParaFilmografia(actor)}
          />

          {!esSerie ? (
            <div className="pt-0.5">
              <VistaRegistroPelicula 
                obra={obraActual}
                detalle={fichaDetalle}
                sinopsis={fichaDetalle?.sinopsis || obraActual?.sinopsis}
                guardando={guardando}
                onGuardar={handleGuardarPelicula}
                calificacion={calificacionDirecta}
                setCalificacion={setCalificacionDirecta}
                onSeleccionarActor={(actor) => setActorParaFilmografia(actor)}
              />
            </div>
          ) : (
            <div className="space-y-4 pt-1">
              <SelectorTemporadaBarra 
                listaTemporadas={listaTemporadas}
                temporadaSeleccionada={temporadaSeleccionada}
                onCambiarTemporada={(num) => setTemporadaSeleccionada(num)}
                faltantesCount={faltantesCount}
                onMarcarRestantes={handleMarcarRestantes}
              />

              {cargandoEpisodios ? (
                <div className="py-12 text-center text-neutral-400 text-xs font-mono animate-pulse">
                  Cargando episodios de la temporada...
                </div>
              ) : (
                <ListaEpisodios 
                  episodios={datosTemporada?.episodios}
                  episodiosYaVistos={episodiosYaVistos}
                  episodiosSeleccionados={episodiosSeleccionados}
                  onToggleEpisodio={toggleSeleccionEpisodio}
                  onVerActoresCapitulo={handleVerActoresCapitulo}
                />
              )}
            </div>
          )}
        </div>

        {/* Barra inferior para guardar series */}
        {esSerie && episodiosSeleccionados.length > 0 && (
          <div className="p-3.5 sm:p-4 bg-[#fcfaf7] dark:bg-[#18181e] border-t border-neutral-300/80 dark:border-white/10 flex items-center justify-between gap-3 px-4 sm:px-6 flex-shrink-0 z-20">
            <span className="text-xs sm:text-sm font-bold text-neutral-700 dark:text-neutral-200">
              {episodiosSeleccionados.length} {episodiosSeleccionados.length === 1 ? 'capítulo seleccionado' : 'capítulos seleccionados'}
            </span>
            <button 
              type="button" 
              disabled={guardando} 
              onClick={handleGuardarSeleccionados} 
              className="bg-rose-600 hover:bg-rose-500 active:scale-95 text-white font-black px-4 sm:px-6 py-2.5 rounded-xl shadow-lg transition cursor-pointer text-xs sm:text-sm flex items-center gap-2 disabled:opacity-50"
            >
              {guardando ? (
                <span>Guardando...</span>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Guardar seleccionados</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Modales secundarios */}
        {actorParaFilmografia && (
          <ModalFilmografiaActor 
            actor={actorParaFilmografia} 
            onClose={() => setActorParaFilmografia(null)} 
            onSeleccionarObra={(nuevaObra) => {
              setActorParaFilmografia(null);
              setTemporadaSeleccionada(1);
              setObraActual(nuevaObra);
              if (onCambiarObra) onCambiarObra(nuevaObra);
            }} 
          />
        )}

        {actoresEpisodioModal && (
          <ModalActoresEpisodio 
            datos={actoresEpisodioModal} 
            onClose={() => setActoresEpisodioModal(null)} 
            onSeleccionarActor={(actor) => {
              setActoresEpisodioModal(null);
              setActorParaFilmografia(actor);
            }} 
          />
        )}

      </div>
    </div>
  );
}