import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import CarruselViendo from '../components/home/CarruselViendo';
import HeaderHistorial from '../components/home/HeaderHistorial';
import GrillaHistorial from '../components/home/GrillaHistorial';
import BarraAccionLote from '../components/home/BarraAccionLote';
import OnboardingBienvenida from '../components/home/OnboardingBienvenida';

// Modales modulares
import ModalRegistrar from '../components/modal/ModalRegistrar';
import ModalConfirmar from '../components/modal/ModalConfirmar';
import ModalDetalleTimeline from '../components/modal/ModalDetalleTimeline';
import ModalDetalleEpisodioViendo from '../components/modal/ModalDetalleEpisodioViendo';
import ModalAuth from '../components/auth/ModalAuth';
import ModalImportarNetflix from '../components/modal/ModalImportarNetflix';
import ModalAmigos from '../components/modal/ModalAmigos';

import { useAuth } from '../context/AuthContext';

import { 
  obtenerViendoActualmenteAPI, 
  avanzarCapituloAPI, 
  obtenerTimelineAPI, 
  eliminarLoteAPI,
  descartarViendoAPI,
  eliminarVisualizacionAPI
} from '../api';

import { 
  Users, 
  Sparkles, 
  Clock, 
  ArrowRight, 
  ArrowLeft,
  CheckCircle2, 
  Flame, 
  Tv 
} from 'lucide-react';

export default function Home({ actualizarTrigger }) {
  const { usuario } = useAuth();
  const navigate = useNavigate();

  // 1. Datos del backend
  const [seriesActivas, setSeriesActivas] = useState([]);
  const [timeline, setTimeline] = useState([]);
  const [cargandoInicial, setCargandoInicial] = useState(true);

  // 2. Filtros y Búsqueda
  const [filtroTipo, setFiltroTipo] = useState('');
  const [busquedaHistorial, setBusquedaHistorial] = useState('');
  const [vistaTotal, setVistaTotal] = useState(false);
  const [serieSeleccionadaTotal, setSerieSeleccionadaTotal] = useState(null);
  const [soloConAmigos, setSoloConAmigos] = useState(false);
  const [amigosFiltro, setAmigosFiltro] = useState([]);
  const [ordenTotal, setOrdenTotal] = useState('mas_vistos');

  // 3. Navegación temporal
  const [anioSeleccionado, setAnioSeleccionado] = useState(null);
  const [mesSeleccionado, setMesSeleccionado] = useState(null);

  // 4. Modales
  const [serieParaEditar, setSerieParaEditar] = useState(null);
  const [itemDetalle, setItemDetalle] = useState(null);
  const [serieParaDetalleXRay, setSerieParaDetalleXRay] = useState(null);
  const [modalAuthLandingAbierto, setModalAuthLandingAbierto] = useState(false);
  const [modalNetflixAbierto, setModalNetflixAbierto] = useState(false);
  const [modalAmigosAbierto, setModalAmigosAbierto] = useState(false);

  // 5. Borrado masivo
  const [modoSeleccion, setModoSeleccion] = useState(false);
  const [seleccionadosParaBorrar, setSeleccionadosParaBorrar] = useState([]);

  // 6. Diálogo de confirmación
  const [dialogoConfirmar, setDialogoConfirmar] = useState({
    abierto: false,
    titulo: '',
    mensaje: '',
    onConfirm: null,
  });

  const location = useLocation();

  useEffect(() => {
    if (location.state?.vistaTotal !== undefined) {
      setVistaTotal(location.state.vistaTotal);
    }
    if (location.state?.filtroTipo !== undefined) {
      setFiltroTipo(location.state.filtroTipo);
    }
  }, [location.state]);

  // 🔝 Desplazar la vista al entrar a una carpeta, o restaurar la posición exacta al volver atrás
  const esPrimeraCargaRef = useRef(true);
  const ignorarScrollRef = useRef(false);

  const prevSerieTotalRef = useRef(null);
  const prevAnioRef = useRef(null);
  const prevMesRef = useRef(null);

  const scrollCatalogRef = useRef(null);
  const scrollAniosRef = useRef(null);
  const scrollMesesRef = useRef(null);

  // Desactivar la restauración automática del navegador para que no fuerce scroll a 0 en history.back()
  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
  }, []);

  // Función robusta de restauración en múltiples etapas para asegurar que el DOM haya crecido
  const restaurarScroll = useCallback((destino) => {
    if (destino === null || destino === undefined) return;
    const aplicar = () => window.scrollTo({ top: destino, behavior: 'instant' });
    aplicar();
    requestAnimationFrame(aplicar);
    setTimeout(aplicar, 50);
    setTimeout(aplicar, 150);
    setTimeout(aplicar, 300);
  }, []);

  useEffect(() => {
    if (esPrimeraCargaRef.current) {
      esPrimeraCargaRef.current = false;
      prevSerieTotalRef.current = serieSeleccionadaTotal;
      prevAnioRef.current = anioSeleccionado;
      prevMesRef.current = mesSeleccionado;
      return;
    }
    if (ignorarScrollRef.current) {
      prevSerieTotalRef.current = serieSeleccionadaTotal;
      prevAnioRef.current = anioSeleccionado;
      prevMesRef.current = mesSeleccionado;
      return;
    }

    const prevSerie = prevSerieTotalRef.current;
    const prevAnio = prevAnioRef.current;
    const prevMes = prevMesRef.current;

    prevSerieTotalRef.current = serieSeleccionadaTotal;
    prevAnioRef.current = anioSeleccionado;
    prevMesRef.current = mesSeleccionado;

    // 1. Volver atrás desde una serie al catálogo en Total Histórico
    if (prevSerie && !serieSeleccionadaTotal) {
      if (scrollCatalogRef.current !== null) {
        const destino = scrollCatalogRef.current;
        scrollCatalogRef.current = null;
        restaurarScroll(destino);
      }
      return;
    }

    // 2. Entrar a una serie en Total Histórico
    if (!prevSerie && serieSeleccionadaTotal) {
      const el = document.getElementById('seccion-historial');
      if (el) {
        const topOffset = el.getBoundingClientRect().top + window.scrollY - 20;
        window.scrollTo({ top: Math.max(0, topOffset), behavior: 'instant' });
      }
      return;
    }

    // 3. Volver atrás desde un mes a la lista de meses
    if (prevMes !== null && mesSeleccionado === null) {
      if (scrollMesesRef.current !== null) {
        const destino = scrollMesesRef.current;
        scrollMesesRef.current = null;
        restaurarScroll(destino);
      }
      return;
    }

    // 4. Entrar a un mes
    if (prevMes === null && mesSeleccionado !== null) {
      const el = document.getElementById('seccion-historial');
      if (el) {
        const topOffset = el.getBoundingClientRect().top + window.scrollY - 20;
        window.scrollTo({ top: Math.max(0, topOffset), behavior: 'instant' });
      }
      return;
    }

    // 5. Volver atrás desde un año a la lista de años
    if (prevAnio !== null && anioSeleccionado === null) {
      if (scrollAniosRef.current !== null) {
        const destino = scrollAniosRef.current;
        scrollAniosRef.current = null;
        restaurarScroll(destino);
      }
      return;
    }

    // 6. Entrar a un año
    if (prevAnio === null && anioSeleccionado !== null) {
      const el = document.getElementById('seccion-historial');
      if (el) {
        const topOffset = el.getBoundingClientRect().top + window.scrollY - 20;
        window.scrollTo({ top: Math.max(0, topOffset), behavior: 'instant' });
      }
      return;
    }
  }, [serieSeleccionadaTotal, anioSeleccionado, mesSeleccionado, restaurarScroll]);

  const handleCambiarVistaTotal = (nuevaVista) => {
    ignorarScrollRef.current = true;
    setVistaTotal(nuevaVista);
    setTimeout(() => {
      ignorarScrollRef.current = false;
    }, 150);
  };

  const handleSeleccionarSerieTotal = (serie) => {
    if (serie) {
      scrollCatalogRef.current = window.scrollY;
    }
    setSerieSeleccionadaTotal(serie);
  };

  const handleSeleccionarAnio = (anio) => {
    if (anio !== null) {
      scrollAniosRef.current = window.scrollY;
    }
    setAnioSeleccionado(anio);
  };

  const handleSeleccionarMes = (mes) => {
    if (mes !== null) {
      scrollMesesRef.current = window.scrollY;
    }
    setMesSeleccionado(mes);
  };

  // Botón flotante para volver cuando el usuario scrollea hacia abajo
  const [mostrarBotonFlotanteVolver, setMostrarBotonFlotanteVolver] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const dentroDeDetalle = Boolean(serieSeleccionadaTotal || mesSeleccionado !== null || anioSeleccionado !== null);
      if (dentroDeDetalle && window.scrollY > 250) {
        setMostrarBotonFlotanteVolver(true);
      } else {
        setMostrarBotonFlotanteVolver(false);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [serieSeleccionadaTotal, mesSeleccionado, anioSeleccionado]);

  // -------------------------------------------------------------
  // 📱 NAVEGACIÓN CON BOTÓN FÍSICO "ATRÁS" DE ANDROID / MÓVIL
  // -------------------------------------------------------------
  const estadoNavRef = useRef({});
  useEffect(() => {
    estadoNavRef.current = {
      dialogoConfirmar,
      serieParaEditar,
      itemDetalle,
      serieParaDetalleXRay,
      modalNetflixAbierto,
      modalAmigosAbierto,
      serieSeleccionadaTotal,
      mesSeleccionado,
      anioSeleccionado,
      vistaTotal,
    };
  }, [
    dialogoConfirmar,
    serieParaEditar,
    itemDetalle,
    serieParaDetalleXRay,
    modalNetflixAbierto,
    modalAmigosAbierto,
    serieSeleccionadaTotal,
    mesSeleccionado,
    anioSeleccionado,
    vistaTotal,
  ]);

  const esPorPopstateRef = useRef(false);
  const prevDepthRef = useRef(0);
  const ignorarPopstateCountRef = useRef(0);

  const depthActual = (
    (vistaTotal ? 1 : 0) +
    (serieSeleccionadaTotal ? 1 : 0) +
    (anioSeleccionado !== null ? 1 : 0) +
    (mesSeleccionado !== null ? 1 : 0) +
    (itemDetalle || serieParaEditar || serieParaDetalleXRay || modalNetflixAbierto || modalAmigosAbierto || dialogoConfirmar.abierto ? 1 : 0)
  );

  useEffect(() => {
    if (esPorPopstateRef.current) {
      esPorPopstateRef.current = false;
      prevDepthRef.current = depthActual;
      return;
    }

    if (depthActual > prevDepthRef.current) {
      const diff = depthActual - prevDepthRef.current;
      for (let i = 0; i < diff; i++) {
        window.history.pushState({ cr_depth: depthActual }, '');
      }
    } else if (depthActual < prevDepthRef.current) {
      const diff = prevDepthRef.current - depthActual;
      ignorarPopstateCountRef.current += diff;
      for (let i = 0; i < diff; i++) {
        window.history.back();
      }
    }

    prevDepthRef.current = depthActual;
  }, [depthActual]);

  useEffect(() => {
    const handlePopState = () => {
      if (ignorarPopstateCountRef.current > 0) {
        ignorarPopstateCountRef.current--;
        return;
      }

      const cur = estadoNavRef.current;
      esPorPopstateRef.current = true;

      if (cur.dialogoConfirmar?.abierto) {
        setDialogoConfirmar((prev) => ({ ...prev, abierto: false }));
        return;
      }
      if (cur.itemDetalle) {
        setItemDetalle(null);
        return;
      }
      if (cur.serieParaEditar) {
        setSerieParaEditar(null);
        return;
      }
      if (cur.serieParaDetalleXRay) {
        setSerieParaDetalleXRay(null);
        return;
      }
      if (cur.modalNetflixAbierto) {
        setModalNetflixAbierto(false);
        return;
      }
      if (cur.modalAmigosAbierto) {
        setModalAmigosAbierto(false);
        return;
      }
      if (cur.serieSeleccionadaTotal) {
        setSerieSeleccionadaTotal(null);
        return;
      }
      if (cur.mesSeleccionado !== null) {
        setMesSeleccionado(null);
        return;
      }
      if (cur.anioSeleccionado !== null) {
        setAnioSeleccionado(null);
        return;
      }
      if (cur.vistaTotal) {
        setVistaTotal(false);
        return;
      }

      esPorPopstateRef.current = false;
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const cargarDatos = useCallback(async () => {
    if (!usuario?.id) {
      setSeriesActivas([]);
      setTimeline([]);
      setCargandoInicial(false);
      return;
    }

    try {
      const [series, historial] = await Promise.all([
        obtenerViendoActualmenteAPI(usuario.id),
        obtenerTimelineAPI(usuario.id, filtroTipo)
      ]);
      
      const nuevoHistorial = Array.isArray(historial) ? historial : [];
      setSeriesActivas(Array.isArray(series) ? series : []);
      setTimeline(nuevoHistorial);

      if (nuevoHistorial.length === 0) {
        setAnioSeleccionado(null);
        setMesSeleccionado(null);
        setSerieSeleccionadaTotal(null);
      }
    } catch (err) {
      console.error('Error al cargar datos:', err);
    } finally {
      setCargandoInicial(false);
    }
  }, [usuario, filtroTipo]);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos, actualizarTrigger]);

  const arbolHistorial = useMemo(() => {
    const mapa = {};
    timeline.forEach((item) => {
      if (!item.fecha_visto) return;
      const partes = String(item.fecha_visto).split('T')[0].split('-');
      if (partes.length === 3) {
        const anio = parseInt(partes[0], 10);
        const mes = parseInt(partes[1], 10) - 1;
        if (!mapa[anio]) mapa[anio] = {};
        if (!mapa[anio][mes]) mapa[anio][mes] = [];
        mapa[anio][mes].push(item);
      } else {
        const f = new Date(item.fecha_visto);
        const anio = f.getFullYear();
        const mes = f.getMonth();
        if (!mapa[anio]) mapa[anio] = {};
        if (!mapa[anio][mes]) mapa[anio][mes] = [];
        mapa[anio][mes].push(item);
      }
    });
    return mapa;
  }, [timeline]);

  const listaAnios = Object.keys(arbolHistorial).sort((a, b) => b - a);

  const toggleSeleccionItem = (id) => {
    if (id === undefined || id === null) return;
    setSeleccionadosParaBorrar((prev) => 
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const toggleSeleccionCarpeta = (itemsDeLaCarpeta = []) => {
    const idsDeLaCarpeta = itemsDeLaCarpeta
      .map((item) => (item.id !== undefined ? item.id : item.historial_id))
      .filter((id) => id !== undefined && id !== null);

    if (idsDeLaCarpeta.length === 0) return;

    setSeleccionadosParaBorrar((prev) => {
      const todosSeleccionados = idsDeLaCarpeta.every((id) => prev.includes(id));
      if (todosSeleccionados) {
        return prev.filter((id) => !idsDeLaCarpeta.includes(id));
      } else {
        const nuevoSet = new Set([...prev, ...idsDeLaCarpeta]);
        return Array.from(nuevoSet);
      }
    });
  };

  const solicitarEliminarCarpetaDirecto = (carpeta) => {
    const idsABorrar = (carpeta.items || carpeta.registros || [])
      .map((item) => (item.id !== undefined ? item.id : item.historial_id))
      .filter((id) => id !== undefined && id !== null);

    if (idsABorrar.length === 0) return;

    const esSerie = carpeta.tipo?.toLowerCase() === 'serie';
    const etiqueta = carpeta.etiqueta 
      ? `todo ${carpeta.etiqueta}` 
      : (esSerie ? `la serie "${carpeta.titulo}"` : (carpeta.esSaga ? `la saga "${carpeta.titulo}"` : `"${carpeta.titulo}"`));
    const tipoTexto = esSerie 
      ? (idsABorrar.length === 1 ? 'capítulo registrado' : 'capítulos registrados')
      : (idsABorrar.length === 1 ? 'obra' : 'obras');

    setDialogoConfirmar({
      abierto: true,
      titulo: `¿Eliminar ${etiqueta}?`,
      mensaje: `Se quitarán permanentemente las ${idsABorrar.length} ${tipoTexto} de tu cuenta y diario.`,
      onConfirm: async () => {
        setDialogoConfirmar((prev) => ({ ...prev, abierto: false }));
        setSerieSeleccionadaTotal(null);
        try {
          await eliminarLoteAPI(idsABorrar);
          await cargarDatos();
        } catch (err) {
          console.error('Error al eliminar en lote:', err);
          cargarDatos();
        }
      },
    });
  };

  const solicitarEliminarItemDirecto = (item) => {
    const idABorrar = item.id !== undefined ? item.id : item.historial_id;
    if (!idABorrar) return;

    const esCap = Boolean(item.temporada);
    const titulo = item.titulo || 'este registro';
    const sub = esCap ? `(T${item.temporada} · E${item.episodio})` : '';

    setDialogoConfirmar({
      abierto: true,
      titulo: `¿Eliminar "${titulo}" ${sub}?`,
      mensaje: `Se quitará este registro de tu cuenta y diario.`,
      onConfirm: async () => {
        setDialogoConfirmar((prev) => ({ ...prev, abierto: false }));

        setSerieSeleccionadaTotal((prev) => {
          if (!prev) return null;
          const nuevosRegistros = (prev.registros || []).filter((reg) => {
            const regId = reg.id !== undefined ? reg.id : reg.historial_id;
            return regId !== idABorrar;
          });
          if (nuevosRegistros.length === 0) return null;
          return { ...prev, registros: nuevosRegistros };
        });

        try {
          await eliminarVisualizacionAPI(idABorrar);
          await cargarDatos();
        } catch (err) {
          console.error('Error al eliminar registro:', err);
          cargarDatos();
        }
      },
    });
  };

  const handleAvanzar = async (serie, amigos = [], extra = {}) => {
    if (!usuario?.id) return;
    try {
      const pasaDeTemporada = serie.siguiente_temporada && Number(serie.siguiente_temporada) > Number(serie.temporada);

      await avanzarCapituloAPI({
        usuario_id: usuario.id,
        obra_id: serie.obra_id,
        temporada: serie.siguiente_temporada ?? serie.temporada,
        episodio_actual: pasaDeTemporada ? 0 : (serie.episodio_actual ?? serie.episodio),
        plataforma: serie.plataforma,
        amigos_etiquetados: amigos,
        calificacion: extra?.calificacion || null,
        resenia: extra?.resenia || null,
      });
      await cargarDatos();
    } catch (err) {
      console.error('Error al avanzar capítulo:', err);
    }
  };

  const solicitarEliminarLote = () => {
    if (seleccionadosParaBorrar.length === 0) return;
    setDialogoConfirmar({
      abierto: true,
      titulo: `¿Eliminar ${seleccionadosParaBorrar.length} registros?`,
      mensaje: 'Los registros seleccionados se quitarán permanentemente de tu cuenta.',
      onConfirm: async () => {
        const idsABorrar = [...seleccionadosParaBorrar];

        setDialogoConfirmar((prev) => ({ ...prev, abierto: false }));
        setModoSeleccion(false);
        setSeleccionadosParaBorrar([]);

        setSerieSeleccionadaTotal((prev) => {
          if (!prev) return null;
          const nuevosRegistros = prev.registros.filter((reg) => {
            const regId = reg.id !== undefined ? reg.id : reg.historial_id;
            return !idsABorrar.includes(regId);
          });
          if (nuevosRegistros.length === 0) return null;
          return { ...prev, registros: nuevosRegistros };
        });

        try {
          await eliminarLoteAPI(idsABorrar);
          await cargarDatos();
        } catch (err) {
          console.error('Error al eliminar en lote:', err);
          cargarDatos();
        }
      },
    });
  };

  const solicitarDescartarViendo = (obraId) => {
    if (!usuario?.id) return;
    setDialogoConfirmar({
      abierto: true,
      titulo: '¿Quitar de Viendo Actualmente?',
      mensaje: 'La serie se ocultará del carrusel superior, pero todo tu historial se conservará.',
      onConfirm: async () => {
        try {
          await descartarViendoAPI(usuario.id, obraId);
          cargarDatos();
        } finally {
          setDialogoConfirmar((prev) => ({ ...prev, abierto: false }));
        }
      },
    });
  };

  // -------------------------------------------------------------
  // LANDING PAGE CINEMÁTICA CUANDO NO HAY SESIÓN INICIADA
  // -------------------------------------------------------------
  if (!usuario) {
    return (
      <main className="min-h-screen bg-transparent text-neutral-900 dark:text-neutral-100 selection:bg-rose-600 selection:text-white relative overflow-hidden transition-colors duration-300 w-full max-w-full">
        
        {/* Glow ambiental superior */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[800px] h-[350px] bg-gradient-to-b from-rose-500/15 via-rose-900/5 to-transparent blur-3xl pointer-events-none overflow-hidden" />

        {/* HERO SECTION */}
        <section className="relative max-w-6xl mx-auto px-4 sm:px-6 pt-10 sm:pt-16 pb-12 text-center space-y-7">
          
          <div className="space-y-3 max-w-3xl mx-auto">
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-neutral-900 dark:text-white leading-[1.15] text-balance">
              Todo lo que ves,{' '}
              <span className="bg-gradient-to-r from-rose-500 via-rose-400 to-amber-400 bg-clip-text text-transparent">
                organizado en un solo lugar.
              </span>
            </h1>
            <p className="text-sm sm:text-base text-neutral-600 dark:text-neutral-400 max-w-xl mx-auto leading-relaxed text-balance pt-1">
              Lleva el registro de tus series y películas. Documenta cada capítulo, la plataforma y con quién lo viste, y revive tu año con estadísticas interactivas.
            </p>
          </div>

          {/* Botones de acción principales */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-1 w-full max-w-xs sm:max-w-none mx-auto">
            <button
              type="button"
              onClick={() => setModalAuthLandingAbierto(true)}
              className="w-full sm:w-auto px-7 py-3 rounded-xl bg-rose-600 hover:bg-rose-500 active:scale-95 text-white font-extrabold text-sm shadow-lg shadow-rose-950/20 transition-all flex items-center justify-center gap-2 cursor-pointer group"
            >
              <span>Comenzar mi diario gratis</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              type="button"
              onClick={() => navigate('/tendencias')}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-neutral-200/70 dark:bg-white/5 hover:bg-neutral-300/80 dark:hover:bg-white/10 text-neutral-800 dark:text-neutral-200 border border-neutral-300/70 dark:border-white/10 text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Flame className="w-4 h-4 text-amber-500" />
              <span>Explorar Tendencias</span>
            </button>
          </div>

          {/* SHOWCASE / MOCKUP EN VIVO RESPONSIVE */}
          <div className="pt-6 max-w-4xl mx-auto">
            <div className="relative rounded-2xl sm:rounded-3xl bg-white dark:bg-[#141620] border border-neutral-200 dark:border-white/10 p-4 sm:p-7 shadow-xl shadow-neutral-900/5 dark:shadow-2xl overflow-hidden text-left transition-colors">
              
              {/* Barra de ventana estilo Mac */}
              <div className="flex items-center justify-between border-b border-neutral-200 dark:border-white/10 pb-3 sm:pb-4 mb-5">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-rose-500/80" />
                  <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-amber-500/80" />
                  <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-emerald-500/80" />
                  <span className="text-[11px] sm:text-xs font-mono text-neutral-500 dark:text-neutral-400 ml-1.5 truncate">
                    CineRewind Live Preview
                  </span>
                </div>
              </div>

              {/* Fila 1: Showcase de Viendo Actualmente */}
              <div className="space-y-3 mb-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-neutral-500 dark:text-neutral-400 flex items-center gap-1.5">
                    <Tv className="w-3.5 h-3.5 text-rose-500" /> Siguiendo actualmente
                  </span>
                  <span className="text-[10px] text-neutral-400 dark:text-neutral-500 font-mono">Seguimiento automático</span>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
                  {/* Succession */}
                  <div className="bg-neutral-100/80 dark:bg-[#1b1e2b] border border-neutral-200 dark:border-white/10 rounded-xl sm:rounded-2xl p-2.5 sm:p-3 flex items-center gap-3">
                    <img 
                      src="https://image.tmdb.org/t/p/w500/z0XiwdrCQ9yVIr4O0pxzaAYRxdW.jpg" 
                      alt="Succession" 
                      className="w-11 h-15 sm:w-12 sm:h-16 rounded-lg object-cover flex-shrink-0 shadow-sm"
                      loading="lazy"
                    />
                    <div className="min-w-0 flex-1 space-y-1">
                      <h4 className="text-xs font-bold text-neutral-900 dark:text-white truncate">Succession</h4>
                      <div className="w-full h-1.5 bg-neutral-200 dark:bg-neutral-800 rounded-full overflow-hidden">
                        <div className="w-[65%] h-full bg-rose-500 rounded-full" />
                      </div>
                      <span className="text-[10px] font-bold text-neutral-500 dark:text-neutral-400 block">Siguiente: T04 E03</span>
                    </div>
                  </div>

                  {/* The Last of Us */}
                  <div className="bg-neutral-100/80 dark:bg-[#1b1e2b] border border-neutral-200 dark:border-white/10 rounded-xl sm:rounded-2xl p-2.5 sm:p-3 flex items-center gap-3">
                    <img 
                      src="https://image.tmdb.org/t/p/w500/dmo6TYuuJgaYinXBPjrgG9mB5od.jpg" 
                      alt="The Last of Us" 
                      className="w-11 h-15 sm:w-12 sm:h-16 rounded-lg object-cover flex-shrink-0 shadow-sm"
                      loading="lazy"
                    />
                    <div className="min-w-0 flex-1 space-y-1">
                      <h4 className="text-xs font-bold text-neutral-900 dark:text-white truncate">The Last of Us</h4>
                      <div className="w-full h-1.5 bg-neutral-200 dark:bg-neutral-800 rounded-full overflow-hidden">
                        <div className="w-[85%] h-full bg-rose-500 rounded-full" />
                      </div>
                      <span className="text-[10px] font-bold text-neutral-500 dark:text-neutral-400 block">Siguiente: T01 E07</span>
                    </div>
                  </div>

                  {/* Breaking Bad */}
                  <div className="bg-neutral-100/80 dark:bg-[#1b1e2b] border border-neutral-200 dark:border-white/10 rounded-xl sm:rounded-2xl p-2.5 sm:p-3 flex items-center gap-3">
                    <img 
                      src="https://image.tmdb.org/t/p/w500/anFx9aTOOYqgS3v7x3R84Kz67ly.jpg" 
                      alt="Breaking Bad" 
                      className="w-11 h-15 sm:w-12 sm:h-16 rounded-lg object-cover flex-shrink-0 shadow-sm"
                      loading="lazy"
                    />
                    <div className="min-w-0 flex-1 space-y-1">
                      <h4 className="text-xs font-bold text-neutral-900 dark:text-white truncate">Breaking Bad</h4>
                      <div className="w-full h-1.5 bg-neutral-200 dark:bg-neutral-800 rounded-full overflow-hidden">
                        <div className="w-[92%] h-full bg-rose-500 rounded-full" />
                      </div>
                      <span className="text-[10px] font-bold text-neutral-500 dark:text-neutral-400 block">Siguiente: T05 E15</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Fila 2: Showcase de Línea de Tiempo */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-neutral-500 dark:text-neutral-400 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-rose-500" /> Línea de tiempo
                  </span>
                  <span className="text-[10px] text-neutral-400 dark:text-neutral-500 font-mono">Historial cronológico</span>
                </div>

                <div className="bg-neutral-100/80 dark:bg-[#1b1e2b]/80 border border-neutral-200 dark:border-white/10 rounded-xl sm:rounded-2xl p-3 sm:p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <img 
                      src="https://image.tmdb.org/t/p/w500/6izwz7rsy95ARzTR3poZ8H6c5pp.jpg" 
                      alt="Dune: Part Two" 
                      className="w-10 h-14 sm:w-11 sm:h-16 rounded-lg object-cover flex-shrink-0 shadow-sm"
                      loading="lazy"
                    />
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-neutral-900 dark:text-white">Dune: Part Two</span>
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-blue-600 text-white">MAX</span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-neutral-500 dark:text-neutral-400">
                        <span className="text-amber-500 font-bold">★ 5.0</span>
                        <span>·</span>
                        <span>18 Mar 2024</span>
                        <span>·</span>
                        <span>Película</span>
                      </div>
                    </div>
                  </div>

                  <span className="text-xs text-neutral-500 dark:text-neutral-400 italic sm:max-w-xs truncate w-full sm:w-auto">
                    "Espectáculo sonoro y visual supremo."
                  </span>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* FUNCIONES PRINCIPALES / PILARES */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-16 border-t border-neutral-200 dark:border-white/10">
          <div className="text-center space-y-1.5 mb-8 sm:mb-10">
            <h2 className="text-2xl sm:text-3xl font-black text-neutral-900 dark:text-white tracking-tight">
              Todo para seguir lo que ves
            </h2>
            <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 max-w-lg mx-auto">
              Seguimiento automático, co-visualización con amigos y estadísticas anuales.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-5">
            {/* Pilar 1 */}
            <div className="bg-white dark:bg-[#141620] border border-neutral-200 dark:border-white/10 hover:border-rose-500/40 rounded-2xl p-5 space-y-2.5 transition-colors shadow-sm">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-neutral-900 dark:text-white text-base">Tracker Activo</h3>
              <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
                Marca un capítulo como visto y el sistema avanza automáticamente al siguiente sin perder el hilo de tus temporadas.
              </p>
            </div>

            {/* Pilar 2 */}
            <div className="bg-white dark:bg-[#141620] border border-neutral-200 dark:border-white/10 hover:border-rose-500/40 rounded-2xl p-5 space-y-2.5 transition-colors shadow-sm">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500">
                <Users className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-neutral-900 dark:text-white text-base">Co-visualización</h3>
              <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
                Etiqueta a tus amigos al registrar una obra. Al confirmar, se agrega a su propio diario en un solo clic.
              </p>
            </div>

            {/* Pilar 3 */}
            <div className="bg-white dark:bg-[#141620] border border-neutral-200 dark:border-white/10 hover:border-rose-500/40 rounded-2xl p-5 space-y-2.5 transition-colors shadow-sm">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500">
                <Clock className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-neutral-900 dark:text-white text-base">Línea de Tiempo</h3>
              <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
                Navega cronológicamente por años y meses, o busca en tu catálogo personal de manera inmediata.
              </p>
            </div>

            {/* Pilar 4 */}
            <div className="bg-white dark:bg-[#141620] border border-neutral-200 dark:border-white/10 hover:border-rose-500/40 rounded-2xl p-5 space-y-2.5 transition-colors shadow-sm">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500">
                <Sparkles className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-neutral-900 dark:text-white text-base">Wrapped & Estadísticas</h3>
              <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
                Descubre tus horas totales de pantalla, tu día preferido de reproducción, tu actor más visto y tu diagnóstico anual.
              </p>
            </div>
          </div>
        </section>

        {/* MODAL AUTH DESDE EL LANDING */}
        <ModalAuth 
          isOpen={modalAuthLandingAbierto}
          onClose={() => setModalAuthLandingAbierto(false)}
        />

      </main>
    );
  }

  // -------------------------------------------------------------
  // VISTA PRINCIPAL CUANDO EL USUARIO TIENE SESIÓN INICIADA
  // -------------------------------------------------------------
  if (cargandoInicial) {
    return (
      <main className="max-w-7xl mx-auto px-4 sm:px-8 py-20 flex items-center justify-center min-h-[50vh]">
        <div className="flex flex-col items-center gap-3 text-neutral-400">
          <div className="w-8 h-8 rounded-full border-2 border-rose-500 border-t-transparent animate-spin" />
          <span className="text-xs font-mono">Cargando tu catálogo...</span>
        </div>
      </main>
    );
  }

  const esCuentaVacia = !filtroTipo && !busquedaHistorial && timeline.length === 0 && seriesActivas.length === 0;

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-8 py-8 sm:py-10 space-y-10 sm:space-y-12">
      {esCuentaVacia ? (
        <OnboardingBienvenida 
          usuario={usuario}
          onSeleccionarObra={(obra) => setSerieParaEditar(obra)}
          onAbrirImportarNetflix={() => setModalNetflixAbierto(true)}
          onAbrirModalAmigos={() => setModalAmigosAbierto(true)}
        />
      ) : (
        <>
          {/* 1. Carrusel de Series Activas */}
          <CarruselViendo 
            seriesActivas={seriesActivas}
            onAvanzar={handleAvanzar}
            onDescartar={solicitarDescartarViendo}
            onVerInfoEpisodio={(item) => setSerieParaDetalleXRay(item)}
            onAbrirDetalle={(item) => {
              setSerieParaEditar({
                tmdb_id: item.tmdb_id,
                titulo: item.titulo,
                poster_path: item.poster_path,
                tipo: 'serie',
              });
            }}
          />

          {/* 2. Mi Diario Cinemático y Total Histórico */}
          <section id="seccion-historial" className="!mt-[35px] sm:!mt-[50px] space-y-3 scroll-mt-20 relative z-10">
            <HeaderHistorial 
              vistaTotal={vistaTotal}
              setVistaTotal={handleCambiarVistaTotal}
              serieSeleccionadaTotal={serieSeleccionadaTotal}
              setSerieSeleccionadaTotal={handleSeleccionarSerieTotal}
              anioSeleccionado={anioSeleccionado}
              mesSeleccionado={mesSeleccionado}
              onVolverAnios={() => { 
                setAnioSeleccionado(null); 
                setMesSeleccionado(null); 
                setSerieSeleccionadaTotal(null);
              }}
              onVolverMeses={() => {
                setMesSeleccionado(null);
                setSerieSeleccionadaTotal(null);
              }}
              modoSeleccion={modoSeleccion}
              setModoSeleccion={setModoSeleccion}
              setSeleccionadosParaBorrar={setSeleccionadosParaBorrar}
              filtroTipo={filtroTipo}
              setFiltroTipo={setFiltroTipo}
              busquedaHistorial={busquedaHistorial}
              setBusquedaHistorial={setBusquedaHistorial}
              soloConAmigos={soloConAmigos}
              setSoloConAmigos={setSoloConAmigos}
              amigosFiltro={amigosFiltro}
              setAmigosFiltro={setAmigosFiltro}
              ordenTotal={ordenTotal}
              setOrdenTotal={setOrdenTotal}
              timelineCompleto={timeline}
            />

            <GrillaHistorial 
              vistaTotal={vistaTotal}
              serieSeleccionadaTotal={serieSeleccionadaTotal}
              setSerieSeleccionadaTotal={handleSeleccionarSerieTotal}
              anioSeleccionado={anioSeleccionado}
              mesSeleccionado={mesSeleccionado}
              arbolHistorial={arbolHistorial}
              listaAnios={listaAnios}
              timelineCompleto={timeline}
              ordenTotal={ordenTotal}
              onSeleccionarAnio={handleSeleccionarAnio}
              onSeleccionarMes={handleSeleccionarMes}
              modoSeleccion={modoSeleccion}
              seleccionadosParaBorrar={seleccionadosParaBorrar}
              onToggleItem={toggleSeleccionItem}
              onToggleCarpeta={toggleSeleccionCarpeta}
              onEliminarCarpetaDirecto={solicitarEliminarCarpetaDirecto}
              onEliminarSerieDirecto={solicitarEliminarCarpetaDirecto}
              onEliminarItemDirecto={solicitarEliminarItemDirecto}
              onRecargarDatos={cargarDatos}
              onAbrirRegistrar={(obra) => setSerieParaEditar(obra)}
              onAbrirDetalleTimeline={(item) => setItemDetalle(item)}
              busquedaHistorial={busquedaHistorial}
              filtroTipo={filtroTipo}
              soloConAmigos={soloConAmigos}
              amigosFiltro={amigosFiltro}
            />
          </section>
        </>
      )}

      {/* 3. Barra Flotante de Borrado Masivo */}
      {modoSeleccion && (
        <BarraAccionLote 
          cantidadSeleccionada={seleccionadosParaBorrar.length}
          onEliminar={solicitarEliminarLote}
          onCancelar={() => {
            setModoSeleccion(false);
            setSeleccionadosParaBorrar([]);
          }}
        />
      )}

      {/* 4. Modales Globales */}
      {serieParaEditar && (
        <ModalRegistrar 
          obra={serieParaEditar} 
          onClose={() => setSerieParaEditar(null)} 
          onRegistroCompletado={() => { cargarDatos(); setSerieParaEditar(null); }} 
        />
      )}

      {serieParaDetalleXRay && (
        <ModalDetalleEpisodioViendo 
          serie={serieParaDetalleXRay}
          onClose={() => setSerieParaDetalleXRay(null)}
          onMarcarVisto={handleAvanzar}
          onSeleccionarObra={(obraDelActor) => {
            setSerieParaDetalleXRay(null);
            setSerieParaEditar(obraDelActor);
          }}
        />
      )}

      {itemDetalle && (
        <ModalDetalleTimeline 
          item={itemDetalle}
          todasLasVisualizaciones={timeline} 
          onClose={() => setItemDetalle(null)}
          onActualizado={() => { cargarDatos(); setItemDetalle(null); }} 
          onSeleccionarObra={(obraDelActor) => {
            setItemDetalle(null);
            setSerieParaEditar(obraDelActor);
          }}
        />
      )}

      <ModalImportarNetflix 
        abierto={modalNetflixAbierto}
        alCerrar={() => setModalNetflixAbierto(false)}
        alCompletar={() => {
          cargarDatos();
        }}
      />

      {modalAmigosAbierto && (
        <ModalAmigos 
          onClose={() => setModalAmigosAbierto(false)}
          onActualizado={() => {
            cargarDatos();
          }}
        />
      )}

      <ModalConfirmar
        isOpen={dialogoConfirmar.abierto}
        titulo={dialogoConfirmar.titulo}
        mensaje={dialogoConfirmar.mensaje}
        onConfirm={dialogoConfirmar.onConfirm}
        onCancel={() => setDialogoConfirmar((prev) => ({ ...prev, abierto: false }))}
      />

      {/* 5. Botón flotante para volver atrás desde cualquier punto sin scrollear hasta arriba */}
      {mostrarBotonFlotanteVolver && (
        <div className="fixed bottom-6 left-6 z-40 animate-fadeIn">
          <button
            type="button"
            onClick={() => {
              if (serieSeleccionadaTotal) {
                handleSeleccionarSerieTotal(null);
              } else if (mesSeleccionado !== null) {
                handleSeleccionarMes(null);
              } else if (anioSeleccionado !== null) {
                handleSeleccionarAnio(null);
              }
            }}
            className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-neutral-900/95 dark:bg-[#141620]/95 hover:bg-rose-600 text-white font-black text-xs shadow-2xl border border-white/20 hover:border-rose-400 backdrop-blur-md transition-all duration-200 cursor-pointer active:scale-95 hover:scale-105 group"
            title="Volver atrás sin subir la pantalla"
          >
            <ArrowLeft className="w-4 h-4 text-rose-500 group-hover:text-white transition-colors" />
            <span>
              {serieSeleccionadaTotal 
                ? 'Volver al catálogo' 
                : mesSeleccionado !== null 
                ? 'Volver a meses' 
                : 'Volver a años'}
            </span>
          </button>
        </div>
      )}
    </main>
  );
}