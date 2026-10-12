import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';

import { 
  obtenerDetallePeliculaAPI,
  obtenerEpisodiosTemporadaAPI, 
  registrarVisualizacionAPI, 
  registrarLoteAPI,
  registrarTemporadasMultiplesAPI,
  obtenerEpisodiosVistosAPI,
  obtenerProgresoTemporadasSerieAPI,
  obtenerDetalleEpisodioAPI,
  obtenerProveedoresAPI,
  actualizarPlataformaSerieAPI,
  obtenerPendientesAPI,   
  alternarPendienteAPI    
} from '../../api';
import { obtenerFechaHoyLocal, obtenerFechaAyerLocal, formatearFecha } from '../../utils/fechas';
import { obtenerNotaEspecialSerie } from '../../utils/seriesNotas';
import BarraConfiguracionRegistro from './BarraConfiguracionRegistro';
import ListaEpisodios from './ListaEpisodios';
import SelectorTemporadaBarra from './SelectorTemporadaBarra';
import SelectorTemporadasMultiples from './SelectorTemporadasMultiples';
import VistaRegistroPelicula from './VistaRegistroPelicula';
import ModalFilmografiaActor from './ModalFilmografiaActor';
import ModalActoresEpisodio from './ModalActoresEpisodio';
import ModalCalificarSerie from './ModalCalificarSerie';
import PanelAsistenteDistribucion from './PanelAsistenteDistribucion';
import { Bookmark, Check, X, AlertCircle, Play, Layers, Tv, Calendar, CheckCircle2 } from 'lucide-react';

export default function ModalRegistrar({ obra, onClose, onRegistroCompletado, onCambiarObra }) {
  const { usuario } = useAuth();

  const [obraActual, setObraActual] = useState(obra);

  useEffect(() => {
    setObraActual(obra);
  }, [obra]);

  const tipoNormalizado = obraActual?.tipo?.toLowerCase();
  const esSerie = tipoNormalizado === 'serie' || tipoNormalizado === 'tv';
  const tmdbIdReal = Number(obraActual?.tmdb_id || obraActual?.id || obraActual?.obra_tmdb_id);

  // Modo de registro de series: 'temporadas' (múltiples temporadas completas) o 'capitulos' (capítulos individuales)
  const [modoSerie, setModoSerie] = useState('temporadas');
  const [temporadasSeleccionadas, setTemporadasSeleccionadas] = useState([]);

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
  const [progresoTemporadas, setProgresoTemporadas] = useState({});
  const [modalCalificarSerieAbierto, setModalCalificarSerieAbierto] = useState(false);
  const [fechasEpisodios, setFechasEpisodios] = useState({});
  const [panelDistribuirAbierto, setPanelDistribuirAbierto] = useState(false);
  const [panelDistribuirTemporadasAbierto, setPanelDistribuirTemporadasAbierto] = useState(false);
  const [fechaInicioDistribuir, setFechaInicioDistribuir] = useState(() => obtenerFechaHoyLocal());
  const [capitulosPorTanda, setCapitulosPorTanda] = useState(1);
  const [diasIntervalo, setDiasIntervalo] = useState(1);
  const [distribucionTemporadas, setDistribucionTemporadas] = useState(null);
  const [modoDistribucion, setModoDistribucion] = useState('ritmo'); // 'ritmo' | 'rango'
  const [fechaFinDistribuir, setFechaFinDistribuir] = useState(() => obtenerFechaHoyLocal());
  const [omitirYaVistos, setOmitirYaVistos] = useState(true);
  const [bannerExito, setBannerExito] = useState(null);

  // Cargar progreso de visualización de cada temporada de la serie
  useEffect(() => {
    if (!esSerie || !tmdbIdReal || !usuario?.id) return;
    let cancelado = false;

    const cargarProgreso = async () => {
      try {
        const datosProgreso = await obtenerProgresoTemporadasSerieAPI(tmdbIdReal);
        if (!cancelado && datosProgreso) {
          setProgresoTemporadas(datosProgreso);
        }
      } catch (e) {
        console.warn('Error cargando progreso de temporadas:', e);
      }
    };

    cargarProgreso();
    return () => { cancelado = true; };
  }, [esSerie, tmdbIdReal, usuario?.id]);

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
          // Deduplicar para evitar números negativos
          setEpisodiosYaVistos(Array.isArray(vistosData) ? Array.from(new Set(vistosData.map(Number))) : []);
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

  const calcularFechaEstreno = (obraObj = obraActual, temporadaData = datosTemporada, eps = episodiosSeleccionados) => {
    if (esSerie && Array.isArray(eps) && eps.length === 1 && temporadaData?.episodios) {
      const epEncontrado = temporadaData.episodios.find((e) => e.episodio_numero === eps[0]);
      const fechaEp = epEncontrado?.fecha_estreno || epEncontrado?.air_date;
      if (fechaEp && /^\d{4}-\d{2}-\d{2}/.test(fechaEp)) {
        return fechaEp.substring(0, 10);
      }
    }

    if (esSerie) {
      const fechaTemp = temporadaData?.fecha_estreno || temporadaData?.air_date;
      if (fechaTemp && /^\d{4}-\d{2}-\d{2}/.test(fechaTemp)) {
        return fechaTemp.substring(0, 10);
      }
    }

    const fecha = obraObj?.fecha_estreno || 
                  obraObj?.release_date || 
                  obraObj?.first_air_date || 
                  fichaDetalle?.fecha_estreno || 
                  fichaDetalle?.release_date || 
                  fichaDetalle?.first_air_date || 
                  obra?.fecha_estreno || 
                  obra?.release_date || 
                  obra?.first_air_date;

    if (fecha && /^\d{4}-\d{2}-\d{2}/.test(fecha)) {
      return fecha.substring(0, 10);
    }

    const anio = obraObj?.anio || fichaDetalle?.anio || obra?.anio;
    if (anio && /^\d{4}$/.test(String(anio).trim())) {
      return `${String(anio).trim()}-01-01`;
    }

    return '2020-01-01';
  };

  const handleToggleNoRecuerda = (forzar) => {
    if (forzar === false) {
      setNoRecuerdaFecha(false);
      return;
    }
    const nuevoEstado = typeof forzar === 'boolean' ? forzar : !noRecuerdaFecha;
    setNoRecuerdaFecha(nuevoEstado);
    if (nuevoEstado) {
      setFechaVisto(calcularFechaEstreno(obraActual, datosTemporada, episodiosSeleccionados));
    } else {
      setFechaVisto(obtenerFechaHoyLocal());
    }
  };

  useEffect(() => {
    if (noRecuerdaFecha) {
      const fechaCalculada = calcularFechaEstreno(obraActual, datosTemporada, episodiosSeleccionados);
      if (fechaCalculada) {
        setFechaVisto(fechaCalculada);
      }
    }
  }, [fichaDetalle, datosTemporada, episodiosSeleccionados, noRecuerdaFecha]);

  const toggleSeleccionEpisodio = (num) => {
    setErrorRegistro(null);
    setEpisodiosSeleccionados((prev) => {
      if (prev.includes(num)) {
        return prev.filter((e) => e !== num);
      } else {
        if (!fechasEpisodios[num]) {
          setFechasEpisodios((f) => ({ ...f, [num]: fechaVisto || obtenerFechaHoyLocal() }));
        }
        return [...prev, num];
      }
    });
  };

  const handleCambiarFechaEpisodio = (epNum, nuevaFecha) => {
    setNoRecuerdaFecha(false);
    setFechasEpisodios((prev) => ({
      ...prev,
      [epNum]: nuevaFecha,
    }));
  };

  const handleAbrirDistribuirEpisodios = () => {
    const nuevoEstado = !panelDistribuirAbierto;
    if (nuevoEstado) {
      const fechaBase = fechaVisto || calcularFechaEstreno(obraActual, datosTemporada, episodiosSeleccionados);
      if (fechaBase) setFechaInicioDistribuir(fechaBase);
    }
    setPanelDistribuirAbierto(nuevoEstado);
  };

  const handleAbrirDistribuirTemporadas = () => {
    const nuevoEstado = !panelDistribuirTemporadasAbierto;
    if (nuevoEstado) {
      const fechaBase = fechaVisto || calcularFechaEstreno(obraActual, datosTemporada, []);
      if (fechaBase) setFechaInicioDistribuir(fechaBase);
    }
    setPanelDistribuirTemporadasAbierto(nuevoEstado);
  };

  const handleAplicarDistribucion = () => {
    if (!fechaInicioDistribuir || episodiosSeleccionados.length === 0) return;
    setNoRecuerdaFecha(false);
    const ordenados = [...episodiosSeleccionados].sort((a, b) => Number(a) - Number(b));

    const nuevas = { ...fechasEpisodios };

    if (modoDistribucion === 'rango' && fechaFinDistribuir) {
      // Distribución uniforme entre fecha inicio y fecha fin
      const [y1, m1, d1] = String(fechaInicioDistribuir).substring(0, 10).split('-').map(Number);
      const [y2, m2, d2] = String(fechaFinDistribuir).substring(0, 10).split('-').map(Number);
      const inicio = new Date(y1, m1 - 1, d1);
      const fin = new Date(y2, m2 - 1, d2);
      const diasTotales = Math.max(0, Math.round((fin.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24)));
      const total = ordenados.length;

      ordenados.forEach((epNum, idx) => {
        const offset = total <= 1 ? 0 : Math.min(diasTotales, Math.round((idx * diasTotales) / (total - 1)));
        const cur = new Date(inicio);
        cur.setDate(inicio.getDate() + offset);
        nuevas[epNum] = `${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, '0')}-${String(cur.getDate()).padStart(2, '0')}`;
      });

      setFechasEpisodios(nuevas);
      setPanelDistribuirAbierto(false);
      setBannerExito(`¡Fechas distribuidas entre ${formatearFecha(fechaInicioDistribuir)} y ${formatearFecha(fechaFinDistribuir)}!`);
      setTimeout(() => setBannerExito(null), 4000);
    } else {
      // Distribución por ritmo (modo original)
      const [y, m, d] = String(fechaInicioDistribuir).substring(0, 10).split('-').map(Number);
      const baseDate = new Date(y, m - 1, d);
      const cantPorTanda = Math.max(1, Number(capitulosPorTanda) || 1);
      const intervaloDias = Math.max(1, Number(diasIntervalo) || 1);

      ordenados.forEach((epNum, idx) => {
        const tanda = Math.floor(idx / cantPorTanda);
        const diasAAgregar = tanda * intervaloDias;
        const cur = new Date(baseDate);
        cur.setDate(baseDate.getDate() + diasAAgregar);
        nuevas[epNum] = `${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, '0')}-${String(cur.getDate()).padStart(2, '0')}`;
      });

      setFechasEpisodios(nuevas);
      setPanelDistribuirAbierto(false);
      const textoIntervalo = intervaloDias === 1 ? 'día' : intervaloDias === 7 ? 'semana' : `${intervaloDias} días`;
      setBannerExito(`¡Se asignaron fechas distribuidas (${cantPorTanda} ${cantPorTanda === 1 ? 'capítulo' : 'capítulos'} por ${textoIntervalo})!`);
      setTimeout(() => setBannerExito(null), 4000);
    }
  };


  const handleAplicarDistribucionTemporadas = () => {
    if (!fechaInicioDistribuir || temporadasSeleccionadas.length === 0) return;
    setNoRecuerdaFecha(false);

    if (modoDistribucion === 'rango' && fechaFinDistribuir) {
      setDistribucionTemporadas({
        tipo: 'rango',
        fecha_inicio: fechaInicioDistribuir,
        fecha_fin: fechaFinDistribuir,
      });
      setPanelDistribuirTemporadasAbierto(false);
      setBannerExito(`¡Distribución por rango configurada (${formatearFecha(fechaInicioDistribuir)} → ${formatearFecha(fechaFinDistribuir)})! Se aplicará al guardar.`);
      setTimeout(() => setBannerExito(null), 4000);
    } else {
      const cantPorTanda = Math.max(1, Number(capitulosPorTanda) || 1);
      const intervaloDias = Math.max(1, Number(diasIntervalo) || 1);
      setDistribucionTemporadas({
        tipo: 'ritmo',
        fecha_inicio: fechaInicioDistribuir,
        capitulos_por_tanda: cantPorTanda,
        dias_intervalo: intervaloDias,
      });
      setPanelDistribuirTemporadasAbierto(false);
      const textoIntervalo = intervaloDias === 1 ? 'día' : intervaloDias === 7 ? 'semana' : `${intervaloDias} días`;
      setBannerExito(`¡Ritmo configurado para las temporadas (${cantPorTanda} cap(s) por ${textoIntervalo})! Se aplicará al guardar.`);
      setTimeout(() => setBannerExito(null), 4000);
    }
  };


  const handleMarcarRestantes = () => {
    setErrorRegistro(null);
    if (!datosTemporada?.episodios) return;
    
    let seleccion;
    if (faltantesCount > 0) {
      const faltantes = datosTemporada.episodios
        .map((ep) => ep.episodio_numero)
        .filter((num) => !episodiosYaVistos.includes(num));
      seleccion = episodiosSeleccionados.length === faltantes.length ? [] : faltantes;
    } else {
      const todos = datosTemporada.episodios.map((ep) => ep.episodio_numero);
      seleccion = episodiosSeleccionados.length === todos.length ? [] : todos;
    }

    if (seleccion.length > 0) {
      setFechasEpisodios((prev) => {
        const clon = { ...prev };
        seleccion.forEach((num) => {
          if (!clon[num]) clon[num] = fechaVisto || obtenerFechaHoyLocal();
        });
        return clon;
      });
    }
    setEpisodiosSeleccionados(seleccion);
  };

  // Manejo de Selección Múltiple de Temporadas Completas
  const listaTemporadasObjetos = useMemo(() => {
    if (fichaDetalle?.seasons && Array.isArray(fichaDetalle.seasons) && fichaDetalle.seasons.length > 0) {
      return fichaDetalle.seasons;
    }
    return Array.from({ length: Math.max(1, totalTemporadas) }, (_, i) => ({
      temporada: i + 1,
      episodios: '?',
      nombre: `Temporada ${i + 1}`,
      fecha_estreno: null
    }));
  }, [fichaDetalle?.seasons, totalTemporadas]);

  const toggleTemporadaSeleccionada = (num) => {
    setErrorRegistro(null);
    setTemporadasSeleccionadas((prev) =>
      prev.includes(num) ? prev.filter((t) => t !== num) : [...prev, num]
    );
  };

  const handleSeleccionarTodasTemporadas = () => {
    setTemporadasSeleccionadas(listaTemporadasObjetos.map((s) => s.temporada));
  };

  const handleDeseleccionarTodasTemporadas = () => {
    setTemporadasSeleccionadas([]);
  };

  const totalCapitulosTemporadasSeleccionadas = useMemo(() => {
    return listaTemporadasObjetos
      .filter((s) => temporadasSeleccionadas.includes(s.temporada))
      .reduce((acc, curr) => acc + (typeof curr.episodios === 'number' ? curr.episodios : 0), 0);
  }, [listaTemporadasObjetos, temporadasSeleccionadas]);

  // Guardar múltiples temporadas en lote (1 solo clic para varias temporadas)
  const handleGuardarTemporadasMultiples = async () => {
    if (!usuario) {
      setErrorRegistro('Debes iniciar sesión para registrar temporadas en tu historial.');
      return;
    }
    if (temporadasSeleccionadas.length === 0) return;
    setGuardando(true);
    setErrorRegistro(null);

    try {
      const resTemp = await registrarTemporadasMultiplesAPI({
        tmdb_id: tmdbIdReal,
        titulo: obraActual.titulo,
        titulo_original: obraActual.titulo_original || fichaDetalle?.titulo_original || null,
        poster_path: obraActual.poster_path,
        plataforma: plataforma || null,
        temporadas: temporadasSeleccionadas,
        usar_fechas_estreno: !distribucionTemporadas && Boolean(noRecuerdaFecha),
        fecha_visto: fechaVisto,
        distribucion: distribucionTemporadas,
        omitir_ya_vistos: omitirYaVistos,
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
          console.warn('No se pudo actualizar plataforma serie:', e);
        }
      }

      if (onRegistroCompletado) {
        const cantTemp = temporadasSeleccionadas.length;
        const msg = cantTemp === 1
          ? `Temporada ${temporadasSeleccionadas[0]} de ${obraActual.titulo} registrada`
          : `${cantTemp} temporadas de ${obraActual.titulo} registradas`;
        onRegistroCompletado({
          ids: resTemp?.ids || [],
          titulo: obraActual.titulo,
          mensaje: msg,
          mantenerAbierto: false,
        });
      }
      onClose();
      try {
        window.dispatchEvent(new CustomEvent('cinerewind:limpiar-busqueda'));
      } catch (e) {}
    } catch (err) {
      setErrorRegistro(err.message || 'Error al guardar las temporadas.');
    } finally {
      setGuardando(false);
    }
  };

  // Guardar episodios seleccionados de la temporada activa
  const handleGuardarSeleccionados = async (opciones = {}) => {
    const mantenerAbierto = Boolean(opciones?.mantenerAbierto);
    if (!usuario) {
      setErrorRegistro('Debes iniciar sesión para registrar episodios en tu historial.');
      return;
    }
    if (episodiosSeleccionados.length === 0) return;
    setGuardando(true);
    setErrorRegistro(null);

    try {
      const fotosMapa = {};
      const fechasMapa = {};
      datosTemporada?.episodios?.forEach((ep) => {
        if (episodiosSeleccionados.includes(ep.episodio_numero)) {
          fotosMapa[ep.episodio_numero] = ep.still_path;
          if (fechasEpisodios[ep.episodio_numero]) {
            fechasMapa[ep.episodio_numero] = fechasEpisodios[ep.episodio_numero];
          } else if (noRecuerdaFecha) {
            const fEp = ep.fecha_estreno || ep.air_date;
            if (fEp && /^\d{4}-\d{2}-\d{2}/.test(fEp)) {
              fechasMapa[ep.episodio_numero] = fEp.substring(0, 10);
            }
          } else {
            fechasMapa[ep.episodio_numero] = fechaVisto;
          }
        }
      });

      const resLote = await registrarLoteAPI({
        usuario_id: usuario.id,
        tmdb_id: tmdbIdReal,
        titulo: obraActual.titulo,
        titulo_original: obraActual.titulo_original || fichaDetalle?.titulo_original || null,
        poster_path: datosTemporada?.poster_temporada || obraActual.poster_path,
        plataforma: plataforma || null,
        temporada: temporadaSeleccionada,
        episodios: episodiosSeleccionados,
        fecha_visto: fechaVisto,
        fotos_episodios: fotosMapa,
        fechas_episodios: Object.keys(fechasMapa).length > 0 ? fechasMapa : undefined,
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

      const msg = episodiosSeleccionados.length === 1
        ? `T${temporadaSeleccionada} · E${episodiosSeleccionados[0]} de ${obraActual.titulo} registrado`
        : `${episodiosSeleccionados.length} capítulos de ${obraActual.titulo} registrados`;

      if (onRegistroCompletado) {
        onRegistroCompletado({
          ids: resLote?.ids || [],
          titulo: obraActual.titulo,
          mensaje: msg,
          mantenerAbierto,
        });
      }

      if (mantenerAbierto) {
        setEpisodiosYaVistos((prev) => Array.from(new Set([...(prev || []), ...episodiosSeleccionados])));
        setProgresoTemporadas((prev) => {
          const actual = (prev && prev[temporadaSeleccionada]) || 0;
          const nuevos = episodiosSeleccionados.filter((ep) => !(episodiosYaVistos || []).includes(ep)).length;
          return {
            ...prev,
            [temporadaSeleccionada]: actual + nuevos,
          };
        });
        const cantGuardada = episodiosSeleccionados.length;
        setEpisodiosSeleccionados([]);
        setBannerExito(`¡Se registraron ${cantGuardada} capítulos! Podés seguir marcando.`);
        setTimeout(() => setBannerExito(null), 3500);
      } else {
        onClose();
        try {
          window.dispatchEvent(new CustomEvent('cinerewind:limpiar-busqueda'));
        } catch (e) {}
      }
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
      const resPeli = await registrarVisualizacionAPI({
        usuario_id: usuario.id,
        tmdb_id: tmdbIdReal,
        tipo: 'pelicula',
        titulo: obraActual.titulo,
        titulo_original: obraActual.titulo_original || fichaDetalle?.titulo_original || null,
        poster_path: obraActual.poster_path,
        fecha_visto: fechaVisto,
        plataforma: plataforma || null,
        amigos_etiquetados: amigosSeleccionados, 
        visto_con_texto: vistoConTexto.trim() || null,
        calificacion: calificacionDirecta > 0 ? calificacionDirecta : null,
      });

      const peliId = resPeli?.registro?.id;
      if (onRegistroCompletado) {
        onRegistroCompletado({
          ids: peliId ? [peliId] : [],
          titulo: obraActual.titulo,
          mensaje: `"${obraActual.titulo}" registrada`,
          mantenerAbierto: false,
        });
      }
      onClose();
      try {
        window.dispatchEvent(new CustomEvent('cinerewind:limpiar-busqueda'));
      } catch (e) {}
    } catch (err) {
      setErrorRegistro(err.message || 'Error al registrar la película.');
    } finally {
      setGuardando(false);
    }
  };

  const totalEpisodios = datosTemporada?.episodios?.length || 0;
  const faltantesCount = Math.max(0, totalEpisodios - episodiosYaVistos.length);
  const listaTemporadasNumeros = Array.from({ length: Math.max(1, totalTemporadas) }, (_, i) => i + 1);

  return (
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center bg-black/80 backdrop-blur-md pt-1 sm:p-4 select-none animate-fadeIn">
      <div className={`bg-[#fcfaf7] dark:bg-[#141418] border-t sm:border border-neutral-300 dark:border-white/10 rounded-t-3xl sm:rounded-3xl max-w-4xl w-full flex flex-col shadow-2xl overflow-hidden text-neutral-900 dark:text-white transition-colors relative ${
        esSerie ? 'h-[94dvh] sm:h-[90vh]' : 'h-[92dvh] sm:h-auto sm:max-h-[90vh]'
      }`}>
        
        {/* Cabecera Principal */}
        <div className="p-3.5 sm:p-4 border-b border-neutral-200 dark:border-white/10 flex items-center justify-between gap-3 bg-[#fcfaf7] dark:bg-[#141418] z-20 flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <img 
              src={obraActual?.poster_path} 
              alt={obraActual?.titulo} 
              className="w-10 h-14 sm:w-12 sm:h-16 object-cover rounded-xl shadow-md border border-black/10 dark:border-white/10 flex-shrink-0" 
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

        {/* Alerta de error estilizada */}
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

        {/* Notificación de éxito estilizada */}
        {bannerExito && (
          <div className="mx-4 mt-3 p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold rounded-2xl flex items-center justify-between gap-3 animate-fadeIn flex-shrink-0">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>{bannerExito}</span>
            </div>
            <button 
              type="button" 
              onClick={() => setBannerExito(null)} 
              className="text-emerald-500 hover:text-emerald-700 font-black cursor-pointer px-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Contenedor Principal */}
        <div className={`overflow-y-auto flex-1 min-h-0 ${
          esSerie 
            ? 'p-3.5 sm:p-5 space-y-4 pb-24 sm:pb-8' 
            : 'p-3 sm:p-5 space-y-3.5 pb-28 sm:pb-8'
        }`}>
          {/* Barra de Ajustes Unificada (Fecha, Plataforma, Acompañantes) */}
          <BarraConfiguracionRegistro
            esSerie={esSerie}
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
                fechaVisto={fechaVisto}
                noRecuerdaFecha={noRecuerdaFecha}
              />
            </div>
          ) : (
            <div className="space-y-4 pt-1">
              
              {/* Selector de Modo: Marcar Temporadas Completas vs Capítulos Individuales */}
              <div className="flex items-center p-1 rounded-2xl bg-neutral-200/80 dark:bg-white/5 border border-neutral-300/80 dark:border-white/10 select-none shadow-xs">
                <button
                  type="button"
                  onClick={() => setModoSerie('temporadas')}
                  className={`flex-1 py-2 px-2 sm:px-3 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 sm:gap-2 cursor-pointer ${
                    modoSerie === 'temporadas'
                      ? 'bg-rose-600 text-white shadow-md'
                      : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5 shrink-0" />
                  <span className="sm:hidden">Temporadas</span>
                  <span className="hidden sm:inline">Marcar por Temporadas</span>
                </button>
                <button
                  type="button"
                  onClick={() => setModoSerie('capitulos')}
                  className={`flex-1 py-2 px-2 sm:px-3 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 sm:gap-2 cursor-pointer ${
                    modoSerie === 'capitulos'
                      ? 'bg-rose-600 text-white shadow-md'
                      : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                  }`}
                >
                  <Tv className="w-3.5 h-3.5 shrink-0" />
                  <span className="sm:hidden">Capítulos</span>
                  <span className="hidden sm:inline">Ver Capítulos Individuales</span>
                </button>
              </div>

              {/* VISTA 1: TEMPORADAS COMPLETAS (SELECCIÓN MÚLTIPLE DE TEMPORADAS) */}
              {modoSerie === 'temporadas' && (
                <div className="space-y-4">
                  <SelectorTemporadasMultiples
                    seasons={listaTemporadasObjetos}
                    temporadasSeleccionadas={temporadasSeleccionadas}
                    progresoTemporadas={progresoTemporadas}
                    posterFallback={obraActual?.poster_path}
                    onToggleTemporada={toggleTemporadaSeleccionada}
                    onSeleccionarTodas={handleSeleccionarTodasTemporadas}
                    onDeseleccionarTodas={handleDeseleccionarTodasTemporadas}
                    onAbrirDistribuir={handleAbrirDistribuirTemporadas}
                    panelDistribuirAbierto={panelDistribuirTemporadasAbierto}
                    distribucionActiva={distribucionTemporadas}
                    omitirYaVistos={omitirYaVistos}
                    setOmitirYaVistos={setOmitirYaVistos}
                    onVerEpisodiosDeTemporada={(num) => {
                      setTemporadaSeleccionada(num);
                      setModoSerie('capitulos');
                    }}
                  >
                    {panelDistribuirTemporadasAbierto && temporadasSeleccionadas.length > 0 && (
                      <PanelAsistenteDistribucion
                        totalItems={temporadasSeleccionadas.length}
                        esModoTemporadas={true}
                        fechaInicio={fechaInicioDistribuir}
                        setFechaInicio={setFechaInicioDistribuir}
                        fechaFin={fechaFinDistribuir}
                        setFechaFin={setFechaFinDistribuir}
                        capitulosPorTanda={capitulosPorTanda}
                        setCapitulosPorTanda={setCapitulosPorTanda}
                        diasIntervalo={diasIntervalo}
                        setDiasIntervalo={setDiasIntervalo}
                        modoDistribucion={modoDistribucion}
                        setModoDistribucion={setModoDistribucion}
                        totalCapitulosEstimados={totalCapitulosTemporadasSeleccionadas}
                        onAplicar={handleAplicarDistribucionTemporadas}
                        onCerrar={() => setPanelDistribuirTemporadasAbierto(false)}
                      />
                    )}
                  </SelectorTemporadasMultiples>
                </div>
              )}

              {/* VISTA 2: CAPÍTULOS INDIVIDUALES */}
              {modoSerie === 'capitulos' && (
                <div className="space-y-4 animate-fadeIn">
                  <SelectorTemporadaBarra 
                    listaTemporadas={listaTemporadasNumeros}
                    temporadaSeleccionada={temporadaSeleccionada}
                    onCambiarTemporada={(num) => setTemporadaSeleccionada(num)}
                    faltantesCount={faltantesCount}
                    onMarcarRestantes={handleMarcarRestantes}
                    onAbrirCalificarTemporada={() => setModalCalificarSerieAbierto(true)}
                    notaEspecial={obtenerNotaEspecialSerie(tmdbIdReal, obraActual?.titulo)}
                    episodiosSeleccionadosCount={episodiosSeleccionados.length}
                    onAbrirDistribuir={handleAbrirDistribuirEpisodios}
                    panelDistribuirAbierto={panelDistribuirAbierto}
                  />

                  {/* Panel interactivo para distribuir fechas */}
                  {panelDistribuirAbierto && episodiosSeleccionados.length > 0 && (
                    <PanelAsistenteDistribucion
                      totalItems={episodiosSeleccionados.length}
                      esModoTemporadas={false}
                      fechaInicio={fechaInicioDistribuir}
                      setFechaInicio={setFechaInicioDistribuir}
                      fechaFin={fechaFinDistribuir}
                      setFechaFin={setFechaFinDistribuir}
                      capitulosPorTanda={capitulosPorTanda}
                      setCapitulosPorTanda={setCapitulosPorTanda}
                      diasIntervalo={diasIntervalo}
                      setDiasIntervalo={setDiasIntervalo}
                      modoDistribucion={modoDistribucion}
                      setModoDistribucion={setModoDistribucion}
                      onAplicar={handleAplicarDistribucion}
                      onCerrar={() => setPanelDistribuirAbierto(false)}
                    />
                  )}

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
                      noRecuerdaFecha={noRecuerdaFecha}
                      fechasEpisodios={fechasEpisodios}
                      onCambiarFechaEpisodio={handleCambiarFechaEpisodio}
                      fechaDefecto={fechaVisto}
                    />
                  )}
                </div>
              )}

            </div>
          )}
        </div>

        {/* Barra inferior para guardar series */}
        {esSerie && (
          (modoSerie === 'temporadas' && temporadasSeleccionadas.length > 0) ||
          (modoSerie === 'capitulos' && episodiosSeleccionados.length > 0)
        ) && (
          <div className="p-3.5 sm:p-4 bg-[#fcfaf7] dark:bg-[#18181e] border-t border-neutral-300/80 dark:border-white/10 flex items-center justify-between gap-3 px-4 sm:px-6 flex-shrink-0 z-20">
            <div className="min-w-0">
              {modoSerie === 'temporadas' ? (
                <>
                  <span className="text-xs sm:text-sm font-bold text-neutral-800 dark:text-neutral-100 block truncate">
                    {temporadasSeleccionadas.length} {temporadasSeleccionadas.length === 1 ? 'temporada seleccionada' : 'temporadas seleccionadas'}
                    {totalCapitulosTemporadasSeleccionadas > 0 && ` (${totalCapitulosTemporadasSeleccionadas} capítulos)`}
                  </span>
                  <span className="text-[11px] text-neutral-500 dark:text-neutral-400 font-medium">
                    {distribucionTemporadas ? (
                      <span className="text-rose-600 dark:text-rose-400 font-bold">
                        {distribucionTemporadas.tipo === 'rango'
                          ? `Rango: ${formatearFecha(distribucionTemporadas.fecha_inicio)} → ${formatearFecha(distribucionTemporadas.fecha_fin)}`
                          : `Ritmo: ${distribucionTemporadas.capitulos_por_tanda} cap(s) cada ${distribucionTemporadas.dias_intervalo === 1 ? 'día' : distribucionTemporadas.dias_intervalo === 7 ? 'semana' : `${distribucionTemporadas.dias_intervalo} días`} desde ${formatearFecha(distribucionTemporadas.fecha_inicio)}`
                        }
                      </span>
                    ) : noRecuerdaFecha ? (
                      'Con fechas de emisión oficial de cada capítulo'
                    ) : (
                      `Con fecha: ${fechaVisto === obtenerFechaHoyLocal() ? 'Hoy' : fechaVisto === obtenerFechaAyerLocal() ? 'Ayer' : formatearFecha(fechaVisto)}`
                    )}
                  </span>
                </>
              ) : (
                <>
                  <span className="text-xs sm:text-sm font-bold text-neutral-800 dark:text-neutral-100 block truncate">
                    {episodiosSeleccionados.length} {episodiosSeleccionados.length === 1 ? 'capítulo seleccionado' : 'capítulos seleccionados'}
                  </span>
                  <span className="text-[11px] text-neutral-500 dark:text-neutral-400 font-medium">
                    {noRecuerdaFecha 
                      ? 'Con fecha de emisión oficial de cada capítulo'
                      : `Con fecha: ${fechaVisto === obtenerFechaHoyLocal() ? 'Hoy' : fechaVisto === obtenerFechaAyerLocal() ? 'Ayer' : formatearFecha(fechaVisto)}`
                    }
                  </span>
                </>
              )}
            </div>

            {modoSerie === 'temporadas' ? (
              <button 
                type="button" 
                disabled={guardando} 
                onClick={handleGuardarTemporadasMultiples} 
                className="bg-rose-600 hover:bg-rose-500 active:scale-95 text-white font-black px-4 sm:px-6 py-2.5 rounded-xl shadow-lg transition cursor-pointer text-xs sm:text-sm flex items-center gap-2 disabled:opacity-50"
              >
                {guardando ? (
                  <span>Guardando...</span>
                ) : (
                  <>
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>Guardar {temporadasSeleccionadas.length} {temporadasSeleccionadas.length === 1 ? 'temporada' : 'temporadas'}</span>
                  </>
                )}
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={guardando}
                  onClick={() => handleGuardarSeleccionados({ mantenerAbierto: true })}
                  className="px-3 sm:px-4 py-2.5 rounded-xl text-xs font-black bg-neutral-200/80 dark:bg-white/10 hover:bg-neutral-300 dark:hover:bg-white/20 text-neutral-800 dark:text-neutral-200 border border-neutral-300/80 dark:border-white/10 transition cursor-pointer active:scale-95 disabled:opacity-50 shadow-xs whitespace-nowrap"
                  title="Guarda los episodios y mantiene el modal abierto para seguir registrando"
                >
                  <span className="sm:hidden">Guardar y seguir</span>
                  <span className="hidden sm:inline">Guardar y seguir marcando</span>
                </button>

                <button 
                  type="button" 
                  disabled={guardando} 
                  onClick={() => handleGuardarSeleccionados({ mantenerAbierto: false })} 
                  className="bg-rose-600 hover:bg-rose-500 active:scale-95 text-white font-black px-4 sm:px-5 py-2.5 rounded-xl shadow-lg transition cursor-pointer text-xs sm:text-sm flex items-center gap-2 disabled:opacity-50 whitespace-nowrap"
                >
                  {guardando ? (
                    <span>Guardando...</span>
                  ) : (
                    <>
                      <Check className="w-4 h-4 stroke-[3]" />
                      <span className="sm:hidden">Guardar y cerrar</span>
                      <span className="hidden sm:inline">Guardar y cerrar</span>
                    </>
                  )}
                </button>
              </div>
            )}
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

        {modalCalificarSerieAbierto && (
          <ModalCalificarSerie
            obra={obraActual}
            temporadaInicial={temporadaSeleccionada}
            temporadasDisponibles={listaTemporadasNumeros}
            onClose={() => setModalCalificarSerieAbierto(false)}
            onActualizado={() => {
              if (onRegistroCompletado) onRegistroCompletado();
            }}
          />
        )}

      </div>
    </div>
  );
}