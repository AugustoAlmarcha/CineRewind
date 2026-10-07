import React, { useMemo } from 'react';
import VistaSerieTotal from './VistaSerieTotal';
import VistaCatalogoTotal from './VistaCatalogoTotal';
import VistaSelectorCarpetas from './VistaSelectorCarpetas';
import VistaFeedMes from './VistaFeedMes';
import { calcularProgresoSerie, obtenerInfoSaga } from '../../utils/seriesProgreso';

export default function GrillaHistorial({
  vistaTotal = false,
  serieSeleccionadaTotal,
  setSerieSeleccionadaTotal,
  anioSeleccionado,
  mesSeleccionado,
  arbolHistorial,
  listaAnios,
  timelineCompleto = [],
  onSeleccionarAnio,
  onSeleccionarMes,
  modoSeleccion,
  seleccionadosParaBorrar = [],
  onToggleItem,
  onToggleCarpeta,
  onEliminarCarpetaDirecto,
  onEliminarSerieDirecto,
  onEliminarItemDirecto,
  onRecargarDatos,
  onAbrirRegistrar,
  onAbrirDetalleTimeline,
  busquedaHistorial = '',
  filtroTipo = '',
  // Props del filtro social
  soloConAmigos = false,
  amigosFiltro = [],
  ordenTotal = 'mas_vistos',
}) {

  // Helper para verificar si un registro cumple con el filtro de amigos o acompañantes
  const pasaFiltroAmigos = (item) => {
    if (!soloConAmigos) return true;

    const amigos = Array.isArray(item.amigos_covision) ? item.amigos_covision : [];
    const nombresManuales = item.visto_con_texto
      ? item.visto_con_texto.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean)
      : [];

    // Si no tiene amigos de la app ni acompañante manual, no pasa el filtro
    if (amigos.length === 0 && nombresManuales.length === 0) return false;

    // Si seleccionaste amigos o acompañantes puntuales del desplegable
    if (amigosFiltro && amigosFiltro.length > 0) {
      // 1. Coincide con amigos de la app (comparando ID)
      const coincideAmigoApp = amigos.some((a) =>
        amigosFiltro.some((filtroId) => String(filtroId) === String(a.amigo_id))
      );

      // 2. Coincide con acompañantes de texto manual (ej: "texto:lucas vecino" o "texto:mamá")
      const coincideManual = nombresManuales.some((nombre) =>
        amigosFiltro.some((filtro) => {
          if (typeof filtro === 'string' && filtro.startsWith('texto:')) {
            return filtro.slice(6).toLowerCase() === nombre;
          }
          return typeof filtro === 'string' && filtro.toLowerCase() === nombre;
        })
      );

      return coincideAmigoApp || coincideManual;
    }

    // Si está en "Con amigos" general (sin selección puntual), pasa cualquiera visto acompañado
    return true;
  };

  // 1. Catálogo unificado Total Histórico (con soporte para Series, Sagas y Películas)
  const obrasTotalesUnificadas = useMemo(() => {
    if (!vistaTotal) return [];
    const mapaObras = {};

    timelineCompleto.forEach((item) => {
      if (busquedaHistorial && !item.titulo?.toLowerCase().includes(busquedaHistorial.toLowerCase())) {
        return;
      }
      // Filtro social
      if (!pasaFiltroAmigos(item)) {
        return;
      }

      const esSerieItem = item.tipo?.toLowerCase() === 'serie';
      if (filtroTipo === 'serie' && !esSerieItem) return;
      if (filtroTipo === 'pelicula' && esSerieItem) return;

      if (esSerieItem) {
        const clave = `serie_${item.obra_id || item.tmdb_id || item.titulo}`;
        if (!mapaObras[clave]) {
          mapaObras[clave] = {
            id_agrupador: clave,
            obra_id: item.obra_id,
            tmdb_id: item.tmdb_id,
            titulo: item.titulo,
            tipo: 'serie',
            esSaga: false,
            poster_path: item.poster_serie || item.obra_poster || item.poster_path,
            plataforma: item.plataforma,
            total_temporadas: item.total_temporadas || null,
            total_episodios: item.total_episodios || null,
            estado_serie: item.estado_serie || null,
            seasons_info: item.seasons_info || null,
            registros: [],
          };
        } else {
          if (!mapaObras[clave].total_temporadas && item.total_temporadas) {
            mapaObras[clave].total_temporadas = item.total_temporadas;
          }
          if (!mapaObras[clave].total_episodios && item.total_episodios) {
            mapaObras[clave].total_episodios = item.total_episodios;
          }
          if (!mapaObras[clave].estado_serie && item.estado_serie) {
            mapaObras[clave].estado_serie = item.estado_serie;
          }
          if (!mapaObras[clave].seasons_info && item.seasons_info) {
            mapaObras[clave].seasons_info = item.seasons_info;
          }
        }
        mapaObras[clave].registros.push(item);
      } else {
        // Película individual o Saga
        const infoSaga = obtenerInfoSaga(item.titulo);
        const clave = infoSaga 
          ? `saga_${infoSaga.clave}`
          : `peli_${item.obra_id || item.tmdb_id || item.titulo}`;

        if (!mapaObras[clave]) {
          mapaObras[clave] = {
            id_agrupador: clave,
            obra_id: item.obra_id,
            titulo: infoSaga ? infoSaga.nombre : item.titulo,
            tipo: 'pelicula',
            esSaga: Boolean(infoSaga),
            poster_path: item.obra_poster || item.poster_path,
            plataforma: item.plataforma,
            registros: [],
          };
        }
        mapaObras[clave].registros.push(item);
      }
    });

    Object.values(mapaObras).forEach((obra) => {
      obra.registros.sort((a, b) => new Date(b.fecha_visto) - new Date(a.fecha_visto));
      if (obra.esSaga) {
        obra.peliculasDistintas = Array.from(new Set(obra.registros.map((r) => r.titulo)));
        if (obra.peliculasDistintas.length <= 1) {
          obra.esSaga = false;
          obra.titulo = obra.registros[0]?.titulo || obra.titulo;
        }
      }
      obra.estaCompletada = obra.tipo === 'serie'
        ? Boolean(calcularProgresoSerie(obra)?.estaCompletada)
        : true;
    });

    return Object.values(mapaObras).sort((a, b) => {
      if (ordenTotal === 'az') {
        return (a.titulo || '').localeCompare(b.titulo || '', 'es', { sensitivity: 'base' });
      }
      if (ordenTotal === 'za') {
        return (b.titulo || '').localeCompare(a.titulo || '', 'es', { sensitivity: 'base' });
      }
      if (ordenTotal === 'menos_vistos') {
        return a.registros.length - b.registros.length;
      }
      if (ordenTotal === 'recientes') {
        const fA = a.registros[0]?.fecha_visto ? new Date(a.registros[0].fecha_visto).getTime() : 0;
        const fB = b.registros[0]?.fecha_visto ? new Date(b.registros[0].fecha_visto).getTime() : 0;
        return fB - fA;
      }
      if (ordenTotal === 'antiguos') {
        const fA = a.registros[a.registros.length - 1]?.fecha_visto ? new Date(a.registros[a.registros.length - 1].fecha_visto).getTime() : 0;
        const fB = b.registros[b.registros.length - 1]?.fecha_visto ? new Date(b.registros[b.registros.length - 1].fecha_visto).getTime() : 0;
        return fA - fB;
      }
      if (ordenTotal === 'finalizadas') {
        if (a.estaCompletada !== b.estaCompletada) {
          return a.estaCompletada ? -1 : 1;
        }
        const fA = a.registros[0]?.fecha_visto ? new Date(a.registros[0].fecha_visto).getTime() : 0;
        const fB = b.registros[0]?.fecha_visto ? new Date(b.registros[0].fecha_visto).getTime() : 0;
        return fB - fA;
      }
      if (ordenTotal === 'no_finalizadas') {
        if (a.estaCompletada !== b.estaCompletada) {
          return !a.estaCompletada ? -1 : 1;
        }
        const fA = a.registros[0]?.fecha_visto ? new Date(a.registros[0].fecha_visto).getTime() : 0;
        const fB = b.registros[0]?.fecha_visto ? new Date(b.registros[0].fecha_visto).getTime() : 0;
        return fB - fA;
      }
      // 'mas_vistos' por defecto
      return b.registros.length - a.registros.length;
    });
  }, [vistaTotal, timelineCompleto, busquedaHistorial, filtroTipo, soloConAmigos, amigosFiltro, ordenTotal]);

  // 1.5. Sincronización en tiempo real de la obra abierta en Total Histórico
  const serieActualizada = useMemo(() => {
    if (!serieSeleccionadaTotal) return null;

    // Obtener los registros actualizados de esta serie o película directamente desde timelineCompleto
    const registrosActualizados = (timelineCompleto || []).filter((item) => {
      if (serieSeleccionadaTotal.esSaga) {
        const infoSaga = obtenerInfoSaga(item.titulo);
        return infoSaga && `saga_${infoSaga.clave}` === serieSeleccionadaTotal.id_agrupador;
      }

      const esSerieItem = item.tipo?.toLowerCase() === 'serie';
      const esSerieSeleccionada = serieSeleccionadaTotal.tipo?.toLowerCase() === 'serie';

      if (esSerieSeleccionada || esSerieItem) {
        const mismoTmdb = serieSeleccionadaTotal.tmdb_id && item.tmdb_id && Number(serieSeleccionadaTotal.tmdb_id) === Number(item.tmdb_id);
        const mismoObraId = serieSeleccionadaTotal.obra_id && item.obra_id && Number(serieSeleccionadaTotal.obra_id) === Number(item.obra_id);
        const mismoTitulo = serieSeleccionadaTotal.titulo && item.titulo && serieSeleccionadaTotal.titulo.toLowerCase().trim() === item.titulo.toLowerCase().trim();
        return Boolean(mismoTmdb || mismoObraId || mismoTitulo);
      }

      // Película individual
      const mismoTmdb = serieSeleccionadaTotal.tmdb_id && item.tmdb_id && Number(serieSeleccionadaTotal.tmdb_id) === Number(item.tmdb_id);
      const mismoObraId = serieSeleccionadaTotal.obra_id && item.obra_id && Number(serieSeleccionadaTotal.obra_id) === Number(item.obra_id);
      const mismoTitulo = serieSeleccionadaTotal.titulo && item.titulo && serieSeleccionadaTotal.titulo.toLowerCase().trim() === item.titulo.toLowerCase().trim();
      return Boolean(mismoTmdb || mismoObraId || mismoTitulo);
    });

    if (registrosActualizados.length > 0) {
      const regsOrdenados = [...registrosActualizados].sort((a, b) => new Date(b.fecha_visto) - new Date(a.fecha_visto));
      const primerReg = regsOrdenados[0];
      return {
        ...serieSeleccionadaTotal,
        poster_path: primerReg.poster_serie || primerReg.obra_poster || primerReg.poster_path || serieSeleccionadaTotal.poster_path,
        total_temporadas: primerReg.total_temporadas || serieSeleccionadaTotal.total_temporadas,
        total_episodios: primerReg.total_episodios || serieSeleccionadaTotal.total_episodios,
        estado_serie: primerReg.estado_serie || serieSeleccionadaTotal.estado_serie,
        seasons_info: primerReg.seasons_info || serieSeleccionadaTotal.seasons_info,
        registros: regsOrdenados,
      };
    }

    return serieSeleccionadaTotal;
  }, [serieSeleccionadaTotal, timelineCompleto]);

  // 2. Agrupación por días de una obra (serie, saga o película) en Total Histórico
  const gruposSerieTotalPorDia = useMemo(() => {
    const s = serieActualizada || serieSeleccionadaTotal;
    if (!s || !Array.isArray(s.registros)) return [];
    const mapa = {};
    s.registros.forEach((item) => {
      if (!pasaFiltroAmigos(item)) return;
      const fecha = item.fecha_visto ? item.fecha_visto.split('T')[0] : 'Sin Fecha';
      if (!mapa[fecha]) mapa[fecha] = [];
      mapa[fecha].push(item);
    });
    return Object.entries(mapa).sort((a, b) => new Date(b[0]) - new Date(a[0]));
  }, [serieActualizada, serieSeleccionadaTotal, soloConAmigos, amigosFiltro]);

  // 3. Items filtrados del mes o de todo el año en Diario por Fechas
  const itemsDelMes = useMemo(() => {
    if (anioSeleccionado === null || mesSeleccionado === null) return [];
    let items = [];
    if (mesSeleccionado === 'todos') {
      const mesesObj = arbolHistorial[anioSeleccionado] || {};
      items = Object.values(mesesObj).flat();
    } else {
      items = arbolHistorial[anioSeleccionado]?.[mesSeleccionado] || [];
    }
    return items.filter((item) => {
      if (busquedaHistorial.trim() && !item.titulo?.toLowerCase().includes(busquedaHistorial.trim().toLowerCase())) {
        return false;
      }
      return pasaFiltroAmigos(item);
    });
  }, [arbolHistorial, anioSeleccionado, mesSeleccionado, busquedaHistorial, soloConAmigos, amigosFiltro]);

  // 4. Grupos diarios del mes
  const gruposPorDia = useMemo(() => {
    if (itemsDelMes.length === 0) return [];
    const mapa = {};
    itemsDelMes.forEach((item) => {
      const fecha = item.fecha_visto ? item.fecha_visto.split('T')[0] : 'Sin Fecha';
      if (!mapa[fecha]) mapa[fecha] = [];
      mapa[fecha].push(item);
    });
    return Object.entries(mapa).sort((a, b) => new Date(b[0]) - new Date(a[0]));
  }, [itemsDelMes]);

  const resolverImagen = (ruta) => {
    if (!ruta) return null;
    if (ruta.startsWith('http')) return ruta;
    return `https://image.tmdb.org/t/p/w500${ruta.startsWith('/') ? ruta : `/${ruta}`}`;
  };

  // CASO 1: Obra (Serie, Saga o Película) abierta en Total Histórico
  if (vistaTotal && serieSeleccionadaTotal) {
    return (
      <VistaSerieTotal
        serie={serieActualizada || serieSeleccionadaTotal}
        gruposPorDia={gruposSerieTotalPorDia}
        resolverImagen={resolverImagen}
        onAbrirDetalleTimeline={onAbrirDetalleTimeline}
        modoSeleccion={modoSeleccion}
        seleccionadosParaBorrar={seleccionadosParaBorrar}
        onToggleItem={onToggleItem}
        onEliminarSerieDirecto={onEliminarSerieDirecto || onEliminarCarpetaDirecto}
        onEliminarItemDirecto={onEliminarItemDirecto}
        onRecargarDatos={onRecargarDatos}
        onAbrirRegistrar={onAbrirRegistrar}
        onVolver={() => setSerieSeleccionadaTotal(null)}
      />
    );
  }

  // CASO 2: Catálogo general Total Histórico
  if (vistaTotal) {
    return (
      <VistaCatalogoTotal 
        obras={obrasTotalesUnificadas}
        resolverImagen={resolverImagen}
        onSeleccionarSerie={setSerieSeleccionadaTotal}
        onAbrirDetalleTimeline={onAbrirDetalleTimeline}
        modoSeleccion={modoSeleccion}
        seleccionadosParaBorrar={seleccionadosParaBorrar}
        onToggleSerie={onToggleCarpeta}
        onEliminarSerieDirecto={onEliminarSerieDirecto || onEliminarCarpetaDirecto}
      />
    );
  }

  // CASO 3: Selector de Años
  if (!anioSeleccionado) {
    const carpetasAnios = listaAnios.map((anio) => {
      const meses = arbolHistorial[anio] || {};
      const items = Object.values(meses).flat().filter(pasaFiltroAmigos);
      return {
        id: anio,
        valor: anio,
        etiqueta: anio,
        subtexto: `${items.length} ${items.length === 1 ? 'obra' : 'obras'}`,
        items
      };
    }).filter((c) => c.items.length > 0 || !soloConAmigos);

    return (
      <VistaSelectorCarpetas 
        carpetas={carpetasAnios}
        tituloVacio={soloConAmigos ? "No tienes registros compartidos con esos amigos." : "No hay registros en tu historial todavía."}
        onSeleccionar={onSeleccionarAnio}
        modoSeleccion={modoSeleccion}
        seleccionadosParaBorrar={seleccionadosParaBorrar}
        onToggleCarpeta={onToggleCarpeta}
        onEliminarCarpetaDirecto={onEliminarCarpetaDirecto}
      />
    );
  }

  // CASO 4: Selector de Meses
  if (mesSeleccionado === null) {
    const mesesObj = arbolHistorial[anioSeleccionado] || {};
    const todosItemsAnio = Object.values(mesesObj).flat().filter(pasaFiltroAmigos);

    const carpetasMeses = Array.from({ length: 12 }, (_, index) => {
      const items = (mesesObj[index] || []).filter(pasaFiltroAmigos);
      const nombreMes = new Date(2024, index, 1).toLocaleDateString('es-ES', { month: 'long' });
      return {
        id: index,
        valor: index,
        etiqueta: nombreMes.charAt(0).toUpperCase() + nombreMes.slice(1),
        subtexto: `${items.length} ${items.length === 1 ? 'obra' : 'obras'}`,
        items,
        vacio: items.length === 0
      };
    })
      .filter((c) => c.items.length > 0)
      .sort((a, b) => b.valor - a.valor);

    // Carpeta especial para ver TODO el año completo sin abrir mes a mes
    const carpetasConTodoElAnio = [];
    if (todosItemsAnio.length > 0) {
      carpetasConTodoElAnio.push({
        id: 'todos',
        valor: 'todos',
        etiqueta: `Todo ${anioSeleccionado}`,
        subtexto: `${todosItemsAnio.length} ${todosItemsAnio.length === 1 ? 'obra' : 'obras'}`,
        items: todosItemsAnio,
        esTodoElAnio: true,
      });
    }
    carpetasConTodoElAnio.push(...carpetasMeses);

    return (
      <VistaSelectorCarpetas 
        carpetas={carpetasConTodoElAnio}
        tituloVacio={soloConAmigos ? `Sin registros compartidos con esos amigos en ${anioSeleccionado}.` : `No hay registros en ${anioSeleccionado}.`}
        onSeleccionar={onSeleccionarMes}
        modoSeleccion={modoSeleccion}
        seleccionadosParaBorrar={seleccionadosParaBorrar}
        onToggleCarpeta={onToggleCarpeta}
        onEliminarCarpetaDirecto={onEliminarCarpetaDirecto}
      />
    );
  }

  // CASO 5: Feed del Mes (Diario por Fechas)
  const nombresMesesLista = [
    'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
  ];

  return (
    <VistaFeedMes 
      gruposPorDia={gruposPorDia}
      itemsDelMes={itemsDelMes}
      resolverImagen={resolverImagen}
      onAbrirDetalleTimeline={onAbrirDetalleTimeline}
      modoSeleccion={modoSeleccion}
      seleccionadosParaBorrar={seleccionadosParaBorrar}
      onToggleItem={onToggleItem}
      onEliminarItemDirecto={onEliminarItemDirecto}
      busquedaHistorial={busquedaHistorial}
      nombresMeses={nombresMesesLista}
    />
  );
}
