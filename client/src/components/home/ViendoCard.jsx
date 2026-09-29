import React, { useState, useEffect } from 'react';
import LogoPlataforma from '../common/LogoPlataforma';
import { obtenerAmigosAPI } from '../../api';

export default function ViendoCard({
  serie,
  index = 0,
  totalSeries = 1,
  onAvanzar,
  onDescartar,
  onAbrirDetalle,
  onVerInfoEpisodio
}) {
  const [avanzando, setAvanzando] = useState(false);
  
  // Estados para etiquetar amigos en co-visualización
  const [menuAmigosAbierto, setMenuAmigosAbierto] = useState(false);
  const [amigosDisponibles, setAmigosDisponibles] = useState([]);
  const [amigosSeleccionados, setAmigosSeleccionados] = useState([]);

  // Cargar lista de amigos confirmados
  useEffect(() => {
    let montado = true;
    obtenerAmigosAPI()
      .then((data) => {
        if (montado && Array.isArray(data)) setAmigosDisponibles(data);
      })
      .catch(() => {});
    return () => { montado = false; };
  }, []);

  const alternarAmigo = (amigoId, e) => {
    e.stopPropagation();
    setAmigosSeleccionados((prev) =>
      prev.includes(amigoId) ? prev.filter((id) => id !== amigoId) : [...prev, amigoId]
    );
  };

  const proximaTemporada = serie.siguiente_temporada ?? serie.temporada;
  const proximoEpisodio = serie.siguiente_episodio ?? (parseInt(serie.episodio, 10) + 1);

  const rutaPoster = serie.poster_temporada || serie.poster_path;
  const posterUrl = rutaPoster
    ? (rutaPoster.startsWith('http')
        ? rutaPoster
        : `https://image.tmdb.org/t/p/w500${rutaPoster.startsWith('/') ? rutaPoster : `/${rutaPoster}`}`)
    : null;

  const rutaFotoSiguiente = serie.foto_siguiente;
  const fotoCapituloUrl = rutaFotoSiguiente
    ? (rutaFotoSiguiente.startsWith('http')
        ? rutaFotoSiguiente
        : `https://image.tmdb.org/t/p/w780${rutaFotoSiguiente.startsWith('/') ? rutaFotoSiguiente : `/${rutaFotoSiguiente}`}`)
    : posterUrl;

  let alineacionHorizontal = 'left-1/2 -translate-x-1/2';
  if (index === 0) {
    alineacionHorizontal = 'left-0 translate-x-0';
  } else if (index === totalSeries - 1 && totalSeries > 1) {
    alineacionHorizontal = 'right-0 left-auto translate-x-0';
  }

  const handleBotonAvanzar = async (e) => {
    e.stopPropagation();
    if (avanzando) return;
    setAvanzando(true);
    try {
      if (onAvanzar) {
        // Le pasamos la serie y los amigos seleccionados
        await onAvanzar(serie, amigosSeleccionados);
        setAmigosSeleccionados([]);
        setMenuAmigosAbierto(false);
      }
    } finally {
      setAvanzando(false);
    }
  };

  return (
    <div
      onClick={() => onAbrirDetalle && onAbrirDetalle(serie)}
      className="relative w-56 h-84 flex-shrink-0 cursor-pointer group select-none hover:z-50"
    >
      {/* TARJETA BASE */}
      <div className="w-full h-full rounded-2xl overflow-hidden shadow-lg border border-neutral-300/40 dark:border-white/10 bg-[#141418] relative transition-opacity duration-200 group-hover:opacity-0">
        {posterUrl ? (
          <img
            src={posterUrl}
            alt={serie.titulo}
            loading="lazy"
            className="w-full h-full object-cover brightness-[0.95]"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center p-4 text-center text-xs font-bold text-neutral-400">
            {serie.titulo}
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/30 to-transparent flex flex-col justify-between p-4 pointer-events-none">
          <div className="flex justify-between items-center">
            <LogoPlataforma nombre={serie.plataforma} />
          </div>
          <div>
            <h3 className="text-sm font-black text-white truncate drop-shadow">{serie.titulo}</h3>
            <p className="text-xs font-bold text-rose-400 mt-0.5">
              T{proximaTemporada} · E{proximoEpisodio}
            </p>
          </div>
        </div>
      </div>

      {/* POP-UP PREVIEW EN HOVER */}
      <div
        className={`absolute top-1/2 -translate-y-1/2 ${alineacionHorizontal} w-96 rounded-3xl overflow-hidden shadow-2xl border border-white/20 bg-[#16161c] z-30 opacity-0 pointer-events-none scale-95 group-hover:opacity-100 group-hover:pointer-events-auto group-hover:scale-105 transition-all duration-300 ease-out flex flex-col`}
      >
        <div className="w-full aspect-video bg-neutral-900 relative overflow-hidden flex-shrink-0">
          {fotoCapituloUrl ? (
            <img
              src={fotoCapituloUrl}
              alt={`Capítulo ${proximoEpisodio}`}
              loading="lazy"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-xs text-neutral-500 font-bold">
              Foto de capítulo no disponible
            </div>
          )}

          {/* Botonera superior: Plataforma a la izquierda, Carita + Info + Cruz a la derecha */}
          <div className="absolute top-3 left-3 right-3 flex justify-between items-center z-10">
            <LogoPlataforma nombre={serie.plataforma} />

            <div className="flex items-center gap-1.5 relative">
              {/* Botón Carita / Amigos */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuAmigosAbierto(!menuAmigosAbierto);
                }}
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition cursor-pointer border ${
                  amigosSeleccionados.length > 0
                    ? 'bg-rose-600 border-rose-400 text-white shadow-md'
                    : 'bg-black/60 hover:bg-neutral-800 text-neutral-200 border-white/20'
                }`}
                title="Visto con un amigo..."
              >
                {amigosSeleccionados.length > 0 ? (
                  <span className="text-[10px] font-black">{amigosSeleccionados.length}</span>
                ) : (
                  '👥'
                )}
              </button>

              {/* Botón Info (X-Ray) */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onVerInfoEpisodio && onVerInfoEpisodio(serie);
                }}
                className="w-7 h-7 rounded-full bg-blue-600/90 hover:bg-blue-600 text-white flex items-center justify-center text-xs font-black transition cursor-pointer shadow-md"
                title="Ver actores y sinopsis"
              >
                ℹ
              </button>

              {/* Botón Quitar/Descartar */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDescartar && onDescartar(serie.obra_id);
                }}
                className="w-7 h-7 rounded-full bg-black/60 hover:bg-rose-600 text-white flex items-center justify-center text-xs transition cursor-pointer border border-white/20"
                title="Descartar de viendo actualmente"
              >
                ✕
              </button>

              {/* Menú flotante para seleccionar amigos */}
              {menuAmigosAbierto && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="absolute top-9 right-0 bg-[#1c1c24] border border-white/15 rounded-2xl p-2.5 shadow-2xl w-56 z-50 animate-fadeIn"
                >
                  <p className="text-[10px] font-black uppercase tracking-wider text-neutral-400 mb-2 px-1">
                    ¿Con quién lo viste?
                  </p>
                  {amigosDisponibles.length === 0 ? (
                    <p className="text-[11px] text-neutral-500 italic p-1">No tienes amigos agregados aún</p>
                  ) : (
                    <div className="max-h-40 overflow-y-auto space-y-1">
                      {amigosDisponibles.map((amigo) => {
                        const seleccionado = amigosSeleccionados.includes(amigo.id);
                        return (
                          <button
                            key={amigo.id}
                            type="button"
                            onClick={(e) => alternarAmigo(amigo.id, e)}
                            className={`w-full flex items-center justify-between p-1.5 rounded-xl text-xs transition cursor-pointer ${
                              seleccionado
                                ? 'bg-rose-600 text-white font-bold'
                                : 'hover:bg-white/10 text-neutral-300'
                            }`}
                          >
                            <span className="truncate">@{amigo.username}</span>
                            {seleccionado && <span className="text-[11px]">✓</span>}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="absolute bottom-2 left-3">
            <span className="bg-black/70 backdrop-blur-md text-[10px] font-black text-neutral-300 px-2 py-0.5 rounded-md border border-white/10">
              SIGUIENTE EPISODIO
            </span>
          </div>
        </div>

        {/* Parte inferior con título y botón de acción */}
        <div className="p-4 space-y-3 bg-[#16161c]">
          <div>
            <h3 className="text-base font-black text-white leading-tight truncate">{serie.titulo}</h3>
            <p className="text-xs font-bold text-rose-500 mt-0.5">
              Temporada {proximaTemporada} · Episodio {proximoEpisodio}
              {amigosSeleccionados.length > 0 && (
                <span className="text-neutral-400 font-normal ml-2">
                  (con {amigosSeleccionados.length} amigo{amigosSeleccionados.length > 1 ? 's' : ''})
                </span>
              )}
            </p>
          </div>

          <button
            type="button"
            disabled={avanzando}
            onClick={handleBotonAvanzar}
            className={`w-full py-2.5 px-4 rounded-xl text-xs font-black transition cursor-pointer flex items-center justify-center gap-1.5 shadow-lg ${
              avanzando
                ? 'bg-rose-900/50 text-white/50 cursor-not-allowed'
                : 'bg-rose-600 hover:bg-rose-700 active:scale-95 text-white'
            }`}
          >
            <span>✓</span> {avanzando ? 'Guardando...' : `Marcar T${proximaTemporada} E${proximoEpisodio} visto`}
          </button>
        </div>
      </div>
    </div>
  );
}