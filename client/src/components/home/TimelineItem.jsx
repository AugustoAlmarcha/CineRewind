import React from 'react';
import LogoPlataforma from '../common/LogoPlataforma';

export default function TimelineItem({ 
  item, 
  onEliminar, 
  modoSeleccion = false, 
  estaSeleccionado = false, 
  onToggleSeleccion,
  onAbrirDetalle 
}) {
  const rutaPoster = item.poster_path;
  const posterUrl = rutaPoster
    ? (rutaPoster.startsWith('http') 
        ? rutaPoster 
        : `https://image.tmdb.org/t/p/w500${rutaPoster.startsWith('/') ? rutaPoster : `/${rutaPoster}`}`)
    : null;

  const handleClick = () => {
    if (modoSeleccion) {
      onToggleSeleccion(item.visualizacion_id);
    } else {
      onAbrirDetalle(item);
    }
  };

  // Formato local seguro
  const formatearFecha = (fechaStr) => {
    if (!fechaStr) return '';
    const partes = String(fechaStr).split('T')[0].split('-');
    if (partes.length === 3) {
      const [anio, mes, dia] = partes;
      return `${dia}/${mes}/${anio}`;
    }
    return new Date(fechaStr).toLocaleDateString();
  };

  return (
    <div 
      onClick={handleClick}
      className={`bg-white dark:bg-[#16161a] border rounded-2xl p-4 flex items-center justify-between shadow-sm transition-all duration-200 group cursor-pointer ${
        estaSeleccionado
          ? 'border-rose-500/80 bg-rose-500/5 dark:bg-rose-500/10'
          : 'border-neutral-200 dark:border-white/5 hover:border-rose-500/30'
      }`}
    >
      <div className="flex items-center gap-4">
        {modoSeleccion && (
          <div className={`w-5 h-5 rounded-lg border flex items-center justify-center transition flex-shrink-0 ${
            estaSeleccionado 
              ? 'bg-rose-600 border-rose-600 text-white font-black text-xs' 
              : 'border-neutral-400 dark:border-neutral-600 bg-black/10'
          }`}>
            {estaSeleccionado && '✓'}
          </div>
        )}

        <div className="w-14 h-20 bg-neutral-200 dark:bg-neutral-800 rounded-xl overflow-hidden flex items-center justify-center flex-shrink-0 shadow-inner group-hover:scale-105 transition-transform duration-200">
          {posterUrl ? (
            <img 
              src={posterUrl} 
              alt={item.titulo} 
              loading="lazy"
              className="w-full h-full object-cover" 
            />
          ) : (
            <span className="text-[10px] text-neutral-400 font-semibold">Sin foto</span>
          )}
        </div>

        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-extrabold text-rose-600 dark:text-rose-400 uppercase tracking-wider px-2 py-0.5 bg-rose-600/10 dark:bg-rose-600/20 rounded border border-rose-500/20">
              {item.tipo} {item.temporada ? `· T${item.temporada} E${item.episodio}` : ''}
            </span>

            {item.plataforma && (
              <LogoPlataforma nombre={item.plataforma} />
            )}

            {item.calificacion && Number(item.calificacion) > 0 && (
              <span className="text-xs font-black text-amber-500 flex items-center gap-0.5">
                ★ {Number(item.calificacion).toFixed(1)}
              </span>
            )}
          </div>

          <h4 className="text-base font-extrabold text-neutral-900 dark:text-white">
            {item.titulo}
          </h4>
          
          <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
            Visto el {formatearFecha(item.fecha_visto)}
          </p>

          {item.resenia && (
            <p className="text-xs italic text-neutral-600 dark:text-neutral-400 line-clamp-1 pt-0.5">
              "{item.resenia}"
            </p>
          )}
        </div>
      </div>

      {!modoSeleccion && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onEliminar(item.visualizacion_id);
          }}
          className="p-2 text-neutral-400 hover:text-rose-600 hover:bg-rose-600/10 rounded-xl transition cursor-pointer"
          title="Eliminar registro"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      )}
    </div>
  );
}