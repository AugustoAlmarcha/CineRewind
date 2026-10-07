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
