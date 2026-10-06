import React, { useEffect, useState } from 'react';
import { 
  obtenerMetricasAdminAPI, 
  actualizarRolUsuarioAdminAPI, 
  eliminarUsuarioAdminAPI,
  obtenerReseniasAdminAPI,
  eliminarTextoReseniaAdminAPI,
  eliminarVisualizacionAdminAPI
} from '../api';
import { useAuth } from '../context/AuthContext';
import { Navigate, Link } from 'react-router-dom';
import { 
  Shield, 
  Users, 
  Film, 
  MessageSquare, 
  TrendingUp, 
  Search, 
  ExternalLink, 
  Trash2, 
  ShieldAlert, 
  ShieldCheck, 
  Star, 
  Eraser, 
  AlertTriangle,
  Calendar,
  Check
} from 'lucide-react';

const resolverImagen = (ruta) => {
  if (!ruta) return null;
  if (ruta.startsWith('http')) return ruta;
  return `https://image.tmdb.org/t/p/w500${ruta.startsWith('/') ? ruta : `/${ruta}`}`;
};

export default function AdminPanel() {
  const { usuario } = useAuth();
  const [pestanaActiva, setPestanaActiva] = useState('metricas'); // 'metricas' | 'usuarios' | 'resenias'
  const [datos, setDatos] = useState(null);
  const [resenias, setResenias] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [cargandoResenias, setCargandoResenias] = useState(false);
  const [error, setError] = useState(null);
  const [notificacion, setNotificacion] = useState(null);

  // Filtros de búsqueda
  const [busquedaUsuario, setBusquedaUsuario] = useState('');
  const [busquedaResenia, setBusquedaResenia] = useState('');

  // Modales de Confirmación
  const [modalUsuarioEliminar, setModalUsuarioEliminar] = useState(null);
  const [modalReseniaAccion, setModalReseniaAccion] = useState(null); // { tipo: 'limpiar' | 'eliminar', resenia }
  const [accionEnProgreso, setAccionEnProgreso] = useState(false);

  const mostrarToast = (mensaje) => {
    setNotificacion(mensaje);
    setTimeout(() => setNotificacion(null), 3500);
  };

  const cargarDatosPrincipales = async () => {
    try {
      const res = await obtenerMetricasAdminAPI();
      setDatos(res);
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  };

  const cargarResenias = async () => {
    setCargandoResenias(true);
    try {
      const res = await obtenerReseniasAdminAPI();
      setResenias(res.resenias || []);
    } catch (err) {
      mostrarToast(`⚠️ Error al cargar reseñas: ${err.message}`);
    } finally {
      setCargandoResenias(false);
    }
  };

  useEffect(() => {
    cargarDatosPrincipales();
  }, []);

  useEffect(() => {
    if (pestanaActiva === 'resenias' && resenias.length === 0) {
      cargarResenias();
    }
  }, [pestanaActiva]);

  // Redirección si no es admin
  if (!usuario || usuario.rol !== 'admin') {
    return <Navigate to="/" replace />;
  }

  // --- Handlers de Usuarios ---
  const handleCambiarRol = async (targetUser) => {
    const nuevoRol = targetUser.rol === 'admin' ? 'usuario' : 'admin';
    try {
      await actualizarRolUsuarioAdminAPI(targetUser.id, nuevoRol);
      mostrarToast(`✓ Rol de @${targetUser.username} cambiado a ${nuevoRol.toUpperCase()}`);
      // Actualizar estado local
      setDatos((prev) => ({
        ...prev,
        usuarios: prev.usuarios.map((u) => (u.id === targetUser.id ? { ...u, rol: nuevoRol } : u)),
      }));
    } catch (err) {
      mostrarToast(`⚠️ Error: ${err.message}`);
    }
  };

  const handleConfirmarEliminarUsuario = async () => {
    if (!modalUsuarioEliminar) return;
    setAccionEnProgreso(true);
    try {
      await eliminarUsuarioAdminAPI(modalUsuarioEliminar.id);
      mostrarToast(`✓ Usuario @${modalUsuarioEliminar.username} eliminado correctamente`);
      setDatos((prev) => ({
        ...prev,
        usuarios: prev.usuarios.filter((u) => u.id !== modalUsuarioEliminar.id),
        resumen: {
          ...prev.resumen,
          totalUsuarios: Math.max(0, (prev.resumen?.totalUsuarios || 1) - 1),
        },
      }));
      setModalUsuarioEliminar(null);
    } catch (err) {
      mostrarToast(`⚠️ Error: ${err.message}`);
    } finally {
      setAccionEnProgreso(false);
    }
  };

  // --- Handlers de Reseñas ---
  const handleConfirmarAccionResenia = async () => {
    if (!modalReseniaAccion) return;
    setAccionEnProgreso(true);
    const { tipo, resenia } = modalReseniaAccion;

    try {
      if (tipo === 'limpiar') {
        await eliminarTextoReseniaAdminAPI(resenia.id);
        mostrarToast('✓ Texto de reseña eliminado por moderación');
        setResenias((prev) => prev.filter((r) => r.id !== resenia.id));
      } else {
        await eliminarVisualizacionAdminAPI(resenia.id);
        mostrarToast('✓ Registro de visualización eliminado por completo');
        setResenias((prev) => prev.filter((r) => r.id !== resenia.id));
      }
      setModalReseniaAccion(null);
    } catch (err) {
      mostrarToast(`⚠️ Error: ${err.message}`);
    } finally {
      setAccionEnProgreso(false);
    }
  };

  if (cargando) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center text-neutral-400 text-sm font-bold animate-pulse">
        Cargando centro de control de administrador...
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3">
        <p className="text-rose-500 font-bold">⚠️ {error}</p>
        <button
          onClick={cargarDatosPrincipales}
          className="px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-bold cursor-pointer"
        >
          Reintentar
        </button>
      </div>
    );
  }

  const { resumen, topObras, usuarios } = datos || {};

  // Filtrado de usuarios
  const usuariosFiltrados = (usuarios || []).filter((u) => {
    const termino = busquedaUsuario.toLowerCase().trim();
    if (!termino) return true;
    return (
      (u.username && u.username.toLowerCase().includes(termino)) ||
      (u.email && u.email.toLowerCase().includes(termino))
    );
  });

  // Filtrado de reseñas
  const reseniasFiltradas = (resenias || []).filter((r) => {
    const termino = busquedaResenia.toLowerCase().trim();
    if (!termino) return true;
    return (
      (r.username && r.username.toLowerCase().includes(termino)) ||
      (r.obra_titulo && r.obra_titulo.toLowerCase().includes(termino)) ||
      (r.resenia && r.resenia.toLowerCase().includes(termino))
    );
  });

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-8 animate-fadeIn relative">
      
      {/* Toast Flotante */}
      {notificacion && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 rounded-2xl bg-neutral-900/90 text-white dark:bg-white dark:text-neutral-900 font-black text-xs shadow-2xl backdrop-blur-md animate-fadeIn flex items-center gap-2 border border-white/10">
          <span>{notificacion}</span>
        </div>
      )}

      {/* Cabecera Principal */}
      <div className="border-b border-neutral-200 dark:border-white/10 pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-rose-600/10 dark:bg-rose-600/20 text-rose-600 flex items-center justify-center font-black">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-neutral-900 dark:text-white tracking-tight flex items-center gap-2">
                Panel de Administración
              </h1>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                Supervisión global, gestión de usuarios y moderación de contenido en CineRewind.
              </p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <span className="text-xs font-black px-3.5 py-1.5 rounded-xl bg-rose-600/10 text-rose-600 border border-rose-600/20 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4" />
            <span>Admin: @{usuario.username}</span>
          </span>
        </div>
      </div>

      {/* Pestañas de Navegación del Panel */}
      <div className="flex items-center gap-2 border-b border-neutral-200 dark:border-white/10 pb-1 overflow-x-auto scrollbar-none">
        <button
          onClick={() => setPestanaActiva('metricas')}
          className={`px-4 py-2.5 rounded-xl text-xs font-black transition flex items-center gap-2 cursor-pointer ${
            pestanaActiva === 'metricas'
              ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow'
              : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-white/5'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Métricas y Estadísticas</span>
        </button>

        <button
          onClick={() => setPestanaActiva('usuarios')}
          className={`px-4 py-2.5 rounded-xl text-xs font-black transition flex items-center gap-2 cursor-pointer ${
            pestanaActiva === 'usuarios'
              ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow'
              : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-white/5'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Gestión de Usuarios ({usuarios?.length || 0})</span>
        </button>

        <button
          onClick={() => setPestanaActiva('resenias')}
          className={`px-4 py-2.5 rounded-xl text-xs font-black transition flex items-center gap-2 cursor-pointer ${
            pestanaActiva === 'resenias'
              ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow'
              : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-white/5'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>Moderación de Reseñas</span>
        </button>
      </div>

      {/* ========================================================
          PESTAÑA 1: MÉTRICAS Y ESTADÍSTICAS GLOBALES
          ======================================================== */}
      {pestanaActiva === 'metricas' && (
        <div className="space-y-8 animate-fadeIn">
          {/* Tarjetas de Métricas Generales */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-5">
            <div className="p-5 rounded-2xl bg-white dark:bg-[#181820] border border-neutral-200 dark:border-white/10 shadow-sm space-y-1">
              <div className="flex items-center justify-between text-neutral-400">
                <span className="text-[11px] font-black uppercase tracking-wider">Total Usuarios</span>
                <Users className="w-4 h-4 text-blue-500" />
              </div>
              <p className="text-3xl font-black text-neutral-900 dark:text-white">{resumen?.totalUsuarios || 0}</p>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-[#181820] border border-neutral-200 dark:border-white/10 shadow-sm space-y-1">
              <div className="flex items-center justify-between text-neutral-400">
                <span className="text-[11px] font-black uppercase tracking-wider">Visualizaciones</span>
                <Film className="w-4 h-4 text-rose-500" />
              </div>
              <p className="text-3xl font-black text-rose-600 dark:text-rose-500">{resumen?.totalVistos || 0}</p>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-[#181820] border border-neutral-200 dark:border-white/10 shadow-sm space-y-1">
              <div className="flex items-center justify-between text-neutral-400">
                <span className="text-[11px] font-black uppercase tracking-wider">Catálogo TMDB</span>
                <Film className="w-4 h-4 text-amber-500" />
              </div>
              <p className="text-3xl font-black text-neutral-900 dark:text-white">{resumen?.totalObras || 0}</p>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-[#181820] border border-neutral-200 dark:border-white/10 shadow-sm space-y-1">
              <div className="flex items-center justify-between text-neutral-400">
                <span className="text-[11px] font-black uppercase tracking-wider">Reseñas Escritas</span>
                <MessageSquare className="w-4 h-4 text-emerald-500" />
              </div>
              <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400">{resumen?.totalResenias || 0}</p>
            </div>
          </div>

          {/* Top 5 Obras Más Vistas */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-black text-neutral-900 dark:text-white flex items-center gap-2">
                <span>🔥</span> Títulos más populares de la comunidad
              </h2>
              <span className="text-xs text-neutral-400">Ranking en tiempo real</span>
            </div>

            {topObras?.length === 0 ? (
              <p className="text-xs text-neutral-400 italic">No hay registros de visualizaciones aún.</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                {topObras?.map((obra, index) => {
                  const imagenUrl = resolverImagen(obra.poster_path);
                  return (
                    <div
                      key={obra.id}
                      className="bg-white dark:bg-[#181820] border border-neutral-200 dark:border-white/10 rounded-2xl overflow-hidden p-2.5 flex flex-col justify-between shadow-sm group hover:border-rose-500/50 transition relative"
                    >
                      <span className="absolute top-4 left-4 z-10 w-6 h-6 rounded-full bg-black/80 backdrop-blur-md text-white font-black text-xs flex items-center justify-center border border-white/20">
                        #{index + 1}
                      </span>
                      <div className="aspect-[2/3] rounded-xl overflow-hidden bg-neutral-900 mb-2 relative">
                        {imagenUrl ? (
                          <img 
                            src={imagenUrl} 
                            alt={obra.titulo} 
                            loading="lazy"
                            className="w-full h-full object-cover group-hover:scale-105 transition duration-300" 
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[10px] text-neutral-500 p-2 text-center font-bold">
                            {obra.titulo}
                          </div>
                        )}
                      </div>
                      <div>
                        <h3 className="text-xs font-black text-neutral-900 dark:text-white truncate" title={obra.titulo}>
                          {obra.titulo}
                        </h3>
                        <div className="flex justify-between items-center text-[10px] text-neutral-400 mt-0.5">
                          <span className="uppercase font-bold text-neutral-500">{obra.tipo}</span>
                          <span className="font-black text-rose-500">{obra.veces_vista} vistas</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      )}

      {/* ========================================================
          PESTAÑA 2: GESTIÓN Y DIRECTORIO DE USUARIOS
          ======================================================== */}
      {pestanaActiva === 'usuarios' && (
        <section className="space-y-4 animate-fadeIn">
          {/* Barra de Filtro y Búsqueda */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-[#181820] p-3 rounded-2xl border border-neutral-200 dark:border-white/10">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar por usuario o email..."
                value={busquedaUsuario}
                onChange={(e) => setBusquedaUsuario(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-neutral-100 dark:bg-white/5 border border-transparent focus:border-rose-500 rounded-xl text-xs font-bold text-neutral-900 dark:text-white focus:outline-none"
              />
            </div>
            <span className="text-xs text-neutral-400 font-bold px-2 self-end sm:self-center">
              Mostrando {usuariosFiltrados.length} de {usuarios?.length || 0} usuarios
            </span>
          </div>

          {/* Tabla de Usuarios con Acciones */}
          <div className="border border-neutral-200 dark:border-white/10 rounded-2xl overflow-hidden bg-white dark:bg-[#181820] shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-neutral-200 dark:border-white/10 text-neutral-400 uppercase font-black tracking-wider text-[10px] bg-neutral-50 dark:bg-white/[0.02]">
                    <th className="p-3.5">Usuario</th>
                    <th className="p-3.5">Email</th>
                    <th className="p-3.5">Rol Actual</th>
                    <th className="p-3.5 text-center">Visualizaciones</th>
                    <th className="p-3.5 text-right">Acciones de Administrador</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200 dark:divide-white/5">
                  {usuariosFiltrados.map((u) => {
                    const esPropioAdmin = u.id === usuario.id;
                    return (
                      <tr key={u.id} className="hover:bg-neutral-50 dark:hover:bg-white/[0.02] transition">
                        <td className="p-3.5 font-bold text-neutral-900 dark:text-white">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full overflow-hidden bg-neutral-200 dark:bg-neutral-800 shrink-0 border border-neutral-300 dark:border-white/10">
                              <img
                                src={u.avatar_url || '/avatares/Avatar_1.png'}
                                alt={u.username}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="flex flex-col">
                              <span className="font-black text-neutral-900 dark:text-white">@{u.username}</span>
                              {esPropioAdmin && (
                                <span className="text-[9px] font-bold text-rose-500 uppercase tracking-wider">
                                  (Tu sesión actual)
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="p-3.5 text-neutral-500 dark:text-neutral-400 font-medium">
                          {u.email}
                        </td>

                        <td className="p-3.5">
                          <span
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase inline-flex items-center gap-1 ${
                              u.rol === 'admin'
                                ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                                : 'bg-neutral-200/80 dark:bg-white/10 text-neutral-600 dark:text-neutral-400'
                            }`}
                          >
                            {u.rol === 'admin' ? <ShieldCheck className="w-3 h-3" /> : null}
                            <span>{u.rol}</span>
                          </span>
                        </td>

                        <td className="p-3.5 text-center font-black text-rose-600 dark:text-rose-500">
                          {u.cantidad_vistos}
                        </td>

                        <td className="p-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5 flex-wrap">
                            {/* Ver Perfil */}
                            <Link
                              to={`/perfil/${u.username}`}
                              className="px-2.5 py-1 rounded-lg bg-neutral-100 dark:bg-white/5 hover:bg-neutral-200 dark:hover:bg-white/10 text-neutral-700 dark:text-neutral-200 font-bold text-[11px] transition flex items-center gap-1 cursor-pointer"
                              title="Visitar perfil público"
                            >
                              <ExternalLink className="w-3 h-3" />
                              <span>Ver Perfil</span>
                            </Link>

                            {/* Cambiar Rol */}
                            {!esPropioAdmin && (
                              <button
                                type="button"
                                onClick={() => handleCambiarRol(u)}
                                className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition cursor-pointer border ${
                                  u.rol === 'admin'
                                    ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 hover:bg-amber-500/20'
                                    : 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20 hover:bg-indigo-500/20'
                                }`}
                                title={u.rol === 'admin' ? 'Degradar a usuario normal' : 'Hacer administrador'}
                              >
                                {u.rol === 'admin' ? 'Quitar Admin' : 'Hacer Admin'}
                              </button>
                            )}

                            {/* Eliminar Cuenta */}
                            {!esPropioAdmin && (
                              <button
                                type="button"
                                onClick={() => setModalUsuarioEliminar(u)}
                                className="px-2 py-1 rounded-lg bg-rose-600/10 hover:bg-rose-600 text-rose-600 hover:text-white font-bold text-[11px] transition cursor-pointer border border-rose-600/20"
                                title="Eliminar cuenta de forma definitiva"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {/* ========================================================
          PESTAÑA 3: MODERACIÓN DE RESEÑAS
          ======================================================== */}
      {pestanaActiva === 'resenias' && (
        <section className="space-y-4 animate-fadeIn">
          {/* Barra de Filtro y Búsqueda */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-[#181820] p-3 rounded-2xl border border-neutral-200 dark:border-white/10">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar por usuario, título o texto..."
                value={busquedaResenia}
                onChange={(e) => setBusquedaResenia(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-neutral-100 dark:bg-white/5 border border-transparent focus:border-rose-500 rounded-xl text-xs font-bold text-neutral-900 dark:text-white focus:outline-none"
              />
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={cargarResenias}
                className="text-xs font-bold text-rose-600 hover:underline cursor-pointer"
              >
                Refrescar reseñas
              </button>
              <span className="text-xs text-neutral-400 font-bold px-2">
                {reseniasFiltradas.length} reseñas listadas
              </span>
            </div>
          </div>

          {cargandoResenias ? (
            <div className="py-20 text-center text-xs font-bold text-neutral-400 animate-pulse">
              Cargando últimas reseñas públicas...
            </div>
          ) : reseniasFiltradas.length === 0 ? (
            <div className="py-20 text-center text-xs font-bold text-neutral-400 bg-white dark:bg-[#181820] rounded-2xl border border-neutral-200 dark:border-white/10">
              No se encontraron reseñas con texto para moderar.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {reseniasFiltradas.map((r) => {
                const posterUrl = resolverImagen(r.poster_path);
                return (
                  <div
                    key={r.id}
                    className="p-4 rounded-2xl bg-white dark:bg-[#181820] border border-neutral-200 dark:border-white/10 shadow-sm flex flex-col justify-between gap-3 hover:border-neutral-300 dark:hover:border-white/20 transition"
                  >
                    <div className="space-y-3">
                      {/* Cabecera de la reseña: Usuario + Obra */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={r.avatar_url || '/avatares/Avatar_1.png'}
                            alt={r.username}
                            className="w-8 h-8 rounded-full object-cover border border-neutral-200 dark:border-white/10 shrink-0"
                          />
                          <div>
                            <Link
                              to={`/perfil/${r.username}`}
                              className="font-black text-xs text-neutral-900 dark:text-white hover:text-rose-600 dark:hover:text-rose-400 flex items-center gap-1"
                            >
                              <span>@{r.username}</span>
                              <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                            </Link>
                            <span className="text-[10px] text-neutral-400">
                              {r.fecha_visto ? new Date(r.fecha_visto).toLocaleDateString() : 'Sin fecha'}
                            </span>
                          </div>
                        </div>

                        {/* Calificación */}
                        {r.calificacion ? (
                          <div className="flex items-center gap-1 bg-amber-500/10 px-2 py-0.5 rounded-lg border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-black shrink-0">
                            <Star className="w-3 h-3 fill-amber-500" />
                            <span>{r.calificacion}</span>
                          </div>
                        ) : null}
                      </div>

                      {/* Tarjeta pequeña de la película / serie */}
                      <div className="flex items-center gap-3 p-2 bg-neutral-50 dark:bg-white/[0.02] rounded-xl border border-neutral-100 dark:border-white/5">
                        <div className="w-9 h-13 rounded-lg overflow-hidden bg-neutral-900 shrink-0">
                          {posterUrl ? (
                            <img src={posterUrl} alt={r.obra_titulo} className="w-full h-full object-cover" />
                          ) : null}
                        </div>
                        <div className="truncate">
                          <h4 className="font-black text-xs text-neutral-900 dark:text-white truncate">
                            {r.obra_titulo}
                          </h4>
                          <p className="text-[10px] font-bold text-neutral-400 uppercase">
                            {r.obra_tipo}
                            {r.temporada ? ` · T${r.temporada} E${r.episodio}` : ''}
                          </p>
                        </div>
                      </div>

                      {/* Texto de la Reseña */}
                      <div className="p-3 bg-neutral-100 dark:bg-neutral-900/60 rounded-xl text-xs text-neutral-700 dark:text-neutral-200 font-medium italic border-l-2 border-rose-500">
                        "{r.resenia}"
                      </div>
                    </div>

                    {/* Botones de Moderación */}
                    <div className="pt-2 border-t border-neutral-100 dark:border-white/5 flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setModalReseniaAccion({ tipo: 'limpiar', resenia: r })}
                        className="px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500 text-amber-600 hover:text-white font-bold text-[11px] transition flex items-center gap-1.5 cursor-pointer border border-amber-500/20"
                        title="Borrar texto inapropiado manteniendo la visualización"
                      >
                        <Eraser className="w-3.5 h-3.5" />
                        <span>Borrar Texto</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setModalReseniaAccion({ tipo: 'eliminar', resenia: r })}
                        className="px-3 py-1.5 rounded-xl bg-rose-600/10 hover:bg-rose-600 text-rose-600 hover:text-white font-bold text-[11px] transition flex items-center gap-1.5 cursor-pointer border border-rose-600/20"
                        title="Eliminar registro completo por ser spam"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Eliminar Registro</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* ========================================================
          MODAL DE CONFIRMACIÓN: ELIMINAR USUARIO
          ======================================================== */}
      {modalUsuarioEliminar && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-[#181822] border border-neutral-300 dark:border-white/10 rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl text-neutral-900 dark:text-white my-auto">
            <div className="w-12 h-12 rounded-2xl bg-rose-600/10 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            
            <div className="text-center space-y-1">
              <h3 className="font-black text-lg">¿Eliminar usuario?</h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Estás a punto de borrar la cuenta de <strong className="text-neutral-900 dark:text-white">@{modalUsuarioEliminar.username}</strong> y todo su historial de visualizaciones, amigos y favoritos. Esta acción no se puede deshacer.
              </p>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setModalUsuarioEliminar(null)}
                disabled={accionEnProgreso}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-neutral-200 dark:bg-white/10 hover:bg-neutral-300 dark:hover:bg-white/15 transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmarEliminarUsuario}
                disabled={accionEnProgreso}
                className="flex-1 py-2.5 rounded-xl text-xs font-black bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-900/30 transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {accionEnProgreso ? 'Eliminando...' : 'Sí, Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL DE CONFIRMACIÓN: MODERAR / ELIMINAR RESEÑA
          ======================================================== */}
      {modalReseniaAccion && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-[#181822] border border-neutral-300 dark:border-white/10 rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl text-neutral-900 dark:text-white my-auto">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mx-auto ${
              modalReseniaAccion.tipo === 'limpiar'
                ? 'bg-amber-500/10 text-amber-600'
                : 'bg-rose-600/10 text-rose-600'
            }`}>
              {modalReseniaAccion.tipo === 'limpiar' ? (
                <Eraser className="w-6 h-6" />
              ) : (
                <Trash2 className="w-6 h-6" />
              )}
            </div>

            <div className="text-center space-y-1">
              <h3 className="font-black text-lg">
                {modalReseniaAccion.tipo === 'limpiar' ? '¿Borrar texto de la reseña?' : '¿Eliminar registro completo?'}
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                {modalReseniaAccion.tipo === 'limpiar'
                  ? `Se limpiará el comentario de @${modalReseniaAccion.resenia.username} para mantener un ambiente sano, pero el usuario conservará sus estrellas y fecha en el diario.`
                  : `Se borrará la entrada de @${modalReseniaAccion.resenia.username} para "${modalReseniaAccion.resenia.obra_titulo}" por considerarse spam o fraudulento.`}
              </p>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setModalReseniaAccion(null)}
                disabled={accionEnProgreso}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-neutral-200 dark:bg-white/10 hover:bg-neutral-300 dark:hover:bg-white/15 transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmarAccionResenia}
                disabled={accionEnProgreso}
                className={`flex-1 py-2.5 rounded-xl text-xs font-black text-white transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 ${
                  modalReseniaAccion.tipo === 'limpiar'
                    ? 'bg-amber-600 hover:bg-amber-500 shadow-lg shadow-amber-900/30'
                    : 'bg-rose-600 hover:bg-rose-500 shadow-lg shadow-rose-900/30'
                }`}
              >
                {accionEnProgreso ? 'Procesando...' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}

    </main>
  );
}