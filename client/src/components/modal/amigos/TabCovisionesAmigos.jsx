import React from 'react';
import { Clapperboard, Calendar, Check, X, Sparkles, Loader2 } from 'lucide-react';
import { formatearFecha } from '../../../utils/fechas';

export default function TabCovisionesAmigos({ 
  invitaciones, 
  handleResponderCovision,
  handleResponderTodasCovisiones,
  cargandoTodas = false,
}) {
  if (invitaciones.length === 0) {
    return (
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
    );
  }

  return (
    <div className="space-y-4">
      {/* Botón destacado para Aceptar Todas en Lote */}
      {invitaciones.length > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-rose-600/15 via-rose-500/10 to-amber-500/15 border border-rose-500/30 shadow-sm animate-fadeIn">
          <div className="flex items-center gap-2.5 text-center sm:text-left">
            <div className="w-8 h-8 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-md">
              <Sparkles className="w-4 h-4 fill-white" />
            </div>
            <div>
              <p className="text-xs font-black text-neutral-900 dark:text-white">
                {invitaciones.length} co-visiones pendientes
              </p>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                Sumalas todas a tu historial al mismo tiempo
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => handleResponderTodasCovisiones && handleResponderTodasCovisiones('aceptar')}
            disabled={cargandoTodas}
            className="w-full sm:w-auto px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 active:scale-95 text-white text-xs font-black uppercase tracking-wider transition cursor-pointer shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {cargandoTodas ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Check className="w-3.5 h-3.5 stroke-[3]" />
            )}
            <span>{cargandoTodas ? 'Aceptando...' : `Aceptar todas (${invitaciones.length})`}</span>
          </button>
        </div>
      )}
      {invitaciones.map((inv) => (
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
                  <span>{formatearFecha(inv.fecha_visto)}</span>
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
      ))}
    </div>
  );
}
