import React, { useMemo } from 'react';
import VistaSerieTotal from './VistaSerieTotal';
import VistaCatalogoTotal from './VistaCatalogoTotal';
import VistaSelectorCarpetas from './VistaSelectorCarpetas';
import VistaFeedMes from './VistaFeedMes';
import { calcularProgresoSerie } from '../../utils/seriesProgreso';

// Helper para detectar franquicias y sagas populares reconocidas de películas
const obtenerInfoSaga = (titulo) => {
  if (!titulo) return null;
  const t = titulo.trim();

  // Solo sagas populares y franquicias ampliamente conocidas
  const patrones = [
    { regex: /^(harry\s+potter|animales\s+fant[aá]sticos|fantastic\s+beasts).*$/i, saga: 'Harry Potter', nombre: 'Saga Harry Potter' },
    { regex: /^(los\s+)?juegos\s+del\s+hambre|hunger\s+games.*$/i, saga: 'Los Juegos del Hambre', nombre: 'Saga Los Juegos del Hambre' },
    { regex: /^(shrek|el\s+gato\s+con\s+botas|puss\s+in\s+boots).*$/i, saga: 'Shrek', nombre: 'Saga Shrek' },
    { regex: /^toy\s+story.*$/i, saga: 'Toy Story', nombre: 'Saga Toy Story' },
    { regex: /^(r[aá]pidos\s+y\s+furiosos|fast\s+&?\s+furious).*$/i, saga: 'Rápidos y Furiosos', nombre: 'Saga Rápidos y Furiosos' },
    { regex: /^star\s+wars.*$/i, saga: 'Star Wars', nombre: 'Saga Star Wars' },
    { regex: /^(el\s+se[ñn]or\s+de\s+los\s+anillos|the\s+lord\s+of\s+the\s+rings|el\s+hobbit|the\s+hobbit).*$/i, saga: 'El Señor de los Anillos', nombre: 'Saga El Señor de los Anillos' },
    { regex: /^(los\s+)?(avengers|vengadores).*$/i, saga: 'Avengers', nombre: 'Saga Avengers' },
    { regex: /^spider-?man.*$/i, saga: 'Spider-Man', nombre: 'Saga Spider-Man' },
    { regex: /^(batman|the\s+batman|the\s+dark\s+knight|el\s+caballero\s+de\s+la\s+noche).*$/i, saga: 'Batman', nombre: 'Saga Batman' },
    { regex: /^piratas\s+del\s+caribe|pirates\s+of\s+the\s+caribbean.*$/i, saga: 'Piratas del Caribe', nombre: 'Saga Piratas del Caribe' },
    { regex: /^misi[oó]n\s+imposible|mission\s*:\s*impossible.*$/i, saga: 'Misión Imposible', nombre: 'Saga Misión Imposible' },
    { regex: /^john\s+wick.*$/i, saga: 'John Wick', nombre: 'Saga John Wick' },
    { regex: /^jurassic\s+(park|world).*$/i, saga: 'Jurassic Park', nombre: 'Saga Jurassic Park' },
    { regex: /^(la\s+saga\s+)?crep[uú]sculo|twilight.*$/i, saga: 'Crepúsculo', nombre: 'Saga Crepúsculo' },
    { regex: /^(el\s+)?padrino|the\s+godfather.*$/i, saga: 'El Padrino', nombre: 'Saga El Padrino' },
    { regex: /^indiana\s+jones.*$/i, saga: 'Indiana Jones', nombre: 'Saga Indiana Jones' },
    { regex: /^(mi\s+villano\s+favorito|minions|despicable\s+me).*$/i, saga: 'Mi Villano Favorito', nombre: 'Saga Mi Villano Favorito' },
    { regex: /^kung\s+fu\s+panda.*$/i, saga: 'Kung Fu Panda', nombre: 'Saga Kung Fu Panda' },
    { regex: /^madagascar.*$/i, saga: 'Madagascar', nombre: 'Saga Madagascar' },
    { regex: /^cars(\s+.*)?$/i, saga: 'Cars', nombre: 'Saga Cars' },
    { regex: /^(volver\s+al\s+futuro|back\s+to\s+the\s+future).*$/i, saga: 'Volver al Futuro', nombre: 'Saga Volver al Futuro' },
    { regex: /^matrix.*$/i, saga: 'Matrix', nombre: 'Saga Matrix' },
    { regex: /^terminator.*$/i, saga: 'Terminator', nombre: 'Saga Terminator' },
    { regex: /^(alien|depredador|predator).*$/i, saga: 'Alien', nombre: 'Saga Alien' },
    { regex: /^(el\s+conjuro|the\s+conjuring|annabelle|la\s+monja|the\s+nun).*$/i, saga: 'El Conjuro', nombre: 'Saga El Conjuro' },
    { regex: /^(destino\s+final|final\s+destination).*$/i, saga: 'Destino Final', nombre: 'Saga Destino Final' },
    { regex: /^scream(\s+.*)?$/i, saga: 'Scream', nombre: 'Saga Scream' },
    { regex: /^(los\s+)?incre[ií]bles|the\s+incredibles.*$/i, saga: 'Los Increíbles', nombre: 'Saga Los Increíbles' },
    { regex: /^monsters(\s*,\s*inc|\s+university).*$/i, saga: 'Monsters Inc', nombre: 'Saga Monsters Inc' },
    { regex: /^(buscando\s+a\s+(nemo|dory)|finding\s+(nemo|dory)).*$/i, saga: 'Buscando a Nemo', nombre: 'Saga Buscando a Nemo' },
    { regex: /^(rocky|creed).*$/i, saga: 'Rocky', nombre: 'Saga Rocky' },
    { regex: /^(james\s+bond|007).*$/i, saga: 'James Bond', nombre: 'Saga James Bond' },
    { regex: /^transformers.*$/i, saga: 'Transformers', nombre: 'Saga Transformers' },
    { regex: /^(x-men|wolverine|logan).*$/i, saga: 'X-Men', nombre: 'Saga X-Men' },
    { regex: /^(la\s+era\s+de\s+hielo|ice\s+age).*$/i, saga: 'La Era de Hielo', nombre: 'Saga La Era de Hielo' },
    { regex: /^(cazafantasmas|ghostbusters).*$/i, saga: 'Cazafantasmas', nombre: 'Saga Cazafantasmas' },
    { regex: /^guardianes\s+de\s+la\s+galaxia|guardians\s+of\s+the\s+galaxy.*$/i, saga: 'Guardianes de la Galaxia', nombre: 'Saga Guardianes de la Galaxia' },
    { regex: /^deadpool.*$/i, saga: 'Deadpool', nombre: 'Saga Deadpool' },
    { regex: /^dune(\s+.*)?$/i, saga: 'Dune', nombre: 'Saga Dune' },
    { regex: /^gladiad?or.*$/i, saga: 'Gladiador', nombre: 'Saga Gladiador' },
    { regex: /^joker(\s+.*)?$/i, saga: 'Joker', nombre: 'Saga Joker' },
  ];

  for (const p of patrones) {
    if (p.regex.test(t)) {
      return { clave: p.saga.toLowerCase(), nombre: p.nombre };
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
    const serieActualizada = obrasTotalesUnificadas.find(
      (o) => o.id_agrupador === serieSeleccionadaTotal.id_agrupador ||
             (o.obra_id && o.obra_id === serieSeleccionadaTotal.obra_id) ||
             (o.tmdb_id && o.tmdb_id === serieSeleccionadaTotal.tmdb_id)
    ) || serieSeleccionadaTotal;

    return (
      <VistaSerieTotal
        serie={serieActualizada}
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
