import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { BookOpen, Tv, Bookmark, Users, FileSpreadsheet } from 'lucide-react';

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
  obtenerWrappedPeriodoAPI
} from '../api';

export default function Perfil() {
  const { usuario, cargandoAuth, actualizarUsuario, iniciarSesion } = useAuth();

  // Estados de navegación
  const [activeTab, setActiveTab] = useState('resenias');
  const [top4Mode, setTop4Mode] = useState('serie');

  // Modales
  const [modalEditarAbierto, setModalEditarAbierto] = useState(false);
  const [subpestanaEditar, setSubpestanaEditar] = useState('info');
  const [obraParaRegistrar, setObraParaRegistrar] = useState(null);
  const [modalNetflixAbierto, setModalNetflixAbierto] = useState(false);
  const [modalAmigosAbierto, setModalAmigosAbierto] = useState(false);

  // Datos
  const [stats, setStats] = useState({ total_series: 0, total_episodios: 0, total_peliculas: 0, horas_totales: 0 });
  const [favoritos, setFavoritos] = useState([]);
  const [modalFavoritoAbierto, setModalFavoritoAbierto] = useState(false);
  const [ranuraSeleccionada, setRanuraSeleccionada] = useState(null);
  const [tipoFavorito, setTipoFavorito] = useState('serie');
  const [arrastrandoSlot, setArrastrandoSlot] = useState(null);

  const [timeline, setTimeline] = useState([]);
  const [obrasViendo, setObrasViendo] = useState([]);
  const [pendientes, setPendientes] = useState([]);
  const [cargandoPendientes, setCargandoPendientes] = useState(false);

  // Wrapped
  const [modalWrappedAbierto, setModalWrappedAbierto] = useState(false);
  const [selectorWrappedAbierto, setSelectorWrappedAbierto] = useState(false);
  const [datosWrapped, setDatosWrapped] = useState(null);
  const [cargandoWrapped, setCargandoWrapped] = useState(false);
  const [errorToast, setErrorToast] = useState(null);

  const dispararErrorToast = (mensaje) => {
    setErrorToast(mensaje);
    setTimeout(() => setErrorToast(null), 4000);
  };

  // Carga de datos
  const cargarDatosPerfil = useCallback(async () => {
    if (!usuario?.id || !usuario?.username) return;

    try {
      const s = await obtenerEstadisticasAPI();
      setStats(s || { total_series: 0, total_episodios: 0, total_peliculas: 0, horas_totales: 0 });

      const f = await obtenerFavoritosAPI(usuario.username);
      setFavoritos(Array.isArray(f) ? f : []);

      const v = await obtenerViendoActualmenteAPI(usuario.id);
      setObrasViendo(Array.isArray(v) ? v : []);

      const t = await obtenerTimelineAPI(usuario.id);
      setTimeline(Array.isArray(t) ? t : []);

      setCargandoPendientes(true);
      const p = await obtenerPendientesAPI();
      setPendientes(Array.isArray(p) ? p : []);
      setCargandoPendientes(false);
    } catch (err) {
      console.error('Error al cargar datos del perfil:', err);
      setCargandoPendientes(false);
    }
  }, [usuario?.id, usuario?.username]);

  useEffect(() => {
    cargarDatosPerfil();
  }, [cargarDatosPerfil]);

  // Manejador para avanzar capítulo
  const handleAvanzarCapitulo = async (obraId, temporada, ultimoEp) => {
    try {
      await avanzarCapituloAPI({
        obra_id: obraId,
        temporada: temporada || 1,
        episodio: (ultimoEp || 0) + 1,
        fecha_visto: new Date().toISOString().split('T')[0]
      });
      await cargarDatosPerfil();
    } catch (err) {
      console.error('Error al avanzar capítulo:', err);
    }
  };

  // Favoritos
  const handleDropIntercambio = async (posicionDestino, tipo) => {
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
      dispararErrorToast(err.message || 'No se pudo cargar el festival CineRewind Wrapped');
    } finally {
      setCargandoWrapped(false);
    }
  };

  // Solo reseñas con texto
  const listaSoloResenias = useMemo(() => {
    return timeline.filter(t => t.resenia && t.resenia.trim() !== '');
  }, [timeline]);

  // Co-visiones combinadas
  const listaCovisionesCombinadas = useMemo(() => {
    const covisiones = {};

    timeline.forEach(t => {
      if (t.amigos_covision && Array.isArray(t.amigos_covision)) {
        t.amigos_covision.forEach(a => {
          const key = `user_${a.username}`;
          if (!covisiones[key]) {
            covisiones[key] = {
              nombre: a.nombre || a.username,
              username: `@${a.username}`,
              avatar: a.avatar_url,
              tipo: 'registrado',
              totalObras: 0,
            };
          }
          covisiones[key].totalObras += 1;
        });
      }

      if (t.visto_con_texto && t.visto_con_texto.trim() !== '') {
        const acompaniante = t.visto_con_texto.trim();
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
      }
    });

    return Object.values(covisiones).sort((a, b) => b.totalObras - a.totalObras);
  }, [timeline]);

  if (cargandoAuth) {
    return (
      <main className="max-w-4xl mx-auto px-6 py-24 text-center">
        <p className="text-xs font-bold text-zinc-500 animate-pulse font-mono">Sincronizando perfil cinéfilo...</p>
      </main>
    );
  }

  if (!usuario) {
    return (
      <main className="max-w-4xl mx-auto px-6 py-24 text-center space-y-4">
        <h2 className="text-2xl font-black text-white">Sesión no iniciada</h2>
        <p className="text-xs text-zinc-400">Inicia sesión para ver tu perfil de CineRewind.</p>
      </main>
    );
  }

  const avatarVisual = usuario.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${usuario.username}&backgroundColor=ff5722,ff7043`;
  const bannerVisual = usuario.banner_url || localStorage.getItem('cinerewind_banner') || 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=1600&q=80';
  const fechaAlta = usuario.creado_en ? new Date(usuario.creado_en).toLocaleDateString('es-ES', { year: 'numeric' }) : '2024';

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-8 animate-fadeIn text-neutral-200 relative">
      
      {/* Toast Notificación Cinemática (CERO alerts de Windows) */}
      {errorToast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 animate-bounce pointer-events-none">
          <div className="px-5 py-3 rounded-2xl bg-zinc-950/95 border border-rose-500/50 text-white text-xs font-bold shadow-2xl flex items-center gap-3 backdrop-blur-xl">
            <span className="w-5 h-5 rounded-full bg-rose-600/30 text-rose-400 flex items-center justify-center font-black">
              ✕
            </span>
            <span>{errorToast}</span>
          </div>
        </div>
      )}

      {/* 1. HERO PERFIL */}
      <HeroPerfil
        usuario={usuario}
        stats={stats}
        totalResenias={listaSoloResenias.length}
        bannerVisual={bannerVisual}
        avatarVisual={avatarVisual}
        fechaAlta={fechaAlta}
        cargandoWrapped={cargandoWrapped}
        onAbrirEditar={(sub) => { setSubpestanaEditar(sub); setModalEditarAbierto(true); }}
        onAbrirAmigos={() => setModalAmigosAbierto(true)}
        onAbrirWrapped={() => setSelectorWrappedAbierto(true)}
      />

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
      />

      {/* 3. PESTAÑAS DE CONTENIDO */}
      <section className="w-full bg-[#12121a]/95 border border-zinc-800/90 rounded-3xl p-6 sm:p-7 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-3">
          <div className="flex items-center gap-2 overflow-x-auto">
            <button
              type="button"
              onClick={() => setActiveTab('resenias')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                activeTab === 'resenias' ? 'bg-rose-600 text-white shadow-md' : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5 text-amber-400" />
              <span>Reseñas ({listaSoloResenias.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('viendo')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                activeTab === 'viendo' ? 'bg-rose-600 text-white shadow-md' : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
              }`}
            >
              <Tv className="w-3.5 h-3.5 text-rose-400" />
              <span>Viendo Actualmente ({obrasViendo.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('pendientes')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                activeTab === 'pendientes' ? 'bg-rose-600 text-white shadow-md' : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
              }`}
            >
              <Bookmark className="w-3.5 h-3.5 text-indigo-400" />
              <span>Watchlist Pendientes ({pendientes.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('amigos')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                activeTab === 'amigos' ? 'bg-rose-600 text-white shadow-md' : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
              }`}
            >
              <Users className="w-3.5 h-3.5 text-emerald-400" />
              <span>Red & Co-visiones ({listaCovisionesCombinadas.length})</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => setModalNetflixAbierto(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 transition cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-rose-500" />
            <span>Importar Netflix</span>
          </button>
        </div>

        {activeTab === 'resenias' && <PestanaResenias resenias={listaSoloResenias} />}
        {activeTab === 'viendo' && <PestanaViendo obrasViendo={obrasViendo} onAvanzarCapitulo={handleAvanzarCapitulo} />}
        {activeTab === 'pendientes' && (
          <PestanaPendientes
            pendientes={pendientes}
            cargandoPendientes={cargandoPendientes}
            onQuitarPendiente={handleQuitarPendiente}
            onRegistrarObra={setObraParaRegistrar}
          />
        )}
        {activeTab === 'amigos' && (
          <PestanaCovisiones covisiones={listaCovisionesCombinadas} onAbrirModalAmigos={() => setModalAmigosAbierto(true)} />
        )}
      </section>

      {/* 4. MODALES */}
      {modalEditarAbierto && (
        <ModalEditarPerfil
          usuario={usuario}
          subpestanaInicial={subpestanaEditar}
          onClose={() => setModalEditarAbierto(false)}
          onGuardar={async (nuevosDatos) => {
            if (nuevosDatos?.banner_url) {
              localStorage.setItem('cinerewind_banner', nuevosDatos.banner_url);
            }
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

      {modalFavoritoAbierto && (
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

      {modalAmigosAbierto && <ModalAmigos onClose={() => setModalAmigosAbierto(false)} />}

      {obraParaRegistrar && (
        <ModalRegistrar
          obra={obraParaRegistrar}
          onClose={() => setObraParaRegistrar(null)}
          onRegistroCompletado={cargarDatosPerfil}
          onCambiarObra={(nueva) => setObraParaRegistrar(nueva)}
        />
      )}

      {selectorWrappedAbierto && (
        <ModalSelectorPeriodoWrapped
          aniosDisponibles={Array.from(new Set(timeline.map(t => t.fecha_visto ? new Date(t.fecha_visto).getFullYear() : null).filter(Boolean))).sort((a,b) => b - a)}
          onClose={() => setSelectorWrappedAbierto(false)}
          onSeleccionarPeriodo={abrirWrapped}
        />
      )}

      <ModalWrapped abierto={modalWrappedAbierto} alCerrar={() => setModalWrappedAbierto(false)} datosWrapped={datosWrapped} />

      <ModalImportarNetflix
        abierto={modalNetflixAbierto}
        alCerrar={() => setModalNetflixAbierto(false)}
        alCompletar={cargarDatosPerfil}
      />
    </main>
  );
}