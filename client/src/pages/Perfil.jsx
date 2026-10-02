import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import TicketPerfil from '../components/perfil/TicketPerfil';
import PestanaFavoritas from '../components/perfil/PestanaFavoritas';
import PestanaRecords from '../components/perfil/PestanaRecords';
import PestanaPendientes from '../components/perfil/PestanaPendientes';
import ModalEditarPerfil from '../components/modal/ModalEditarPerfil';
import ModalElegirFavorito from '../components/modal/ModalElegirFavorito';
import ModalRegistrar from '../components/modal/ModalRegistrar';
import ModalImportarNetflix from '../components/modal/ModalImportarNetflix';
import ModalAmigos from '../components/modal/ModalAmigos';
import ModalWrapped from '../components/modal/ModalWrapped';
import { 
  actualizarPerfilAPI, 
  obtenerFavoritosAPI, 
  guardarFavoritoAPI, 
  eliminarFavoritoAPI,
  obtenerEstadisticasAPI,
  obtenerPendientesAPI,
  eliminarPendienteAPI,
  obtenerRecordsAPI,
  obtenerWrappedPeriodoAPI
} from '../api';

export default function Perfil() {
  const { usuario, cargandoAuth, actualizarUsuario, iniciarSesion } = useAuth();

  // 1. Estados principales y modales
  const [pestañaActiva, setPestañaActiva] = useState('favoritas');
  const [modalEditarAbierto, setModalEditarAbierto] = useState(false);
  const [obraParaRegistrar, setObraParaRegistrar] = useState(null);
  const [modalNetflixAbierto, setModalNetflixAbierto] = useState(false);
  const [modalAmigosAbierto, setModalAmigosAbierto] = useState(false);

  // Estadísticas del Ticket
  const [stats, setStats] = useState({
    total_series: 0,
    total_episodios: 0,
    total_peliculas: 0,
    horas_totales: 0
  });

  // Favoritos
  const [favoritos, setFavoritos] = useState([]);
  const [modalFavoritoAbierto, setModalFavoritoAbierto] = useState(false);
  const [ranuraSeleccionada, setRanuraSeleccionada] = useState(null);
  const [tipoFavorito, setTipoFavorito] = useState('serie');
  const [arrastrandoSlot, setArrastrandoSlot] = useState(null);

  // Pendientes
  const [pendientes, setPendientes] = useState([]);
  const [cargandoPendientes, setCargandoPendientes] = useState(false);

  // Récords
  const [records, setRecords] = useState({ maratonSerie: null, rewatchPelicula: null });

  // Wrapped
  const [modalWrappedAbierto, setModalWrappedAbierto] = useState(false);
  const [selectorWrappedAbierto, setSelectorWrappedAbierto] = useState(false);
  const [datosWrapped, setDatosWrapped] = useState(null);
  const [cargandoWrapped, setCargandoWrapped] = useState(false);

  // 2. Cargas automáticas
  const cargarStats = useCallback(async () => {
    try {
      const data = await obtenerEstadisticasAPI();
      setStats(data);
    } catch (err) {
      console.error('Error al cargar contadores:', err);
    }
  }, []);

  const cargarFavoritos = useCallback(async () => {
    if (!usuario?.username) return;
    try {
      const data = await obtenerFavoritosAPI(usuario.username);
      setFavoritos(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error al cargar favoritos:', err);
    }
  }, [usuario?.username]);

  const cargarPendientes = useCallback(async () => {
    setCargandoPendientes(true);
    try {
      const data = await obtenerPendientesAPI();
      setPendientes(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error al cargar pendientes:', err);
    } finally {
      setCargandoPendientes(false);
    }
  }, []);

  useEffect(() => {
    cargarStats();
  }, [cargarStats]);

  useEffect(() => {
    cargarFavoritos();
  }, [cargarFavoritos]);

  useEffect(() => {
    if (pestañaActiva === 'por_ver') {
      cargarPendientes();
    } else if (pestañaActiva === 'destacadas') {
      obtenerRecordsAPI().then(setRecords).catch(console.error);
    }
  }, [pestañaActiva, cargarPendientes]);

  // 3. Manejadores de Favoritos
  const handleDropIntercambio = async (posicionDestino, tipo) => {
    if (!arrastrandoSlot || arrastrandoSlot === posicionDestino) {
      setArrastrandoSlot(null);
      return;
    }

    const origen = favoritos.find((f) => f.posicion === arrastrandoSlot && f.tipo === tipo);
    const destino = favoritos.find((f) => f.posicion === posicionDestino && f.tipo === tipo);

    if (!origen && !destino) {
      setArrastrandoSlot(null);
      return;
    }

    try {
      if (origen && destino) {
        await guardarFavoritoAPI({ ...origen, posicion: posicionDestino });
        await guardarFavoritoAPI({ ...destino, posicion: arrastrandoSlot });
      } else if (origen && !destino) {
        await guardarFavoritoAPI({ ...origen, posicion: posicionDestino });
        await eliminarFavoritoAPI(arrastrandoSlot, tipo);
      }
      await cargarFavoritos();
    } catch (err) {
      console.error('Error al intercambiar posiciones:', err);
    } finally {
      setArrastrandoSlot(null);
    }
  };

  const handleGuardarFavorito = async (obraSeleccionada) => {
    try {
      await guardarFavoritoAPI(obraSeleccionada);
      await cargarFavoritos();
      setModalFavoritoAbierto(false);
    } catch (err) {
      console.error('Error al guardar favorito:', err);
    }
  };

  const handleEliminarFavorito = async (e, posicion, tipo) => {
    e.stopPropagation();
    try {
      await eliminarFavoritoAPI(posicion, tipo);
      await cargarFavoritos();
    } catch (err) {
      console.error('Error al eliminar favorito:', err);
    }
  };

  // 4. Manejador de Pendientes
  const handleQuitarPendiente = async (e, tmdb_id) => {
    e.stopPropagation();
    try {
      await eliminarPendienteAPI(tmdb_id);
      setPendientes((prev) => prev.filter((p) => Number(p.tmdb_id) !== Number(tmdb_id)));
    } catch (err) {
      console.error('Error al quitar de pendientes:', err);
    }
  };

  const handleRegistroCompletado = async () => {
    await cargarStats();
    await cargarPendientes();
  };

  // 5. Manejador de Wrapped
  const abrirWrapped = async (anio, mes = null) => {
    setCargandoWrapped(true);
    try {
      const data = await obtenerWrappedPeriodoAPI(anio, mes);
      setDatosWrapped(data);
      setSelectorWrappedAbierto(false);
      setModalWrappedAbierto(true);
    } catch (err) {
      alert(err.message || 'No hay datos para este período');
    } finally {
      setCargandoWrapped(false);
    }
  };

  // Pantallas de espera
  if (cargandoAuth) {
    return (
      <main className="max-w-4xl mx-auto px-6 py-24 text-center">
        <p className="text-xs font-bold text-neutral-400 animate-pulse">
          Sincronizando perfil...
        </p>
      </main>
    );
  }

  if (!usuario) {
    return (
      <main className="max-w-4xl mx-auto px-6 py-24 text-center space-y-4">
        <h2 className="text-2xl font-black text-neutral-900 dark:text-white">
          Pase de Espectador no encontrado
        </h2>
        <p className="text-xs text-neutral-500 dark:text-neutral-400">
          Inicia sesión para generar y personalizar tu credencial de sala.
        </p>
      </main>
    );
  }

  const avatarVisual = usuario.avatar_url || `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/25.png`;
  const fechaAlta = usuario.creado_en
    ? new Date(usuario.creado_en).toLocaleDateString('es-ES', { year: 'numeric', month: 'short' })
    : '2026';

  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 py-10 space-y-10 animate-fadeIn">
{/* 1. TICKET DE SALA MODULAR */}
      <TicketPerfil
        usuario={usuario}
        stats={stats}
        avatarVisual={avatarVisual}
        fechaAlta={fechaAlta}
        selectorWrappedAbierto={selectorWrappedAbierto}
        setSelectorWrappedAbierto={setSelectorWrappedAbierto}
        abrirWrapped={abrirWrapped}
        cargandoWrapped={cargandoWrapped}
        setModalEditarAbierto={setModalEditarAbierto}
        setModalAmigosAbierto={setModalAmigosAbierto}
        datosWrapped={datosWrapped} // <-- ASEGURARSE DE QUE ESTÉ ESTA LÍNEA
      />

      {/* 2. SELECTOR DE PESTAÑAS */}
      <section className="space-y-8">
        <div className="flex items-center justify-between border-b border-neutral-300/80 dark:border-white/10 pb-3">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setPestañaActiva('favoritas')}
              className={`px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer ${
                pestañaActiva === 'favoritas'
                  ? 'bg-rose-600 text-white shadow-md'
                  : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              Favoritas
            </button>
            <button
              type="button"
              onClick={() => setPestañaActiva('destacadas')}
              className={`px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer ${
                pestañaActiva === 'destacadas'
                  ? 'bg-rose-600 text-white shadow-md'
                  : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              Récords
            </button>
            <button
              type="button"
              onClick={() => setPestañaActiva('por_ver')}
              className={`px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer ${
                pestañaActiva === 'por_ver'
                  ? 'bg-rose-600 text-white shadow-md'
                  : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              Ver Más Tarde
            </button>
          </div>
        </div>

        {/* PESTAÑA 1: FAVORITAS */}
        {pestañaActiva === 'favoritas' && (
          <PestanaFavoritas
            favoritos={favoritos}
            arrastrandoSlot={arrastrandoSlot}
            setArrastrandoSlot={setArrastrandoSlot}
            handleDropIntercambio={handleDropIntercambio}
            handleEliminarFavorito={handleEliminarFavorito}
            setRanuraSeleccionada={setRanuraSeleccionada}
            setTipoFavorito={setTipoFavorito}
            setModalFavoritoAbierto={setModalFavoritoAbierto}
          />
        )}

        {/* PESTAÑA 2: RÉCORDS */}
        {pestañaActiva === 'destacadas' && (
          <PestanaRecords records={records} />
        )}

        {/* PESTAÑA 3: VER MÁS TARDE */}
        {pestañaActiva === 'por_ver' && (
          <PestanaPendientes
            pendientes={pendientes}
            cargandoPendientes={cargandoPendientes}
            handleQuitarPendiente={handleQuitarPendiente}
            setObraParaRegistrar={setObraParaRegistrar}
          />
        )}
      </section>

      {/* MODALES */}
      {modalEditarAbierto && (
        <ModalEditarPerfil
          usuario={usuario}
          onClose={() => setModalEditarAbierto(false)}
          onGuardar={async (nuevosDatos) => {
            const data = await actualizarPerfilAPI(nuevosDatos);
            if (data.token && iniciarSesion) {
              iniciarSesion(data.token, data.usuario);
            } else if (actualizarUsuario) {
              actualizarUsuario(data.usuario || nuevosDatos);
            }
            setModalEditarAbierto(false);
          }}
        />
      )}

      {modalFavoritoAbierto && (
        <ModalElegirFavorito
          posicion={ranuraSeleccionada}
          tipoEsperado={tipoFavorito}
          onClose={() => setModalFavoritoAbierto(false)}
          onSeleccionar={handleGuardarFavorito}
        />
      )}

      {modalAmigosAbierto && (
        <ModalAmigos onClose={() => setModalAmigosAbierto(false)} />
      )}

      {obraParaRegistrar && (
        <ModalRegistrar
          obra={obraParaRegistrar}
          onClose={() => setObraParaRegistrar(null)}
          onRegistroCompletado={handleRegistroCompletado}
          onCambiarObra={(nueva) => setObraParaRegistrar(nueva)}
        />
      )}

      <ModalWrapped
        abierto={modalWrappedAbierto}
        alCerrar={() => setModalWrappedAbierto(false)}
        datosWrapped={datosWrapped}
      />

      <ModalImportarNetflix
        abierto={modalNetflixAbierto}
        alCerrar={() => setModalNetflixAbierto(false)}
        alCompletar={() => {
          cargarStats();
          cargarFavoritos();
        }}
      />
    </main>
  );
}