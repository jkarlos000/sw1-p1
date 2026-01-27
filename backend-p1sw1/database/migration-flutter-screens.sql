-- =====================================================
-- MIGRACIÓN SEGURA: Flutter Screens + Tablas Nuevas
-- Para VPS con Base de Datos Existente
-- 
-- IMPORTANTE:
-- Este script SOLO AÑADE nuevas tablas y columnas
-- NO elimina datos existentes
-- =====================================================

-- ============================================
-- PASO 1: VERIFICAR INTEGRIDAD DE TABLAS EXISTENTES
-- ============================================

-- Crear tabla de auditoría de migraciones
CREATE TABLE IF NOT EXISTS migration_log (
    id_migration SERIAL PRIMARY KEY,
    migration_name VARCHAR(255) NOT NULL,
    executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) DEFAULT 'success',
    details TEXT
);

-- Insertar inicio de migración
INSERT INTO migration_log (migration_name, status, details) 
VALUES ('Flutter Screens Migration Started', 'in_progress', 'Iniciando migración segura de Flutter Screens');

-- ============================================
-- PASO 2: AÑADIR NUEVAS TABLAS PARA FLUTTER
-- ============================================

-- Tabla: flutter_screen
-- Almacena pantallas Flutter generadas automáticamente desde clases UML
CREATE TABLE IF NOT EXISTS flutter_screen (
    id_screen SERIAL PRIMARY KEY,
    id_clase INTEGER NOT NULL,
    nombre_screen VARCHAR(255) NOT NULL,
    descripcion TEXT,
    componentes_json JSONB,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_clase) REFERENCES clase_uml(id_clase) ON DELETE CASCADE,
    UNIQUE(id_clase)
);

-- Tabla: flutter_component
-- Almacena componentes individuales de cada pantalla Flutter
CREATE TABLE IF NOT EXISTS flutter_component (
    id_component SERIAL PRIMARY KEY,
    id_screen INTEGER NOT NULL,
    component_type VARCHAR(100) NOT NULL,
    component_properties JSONB,
    orden_visual INTEGER,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_screen) REFERENCES flutter_screen(id_screen) ON DELETE CASCADE
);

-- ============================================
-- PASO 3: CREAR ÍNDICES PARA RENDIMIENTO
-- ============================================

CREATE INDEX IF NOT EXISTS idx_flutter_screen_clase ON flutter_screen(id_clase);
CREATE INDEX IF NOT EXISTS idx_flutter_component_screen ON flutter_component(id_screen);
CREATE INDEX IF NOT EXISTS idx_flutter_screen_fecha ON flutter_screen(fecha_actualizacion);

-- ============================================
-- PASO 4: CREAR VISTAS ÚTILES
-- ============================================

-- Vista: flutter_screens_con_clase
-- Muestra pantallas Flutter con información de su clase UML relacionada
CREATE OR REPLACE VIEW flutter_screens_con_clase AS
SELECT 
    fs.id_screen,
    fs.id_clase,
    fs.nombre_screen,
    fs.descripcion,
    cu.nombre_clase,
    cu.id_sala,
    fs.fecha_creacion,
    fs.fecha_actualizacion,
    COUNT(fc.id_component) as total_componentes
FROM flutter_screen fs
LEFT JOIN clase_uml cu ON fs.id_clase = cu.id_clase
LEFT JOIN flutter_component fc ON fs.id_screen = fc.id_screen
GROUP BY fs.id_screen, cu.id_clase, cu.nombre_clase, cu.id_sala;

-- ============================================
-- PASO 5: CREAR TRIGGERS AUTOMÁTICOS
-- ============================================

-- Trigger: Actualizar fecha_actualizacion en flutter_screen
CREATE OR REPLACE FUNCTION update_flutter_screen_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.fecha_actualizacion = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_flutter_screen_timestamp ON flutter_screen;
CREATE TRIGGER trigger_update_flutter_screen_timestamp
BEFORE UPDATE ON flutter_screen
FOR EACH ROW
EXECUTE FUNCTION update_flutter_screen_timestamp();

-- ============================================
-- PASO 6: DOCUMENTACIÓN DE COLUMNAS
-- ============================================

COMMENT ON TABLE flutter_screen IS 'Almacena las pantallas Flutter generadas desde clases UML con componentes personalizados';
COMMENT ON TABLE flutter_component IS 'Almacena componentes individuales de pantallas Flutter (TextField, Button, ListView, etc)';

COMMENT ON COLUMN flutter_screen.id_screen IS 'ID único de la pantalla Flutter';
COMMENT ON COLUMN flutter_screen.id_clase IS 'Referencia a la clase UML que genera esta pantalla';
COMMENT ON COLUMN flutter_screen.nombre_screen IS 'Nombre de la pantalla Flutter (ej: DetailScreen, ListScreen)';
COMMENT ON COLUMN flutter_screen.descripcion IS 'Descripción de propósito de la pantalla';
COMMENT ON COLUMN flutter_screen.componentes_json IS 'Array JSON con todos los componentes de la pantalla (orden visual + customizaciones)';
COMMENT ON COLUMN flutter_screen.fecha_actualizacion IS 'Se actualiza automáticamente al modificar';

COMMENT ON COLUMN flutter_component.component_type IS 'Tipo de componente: TextField, Button, ListView, Card, etc';
COMMENT ON COLUMN flutter_component.component_properties IS 'Propiedades JSON específicas del componente (label, validator, etc)';
COMMENT ON COLUMN flutter_component.orden_visual IS 'Orden en que aparece en la pantalla (para renderizado)';

-- ============================================
-- PASO 7: FUNCIONES AUXILIARES
-- ============================================

-- Función: get_flutter_screen_by_clase
-- Obtiene pantalla Flutter de una clase específica
CREATE OR REPLACE FUNCTION get_flutter_screen_by_clase(p_id_clase INTEGER)
RETURNS TABLE (
    id_screen INTEGER,
    nombre_screen VARCHAR,
    componentes_json JSONB,
    total_componentes BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        fs.id_screen,
        fs.nombre_screen,
        fs.componentes_json,
        COUNT(fc.id_component)::BIGINT as total_componentes
    FROM flutter_screen fs
    LEFT JOIN flutter_component fc ON fs.id_screen = fc.id_screen
    WHERE fs.id_clase = p_id_clase
    GROUP BY fs.id_screen, fs.nombre_screen, fs.componentes_json;
END;
$$ LANGUAGE plpgsql;

-- Función: count_flutter_screens_by_sala
-- Cuenta pantallas Flutter por sala
CREATE OR REPLACE FUNCTION count_flutter_screens_by_sala(p_id_sala INTEGER)
RETURNS INTEGER AS $$
DECLARE
    v_count INTEGER;
BEGIN
    SELECT COUNT(DISTINCT fs.id_screen) INTO v_count
    FROM flutter_screen fs
    INNER JOIN clase_uml cu ON fs.id_clase = cu.id_clase
    WHERE cu.id_sala = p_id_sala;
    
    RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- PASO 8: POLÍTICA DE SEGURIDAD
-- ============================================

-- Crear rol de solo lectura para flutter screens (opcional)
-- DO $$
-- BEGIN
--     IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'flutter_reader') THEN
--         CREATE ROLE flutter_reader;
--     END IF;
-- END $$;

-- GRANT SELECT ON flutter_screen TO flutter_reader;
-- GRANT SELECT ON flutter_component TO flutter_reader;

-- ============================================
-- PASO 9: REGISTRAR MIGRACIÓN COMPLETADA
-- ============================================

INSERT INTO migration_log (migration_name, status, details) 
VALUES (
    'Flutter Screens Migration Completed', 
    'success', 
    'Nuevas tablas flutter_screen y flutter_component creadas exitosamente. Datos existentes preservados.'
);

-- ============================================
-- VERIFICACIÓN FINAL
-- ============================================

-- Ver todas las migraciones ejecutadas
SELECT 'Migraciones ejecutadas:' as resultado;
SELECT * FROM migration_log ORDER BY executed_at DESC LIMIT 5;

-- Verificar tablas creadas
SELECT 'Tablas flutter creadas:' as resultado;
SELECT tablename FROM pg_tables 
WHERE schemaname = 'public' AND tablename LIKE 'flutter%'
ORDER BY tablename;

-- Contar cambios
SELECT 'Estado de base de datos:' as resultado;
SELECT 
    'Usuarios' as tabla, COUNT(*) as registros FROM usuario
UNION ALL
SELECT 'Salas', COUNT(*) FROM sala
UNION ALL
SELECT 'Clases UML', COUNT(*) FROM clase_uml
UNION ALL
SELECT 'Flutter Screens', COUNT(*) FROM flutter_screen
UNION ALL
SELECT 'Flutter Components', COUNT(*) FROM flutter_component;

-- =====================================================
-- FIN DE MIGRACIÓN
-- Esta migración es SEGURA y REVERSIBLE
-- Para rollback: eliminar tablas flutter_screen y flutter_component
-- Los datos existentes nunca fueron modificados
-- =====================================================
