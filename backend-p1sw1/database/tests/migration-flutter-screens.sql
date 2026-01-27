-- ==============================================================================
-- HISTÓRICO DE MIGRACIÓN: FLUTTER SCREENS (2026-01-27)
-- ==============================================================================
-- Este archivo documenta cómo se agregó soporte de Flutter Screens al sistema.
-- Fue fusionado en schema.sql y se mantiene aquí como referencia histórica.
--
-- CONTEXTO:
-- - Fecha: 2026-01-27
-- - Problema: Clases UML no podían guardar estructura de pantallas Flutter
-- - Solución: Nuevas tablas flutter_screen y flutter_component
--
-- ==============================================================================

-- Tablas originales (ya existían):
-- - clase_uml (id_clase, nombre, id_sala, etc)
-- - atributo_clase (id_atributo, id_clase, nombre, tipo, etc)
-- - metodo_clase (id_metodo, id_clase, nombre, tipo_retorno, etc)


-- ==============================================================================
-- TABLAS NUEVAS AGREGADAS EN 2026-01-27
-- ==============================================================================

-- TABLA 1: flutter_screen
-- Representa una pantalla Flutter generada desde una clase UML
-- Relación: 1 clase UML = 1 pantalla Flutter

CREATE TABLE IF NOT EXISTS flutter_screen (
    id_screen SERIAL PRIMARY KEY,
    id_clase INTEGER NOT NULL UNIQUE,  -- Foreign key a clase_uml
    nombre_screen VARCHAR(255) NOT NULL,
    componentes_json JSONB DEFAULT '[]'::jsonb,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_clase_flutter_screen 
        FOREIGN KEY (id_clase) 
        REFERENCES clase_uml(id_clase) 
        ON DELETE CASCADE
);

-- Índices para flutter_screen
CREATE INDEX IF NOT EXISTS idx_flutter_screen_id_clase 
    ON flutter_screen(id_clase);


-- TABLA 2: flutter_component
-- Representa componentes dentro de una pantalla Flutter
-- Puede ser un TextField, Button, Card, etc. generado desde atributo/método

CREATE TABLE IF NOT EXISTS flutter_component (
    id_component SERIAL PRIMARY KEY,
    id_screen INTEGER NOT NULL,           -- Foreign key a flutter_screen
    id_atributo INTEGER,                  -- Foreign key a atributo_clase (opcional)
    id_metodo INTEGER,                    -- Foreign key a metodo_clase (opcional)
    tipo_componente VARCHAR(100),         -- Ej: TextField, Button, Card, ListTile
    label_custom VARCHAR(255),            -- Etiqueta personalizada
    propiedades_json JSONB DEFAULT '{}'::jsonb,
    posicion_x DECIMAL(5,2),
    posicion_y DECIMAL(5,2),
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_screen_flutter_component 
        FOREIGN KEY (id_screen) 
        REFERENCES flutter_screen(id_screen) 
        ON DELETE CASCADE,
    CONSTRAINT fk_atributo_flutter_component 
        FOREIGN KEY (id_atributo) 
        REFERENCES atributo_clase(id_atributo) 
        ON DELETE SET NULL,
    CONSTRAINT fk_metodo_flutter_component 
        FOREIGN KEY (id_metodo) 
        REFERENCES metodo_clase(id_metodo) 
        ON DELETE SET NULL
);

-- Índices para flutter_component
CREATE INDEX IF NOT EXISTS idx_flutter_component_id_screen 
    ON flutter_component(id_screen);
CREATE INDEX IF NOT EXISTS idx_flutter_component_id_atributo 
    ON flutter_component(id_atributo);
CREATE INDEX IF NOT EXISTS idx_flutter_component_id_metodo 
    ON flutter_component(id_metodo);


-- ==============================================================================
-- TRIGGER PARA AUTO-ACTUALIZAR fecha_actualizacion
-- ==============================================================================
-- Actualiza automáticamente el campo fecha_actualizacion cada vez que cambia un registro

CREATE OR REPLACE FUNCTION actualizar_fecha_actualizacion()
RETURNS TRIGGER AS $$
BEGIN
    NEW.fecha_actualizacion = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para flutter_screen
DROP TRIGGER IF EXISTS trigger_actualizar_flutter_screen ON flutter_screen;
CREATE TRIGGER trigger_actualizar_flutter_screen
BEFORE UPDATE ON flutter_screen
FOR EACH ROW
EXECUTE FUNCTION actualizar_fecha_actualizacion();

-- Trigger para flutter_component
DROP TRIGGER IF EXISTS trigger_actualizar_flutter_component ON flutter_component;
CREATE TRIGGER trigger_actualizar_flutter_component
BEFORE UPDATE ON flutter_component
FOR EACH ROW
EXECUTE FUNCTION actualizar_fecha_actualizacion();


-- ==============================================================================
-- CÓMO SE INTEGRÓ CON EL CÓDIGO
-- ==============================================================================
--
-- BACKEND (Node.js/TypeScript):
-- 1. Nuevo archivo: flutter-screen.controller.ts
--    - sincronizarClaseAntigua(): Crea flutter_screen para clases sin migrar
--    - migrarSalaCompleta(): Migra todas las clases de una sala
--    - generarComponentes(): Crea componentes desde atributos/métodos
--
-- 2. Nuevas rutas en router.ts:
--    POST /flutter-screen/sincronizar/{id_sala}/{id_clase}
--    POST /flutter-screen/migrar-sala/{id_sala}
--
-- FRONTEND (Angular):
-- 1. Nuevo servicio: clase-persistencia.service.ts
--    - sincronizarClaseAntigua(id_sala, id_clase)
--    - migrarSalaCompleta(id_sala)
--
-- 2. Modificación en diagramador.component.ts:
--    - sincronizarYGenerarFlutterScreen(): Detección automática de diagramas antiguos
--    - Integración con generarFlutterScreenDesdeClase()
--
-- DATABASE:
-- 1. Integración en schema.sql (aquí está el contenido)
-- 2. Trigger automático para fecha_actualizacion


-- ==============================================================================
-- PROBLEMAS QUE RESUELVE
-- ==============================================================================
--
-- PROBLEMA 1: Diagramas antiguos no persisten cambios
--   - Clases creadas ANTES de 2026-01-27 no tenían flutter_screen
--   - Cambios se guardaban en caché pero no en BD
--   - Solución: sincronizarClaseAntigua() crea registro en flutter_screen
--
-- PROBLEMA 2: ¿Cómo saber si una clase está sincronizada?
--   - SELECT * FROM flutter_screen WHERE id_clase = X
--   - Si devuelve NULL, falta sincronización
--   - Solución: Sistema automático detecta y sincroniza
--
-- PROBLEMA 3: Migración en lote es muy lenta
--   - Opción 1 (automática) actualiza 1 clase a la vez
--   - Opción 3 (bulk) migra toda una sala de una vez
--   - Solución: POST /flutter-screen/migrar-sala/{id_sala}


-- ==============================================================================
-- GUÍA RÁPIDA: 3 OPCIONES DE SINCRONIZACIÓN
-- ==============================================================================
--
-- OPCIÓN 1: AUTOMÁTICA (Recomendada)
--   - Usuario abre diagrama antiguo
--   - Click en clase → Sistema detecta y sincroniza automáticamente
--   - No requiere acción manual
--   - Se ejecuta: sincronizarYGenerarFlutterScreen() en frontend
--
-- OPCIÓN 2: MANUAL POR CLASE
--   - Endpoint: POST /flutter-screen/sincronizar/{id_sala}/{id_clase}
--   - Útil para sincronizar 1 clase específica
--   - Respuesta: {"clase_sincronizada": true}
--
-- OPCIÓN 3: MIGRACIÓN EN LOTE
--   - Endpoint: POST /flutter-screen/migrar-sala/{id_sala}
--   - Sincroniza todas las clases antiguas de una sala
--   - Respuesta: {"migracion_completada": "7/7 clases sincronizadas"}


-- ==============================================================================
-- VALIDACIÓN DE LA MIGRACIÓN
-- ==============================================================================
--
-- Ejecuta estos queries para verificar:
--
-- 1. ¿Cuántas clases están sin sincronizar?
--    SELECT COUNT(*) FROM clase_uml WHERE id_clase NOT IN (
--        SELECT id_clase FROM flutter_screen
--    );
--
-- 2. ¿Todos los componentes se crearon correctamente?
--    SELECT s.id_screen, COUNT(c.id_component) as componentes
--    FROM flutter_screen s
--    LEFT JOIN flutter_component c ON s.id_screen = c.id_screen
--    GROUP BY s.id_screen;
--
-- 3. ¿Hay integridad referencial?
--    SELECT * FROM flutter_component
--    WHERE id_atributo IS NOT NULL
--    AND id_atributo NOT IN (SELECT id_atributo FROM atributo_clase);


-- ==============================================================================
-- REFERENCIAS EN LA DOCUMENTACIÓN
-- ==============================================================================
--
-- Documentos relacionados:
-- - FLUTTER_SCREENS_DIAGRAMAS_ANTIGUOS.md: Guía completa del sistema
-- - SOLUCION_DIAGRAMAS_ANTIGUOS.md: Detalles técnicos de la solución
-- - tests/flutter-debugging.sql: Queries para debugging
-- - tests/flutter-diagnostico.sql: Queries de diagnóstico
