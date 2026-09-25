const pool = require('../config/db');

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

// Caché en memoria para validaciones
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

const resolverUsuarioId = (req) => {
  return req.usuario?.id || req.params?.usuario_id || req.body?.usuario_id;
};

// GET: Carga INSTANTÁNEA con detección real de fin de temporada
const obtenerViendoActualmente = async (req, res) => {
  const usuario_id = resolverUsuarioId(req);

  if (!usuario_id) {
    return res.status(400).json({ error: 'ID de usuario requerido' });
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
        h.foto_episodio,
        h.id AS ultimo_historial_id
      FROM ultimos_vistos u
      INNER JOIN historial_visualizaciones h ON h.id = u.max_historial_id
      INNER JOIN obras_catalogo o ON o.id = u.obra_id
      ORDER BY u.max_historial_id DESC;
    `;

    const resultado = await pool.query(query, [usuario_id]);

    const seriesProcesadas = resultado.rows.map((serie) => {
      let posterPrincipal = serie.poster_path;
      if (posterPrincipal && !posterPrincipal.startsWith('http')) {
        posterPrincipal = `https://image.tmdb.org/t/p/w500${posterPrincipal.startsWith('/') ? posterPrincipal : `/${posterPrincipal}`}`;
      }

      const tempActual = parseInt(serie.temporada_actual, 10);
      const epActual = parseInt(serie.episodio_actual, 10);
      const totalCaps = serie.total_episodios_temporada ? parseInt(serie.total_episodios_temporada, 10) : null;

      let sigTemp = tempActual;
      let sigEp = epActual + 1;

      // Si alcanzó el final de la temporada, la tarjeta propone T+1 E1
      if (totalCaps && epActual >= totalCaps) {
        sigTemp = tempActual + 1;
        sigEp = 1;
      }

      return {
        ...serie,
        poster_path: posterPrincipal,
        poster_temporada: posterPrincipal,
        temporada: tempActual,
        episodio: epActual,
        siguiente_temporada: sigTemp,
        siguiente_episodio: sigEp,
        foto_siguiente: serie.foto_episodio || posterPrincipal,
      };
    });

    res.json(seriesProcesadas);
  } catch (error) {
    console.error('Error al obtener series en curso:', error.message);
    res.status(500).json({ error: 'Error al consultar series activas' });
  }
};

// POST: Avanzar capítulo cacheando el total de episodios
const avanzarCapitulo = async (req, res) => {
  const usuario_id = resolverUsuarioId(req);
  const { obra_id, temporada, episodio_actual, plataforma } = req.body;

  if (!usuario_id || !obra_id || !temporada || episodio_actual === undefined) {
    return res.status(400).json({ error: 'Faltan parámetros obligatorios' });
  }

  let tempNum = parseInt(temporada, 10);
  let epNum = parseInt(episodio_actual, 10);
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

    // Obtener episodios ya vistos en este ciclo
    const resVistos = await pool.query(
      `SELECT DISTINCT episodio FROM historial_visualizaciones 
       WHERE usuario_id = $1 
         AND obra_id = $2 
         AND temporada = $3
         AND creado_en >= (COALESCE($4, '1970-01-01'::timestamp) - INTERVAL '2 minutes')`,
      [usuario_id, obra_id, tempNum, fechaReinicio]
    );
    const setVistos = new Set(resVistos.rows.map((r) => parseInt(r.episodio, 10)));

    let totalCaps = null;
    if (apiKey) {
      const urlTemp = `${TMDB_BASE_URL}/tv/${tmdb_id}/season/${tempNum}?api_key=${apiKey}&language=es-MX`;
      const dataTemp = await consultarTMDBConTimeout(urlTemp, 1500);
      if (dataTemp) totalCaps = dataTemp.episodes?.length || null;
    }

    let proximaTemp = tempNum;
    let proximoEp = epNum + 1;

    // Saltar huecos ya registrados
    while (setVistos.has(proximoEp) && (!totalCaps || proximoEp <= totalCaps)) {
      proximoEp++;
    }

    // Salto de temporada
    if (totalCaps && proximoEp > totalCaps) {
      let totalTemps = null;
      if (apiKey) {
        const urlSerie = `${TMDB_BASE_URL}/tv/${tmdb_id}?api_key=${apiKey}&language=es-MX`;
        const dataS = await consultarTMDBConTimeout(urlSerie, 1500);
        if (dataS) totalTemps = dataS.number_of_seasons;
      }

      if (totalTemps && tempNum < totalTemps) {
        proximaTemp = tempNum + 1;
        proximoEp = 1;

        // Consultamos el total de capítulos de la NUEVA temporada para cachearlo
        if (apiKey) {
          const urlNuevaTemp = `${TMDB_BASE_URL}/tv/${tmdb_id}/season/${proximaTemp}?api_key=${apiKey}&language=es-MX`;
          const dataNueva = await consultarTMDBConTimeout(urlNuevaTemp, 1500);
          totalCaps = dataNueva?.episodes?.length || null;
        }

        const resVistosNueva = await pool.query(
          `SELECT DISTINCT episodio FROM historial_visualizaciones 
           WHERE usuario_id = $1 
             AND obra_id = $2 
             AND temporada = $3
             AND creado_en >= (COALESCE($4, '1970-01-01'::timestamp) - INTERVAL '2 minutes')`,
          [usuario_id, obra_id, proximaTemp, fechaReinicio]
        );
        const setVistosNueva = new Set(resVistosNueva.rows.map((r) => parseInt(r.episodio, 10)));
        while (setVistosNueva.has(proximoEp)) {
          proximoEp++;
        }
      } else {
        await pool.query(
          'UPDATE seguimiento_series SET activo = false, actualizado_en = CURRENT_TIMESTAMP WHERE usuario_id = $1 AND obra_id = $2;',
          [usuario_id, obra_id]
        );
        return res.json({ mensaje: 'Serie completada', serieFinalizada: true });
      }
    }

    let fotoEp = null;
    if (apiKey) {
      const urlEpisodio = `${TMDB_BASE_URL}/tv/${tmdb_id}/season/${proximaTemp}/episode/${proximoEp}?api_key=${apiKey}&language=es-MX`;
      const dataEp = await consultarTMDBConTimeout(urlEpisodio, 1200);
      if (dataEp?.still_path) {
        fotoEp = `https://image.tmdb.org/t/p/w780${dataEp.still_path}`;
      }
    }

// Es final de temporada si el capítulo guardado es igual al total de capítulos de esa temporada
    const esFinTemporada = Boolean(totalCaps && proximoEp === totalCaps);

    const insertQuery = `
      INSERT INTO historial_visualizaciones 
        (usuario_id, obra_id, temporada, episodio, plataforma, fecha_visto, foto_episodio, es_final_temporada)
      VALUES ($1, $2, $3, $4, $5, CURRENT_DATE, $6, $7)
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
    ]);

    // Guardamos totalCaps en seguimiento_series para que las consultas posteriores no tengan que pedirlo a TMDb
    await pool.query(
      `INSERT INTO seguimiento_series (usuario_id, obra_id, activo, total_episodios_temporada, actualizado_en)
       VALUES ($1, $2, true, $3, CURRENT_TIMESTAMP)
       ON CONFLICT (usuario_id, obra_id) 
       DO UPDATE SET 
         activo = true, 
         total_episodios_temporada = COALESCE($3, seguimiento_series.total_episodios_temporada),
         actualizado_en = CURRENT_TIMESTAMP;`,
      [usuario_id, obra_id, totalCaps]
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