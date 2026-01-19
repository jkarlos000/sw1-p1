-- ============================================
-- ESQUEMA DE BASE DE DATOS PARA CHAT CON IA
-- Sistema de chat integrado al diagramador UML
-- ============================================

-- ============================================
-- Tabla: conversacion_ia
-- Descripción: Almacena las conversaciones de IA por sala
-- ============================================
CREATE TABLE IF NOT EXISTS conversacion_ia (
    id_conversacion SERIAL PRIMARY KEY,
    id_sala INTEGER NOT NULL,
    titulo VARCHAR(500),
    contexto_inicial JSONB, -- Estado inicial del diagrama cuando se creó la conversación
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_ultima_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    activa BOOLEAN DEFAULT true,
    FOREIGN KEY (id_sala) REFERENCES sala(id_sala) ON DELETE CASCADE
);

-- ============================================
-- Tabla: mensaje_chat_ia
-- Descripción: Almacena los mensajes del chat entre usuarios e IA
-- ============================================
CREATE TABLE IF NOT EXISTS mensaje_chat_ia (
    id_mensaje SERIAL PRIMARY KEY,
    id_conversacion INTEGER NOT NULL,
    id_usuario INTEGER, -- NULL si es mensaje de la IA
    tipo_mensaje VARCHAR(20) NOT NULL CHECK (tipo_mensaje IN ('usuario', 'ia', 'sistema')),
    contenido TEXT NOT NULL,
    metadata JSONB, -- Información adicional como tokens usados, modelo, etc.
    fecha_envio TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_conversacion) REFERENCES conversacion_ia(id_conversacion) ON DELETE CASCADE,
    FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario) ON DELETE SET NULL
);

-- ============================================
-- Tabla: snapshot_diagrama
-- Descripción: Guarda instantáneas del diagrama cuando la IA lo modifica
-- ============================================
CREATE TABLE IF NOT EXISTS snapshot_diagrama (
    id_snapshot SERIAL PRIMARY KEY,
    id_conversacion INTEGER NOT NULL,
    id_mensaje INTEGER, -- Mensaje que generó este snapshot (puede ser NULL)
    diagrama_json JSONB NOT NULL,
    descripcion TEXT,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_conversacion) REFERENCES conversacion_ia(id_conversacion) ON DELETE CASCADE,
    FOREIGN KEY (id_mensaje) REFERENCES mensaje_chat_ia(id_mensaje) ON DELETE SET NULL
);

-- ============================================
-- Tabla: config_ia
-- Descripción: Configuración de la IA por sala (modelo, temperatura, etc.)
-- ============================================
CREATE TABLE IF NOT EXISTS config_ia (
    id_config SERIAL PRIMARY KEY,
    id_sala INTEGER NOT NULL UNIQUE,
    modelo VARCHAR(100) DEFAULT 'claude-sonnet-4.5', -- claude-sonnet-4.5, claude-opus-4, gpt-4, gpt-3.5-turbo
    temperatura DECIMAL(3,2) DEFAULT 0.2,
    max_tokens INTEGER DEFAULT 16000,
    system_prompt TEXT DEFAULT 'Eres un experto en UML y diseño de software. Analiza diagramas, sugiere mejoras y genera código.',
    configuracion_extra JSONB,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_sala) REFERENCES sala(id_sala) ON DELETE CASCADE
);

-- ============================================
-- Índices para mejorar el rendimiento
-- ============================================
CREATE INDEX IF NOT EXISTS idx_conversacion_sala ON conversacion_ia(id_sala);
CREATE INDEX IF NOT EXISTS idx_conversacion_activa ON conversacion_ia(activa);
CREATE INDEX IF NOT EXISTS idx_mensaje_conversacion ON mensaje_chat_ia(id_conversacion);
CREATE INDEX IF NOT EXISTS idx_mensaje_fecha ON mensaje_chat_ia(fecha_envio);
CREATE INDEX IF NOT EXISTS idx_mensaje_tipo ON mensaje_chat_ia(tipo_mensaje);
CREATE INDEX IF NOT EXISTS idx_snapshot_conversacion ON snapshot_diagrama(id_conversacion);
CREATE INDEX IF NOT EXISTS idx_snapshot_fecha ON snapshot_diagrama(fecha_creacion);

-- ============================================
-- Función para actualizar fecha_ultima_actualizacion
-- ============================================
CREATE OR REPLACE FUNCTION actualizar_fecha_conversacion()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE conversacion_ia 
    SET fecha_ultima_actualizacion = CURRENT_TIMESTAMP 
    WHERE id_conversacion = NEW.id_conversacion;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Trigger para actualizar automáticamente la fecha
-- ============================================
CREATE TRIGGER trigger_actualizar_fecha_conversacion
AFTER INSERT ON mensaje_chat_ia
FOR EACH ROW
EXECUTE FUNCTION actualizar_fecha_conversacion();

-- ============================================
-- Comentarios en las tablas
-- ============================================
COMMENT ON TABLE conversacion_ia IS 'Almacena las conversaciones de IA vinculadas a salas de diagramas';
COMMENT ON TABLE mensaje_chat_ia IS 'Mensajes del chat entre usuarios e IA dentro de una conversación';
COMMENT ON TABLE snapshot_diagrama IS 'Instantáneas del estado del diagrama en diferentes momentos';
COMMENT ON TABLE config_ia IS 'Configuración personalizada de la IA por sala';

COMMENT ON COLUMN mensaje_chat_ia.tipo_mensaje IS 'Tipo de mensaje: usuario (enviado por usuario), ia (respuesta de IA), sistema (notificación del sistema)';
COMMENT ON COLUMN mensaje_chat_ia.metadata IS 'JSON con información adicional como tokens consumidos, modelo usado, tiempo de respuesta, etc.';
COMMENT ON COLUMN snapshot_diagrama.diagrama_json IS 'Estado completo del diagrama en formato JSON (JointJS)';
