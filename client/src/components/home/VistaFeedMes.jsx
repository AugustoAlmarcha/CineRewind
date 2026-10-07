import React from 'react';
import TimelineScrubber from './TimelineScrubber';
import { Trash2 } from 'lucide-react';

const MESES_NOMBRES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
];

export default function VistaFeedMes({
  gruposPorDia,
  resolverImagen,
  modoSeleccion,
  seleccionadosParaBorrar,
  onToggleItem,
  onEliminarItemDirecto,
  onAbrirDetalleTimeline,
  busquedaHistorial,
  nombresMeses = MESES_NOMBRES
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
    const mesIdx = Math.max(0, Math.min(11, (Number(m) || 1) - 1));
    const nombreMes = (nombresMeses && nombresMeses[mesIdx]) || MESES_NOMBRES[mesIdx] || '';
    return {
      id: `dia-seccion-${fecha}`,
      etiqueta: `${d} de ${nombreMes}`,
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

                // Detección directa desde PostgreSQL
                const esFinTemporada = Boolean(item.es_final_temporada);

                const estiloBorde = esFinTemporada
                  ? 'border-2 border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.45)] ring-1 ring-amber-400/60 dark:border-slate-200 dark:shadow-[0_0_15px_rgba(226,232,240,0.45)] dark:ring-1 dark:ring-white/50'
                  : 'border-neutral-200 dark:border-white/10 hover:border-rose-500/60';

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
                    className={`aspect-square relative rounded-3xl overflow-hidden cursor-pointer transition-all duration-200 select-none shadow-sm group ${
                      seleccionado
                        ? 'ring-4 ring-rose-600 border-transparent scale-95'
                        : `bg-neutral-900 hover:scale-[1.02] ${estiloBorde}`
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

                    {/* Capa de información sobre la portada */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/25 to-transparent flex flex-col justify-between p-4 pointer-events-none">
                      {/* Arriba: Tipo/Capítulo y Calificación */}
                      <div className="flex justify-between items-center gap-1">
                        <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border ${
                          esFinTemporada
                            ? 'bg-slate-200 text-neutral-900 border-white shadow-sm font-extrabold'
                            : 'bg-black/70 text-white border-white/10'
                        }`}>
                          {esCapitulo ? `T${item.temporada} · E${item.episodio}` : 'Película'}
                        </span>

                        <div className="flex items-center gap-1">
                          {esFinTemporada && (
                            <span className="text-[9px] font-black tracking-wider uppercase px-1.5 py-0.5 rounded bg-amber-500 text-white border border-amber-300 shadow dark:bg-slate-300/90 dark:text-neutral-900 dark:border-white">
                              FIN TEMP
                            </span>
                          )}

                          {item.calificacion && (
                            <span className="text-[11px] font-black text-amber-400 bg-black/70 px-2 py-0.5 rounded-md border border-white/10 flex items-center gap-1">
                              ★ {Number(item.calificacion).toFixed(1)}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Abajo: Título a la izquierda y Compañía a la derecha */}
                      <div className="flex items-end justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <h4 className="text-sm font-black text-white truncate drop-shadow">
                            {item.titulo}
                          </h4>
                          <p className="text-[10px] font-bold text-neutral-400 truncate mt-0.5">
                            {item.plataforma || 'Sin plataforma'}
                          </p>
                        </div>

                        {/* COMPAÑÍA: Amigos con cuenta y/o personas sin cuenta ("Mamá", etc.) */}
                        {((Array.isArray(item.amigos_covision) && item.amigos_covision.length > 0) || item.visto_con_texto) && (
                          <div className="flex flex-col items-end gap-1 flex-shrink-0">
                            <div className="flex -space-x-1.5 overflow-hidden flex-shrink-0">
                              {/* 1. Avatares circulares de amigos de la plataforma */}
                              {Array.isArray(item.amigos_covision) && item.amigos_covision.map((amigo) => (
                                <div
                                  key={amigo.amigo_id || amigo.covisualizacion_id}
                                  title={`Visto con @${amigo.username || amigo.nombre}`}
                                  className="w-6 h-6 rounded-full ring-2 ring-black/80 bg-neutral-800 overflow-hidden flex items-center justify-center shadow-md flex-shrink-0"
                                >
                                  {amigo.avatar_url ? (
                                    <img
                                      src={amigo.avatar_url}
                                      alt={amigo.username}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <span className="text-[9px] font-black text-rose-500">
                                      {(amigo.nombre || amigo.username || '?').charAt(0).toUpperCase()}
                                    </span>
                                  )}
                                </div>
                              ))}

                              {/* 2. Caritas para acompañantes sin cuenta ("Mamá", "Papá", etc.) */}
                              {item.visto_con_texto && item.visto_con_texto.split(',').map((s) => s.trim()).filter(Boolean).map((nombre, idx) => (
                                <div
                                  key={`manual-${idx}-${nombre}`}
                                  title={`Visto con ${nombre}`}
                                  className="w-6 h-6 rounded-full ring-2 ring-black/80 bg-gradient-to-tr from-purple-600 via-rose-500 to-amber-400 overflow-hidden flex items-center justify-center shadow-md flex-shrink-0"
                                >
                                  <img
                                    src={`https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(nombre)}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`}
                                    alt={nombre}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              ))}
                            </div>

                            {/* Etiqueta con el nombre del acompañante */}
                            {item.visto_con_texto && (
                              <span
                                title={`Visto con ${item.visto_con_texto}`}
                                className="text-[9px] font-black px-1.5 py-0.5 rounded-md bg-black/85 text-rose-300 border border-white/10 backdrop-blur-xs truncate max-w-[85px] shadow-sm"
                              >
                                {item.visto_con_texto}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Casilla de selección múltiple */}
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

                    {/* Botón de borrado directo individual */}
                    {!modoSeleccion && onEliminarItemDirecto && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onEliminarItemDirecto(item);
                        }}
                        className="absolute top-2.5 right-2.5 w-7 h-7 rounded-xl bg-black/75 hover:bg-rose-600 text-neutral-300 hover:text-white border border-white/20 hover:border-rose-500 backdrop-blur-md flex items-center justify-center transition-all duration-150 cursor-pointer shadow-lg active:scale-90 opacity-70 sm:opacity-0 sm:group-hover:opacity-100 z-10"
                        title={esCapitulo ? `Eliminar T${item.temporada} E${item.episodio}` : `Eliminar este registro`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
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