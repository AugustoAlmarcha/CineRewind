import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { toPng } from 'html-to-image';
import { X, Play, Pause, ChevronLeft, ChevronRight, Film } from 'lucide-react';

// Submódulos
import LogoCineRewind from './wrapped/LogoCineRewind';
import SlideClaqueta from './wrapped/SlideClaqueta';
import SlideHoras from './wrapped/SlideHoras';
import SlidePrimerPlayPregunta from './wrapped/SlidePrimerPlayPregunta';
import SlidePrimerPlayReveal from './wrapped/SlidePrimerPlayReveal';
import SlideTeaserTop from './wrapped/SlideTeaserTop';
import SlideTopCountdown from './wrapped/SlideTopCountdown';
import SlideTop5Collage from './wrapped/SlideTop5Collage';
import SlideTeaserPeliculas from './wrapped/SlideTeaserPeliculas';
import SlideSobreHonor from './wrapped/SlideSobreHonor';
import SlidePlataformas from './wrapped/SlidePlataformas';
import SlideGenerosMeses from './wrapped/SlideGenerosMeses';
import SlideMuralCompleto from './wrapped/SlideMuralCompleto';
import SlideHabitos from './wrapped/SlideHabitos';
import SlideArquetipo from './wrapped/SlideArquetipo';
import SlideTarjetaVIP from './wrapped/SlideTarjetaVIP';

const playSound = (tipo) => {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    if (tipo === 'clap') {
      const bufferSize = ctx.sampleRate * 0.08;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);
      noise.connect(gain);
      gain.connect(ctx.destination);
      noise.start();
    } else if (tipo === 'fanfare') {
      [440, 554, 659, 880].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.1, ctx.currentTime + i * 0.09);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.09 + 0.35);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + i * 0.09);
        osc.stop(ctx.currentTime + i * 0.09 + 0.35);
      });
    }
  } catch (e) {}
};

const DURATION_MS = 8500;

export default function ModalWrapped({ abierto, alCerrar, datosWrapped }) {
  const [slideActual, setSlideActual] = useState(0);
  const [pausado, setPausado] = useState(false);
  const [progreso, setProgreso] = useState(0);
  const [claquetaGolpeada, setClaquetaGolpeada] = useState(false);
  const [sobreAbierto, setSobreAbierto] = useState(false);
  const [descargando, setDescargando] = useState(false);
  const [copiado, setCopiado] = useState(false);

  // Candado para evitar que el timer o clics rápidos salten 2 diapositivas de golpe
  const transitionLockRef = useRef(false);

  // DATOS REALES DE TU BASE DE DATOS DEDUPLICADOS
  const stats = useMemo(() => {
    if (!datosWrapped || datosWrapped.sin_datos) return null;

    const totalHoras = Number(datosWrapped.total_horas || 0);
    const totalMinutos = Number(datosWrapped.total_minutos || Math.round(totalHoras * 60));
    const totalPeliculas = Number(datosWrapped.total_peliculas || 0);
    const totalEpisodios = Number(datosWrapped.total_episodios || 0);
    const totalResenias = Number(datosWrapped.total_resenias || 0);

    // 🌟 DEDUPLICACIÓN: Evita que si viste 8 capítulos de Stranger Things se repita 8 veces
    const seriesRaw = datosWrapped.series_vistas || datosWrapped.series || [];
    const seriesUnicas = [];
    const seriesVistasSet = new Set();

    for (const s of seriesRaw) {
      if (!s || !s.poster_path || typeof s.poster_path !== 'string') continue;
      const cleanPath = s.poster_path.trim();
      if (cleanPath === '' || cleanPath.includes('null') || cleanPath.includes('undefined')) continue;
      
      const clave = String(s.tmdb_id || s.id || s.serie_id || s.titulo || '').toLowerCase().trim();
      if (clave && !seriesVistasSet.has(clave)) {
        seriesVistasSet.add(clave);
        seriesUnicas.push(s);
      }
    }

    const peliculasRaw = datosWrapped.peliculas_vistas || datosWrapped.peliculas || [];
    const peliculasUnicas = [];
    const peliculasVistasSet = new Set();

    for (const p of peliculasRaw) {
      if (!p || !p.poster_path || typeof p.poster_path !== 'string') continue;
      const cleanPath = p.poster_path.trim();
      if (cleanPath === '' || cleanPath.includes('null') || cleanPath.includes('undefined')) continue;

      const clave = String(p.tmdb_id || p.id || p.pelicula_id || p.titulo || '').toLowerCase().trim();
      if (clave && !peliculasVistasSet.has(clave)) {
        peliculasVistasSet.add(clave);
        peliculasUnicas.push(p);
      }
    }

    const todasLasObras = [...seriesUnicas, ...peliculasUnicas];

    return {
      anio: datosWrapped.anio || new Date().getFullYear(),
      usuario: datosWrapped.usuario || { nombre: 'Tu Perfil', username: 'usuario' },
      totalHoras,
      totalMinutos,
      totalPeliculas,
      totalEpisodios,
      totalResenias,
      totalSeries: seriesUnicas.length,
      totalObras: totalPeliculas + totalEpisodios,
      diasEquivalentes: datosWrapped.dias_equivalentes || `${(totalHoras / 24).toFixed(1)} días`,
      primerPlay: datosWrapped.primer_play || (todasLasObras.length > 0 ? todasLasObras[0] : null),
      topSerie: datosWrapped.top_serie || null,
      topPelicula: datosWrapped.top_pelicula || null,
      diaSagrado: datosWrapped.dia_sagrado || 'Domingo',
      plataforma: datosWrapped.plataforma_favorita || 'Cine & Streaming',
      seriesVistas: seriesUnicas,
      peliculasVistas: peliculasUnicas,
      todasLasObras,
      plataformasStats: datosWrapped.plataformas_stats || [],
      vecesAlCine: datosWrapped.veces_al_cine || 0,
      topGeneros: datosWrapped.top_generos || [],
      mesPicoPeliculas: datosWrapped.mes_pico_peliculas || null,
      mesPicoSeries: datosWrapped.mes_pico_series || null,
      sobres: [
        {
          id: 'actor',
          titulo: 'SOBRE DE HONOR · ACTOR DEL AÑO',
          subtitulo: 'Intérprete más presente en tus títulos',
          ganador: datosWrapped.actor_fetiche?.nombre || 'Sin actor destacado',
          foto: datosWrapped.actor_fetiche?.foto || null,
          frase: datosWrapped.actor_fetiche?.dato || 'Presente en tus mejores noches',
          titulos_destacados: (datosWrapped.actor_fetiche?.obras_destacadas || []).filter((o) => o && (typeof o === 'string' || o.titulo)),
          dato: 'Actor Top',
          tipo: 'actor',
          bordeColor: '#fbbf24',
          bgGradient: 'from-amber-600 via-amber-800 to-zinc-950'
        },
        {
          id: 'actriz',
          titulo: 'SOBRE DE HONOR · ACTRIZ DEL AÑO',
          subtitulo: 'Presencia protagónica destacada',
          ganador: datosWrapped.actriz_favorita?.nombre || 'Sin actriz destacada',
          foto: datosWrapped.actriz_favorita?.foto || null,
          frase: datosWrapped.actriz_favorita?.dato || 'Calificaciones sobresalientes en tu historial',
          titulos_destacados: (datosWrapped.actriz_favorita?.obras_destacadas || []).filter((o) => o && (typeof o === 'string' || o.titulo)),
          dato: 'Actriz Top',
          tipo: 'actriz',
          bordeColor: '#f472b6',
          bgGradient: 'from-pink-600 via-rose-800 to-zinc-950'
        },
        {
          id: 'director',
          titulo: 'SOBRE DE HONOR · DIRECTOR / CREADOR',
          subtitulo: 'La visión cinematográfica de tu año',
          ganador: datosWrapped.director_favorito?.nombre || 'Director Destacado',
          foto: datosWrapped.director_favorito?.foto || null,
          cargo: datosWrapped.director_favorito?.cargo || 'Creador / Director',
          frase: datosWrapped.director_favorito?.dato || 'La batuta que guio tus sesiones',
          titulos_destacados: (datosWrapped.director_favorito?.obras_destacadas || []).filter((o) => o && (typeof o === 'string' || o.titulo)),
          dato: datosWrapped.director_favorito?.cargo || 'Director / Creador Top',
          tipo: 'director',
          bordeColor: '#34d399',
          bgGradient: 'from-emerald-600 via-teal-850 to-zinc-950'
        },
        {
          id: 'copiloto',
          titulo: datosWrapped.copiloto?.esSolitario 
            ? 'SOBRE DE HONOR · MODO CINE ÍNTIMO' 
            : datosWrapped.copiloto?.esAmigoTexto 
              ? 'SOBRE DE HONOR · COMPAÑERO DE SOFÁ' 
              : 'SOBRE DE HONOR · COPILOTO DE SILLÓN',
          subtitulo: datosWrapped.copiloto?.esSolitario 
            ? 'Tu ritual personal de visualización' 
            : 'Tu cómplice en cada maratón de series y pelis',
          ganador: datosWrapped.copiloto?.esSolitario 
            ? 'Sesiones en Solitario' 
            : (datosWrapped.copiloto?.nombre || 'Sesiones en Solitario'),
          foto: datosWrapped.copiloto?.foto || null,
          esSolitario: datosWrapped.copiloto?.esSolitario ?? (!datosWrapped.copiloto?.veces || datosWrapped.copiloto?.veces === 0),
          esAmigoTexto: Boolean(datosWrapped.copiloto?.esAmigoTexto),
          frase: datosWrapped.copiloto?.frase || (datosWrapped.copiloto?.veces ? `${datosWrapped.copiloto.veces} obras compartidas` : 'Nadie te habla en el clímax, nadie te pide pausa. Puro cine a tu gusto.'),
          titulos_destacados: [],
          dato: datosWrapped.copiloto?.esSolitario ? 'Modo Solo' : (datosWrapped.copiloto?.esAmigoTexto ? 'En Compañía' : 'Copiloto'),
          tipo: 'copiloto',
          bordeColor: datosWrapped.copiloto?.esSolitario ? '#38bdf8' : (datosWrapped.copiloto?.esAmigoTexto ? '#f472b6' : '#22d3ee'),
          bgGradient: datosWrapped.copiloto?.esSolitario 
            ? 'from-blue-700 via-indigo-900 to-zinc-950' 
            : (datosWrapped.copiloto?.esAmigoTexto 
              ? 'from-pink-700 via-rose-900 to-zinc-950' 
              : 'from-cyan-600 via-blue-850 to-zinc-950')
        }
      ],
      arquetipo: datosWrapped.arquetipo || {
        titulo: 'El Jurado de Cannes',
        lema: 'Analizas cada plano con pasión y devoras temporadas con criterio de festival.'
      }
    };
  }, [datosWrapped]);

  // Construcción dinámica de la cuenta regresiva del podio de series (5 -> 4 -> 3 -> 2 -> 1)
  const topSeriesCountdown = useMemo(() => {
    if (!stats) return [];
    const raw = (stats.seriesVistas && stats.seriesVistas.length > 0)
      ? stats.seriesVistas
      : [];
    const top = raw.slice(0, 5);
    // Asignamos posición oficial (1 es la más vista) y damos vuelta para cuenta regresiva 5..1
    return top.map((s, idx) => ({
      ...s,
      posicionOriginal: idx + 1,
      episodios_vistos: s.episodios_vistos || s.veces_vista || 1
    })).reverse();
  }, [stats]);

  // Construcción dinámica de la cuenta regresiva del podio de películas (5 -> 4 -> 3 -> 2 -> 1)
  const topPeliculasCountdown = useMemo(() => {
    if (!stats) return [];
    const raw = stats.peliculasVistas || [];
    const top = raw.slice(0, 5);
    return top.map((p, idx) => ({
      ...p,
      posicionOriginal: idx + 1,
      veces_vista: p.veces_vista || p.veces || p.conteo || 1
    })).reverse();
  }, [stats]);

  // Estructura y mapeo dinámico de diapositivas
  const offsets = useMemo(() => {
    let cursor = 4; // slide 0: Claqueta, 1: Horas, 2: PrimerPlayPregunta, 3: PrimerPlayReveal

    // Series
    const tieneSeries = topSeriesCountdown.length > 0;
    const idxTeaserSeries = tieneSeries ? cursor++ : -1;
    const offsetSeriesCountdown = tieneSeries ? cursor : -1;
    if (tieneSeries) {
      cursor += topSeriesCountdown.length;
    }
    const idxCollageSeries = tieneSeries ? cursor++ : -1;

    // Películas
    const tienePelis = topPeliculasCountdown.length > 0;
    const idxTeaserPelis = tienePelis ? cursor++ : -1;
    const offsetPelisCountdown = tienePelis ? cursor : -1;
    if (tienePelis) {
      cursor += topPeliculasCountdown.length;
    }
    const idxCollagePelis = tienePelis ? cursor++ : -1;

    // Nuevas diapositivas: Plataformas/Cine y Géneros/Meses Récord
    const idxPlataformas = cursor++;
    const idxGenerosMeses = cursor++;

    // Sobres de Honor (4 sobres: actor, actriz, director, copiloto)
    const offsetSobres = cursor;
    cursor += 4;

    // Diapositivas finales
    const idxMural = cursor++;
    const idxHabitos = cursor++;
    const idxArquetipo = cursor++;
    const idxTarjetaVIP = cursor++;

    const totalSlides = cursor;

    return {
      tieneSeries,
      idxTeaserSeries,
      offsetSeriesCountdown,
      cantSeries: topSeriesCountdown.length,
      idxCollageSeries,
      tienePelis,
      idxTeaserPelis,
      offsetPelisCountdown,
      cantPelis: topPeliculasCountdown.length,
      idxCollagePelis,
      idxPlataformas,
      idxGenerosMeses,
      offsetSobres,
      idxMural,
      idxHabitos,
      idxArquetipo,
      idxTarjetaVIP,
      totalSlides
    };
  }, [topSeriesCountdown, topPeliculasCountdown]);

  const totalSlides = offsets.totalSlides;

  const colorActivo = useMemo(() => {
    if (slideActual === 0) return '#e11d48'; // Claqueta
    if (slideActual === 1) return '#8b5cf6'; // Horas
    if (slideActual === 2) return '#f59e0b'; // Pregunta Primer Play
    if (slideActual === 3) return '#f59e0b'; // Reveal Primer Play
    if (offsets.tieneSeries && slideActual === offsets.idxTeaserSeries) return '#06b6d4'; // Cyan Teaser Series

    // Series countdown
    if (
      offsets.tieneSeries &&
      slideActual >= offsets.offsetSeriesCountdown &&
      slideActual < offsets.offsetSeriesCountdown + offsets.cantSeries
    ) {
      const pos = topSeriesCountdown[slideActual - offsets.offsetSeriesCountdown]?.posicionOriginal;
      if (pos === 1) return '#f59e0b';
      if (pos === 2) return '#0284c7';
      if (pos === 3) return '#ec4899';
      if (pos === 4) return '#8b5cf6';
      return '#e11d48'; // 5
    }

    if (offsets.tieneSeries && slideActual === offsets.idxCollageSeries) return '#10b981'; // Spotify Collage Series
    if (offsets.tienePelis && slideActual === offsets.idxTeaserPelis) return '#f97316'; // Naranja Teaser Pelis

    // Pelis countdown
    if (
      offsets.tienePelis &&
      slideActual >= offsets.offsetPelisCountdown &&
      slideActual < offsets.offsetPelisCountdown + offsets.cantPelis
    ) {
      const pos = topPeliculasCountdown[slideActual - offsets.offsetPelisCountdown]?.posicionOriginal;
      if (pos === 1) return '#f59e0b';
      if (pos === 2) return '#0284c7';
      if (pos === 3) return '#ec4899';
      if (pos === 4) return '#8b5cf6';
      return '#e11d48'; // 5
    }

    if (offsets.tienePelis && slideActual === offsets.idxCollagePelis) return '#f43f5e'; // Spotify Collage Pelis
    if (slideActual === offsets.idxPlataformas) return '#f59e0b'; // Plataformas / Cine
    if (slideActual === offsets.idxGenerosMeses) return '#ec4899'; // Géneros y Meses

    // Sobres
    if (slideActual === offsets.offsetSobres) return '#fbbf24'; // Actor
    if (slideActual === offsets.offsetSobres + 1) return '#f472b6'; // Actriz
    if (slideActual === offsets.offsetSobres + 2) return '#34d399'; // Director
    if (slideActual === offsets.offsetSobres + 3) return '#38bdf8'; // Copiloto

    // Diapositivas finales
    if (slideActual === offsets.idxMural) return '#a855f7'; // Mural
    if (slideActual === offsets.idxHabitos) return '#facc15'; // Hábitos
    if (slideActual === offsets.idxArquetipo) return '#ec4899'; // Arquetipo
    if (slideActual === offsets.idxTarjetaVIP) return '#facc15'; // Tarjeta VIP

    return '#e11d48';
  }, [slideActual, offsets, topSeriesCountdown, topPeliculasCountdown]);

  // NAVEGACIÓN PRECISA: avanza estrictamente 1 slide con candado antirrebote
  const avanzarUnSlide = useCallback(() => {
    if (transitionLockRef.current) return;
    transitionLockRef.current = true;
    setSlideActual((prev) => (prev < totalSlides - 1 ? prev + 1 : prev));
    setProgreso(0);
    setTimeout(() => {
      transitionLockRef.current = false;
    }, 350);
  }, [totalSlides]);

  const retrocederUnSlide = useCallback(() => {
    if (transitionLockRef.current) return;
    transitionLockRef.current = true;
    setSlideActual((prev) => (prev > 0 ? prev - 1 : 0));
    setProgreso(0);
    setTimeout(() => {
      transitionLockRef.current = false;
    }, 350);
  }, []);

  const irASlide = useCallback((indice) => {
    if (transitionLockRef.current) return;
    setProgreso(0);
    setSlideActual(indice);
  }, []);

  useEffect(() => {
    if (!abierto) return;
    setSlideActual(0);
    setProgreso(0);
    setPausado(false);
  }, [abierto]);

  // 🌟 FIX DEL TIMER: Avanza exactamente 1 diapositiva y pausa si abres un sobre
  useEffect(() => {
    if (!abierto || pausado || !stats) return;
    if (sobreAbierto) return;

    setProgreso(0);
    const start = Date.now();
    const duracion = DURATION_MS;

    const interval = setInterval(() => {
      const elapsed = Date.now() - start;
      const pct = Math.min(100, (elapsed / duracion) * 100);
      setProgreso(pct);

      if (elapsed >= duracion) {
        clearInterval(interval);
        avanzarUnSlide();
      }
    }, 40);

    return () => clearInterval(interval);
  }, [abierto, slideActual, pausado, sobreAbierto, stats, avanzarUnSlide]);

  useEffect(() => {
    if (slideActual === 0) setClaquetaGolpeada(false);
    if (slideActual >= offsets.offsetSobres && slideActual < offsets.offsetSobres + 4) setSobreAbierto(false);
  }, [slideActual, offsets.offsetSobres]);

  const handleGolpearClaqueta = () => {
    playSound('clap');
    setClaquetaGolpeada(!claquetaGolpeada);
  };

  const handleIniciar = () => {
    playSound('clap');
    setClaquetaGolpeada(true);
    setTimeout(() => {
      avanzarUnSlide();
    }, 450);
  };

  const abrirSobre = () => {
    setSobreAbierto(true);
    playSound('fanfare');
    lanzarConfetti();
  };

  const lanzarConfetti = () => {
    confetti({
      particleCount: 85,
      spread: 90,
      origin: { y: 0.6 },
      colors: ['#facc15', '#ec4899', '#38bdf8', '#a3e635', '#ffffff', '#f97316']
    });
  };

  const obtenerUrlImagenSegura = useCallback((url) => {
    if (!url) return '';
    if (url.startsWith('data:') || url.startsWith('blob:')) return url;
    let tmdbPath = url;
    if (url.startsWith('https://image.tmdb.org/t/p/')) {
      tmdbPath = url.replace('https://image.tmdb.org/t/p/', '');
    } else if (url.startsWith('/')) {
      tmdbPath = `w500${url}`;
    }
    // Incluye el nombre y tamaño del archivo en la ruta misma para que html-to-image jamás colisione cachés
    if (!tmdbPath.startsWith('http')) {
      return `/api/historial/proxy-image/${tmdbPath.replace(/^\/+/, '')}`;
    }
    return `/api/historial/proxy-image?url=${encodeURIComponent(url)}`;
  }, []);

  const descargarElemento = async (ref, nombreArchivo) => {
    if (!ref.current) return;
    setDescargando(true);
    try {
      // cacheBust: false e includeQueryParams: true aseguran claves de caché únicas y evitan duplicación de imágenes
      const dataUrl = await toPng(ref.current, { 
        quality: 0.98, 
        pixelRatio: 2, 
        skipFonts: true, 
        cacheBust: false,
        includeQueryParams: true,
        filter: (node) => {
          if (node?.dataset?.noCapture === 'true' || node?.getAttribute?.('data-no-capture') === 'true') {
            return false;
          }
          return true;
        },
        style: {
          margin: '0',
          transform: 'none'
        }
      });
      const a = document.createElement('a');
      a.download = `${nombreArchivo}.png`;
      a.href = dataUrl;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      playSound('fanfare');
    } catch (err) {
      console.error('Error al generar imagen:', err);
    } finally {
      setDescargando(false);
    }
  };

  const compartirEnRedes = async (ref, titulo) => {
    if (!ref.current) return;
    setDescargando(true);
    try {
      const dataUrl = await toPng(ref.current, { 
        quality: 0.98, 
        pixelRatio: 2, 
        skipFonts: true, 
        cacheBust: false,
        includeQueryParams: true,
        filter: (node) => {
          if (node?.dataset?.noCapture === 'true' || node?.getAttribute?.('data-no-capture') === 'true') {
            return false;
          }
          return true;
        },
        style: {
          margin: '0',
          transform: 'none'
        }
      });
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], `${titulo}.png`, { type: 'image/png' });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `Mi CineRewind ${stats?.anio}`,
          text: `¡Mira mi CineRewind ${stats?.anio}! 🍿✨ https://cinerewind.com.ar`
        });
      } else {
        const a = document.createElement('a');
        a.download = `${titulo}.png`;
        a.href = dataUrl;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
    } catch (e) {
      console.warn('Error al compartir:', e);
    } finally {
      setDescargando(false);
    }
  };

  const copiarResumen = () => {
    if (!stats) return;
    const texto = `🍿 ¡Mi CineRewind ${stats.anio}! 🍿\n` +
      `⏱️ ${stats.totalHoras} horas en pantalla (${stats.totalMinutos.toLocaleString()} minutos)\n` +
      `📺 ${stats.totalEpisodios} capítulos de serie | 🎬 ${stats.totalPeliculas} películas\n` +
      `🏆 Top Serie: ${stats.topSerie?.titulo || 'Viendo'}\n` +
      `🍿 Top Película: ${stats.topPelicula?.titulo || 'Favorita'}\n` +
      `🎖️ Arquetipo: "${stats.arquetipo.titulo}"\n` +
      `Descubre tu año en CineRewind ✨`;
    navigator.clipboard.writeText(texto);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  if (!abierto) return null;

  if (!stats || datosWrapped?.sin_datos) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
        <div className="bg-zinc-900 border border-zinc-700 p-6 rounded-3xl max-w-sm text-center text-white shadow-2xl">
          <Film className="w-12 h-12 text-yellow-400 mx-auto mb-3" />
          <h3 className="text-xl font-black mb-1">Sin registros en este año</h3>
          <p className="text-xs text-zinc-400 mb-5">
            No tienes películas o capítulos registrados en tu historial de visualizaciones durante este período.
          </p>
          <button 
            onClick={alCerrar}
            className="w-full py-2.5 bg-yellow-400 hover:bg-yellow-300 text-black font-black rounded-xl text-xs cursor-pointer shadow-lg"
          >
            Cerrar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/95 backdrop-blur-xl select-none">
      <div 
        className="relative w-full max-w-md sm:max-w-3xl lg:max-w-4xl h-[94vh] max-h-[820px] rounded-3xl overflow-hidden shadow-2xl border-3 flex flex-col justify-between transition-all duration-300 bg-black"
        style={{ 
          borderColor: colorActivo,
          boxShadow: `0 0 50px ${colorActivo}40`
        }}
      >
        {/* Barra superior de progreso */}
        <div className="relative z-30 pt-3 px-4 sm:px-6 bg-gradient-to-b from-black/90 to-transparent pb-2">
          <div className="flex items-center gap-1.5 w-full">
            {Array.from({ length: totalSlides }).map((_, i) => (
              <div 
                key={i} 
                className="flex-1 h-1.5 rounded-full bg-white/20 overflow-hidden cursor-pointer"
                onClick={() => irASlide(i)}
              >
                <div 
                  className="h-full transition-all duration-75"
                  style={{
                    width: i < slideActual ? '100%' : i === slideActual ? `${progreso}%` : '0%',
                    backgroundColor: i === slideActual ? colorActivo : '#ffffff'
                  }}
                />
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between mt-3 text-white">
            <div className="flex items-center gap-2 sm:gap-3">
              <LogoCineRewind tamano="md" conTexto={true} />
              <div className="hidden xs:flex items-center gap-2">
                <span className="text-xs sm:text-sm md:text-base font-black font-mono uppercase tracking-wider" style={{ color: colorActivo }}>
                  Gala · {stats.anio}
                </span>
                <span className="text-[10px] sm:text-xs font-mono font-black px-2 py-0.5 rounded-full bg-white/10 text-white border border-white/10">
                  {slideActual + 1}/{totalSlides}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <button 
                onClick={() => setPausado(!pausado)} 
                className="p-1.5 sm:p-2 rounded-xl bg-black/60 hover:bg-black text-white cursor-pointer border border-white/15 transition-transform hover:scale-105"
                title={pausado ? "Reanudar" : "Pausar"}
              >
                {pausado ? <Play className="w-4 h-4 fill-white" /> : <Pause className="w-4 h-4 fill-white" />}
              </button>
              <button 
                onClick={alCerrar} 
                className="p-1.5 sm:p-2 rounded-xl bg-black/60 hover:bg-black text-white cursor-pointer border border-white/15 transition-transform hover:scale-105"
                title="Cerrar Wrapped"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* DIAPOSITIVA ACTIVA */}
        <div className="relative z-10 flex-1 flex items-center justify-center p-1 sm:p-2.5 overflow-hidden min-h-0">
          {slideActual === 0 && (
            <SlideClaqueta
              stats={stats}
              claquetaGolpeada={claquetaGolpeada}
              onGolpearClaqueta={handleGolpearClaqueta}
              onIniciar={handleIniciar}
            />
          )}

          {slideActual === 1 && (
            <SlideHoras
              stats={stats}
              onSiguiente={avanzarUnSlide}
            />
          )}

          {slideActual === 2 && (
            <SlidePrimerPlayPregunta
              stats={stats}
              onSiguiente={avanzarUnSlide}
            />
          )}

          {slideActual === 3 && (
            <SlidePrimerPlayReveal
              stats={stats}
              obtenerUrlImagenSegura={obtenerUrlImagenSegura}
              onSiguiente={avanzarUnSlide}
            />
          )}

          {offsets.tieneSeries && slideActual === offsets.idxTeaserSeries && (
            <SlideTeaserTop
              stats={stats}
              onSiguiente={avanzarUnSlide}
            />
          )}

          {offsets.tieneSeries &&
            slideActual >= offsets.offsetSeriesCountdown &&
            slideActual < offsets.offsetSeriesCountdown + offsets.cantSeries && (
              <SlideTopCountdown
                key={`serie-${slideActual}`}
                posicion={topSeriesCountdown[slideActual - offsets.offsetSeriesCountdown].posicionOriginal}
                obra={topSeriesCountdown[slideActual - offsets.offsetSeriesCountdown]}
                tipo="serie"
                totalEnPodio={offsets.cantSeries}
                obtenerUrlImagenSegura={obtenerUrlImagenSegura}
                onSiguiente={avanzarUnSlide}
              />
          )}

          {offsets.tieneSeries && slideActual === offsets.idxCollageSeries && (
            <SlideTop5Collage
              stats={stats}
              items={stats.seriesVistas}
              tipo="series"
              obtenerUrlImagenSegura={obtenerUrlImagenSegura}
              descargarElemento={descargarElemento}
              compartirEnRedes={compartirEnRedes}
              descargando={descargando}
              onSiguiente={avanzarUnSlide}
            />
          )}

          {offsets.tienePelis && slideActual === offsets.idxTeaserPelis && (
            <SlideTeaserPeliculas
              stats={stats}
              onSiguiente={avanzarUnSlide}
            />
          )}

          {offsets.tienePelis &&
            slideActual >= offsets.offsetPelisCountdown &&
            slideActual < offsets.offsetPelisCountdown + offsets.cantPelis && (
              <SlideTopCountdown
                key={`peli-${slideActual}`}
                posicion={topPeliculasCountdown[slideActual - offsets.offsetPelisCountdown].posicionOriginal}
                obra={topPeliculasCountdown[slideActual - offsets.offsetPelisCountdown]}
                tipo="pelicula"
                totalEnPodio={offsets.cantPelis}
                obtenerUrlImagenSegura={obtenerUrlImagenSegura}
                onSiguiente={avanzarUnSlide}
              />
          )}

          {offsets.tienePelis && slideActual === offsets.idxCollagePelis && (
            <SlideTop5Collage
              stats={stats}
              items={stats.peliculasVistas}
              tipo="peliculas"
              obtenerUrlImagenSegura={obtenerUrlImagenSegura}
              descargarElemento={descargarElemento}
              compartirEnRedes={compartirEnRedes}
              descargando={descargando}
              onSiguiente={avanzarUnSlide}
            />
          )}

          {slideActual === offsets.idxPlataformas && (
            <SlidePlataformas
              stats={stats}
              onSiguiente={avanzarUnSlide}
            />
          )}

          {slideActual === offsets.idxGenerosMeses && (
            <SlideGenerosMeses
              stats={stats}
              onSiguiente={avanzarUnSlide}
            />
          )}

          {slideActual >= offsets.offsetSobres && slideActual < offsets.offsetSobres + 4 && (
            <SlideSobreHonor
              sobre={stats.sobres[slideActual - offsets.offsetSobres]}
              sobreAbierto={sobreAbierto}
              onAbrirSobre={abrirSobre}
              onCerrarSobre={() => setSobreAbierto(false)}
              onConfetti={lanzarConfetti}
              onSiguiente={avanzarUnSlide}
              obtenerUrlImagenSegura={obtenerUrlImagenSegura}
            />
          )}

          {slideActual === offsets.idxMural && (
            <SlideMuralCompleto
              stats={stats}
              obtenerUrlImagenSegura={obtenerUrlImagenSegura}
              descargarElemento={descargarElemento}
              compartirEnRedes={compartirEnRedes}
              descargando={descargando}
              onSiguiente={avanzarUnSlide}
            />
          )}

          {slideActual === offsets.idxHabitos && (
            <SlideHabitos
              stats={stats}
              onSiguiente={avanzarUnSlide}
            />
          )}

          {slideActual === offsets.idxArquetipo && (
            <SlideArquetipo
              stats={stats}
              onSiguiente={avanzarUnSlide}
            />
          )}

          {slideActual === offsets.idxTarjetaVIP && (
            <SlideTarjetaVIP
              stats={stats}
              obtenerUrlImagenSegura={obtenerUrlImagenSegura}
              descargarElemento={descargarElemento}
              compartirEnRedes={compartirEnRedes}
              copiarResumen={copiarResumen}
              copiado={copiado}
              descargando={descargando}
              onConfetti={lanzarConfetti}
            />
          )}
        </div>

        {/* Flechas de navegación */}
        <button 
          onClick={retrocederUnSlide} 
          disabled={slideActual === 0} 
          className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/60 hover:bg-black/90 text-white disabled:opacity-0 cursor-pointer border border-white/20 z-40 transition-all"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button 
          onClick={avanzarUnSlide} 
          disabled={slideActual === totalSlides - 1} 
          className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/60 hover:bg-black/90 text-white disabled:opacity-0 cursor-pointer border border-white/20 z-40 transition-all"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}