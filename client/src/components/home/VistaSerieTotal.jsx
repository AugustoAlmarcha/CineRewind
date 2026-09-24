import React from 'react';
import TimelineScrubber from './TimelineScrubber';

export default function VistaSerieTotal({ 
  serie, 
  gruposPorDia, 
  resolverImagen, 
  onAbrirDetalleTimeline,
  modoSeleccion = false,
  seleccionadosParaBorrar = [],
  onToggleItem = () => {}
}) {
  const puntosScrubberSerie = gruposPorDia.map(([fecha, items]) => {
    const [y, m, d] = fecha.split('-');
    const fechaObj = new Date(y, m - 1, d);
    const nombreMes = !isNaN(fechaObj.getTime())
      ? fechaObj.toLocaleDateString('es-ES', { month: 'short' }).toUpperCase()
      : '';
    return {
      id: `serie-fecha-${fecha}`,
      etiqueta: `${d} ${nombreMes} ${y}`,
      subtexto: `${items.length} cap.`,
      icono: '🎬',
    };
  });

  return (
    <div className="space-y-12 pt-4 relative">
      <TimelineScrubber puntos={puntosScrubberSerie} />

      {/* Cabecera de la serie */}
      <div className="flex items-center justify-between border-b border-neutral-200 dark:border-white/10 pb-4">
        <div>
          <span className="text-xs font-black uppercase tracking-wider text-rose-600">Historial completo</span>
          <h2 className="text-3xl font-black text-neutral-900 dark:text-white">{serie.titulo}</h2>
        </div>
        <span className="text-xs font-black px-3 py-1.5 bg-rose-600 text-white rounded-xl shadow">
          {serie.registros.length} capítulos vistos
        </span>
      </div>

      {gruposPorDia.map(([fecha, capitulosDelDia]) => {
        const [y, m, d] = fecha.split('-');
        const fechaObj = new Date(y, m - 1, d);
        const diaNumero = !isNaN(fechaObj.getTime()) ? fechaObj.getDate() : d;
        const nombreMesTexto = !isNaN(fechaObj.getTime()) 
          ? fechaObj.toLocaleDateString('es-ES', { month: 'long' }).toUpperCase()
          : '';
        const anioTexto = !isNaN(fechaObj.getTime()) ? fechaObj.getFullYear() : '';

        return (
          <div key={fecha} id={`serie-fecha-${fecha}`} className="space-y-5 scroll-mt-24">
            <div className="flex items-center gap-4">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-rose-600 dark:text-rose-500">{diaNumero}</span>
                <span className="text-xs font-black text-neutral-900 dark:text-white tracking-widest uppercase">{nombreMesTexto}</span>
                <span className="text-[11px] font-bold text-neutral-400 uppercase">· {anioTexto}</span>
              </div>
              <div className="h-[1px] flex-1 bg-neutral-300/80 dark:bg-white/10" />
              <span className="text-xs font-bold text-neutral-400">
                {capitulosDelDia.length} {capitulosDelDia.length === 1 ? 'capítulo' : 'capítulos'}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
              {capitulosDelDia.map((item) => {
                const fullUrl = resolverImagen(item.foto_episodio || item.poster_path);
                const itemIdReal = item.id !== undefined ? item.id : item.historial_id;
                const seleccionado = itemIdReal !== undefined && seleccionadosParaBorrar.includes(itemIdReal);

                return (
                  <div
                    key={itemIdReal || `${item.titulo}-${item.temporada}-${item.episodio}`}
                    onClick={(e) => {
                      if (modoSeleccion) {
                        e.stopPropagation();
                        if (itemIdReal !== undefined) onToggleItem(itemIdReal);
                      } else {
                        onAbrirDetalleTimeline(item);
                      }
                    }}
                    className={`aspect-square relative rounded-3xl overflow-hidden cursor-pointer border transition-all duration-200 select-none shadow-sm ${
                      seleccionado
                        ? 'ring-4 ring-rose-600 border-transparent scale-95'
                        : 'border-neutral-200 dark:border-white/10 bg-neutral-900 hover:border-rose-500/60 hover:scale-[1.02]'
                    }`}
                  >
                    {fullUrl ? (
                      <img 
                        src={fullUrl} 
                        alt={item.titulo} 
                        loading="lazy" 
                        className="w-full h-full object-cover brightness-[0.92] hover:brightness-100 transition duration-300" 
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center p-3 text-xs text-neutral-400 font-bold text-center">
                        E{item.episodio}
                      </div>
                    )}

                    <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/25 to-transparent flex flex-col justify-between p-4 pointer-events-none">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-black/70 text-white border border-white/10">
                          T{item.temporada} · E{item.episodio}
                        </span>
                        {item.calificacion && (
                          <span className="text-[11px] font-black text-amber-400 bg-black/70 px-2 py-0.5 rounded-md border border-white/10 flex items-center gap-1">
                            ★ {Number(item.calificacion).toFixed(1)}
                          </span>
                        )}
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-white truncate drop-shadow">{item.titulo}</h4>
                        <p className="text-[10px] font-bold text-neutral-400 truncate mt-0.5">{item.plataforma || 'Sin plataforma'}</p>
                      </div>
                    </div>

                    {/* Casilla de selección cuando modoSeleccion está activo */}
                    {modoSeleccion && (
                      <div 
                        onClick={(e) => {
                          e.stopPropagation();
                          if (itemIdReal !== undefined) onToggleItem(itemIdReal);
                        }}
                        className={`absolute top-3 left-3 w-6 h-6 rounded-lg border flex items-center justify-center transition-colors ${
                          seleccionado 
                            ? 'bg-rose-600 border-rose-600 text-white' 
                            : 'bg-black/70 border-white/30 text-transparent hover:border-white'
                        }`}
                      >
                        <span className="text-xs font-black">✓</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}