const pool = require('../config/db');

// 1. GET: /api/covisualizaciones/pendientes
// Obtiene las invitaciones pendientes del usuario autenticado
const obtenerInvitacionesPendientes = async (req, res) => {
  const usuarioId = req.usuario?.id;
  if (!usuarioId) {
    return res.status(401).json({ error: 'Sesión no autorizada' });
  }

  try {
    const query = `
      SELECT 
        c.id AS covisualizacion_id,
        c.visualizacion_id,
        c.estado,
        c.creado_en,
        h.fecha_visto,
        h.plataforma,
        h.temporada,
        h.episodio,
        o.id AS obra_id,
        o.tmdb_id,
        o.tipo,
        o.titulo,
        o.poster_path,
        u.id AS anfitrion_id,
        u.nombre AS anfitrion_nombre,
        u.username AS anfitrion_username,
        u.avatar_url AS anfitrion_avatar
      FROM covisualizaciones c
      INNER JOIN historial_visualizaciones h ON c.visualizacion_id = h.id
      INNER JOIN obras_catalogo o ON h.obra_id = o.id
      INNER JOIN usuarios u ON h.usuario_id = u.id
      WHERE c.amigo_id = $1 AND c.estado = 'pendiente'
      ORDER BY c.creado_en DESC;
    `;

    const resultado = await pool.query(query, [usuarioId]);
    res.json(resultado.rows);
  } catch (error) {
    console.error('Error al obtener invitaciones pendientes:', error.message);
    res.status(500).json({ error: 'Error del servidor al obtener invitaciones' });
  }
};

// 2. PUT: /api/covisualizaciones/responder
// Acepta o rechaza la invitación. Si acepta, clona el registro en su historial
const responderInvitacion = async (req, res) => {
  const usuarioId = req.usuario?.id;
  const { covisualizacion_id, accion } = req.body; // accion: 'aceptar' | 'rechazar'

  if (!usuarioId) {
    return res.status(401).json({ error: 'Sesión no autorizada' });
  }

  if (!covisualizacion_id || !['aceptar', 'rechazar'].includes(accion)) {
    return res.status(400).json({ error: 'Parámetros inválidos' });
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Obtener la invitación y datos de la visualización original
    const invRes = await client.query(
      `SELECT c.id, c.visualizacion_id, c.estado, h.obra_id, h.fecha_visto, h.plataforma, 
              h.temporada, h.episodio, h.foto_episodio, h.es_final_temporada, o.tipo
       FROM covisualizaciones c
       INNER JOIN historial_visualizaciones h ON c.visualizacion_id = h.id
       INNER JOIN obras_catalogo o ON h.obra_id = o.id
       WHERE c.id = $1 AND c.amigo_id = $2
       FOR UPDATE`,
      [covisualizacion_id, usuarioId]
    );

    if (invRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Invitación no encontrada' });
    }

    const inv = invRes.rows[0];

    if (inv.estado !== 'pendiente') {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Esta invitación ya fue respondida' });
    }

    if (accion === 'rechazar') {
      await client.query(
        `UPDATE covisualizaciones SET estado = 'rechazada', actualizado_en = CURRENT_TIMESTAMP WHERE id = $1`,
        [covisualizacion_id]
      );
      await client.query('COMMIT');
      return res.json({ mensaje: 'Invitación rechazada' });
    }

    // Acción: Aceptar -> Clonar en el historial del amigo si no existe
    const fechaVistoLimpia = inv.fecha_visto ? String(inv.fecha_visto).split('T')[0] : null;

    const existeEnHistorial = await client.query(
      `SELECT id FROM historial_visualizaciones
       WHERE usuario_id = $1 AND obra_id = $2 
         AND COALESCE(temporada, 0) = COALESCE($3, 0)
         AND COALESCE(episodio, 0) = COALESCE($4, 0)
         AND fecha_visto = $5`,
      [usuarioId, inv.obra_id, inv.temporada, inv.episodio, fechaVistoLimpia]
    );

    let nuevoRegistroId;

    if (existeEnHistorial.rows.length === 0) {
      const nuevoHistorial = await client.query(
        `INSERT INTO historial_visualizaciones 
          (usuario_id, obra_id, fecha_visto, plataforma, temporada, episodio, foto_episodio, es_final_temporada)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING id`,
        [
          usuarioId,
          inv.obra_id,
          fechaVistoLimpia,
          inv.plataforma,
          inv.temporada,
          inv.episodio,
          inv.foto_episodio,
          inv.es_final_temporada,
        ]
      );
      nuevoRegistroId = nuevoHistorial.rows[0].id;
    } else {
      nuevoRegistroId = existeEnHistorial.rows[0].id;
    }

    // 1. Marcar la invitación original de Juan hacia Pepe como 'aceptada'
    await client.query(
      `UPDATE covisualizaciones SET estado = 'aceptada', actualizado_en = CURRENT_TIMESTAMP WHERE id = $1`,
      [covisualizacion_id]
    );

    // 2. Vincular al anfitrión (Juan) en el registro de Pepe como 'aceptada' (evita bucles y habilita la foto de Juan en el historial de Pepe)
    const anfitrionRes = await client.query(
      `SELECT usuario_id FROM historial_visualizaciones WHERE id = $1`,
      [inv.visualizacion_id]
    );
    const anfitrionId = anfitrionRes.rows[0]?.usuario_id;

    if (anfitrionId && nuevoRegistroId) {
      await client.query(
        `INSERT INTO covisualizaciones (visualizacion_id, amigo_id, estado)
         VALUES ($1, $2, 'aceptada')
         ON CONFLICT (visualizacion_id, amigo_id) 
         DO UPDATE SET estado = 'aceptada';`,
        [nuevoRegistroId, anfitrionId]
      );
    }

    // Si es serie, activar el seguimiento en el carrusel del amigo
    if (inv.tipo === 'serie') {
      await client.query(
        `INSERT INTO seguimiento_series (usuario_id, obra_id, activo, fecha_reinicio, actualizado_en)
         VALUES ($1, $2, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
         ON CONFLICT (usuario_id, obra_id) DO UPDATE SET
           activo = true,
           actualizado_en = CURRENT_TIMESTAMP;`,
        [usuarioId, inv.obra_id]
      );
    }

    await client.query('COMMIT');
    res.json({ mensaje: 'Visualización aceptada y agregada a tu historial', nuevoRegistroId });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error al responder invitación:', error.message);
    res.status(500).json({ error: 'Error del servidor al procesar la respuesta' });
  } finally {
    client.release();
  }
};

// 3. PUT: /api/covisualizaciones/responder-todas
// Acepta o rechaza todas las invitaciones pendientes en lote
const responderTodasInvitaciones = async (req, res) => {
  const usuarioId = req.usuario?.id;
  const { accion = 'aceptar' } = req.body;

  if (!usuarioId) {
    return res.status(401).json({ error: 'Sesión no autorizada' });
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const invRes = await client.query(
      `SELECT c.id, c.visualizacion_id, c.estado, h.obra_id, h.fecha_visto, h.plataforma, 
              h.temporada, h.episodio, h.foto_episodio, h.es_final_temporada, o.tipo
       FROM covisualizaciones c
       INNER JOIN historial_visualizaciones h ON c.visualizacion_id = h.id
       INNER JOIN obras_catalogo o ON h.obra_id = o.id
       WHERE c.amigo_id = $1 AND c.estado = 'pendiente'
       FOR UPDATE`,
      [usuarioId]
    );

    if (invRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.json({ mensaje: 'No hay invitaciones pendientes', procesadas: 0 });
    }

    if (accion === 'rechazar') {
      await client.query(
        `UPDATE covisualizaciones SET estado = 'rechazada', actualizado_en = CURRENT_TIMESTAMP
         WHERE amigo_id = $1 AND estado = 'pendiente'`,
        [usuarioId]
      );
      await client.query('COMMIT');
      return res.json({ mensaje: 'Todas las invitaciones fueron rechazadas', procesadas: invRes.rows.length });
    }

    // Aceptar todas las invitaciones
    for (const inv of invRes.rows) {
      const fechaVistoLimpia = inv.fecha_visto ? String(inv.fecha_visto).split('T')[0] : null;

      const existeEnHistorial = await client.query(
        `SELECT id FROM historial_visualizaciones
         WHERE usuario_id = $1 AND obra_id = $2 
           AND COALESCE(temporada, 0) = COALESCE($3, 0)
           AND COALESCE(episodio, 0) = COALESCE($4, 0)
           AND fecha_visto = $5`,
        [usuarioId, inv.obra_id, inv.temporada, inv.episodio, fechaVistoLimpia]
      );

      let nuevoRegistroId;
      if (existeEnHistorial.rows.length === 0) {
        const nuevoHistorial = await client.query(
          `INSERT INTO historial_visualizaciones 
            (usuario_id, obra_id, fecha_visto, plataforma, temporada, episodio, foto_episodio, es_final_temporada)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           RETURNING id`,
          [
            usuarioId,
            inv.obra_id,
            fechaVistoLimpia,
            inv.plataforma,
            inv.temporada,
            inv.episodio,
            inv.foto_episodio,
            inv.es_final_temporada,
          ]
        );
        nuevoRegistroId = nuevoHistorial.rows[0].id;
      } else {
        nuevoRegistroId = existeEnHistorial.rows[0].id;
      }

      await client.query(
        `UPDATE covisualizaciones SET estado = 'aceptada', actualizado_en = CURRENT_TIMESTAMP WHERE id = $1`,
        [inv.id]
      );

      const anfitrionRes = await client.query(
        `SELECT usuario_id FROM historial_visualizaciones WHERE id = $1`,
        [inv.visualizacion_id]
      );
      const anfitrionId = anfitrionRes.rows[0]?.usuario_id;

      if (anfitrionId && nuevoRegistroId) {
        await client.query(
          `INSERT INTO covisualizaciones (visualizacion_id, amigo_id, estado)
           VALUES ($1, $2, 'aceptada')
           ON CONFLICT (visualizacion_id, amigo_id) 
           DO UPDATE SET estado = 'aceptada';`,
          [nuevoRegistroId, anfitrionId]
        );
      }

      if (inv.tipo === 'serie') {
        await client.query(
          `INSERT INTO seguimiento_series (usuario_id, obra_id, activo, fecha_reinicio, actualizado_en)
           VALUES ($1, $2, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
           ON CONFLICT (usuario_id, obra_id) DO UPDATE SET
             activo = true,
             actualizado_en = CURRENT_TIMESTAMP;`,
          [usuarioId, inv.obra_id]
        );
      }
    }

    await client.query('COMMIT');
    res.json({ mensaje: `¡${invRes.rows.length} co-visiones aceptadas e incorporadas a tu historial!`, procesadas: invRes.rows.length });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error al responder todas las invitaciones:', error.message);
    res.status(500).json({ error: 'Error del servidor al procesar las respuestas' });
  } finally {
    client.release();
  }
};

// 4. POST: /api/covisualizaciones/desvincular-acompanante
// Desvincula todas las co-visualizaciones de un usuario con un acompañante (registrado o manual)
// IMPORTANTE: NO elimina los registros de historial de ningún usuario; solo elimina el vínculo de co-visión / visto_con_texto.
const desvincularAcompanante = async (req, res) => {
  const usuarioId = req.usuario?.id;
  if (!usuarioId) {
    return res.status(401).json({ error: 'Sesión no autorizada' });
  }

  const { amigo_id, username, tipo = 'registrado', nombre_manual } = req.body;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    let totalDesvinculados = 0;
    let nombreObjetivo = nombre_manual || username || 'el usuario';

    if (tipo === 'registrado' || amigo_id || username) {
      let resolvedAmigoId = amigo_id ? parseInt(amigo_id, 10) : null;
      let targetUsername = username ? String(username).replace(/^@/, '').trim() : null;

      if (!resolvedAmigoId && targetUsername) {
        const uRes = await client.query(
          'SELECT id, nombre, username FROM usuarios WHERE LOWER(username) = LOWER($1)',
          [targetUsername]
        );
        if (uRes.rows.length > 0) {
          resolvedAmigoId = uRes.rows[0].id;
          nombreObjetivo = uRes.rows[0].nombre || uRes.rows[0].username;
        }
      } else if (resolvedAmigoId) {
        const uRes = await client.query(
          'SELECT nombre, username FROM usuarios WHERE id = $1',
          [resolvedAmigoId]
        );
        if (uRes.rows.length > 0) {
          nombreObjetivo = uRes.rows[0].nombre || uRes.rows[0].username;
          if (!targetUsername) targetUsername = uRes.rows[0].username;
        }
      }

      if (resolvedAmigoId) {
        // 1. Eliminar vínculos en covisualizaciones donde la visualización pertenece al usuario actual y el amigo es resolvedAmigoId
        const delRes1 = await client.query(
          `DELETE FROM covisualizaciones 
           WHERE amigo_id = $1 
             AND visualizacion_id IN (
               SELECT id FROM historial_visualizaciones WHERE usuario_id = $2
             )`,
          [resolvedAmigoId, usuarioId]
        );
        totalDesvinculados += delRes1.rowCount || 0;

        // 2. Eliminar vínculos recíprocos en covisualizaciones donde la visualización pertenece al amigo y el amigo_id es usuarioId
        // (Nota: los registros de historial_visualizaciones de AMBOS usuarios se conservan 100%)
        await client.query(
          `DELETE FROM covisualizaciones 
           WHERE amigo_id = $1 
             AND visualizacion_id IN (
               SELECT id FROM historial_visualizaciones WHERE usuario_id = $2
             )`,
          [usuarioId, resolvedAmigoId]
        );

        // 3. Limpiar cualquier visto_con_texto residual en el historial de usuarioId que mencione al amigo
        if (targetUsername) {
          await client.query(
            `UPDATE historial_visualizaciones 
             SET visto_con_texto = NULL 
             WHERE usuario_id = $1 
               AND (
                 LOWER(TRIM(visto_con_texto)) = LOWER($2) 
                 OR LOWER(TRIM(visto_con_texto)) = LOWER($3)
               )`,
            [usuarioId, targetUsername, nombreObjetivo]
          );
        }
      }
    }

    // Si es tipo texto o se pasó un nombre_manual
    if (tipo === 'texto' || nombre_manual) {
      const targetNombre = String(nombre_manual || '').trim();
      if (targetNombre) {
        const selectManual = await client.query(
          `SELECT id, visto_con_texto FROM historial_visualizaciones 
           WHERE usuario_id = $1 AND visto_con_texto ILIKE $2`,
          [usuarioId, `%${targetNombre}%`]
        );

        for (const fila of selectManual.rows) {
          if (!fila.visto_con_texto) continue;
          const nombres = fila.visto_con_texto
            .split(',')
            .map((n) => n.trim())
            .filter(Boolean);
          const filtrados = nombres.filter(
            (n) => n.toLowerCase() !== targetNombre.toLowerCase()
          );
          const nuevoTexto = filtrados.length > 0 ? filtrados.join(', ') : null;

          await client.query(
            `UPDATE historial_visualizaciones SET visto_con_texto = $1 WHERE id = $2`,
            [nuevoTexto, fila.id]
          );
          totalDesvinculados += 1;
        }
      }
    }

    await client.query('COMMIT');
    res.json({
      ok: true,
      mensaje: `Se desvincularon las co-visualizaciones con ${nombreObjetivo}. Tus registros y los de ${nombreObjetivo} se mantienen guardados.`,
      total_desvinculados: totalDesvinculados,
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error al desvincular acompañante:', error.message);
    res.status(500).json({ error: 'Error del servidor al desvincular co-visualizaciones' });
  } finally {
    client.release();
  }
};

module.exports = {
  obtenerInvitacionesPendientes,
  responderInvitacion,
  responderTodasInvitaciones,
  desvincularAcompanante,
};