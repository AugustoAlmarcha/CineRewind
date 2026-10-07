const pool = require('../config/db');

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

// Caché en memoria para no saturar TMDb y responder en milisegundos
const cacheTMDB = new Map();

const consultarTMDBConTimeout = async (url, tiempoMs = 1500) => {
  const ahora = Date.now();
  if (cacheTMDB.has(url)) {
    const { data, expira } = cacheTMDB.get(url);
    if (ahora < expira) return data;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), tiempoMs);

    const resp = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!resp.ok) return null;
    const data = await resp.json();
    cacheTMDB.set(url, { data, expira: ahora + 1000 * 60 * 60 * 24 }); // 24 horas
    return data;
  } catch (err) {
    return null;
  }
};

// Helper: Obtener mapa de temporadas y conteo total de episodios en una sola llamada a TMDb
const obtenerInfoSerieTMDb = async (tmdbId, apiKey) => {
  if (!tmdbId || !apiKey) return null;
  const url = `${TMDB_BASE_URL}/tv/${tmdbId}?api_key=${apiKey}&language=es-MX`;
  const data = await consultarTMDBConTimeout(url, 2500);
  if (!data) return null;

  const mapaTemporadas = new Map();
  if (Array.isArray(data.seasons)) {
    for (const s of data.seasons) {
      if (s.season_number > 0) {
        mapaTemporadas.set(s.season_number, s.episode_count);
      }
    }
  }

  return {
    totalTemps: data.number_of_seasons || mapaTemporadas.size,
    mapaTemporadas,
    poster_path: data.poster_path,
    backdrop_path: data.backdrop_path,
  };
};

const resolverUsuarioId = (req) => {
  return req.usuario?.id || req.params?.usuario_id || req.body?.usuario_id;
};

// GET: Carga con salto automático de huecos y foto del capítulo siguiente
// GET: Carga ULTRA RÁPIDA con procesamiento en paralelo
const obtenerViendoActualmente = async (req, res) => {
  const usuario_id = resolverUsuarioId(req);
  const apiKey = process.env.TMDB_API_KEY;

  if (!usuario_id) {
    return res.status(400).json({ error: 'ID de usuario requerido' });
  }

  const usuarioIdNum = parseInt(usuario_id, 10);
  if (isNaN(usuarioIdNum)) {
    return res.status(400).json({ error: 'ID de usuario inválido' });
  }

  try {
    const query = `
      WITH ultimos_vistos AS (
        SELECT 
          s.obra_id,
          s.fecha_reinicio,
          s.total_episodios_temporada,
          MAX(h.id) AS max_historial_id
        FROM seguimiento_series s
        INNER JOIN historial_visualizaciones h 
          ON h.obra_id = s.obra_id 
          AND h.usuario_id = s.usuario_id
          AND h.temporada IS NOT NULL
          AND h.episodio IS NOT NULL
          AND h.creado_en >= (COALESCE(s.fecha_reinicio, '1970-01-01'::timestamp) - INTERVAL '2 minutes')
        WHERE s.usuario_id = $1 AND s.activo = true
        GROUP BY s.obra_id, s.fecha_reinicio, s.total_episodios_temporada
      )
      SELECT 
        u.obra_id,
        u.fecha_reinicio,
        u.total_episodios_temporada,
        o.tmdb_id,
        o.titulo,
        o.poster_path,
        h.temporada AS temporada_actual,
        h.episodio AS episodio_actual,
        h.plataforma,
        h.fecha_visto,
        h.id AS ultimo_historial_id
      FROM ultimos_vistos u
      INNER JOIN historial_visualizaciones h ON h.id = u.max_historial_id
      INNER JOIN obras_catalogo o ON o.id = u.obra_id
      ORDER BY u.max_historial_id DESC;
    `;

    const resultado = await pool.query(query, [usuarioIdNum]);

    // Procesamos todas las series EN PARALELO con Promise.all
    const seriesFiltradas = (await Promise.all(
      resultado.rows.map(async (serie) => {
        let posterPrincipal = serie.poster_path;
        if (posterPrincipal && !posterPrincipal.startsWith('http')) {
          posterPrincipal = `https://image.tmdb.org/t/p/w500${posterPrincipal.startsWith('/') ? posterPrincipal : `/${posterPrincipal}`}`;
        }

        const tempActual = parseInt(serie.temporada_actual, 10);
        const epActual = parseInt(serie.episodio_actual, 10);
        if (isNaN(tempActual) || isNaN(epActual)) {
          return null;
        }

        // 1. Obtener todos los episodios vistos de esta serie en este ciclo
        const resVistos = await pool.query(
          `SELECT temporada, episodio FROM historial_visualizaciones 
           WHERE usuario_id = $1 
             AND obra_id = $2 
             AND temporada IS NOT NULL
             AND episodio IS NOT NULL
             AND creado_en >= (COALESCE($3, '1970-01-01'::timestamp) - INTERVAL '2 minutes')`,
          [usuarioIdNum, serie.obra_id, serie.fecha_reinicio]
        );
        const vistosSet = new Set(
          resVistos.rows.map((r) => `${parseInt(r.temporada, 10)}-${parseInt(r.episodio, 10)}`)
        );

        // 2. Consultar TMDb para mapa de temporadas y cantidad de episodios
        const infoTMDb = await obtenerInfoSerieTMDb(serie.tmdb_id, apiKey);
        const mapaTemporadas = infoTMDb?.mapaTemporadas || new Map();
        const totalTemps = infoTMDb?.totalTemps || null;

        // Fallback si TMDb no respondió pero la serie tiene total_episodios_temporada guardado
        if (mapaTemporadas.size === 0 && serie.total_episodios_temporada) {
          mapaTemporadas.set(tempActual, parseInt(serie.total_episodios_temporada, 10));
        }

        // 3. Buscar el siguiente capítulo pendiente
        let encontrada = false;
        let sigTemp = tempActual;
        let sigEp = epActual + 1;
        let iteraciones = 0;

        while (!encontrada && iteraciones < 300) {
          iteraciones++;
          const capsEnEstaTemp = mapaTemporadas.get(sigTemp) || null;

          // Si superamos los capítulos de la temporada actual
          if (capsEnEstaTemp && sigEp > capsEnEstaTemp) {
            // Si además estamos en la última temporada o la superamos -> Serie terminada
            if (totalTemps && sigTemp >= totalTemps) {
              await pool.query(
                'UPDATE seguimiento_series SET activo = false, actualizado_en = CURRENT_TIMESTAMP WHERE usuario_id = $1 AND obra_id = $2;',
                [usuarioIdNum, serie.obra_id]
              );
              return null; // Se retira de Viendo Actualmente
            }
            // Avanzar a la siguiente temporada
            sigTemp++;
            sigEp = 1;
            continue;
          }

          // Si este episodio ya está visto, seguimos saltando al siguiente
          if (vistosSet.has(`${sigTemp}-${sigEp}`)) {
            sigEp++;
          } else {
            encontrada = true;
          }
        }

        // Si recorrió todo y no encontró ningún capítulo pendiente, o superó las temporadas -> Serie terminada
        if (!encontrada || (totalTemps && sigTemp > totalTemps)) {
          await pool.query(
            'UPDATE seguimiento_series SET activo = false, actualizado_en = CURRENT_TIMESTAMP WHERE usuario_id = $1 AND obra_id = $2;',
            [usuarioIdNum, serie.obra_id]
          );
          return null; // Se retira de Viendo Actualmente
        }

        // 4. Foto del capítulo siguiente (timeout controlado de 1500ms)
        let fotoSiguiente = null;
        if (apiKey && serie.tmdb_id) {
          const urlEpisodio = `${TMDB_BASE_URL}/tv/${serie.tmdb_id}/season/${sigTemp}/episode/${sigEp}?api_key=${apiKey}&language=es-MX`;
          const dataEp = await consultarTMDBConTimeout(urlEpisodio, 1500);
          if (dataEp?.still_path) {
            fotoSiguiente = `https://image.tmdb.org/t/p/w780${dataEp.still_path}`;
          }
        }

        return {
          ...serie,
          poster_path: posterPrincipal,
          poster_temporada: posterPrincipal,
          temporada: tempActual,
          episodio: epActual,
          siguiente_temporada: sigTemp,
          siguiente_episodio: sigEp,
          foto_siguiente: fotoSiguiente || posterPrincipal,
        };
      })
    )).filter(Boolean); // Quita los que hayan terminado (null)

    res.json(seriesFiltradas);
  } catch (error) {
    console.error('Error al obtener series en curso:', error.message);
    res.status(500).json({ error: 'Error al consultar series activas' });
  }
};

// POST: Avanzar capítulo registrando el salto correcto
const avanzarCapitulo = async (req, res) => {
  const usuario_id = resolverUsuarioId(req);
  const { obra_id, temporada, episodio_actual, plataforma, amigos_etiquetados, calificacion, resenia } = req.body;

  if (!usuario_id || !obra_id || !temporada || episodio_actual === undefined) {
    return res.status(400).json({ error: 'Faltan parámetros obligatorios' });
  }

  let tempNum = parseInt(temporada, 10);
  let epNum = parseInt(episodio_actual, 10);
  if (isNaN(tempNum) || isNaN(epNum)) {
    return res.status(400).json({ error: 'Temporada y episodio deben ser números válidos' });
  }
  const apiKey = process.env.TMDB_API_KEY;

  try {
    const resObra = await pool.query('SELECT tmdb_id FROM obras_catalogo WHERE id = $1', [obra_id]);
    if (resObra.rowCount === 0) return res.status(404).json({ error: 'Obra no encontrada' });
    const { tmdb_id } = resObra.rows[0];

    const resSeg = await pool.query(
      `SELECT fecha_reinicio FROM seguimiento_series WHERE usuario_id = $1 AND obra_id = $2`,
      [usuario_id, obra_id]
    );
    const fechaReinicio = resSeg.rows[0]?.fecha_reinicio || null;

    // Episodios ya vistos en este ciclo
    const resVistos = await pool.query(
      `SELECT temporada, episodio FROM historial_visualizaciones 
       WHERE usuario_id = $1 
         AND obra_id = $2 
         AND temporada IS NOT NULL
         AND episodio IS NOT NULL
         AND creado_en >= (COALESCE($3, '1970-01-01'::timestamp) - INTERVAL '2 minutes')`,
      [usuario_id, obra_id, fechaReinicio]
    );
    const vistosSet = new Set(
      resVistos.rows.map((r) => `${parseInt(r.temporada, 10)}-${parseInt(r.episodio, 10)}`)
    );

    // Consultar TMDb
    const infoTMDb = await obtenerInfoSerieTMDb(tmdb_id, apiKey);
    const mapaTemporadas = infoTMDb?.mapaTemporadas || new Map();
    const totalTemps = infoTMDb?.totalTemps || null;

    let encontrada = false;
    let proximaTemp = tempNum;
    let proximoEp = epNum + 1;
    let iteraciones = 0;

    // Saltar cualquier capítulo ya registrado y avanzar de temporada si corresponde
    while (!encontrada && iteraciones < 300) {
      iteraciones++;
      const capsEnEstaTemp = mapaTemporadas.get(proximaTemp) || null;

      if (capsEnEstaTemp && proximoEp > capsEnEstaTemp) {
        if (totalTemps && proximaTemp >= totalTemps) {
          await pool.query(
            'UPDATE seguimiento_series SET activo = false, actualizado_en = CURRENT_TIMESTAMP WHERE usuario_id = $1 AND obra_id = $2;',
            [usuario_id, obra_id]
          );
          return res.json({ mensaje: 'Serie completada', serieFinalizada: true });
        }
        proximaTemp++;
        proximoEp = 1;
        continue;
      }

      if (vistosSet.has(`${proximaTemp}-${proximoEp}`)) {
        proximoEp++;
      } else {
        encontrada = true;
      }
    }

    if (!encontrada || (totalTemps && proximaTemp > totalTemps)) {
      await pool.query(
        'UPDATE seguimiento_series SET activo = false, actualizado_en = CURRENT_TIMESTAMP WHERE usuario_id = $1 AND obra_id = $2;',
        [usuario_id, obra_id]
      );
      return res.json({ mensaje: 'Serie completada', serieFinalizada: true });
    }

    // Traer la imagen del capítulo que se está guardando
    let fotoEp = null;
    if (apiKey) {
      const urlEpisodio = `${TMDB_BASE_URL}/tv/${tmdb_id}/season/${proximaTemp}/episode/${proximoEp}?api_key=${apiKey}&language=es-MX`;
      const dataEp = await consultarTMDBConTimeout(urlEpisodio, 1500);
      if (dataEp?.still_path) {
        fotoEp = `https://image.tmdb.org/t/p/w780${dataEp.still_path}`;
      }
    }

    const totalCapsTemp = mapaTemporadas.get(proximaTemp) || null;
    const esFinTemporada = Boolean(totalCapsTemp && proximoEp === totalCapsTemp);
    const esFinSerie = Boolean(totalTemps && proximaTemp >= totalTemps && esFinTemporada);

    const insertQuery = `
      INSERT INTO historial_visualizaciones 
        (usuario_id, obra_id, temporada, episodio, plataforma, fecha_visto, foto_episodio, es_final_temporada, calificacion, resenia)
      VALUES ($1, $2, $3, $4, $5, CURRENT_DATE, $6, $7, $8, $9)
      RETURNING *;
    `;
    const resHistorial = await pool.query(insertQuery, [
      usuario_id,
      obra_id,
      proximaTemp,
      proximoEp,
      plataforma || null,
      fotoEp,
      esFinTemporada,
      calificacion ? Number(calificacion) : null,
      resenia && typeof resenia === 'string' && resenia.trim() ? resenia.trim() : null
    ]);

    // HU-10: Guardar invitaciones pendientes si se etiquetaron amigos desde la tarjeta
    if (Array.isArray(amigos_etiquetados) && amigos_etiquetados.length > 0) {
      const visualizacionId = resHistorial.rows[0].id;
      for (const amigoId of amigos_etiquetados) {
        const idAmigoNum = parseInt(amigoId, 10);
        if (idAmigoNum && idAmigoNum !== Number(usuario_id)) {
          await pool.query(
            `INSERT INTO covisualizaciones (visualizacion_id, amigo_id, estado)
             VALUES ($1, $2, 'pendiente')
             ON CONFLICT (visualizacion_id, amigo_id) DO NOTHING;`,
            [visualizacionId, idAmigoNum]
          );
        }
      }
    }

    // Si registramos el último capítulo de la última temporada, marcamos como completada
    if (esFinSerie) {
      await pool.query(
        'UPDATE seguimiento_series SET activo = false, total_episodios_temporada = $3, actualizado_en = CURRENT_TIMESTAMP WHERE usuario_id = $1 AND obra_id = $2;',
        [usuario_id, obra_id, totalCapsTemp]
      );
      return res.json({
        mensaje: `Registrado T${proximaTemp} E${proximoEp}. ¡Serie completada!`,
        serieFinalizada: true,
        temporada_guardada: proximaTemp,
        episodio_guardado: proximoEp,
        visualizacion: resHistorial.rows[0],
      });
    }

    await pool.query(
      `INSERT INTO seguimiento_series (usuario_id, obra_id, activo, total_episodios_temporada, actualizado_en)
       VALUES ($1, $2, true, $3, CURRENT_TIMESTAMP)
       ON CONFLICT (usuario_id, obra_id) 
       DO UPDATE SET 
         activo = true, 
         total_episodios_temporada = COALESCE($3, seguimiento_series.total_episodios_temporada),
         actualizado_en = CURRENT_TIMESTAMP;`,
      [usuario_id, obra_id, totalCapsTemp]
    );

    res.json({
      mensaje: `Registrado T${proximaTemp} E${proximoEp}`,
      serieFinalizada: false,
      temporada_guardada: proximaTemp,
      episodio_guardado: proximoEp,
      visualizacion: resHistorial.rows[0],
    });
  } catch (error) {
    console.error('Error al avanzar capítulo:', error.message);
    res.status(500).json({ error: 'Error al avanzar episodio' });
  }
};

// DELETE / ARCHIVAR: Quitar serie de "Viendo Actualmente"
const descartarDeViendo = async (req, res) => {
  const usuario_id = resolverUsuarioId(req);
  const { obra_id } = req.params;

  if (!usuario_id || !obra_id) {
    return res.status(400).json({ error: 'Usuario u obra no especificados' });
  }

  try {
    const query = `
      INSERT INTO seguimiento_series (usuario_id, obra_id, activo, actualizado_en)
      VALUES ($1, $2, false, CURRENT_TIMESTAMP)
      ON CONFLICT (usuario_id, obra_id)
      DO UPDATE SET activo = false, actualizado_en = CURRENT_TIMESTAMP;
    `;
    await pool.query(query, [usuario_id, obra_id]);

    res.json({ mensaje: 'Serie retirada de Viendo Actualmente. Tu historial permanece intacto.' });
  } catch (error) {
    console.error('Error al descartar serie:', error.message);
    res.status(500).json({ error: 'Error al quitar la serie de seguimiento' });
  }
};

module.exports = {
  obtenerViendoActualmente,
  avanzarCapitulo,
  descartarDeViendo,
};