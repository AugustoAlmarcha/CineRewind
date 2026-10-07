import React from 'react';
import {
  Search,
  Users,
  X,
  ArrowRight,
  UserCheck,
  Clock,
  Mail,
  UserPlus
} from 'lucide-react';

export default function TabBuscarAmigos({
  query,
  setQuery,
  cargando,
  resultados,
  onClose,
  navigate,
  setPestana,
  handleEnviarSolicitud
}) {
  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar cinéfilos por @username, nombre..."
          autoFocus
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
  );
}
