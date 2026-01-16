-- Script de datos de ejemplo para testing
-- Base de datos: parcial1sw1

-- ============================================
-- Datos de ejemplo para la tabla usuario
-- ============================================
INSERT INTO usuario (email, password) VALUES
    ('admin@example.com', 'admin123'),
    ('user1@example.com', 'password123'),
    ('user2@example.com', 'password456'),
    ('host@example.com', 'host123')
ON CONFLICT (email) DO NOTHING;

-- ============================================
-- Datos de ejemplo para la tabla sala
-- ============================================
INSERT INTO sala (nombre_sala, host_sala, informacion) VALUES
    ('Sala Demo 1', 'admin@example.com', 'Esta es una sala de demostración'),
    ('Sala Proyecto', 'host@example.com', 'Sala para el proyecto principal'),
    ('Sala Testing', 'user1@example.com', 'Sala de pruebas')
ON CONFLICT (nombre_sala) DO NOTHING;

-- ============================================
-- Datos de ejemplo para la tabla asistencia
-- ============================================
INSERT INTO asistencia (id_usuario, id_sala, fecha_hora) VALUES
    (1, 1, CURRENT_TIMESTAMP),
    (2, 1, CURRENT_TIMESTAMP),
    (3, 2, CURRENT_TIMESTAMP),
    (4, 2, CURRENT_TIMESTAMP)
ON CONFLICT (id_usuario, id_sala) DO NOTHING;

-- ============================================
-- Configuración de IA por sala (Claude Sonnet 4.5)
-- ============================================
INSERT INTO config_ia (id_sala, modelo, temperatura, max_tokens, system_prompt, configuracion_extra) VALUES
    (1, 'claude-sonnet-4.5', 0.2, 16000, 
     'Eres un experto en UML y diseño de software. Analiza diagramas, sugiere mejoras y genera código. Cuando modifiques diagramas, responde SOLO con un JSON válido con la estructura: {"acciones": [{"tipo": "agregar"|"modificar"|"eliminar", "elemento": "clase"|"relacion", ...detalles}]}',
     '{"provider": "anthropic", "version": "2023-06-01"}'::jsonb),
    (2, 'claude-sonnet-4.5', 0.2, 16000,
     'Eres un asistente que ayuda con diagramas UML. Proporciona análisis detallados y sugerencias prácticas.',
     '{"provider": "anthropic", "version": "2023-06-01"}'::jsonb),
    (3, 'claude-opus-4', 0.3, 8000,
     'Eres un experto en arquitectura de software. Analiza patrones de diseño y sugiere mejoras en los diagramas UML.',
     '{"provider": "anthropic", "version": "2023-06-01"}'::jsonb)
ON CONFLICT (id_sala) DO UPDATE SET
    modelo = EXCLUDED.modelo,
    temperatura = EXCLUDED.temperatura,
    max_tokens = EXCLUDED.max_tokens,
    system_prompt = EXCLUDED.system_prompt,
    configuracion_extra = EXCLUDED.configuracion_extra;
