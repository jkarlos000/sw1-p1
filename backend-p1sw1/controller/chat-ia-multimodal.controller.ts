/**
 * Controller para Chat IA Multimodal (Audio + Imágenes)
 * Extiende funcionalidad de chat-ia.controller.ts
 */

import { Request, Response } from 'express';
import { pool } from '../database/config';
import Server from '../classes/server';
import transcriptionService from '../services/transcription.service';
import { analizarDiagrama, procesarConIA } from './chat-ia.controller';
import fs from 'fs';
import path from 'path';

/**
 * Enviar mensaje multimodal (texto + audios + imágenes)
 * Endpoint: POST /chat-ia/mensaje-multimodal
 */
export const enviarMensajeMultimodal = async (req: Request, res: Response) => {
    try {
        const { id_conversacion, id_sala, id_usuario, contenido, diagrama_actual } = req.body;
        
        // Multer agrega req.files como un objeto con arrays por campo
        const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
        const audios = files?.audios || [];
        const imagenes = files?.imagenes || [];

        // Validaciones
        if ((!contenido && audios.length === 0 && imagenes.length === 0) || (!id_conversacion && !id_sala)) {
            return res.status(400).json({
                ok: false,
                mensaje: 'Debes proporcionar al menos texto, audio o imagen'
            });
        }

        let conversacionId = id_conversacion;

        // Crear conversación si no existe
        if (!conversacionId && id_sala) {
            const nuevaConv = await pool.query(
                `INSERT INTO conversacion_ia (id_sala, titulo, contexto_inicial)
                 VALUES ($1, $2, $3)
                 RETURNING id_conversacion`,
                [id_sala, 'Chat con IA', JSON.stringify(diagrama_actual ? JSON.parse(diagrama_actual) : {})]
            );
            conversacionId = nuevaConv.rows[0].id_conversacion;
        }

        // ========== PROCESAR AUDIOS ==========
        const transcripciones: string[] = [];
        const audioProcessed: any[] = [];

        for (const audio of audios) {
            try {
                console.log(`🎤 Transcribiendo audio: ${audio.originalname}`);
                const result = await transcriptionService.transcribe(audio.path);
                
                transcripciones.push(result.texto);
                audioProcessed.push({
                    archivo: audio,
                    transcripcion: result.texto,
                    duracion: result.duracionSegundos,
                    provider: transcriptionService.getProviderInfo().provider
                });
                
                console.log(`✅ Transcrito: "${result.texto.substring(0, 100)}..."`);
            } catch (error: any) {
                console.error(`❌ Error transcribiendo ${audio.originalname}:`, error.message);
                audioProcessed.push({
                    archivo: audio,
                    error: error.message
                });
            }
        }

        // ========== PROCESAR IMÁGENES ==========
        const imagenesBase64: any[] = [];

        for (const imagen of imagenes) {
            try {
                const imageBuffer = fs.readFileSync(imagen.path);
                const base64 = imageBuffer.toString('base64');
                const mimeType = imagen.mimetype;
                
                imagenesBase64.push({
                    archivo: imagen,
                    base64: `data:${mimeType};base64,${base64}`,
                    ancho: null, // Podrías usar sharp para obtener dimensiones
                    alto: null
                });
                
                console.log(`📷 Imagen cargada: ${imagen.originalname}`);
            } catch (error: any) {
                console.error(`❌ Error procesando ${imagen.originalname}:`, error.message);
            }
        }

        // ========== CONSTRUIR CONTENIDO COMPLETO ==========
        let contenidoCompleto = contenido || '';
        
        if (transcripciones.length > 0) {
            contenidoCompleto += '\n\n[TRANSCRIPCIÓN DE AUDIO]:\n' + transcripciones.join('\n\n');
        }
        
        if (imagenesBase64.length > 0) {
            contenidoCompleto += `\n\n[${imagenesBase64.length} IMAGEN(ES) ADJUNTA(S)]`;
        }

        // ========== GUARDAR MENSAJE DEL USUARIO ==========
        const mensajeUsuarioInsert = await pool.query(
            `INSERT INTO mensaje_chat_ia (id_conversacion, id_usuario, tipo_mensaje, contenido, tiene_attachments, metadata_multimodal)
             VALUES ($1, $2, 'usuario', $3, $4, $5)
             RETURNING *`,
            [
                conversacionId,
                id_usuario,
                contenidoCompleto,
                audios.length > 0 || imagenes.length > 0,
                JSON.stringify({
                    num_audios: audios.length,
                    num_imagenes: imagenes.length,
                    transcripciones_ok: audioProcessed.filter(a => !a.error).length
                })
            ]
        );

        const idMensajeUsuario = mensajeUsuarioInsert.rows[0].id_mensaje;

        // ========== GUARDAR ATTACHMENTS EN BD ==========
        
        // Guardar audios
        for (const audio of audioProcessed) {
            if (audio.error) continue;
            
            await pool.query(
                `INSERT INTO mensaje_attachment 
                 (mensaje_id, tipo, archivo_url, archivo_nombre, archivo_tamano, mime_type, transcripcion, duracion_segundos, servicio_transcripcion)
                 VALUES ($1, 'audio', $2, $3, $4, $5, $6, $7, $8)`,
                [
                    idMensajeUsuario,
                    audio.archivo.path,
                    audio.archivo.originalname,
                    audio.archivo.size,
                    audio.archivo.mimetype,
                    audio.transcripcion,
                    audio.duracion,
                    audio.provider
                ]
            );
        }

        // Guardar imágenes
        for (const imagen of imagenesBase64) {
            await pool.query(
                `INSERT INTO mensaje_attachment 
                 (mensaje_id, tipo, archivo_url, archivo_nombre, archivo_tamano, mime_type, ancho, alto)
                 VALUES ($1, 'imagen', $2, $3, $4, $5, $6, $7)`,
                [
                    idMensajeUsuario,
                    imagen.archivo.path,
                    imagen.archivo.originalname,
                    imagen.archivo.size,
                    imagen.archivo.mimetype,
                    imagen.ancho,
                    imagen.alto
                ]
            );
        }

        // ========== PREPARAR CONTEXTO PARA IA ==========
        
        // Obtener configuración de IA
        const configQuery = await pool.query(
            'SELECT * FROM config_ia WHERE id_sala = $1',
            [id_sala]
        );

        const config = configQuery.rows[0] || {
            modelo: 'claude-sonnet-4.5',
            temperatura: 0.7,
            max_tokens: 3000,
            system_prompt: `Eres un asistente experto en diagramas UML. Puedes ayudar a analizar, entender y modificar diagramas de clases.

Para modificar el diagrama, DEBES incluir en tu respuesta la palabra clave [MODIFICAR_DIAGRAMA] seguida de un bloque JSON con las acciones a realizar.

Formato de comandos:
{
  "acciones": [
    {"tipo": "limpiar"},
    {"tipo": "agregar", "elemento": "clase", "nombre": "NombreClase", "atributos": ["-id:integer", "-nombre:text"]},
    {"tipo": "agregar", "elemento": "relacion", "origen": "ClaseA", "destino": "ClaseB", "cardinalidad": "1...*"},
    {"tipo": "eliminar", "elemento": "clase", "nombre": "NombreClase"},
    {"tipo": "eliminar", "elemento": "relacion", "origen": "ClaseA", "destino": "ClaseB"}
  ]
}

⚠️ REGLAS CRÍTICAS PARA ELIMINAR:
- Cuando uses "tipo": "eliminar", DEBES usar el nombre EXACTO de la clase como aparece en "CLASES EXISTENTES"
- RESPETA mayúsculas, minúsculas y espacios en los nombres
- Si la clase se llama "Articulo" en el contexto, usa EXACTAMENTE "Articulo", NO "Artículo" ni "articulo"
- Si hay duplicados, elimina UNO y menciona cuál mantienes

IMPORTANTE:
- "limpiar" elimina TODO el diagrama (úsalo solo si el usuario pide empezar de cero)
- "eliminar" elimina UN elemento específico (usa el nombre exacto del contexto)
- SIEMPRE incluye [MODIFICAR_DIAGRAMA] seguido del JSON en un bloque de código
- Usa nombres de clases descriptivos y en formato PascalCase
- Los atributos deben empezar con "-" para privados, "+" para públicos`
        };

        // Preparar prompt con imágenes para Claude Vision
        const mensajesContexto: any[] = [];

        // Agregar contexto del diagrama actual
        let contextoDiagrama = '';
        if (diagrama_actual) {
            try {
                const diagramaParsed = typeof diagrama_actual === 'string' ? JSON.parse(diagrama_actual) : diagrama_actual;
                contextoDiagrama = analizarDiagrama(diagramaParsed);
            } catch (error) {
                console.error('Error analizando diagrama:', error);
            }
        }

        // Construir mensaje multimodal para Claude
        if (imagenesBase64.length > 0) {
            // Claude Vision format
            const content: any[] = [
                {
                    type: 'text',
                    text: `
═══════════════════════════════════════════════════════════
📋 CONTEXTO DEL DIAGRAMA UML ACTUAL
═══════════════════════════════════════════════════════════

${contextoDiagrama || 'No hay diagrama actual'}

═══════════════════════════════════════════════════════════
❓ SOLICITUD DEL USUARIO
═══════════════════════════════════════════════════════════

${contenidoCompleto}

═══════════════════════════════════════════════════════════
⚙️ INSTRUCCIONES PARA MODIFICAR EL DIAGRAMA
═══════════════════════════════════════════════════════════

Si necesitas modificar el diagrama, DEBES usar el siguiente formato:

[MODIFICAR_DIAGRAMA]
\`\`\`json
{
  "acciones": [
    {"tipo": "eliminar", "elemento": "clase", "nombre": "Articulo"},
    {"tipo": "agregar", "elemento": "clase", "nombre": "NombreClase", "atributos": ["-id:integer", "-nombre:text"]}
  ]
}
\`\`\`

⚠️ REGLAS CRÍTICAS:
- Para ELIMINAR: Usa el nombre EXACTO de "CLASES EXISTENTES" (respeta mayúsculas)
- Para LIMPIAR TODO: {"tipo": "limpiar"}
- SIEMPRE incluye [MODIFICAR_DIAGRAMA] seguido del JSON
- Ejemplo: Si arriba dice 'Clase "Articulo"', usa "nombre": "Articulo"
`
                }
            ];

            // Agregar imágenes
            for (const img of imagenesBase64) {
                content.push({
                    type: 'image',
                    source: {
                        type: 'base64',
                        media_type: img.archivo.mimetype,
                        data: img.base64.split(',')[1] // Remover el prefijo data:image...
                    }
                });
            }

            mensajesContexto.push({
                role: 'user',
                content
            });
        } else {
            // Mensaje de solo texto
            mensajesContexto.push({
                role: 'user',
                content: `
═══════════════════════════════════════════════════════════
📋 CONTEXTO DEL DIAGRAMA UML ACTUAL
═══════════════════════════════════════════════════════════

${contextoDiagrama || 'No hay diagrama actual'}

═══════════════════════════════════════════════════════════
❓ SOLICITUD DEL USUARIO
═══════════════════════════════════════════════════════════

${contenidoCompleto}

═══════════════════════════════════════════════════════════
⚙️ INSTRUCCIONES PARA MODIFICAR EL DIAGRAMA
═══════════════════════════════════════════════════════════

Si necesitas modificar el diagrama, DEBES usar el siguiente formato:

[MODIFICAR_DIAGRAMA]
\`\`\`json
{
  "acciones": [
    {"tipo": "eliminar", "elemento": "clase", "nombre": "Articulo"},
    {"tipo": "agregar", "elemento": "clase", "nombre": "NombreClase", "atributos": ["-id:integer", "-nombre:text"]}
  ]
}
\`\`\`

⚠️ REGLAS CRÍTICAS:
- Para ELIMINAR: Usa el nombre EXACTO de "CLASES EXISTENTES" (respeta mayúsculas)
- Para LIMPIAR TODO: {"tipo": "limpiar"}
- SIEMPRE incluye [MODIFICAR_DIAGRAMA] seguido del JSON
- Ejemplo: Si arriba dice 'Clase "Articulo"', usa "nombre": "Articulo"
`
            });
        }

        console.log(`🤖 Enviando a ${config.modelo} con:`, {
            texto: !!contenido,
            audios: audios.length,
            imagenes: imagenes.length,
            transcripciones: transcripciones.length
        });

        // ========== LLAMAR A IA ==========
        const respuestaIA = await procesarConIA(config, mensajesContexto);

        // ========== GUARDAR RESPUESTA DE IA ==========
        const mensajeIA = await pool.query(
            `INSERT INTO mensaje_chat_ia (id_conversacion, tipo_mensaje, contenido, metadata)
             VALUES ($1, 'ia', $2, $3)
             RETURNING *`,
            [
                conversacionId,
                respuestaIA.contenido,
                JSON.stringify({
                    modelo: config.modelo,
                    tokens_usados: respuestaIA.tokens_usados,
                    tiene_imagenes: imagenesBase64.length > 0,
                    tiene_audio: audios.length > 0
                })
            ]
        );

        // Procesar modificaciones del diagrama
        let modificacionDiagrama = null;
        if (respuestaIA.modificacion_diagrama) {
            await pool.query(
                `INSERT INTO snapshot_diagrama (id_conversacion, id_mensaje, diagrama_json, descripcion)
                 VALUES ($1, $2, $3, $4)`,
                [
                    conversacionId,
                    mensajeIA.rows[0].id_mensaje,
                    JSON.stringify(respuestaIA.modificacion_diagrama),
                    'Modificación multimodal por IA'
                ]
            );
            modificacionDiagrama = respuestaIA.modificacion_diagrama;
        }

        // ========== EMITIR POR WEBSOCKET ==========
        const salaQuery = await pool.query(
            'SELECT nombre_sala FROM sala WHERE id_sala = $1',
            [id_sala]
        );

        if (salaQuery.rows.length > 0) {
            const nombreSala = salaQuery.rows[0].nombre_sala;
            const serverInstance = Server.instance;

            // Emitir mensaje del usuario con attachments
            serverInstance.io.to(nombreSala).emit('nuevo-mensaje-chat-ia', {
                id_mensaje: mensajeUsuarioInsert.rows[0].id_mensaje,
                id_conversacion: conversacionId,
                id_usuario: id_usuario,
                tipo_mensaje: 'usuario',
                contenido: mensajeUsuarioInsert.rows[0].contenido,
                metadata: mensajeUsuarioInsert.rows[0].metadata,
                tiene_attachments: mensajeUsuarioInsert.rows[0].tiene_attachments,
                metadata_multimodal: mensajeUsuarioInsert.rows[0].metadata_multimodal,
                fecha_envio: mensajeUsuarioInsert.rows[0].fecha_envio,
                usuario_email: await pool.query('SELECT email FROM usuario WHERE id_usuario = $1', [id_usuario])
                    .then(r => r.rows[0]?.email || 'Usuario')
            });

            // Emitir respuesta de IA
            serverInstance.io.to(nombreSala).emit('nuevo-mensaje-chat-ia', {
                id_mensaje: mensajeIA.rows[0].id_mensaje,
                id_conversacion: conversacionId,
                tipo_mensaje: 'ia',
                contenido: mensajeIA.rows[0].contenido,
                metadata: mensajeIA.rows[0].metadata,
                fecha_envio: mensajeIA.rows[0].fecha_envio,
                usuario_email: 'IA'
            });

            // Emitir modificación del diagrama
            if (modificacionDiagrama) {
                serverInstance.io.to(nombreSala).emit('modificacion-diagrama-ia', {
                    diagrama: modificacionDiagrama,
                    descripcion: 'Modificación multimodal por IA'
                });
            }
        }

        // ========== RESPUESTA HTTP ==========
        return res.json({
            ok: true,
            mensaje_usuario: {
                ...mensajeUsuarioInsert.rows[0],
                audios_procesados: audioProcessed.length,
                imagenes_procesadas: imagenesBase64.length,
                transcripciones: transcripciones
            },
            mensaje_ia: mensajeIA.rows[0],
            modificacion_diagrama: modificacionDiagrama
        });

    } catch (error: any) {
        console.error('❌ Error en mensaje multimodal:', error);
        return res.status(500).json({
            ok: false,
            mensaje: 'Error al procesar mensaje multimodal',
            error: error.message
        });
    }
};

/**
 * Obtener attachments de un mensaje
 * Endpoint: GET /chat-ia/mensaje/:id/attachments
 */
export const obtenerAttachments = async (req: Request, res: Response) => {
    try {
        const { id_mensaje } = req.params;

        const resultado = await pool.query(
            `SELECT * FROM mensaje_attachment WHERE mensaje_id = $1 ORDER BY created_at ASC`,
            [id_mensaje]
        );

        return res.json({
            ok: true,
            attachments: resultado.rows
        });

    } catch (error: any) {
        console.error('Error obteniendo attachments:', error);
        return res.status(500).json({
            ok: false,
            mensaje: 'Error al obtener attachments',
            error: error.message
        });
    }
};

/**
 * Descargar archivo attachment
 * Endpoint: GET /chat-ia/attachment/:id/download
 */
export const descargarAttachment = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const resultado = await pool.query(
            'SELECT * FROM mensaje_attachment WHERE id = $1',
            [id]
        );

        if (resultado.rows.length === 0) {
            return res.status(404).json({
                ok: false,
                mensaje: 'Attachment no encontrado'
            });
        }

        const attachment = resultado.rows[0];
        const filePath = attachment.archivo_url;

        if (!fs.existsSync(filePath)) {
            return res.status(404).json({
                ok: false,
                mensaje: 'Archivo no encontrado en el sistema'
            });
        }

        res.download(filePath, attachment.archivo_nombre);

    } catch (error: any) {
        console.error('Error descargando attachment:', error);
        return res.status(500).json({
            ok: false,
            mensaje: 'Error al descargar archivo',
            error: error.message
        });
    }
};
