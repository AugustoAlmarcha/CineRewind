import React from 'react';
import { Film, Sparkles, Bookmark } from 'lucide-react';
import { useRuletaSorteo } from '../../hooks/useRuletaSorteo';
import ModalRecomendacionAzar from '../modal/ModalRecomendacionAzar';

export default function PestanaPendientes({
  pendientes = [],
  cargandoPendientes,
  onQuitarPendiente,
  onRegistrarObra,
  esMiPerfil = true
}) {
  const {
    estaGirando,
    indiceResaltado,
    ganador,
    modalGanadorAbierto,
    iniciarGiro,
    cerrarModal,
    registrarRef,
  } = useRuletaSorteo(pendientes);

  if (cargandoPendientes) {
    return (
      <p className="text-xs text-center text-zinc-500 py-16 font-mono animate-pulse">
        {esMiPerfil ? 'Cargando tu lista de pendientes...' : 'Cargando lista de pendientes...'}
      </p>
    );
  }

  if (pendientes.length === 0) {
    return (
      <div className="p-16 text-center rounded-3xl border border-dashed border-zinc-800 bg-zinc-950/40 animate-fadeIn">
        <p className="text-base font-bold text-zinc-200">
          {esMiPerfil ? 'Tu lista está vacía.' : 'Este usuario no tiene obras en su lista.'}
        </p>
        <p className="text-xs text-zinc-500 mt-1">
          {esMiPerfil 
            ? 'Añade títulos desde Inicio o el Buscador tocando "Ver más tarde".' 
            : 'Las películas o series que guarde para ver más tarde aparecerán aquí.'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-fadeIn">
      {/* Barra superior con botón de ruleta aleatoria */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-zinc-950/60 border border-white/10 rounded-2xl">
        <div className="flex items-center gap-2 text-xs text-zinc-400">
          <Bookmark className="w-4 h-4 text-rose-500" />
          <span>
            {pendientes.length} {pendientes.length === 1 ? 'título guardado' : 'títulos guardados'} en pendientes
          </span>
        </div>

        <button
          type="button"
          disabled={estaGirando}
          onClick={iniciarGiro}
          className={`px-4 py-2 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all duration-300 shadow-md cursor-pointer select-none disabled:opacity-50 ${
            estaGirando
              ? 'bg-amber-400 text-neutral-950 ring-4 ring-amber-400/50 animate-pulse'
              : 'bg-gradient-to-r from-amber-500 via-rose-600 to-rose-700 hover:from-amber-400 hover:to-rose-500 text-white shadow-rose-900/25 hover:scale-105 active:scale-95'
          }`}
          title="Elegir al azar qué ver hoy de tu lista de pendientes"
        >
          <Sparkles className={`w-3.5 h-3.5 text-white ${estaGirando ? 'animate-spin' : ''}`} />
          <span>{estaGirando ? 'Eligiendo de tu lista...' : '¿Qué ver hoy? (Elegir al azar)'}</span>
        </button>
      </div>

      {/* Grilla de pendientes */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
        {pendientes.map((item, index) => {
          const poster = item.poster_path
            ? (item.poster_path.startsWith('http') ? item.poster_path : `https://image.tmdb.org/t/p/w500${item.poster_path}`)
            : null;
          const esResaltado = indiceResaltado === index;

          return (
            <div
              key={`pen-${item.tmdb_id || item.id}-${index}`}
              ref={(el) => registrarRef(index, el)}
              onClick={() => {
                if (!estaGirando) {
                  onRegistrarObra({
                    tmdb_id: item.tmdb_id || item.id,
                    id: item.tmdb_id || item.id,
                    tipo: item.tipo,
                    titulo: item.titulo,
                    poster_path: poster,
                  });
                }
              }}
              className={`group aspect-[2/3] rounded-3xl overflow-hidden relative border transition-all duration-200 select-none bg-[#14141d] shadow-2xl flex flex-col justify-between p-5 ${
                estaGirando ? 'cursor-wait' : 'cursor-pointer hover:border-rose-500/50'
              } ${
                esResaltado
                  ? 'ring-4 ring-amber-400 border-amber-300 shadow-[0_0_35px_rgba(251,191,36,0.95)] scale-[1.05] z-30 brightness-110'
                  : estaGirando
                  ? 'opacity-35 brightness-75 scale-95 border-neutral-800'
                  : 'border-white/10'
              }`}
            >
              {/* Badge flotante de la ruleta cuando el item está resaltado */}
              {esResaltado && (
                <div className="absolute top-3 left-1/2 -translate-x-1/2 z-40 bg-amber-400 text-neutral-950 font-black text-[10px] px-2.5 py-0.5 rounded-full shadow-lg flex items-center gap-1 uppercase tracking-wider animate-bounce">
                  <Sparkles className="w-3 h-3 text-neutral-950" />
                  <span>{estaGirando ? 'Sorteando' : '¡Elegida!'}</span>
                </div>
              )}

              {poster ? (
                <img 
                  src={poster} 
                  alt={item.titulo} 
                  className={`absolute inset-0 w-full h-full object-cover transition duration-500 ${
                    !estaGirando ? 'group-hover:scale-105' : ''
                  }`} 
                />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
                  <div className="w-12 h-12 rounded-2xl bg-zinc-800/80 border border-white/10 flex items-center justify-center text-zinc-400 mb-2">
                    <Film className="w-6 h-6" />
                  </div>
                  <p className="text-xs font-mono text-zinc-400 font-bold">{item.titulo}</p>
                </div>
              )}

              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/25 to-black/30 group-hover:from-black/90 transition duration-300" />

              <div className="relative z-10 flex justify-end">
                {esMiPerfil && !estaGirando && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onQuitarPendiente(e, item.tmdb_id);
                    }}
                    className="w-7 h-7 rounded-full bg-black/70 hover:bg-rose-600 text-white flex items-center justify-center text-xs transition border border-white/10 opacity-0 group-hover:opacity-100 cursor-pointer"
                    title="Quitar de mi lista"
                  >
                    ✕
                  </button>
                )}
              </div>

              <div className="relative z-10 space-y-0.5">
                <h4 className="text-sm sm:text-base font-bold text-white drop-shadow-md truncate">
                  {item.titulo}
                </h4>
                <p className="text-[11px] font-mono text-zinc-400">
                  {item.anio || '2025'} · {item.tipo === 'serie' ? 'Serie' : 'Película'}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal de recomendación al azar */}
      <ModalRecomendacionAzar
        abierto={modalGanadorAbierto}
        obra={ganador}
        alCerrar={cerrarModal}
        alSeleccionar={(obraElegida) => {
          cerrarModal();
          onRegistrarObra({
            tmdb_id: obraElegida.tmdb_id || obraElegida.id,
            id: obraElegida.tmdb_id || obraElegida.id,
            tipo: obraElegida.tipo,
            titulo: obraElegida.titulo,
            poster_path: obraElegida.poster_path,
          });
        }}
        alGirarDeNuevo={iniciarGiro}
        origen="pendientes"
      />
    </div>
  );
}