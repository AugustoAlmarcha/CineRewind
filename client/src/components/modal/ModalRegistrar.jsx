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
import SelectorPlataformaFecha from './SelectorPlataformaFecha';
import ListaEpisodios from './ListaEpisodios';
import GaleriaRepartoPrincipal from './GaleriaRepartoPrincipal';
import SelectorTemporadaBarra from './SelectorTemporadaBarra';
import VistaRegistroPelicula from './VistaRegistroPelicula';
import ModalFilmografiaActor from './ModalFilmografiaActor';
import ModalActoresEpisodio from './ModalActoresEpisodio';

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
  
  const [plataforma, setPlataforma] = useState(null);
  const [fechaVisto, setFechaVisto] = useState(obtenerFechaHoyLocal());
  const [noRecuerdaFecha, setNoRecuerdaFecha] = useState(false);

  const [episodiosYaVistos, setEpisodiosYaVistos] = useState([]);
  const [episodiosSeleccionados, setEpisodiosSeleccionados] = useState([]);

  const [errorRegistro, setErrorRegistro] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [esPendiente, setEsPendiente] = useState(false);
  const [cargandoPendiente, setCargandoPendiente] = useState(false);

  // Comprobar si la obra ya está guardada en la lista de pendientes
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

  // Manejar el clic del botón Guardar/Quitar de pendientes
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
  const [mostrarActores, setMostrarActores] = useState(false);
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
      console.error('Error cargando actores del episodio:', err);
      alert('No se pudo cargar el reparto de este capítulo.');
    }
  };

  // 1. Obtener detalles de la obra y proveedores
  useEffect(() => {
    if (!tmdbIdReal || isNaN(tmdbIdReal) || tmdbIdReal <= 0) return;
    let cancelado = false;

    const cargarFichaYProveedores = async () => {
      try {
        const tipoConsulta = esSerie ? 'serie' : 'pelicula';
        
        const detalle = await obtenerDetallePeliculaAPI(tipoConsulta, tmdbIdReal);
        if (!cancelado && detalle) {
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
          if (dataProv?.ultima_plataforma) {
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

  // 2. Obtener episodios de la temporada y capítulos vistos
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

        // Solo busca en el backend si el usuario está autenticado y con un ID numérico real
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
  total_episodios_temporada: datosTemporada?.episodios?.length || null, // <-- AQUÍ
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
              src={obraActual?.poster_path} 
              alt={obraActual?.titulo} 
              className="w-14 h-20 object-cover rounded-xl shadow-md border border-black/10 dark:border-white/10" 
            />
            <div>
              <span className="text-xs font-bold text-rose-600 dark:text-rose-500 uppercase tracking-wider">{obraActual?.tipo}</span>
              <h2 className="text-2xl font-black">{obraActual?.titulo}</h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">{obraActual?.anio}</p>
            </div>
          </div>
<div className="flex items-center gap-3">
            {/* Botón Guardar en Pendientes */}
            <button
              type="button"
              disabled={cargandoPendiente}
              onClick={handleTogglePendiente}
              className={`px-3.5 py-1.5 rounded-full text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95 disabled:opacity-50 ${
                esPendiente
                  ? 'bg-rose-600 text-white hover:bg-rose-700 shadow-rose-600/30'
                  : 'bg-neutral-200 dark:bg-white/10 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-300 dark:hover:bg-white/20'
              }`}
              title={esPendiente ? 'Quitar de mi lista de pendientes' : 'Guardar para ver más tarde'}
            >
              <span>{esPendiente ? '✓' : '🔖'}</span>
              <span>{esPendiente ? 'En Pendientes' : 'Ver Más Tarde'}</span>
            </button>

            {/* Botón Cerrar */}
            <button 
              type="button" 
              onClick={onClose} 
              className="w-9 h-9 rounded-full bg-neutral-200 dark:bg-white/10 hover:bg-rose-600 hover:text-white flex items-center justify-center transition cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Selector Plataforma y Fecha */}
        <SelectorPlataformaFecha 
          plataforma={plataforma}
          setPlataforma={setPlataforma}
          fechaVisto={fechaVisto}
          setFechaVisto={setFechaVisto}
          noRecuerdaFecha={noRecuerdaFecha}
          onToggleNoRecuerda={handleToggleNoRecuerda}
        />

        {/* Galería de Actores */}
        <GaleriaRepartoPrincipal 
          reparto={repartoActores}
          mostrar={mostrarActores}
          onToggleMostrar={() => setMostrarActores(!mostrarActores)}
          onSeleccionarActor={(actor) => setActorParaFilmografia(actor)}
        />

        {/* Alerta de Error */}
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
            <VistaRegistroPelicula 
              sinopsis={obraActual?.sinopsis}
              guardando={guardando}
              onGuardar={handleGuardarPelicula}
            />
          ) : (
            <>
              <SelectorTemporadaBarra 
                listaTemporadas={listaTemporadas}
                temporadaSeleccionada={temporadaSeleccionada}
                onCambiarTemporada={(num) => setTemporadaSeleccionada(num)}
                faltantesCount={faltantesCount}
                onMarcarRestantes={handleMarcarRestantes}
              />

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
                  onVerActoresCapitulo={handleVerActoresCapitulo}
                />
              )}
            </>
          )}
        </div>

        {/* Barra Flotante Inferior para Series */}
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

        {/* Submodal: Filmografía del Actor */}
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

        {/* Submodal: Reparto del Capítulo */}
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