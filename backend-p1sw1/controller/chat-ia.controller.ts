import { Request, Response } from 'express';
import { pool } from '../database/config';
import axios from 'axios';
import Server from '../classes/server';

interface MensajeRequest {
    id_conversacion?: number;
    id_sala: number;
    id_usuario: number;
    contenido: string;
    diagrama_actual?: any;
}

interface ConversacionRequest {
    id_sala: number;
    titulo?: string;
    diagrama_inicial?: any;
}

export const obtenerConversacionActiva = async (req: Request, res: Response) => {
    try {
        const { id_sala } = req.params;

        if (!id_sala) {
            return res.status(400).json({
                ok: false,
                mensaje: 'El id_sala es requerido'
            });
        }

        // Buscar conversación activa
        const query = `
            SELECT 
                c.id_conversacion,
                c.id_sala,
                c.titulo,
                c.contexto_inicial,
                c.fecha_creacion,
                c.fecha_ultima_actualizacion,
                c.activa
            FROM conversacion_ia c
            WHERE c.id_sala = $1 AND c.activa = true
            ORDER BY c.fecha_ultima_actualizacion DESC
            LIMIT 1
        `;

        const resultado = await pool.query(query, [id_sala]);

        if (resultado.rows.length > 0) {
            return res.json({
                ok: true,
                conversacion: resultado.rows[0]
            });
        } else {
            return res.json({
                ok: true,
                conversacion: null,
                mensaje: 'No hay conversación activa'
            });
        }

    } catch (error) {
        console.error('Error al obtener conversación activa:', error);
        return res.status(500).json({
            ok: false,
            mensaje: 'Error al obtener conversación activa',
            error
        });
    }
};

export const crearConversacion = async (req: Request, res: Response) => {
    try {
        const { id_sala, titulo, diagrama_inicial }: ConversacionRequest = req.body;

        if (!id_sala) {
            return res.status(400).json({
                ok: false,
                mensaje: 'El id_sala es requerido'
            });
        }

        // Desactivar conversaciones anteriores de la sala
        await pool.query(
            'UPDATE conversacion_ia SET activa = false WHERE id_sala = $1',
            [id_sala]
        );

        // Crear nueva conversación
        const query = `
            INSERT INTO conversacion_ia (id_sala, titulo, contexto_inicial)
            VALUES ($1, $2, $3)
            RETURNING *
        `;

        const resultado = await pool.query(query, [
            id_sala,
            titulo || 'Nueva conversación',
            JSON.stringify(diagrama_inicial || {})
        ]);

        // Crear mensaje de sistema inicial
        await pool.query(
            `INSERT INTO mensaje_chat_ia (id_conversacion, tipo_mensaje, contenido)
             VALUES ($1, 'sistema', $2)`,
            [
                resultado.rows[0].id_conversacion,
                'Conversación iniciada. Puedo ayudarte a crear y modificar tu diagrama UML.'
            ]
        );

        return res.json({
            ok: true,
            conversacion: resultado.rows[0],
            mensaje: 'Conversación creada exitosamente'
        });

    } catch (error) {
        console.error('Error al crear conversación:', error);
        return res.status(500).json({
            ok: false,
            mensaje: 'Error al crear conversación',
            error
        });
    }
};

export const obtenerHistorialMensajes = async (req: Request, res: Response) => {
    try {
        const { id_conversacion } = req.params;
        const { limite = 50, offset = 0 } = req.query;

        if (!id_conversacion) {
            return res.status(400).json({
                ok: false,
                mensaje: 'El id_conversacion es requerido'
            });
        }

        const query = `
            SELECT 
                m.id_mensaje,
                m.id_conversacion,
                m.id_usuario,
                m.tipo_mensaje,
                m.contenido,
                m.metadata,
                m.fecha_envio,
                u.email as usuario_email
            FROM mensaje_chat_ia m
            LEFT JOIN usuario u ON m.id_usuario = u.id_usuario
            WHERE m.id_conversacion = $1
            ORDER BY m.fecha_envio ASC
            LIMIT $2 OFFSET $3
        `;

        const resultado = await pool.query(query, [id_conversacion, limite, offset]);

        return res.json({
            ok: true,
            mensajes: resultado.rows,
            total: resultado.rowCount
        });

    } catch (error) {
        console.error('Error al obtener historial:', error);
        return res.status(500).json({
            ok: false,
            mensaje: 'Error al obtener historial',
            error
        });
    }
};

export const enviarMensajeIA = async (req: Request, res: Response) => {
    try {
        const { 
            id_conversacion, 
            id_sala, 
            id_usuario, 
            contenido, 
            diagrama_actual 
        }: MensajeRequest = req.body;

        if (!contenido || (!id_conversacion && !id_sala)) {
            return res.status(400).json({
                ok: false,
                mensaje: 'Faltan datos requeridos'
            });
        }

        let conversacionId = id_conversacion;

        // Si no hay conversación, crear una
        if (!conversacionId && id_sala) {
            const nuevaConv = await pool.query(
                `INSERT INTO conversacion_ia (id_sala, titulo, contexto_inicial)
                 VALUES ($1, $2, $3)
                 RETURNING id_conversacion`,
                [id_sala, 'Chat con IA', JSON.stringify(diagrama_actual || {})]
            );
            conversacionId = nuevaConv.rows[0].id_conversacion;
        }

        // Guardar mensaje del usuario con email
        const mensajeUsuarioInsert = await pool.query(
            `INSERT INTO mensaje_chat_ia (id_conversacion, id_usuario, tipo_mensaje, contenido)
             VALUES ($1, $2, 'usuario', $3)
             RETURNING *`,
            [conversacionId, id_usuario, contenido]
        );

        // Obtener el mensaje con el email del usuario
        const mensajeUsuario = await pool.query(
            `SELECT m.*, u.email as usuario_email
             FROM mensaje_chat_ia m
             LEFT JOIN usuario u ON m.id_usuario = u.id_usuario
             WHERE m.id_mensaje = $1`,
            [mensajeUsuarioInsert.rows[0].id_mensaje]
        );

        // Obtener configuración de IA
        const configQuery = await pool.query(
            'SELECT * FROM config_ia WHERE id_sala = $1',
            [id_sala]
        );

        const config = configQuery.rows[0] || {
            modelo: 'claude-sonnet-4.5',
            temperatura: 0.7,
            max_tokens: 2000,
            system_prompt: `Eres un asistente experto en diagramas UML. Puedes ayudar a analizar, entender y modificar diagramas de clases.

Para modificar el diagrama, incluye en tu respuesta la palabra clave [MODIFICAR_DIAGRAMA] seguida de un bloque JSON con las acciones a realizar.

Formato de comandos:
{
  "acciones": [
    {"tipo": "eliminar", "elemento": "clase", "nombre": "NombreClase"},
    {"tipo": "eliminar", "elemento": "relacion", "origen": "ClaseA", "destino": "ClaseB"},
    {"tipo": "agregar", "elemento": "clase", "nombre": "NuevaClase", "atributos": ["-id:integer", "-nombre:text"]},
    {"tipo": "agregar", "elemento": "relacion", "origen": "ClaseA", "destino": "ClaseB", "cardinalidad": "1...*"},
    {"tipo": "limpiar"}
  ]
}

La acción "limpiar" elimina todas las clases y relaciones del diagrama.`
        };

        // Obtener historial de la conversación
        const historialQuery = await pool.query(
            `SELECT tipo_mensaje, contenido 
             FROM mensaje_chat_ia 
             WHERE id_conversacion = $1 
             ORDER BY fecha_envio ASC
             LIMIT 10`,
            [conversacionId]
        );

        // Preparar contexto para la IA
        const mensajesContexto = historialQuery.rows.map(m => ({
            role: m.tipo_mensaje === 'usuario' ? 'user' : 'assistant',
            content: m.contenido
        }));

        // Agregar información del diagrama actual si existe
        let promptConDiagrama = contenido;
        if (diagrama_actual) {
            const elementosUML = analizarDiagrama(diagrama_actual);
            promptConDiagrama = `
═══════════════════════════════════════════════════════════
📋 CONTEXTO DEL DIAGRAMA UML ACTUAL
═══════════════════════════════════════════════════════════

${elementosUML}

═══════════════════════════════════════════════════════════
❓ PREGUNTA DEL USUARIO
═══════════════════════════════════════════════════════════

${contenido}

IMPORTANTE: Usa SIEMPRE los nombres de las clases (no los IDs) cuando te refieras a ellas.
`;
        }

        mensajesContexto.push({
            role: 'user',
            content: promptConDiagrama
        });

        console.log('🔷 Prompt enviado a IA (primeros 500 chars):', promptConDiagrama.substring(0, 500));
        console.log('📨 Total de mensajes en contexto:', mensajesContexto.length);

        // Llamar a la API de OpenAI (o la IA configurada)
        const respuestaIA = await procesarConIA(config, mensajesContexto);

        // Guardar respuesta de la IA
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
                    tiempo_respuesta: respuestaIA.tiempo_respuesta
                })
            ]
        );

        // Agregar usuario_email='IA' al resultado
        mensajeIA.rows[0].usuario_email = 'IA';

        // Verificar si la IA sugiere modificaciones al diagrama
        let modificacionDiagrama = null;
        if (respuestaIA.modificacion_diagrama) {
            console.log('🔧 Modificaciones detectadas:', JSON.stringify(respuestaIA.modificacion_diagrama, null, 2));
            
            // Guardar snapshot del diagrama modificado
            await pool.query(
                `INSERT INTO snapshot_diagrama (id_conversacion, id_mensaje, diagrama_json, descripcion)
                 VALUES ($1, $2, $3, $4)`,
                [
                    conversacionId,
                    mensajeIA.rows[0].id_mensaje,
                    JSON.stringify(respuestaIA.modificacion_diagrama),
                    'Modificación sugerida por IA'
                ]
            );
            modificacionDiagrama = respuestaIA.modificacion_diagrama;
        }

        // ========== EMITIR RESPUESTA POR WEBSOCKET A TODA LA SALA ==========
        // Obtener nombre de la sala para emitir por socket
        const salaQuery = await pool.query(
            'SELECT nombre_sala FROM sala WHERE id_sala = $1',
            [id_sala]
        );
        
        if (salaQuery.rows.length > 0) {
            const nombreSala = salaQuery.rows[0].nombre_sala;
            const serverInstance = Server.instance;
            
            // Emitir respuesta de IA a toda la sala
            serverInstance.io.to(nombreSala).emit('nuevo-mensaje-chat-ia', {
                id_mensaje: mensajeIA.rows[0].id_mensaje,
                id_conversacion: conversacionId,
                tipo_mensaje: 'ia',
                contenido: mensajeIA.rows[0].contenido,
                metadata: mensajeIA.rows[0].metadata,
                fecha_envio: mensajeIA.rows[0].fecha_envio,
                usuario_email: 'IA'
            });

            // Si hay modificación del diagrama, emitirla
            if (modificacionDiagrama) {
                serverInstance.io.to(nombreSala).emit('modificacion-diagrama-ia', {
                    diagrama: modificacionDiagrama,
                    descripcion: 'Modificación sugerida por IA'
                });
            }
        }

        return res.json({
            ok: true,
            mensaje_usuario: mensajeUsuario.rows[0],
            mensaje_ia: mensajeIA.rows[0],
            modificacion_diagrama: modificacionDiagrama
        });

    } catch (error) {
        console.error('Error al procesar mensaje con IA:', error);
        return res.status(500).json({
            ok: false,
            mensaje: 'Error al procesar mensaje con IA',
            error
        });
    }
};

export const guardarSnapshotDiagrama = async (req: Request, res: Response) => {
    try {
        const { id_conversacion, diagrama_json, descripcion } = req.body;

        if (!id_conversacion || !diagrama_json) {
            return res.status(400).json({
                ok: false,
                mensaje: 'Faltan datos requeridos'
            });
        }

        const query = `
            INSERT INTO snapshot_diagrama (id_conversacion, diagrama_json, descripcion)
            VALUES ($1, $2, $3)
            RETURNING *
        `;

        const resultado = await pool.query(query, [
            id_conversacion,
            JSON.stringify(diagrama_json),
            descripcion || 'Snapshot manual'
        ]);

        return res.json({
            ok: true,
            snapshot: resultado.rows[0],
            mensaje: 'Snapshot guardado exitosamente'
        });

    } catch (error) {
        console.error('Error al guardar snapshot:', error);
        return res.status(500).json({
            ok: false,
            mensaje: 'Error al guardar snapshot',
            error
        });
    }
};

export const obtenerSnapshots = async (req: Request, res: Response) => {
    try {
        const { id_conversacion } = req.params;

        if (!id_conversacion) {
            return res.status(400).json({
                ok: false,
                mensaje: 'El id_conversacion es requerido'
            });
        }

        const query = `
            SELECT * FROM snapshot_diagrama
            WHERE id_conversacion = $1
            ORDER BY fecha_creacion DESC
        `;

        const resultado = await pool.query(query, [id_conversacion]);

        return res.json({
            ok: true,
            snapshots: resultado.rows
        });

    } catch (error) {
        console.error('Error al obtener snapshots:', error);
        return res.status(500).json({
            ok: false,
            mensaje: 'Error al obtener snapshots',
            error
        });
    }
};

// ========== CONFIGURAR IA PARA SALA ==========
export const configurarIA = async (req: Request, res: Response) => {
    try {
        const { id_sala, modelo, temperatura, max_tokens, system_prompt } = req.body;

        if (!id_sala) {
            return res.status(400).json({
                ok: false,
                mensaje: 'El id_sala es requerido'
            });
        }

        const query = `
            INSERT INTO config_ia (id_sala, modelo, temperatura, max_tokens, system_prompt)
            VALUES ($1, $2, $3, $4, $5)
            ON CONFLICT (id_sala) 
            DO UPDATE SET 
                modelo = EXCLUDED.modelo,
                temperatura = EXCLUDED.temperatura,
                max_tokens = EXCLUDED.max_tokens,
                system_prompt = EXCLUDED.system_prompt
            RETURNING *
        `;

        const resultado = await pool.query(query, [
            id_sala,
            modelo || 'gpt-4',
            temperatura || 0.7,
            max_tokens || 2000,
            system_prompt || 'Eres un asistente experto en diagramas UML.'
        ]);

        return res.json({
            ok: true,
            config: resultado.rows[0],
            mensaje: 'Configuración guardada exitosamente'
        });

    } catch (error) {
        console.error('Error al configurar IA:', error);
        return res.status(500).json({
            ok: false,
            mensaje: 'Error al configurar IA',
            error
        });
    }
};

// ========== FUNCIONES AUXILIARES ==========

/**
 * Analiza el diagrama actual y extrae información legible
 */
function analizarDiagrama(diagrama: any): string {
    try {
        if (!diagrama) return 'No hay diagrama disponible';

        // Si es un objeto JointJS con toJSON()
        const diagramaJSON = diagrama.toJSON ? diagrama.toJSON() : diagrama;
        
        console.log('📋 Células en el diagrama:', diagramaJSON.cells?.length);
        
        if (!diagramaJSON.cells || diagramaJSON.cells.length === 0) {
            return 'El diagrama está vacío (sin elementos)';
        }

        // Log de tipos de elementos
        const tiposEncontrados = new Set<string>();
        diagramaJSON.cells.forEach((cell: any) => {
            if (cell.type) tiposEncontrados.add(cell.type);
        });
        console.log('🔍 Tipos de elementos encontrados:', Array.from(tiposEncontrados));

        const elementos: string[] = [];
        const clases: any[] = [];
        const relaciones: any[] = [];
        
        // Separar elementos por tipo
        diagramaJSON.cells.forEach((cell: any) => {
            if (cell.type === 'uml.Class' || 
                cell.type === 'standard.Rectangle' || 
                cell.type === 'standard.HeaderedRectangle') {
                clases.push(cell);
            } else if (cell.type && (cell.type.includes('Link') || cell.type.includes('link'))) {
                relaciones.push(cell);
            }
        });

        console.log(`✅ Clases detectadas: ${clases.length}, Relaciones: ${relaciones.length}`);

        // Describir clases
        if (clases.length > 0) {
            elementos.push(`\nCLASES EXISTENTES (${clases.length}):`);
            
            const nombresExtraidos: string[] = [];
            
            clases.forEach((clase, idx) => {
                // Buscar nombre en headerText (JointJS estructura real)
                const nombre = clase.attrs?.headerText?.text ||
                              clase.attrs?.['.header-text']?.text ||
                              clase.name || 
                              clase.attrs?.name?.text || 
                              clase.attrs?.label?.text || 
                              clase.attrs?.text?.text || 
                              `Clase${idx + 1}`;
                
                nombresExtraidos.push(nombre);
                elementos.push(`  ${idx + 1}. Clase "${nombre}" (ID: ${clase.id})`);
                
                // Buscar atributos en bodyText.textWrap.text (JointJS estructura real)
                let atributos = '';
                if (clase.attrs?.bodyText?.textWrap?.text) {
                    atributos = clase.attrs.bodyText.textWrap.text;
                } else if (clase.attrs?.wrappedText?.text) {
                    atributos = clase.attrs.wrappedText.text;
                } else if (clase.attrs?.['.wrapped-text']?.text) {
                    atributos = clase.attrs['.wrapped-text'].text;
                } else if (clase.attrs?.body?.text) {
                    atributos = clase.attrs.body.text;
                } else if (clase.attributes && Array.isArray(clase.attributes)) {
                    atributos = clase.attributes.join(', ');
                }
                
                if (atributos) {
                    elementos.push(`     - Atributos:\n       ${atributos.split('\n').join('\n       ')}`);
                }
                
                // Métodos
                if (clase.methods && Array.isArray(clase.methods)) {
                    elementos.push(`     - Métodos: ${clase.methods.join(', ')}`);
                }
            });
            
            console.log('📝 Nombres de clases extraídos:', nombresExtraidos);
        }

        // Describir relaciones
        if (relaciones.length > 0) {
            elementos.push(`\nRELACIONES EXISTENTES (${relaciones.length}):`);
            
            // Crear mapa de ID -> Nombre de clase para referencias
            const mapaClases = new Map();
            clases.forEach(clase => {
                const nombre = clase.attrs?.headerText?.text || 
                              clase.name || 
                              `Clase_${clase.id?.substring(0, 8)}`;
                mapaClases.set(clase.id, nombre);
            });
            
            relaciones.forEach((rel, idx) => {
                const tipoRelacion = rel.type || 'Relación';
                elementos.push(`  ${idx + 1}. ${tipoRelacion} (ID: ${rel.id})`);
                
                if (rel.source && rel.target) {
                    const nombreOrigen = mapaClases.get(rel.source.id) || rel.source.id;
                    const nombreDestino = mapaClases.get(rel.target.id) || rel.target.id;
                    elementos.push(`     - De: "${nombreOrigen}" → A: "${nombreDestino}"`);
                }
                
                if (rel.labels && rel.labels[0]?.attrs?.text?.text) {
                    elementos.push(`     - Cardinalidad: ${rel.labels[0].attrs.text.text}`);
                }
            });
        }

        if (elementos.length === 0) {
            return `Diagrama con ${diagramaJSON.cells.length} elementos sin clasificar`;
        }

        return elementos.join('\n');

    } catch (error) {
        console.error('Error al analizar diagrama:', error);
        return 'Error al analizar el diagrama: ' + (error as Error).message;
    }
}

/**
 * Procesa el mensaje con la IA configurada (OpenAI o Claude)
 */
async function procesarConIA(config: any, mensajes: any[]): Promise<any> {
    const tiempoInicio = Date.now();
    
    try {
        // Determinar qué IA usar basado en el modelo configurado
        const modelo = config.modelo || 'gpt-4';
        const esClaudeModel = modelo.includes('claude') || modelo.includes('sonnet') || modelo.includes('opus');
        
        if (esClaudeModel) {
            return await procesarConClaude(config, mensajes, tiempoInicio);
        } else {
            return await procesarConOpenAI(config, mensajes, tiempoInicio);
        }

    } catch (error: any) {
        console.error('Error al llamar a la API de IA:', error.response?.data || error.message);
        
        // Fallback a respuesta simulada
        return {
            contenido: 'Lo siento, no puedo procesar tu solicitud en este momento. Por favor, intenta nuevamente.',
            tokens_usados: 0,
            tiempo_respuesta: Date.now() - tiempoInicio,
            modificacion_diagrama: null
        };
    }
}

/**
 * Procesa mensaje con OpenAI (GPT-4, GPT-3.5-turbo, etc.)
 */
async function procesarConOpenAI(config: any, mensajes: any[], tiempoInicio: number): Promise<any> {
    const apiKey = process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
        console.warn('⚠️  No se encontró OPENAI_API_KEY, usando modo simulación');
        return {
            contenido: generarRespuestaSimulada(mensajes),
            tokens_usados: 0,
            tiempo_respuesta: Date.now() - tiempoInicio,
            modificacion_diagrama: null
        };
    }

    const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
            model: config.modelo || 'gpt-4',
            messages: [
                {
                    role: 'system',
                    content: config.system_prompt
                },
                ...mensajes
            ],
            temperature: config.temperatura || 0.7,
            max_tokens: config.max_tokens || 2000
        },
        {
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            }
        }
    );

    const respuesta = response.data.choices[0].message.content;
    const tokensUsados = response.data.usage?.total_tokens || 0;

    // Detectar si la IA sugiere modificaciones
    let modificacionDiagrama = null;
    if (respuesta.includes('[MODIFICAR_DIAGRAMA]')) {
        modificacionDiagrama = extraerModificaciones(respuesta);
    }

    return {
        contenido: respuesta,
        tokens_usados: tokensUsados,
        tiempo_respuesta: Date.now() - tiempoInicio,
        modificacion_diagrama: modificacionDiagrama
    };
}

/**
 * Procesa mensaje con Anthropic Claude (Sonnet 4.5, Opus, etc.)
 */
async function procesarConClaude(config: any, mensajes: any[], tiempoInicio: number): Promise<any> {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    
    if (!apiKey) {
        console.warn('⚠️  No se encontró ANTHROPIC_API_KEY en .env, usando modo simulación');
        return {
            contenido: generarRespuestaSimulada(mensajes),
            tokens_usados: 0,
            tiempo_respuesta: Date.now() - tiempoInicio,
            modificacion_diagrama: null
        };
    }

    // Convertir formato de mensajes de OpenAI a formato Claude
    // Claude no usa 'system' en el array de mensajes, se envía separado
    const systemPrompt = config.system_prompt;
    
    // Filtrar y convertir mensajes (remover system messages del array)
    const claudeMessages = mensajes
        .filter((m: any) => m.role !== 'system')
        .map((m: any) => ({
            role: m.role === 'user' ? 'user' : 'assistant',
            content: m.content
        }));

    // Mapeo de modelos
    const modeloMap: { [key: string]: string } = {
        'claude-sonnet-4.5': 'claude-sonnet-4-20250514',
        'claude-sonnet-4': 'claude-sonnet-4-20250514',
        'claude-opus': 'claude-opus-4-20250514',
        'claude-3.5-sonnet': 'claude-3-5-sonnet-20241022',
        'claude-3-opus': 'claude-3-opus-20240229',
        'claude-3-sonnet': 'claude-3-sonnet-20240229',
    };

    const modeloClaude = modeloMap[config.modelo] || 'claude-sonnet-4-20250514';

    const response = await axios.post(
        'https://api.anthropic.com/v1/messages',
        {
            model: modeloClaude,
            max_tokens: config.max_tokens || 2000,
            temperature: config.temperatura || 0.7,
            system: systemPrompt,
            messages: claudeMessages
        },
        {
            headers: {
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01',
                'Content-Type': 'application/json'
            }
        }
    );

    const respuesta = response.data.content[0].text;
    const tokensUsados = response.data.usage?.input_tokens + response.data.usage?.output_tokens || 0;

    // Detectar si la IA sugiere modificaciones
    let modificacionDiagrama = null;
    if (respuesta.includes('[MODIFICAR_DIAGRAMA]')) {
        modificacionDiagrama = extraerModificaciones(respuesta);
    }

    return {
        contenido: respuesta,
        tokens_usados: tokensUsados,
        tiempo_respuesta: Date.now() - tiempoInicio,
        modificacion_diagrama: modificacionDiagrama
    };
}

/**
 * Genera una respuesta simulada cuando no hay API key
 */
function generarRespuestaSimulada(mensajes: any[]): string {
    const ultimoMensaje = mensajes[mensajes.length - 1]?.content || '';
    
    const respuestas = [
        'Entiendo que quieres trabajar en tu diagrama UML. Por favor, describe más detalles sobre lo que necesitas.',
        'Puedo ayudarte a crear o modificar elementos en tu diagrama. ¿Qué te gustaría hacer específicamente?',
        'He analizado tu solicitud. Para el diagrama UML, sugiero que consideres las relaciones entre las clases.',
        'Claro, puedo ayudarte con eso. ¿Qué tipo de elemento UML necesitas agregar?'
    ];
    
    return respuestas[Math.floor(Math.random() * respuestas.length)];
}

/**
 * Extrae modificaciones sugeridas por la IA del texto de respuesta
 */
function extraerModificaciones(respuesta: string): any {
    try {
        console.log('🔍 Buscando [MODIFICAR_DIAGRAMA] en respuesta...');
        
        if (!respuesta.includes('[MODIFICAR_DIAGRAMA]')) {
            console.log('❌ No se encontró [MODIFICAR_DIAGRAMA] en la respuesta');
            return null;
        }
        
        console.log('✅ [MODIFICAR_DIAGRAMA] encontrado');
        
        // Buscar el bloque JSON después de [MODIFICAR_DIAGRAMA]
        const regex = /\[MODIFICAR_DIAGRAMA\]\s*```json\s*([\s\S]*?)\s*```/i;
        const match = respuesta.match(regex);
        
        if (!match) {
            const regex2 = /\[MODIFICAR_DIAGRAMA\]\s*({[\s\S]*?})(?=\n\n|$)/i;
            const match2 = respuesta.match(regex2);
            if (match2) {
                const modificaciones = JSON.parse(match2[1]);
                return modificaciones;
            }
            return null;
        }
        
        const jsonStr = match[1].trim();
        const modificaciones = JSON.parse(jsonStr);
        return modificaciones;
        
    } catch (error) {
        console.error('❌ Error al parsear modificaciones:', error);
        return null;
    }
}
export const generarColeccionPostman = async (req: Request, res: Response) => {
    try {
        const { prompt } = req.body;

        if (!prompt) {
            return res.status(400).json({
                ok: false,
                mensaje: 'El prompt es requerido'
            });
        }

        console.log('🤖 Generando colección de Postman con Claude...');

        // Configurar modelo (usar variable de entorno o default)
        const modelo = process.env.MODELO_IA || 'claude-sonnet-4.5';
        const apiKey = process.env.ANTHROPIC_API_KEY;

        if (!apiKey) {
            throw new Error('ANTHROPIC_API_KEY no configurada');
        }

        // Llamar a Claude
        const claudeResponse = await axios.post(
            'https://api.anthropic.com/v1/messages',
            {
                model: 'claude-sonnet-4-20250514',
                max_tokens: 16000,
                temperature: 0.2,
                messages: [
                    {
                        role: 'user',
                        content: prompt
                    }
                ]
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': apiKey,
                    'anthropic-version': '2023-06-01'
                }
            }
        );

        const respuestaIA = claudeResponse.data.content[0].text;
        console.log('📝 Respuesta de Claude recibida (primeros 500 chars):', respuestaIA.substring(0, 500));

        // Extraer JSON de la respuesta con múltiples estrategias
        let coleccionJson;
        try {
            // ESTRATEGIA 1: Parsear directamente
            coleccionJson = JSON.parse(respuestaIA);
            console.log('✅ JSON parseado directamente');
        } catch (e) {
            console.log('⚠️ Fallo parseo directo, intentando limpiar markdown...');
            try {
                // ESTRATEGIA 2: Limpiar bloques de código markdown
                let jsonLimpio = respuestaIA
                    .replace(/```json\n?/g, '')
                    .replace(/```javascript\n?/g, '')
                    .replace(/```\n?/g, '')
                    .trim();
                
                coleccionJson = JSON.parse(jsonLimpio);
                console.log('✅ JSON parseado después de limpiar markdown');
            } catch (e2) {
                console.log('⚠️ Fallo limpieza markdown, buscando objeto JSON...');
                try {
                    // ESTRATEGIA 3: Buscar el primer objeto JSON válido en la respuesta
                    const match = respuestaIA.match(/\{[\s\S]*\}/);
                    if (!match) {
                        throw new Error('No se encontró objeto JSON en la respuesta');
                    }
                    
                    let jsonExtraido = match[0];
                    
                    // Limpiar posibles problemas comunes
                    jsonExtraido = jsonExtraido
                        .replace(/,(\s*[}\]])/g, '$1')  // Eliminar comas antes de } o ]
                        .replace(/\n\s*\n/g, '\n')       // Eliminar líneas vacías dobles
                        .replace(/\t/g, '  ');           // Reemplazar tabs por espacios
                    
                    coleccionJson = JSON.parse(jsonExtraido);
                    console.log('✅ JSON parseado después de extraer y limpiar');
                } catch (e3) {
                    // ESTRATEGIA 4: Guardar respuesta para debug y lanzar error detallado
                    console.error('❌ Todas las estrategias de parsing fallaron');
                    console.error('Respuesta completa:', respuestaIA);
                    
                    throw new Error(`No se pudo parsear la respuesta de Claude: ${e3}`);
                }
            }
        }

        // Validar que sea una colección de Postman válida
        if (!coleccionJson.info || !coleccionJson.item) {
            console.warn('⚠️ La respuesta no parece ser una colección de Postman válida');
            // Intentar envolver en estructura de colección si es un array de items
            if (Array.isArray(coleccionJson)) {
                coleccionJson = {
                    info: {
                        name: "API REST - Gestión de Datos",
                        schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
                    },
                    item: coleccionJson
                };
                console.log('✅ Colección envuelta en estructura Postman');
            }
        }

        console.log('✅ Colección de Postman generada exitosamente');
        return res.json({
            ok: true,
            coleccion: coleccionJson
        });

    } catch (error) {
        console.error('❌ Error al generar colección de Postman:', error);
        return res.status(500).json({
            ok: false,
            mensaje: 'Error al generar colección de Postman',
            error: error instanceof Error ? error.message : 'Error desconocido'
        });
    }
};