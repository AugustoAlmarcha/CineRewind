const pool = require('../config/db');

// 1. GET: /api/amigos/buscar?q=termino
// Busca usuarios por username o email, omitiéndose a sí mismo y devolviendo el estado de relación
const buscarUsuarios = async (req, res) => {
  const usuarioId = req.usuario?.id;
  const { q } = req.query;

  if (!usuarioId) {
    return res.status(401).json({ error: 'Sesión no autorizada' });
  }

  if (!q || !q.trim()) {
    return res.json([]);
  }

  try {
    const termino = `%${q.trim().toLowerCase()}%`;

    const query = `
      SELECT 
        u.id,
        u.nombre,
        u.username,
        u.avatar_url,
        u.biografia,
        CASE
          -- Si existe un registro aceptado en cualquier dirección:
          WHEN a.estado = 'aceptada' THEN 'amigos'
          -- Si yo envié la solicitud y sigue pendiente:
          WHEN a.estado = 'pendiente' AND a.remitente_id = $1 THEN 'solicitud_enviada'
          -- Si la otra persona me envió la solicitud y está pendiente:
          WHEN a.estado = 'pendiente' AND a.destinatario_id = $1 THEN 'solicitud_recibida'
          -- Si no hay ningún vínculo:
          ELSE 'ninguno'
        END AS estado_relacion,
        a.id AS amistad_id
      FROM usuarios u
      LEFT JOIN amistades a ON (
        (a.remitente_id = $1 AND a.destinatario_id = u.id)
        OR
        (a.remitente_id = u.id AND a.destinatario_id = $1)
      )
      WHERE u.id <> $1
        AND (LOWER(u.username) LIKE $2 OR LOWER(u.email) LIKE $2 OR LOWER(u.nombre) LIKE $2)
      ORDER BY u.username ASC
      LIMIT 20;
    `;

    const resultado = await pool.query(query, [usuarioId, termino]);
    res.json(resultado.rows);
  } catch (error) {
    console.error('Error al buscar usuarios:', error.message);
    res.status(500).json({ error: 'Error del servidor al buscar usuarios' });
  }
};

// 2. POST: /api/amigos/solicitar
// Enviar una solicitud de amistad a otro usuario
const enviarSolicitud = async (req, res) => {
  const remitenteId = req.usuario?.id;
  const { destinatario_id } = req.body;

  if (!remitenteId) {
    return res.status(401).json({ error: 'Sesión no autorizada' });
  }

  const destinatarioIdNum = Number(destinatario_id);
  if (!destinatarioIdNum || remitenteId === destinatarioIdNum) {
    return res.status(400).json({ error: 'Destinatario inválido' });
  }

  try {
    // Verificar si ya existe alguna relación previa
    const existe = await pool.query(
      `SELECT id, estado, remitente_id FROM amistades 
       WHERE (remitente_id = $1 AND destinatario_id = $2)
          OR (remitente_id = $2 AND destinatario_id = $1)`,
      [remitenteId, destinatarioIdNum]
    );

    if (existe.rows.length > 0) {
      const rel = existe.rows[0];
      if (rel.estado === 'aceptada') {
        return res.status(400).json({ error: 'Ya son amigos' });
      }
      if (rel.estado === 'pendiente') {
        return res.status(400).json({ error: 'Ya existe una solicitud pendiente' });
      }
    }

    // Insertar la solicitud pendiente
    const nuevaSolicitud = await pool.query(
      `INSERT INTO amistades (remitente_id, destinatario_id, estado)
       VALUES ($1, $2, 'pendiente')
       RETURNING id, remitente_id, destinatario_id, estado, creado_en`,
      [remitenteId, destinatarioIdNum]
    );

    res.status(201).json({
      mensaje: 'Solicitud de amistad enviada con éxito',
      amistad: nuevaSolicitud.rows[0]
    });
  } catch (error) {
    console.error('Error al enviar solicitud:', error.message);
    res.status(500).json({ error: 'Error del servidor al enviar solicitud' });
  }
};

// 3. GET: /api/amigos/pendientes
// Listar solicitudes entrantes recibidas pendientes de aprobación
const obtenerSolicitudesPendientes = async (req, res) => {
  const usuarioId = req.usuario?.id;

  if (!usuarioId) {
    return res.status(401).json({ error: 'Sesión no autorizada' });
  }

  try {
    const query = `
      SELECT 
        a.id AS solicitud_id,
        a.creado_en AS fecha_solicitud,
        u.id AS usuario_id,
        u.nombre,
        u.username,
        u.avatar_url
      FROM amistades a
      INNER JOIN usuarios u ON a.remitente_id = u.id
      WHERE a.destinatario_id = $1
        AND a.estado = 'pendiente'
      ORDER BY a.creado_en DESC;
    `;

    const resultado = await pool.query(query, [usuarioId]);
    res.json(resultado.rows);
  } catch (error) {
    console.error('Error al obtener solicitudes pendientes:', error.message);
    res.status(500).json({ error: 'Error del servidor al obtener solicitudes' });
  }
};

// 4. PUT: /api/amigos/responder
// Aceptar o rechazar una solicitud (accion: 'aceptar' | 'rechazar')
const responderSolicitud = async (req, res) => {
  const usuarioId = req.usuario?.id;
  const { solicitud_id, accion } = req.body;

  if (!usuarioId) {
    return res.status(401).json({ error: 'Sesión no autorizada' });
  }

  if (!solicitud_id || !['aceptar', 'rechazar'].includes(accion)) {
    return res.status(400).json({ error: 'Parámetros inválidos' });
  }

  try {
    // Comprobar que la solicitud pertenezca al usuario destinatario
    const solicitudRes = await pool.query(
      `SELECT id FROM amistades WHERE id = $1 AND destinatario_id = $2 AND estado = 'pendiente'`,
      [solicitud_id, usuarioId]
    );

    if (solicitudRes.rows.length === 0) {
      return res.status(404).json({ error: 'Solicitud no encontrada o ya procesada' });
    }

    if (accion === 'aceptar') {
      await pool.query(
        `UPDATE amistades 
         SET estado = 'aceptada', actualizado_en = CURRENT_TIMESTAMP 
         WHERE id = $1`,
        [solicitud_id]
      );
      return res.json({ mensaje: 'Solicitud aceptada. ¡Ahora son amigos!' });
    } else {
      // Si se rechaza, eliminamos el registro para permitir solicitar en el futuro
      await pool.query(`DELETE FROM amistades WHERE id = $1`, [solicitud_id]);
      return res.json({ mensaje: 'Solicitud rechazada correctamente' });
    }
  } catch (error) {
    console.error('Error al responder solicitud:', error.message);
    res.status(500).json({ error: 'Error del servidor al responder solicitud' });
  }
};

// 5. GET: /api/amigos
// Obtener el listado de amigos confirmados del usuario
const obtenerAmigos = async (req, res) => {
  const usuarioId = req.usuario?.id;

  if (!usuarioId) {
    return res.status(401).json({ error: 'Sesión no autorizada' });
  }

  try {
    const query = `
      SELECT 
        u.id,
        u.nombre,
        u.username,
        u.avatar_url,
        u.biografia,
        a.id AS amistad_id,
        a.actualizado_en AS fecha_amistad
      FROM amistades a
      INNER JOIN usuarios u ON (
        CASE 
          WHEN a.remitente_id = $1 THEN a.destinatario_id = u.id
          ELSE a.remitente_id = u.id
        END
      )
      WHERE (a.remitente_id = $1 OR a.destinatario_id = $1)
        AND a.estado = 'aceptada'
      ORDER BY u.nombre ASC;
    `;

    const resultado = await pool.query(query, [usuarioId]);
    res.json(resultado.rows);
  } catch (error) {
    console.error('Error al obtener lista de amigos:', error.message);
    res.status(500).json({ error: 'Error del servidor al obtener amigos' });
  }
};
// 6. DELETE: /api/amigos/:amistad_id
// Eliminar un amigo confirmado
const eliminarAmigo = async (req, res) => {
  const usuarioId = req.usuario?.id;
  const { amistad_id } = req.params;

  if (!usuarioId) {
    return res.status(401).json({ error: 'Sesión no autorizada' });
  }

  try {
    // Solo puede eliminarla si es remitente o destinatario de esa amistad
    const resultado = await pool.query(
      `DELETE FROM amistades 
       WHERE id = $1 AND (remitente_id = $2 OR destinatario_id = $2)
       RETURNING id`,
      [amistad_id, usuarioId]
    );

    if (resultado.rows.length === 0) {
      return res.status(404).json({ error: 'Amistad no encontrada o no tienes permiso' });
    }

    res.json({ mensaje: 'Amigo eliminado correctamente' });
  } catch (error) {
    console.error('Error al eliminar amigo:', error.message);
    res.status(500).json({ error: 'Error del servidor al eliminar amigo' });
  }
};

module.exports = {
  buscarUsuarios,
  enviarSolicitud,
  obtenerSolicitudesPendientes,
  responderSolicitud,
  obtenerAmigos,
  eliminarAmigo
};