import React from 'react';
import { Users, ArrowRight, Trash2, Search, UserPlus } from 'lucide-react';

export default function TabMisAmigos({ amigos, onClose, navigate, setAmigoAEliminar, setPestana }) {
  if (amigos.length === 0) {
    return (
      <div className="py-14 text-center space-y-3">
        <div className="w-12 h-12 rounded-2xl bg-neutral-200/80 dark:bg-white/5 flex items-center justify-center mx-auto text-neutral-400">
          <Users className="w-6 h-6 stroke-[1.8]" />
        </div>
        <h4 className="text-sm font-bold text-neutral-800 dark:text-neutral-200">
          Aún no tienes amigos conectados
        </h4>
        <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-xs mx-auto">
          Busca a tus amistades con el botón «Buscar» de la cabecera para agregarlas y compartir qué están viendo.
        </p>
        {setPestana && (
          <button
            type="button"
            onClick={() => setPestana('buscar')}
            className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-rose-600 hover:bg-rose-700 active:scale-95 text-white text-xs font-black shadow-md transition cursor-pointer"
          >
            <Search className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Buscar cinéfilos</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center px-1 pb-1">
        <p className="text-[11px] font-bold text-neutral-500 dark:text-neutral-400">
          {amigos.length} {amigos.length === 1 ? 'amigo conectado' : 'amigos conectados'}
        </p>
        {setPestana && (
          <button
            type="button"
            onClick={() => setPestana('buscar')}
            className="text-[11px] font-black text-rose-600 dark:text-rose-400 hover:text-rose-500 flex items-center gap-1 cursor-pointer transition"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Buscar más</span>
          </button>
        )}
      </div>
      {amigos.map((amigo) => (
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
      ))}
    </div>
  );
}
