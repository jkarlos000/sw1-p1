-- Base de datos: parcial1sw1
-- Script de creación de tablas para el backend

-- ============================================
-- Tabla: usuario
-- Descripción: Almacena los usuarios del sistema
-- ============================================
CREATE TABLE IF NOT EXISTS usuario (
    id_usuario SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- Tabla: sala
-- Descripción: Almacena las salas de trabajo
-- ============================================
CREATE TABLE IF NOT EXISTS sala (
    id_sala SERIAL PRIMARY KEY,
    nombre_sala VARCHAR(255) NOT NULL UNIQUE,
    host_sala VARCHAR(255) NOT NULL,
    informacion TEXT,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (host_sala) REFERENCES usuario(email) ON DELETE CASCADE
);

-- ============================================
-- Tabla: asistencia
-- Descripción: Registra la asistencia de usuarios a salas
-- ============================================
CREATE TABLE IF NOT EXISTS asistencia (
    id_asistencia SERIAL PRIMARY KEY,
    id_usuario INTEGER NOT NULL,
    id_sala INTEGER NOT NULL,
    fecha_hora TIMESTAMP NOT NULL,
    FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario) ON DELETE CASCADE,
    FOREIGN KEY (id_sala) REFERENCES sala(id_sala) ON DELETE CASCADE,
    UNIQUE(id_usuario, id_sala)
);

-- ============================================
-- Índices para mejorar el rendimiento
-- ============================================
CREATE INDEX IF NOT EXISTS idx_usuario_email ON usuario(email);
CREATE INDEX IF NOT EXISTS idx_sala_nombre ON sala(nombre_sala);
CREATE INDEX IF NOT EXISTS idx_sala_host ON sala(host_sala);
CREATE INDEX IF NOT EXISTS idx_asistencia_usuario ON asistencia(id_usuario);
CREATE INDEX IF NOT EXISTS idx_asistencia_sala ON asistencia(id_sala);

-- ============================================
-- Comentarios en las tablas
-- ============================================
COMMENT ON TABLE usuario IS 'Almacena información de los usuarios registrados en el sistema';
COMMENT ON TABLE sala IS 'Almacena las salas de trabajo creadas por los usuarios';
COMMENT ON TABLE asistencia IS 'Registra la participación de usuarios en salas específicas';
