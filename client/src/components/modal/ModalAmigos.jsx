import React, { useState, useEffect } from 'react';
import {
  buscarCinefilosAPI,
  enviarSolicitudAmistadAPI,
  obtenerSolicitudesPendientesAPI,
  responderSolicitudAmistadAPI,
  obtenerAmigosAPI,
  eliminarAmigoAPI,
  obtenerInvitacionesCovisionAPI,     // <--- AGREGAR
  responderInvitacionCovisionAPI
} from '../../api';

export default function ModalAmigos({ onClose, onActualizado }) {
  const [pestana, setPestana] = useState('buscar'); // 'buscar' | 'pendientes' | 'amigos'
  const [query, setQuery] = useState('');
  const [resultados, setResultados] = useState([]);
  const [pendientes, setPendientes] = useState([]);
  const [amigos, setAmigos] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [invitaciones, setInvitaciones] = useState([]);

  // Estado para mensajes Toast estilizados (tipo: 'exito' | 'error')
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
        obtenerInvitacionesCovisionAPI(), // <--- Consulta co-visiones
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
      
      // Si aceptó la co-visión, actualiza el inicio o perfil en vivo sin F5
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="relative bg-[#fbf9f4] dark:bg-[#141419] border border-neutral-300 dark:border-white/10 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh] text-neutral-900 dark:text-white transition-colors duration-300">
        
        {/* Toast Flotante Personalizado */}
        {notificacion && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 animate-bounce">
            <div
              className={`px-4 py-2 rounded-2xl shadow-xl border text-xs font-bold flex items-center gap-2 backdrop-blur-md ${
                notificacion.tipo === 'exito'
                  ? 'bg-emerald-600/90 border-emerald-400 text-white'
                  : 'bg-rose-600/90 border-rose-400 text-white'
              }`}
            >
              <span>{notificacion.tipo === 'exito' ? '✓' : '✕'}</span>
              <span>{notificacion.texto}</span>
            </div>
          </div>
        )}

        {/* Modal de confirmación para eliminar amigo */}
        {amigoAEliminar && (
          <div className="absolute inset-0 z-40 bg-black/60 backdrop-blur-xs flex items-center justify-center p-6 animate-fadeIn">
            <div className="bg-[#f2eee3] dark:bg-[#1a1a24] border border-neutral-300 dark:border-white/15 p-6 rounded-3xl max-w-sm w-full text-center space-y-4 shadow-2xl">
              <span className="text-3xl block">🗑️</span>
              <div className="space-y-1">
                <h4 className="font-black text-base text-neutral-900 dark:text-white">
                  ¿Eliminar a {amigoAEliminar.nombre}?
                </h4>
                <p className="text-xs text-neutral-600 dark:text-neutral-400">
                  Ya no verás su actividad ni podrán etiquetarse en visualizaciones conjuntas.
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
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white transition cursor-pointer shadow-md"
                >
                  Sí, eliminar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Cabecera */}
        <div className="p-5 border-b border-neutral-200 dark:border-white/10 flex justify-between items-center bg-[#f2eee3] dark:bg-[#181820]">
          <div>
            <span className="text-[10px] font-mono text-rose-600 dark:text-rose-500 uppercase font-black tracking-widest">
              Comunidad Cinéfila
            </span>
            <h3 className="text-xl font-black">Conexiones & Amigos</h3>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-neutral-200 dark:bg-white/10 hover:bg-rose-600 hover:text-white flex items-center justify-center text-sm font-bold transition cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Pestañas */}
        <div className="flex border-b border-neutral-200 dark:border-white/10 bg-[#f7f4ed] dark:bg-[#16161c] px-4 pt-2 gap-2">
          <button
            onClick={() => setPestana('buscar')}
            className={`pb-3 px-4 text-xs font-black uppercase tracking-wider transition border-b-2 cursor-pointer ${
              pestana === 'buscar'
                ? 'border-rose-600 text-rose-600 dark:border-rose-500 dark:text-rose-500'
                : 'border-transparent text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            🔍 Buscar Cinéfilos
          </button>
          <button
            onClick={() => setPestana('pendientes')}
            className={`pb-3 px-4 text-xs font-black uppercase tracking-wider transition border-b-2 flex items-center gap-1.5 cursor-pointer ${
              pestana === 'pendientes'
                ? 'border-rose-600 text-rose-600 dark:border-rose-500 dark:text-rose-500'
                : 'border-transparent text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            📬 Solicitudes
            {pendientes.length > 0 && (
              <span className="px-1.5 py-0.2 bg-rose-600 text-white rounded-full text-[10px] font-bold">
                {pendientes.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setPestana('amigos')}
            className={`pb-3 px-4 text-xs font-black uppercase tracking-wider transition border-b-2 cursor-pointer ${
              pestana === 'amigos'
                ? 'border-rose-600 text-rose-600 dark:border-rose-500 dark:text-rose-500'
                : 'border-transparent text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            👥 Mis Amigos ({amigos.length})
          </button>
<button
        type="button"
        onClick={() => setPestana('covisiones')}
        className={`pb-3 px-4 text-xs font-black uppercase tracking-wider transition border-b-2 flex items-center gap-1.5 cursor-pointer ${
          pestana === 'covisiones'
            ? 'border-rose-600 text-rose-600 dark:border-rose-500 dark:text-rose-500'
            : 'border-transparent text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
        }`}
      >
        🎬 Co-visiones
        {invitaciones.length > 0 && (
          <span className="px-1.5 py-0.2 bg-rose-600 text-white rounded-full text-[10px] font-bold animate-pulse">
            {invitaciones.length}
          </span>
        )}
      </button>
        </div>

        {/* Contenido */}
        <div className="p-5 overflow-y-auto flex-1">
          
          {/* PESTAÑA: BUSCAR */}
          {pestana === 'buscar' && (
            <div className="space-y-4">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar por @username, nombre o email..."
                className="w-full px-4 py-3 rounded-2xl bg-white dark:bg-[#20202a] border border-neutral-300 dark:border-white/10 text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 focus:outline-none focus:border-rose-500 text-sm font-medium"
              />

              {cargando && (
                <p className="text-xs text-center text-neutral-500 dark:text-neutral-400 py-8 font-mono">Buscando usuarios...</p>
              )}

              {!cargando && query.trim() && resultados.length === 0 && (
                <p className="text-xs text-center text-neutral-500 dark:text-neutral-400 py-8">No se encontraron cinéfilos.</p>
              )}

              <div className="space-y-3">
                {resultados.map((user) => (
                  <div
                    key={user.id}
                    className="p-3.5 rounded-2xl bg-white dark:bg-[#1c1c24] border border-neutral-200 dark:border-white/5 flex items-center justify-between shadow-xs"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-full bg-neutral-200 dark:bg-neutral-800 border border-neutral-300 dark:border-white/10 overflow-hidden flex items-center justify-center font-bold text-rose-600 flex-shrink-0">
                        {user.avatar_url ? (
                          <img src={user.avatar_url} alt={user.username} className="w-full h-full object-cover" />
                        ) : (
                          user.nombre ? user.nombre.charAt(0).toUpperCase() : '?'
                        )}
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-neutral-900 dark:text-white">{user.nombre}</h4>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400 font-mono">@{user.username}</p>
                      </div>
                    </div>

                    <div>
                      {user.estado_relacion === 'amigos' && (
                        <span className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold">
                          ✓ Amigos
                        </span>
                      )}
                      {user.estado_relacion === 'solicitud_enviada' && (
                        <span className="px-3 py-1.5 rounded-xl bg-neutral-200 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 text-xs font-bold">
                          ⏳ Pendiente
                        </span>
                      )}
                      {user.estado_relacion === 'solicitud_recibida' && (
                        <button
                          onClick={() => setPestana('pendientes')}
                          className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition cursor-pointer"
                        >
                          Ver solicitud
                        </button>
                      )}
                      {user.estado_relacion === 'ninguno' && (
                        <button
                          onClick={() => handleEnviarSolicitud(user.id)}
                          className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition cursor-pointer"
                        >
                          + Agregar
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
                <p className="text-xs text-center text-neutral-500 dark:text-neutral-400 py-12">No tienes solicitudes pendientes.</p>
              ) : (
                pendientes.map((sol) => (
                  <div
                    key={sol.solicitud_id}
                    className="p-3.5 rounded-2xl bg-white dark:bg-[#1c1c24] border border-neutral-200 dark:border-white/5 flex items-center justify-between shadow-xs"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-full bg-neutral-200 dark:bg-neutral-800 border border-neutral-300 dark:border-white/10 overflow-hidden flex items-center justify-center font-bold text-rose-600 flex-shrink-0">
                        {sol.avatar_url ? (
                          <img src={sol.avatar_url} alt={sol.username} className="w-full h-full object-cover" />
                        ) : (
                          sol.nombre ? sol.nombre.charAt(0).toUpperCase() : '?'
                        )}
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-neutral-900 dark:text-white">{sol.nombre}</h4>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400 font-mono">@{sol.username}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleResponder(sol.solicitud_id, 'aceptar')}
                        className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition cursor-pointer"
                      >
                        Aceptar
                      </button>
                      <button
                        onClick={() => handleResponder(sol.solicitud_id, 'rechazar')}
                        className="px-3 py-1.5 rounded-xl bg-neutral-200 dark:bg-white/10 hover:bg-neutral-300 dark:hover:bg-white/20 text-neutral-700 dark:text-neutral-300 text-xs font-bold transition cursor-pointer"
                      >
                        Rechazar
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
                <p className="text-xs text-center text-neutral-500 dark:text-neutral-400 py-12">
                  Aún no tienes amigos agregados. ¡Búscalos en la primera pestaña!
                </p>
              ) : (
                amigos.map((amigo) => (
                  <div
                    key={amigo.id}
                    className="p-3.5 rounded-2xl bg-white dark:bg-[#1c1c24] border border-neutral-200 dark:border-white/5 flex items-center justify-between shadow-xs"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-full bg-neutral-200 dark:bg-neutral-800 border border-neutral-300 dark:border-white/10 overflow-hidden flex items-center justify-center font-bold text-rose-600 flex-shrink-0">
                        {amigo.avatar_url ? (
                          <img src={amigo.avatar_url} alt={amigo.username} className="w-full h-full object-cover" />
                        ) : (
                          amigo.nombre ? amigo.nombre.charAt(0).toUpperCase() : '?'
                        )}
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-neutral-900 dark:text-white">{amigo.nombre}</h4>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400 font-mono">@{amigo.username}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-mono text-neutral-400 hidden sm:inline">
                        Amigos desde {new Date(amigo.fecha_amistad).toLocaleDateString()}
                      </span>
                      <button
                        onClick={() => setAmigoAEliminar(amigo)}
                        className="p-2 rounded-xl text-neutral-400 hover:text-rose-600 hover:bg-rose-500/10 transition cursor-pointer"
                        title="Eliminar de mis amigos"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
          {/* PESTAÑA: CO-VISIONES */}
{/* PESTAÑA: CO-VISIONES REDISEÑADA (TARJETAS GRANDES) */}
          {pestana === 'covisiones' && (
            <div className="space-y-4">
              {invitaciones.length === 0 ? (
                <div className="py-16 text-center space-y-2">
                  <span className="text-4xl block">🎬</span>
                  <p className="text-sm font-bold text-neutral-800 dark:text-neutral-200">
                    No tienes invitaciones de co-visualización
                  </p>
                  <p className="text-xs text-neutral-400 max-w-sm mx-auto">
                    Cuando un amigo registre una película o capítulo contigo, te llegará aquí para sumarla a tu historial con un solo clic.
                  </p>
                </div>
              ) : (
                invitaciones.map((inv) => (
                  <div
                    key={inv.covisualizacion_id}
                    className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-[#1a1a24] border border-neutral-200 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between shadow-sm gap-4 transition hover:border-rose-500/30"
                  >
                    {/* Izquierda: Portada Grande + Información */}
                    <div className="flex items-start sm:items-center gap-4">
                      {/* Portada en proporción 2:3 amplia */}
                      <div className="w-20 sm:w-24 aspect-[2/3] bg-neutral-900 rounded-2xl overflow-hidden flex-shrink-0 shadow-md border border-neutral-200 dark:border-white/10">
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
                            Visto en compañía de{' '}
                            <strong className="text-neutral-900 dark:text-neutral-100">
                              @{inv.anfitrion_username}
                            </strong>
                          </p>
                        </div>

                        <p className="text-[11px] text-neutral-400 font-mono">
                          📅 {new Date(inv.fecha_visto).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    {/* Derecha: Botones de Acción destacados */}
                    <div className="flex sm:flex-col items-center sm:items-stretch gap-2 flex-shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-neutral-200 dark:border-white/5">
                      <button
                        type="button"
                        onClick={() => handleResponderCovision(inv.covisualizacion_id, 'aceptar')}
                        className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-95 text-white text-xs font-black uppercase tracking-wider transition cursor-pointer shadow-md flex items-center justify-center gap-1.5"
                      >
                        <span>✓</span> Sumar al historial
                      </button>

                      <button
                        type="button"
                        onClick={() => handleResponderCovision(inv.covisualizacion_id, 'rechazar')}
                        className="px-4 py-2 rounded-xl border border-neutral-300 dark:border-white/10 hover:bg-neutral-100 dark:hover:bg-white/5 text-neutral-600 dark:text-neutral-400 hover:text-rose-500 text-xs font-bold transition cursor-pointer text-center"
                      >
                        Rechazar
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