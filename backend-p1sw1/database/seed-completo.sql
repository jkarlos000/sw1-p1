-- =====================================================
-- SEEDERS COMPLETOS DEL SISTEMA
-- Datos de ejemplo para desarrollo y testing
-- =====================================================

-- ============================================
-- USUARIOS DE PRUEBA
-- ============================================
INSERT INTO usuario (email, password) VALUES
    ('admin@uagrm.edu.bo', 'admin123'),
    ('jkarlos@uagrm.edu.bo', 'pass123'),
    ('maria@uagrm.edu.bo', 'pass456'),
    ('pedro@uagrm.edu.bo', 'pass789'),
    ('ana@uagrm.edu.bo', 'pass321'),
    ('carlos@uagrm.edu.bo', 'pass654')
ON CONFLICT (email) DO NOTHING;

-- ============================================
-- SALAS DE TRABAJO
-- ============================================
INSERT INTO sala (nombre_sala, host_sala, informacion) VALUES
    ('Sala Demo UML', 'admin@uagrm.edu.bo', 'Sala de demostración con ejemplos de diagramas UML'),
    ('Proyecto SW1', 'jkarlos@uagrm.edu.bo', 'Sala para el proyecto final de Ingeniería de Software 1'),
    ('Testing Multimodal', 'maria@uagrm.edu.bo', 'Sala para probar funcionalidades de audio e imágenes'),
    ('Arquitectura Sistema', 'pedro@uagrm.edu.bo', 'Diseño de arquitectura del sistema de gestión'),
    ('Patrones de Diseño', 'ana@uagrm.edu.bo', 'Estudio y aplicación de patrones de diseño')
ON CONFLICT (nombre_sala) DO NOTHING;

-- ============================================
-- ASISTENCIA A SALAS
-- ============================================
INSERT INTO asistencia (id_usuario, id_sala, fecha_hora) VALUES
    (1, 1, CURRENT_TIMESTAMP - INTERVAL '2 days'),
    (2, 1, CURRENT_TIMESTAMP - INTERVAL '2 days'),
    (3, 1, CURRENT_TIMESTAMP - INTERVAL '1 day'),
    (2, 2, CURRENT_TIMESTAMP - INTERVAL '3 hours'),
    (3, 2, CURRENT_TIMESTAMP - INTERVAL '2 hours'),
    (4, 2, CURRENT_TIMESTAMP - INTERVAL '1 hour'),
    (3, 3, CURRENT_TIMESTAMP - INTERVAL '30 minutes'),
    (5, 3, CURRENT_TIMESTAMP - INTERVAL '15 minutes'),
    (4, 4, CURRENT_TIMESTAMP - INTERVAL '5 days'),
    (5, 5, CURRENT_TIMESTAMP - INTERVAL '1 week')
ON CONFLICT (id_usuario, id_sala) DO NOTHING;

-- ============================================
-- CONFIGURACIÓN DE IA POR SALA
-- ============================================
INSERT INTO config_ia (id_sala, modelo, temperatura, max_tokens, system_prompt, configuracion_extra) VALUES
    (1, 'claude-sonnet-4.5', 0.2, 16000, 
     'Eres un experto en UML y diseño de software. Analiza diagramas, sugiere mejoras y genera código. Cuando modifiques diagramas, incluye en tu respuesta la palabra clave [MODIFICAR_DIAGRAMA] seguida de un bloque JSON con las acciones a realizar.',
     '{"provider": "anthropic", "version": "2023-06-01", "supports_vision": true}'::jsonb),
    
    (2, 'claude-sonnet-4.5', 0.3, 16000,
     'Eres un asistente especializado en Ingeniería de Software. Ayuda a los estudiantes a diseñar diagramas UML correctos y bien estructurados.',
     '{"provider": "anthropic", "version": "2023-06-01", "supports_vision": true}'::jsonb),
    
    (3, 'claude-sonnet-4.5', 0.2, 16000,
     'Eres un experto en análisis multimodal. Analiza audio e imágenes adjuntas para entender las necesidades del usuario y modificar diagramas UML. Soportas transcripciones de audio y análisis visual de diagramas dibujados a mano.',
     '{"provider": "anthropic", "version": "2023-06-01", "supports_vision": true, "supports_audio": true}'::jsonb),
    
    (4, 'claude-opus-4', 0.3, 8000,
     'Eres un arquitecto de software experto. Analiza patrones de diseño, identifica code smells y sugiere arquitecturas escalables.',
     '{"provider": "anthropic", "version": "2023-06-01", "supports_vision": true}'::jsonb),
    
    (5, 'claude-sonnet-4.5', 0.25, 12000,
     'Eres un instructor de patrones de diseño. Identifica patrones en diagramas UML y sugiere mejores prácticas de implementación.',
     '{"provider": "anthropic", "version": "2023-06-01", "supports_vision": true}'::jsonb)
ON CONFLICT (id_sala) DO UPDATE SET
    modelo = EXCLUDED.modelo,
    temperatura = EXCLUDED.temperatura,
    max_tokens = EXCLUDED.max_tokens,
    system_prompt = EXCLUDED.system_prompt,
    configuracion_extra = EXCLUDED.configuracion_extra;

-- ============================================
-- CONVERSACIONES DE EJEMPLO
-- ============================================
INSERT INTO conversacion_ia (id_sala, titulo, contexto_inicial, activa) VALUES
    (1, 'Primera Conversación Demo', '{"cells": []}'::jsonb, true),
    (2, 'Diseño del Proyecto SW1', '{"cells": [{"type": "uml.Class", "attrs": {"name": "Usuario"}}]}'::jsonb, true),
    (3, 'Testing Audio e Imágenes', '{"cells": []}'::jsonb, true),
    (4, 'Arquitectura Inicial', '{"cells": []}'::jsonb, false),
    (5, 'Análisis de Patrones', '{"cells": []}'::jsonb, true);

-- ============================================
-- MENSAJES DE EJEMPLO (Chat IA)
-- ============================================
INSERT INTO mensaje_chat_ia (id_conversacion, id_usuario, tipo_mensaje, contenido, metadata, tiene_attachments, metadata_multimodal) VALUES
    -- Conversación 1: Demo básico
    (1, NULL, 'sistema', 'Conversación iniciada. Puedo ayudarte a crear y modificar tu diagrama UML.', NULL, false, NULL),
    (1, 1, 'usuario', '¿Puedes ayudarme a crear un diagrama de clases para un sistema de biblioteca?', NULL, false, NULL),
    (1, NULL, 'ia', 'Por supuesto. Te ayudaré a crear un diagrama de clases para un sistema de biblioteca. Necesitarás clases como: Libro, Usuario, Préstamo, Autor, Editorial. ¿Quieres que empiece creando estas clases básicas?', 
     '{"modelo": "claude-sonnet-4.5", "tokens_usados": 156}'::jsonb, false, NULL),
    (1, 1, 'usuario', 'Sí, por favor crea las clases básicas', NULL, false, NULL),
    
    -- Conversación 2: Proyecto SW1
    (2, 2, 'usuario', 'Necesito modelar un sistema de gestión de inventario', NULL, false, NULL),
    (2, NULL, 'ia', 'Excelente. Para un sistema de gestión de inventario, sugiero las siguientes clases principales: Producto, Categoría, Proveedor, Almacén, MovimientoInventario. ¿Quieres que las agregue al diagrama?',
     '{"modelo": "claude-sonnet-4.5", "tokens_usados": 198}'::jsonb, false, NULL),
    
    -- Conversación 3: Multimodal (con attachments simulados)
    (3, 3, 'usuario', 'Adjunto una foto de mi diagrama en papel para que lo conviertas a digital', 
     '{"modelo": "claude-sonnet-4.5"}'::jsonb, true, 
     '{"num_audios": 0, "num_imagenes": 1, "transcripciones_ok": 0}'::jsonb),
    (3, NULL, 'ia', 'He analizado la imagen de tu diagrama. Detecto 3 clases: Usuario (con atributos id, nombre, email), Producto (id, nombre, precio), y Pedido (id, fecha, total). También veo relaciones de asociación entre ellas. ¿Procedo a crear este diagrama?',
     '{"modelo": "claude-sonnet-4.5", "tokens_usados": 245, "tiene_imagenes": true}'::jsonb, false, NULL),
    
    -- Conversación 5: Patrones
    (5, 5, 'usuario', 'Analiza este diagrama y sugiere qué patrón de diseño podría aplicar', NULL, false, NULL),
    (5, NULL, 'ia', 'Basándome en la estructura actual, sugiero aplicar el patrón Observer para la relación entre tus clases. Esto permitirá que los cambios en el Sujeto notifiquen automáticamente a los Observadores.',
     '{"modelo": "claude-sonnet-4.5", "tokens_usados": 178}'::jsonb, false, NULL);

-- ============================================
-- ATTACHMENTS DE EJEMPLO (Multimodal)
-- ============================================
-- Simulación de attachments para el mensaje multimodal de la conversación 3

INSERT INTO mensaje_attachment (mensaje_id, tipo, archivo_url, archivo_nombre, archivo_tamano, mime_type, transcripcion, duracion_segundos, servicio_transcripcion, ancho, alto, analisis_ia) VALUES
    -- Audio de ejemplo (conversación futura)
    ((SELECT id_mensaje FROM mensaje_chat_ia WHERE id_conversacion = 3 AND tipo_mensaje = 'usuario' LIMIT 1), 
     'audio', 
     '/uploads/sala_3/audio_1736985600_123456789.webm', 
     'instrucciones_diagrama.webm', 
     245678, 
     'audio/webm',
     'Necesito que agregues una clase Usuario con los atributos nombre, email y password. También conecta Usuario con la clase Pedido mediante una relación de uno a muchos.',
     45.5,
     'assemblyai',
     NULL, NULL, NULL),
    
    -- Imagen de ejemplo
    ((SELECT id_mensaje FROM mensaje_chat_ia WHERE id_conversacion = 3 AND tipo_mensaje = 'usuario' LIMIT 1),
     'imagen',
     '/uploads/sala_3/diagrama_1736985600_987654321.jpg',
     'diagrama_papel.jpg',
     1258476,
     'image/jpeg',
     NULL, NULL, NULL,
     1920, 1080,
     '{
       "clases_detectadas": [
         {"nombre": "Usuario", "atributos": ["id", "nombre", "email"], "metodos": []},
         {"nombre": "Producto", "atributos": ["id", "nombre", "precio"], "metodos": []},
         {"nombre": "Pedido", "atributos": ["id", "fecha", "total"], "metodos": ["calcularTotal"]}
       ],
       "relaciones": [
         {"origen": "Usuario", "destino": "Pedido", "tipo": "asociacion", "cardinalidad": "1..*"},
         {"origen": "Pedido", "destino": "Producto", "tipo": "composicion", "cardinalidad": "1..*"}
       ],
       "confianza": 0.92
     }'::jsonb);

-- ============================================
-- SNAPSHOTS DE DIAGRAMA
-- ============================================
INSERT INTO snapshot_diagrama (id_conversacion, id_mensaje, diagrama_json, descripcion) VALUES
    (1, NULL, 
     '{
       "cells": [
         {
           "type": "uml.Class",
           "id": "clase-1",
           "attrs": {
             "name": "Libro",
             "attributes": ["- isbn: String", "- titulo: String", "- autor: String"],
             "methods": ["+ prestar(): void", "+ devolver(): void"]
           }
         }
       ]
     }'::jsonb,
     'Diagrama inicial con clase Libro'),
    
    (2, NULL,
     '{
       "cells": [
         {
           "type": "uml.Class",
           "id": "clase-producto",
           "attrs": {
             "name": "Producto",
             "attributes": ["- id: int", "- nombre: String", "- precio: double"],
             "methods": ["+ calcularDescuento(): double"]
           }
         }
       ]
     }'::jsonb,
     'Diagrama con clase Producto'),
    
    (3, 
     (SELECT id_mensaje FROM mensaje_chat_ia WHERE id_conversacion = 3 AND tipo_mensaje = 'ia' LIMIT 1),
     '{
       "cells": [
         {
           "type": "uml.Class",
           "id": "clase-usuario",
           "attrs": {
             "name": "Usuario",
             "attributes": ["- id: int", "- nombre: String", "- email: String"],
             "methods": ["+ login(): boolean", "+ logout(): void"]
           }
         },
         {
           "type": "uml.Class",
           "id": "clase-producto",
           "attrs": {
             "name": "Producto",
             "attributes": ["- id: int", "- nombre: String", "- precio: double"],
             "methods": ["+ getInfo(): String"]
           }
         },
         {
           "type": "uml.Class",
           "id": "clase-pedido",
           "attrs": {
             "name": "Pedido",
             "attributes": ["- id: int", "- fecha: Date", "- total: double"],
             "methods": ["+ calcularTotal(): double"]
           }
         }
       ]
     }'::jsonb,
     'Diagrama generado desde imagen con Claude Vision');

-- ============================================
-- VERIFICACIÓN
-- ============================================
-- Mostrar resumen de datos insertados
DO $$
DECLARE
    v_usuarios INTEGER;
    v_salas INTEGER;
    v_conversaciones INTEGER;
    v_mensajes INTEGER;
    v_attachments INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_usuarios FROM usuario;
    SELECT COUNT(*) INTO v_salas FROM sala;
    SELECT COUNT(*) INTO v_conversaciones FROM conversacion_ia;
    SELECT COUNT(*) INTO v_mensajes FROM mensaje_chat_ia;
    SELECT COUNT(*) INTO v_attachments FROM mensaje_attachment;
    
    RAISE NOTICE '============================================';
    RAISE NOTICE 'DATOS DE PRUEBA INSERTADOS CORRECTAMENTE';
    RAISE NOTICE '============================================';
    RAISE NOTICE 'Usuarios: %', v_usuarios;
    RAISE NOTICE 'Salas: %', v_salas;
    RAISE NOTICE 'Conversaciones IA: %', v_conversaciones;
    RAISE NOTICE 'Mensajes: %', v_mensajes;
    RAISE NOTICE 'Attachments: %', v_attachments;
    RAISE NOTICE '============================================';
END $$;
