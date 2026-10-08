import React, { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import { Share2, Copy, Check, Crown, Sparkles, Flame, Tv, Film, Star, Award, RotateCcw } from 'lucide-react';

export default function SlideTarjetaVIP({
  stats,
  obtenerUrlImagenSegura,
  compartirEnRedes,
  descargarElemento,
  copiarResumen,
  copiado,
  descargando,
  onConfetti
}) {
  const cardRef = useRef(null);
  const canvasRef = useRef(null);
  const isScratchingRef = useRef(false);
  const scratchCountRef = useRef(0);

  const [revelado, setRevelado] = useState(false);
  const [desvaneciendo, setDesvaneciendo] = useState(false);
  const anio = stats?.anio || new Date().getFullYear();

  const actorFoto = stats?.sobres?.[0]?.foto ? obtenerUrlImagenSegura(stats.sobres[0].foto) : null;
  const actorNombre = stats?.sobres?.[0]?.ganador || 'Sin actor';

  const actrizFoto = stats?.sobres?.[1]?.foto ? obtenerUrlImagenSegura(stats.sobres[1].foto) : null;
  const actrizNombre = stats?.sobres?.[1]?.ganador || 'Sin actriz';

  // Obras destacadas (Película Top y Serie Top con fallbacks)
  const { topPeli, topSerie } = useMemo(() => {
    return {
      topPeli: stats?.peliculasVistas?.[0] || stats?.topPelicula || null,
      topSerie: stats?.seriesVistas?.[0] || stats?.topSerie || null
    };
  }, [stats]);

  const totalSeriesNum = stats?.totalSeries ?? (stats?.seriesVistas?.length || 0);

  // Inicializar el lienzo directamente sobre la tarjeta
  const initCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const card = cardRef.current;
    if (!canvas || !card) return;

    const width = card.clientWidth || 360;
    const height = card.clientHeight || 640;
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    ctx.globalCompositeOperation = 'source-over';

    // 1. Fondo metálico plateado / platino con degradado
    const grad = ctx.createLinearGradient(0, 0, width, height);
    grad.addColorStop(0, '#f1f5f9');
    grad.addColorStop(0.2, '#cbd5e1');
    grad.addColorStop(0.4, '#e2e8f0');
    grad.addColorStop(0.6, '#94a3b8');
    grad.addColorStop(0.8, '#cbd5e1');
    grad.addColorStop(1, '#f8fafc');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // 2. Líneas sutiles de textura metálica cepillada
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 1.5;
    for (let i = 0; i < height; i += 10) {
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(width, i);
      ctx.stroke();
    }

    // 3. Marco plateado interior con brillo
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.lineWidth = 5;
    ctx.strokeRect(8, 8, width - 16, height - 16);

    ctx.strokeStyle = 'rgba(100, 116, 139, 0.4)';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(14, 14, width - 28, height - 28);

    // 4. Arte central estilo Deezer: "🖐️ ⤹ RASCA PARA REVELAR"
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Medallón central
    const centerY = height * 0.46;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
    ctx.beginPath();
    ctx.roundRect(width / 2 - 130, centerY - 80, 260, 160, [24]);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Mano raspadora con flecha
    ctx.font = '40px sans-serif';
    ctx.fillStyle = '#334155';
    ctx.fillText('🖐️ ⤹', width / 2, centerY - 32);

    // Texto monumental
    ctx.font = '900 21px system-ui, -apple-system, sans-serif';
    ctx.fillStyle = '#0f172a';
    ctx.fillText('RASCA PARA REVELAR', width / 2, centerY + 18);

    ctx.font = '800 11px system-ui, -apple-system, sans-serif';
    ctx.fillStyle = '#475569';
    ctx.fillText(`TU GALA VIP OFICIAL · ${anio}`, width / 2, centerY + 42);

    ctx.font = '600 10px system-ui, -apple-system, sans-serif';
    ctx.fillStyle = '#64748b';
    ctx.fillText('Pasa tu dedo o cursor para descubrir', width / 2, centerY + 58);

    scratchCountRef.current = 0;
  }, [anio]);

  useEffect(() => {
    if (!revelado) {
      // Dejamos un frame para que cardRef tenga dimensiones calculadas
      const t = setTimeout(() => {
        initCanvas();
      }, 50);
      window.addEventListener('resize', initCanvas);
      return () => {
        clearTimeout(t);
        window.removeEventListener('resize', initCanvas);
      };
    }
  }, [revelado, initCanvas]);

  // Desbloquear tarjeta (con sonido, confetti y suave transición)
  const handleDesbloquear = useCallback(() => {
    if (revelado || desvaneciendo) return;
    setDesvaneciendo(true);
    if (onConfetti) {
      onConfetti();
    }
    setTimeout(() => {
      setRevelado(true);
      setDesvaneciendo(false);
    }, 650);
  }, [revelado, desvaneciendo, onConfetti]);

  // Manejo de raspado táctil / puntero
  const handlePointerDown = (e) => {
    isScratchingRef.current = true;
    handlePointerMove(e);
  };

  const handlePointerUp = () => {
    isScratchingRef.current = false;
  };

  const handlePointerMove = (e) => {
    if (!isScratchingRef.current || revelado || desvaneciendo) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX ?? (e.touches && e.touches[0]?.clientX);
    const clientY = e.clientY ?? (e.touches && e.touches[0]?.clientY);
    if (clientX === undefined || clientY === undefined) return;

    const x = clientX - rect.left;
    const y = clientY - rect.top;

    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const ctx = canvas.getContext('2d');
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(x * scaleX, y * scaleY, 42, 0, Math.PI * 2);
    ctx.fill();

    scratchCountRef.current += 1;
    // Permite rascar y ver el fondo progresivamente (desbloquea tras ~110 movimientos placenteros de raspado)
    if (scratchCountRef.current >= 110) {
      handleDesbloquear();
    }
  };

  const handleCompartir = () => {
    // Si aún no rasparon, revelar de inmediato antes de generar imagen
    if (!revelado) setRevelado(true);
    const nombre = `Mi_Resumen_VIP_CineRewind_${anio}`;
    if (compartirEnRedes) {
      compartirEnRedes(cardRef, nombre);
    } else if (descargarElemento) {
      descargarElemento(cardRef, nombre);
    }
  };

  return (
    <div 
      ref={cardRef}
      className="w-full h-full flex flex-col justify-between items-center rounded-3xl p-3 xs:p-4 sm:p-5 relative overflow-hidden text-white shadow-2xl select-none bg-gradient-to-b from-[#180527] via-[#090212] to-[#040108]"
    >
      {/* 🌟 ARTE GEOMÉTRICO MODERNO DE FONDO */}
      <style>{`
        @keyframes vipPulseOrb1 {
          0%, 100% { transform: scale(1) translate(0, 0); opacity: 0.6; }
          50% { transform: scale(1.18) translate(15px, 15px); opacity: 0.85; }
        }
        @keyframes vipPulseOrb2 {
          0%, 100% { transform: scale(1) translate(0, 0); opacity: 0.55; }
          50% { transform: scale(1.2) translate(-15px, -15px); opacity: 0.85; }
        }
        @keyframes sparkleTwinkle {
          0%, 100% { opacity: 0.3; transform: scale(0.85) rotate(0deg); }
          50% { opacity: 1; transform: scale(1.2) rotate(15deg); }
        }
      `}</style>

      {/* Orbe superior fucsia / violeta neón */}
      <div 
        className="absolute -top-20 -left-16 w-88 h-88 sm:w-104 sm:h-104 rounded-full blur-[90px] pointer-events-none -z-0"
        style={{
          background: 'radial-gradient(circle, rgba(236,72,153,0.55) 0%, rgba(147,51,234,0.35) 60%, transparent 100%)',
          animation: 'vipPulseOrb1 10s ease-in-out infinite'
        }}
      />

      {/* Orbe inferior dorado cálido */}
      <div 
        className="absolute -bottom-24 -right-16 w-96 h-96 sm:w-112 sm:h-112 rounded-full blur-[95px] pointer-events-none -z-0"
        style={{
          background: 'radial-gradient(circle, rgba(245,158,11,0.55) 0%, rgba(225,29,72,0.3) 65%, transparent 100%)',
          animation: 'vipPulseOrb2 11s ease-in-out infinite'
        }}
      />

      {/* Capa de Decoración Geométrica Vectorial */}
      <div className="absolute inset-0 w-full h-full pointer-events-none -z-0 opacity-20 overflow-hidden">
        <svg viewBox="0 0 400 700" preserveAspectRatio="none" className="w-full h-full">
          <circle cx="370" cy="120" r="140" fill="none" stroke="#f472b6" strokeWidth="2" strokeDasharray="8 6" />
          <circle cx="370" cy="120" r="190" fill="none" stroke="#ec4899" strokeWidth="1.5" />
          <circle cx="30" cy="550" r="150" fill="none" stroke="#fbbf24" strokeWidth="2" />
          <circle cx="30" cy="550" r="210" fill="none" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="10 8" />
        </svg>
      </div>

      {/* Estrellas vectoriales de gala */}
      <div className="absolute inset-0 w-full h-full pointer-events-none -z-0 overflow-hidden">
        <svg viewBox="0 0 24 24" className="absolute top-[8%] right-[10%] w-5 h-5 text-amber-300 drop-shadow-[0_0_10px_rgba(251,191,36,0.9)]" style={{ animation: 'sparkleTwinkle 3s ease-in-out infinite' }}>
          <path d="M12 0 C12 7, 17 12, 24 12 C17 12, 12 17, 12 24 C12 17, 7 12, 0 12 C7 12, 12 7, 12 0 Z" fill="currentColor"/>
        </svg>
        <svg viewBox="0 0 24 24" className="absolute top-[25%] left-[8%] w-4 h-4 text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.9)]" style={{ animation: 'sparkleTwinkle 4s ease-in-out infinite 1s' }}>
          <path d="M12 0 C12 7, 17 12, 24 12 C17 12, 12 17, 12 24 C12 17, 7 12, 0 12 C7 12, 12 7, 12 0 Z" fill="currentColor"/>
        </svg>
        <svg viewBox="0 0 24 24" className="absolute bottom-[24%] right-[8%] w-4.5 h-4.5 text-pink-300 drop-shadow-[0_0_9px_rgba(244,114,182,0.9)]" style={{ animation: 'sparkleTwinkle 3.5s ease-in-out infinite 0.5s' }}>
          <path d="M12 0 C12 7, 17 12, 24 12 C17 12, 12 17, 12 24 C12 17, 7 12, 0 12 C7 12, 12 7, 12 0 Z" fill="currentColor"/>
        </svg>
      </div>

      {/* 🌟 LIENZO RASCA PARA REVELAR MONTADO DIRECTAMENTE SOBRE LA TARJETA (SIN FONDOS OPACOS PARA VER DE FONDO) */}
      {!revelado && !descargando && (
        <>
          <canvas
            ref={canvasRef}
            data-no-capture="true"
            onPointerDown={handlePointerDown}
            onPointerUp={handlePointerUp}
            onPointerMove={handlePointerMove}
            onPointerCancel={handlePointerUp}
            onTouchStart={handlePointerDown}
            onTouchEnd={handlePointerUp}
            onTouchMove={handlePointerMove}
            className={`absolute inset-0 z-40 w-full h-full rounded-3xl touch-none select-none cursor-grab active:cursor-grabbing transition-opacity duration-700 ${
              desvaneciendo ? 'opacity-0 pointer-events-none' : 'opacity-100'
            }`}
          />

          {/* Botón flotante para revelar directo si prefiere no raspar */}
          {!desvaneciendo && (
            <div data-no-capture="true" className="absolute bottom-16 sm:bottom-18 z-50 pointer-events-none flex items-center justify-center w-full">
              <button
                onClick={handleDesbloquear}
                data-no-capture="true"
                className="pointer-events-auto px-4 py-2 rounded-full bg-black/80 hover:bg-black text-white font-black text-xs uppercase tracking-wider border border-white/30 shadow-[0_8px_25px_rgba(0,0,0,0.8)] backdrop-blur-md transition-all hover:scale-105 active:scale-95 cursor-pointer flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>Revelar todo de una</span>
              </button>
            </div>
          )}
        </>
      )}

      {/* 1. CABECERA EDITORIAL */}
      <div className="relative z-10 flex flex-col items-center shrink-0 pt-0.5 w-full">
        <span className="text-xs xs:text-sm sm:text-base font-black tracking-tight text-white drop-shadow-md">
          #MiCineRewind{anio}
        </span>
        <div className="mt-0.5 inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full border border-amber-400/40 bg-amber-500/20 text-amber-200 text-[9px] xs:text-[10px] sm:text-xs font-mono font-bold uppercase shadow-sm">
          <Crown className="w-3 h-3 text-amber-400" />
          <span>RESUMEN OFICIAL · GALA VIP</span>
        </div>
        <span className="text-[9px] xs:text-[10px] font-mono text-zinc-300 font-semibold tracking-wider mt-0.5">
          cinerewind.com.ar · @{stats?.usuario?.username || 'usuario'}
        </span>
      </div>

      {/* 2. CUERPO CENTRAL: FOTOS GRANDES, PÓSTERS VERTICALES COMPLETOS Y ESPACIADO COMPACTO */}
      <div className="relative z-10 w-full max-w-[340px] xs:max-w-[370px] sm:max-w-[420px] flex flex-col items-center my-auto py-1">
        
        {/* SECCIÓN A: LAS ESTRELLAS DEL AÑO (FOTOS GRANDES) */}
        <div className="w-full">
          <div className="text-center mb-1">
            <span className="text-[9.5px] xs:text-[10.5px] font-black uppercase text-amber-300 tracking-widest drop-shadow">
              ★ TUS ESTRELLAS PROTAGÓNICAS ★
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:gap-5 justify-items-center">
            {/* ACTOR TOP */}
            <div className="flex flex-col items-center text-center group w-full">
              <div className="relative w-20 h-20 xs:w-24 xs:h-24 sm:w-26 sm:h-26 rounded-full p-1.5 bg-gradient-to-tr from-amber-500 via-yellow-300 to-amber-600 shadow-[0_0_25px_rgba(251,191,36,0.5)]">
                <div className="w-full h-full rounded-full overflow-hidden bg-zinc-950 border-2 border-black">
                  {actorFoto ? (
                    <img 
                      src={actorFoto} 
                      alt={actorNombre} 
                      crossOrigin="anonymous" 
                      className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-110" 
                      onError={(e) => { e.target.style.display = 'none'; }} 
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl bg-zinc-900">🎭</div>
                  )}
                </div>
                <div className="absolute -bottom-1.5 inset-x-0 flex justify-center">
                  <span className="bg-amber-400 text-black px-2 py-0.5 rounded-full text-[8px] xs:text-[9px] font-black uppercase tracking-wider shadow-md">
                    ACTOR TOP
                  </span>
                </div>
              </div>
              <span className="text-xs xs:text-sm sm:text-base font-black text-white mt-2 line-clamp-1 leading-tight">
                {actorNombre}
              </span>
            </div>

            {/* ACTRIZ TOP */}
            <div className="flex flex-col items-center text-center group w-full">
              <div className="relative w-20 h-20 xs:w-24 xs:h-24 sm:w-26 sm:h-26 rounded-full p-1.5 bg-gradient-to-tr from-pink-500 via-rose-300 to-fuchsia-600 shadow-[0_0_25px_rgba(244,114,182,0.5)]">
                <div className="w-full h-full rounded-full overflow-hidden bg-zinc-950 border-2 border-black">
                  {actrizFoto ? (
                    <img 
                      src={actrizFoto} 
                      alt={actrizNombre} 
                      crossOrigin="anonymous" 
                      className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-110" 
                      onError={(e) => { e.target.style.display = 'none'; }} 
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl bg-zinc-900">🌟</div>
                  )}
                </div>
                <div className="absolute -bottom-1.5 inset-x-0 flex justify-center">
                  <span className="bg-pink-400 text-black px-2 py-0.5 rounded-full text-[8px] xs:text-[9px] font-black uppercase tracking-wider shadow-md">
                    ACTRIZ TOP
                  </span>
                </div>
              </div>
              <span className="text-xs xs:text-sm sm:text-base font-black text-white mt-2 line-clamp-1 leading-tight">
                {actrizNombre}
              </span>
            </div>
          </div>
        </div>

        {/* SECCIÓN B: PODIO INTEGRADO DE PELÍCULA Y SERIE (PÓSTERS MÁS ALTOS Y COMPLETOS) */}
        <div className="w-full mt-2 xs:mt-2.5 sm:mt-3">
          <div className="grid grid-cols-2 gap-2.5">
            {/* Top Película */}
            {topPeli ? (
              <div className="relative h-44 xs:h-48 sm:h-52 rounded-xl overflow-hidden bg-zinc-950 border border-amber-400/60 shadow-lg group">
                {topPeli.poster_path ? (
                  <img 
                    src={obtenerUrlImagenSegura(topPeli.poster_path)} 
                    alt={topPeli.titulo || ''} 
                    crossOrigin="anonymous" 
                    className="w-full h-full object-cover object-top brightness-85 group-hover:scale-105 transition-transform duration-500" 
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                ) : null}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent p-2.5 flex flex-col justify-between text-left">
                  <span className="inline-block bg-amber-400 text-black px-1.5 py-0.5 rounded text-[8px] xs:text-[9px] font-black uppercase tracking-wider self-start shadow">
                    PELÍCULA TOP
                  </span>
                  <span className="text-xs xs:text-sm font-black uppercase text-white line-clamp-2 leading-tight drop-shadow">
                    {topPeli.titulo}
                  </span>
                </div>
              </div>
            ) : null}

            {/* Top Serie */}
            {topSerie ? (
              <div className="relative h-44 xs:h-48 sm:h-52 rounded-xl overflow-hidden bg-zinc-950 border border-cyan-400/60 shadow-lg group">
                {topSerie.poster_path ? (
                  <img 
                    src={obtenerUrlImagenSegura(topSerie.poster_path)} 
                    alt={topSerie.titulo || ''} 
                    crossOrigin="anonymous" 
                    className="w-full h-full object-cover object-top brightness-85 group-hover:scale-105 transition-transform duration-500" 
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                ) : null}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent p-2.5 flex flex-col justify-between text-left">
                  <span className="inline-block bg-cyan-400 text-black px-1.5 py-0.5 rounded text-[8px] xs:text-[9px] font-black uppercase tracking-wider self-start shadow">
                    SERIE TOP
                  </span>
                  <span className="text-xs xs:text-sm font-black uppercase text-white line-clamp-2 leading-tight drop-shadow">
                    {topSerie.titulo}
                  </span>
                </div>
              </div>
            ) : null}
          </div>
        </div>

        {/* SECCIÓN C: BANDA MONUMENTAL DE MÉTRICAS (PEGADA AL PÓSTER) */}
        <div className="w-full mt-2 p-2.5 xs:p-3 rounded-2xl bg-black/60 border border-white/20 backdrop-blur-md shadow-xl">
          <div className="grid grid-cols-4 divide-x divide-white/10 text-center">
            {/* Horas */}
            <div className="px-0.5">
              <span className="text-xl xs:text-2xl sm:text-3xl font-black tracking-tight text-amber-300 leading-none block">
                {stats?.totalHoras || 0}
              </span>
              <span className="text-[8px] xs:text-[9px] font-black uppercase text-zinc-300 tracking-wider mt-1 block">
                Horas
              </span>
            </div>

            {/* Pelis */}
            <div className="px-0.5">
              <span className="text-xl xs:text-2xl sm:text-3xl font-black tracking-tight text-orange-400 leading-none block">
                {stats?.totalPeliculas || 0}
              </span>
              <span className="text-[8px] xs:text-[9px] font-black uppercase text-zinc-300 tracking-wider mt-1 block">
                Películas
              </span>
            </div>

            {/* Series */}
            <div className="px-0.5">
              <span className="text-xl xs:text-2xl sm:text-3xl font-black tracking-tight text-purple-400 leading-none block">
                {totalSeriesNum}
              </span>
              <span className="text-[8px] xs:text-[9px] font-black uppercase text-zinc-300 tracking-wider mt-1 block">
                Series
              </span>
            </div>

            {/* Caps */}
            <div className="px-0.5">
              <span className="text-xl xs:text-2xl sm:text-3xl font-black tracking-tight text-cyan-400 leading-none block">
                {stats?.totalEpisodios || 0}
              </span>
              <span className="text-[8px] xs:text-[9px] font-black uppercase text-zinc-300 tracking-wider mt-1 block">
                Capítulos
              </span>
            </div>
          </div>
        </div>

        {/* SECCIÓN D: RIBBON ARQUETIPO DE HONOR (PEGADO A LAS MÉTRICAS) */}
        <div className="w-full mt-2 py-1.5 px-4 rounded-full bg-gradient-to-r from-amber-500/20 via-pink-500/20 to-purple-500/20 border border-amber-400/40 flex items-center justify-center gap-1.5 shadow-sm">
          <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span className="text-[9px] xs:text-[10px] font-mono font-bold uppercase text-amber-300 tracking-wider">
            ARQUETIPO:
          </span>
          <span className="text-[10px] xs:text-[11px] font-black uppercase text-white truncate">
            "{stats?.arquetipo?.titulo || 'El Jurado de Cannes'}"
          </span>
        </div>

      </div>

      {/* 3. BOTONES DE ACCIÓN (CON data-no-capture="true") */}
      <div 
        data-no-capture="true"
        className="relative z-30 flex items-center justify-center gap-2 shrink-0 pt-2 pb-1 w-full max-w-xs"
      >
        <button
          onClick={handleCompartir}
          disabled={descargando}
          data-no-capture="true"
          className="flex-1 py-2.5 px-4 rounded-full bg-white hover:bg-zinc-100 text-black font-black text-xs sm:text-sm uppercase flex items-center justify-center gap-2 cursor-pointer shadow-xl transition-all hover:scale-105 active:scale-98"
        >
          <Share2 className="w-4 h-4 text-black" />
          <span>{descargando ? 'Generando...' : 'Compartir'}</span>
        </button>
        <button
          onClick={copiarResumen}
          data-no-capture="true"
          className="py-2.5 px-4 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold text-xs sm:text-sm cursor-pointer shadow border border-white/20 transition-all hover:scale-105 flex items-center gap-1.5"
          title="Copiar texto resumen"
        >
          {copiado ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-zinc-300" />}
          <span>{copiado ? 'Copiado' : 'Copiar'}</span>
        </button>
        {revelado && (
          <button
            onClick={() => { setRevelado(false); }}
            data-no-capture="true"
            className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-zinc-300 hover:text-white border border-white/20 transition-all cursor-pointer"
            title="Volver a rascar"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
