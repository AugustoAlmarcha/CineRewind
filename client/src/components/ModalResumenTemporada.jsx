import React from 'react';

export default function ModalResumenTemporada({ data, onClose }) {
  if (!data) return null;

  const { titulo, temporada, poster, items = [] } = data;

  // Cálculo de promedio de calificación
  const conPuntaje = items.filter((it) => it.calificacion && Number(it.calificacion) > 0);
  const promedio = conPuntaje.length > 0
    ? (conPuntaje.reduce((acc, curr) => acc + Number(curr.calificacion), 0) / conPuntaje.length).toFixed(1)
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto">
      <div className="bg-[#141418] border border-white/10 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-6 text-white my-auto animate-fadeIn">
        
        <div className="flex items-start justify-between">
          <div className="flex gap-4">
            <img 
              src={poster} 
              alt={titulo} 
              className="w-20 h-28 object-cover rounded-2xl border border-white/10 shadow-lg flex-shrink-0" 
            />
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md bg-amber-500/20 text-amber-400 border border-amber-500/30 inline-block mb-1.5">
                🏆 Hito Alcanzado
              </span>
              <h2 className="text-2xl font-black leading-tight">{titulo}</h2>
              <p className="text-xs text-rose-400 font-bold mt-0.5">
                {temporada ? `Temporada ${temporada}` : 'Visualización Agrupada'}
              </p>
            </div>
          </div>

          <button 
            onClick={onClose} 
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-rose-600 text-neutral-400 hover:text-white flex items-center justify-center transition cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Resumen numérico */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white/5 border border-white/5 rounded-2xl p-3 text-center">
            <span className="text-[10px] font-black uppercase text-neutral-400 tracking-wider">Capítulos vistos</span>
            <p className="text-2xl font-black text-white mt-1">{items.length}</p>
          </div>
          <div className="bg-white/5 border border-white/5 rounded-2xl p-3 text-center">
            <span className="text-[10px] font-black uppercase text-neutral-400 tracking-wider">Puntuación media</span>
            <p className="text-2xl font-black text-amber-400 mt-1">
              {promedio ? `★ ${promedio}` : 'Sin calificar'}
            </p>
          </div>
        </div>

        {/* Lista de episodios que componen la temporada */}
        <div className="space-y-2 max-h-56 overflow-y-auto pr-1 scrollbar-thin">
          <label className="text-[11px] font-black uppercase tracking-widest text-neutral-400">
            Episodios completados en este periodo
          </label>
          {items.map((ep) => (
            <div 
              key={ep.visualizacion_id || ep.id} 
              className="flex items-center justify-between p-2.5 bg-white/5 rounded-xl text-xs border border-white/5"
            >
              <span className="font-bold truncate">E{ep.episodio}: {ep.titulo}</span>
              <div className="flex items-center gap-2 flex-shrink-0">
                {ep.calificacion && (
                  <span className="text-amber-400 font-bold">★ {Number(ep.calificacion).toFixed(1)}</span>
                )}
                <span className="text-[10px] text-neutral-400">{new Date(ep.fecha_visto).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>

        <button 
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-bold text-white transition cursor-pointer"
        >
          Cerrar Resumen
        </button>

      </div>
    </div>
  );
}