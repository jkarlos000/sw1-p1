-- =====================================================
-- SCHEMA PARA MÉTODOS UML 2.5
-- Sistema UML Colaborativo - Persistencia de Métodos
-- =====================================================

-- Tabla: clase_uml
-- Almacena las clases UML de un diagrama
CREATE TABLE IF NOT EXISTS clase_uml (
    id_clase SERIAL PRIMARY KEY,
    id_sala INTEGER NOT NULL,
    cell_id VARCHAR(255) NOT NULL, -- ID de la celda en JointJS
    nombre_clase VARCHAR(255) NOT NULL,
    x_position DECIMAL(10,2),
    y_position DECIMAL(10,2),
    ancho DECIMAL(10,2),
    alto DECIMAL(10,2),
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_sala) REFERENCES sala(id_sala) ON DELETE CASCADE,
    UNIQUE(id_sala, cell_id)
);

-- Tabla: atributo_clase
-- Almacena los atributos de una clase
CREATE TABLE IF NOT EXISTS atributo_clase (
    id_atributo SERIAL PRIMARY KEY,
    id_clase INTEGER NOT NULL,
    nombre VARCHAR(255) NOT NULL,
    tipo VARCHAR(100) NOT NULL DEFAULT 'String',
    visibility VARCHAR(20) NOT NULL DEFAULT 'private' CHECK (visibility IN ('public', 'private', 'protected', 'package')),
    es_static BOOLEAN DEFAULT FALSE,
    valor_default VARCHAR(500),
    orden_visualizacion INTEGER DEFAULT 0,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_clase) REFERENCES clase_uml(id_clase) ON DELETE CASCADE
);

-- Tabla: metodo_clase
-- Almacena los métodos de una clase
CREATE TABLE IF NOT EXISTS metodo_clase (
    id_metodo SERIAL PRIMARY KEY,
    id_clase INTEGER NOT NULL,
    nombre VARCHAR(255) NOT NULL,
    tipo_retorno VARCHAR(100) NOT NULL DEFAULT 'void',
    visibility VARCHAR(20) NOT NULL DEFAULT 'public' CHECK (visibility IN ('public', 'private', 'protected', 'package')),
    es_static BOOLEAN DEFAULT FALSE,
    es_abstract BOOLEAN DEFAULT FALSE,
    orden_visualizacion INTEGER DEFAULT 0,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_clase) REFERENCES clase_uml(id_clase) ON DELETE CASCADE
);

-- Tabla: parametro_metodo
-- Almacena los parámetros de un método
CREATE TABLE IF NOT EXISTS parametro_metodo (
    id_parametro SERIAL PRIMARY KEY,
    id_metodo INTEGER NOT NULL,
    nombre VARCHAR(255) NOT NULL,
    tipo VARCHAR(100) NOT NULL DEFAULT 'Object',
    orden_parametro INTEGER NOT NULL,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_metodo) REFERENCES metodo_clase(id_metodo) ON DELETE CASCADE
);

-- ============================================
-- ÍNDICES PARA RENDIMIENTO
-- ============================================

CREATE INDEX IF NOT EXISTS idx_clase_sala ON clase_uml(id_sala);
CREATE INDEX IF NOT EXISTS idx_clase_cell_id ON clase_uml(cell_id);
CREATE INDEX IF NOT EXISTS idx_atributo_clase ON atributo_clase(id_clase);
CREATE INDEX IF NOT EXISTS idx_metodo_clase ON metodo_clase(id_clase);
CREATE INDEX IF NOT EXISTS idx_parametro_metodo ON parametro_metodo(id_metodo);

-- ============================================
-- TRIGGERS PARA ACTUALIZAR FECHA
-- ============================================

-- Función para actualizar fecha_actualizacion
CREATE OR REPLACE FUNCTION actualizar_fecha_clase()
RETURNS TRIGGER AS $$
BEGIN
    NEW.fecha_actualizacion = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para clase_uml
DROP TRIGGER IF EXISTS trigger_actualizar_fecha_clase ON clase_uml;
CREATE TRIGGER trigger_actualizar_fecha_clase
BEFORE UPDATE ON clase_uml
FOR EACH ROW
EXECUTE FUNCTION actualizar_fecha_clase();

-- ============================================
-- COMENTARIOS
-- ============================================

COMMENT ON TABLE clase_uml IS 'Clases UML del diagrama con su posición y nombre';
COMMENT ON TABLE atributo_clase IS 'Atributos de las clases con tipo, visibilidad y valor por defecto';
COMMENT ON TABLE metodo_clase IS 'Métodos de las clases con tipo de retorno y modificadores';
COMMENT ON TABLE parametro_metodo IS 'Parámetros de los métodos con nombre y tipo';

COMMENT ON COLUMN clase_uml.cell_id IS 'ID único de la celda en el gráfico JointJS';
COMMENT ON COLUMN atributo_clase.visibility IS 'Visibilidad UML: public (+), private (-), protected (#), package (~)';
COMMENT ON COLUMN metodo_clase.visibility IS 'Visibilidad UML: public (+), private (-), protected (#), package (~)';
COMMENT ON COLUMN metodo_clase.es_abstract IS 'Indica si el método es abstracto (se renderiza en cursiva)';
COMMENT ON COLUMN parametro_metodo.orden_parametro IS 'Orden de los parámetros en la firma del método';
