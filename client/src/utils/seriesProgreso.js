// client/src/utils/seriesProgreso.js

/**
 * Calcula el progreso detallado de una serie a partir de sus registros de visualización
 * y la información de temporadas de TMDb.
 */
export function calcularProgresoSerie(serie) {
  if (!serie || serie.tipo?.toLowerCase() !== 'serie') return null;

  const registros = Array.isArray(serie.registros) ? serie.registros : [];
  
  // Mapa de episodios vistos por temporada: { [tempNum]: Set([ep1, ep2, ...]) }
  const mapaVistosPorTemp = {};
  const capsUnicosGlobal = new Set();
  let maxTempRegistrada = 0;
  let tieneMarcaFinalSerie = false;

  registros.forEach((r) => {
    const tempNum = Number(r.temporada);
    const epNum = Number(r.episodio);

    if (!isNaN(tempNum) && tempNum > 0) {
      if (!mapaVistosPorTemp[tempNum]) {
        mapaVistosPorTemp[tempNum] = new Set();
      }
      if (!isNaN(epNum) && epNum > 0) {
        mapaVistosPorTemp[tempNum].add(epNum);
        capsUnicosGlobal.add(`${tempNum}_${epNum}`);
      }
      if (tempNum > maxTempRegistrada) {
        maxTempRegistrada = tempNum;
      }
      if (r.es_final_temporada) {
        // Marcado como final
      }
    }
  });

  const seasonsInfoTMDb = Array.isArray(serie.seasons_info)
    ? serie.seasons_info
    : (typeof serie.seasons_info === 'string'
        ? (() => { try { return JSON.parse(serie.seasons_info); } catch { return []; } })()
        : []);

  const totalTemporadasTMDb = Number(serie.total_temporadas) || (seasonsInfoTMDb.length > 0 ? seasonsInfoTMDb.length : null);
  const totalTemporadas = Math.max(totalTemporadasTMDb || 0, maxTempRegistrada, 1);
  const totalEpisodiosTMDb = Number(serie.total_episodios) || null;

  // Detalle por cada temporada (1 hasta totalTemporadas)
  const temporadas = [];
  let temporadasCompletasCount = 0;
  let temporadasConVistosCount = 0;

  for (let t = 1; t <= totalTemporadas; t++) {
    const infoTMDb = seasonsInfoTMDb.find((s) => Number(s.temporada) === t);
    const totalEpisodiosEnTemp = infoTMDb?.episodios ? Number(infoTMDb.episodios) : null;
    const episodiosVistosSet = mapaVistosPorTemp[t] || new Set();
    const cantVistos = episodiosVistosSet.size;

    // Verificar si algún registro de esta temporada tiene es_final_temporada
    const tieneMarcaFin = registros.some(
      (r) => Number(r.temporada) === t && Boolean(r.es_final_temporada)
    );

    let estaCompleta = false;
    if (totalEpisodiosEnTemp && totalEpisodiosEnTemp > 0) {
      estaCompleta = cantVistos >= totalEpisodiosEnTemp || tieneMarcaFin;
    } else {
      estaCompleta = tieneMarcaFin || (cantVistos > 0 && t < maxTempRegistrada);
    }

    const estaPendiente = cantVistos === 0;
    const estaEnCurso = cantVistos > 0 && !estaCompleta;

    if (estaCompleta) temporadasCompletasCount++;
    if (cantVistos > 0) temporadasConVistosCount++;

    const maxEpVistoTemp = episodiosVistosSet.size > 0 ? Math.max(...Array.from(episodiosVistosSet)) : 0;

    temporadas.push({
      numero: t,
      nombre: infoTMDb?.nombre || `Temporada ${t}`,
      totalEpisodios: totalEpisodiosEnTemp,
      cantVistos,
      maxEpVisto: maxEpVistoTemp,
      estaCompleta,
      estaPendiente,
      estaEnCurso,
      porcentaje: totalEpisodiosEnTemp ? Math.min(100, Math.round((cantVistos / totalEpisodiosEnTemp) * 100)) : (estaCompleta ? 100 : 0)
    });
  }

  // Estado general de la serie
  const estadoTMDb = (serie.estado_serie || '').toLowerCase();
  const esFinalizadaTMDb = estadoTMDb === 'ended' || estadoTMDb === 'canceled';

  const ultimaTemp = temporadas[temporadas.length - 1];
  const ultimaTempCompleta = Boolean(ultimaTemp?.estaCompleta);

  let estaCompletada = false;
  if (totalTemporadasTMDb && totalTemporadasTMDb > 0) {
    if (maxTempRegistrada >= totalTemporadasTMDb && ultimaTempCompleta) {
      estaCompletada = true;
    } else if (totalEpisodiosTMDb && capsUnicosGlobal.size >= totalEpisodiosTMDb) {
      estaCompletada = true;
    } else if (temporadasCompletasCount >= totalTemporadasTMDb) {
      estaCompletada = true;
    }
  } else {
    // Si no tenemos metadata de TMDb, nos guiamos por la marca de final en la última temporada
    estaCompletada = ultimaTempCompleta && registros.length > 0;
  }

  const estaAlDia = !estaCompletada && !esFinalizadaTMDb && maxTempRegistrada >= totalTemporadas && ultimaTempCompleta;

  // Cálculos de porcentaje global
  let porcentajeGlobal = 0;
  if (totalEpisodiosTMDb && totalEpisodiosTMDb > 0) {
    porcentajeGlobal = Math.min(100, Math.round((capsUnicosGlobal.size / totalEpisodiosTMDb) * 100));
  } else if (totalTemporadas > 0) {
    porcentajeGlobal = Math.min(100, Math.round((temporadasCompletasCount / totalTemporadas) * 100));
  }

  if (estaCompletada) {
    porcentajeGlobal = 100;
  }

  // Badges y textos formateados
  let badgeTexto = 'EN CURSO';
  let badgeColor = 'bg-amber-500/20 text-amber-500 border-amber-500/30';
  let resumenTexto = '';

  if (estaCompletada) {
    badgeTexto = 'TERMINADA';
    badgeColor = 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/40';
    resumenTexto = `✓ Serie completada · ${totalTemporadas} ${totalTemporadas === 1 ? 'temporada' : 'temporadas'}`;
  } else if (estaAlDia) {
    badgeTexto = 'AL DÍA';
    badgeColor = 'bg-cyan-500/20 text-cyan-500 border-cyan-500/30';
    resumenTexto = `✓ Al día con la emisión · ${totalTemporadas} temps`;
  } else {
    badgeTexto = totalTemporadasTMDb ? `T${maxTempRegistrada || 1}/${totalTemporadasTMDb}` : `T${maxTempRegistrada || 1}`;
    badgeColor = 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/40';
    resumenTexto = totalTemporadasTMDb
      ? `En curso · ${temporadasConVistosCount} de ${totalTemporadasTMDb} temps (T${maxTempRegistrada})`
      : `En curso · Temporada ${maxTempRegistrada || 1}`;
  }

  return {
    totalTemporadas,
    totalTemporadasTMDb,
    totalEpisodiosTMDb,
    capsUnicosVistos: capsUnicosGlobal.size,
    temporadasCompletasCount,
    temporadasConVistosCount,
    maxTempRegistrada,
    esFinalizadaTMDb,
    estadoTMDb,
    estaCompletada,
    estaAlDia,
    estaEnCurso: !estaCompletada && !estaAlDia,
    temporadas,
    porcentajeGlobal,
    badgeTexto,
    badgeColor,
    resumenTexto,
  };
}

/**
 * Helper para detectar franquicias y sagas populares reconocidas de películas
 */
export function obtenerInfoSaga(titulo) {
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
      return { clave: p.saga.toLowerCase().replace(/\s+/g, '_'), nombre: p.nombre };
    }
  }

  return null;
}
