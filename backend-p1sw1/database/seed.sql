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
