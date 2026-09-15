import React, { useState, useEffect } from 'react';
import { 
  obtenerDetallePeliculaAPI,
  obtenerEpisodiosTemporadaAPI, 
  registrarVisualizacionAPI, 
  registrarLoteAPI,
  obtenerEpisodiosVistosAPI 
} from '../api';
import { obtenerFechaHoyLocal } from '../utils/fechas';
import SelectorPlataformaFecha from './modal/SelectorPlataformaFecha';
import ListaEpisodios from './modal/ListaEpisodios';

export default function ModalRegistrar({ obra, onClose, onRegistroCompletado }) {
  const esSerie = obra.tipo?.toLowerCase() === 'serie';
  // Extraer el ID de TMDb sin importar de dónde venga la obra
  const tmdbIdReal = obra.tmdb_id || obra.id || obra.obra_tmdb_id;

  const [temporadaSeleccionada, setTemporadaSeleccionada] = useState(1);
  const [totalTemporadas, setTotalTemporadas] = useState(1);
  const [datosTemporada, setDatosTemporada] = useState(null);
  const [cargandoEpisodios, setCargandoEpisodios] = useState(false);
  const [plataforma, setPlataforma] = useState('Netflix');
  
  const [fechaVisto, setFechaVisto] = useState(obtenerFechaHoyLocal());
  const [noRecuerdaFecha, setNoRecuerdaFecha] = useState(false);

  const [episodiosYaVistos, setEpisodiosYaVistos] = useState([]);
  const [episodiosSeleccionados, setEpisodiosSeleccionados] = useState([]);

  // 1. OBTENER TOTAL DE TEMPORADAS (Se ejecuta solo al abrir la obra)
  useEffect(() => {
    if (!esSerie || !tmdbIdReal) return;

    let cancelado = false;

    const cargarTotalTemporadas = async () => {
      try {
        const detalle = await obtenerDetallePeliculaAPI('serie', tmdbIdReal);
        if (!cancelado && detalle) {
          const cantidad = Number(detalle.total_temporadas) || 1;
          setTotalTemporadas(cantidad);
        }
      } catch (err) {
        console.error('Error al obtener temporadas de la serie:', err);
      }
    };

    cargarTotalTemporadas();

    return () => {
      cancelado = true;
    };
  }, [tmdbIdReal, esSerie]);

  // 2. OBTENER EPISODIOS DE LA TEMPORADA SELECCIONADA
  useEffect(() => {
    if (!esSerie || !tmdbIdReal) return;

    const cargarEpisodios = async () => {
      setCargandoEpisodios(true);
      setEpisodiosSeleccionados([]);

      try {
        const tmdbData = await obtenerEpisodiosTemporadaAPI(tmdbIdReal, temporadaSeleccionada);
        setDatosTemporada(tmdbData);
        // IMPORTANTE: No tocamos totalTemporadas acá para no pisar el valor
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

  const handleToggleNoRecuerda = () => {
    const nuevoEstado = !noRecuerdaFecha;
    setNoRecuerdaFecha(nuevoEstado);
    setFechaVisto(nuevoEstado ? (obra.anio ? `${obra.anio}-01-01` : '2020-01-01') : obtenerFechaHoyLocal());
  };

  const toggleSeleccionEpisodio = (num) => {
    setEpisodiosSeleccionados((prev) =>
      prev.includes(num) ? prev.filter((e) => e !== num) : [...prev, num]
    );
  };

  const handleSeleccionarPendientes = () => {
    if (!datosTemporada?.episodios) return;
    const faltantes = datosTemporada.episodios
      .map((ep) => ep.episodio_numero)
      .filter((num) => !episodiosYaVistos.includes(num));

    setEpisodiosSeleccionados(episodiosSeleccionados.length === faltantes.length ? [] : faltantes);
  };

  const handleGuardarSeleccionados = async () => {
    if (episodiosSeleccionados.length === 0) return;
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
        plataforma,
        temporada: temporadaSeleccionada,
        episodios: episodiosSeleccionados,
        fecha_visto: fechaVisto,
        fotos_episodios: fotosMapa,
      });
      onRegistroCompletado();
      onClose();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleGuardarPelicula = async () => {
    try {
      await registrarVisualizacionAPI({
        usuario_id: 1,
        tmdb_id: tmdbIdReal,
        tipo: 'pelicula',
        titulo: obra.titulo,
        poster_path: obra.poster_path,
        fecha_visto: fechaVisto,
        plataforma,
      });
      onRegistroCompletado();
      onClose();
    } catch (err) {
      alert(err.message);
    }
  };

  const totalEpisodios = datosTemporada?.episodios?.length || 0;
  const faltantesCount = totalEpisodios - episodiosYaVistos.length;
  
  // Generar botones de 1 hasta totalTemporadas
  const listaTemporadas = Array.from({ length: Math.max(1, totalTemporadas) }, (_, i) => i + 1);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-[#fcfaf7] dark:bg-[#141418] border border-neutral-300 dark:border-white/10 rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-neutral-900 dark:text-white my-auto transition-colors">
        
        {/* Cabecera */}
        <div className="p-6 border-b border-neutral-200 dark:border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img src={obra.poster_path} alt={obra.titulo} className="w-14 h-20 object-cover rounded-xl shadow-md border border-black/10 dark:border-white/10" />
            <div>
              <span className="text-xs font-bold text-rose-600 dark:text-rose-500 uppercase tracking-wider">{obra.tipo}</span>
              <h2 className="text-2xl font-black">{obra.titulo}</h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">{obra.anio}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-full bg-neutral-200 dark:bg-white/10 hover:bg-rose-600 hover:text-white flex items-center justify-center transition cursor-pointer">✕</button>
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

        {/* Contenido */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {!esSerie ? (
            <div className="text-center py-10 space-y-5">
              <p className="text-neutral-600 dark:text-neutral-300 max-w-xl mx-auto text-sm leading-relaxed">{obra.sinopsis}</p>
              <button onClick={handleGuardarPelicula} className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-8 py-3 rounded-xl shadow-lg transition cursor-pointer">
                ✓ Registrar Película en Mi Timeline
              </button>
            </div>
          ) : (
            <>
              <div className="flex flex-wrap items-center justify-between gap-4">
                {/* Botones de temporadas dinámicos */}
                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
                  {listaTemporadas.map((num) => (
                    <button
                      key={num}
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
                <div className="py-16 text-center text-neutral-400 text-sm animate-pulse">Cargando capítulos...</div>
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
              onClick={handleGuardarSeleccionados}
              className="bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-extrabold px-6 py-2.5 rounded-xl shadow-lg transition cursor-pointer text-sm"
            >
              ✓ Guardar seleccionados
            </button>
          </div>
        )}

      </div>
    </div>
  );
}