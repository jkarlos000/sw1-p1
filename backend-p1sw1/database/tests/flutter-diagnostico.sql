-- ==============================================================================
-- DIAGNÓSTICO DE DIAGRAMAS ANTIGUOS - Flutter Screens
-- ==============================================================================

-- 🔍 1. IDENTIFICAR CLASES SIN FLUTTER SCREEN (Diagramas Antiguos)
-- ==============================================================================
-- Devuelve todas las clases que fueron creadas ANTES de tener Flutter Screens en BD
-- Estas son las que tienen el problema

SELECT 
  cu.id_clase,
  cu.nombre,
  s.nombre_sala,
  cu.fecha_creacion,
  CASE WHEN fs.id_screen IS NULL THEN 'SIN SINCRONIZAR' ELSE 'SINCRONIZADA' END as estado,
  COUNT(ac.id_atributo) as total_atributos,
  COUNT(mc.id_metodo) as total_metodos
FROM clase_uml cu
LEFT JOIN sala s ON cu.id_sala = s.id_sala
LEFT JOIN flutter_screen fs ON cu.id_clase = fs.id_clase
LEFT JOIN atributo_clase ac ON cu.id_clase = ac.id_clase
LEFT JOIN metodo_clase mc ON cu.id_clase = mc.id_clase
WHERE fs.id_screen IS NULL  -- Solo clases SIN Flutter Screen
GROUP BY cu.id_clase, cu.nombre, s.nombre_sala, cu.fecha_creacion, fs.id_screen
ORDER BY cu.fecha_creacion ASC;


-- 🎯 2. CONTAR DIAGRAMAS ANTIGUOS POR SALA
-- ==============================================================================
-- Útil para decidir si hacer Opción 1, 2 o 3 de sincronización

SELECT 
  s.id_sala,
  s.nombre_sala,
  COUNT(CASE WHEN fs.id_screen IS NULL THEN 1 END) as clases_sin_sincronizar,
  COUNT(CASE WHEN fs.id_screen IS NOT NULL THEN 1 END) as clases_sincronizadas,
  COUNT(cu.id_clase) as total_clases
FROM sala s
LEFT JOIN clase_uml cu ON s.id_sala = cu.id_sala
LEFT JOIN flutter_screen fs ON cu.id_clase = fs.id_clase
GROUP BY s.id_sala, s.nombre_sala
ORDER BY clases_sin_sincronizar DESC;


-- 📊 3. VERIFICAR QUE LA SINCRONIZACIÓN FUNCIONÓ
-- ==============================================================================
-- Después de sincronizar una clase, ejecuta esto para confirmar

SELECT 
  fs.id_screen,
  cu.id_clase,
  cu.nombre as clase_nombre,
  fs.nombre_screen,
  COUNT(fc.id_component) as total_componentes,
  fs.fecha_creacion,
  fs.fecha_actualizacion
FROM flutter_screen fs
INNER JOIN clase_uml cu ON fs.id_clase = cu.id_clase
LEFT JOIN flutter_component fc ON fs.id_screen = fc.id_screen
WHERE cu.id_clase = [tu_id_clase]  -- Reemplazar con tu id_clase
GROUP BY fs.id_screen, cu.id_clase, cu.nombre, fs.nombre_screen, fs.fecha_creacion, fs.fecha_actualizacion;


-- 🔄 4. COMPARAR COMPONENTES GENERADOS vs ATRIBUTOS/MÉTODOS
-- ==============================================================================
-- Verifica que todos los atributos/métodos se convirtieron en componentes

SELECT 
  cu.nombre as clase,
  COUNT(ac.id_atributo) as atributos_uml,
  COUNT(mc.id_metodo) as metodos_uml,
  COUNT(fc.id_component) as componentes_flutter,
  CASE 
    WHEN COUNT(ac.id_atributo) + COUNT(mc.id_metodo) = COUNT(fc.id_component) 
    THEN '✅ Coinciden'
    ELSE '⚠️ Diferencia'
  END as validacion
FROM clase_uml cu
INNER JOIN flutter_screen fs ON cu.id_clase = fs.id_clase
LEFT JOIN atributo_clase ac ON cu.id_clase = ac.id_clase
LEFT JOIN metodo_clase mc ON cu.id_clase = mc.id_clase
LEFT JOIN flutter_component fc ON fs.id_screen = fc.id_screen
GROUP BY cu.id_clase, cu.nombre
ORDER BY cu.nombre;


-- 📈 5. HISTORIAL DE CAMBIOS EN FLUTTER SCREENS ANTIGUOS
-- ==============================================================================
-- Ver cuándo se sincronizó y se editó por última vez

SELECT 
  cu.nombre,
  fs.fecha_creacion as fecha_sincronizacion,
  fs.fecha_actualizacion as ultima_edicion,
  CASE 
    WHEN fs.fecha_actualizacion > fs.fecha_creacion THEN 'Editado después de sincronizar'
    ELSE 'Sin ediciones'
  END as estado_edicion,
  DATE_TRUNC('day', (fs.fecha_actualizacion - fs.fecha_creacion))::TEXT as dias_desde_sincronizacion
FROM flutter_screen fs
INNER JOIN clase_uml cu ON fs.id_clase = cu.id_clase
ORDER BY fs.fecha_actualizacion DESC;


-- 🔗 6. VERIFICAR INTEGRIDAD: REFERENCIAS ROTAS DESPUÉS DE SINCRONIZACIÓN
-- ==============================================================================
-- Si eliminaste atributos/métodos de UML, esto muestra componentes Flutter huérfanos

SELECT 
  fc.id_component,
  fc.label_custom as label_flutter,
  cu.nombre as clase,
  CASE 
    WHEN fc.id_atributo IS NOT NULL AND ac.id_atributo IS NULL THEN 'Atributo eliminado'
    WHEN fc.id_metodo IS NOT NULL AND mc.id_metodo IS NULL THEN 'Método eliminado'
    ELSE 'OK'
  END as problema,
  fc.tipo_componente
FROM flutter_component fc
INNER JOIN flutter_screen fs ON fc.id_screen = fs.id_screen
INNER JOIN clase_uml cu ON fs.id_clase = cu.id_clase
LEFT JOIN atributo_clase ac ON fc.id_atributo = ac.id_atributo
LEFT JOIN metodo_clase mc ON fc.id_metodo = mc.id_metodo
WHERE (fc.id_atributo IS NOT NULL AND ac.id_atributo IS NULL)
   OR (fc.id_metodo IS NOT NULL AND mc.id_metodo IS NULL);


-- 📋 7. LISTAR TODAS LAS CLASES CON SU ESTADO DE SINCRONIZACIÓN
-- ==============================================================================
-- Panorama completo de qué está sincronizado y qué no

SELECT 
  ROW_NUMBER() OVER (ORDER BY cu.fecha_creacion DESC) as num,
  cu.id_clase,
  cu.nombre as clase,
  s.nombre_sala as sala,
  cu.fecha_creacion,
  CASE 
    WHEN fs.id_screen IS NULL THEN '❌ SIN SINCRONIZAR'
    WHEN fs.fecha_actualizacion = fs.fecha_creacion THEN '⚠️ SINCRONIZADO (sin edits)'
    ELSE '✅ SINCRONIZADO Y EDITADO'
  END as estado,
  COUNT(fc.id_component) as componentes,
  fs.id_screen
FROM clase_uml cu
LEFT JOIN sala s ON cu.id_sala = s.id_sala
LEFT JOIN flutter_screen fs ON cu.id_clase = fs.id_clase
LEFT JOIN flutter_component fc ON fs.id_screen = fc.id_screen
GROUP BY cu.id_clase, cu.nombre, s.nombre_sala, cu.fecha_creacion, fs.id_screen, 
         fs.fecha_creacion, fs.fecha_actualizacion
ORDER BY cu.fecha_creacion DESC;


-- 🛠️ 8. SINCRONIZACIÓN MANUAL: CREAR FLUTTER_SCREEN PARA CLASE ESPECÍFICA
-- ==============================================================================
-- EJECUTAR SI QUIERES SINCRONIZAR UNA CLASE MANUALMENTE EN SQL (no recomendado)
-- Reemplaza [id_clase] con tu valor

INSERT INTO flutter_screen (id_clase, nombre_screen, componentes_json)
VALUES (
  [id_clase],                                    -- Tu ID de clase
  'Screen - ' || (SELECT nombre FROM clase_uml WHERE id_clase = [id_clase]),
  '[]'::jsonb
)
ON CONFLICT (id_clase) DO NOTHING;


-- 📊 9. ESTADÍSTICAS: ANTES vs DESPUÉS
-- ==============================================================================
-- Compara clases que tienen Flutter Screen vs las que no

SELECT 
  'Con Flutter Screen' as categoria,
  COUNT(cu.id_clase) as cantidad,
  COUNT(fc.id_component) as total_componentes,
  ROUND(AVG(COUNT(fc.id_component)) OVER (), 2) as componentes_promedio
FROM clase_uml cu
INNER JOIN flutter_screen fs ON cu.id_clase = fs.id_clase
LEFT JOIN flutter_component fc ON fs.id_screen = fc.id_screen
GROUP BY categoria

UNION ALL

SELECT 
  'Sin Flutter Screen' as categoria,
  COUNT(cu.id_clase) as cantidad,
  0 as total_componentes,
  0 as componentes_promedio
FROM clase_uml cu
LEFT JOIN flutter_screen fs ON cu.id_clase = fs.id_clase
WHERE fs.id_screen IS NULL;


-- 🎯 10. DIAGNÓSTICO RÁPIDO: ¿POR QUÉ NO PERSISTE MI DIAGRAMA?
-- ==============================================================================
-- Responde estas preguntas:

-- 1. ¿Mi clase tiene Flutter Screen?
SELECT COUNT(*) as clases_con_flutter_screen
FROM flutter_screen
WHERE id_clase = [tu_id_clase];

-- 2. ¿Hay componentes guardados?
SELECT COUNT(*) as componentes_guardados
FROM flutter_component
WHERE id_screen = (SELECT id_screen FROM flutter_screen WHERE id_clase = [tu_id_clase]);

-- 3. ¿Cuándo fue la última edición?
SELECT fecha_actualizacion, fecha_creacion
FROM flutter_screen
WHERE id_clase = [tu_id_clase];

-- 4. ¿Los componentes tienen referencias válidas a UML?
SELECT 
  COUNT(*) as total_componentes,
  COUNT(CASE WHEN id_atributo IS NOT NULL THEN 1 END) as con_atributo,
  COUNT(CASE WHEN id_metodo IS NOT NULL THEN 1 END) as con_metodo,
  COUNT(CASE WHEN id_atributo IS NULL AND id_metodo IS NULL THEN 1 END) as sin_referencia
FROM flutter_component
WHERE id_screen = (SELECT id_screen FROM flutter_screen WHERE id_clase = [tu_id_clase]);


-- ==============================================================================
-- NOTAS:
-- ==============================================================================
-- - Reemplaza [tu_id_clase] con el valor real de tu clase
-- - Reemplaza [id_clase] con el ID de la clase a sincronizar
-- - Ejecuta regularmente el query #1 para identificar nuevas clases antiguas
-- - Usa #7 como panorama general de tu sistema
