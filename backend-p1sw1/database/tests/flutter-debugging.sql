-- =====================================================
-- SQL ÚTIL: Verificación y Debugging de Flutter Screens
-- =====================================================

-- ═══════════════════════════════════════════════════════════
-- 1. VERIFICAR QUE LAS TABLAS EXISTEN
-- ═══════════════════════════════════════════════════════════

-- Ver todas las tablas flutter
SELECT table_name FROM information_schema.tables 
WHERE table_name LIKE 'flutter%'
ORDER BY table_name;

-- Ver estructura de flutter_screen
\d flutter_screen

-- Ver estructura de flutter_component
\d flutter_component

-- ═══════════════════════════════════════════════════════════
-- 2. VER PANTALLAS FLUTTER GUARDADAS
-- ═══════════════════════════════════════════════════════════

-- Ver todas las pantallas
SELECT 
  fs.id_screen,
  fs.id_clase,
  cu.nombre_clase,
  fs.nombre_screen,
  jsonb_array_length(fs.componentes_json->'components') as num_componentes,
  fs.fecha_creacion,
  fs.fecha_actualizacion
FROM flutter_screen fs
LEFT JOIN clase_uml cu ON fs.id_clase = cu.id_clase
ORDER BY fs.fecha_actualizacion DESC;

-- Ver pantalla específica por clase
SELECT * FROM flutter_screen 
WHERE id_clase = 1;

-- Ver JSON de componentes (formateado)
SELECT 
  id_screen,
  id_clase,
  jsonb_pretty(componentes_json) as componentes
FROM flutter_screen
WHERE id_clase = 1;

-- ═══════════════════════════════════════════════════════════
-- 3. VER COMPONENTES CON REFERENCIAS A UML
-- ═══════════════════════════════════════════════════════════

-- Ver componentes de un screen con datos UML
SELECT 
  fc.id_component,
  fc.position,
  fc.tipo_componente,
  fc.label_custom,
  fc.placeholder_custom,
  ac.nombre as atributo_uml,
  ac.tipo as atributo_tipo,
  mc.nombre as metodo_uml,
  mc.tipo_retorno as metodo_retorno
FROM flutter_component fc
LEFT JOIN atributo_clase ac ON fc.id_atributo = ac.id_atributo
LEFT JOIN metodo_clase mc ON fc.id_metodo = mc.id_metodo
WHERE fc.id_screen = 1
ORDER BY fc.position;

-- Ver componentes huérfanos (sin referencia a UML)
SELECT *
FROM flutter_component
WHERE id_atributo IS NULL AND id_metodo IS NULL
ORDER BY id_screen, position;

-- Contar componentes por tipo
SELECT 
  tipo_componente,
  COUNT(*) as cantidad
FROM flutter_component
GROUP BY tipo_componente;

-- ═══════════════════════════════════════════════════════════
-- 4. VERIFICAR INTEGRIDAD REFERENCIAL
-- ═══════════════════════════════════════════════════════════

-- Ver referencias a atributos eliminados (debe ser vacío si integridad ok)
SELECT *
FROM flutter_component fc
WHERE fc.id_atributo IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM atributo_clase ac WHERE ac.id_atributo = fc.id_atributo
  );

-- Ver referencias a métodos eliminados (debe ser vacío si integridad ok)
SELECT *
FROM flutter_component fc
WHERE fc.id_metodo IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM metodo_clase mc WHERE mc.id_metodo = fc.id_metodo
  );

-- Ver pantallas huérfanas (clase UML eliminada)
SELECT *
FROM flutter_screen fs
WHERE NOT EXISTS (
  SELECT 1 FROM clase_uml cu WHERE cu.id_clase = fs.id_clase
);

-- ═══════════════════════════════════════════════════════════
-- 5. ESTADÍSTICAS Y RESUMEN
-- ═══════════════════════════════════════════════════════════

-- Resumen: cuántas pantallas, componentes, customizaciones
SELECT 
  COUNT(DISTINCT fs.id_screen) as total_pantallas,
  COUNT(DISTINCT fc.id_component) as total_componentes,
  COUNT(CASE WHEN fc.label_custom IS NOT NULL THEN 1 END) as labels_customizados,
  COUNT(CASE WHEN fc.placeholder_custom IS NOT NULL THEN 1 END) as placeholders_customizados
FROM flutter_screen fs
LEFT JOIN flutter_component fc ON fs.id_screen = fc.id_screen;

-- Por sala
SELECT 
  s.nombre_sala,
  COUNT(DISTINCT fs.id_screen) as pantallas,
  COUNT(DISTINCT fc.id_component) as componentes
FROM flutter_screen fs
LEFT JOIN flutter_component fc ON fs.id_screen = fc.id_screen
LEFT JOIN clase_uml cu ON fs.id_clase = cu.id_clase
LEFT JOIN sala s ON cu.id_sala = s.id_sala
GROUP BY s.id_sala, s.nombre_sala
ORDER BY pantallas DESC;

-- ═══════════════════════════════════════════════════════════
-- 6. BUSCAR Y FILTRAR
-- ═══════════════════════════════════════════════════════════

-- Pantallas con más de 5 componentes
SELECT 
  fs.id_screen,
  cu.nombre_clase,
  COUNT(fc.id_component) as num_componentes
FROM flutter_screen fs
LEFT JOIN flutter_component fc ON fs.id_screen = fc.id_screen
LEFT JOIN clase_uml cu ON fs.id_clase = cu.id_clase
GROUP BY fs.id_screen, cu.nombre_clase
HAVING COUNT(fc.id_component) > 5
ORDER BY num_componentes DESC;

-- Componentes con más customizaciones
SELECT 
  fc.id_component,
  fc.label_custom,
  fc.placeholder_custom,
  ac.nombre as atributo_original
FROM flutter_component fc
LEFT JOIN atributo_clase ac ON fc.id_atributo = ac.id_atributo
WHERE fc.label_custom IS NOT NULL OR fc.placeholder_custom IS NOT NULL
ORDER BY fc.id_screen, fc.position;

-- Últimas pantallas modificadas
SELECT 
  fs.id_screen,
  cu.nombre_clase,
  fs.fecha_actualizacion,
  EXTRACT(MINUTE FROM (NOW() - fs.fecha_actualizacion)) as minutos_atras
FROM flutter_screen fs
LEFT JOIN clase_uml cu ON fs.id_clase = cu.id_clase
ORDER BY fs.fecha_actualizacion DESC
LIMIT 10;

-- ═══════════════════════════════════════════════════════════
-- 7. LIMPIAR / ELIMINAR
-- ═══════════════════════════════════════════════════════════

-- ⚠️ ELIMINAR pantalla specific (cascade automático)
-- DELETE FROM flutter_screen WHERE id_screen = 1;

-- ⚠️ ELIMINAR TODAS las pantallas flutter (CUIDADO!)
-- DELETE FROM flutter_component;
-- DELETE FROM flutter_screen;

-- Verificar que la cascada funcionó
-- Después de DELETE FROM clase_uml WHERE id_clase = X
-- El flutter_screen también debe desaparecer:
SELECT COUNT(*) as pantallas_huerfanas
FROM flutter_screen fs
WHERE NOT EXISTS (SELECT 1 FROM clase_uml cu WHERE cu.id_clase = fs.id_clase);

-- ═══════════════════════════════════════════════════════════
-- 8. MONITOREO Y PERFORMANCE
-- ═══════════════════════════════════════════════════════════

-- Ver tamaño de las tablas
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE tablename LIKE 'flutter%'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Ver índices y su tamaño
SELECT 
  indexname,
  pg_size_pretty(pg_relation_size(indexrelid)) as size
FROM pg_indexes
WHERE schemaname = 'public' AND tablename LIKE 'flutter%';

-- ═══════════════════════════════════════════════════════════
-- 9. EJEMPLOS PRÁCTICOS
-- ═══════════════════════════════════════════════════════════

-- Ejemplo: Obtener toda la información de una pantalla
-- (como lo hace el endpoint GET /flutter-screen/:id_clase)
SELECT 
  fs.id_screen,
  fs.id_clase,
  cu.nombre_clase,
  fs.nombre_screen,
  fs.componentes_json,
  ARRAY_AGG(
    jsonb_build_object(
      'id_component', fc.id_component,
      'label_custom', fc.label_custom,
      'placeholder_custom', fc.placeholder_custom,
      'position', fc.position,
      'tipo', fc.tipo_componente,
      'atributo_nombre', ac.nombre,
      'atributo_tipo', ac.tipo,
      'metodo_nombre', mc.nombre
    ) ORDER BY fc.position
  ) as componentes_detalle
FROM flutter_screen fs
LEFT JOIN clase_uml cu ON fs.id_clase = cu.id_clase
LEFT JOIN flutter_component fc ON fs.id_screen = fc.id_screen
LEFT JOIN atributo_clase ac ON fc.id_atributo = ac.id_atributo
LEFT JOIN metodo_clase mc ON fc.id_metodo = mc.id_metodo
WHERE fs.id_clase = 1
GROUP BY fs.id_screen, fs.id_clase, cu.nombre_clase, fs.nombre_screen, fs.componentes_json;

-- ═══════════════════════════════════════════════════════════
-- 10. VALIDACIÓN DE DATOS
-- ═══════════════════════════════════════════════════════════

-- Validar que todas las pantallas tienen clase UML
SELECT fs.id_screen, fs.id_clase
FROM flutter_screen fs
LEFT JOIN clase_uml cu ON fs.id_clase = cu.id_clase
WHERE cu.id_clase IS NULL;

-- Validar que todos los componentes pertenecen a pantalla válida
SELECT fc.id_component, fc.id_screen
FROM flutter_component fc
LEFT JOIN flutter_screen fs ON fc.id_screen = fs.id_screen
WHERE fs.id_screen IS NULL;

-- Validar posiciones secuenciales (no debería haber gaps)
SELECT 
  id_screen,
  position,
  LEAD(position) OVER (PARTITION BY id_screen ORDER BY position) as next_position
FROM flutter_component
WHERE (LEAD(position) OVER (PARTITION BY id_screen ORDER BY position)) != position + 1
   OR (LEAD(position) OVER (PARTITION BY id_screen ORDER BY position)) IS NULL;

-- ═══════════════════════════════════════════════════════════
-- 11. MIGRACIÓN / RESPALDO
-- ═══════════════════════════════════════════════════════════

-- Exportar datos a JSON
SELECT 
  jsonb_pretty(
    jsonb_build_object(
      'flutter_screens', (
        SELECT jsonb_agg(row_to_json(t.*))
        FROM flutter_screen t
      ),
      'flutter_components', (
        SELECT jsonb_agg(row_to_json(t.*))
        FROM flutter_component t
      )
    )
  ) as backup;

-- Copiar datos a archivo CSV
\COPY (
  SELECT 
    id_screen,
    id_clase,
    nombre_screen,
    componentes_json,
    fecha_creacion,
    fecha_actualizacion
  FROM flutter_screen
) TO '/tmp/flutter_screens_backup.csv' WITH (FORMAT csv, HEADER);

-- ═══════════════════════════════════════════════════════════
-- QUERIES COMUNES
-- ═══════════════════════════════════════════════════════════

-- "Quiero ver todo lo que hay guardado"
\x on
SELECT * FROM flutter_screen LIMIT 5;
SELECT * FROM flutter_component LIMIT 10;

-- "¿Hay datos en las tablas?"
SELECT COUNT(*) FROM flutter_screen;
SELECT COUNT(*) FROM flutter_component;

-- "¿Qué pantalla tiene más componentes?"
SELECT fs.id_screen, cu.nombre_clase, COUNT(fc.id_component) as count
FROM flutter_screen fs
LEFT JOIN flutter_component fc ON fs.id_screen = fc.id_screen
LEFT JOIN clase_uml cu ON fs.id_clase = cu.id_clase
GROUP BY fs.id_screen, cu.nombre_clase
ORDER BY count DESC LIMIT 1;

-- "¿Cuál fue el último cambio?"
SELECT fs.id_screen, cu.nombre_clase, fs.fecha_actualizacion
FROM flutter_screen fs
LEFT JOIN clase_uml cu ON fs.id_clase = cu.id_clase
ORDER BY fs.fecha_actualizacion DESC LIMIT 1;

-- ═══════════════════════════════════════════════════════════
-- NOTAS IMPORTANTE
-- ═══════════════════════════════════════════════════════════

/*
1. Siempre respalda antes de hacer DELETE en producción
2. ON DELETE CASCADE eliminará todos los componentes si eliminas la pantalla
3. ON DELETE SET NULL marcará como NULL si eliminas atributo/método
4. Los índices están diseñados para:
   - idx_flutter_screen_clase: Búsquedas por clase (GET /flutter-screen/:id_clase)
   - idx_flutter_component_screen: Búsquedas de componentes (cuando obtienes pantalla)
   - idx_flutter_component_atributo: Validar referencias
   - idx_flutter_component_metodo: Validar referencias
5. componentes_json es JSONB para búsquedas eficientes
6. propiedades_json permite extensibilidad sin migration
*/
