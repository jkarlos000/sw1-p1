import axios from "axios";
import { Request, Response, Router } from "express";
import { login, registre } from "../controller/auth.controller";
import { 
  obtenerConversacionActiva,
  crearConversacion,
  obtenerHistorialMensajes,
  enviarMensajeIA,
  guardarSnapshotDiagrama,
  obtenerSnapshots,
  configurarIA,
  generarColeccionPostman,
  generarSchemaSQL
} from "../controller/chat-ia.controller";
import { 
  enviarMensajeMultimodal,
  obtenerAttachments,
  descargarAttachment
} from "../controller/chat-ia-multimodal.controller";
import {
  guardarClaseUML,
  obtenerClasesUML,
  eliminarClaseUML,
  guardarClasesMultiples
} from "../controller/clase-uml.controller";
import { uploadMultipleFiles } from "../middleware/upload.middleware";
import { pool } from "../database/config";
const router = Router();

router.get("/health", (req: Request, res: Response) => {
  res.status(200).json({ ok: true, status: "healthy", timestamp: new Date().toISOString() });
});

router.post("/users/confirm-login", login);
router.post("/users", registre);

// OBTENER SALAS DE USUARIO - GET Endpoint
router.get("/users/:email/salas", async (req: Request, res: Response) => {
  const { email } = req.params;
  console.log('📡 Obteniendo salas para usuario:', email);
  if (!email) {
    return res.status(400).json({ ok: false, mensaje: 'Email es requerido' });
  }
  try {
    const query = `
      SELECT s.id_sala, s.nombre_sala, s.host_sala, s.fecha_creacion, 
             (SELECT COUNT(*) FROM asistencia WHERE id_sala = s.id_sala) as total_asistentes
      FROM sala s
      JOIN asistencia a ON s.id_sala = a.id_sala
      JOIN usuario u ON a.id_usuario = u.id_usuario
      WHERE u.email = $1
      ORDER BY s.fecha_creacion DESC
    `;
    const resultado = await pool.query(query, [email]);
    console.log('✅ Salas encontradas:', resultado.rows.length);
    
    res.json({
      ok: true,
      salas: resultado.rows.map(row => ({
        id: row.id_sala,
        codigo: row.nombre_sala,
        host: row.host_sala,
        esHost: row.host_sala === email,
        totalAsistentes: parseInt(row.total_asistentes),
        fechaCreacion: row.fecha_creacion
      }))
    });
  } catch (error) {
    console.error('❌ Error al obtener salas del usuario:', error);
    res.status(500).json({ ok: false, mensaje: 'Error al obtener salas' });
  }
});

// ========================================
// RUTAS DE SALA DE TRABAJO (HTTP Fallback/Complemento)
// Nota: La mayoría de estas operaciones ahora se manejan via WebSocket
// pero se mantienen estos endpoints HTTP como alternativa
// ========================================

// CREAR SALA - HTTP Endpoint (complementa al evento WebSocket 'nueva-reunion')
router.post("/salaCreate", async (req: Request, res: Response) => {
  const { usuario, sala } = req.body;
  console.log(req.body);
  if (!usuario || !sala) {
    return res.status(400).json({ ok: false, mensaje: 'Usuario y sala son requeridos' });
  }
  try {
    const consultaCreacion = await pool.query('INSERT INTO sala (nombre_sala, host_sala,informacion) VALUES ($1, $2, $3)', [sala, usuario, '']);
    const usuarioBD = await pool.query('SELECT * FROM usuario WHERE email = $1', [usuario]);
    const { id_usuario } = usuarioBD.rows[0];
    const salaBD = await pool.query('SELECT * FROM sala WHERE nombre_sala = $1', [sala]);
    const { id_sala } = salaBD.rows[0];
    const asistencia = await pool.query('INSERT INTO asistencia (id_usuario, id_sala,fecha_hora) VALUES ($1, $2,CURRENT_TIMESTAMP)', [id_usuario, id_sala]);

    if (consultaCreacion.rowCount! > 0 && asistencia.rowCount! > 0) {
      console.log('La consulta se realizó correctamente');
      res.json({
        host: usuario,
        sala,
        ok: true,
      });
    } else {
      console.log('La consulta no afectó a ninguna fila');
      res.status(409).json({ ok: false, mensaje: 'Error en la creacion de una sala' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ ok: false, mensaje: 'Error en consulta BD' });
  }

});

// OBTENER DATA DE SALA - HTTP Endpoint
router.post("/salaData", async (req: Request, res: Response) => {
  const { sala } = req.body;
  if (!sala) {
    return res.status(400).json({ ok: false, mensaje: 'Sala es requerida' });
  }
  try {
    const consulta = await pool.query('SELECT * FROM sala WHERE nombre_sala = $1', [sala]);
    if (consulta.rowCount! > 0) {

      console.log('La consulta se realizó correctamente');
      res.json({
        sala: consulta.rows[0].nombre_sala,
        data: consulta.rows[0].informacion,
        ok: true,
      });
    } else {
      console.log('La consulta no se realizo');
      res.status(409).json({ ok: false, mensaje: 'Error en la consulta de una sala' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ ok: false, mensaje: 'Error en consulta BD' });
  }
});

// OBTENER DIAGRAMA DE SALA - GET Endpoint (para diagramador)
router.get("/salas/:nombreSala", async (req: Request, res: Response) => {
  const { nombreSala } = req.params;
  if (!nombreSala) {
    return res.status(400).json({ ok: false, mensaje: 'Nombre de sala es requerido' });
  }
  try {
    const consulta = await pool.query('SELECT * FROM sala WHERE nombre_sala = $1', [nombreSala]);
    if (consulta.rowCount! > 0) {
      console.log('Diagrama de sala obtenido correctamente');
      res.json({
        id_sala: consulta.rows[0].id_sala,
        sala: consulta.rows[0].nombre_sala,
        diagrama: consulta.rows[0].informacion || '',
        ok: true,
      });
    } else {
      console.log('La sala no existe');
      res.status(404).json({ ok: false, mensaje: 'Sala no encontrada' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ ok: false, mensaje: 'Error en consulta BD' });
  }
});

// GRAFICA DE SALA A CODIGO
router.post("/codigoIA", async (req: Request, res: Response) => {
  const { lenguaje, info } = req.body;
  console.log(req.body);
  if (!lenguaje || !info) {
    return res.status(400).json({ ok: false, mensaje: 'Faltan datos requeridos' });
  } try {
    const response = await axios.post('https://api.anthropic.com/v1/messages', {
      model: "claude-3-opus-20240229",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: `
        ESTO SON LOS ELEMENTO DE UN DIAGRAMA DE SECUENCIA:
        ${info}
        (Solo quiero codigo de programacion no quiero nada de explicaciones argumentos opiniones 
          de parte tuya solo quiero que me des el codigo como respuesta, quiero una base para que 
          el usuario pueda guiar que lo use como una base para empezar en el lenguaje de programacion ${lenguaje}.)
        `}
      ]
    }, {
      headers: {
        "anthropic-version": "2023-06-01",
        "content-type": "application/json"
      }
    });
    if (response.data && response.data.content && response.data.content.length > 0) {
      let infoCodigo = response.data.content[0].text;
      res.json({
        infoCodigo,
        ok: true,
      });
    } else {
      res.status(500).json({ mensaje: 'La respuesta de la API no incluye la información esperada' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error en pedir la informacion a la IA' });
  }
});

// UNIRSE A SALA POR CODIGO
router.post("/unirseSalaXcodigo", async (req: Request, res: Response) => {
  const { sala } = req.body;
  if (!sala) {
    return res.status(400).json({ ok: false, mensaje: 'Sala es requerida' });
  }
  try {
    const consultaExistencia = (await pool.query('SELECT * FROM sala WHERE nombre_sala = $1', [sala]));
    if (consultaExistencia.rowCount! > 0) {
      console.log('La consulta se realizó correctamente');
      res.json({
        sala,
        ok: true,
      });
    } else {
      console.log('La consulta no afectó a ninguna fila');
      res.status(409).json({ ok: false, mensaje: 'La sala no existe' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ ok: false, mensaje: 'Error en consulta BD' });
  }
})

// ASISTENCIA A SALA
// ANOTAR
router.post("/asistenciaAnotar", async (req: Request, res: Response) => {
  const { usuario, sala } = req.body;
  console.log(req.body);
  if (!usuario || !sala) {
    return res.status(400).json({ ok: false, mensaje: 'Usuario y sala son requeridos' });
  }
  try {
    const usuarioBD = await pool.query('SELECT * FROM usuario WHERE email = $1', [usuario]);
    const { id_usuario } = usuarioBD.rows[0];
    const salaBD = await pool.query('SELECT * FROM sala WHERE nombre_sala = $1', [sala]);
    const { id_sala } = salaBD.rows[0];
    const consulta = await pool.query('INSERT INTO asistencia (id_usuario, id_sala,fecha_hora) VALUES ($1, $2,CURRENT_TIMESTAMP)', [id_usuario, id_sala]);
    if (consulta.rowCount! > 0) {
      console.log('La consulta se realizó correctamente');
      res.json({
        usuario,
        sala,
        ok: true,
      });
    } else {
      console.log('La consulta no afectó a ninguna fila');
      res.status(409).json({ ok: false, mensaje: 'Error en la asistencia a una sala' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ ok: false, mensaje: 'Error en consulta BD' });
  }
});
// BORRAR
router.post("/asistenciaBorrar", async (req: Request, res: Response) => {
  const { usuario, sala } = req.body;
  console.log(req.body);
  if (!usuario || !sala) {
    return res.status(400).json({ ok: false, mensaje: 'Usuario y sala son requeridos' });
  }
  try {
    const usuarioBD = await pool.query('SELECT * FROM usuario WHERE email = $1', [usuario]);
    console.log(usuarioBD);
    const { id_usuario } = usuarioBD.rows[0];
    const salaBD = await pool.query('SELECT * FROM sala WHERE nombre_sala = $1', [sala]);
    const { id_sala } = salaBD.rows[0];
    const consulta = await pool.query('DELETE FROM asistencia WHERE id_usuario = $1 AND id_sala = $2', [id_usuario, id_sala]);
    if (consulta.rowCount! > 0) {
      console.log('La consulta se realizó correctamente');
      res.json({
        usuario,
        sala,
        ok: true,
      });
    } else {
      console.log('La consulta no afectó a ninguna fila');
      res.status(409).json({ ok: false, mensaje: 'Error en la eliminacion de la asistencia a una sala' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ ok: false, mensaje: 'Error en consulta BD' });
  }
});

// ES HOST DE LA SALA
router.post("/esHost", async (req: Request, res: Response) => {
  const { usuario, sala } = req.body;
  if (!usuario || !sala) {
    return res.status(400).json({ ok: false, mensaje: 'Usuario y sala son requeridos' });
  }
  try {
    const salaBD = await pool.query('SELECT * FROM sala WHERE nombre_sala = $1', [sala]);
    const { id_sala, host_sala } = salaBD.rows[0];
    if (host_sala == usuario) {
      res.json({
        usuario,
        sala,
        ok: true,
      });
    } else {
      res.status(409).json({ ok: false, mensaje: 'El usuario no es el host de la sala' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ ok: false, mensaje: 'Error en consulta BD' });
  }
});

// TRAER TODO LOS ASISTENTES DE LA SALA
router.post("/asistentesSala", async (req: Request, res: Response) => {
  const { sala } = req.body;
  if (!sala) {
    return res.status(400).json({ ok: false, mensaje: 'Sala es requerida' });
  }
  try {
    const salaBD = await pool.query('SELECT * FROM sala WHERE nombre_sala = $1', [sala]);
    const { id_sala } = salaBD.rows[0];
    const consulta = await pool.query(`
    SELECT usuario.email
    FROM asistencia  
    JOIN usuario ON asistencia.id_usuario = usuario.id_usuario
    WHERE id_sala = $1`, [id_sala]);
    if (consulta.rowCount! > 0) {
      console.log('La consulta se realizó correctamente');
      res.json({
        asistentes: consulta.rows,
        sala,
        ok: true,
      });
    } else {
      console.log('La consulta no se realizo');
      res.status(409).json({ ok: false, mensaje: 'Error en la consulta de asistentes de una sala' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ ok: false, mensaje: 'Error en consulta BD' });
  }
});
// ELIMINAR SALA POR ID - DELETE Endpoint
router.delete("/salas/:id_sala", async (req: Request, res: Response) => {
  const { id_sala } = req.params;
  const { email } = req.body; // Email del usuario que solicita eliminar
  
  console.log('🗑️ Solicitud de eliminar sala:', id_sala, 'por usuario:', email);
  
  if (!id_sala) {
    return res.status(400).json({ ok: false, mensaje: 'ID de sala es requerido' });
  }
  
  try {
    // Verificar que la sala existe y obtener el host
    const salaQuery = await pool.query(
      'SELECT host_sala FROM sala WHERE id_sala = $1',
      [id_sala]
    );
    
    if (salaQuery.rows.length === 0) {
      return res.status(404).json({ ok: false, mensaje: 'Sala no encontrada' });
    }
    
    const hostSala = salaQuery.rows[0].host_sala;
    
    // Verificar que el usuario sea el host de la sala
    if (email && hostSala !== email) {
      return res.status(403).json({ ok: false, mensaje: 'Solo el host puede eliminar la sala' });
    }
    
    // Eliminar la sala (CASCADE eliminará automáticamente las asistencias)
    const deleteResult = await pool.query(
      'DELETE FROM sala WHERE id_sala = $1',
      [id_sala]
    );
    
    if (deleteResult.rowCount && deleteResult.rowCount > 0) {
      console.log('✅ Sala eliminada correctamente:', id_sala);
      res.json({ ok: true, mensaje: 'Sala eliminada correctamente' });
    } else {
      res.status(500).json({ ok: false, mensaje: 'No se pudo eliminar la sala' });
    }
  } catch (error) {
    console.error('❌ Error al eliminar sala:', error);
    res.status(500).json({ ok: false, mensaje: 'Error al eliminar sala' });
  }
});
// ELIMINAR SALA
// SI NADIE ESTA EN LA SALA BORRAR
router.post("/borrarSala", async (req: Request, res: Response) => {
  const { sala } = req.body;
  if (!sala) {
    return res.status(400).json({ ok: false, mensaje: 'Sala es requerida' });
  }
  try {
    const salaBD = await pool.query('SELECT * FROM sala WHERE nombre_sala = $1', [sala]);
    const { id_sala } = salaBD.rows[0];
    const consulta = await pool.query('SELECT COUNT(*) FROM asistencia WHERE id_sala = $1', [id_sala]);
    if (Number(consulta.rows[0].count) !== 0) {
      console.log('TIENE GENTE DENTRO DE LA SALA');
      res.json({
        ok: true,
      });
    } else {
      console.log('NO HAY NADIE EN LA SALA');
      await pool.query('DELETE FROM sala WHERE id_sala IN (SELECT id_sala FROM sala WHERE nombre_sala = $1)', [sala]);
      res.json({
        ok: true,
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ ok: false, mensaje: 'Error en consulta BD' });
  }
});

// ========================================
// RUTAS DE CHAT CON IA
// ========================================

// Obtener conversación activa de una sala
router.get("/chat-ia/conversacion/sala/:id_sala", obtenerConversacionActiva);

// Crear nueva conversación
router.post("/chat-ia/conversacion", crearConversacion);

// Obtener historial de mensajes de una conversación
router.get("/chat-ia/mensajes/:id_conversacion", obtenerHistorialMensajes);

// Enviar mensaje y obtener respuesta de IA
router.post("/chat-ia/mensaje", enviarMensajeIA);

// Guardar snapshot del diagrama
router.post("/chat-ia/snapshot", guardarSnapshotDiagrama);

// Obtener snapshots de una conversación
router.get("/chat-ia/snapshots/:id_conversacion", obtenerSnapshots);

// Configurar IA para una sala
router.post("/chat-ia/config", configurarIA);

// Generar colección de Postman con IA
router.post("/chat-ia/generar-postman", generarColeccionPostman);
router.post("/chat-ia/generar-sql", generarSchemaSQL);

// ========================================
// RUTAS DE CHAT IA MULTIMODAL (Audio + Imágenes)
// ========================================

// Enviar mensaje multimodal (texto + audios + imágenes)
router.post("/chat-ia/mensaje-multimodal", uploadMultipleFiles, enviarMensajeMultimodal);

// Obtener attachments de un mensaje
router.get("/chat-ia/mensaje/:id_mensaje/attachments", obtenerAttachments);

// Descargar attachment
router.get("/chat-ia/attachment/:id/download", descargarAttachment);

// ========================================
// RUTAS DE CLASES UML 2.5 (Métodos y Atributos)
// ========================================

// Guardar una clase completa con atributos y métodos
router.post("/uml/clase", guardarClaseUML);

// Guardar múltiples clases (batch)
router.post("/uml/clases", guardarClasesMultiples);

// Obtener todas las clases de una sala
router.get("/uml/clases/:id_sala", obtenerClasesUML);

// Eliminar una clase
router.delete("/uml/clase/:id_sala/:cell_id", eliminarClaseUML);

export default router;
