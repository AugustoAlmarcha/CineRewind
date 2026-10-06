import React from 'react';
import { Mail, Check, X } from 'lucide-react';

export default function TabPendientesAmigos({ pendientes, handleResponder }) {
  if (pendientes.length === 0) {
    return (
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
    );
  }

  return (
    <div className="space-y-3">
      {pendientes.map((sol) => (
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
              className="px-3.5 py-1.5 rounded-xl bg-neutral-200 dark:bg-white/10 hover:bg-neutral-300 dark:hover:bg-white/20 text-neutral-700 dark:text-neutral-300 text-xs font-bold transition cursor-pointer flex items-center gap-1"
            >
              <X className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Rechazar</span>
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
