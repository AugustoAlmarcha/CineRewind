// Diccionario y utilidades para series famosas con discrepancias de temporadas entre Netflix/marketing y TMDb
export const NOTAS_SERIES_TEMPORADAS = {
  // La casa de papel
  71446: {
    titulo: 'La casa de papel',
    nota: 'En Netflix esta serie se emitió dividida en 5 partes, pero su archivo canónico internacional (TMDb) consta de 3 temporadas (41 episodios en total).'
  },
  // Lupin
  96677: {
    titulo: 'Lupin',
    nota: 'En Netflix se promociona en "Partes" (Parte 1, 2 y 3), que aquí corresponden a sus temporadas oficiales.'
  },
  // El mundo oculto de Sabrina (Chilling Adventures of Sabrina)
  79242: {
    titulo: 'El mundo oculto de Sabrina',
    nota: 'Netflix la emitió dividida en 4 partes, agrupadas oficialmente en 2 temporadas (cada una con dos partes).'
  },
  // Cobra Kai
  77169: {
    titulo: 'Cobra Kai',
    nota: 'La última temporada se lanzó en Netflix en 3 partes, registradas aquí bajo la Temporada 6 (15 episodios).'
  },
  // (Des)encanto / Disenchantment
  73021: {
    titulo: '(Des)encanto',
    nota: 'Netflix emitió la serie en 5 partes de 10 episodios cada una.'
  },
  // Shingeki no Kyojin / Attack on Titan
  1429: {
    titulo: 'Ataque a los Titanes',
    nota: 'La temporada final (Temporada 4) se emitió en múltiples partes y episodios especiales dentro de la Temporada 4.'
  },
  // Stranger Things
  66732: {
    titulo: 'Stranger Things',
    nota: 'La temporada 4 se dividió en Netflix en Volumen 1 y 2, agrupada aquí en la Temporada 4 (9 episodios completos).'
  },
  // Ozark
  63333: {
    titulo: 'Ozark',
    nota: 'La temporada final se emitió en Netflix en Parte 1 y 2, contenidas en la Temporada 4 (14 episodios).'
  },
  // BoJack Horseman
  61222: {
    titulo: 'BoJack Horseman',
    nota: 'La temporada 6 fue dividida por Netflix en dos partes, contenidas aquí en la Temporada 6 (16 episodios).'
  }
};

export const obtenerNotaEspecialSerie = (tmdbId, titulo = '') => {
  const idNum = Number(tmdbId);
  if (idNum && NOTAS_SERIES_TEMPORADAS[idNum]) {
    return NOTAS_SERIES_TEMPORADAS[idNum];
  }

  // Búsqueda por coincidencia de título si el ID no vino directamente
  const tituloNorm = (titulo || '').toLowerCase().trim();
  if (!tituloNorm) return null;

  if (tituloNorm.includes('casa de papel') || tituloNorm.includes('money heist')) {
    return NOTAS_SERIES_TEMPORADAS[71446];
  }
  if (tituloNorm === 'lupin') {
    return NOTAS_SERIES_TEMPORADAS[96677];
  }
  if (tituloNorm.includes('sabrina')) {
    return NOTAS_SERIES_TEMPORADAS[79242];
  }
  if (tituloNorm.includes('cobra kai')) {
    return NOTAS_SERIES_TEMPORADAS[77169];
  }
  if (tituloNorm.includes('desencanto') || tituloNorm.includes('disenchantment')) {
    return NOTAS_SERIES_TEMPORADAS[73021];
  }
  if (tituloNorm.includes('shingeki') || tituloNorm.includes('attack on titan') || tituloNorm.includes('titanes')) {
    return NOTAS_SERIES_TEMPORADAS[1429];
  }
  if (tituloNorm.includes('stranger things')) {
    return NOTAS_SERIES_TEMPORADAS[66732];
  }
  if (tituloNorm.includes('ozark')) {
    return NOTAS_SERIES_TEMPORADAS[63333];
  }
  if (tituloNorm.includes('bojack')) {
    return NOTAS_SERIES_TEMPORADAS[61222];
  }

  return null;
};
