# 📋 Database Tests & Queries

Este directorio contiene scripts SQL para **debugging, diagnóstico y referencia histórica** del sistema de Flutter Screens.

## 📁 Archivos

### 1. `flutter-debugging.sql` (342 líneas)
**Propósito:** Queries para debugging durante desarrollo
**Contiene 11 secciones:**

1. **Verificar integridad de tablas** - COUNT de registros
2. **Listar todas las clases y sus atributos/métodos** - Panorama completo
3. **Encontrar clases sin componentes Flutter** - Diagnóstico rápido
4. **Verificar relaciones Flutter Screen ↔ UML** - Foreign keys
5. **Listar atributos y métodos sin componentes** - Huérfanos
6. **Encontrar referencias rotas** - Integridad referencial
7. **Estado de sincronización por sala** - Panorama por sala
8. **Comparar fechas de creación vs actualizacion** - Detectar ediciones
9. **Listar componentes con propiedades JSON** - Estructura
10. **Buscar clases y componentes por nombre** - Búsqueda
11. **Obtener estadísticas generales** - Resumen del sistema

**Cuándo usar:** Cuando necesites inspeccionar datos durante desarrollo o debugging

**Ejemplo:**
```sql
-- Verificar todas las clases y sus componentes
SELECT cu.nombre, COUNT(fc.id_component) as componentes
FROM clase_uml cu
LEFT JOIN flutter_screen fs ON cu.id_clase = fs.id_clase
LEFT JOIN flutter_component fc ON fs.id_screen = fc.id_screen
GROUP BY cu.nombre;
```

---

### 2. `flutter-diagnostico.sql` (400 líneas)
**Propósito:** Queries de diagnóstico para resolver problemas específicos
**Contiene 10 secciones:**

1. **Identificar clases sin Flutter Screen** - Diagramas antiguos
2. **Contar diagramas antiguos por sala** - Para decidir sincronización
3. **Verificar que la sincronización funcionó** - Validación post-sync
4. **Comparar componentes generados vs atributos/métodos** - Integridad
5. **Historial de cambios en Flutter Screens** - Ver ediciones
6. **Verificar referencias rotas después de sincronización** - Huérfanos
7. **Listar todas las clases con estado de sincronización** - Panorama
8. **Sincronización manual via SQL** - Opción 8 (no recomendada)
9. **Estadísticas: Antes vs Después** - Comparativa
10. **Diagnóstico rápido: ¿Por qué no persiste?** - Quick fix

**Cuándo usar:** Cuando un usuario reporta "mis cambios no se guardan" o para diagnóstico

**Ejemplo:**
```sql
-- ¿Mi clase tiene Flutter Screen?
SELECT COUNT(*) as clases_con_flutter_screen
FROM flutter_screen
WHERE id_clase = [tu_id_clase];
```

---

### 3. `migration-flutter-screens.sql` (500 líneas)
**Propósito:** Referencia histórica y documentación de la migración de 2026-01-27
**Contiene:**

- **Contexto histórico** - Por qué se necesitó esta migración
- **DDL de tablas** - Definición completa de flutter_screen y flutter_component
- **Índices** - Índices de rendimiento
- **Triggers** - Trigger para auto-actualizar fecha_actualizacion
- **Integración con código** - Cómo se conectó con backend y frontend
- **Problemas resueltos** - Qué issues se solucionaron
- **3 opciones de sincronización** - Automática, manual, bulk
- **Validación** - Cómo verificar que todo está correcto

**Cuándo usar:** Para entender la arquitectura de Flutter Screens o cuando necesites context histórico

---

## 🔧 Cómo Usar

### Scenario 1: Encontrar por qué un diagrama antiguo no persiste

```bash
# Paso 1: Ejecuta queries de diagnóstico
psql -U postgres -d sw1 -f flutter-diagnostico.sql

# Paso 2: Busca la salida "SIN SINCRONIZAR"
# Paso 3: Si hay clases sin sincronizar, el sistema las sincronizará automáticamente
#         O ejecuta manualmente: POST /flutter-screen/sincronizar/{id_sala}/{id_clase}
```

### Scenario 2: Debugging general del sistema

```bash
# Ejecuta el archivo completo de debugging
psql -U postgres -d sw1 -f flutter-debugging.sql

# Revisa:
# - Integridad referencial (queries 4, 6)
# - Estado de sincronización (queries 7, 8)
# - Componentes huérfanos (queries 5, 6)
```

### Scenario 3: Entender cómo funciona el sistema

```
Leer en este orden:
1. migration-flutter-screens.sql (entiende la arquitectura)
2. flutter-diagnostico.sql query #7 (panorama completo)
3. flutter-debugging.sql query #2 (detalles de datos)
```

---

## 📊 Estadísticas de los Queries

| Archivo | Líneas | Queries | Propósito |
|---------|--------|---------|-----------|
| flutter-debugging.sql | 342 | 11 | Debugging en desarrollo |
| flutter-diagnostico.sql | 400 | 10 | Diagnóstico de problemas |
| migration-flutter-screens.sql | 500 | Documentación + DDL | Referencia histórica |

---

## ✅ Checklist de Validación

Usa estos queries para validar que todo esté correcto:

```sql
-- ✅ 1. ¿Todas las clases están sincronizadas?
SELECT COUNT(*) as sin_sincronizar
FROM clase_uml cu
WHERE NOT EXISTS (SELECT 1 FROM flutter_screen fs WHERE fs.id_clase = cu.id_clase);
-- Resultado esperado: 0

-- ✅ 2. ¿Todos los componentes tienen referencias válidas?
SELECT COUNT(*) as referencias_rotas
FROM flutter_component fc
WHERE (fc.id_atributo IS NOT NULL AND NOT EXISTS (SELECT 1 FROM atributo_clase WHERE id_atributo = fc.id_atributo))
   OR (fc.id_metodo IS NOT NULL AND NOT EXISTS (SELECT 1 FROM metodo_clase WHERE id_metodo = fc.id_metodo));
-- Resultado esperado: 0

-- ✅ 3. ¿Los datos se están actualizando correctamente?
SELECT COUNT(*) as cambios_recientes
FROM flutter_screen
WHERE fecha_actualizacion > NOW() - INTERVAL '1 day';
-- Resultado esperado: > 0 si hay cambios activos
```

---

## 📝 Notas Importantes

1. **No editar** `migration-flutter-screens.sql` - Es solo referencia histórica
2. **Backup antes** de ejecutar cualquier UPDATE/DELETE en queries
3. **Reemplaza placeholders** como `[tu_id_clase]` con valores reales
4. **Prueba queries** en desarrollo primero antes de producción
5. **Documentación completa** en `../README.md`

---

## 🔗 Referencias

- **Solución completa:** [FLUTTER_SCREENS_DIAGRAMAS_ANTIGUOS.md](../../FLUTTER_SCREENS_DIAGRAMAS_ANTIGUOS.md)
- **Detalles técnicos:** [SOLUCION_DIAGRAMAS_ANTIGUOS.md](../../SOLUCION_DIAGRAMAS_ANTIGUOS.md)
- **Schema principal:** [../schema.sql](../schema.sql)
- **Seed data:** [../seed.sql](../seed.sql)

---

## 📞 Soporte

Si encuentras problemas:

1. Ejecuta `flutter-diagnostico.sql` query #10 (Quick diagnostic)
2. Revisa logs en `docker logs sw1-postgres-1` (si usas Docker)
3. Consulta `migration-flutter-screens.sql` para entender la arquitectura
4. Abre un issue con output del diagnóstico

---

**Última actualización:** 2026-01-27  
**Versión:** 1.0  
**Estado:** En uso en producción ✅
