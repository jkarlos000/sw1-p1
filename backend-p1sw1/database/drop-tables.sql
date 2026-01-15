-- Script para eliminar todas las tablas
-- ADVERTENCIA: Este script eliminará todos los datos
-- Base de datos: parcial1sw1

-- ============================================
-- Eliminar tablas en orden correcto (respetando foreign keys)
-- ============================================
DROP TABLE IF EXISTS asistencia CASCADE;
DROP TABLE IF EXISTS sala CASCADE;
DROP TABLE IF EXISTS usuario CASCADE;

-- Mensaje de confirmación
SELECT 'Todas las tablas han sido eliminadas exitosamente' AS mensaje;
