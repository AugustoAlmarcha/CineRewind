import React, { useState, useEffect, useRef } from 'react';
import { 
  obtenerEpisodiosTemporadaAPI, 
  registrarVisualizacionAPI, 
  registrarLoteAPI,
  obtenerEpisodiosVistosAPI 
} from '../api';

const PLATAFORMAS = [
  { 
    id: 'Netflix', 
    nombre: 'Netflix', 
    logo: 'https://upload.wikimedia.org/wikipedia/commons/0/08/Netflix_2015_logo.svg' 
  },
  { 
    id: 'Max', 
    nombre: 'Max', 
    logo: 'https://upload.wikimedia.org/wikipedia/commons/c/ce/Max_logo.svg' 
  },
  { 
    id: 'Disney+', 
    nombre: 'Disney+', 
    logo: 'https://upload.wikimedia.org/wikipedia/commons/3/3e/Disney%2B_logo.svg' 
  },
  { 
    id: 'Prime Video', 
    nombre: 'Prime Video', 
    logo: 'https://upload.wikimedia.org/wikipedia/commons/1/11/Amazon_Prime_Video_logo.svg' 
  },
  { 
    id: 'Apple TV+', 
    nombre: 'Apple TV+', 
    logo: 'https://upload.wikimedia.org/wikipedia/commons/2/28/Apple_TV_Plus_Logo.svg' 
  },
  { 
    id: 'Cine', 
    nombre: 'Cine', 
    icono: (
      <span className="flex items-center gap-1.5 text-neutral-900 font-extrabold text-xs">
        <svg className="w-4 h-4 text-rose-600" fill="currentColor" viewBox="0 0 24 24">
          <path d="M18 3v2h-2V3H8v2H6V3H4v18h2v-2h2v2h8v-2h2v2h2V3h-2zM8 17H6v-2h2v2zm0-4H6v-2h2v2zm0-4H6V7h2v2zm10 8h-2v-2h2v2zm0-4h-2v-2h2v2zm0-4h-2V7h2v2z"/>
        </svg>
        CINE
      </span>
    )
  },
];
export default function ModalRegistrar({ obra, onClose, onRegistroCompletado }) {
  const esSerie = obra.tipo?.toLowerCase() === 'serie';
  const inputFechaRef = useRef(null);

  const [temporadaSeleccionada, setTemporadaSeleccionada] = useState(1);
  const [datosTemporada, setDatosTemporada] = useState(null);
  const [cargandoEpisodios, setCargandoEpisodios] = useState(false);
  const [plataforma, setPlataforma] = useState('Netflix');
  
  const [fechaVisto, setFechaVisto] = useState(new Date().toISOString().split('T')[0]);
  const [noRecuerdaFecha, setNoRecuerdaFecha] = useState(false);

  // Lista de episodios ya guardados en la BD
  const [episodiosYaVistos, setEpisodiosYaVistos] = useState([]);
  // Episodios que el usuario va a guardar en esta acción
  const [episodiosSeleccionados, setEpisodiosSeleccionados] = useState([]);

  // Cargar episodios de TMDb y episodios previamente vistos en BD
  useEffect(() => {
      if (!esSerie) return;

      const tmdbIdReal = obra.tmdb_id || obra.id;
      if (!tmdbIdReal) return;

      const cargar = async () => {
        setCargandoEpisodios(true);
        setEpisodiosSeleccionados([]);

        // 1. Cargar episodios de TMDb directamente
        try {
          const tmdbData = await obtenerEpisodiosTemporadaAPI(tmdbIdReal, temporadaSeleccionada);
          setDatosTemporada(tmdbData);
        } catch (err) {
          console.error('Error al cargar episodios de TMDb:', err);
        } finally {
          setCargandoEpisodios(false);
        }

        // 2. Cargar historial de vistos de forma independiente
        try {
          const vistosData = await obtenerEpisodiosVistosAPI(1, tmdbIdReal, temporadaSeleccionada);
          setEpisodiosYaVistos(Array.isArray(vistosData) ? vistosData : []);
        } catch (errVistos) {
          console.warn('Ruta de vistos aún no disponible o sin registros:', errVistos.message);
          setEpisodiosYaVistos([]);
        }
      };

    cargar();
  }, [obra, temporadaSeleccionada, esSerie]);

  const handleToggleNoRecuerda = () => {
    const nuevoEstado = !noRecuerdaFecha;
    setNoRecuerdaFecha(nuevoEstado);
    if (nuevoEstado) {
      setFechaVisto(obra.anio ? `${obra.anio}-01-01` : '2020-01-01');
    } else {
      setFechaVisto(new Date().toISOString().split('T')[0]);
    }
  };

  const toggleSeleccionEpisodio = (num) => {
    if (episodiosYaVistos.includes(num)) return; // No hace nada si ya está visto

    setEpisodiosSeleccionados((prev) =>
      prev.includes(num) ? prev.filter((e) => e !== num) : [...prev, num]
    );
  };

  // Solo selecciona los que no han sido vistos previamente
  const handleSeleccionarPendientes = () => {
    if (!datosTemporada?.episodios) return;

    const faltantes = datosTemporada.episodios
      .map((ep) => ep.episodio_numero)
      .filter((num) => !episodiosYaVistos.includes(num));

    if (episodiosSeleccionados.length === faltantes.length) {
      setEpisodiosSeleccionados([]);
    } else {
      setEpisodiosSeleccionados(faltantes);
    }
  };

  const handleGuardarSeleccionados = async () => {
    if (episodiosSeleccionados.length === 0) return;

    try {
      await registrarLoteAPI({
        usuario_id: 1,
        tmdb_id: obra.tmdb_id,
        titulo: obra.titulo,
        poster_path: datosTemporada?.poster_temporada || obra.poster_path,
        plataforma,
        temporada: temporadaSeleccionada,
        episodios: episodiosSeleccionados,
        fecha_visto: fechaVisto,
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
        tmdb_id: obra.tmdb_id,
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
            onClick={onClose} 
            className="w-9 h-9 rounded-full bg-neutral-200 dark:bg-white/10 hover:bg-rose-600 hover:text-white flex items-center justify-center transition cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Barra de Controles */}
        <div className="px-6 py-4 bg-neutral-100/80 dark:bg-white/5 flex flex-wrap gap-6 items-center justify-between border-b border-neutral-200 dark:border-white/5">
          
  {/* Selector de Plataformas con fondo blanco contrastado y opción Cine */}
  <div className="space-y-1.5">
    <label className="text-xs font-bold text-neutral-600 dark:text-neutral-400">¿Dónde la viste?</label>
    <div className="flex items-center gap-2.5 flex-wrap">
      {PLATAFORMAS.map((p) => {
        const estaSeleccionada = plataforma === p.id;
        return (
          <button
            key={p.id}
            type="button"
            onClick={() => setPlataforma(p.id)}
            title={p.nombre}
            className={`h-10 px-3.5 rounded-xl border flex items-center justify-center transition-all cursor-pointer bg-white shadow-sm ${
              estaSeleccionada
                ? 'ring-2 ring-rose-500 border-rose-500 scale-105 shadow-rose-500/20 shadow-md'
                : 'border-neutral-300 opacity-80 hover:opacity-100 hover:border-neutral-400'
            }`}
          >
            {p.logo ? (
              <img 
                src={p.logo} 
                alt={p.nombre} 
                className="h-4 w-auto max-w-[65px] object-contain pointer-events-none select-none" 
              />
            ) : (
              p.icono
            )}
          </button>
        );
      })}
    </div>
  </div>

          {/* Fecha */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-4">
              <label className="text-xs font-bold text-neutral-600 dark:text-neutral-400">Fecha de visualización</label>
              <button
                type="button"
                onClick={handleToggleNoRecuerda}
                className={`text-[11px] font-bold px-2 py-0.5 rounded transition cursor-pointer ${
                  noRecuerdaFecha 
                    ? 'bg-rose-600 text-white' 
                    : 'bg-neutral-200 dark:bg-white/10 text-neutral-600 dark:text-neutral-400'
                }`}
              >
                {noRecuerdaFecha ? '✓ Sin fecha exacta' : 'No recuerdo cuándo la vi'}
              </button>
            </div>

            <input 
              ref={inputFechaRef}
              type="date" 
              value={fechaVisto}
              disabled={noRecuerdaFecha}
              onChange={(e) => setFechaVisto(e.target.value)}
              onClick={() => inputFechaRef.current?.showPicker?.()}
              className={`bg-white dark:bg-[#1e1e24] border border-neutral-300 dark:border-white/10 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-rose-500 cursor-pointer w-48 shadow-sm ${
                noRecuerdaFecha ? 'opacity-40 cursor-not-allowed' : ''
              }`}
            />
          </div>
        </div>

        {/* Contenido Principal */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {!esSerie ? (
            <div className="text-center py-10 space-y-5">
              <p className="text-neutral-600 dark:text-neutral-300 max-w-xl mx-auto text-sm leading-relaxed">{obra.sinopsis}</p>
              <button
                onClick={handleGuardarPelicula}
                className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-8 py-3 rounded-xl shadow-lg transition cursor-pointer"
              >
                ✓ Registrar Película en Mi Timeline
              </button>
            </div>
          ) : (
            <>
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {[1, 2, 3, 4, 5].map((num) => (
                    <button
                      key={num}
                      onClick={() => setTemporadaSeleccionada(num)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                        temporadaSeleccionada === num
                          ? 'bg-rose-600 text-white shadow-md'
                          : 'bg-neutral-200/80 dark:bg-[#1e1e24] text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
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

              {/* Lista de episodios */}
              {cargandoEpisodios ? (
                <div className="py-16 text-center text-neutral-400 text-sm animate-pulse">
                  Cargando capítulos...
                </div>
              ) : (
                <div className="space-y-3">
                  {datosTemporada?.episodios?.map((ep) => {
                    const yaVisto = episodiosYaVistos.includes(ep.episodio_numero);
                    const estaMarcado = episodiosSeleccionados.includes(ep.episodio_numero);

                    return (
                      <div 
                        key={ep.episodio_numero}
                        onClick={() => toggleSeleccionEpisodio(ep.episodio_numero)}
                        className={`flex items-center justify-between p-3.5 rounded-2xl border transition gap-5 select-none ${
                          yaVisto
                            ? 'bg-emerald-500/10 border-emerald-500/30 opacity-70 cursor-default'
                            : estaMarcado 
                              ? 'bg-rose-600/10 border-rose-500/50 cursor-pointer' 
                              : 'bg-white dark:bg-[#1a1a20] hover:border-neutral-400 dark:hover:bg-white/5 border-neutral-200 dark:border-white/5 cursor-pointer shadow-sm'
                        }`}
                      >
                        <div className="flex items-center gap-4 min-w-0">
                          <div className={`w-6 h-6 rounded-lg flex items-center justify-center border transition flex-shrink-0 ${
                            yaVisto 
                              ? 'bg-emerald-600 border-emerald-600 text-white font-black text-xs'
                              : estaMarcado 
                                ? 'bg-rose-600 border-rose-600 text-white font-black text-xs' 
                                : 'border-neutral-400 dark:border-neutral-600'
                          }`}>
                            {(yaVisto || estaMarcado) && '✓'}
                          </div>

                          <div className="w-28 h-16 bg-neutral-200 dark:bg-neutral-800 rounded-xl overflow-hidden flex-shrink-0 relative">
                            {ep.still_path ? (
                              <img src={ep.still_path} alt={ep.nombre} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-[10px] text-neutral-500">
                                Sin foto
                              </div>
                            )}
                            <span className="absolute bottom-1 right-1 bg-black/80 px-1.5 py-0.5 rounded text-[10px] font-black text-white">
                              E{ep.episodio_numero}
                            </span>
                          </div>

                          <div className="min-w-0 space-y-1">
                            <h4 className="font-bold text-sm truncate">
                              {ep.episodio_numero}. {ep.nombre}
                            </h4>
                            <p className="text-xs text-neutral-500 dark:text-neutral-400 line-clamp-2">
                              {ep.sinopsis || 'Sin descripción disponible.'}
                            </p>
                          </div>
                        </div>

                        <span className={`text-xs font-bold px-3 py-1.5 rounded-xl border ${
                          yaVisto
                            ? 'bg-emerald-600/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                            : estaMarcado 
                              ? 'bg-rose-600 text-white border-rose-600' 
                              : 'bg-neutral-100 dark:bg-white/5 text-neutral-500 dark:text-neutral-400 border-neutral-300 dark:border-white/10'
                        }`}>
                          {yaVisto ? 'Ya visto' : estaMarcado ? 'Seleccionado' : 'Seleccionar'}
                        </span>
                      </div>
                    );
                  })}
                </div>
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