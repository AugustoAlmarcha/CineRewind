import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { BookOpen, Tv, Bookmark, Users, FileSpreadsheet, ChevronRight, ChevronLeft, Lock, Trash2 } from 'lucide-react';

// Componentes modulares
import HeroPerfil from '../components/perfil/HeroPerfil';
import VitrinaTop4 from '../components/perfil/VitrinaTop4';
import PestanaResenias from '../components/perfil/PestanaResenias';
import PestanaViendo from '../components/perfil/PestanaViendo';
import PestanaPendientes from '../components/perfil/PestanaPendientes';
import PestanaCovisiones from '../components/perfil/PestanaCovisiones';

// Modales
import ModalEditarPerfil from '../components/modal/ModalEditarPerfil';
import ModalElegirFavorito from '../components/modal/ModalElegirFavorito';
import ModalRegistrar from '../components/modal/ModalRegistrar';
import ModalImportarNetflix from '../components/modal/ModalImportarNetflix';
import ModalAmigos from '../components/modal/ModalAmigos';
import ModalWrapped from '../components/modal/ModalWrapped';
import ModalSelectorPeriodoWrapped from '../components/modal/ModalSelectorPeriodoWrapped';
import ModalDetalleTimeline from '../components/modal/ModalDetalleTimeline';
import { obtenerFechaHoyLocal } from '../utils/fechas';

import { 
  actualizarPerfilAPI, 
  obtenerFavoritosAPI, 
  guardarFavoritoAPI, 
  eliminarFavoritoAPI,
  obtenerEstadisticasAPI,
  obtenerPendientesAPI,
  eliminarPendienteAPI,
  obtenerTimelineAPI,
  obtenerViendoActualmenteAPI,
  avanzarCapituloAPI,
  obtenerWrappedPeriodoAPI,
  obtenerPerfilPublicoAPI,
  enviarSolicitudAmistadAPI,
  responderSolicitudAmistadAPI,
  eliminarAmigoAPI,
  obtenerCalificacionesSeriesUsuarioAPI
} from '../api';


export default function Perfil() {
  const { usuario, cargandoAuth, actualizarUsuario, iniciarSesion } = useAuth();
  const { username: paramUsername } = useParams();
  const navigate = useNavigate();

  // Determinamos si estamos viendo nuestro propio perfil o el de un amigo
  const esMiPerfil = useMemo(() => {
    if (!paramUsername) return true;
    if (!usuario?.username) return false;
    return usuario.username.toLowerCase() === paramUsername.toLowerCase();
  }, [paramUsername, usuario?.username]);

  // Estado del perfil visitado si no es el propio
  const [perfilVisitado, setPerfilVisitado] = useState(null);
  const [cargandoPerfil, setCargandoPerfil] = useState(false);
  const [usuarioNoEncontrado, setUsuarioNoEncontrado] = useState(false);

  // Estados de navegación
  const [activeTab, setActiveTab] = useState('resenias');
  const [top4Mode, setTop4Mode] = useState('serie');

  // Modales
  const [modalEditarAbierto, setModalEditarAbierto] = useState(false);
  const [subpestanaEditar, setSubpestanaEditar] = useState('info');
  const [obraParaRegistrar, setObraParaRegistrar] = useState(null);
  const [modalNetflixAbierto, setModalNetflixAbierto] = useState(false);
  const [modalAmigosAbierto, setModalAmigosAbierto] = useState(false);
  const [itemDetalle, setItemDetalle] = useState(null);

  // Datos
  const [stats, setStats] = useState({ total_series: 0, total_episodios: 0, total_peliculas: 0, horas_totales: 0 });
  const [favoritos, setFavoritos] = useState([]);
  const [modalFavoritoAbierto, setModalFavoritoAbierto] = useState(false);
  const [ranuraSeleccionada, setRanuraSeleccionada] = useState(null);
  const [tipoFavorito, setTipoFavorito] = useState('serie');
  const [arrastrandoSlot, setArrastrandoSlot] = useState(null);

  const [timeline, setTimeline] = useState([]);
  const [calificacionesSeries, setCalificacionesSeries] = useState([]);
  const [obrasViendo, setObrasViendo] = useState([]);
  const [pendientes, setPendientes] = useState([]);
  const [cargandoPendientes, setCargandoPendientes] = useState(false);

  // Wrapped
  const [modalWrappedAbierto, setModalWrappedAbierto] = useState(false);
  const [selectorWrappedAbierto, setSelectorWrappedAbierto] = useState(false);
  const [datosWrapped, setDatosWrapped] = useState(null);
  const [cargandoWrapped, setCargandoWrapped] = useState(false);
  const [toastNotificacion, setToastNotificacion] = useState(null);
  const [mostrarConfirmarEliminarAmigo, setMostrarConfirmarEliminarAmigo] = useState(false);

  // Detección de scroll horizontal en pestañas para móviles
  const tabsContainerRef = useRef(null);
  const [puedeScrollearDerecha, setPuedeScrollearDerecha] = useState(true);
  const [puedeScrollearIzquierda, setPuedeScrollearIzquierda] = useState(false);

  const verificarScrollTabs = useCallback(() => {
    const el = tabsContainerRef.current;
    if (!el) return;
    const tieneScrollDerecha = el.scrollWidth > el.clientWidth && el.scrollLeft + el.clientWidth < el.scrollWidth - 10;
    const tieneScrollIzquierda = el.scrollLeft > 10;
    setPuedeScrollearDerecha(tieneScrollDerecha);
    setPuedeScrollearIzquierda(tieneScrollIzquierda);
  }, []);

  useEffect(() => {
    verificarScrollTabs();
    window.addEventListener('resize', verificarScrollTabs);
    return () => window.removeEventListener('resize', verificarScrollTabs);
  }, [verificarScrollTabs, activeTab]);

  const scrollearTabsDerecha = () => {
    if (tabsContainerRef.current) {
      tabsContainerRef.current.scrollBy({ left: 160, behavior: 'smooth' });
    }
  };

  const scrollearTabsIzquierda = () => {
    if (tabsContainerRef.current) {
      tabsContainerRef.current.scrollBy({ left: -160, behavior: 'smooth' });
    }
  };

  const dispararToast = (mensaje, tipo = 'error') => {
    setToastNotificacion({ mensaje, tipo });
    setTimeout(() => setToastNotificacion(null), 4000);
  };

  // Carga de datos tanto para el usuario activo como para un perfil amigo visitado
  const cargarDatosPerfil = useCallback(async () => {
    setUsuarioNoEncontrado(false);

    // 1. Caso: Mi Propio Perfil
    if (esMiPerfil) {
      if (!usuario?.id || !usuario?.username) return;
      setCargandoPerfil(false);
      try {
        const [s, f, v, t, p, cs] = await Promise.all([
          obtenerEstadisticasAPI(usuario.id),
          obtenerFavoritosAPI(usuario.username),
          obtenerViendoActualmenteAPI(usuario.id),
          obtenerTimelineAPI(usuario.id),
          obtenerPendientesAPI(usuario.id),
          obtenerCalificacionesSeriesUsuarioAPI(usuario.id)
        ]);

        setStats(s || { total_series: 0, total_episodios: 0, total_peliculas: 0, horas_totales: 0 });
        setFavoritos(Array.isArray(f) ? f : []);
        setObrasViendo(Array.isArray(v) ? v : []);
        setTimeline(Array.isArray(t) ? t : []);
        setPendientes(Array.isArray(p) ? p : []);
        setCalificacionesSeries(Array.isArray(cs) ? cs : []);
      } catch (err) {
        console.error('Error al cargar datos del perfil propio:', err);
      }
      return;
    }

    // 2. Caso: Perfil de Amigo o Usuario de la Red
    if (paramUsername) {
      setCargandoPerfil(true);
      try {
        const usuarioExterno = await obtenerPerfilPublicoAPI(paramUsername);
        setPerfilVisitado(usuarioExterno);

        const [s, f, v, t, p, cs] = await Promise.all([
          obtenerEstadisticasAPI(usuarioExterno.id),
          obtenerFavoritosAPI(usuarioExterno.username),
          obtenerViendoActualmenteAPI(usuarioExterno.id),
          obtenerTimelineAPI(usuarioExterno.id),
          obtenerPendientesAPI(usuarioExterno.id),
          obtenerCalificacionesSeriesUsuarioAPI(usuarioExterno.id)
        ]);

        setStats(s || { total_series: 0, total_episodios: 0, total_peliculas: 0, horas_totales: 0 });
        setFavoritos(Array.isArray(f) ? f : []);
        setObrasViendo(Array.isArray(v) ? v : []);
        setTimeline(Array.isArray(t) ? t : []);
        setPendientes(Array.isArray(p) ? p : []);
        setCalificacionesSeries(Array.isArray(cs) ? cs : []);
      } catch (err) {
        console.error('Error al cargar datos del perfil visitado:', err);
        setUsuarioNoEncontrado(true);
      } finally {
        setCargandoPerfil(false);
      }
    }
  }, [esMiPerfil, usuario?.id, usuario?.username, paramUsername]);


  useEffect(() => {
    cargarDatosPerfil();
  }, [cargarDatosPerfil]);

  // Acciones sociales en perfil de amigo
  const handleEnviarSolicitudAmigo = async () => {
    if (!usuario) {
      dispararToast('Debes iniciar sesión para conectar con amigos', 'error');
      return;
    }
    if (!perfilVisitado?.id) return;
    try {
      await enviarSolicitudAmistadAPI(perfilVisitado.id);
      setPerfilVisitado((prev) => ({ ...prev, estado_relacion: 'solicitud_enviada' }));
      dispararToast('¡Solicitud de amistad enviada con éxito!', 'exito');
    } catch (err) {
      dispararToast(err.message || 'No se pudo enviar la solicitud', 'error');
    }
  };

  const handleAceptarSolicitudAmigo = async () => {
    if (!perfilVisitado?.amistad_id) return;
    try {
      await responderSolicitudAmistadAPI(perfilVisitado.amistad_id, 'aceptar');
      setPerfilVisitado((prev) => ({ ...prev, estado_relacion: 'amigos' }));
      dispararToast('¡Solicitud aceptada! Ahora son amigos.', 'exito');
    } catch (err) {
      dispararToast(err.message || 'Error al aceptar la solicitud', 'error');
    }
  };

  const handleEliminarAmigo = () => {
    if (!perfilVisitado) return;
    setMostrarConfirmarEliminarAmigo(true);
  };

  const ejecutarEliminarAmigo = async () => {
    if (!perfilVisitado) return;
    const nombre = perfilVisitado.nombre || perfilVisitado.username;
    try {
      const idParaEliminar = perfilVisitado.amistad_id || perfilVisitado.id;
      const res = await eliminarAmigoAPI(idParaEliminar);
      setPerfilVisitado((prev) => ({ ...prev, estado_relacion: 'ninguno' }));
      dispararToast(res.mensaje || `Has eliminado a ${nombre} de tus amigos`, 'exito');
      setMostrarConfirmarEliminarAmigo(false);
    } catch (err) {
      dispararToast(err.message || 'No se pudo eliminar al amigo', 'error');
      setMostrarConfirmarEliminarAmigo(false);
    }
  };

  // Manejador para avanzar capítulo (solo en perfil propio)
  const handleAvanzarCapitulo = async (obraId, temporada, ultimoEp) => {
    if (!esMiPerfil) return;
    try {
      await avanzarCapituloAPI({
        obra_id: obraId,
        temporada: temporada || 1,
        episodio: (ultimoEp || 0) + 1,
        fecha_visto: obtenerFechaHoyLocal()
      });
      await cargarDatosPerfil();
    } catch (err) {
      console.error('Error al avanzar capítulo:', err);
    }
  };

  // Favoritos (solo en perfil propio)
  const handleDropIntercambio = async (posicionDestino, tipo) => {
    if (!esMiPerfil) return;
    if (!arrastrandoSlot || arrastrandoSlot === posicionDestino) {
      setArrastrandoSlot(null);
      return;
    }
    const origen = favoritos.find((f) => f.posicion === arrastrandoSlot && f.tipo === tipo);
    const destino = favoritos.find((f) => f.posicion === posicionDestino && f.tipo === tipo);

    try {
      if (origen && destino) {
        await guardarFavoritoAPI({ ...origen, posicion: posicionDestino });
        await guardarFavoritoAPI({ ...destino, posicion: arrastrandoSlot });
      } else if (origen && !destino) {
        await guardarFavoritoAPI({ ...origen, posicion: posicionDestino });
        await eliminarFavoritoAPI(arrastrandoSlot, tipo);
      }
      const f = await obtenerFavoritosAPI(usuario.username);
      setFavoritos(Array.isArray(f) ? f : []);
    } catch (err) {
      console.error('Error al intercambiar slots:', err);
    } finally {
      setArrastrandoSlot(null);
    }
  };

  const handleEliminarFavorito = async (e, posicion, tipo) => {
    e.stopPropagation();
    if (!esMiPerfil) return;
    try {
      await eliminarFavoritoAPI(posicion, tipo);
      const f = await obtenerFavoritosAPI(usuario.username);
      setFavoritos(Array.isArray(f) ? f : []);
    } catch (err) {
      console.error('Error al eliminar favorito:', err);
    }
  };

  const handleQuitarPendiente = async (e, tmdb_id) => {
    e.stopPropagation();
    if (!esMiPerfil) return;
    try {
      await eliminarPendienteAPI(tmdb_id);
      setPendientes((prev) => prev.filter((p) => Number(p.tmdb_id) !== Number(tmdb_id)));
    } catch (err) {
      console.error('Error al quitar pendiente:', err);
    }
  };

  const abrirWrapped = async (anio, mes = null) => {
    setCargandoWrapped(true);
    try {
      const data = await obtenerWrappedPeriodoAPI(anio, mes);
      setDatosWrapped(data);
      setSelectorWrappedAbierto(false);
      setModalWrappedAbierto(true);
    } catch (err) {
      console.error('Error Wrapped:', err);
      dispararToast(err.message || 'No se pudo cargar el festival CineRewind Wrapped', 'error');
    } finally {
      setCargandoWrapped(false);
    }
  };

  // Reseñas con texto o calificaciones con estrellas (películas, capítulos, temporadas y series completas)
  const listaSoloResenias = useMemo(() => {
    const delTimeline = (timeline || [])
      .filter((t) => 
        (t.resenia && t.resenia.trim() !== '') || 
        (t.calificacion !== null && t.calificacion !== undefined && Number(t.calificacion) > 0)
      )
      .map((t) => ({
        ...t,
        tipo_categoria: t.tipo === 'serie' ? 'capitulo' : 'pelicula'
      }));

    const idsRegistrados = new Set(delTimeline.map((t) => String(t.id || t.visualizacion_id)));

    const deSeries = (Array.isArray(calificacionesSeries) ? calificacionesSeries : [])
      .filter((cs) => !idsRegistrados.has(String(cs.id || cs.visualizacion_id)))
      .map((cs) => ({
        ...cs,
        tipo_categoria: cs.es_serie_completa ? 'serie_completa' : 'temporada'
      }));

    return [...delTimeline, ...deSeries].sort((a, b) => new Date(b.fecha_visto || 0) - new Date(a.fecha_visto || 0));
  }, [timeline, calificacionesSeries]);


  // Co-visiones combinadas
  const listaCovisionesCombinadas = useMemo(() => {
    const covisiones = {};

    timeline.forEach(t => {
      if (t.amigos_covision && Array.isArray(t.amigos_covision)) {
        t.amigos_covision.forEach(a => {
          const key = `user_${a.username}`;
          if (!covisiones[key]) {
            covisiones[key] = {
              id: a.amigo_id || a.id,
              nombre: a.nombre || a.username,
              username: `@${a.username}`,
              rawUsername: a.username,
              avatar: a.avatar_url,
              tipo: 'registrado',
              totalObras: 0,
            };
          }
          covisiones[key].totalObras += 1;
        });
      }

      if (t.visto_con_texto && t.visto_con_texto.trim() !== '') {
        const nombresSeparados = t.visto_con_texto
          .split(',')
          .map((n) => n.trim())
          .filter(Boolean);

        nombresSeparados.forEach((acompaniante) => {
          const key = `texto_${acompaniante.toLowerCase()}`;
          if (!covisiones[key]) {
            covisiones[key] = {
              nombre: acompaniante,
              username: 'Copiloto en sala',
              avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(acompaniante)}&backgroundColor=e11d48,ff7043`,
              tipo: 'texto',
              totalObras: 0,
            };
          }
          covisiones[key].totalObras += 1;
        });
      }
    });

    return Object.values(covisiones).sort((a, b) => b.totalObras - a.totalObras);
  }, [timeline]);

  // Pantallas de estado
  if (cargandoAuth || cargandoPerfil) {
    return (
      <main className="max-w-4xl mx-auto px-6 py-24 text-center">
        <p className="text-xs font-bold text-zinc-500 animate-pulse font-mono">
          {paramUsername ? `Cargando perfil de @${paramUsername}...` : 'Sincronizando perfil cinéfilo...'}
        </p>
      </main>
    );
  }

  if (usuarioNoEncontrado) {
    return (
      <main className="max-w-4xl mx-auto px-6 py-24 text-center space-y-4 animate-fadeIn">
        <div className="w-16 h-16 mx-auto rounded-3xl bg-rose-600/10 border border-rose-500/20 flex items-center justify-center text-2xl">
          🔍
        </div>
        <h2 className="text-2xl font-black text-white">Cinéfilo no encontrado</h2>
        <p className="text-xs text-zinc-400 max-w-sm mx-auto">
          No existe ningún usuario registrado con el alias <strong className="text-rose-400 font-mono">@{paramUsername}</strong>.
        </p>
        <div className="pt-2 flex items-center justify-center gap-3">
          {usuario && (
            <button
              onClick={() => navigate(`/perfil/${usuario.username}`)}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition cursor-pointer"
            >
              Ir a Mi Perfil
            </button>
          )}
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold transition border border-zinc-700 cursor-pointer"
          >
            Volver al Inicio
          </button>
        </div>
      </main>
    );
  }

  // Si intentó entrar a "mi perfil" sin estar logueado
  if (esMiPerfil && !usuario) {
    return (
      <main className="max-w-4xl mx-auto px-6 py-24 text-center space-y-4">
        <h2 className="text-2xl font-black text-white">Sesión no iniciada</h2>
        <p className="text-xs text-zinc-400">Inicia sesión para ver tu perfil de CineRewind.</p>
      </main>
    );
  }

  const perfilMostrado = esMiPerfil ? usuario : perfilVisitado;
  if (!perfilMostrado) return null;

  const avatarVisual = perfilMostrado.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${perfilMostrado.username}&backgroundColor=ff5722,ff7043`;
  const bannerVisual = perfilMostrado.banner_url || 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1600&q=80';
  const fechaAlta = perfilMostrado.creado_en ? new Date(perfilMostrado.creado_en).toLocaleDateString('es-ES', { year: 'numeric' }) : '2024';

  // Detección de perfil privado y reseñas privadas para no-amigos (sin hooks posteriores a retornos)
  const esPerfilPrivadoBloqueado = !esMiPerfil && 
    (perfilMostrado?.privacidad_perfil || 'publico') === 'amigos' && 
    perfilMostrado?.estado_relacion !== 'amigos';

  const esReseniasPrivadasBloqueadas = !esMiPerfil && 
    (perfilMostrado?.privacidad_resenias || 'publico') === 'amigos' && 
    perfilMostrado?.estado_relacion !== 'amigos';

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-8 animate-fadeIn text-neutral-200 relative">
      
      {/* Toast Notificación Cinemática */}
      {toastNotificacion && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 animate-bounce pointer-events-none">
          <div className={`px-5 py-3 rounded-2xl bg-zinc-950/95 border ${
            toastNotificacion.tipo === 'exito' ? 'border-emerald-500/50' : 'border-rose-500/50'
          } text-white text-xs font-bold shadow-2xl flex items-center gap-3 backdrop-blur-xl`}>
            <span className={`w-5 h-5 rounded-full ${
              toastNotificacion.tipo === 'exito' ? 'bg-emerald-600/30 text-emerald-400' : 'bg-rose-600/30 text-rose-400'
            } flex items-center justify-center font-black`}>
              {toastNotificacion.tipo === 'exito' ? '✓' : '✕'}
            </span>
            <span>{toastNotificacion.mensaje}</span>
          </div>
        </div>
      )}

      {/* 1. HERO PERFIL (Adaptable para Mi Perfil o Perfil de Amigo) */}
      <HeroPerfil
        usuario={perfilMostrado}
        stats={stats}
        totalResenias={listaSoloResenias.length}
        bannerVisual={bannerVisual}
        avatarVisual={avatarVisual}
        fechaAlta={fechaAlta}
        cargandoWrapped={cargandoWrapped}
        esMiPerfil={esMiPerfil}
        esPerfilPrivado={esPerfilPrivadoBloqueado}
        estadoRelacion={perfilMostrado.estado_relacion || 'ninguno'}
        onEnviarSolicitud={handleEnviarSolicitudAmigo}
        onAceptarSolicitud={handleAceptarSolicitudAmigo}
        onEliminarAmigo={handleEliminarAmigo}
        onVolverMiPerfil={usuario ? () => navigate(`/perfil/${usuario.username}`) : null}
        onAbrirEditar={(sub) => { setSubpestanaEditar(sub); setModalEditarAbierto(true); }}
        onAbrirAmigos={() => setModalAmigosAbierto(true)}
        onAbrirWrapped={() => setSelectorWrappedAbierto(true)}
      />

      {/* 2. CONTENIDO PRINCIPAL (O BLOQUEO SI EL PERFIL ES PRIVADO) */}
      {esPerfilPrivadoBloqueado ? (
        <div className="bg-[#12121a]/95 border border-zinc-800/90 rounded-3xl p-10 sm:p-14 text-center space-y-4 shadow-xl animate-fadeIn">
          <div className="w-16 h-16 mx-auto rounded-3xl bg-zinc-800/80 border border-zinc-700 flex items-center justify-center text-zinc-300 shadow-inner">
            <Lock className="w-8 h-8 text-rose-500" />
          </div>
          <div className="space-y-1.5 max-w-md mx-auto">
            <h3 className="text-lg sm:text-xl font-black text-white">
              Este perfil es privado
            </h3>
            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
              Solo los amigos confirmados de @{perfilMostrado.username} pueden ver su actividad cinéfila, favoritos y listas de seguimiento.
            </p>
          </div>
          <div className="pt-2 flex justify-center">
            {perfilMostrado.estado_relacion === 'solicitud_enviada' ? (
              <span className="px-5 py-2.5 rounded-xl font-bold text-xs bg-zinc-800 text-zinc-400 border border-zinc-700 flex items-center gap-2">
                <span>⏳</span> Solicitud de amistad enviada
              </span>
            ) : perfilMostrado.estado_relacion === 'solicitud_recibida' ? (
              <button
                type="button"
                onClick={handleAceptarSolicitudAmigo}
                className="px-5 py-2.5 rounded-xl font-bold text-xs text-white bg-rose-600 hover:bg-rose-500 transition shadow-lg active:scale-95 cursor-pointer"
              >
                Aceptar Solicitud de Amistad
              </button>
            ) : (
              <button
                type="button"
                onClick={handleEnviarSolicitudAmigo}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs text-white bg-rose-600 hover:bg-rose-500 transition shadow-lg active:scale-95 cursor-pointer"
              >
                <Users className="w-4 h-4" />
                <span>+ Conectar como Amigos</span>
              </button>
            )}
          </div>
        </div>
      ) : (
        <>
          {/* 2. VITRINA TOP 4 */}
          <VitrinaTop4
            favoritos={favoritos}
            top4Mode={top4Mode}
            setTop4Mode={setTop4Mode}
            arrastrandoSlot={arrastrandoSlot}
            setArrastrandoSlot={setArrastrandoSlot}
            handleDropIntercambio={handleDropIntercambio}
            handleEliminarFavorito={handleEliminarFavorito}
            onSeleccionarSlot={(slot, tipo) => {
              setRanuraSeleccionada(slot);
              setTipoFavorito(tipo);
              setModalFavoritoAbierto(true);
            }}
            esMiPerfil={esMiPerfil}
          />

          {/* 3. PESTAÑAS DE CONTENIDO */}
          <section className="w-full bg-[#12121a]/95 border border-zinc-800/90 rounded-3xl p-6 sm:p-7 shadow-xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-3">
              <div className="relative w-full sm:w-auto">
                {/* Indicador izquierdo (si ya scrolleó hacia la derecha) */}
                {puedeScrollearIzquierda && (
                  <button
                    type="button"
                    onClick={scrollearTabsIzquierda}
                    className="absolute left-0 top-0 bottom-0 z-20 w-8 bg-gradient-to-r from-[#12121a] via-[#12121a]/95 to-transparent flex items-center justify-start sm:hidden cursor-pointer"
                    title="Ver pestañas anteriores"
                  >
                    <div className="w-5 h-5 rounded-full bg-zinc-800/90 border border-white/10 flex items-center justify-center shadow">
                      <ChevronLeft className="w-3 h-3 text-white" />
                    </div>
                  </button>
                )}

                {/* Contenedor scrolleable con soporte touch */}
                <div 
                  ref={tabsContainerRef}
                  onScroll={verificarScrollTabs}
                  className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto scrollbar-none scroll-smooth pr-10 sm:pr-0"
                >
                  <button
                    type="button"
                    onClick={() => setActiveTab('resenias')}
                    className={`flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap shrink-0 ${
                      activeTab === 'resenias' ? 'bg-rose-600 text-white shadow-md' : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
                    }`}
                  >
                    <BookOpen className="w-3.5 h-3.5 text-amber-400" />
                    <span>Reseñas ({listaSoloResenias.length})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('viendo')}
                    className={`flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap shrink-0 ${
                      activeTab === 'viendo' ? 'bg-rose-600 text-white shadow-md' : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
                    }`}
                  >
                    <Tv className="w-3.5 h-3.5 text-rose-400" />
                    <span>Viendo Actualmente ({obrasViendo.length})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('pendientes')}
                    className={`flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap shrink-0 ${
                      activeTab === 'pendientes' ? 'bg-rose-600 text-white shadow-md' : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
                    }`}
                  >
                    <Bookmark className="w-3.5 h-3.5 text-indigo-400" />
                    <span>{esMiPerfil ? 'Watchlist Pendientes' : 'Lista Pendientes'} ({pendientes.length})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('amigos')}
                    className={`flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap shrink-0 ${
                      activeTab === 'amigos' ? 'bg-rose-600 text-white shadow-md' : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
                    }`}
                  >
                    <Users className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{esMiPerfil ? 'Red & Co-visiones' : 'Co-visiones'} ({listaCovisionesCombinadas.length})</span>
                  </button>
                </div>

                {/* Indicador derecho con flecha animada y degradado */}
                {puedeScrollearDerecha && (
                  <button
                    type="button"
                    onClick={scrollearTabsDerecha}
                    className="absolute right-0 top-0 bottom-0 z-20 w-12 bg-gradient-to-l from-[#12121a] via-[#12121a]/95 to-transparent flex items-center justify-end sm:hidden cursor-pointer"
                    title="Deslizar para ver más pestañas"
                  >
                    <div className="w-6 h-6 rounded-full bg-rose-600/90 text-white flex items-center justify-center shadow-lg animate-pulse border border-rose-400/30 mr-0.5">
                      <ChevronRight className="w-3.5 h-3.5 stroke-[2.5]" />
                    </div>
                  </button>
                )}
              </div>

              {esMiPerfil && (
                <button
                  type="button"
                  onClick={() => setModalNetflixAbierto(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 transition cursor-pointer"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-rose-500" />
                  <span>Importar Netflix</span>
                </button>
              )}
            </div>

            {activeTab === 'resenias' && (
              esReseniasPrivadasBloqueadas ? (
                <div className="py-16 text-center space-y-3 animate-fadeIn">
                  <div className="w-14 h-14 mx-auto rounded-2xl bg-zinc-800/80 border border-zinc-700 flex items-center justify-center text-rose-500">
                    <Lock className="w-6 h-6" />
                  </div>
                  <h4 className="text-base font-black text-white">Reseñas y opiniones privadas</h4>
                  <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                    Las opiniones y textos de @{perfilMostrado.username} son visibles únicamente para sus amigos confirmados.
                  </p>
                </div>
              ) : (
                <PestanaResenias 
                  resenias={listaSoloResenias} 
                  esMiPerfil={esMiPerfil}
                  onAbrirDetalle={(item) => esMiPerfil && setItemDetalle(item)}
                  onActualizado={cargarDatosPerfil}
                  dispararToast={dispararToast}
                />
              )
            )}

            {activeTab === 'viendo' && <PestanaViendo obrasViendo={obrasViendo} onAvanzarCapitulo={handleAvanzarCapitulo} esMiPerfil={esMiPerfil} />}
            {activeTab === 'pendientes' && (
              <PestanaPendientes
                pendientes={pendientes}
                cargandoPendientes={cargandoPendientes}
                onQuitarPendiente={handleQuitarPendiente}
                onRegistrarObra={setObraParaRegistrar}
                esMiPerfil={esMiPerfil}
              />
            )}
            {activeTab === 'amigos' && (
              <PestanaCovisiones 
                covisiones={listaCovisionesCombinadas} 
                onAbrirModalAmigos={() => setModalAmigosAbierto(true)} 
                esMiPerfil={esMiPerfil}
                onActualizado={cargarDatosPerfil}
                dispararToast={dispararToast}
              />
            )}
          </section>
        </>
      )}

      {/* 4. MODALES (Solo disponibles cuando estás en tu perfil propio) */}
      {esMiPerfil && modalEditarAbierto && (
        <ModalEditarPerfil
          usuario={usuario}
          subpestanaInicial={subpestanaEditar}
          onClose={() => setModalEditarAbierto(false)}
          onGuardar={async (nuevosDatos) => {
            const data = await actualizarPerfilAPI(nuevosDatos);
            if (data?.token && iniciarSesion) {
              iniciarSesion(data.token, data.usuario);
            } else if (actualizarUsuario) {
              actualizarUsuario(data?.usuario || nuevosDatos);
            }
            await cargarDatosPerfil();
            setModalEditarAbierto(false);
          }}
        />
      )}

      {esMiPerfil && modalFavoritoAbierto && (
        <ModalElegirFavorito
          posicion={ranuraSeleccionada}
          tipoEsperado={tipoFavorito}
          onClose={() => setModalFavoritoAbierto(false)}
          onSeleccionar={async (obra) => {
            await guardarFavoritoAPI(obra);
            const f = await obtenerFavoritosAPI(usuario.username);
            setFavoritos(Array.isArray(f) ? f : []);
            setModalFavoritoAbierto(false);
          }}
        />
      )}

      {modalAmigosAbierto && (
        <ModalAmigos 
          onClose={() => setModalAmigosAbierto(false)} 
          onActualizado={cargarDatosPerfil}
        />
      )}

      {obraParaRegistrar && (
        <ModalRegistrar
          obra={obraParaRegistrar}
          onClose={() => setObraParaRegistrar(null)}
          onRegistroCompletado={cargarDatosPerfil}
          onCambiarObra={(nueva) => setObraParaRegistrar(nueva)}
        />
      )}

      {esMiPerfil && selectorWrappedAbierto && (
        <ModalSelectorPeriodoWrapped
          aniosDisponibles={Array.from(new Set(timeline.map(t => t.fecha_visto ? new Date(t.fecha_visto).getFullYear() : null).filter(Boolean))).sort((a,b) => b - a)}
          onClose={() => setSelectorWrappedAbierto(false)}
          onSeleccionarPeriodo={abrirWrapped}
        />
      )}

      {esMiPerfil && (
        <ModalWrapped abierto={modalWrappedAbierto} alCerrar={() => setModalWrappedAbierto(false)} datosWrapped={datosWrapped} />
      )}

      {esMiPerfil && (
        <ModalImportarNetflix
          abierto={modalNetflixAbierto}
          alCerrar={() => setModalNetflixAbierto(false)}
          alCompletar={cargarDatosPerfil}
        />
      )}

      {esMiPerfil && itemDetalle && (
        <ModalDetalleTimeline 
          item={itemDetalle}
          todasLasVisualizaciones={timeline}
          onClose={() => setItemDetalle(null)}
          onActualizado={async () => {
            await cargarDatosPerfil();
            setItemDetalle(null);
          }}
          onSeleccionarObra={(obra) => {
            setItemDetalle(null);
            setObraParaRegistrar(obra);
          }}
        />
      )}

      {/* Modal de confirmación para eliminar amigo desde el perfil (sin alertas nativas) */}
      {mostrarConfirmarEliminarAmigo && perfilVisitado && (
        <div 
          onClick={() => setMostrarConfirmarEliminarAmigo(false)}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-6 animate-fadeIn"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-[#181822] border border-white/15 p-6 rounded-3xl max-w-sm w-full text-center space-y-4 shadow-2xl animate-scaleUp"
          >
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-500 border border-rose-500/30 flex items-center justify-center mx-auto shadow-sm">
              <Trash2 className="w-6 h-6 stroke-[2]" />
            </div>

            <div className="space-y-1.5">
              <h4 className="font-black text-base text-white">
                ¿Eliminar a {perfilVisitado.nombre || perfilVisitado.username}?
              </h4>
              <p className="text-xs text-neutral-400">
                Ya no verás su actividad ni podrán etiquetarse en co-visiones conjuntas.
              </p>
            </div>

            <div className="flex gap-2 justify-center pt-2">
              <button
                type="button"
                onClick={() => setMostrarConfirmarEliminarAmigo(false)}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold border border-white/15 hover:bg-white/10 transition cursor-pointer text-neutral-300"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={ejecutarEliminarAmigo}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 active:scale-95 text-white transition cursor-pointer shadow-md flex items-center justify-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Sí, eliminar</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}