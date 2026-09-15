const pool = require('../config/db');
const axios = require('axios');

// POST: Registrar una película o serie individual
const registrarVisualizacion = async (req, res) => {
  const {
    usuario_id,
    tmdb_id,
    tipo,
    titulo,
    poster_path,
    fecha_visto,
    plataforma,
    pais,
    temporada,
    episodio,
  } = req.body;

  if (!usuario_id || !tmdb_id || !tipo || !titulo || !fecha_visto) {
    return res.status(400).json({ error: 'Faltan campos obligatorios' });
  }

  // Normalizar el póster para que siempre tenga la URL completa de TMDb
  const posterNormalizado = poster_path
    ? (poster_path.startsWith('http') ? poster_path : `https://image.tmdb.org/t/p/w500${poster_path.startsWith('/') ? poster_path : `/${poster_path}`}`)
    : null;

  try {
    // 1. Obtener o registrar la obra en el catálogo local
    const queryObra = `
      INSERT INTO obras_catalogo (tmdb_id, tipo, titulo, poster_path)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (tmdb_id) DO UPDATE SET 
        titulo = EXCLUDED.titulo,
        poster_path = COALESCE(EXCLUDED.poster_path, obras_catalogo.poster_path)
      RETURNING id;
    `;
    const resObra = await pool.query(queryObra, [
      tmdb_id,
      tipo.toLowerCase(),
      titulo,
      posterNormalizado,
    ]);
    const obra_id = resObra.rows[0].id;

    // 2. Control de duplicados
    if (tipo.toLowerCase() === 'serie') {
      const existeCap = await pool.query(
        `SELECT id FROM historial_visualizaciones 
         WHERE usuario_id = $1 AND obra_id = $2 AND temporada = $3 AND episodio = $4`,
        [usuario_id, obra_id, temporada, episodio]
      );
      if (existeCap.rows.length > 0) {
        return res.status(409).json({ 
          error: `Ya tienes registrado el capítulo ${episodio} de la temporada ${temporada}.` 
        });
      }
    } else {
      const existePeli = await pool.query(
        `SELECT id FROM historial_visualizaciones 
         WHERE usuario_id = $1 AND obra_id = $2 AND fecha_visto = $3`,
        [usuario_id, obra_id, fecha_visto]
      );
      if (existePeli.rows.length > 0) {
        return res.status(409).json({ 
          error: 'Esta película ya fue registrada en esa fecha.' 
        });
      }
    }

    // 3. Guardar en el historial
    const queryHistorial = `
      INSERT INTO historial_visualizaciones 
        (usuario_id, obra_id, fecha_visto, plataforma, pais, temporada, episodio)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *;
    `;
    const resHistorial = await pool.query(queryHistorial, [
      usuario_id,
      obra_id,
      fecha_visto,
      plataforma || null,
      pais || null,
      temporada || null,
      episodio || null,
    ]);

    // 4. Si es serie, asegurar que quede activa en seguimiento
    if (tipo.toLowerCase() === 'serie') {
      await pool.query(
        `INSERT INTO seguimiento_series (usuario_id, obra_id, activo)
         VALUES ($1, $2, true)
         ON CONFLICT (usuario_id, obra_id) DO UPDATE SET activo = true;`,
        [usuario_id, obra_id]
      );
    }

    res.status(201).json({
      mensaje: 'Visualización guardada con éxito',
      registro: resHistorial.rows[0],
    });
  } catch (error) {
    console.error('Error al registrar:', error.message);
    res.status(500).json({ error: 'Error al registrar la visualización' });
  }
};

// GET: Series activas para el carrusel "Viendo Actualmente" (excluye las descartadas sin borrar historial)
const obtenerViendoActualmente = async (req, res) => {
  const { usuario_id } = req.params;
  const apiKey = process.env.TMDB_API_KEY;

  try {
    // 1. Obtener el registro más reciente sin ambigüedades por fecha
    const query = `
      SELECT 
        s.obra_id,
        o.tmdb_id,
        o.titulo,
        o.poster_path,
        h.temporada AS temporada_actual,
        h.episodio AS episodio_actual,
        h.plataforma
      FROM seguimiento_series s
      INNER JOIN obras_catalogo o ON s.obra_id = o.id
      INNER JOIN historial_visualizaciones h ON h.id = (
        SELECT MAX(id) 
        FROM historial_visualizaciones 
        WHERE obra_id = s.obra_id AND usuario_id = s.usuario_id
      )
      WHERE s.usuario_id = $1 AND s.activo = true;
    `;

    const resultado = await pool.query(query, [usuario_id]);
    const series = resultado.rows;

    // 2. Determinar próximo episodio y traer su still_path específico
    const seriesProcesadas = await Promise.all(
      series.map(async (serie) => {
        let sigTemp = serie.temporada_actual;
        let sigEp = serie.episodio_actual + 1;

        try {
          const resp = await fetch(
            `https://api.themoviedb.org/3/tv/${serie.tmdb_id}/season/${serie.temporada_actual}?api_key=${apiKey}&language=es-MX`
          );
          if (resp.ok) {
            const data = await resp.json();
            const totalCaps = data.episodes ? data.episodes.length : null;

            if (totalCaps && sigEp > totalCaps) {
              sigTemp = serie.temporada_actual + 1;
              sigEp = 1;
            }
          }
        } catch (err) {
          console.warn('Error verificando límites en TMDb:', err.message);
        }

        // Consultar la foto del episodio que está por verse
        let fotoSiguiente = null;
        try {
          const respEp = await fetch(
            `https://api.themoviedb.org/3/tv/${serie.tmdb_id}/season/${sigTemp}/episode/${sigEp}?api_key=${apiKey}&language=es-MX`
          );
          if (respEp.ok) {
            const dataEp = await respEp.json();
            if (dataEp.still_path) {
              fotoSiguiente = `https://image.tmdb.org/t/p/w500${dataEp.still_path}`;
            }
          }
        } catch (err) {
          console.warn('Error trayendo foto del siguiente episodio:', err.message);
        }

        return {
          ...serie,
          temporada: serie.temporada_actual,
          episodio: serie.episodio_actual,
          siguiente_temporada: sigTemp,
          siguiente_episodio: sigEp,
          foto_siguiente: fotoSiguiente || serie.poster_path,
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

    // Verificar si se completó la temporada
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

    // Traer foto del capítulo a guardar
    let fotoEp = null;
    try {
      const respEp = await fetch(`https://api.themoviedb.org/3/tv/${tmdb_id}/season/${proximaTemp}/episode/${proximoEp}?api_key=${apiKey}&language=es-MX`);
      if (respEp.ok) {
        const dataEp = await respEp.json();
        if (dataEp.still_path) fotoEp = `https://image.tmdb.org/t/p/w500${dataEp.still_path}`;
      }
    } catch (e) {
      console.warn('Error obteniendo foto del episodio:', e.message);
    }

    // Insertar en historial
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

    await pool.query(
      `INSERT INTO seguimiento_series (usuario_id, obra_id, activo)
       VALUES ($1, $2, true)
       ON CONFLICT (usuario_id, obra_id) DO UPDATE SET activo = true;`,
      [usuario_id, obra_id]
    );

    res.json({
      mensaje: `Registrado T${proximaTemp} E${proximoEp}`,
      serieFinalizada: false,
      visualizacion: resHistorial.rows[0],
    });
  } catch (error) {
    console.error('Error al avanzar capítulo:', error.message);
    res.status(500).json({ error: 'Error al avanzar episodio' });
  }
};

// GET: Timeline cronológico con filtro opcional (?tipo=pelicula|serie)
const obtenerTimeline = async (req, res) => {
  const { usuario_id } = req.params;
  const { tipo } = req.query;
  const apiKey = process.env.TMDB_API_KEY;

  try {
    let query = `
      SELECT 
        h.id AS visualizacion_id,
        h.usuario_id,
        h.fecha_visto,
        h.plataforma,
        h.temporada,
        h.episodio,
        h.calificacion,
        h.resenia,
        h.foto_episodio,
        o.id AS obra_id,
        o.tmdb_id,
        o.tipo,
        o.titulo,
        COALESCE(h.foto_episodio, o.poster_path, '') AS poster_path,
        o.poster_path AS poster_obra
      FROM historial_visualizaciones h
      INNER JOIN obras_catalogo o ON h.obra_id = o.id
      WHERE h.usuario_id = $1
    `;

    const params = [usuario_id];

    if (tipo && (tipo === 'pelicula' || tipo === 'serie')) {
      query += ` AND o.tipo = $2`;
      params.push(tipo);
    }

    query += ` ORDER BY h.fecha_visto DESC, h.creado_en DESC, h.id DESC;`;

    const resultado = await pool.query(query, params);
    const registros = resultado.rows;

    // Cache local en memoria para no saturar TMDb con peticiones repetidas
    const cacheSeries = new Map();

    const timelineConHitos = await Promise.all(
      registros.map(async (row) => {
        let esFinalTemporada = false;
        let esFinalSerie = false;

        if (row.tipo === 'serie' && row.tmdb_id && row.temporada && row.episodio) {
          const cacheKey = `${row.tmdb_id}_t${row.temporada}`;

          let infoTemp = cacheSeries.get(cacheKey);
          if (!infoTemp) {
            try {
              // Consultar temporada
              const rTemp = await fetch(`https://api.themoviedb.org/3/tv/${row.tmdb_id}/season/${row.temporada}?api_key=${apiKey}&language=es-MX`);
              const dTemp = rTemp.ok ? await rTemp.json() : null;

              // Consultar serie general
              const rSerie = await fetch(`https://api.themoviedb.org/3/tv/${row.tmdb_id}?api_key=${apiKey}&language=es-MX`);
              const dSerie = rSerie.ok ? await rSerie.json() : null;

              infoTemp = {
                totalEpisodios: dTemp?.episodes ? dTemp.episodes.length : null,
                totalTemporadas: dSerie?.number_of_seasons || null,
              };
              cacheSeries.set(cacheKey, infoTemp);
            } catch (e) {
              infoTemp = { totalEpisodios: null, totalTemporadas: null };
            }
          }

          if (infoTemp.totalEpisodios && row.episodio >= infoTemp.totalEpisodios) {
            esFinalTemporada = true;
            if (infoTemp.totalTemporadas && row.temporada >= infoTemp.totalTemporadas) {
              esFinalSerie = true;
            }
          }
        }

        // Formatear imágenes a URLs completas
        let poster = row.poster_path;
        if (poster && !poster.startsWith('http')) {
          poster = `https://image.tmdb.org/t/p/w500${poster.startsWith('/') ? poster : `/${poster}`}`;
        }

        let posterObra = row.poster_obra;
        if (posterObra && !posterObra.startsWith('http')) {
          posterObra = `https://image.tmdb.org/t/p/w500${posterObra.startsWith('/') ? posterObra : `/${posterObra}`}`;
        }

        return {
          ...row,
          poster_path: poster,
          poster_obra: posterObra,
          es_final_temporada: esFinalTemporada,
          es_final_serie: esFinalSerie,
        };
      })
    );

    res.json(timelineConHitos);
  } catch (error) {
    console.error('Error al obtener timeline:', error.message);
    res.status(500).json({ error: 'Error al consultar el timeline' });
  }
};

// DELETE: Eliminar una fila individual del historial por su ID
const eliminarVisualizacion = async (req, res) => {
  const { id } = req.params;
  try {
    const resultado = await pool.query(
      'DELETE FROM historial_visualizaciones WHERE id = $1 RETURNING *;',
      [id]
    );
    if (resultado.rowCount === 0) {
      return res.status(404).json({ error: 'El registro no existe' });
    }
    res.json({ mensaje: 'Visualización eliminada', registro: resultado.rows[0] });
  } catch (error) {
    console.error('Error al eliminar visualización:', error.message);
    res.status(500).json({ error: 'Error al eliminar de la base de datos' });
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

// POST: Registrar lote de capítulos en masa (Batch Insert)
const registrarLoteVisualizaciones = async (req, res) => {
  // Ahora también recibimos 'fotos_episodios': un objeto clave-valor { "1": "https://...", "2": "https://..." }
  const { usuario_id, tmdb_id, titulo, poster_path, plataforma, temporada, episodios, fecha_visto, fotos_episodios } = req.body;

  if (!usuario_id || !tmdb_id || !titulo || !temporada || !Array.isArray(episodios) || episodios.length === 0) {
    return res.status(400).json({ error: 'Faltan datos requeridos para el registro múltiple' });
  }

  const posterNormalizado = poster_path
    ? (poster_path.startsWith('http') ? poster_path : `https://image.tmdb.org/t/p/w500${poster_path.startsWith('/') ? poster_path : `/${poster_path}`}`)
    : null;

  try {
    const queryObra = `
      INSERT INTO obras_catalogo (tmdb_id, tipo, titulo, poster_path)
      VALUES ($1, 'serie', $2, $3)
      ON CONFLICT (tmdb_id) DO UPDATE SET 
        titulo = EXCLUDED.titulo,
        poster_path = COALESCE(EXCLUDED.poster_path, obras_catalogo.poster_path)
      RETURNING id;
    `;
    const resObra = await pool.query(queryObra, [tmdb_id, titulo, posterNormalizado]);
    const obra_id = resObra.rows[0].id;

    for (const ep of episodios) {
      // Tomamos la captura específica si viene provista
      const fotoEp = fotos_episodios && fotos_episodios[ep] ? fotos_episodios[ep] : null;

      await pool.query(
        `INSERT INTO historial_visualizaciones 
          (usuario_id, obra_id, fecha_visto, plataforma, temporada, episodio, foto_episodio)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT DO NOTHING;`,
        [usuario_id, obra_id, fecha_visto, plataforma || null, temporada, ep, fotoEp]
      );
    }

    const ultimoEpisodio = Math.max(...episodios);
    await pool.query(
      `INSERT INTO seguimiento_series (usuario_id, obra_id, activo)
       VALUES ($1, $2, true)
       ON CONFLICT (usuario_id, obra_id) DO UPDATE SET activo = true;`,
      [usuario_id, obra_id]
    );

    res.status(201).json({ 
      mensaje: `Se guardaron ${episodios.length} capítulos exitosamente.`,
      ultimo_capitulo: ultimoEpisodio 
    });
  } catch (error) {
    console.error('Error al registrar lote de episodios:', error.message);
    res.status(500).json({ error: 'Error al registrar capítulos múltiples' });
  }
};

// GET: Obtener los números de episodios ya vistos de una temporada para un usuario
const obtenerEpisodiosVistosTemporada = async (req, res) => {
  const { usuario_id, tmdb_id, temporada } = req.params;

  try {
    const query = `
      SELECT h.episodio 
      FROM historial_visualizaciones h
      INNER JOIN obras_catalogo o ON h.obra_id = o.id
      WHERE h.usuario_id = $1 AND o.tmdb_id = $2 AND h.temporada = $3;
    `;
    const resultado = await pool.query(query, [usuario_id, tmdb_id, temporada]);
    const vistos = resultado.rows.map((r) => r.episodio);
    res.json(vistos);
  } catch (error) {
    console.error('Error al consultar episodios vistos:', error.message);
    res.status(500).json({ error: 'Error al consultar episodios vistos' });
  }
};

// PATCH: Guardar o actualizar la calificación y reseña de un registro del timeline
const actualizarReseniaYCalificacion = async (req, res) => {
  const { id } = req.params;
  const { calificacion, resenia } = req.body;

  try {
    const query = `
      UPDATE historial_visualizaciones
      SET calificacion = $1, resenia = $2
      WHERE id = $3
      RETURNING *;
    `;
    const resultado = await pool.query(query, [
      calificacion !== undefined ? calificacion : null,
      resenia !== undefined ? resenia : null,
      id,
    ]);

    if (resultado.rowCount === 0) {
      return res.status(404).json({ error: 'Registro no encontrado en el historial' });
    }

    res.json({
      mensaje: 'Opinión guardada exitosamente',
      registro: resultado.rows[0],
    });
  } catch (error) {
    console.error('Error al guardar reseña:', error.message);
    res.status(500).json({ error: 'Error al actualizar reseña y calificación' });
  }
};

// DELETE: Eliminar un lote de registros por sus IDs
const eliminarLoteVisualizaciones = async (req, res) => {
  const { ids } = req.body;

  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: 'Debes enviar un arreglo de IDs a eliminar' });
  }

  try {
    // Usamos ANY($1) para borrar todos los IDs del array en una sola consulta SQL
    const resultado = await pool.query(
      'DELETE FROM historial_visualizaciones WHERE id = ANY($1::int[]) RETURNING id;',
      [ids]
    );

    res.json({
      mensaje: `Se eliminaron ${resultado.rowCount} registros correctamente`,
      eliminados: resultado.rows.map((r) => r.id),
    });
  } catch (error) {
    console.error('Error al eliminar lote de visualizaciones:', error.message);
    res.status(500).json({ error: 'Error interno al eliminar registros en lote' });
  }
};

module.exports = {
  registrarVisualizacion,
  obtenerViendoActualmente,
  avanzarCapitulo,
  descartarDeViendo,
  obtenerTimeline,
  eliminarVisualizacion,
  registrarLoteVisualizaciones,
  obtenerEpisodiosVistosTemporada,
  actualizarReseniaYCalificacion,
  eliminarLoteVisualizaciones
};