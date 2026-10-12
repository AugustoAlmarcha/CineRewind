import React from 'react';
import { Check, ChevronRight, Layers, ListChecks, CheckCircle2, Clock, Calendar, SkipForward } from 'lucide-react';

export default function SelectorTemporadasMultiples({
  seasons = [],
  temporadasSeleccionadas = [],
  onToggleTemporada,
  onSeleccionarTodas,
  onDeseleccionarTodas,
  onVerEpisodiosDeTemporada,
  progresoTemporadas = {},
  posterFallback = null,
  onAbrirDistribuir,
  panelDistribuirAbierto = false,
  distribucionActiva = null,
  omitirYaVistos = true,
  setOmitirYaVistos,
  children = null,
}) {
  const todasSeleccionadas = seasons.length > 0 && temporadasSeleccionadas.length === seasons.length;

  return (
    <div className="space-y-3.5 animate-fadeIn select-none">
      {/* Barra de control superior */}
      <div className="rounded-2xl bg-neutral-200/60 dark:bg-white/5 border border-neutral-300/80 dark:border-white/10 overflow-hidden">
        {/* Fila principal: título + botones */}
        <div className="flex items-center justify-between gap-2 p-3 flex-wrap">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-rose-500" />
            <span className="text-xs font-black uppercase tracking-wider text-neutral-800 dark:text-neutral-200">
              Temporadas de la serie
            </span>
            <span className="text-xs font-bold text-neutral-500 dark:text-neutral-400">
              ({temporadasSeleccionadas.length} de {seasons.length} para registrar)
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {temporadasSeleccionadas.length > 0 && onAbrirDistribuir && (
              <button
                type="button"
                onClick={onAbrirDistribuir}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1.5 shadow-xs border ${
                  panelDistribuirAbierto || distribucionActiva
                    ? 'bg-rose-600 border-rose-600 text-white'
                    : 'bg-rose-500/15 hover:bg-rose-500/25 border-rose-500/30 text-rose-600 dark:text-rose-400'
                }`}
                title="Distribuir fechas de capítulos de las temporadas seleccionadas"
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>
                  {distribucionActiva
                    ? (distribucionActiva.tipo === 'rango' ? 'Rango configurado' : 'Ritmo configurado')
                    : `Distribuir fechas (${temporadasSeleccionadas.length})`}
                </span>
              </button>
            )}

            <button
              type="button"
              onClick={todasSeleccionadas ? onDeseleccionarTodas : onSeleccionarTodas}
              className="px-3 py-1.5 rounded-xl text-xs font-black bg-white dark:bg-white/10 hover:bg-neutral-100 dark:hover:bg-white/20 text-neutral-800 dark:text-neutral-200 border border-neutral-300 dark:border-white/10 transition cursor-pointer flex items-center gap-1.5 shadow-xs"
            >
              <ListChecks className="w-3.5 h-3.5 text-rose-500" />
              <span>{todasSeleccionadas ? 'Deseleccionar todas' : 'Marcar todas'}</span>
            </button>
          </div>
        </div>

        {/* Fila secundaria: checkbox "Omitir ya vistos" siempre visible */}
        {setOmitirYaVistos && (
          <div className="border-t border-neutral-300/60 dark:border-white/10 px-3 py-2 bg-white/40 dark:bg-black/20">
            <button
              type="button"
              onClick={() => setOmitirYaVistos(!omitirYaVistos)}
              className="flex items-center gap-2 cursor-pointer group w-full text-left flex-wrap sm:flex-nowrap"
            >
              <div className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition ${
                omitirYaVistos
                  ? 'bg-rose-600 border-rose-600'
                  : 'border-neutral-400 dark:border-white/30 group-hover:border-rose-500'
              }`}>
                {omitirYaVistos && <Check className="w-2.5 h-2.5 text-white stroke-[3]" />}
              </div>
              <SkipForward className="w-3.5 h-3.5 text-rose-500 flex-shrink-0" />
              <span className="text-xs text-neutral-700 dark:text-neutral-300 font-semibold">
                Omitir capítulos ya registrados (evitar duplicados)
              </span>
              <span className={`ml-auto text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md transition ${
                omitirYaVistos
                  ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                  : 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
              }`}>
                {omitirYaVistos ? 'Evita duplicados' : 'Registrar 2ª vez'}
              </span>
            </button>
          </div>
        )}
      </div>

      {/* Asistente interactivo de distribución (se muestra aquí arriba de las temporadas) */}
      {children}

      {/* Grid de tarjetas de temporadas con pósters y estado de avance */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {seasons.map((s) => {
          const num = s.temporada;
          const estaSeleccionada = temporadasSeleccionadas.includes(num);
          const anio = s.fecha_estreno ? String(s.fecha_estreno).substring(0, 4) : null;
          const posterUrl = s.poster_path || posterFallback;
          
          const vistos = progresoTemporadas[num] || 0;
          const totalCaps = typeof s.episodios === 'number' ? s.episodios : 0;
          const estaCompletada = totalCaps > 0 && vistos >= totalCaps;
          const enProgreso = vistos > 0 && !estaCompletada;

          return (
            <div
              key={num}
              onClick={() => onToggleTemporada(num)}
              className={`p-3 rounded-2xl border transition-all duration-200 flex items-center justify-between gap-3 cursor-pointer group relative overflow-hidden ${
                estaSeleccionada
                  ? 'bg-rose-500/10 border-rose-500/60 dark:bg-rose-950/30 dark:border-rose-500/60 shadow-md ring-1 ring-rose-500/30'
                  : estaCompletada
                    ? 'bg-emerald-500/[0.04] border-emerald-500/30 dark:bg-emerald-950/15 dark:border-emerald-500/25 hover:border-emerald-500/50'
                    : 'bg-white dark:bg-[#181820] border-neutral-200 dark:border-white/5 hover:border-neutral-300 dark:hover:border-white/15 shadow-xs'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                {/* 1. Checkbox táctil */}
                <div
                  className={`w-7 h-7 rounded-xl border flex items-center justify-center flex-shrink-0 transition-all ${
                    estaSeleccionada
                      ? 'bg-rose-600 border-rose-600 text-white shadow-xs'
                      : estaCompletada
                        ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-500 group-hover:border-rose-500'
                        : 'border-neutral-300 dark:border-white/20 bg-neutral-100 dark:bg-white/5 group-hover:border-rose-500'
                  }`}
                >
                  {estaSeleccionada ? (
                    <Check className="w-4 h-4 stroke-[3]" />
                  ) : estaCompletada ? (
                    <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                  ) : null}
                </div>

                {/* 2. Póster oficial de la temporada */}
                <div className="w-13 sm:w-15 aspect-[2/3] bg-neutral-200 dark:bg-neutral-800 rounded-xl overflow-hidden flex-shrink-0 shadow-md border border-black/10 dark:border-white/10 group-hover:scale-105 transition-transform">
                  {posterUrl ? (
                    <img
                      src={posterUrl}
                      alt={`Temporada ${num}`}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs font-black text-neutral-400">
                      T{num}
                    </div>
                  )}
                </div>

                {/* 3. Información y estado de avance de la temporada */}
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-sm font-black text-neutral-900 dark:text-white truncate">
                      Temporada {num}
                    </h4>
                  </div>

                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400 font-medium">
                    {s.episodios} capítulos {anio ? `· ${anio}` : ''}
                  </p>

                  {/* Insignia visual del estado de avance en tu cuenta */}
                  <div>
                    {estaCompletada ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                        <CheckCircle2 className="w-3 h-3 shrink-0" />
                        <span>Ya vista ({vistos}/{totalCaps})</span>
                      </span>
                    ) : enProgreso ? (
                      <div className="space-y-1">
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-black uppercase bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                          <Clock className="w-3 h-3 shrink-0" />
                          <span>En progreso ({vistos}/{totalCaps})</span>
                        </span>
                        <div className="w-24 h-1.5 bg-neutral-200 dark:bg-white/10 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-amber-500 rounded-full" 
                            style={{ width: `${Math.min(100, (vistos / totalCaps) * 100)}%` }} 
                          />
                        </div>
                      </div>
                    ) : (
                      <span className="inline-block text-[10px] font-bold text-neutral-400 dark:text-neutral-500">
                        Sin ver aún
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* 4. Botón directo para saltar a ver capítulos individuales de esta temporada */}
              {onVerEpisodiosDeTemporada && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onVerEpisodiosDeTemporada(num);
                  }}
                  className="px-2.5 py-1.5 rounded-xl text-[11px] font-bold bg-neutral-100 dark:bg-white/5 hover:bg-rose-600 hover:text-white text-neutral-600 dark:text-neutral-300 transition flex items-center gap-1 cursor-pointer flex-shrink-0 shadow-xs group-hover:bg-neutral-200 dark:group-hover:bg-white/10 group-hover:text-neutral-900 dark:group-hover:text-white"
                  title={`Ver y marcar capítulos específicos de la Temporada ${num}`}
                >
                  <span className="hidden sm:inline">Ver caps</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
