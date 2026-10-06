import React, { useState, useEffect, useRef } from 'react';
import LogoPlataforma from '../common/LogoPlataforma';
import { obtenerAmigosAPI } from '../../api';
import { Users, Info, X, Check, Trash2, Layers, Zap } from 'lucide-react';

export default function ViendoCard({
  serie,
  index = 0,
  totalSeries = 1,
  estaActivo = false,
  onAlternarActivo,
  onCerrarActivo,
  onAvanzar,
  onDescartar,
  onAbrirDetalle,
  onVerInfoEpisodio
}) {
  const [avanzando, setAvanzando] = useState(false);
  const [menuAmigosAbierto, setMenuAmigosAbierto] = useState(false);
  const [amigosDisponibles, setAmigosDisponibles] = useState([]);
  const [amigosSeleccionados, setAmigosSeleccionados] = useState([]);

  // Referencia para detectar doble toque rápido en celular sobre la tarjeta base
  const ultimoTapRef = useRef(0);

  const idSerie = serie.obra_id || serie.tmdb_id || serie.id;

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

  const rutaBackdrop = serie.backdrop_path;
  const backdropUrl = rutaBackdrop
    ? (rutaBackdrop.startsWith('http')
        ? rutaBackdrop
        : `https://image.tmdb.org/t/p/w780${rutaBackdrop.startsWith('/') ? rutaBackdrop : `/${rutaBackdrop}`}`)
    : null;

  const rutaFotoSiguiente = serie.foto_siguiente;
  const fotoCapituloUrl = rutaFotoSiguiente
    ? (rutaFotoSiguiente.startsWith('http')
        ? rutaFotoSiguiente
        : `https://image.tmdb.org/t/p/w780${rutaFotoSiguiente.startsWith('/') ? rutaFotoSiguiente : `/${rutaFotoSiguiente}`}`)
    : (backdropUrl || posterUrl);

  let alineacionHorizontal = 'sm:left-1/2 sm:-translate-x-1/2';
  if (index === 0) {
    alineacionHorizontal = 'sm:left-0 sm:translate-x-0';
  } else if (index === totalSeries - 1 && totalSeries > 1) {
    alineacionHorizontal = 'sm:right-0 sm:left-auto sm:translate-x-0';
  }

  const handleBotonAvanzar = async (e) => {
    e.stopPropagation();
    if (avanzando) return;
    setAvanzando(true);
    try {
      if (onAvanzar) {
        await onAvanzar(serie, amigosSeleccionados);
        setAmigosSeleccionados([]);
        setMenuAmigosAbierto(false);
        if (onCerrarActivo) onCerrarActivo();
      }
    } finally {
      setAvanzando(false);
    }
  };

  // Manejo de toques en la tarjeta base
  const handleTouchCardBase = () => {
    if (window.innerWidth >= 640) {
      if (onAbrirDetalle) onAbrirDetalle(serie);
      return;
    }

    const ahora = Date.now();
    const diferencia = ahora - ultimoTapRef.current;

    // Doble toque rápido (menos de 300ms): abre directamente el ModalRegistrar
    if (diferencia < 300) {
      if (onCerrarActivo) onCerrarActivo();
      if (onAbrirDetalle) onAbrirDetalle(serie);
      ultimoTapRef.current = 0;
    } else {
      // Un solo toque: abre la tarjeta flotante de celular
      ultimoTapRef.current = ahora;
      if (onAlternarActivo) onAlternarActivo(idSerie);
    }
  };

  return (
    <>
      {/* TARJETA BASE DEL CARRUSEL */}
      <div
        onClick={handleTouchCardBase}
        className="relative w-56 h-84 flex-shrink-0 cursor-pointer group select-none hover:z-40"
      >
        <div className="w-full h-full rounded-2xl overflow-hidden shadow-lg border border-neutral-300/40 dark:border-white/10 bg-[#141418] relative transition-opacity duration-200 sm:group-hover:opacity-0">
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

          <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent flex flex-col justify-between p-3.5 pointer-events-none">
            <div className="flex justify-between items-center">
              <LogoPlataforma nombre={serie.plataforma} />
            </div>

            <div className="space-y-2">
              <div>
                <h3 className="text-sm font-black text-white truncate drop-shadow">{serie.titulo}</h3>
                <p className="text-xs font-bold text-rose-400 mt-0.5">
                  T{proximaTemporada} · E{proximoEpisodio}
                </p>
              </div>

              {/* Pastilla interactiva táctil: solo en celulares (oculta en PC) */}
              <div className="pt-0.5 sm:hidden">
                <div className="inline-flex items-center gap-1.5 text-[11px] font-black px-2.5 py-1.5 rounded-xl bg-rose-600/90 text-white shadow-lg shadow-rose-600/40 border border-rose-400/40 backdrop-blur-md">
                  <Zap className="w-3.5 h-3.5 fill-amber-300 text-amber-300 shrink-0" />
                  <span className="truncate">Toca para registrar E{proximoEpisodio}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* VISTA PREVIA ESCRITORIO (HOVER EN PC) */}
        <div
          onClick={(e) => {
            e.stopPropagation();
            if (onAbrirDetalle) onAbrirDetalle(serie);
          }}
          onMouseLeave={() => setMenuAmigosAbierto(false)}
          className={`hidden sm:flex absolute top-1/2 -translate-y-1/2 ${alineacionHorizontal} w-96 rounded-3xl overflow-hidden shadow-2xl border border-white/20 bg-[#16161c] z-50 opacity-0 pointer-events-none scale-95 group-hover:opacity-100 group-hover:pointer-events-auto group-hover:scale-105 transition-all duration-300 ease-out flex-col`}
        >
          <div className="w-full h-52 sm:h-54 bg-neutral-900 relative overflow-hidden flex-shrink-0">
            {fotoCapituloUrl ? (
              <img
                src={fotoCapituloUrl}
                alt={`Capítulo ${proximoEpisodio}`}
                loading="lazy"
                className="w-full h-full object-cover object-center"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-xs text-neutral-500 font-bold">
                Foto de capítulo no disponible
              </div>
            )}

            <div className="absolute top-3 left-3 right-3 flex justify-between items-center z-10">
              <LogoPlataforma nombre={serie.plataforma} />
              <div className="flex items-center gap-1.5 relative">
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
                    <Users className="w-3.5 h-3.5 text-neutral-300" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onVerInfoEpisodio) onVerInfoEpisodio(serie);
                  }}
                  className="w-7 h-7 rounded-full bg-rose-600/90 hover:bg-rose-500 text-white flex items-center justify-center transition cursor-pointer shadow-md"
                  title="Ver actores y sinopsis"
                >
                  <Info className="w-3.5 h-3.5" />
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onDescartar) onDescartar(serie.obra_id || serie.id);
                  }}
                  className="w-7 h-7 rounded-full bg-black/60 hover:bg-rose-600 text-neutral-300 hover:text-white flex items-center justify-center transition cursor-pointer border border-white/20"
                  title="Descartar de viendo actualmente"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>

                {/* Menú de amigos en escritorio */}
                {menuAmigosAbierto && (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="absolute top-9 right-0 bg-[#1c1c24] border border-white/15 rounded-2xl p-2.5 shadow-2xl w-56 z-50 animate-fadeIn"
                  >
                    <div className="flex items-center justify-between mb-1.5 pb-1 border-b border-white/10">
                      <p className="text-[10px] font-black uppercase tracking-wider text-neutral-400">
                        ¿Con quién lo viste?
                      </p>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setMenuAmigosAbierto(false);
                        }}
                        className="text-[10px] text-neutral-400 hover:text-white px-1 cursor-pointer"
                      >
                        ✕
                      </button>
                    </div>

                    {amigosDisponibles.length === 0 ? (
                      <p className="text-[11px] text-neutral-500 italic p-1">No tienes amigos agregados aún</p>
                    ) : (
                      <div className="max-h-40 overflow-y-auto space-y-1 scrollbar-thin">
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
                              <div className="flex items-center gap-2 truncate">
                                {amigo.avatar_url ? (
                                  <img src={amigo.avatar_url} alt="" className="w-4 h-4 rounded-full object-cover shrink-0" />
                                ) : (
                                  <div className="w-4 h-4 rounded-full bg-rose-500/20 text-rose-500 text-[9px] font-black flex items-center justify-center shrink-0">
                                    {(amigo.nombre || amigo.username || '?').charAt(0).toUpperCase()}
                                  </div>
                                )}
                                <span className="truncate">@{amigo.username}</span>
                              </div>
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
              <Check className="w-4 h-4 stroke-[2.5]" />
              <span>{avanzando ? 'Guardando...' : `Marcar T${proximaTemporada} E${proximoEpisodio} visto`}</span>
            </button>
          </div>
        </div>
      </div>

      {/* POP-UP MODAL CENTRADO EN CELULAR */}
      {estaActivo && (
        <div 
          onClick={() => onCerrarActivo && onCerrarActivo()}
          className="sm:hidden fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl border border-white/20 bg-[#16161c] flex flex-col animate-scaleUp"
          >
            <div className="w-full h-44 sm:aspect-video bg-neutral-900 relative overflow-hidden flex-shrink-0">
              {fotoCapituloUrl ? (
                <img
                  src={fotoCapituloUrl}
                  alt={`Capítulo ${proximoEpisodio}`}
                  className="w-full h-full object-cover object-center"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xs text-neutral-500 font-bold">
                  Foto no disponible
                </div>
              )}

              {/* Botonera superior celular: Plataforma a la izq, Amigos + Info + Descartar + Cerrar a la der */}
              <div className="absolute top-3 left-3 right-3 flex justify-between items-center z-10">
                <LogoPlataforma nombre={serie.plataforma} />
                <div className="flex items-center gap-1.5 relative">
                  {/* Botón Amigos */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setMenuAmigosAbierto(!menuAmigosAbierto);
                    }}
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition cursor-pointer border ${
                      amigosSeleccionados.length > 0
                        ? 'bg-rose-600 border-rose-400 text-white shadow-md'
                        : 'bg-black/60 text-neutral-200 border-white/20'
                    }`}
                    title="Etiquetar amigos"
                  >
                    {amigosSeleccionados.length > 0 ? (
                      <span className="text-[10px] font-black">{amigosSeleccionados.length}</span>
                    ) : (
                      <Users className="w-3.5 h-3.5 text-neutral-300" />
                    )}
                  </button>

                  {/* Botón Info */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onVerInfoEpisodio) onVerInfoEpisodio(serie);
                    }}
                    className="w-7 h-7 rounded-full bg-rose-600/90 text-white flex items-center justify-center shadow-md cursor-pointer"
                    title="Ver actores y sinopsis"
                  >
                    <Info className="w-3.5 h-3.5" />
                  </button>

                  {/* Botón ELIMINAR / DESCARTAR de Viendo Actualmente */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onCerrarActivo) onCerrarActivo();
                      if (onDescartar) onDescartar(serie.obra_id || serie.id);
                    }}
                    className="w-7 h-7 rounded-full bg-black/60 text-rose-400 hover:text-white hover:bg-rose-600 border border-white/20 flex items-center justify-center cursor-pointer transition"
                    title="Quitar de Viendo Actualmente"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>

                  {/* Botón Cerrar ventana */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onCerrarActivo) onCerrarActivo();
                    }}
                    className="w-7 h-7 rounded-full bg-black/60 text-white flex items-center justify-center border border-white/20 cursor-pointer"
                    title="Cerrar"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>

                  {/* Menú de amigos en móvil */}
                  {menuAmigosAbierto && (
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="absolute top-9 right-0 bg-[#1c1c24] border border-white/15 rounded-2xl p-2.5 shadow-2xl w-52 z-50 animate-fadeIn"
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
                <span className="bg-black/80 backdrop-blur-md text-[10px] font-black text-neutral-300 px-2.5 py-0.5 rounded-md border border-white/10">
                  SIGUIENTE EPISODIO
                </span>
              </div>
            </div>

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

              {/* Botón para marcar el siguiente visto */}
              <button
                type="button"
                disabled={avanzando}
                onClick={handleBotonAvanzar}
                className={`w-full py-3 px-4 rounded-xl text-xs font-black transition cursor-pointer flex items-center justify-center gap-2 shadow-lg ${
                  avanzando
                    ? 'bg-rose-900/50 text-white/50 cursor-not-allowed'
                    : 'bg-rose-600 hover:bg-rose-700 active:scale-95 text-white'
                }`}
              >
                <Check className="w-4 h-4 stroke-[2.5]" />
                <span>{avanzando ? 'Guardando...' : `Marcar T${proximaTemporada} E${proximoEpisodio} visto`}</span>
              </button>

              {/* Botón directo para abrir el ModalRegistrar completo */}
              <button
                type="button"
                onClick={() => {
                  if (onCerrarActivo) onCerrarActivo();
                  if (onAbrirDetalle) onAbrirDetalle(serie);
                }}
                className="w-full py-2 px-3 rounded-xl text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5 border border-white/10 bg-white/5 text-neutral-300 hover:text-white hover:bg-white/10"
              >
                <Layers className="w-3.5 h-3.5 text-rose-500" />
                <span>Ver todas las temporadas y episodios</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}