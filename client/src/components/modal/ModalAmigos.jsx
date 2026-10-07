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
  responderInvitacionCovisionAPI,
  responderTodasInvitacionesCovisionAPI,
} from '../../api';

// Pestañas modulares
import TabBuscarAmigos from './amigos/TabBuscarAmigos';
import TabPendientesAmigos from './amigos/TabPendientesAmigos';
import TabMisAmigos from './amigos/TabMisAmigos';
import TabCovisionesAmigos from './amigos/TabCovisionesAmigos';

export default function ModalAmigos({ onClose, onActualizado }) {
  const navigate = useNavigate();
  const [pestana, setPestana] = useState('amigos'); // 'amigos' | 'pendientes' | 'covisiones' | 'buscar'
  const [query, setQuery] = useState('');
  const [resultados, setResultados] = useState([]);
  const [pendientes, setPendientes] = useState([]);
  const [amigos, setAmigos] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [invitaciones, setInvitaciones] = useState([]);
  const [cargandoTodasCovisiones, setCargandoTodasCovisiones] = useState(false);

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
      if (onActualizado) {
        onActualizado();
      }
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

  const handleResponderTodasCovisiones = async (accion = 'aceptar') => {
    setCargandoTodasCovisiones(true);
    try {
      const res = await responderTodasInvitacionesCovisionAPI(accion);
      await cargarListas();
      if (accion === 'aceptar' && onActualizado) {
        onActualizado();
      }
      mostrarMensaje(res.mensaje || '¡Co-visiones procesadas con éxito!', 'exito');
    } catch (err) {
      mostrarMensaje(err.message || 'Error al procesar co-visiones', 'error');
    } finally {
      setCargandoTodasCovisiones(false);
    }
  };

  const confirmarEliminarAmigo = async () => {
    if (!amigoAEliminar) return;
    try {
      const idParaEliminar = amigoAEliminar.amistad_id || amigoAEliminar.id;
      const res = await eliminarAmigoAPI(idParaEliminar);
      setAmigos((prev) => prev.filter((a) => {
        if (amigoAEliminar.amistad_id && a.amistad_id === amigoAEliminar.amistad_id) return false;
        if (amigoAEliminar.id && a.id === amigoAEliminar.id) return false;
        return true;
      }));
      await cargarListas();
      if (onActualizado) {
        onActualizado();
      }
      mostrarMensaje(res.mensaje || `Has eliminado a ${amigoAEliminar.nombre}`, 'exito');
    } catch (err) {
      mostrarMensaje(err.message || 'No se pudo eliminar al amigo', 'error');
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

        {/* Cabecera elegante con botón Buscar integrado */}
        <div className="p-4 sm:p-5 border-b border-neutral-200 dark:border-white/10 flex justify-between items-center bg-[#f2eee3]/70 dark:bg-[#181820]/90 backdrop-blur-md flex-shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-rose-600/10 dark:bg-rose-500/15 border border-rose-500/25 flex items-center justify-center text-rose-600 dark:text-rose-400 shadow-sm shrink-0">
              <Users className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.2]" />
            </div>
            <div className="min-w-0">
              <span className="text-[9px] sm:text-[10px] font-mono text-rose-600 dark:text-rose-500 uppercase font-black tracking-widest block truncate">
                Comunidad Cinéfila
              </span>
              <h3 className="text-sm sm:text-lg font-black tracking-tight text-neutral-900 dark:text-white truncate">
                Conexiones & Amigos
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Botón BUSCAR en la cabecera (visible siempre tanto en PC como en celular) */}
            <button
              type="button"
              onClick={() => setPestana(pestana === 'buscar' ? 'amigos' : 'buscar')}
              className={`flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-2xl text-xs font-black transition-all cursor-pointer border ${
                pestana === 'buscar'
                  ? 'bg-rose-600 border-rose-500 text-white shadow-md shadow-rose-600/30 ring-2 ring-rose-500/30'
                  : 'bg-neutral-200/80 dark:bg-white/10 hover:bg-neutral-300 dark:hover:bg-white/15 text-neutral-800 dark:text-neutral-200 border-neutral-300/60 dark:border-white/10'
              }`}
              title="Buscar cinéfilos por @username o nombre"
            >
              <Search className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Buscar</span>
            </button>

            <button
              onClick={onClose}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-neutral-200 dark:bg-white/10 hover:bg-rose-600 hover:text-white flex items-center justify-center text-neutral-600 dark:text-neutral-300 transition cursor-pointer shadow-xs"
              title="Cerrar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Pestañas Segmentadas: 1º Amigos, 2º Solicitudes, 3º Co-visiones (todas visibles al 100% en celular) */}
        <div className="px-3 sm:px-5 pt-3 pb-2.5 bg-[#f7f4ed] dark:bg-[#16161c] border-b border-neutral-200 dark:border-white/10 flex-shrink-0">
          <div className="grid grid-cols-3 bg-neutral-200/70 dark:bg-black/30 p-1 rounded-2xl gap-1">
            
            {/* 1. AMIGOS (Primero) */}
            <button
              type="button"
              onClick={() => setPestana('amigos')}
              className={`py-2 px-1 sm:px-3 rounded-xl text-xs font-black tracking-wide transition-all cursor-pointer flex items-center justify-center gap-1.5 truncate ${
                pestana === 'amigos'
                  ? 'bg-white dark:bg-[#22222d] text-rose-600 dark:text-rose-400 shadow-sm'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              <Users className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Amigos</span>
              <span className="text-[10px] font-mono opacity-70 font-semibold shrink-0">({amigos.length})</span>
            </button>

            {/* 2. SOLICITUDES (Segundo) */}
            <button
              type="button"
              onClick={() => setPestana('pendientes')}
              className={`py-2 px-1 sm:px-3 rounded-xl text-xs font-black tracking-wide transition-all cursor-pointer flex items-center justify-center gap-1.5 truncate ${
                pestana === 'pendientes'
                  ? 'bg-white dark:bg-[#22222d] text-rose-600 dark:text-rose-400 shadow-sm'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              <Mail className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Solicitudes</span>
              {pendientes.length > 0 && (
                <span className="px-1.5 py-0.2 bg-rose-600 text-white rounded-full text-[10px] font-black shrink-0">
                  {pendientes.length}
                </span>
              )}
            </button>

            {/* 3. CO-VISIONES (Tercero) */}
            <button
              type="button"
              onClick={() => setPestana('covisiones')}
              className={`py-2 px-1 sm:px-3 rounded-xl text-xs font-black tracking-wide transition-all cursor-pointer flex items-center justify-center gap-1.5 truncate ${
                pestana === 'covisiones'
                  ? 'bg-white dark:bg-[#22222d] text-rose-600 dark:text-rose-400 shadow-sm'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              <Clapperboard className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span className="truncate">Co-visiones</span>
              {invitaciones.length > 0 && (
                <span className="px-1.5 py-0.2 bg-rose-600 text-white rounded-full text-[10px] font-black shrink-0 animate-pulse">
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
            <TabBuscarAmigos
              query={query}
              setQuery={setQuery}
              cargando={cargando}
              resultados={resultados}
              onClose={onClose}
              navigate={navigate}
              setPestana={setPestana}
              handleEnviarSolicitud={handleEnviarSolicitud}
            />
          )}

          {/* PESTAÑA: SOLICITUDES PENDIENTES */}
          {pestana === 'pendientes' && (
            <TabPendientesAmigos
              pendientes={pendientes}
              handleResponder={handleResponder}
            />
          )}

          {/* PESTAÑA: MIS AMIGOS */}
          {pestana === 'amigos' && (
            <TabMisAmigos
              amigos={amigos}
              onClose={onClose}
              navigate={navigate}
              setAmigoAEliminar={setAmigoAEliminar}
              setPestana={setPestana}
            />
          )}

          {/* PESTAÑA: CO-VISIONES */}
          {pestana === 'covisiones' && (
            <TabCovisionesAmigos
              invitaciones={invitaciones}
              handleResponderCovision={handleResponderCovision}
              handleResponderTodasCovisiones={handleResponderTodasCovisiones}
              cargandoTodas={cargandoTodasCovisiones}
            />
          )}

        </div>
      </div>
    </div>
  );
}