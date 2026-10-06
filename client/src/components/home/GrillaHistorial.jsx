import React, { useMemo } from 'react';
import VistaSerieTotal from './VistaSerieTotal';
import VistaCatalogoTotal from './VistaCatalogoTotal';
import VistaSelectorCarpetas from './VistaSelectorCarpetas';
import VistaFeedMes from './VistaFeedMes';

// Helper para detectar y agrupar sagas y franquicias de películas
const obtenerInfoSaga = (titulo) => {
  if (!titulo) return null;
  const t = titulo.trim();

  // 1. Patrones reconocidos comunes (español e inglés)
  const patrones = [
    { regex: /^shrek(\s+.*)?$/i, saga: 'Shrek', nombre: 'Saga Shrek' },
    { regex: /^(los\s+)?juegos\s+del\s+hambre.*$/i, saga: 'Los Juegos del Hambre', nombre: 'Saga Los Juegos del Hambre' },
    { regex: /^harry\s+potter.*$/i, saga: 'Harry Potter', nombre: 'Saga Harry Potter' },
    { regex: /^el\s+se[ñn]or\s+de\s+los\s+anillos.*$/i, saga: 'El Señor de los Anillos', nombre: 'Saga El Señor de los Anillos' },
    { regex: /^the\s+lord\s+of\s+the\s+rings.*$/i, saga: 'The Lord of the Rings', nombre: 'Saga The Lord of the Rings' },
    { regex: /^star\s+wars.*$/i, saga: 'Star Wars', nombre: 'Saga Star Wars' },
    { regex: /^toy\s+story.*$/i, saga: 'Toy Story', nombre: 'Saga Toy Story' },
    { regex: /^spider-?man.*$/i, saga: 'Spider-Man', nombre: 'Saga Spider-Man' },
    { regex: /^(el\s+)?padrino.*$/i, saga: 'El Padrino', nombre: 'Saga El Padrino' },
    { regex: /^john\s+wick.*$/i, saga: 'John Wick', nombre: 'Saga John Wick' },
    { regex: /^misi[oó]n\s+imposible.*$/i, saga: 'Misión Imposible', nombre: 'Saga Misión Imposible' },
    { regex: /^(r[aá]pidos\s+y\s+furiosos|fast\s+&?\s+furious).*$/i, saga: 'Rápidos y Furiosos', nombre: 'Saga Rápidos y Furiosos' },
    { regex: /^piratas\s+del\s+caribe.*$/i, saga: 'Piratas del Caribe', nombre: 'Saga Piratas del Caribe' },
    { regex: /^madagascar.*$/i, saga: 'Madagascar', nombre: 'Saga Madagascar' },
    { regex: /^kung\s+fu\s+panda.*$/i, saga: 'Kung Fu Panda', nombre: 'Saga Kung Fu Panda' },
    { regex: /^mi\s+villano\s+favorito.*$/i, saga: 'Mi Villano Favorito', nombre: 'Saga Mi Villano Favorito' },
    { regex: /^(la\s+saga\s+)?crep[uú]sculo.*$/i, saga: 'Crepúsculo', nombre: 'Saga Crepúsculo' },
    { regex: /^matrix.*$/i, saga: 'Matrix', nombre: 'Saga Matrix' },
    { regex: /^terminator.*$/i, saga: 'Terminator', nombre: 'Saga Terminator' },
    { regex: /^alien.*$/i, saga: 'Alien', nombre: 'Saga Alien' },
    { regex: /^avatar(\s*:\s*.*)?$/i, saga: 'Avatar', nombre: 'Saga Avatar' },
    { regex: /^dun[ea].*$/i, saga: 'Dune', nombre: 'Saga Dune' },
    { regex: /^deadpool.*$/i, saga: 'Deadpool', nombre: 'Saga Deadpool' },
    { regex: /^gladiad?or.*$/i, saga: 'Gladiador', nombre: 'Saga Gladiador' },
    { regex: /^joker.*$/i, saga: 'Joker', nombre: 'Saga Joker' },
    { regex: /^guardianes\s+de\s+la\s+galaxia.*$/i, saga: 'Guardianes de la Galaxia', nombre: 'Saga Guardianes de la Galaxia' },
    { regex: /^(los\s+)?(avengers|vengadores).*$/i, saga: 'Avengers', nombre: 'Saga Avengers' },
    { regex: /^(five\s+nights\s+at\s+freddy|cinco\s+noches).*$/i, saga: 'Five Nights at Freddy\'s', nombre: 'Saga Five Nights at Freddy\'s' },
  ];

  for (const p of patrones) {
    if (p.regex.test(t)) {
      return { clave: p.saga.toLowerCase(), nombre: p.nombre };
    }
  }

  // 2. Patrón de separadores como ":", "-", "–" o número (ej: "Cars 2" -> "Saga Cars")
  const matchSep = t.match(/^([^:\-–—·]+)[\s*:\-–—·]\s*(.+)$/);
  if (matchSep) {
    const prefijo = matchSep[1].trim();
    if (prefijo.length >= 3 && !/^(el|la|los|las|un|una|the|a|an)$/i.test(prefijo)) {
      return { clave: prefijo.toLowerCase(), nombre: `Saga ${prefijo}` };
    }
  }

  const matchNum = t.match(/^(.+?)\s+(\d+|[IVXLCDM]+)$/i);
  if (matchNum) {
    const prefijo = matchNum[1].trim();
    if (prefijo.length >= 3 && !/^(el|la|los|las|un|una|the|a|an)$/i.test(prefijo)) {
      return { clave: prefijo.toLowerCase(), nombre: `Saga ${prefijo}` };
    }
  }

  return null;
};

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
  filtroTipo = '',
  // Props del filtro social
  soloConAmigos = false,
  amigosFiltro = [],
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
            titulo: item.titulo,
            tipo: 'serie',
            esSaga: false,
            poster_path: item.poster_serie || item.obra_poster || item.poster_path,
            plataforma: item.plataforma,
            registros: [],
          };
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
      }
    });

    return Object.values(mapaObras).sort((a, b) => b.registros.length - a.registros.length);
  }, [vistaTotal, timelineCompleto, busquedaHistorial, filtroTipo, soloConAmigos, amigosFiltro]);

  // 2. Agrupación por días de una obra (serie, saga o película) en Total Histórico
  const gruposSerieTotalPorDia = useMemo(() => {
    if (!serieSeleccionadaTotal) return [];
    const mapa = {};
    serieSeleccionadaTotal.registros.forEach((item) => {
      if (!pasaFiltroAmigos(item)) return;
      const fecha = item.fecha_visto ? item.fecha_visto.split('T')[0] : 'Sin Fecha';
      if (!mapa[fecha]) mapa[fecha] = [];
      mapa[fecha].push(item);
    });
    return Object.entries(mapa).sort((a, b) => new Date(b[0]) - new Date(a[0]));
  }, [serieSeleccionadaTotal, soloConAmigos, amigosFiltro]);

  // 3. Items filtrados del mes en Diario por Fechas
  const itemsDelMes = useMemo(() => {
    if (anioSeleccionado === null || mesSeleccionado === null) return [];
    return (arbolHistorial[anioSeleccionado]?.[mesSeleccionado] || []).filter((item) => {
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
      />
    );
  }

  // CASO 4: Selector de Meses
  if (mesSeleccionado === null) {
    const mesesObj = arbolHistorial[anioSeleccionado] || {};
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

    return (
      <VistaSelectorCarpetas 
        carpetas={carpetasMeses}
        tituloVacio={soloConAmigos ? `Sin registros compartidos con esos amigos en ${anioSeleccionado}.` : `No hay registros en ${anioSeleccionado}.`}
        onSeleccionar={onSeleccionarMes}
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
      busquedaHistorial={busquedaHistorial}
      nombresMeses={nombresMesesLista}
    />
  );
}
