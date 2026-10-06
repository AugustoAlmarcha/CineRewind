import React, { useState, useMemo } from 'react';
import { Clock, Star, Film, Users, Clapperboard, Check, ChevronDown, ChevronUp, Ticket, ExternalLink, Calendar } from 'lucide-react';
import { obtenerFechaHoyLocal, obtenerFechaAyerLocal, NOMBRES_MESES } from '../../utils/fechas';

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

  const duracion = detalle?.duracion_minutos || obra?.duracion_minutos;
  const generos = detalle?.generos || obra?.generos || [];
  const director = detalle?.director || obra?.director;
  const califTmdb = detalle?.calificacion || obra?.calificacion || obra?.vote_average;
  const tagline = detalle?.tagline || obra?.tagline;
  const reparto = detalle?.reparto || obra?.reparto || [];

  const actoresMostrados = Array.isArray(reparto)
    ? (mostrarTodoElenco ? reparto : reparto.slice(0, 5))
    : [];

  const formatearDuracion = (min) => {
    if (!min || isNaN(min)) return null;
    const h = Math.floor(min / 60);
    const m = min % 60;
    return h > 0 ? `${h}h ${m > 0 ? `${m}m` : ''}` : `${m}m`;
  };

  const duracionTexto = formatearDuracion(duracion);
  const etiquetasEstrellas = ['', 'Mala', 'Regular', 'Buena', 'Muy buena', 'Obra maestra'];

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

  return (
    <div className="space-y-2 sm:space-y-3.5 max-w-2xl mx-auto pb-1 animate-fadeIn">
      {/* 1. Tagline o Lema si existe */}
      {tagline && (
        <p className="text-center text-[10px] sm:text-xs font-medium italic text-amber-500/90 dark:text-amber-400/90 tracking-wide">
          “{tagline}”
        </p>
      )}

      {/* 2. Insignias de metadatos (Duración, Puntuación, Director, Géneros) */}
      <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2">
        {duracionTexto && (
          <div className="flex items-center gap-1 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full bg-neutral-200/80 dark:bg-white/5 border border-neutral-300 dark:border-white/10 text-[10px] sm:text-xs font-bold text-neutral-700 dark:text-neutral-300 shadow-xs">
            <Clock className="w-3 h-3 text-rose-500" />
            <span>{duracionTexto}</span>
          </div>
        )}

        {califTmdb && Number(califTmdb) > 0 && (
          <div className="flex items-center gap-1 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full bg-neutral-200/80 dark:bg-white/5 border border-neutral-300 dark:border-white/10 text-[10px] sm:text-xs font-bold text-neutral-700 dark:text-neutral-300 shadow-xs">
            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
            <span>{Number(califTmdb).toFixed(1)} / 10 TMDb</span>
          </div>
        )}

        {director && (
          <div className="flex items-center gap-1 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full bg-neutral-200/80 dark:bg-white/5 border border-neutral-300 dark:border-white/10 text-[10px] sm:text-xs font-bold text-neutral-700 dark:text-neutral-300 shadow-xs">
            <Clapperboard className="w-3 h-3 text-neutral-400" />
            <span className="truncate max-w-[130px] sm:max-w-[200px]">Dir. {director}</span>
          </div>
        )}

        {generos.slice(0, 3).map((gen, idx) => (
          <span
            key={`gen-${idx}`}
            className="px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold bg-rose-500/10 dark:bg-rose-500/15 border border-rose-500/20 text-rose-600 dark:text-rose-400 shadow-xs"
          >
            {gen}
          </span>
        ))}

        {esRecienteOEnTendencia && (
          <button
            type="button"
            onClick={abrirGoogleCine}
            className="flex items-center gap-1 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-[10px] sm:text-xs font-bold text-amber-600 dark:text-amber-400 shadow-xs transition cursor-pointer select-none active:scale-95"
            title="Buscar funciones y horarios en cines de tu zona en Google"
          >
            <Ticket className="w-3 h-3 text-amber-500" />
            <span>Cines en tu zona</span>
            <ExternalLink className="w-2.5 h-2.5 opacity-70" />
          </button>
        )}
      </div>

      {/* 3. Sinopsis / Trama */}
      <div className="space-y-1 text-center sm:text-left bg-neutral-200/50 dark:bg-white/[0.03] p-2.5 sm:p-4 rounded-2xl border border-neutral-300/80 dark:border-white/5">
        <h4 className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-neutral-500 dark:text-neutral-400 flex items-center justify-center sm:justify-start gap-1.5">
          <Film className="w-3 h-3 text-rose-500" />
          <span>Sinopsis</span>
        </h4>
        <p className="text-neutral-700 dark:text-neutral-300 text-xs sm:text-sm leading-relaxed font-normal line-clamp-2 sm:line-clamp-none">
          {sinopsis || 'Sin descripción disponible para esta obra.'}
        </p>
      </div>

      {/* 4. Reparto Principal interactivo con opción de ver más personajes */}
      {reparto.length > 0 && (
        <div className="space-y-1.5 sm:space-y-2">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setMostrarTodoElenco(!mostrarTodoElenco)}
              className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-neutral-600 dark:text-neutral-300 hover:text-rose-600 dark:hover:text-rose-400 flex items-center gap-1.5 cursor-pointer transition select-none group"
              title={mostrarTodoElenco ? 'Ver menos personajes' : 'Toca para ver más personajes'}
            >
              <Users className="w-3 h-3 text-rose-500 group-hover:scale-110 transition-transform" />
              <span>Reparto principal</span>
              {reparto.length > 5 && (
                <span className="text-[9px] font-bold text-rose-600 dark:text-rose-400 bg-rose-500/10 dark:bg-rose-500/20 px-1.5 py-0.5 rounded-md">
                  {reparto.length}
                </span>
              )}
            </button>

            <div className="flex items-center gap-2">
              {reparto.length > 5 && (
                <button
                  type="button"
                  onClick={() => setMostrarTodoElenco(!mostrarTodoElenco)}
                  className="text-[10px] sm:text-[11px] font-bold text-rose-600 dark:text-rose-400 hover:text-rose-500 flex items-center gap-0.5 cursor-pointer transition active:scale-95"
                >
                  <span>{mostrarTodoElenco ? 'Ver menos' : `Ver más (${reparto.length})`}</span>
                  {mostrarTodoElenco ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>
              )}
              <span className="hidden sm:inline text-[9px] sm:text-[10px] text-neutral-400 dark:text-neutral-500">
                Toca para ver filmografía
              </span>
            </div>
          </div>

          {/* Vista inicial compacta (top 5) vs Vista expandida grande y nítida */}
          {mostrarTodoElenco ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-3.5 max-h-84 sm:max-h-96 overflow-y-auto pr-1.5 scrollbar-thin animate-fadeIn">
              {actoresMostrados.map((actor, idx) => (
                <button
                  key={actor.id || idx}
                  type="button"
                  onClick={() => onSeleccionarActor && onSeleccionarActor(actor)}
                  className="flex items-center gap-3.5 p-3 rounded-2xl bg-white/70 dark:bg-white/5 hover:bg-neutral-200/80 dark:hover:bg-white/10 border border-neutral-300 dark:border-white/10 transition text-left group cursor-pointer shadow-xs select-none"
                  title={`Ver filmografía de ${actor.nombre}`}
                >
                  {actor.foto ? (
                    <img
                      src={actor.foto}
                      alt={actor.nombre}
                      loading="lazy"
                      className="w-20 h-26 sm:w-24 sm:h-30 rounded-2xl object-cover object-top shrink-0 shadow-md border border-neutral-300/80 dark:border-white/15 group-hover:scale-105 transition-transform duration-200"
                    />
                  ) : (
                    <div className="w-20 h-26 sm:w-24 sm:h-30 rounded-2xl bg-rose-500/20 text-rose-500 font-black text-2xl flex items-center justify-center shrink-0 border border-rose-500/30">
                      {(actor.nombre || '?').charAt(0)}
                    </div>
                  )}
                  <div className="min-w-0 flex-1 space-y-1">
                    <p className="text-sm sm:text-base font-black text-neutral-900 dark:text-white leading-snug group-hover:text-rose-500 transition-colors">
                      {actor.nombre}
                    </p>
                    {actor.personaje && (
                      <p className="text-xs sm:text-sm text-rose-600 dark:text-rose-400 font-bold leading-snug line-clamp-2">
                        {actor.personaje}
                      </p>
                    )}
                    <span className="text-[11px] text-neutral-400 dark:text-neutral-500 font-medium inline-block pt-0.5 group-hover:text-neutral-700 dark:group-hover:text-neutral-300 transition-colors">
                      Ver filmografía →
                    </span>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 sm:gap-2.5">
              {actoresMostrados.map((actor, idx) => (
                <button
                  key={actor.id || idx}
                  type="button"
                  onClick={() => onSeleccionarActor && onSeleccionarActor(actor)}
                  className="flex items-center sm:flex-col gap-2 p-1.5 sm:p-2.5 rounded-xl bg-neutral-200/60 dark:bg-white/5 hover:bg-neutral-300/80 dark:hover:bg-white/10 border border-neutral-300 dark:border-white/5 transition text-left sm:text-center group cursor-pointer"
                  title={`Ver filmografía de ${actor.nombre}`}
                >
                  {actor.foto ? (
                    <img
                      src={actor.foto}
                      alt={actor.nombre}
                      loading="lazy"
                      className="w-8 h-8 sm:w-11 sm:h-11 rounded-full object-cover shrink-0 shadow-sm border border-neutral-400/40 dark:border-white/10 group-hover:scale-105 transition"
                    />
                  ) : (
                    <div className="w-8 h-8 sm:w-11 sm:h-11 rounded-full bg-rose-500/20 text-rose-500 font-black text-xs flex items-center justify-center shrink-0">
                      {(actor.nombre || '?').charAt(0)}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] sm:text-xs font-bold text-neutral-800 dark:text-neutral-200 truncate group-hover:text-rose-500 transition">
                      {actor.nombre}
                    </p>
                    {actor.personaje && (
                      <p className="text-[9px] sm:text-[10px] text-neutral-500 dark:text-neutral-400 truncate">
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

      {/* 5. Calificación opcional directa antes de guardar */}
      {setCalificacion && (
        <div className="p-2 sm:p-3.5 rounded-2xl bg-neutral-200/40 dark:bg-white/[0.02] border border-neutral-300 dark:border-white/5 flex items-center justify-between gap-2 text-left">
          <div>
            <p className="text-[11px] sm:text-xs font-bold text-neutral-800 dark:text-neutral-200">
              ¿Quieres calificarla ahora? <span className="text-neutral-400 font-normal">(Opcional)</span>
            </p>
            <p className="text-[9px] sm:text-[10px] text-neutral-500 dark:text-neutral-400">
              {calificacion > 0 ? (
                <span className="text-rose-500 font-semibold">{etiquetasEstrellas[calificacion]}</span>
              ) : (
                'Puedes asignarle estrellas o dejarlo para después'
              )}
            </p>
          </div>

          <div className="flex items-center gap-0.5 sm:gap-1">
            {[1, 2, 3, 4, 5].map((estrella) => (
              <button
                key={estrella}
                type="button"
                onClick={() => setCalificacion(calificacion === estrella ? 0 : estrella)}
                className="p-1 text-neutral-400 hover:text-amber-400 transition cursor-pointer active:scale-90"
                title={`${estrella} estrellas`}
              >
                <Star
                  className={`w-5 h-5 sm:w-6 sm:h-6 transition ${
                    estrella <= calificacion
                      ? 'fill-amber-400 text-amber-400 drop-shadow'
                      : 'text-neutral-400 dark:text-neutral-600 hover:text-amber-300'
                  }`}
                />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 6. Indicador claro de fecha y botón de registro prominente */}
      <div className="pt-2 sm:pt-3 text-center space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-neutral-200/60 dark:bg-white/5 border border-neutral-300 dark:border-white/10 text-xs font-medium text-neutral-600 dark:text-neutral-400">
          <Calendar className="w-3.5 h-3.5 text-rose-500" />
          <span>Se guardará con fecha:</span>
          <strong className="text-neutral-900 dark:text-white font-black">
            {noRecuerdaFecha ? 'Estreno original' : textoFechaLegible}
          </strong>
        </div>

        <div>
          <button
            type="button"
            disabled={guardando}
            onClick={onGuardar}
            className="w-full sm:w-auto min-w-[260px] bg-gradient-to-r from-rose-600 via-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 active:scale-95 text-white font-black px-6 sm:px-8 py-2.5 sm:py-3.5 rounded-xl sm:rounded-2xl shadow-xl shadow-rose-900/30 transition-all duration-200 cursor-pointer disabled:opacity-50 text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2 mx-auto"
          >
            <Check className="w-4 h-4 stroke-[3]" />
            <span>{guardando ? 'Guardando en tu Timeline...' : 'Registrar Película en Mi Timeline'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}