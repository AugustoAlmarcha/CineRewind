import React, { useState, useMemo, useRef } from 'react';
import { Clock, Star, Film, Users, Clapperboard, Check, ChevronDown, ChevronUp, Ticket, ExternalLink, Calendar, Sparkles } from 'lucide-react';
import { obtenerFechaHoyLocal, obtenerFechaAyerLocal, NOMBRES_MESES } from '../../utils/fechas';
import CalificadorEstrellas from '../common/CalificadorEstrellas';
import useDragScroll from '../../hooks/useDragScroll';

export default function VistaRegistroPelicula({
  obra,
  detalle,
  sinopsis,
  guardando,
  onGuardar,
  calificacion = 0,
  setCalificacion,
  onSeleccionarActor,
  fechaVisto,
  noRecuerdaFecha
}) {
  const [mostrarTodoElenco, setMostrarTodoElenco] = useState(false);
  const [sinopsisExpandida, setSinopsisExpandida] = useState(false);
  const repartoCarruselRef = useDragScroll();
  const seccionInfoRef = useRef(null);

  const duracion = detalle?.duracion_minutos || obra?.duracion_minutos;
  const generos = detalle?.generos || obra?.generos || [];
  const director = detalle?.director || obra?.director;
  const califTmdb = detalle?.calificacion || obra?.calificacion || obra?.vote_average;
  const tagline = detalle?.tagline || obra?.tagline;
  const reparto = detalle?.reparto || obra?.reparto || [];

  const formatearDuracion = (min) => {
    if (!min || isNaN(min)) return null;
    const h = Math.floor(min / 60);
    const m = min % 60;
    return h > 0 ? `${h}h ${m > 0 ? `${m}m` : ''}` : `${m}m`;
  };

  const duracionTexto = formatearDuracion(duracion);

  const anioNum = Number(obra?.anio || detalle?.anio || (detalle?.fecha_estreno ? String(detalle.fecha_estreno).substring(0, 4) : 0));
  const anioActual = new Date().getFullYear();
  const esRecienteOEnTendencia = Boolean(obra?.desdeTendencias || (anioNum && anioNum >= anioActual - 1));

  const textoFechaLegible = useMemo(() => {
    if (!fechaVisto) return 'Hoy';
    const partes = String(fechaVisto).split('-').map(Number);
    if (partes.length === 3 && !isNaN(partes[0])) {
      const hoy = obtenerFechaHoyLocal();
      const ayer = obtenerFechaAyerLocal();
      const mesNombre = NOMBRES_MESES[partes[1] - 1] || '';
      if (fechaVisto === hoy) return `Hoy (${partes[2]} de ${mesNombre})`;
      if (fechaVisto === ayer) return `Ayer (${partes[2]} de ${mesNombre})`;
      return `${partes[2]} de ${mesNombre} de ${partes[0]}`;
    }
    return fechaVisto;
  }, [fechaVisto]);

  const abrirGoogleCine = (e) => {
    e.stopPropagation();
    const titulo = obra?.titulo || detalle?.titulo || '';
    const query = `horarios cine ${titulo}`;
    window.open(`https://www.google.com/search?q=${encodeURIComponent(query)}`, '_blank', 'noopener,noreferrer');
  };

  const irASinopsisYReparto = () => {
    seccionInfoRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="space-y-2.5 sm:space-y-4 max-w-2xl mx-auto pb-16 sm:pb-4 animate-fadeIn select-none">
      
      {/* 1. SECCIÓN PRINCIPAL DE REGISTRO & PUNTUACIÓN (VISIBILIDAD PRIORITARIA) */}
      <div className="p-2.5 sm:p-5 rounded-3xl bg-white dark:bg-[#181820] border border-neutral-300/80 dark:border-white/10 shadow-sm space-y-2 sm:space-y-3.5">
        
        {/* Calificador interactivo */}
        {setCalificacion && (
          <div className="space-y-1">
            <CalificadorEstrellas
              valor={calificacion}
              onChange={setCalificacion}
            />
          </div>
        )}

        {/* Indicador de fecha clara en que se vio + atajo a Reparto en celular */}
        <div className="flex items-center justify-between sm:justify-center gap-2 text-[11px] sm:text-xs text-neutral-600 dark:text-neutral-400 font-medium px-0.5">
          <div className="flex items-center gap-1 min-w-0 truncate">
            <Calendar className="w-3.5 h-3.5 text-rose-500 shrink-0" />
            <span className="hidden sm:inline">Fecha en que la viste:</span>
            <span className="sm:hidden">Fecha:</span>
            <strong className="text-neutral-900 dark:text-white font-black truncate">
              {noRecuerdaFecha ? `Estreno (${textoFechaLegible})` : textoFechaLegible}
            </strong>
          </div>

          {(sinopsis || reparto.length > 0) && (
            <button
              type="button"
              onClick={irASinopsisYReparto}
              className="sm:hidden flex items-center gap-1 px-2 py-0.5 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 font-bold text-[10px] shrink-0 active:scale-95 transition cursor-pointer"
            >
              <Users className="w-3 h-3" />
              <span>Reparto y Sinopsis</span>
              <ChevronDown className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Botón Principal de Registro */}
        <button
          type="button"
          disabled={guardando}
          onClick={onGuardar}
          className="w-full bg-gradient-to-r from-rose-600 via-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 active:scale-98 text-white font-black py-2.5 sm:py-3.5 px-4 sm:px-6 rounded-2xl shadow-xl shadow-rose-900/25 transition-all duration-200 cursor-pointer disabled:opacity-50 text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2"
        >
          <Check className="w-4 h-4 stroke-[3]" />
          <span>{guardando ? 'Guardando en tu Timeline...' : 'Registrar Película en Mi Historial'}</span>
        </button>
      </div>

      {/* 2. TAGLINE Y BADGES ESENCIALES */}
      <div className="space-y-1.5 sm:space-y-2">
        {tagline && (
          <p className="text-center text-[11px] sm:text-xs font-medium italic text-amber-600 dark:text-amber-400/90 tracking-wide line-clamp-1 sm:line-clamp-none">
            “{tagline}”
          </p>
        )}

        <div className="flex flex-wrap items-center justify-center gap-1 sm:gap-2">
          {duracionTexto && (
            <div className="flex items-center gap-1 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full bg-neutral-200/70 dark:bg-white/5 border border-neutral-300 dark:border-white/10 text-[10px] sm:text-[11px] font-bold text-neutral-700 dark:text-neutral-300 shadow-xs">
              <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-rose-500" />
              <span>{duracionTexto}</span>
            </div>
          )}

          {califTmdb && Number(califTmdb) > 0 && (
            <div className="flex items-center gap-1 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full bg-neutral-200/70 dark:bg-white/5 border border-neutral-300 dark:border-white/10 text-[10px] sm:text-[11px] font-bold text-neutral-700 dark:text-neutral-300 shadow-xs">
              <Star className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-amber-400 text-amber-400" />
              <span>{Number(califTmdb).toFixed(1)} / 10 TMDb</span>
            </div>
          )}

          {director && (
            <div className="flex items-center gap-1 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full bg-neutral-200/70 dark:bg-white/5 border border-neutral-300 dark:border-white/10 text-[10px] sm:text-[11px] font-bold text-neutral-700 dark:text-neutral-300 shadow-xs">
              <Clapperboard className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-neutral-400" />
              <span className="truncate max-w-[140px] sm:max-w-[200px]">Dir. {director}</span>
            </div>
          )}

          {generos.slice(0, 3).map((gen, idx) => (
            <span
              key={`gen-${idx}`}
              className="px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-[10px] sm:text-[11px] font-bold bg-rose-500/10 dark:bg-rose-500/15 border border-rose-500/20 text-rose-600 dark:text-rose-400 shadow-xs"
            >
              {gen}
            </span>
          ))}

          {esRecienteOEnTendencia && (
            <button
              type="button"
              onClick={abrirGoogleCine}
              className="flex items-center gap-1 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-[10px] sm:text-[11px] font-bold text-amber-600 dark:text-amber-400 shadow-xs transition cursor-pointer select-none active:scale-95"
              title="Buscar funciones y horarios en cines de tu zona en Google"
            >
              <Ticket className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-500" />
              <span>Cines en tu zona</span>
              <ExternalLink className="w-2.5 h-2.5 opacity-70" />
            </button>
          )}
        </div>
      </div>

      {/* 3. SINOPSIS COMPACTA Y PLEGABLE */}
      <div ref={seccionInfoRef} className="space-y-2.5 sm:space-y-4">
      {sinopsis && (
        <div className="bg-neutral-200/40 dark:bg-white/[0.03] p-2.5 sm:p-4 rounded-2xl border border-neutral-300/80 dark:border-white/5 space-y-1">
          <div className="flex items-center justify-between">
            <h4 className="text-[11px] font-black uppercase tracking-wider text-neutral-500 dark:text-neutral-400 flex items-center gap-1.5">
              <Film className="w-3.5 h-3.5 text-rose-500" />
              <span>Sinopsis</span>
            </h4>
            {sinopsis.length > 140 && (
              <button
                type="button"
                onClick={() => setSinopsisExpandida(!sinopsisExpandida)}
                className="text-[11px] font-bold text-rose-600 dark:text-rose-400 hover:underline cursor-pointer"
              >
                {sinopsisExpandida ? 'Leer menos' : 'Leer completa'}
              </button>
            )}
          </div>
          <p className={`text-neutral-700 dark:text-neutral-300 text-xs sm:text-sm leading-relaxed font-normal transition-all ${
            sinopsisExpandida ? '' : 'line-clamp-2'
          }`}>
            {sinopsis}
          </p>
        </div>
      )}

      {/* 4. REPARTO PRINCIPAL MODERNO (CARRUSEL HORIZONTAL CON FOTOS GRANDES Y NÍTIDAS) */}
      {reparto.length > 0 && (
        <div className="space-y-2 pt-0.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-rose-500" />
              <span className="text-xs font-black uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
                Reparto Principal
              </span>
              <span className="text-[10px] font-bold text-neutral-400 dark:text-neutral-500">
                ({reparto.length})
              </span>
            </div>

            <div className="flex items-center gap-2">
              {reparto.length > 6 && (
                <button
                  type="button"
                  onClick={() => setMostrarTodoElenco(!mostrarTodoElenco)}
                  className="text-xs font-bold text-rose-600 dark:text-rose-400 hover:text-rose-500 flex items-center gap-0.5 cursor-pointer transition active:scale-95"
                >
                  <span>{mostrarTodoElenco ? 'Ver en carrusel' : `Ver todos (${reparto.length})`}</span>
                  {mostrarTodoElenco ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
              )}
              <span className="hidden sm:inline text-[10px] text-neutral-400">
                Toca para ver filmografía
              </span>
            </div>
          </div>

          {/* Si está expandido: cuadrícula con el mismo tamaño exacto de tarjetas. Si no: carrusel horizontal */}
          {mostrarTodoElenco ? (
            <div className="flex flex-wrap items-start justify-start gap-3.5 max-h-[440px] overflow-y-auto p-1 scrollbar-thin animate-fadeIn">
              {reparto.map((actor, idx) => (
                <button
                  key={actor.id || idx}
                  type="button"
                  onClick={() => onSeleccionarActor && onSeleccionarActor(actor)}
                  className="flex flex-col items-center text-center p-2.5 rounded-2xl bg-white dark:bg-[#181820] hover:border-rose-500 border border-neutral-300/80 dark:border-white/10 transition group cursor-pointer shadow-xs shrink-0 w-28 sm:w-32"
                  title={`Ver filmografía de ${actor.nombre}`}
                >
                  <div className="w-24 h-32 sm:w-28 sm:h-36 rounded-xl overflow-hidden bg-neutral-200 dark:bg-neutral-800 shrink-0 shadow-md border border-black/10 dark:border-white/10 group-hover:scale-105 transition-transform">
                    {actor.foto ? (
                      <img
                        src={actor.foto}
                        alt={actor.nombre}
                        loading="lazy"
                        className="w-full h-full object-cover object-top"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xl font-black text-rose-500 bg-rose-500/20">
                        {(actor.nombre || '?').charAt(0)}
                      </div>
                    )}
                  </div>
                  <div className="mt-2 w-full min-w-0 px-0.5">
                    <p className="text-xs font-black text-neutral-900 dark:text-white truncate group-hover:text-rose-500 transition-colors">
                      {actor.nombre}
                    </p>
                    {actor.personaje && (
                      <p className="text-[11px] text-rose-600 dark:text-rose-400 font-semibold truncate mt-0.5">
                        {actor.personaje}
                      </p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div 
              ref={repartoCarruselRef}
              className="flex items-center gap-2.5 sm:gap-3.5 overflow-x-auto pb-3 scrollbar-thin pt-1 cursor-grab"
            >
              {reparto.slice(0, 14).map((actor, idx) => (
                <button
                  key={actor.id || idx}
                  type="button"
                  onClick={() => onSeleccionarActor && onSeleccionarActor(actor)}
                  className="flex flex-col items-center text-center p-2 sm:p-2.5 rounded-2xl bg-white dark:bg-[#181820] hover:border-rose-500 border border-neutral-300/80 dark:border-white/10 transition group cursor-pointer shadow-xs shrink-0 w-24 sm:w-32"
                  title={`Ver filmografía de ${actor.nombre}`}
                >
                  <div className="w-20 h-26 sm:w-28 sm:h-36 rounded-xl overflow-hidden bg-neutral-200 dark:bg-neutral-800 shrink-0 shadow-md border border-black/10 dark:border-white/10 group-hover:scale-105 transition-transform">
                    {actor.foto ? (
                      <img
                        src={actor.foto}
                        alt={actor.nombre}
                        loading="lazy"
                        className="w-full h-full object-cover object-top"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xl font-black text-rose-500 bg-rose-500/20">
                        {(actor.nombre || '?').charAt(0)}
                      </div>
                    )}
                  </div>
                  <div className="mt-1.5 sm:mt-2 w-full min-w-0 px-0.5">
                    <p className="text-[11px] sm:text-xs font-black text-neutral-900 dark:text-white truncate group-hover:text-rose-500 transition-colors">
                      {actor.nombre}
                    </p>
                    {actor.personaje && (
                      <p className="text-[10px] sm:text-[11px] text-rose-600 dark:text-rose-400 font-semibold truncate mt-0.5">
                        {actor.personaje}
                      </p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
      </div>
    </div>
  );
}