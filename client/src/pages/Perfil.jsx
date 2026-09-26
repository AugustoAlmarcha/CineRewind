import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ModalEditarPerfil from '../components/modal/ModalEditarPerfil';
import ModalElegirFavorito from '../components/modal/ModalElegirFavorito';
import ModalRegistrar from '../components/modal/ModalRegistrar';
import ModalImportarNetflix from '../components/modal/ModalImportarNetflix';
import { 
  actualizarPerfilAPI, 
  obtenerFavoritosAPI, 
  guardarFavoritoAPI, 
  eliminarFavoritoAPI,
  obtenerEstadisticasAPI,
  obtenerPendientesAPI,
  eliminarPendienteAPI,
  obtenerRecordsAPI
} from '../api';

export default function Perfil() {
  const navigate = useNavigate();
  const { usuario, actualizarUsuario, iniciarSesion } = useAuth();

  // 1. Estados principales y modales
  const [pestañaActiva, setPestañaActiva] = useState('favoritas');
  const [modalEditarAbierto, setModalEditarAbierto] = useState(false);
  const [obraParaRegistrar, setObraParaRegistrar] = useState(null);
  const [modalNetflixAbierto, setModalNetflixAbierto] = useState(false);
  // Estadísticas del Ticket de Sala
  const [stats, setStats] = useState({
    total_series: 0,
    total_episodios: 0,
    total_peliculas: 0,
    horas_totales: 0
  });

  // Estados para Favoritos
  const [favoritos, setFavoritos] = useState([]);
  const [modalFavoritoAbierto, setModalFavoritoAbierto] = useState(false);
  const [ranuraSeleccionada, setRanuraSeleccionada] = useState(null);
  const [tipoFavorito, setTipoFavorito] = useState('serie');

  // Estados para Ver Más Tarde
  const [pendientes, setPendientes] = useState([]);
  const [cargandoPendientes, setCargandoPendientes] = useState(false);

  // Estados para Récords
  const [records, setRecords] = useState({ maratonSerie: null, rewatchPelicula: null });
  const [cargandoRecords, setCargandoRecords] = useState(false);

  // Estado para el Drag & Drop nativo
  const [arrastrandoSlot, setArrastrandoSlot] = useState(null);

  // 2. Cargas automáticas (Efectos)
  const cargarStats = useCallback(async () => {
    try {
      const data = await obtenerEstadisticasAPI();
      setStats(data);
    } catch (err) {
      console.error('Error al cargar contadores:', err);
    }
  }, []);

  useEffect(() => {
    cargarStats();
  }, [cargarStats]);

  const cargarFavoritos = useCallback(async () => {
    if (!usuario?.username) return;
    try {
      const data = await obtenerFavoritosAPI(usuario.username);
      setFavoritos(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error al cargar favoritos:', err);
    }
  }, [usuario?.username]);

  useEffect(() => {
    cargarFavoritos();
  }, [cargarFavoritos]);

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
    if (pestañaActiva === 'por_ver') {
      cargarPendientes();
    }
  }, [pestañaActiva, cargarPendientes]);

  useEffect(() => {
    if (pestañaActiva === 'destacadas') {
      const cargarRecords = async () => {
        setCargandoRecords(true);
        try {
          const data = await obtenerRecordsAPI();
          setRecords(data);
        } catch (err) {
          console.error('Error cargando récords:', err);
        } finally {
          setCargandoRecords(false);
        }
      };
      cargarRecords();
    }
  }, [pestañaActiva]);

  // 3. Manejador Drag & Drop para intercambiar posiciones
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
        await guardarFavoritoAPI({
          tmdb_id: origen.tmdb_id,
          tipo: origen.tipo,
          titulo: origen.titulo,
          poster_path: origen.poster_path,
          posicion: posicionDestino
        });
        await guardarFavoritoAPI({
          tmdb_id: destino.tmdb_id,
          tipo: destino.tipo,
          titulo: destino.titulo,
          poster_path: destino.poster_path,
          posicion: arrastrandoSlot
        });
      } else if (origen && !destino) {
        await guardarFavoritoAPI({
          tmdb_id: origen.tmdb_id,
          tipo: origen.tipo,
          titulo: origen.titulo,
          poster_path: origen.poster_path,
          posicion: posicionDestino
        });
        await eliminarFavoritoAPI(arrastrandoSlot);
      }

      await cargarFavoritos();
    } catch (err) {
      console.error('Error al intercambiar posiciones:', err);
    } finally {
      setArrastrandoSlot(null);
    }
  };

  // 4. Manejadores de Favoritos (Modal y Eliminar)
  const handleGuardarFavorito = async (obraSeleccionada) => {
    try {
      await guardarFavoritoAPI(obraSeleccionada);
      await cargarFavoritos();
      setModalFavoritoAbierto(false);
    } catch (err) {
      console.error('Error al guardar favorito:', err);
    }
  };

  const handleEliminarFavorito = async (e, posicion) => {
    e.stopPropagation();
    try {
      await eliminarFavoritoAPI(posicion);
      await cargarFavoritos();
    } catch (err) {
      console.error('Error al eliminar favorito:', err);
    }
  };

  // 5. Manejador de Pendientes
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
      {/* 1. TICKET DE SALA */}
      <section className="relative rounded-3xl overflow-hidden bg-[#fbf9f4] dark:bg-[#181820] border-2 border-neutral-300 dark:border-white/15 shadow-xl dark:shadow-[0_8px_30px_rgb(0,0,0,0.5)] flex flex-col md:flex-row transition-colors">
        
        {/* Marca de agua vintage */}
        <div className="absolute right-1/4 top-1/2 -translate-y-1/2 select-none pointer-events-none opacity-[0.04] dark:opacity-[0.06] text-8xl md:text-9xl font-black font-mono rotate-12 text-black dark:text-white">
          ADMIT ONE
        </div>

        {/* Troquelado lateral exterior */}
        <div className="hidden md:block absolute -left-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-[#f7f4ed] dark:bg-[#0f0f11] border-r-2 border-neutral-300 dark:border-white/15 shadow-inner z-20" />
        <div className="hidden md:block absolute -right-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-[#f7f4ed] dark:bg-[#0f0f11] border-l-2 border-neutral-300 dark:border-white/15 shadow-inner z-20" />

        {/* Troquelado línea de corte */}
        <div className="hidden md:block absolute -top-4 right-56 translate-x-1/2 w-8 h-8 rounded-full bg-[#f7f4ed] dark:bg-[#0f0f11] border-b-2 border-neutral-300 dark:border-white/15 shadow-inner z-20" />
        <div className="hidden md:block absolute -bottom-4 right-56 translate-x-1/2 w-8 h-8 rounded-full bg-[#f7f4ed] dark:bg-[#0f0f11] border-t-2 border-neutral-300 dark:border-white/15 shadow-inner z-20" />

        {/* Cuerpo del ticket */}
        <div className="flex-1 p-6 sm:p-8 flex flex-col justify-between space-y-6">
          <div className="flex items-center justify-between border-b border-neutral-300/80 dark:border-white/10 pb-4">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-pulse" />
              <span className="text-[11px] font-mono uppercase tracking-[0.25em] font-black text-rose-600 dark:text-rose-400">
                CINEREWIND · ENTRADA GENERAL
              </span>
            </div>
            <span className="text-[11px] font-mono text-neutral-500 dark:text-neutral-400 font-bold">
              BUTACA: SALA 01 · FILA VIP
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            <div className="relative flex-shrink-0">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-white dark:bg-[#20202a] border-2 border-neutral-300 dark:border-white/20 p-1 overflow-hidden shadow-md">
                <img
                  src={avatarVisual}
                  alt={usuario.username}
                  className="w-full h-full object-cover rounded-xl"
                />
              </div>
              <span className="absolute -bottom-2 -right-2 px-2 py-0.5 rounded-md bg-rose-600 text-white text-[9px] font-black uppercase tracking-wider shadow">
                CR-PASS
              </span>
            </div>

            <div className="space-y-1.5 text-center sm:text-left flex-1">
              <h1 className="text-2xl sm:text-4xl font-black text-neutral-900 dark:text-white tracking-tight">
                {usuario.nombre || usuario.username}
              </h1>
              <p className="text-xs font-mono text-rose-600 dark:text-rose-400 font-bold">
                @{usuario.username} · REGISTRO: {fechaAlta.toUpperCase()}
              </p>
              <p className="text-xs text-neutral-600 dark:text-neutral-300 pt-1 leading-relaxed max-w-lg">
                {usuario.biografia || "Diario personal de cine, maratones de series y obras vistas."}
              </p>
            </div>
          </div>

          {/* Marcadores de celuloide con redirección automática */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-neutral-300/80 dark:border-white/10">
            {/* SERIES */}
            <div 
              onClick={() => navigate('/', { state: { vistaTotal: true, filtroTipo: 'serie' } })}
              className="bg-white/90 dark:bg-[#22222c] p-3 rounded-2xl border border-neutral-200 dark:border-white/10 shadow-xs cursor-pointer hover:border-rose-500/50 hover:scale-[1.02] transition-all group"
              title="Ver todas las series en el Total Histórico"
            >
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-black font-mono text-neutral-500 dark:text-neutral-400 uppercase">SERIES</p>
                <span className="text-[10px] text-rose-500 opacity-0 group-hover:opacity-100 transition font-mono">Ver →</span>
              </div>
              <span className="text-2xl font-black text-neutral-900 dark:text-white font-mono">
                {stats.total_series}
              </span>
            </div>

            {/* EPISODIOS */}
            <div 
              onClick={() => navigate('/', { state: { vistaTotal: true, filtroTipo: 'serie' } })}
              className="bg-white/90 dark:bg-[#22222c] p-3 rounded-2xl border border-neutral-200 dark:border-white/10 shadow-xs cursor-pointer hover:border-rose-500/50 hover:scale-[1.02] transition-all group"
              title="Ver episodios en el Total Histórico"
            >
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-black font-mono text-neutral-500 dark:text-neutral-400 uppercase">EPISODIOS</p>
                <span className="text-[10px] text-rose-500 opacity-0 group-hover:opacity-100 transition font-mono">Ver →</span>
              </div>
              <span className="text-2xl font-black text-neutral-900 dark:text-white font-mono">
                {stats.total_episodios}
              </span>
            </div>

            {/* PELÍCULAS */}
            <div 
              onClick={() => navigate('/', { state: { vistaTotal: true, filtroTipo: 'pelicula' } })}
              className="bg-white/90 dark:bg-[#22222c] p-3 rounded-2xl border border-neutral-200 dark:border-white/10 shadow-xs cursor-pointer hover:border-rose-500/50 hover:scale-[1.02] transition-all group"
              title="Ver todas las películas en el Total Histórico"
            >
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-black font-mono text-neutral-500 dark:text-neutral-400 uppercase">PELÍCULAS</p>
                <span className="text-[10px] text-rose-500 opacity-0 group-hover:opacity-100 transition font-mono">Ver →</span>
              </div>
              <span className="text-2xl font-black text-neutral-900 dark:text-white font-mono">
                {stats.total_peliculas}
              </span>
            </div>

            {/* HORAS TOTALES */}
            <div className="bg-white/90 dark:bg-[#22222c] p-3 rounded-2xl border border-neutral-200 dark:border-white/10 shadow-xs">
              <p className="text-[10px] font-black font-mono text-neutral-500 dark:text-neutral-400 uppercase">HORAS TOTALES</p>
              <span className="text-2xl font-black text-rose-600 dark:text-rose-400 font-mono">
                {stats.horas_totales}<span className="text-xs font-normal">h</span>
              </span>
            </div>
          </div>
        </div>

        {/* Talón troquelado */}
        <div className="relative border-t md:border-t-0 md:border-l-2 border-dashed border-neutral-300 dark:border-white/20 bg-neutral-100/70 dark:bg-[#14141a] w-full md:w-56 p-6 flex flex-col justify-between items-center text-center space-y-6">
          <div className="space-y-1.5">
            <span className="text-[10px] font-black uppercase font-mono tracking-widest text-neutral-400 dark:text-neutral-500">
              SERIAL NO.
            </span>
            <p className="font-mono text-sm font-black text-neutral-800 dark:text-neutral-200 tracking-wider">
              CR-{usuario.id ? String(usuario.id).padStart(6, '0') : '000003'}
            </p>
          </div>

          <div className="w-full flex justify-center py-2 text-neutral-800 dark:text-neutral-200">
            <div className="flex gap-1 h-12 items-end">
              <span className="w-1.5 h-full bg-current" /><span className="w-0.5 h-full bg-current" /><span className="w-2 h-full bg-current" />
              <span className="w-0.5 h-full bg-current" /><span className="w-1 h-full bg-current" /><span className="w-2.5 h-full bg-current" />
              <span className="w-0.5 h-full bg-current" /><span className="w-1 h-full bg-current" /><span className="w-2 h-full bg-current" />
              <span className="w-0.5 h-full bg-current" /><span className="w-1.5 h-full bg-current" />
            </div>
          </div>

<div className="flex items-center gap-3">
  {/* Tu botón existente de Editar Perfil */}
  <button
    onClick={() => setModalEditarAbierto(true)}
    className="px-4 py-1.5 rounded-xl border border-neutral-300 dark:border-white/10 text-xs font-bold text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-white/5 transition-all shadow-sm"
  >
    Editar Perfil
  </button>
</div>
        </div>
      </section>

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

        {/* CONTENIDO 1: FAVORITAS (TOP 4 SERIES Y PELÍCULAS) */}
        {pestañaActiva === 'favoritas' && (
          <div className="space-y-12">
            {/* 1. TOP 4 SERIES FAVORITAS */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                  Series Favoritas (Top 4)
                </h3>
                <span className="text-[11px] font-mono text-neutral-400">SELECCIÓN PERSONAL</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((slot) => {
                  const fav = favoritos.find((f) => f.posicion === slot && f.tipo === 'serie');
                  const poster = fav?.poster_path
                    ? (fav.poster_path.startsWith('http') ? fav.poster_path : `https://image.tmdb.org/t/p/w500${fav.poster_path}`)
                    : null;

                  return (
<div
  key={`serie-slot-${slot}`}
  draggable={Boolean(fav)}
  onDragStart={() => setArrastrandoSlot(slot)}
  onDragOver={(e) => e.preventDefault()}
  onDrop={() => handleDropIntercambio(slot, 'serie')}
  onClick={() => {
    setRanuraSeleccionada(slot);
    setTipoFavorito('serie');
    setModalFavoritoAbierto(true);
  }}
  className={`group relative aspect-[2/3] rounded-2xl bg-[#141419] border transition-all cursor-pointer shadow-lg overflow-hidden flex flex-col justify-between ${
    arrastrandoSlot === slot ? 'opacity-40 border-rose-500 scale-95' : 'border-white/10 hover:border-rose-500'
  }`}
>
                      {poster ? (
                        <>
                          <img
                            src={poster}
                            alt={fav.titulo}
                            className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                          />
                          <div className="absolute top-3 left-3 z-10">
                            <span className="text-[9px] font-black uppercase px-2 py-0.5 bg-black/70 backdrop-blur-md border border-white/20 text-white rounded-md tracking-wider">
                              SERIE
                            </span>
                          </div>
                          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent p-4 flex flex-col justify-between">
                            <div className="flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                type="button"
                                onClick={(e) => handleEliminarFavorito(e, slot)}
                                className="w-7 h-7 rounded-full bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center text-xs font-bold transition shadow"
                                title="Quitar de favoritos"
                              >
                                ✕
                              </button>
                            </div>
                            <div>
                              <p className="text-sm font-black text-white truncate drop-shadow">
                                {fav.titulo}
                              </p>
                              <p className="text-[10px] text-neutral-400 font-mono">Top #{slot}</p>
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center hover:bg-white/5 transition">
                          <span className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-neutral-400 mb-2 group-hover:bg-rose-600 group-hover:text-white transition">
                            +
                          </span>
                          <span className="text-xs font-mono font-bold text-neutral-400 group-hover:text-white transition">
                            Elegir Serie {slot}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 2. TOP 4 PELÍCULAS FAVORITAS */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                  Películas Favoritas (Top 4)
                </h3>
                <span className="text-[11px] font-mono text-neutral-400">CINE</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((slot) => {
                  const fav = favoritos.find((f) => f.posicion === slot && f.tipo === 'pelicula');
                  const poster = fav?.poster_path
                    ? (fav.poster_path.startsWith('http') ? fav.poster_path : `https://image.tmdb.org/t/p/w500${fav.poster_path}`)
                    : null;

                  return (
<div
  key={`peli-slot-${slot}`}
  draggable={Boolean(fav)}
  onDragStart={() => setArrastrandoSlot(slot)}
  onDragOver={(e) => e.preventDefault()}
  onDrop={() => handleDropIntercambio(slot, 'pelicula')}
  onClick={() => {
    setRanuraSeleccionada(slot);
    setTipoFavorito('pelicula');
    setModalFavoritoAbierto(true);
  }}
  className={`group relative aspect-[2/3] rounded-2xl bg-[#141419] border transition-all cursor-pointer shadow-lg overflow-hidden flex flex-col justify-between ${
    arrastrandoSlot === slot ? 'opacity-40 border-rose-500 scale-95' : 'border-white/10 hover:border-rose-500'
  }`}
>
                      {poster ? (
                        <>
                          <img
                            src={poster}
                            alt={fav.titulo}
                            className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                          />
                          <div className="absolute top-3 left-3 z-10">
                            <span className="text-[9px] font-black uppercase px-2 py-0.5 bg-black/70 backdrop-blur-md border border-white/20 text-white rounded-md tracking-wider">
                              PELÍCULA
                            </span>
                          </div>
                          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent p-4 flex flex-col justify-between">
                            <div className="flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                type="button"
                                onClick={(e) => handleEliminarFavorito(e, slot)}
                                className="w-7 h-7 rounded-full bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center text-xs font-bold transition shadow"
                                title="Quitar de favoritos"
                              >
                                ✕
                              </button>
                            </div>
                            <div>
                              <p className="text-sm font-black text-white truncate drop-shadow">
                                {fav.titulo}
                              </p>
                              <p className="text-[10px] text-neutral-400 font-mono">Top #{slot}</p>
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center hover:bg-white/5 transition">
                          <span className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-neutral-400 mb-2 group-hover:bg-rose-600 group-hover:text-white transition">
                            +
                          </span>
                          <span className="text-xs font-mono font-bold text-neutral-400 group-hover:text-white transition">
                            Elegir Película {slot}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
{/* CONTENIDO 2: RÉCORDS EN FORMATO CUADRADO CON HOVER REVELADOR */}
{pestañaActiva === 'destacadas' && (
  <div className="space-y-6 animate-fadeIn">
    <div className="flex items-center justify-between">
      <h3 className="text-xs font-black uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
        Récords de Espectador
      </h3>
      <span className="text-[11px] font-mono text-neutral-400">ESTADÍSTICAS MÁXIMAS</span>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

      {/* 1. SERIE MARATÓN */}
      <div className="group relative rounded-3xl overflow-hidden border border-neutral-300 dark:border-white/10 shadow-xl min-h-[350px] sm:min-h-[380px] flex flex-col justify-between p-6 sm:p-8 bg-[#141419] transition-all duration-300 cursor-pointer">
        
        {/* Imagen de fondo en proporción amplia enfocada en la parte superior (cara) */}
        {records.maratonSerie?.poster_path && (
          <img
            src={
              records.maratonSerie.poster_path.startsWith('http') 
                ? records.maratonSerie.poster_path 
                : `https://image.tmdb.org/t/p/w780${records.maratonSerie.poster_path}`
            }
            alt={records.maratonSerie.titulo}
            className="absolute inset-0 w-full h-full object-cover object-top filter brightness-75 group-hover:brightness-100 group-hover:scale-105 transition-all duration-500 ease-out"
          />
        )}

        {/* Degradado: oscuro en reposo para leer textos, tenue en hover para ver toda la foto */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-black/30 group-hover:from-black/70 group-hover:via-black/20 group-hover:to-transparent transition-opacity duration-500 pointer-events-none" />

        {/* Badge Superior */}
        <div className="relative z-10 flex items-center justify-between">
          <span className="px-3.5 py-1 rounded-full bg-rose-600 text-white text-[10px] font-black uppercase tracking-widest shadow-md group-hover:bg-rose-500 transition-colors">
            MARATÓN
          </span>
          <span className="text-[11px] font-mono text-neutral-300 font-bold uppercase tracking-wider drop-shadow-sm">
            MAS EPISODIOS VISTOS
          </span>
        </div>

        {/* Título y Métrica Inferior */}
        <div className="relative z-10 pt-16 flex items-end justify-between gap-4">
          <div className="space-y-1">
            <h4 className="text-2xl sm:text-3xl font-black text-white leading-tight drop-shadow-lg">
              {records.maratonSerie ? records.maratonSerie.titulo : 'Sin registros'}
            </h4>
            <span className="text-xs font-mono text-neutral-300 font-medium drop-shadow-sm">
              
            </span>
          </div>

<div className="flex flex-col items-center justify-center flex-shrink-0 min-w-[70px]">
  <span className="text-4xl sm:text-5xl font-black font-mono text-rose-500 drop-shadow-lg leading-none">
    {records.maratonSerie ? records.maratonSerie.total_capitulos : 0}
  </span>
  <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-300 font-bold drop-shadow-sm mt-1 text-center">
    Capítulos
  </span>
</div>
        </div>
      </div>

      {/* 2. PELÍCULA REWATCH */}
      <div className="group relative rounded-3xl overflow-hidden border border-neutral-300 dark:border-white/10 shadow-xl min-h-[350px] sm:min-h-[380px] flex flex-col justify-between p-6 sm:p-8 bg-[#141419] transition-all duration-300 cursor-pointer">
        
        {/* Imagen de fondo enfocada en el centro/arriba */}
        {records.rewatchPelicula?.poster_path && (
          <img
            src={
              records.rewatchPelicula.poster_path.startsWith('http') 
                ? records.rewatchPelicula.poster_path 
                : `https://image.tmdb.org/t/p/w780${records.rewatchPelicula.poster_path}`
            }
            alt={records.rewatchPelicula.titulo}
            className="absolute inset-0 w-full h-full object-cover object-top filter brightness-75 group-hover:brightness-100 group-hover:scale-105 transition-all duration-500 ease-out"
          />
        )}

        {/* Degradado interactivo */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-black/30 group-hover:from-black/70 group-hover:via-black/20 group-hover:to-transparent transition-opacity duration-500 pointer-events-none" />

        {/* Badge Superior */}
        <div className="relative z-10 flex items-center justify-between">
          <span className="px-3.5 py-1 rounded-full bg-amber-500 text-white text-[10px] font-black uppercase tracking-widest shadow-md group-hover:bg-amber-400 transition-colors">
            REWATCH
          </span>
          <span className="text-[11px] font-mono text-neutral-300 font-bold uppercase tracking-wider drop-shadow-sm">
            PELÍCULA MÁS VECES VISTA
          </span>
        </div>

        {/* Título y Métrica Inferior */}
        <div className="relative z-10 pt-16 flex items-end justify-between gap-4">
          <div className="space-y-1">
            <h4 className="text-2xl sm:text-3xl font-black text-white leading-tight drop-shadow-lg">
              {records.rewatchPelicula ? records.rewatchPelicula.titulo : 'Sin repeticiones'}
            </h4>
            <span className="text-xs font-mono text-neutral-300 font-medium drop-shadow-sm">
      
            </span>
          </div>

<div className="flex flex-col items-center justify-center flex-shrink-0 min-w-[70px]">
  <span className="text-4xl sm:text-5xl font-black font-mono text-amber-400 drop-shadow-lg leading-none">
    {records.rewatchPelicula ? records.rewatchPelicula.veces_vista : 0}
  </span>
  <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-300 font-bold drop-shadow-sm mt-1 text-center">
    Veces Vista
  </span>
</div>
        </div>
      </div>

    </div>
  </div>
)}

        {/* CONTENIDO 3: VER MÁS TARDE (PENDIENTES) */}
        {pestañaActiva === 'por_ver' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                Mi Lista ({pendientes.length})
              </h3>
              <span className="text-[11px] font-mono text-neutral-400">VER MÁS TARDE</span>
            </div>

            {cargandoPendientes && (
              <p className="text-xs text-center text-neutral-400 py-16 font-mono animate-pulse">
                Cargando títulos guardados...
              </p>
            )}

            {!cargandoPendientes && pendientes.length === 0 && (
              <div className="p-16 text-center rounded-3xl border-2 border-dashed border-neutral-300 dark:border-white/10 bg-white/40 dark:bg-white/[0.01] space-y-2">
                <p className="text-sm font-bold text-neutral-700 dark:text-neutral-300">
                  Tu lista de pendientes está vacía.
                </p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  Abre cualquier película o serie desde Tendencias o el Buscador y toca "Ver más tarde".
                </p>
              </div>
            )}

            {!cargandoPendientes && pendientes.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-4">
                {pendientes.map((item) => {
                  const poster = item.poster_path
                    ? (item.poster_path.startsWith('http') ? item.poster_path : `https://image.tmdb.org/t/p/w500${item.poster_path}`)
                    : null;
                  const esSerie = item.tipo === 'serie';

                  return (
                    <div
                      key={`pendiente-${item.tmdb_id}`}
                      onClick={() => {
                        setObraParaRegistrar({
                          tmdb_id: item.tmdb_id,
                          id: item.tmdb_id,
                          tipo: item.tipo,
                          titulo: item.titulo,
                          poster_path: poster,
                        });
                      }}
                      className="group relative aspect-[2/3] rounded-2xl bg-[#141419] border border-white/10 hover:border-rose-500 transition-all shadow-lg overflow-hidden flex flex-col justify-between cursor-pointer hover:-translate-y-1"
                    >
                      {poster ? (
                        <img
                          src={poster}
                          alt={item.titulo}
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs font-mono text-neutral-500 p-2 text-center">
                          Sin Póster
                        </div>
                      )}

                      {/* Badge Tipo */}
                      <div className="absolute top-3 left-3 z-10 pointer-events-none">
                        <span className="text-[9px] font-black uppercase px-2 py-0.5 bg-black/70 backdrop-blur-md border border-white/20 text-white rounded-md tracking-wider">
                          {esSerie ? 'SERIE' : 'PELÍCULA'}
                        </span>
                      </div>

                      {/* Botón Quitar */}
                      <div className="absolute top-3 right-3 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          type="button"
                          onClick={(e) => handleQuitarPendiente(e, item.tmdb_id)}
                          className="w-7 h-7 rounded-full bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center text-xs font-bold transition shadow cursor-pointer active:scale-90"
                          title="Quitar de mi lista"
                        >
                          ✕
                        </button>
                      </div>

                      {/* Degradado inferior con título */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent p-4 flex flex-col justify-end pointer-events-none">
                        <p className="text-sm font-black text-white truncate drop-shadow">
                          {item.titulo}
                        </p>
                        <span className="text-[10px] text-rose-400 font-bold group-hover:text-white transition">
                          ▶ Toca para ver / registrar
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </section>

      {/* Modal Editar Perfil */}
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
      

      {/* Modal Elegir Favorito */}
      {modalFavoritoAbierto && (
        <ModalElegirFavorito
          posicion={ranuraSeleccionada}
          tipoEsperado={tipoFavorito}
          onClose={() => setModalFavoritoAbierto(false)}
          onSeleccionar={handleGuardarFavorito}
        />
      )}

      {/* Modal Registrar Visualización al tocar una tarjeta de Pendientes */}
      {obraParaRegistrar && (
        <ModalRegistrar
          obra={obraParaRegistrar}
          onClose={() => setObraParaRegistrar(null)}
          onRegistroCompletado={handleRegistroCompletado}
          onCambiarObra={(nueva) => setObraParaRegistrar(nueva)}
        />
      )}
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