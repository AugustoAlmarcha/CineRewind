import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Star, Check, X, Trash2, Award, Calendar } from 'lucide-react';
import CalificadorEstrellas from '../common/CalificadorEstrellas';
import { 
  guardarCalificacionSerieTemporadaAPI, 
  obtenerCalificacionesSerieAPI 
} from '../../api';
import { obtenerNotaEspecialSerie } from '../../utils/seriesNotas';

export default function ModalCalificarSerie({
  obra,
  temporadaInicial = null, // null = Serie completa, número = Temporada específica
  temporadasDisponibles = [], // array de números [1, 2, 3] o un número total
  onClose,
  onActualizado
}) {
  const tmdbId = Number(obra?.tmdb_id || obra?.id || obra?.obra_tmdb_id);
  const titulo = obra?.titulo || 'Serie';
  const posterPath = obra?.poster_serie || obra?.poster_path || obra?.poster_obra || obra?.foto_episodio;
  const notaEspecial = obtenerNotaEspecialSerie(tmdbId, titulo);

  // Normalizar lista de temporadas disponibles
  const listaTemporadas = React.useMemo(() => {
    if (Array.isArray(temporadasDisponibles) && temporadasDisponibles.length > 0) {
      return [...new Set(temporadasDisponibles)].sort((a, b) => a - b);
    }
    if (typeof temporadasDisponibles === 'number' && temporadasDisponibles > 0) {
      return Array.from({ length: temporadasDisponibles }, (_, i) => i + 1);
    }
    // Si no se pasaron, permitir al menos 1 o la temporada actual
    const t = Number(temporadaInicial || obra?.temporada || 1);
    return [t > 0 ? t : 1];
  }, [temporadasDisponibles, temporadaInicial, obra?.temporada]);

  // Tab activo: 'serie' o número de temporada
  const [tabActivo, setTabActivo] = useState(
    temporadaInicial !== null && temporadaInicial !== undefined && Number(temporadaInicial) > 0
      ? Number(temporadaInicial)
      : 'serie'
  );

  // Calificaciones guardadas en el servidor
  const [calificacionesCargadas, setCalificacionesCargadas] = useState({
    serie: null,
    temporadas: {}
  });

  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState(null);

  // Estado del formulario para el tab seleccionado actualmente
  const [calificacionActual, setCalificacionActual] = useState(0);
  const [reseniaActual, setReseniaActual] = useState('');

  // 1. Cargar las calificaciones existentes
  useEffect(() => {
    let cancelado = false;
    const cargar = async () => {
      setCargando(true);
      try {
        const data = await obtenerCalificacionesSerieAPI(tmdbId);
        if (!cancelado && data) {
          setCalificacionesCargadas({
            serie: data.serie || null,
            temporadas: data.temporadas || {}
          });
        }
      } catch (err) {
        console.warn('Error al cargar calificaciones de serie:', err);
      } finally {
        if (!cancelado) setCargando(false);
      }
    };

    if (tmdbId) cargar();
    return () => { cancelado = true; };
  }, [tmdbId]);

  // 2. Al cambiar de tab o al terminar de cargar, sincronizar el formulario
  useEffect(() => {
    if (tabActivo === 'serie') {
      const reg = calificacionesCargadas.serie;
      setCalificacionActual(reg?.calificacion ? Number(reg.calificacion) : 0);
      setReseniaActual(reg?.resenia || '');
    } else {
      const reg = calificacionesCargadas.temporadas[tabActivo];
      setCalificacionActual(reg?.calificacion ? Number(reg.calificacion) : 0);
      setReseniaActual(reg?.resenia || '');
    }
    setError(null);
  }, [tabActivo, calificacionesCargadas]);

  const handleGuardar = async () => {
    setGuardando(true);
    setError(null);
    try {
      const esGlobal = tabActivo === 'serie';
      const tempNum = esGlobal ? null : Number(tabActivo);

      await guardarCalificacionSerieTemporadaAPI({
        tmdb_id: tmdbId,
        titulo: titulo,
        poster_path: posterPath,
        temporada: tempNum,
        calificacion: calificacionActual > 0 ? calificacionActual : null,
        resenia: reseniaActual.trim() || null
      });

      // Actualizar estado local
      setCalificacionesCargadas((prev) => {
        if (esGlobal) {
          return {
            ...prev,
            serie: calificacionActual > 0 || reseniaActual.trim() 
              ? { calificacion: calificacionActual, resenia: reseniaActual.trim() } 
              : null
          };
        } else {
          const nuevas = { ...prev.temporadas };
          if (calificacionActual > 0 || reseniaActual.trim()) {
            nuevas[tabActivo] = { calificacion: calificacionActual, resenia: reseniaActual.trim() };
          } else {
            delete nuevas[tabActivo];
          }
          return { ...prev, temporadas: nuevas };
        }
      });

      if (onActualizado) onActualizado();
      onClose();
    } catch (err) {
      console.error('Error al guardar calificación:', err);
      setError(err.message || 'Error al guardar la calificación');
    } finally {
      setGuardando(false);
    }
  };

  const handleBorrar = async () => {
    setGuardando(true);
    setError(null);
    try {
      const esGlobal = tabActivo === 'serie';
      const tempNum = esGlobal ? null : Number(tabActivo);

      await guardarCalificacionSerieTemporadaAPI({
        tmdb_id: tmdbId,
        titulo: titulo,
        poster_path: posterPath,
        temporada: tempNum,
        calificacion: null,
        resenia: null
      });

      setCalificacionActual(0);
      setReseniaActual('');

      setCalificacionesCargadas((prev) => {
        if (esGlobal) {
          return { ...prev, serie: null };
        } else {
          const nuevas = { ...prev.temporadas };
          delete nuevas[tabActivo];
          return { ...prev, temporadas: nuevas };
        }
      });

      if (onActualizado) onActualizado();
    } catch (err) {
      console.error('Error al borrar calificación:', err);
      setError(err.message || 'Error al borrar la calificación');
    } finally {
      setGuardando(false);
    }
  };

  const tieneCalificacionGuardada = tabActivo === 'serie'
    ? Boolean(calificacionesCargadas.serie?.calificacion)
    : Boolean(calificacionesCargadas.temporadas[tabActivo]?.calificacion);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div 
      onClick={onClose}
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fadeIn"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="bg-[#fcfaf7] dark:bg-[#181820] border border-neutral-300 dark:border-white/10 rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden flex flex-col text-neutral-900 dark:text-white"
      >
        
        {/* Cabecera */}
        <div className="p-4 sm:p-5 border-b border-neutral-200 dark:border-white/10 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            {posterPath ? (
              <img 
                src={posterPath.startsWith('http') ? posterPath : `https://image.tmdb.org/t/p/w200${posterPath}`} 
                alt={titulo} 
                className="w-10 h-14 object-cover rounded-xl shadow-md border border-black/10 shrink-0" 
              />
            ) : (
              <div className="w-10 h-14 bg-rose-600/20 text-rose-500 rounded-xl flex items-center justify-center font-black shrink-0">
                ★
              </div>
            )}
            <div className="min-w-0">
              <span className="text-[10px] font-black uppercase tracking-wider text-rose-600 dark:text-rose-500 block">
                Calificar y Reseñar
              </span>
              <h3 className="text-base sm:text-lg font-black truncate leading-tight">
                {titulo}
              </h3>
            </div>
          </div>

          <button 
            type="button" 
            onClick={onClose} 
            className="w-8 h-8 rounded-full bg-neutral-200/80 dark:bg-white/10 hover:bg-rose-600 hover:text-white flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tira de Selección de Alcance: Serie Completa o Temporadas */}
        <div className="px-4 sm:px-5 pt-3.5 pb-2 border-b border-neutral-200/80 dark:border-white/5 flex items-center gap-2 overflow-x-auto scrollbar-thin select-none">
          {/* Botón Serie Completa */}
          <button
            type="button"
            onClick={() => setTabActivo('serie')}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
              tabActivo === 'serie'
                ? 'bg-rose-600 text-white shadow-md'
                : 'bg-neutral-200/70 dark:bg-white/5 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-300'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>Serie Completa</span>
            {calificacionesCargadas.serie?.calificacion && (
              <span className="text-[10px] px-1 py-0.2 rounded bg-black/20 text-amber-300 font-mono">
                ★ {Number(calificacionesCargadas.serie.calificacion).toFixed(1)}
              </span>
            )}
          </button>

          {/* Botones de Temporadas */}
          {listaTemporadas.map((temp) => {
            const califTemp = calificacionesCargadas.temporadas[temp]?.calificacion;
            const esActivo = tabActivo === temp;
            return (
              <button
                key={`tab-temp-${temp}`}
                type="button"
                onClick={() => setTabActivo(temp)}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition flex items-center gap-1 shrink-0 cursor-pointer ${
                  esActivo
                    ? 'bg-rose-600 text-white shadow-md'
                    : 'bg-neutral-200/70 dark:bg-white/5 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-300'
                }`}
              >
                <span>T{temp}</span>
                {califTemp && (
                  <span className="text-[10px] px-1 py-0.2 rounded bg-black/20 text-amber-300 font-mono">
                    ★ {Number(califTemp).toFixed(1)}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Nota explicativa de formato si la serie tiene discrepancias */}
        {notaEspecial && (
          <div className="mx-4 sm:mx-5 mt-3 p-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 text-xs flex items-start gap-2 animate-fadeIn">
            <span className="text-sm shrink-0">ℹ️</span>
            <div className="leading-snug">
              <span className="font-bold mr-1">Nota de formato:</span>
              <span>{typeof notaEspecial === 'string' ? notaEspecial : notaEspecial.nota}</span>
            </div>
          </div>
        )}

        {/* Cuerpo del formulario */}
        <div className="p-4 sm:p-6 space-y-4 overflow-y-auto max-h-[60vh] scrollbar-thin">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-neutral-500">
              {tabActivo === 'serie' ? 'Calificación Global de la Serie' : `Calificación de la Temporada ${tabActivo}`}
            </span>
            {tieneCalificacionGuardada && (
              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                ✓ Ya calificada
              </span>
            )}
          </div>

          {/* Calificador de Estrellas interactivo */}
          <CalificadorEstrellas 
            valor={calificacionActual} 
            onChange={setCalificacionActual} 
          />

          {/* Campo de Reseña / Veredicto */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-neutral-600 dark:text-neutral-400">
              Tu reseña u opinión {tabActivo === 'serie' ? 'de la serie completa' : `de la temporada ${tabActivo}`} <span className="font-normal opacity-70">(Opcional)</span>
            </label>
            <textarea
              rows={3}
              value={reseniaActual}
              onChange={(e) => setReseniaActual(e.target.value)}
              placeholder={
                tabActivo === 'serie' 
                  ? '¿Qué te pareció la serie en su totalidad? ¿El final cumplió? Comparte tu veredicto...' 
                  : `¿Qué te pareció la temporada ${tabActivo}? ¿Sus mejores capítulos o momentos?`
              }
              className="w-full p-3 rounded-2xl bg-white dark:bg-white/5 border border-neutral-300 dark:border-white/10 text-xs sm:text-sm focus:outline-none focus:border-rose-500 resize-none transition"
            />
          </div>

          {error && (
            <p className="text-xs font-bold text-rose-500 text-center animate-fadeIn">
              {error}
            </p>
          )}
        </div>

        {/* Botones de acción inferiores */}
        <div className="p-4 sm:p-5 border-t border-neutral-200 dark:border-white/10 bg-neutral-100/50 dark:bg-white/[0.02] flex items-center justify-between gap-3">
          {tieneCalificacionGuardada ? (
            <button
              type="button"
              disabled={guardando}
              onClick={handleBorrar}
              className="p-2.5 rounded-xl text-neutral-500 hover:text-rose-500 hover:bg-rose-500/10 transition cursor-pointer flex items-center gap-1.5 text-xs font-bold"
              title="Borrar calificación"
            >
              <Trash2 className="w-4 h-4" />
              <span className="hidden sm:inline">Quitar nota</span>
            </button>
          ) : <div />}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-white/10 transition cursor-pointer"
            >
              Cancelar
            </button>

            <button
              type="button"
              disabled={guardando || calificacionActual === 0}
              onClick={handleGuardar}
              className="px-5 py-2.5 rounded-xl text-xs font-black bg-rose-600 hover:bg-rose-500 text-white shadow-lg transition active:scale-95 disabled:opacity-40 cursor-pointer flex items-center gap-1.5"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>{guardando ? 'Guardando...' : 'Guardar Calificación'}</span>
            </button>
          </div>
        </div>

      </div>
    </div>,
    document.body
  );
}
