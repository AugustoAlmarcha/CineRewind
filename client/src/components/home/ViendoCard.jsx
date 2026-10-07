import React, { useState, useEffect, useRef } from 'react';
import LogoPlataforma from '../common/LogoPlataforma';
import { obtenerAmigosAPI } from '../../api';
import { Users, Info, X, Check, Trash2, Layers, Zap, Star } from 'lucide-react';

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

  // Estados para opinar y calificar antes de marcar como visto
  const [calificacionEpisodio, setCalificacionEpisodio] = useState(0);
  const [opinionEpisodio, setOpinionEpisodio] = useState('');
  const [mostrarOpinion, setMostrarOpinion] = useState(false);

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
        await onAvanzar(serie, amigosSeleccionados, {
          calificacion: calificacionEpisodio || null,
          resenia: opinionEpisodio.trim() || null,
        });
        setAmigosSeleccionados([]);
        setMenuAmigosAbierto(false);
        setCalificacionEpisodio(0);
        setOpinionEpisodio('');
        setMostrarOpinion(false);
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

              {/* Pastilla interactiva táctil: centrada en celulares (oculta en PC) */}
              <div className="pt-0.5 sm:hidden flex justify-center w-full">
                <div className="w-full justify-center inline-flex items-center gap-1.5 text-[11px] font-black px-2.5 py-1.5 rounded-xl bg-rose-600/90 text-white shadow-lg shadow-rose-600/40 border border-rose-400/40 backdrop-blur-md">
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

            {/* Opinar / Calificar en escritorio */}
            <div className="p-2.5 rounded-xl bg-black/40 border border-white/10 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-neutral-300 flex items-center gap-1">
                  <Star className="w-3 h-3 text-amber-400 fill-amber-400" /> Calificar (opcional):
                </span>
                {calificacionEpisodio > 0 && (
                  <span className="text-amber-400 font-black text-[11px]">★ {calificacionEpisodio}/5</span>
                )}
              </div>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((estrella) => (
                  <button
                    key={estrella}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setCalificacionEpisodio(calificacionEpisodio === estrella ? 0 : estrella);
                    }}
                    className={`p-1 rounded-lg transition cursor-pointer ${
                      calificacionEpisodio >= estrella ? 'text-amber-400' : 'text-neutral-600 hover:text-amber-300'
                    }`}
                  >
                    <Star className={`w-4 h-4 ${calificacionEpisodio >= estrella ? 'fill-amber-400' : ''}`} />
                  </button>
                ))}
              </div>
              <input
                type="text"
                value={opinionEpisodio}
                onChange={(e) => setOpinionEpisodio(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                placeholder="Tu opinión del capítulo (opcional)..."
                className="w-full px-2.5 py-1.5 text-[11px] rounded-lg bg-black/50 border border-white/10 text-white placeholder-neutral-500 focus:outline-none focus:border-rose-500"
              />
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

              {/* Botonera superior celular: Plataforma a la izq, Amigos + Info + Descartar + Cerrar a la der (Botones más grandes y cómodos) */}
              <div className="absolute top-3 left-3 right-3 flex justify-between items-center z-10">
                <LogoPlataforma nombre={serie.plataforma} />
                <div className="flex items-center gap-2 relative">
                  {/* Botón Amigos */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setMenuAmigosAbierto(!menuAmigosAbierto);
                    }}
                    className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition cursor-pointer backdrop-blur-md active:scale-90 border ${
                      amigosSeleccionados.length > 0
                        ? 'bg-rose-600 border-rose-400 text-white shadow-md'
                        : 'bg-black/70 text-neutral-200 border-white/25 hover:bg-black/90'
                    }`}
                    title="Etiquetar amigos"
                  >
                    {amigosSeleccionados.length > 0 ? (
                      <span className="text-xs font-black">{amigosSeleccionados.length}</span>
                    ) : (
                      <Users className="w-4 h-4 text-neutral-200" />
                    )}
                  </button>

                  {/* Botón Info */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onVerInfoEpisodio) onVerInfoEpisodio(serie);
                    }}
                    className="w-9 h-9 rounded-full bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center shadow-md cursor-pointer transition backdrop-blur-md active:scale-90 border border-rose-400/40"
                    title="Ver actores y sinopsis"
                  >
                    <Info className="w-4 h-4" />
                  </button>

                  {/* Botón ELIMINAR / DESCARTAR de Viendo Actualmente */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onCerrarActivo) onCerrarActivo();
                      if (onDescartar) onDescartar(serie.obra_id || serie.id);
                    }}
                    className="w-9 h-9 rounded-full bg-black/70 text-rose-400 hover:text-white hover:bg-rose-600 border border-white/25 flex items-center justify-center cursor-pointer transition backdrop-blur-md active:scale-90"
                    title="Quitar de Viendo Actualmente"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  {/* Botón Cerrar ventana */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onCerrarActivo) onCerrarActivo();
                    }}
                    className="w-9 h-9 rounded-full bg-black/80 hover:bg-white/20 text-white flex items-center justify-center border border-white/35 cursor-pointer shadow-lg transition backdrop-blur-md active:scale-90"
                    title="Cerrar"
                  >
                    <X className="w-4 h-4 stroke-[2.5]" />
                  </button>

                  {/* Menú de amigos en móvil */}
                  {menuAmigosAbierto && (
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="absolute top-11 right-0 bg-[#1c1c24] border border-white/15 rounded-2xl p-2.5 shadow-2xl w-56 z-50 animate-fadeIn"
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

              {/* Sección para Calificar y Opinar antes de marcar visto en móvil */}
              <div className="p-3 rounded-2xl bg-black/40 border border-white/10 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-neutral-300">
                    <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                    <span>Calificar capítulo:</span>
                  </div>
                  {calificacionEpisodio > 0 && (
                    <span className="text-amber-400 font-black text-xs">
                      ★ {calificacionEpisodio}/5
                    </span>
                  )}
                </div>

                {/* 5 estrellas interactivas */}
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((estrella) => (
                    <button
                      key={estrella}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setCalificacionEpisodio(calificacionEpisodio === estrella ? 0 : estrella);
                      }}
                      className={`p-1.5 rounded-xl transition cursor-pointer active:scale-90 ${
                        calificacionEpisodio >= estrella
                          ? 'text-amber-400 bg-amber-400/10'
                          : 'text-neutral-500 hover:text-amber-300 hover:bg-white/5'
                      }`}
                      title={`${estrella} estrella${estrella > 1 ? 's' : ''}`}
                    >
                      <Star className={`w-5 h-5 ${calificacionEpisodio >= estrella ? 'fill-amber-400' : ''}`} />
                    </button>
                  ))}
                </div>

                {/* Campo para opinión / reseña breve */}
                <textarea
                  value={opinionEpisodio}
                  onChange={(e) => setOpinionEpisodio(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  placeholder="Tu opinión o veredicto de este capítulo (opcional)..."
                  rows={2}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-black/60 border border-white/10 text-white placeholder-neutral-500 focus:outline-none focus:border-rose-500 transition resize-none font-medium"
                />
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
                className="w-full py-2.5 px-3 rounded-xl text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5 border border-white/10 bg-white/5 text-neutral-300 hover:text-white hover:bg-white/10"
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