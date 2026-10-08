import React, { useState, useMemo, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  Film, 
  Star, 
  Search, 
  X, 
  ChevronLeft, 
  ChevronRight, 
  SlidersHorizontal, 
  ArrowUpDown, 
  MessageSquare, 
  Sparkles,
  Calendar,
  Tv,
  Users,
  Edit3,
  Award,
  Trash2,
  Loader2
} from 'lucide-react';
import { formatearFecha } from '../../utils/fechas';
import ModalCalificarSerie from '../modal/ModalCalificarSerie';
import { eliminarReseniaAPI } from '../../api';

export default function PestanaResenias({ 
  resenias = [], 
  esMiPerfil = false, 
  onAbrirDetalle,
  onActualizado,
  dispararToast
}) {
  const contenedorRef = useRef(null);

  // Estados de filtrado y búsqueda
  const [busqueda, setBusqueda] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('todas'); // 'todas' | 'peliculas' | 'series_completas' | 'temporadas' | 'capitulos'
  const [filtroTipo, setFiltroTipo] = useState('todos'); // 'todos' | 'con_texto' | 'solo_estrellas'
  const [filtroEstrellas, setFiltroEstrellas] = useState('todas'); // 'todas' | '5' | '4' | '3' | '2' | '1'
  const [orden, setOrden] = useState('recientes'); // 'recientes' | 'antiguas' | 'mayor_nota' | 'menor_nota' | 'alfabetico'
  const [itemCalificarSerie, setItemCalificarSerie] = useState(null);
  const [itemAEliminar, setItemAEliminar] = useState(null);
  const [eliminando, setEliminando] = useState(false);

  // Paginación
  const [pagina, setPagina] = useState(1);
  const porPagina = 8; // 8 reseñas por página para una navegación ágil y sin scroll eterno

  // Contadores para chips
  const totalConTexto = useMemo(() => {
    return resenias.filter((r) => r.resenia && r.resenia.trim() !== '').length;
  }, [resenias]);

  const totalSoloEstrellas = useMemo(() => {
    return resenias.filter((r) => (!r.resenia || r.resenia.trim() === '') && Number(r.calificacion) > 0).length;
  }, [resenias]);

  const totalPeliculas = useMemo(() => {
    return resenias.filter((r) => r.tipo_categoria === 'pelicula' || (r.tipo === 'pelicula' && !r.es_temporada && !r.es_serie_completa)).length;
  }, [resenias]);

  const totalSeriesCompletas = useMemo(() => {
    return resenias.filter((r) => r.tipo_categoria === 'serie_completa' || r.es_serie_completa).length;
  }, [resenias]);

  const totalTemporadas = useMemo(() => {
    return resenias.filter((r) => r.tipo_categoria === 'temporada' || r.es_temporada).length;
  }, [resenias]);

  const totalCapitulos = useMemo(() => {
    return resenias.filter((r) => r.tipo_categoria === 'capitulo' || (r.tipo === 'serie' && r.episodio && !r.es_temporada && !r.es_serie_completa)).length;
  }, [resenias]);

  // Filtrado y ordenación
  const reseniasFiltradas = useMemo(() => {
    return resenias
      .filter((item) => {
        // Búsqueda por título o por el texto de la reseña
        if (busqueda.trim()) {
          const q = busqueda.toLowerCase().trim();
          const matchTitulo = item.titulo?.toLowerCase().includes(q);
          const matchResenia = item.resenia?.toLowerCase().includes(q);
          if (!matchTitulo && !matchResenia) return false;
        }

        // Filtro por categoría de obra
        if (filtroCategoria !== 'todas') {
          if (filtroCategoria === 'peliculas') {
            const esPeli = item.tipo_categoria === 'pelicula' || (item.tipo === 'pelicula' && !item.es_temporada && !item.es_serie_completa);
            if (!esPeli) return false;
          } else if (filtroCategoria === 'series_completas') {
            const esSerieComp = item.tipo_categoria === 'serie_completa' || item.es_serie_completa;
            if (!esSerieComp) return false;
          } else if (filtroCategoria === 'temporadas') {
            const esTemp = item.tipo_categoria === 'temporada' || item.es_temporada;
            if (!esTemp) return false;
          } else if (filtroCategoria === 'capitulos') {
            const esCap = item.tipo_categoria === 'capitulo' || (item.tipo === 'serie' && item.episodio && !item.es_temporada && !item.es_serie_completa);
            if (!esCap) return false;
          }
        }

        // Filtro por tipo de reseña
        if (filtroTipo === 'con_texto') {
          if (!item.resenia || item.resenia.trim() === '') return false;
        } else if (filtroTipo === 'solo_estrellas') {
          if (item.resenia && item.resenia.trim() !== '') return false;
        }

        // Filtro por cantidad de estrellas
        if (filtroEstrellas !== 'todas') {
          const califNum = Number(item.calificacion);
          if (califNum !== Number(filtroEstrellas)) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (orden === 'recientes') {
          return new Date(b.fecha_visto || 0) - new Date(a.fecha_visto || 0);
        }
        if (orden === 'antiguas') {
          return new Date(a.fecha_visto || 0) - new Date(b.fecha_visto || 0);
        }
        if (orden === 'mayor_nota') {
          return (Number(b.calificacion) || 0) - (Number(a.calificacion) || 0);
        }
        if (orden === 'menor_nota') {
          return (Number(a.calificacion) || 0) - (Number(b.calificacion) || 0);
        }
        if (orden === 'alfabetico') {
          return (a.titulo || '').localeCompare(b.titulo || '');
        }
        return 0;
      });
  }, [resenias, busqueda, filtroCategoria, filtroTipo, filtroEstrellas, orden]);

  // Al cambiar filtros o búsqueda, volver a la página 1
  useEffect(() => {
    setPagina(1);
  }, [busqueda, filtroCategoria, filtroTipo, filtroEstrellas, orden]);

  // Cálculos de paginación

  const totalPaginas = Math.max(1, Math.ceil(reseniasFiltradas.length / porPagina));
  const indiceInicio = (pagina - 1) * porPagina;
  const itemsPagina = reseniasFiltradas.slice(indiceInicio, indiceInicio + porPagina);

  const cambiarPagina = (nuevaPagina) => {
    if (nuevaPagina >= 1 && nuevaPagina <= totalPaginas) {
      setPagina(nuevaPagina);
      if (contenedorRef.current) {
        contenedorRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  // Generador de números de página con elipsis
  const generarRangoPaginas = () => {
    if (totalPaginas <= 7) {
      return Array.from({ length: totalPaginas }, (_, i) => i + 1);
    }
    if (pagina <= 4) {
      return [1, 2, 3, 4, 5, '...', totalPaginas];
    }
    if (pagina >= totalPaginas - 3) {
      return [1, '...', totalPaginas - 4, totalPaginas - 3, totalPaginas - 2, totalPaginas - 1, totalPaginas];
    }
    return [1, '...', pagina - 1, pagina, pagina + 1, '...', totalPaginas];
  };

  const handleConfirmarEliminarResenia = async () => {
    if (!itemAEliminar) return;
    setEliminando(true);
    try {
      await eliminarReseniaAPI(itemAEliminar);
      if (dispararToast) {
        dispararToast({
          tipo: 'exito',
          mensaje: 'Reseña eliminada correctamente. La obra sigue guardada en tu historial.'
        });
      }
      setItemAEliminar(null);
      if (onActualizado) {
        await onActualizado();
      }
    } catch (error) {
      console.error('Error al eliminar reseña:', error);
      if (dispararToast) {
        dispararToast({
          tipo: 'error',
          mensaje: error?.message || 'Error al eliminar la reseña'
        });
      }
    } finally {
      setEliminando(false);
    }
  };

  // Estado vacío inicial (sin ninguna reseña en el diario)
  if (resenias.length === 0) {
    return (
      <div className="p-16 text-center rounded-3xl border border-dashed border-zinc-800 bg-zinc-950/40 space-y-3 animate-fadeIn">
        <div className="w-12 h-12 mx-auto rounded-2xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center text-amber-400">
          <Star className="w-6 h-6" />
        </div>
        <p className="text-base font-bold text-zinc-200">Aún no has registrado ninguna reseña o calificación.</p>
        <p className="text-xs text-zinc-500 max-w-md mx-auto leading-relaxed">
          Al registrar una película o serie y asignarle estrellas o escribir tu opinión, aparecerá automáticamente aquí en tu diario cinéfilo.
        </p>
      </div>
    );
  }

  return (
    <div ref={contenedorRef} className="space-y-5 animate-fadeIn">
      {/* 1. BARRA SUPERIOR DE BÚSQUEDA Y ORDENACIÓN */}
      <div className="bg-[#12121a] border border-white/5 rounded-2xl p-4 space-y-3 shadow-md">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          {/* Input de Búsqueda */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por título de película o serie..."
              className="w-full bg-[#181824] border border-white/10 rounded-xl pl-9 pr-9 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-rose-500 transition"
            />
            {busqueda && (
              <button
                type="button"
                onClick={() => setBusqueda('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white transition"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Selector de Orden */}
          <div className="flex items-center gap-2 shrink-0">
            <ArrowUpDown className="w-3.5 h-3.5 text-zinc-400 hidden sm:block" />
            <select
              value={orden}
              onChange={(e) => setOrden(e.target.value)}
              className="bg-[#181824] border border-white/10 rounded-xl px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-rose-500 transition cursor-pointer"
            >
              <option value="recientes">Más recientes primero</option>
              <option value="antiguas">Más antiguas primero</option>
              <option value="mayor_nota">Mayor calificación (5 a 1)</option>
              <option value="menor_nota">Menor calificación (1 a 5)</option>
              <option value="alfabetico">Título (A - Z)</option>
            </select>
          </div>
        </div>

        {/* TIRA DE CATEGORÍAS */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin select-none pt-1">
          <button
            type="button"
            onClick={() => setFiltroCategoria('todas')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 cursor-pointer ${
              filtroCategoria === 'todas'
                ? 'bg-rose-600 text-white shadow-xs font-black'
                : 'bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800 border border-white/5'
            }`}
          >
            Todas ({resenias.length})
          </button>

          <button
            type="button"
            onClick={() => setFiltroCategoria('peliculas')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 cursor-pointer flex items-center gap-1.5 ${
              filtroCategoria === 'peliculas'
                ? 'bg-rose-600 text-white shadow-xs font-black'
                : 'bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800 border border-white/5'
            }`}
          >
            <Film className="w-3.5 h-3.5 text-rose-400" />
            <span>Películas ({totalPeliculas})</span>
          </button>

          <button
            type="button"
            onClick={() => setFiltroCategoria('series_completas')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 cursor-pointer flex items-center gap-1.5 ${
              filtroCategoria === 'series_completas'
                ? 'bg-rose-600 text-white shadow-xs font-black'
                : 'bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800 border border-white/5'
            }`}
          >
            <Award className="w-3.5 h-3.5 text-amber-400" />
            <span>Series Completas ({totalSeriesCompletas})</span>
          </button>

          <button
            type="button"
            onClick={() => setFiltroCategoria('temporadas')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 cursor-pointer flex items-center gap-1.5 ${
              filtroCategoria === 'temporadas'
                ? 'bg-rose-600 text-white shadow-xs font-black'
                : 'bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800 border border-white/5'
            }`}
          >
            <Star className="w-3.5 h-3.5 text-amber-400" />
            <span>Temporadas ({totalTemporadas})</span>
          </button>

          <button
            type="button"
            onClick={() => setFiltroCategoria('capitulos')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 cursor-pointer flex items-center gap-1.5 ${
              filtroCategoria === 'capitulos'
                ? 'bg-rose-600 text-white shadow-xs font-black'
                : 'bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800 border border-white/5'
            }`}
          >
            <Tv className="w-3.5 h-3.5 text-rose-400" />
            <span>Capítulos ({totalCapitulos})</span>
          </button>
        </div>

        {/* 2. CHIPS DE FILTRO POR TIPO Y ESTRELLAS */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-white/5">
          {/* Filtros de Tipo */}
          <div className="flex flex-wrap items-center gap-1.5">

            <button
              type="button"
              onClick={() => setFiltroTipo('todos')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                filtroTipo === 'todos'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800 border border-white/5'
              }`}
            >
              Todas ({resenias.length})
            </button>

            <button
              type="button"
              onClick={() => setFiltroTipo('con_texto')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                filtroTipo === 'con_texto'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800 border border-white/5'
              }`}
            >
              <MessageSquare className="w-3 h-3 text-rose-400" />
              <span>Con reseña escrita ({totalConTexto})</span>
            </button>

            <button
              type="button"
              onClick={() => setFiltroTipo('solo_estrellas')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                filtroTipo === 'solo_estrellas'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800 border border-white/5'
              }`}
            >
              <Star className="w-3 h-3 text-amber-400" />
              <span>Solo calificación ({totalSoloEstrellas})</span>
            </button>
          </div>

          {/* Filtro por Estrellas */}
          <div className="flex items-center gap-1">
            <span className="text-[11px] font-mono text-zinc-500 mr-1 hidden md:inline">Nota:</span>
            {['todas', '5', '4', '3', '2', '1'].map((est) => (
              <button
                key={est}
                type="button"
                onClick={() => setFiltroEstrellas(est)}
                className={`px-2 py-0.5 rounded-md text-[11px] font-bold transition cursor-pointer ${
                  filtroEstrellas === est
                    ? 'bg-amber-400/20 text-amber-400 border border-amber-400/40'
                    : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900'
                }`}
              >
                {est === 'todas' ? '★ Todas' : `${est}★`}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 3. RESUMEN DE RESULTADOS */}
      <div className="flex items-center justify-between text-xs text-zinc-400 px-1">
        <span>
          Mostrando <strong className="text-white font-bold">{reseniasFiltradas.length > 0 ? indiceInicio + 1 : 0}</strong>–
          <strong className="text-white font-bold">{Math.min(indiceInicio + porPagina, reseniasFiltradas.length)}</strong> de{' '}
          <strong className="text-white font-bold">{reseniasFiltradas.length}</strong> {reseniasFiltradas.length === 1 ? 'reseña' : 'reseñas'}
        </span>
        {totalPaginas > 1 && (
          <span className="font-mono text-[11px] text-zinc-500">
            Página {pagina} de {totalPaginas}
          </span>
        )}
      </div>

      {/* 4. LISTADO DE RESEÑAS / CALIFICACIONES PAGINADO */}
      {itemsPagina.length === 0 ? (
        <div className="p-12 text-center rounded-3xl border border-dashed border-zinc-800 bg-zinc-950/40 space-y-3">
          <p className="text-sm font-bold text-zinc-300">No encontramos reseñas con los filtros seleccionados.</p>
          <button
            type="button"
            onClick={() => {
              setBusqueda('');
              setFiltroTipo('todos');
              setFiltroEstrellas('todas');
            }}
            className="px-4 py-1.5 rounded-xl text-xs font-bold text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 transition cursor-pointer"
          >
            Restablecer todos los filtros
          </button>
        </div>
      ) : (
        <div className="space-y-3.5">
          {itemsPagina.map((item) => {
            const calif = Number(item.calificacion);
            const tieneCalif = !isNaN(calif) && calif > 0;
            const tieneTexto = Boolean(item.resenia && item.resenia.trim() !== '');
            const fechaFormateada = item.fecha_visto ? formatearFecha(item.fecha_visto) : 'Reciente';

            return (
              <div 
                key={item.visualizacion_id || item.id} 
                onClick={() => {
                  if (!esMiPerfil) return;
                  if (item.es_serie_completa || item.es_temporada || item.tipo_categoria === 'serie_completa' || item.tipo_categoria === 'temporada') {
                    setItemCalificarSerie(item);
                  } else {
                    onAbrirDetalle?.(item);
                  }
                }}
                className={`bg-[#13131c] border border-white/5 rounded-3xl p-4 sm:p-5 flex flex-col sm:flex-row gap-4 sm:gap-5 relative transition shadow-lg group ${
                  esMiPerfil ? 'hover:border-white/20 hover:bg-[#161622] cursor-pointer' : 'hover:border-white/10'
                }`}
                title={esMiPerfil ? "Haz clic para editar la calificación o reseña" : undefined}
              >
                {/* Póster a la izquierda */}
                <div className="w-16 h-24 sm:w-20 sm:h-28 rounded-2xl overflow-hidden bg-[#181824] border border-white/10 shrink-0 flex items-center justify-center shadow-md self-start">
                  {item.poster_path ? (
                    <img
                      src={item.poster_path}
                      alt={item.titulo}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center p-2 text-center text-zinc-600">
                      <Film className="w-5 h-5 mb-1 text-rose-500" />
                      <span className="text-[9px] font-mono leading-tight">{item.titulo}</span>
                    </div>
                  )}
                </div>

                {/* Cuerpo de la reseña */}
                <div className="flex-1 flex flex-col justify-between space-y-2.5 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="text-base sm:text-lg font-bold text-white tracking-tight truncate group-hover:text-rose-400 transition">
                          {item.titulo}
                        </h4>
                        <span className="text-zinc-500 font-normal text-xs font-mono">
                          ({item.anio || (item.fecha_visto ? item.fecha_visto.split('-')[0] : '')})
                        </span>
                      </div>

                      {/* Distintivo de categoría */}
                      {(item.es_serie_completa || item.tipo_categoria === 'serie_completa') ? (
                        <span className="inline-flex items-center gap-1.5 mt-1 text-[10px] font-mono font-black px-2.5 py-0.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          <Award className="w-3 h-3 text-amber-400" />
                          <span>🏆 SERIE COMPLETA</span>
                        </span>
                      ) : (item.es_temporada || item.tipo_categoria === 'temporada') ? (
                        <span className="inline-flex items-center gap-1.5 mt-1 text-[10px] font-mono font-black px-2.5 py-0.5 rounded-lg bg-rose-500/20 text-rose-300 border border-rose-500/30">
                          <Tv className="w-3 h-3 text-rose-400" />
                          <span>⭐ TEMPORADA {item.temporada}</span>
                        </span>
                      ) : (item.episodio) ? (
                        <span className="inline-flex items-center gap-1 mt-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-zinc-800/80 text-zinc-300 border border-white/5">
                          <Tv className="w-2.5 h-2.5 text-rose-400" />
                          <span>T{item.temporada} : E{item.episodio}</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 mt-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-zinc-800/80 text-zinc-300 border border-white/5">
                          <Film className="w-2.5 h-2.5 text-rose-400" />
                          <span>Película</span>
                        </span>
                      )}
                    </div>


                    {/* Medalla de Nota Dorada y Botón Eliminar Reseña */}
                    <div className="flex items-center gap-2 shrink-0">
                      {tieneCalif && (
                        <div className="bg-amber-400/10 border border-amber-400/30 text-amber-400 font-black px-3 py-1 rounded-xl text-xs sm:text-sm flex items-center gap-1.5 shadow-sm shrink-0">
                          <span className="text-amber-400">★</span>
                          <span>{calif}</span>
                        </div>
                      )}

                      {esMiPerfil && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setItemAEliminar(item);
                          }}
                          className="p-1.5 sm:p-2 rounded-xl text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition cursor-pointer"
                          title="Eliminar reseña"
                        >
                          <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2]" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Opinión escrita o bloque de estrellas visual */}
                  {tieneTexto ? (
                    <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed font-normal italic bg-white/[0.02] p-3 rounded-2xl border border-white/5">
                      "{item.resenia}"
                    </p>
                  ) : (
                    <div className="flex flex-wrap items-center gap-2 py-1 bg-white/[0.015] px-3 py-2 rounded-2xl border border-white/5">
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((estrella) => (
                          <span
                            key={estrella}
                            className={`text-sm ${
                              estrella <= calif 
                                ? 'text-amber-400 drop-shadow-[0_0_4px_rgba(251,191,36,0.35)]' 
                                : 'text-zinc-700'
                            }`}
                          >
                            ★
                          </span>
                        ))}
                      </div>
                      <span className="text-xs text-zinc-400 font-medium">
                        Calificado con {calif} {calif === 1 ? 'estrella' : 'estrellas'} (sin reseña escrita)
                      </span>
                      {esMiPerfil && (
                        <span className="text-[11px] text-rose-400 font-bold flex items-center gap-1 group-hover:underline ml-auto">
                          <Edit3 className="w-3 h-3" />
                          <span>Escribir reseña</span>
                        </span>
                      )}
                    </div>
                  )}

                  {/* Metadatos inferiores */}
                  <div className="flex items-center justify-between pt-2 border-t border-white/5 flex-wrap gap-2 text-xs">
                    <div className="flex items-center gap-3 text-zinc-400 font-mono text-[11px]">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-zinc-500" />
                        <span>{fechaFormateada}</span>
                      </span>
                      {item.plataforma && (
                        <span className="px-2 py-0.5 rounded-md bg-zinc-800/60 text-zinc-300 border border-white/5 font-sans font-medium text-[10px]">
                          {item.plataforma}
                        </span>
                      )}
                    </div>

                    {/* Co-visualizaciones */}
                    {item.visto_con_texto && (
                      <div className="bg-pink-950/40 border border-pink-500/30 text-pink-300 text-[11px] px-3 py-0.5 rounded-full font-medium flex items-center gap-1.5 shadow-sm">
                        <span>🍿</span>
                        <span>Visto con {item.visto_con_texto}</span>
                      </div>
                    )}

                    {Array.isArray(item.amigos_covision) && item.amigos_covision.length > 0 && !item.visto_con_texto && (
                      <div className="flex items-center gap-1 bg-zinc-900 border border-white/10 px-2.5 py-0.5 rounded-full text-[11px] text-zinc-300">
                        <Users className="w-3 h-3 text-emerald-400" />
                        <span>Con {item.amigos_covision.map(a => a.nombre || a.username).join(', ')}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 5. CONTROLES DE PAGINACIÓN */}
      {totalPaginas > 1 && (
        <div className="pt-4 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-zinc-500">
            Página <strong className="text-white">{pagina}</strong> de <strong className="text-white">{totalPaginas}</strong>
          </p>

          <div className="flex items-center gap-1.5">
            {/* Botón Anterior */}
            <button
              type="button"
              disabled={pagina === 1}
              onClick={() => cambiarPagina(pagina - 1)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition border border-white/5 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Anterior</span>
            </button>

            {/* Números de página */}
            <div className="flex items-center gap-1">
              {generarRangoPaginas().map((item, idx) => {
                if (item === '...') {
                  return (
                    <span key={`dots-${idx}`} className="px-2 text-xs text-zinc-600 font-mono">
                      …
                    </span>
                  );
                }

                const num = Number(item);
                const esActiva = num === pagina;

                return (
                  <button
                    key={num}
                    type="button"
                    onClick={() => cambiarPagina(num)}
                    className={`w-8 h-8 rounded-xl text-xs font-bold transition cursor-pointer flex items-center justify-center ${
                      esActiva
                        ? 'bg-rose-600 text-white shadow-md'
                        : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-white/5'
                    }`}
                  >
                    {num}
                  </button>
                );
              })}
            </div>

            {/* Botón Siguiente */}
            <button
              type="button"
              disabled={pagina === totalPaginas}
              onClick={() => cambiarPagina(pagina + 1)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition border border-white/5 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white"
            >
              <span>Siguiente</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Modal para editar calificación de serie o temporada */}
      {itemCalificarSerie && (
        <ModalCalificarSerie
          obra={itemCalificarSerie}
          temporadaInicial={itemCalificarSerie.temporada}

          temporadasDisponibles={itemCalificarSerie.temporada ? [itemCalificarSerie.temporada] : []}
          onClose={() => setItemCalificarSerie(null)}
          onActualizado={() => {
            setItemCalificarSerie(null);
            if (onActualizado) onActualizado();
          }}
        />
      )}

      {/* Modal de confirmación para eliminar reseña (Sin alertas nativas de Windows/navegador) */}
      {itemAEliminar && createPortal(
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fadeIn"
          onClick={() => {
            if (!eliminando) setItemAEliminar(null);
          }}
        >
          <div 
            className="bg-[#121218] border border-white/10 rounded-3xl max-w-sm w-full p-6 shadow-2xl text-white space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Ícono de advertencia */}
            <div className="w-12 h-12 rounded-2xl bg-rose-600/10 text-rose-500 flex items-center justify-center mx-auto border border-rose-500/20 shadow-inner">
              <Trash2 className="w-6 h-6 stroke-[2]" />
            </div>

            {/* Textos */}
            <div className="text-center space-y-2">
              <h3 className="text-lg font-black tracking-tight text-white">¿Eliminar reseña?</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Se borrarán la calificación y tu comentario de <span className="font-bold text-white">"{itemAEliminar.titulo}"</span>.
                <br className="hidden sm:inline" />
                {' '}
                {itemAEliminar.es_serie_completa || itemAEliminar.tipo_categoria === 'serie_completa' || itemAEliminar.es_temporada || itemAEliminar.tipo_categoria === 'temporada'
                  ? 'Podrás volver a calificarla cuando quieras.'
                  : 'La obra seguirá guardada en tu historial de visualizaciones.'}
              </p>
            </div>

            {/* Acciones */}
            <div className="flex gap-3 pt-1">
              <button
                type="button"
                disabled={eliminando}
                onClick={() => setItemAEliminar(null)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-white/10 text-xs font-bold text-zinc-300 hover:bg-white/5 transition cursor-pointer disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={eliminando}
                onClick={handleConfirmarEliminarResenia}
                className="flex-1 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-95 text-xs font-bold text-white shadow-lg shadow-rose-600/20 transition cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {eliminando ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Eliminando...</span>
                  </>
                ) : (
                  'Eliminar'
                )}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}