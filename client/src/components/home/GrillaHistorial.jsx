import React, { useMemo } from 'react';
import VistaSerieTotal from './VistaSerieTotal';
import VistaCatalogoTotal from './VistaCatalogoTotal';
import VistaSelectorCarpetas from './VistaSelectorCarpetas';
import VistaFeedMes from './VistaFeedMes';

const NOMBRES_MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

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
  onAbrirDetalleTimeline,
  busquedaHistorial = '',
}) {
  // 1. Catálogo unificado Total Histórico
  const obrasTotalesUnificadas = useMemo(() => {
    if (!vistaTotal) return [];
    const mapaObras = {};

    timelineCompleto.forEach((item) => {
      if (busquedaHistorial && !item.titulo?.toLowerCase().includes(busquedaHistorial.toLowerCase())) {
        return;
      }
      const clave = item.obra_id || item.tmdb_id || item.titulo;
      if (!mapaObras[clave]) {
        mapaObras[clave] = {
          obra_id: item.obra_id,
          titulo: item.titulo,
          tipo: item.tipo,
          poster_path: item.poster_serie || item.obra_poster || item.poster_path,
          plataforma: item.plataforma,
          registros: [],
        };
      }
      mapaObras[clave].registros.push(item);
    });

    Object.values(mapaObras).forEach((obra) => {
      obra.registros.sort((a, b) => new Date(b.fecha_visto) - new Date(a.fecha_visto));
    });

    return Object.values(mapaObras).sort((a, b) => b.registros.length - a.registros.length);
  }, [vistaTotal, timelineCompleto, busquedaHistorial]);

  // 2. Agrupación por días de una serie en Total Histórico
  const gruposSerieTotalPorDia = useMemo(() => {
    if (!serieSeleccionadaTotal) return [];
    const mapa = {};
    serieSeleccionadaTotal.registros.forEach((item) => {
      const fecha = item.fecha_visto ? item.fecha_visto.split('T')[0] : 'Sin Fecha';
      if (!mapa[fecha]) mapa[fecha] = [];
      mapa[fecha].push(item);
    });
    return Object.entries(mapa).sort((a, b) => new Date(b[0]) - new Date(a[0]));
  }, [serieSeleccionadaTotal]);

  // 3. Items filtrados del mes
  const itemsDelMes = useMemo(() => {
    if (anioSeleccionado === null || mesSeleccionado === null) return [];
    return (arbolHistorial[anioSeleccionado]?.[mesSeleccionado] || []).filter((item) => {
      if (!busquedaHistorial.trim()) return true;
      return item.titulo?.toLowerCase().includes(busquedaHistorial.trim().toLowerCase());
    });
  }, [arbolHistorial, anioSeleccionado, mesSeleccionado, busquedaHistorial]);

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

  // CASO 1: Serie abierta en Total Histórico
  if (vistaTotal && serieSeleccionadaTotal) {
    return (
      <VistaSerieTotal
        serie={serieSeleccionadaTotal}
        gruposPorDia={gruposSerieTotalPorDia}
        resolverImagen={resolverImagen}
        onAbrirDetalleTimeline={onAbrirDetalleTimeline}
        modoSeleccion={modoSeleccion}
        seleccionadosParaBorrar={seleccionadosParaBorrar}
        onToggleItem={onToggleItem}
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
      />
    );
  }

  // CASO 3: Selector de Años
  if (!anioSeleccionado) {
    const carpetasAnios = listaAnios.map((anio) => {
      const meses = arbolHistorial[anio] || {};
      const items = Object.values(meses).flat();
      return {
        id: anio,
        valor: anio,
        etiqueta: anio,
        subtexto: `${items.length} ${items.length === 1 ? 'obra' : 'obras'}`,
        items
      };
    });

    return (
      <VistaSelectorCarpetas 
        carpetas={carpetasAnios}
        tituloVacio="No hay registros en tu historial todavía."
        onSeleccionar={onSeleccionarAnio}
      />
    );
  }

  // CASO 4: Selector de Meses
  if (mesSeleccionado === null) {
    const mesesDelAnio = arbolHistorial[anioSeleccionado] || {};
    const mesesIndices = Object.keys(mesesDelAnio).sort((a, b) => b - a);
    const carpetasMeses = mesesIndices.map((mesIdx) => {
      const items = mesesDelAnio[mesIdx] || [];
      return {
        id: mesIdx,
        valor: Number(mesIdx),
        etiqueta: NOMBRES_MESES[mesIdx],
        subtexto: `${items.length} ${items.length === 1 ? 'registro' : 'registros'}`,
        items
      };
    });

    return (
      <VistaSelectorCarpetas 
        carpetas={carpetasMeses}
        tituloVacio="No hay meses disponibles."
        onSeleccionar={onSeleccionarMes}
      />
    );
  }

  // CASO 5: Feed diario del mes
  return (
    <VistaFeedMes 
      gruposPorDia={gruposPorDia}
      resolverImagen={resolverImagen}
      modoSeleccion={modoSeleccion}
      seleccionadosParaBorrar={seleccionadosParaBorrar}
      onToggleItem={onToggleItem}
      onAbrirDetalleTimeline={onAbrirDetalleTimeline}
      busquedaHistorial={busquedaHistorial}
      nombresMeses={NOMBRES_MESES}
    />
  );
}