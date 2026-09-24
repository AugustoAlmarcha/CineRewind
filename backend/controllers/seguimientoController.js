const pool = require('../config/db');

// GET: Series activas para el carrusel "Viendo Actualmente"
const obtenerViendoActualmente = async (req, res) => {
  const { usuario_id } = req.params;
  const apiKey = process.env.TMDB_API_KEY;

  try {
    const query = `
      WITH ultimos_vistos AS (
        SELECT 
          s.obra_id,
          MAX(h.id) AS max_historial_id
        FROM seguimiento_series s
        INNER JOIN historial_visualizaciones h 
          ON h.obra_id = s.obra_id AND h.usuario_id = s.usuario_id
        WHERE s.usuario_id = $1 AND s.activo = true
        GROUP BY s.obra_id
      )
      SELECT 
        u.obra_id,
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

    const resultado = await pool.query(query, [usuario_id]);
    const series = resultado.rows;

    const seriesProcesadas = await Promise.all(
      series.map(async (serie) => {
        let sigTemp = serie.temporada_actual;
        let sigEp = parseInt(serie.episodio_actual, 10) + 1;
        let posterTemporada = null;

        try {
          const resp = await fetch(
            `https://api.themoviedb.org/3/tv/${serie.tmdb_id}/season/${serie.temporada_actual}?api_key=${apiKey}&language=es-MX`
          );
          if (resp.ok) {
            const data = await resp.json();
            const totalCaps = data.episodes ? data.episodes.length : null;
            if (data.poster_path) {
              posterTemporada = `https://image.tmdb.org/t/p/w500${data.poster_path}`;
            }

            if (totalCaps && sigEp > totalCaps) {
              sigTemp = serie.temporada_actual + 1;
              sigEp = 1;
            }
          }
        } catch (err) {
          console.warn('Error verificando límites en TMDb:', err.message);
        }

        let fotoSiguiente = null;
        try {
          const respEp = await fetch(
            `https://api.themoviedb.org/3/tv/${serie.tmdb_id}/season/${sigTemp}/episode/${sigEp}?api_key=${apiKey}&language=es-MX`
          );
          if (respEp.ok) {
            const dataEp = await respEp.json();
            if (dataEp.still_path) {
              fotoSiguiente = `https://image.tmdb.org/t/p/w780${dataEp.still_path}`;
            }
          }
        } catch (err) {
          console.warn('Error trayendo foto del siguiente episodio:', err.message);
        }

        // Normalizar póster principal si viene en ruta relativa
        let posterPrincipal = serie.poster_path;
        if (posterPrincipal && !posterPrincipal.startsWith('http')) {
          posterPrincipal = `https://image.tmdb.org/t/p/w500${posterPrincipal.startsWith('/') ? posterPrincipal : `/${posterPrincipal}`}`;
        }

        return {
          ...serie,
          poster_path: posterPrincipal,
          poster_temporada: posterTemporada || posterPrincipal,
          temporada: serie.temporada_actual,
          episodio: serie.episodio_actual,
          siguiente_temporada: sigTemp,
          siguiente_episodio: sigEp,
          foto_siguiente: fotoSiguiente || posterPrincipal,
        };
      })
    );

    res.json(seriesProcesadas);
  } catch (error) {
    console.error('Error al obtener series en curso:', error.message);
    res.status(500).json({ error: 'Error al consultar series activas' });
  }
};

// POST: Avanzar capítulo verificando límites de temporada con TMDb
const avanzarCapitulo = async (req, res) => {
  const { usuario_id, obra_id, temporada, episodio_actual, plataforma } = req.body;

  if (!usuario_id || !obra_id || !temporada || episodio_actual === undefined) {
    return res.status(400).json({ error: 'Faltan parámetros obligatorios' });
  }

  const tempNum = parseInt(temporada, 10);
  const epNum = parseInt(episodio_actual, 10);
  const apiKey = process.env.TMDB_API_KEY;

  try {
    const resObra = await pool.query('SELECT tmdb_id FROM obras_catalogo WHERE id = $1', [obra_id]);
    if (resObra.rowCount === 0) return res.status(404).json({ error: 'Obra no encontrada' });
    const { tmdb_id } = resObra.rows[0];

    let totalCaps = null;
    try {
      const respTemp = await fetch(`https://api.themoviedb.org/3/tv/${tmdb_id}/season/${tempNum}?api_key=${apiKey}&language=es-MX`);
      if (respTemp.ok) {
        const dataTemp = await respTemp.json();
        totalCaps = dataTemp.episodes?.length || null;
      }
    } catch (e) {
      console.warn('Error validando temporada:', e.message);
    }

    let proximaTemp = tempNum;
    let proximoEp = epNum + 1;

    if (totalCaps && proximoEp > totalCaps) {
      let totalTemps = null;
      try {
        const respSerie = await fetch(`https://api.themoviedb.org/3/tv/${tmdb_id}?api_key=${apiKey}&language=es-MX`);
        if (respSerie.ok) {
          const dataS = await respSerie.json();
          totalTemps = dataS.number_of_seasons;
        }
      } catch (e) {
        console.warn('Error validando temporadas totales:', e.message);
      }

      if (totalTemps && tempNum < totalTemps) {
        proximaTemp = tempNum + 1;
        proximoEp = 1;
      } else {
        await pool.query('UPDATE seguimiento_series SET activo = false WHERE usuario_id = $1 AND obra_id = $2;', [usuario_id, obra_id]);
        return res.json({ mensaje: 'Serie completada', serieFinalizada: true });
      }
    }

    let fotoEp = null;
    try {
      const respEp = await fetch(`https://api.themoviedb.org/3/tv/${tmdb_id}/season/${proximaTemp}/episode/${proximoEp}?api_key=${apiKey}&language=es-MX`);
      if (respEp.ok) {
        const dataEp = await respEp.json();
        if (dataEp.still_path) fotoEp = `https://image.tmdb.org/t/p/w780${dataEp.still_path}`;
      }
    } catch (e) {
      console.warn('Error obteniendo foto del episodio:', e.message);
    }

    // Evitar duplicar en la misma fecha
    const existeHoy = await pool.query(
      `SELECT id FROM historial_visualizaciones 
       WHERE usuario_id = $1 AND obra_id = $2 AND temporada = $3 AND episodio = $4 AND fecha_visto = CURRENT_DATE`,
      [usuario_id, obra_id, proximaTemp, proximoEp]
    );

    let registroVisualizacion = null;
    if (existeHoy.rows.length === 0) {
      const insertQuery = `
        INSERT INTO historial_visualizaciones 
          (usuario_id, obra_id, temporada, episodio, plataforma, fecha_visto, foto_episodio)
        VALUES ($1, $2, $3, $4, $5, CURRENT_DATE, $6)
        RETURNING *;
      `;
      const resHistorial = await pool.query(insertQuery, [
        usuario_id,
        obra_id,
        proximaTemp,
        proximoEp,
        plataforma || null,
        fotoEp,
      ]);
      registroVisualizacion = resHistorial.rows[0];
    } else {
      registroVisualizacion = existeHoy.rows[0];
    }

    await pool.query(
      `INSERT INTO seguimiento_series (usuario_id, obra_id, activo)
       VALUES ($1, $2, true)
       ON CONFLICT (usuario_id, obra_id) DO UPDATE SET activo = true;`,
      [usuario_id, obra_id]
    );

    res.json({
      mensaje: `Registrado T${proximaTemp} E${proximoEp}`,
      serieFinalizada: false,
      visualizacion: registroVisualizacion,
    });
  } catch (error) {
    console.error('Error al avanzar capítulo:', error.message);
    res.status(500).json({ error: 'Error al avanzar episodio' });
  }
};

// DELETE / ARCHIVAR: Quita la serie de "Viendo Actualmente" sin borrar nada del historial
const descartarDeViendo = async (req, res) => {
  const { usuario_id, obra_id } = req.params;

  try {
    const query = `
      INSERT INTO seguimiento_series (usuario_id, obra_id, activo)
      VALUES ($1, $2, false)
      ON CONFLICT (usuario_id, obra_id)
      DO UPDATE SET activo = false;
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