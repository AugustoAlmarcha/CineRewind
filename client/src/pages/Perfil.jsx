import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { obtenerEstadisticasAPI } from '../api';
import ModalEditarPerfil from '../components/modal/ModalEditarPerfil';
import ModalElegirFavorito from '../components/modal/ModalElegirFavorito';
import { 
  actualizarPerfilAPI, 
  obtenerFavoritosAPI, 
  guardarFavoritoAPI, 
  eliminarFavoritoAPI 
} from '../api';

export default function Perfil() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    total_series: 0,
    total_episodios: 0,
    total_peliculas: 0,
    horas_totales: 0
  });

  useEffect(() => {
    const cargarStats = async () => {
      try {
        const data = await obtenerEstadisticasAPI();
        setStats(data);
      } catch (err) {
        console.error('Error al cargar contadores:', err);
      }
    };
    cargarStats();
  }, []);
  const { usuario, actualizarUsuario, iniciarSesion } = useAuth();
  const [pestañaActiva, setPestañaActiva] = useState('favoritas');
  const [modalEditarAbierto, setModalEditarAbierto] = useState(false);

  // Estados para el Top 4 de Favoritos
  const [favoritos, setFavoritos] = useState([]);
  const [modalFavoritoAbierto, setModalFavoritoAbierto] = useState(false);
  const [ranuraSeleccionada, setRanuraSeleccionada] = useState(null);
  const [tipoFavorito, setTipoFavorito] = useState('serie');

  // Cargar los favoritos reales desde la base de datos
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

  // Manejador para guardar o reemplazar un póster seleccionado
  const handleGuardarFavorito = async (obraSeleccionada) => {
    try {
      await guardarFavoritoAPI(obraSeleccionada);
      await cargarFavoritos();
      setModalFavoritoAbierto(false);
    } catch (err) {
      console.error('Error al guardar favorito:', err);
    }
  };

  // Manejador para quitar un póster de la ranura
  const handleEliminarFavorito = async (e, posicion) => {
    e.stopPropagation();
    try {
      await eliminarFavoritoAPI(posicion);
      await cargarFavoritos();
    } catch (err) {
      console.error('Error al eliminar favorito:', err);
    }
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

          {/* Marcadores de celuloide */}
{/* Marcadores de celuloide con redirección automática */}
<div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-neutral-300/80 dark:border-white/10">
  
  {/* 1. SERIES -> Lleva a Inicio con Total Histórico + Filtro Series */}
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

  {/* 2. EPISODIOS -> Lleva a Inicio con Total Histórico + Filtro Series */}
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

  {/* 3. PELÍCULAS -> Lleva a Inicio con Total Histórico + Filtro Películas */}
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

  {/* 4. HORAS TOTALES (Cine + Series acumuladas) */}
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

          <button
            type="button"
            onClick={() => setModalEditarAbierto(true)}
            className="w-full py-2.5 px-4 rounded-xl border border-rose-500/40 bg-rose-600/10 hover:bg-rose-600 text-rose-600 hover:text-white dark:text-rose-400 dark:hover:text-white text-xs font-black transition cursor-pointer active:scale-95 shadow-xs"
          >
            Editar Credencial
          </button>
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
              Por Ver
            </button>
          </div>
        </div>

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
              onClick={() => {
                setRanuraSeleccionada(slot);
                setTipoFavorito('serie');
                setModalFavoritoAbierto(true);
              }}
              className="group relative aspect-[2/3] rounded-2xl bg-[#141419] border border-white/10 hover:border-rose-500 transition-all cursor-pointer shadow-lg overflow-hidden flex flex-col justify-between"
            >
              {poster ? (
                <>
                  <img
                    src={poster}
                    alt={fav.titulo}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  />
                  {/* Badge Serie arriba a la izquierda */}
                  <div className="absolute top-3 left-3 z-10">
                    <span className="text-[9px] font-black uppercase px-2 py-0.5 bg-black/70 backdrop-blur-md border border-white/20 text-white rounded-md tracking-wider">
                      SERIE
                    </span>
                  </div>

                  {/* Gradiente inferior con título y botón de quitar */}
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
        <span className="text-[11px] font-mono text-neutral-400">ESCALA CINE</span>
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
              onClick={() => {
                setRanuraSeleccionada(slot);
                setTipoFavorito('pelicula');
                setModalFavoritoAbierto(true);
              }}
              className="group relative aspect-[2/3] rounded-2xl bg-[#141419] border border-white/10 hover:border-rose-500 transition-all cursor-pointer shadow-lg overflow-hidden flex flex-col justify-between"
            >
              {poster ? (
                <>
                  <img
                    src={poster}
                    alt={fav.titulo}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  />
                  {/* Badge Película arriba a la izquierda */}
                  <div className="absolute top-3 left-3 z-10">
                    <span className="text-[9px] font-black uppercase px-2 py-0.5 bg-black/70 backdrop-blur-md border border-white/20 text-white rounded-md tracking-wider">
                      PELÍCULA
                    </span>
                  </div>

                  {/* Gradiente inferior */}
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

        {/* CONTENIDO 2: RÉCORDS */}
        {pestañaActiva === 'destacadas' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="rounded-3xl p-6 bg-white dark:bg-[#181820] border-2 border-neutral-200 dark:border-white/10 shadow-md flex flex-col justify-between min-h-[220px]">
              <div className="flex items-center justify-between border-b border-neutral-200 dark:border-white/10 pb-3">
                <span className="px-2.5 py-0.5 rounded-md bg-rose-500/10 text-rose-600 dark:text-rose-400 text-[10px] font-black uppercase tracking-wider">
                  SERIE CON MÁS EPISODIOS
                </span>
                <span className="text-xs text-neutral-400 font-mono">MARATÓN</span>
              </div>
              <div className="py-6 text-center space-y-1">
                <p className="text-sm font-bold text-neutral-800 dark:text-neutral-200">
                  Sin registros suficientes
                </p>
                <p className="text-xs text-neutral-400">
                  Avanza episodios en tus series para ver aquí tu maratón récord.
                </p>
              </div>
              <div className="text-[10px] font-mono text-neutral-500 dark:text-neutral-400 border-t border-neutral-200 dark:border-white/10 pt-3 flex justify-between">
                <span>TOTAL VISTO</span>
                <span className="font-bold">0 CAPÍTULOS</span>
              </div>
            </div>

            <div className="rounded-3xl p-6 bg-white dark:bg-[#181820] border-2 border-neutral-200 dark:border-white/10 shadow-md flex flex-col justify-between min-h-[220px]">
              <div className="flex items-center justify-between border-b border-neutral-200 dark:border-white/10 pb-3">
                <span className="px-2.5 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-black uppercase tracking-wider">
                  PELÍCULA MÁS REPETIDA
                </span>
                <span className="text-xs text-neutral-400 font-mono">REWATCH</span>
              </div>
              <div className="py-6 text-center space-y-1">
                <p className="text-sm font-bold text-neutral-800 dark:text-neutral-200">
                  Sin registros repetidos
                </p>
                <p className="text-xs text-neutral-400">
                  La película que registres más de una vez aparecerá como tu récord.
                </p>
              </div>
              <div className="text-[10px] font-mono text-neutral-500 dark:text-neutral-400 border-t border-neutral-200 dark:border-white/10 pt-3 flex justify-between">
                <span>REPRODUCCIONES</span>
                <span className="font-bold">0 VECES</span>
              </div>
            </div>
          </div>
        )}

        {/* CONTENIDO 3: POR VER */}
        {pestañaActiva === 'por_ver' && (
          <div className="p-12 text-center rounded-3xl border-2 border-dashed border-neutral-300 dark:border-white/10 bg-white/40 dark:bg-white/[0.01]">
            <p className="text-sm font-bold text-neutral-500 dark:text-neutral-400">
              Tu lista de pendientes está vacía. Guarda títulos desde el catálogo para verlos organizados aquí.
            </p>
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
    </main>
  );
}