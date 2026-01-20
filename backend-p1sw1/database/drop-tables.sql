-- =====================================================
-- DROP ALL TABLES - Sistema UML Colaborativo con IA
-- ADVERTENCIA: Este script eliminará TODOS los datos
-- Base de datos: parcial1sw1
-- =====================================================

-- ============================================
-- Eliminar tablas en orden correcto (respetando foreign keys)
-- ============================================

-- Tablas UML 2.5
DROP TABLE IF EXISTS parametro_metodo CASCADE;
DROP TABLE IF EXISTS metodo_clase CASCADE;
DROP TABLE IF EXISTS atributo_clase CASCADE;
DROP TABLE IF EXISTS clase_uml CASCADE;

-- Tablas de funcionalidades de IA
DROP TABLE IF EXISTS mensaje_attachment CASCADE;
DROP TABLE IF EXISTS snapshot_diagrama CASCADE;
DROP TABLE IF EXISTS mensaje_chat_ia CASCADE;
DROP TABLE IF EXISTS conversacion_ia CASCADE;
DROP TABLE IF EXISTS config_ia CASCADE;

-- Tablas de salas y usuarios
DROP TABLE IF EXISTS asistencia CASCADE;
DROP TABLE IF EXISTS sala CASCADE;
DROP TABLE IF EXISTS usuario CASCADE;

-- Eliminar funciones y triggers
DROP FUNCTION IF EXISTS actualizar_fecha_conversacion() CASCADE;
DROP FUNCTION IF EXISTS actualizar_fecha_clase() CASCADE;

-- Mensaje de confirmación
DO $$
BEGIN
    RAISE NOTICE '============================================';
    RAISE NOTICE 'TODAS LAS TABLAS HAN SIDO ELIMINADAS';
    RAISE NOTICE '============================================';
    RAISE NOTICE 'Tablas eliminadas:';
    RAISE NOTICE '  - usuario';
    RAISE NOTICE '  - sala';
    RAISE NOTICE '  - asistencia';
    RAISE NOTICE '  - conversacion_ia';
    RAISE NOTICE '  - mensaje_chat_ia';
    RAISE NOTICE '  - mensaje_attachment (multimodal)';
    RAISE NOTICE '  - snapshot_diagrama';
    RAISE NOTICE '  - config_ia';
    RAISE NOTICE '  - clase_uml';
    RAISE NOTICE '  - atributo_clase';
    RAISE NOTICE '  - metodo_clase';
    RAISE NOTICE '  - parametro_metodo';
    RAISE NOTICE '============================================';
END $$;
