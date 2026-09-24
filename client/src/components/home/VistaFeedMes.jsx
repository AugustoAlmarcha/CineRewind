import React from 'react';
import TimelineScrubber from './TimelineScrubber';

export default function VistaFeedMes({
  gruposPorDia,
  resolverImagen,
  modoSeleccion,
  seleccionadosParaBorrar,
  onToggleItem,
  onAbrirDetalleTimeline,
  busquedaHistorial,
  nombresMeses
}) {
  if (gruposPorDia.length === 0) {
    return (
      <div className="py-24 text-center text-neutral-500 italic">
        {busquedaHistorial 
          ? `No hay obras con "${busquedaHistorial}" en este mes.` 
          : 'No hay registros en este mes.'}
      </div>
    );
  }

  const puntosScrubberDias = gruposPorDia.map(([fecha, obras]) => {
    const [y, m, d] = fecha.split('-');
    const fechaObj = new Date(y, m - 1, d);
    const diaSemana = !isNaN(fechaObj.getTime())
      ? fechaObj.toLocaleDateString('es-ES', { weekday: 'short' })
      : '';
    return {
      id: `dia-seccion-${fecha}`,
      etiqueta: `${d} de ${nombresMeses[Number(m) - 1]}`,
      subtexto: `${diaSemana}, ${obras.length} obras`,
      icono: '📌',
    };
  });

  return (
    <div className="space-y-12 pt-4 relative">
      <TimelineScrubber puntos={puntosScrubberDias} />

      {gruposPorDia.map(([fecha, obrasDelDia]) => {
        const [y, m, d] = fecha.split('-');
        const fechaObj = new Date(y, m - 1, d);
        
        const diaNumero = !isNaN(fechaObj.getTime()) ? fechaObj.getDate() : d;
        const nombreMesTexto = !isNaN(fechaObj.getTime()) 
          ? fechaObj.toLocaleDateString('es-ES', { month: 'long' }).toUpperCase()
          : '';
        const diaSemanaTexto = !isNaN(fechaObj.getTime())
          ? fechaObj.toLocaleDateString('es-ES', { weekday: 'short' }).toUpperCase()
          : '';

        return (
          <div key={fecha} id={`dia-seccion-${fecha}`} className="space-y-5 scroll-mt-24">
            <div className="flex items-center gap-4">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-rose-600 dark:text-rose-500 tracking-tight">
                  {diaNumero}
                </span>
                <span className="text-xs font-black text-neutral-900 dark:text-white tracking-widest uppercase">
                  {nombreMesTexto}
                </span>
                <span className="text-[11px] font-bold text-neutral-400 uppercase">
                  · {diaSemanaTexto}
                </span>
              </div>
              
              <div className="h-[1px] flex-1 bg-neutral-300/80 dark:bg-white/10" />
              
              <span className="text-xs font-bold text-neutral-400">
                {obrasDelDia.length} {obrasDelDia.length === 1 ? 'obra' : 'obras'}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
              {obrasDelDia.map((item) => {
                const esCapitulo = Boolean(item.temporada);
                const imagenPrincipal = item.foto_episodio || item.poster_path;
                const imagenUrl = resolverImagen(imagenPrincipal);

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
                    {imagenUrl ? (
                      <img
                        src={imagenUrl}
                        alt={item.titulo}
                        loading="lazy"
                        className="w-full h-full object-cover brightness-[0.92] hover:brightness-100 transition duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center p-4 text-xs text-neutral-500 text-center font-bold">
                        {item.titulo}
                      </div>
                    )}

                    <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/25 to-transparent flex flex-col justify-between p-4 pointer-events-none">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-black/70 text-white border border-white/10">
                          {esCapitulo ? `T${item.temporada} · E${item.episodio}` : 'Película'}
                        </span>

                        {item.calificacion && (
                          <span className="text-[11px] font-black text-amber-400 bg-black/70 px-2 py-0.5 rounded-md border border-white/10 flex items-center gap-1">
                            ★ {Number(item.calificacion).toFixed(1)}
                          </span>
                        )}
                      </div>

                      <div>
                        <h4 className="text-sm font-black text-white truncate drop-shadow">
                          {item.titulo}
                        </h4>
                        <p className="text-[10px] font-bold text-neutral-400 truncate mt-0.5">
                          {item.plataforma || 'Sin plataforma'}
                        </p>
                      </div>
                    </div>

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