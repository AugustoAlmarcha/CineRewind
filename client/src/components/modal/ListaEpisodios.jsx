import React, { useState, useMemo } from 'react';
import { 
  Check, 
  ChevronDown, 
  ChevronUp, 
  Calendar, 
  Clock, 
  Star,
  Users
} from 'lucide-react';
import { formatearFecha, formatearFechaLarga } from '../../utils/fechas';
import SelectorCalendarioPopover from './SelectorCalendarioPopover';

export default function ListaEpisodios({
  episodios = [],
  episodiosYaVistos = [],
  episodiosSeleccionados = [],
  onToggleEpisodio,
  onVerActoresCapitulo,
  noRecuerdaFecha = false,
  fechasEpisodios = {},
  onCambiarFechaEpisodio,
  fechaDefecto = '',
}) {
  const [episodioExpandido, setEpisodioExpandido] = useState(null);

  const vistosSet = useMemo(() => {
    return new Set((episodiosYaVistos || []).map(Number));
  }, [episodiosYaVistos]);

  if (!episodios || episodios.length === 0) {
    return (
      <div className="py-12 text-center text-neutral-500 text-xs sm:text-sm font-medium bg-neutral-100/50 dark:bg-white/[0.02] rounded-2xl border border-dashed border-neutral-300 dark:border-white/10">
        No hay información de episodios disponible para esta temporada.
      </div>
    );
  }

  const toggleExpandir = (num, e) => {
    if (e) e.stopPropagation();
    setEpisodioExpandido((prev) => (prev === num ? null : num));
  };

  return (
    <div className="space-y-2.5">
      {episodios.map((ep) => {
        const num = ep.episodio_numero;
        const yaVisto = vistosSet.has(Number(num));
        const estaSeleccionado = episodiosSeleccionados.includes(num);
        const estaExpandido = episodioExpandido === num;
        const fechaEmision = ep.fecha_estreno || ep.air_date;

        return (
          <div
            key={num}
            className={`rounded-2xl border transition-all duration-200 overflow-hidden select-none ${
              estaSeleccionado
                ? 'bg-rose-500/10 border-rose-500/50 dark:bg-rose-950/30 dark:border-rose-500/50 shadow-md ring-1 ring-rose-500/30'
                : yaVisto
                  ? 'bg-emerald-500/[0.04] border-emerald-500/25 dark:bg-emerald-950/15 dark:border-emerald-500/20 hover:border-emerald-500/40'
                  : 'bg-white dark:bg-[#181820] border-neutral-200 dark:border-white/5 hover:border-neutral-300 dark:hover:border-white/15 shadow-xs'
            }`}
          >
            {/* Fila principal */}
            <div 
              onClick={(e) => toggleExpandir(num, e)}
              className="p-3 sm:p-3.5 flex items-center justify-between gap-3 cursor-pointer group"
            >
              {/* 1. Botón Checkbox táctil */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleEpisodio(num);
                }}
                className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl border flex items-center justify-center flex-shrink-0 transition-all cursor-pointer shadow-xs active:scale-90 ${
                  estaSeleccionado
                    ? 'bg-rose-600 border-rose-600 text-white shadow-rose-900/40'
                    : yaVisto
                      ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20'
                      : 'border-neutral-300 dark:border-white/20 bg-neutral-100 dark:bg-white/5 hover:border-rose-500 text-neutral-400'
                }`}
                title={estaSeleccionado ? 'Deseleccionar' : yaVisto ? 'Volver a marcar' : 'Marcar capítulo'}
              >
                {estaSeleccionado ? (
                  <Check className="w-4 h-4 stroke-[3]" />
                ) : yaVisto ? (
                  <Check className="w-4 h-4 stroke-[2.5]" />
                ) : (
                  <span className="text-xs font-bold text-neutral-400 group-hover:text-rose-500">+</span>
                )}
              </button>

              {/* 2. Miniatura 16:9 */}
              <div className="w-20 sm:w-24 aspect-[16/9] bg-neutral-200 dark:bg-neutral-800 rounded-xl overflow-hidden flex-shrink-0 relative shadow-inner">
                {ep.still_path ? (
                  <img
                    src={ep.still_path}
                    alt={ep.nombre}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[10px] text-neutral-400 font-bold bg-neutral-200 dark:bg-neutral-800">
                    E{num}
                  </div>
                )}
                <span className="absolute bottom-1 right-1 bg-black/85 backdrop-blur-xs px-1.5 py-0.5 rounded text-[9px] font-black text-white">
                  E{num}
                </span>
              </div>

              {/* 3. Título y Metadatos */}
              <div className="flex-1 min-w-0 pr-1">
                <h4 className="text-xs sm:text-sm font-black text-neutral-900 dark:text-white truncate">
                  {num}. {ep.nombre}
                </h4>

                <div className="flex items-center gap-2 text-[10px] sm:text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5 flex-wrap">
                  {fechaEmision && (
                    <span className="flex items-center gap-1 font-mono">
                      <Calendar className="w-3 h-3 text-neutral-400 shrink-0" />
                      <span>{formatearFecha(fechaEmision)}</span>
                    </span>
                  )}

                  {ep.duracion && (
                    <span className="flex items-center gap-1 font-mono">
                      <Clock className="w-3 h-3 text-neutral-400 shrink-0" />
                      <span>{ep.duracion}m</span>
                    </span>
                  )}

                  {ep.calificacion && (
                    <span className="flex items-center gap-1 text-amber-500 font-bold">
                      <Star className="w-2.5 h-2.5 fill-current" />
                      <span>{ep.calificacion}</span>
                    </span>
                  )}
                </div>

                {!estaExpandido && ep.sinopsis && (
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400 line-clamp-1 mt-1 leading-normal">
                    {ep.sinopsis}
                  </p>
                )}
              </div>

              {/* 4. Badges de estado y acordeón */}
              <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
                {estaSeleccionado ? (
                  <div onClick={(e) => e.stopPropagation()}>
                    {noRecuerdaFecha ? (
                      <div 
                        className="flex items-center gap-1 bg-amber-500/10 border border-amber-500/40 rounded-xl px-2 py-1 text-xs shadow-xs"
                        title="Fecha oficial de estreno de este capítulo"
                      >
                        <Calendar className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                        <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 font-mono">
                          {fechaEmision ? formatearFecha(fechaEmision) : 'Estreno'}
                        </span>
                      </div>
                    ) : (
                      <SelectorCalendarioPopover
                        fecha={fechasEpisodios[num] || fechaDefecto || ''}
                        onSeleccionarFecha={(f) => onCambiarFechaEpisodio && onCambiarFechaEpisodio(num, f)}
                        tamano="compacto"
                        align="right"
                      />
                    )}
                  </div>
                ) : yaVisto ? (
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 bg-emerald-600/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25 rounded-md">
                    Visto
                  </span>
                ) : null}

                <div 
                  className="w-7 h-7 rounded-lg bg-neutral-200/60 dark:bg-white/5 hover:bg-neutral-300 dark:hover:bg-white/10 flex items-center justify-center text-neutral-600 dark:text-neutral-300 transition"
                  title={estaExpandido ? 'Ocultar sinopsis' : 'Ver sinopsis completa'}
                >
                  {estaExpandido ? (
                    <ChevronUp className="w-4 h-4 text-rose-500" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </div>
              </div>
            </div>

            {/* Vista expandida: Sinopsis completa */}
            {estaExpandido && (
              <div className="px-3.5 pb-3.5 pt-2 border-t border-neutral-200/80 dark:border-white/5 bg-neutral-50/80 dark:bg-white/[0.02] space-y-3 animate-fadeIn">
                {ep.still_path && (
                  <div className="w-full max-h-48 rounded-xl overflow-hidden relative shadow-md">
                    <img 
                      src={ep.still_path} 
                      alt={ep.nombre} 
                      className="w-full h-full object-cover" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex items-end p-3">
                      <div className="text-white text-xs space-y-0.5">
                        <p className="font-black text-sm">{ep.nombre}</p>
                        {fechaEmision && (
                          <p className="text-[11px] text-neutral-300">
                            Estreno oficial: {formatearFechaLarga(fechaEmision)}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-wider text-neutral-400 block">
                    Sinopsis:
                  </span>
                  <p className="text-xs sm:text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed font-normal">
                    {ep.sinopsis || 'Sin descripción disponible para este episodio.'}
                  </p>
                </div>

                <div className="flex items-center justify-between gap-2 pt-1 flex-wrap">
                  {onVerActoresCapitulo ? (
                    <button
                      type="button"
                      onClick={(e) => onVerActoresCapitulo(e, num, ep.nombre)}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold bg-neutral-200/80 dark:bg-white/10 hover:bg-neutral-300 dark:hover:bg-white/20 text-neutral-800 dark:text-neutral-200 transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <Users className="w-3.5 h-3.5 text-rose-500" />
                      <span>Ver actores del capítulo</span>
                    </button>
                  ) : <div />}

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleEpisodio(num);
                    }}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1.5 shadow-xs ${
                      estaSeleccionado
                        ? 'bg-rose-600 text-white hover:bg-rose-700'
                        : yaVisto
                          ? 'bg-neutral-200/80 dark:bg-white/10 text-neutral-700 dark:text-neutral-300 hover:bg-rose-600 hover:text-white'
                          : 'bg-rose-600 text-white hover:bg-rose-500'
                    }`}
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>{estaSeleccionado ? 'Seleccionado' : yaVisto ? 'Volver a marcar' : 'Marcar capítulo'}</span>
                  </button>
                </div>

                {estaSeleccionado && !noRecuerdaFecha && (
                  <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs">
                    <div className="flex items-center gap-2 text-rose-700 dark:text-rose-300 font-bold">
                      <Calendar className="w-4 h-4 text-rose-500 shrink-0" />
                      <span>Fecha asignada a este capítulo:</span>
                    </div>
                    <SelectorCalendarioPopover
                      fecha={fechasEpisodios[num] || fechaDefecto || ''}
                      onSeleccionarFecha={(f) => onCambiarFechaEpisodio && onCambiarFechaEpisodio(num, f)}
                      tamano="normal"
                      align="right"
                    />
                  </div>
                )}

                {noRecuerdaFecha && fechaEmision && (
                  <div className="flex items-center gap-1.5 p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-700 dark:text-amber-300 font-medium">
                    <Calendar className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <span>Se registrará con su fecha oficial de estreno: <strong>{formatearFecha(fechaEmision)}</strong></span>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}