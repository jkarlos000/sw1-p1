-- =====================================================
-- SCHEMA COMPLETO DEL SISTEMA
-- Sistema UML Colaborativo con IA
-- Incluye: Usuarios, Salas, Chat IA, Multimodal
-- =====================================================

-- ============================================
-- TABLAS PRINCIPALES (Usuarios y Salas)
-- ============================================

-- Tabla: usuario
CREATE TABLE IF NOT EXISTS usuario (
    id_usuario SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla: sala
CREATE TABLE IF NOT EXISTS sala (
    id_sala SERIAL PRIMARY KEY,
    nombre_sala VARCHAR(255) NOT NULL UNIQUE,
    host_sala VARCHAR(255) NOT NULL,
    informacion TEXT,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (host_sala) REFERENCES usuario(email) ON DELETE CASCADE
);

-- Tabla: asistencia
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
-- CHAT CON IA
-- ============================================

-- Tabla: conversacion_ia
CREATE TABLE IF NOT EXISTS conversacion_ia (
    id_conversacion SERIAL PRIMARY KEY,
    id_sala INTEGER NOT NULL,
    titulo VARCHAR(500),
    contexto_inicial JSONB,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_ultima_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    activa BOOLEAN DEFAULT true,
    FOREIGN KEY (id_sala) REFERENCES sala(id_sala) ON DELETE CASCADE
);

-- Tabla: mensaje_chat_ia
CREATE TABLE IF NOT EXISTS mensaje_chat_ia (
    id_mensaje SERIAL PRIMARY KEY,
    id_conversacion INTEGER NOT NULL,
    id_usuario INTEGER,
    tipo_mensaje VARCHAR(20) NOT NULL CHECK (tipo_mensaje IN ('usuario', 'ia', 'sistema')),
    contenido TEXT NOT NULL,
    metadata JSONB,
    tiene_attachments BOOLEAN DEFAULT FALSE,
    metadata_multimodal JSONB,
    fecha_envio TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_conversacion) REFERENCES conversacion_ia(id_conversacion) ON DELETE CASCADE,
    FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario) ON DELETE SET NULL
);

-- Tabla: snapshot_diagrama
CREATE TABLE IF NOT EXISTS snapshot_diagrama (
    id_snapshot SERIAL PRIMARY KEY,
    id_conversacion INTEGER NOT NULL,
    id_mensaje INTEGER,
    diagrama_json JSONB NOT NULL,
    descripcion TEXT,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_conversacion) REFERENCES conversacion_ia(id_conversacion) ON DELETE CASCADE,
    FOREIGN KEY (id_mensaje) REFERENCES mensaje_chat_ia(id_mensaje) ON DELETE SET NULL
);

-- Tabla: config_ia
CREATE TABLE IF NOT EXISTS config_ia (
    id_config SERIAL PRIMARY KEY,
    id_sala INTEGER NOT NULL UNIQUE,
    modelo VARCHAR(100) DEFAULT 'claude-sonnet-4.5',
    temperatura DECIMAL(3,2) DEFAULT 0.2,
    max_tokens INTEGER DEFAULT 16000,
    system_prompt TEXT DEFAULT 'Eres un experto en UML y diseño de software. Analiza diagramas, sugiere mejoras y genera código.',
    configuracion_extra JSONB,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_sala) REFERENCES sala(id_sala) ON DELETE CASCADE
);

-- ============================================
-- MULTIMODAL (Audio + Imágenes)
-- ============================================

-- Tabla: mensaje_attachment
CREATE TABLE IF NOT EXISTS mensaje_attachment (
    id SERIAL PRIMARY KEY,
    mensaje_id INTEGER NOT NULL REFERENCES mensaje_chat_ia(id_mensaje) ON DELETE CASCADE,
    tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('audio', 'imagen')),
    archivo_url VARCHAR(500) NOT NULL,
    archivo_nombre VARCHAR(255) NOT NULL,
    archivo_tamano INTEGER,
    mime_type VARCHAR(100),
    
    -- Solo para audio
    transcripcion TEXT,
    duracion_segundos DECIMAL(10,2),
    servicio_transcripcion VARCHAR(50),
    
    -- Solo para imágenes
    ancho INTEGER,
    alto INTEGER,
    analisis_ia JSONB,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- ÍNDICES PARA RENDIMIENTO
-- ============================================

-- Índices de usuario y sala
CREATE INDEX IF NOT EXISTS idx_usuario_email ON usuario(email);
CREATE INDEX IF NOT EXISTS idx_sala_nombre ON sala(nombre_sala);
CREATE INDEX IF NOT EXISTS idx_sala_host ON sala(host_sala);
CREATE INDEX IF NOT EXISTS idx_asistencia_usuario ON asistencia(id_usuario);
CREATE INDEX IF NOT EXISTS idx_asistencia_sala ON asistencia(id_sala);

-- Índices de chat IA
CREATE INDEX IF NOT EXISTS idx_conversacion_sala ON conversacion_ia(id_sala);
CREATE INDEX IF NOT EXISTS idx_conversacion_activa ON conversacion_ia(activa);
CREATE INDEX IF NOT EXISTS idx_mensaje_conversacion ON mensaje_chat_ia(id_conversacion);
CREATE INDEX IF NOT EXISTS idx_mensaje_fecha ON mensaje_chat_ia(fecha_envio);
CREATE INDEX IF NOT EXISTS idx_mensaje_tipo ON mensaje_chat_ia(tipo_mensaje);
CREATE INDEX IF NOT EXISTS idx_mensaje_chat_ia_attachments ON mensaje_chat_ia(tiene_attachments) WHERE tiene_attachments = TRUE;
CREATE INDEX IF NOT EXISTS idx_snapshot_conversacion ON snapshot_diagrama(id_conversacion);
CREATE INDEX IF NOT EXISTS idx_snapshot_fecha ON snapshot_diagrama(fecha_creacion);

-- Índices de attachments multimodales
CREATE INDEX IF NOT EXISTS idx_mensaje_attachment_mensaje ON mensaje_attachment(mensaje_id);
CREATE INDEX IF NOT EXISTS idx_mensaje_attachment_tipo ON mensaje_attachment(tipo);

-- ============================================
-- FUNCIONES Y TRIGGERS
-- ============================================

-- Función para actualizar fecha_ultima_actualizacion
CREATE OR REPLACE FUNCTION actualizar_fecha_conversacion()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE conversacion_ia 
    SET fecha_ultima_actualizacion = CURRENT_TIMESTAMP 
    WHERE id_conversacion = NEW.id_conversacion;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar automáticamente la fecha
DROP TRIGGER IF EXISTS trigger_actualizar_fecha_conversacion ON mensaje_chat_ia;
CREATE TRIGGER trigger_actualizar_fecha_conversacion
AFTER INSERT ON mensaje_chat_ia
FOR EACH ROW
EXECUTE FUNCTION actualizar_fecha_conversacion();

-- ============================================
-- COMENTARIOS EN LAS TABLAS
-- ============================================

-- Tablas principales
COMMENT ON TABLE usuario IS 'Almacena información de los usuarios registrados en el sistema';
COMMENT ON TABLE sala IS 'Almacena las salas de trabajo creadas por los usuarios';
COMMENT ON TABLE asistencia IS 'Registra la participación de usuarios en salas específicas';

-- Chat IA
COMMENT ON TABLE conversacion_ia IS 'Almacena las conversaciones de IA vinculadas a salas de diagramas';
COMMENT ON TABLE mensaje_chat_ia IS 'Mensajes del chat entre usuarios e IA dentro de una conversación';
COMMENT ON TABLE snapshot_diagrama IS 'Instantáneas del estado del diagrama en diferentes momentos';
COMMENT ON TABLE config_ia IS 'Configuración personalizada de la IA por sala';

-- Multimodal
COMMENT ON TABLE mensaje_attachment IS 'Almacena múltiples archivos (audio/imagen) adjuntos a mensajes del chat IA';

-- Columnas específicas
COMMENT ON COLUMN mensaje_chat_ia.tipo_mensaje IS 'Tipo de mensaje: usuario (enviado por usuario), ia (respuesta de IA), sistema (notificación del sistema)';
COMMENT ON COLUMN mensaje_chat_ia.metadata IS 'JSON con información adicional como tokens consumidos, modelo usado, tiempo de respuesta, etc.';
COMMENT ON COLUMN mensaje_chat_ia.tiene_attachments IS 'Indica si el mensaje tiene archivos adjuntos (audio/imagen)';
COMMENT ON COLUMN mensaje_chat_ia.metadata_multimodal IS 'Resumen: cantidad de audios, imágenes, duración total, etc.';
COMMENT ON COLUMN snapshot_diagrama.diagrama_json IS 'Estado completo del diagrama en formato JSON (JointJS)';
COMMENT ON COLUMN mensaje_attachment.transcripcion IS 'Texto transcrito del audio (Whisper, AssemblyAI, etc.)';
COMMENT ON COLUMN mensaje_attachment.analisis_ia IS 'Análisis visual de Claude: clases detectadas, estructura UML, etc.';
