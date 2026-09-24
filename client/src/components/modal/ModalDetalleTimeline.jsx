import React, { useState, useEffect } from 'react';
import { 
  guardarReseniaAPI, 
  obtenerDetalleEpisodioAPI,
  actualizarPlataformaSerieAPI 
} from '../../api';
import CalificadorEstrellas from '../common/CalificadorEstrellas';

const PLATAFORMAS_DISPONIBLES = [
  'Netflix',
  'Max',
  'Disney+',
  'Prime Video',
  'Apple TV+',
  'Cine',
  'Paramount+',
  'Mubi',
  'Crunchyroll'
];

export default function ModalDetalleTimeline({ item, onClose, onActualizado }) {
  const visualizacionId = item.visualizacion_id || item.id;
  const esSerie = item.tipo?.toLowerCase() === 'serie';
  const obraIdReal = item.obra_id;

  const [calificacion, setCalificacion] = useState(item.calificacion ? Number(item.calificacion) : 0);
  const [resenia, setResenia] = useState(item.resenia || '');
  
  // Plataforma actual del registro
  const [plataforma, setPlataforma] = useState(item.plataforma || '');
  
  // Alcance de la plataforma: 'solo_este' | 'solo_sin_plataforma' | 'toda_la_serie'
  const [alcancePlataforma, setAlcancePlataforma] = useState('solo_este');

  const [guardando, setGuardando] = useState(false);
  const [detalle, setDetalle] = useState(null);
  const [cargandoDetalle, setCargandoDetalle] = useState(false);
  const [mostrarActores, setMostrarActores] = useState(false);

  useEffect(() => {
    if (!esSerie) return;
    const tmdbId = item.tmdb_id || item.obra_tmdb_id;
    if (!tmdbId || !item.temporada || !item.episodio) return;

    const cargar = async () => {
      setCargandoDetalle(true);
      try {
        const data = await obtenerDetalleEpisodioAPI(tmdbId, item.temporada, item.episodio);
        setDetalle(data);
      } catch (err) {
        console.warn('Detalle de capítulo no disponible:', err.message);
      } finally {
        setCargandoDetalle(false);
      }
    };
    cargar();
  }, [item, esSerie]);

  const handleGuardar = async () => {
    if (!visualizacionId) {
      alert('Error: No se encontró el identificador del registro.');
      return;
    }
    setGuardando(true);
    try {
      // 1. Siempre guarda calificación, reseña y plataforma del capítulo actual
      await guardarReseniaAPI(visualizacionId, {
        calificacion: calificacion > 0 ? Number(calificacion) : null,
        resenia: resenia.trim() || null,
        plataforma: plataforma || null,
      });

      // 2. Si es serie, tiene plataforma válida y se eligió propagar
      if (esSerie && obraIdReal && plataforma && plataforma !== 'Sin plataforma' && alcancePlataforma !== 'solo_este') {
        try {
          await actualizarPlataformaSerieAPI({
            obra_id: obraIdReal,
            plataforma: plataforma,
            solo_vacios: alcancePlataforma === 'solo_sin_plataforma',
          });
        } catch (errPlat) {
          console.warn('Error al actualizar masivamente:', errPlat.message);
        }
      }

      onActualizado();
      onClose();
    } catch (err) {
      alert(err.message || 'Error al guardar los cambios');
    } finally {
      setGuardando(false);
    }
  };

  const fotoCabecera = detalle?.still_path || item.foto_episodio || item.poster_path;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-[#fcfaf7] dark:bg-[#141418] border border-neutral-300 dark:border-white/10 rounded-3xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-neutral-900 dark:text-white my-auto animate-fadeIn">
        
        {/* Banner con foto del capítulo o película */}
        <div className="relative w-full h-52 bg-neutral-900 flex-shrink-0">
          {fotoCabecera ? (
            <img src={fotoCabecera} alt={item.titulo} className="w-full h-full object-cover opacity-85" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-neutral-500">Sin foto</div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#fcfaf7] dark:from-[#141418] via-black/30 to-transparent flex justify-between items-start p-5">
            <span className="bg-rose-600 text-white font-black text-xs px-2.5 py-1 rounded-lg uppercase tracking-wider shadow">
              {item.tipo} {item.temporada ? `· T${item.temporada} E${item.episodio}` : ''}
            </span>
            <button 
              type="button"
              onClick={onClose} 
              className="w-8 h-8 rounded-full bg-black/60 hover:bg-rose-600 text-white flex items-center justify-center transition cursor-pointer"
            >
              ✕
            </button>
          </div>
          <div className="absolute bottom-3 left-6 right-6">
            <h2 className="text-2xl font-black text-neutral-900 dark:text-white drop-shadow-md truncate">{item.titulo}</h2>
            {detalle?.nombre && (
              <p className="text-sm font-bold text-rose-600 dark:text-rose-400 truncate">Capítulo {item.episodio}: {detalle.nombre}</p>
            )}
          </div>
        </div>

        {/* Cuerpo */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 scrollbar-thin">
          
          {/* Selector de Plataforma */}
          <div className="space-y-3 border border-neutral-300 dark:border-white/10 rounded-2xl p-4 bg-neutral-100/60 dark:bg-white/5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                Plataforma de visualización
              </label>
              {plataforma && (
                <button
                  type="button"
                  onClick={() => {
                    setPlataforma('');
                    setAlcancePlataforma('solo_este');
                  }}
                  className="text-[11px] font-bold text-neutral-500 hover:text-rose-500 cursor-pointer"
                >
                  Quitar plataforma
                </button>
              )}
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              {PLATAFORMAS_DISPONIBLES.map((plat) => {
                const seleccionada = plataforma === plat;
                return (
                  <button
                    key={plat}
                    type="button"
                    onClick={() => setPlataforma(plat)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer border ${
                      seleccionada
                        ? 'bg-rose-600 border-rose-600 text-white shadow-md scale-105'
                        : 'bg-white dark:bg-neutral-800 border-neutral-300 dark:border-white/10 text-neutral-700 dark:text-neutral-300 hover:border-rose-500/50'
                    }`}
                  >
                    {plat}
                  </button>
                );
              })}
            </div>

            {/* Opciones de alcance para series */}
            {esSerie && plataforma && plataforma !== 'Sin plataforma' && (
              <div className="pt-3 border-t border-neutral-200 dark:border-white/10 space-y-2">
                <p className="text-[11px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                  ¿A qué episodios aplicar "{plataforma}"?
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {/* Opción 1: Solo este capítulo */}
                  <label 
                    onClick={() => setAlcancePlataforma('solo_este')}
                    className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs cursor-pointer select-none transition ${
                      alcancePlataforma === 'solo_este'
                        ? 'bg-rose-500/10 border-rose-500 text-rose-600 dark:text-rose-400 font-black'
                        : 'bg-white dark:bg-neutral-800 border-neutral-300 dark:border-white/10 text-neutral-700 dark:text-neutral-300 hover:border-neutral-400'
                    }`}
                  >
                    <input
                      type="radio"
                      name="alcancePlat"
                      checked={alcancePlataforma === 'solo_este'}
                      onChange={() => setAlcancePlataforma('solo_este')}
                      className="accent-rose-600"
                    />
                    <span>Solo este capítulo</span>
                  </label>

                  {/* Opción 2: Solo los que no tienen plataforma */}
                  <label 
                    onClick={() => setAlcancePlataforma('solo_sin_plataforma')}
                    className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs cursor-pointer select-none transition ${
                      alcancePlataforma === 'solo_sin_plataforma'
                        ? 'bg-rose-500/10 border-rose-500 text-rose-600 dark:text-rose-400 font-black'
                        : 'bg-white dark:bg-neutral-800 border-neutral-300 dark:border-white/10 text-neutral-700 dark:text-neutral-300 hover:border-neutral-400'
                    }`}
                  >
                    <input
                      type="radio"
                      name="alcancePlat"
                      checked={alcancePlataforma === 'solo_sin_plataforma'}
                      onChange={() => setAlcancePlataforma('solo_sin_plataforma')}
                      className="accent-rose-600"
                    />
                    <span>Solo sin plataforma</span>
                  </label>

                  {/* Opción 3: Toda la serie */}
                  <label 
                    onClick={() => setAlcancePlataforma('toda_la_serie')}
                    className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs cursor-pointer select-none transition ${
                      alcancePlataforma === 'toda_la_serie'
                        ? 'bg-amber-500/10 border-amber-500 text-amber-600 dark:text-amber-400 font-black'
                        : 'bg-white dark:bg-neutral-800 border-neutral-300 dark:border-white/10 text-neutral-700 dark:text-neutral-300 hover:border-neutral-400'
                    }`}
                  >
                    <input
                      type="radio"
                      name="alcancePlat"
                      checked={alcancePlataforma === 'toda_la_serie'}
                      onChange={() => setAlcancePlataforma('toda_la_serie')}
                      className="accent-amber-600"
                    />
                    <span>Toda la serie</span>
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* Sinopsis */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Sinopsis</label>
            <p className="text-xs leading-relaxed text-neutral-700 dark:text-neutral-300">
              {cargandoDetalle ? 'Cargando información oficial...' : (detalle?.sinopsis || item.sinopsis || 'Sin descripción disponible.')}
            </p>
          </div>

          {/* Reparto de actores */}
          {detalle?.actores?.length > 0 && (
            <div className="border border-neutral-300 dark:border-white/10 rounded-2xl p-4 bg-neutral-100/60 dark:bg-white/5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold flex items-center gap-2">
                  <span>🎭</span> Elenco del capítulo ({detalle.actores.length})
                </span>
                <button
                  type="button"
                  onClick={() => setMostrarActores(!mostrarActores)}
                  className="text-xs font-bold text-rose-600 dark:text-rose-400 hover:underline cursor-pointer"
                >
                  {mostrarActores ? 'Ocultar' : 'Ver actores'}
                </button>
              </div>

              {mostrarActores && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 pt-3">
                  {detalle.actores.map((actor, idx) => (
                    <div key={`${actor.id}-${idx}`}
                      className="bg-white dark:bg-neutral-900/90 rounded-2xl overflow-hidden border border-neutral-200 dark:border-white/10 shadow-sm flex flex-col"
                    >
                      <div className="w-full aspect-[2/3] bg-neutral-800 overflow-hidden relative">
                        {actor.foto ? (
                          <img 
                            src={actor.foto} 
                            alt={actor.nombre} 
                            className="w-full h-full object-cover" 
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center text-neutral-500 text-xs gap-1">
                            <span className="text-2xl">🎭</span>
                            <span>Sin foto</span>
                          </div>
                        )}
                      </div>
                      <div className="p-3 flex flex-col justify-between flex-1">
                        <p className="text-xs font-black truncate text-neutral-900 dark:text-white" title={actor.nombre}>
                          {actor.nombre}
                        </p>
                        <p className="text-[11px] text-rose-600 dark:text-rose-400 font-bold truncate mt-0.5" title={actor.personaje}>
                          {actor.personaje}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Calificador modular de estrellas */}
          <CalificadorEstrellas 
            valor={calificacion} 
            onChange={setCalificacion} 
          />

          {/* Reseña */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Reseña o Diario Personal</label>
            <textarea
              rows="3"
              value={resenia}
              onChange={(e) => setResenia(e.target.value)}
              placeholder="¿Qué te pareció este capítulo? Escribe tus notas..."
              className="w-full bg-white dark:bg-[#1c1c22] border border-neutral-300 dark:border-white/10 rounded-2xl p-3 text-xs focus:outline-none focus:border-rose-500 resize-none"
            />
          </div>
        </div>

        {/* Pie */}
        <div className="p-4 border-t border-neutral-200 dark:border-white/10 flex justify-end gap-3 bg-neutral-50 dark:bg-[#101014]">
          <button 
            type="button" 
            onClick={onClose} 
            className="px-4 py-2 rounded-xl border border-neutral-300 dark:border-white/10 text-xs font-bold hover:bg-neutral-200 dark:hover:bg-white/5 transition cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={guardando}
            onClick={handleGuardar}
            className="px-6 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-xs font-bold text-white shadow-lg transition cursor-pointer disabled:opacity-50"
          >
            {guardando ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </div>

      </div>
    </div>
  );
}