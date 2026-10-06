import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  UserPlus,
  UserCheck,
  Search,
  Mail,
  Film,
  Trash2,
  Check,
  X,
  Clock,
  ArrowRight,
  Calendar,
  AlertTriangle,
  Clapperboard
} from 'lucide-react';
import {
  buscarCinefilosAPI,
  enviarSolicitudAmistadAPI,
  obtenerSolicitudesPendientesAPI,
  responderSolicitudAmistadAPI,
  obtenerAmigosAPI,
  eliminarAmigoAPI,
  obtenerInvitacionesCovisionAPI,
  responderInvitacionCovisionAPI
} from '../../api';

export default function ModalAmigos({ onClose, onActualizado }) {
  const navigate = useNavigate();
  const [pestana, setPestana] = useState('buscar'); // 'buscar' | 'pendientes' | 'amigos' | 'covisiones'
  const [query, setQuery] = useState('');
  const [resultados, setResultados] = useState([]);
  const [pendientes, setPendientes] = useState([]);
  const [amigos, setAmigos] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [invitaciones, setInvitaciones] = useState([]);

  // Toast flotante estilizado
  const [notificacion, setNotificacion] = useState(null);

  // Estado para confirmación de eliminación de amigo
  const [amigoAEliminar, setAmigoAEliminar] = useState(null);

  const mostrarMensaje = (texto, tipo = 'exito') => {
    setNotificacion({ texto, tipo });
    setTimeout(() => {
      setNotificacion(null);
    }, 3000);
  };

  const cargarListas = async () => {
    try {
      const [listaPendientes, listaAmigos, listaInvitaciones] = await Promise.all([
        obtenerSolicitudesPendientesAPI(),
        obtenerAmigosAPI(),
        obtenerInvitacionesCovisionAPI(),
      ]);
      setPendientes(Array.isArray(listaPendientes) ? listaPendientes : []);
      setAmigos(Array.isArray(listaAmigos) ? listaAmigos : []);
      setInvitaciones(Array.isArray(listaInvitaciones) ? listaInvitaciones : []);
    } catch (err) {
      console.error('Error cargando listas:', err);
    }
  };

  useEffect(() => {
    cargarListas();
  }, []);

  useEffect(() => {
    if (!query.trim()) {
      setResultados([]);
      return;
    }
    const timer = setTimeout(async () => {
      setCargando(true);
      try {
        const data = await buscarCinefilosAPI(query);
        setResultados(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error(err);
      } finally {
        setCargando(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const handleEnviarSolicitud = async (destinatarioId) => {
    try {
      await enviarSolicitudAmistadAPI(destinatarioId);
      setResultados((prev) =>
        prev.map((u) => (u.id === destinatarioId ? { ...u, estado_relacion: 'solicitud_enviada' } : u))
      );
      mostrarMensaje('¡Solicitud de amistad enviada!', 'exito');
    } catch (err) {
      mostrarMensaje(err.message || 'No se pudo enviar la solicitud', 'error');
    }
  };

  const handleResponder = async (solicitudId, accion) => {
    try {
      await responderSolicitudAmistadAPI(solicitudId, accion);
      await cargarListas();
      mostrarMensaje(
        accion === 'aceptar' ? '¡Solicitud aceptada! Ahora son amigos' : 'Solicitud rechazada',
        'exito'
      );
    } catch {
      mostrarMensaje('Error al responder la solicitud', 'error');
    }
  };

  const handleResponderCovision = async (covisualizacionId, accion) => {
    try {
      await responderInvitacionCovisionAPI(covisualizacionId, accion);
      await cargarListas();
      
      if (accion === 'aceptar' && onActualizado) {
        onActualizado();
      }

      mostrarMensaje(
        accion === 'aceptar' ? '¡Visualización añadida a tu historial!' : 'Invitación rechazada',
        'exito'
      );
    } catch (err) {
      mostrarMensaje(err.message || 'Error al responder', 'error');
    }
  };

  const confirmarEliminarAmigo = async () => {
    if (!amigoAEliminar) return;
    try {
      await eliminarAmigoAPI(amigoAEliminar.amistad_id);
      setAmigos((prev) => prev.filter((a) => a.amistad_id !== amigoAEliminar.amistad_id));
      mostrarMensaje(`Has eliminado a ${amigoAEliminar.nombre}`, 'exito');
    } catch {
      mostrarMensaje('No se pudo eliminar al amigo', 'error');
    } finally {
      setAmigoAEliminar(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative bg-[#fbf9f4] dark:bg-[#141419] border-t sm:border border-neutral-300 dark:border-white/10 rounded-t-3xl sm:rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col h-[92vh] sm:h-[82vh] text-neutral-900 dark:text-white transition-colors duration-300">
        
        {/* Manija táctil superior para celulares */}
        <div className="pt-2.5 pb-1 sm:hidden flex justify-center flex-shrink-0">
          <div className="w-10 h-1 bg-neutral-300 dark:bg-white/20 rounded-full" />
        </div>

        {/* Toast Flotante Personalizado */}
        {notificacion && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 animate-bounce">
            <div
              className={`px-4 py-2 rounded-2xl shadow-xl border text-xs font-bold flex items-center gap-2 backdrop-blur-md ${
                notificacion.tipo === 'exito'
                  ? 'bg-emerald-600/95 border-emerald-400 text-white'
                  : 'bg-rose-600/95 border-rose-400 text-white'
              }`}
            >
              {notificacion.tipo === 'exito' ? (
                <Check className="w-3.5 h-3.5 stroke-[3]" />
              ) : (
                <X className="w-3.5 h-3.5 stroke-[3]" />
              )}
              <span>{notificacion.texto}</span>
            </div>
          </div>
        )}

        {/* Modal de confirmación para eliminar amigo */}
        {amigoAEliminar && (
          <div className="absolute inset-0 z-40 bg-black/70 backdrop-blur-xs flex items-center justify-center p-6 animate-fadeIn">
            <div className="bg-[#f2eee3] dark:bg-[#1a1a24] border border-neutral-300 dark:border-white/15 p-6 rounded-3xl max-w-sm w-full text-center space-y-4 shadow-2xl">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/10 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30 flex items-center justify-center mx-auto shadow-sm">
                <Trash2 className="w-6 h-6 stroke-[2.2]" />
              </div>
              <div className="space-y-1">
                <h4 className="font-black text-base text-neutral-900 dark:text-white">
                  ¿Eliminar a {amigoAEliminar.nombre}?
                </h4>
                <p className="text-xs text-neutral-600 dark:text-neutral-400">
                  Ya no verás su actividad ni podrán etiquetarse en co-visiones conjuntas.
                </p>
              </div>
              <div className="flex gap-2 justify-center pt-2">
                <button
                  type="button"
                  onClick={() => setAmigoAEliminar(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold border border-neutral-300 dark:border-white/10 hover:bg-neutral-200 dark:hover:bg-white/5 transition cursor-pointer text-neutral-700 dark:text-neutral-300"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={confirmarEliminarAmigo}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 active:scale-95 text-white transition cursor-pointer shadow-md flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Sí, eliminar</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Cabecera elegante */}
        <div className="p-4 sm:p-5 border-b border-neutral-200 dark:border-white/10 flex justify-between items-center bg-[#f2eee3]/70 dark:bg-[#181820]/90 backdrop-blur-md flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-600/10 dark:bg-rose-500/15 border border-rose-500/25 flex items-center justify-center text-rose-600 dark:text-rose-400 shadow-sm">
              <Users className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <span className="text-[10px] font-mono text-rose-600 dark:text-rose-500 uppercase font-black tracking-widest block">
                Comunidad Cinéfila
              </span>
              <h3 className="text-base sm:text-lg font-black tracking-tight text-neutral-900 dark:text-white">
                Conexiones & Amigos
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-neutral-200 dark:bg-white/10 hover:bg-rose-600 hover:text-white flex items-center justify-center text-neutral-600 dark:text-neutral-300 transition cursor-pointer shadow-xs"
            title="Cerrar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Pestañas Segmentadas Tipo Píldora (Moderna UI estilo Apple/Letterboxd) */}
        <div className="px-3 sm:px-5 pt-3 pb-2.5 bg-[#f7f4ed] dark:bg-[#16161c] border-b border-neutral-200 dark:border-white/10 flex-shrink-0">
          <div className="flex bg-neutral-200/70 dark:bg-black/30 p-1 rounded-2xl gap-1 overflow-x-auto scrollbar-thin flex-nowrap">
            <button
              type="button"
              onClick={() => setPestana('buscar')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-black tracking-wide transition-all cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap ${
                pestana === 'buscar'
                  ? 'bg-white dark:bg-[#22222d] text-rose-600 dark:text-rose-400 shadow-sm'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              <Search className="w-3.5 h-3.5" />
              <span>Buscar</span>
            </button>
            
            <button
              type="button"
              onClick={() => setPestana('pendientes')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-black tracking-wide transition-all cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap ${
                pestana === 'pendientes'
                  ? 'bg-white dark:bg-[#22222d] text-rose-600 dark:text-rose-400 shadow-sm'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Solicitudes</span>
              {pendientes.length > 0 && (
                <span className="px-1.5 py-0.2 bg-rose-600 text-white rounded-full text-[10px] font-black">
                  {pendientes.length}
                </span>
              )}
            </button>
            
            <button
              type="button"
              onClick={() => setPestana('amigos')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-black tracking-wide transition-all cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap ${
                pestana === 'amigos'
                  ? 'bg-white dark:bg-[#22222d] text-rose-600 dark:text-rose-400 shadow-sm'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Amigos</span>
              <span className="text-[10px] font-mono opacity-70 font-semibold">({amigos.length})</span>
            </button>
            
            <button
              type="button"
              onClick={() => setPestana('covisiones')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-black tracking-wide transition-all cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap ${
                pestana === 'covisiones'
                  ? 'bg-white dark:bg-[#22222d] text-rose-600 dark:text-rose-400 shadow-sm'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              <Clapperboard className="w-3.5 h-3.5 text-amber-500" />
              <span>Co-visiones</span>
              {invitaciones.length > 0 && (
                <span className="px-1.5 py-0.2 bg-rose-600 text-white rounded-full text-[10px] font-black animate-pulse">
                  {invitaciones.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Contenido */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 scrollbar-thin">
          
          {/* PESTAÑA: BUSCAR */}
          {pestana === 'buscar' && (
            <div className="space-y-4">
              <div className="relative">
                <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Buscar cinéfilos por @username, nombre..."
                  className="w-full pl-10 pr-9 py-2.5 sm:py-3 rounded-2xl bg-white dark:bg-[#1e1e27] border border-neutral-300 dark:border-white/10 text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 focus:outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 text-xs sm:text-sm font-medium transition"
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => setQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-white p-1 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {cargando && (
                <div className="py-12 flex flex-col items-center justify-center gap-2">
                  <div className="w-6 h-6 border-2 border-rose-500 border-t-transparent rounded-full animate-spin" />
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 font-mono">Buscando en la comunidad...</p>
                </div>
              )}

              {!cargando && query.trim() && resultados.length === 0 && (
                <div className="py-12 text-center space-y-2">
                  <Users className="w-8 h-8 text-neutral-400 mx-auto stroke-[1.5]" />
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    No se encontraron cinéfilos con "{query}".
                  </p>
                </div>
              )}

              {!cargando && !query.trim() && (
                <div className="py-12 text-center space-y-2">
                  <div className="w-12 h-12 rounded-2xl bg-rose-500/10 dark:bg-rose-500/15 text-rose-500 flex items-center justify-center mx-auto">
                    <Search className="w-6 h-6 stroke-[2]" />
                  </div>
                  <h4 className="text-sm font-bold text-neutral-800 dark:text-neutral-200">
                    Descubre cinéfilos
                  </h4>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-xs mx-auto">
                    Escribe un nombre o usuario para conectar, ver lo que están viendo y compartir co-visiones.
                  </p>
                </div>
              )}

              <div className="space-y-2.5">
                {resultados.map((user) => (
                  <div
                    key={user.id}
                    className="p-3 sm:p-3.5 rounded-2xl bg-white dark:bg-[#1a1a24] border border-neutral-200 dark:border-white/5 hover:border-neutral-300 dark:hover:border-white/10 flex items-center justify-between shadow-xs gap-3 transition"
                  >
                    <div 
                      onClick={() => {
                        onClose();
                        navigate(`/perfil/${user.username}`);
                      }}
                      className="flex items-center gap-3 cursor-pointer group/user flex-1 min-w-0"
                      title="Visitar perfil"
                    >
                      <div className="w-11 h-11 rounded-2xl bg-neutral-200 dark:bg-neutral-800 border border-neutral-300 dark:border-white/10 overflow-hidden flex items-center justify-center font-black text-rose-600 flex-shrink-0 group-hover/user:scale-105 transition shadow-xs">
                        {user.avatar_url ? (
                          <img src={user.avatar_url} alt={user.username} className="w-full h-full object-cover" />
                        ) : (
                          <span>{user.nombre ? user.nombre.charAt(0).toUpperCase() : '?'}</span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-sm font-black text-neutral-900 dark:text-white truncate group-hover/user:text-rose-500 transition">
                          {user.nombre}
                        </h4>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400 font-mono truncate flex items-center gap-1">
                          <span>@{user.username}</span>
                          <span className="text-[10px] text-rose-500 font-sans hidden sm:inline">· Ver perfil</span>
                          <ArrowRight className="w-2.5 h-2.5 text-rose-500 hidden sm:inline" />
                        </p>
                      </div>
                    </div>

                    <div className="shrink-0">
                      {user.estado_relacion === 'amigos' && (
                        <span className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center gap-1.5">
                          <UserCheck className="w-3.5 h-3.5" />
                          <span>Amigos</span>
                        </span>
                      )}
                      {user.estado_relacion === 'solicitud_enviada' && (
                        <span className="px-3 py-1.5 rounded-xl bg-neutral-200 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 text-xs font-bold flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5" />
                          <span>Pendiente</span>
                        </span>
                      )}
                      {user.estado_relacion === 'solicitud_recibida' && (
                        <button
                          type="button"
                          onClick={() => setPestana('pendientes')}
                          className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition cursor-pointer flex items-center gap-1 shadow-sm"
                        >
                          <Mail className="w-3.5 h-3.5" />
                          <span>Ver solicitud</span>
                        </button>
                      )}
                      {user.estado_relacion === 'ninguno' && (
                        <button
                          type="button"
                          onClick={() => handleEnviarSolicitud(user.id)}
                          className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-95 text-white text-xs font-black transition cursor-pointer flex items-center gap-1.5 shadow-sm"
                        >
                          <UserPlus className="w-3.5 h-3.5" />
                          <span>Conectar</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* PESTAÑA: SOLICITUDES PENDIENTES */}
          {pestana === 'pendientes' && (
            <div className="space-y-3">
              {pendientes.length === 0 ? (
                <div className="py-14 text-center space-y-2">
                  <div className="w-12 h-12 rounded-2xl bg-neutral-200/80 dark:bg-white/5 flex items-center justify-center mx-auto text-neutral-400">
                    <Mail className="w-6 h-6 stroke-[1.8]" />
                  </div>
                  <h4 className="text-sm font-bold text-neutral-800 dark:text-neutral-200">
                    Sin solicitudes pendientes
                  </h4>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-xs mx-auto">
                    Cuando otros usuarios te manden una invitación para conectar, aparecerán en esta lista.
                  </p>
                </div>
              ) : (
                pendientes.map((sol) => (
                  <div
                    key={sol.solicitud_id}
                    className="p-3.5 rounded-2xl bg-white dark:bg-[#1a1a24] border border-neutral-200 dark:border-white/5 flex items-center justify-between shadow-xs gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-11 h-11 rounded-2xl bg-neutral-200 dark:bg-neutral-800 border border-neutral-300 dark:border-white/10 overflow-hidden flex items-center justify-center font-bold text-rose-600 flex-shrink-0 shadow-xs">
                        {sol.avatar_url ? (
                          <img src={sol.avatar_url} alt={sol.username} className="w-full h-full object-cover" />
                        ) : (
                          <span>{sol.nombre ? sol.nombre.charAt(0).toUpperCase() : '?'}</span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-sm font-black text-neutral-900 dark:text-white truncate">{sol.nombre}</h4>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400 font-mono truncate">@{sol.username}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => handleResponder(sol.solicitud_id, 'aceptar')}
                        className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-95 text-white text-xs font-black transition cursor-pointer flex items-center gap-1 shadow-sm"
                      >
                        <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                        <span>Aceptar</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleResponder(sol.solicitud_id, 'rechazar')}
                        className="px-3 py-1.5 rounded-xl bg-neutral-200 dark:bg-white/10 hover:bg-neutral-300 dark:hover:bg-white/20 text-neutral-700 dark:text-neutral-300 text-xs font-bold transition cursor-pointer flex items-center gap-1"
                      >
                        <X className="w-3.5 h-3.5 stroke-[2.5]" />
                        <span>Rechazar</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* PESTAÑA: MIS AMIGOS */}
          {pestana === 'amigos' && (
            <div className="space-y-3">
              {amigos.length === 0 ? (
                <div className="py-14 text-center space-y-2">
                  <div className="w-12 h-12 rounded-2xl bg-neutral-200/80 dark:bg-white/5 flex items-center justify-center mx-auto text-neutral-400">
                    <Users className="w-6 h-6 stroke-[1.8]" />
                  </div>
                  <h4 className="text-sm font-bold text-neutral-800 dark:text-neutral-200">
                    Aún no tienes amigos conectados
                  </h4>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-xs mx-auto">
                    Busca a tus amistades en la pestaña «Buscar» para agregarlas y compartir qué están viendo.
                  </p>
                </div>
              ) : (
                amigos.map((amigo) => (
                  <div
                    key={amigo.id}
                    className="p-3 sm:p-3.5 rounded-2xl bg-white dark:bg-[#1a1a24] border border-neutral-200 dark:border-white/5 hover:border-neutral-300 dark:hover:border-white/10 flex items-center justify-between shadow-xs gap-3 transition"
                  >
                    <div 
                      onClick={() => {
                        onClose();
                        navigate(`/perfil/${amigo.username}`);
                      }}
                      className="flex items-center gap-3 cursor-pointer group/amigo flex-1 min-w-0"
                      title="Visitar perfil"
                    >
                      <div className="w-11 h-11 rounded-2xl bg-neutral-200 dark:bg-neutral-800 border border-neutral-300 dark:border-white/10 overflow-hidden flex items-center justify-center font-black text-rose-600 flex-shrink-0 group-hover/amigo:scale-105 transition shadow-xs">
                        {amigo.avatar_url ? (
                          <img src={amigo.avatar_url} alt={amigo.username} className="w-full h-full object-cover" />
                        ) : (
                          <span>{amigo.nombre ? amigo.nombre.charAt(0).toUpperCase() : '?'}</span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-sm font-black text-neutral-900 dark:text-white truncate group-hover/amigo:text-rose-500 transition">
                          {amigo.nombre}
                        </h4>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400 font-mono truncate flex items-center gap-1">
                          <span>@{amigo.username}</span>
                          <span className="text-[10px] text-rose-500 font-sans ml-1 hidden sm:inline">· Ver perfil</span>
                          <ArrowRight className="w-2.5 h-2.5 text-rose-500 hidden sm:inline" />
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      {amigo.fecha_amistad && (
                        <span className="text-[10px] font-mono text-neutral-400 hidden sm:inline">
                          Desde {new Date(amigo.fecha_amistad).toLocaleDateString()}
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => setAmigoAEliminar(amigo)}
                        className="p-2 rounded-xl text-neutral-400 hover:text-rose-600 hover:bg-rose-500/10 transition cursor-pointer"
                        title="Eliminar de mis amigos"
                      >
                        <Trash2 className="w-4 h-4 stroke-[2]" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* PESTAÑA: CO-VISIONES REDISEÑADA */}
          {pestana === 'covisiones' && (
            <div className="space-y-4">
              {invitaciones.length === 0 ? (
                <div className="py-14 text-center space-y-2">
                  <div className="w-12 h-12 rounded-2xl bg-neutral-200/80 dark:bg-white/5 flex items-center justify-center mx-auto text-amber-500">
                    <Clapperboard className="w-6 h-6 stroke-[1.8]" />
                  </div>
                  <h4 className="text-sm font-bold text-neutral-800 dark:text-neutral-200">
                    No tienes invitaciones de co-visión
                  </h4>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-sm mx-auto">
                    Cuando un amigo registre una película o capítulo contigo, te llegará aquí para sumarla a tu historial con un solo clic.
                  </p>
                </div>
              ) : (
                invitaciones.map((inv) => (
                  <div
                    key={inv.covisualizacion_id}
                    className="p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl bg-white dark:bg-[#1a1a24] border border-neutral-200 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between shadow-xs gap-3 sm:gap-4 transition hover:border-rose-500/30"
                  >
                    {/* Izquierda: Portada + Información */}
                    <div className="flex items-start sm:items-center gap-3 sm:gap-4">
                      {/* Portada en proporción 2:3 */}
                      <div className="w-16 sm:w-20 aspect-[2/3] bg-neutral-900 rounded-xl sm:rounded-2xl overflow-hidden flex-shrink-0 shadow-md border border-neutral-200 dark:border-white/10">
                        {inv.poster_path ? (
                          <img
                            src={
                              inv.poster_path.startsWith('http')
                                ? inv.poster_path
                                : `https://image.tmdb.org/t/p/w300${inv.poster_path}`
                            }
                            alt={inv.titulo}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[10px] text-neutral-500 font-bold">
                            Sin foto
                          </div>
                        )}
                      </div>

                      {/* Información de la obra y anfitrión */}
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-rose-600/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                            {inv.tipo === 'serie' ? 'SERIE' : 'PELÍCULA'}
                          </span>

                          {inv.temporada && inv.episodio && (
                            <span className="text-[11px] font-mono font-extrabold text-neutral-900 dark:text-white bg-neutral-100 dark:bg-white/10 px-2 py-0.5 rounded-md">
                              T{inv.temporada} · E{inv.episodio}
                            </span>
                          )}

                          {inv.plataforma && (
                            <span className="text-[10px] font-bold text-neutral-500 dark:text-neutral-400">
                              {inv.plataforma}
                            </span>
                          )}
                        </div>

                        <h4 className="text-base sm:text-lg font-black text-neutral-900 dark:text-white leading-snug">
                          {inv.titulo}
                        </h4>

                        {/* Quién te invitó con su foto redonda */}
                        <div className="flex items-center gap-2 pt-0.5">
                          <div className="w-6 h-6 rounded-full overflow-hidden bg-neutral-200 dark:bg-neutral-800 flex items-center justify-center ring-1 ring-neutral-300 dark:ring-white/20 flex-shrink-0">
                            {inv.anfitrion_avatar ? (
                              <img
                                src={inv.anfitrion_avatar}
                                alt={inv.anfitrion_username}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span className="text-[10px] font-black text-rose-500">
                                {(inv.anfitrion_nombre || inv.anfitrion_username || '?').charAt(0).toUpperCase()}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-neutral-600 dark:text-neutral-400">
                            Visto con{' '}
                            <strong className="text-neutral-900 dark:text-neutral-100 font-bold">
                              @{inv.anfitrion_username}
                            </strong>
                          </p>
                        </div>

                        {inv.fecha_visto && (
                          <p className="text-[11px] text-neutral-400 font-mono flex items-center gap-1.5">
                            <Calendar className="w-3 h-3 text-neutral-400" />
                            <span>{new Date(inv.fecha_visto).toLocaleDateString()}</span>
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Derecha: Botones de Acción destacados */}
                    <div className="flex sm:flex-col items-center sm:items-stretch gap-2 flex-shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-neutral-200 dark:border-white/5">
                      <button
                        type="button"
                        onClick={() => handleResponderCovision(inv.covisualizacion_id, 'aceptar')}
                        className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-95 text-white text-xs font-black uppercase tracking-wider transition cursor-pointer shadow-md flex items-center justify-center gap-1.5"
                      >
                        <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                        <span>Sumar al historial</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleResponderCovision(inv.covisualizacion_id, 'rechazar')}
                        className="px-4 py-2 rounded-xl border border-neutral-300 dark:border-white/10 hover:bg-neutral-100 dark:hover:bg-white/5 text-neutral-600 dark:text-neutral-400 hover:text-rose-500 text-xs font-bold transition cursor-pointer text-center flex items-center justify-center gap-1"
                      >
                        <X className="w-3.5 h-3.5 stroke-[2.5]" />
                        <span>Rechazar</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}