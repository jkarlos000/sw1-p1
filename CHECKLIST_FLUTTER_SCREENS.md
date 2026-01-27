# ✅ Checklist: Flutter Screens con Persistencia

## 🎯 Implementación Completada

### 1️⃣ Base de Datos (Schema)
- ✅ Tabla `flutter_screen` creada en [schema.sql](backend-p1sw1/database/schema.sql)
  - Almacena pantalla Flutter vinculada a clase UML
  - UNIQUE en `id_clase` (una pantalla por clase)
  - Trigger para actualizar `fecha_actualizacion`
  
- ✅ Tabla `flutter_component` creada
  - Vinculación entre componentes visuales y atributos/métodos UML
  - Integridad referencial con SET NULL
  - Índices para performance

- ✅ Script de migración: [migration-flutter-screens.sql](backend-p1sw1/database/migration-flutter-screens.sql)

### 2️⃣ Backend (Node.js/Express)
- ✅ Controlador: [flutter-screen.controller.ts](backend-p1sw1/controller/flutter-screen.controller.ts)
  - `guardarFlutterScreen()` - POST /flutter-screen/save
  - `obtenerFlutterScreen()` - GET /flutter-screen/:id_clase
  - `actualizarComponente()` - PUT /flutter-screen/component/:id_component
  - `eliminarFlutterScreen()` - DELETE /flutter-screen/:id_screen

- ✅ Rutas agregadas a [router.ts](backend-p1sw1/routes/router.ts)
  - Instancia de `FlutterScreenController`
  - 4 endpoints registrados
  - Pool de BD conectado

### 3️⃣ Frontend (Angular)
- ✅ Servicio: [clase-persistencia.service.ts](official-sw1p1/src/app/diagramador/services/clase-persistencia.service.ts)
  - `guardarFlutterScreen()` - Guarda en BD
  - `obtenerFlutterScreen()` - Obtiene de BD
  - `actualizarComponenteFlutter()` - Actualiza componente
  - `eliminarFlutterScreen()` - Elimina pantalla

- ✅ Componente: [diagramador.component.ts](official-sw1p1/src/app/diagramador/diagramador.component.ts)
  - `onFlutterScreenCambios()` - Guarda en BD + emite WebSocket
  - `guardarFlutterScreenEnBD()` - Persiste cambios
  - `generarFlutterScreenDesdeClase()` - Carga de BD al abrir clase
  - `generarYGuardarFlutterScreenNuevo()` - Crea y guarda nuevo
  - Listener WebSocket actualiza y persiste cambios de otros usuarios

- ✅ Build compilado exitosamente

### 4️⃣ Sincronización Colaborativa
- ✅ WebSocket integrado con flujo existente
  - Usuario A cambia → Emite evento
  - Backend retransmite a sala
  - Usuario B recibe → Guarda en BD + actualiza vista
  - Sin bloqueos, en tiempo real

## 📋 Tests Pendientes

### Test 1: Guardar pantalla nueva en BD
```
1. Abrir sala colaborativa
2. Crear clase UML: Empleado (con 3 atributos)
3. Hacer clic en clase
4. Verificar que:
   ✓ Se genera Flutter Screen
   ✓ Se guarda en BD (ver logs: "Flutter Screen guardado en BD")
   ✓ Se puede recargar página y la pantalla sigue ahí
   ✓ Ver en pgAdmin: flutter_screen y flutter_component tienen registros
```

### Test 2: Reordenar componentes visuales
```
1. Pantalla Flutter visible
2. Modo edición activado
3. Reordenar: Nombre → Cargo → ID
4. Verificar que:
   ✓ Componentes se reordenan visualmente
   ✓ Logs muestran: "📋 Nuevo orden: Nombre → Cargo → ID"
   ✓ Código Dart actualizado en orden correcto
   ✓ BD actualizada (position en flutter_component)
   ✓ Recargar página, mantiene nuevo orden
```

### Test 3: Customizar labels
```
1. Componente visible: "id"
2. Cambiar label a: "Código único"
3. Cambiar placeholder a: "Ingrese código"
4. Verificar que:
   ✓ Label se actualiza en UI
   ✓ BD se actualiza: label_custom = "Código único"
   ✓ Código Dart muestra: labelText: 'Código único'
   ✓ Recargar página, customización persiste
```

### Test 4: Sincronización colaborativa
```
1. Abrir en 2 navegadores (Usuario A y B, misma sala)
2. Usuario A abre clase Empleado
3. Usuario A reordena componentes: Cargo arriba
4. Verificar en Usuario B:
   ✓ Recibe notificación de cambios (WebSocket)
   ✓ Si clase visible, preview se actualiza automáticamente
   ✓ Cache local actualizado
   ✓ BD actualizada en ambos (mismos datos)
```

### Test 5: Integridad referencial
```
1. Clase Empleado en UML con atributo "id" (id_atributo=1)
2. Flutter Screen con componente apuntando a "id"
3. Eliminar atributo "id" en UML
4. Verificar que:
   ✓ En flutter_component: id_atributo = NULL (no se elimina el componente)
   ✓ Componente sigue existiendo pero sin referencia
   ✓ Próximo reload, se muestra componente huérfano
   ✓ No hay error en BD
```

### Test 6: Eliminar pantalla Flutter
```
1. Pantalla Flutter guardada en BD
2. Eliminar la pantalla desde UI (si existe botón)
   O eliminar clase UML completa
3. Verificar que:
   ✓ Se ejecuta DELETE /flutter-screen/:id_screen
   ✓ BD: flutter_component eliminado (cascada)
   ✓ BD: flutter_screen eliminado
   ✓ UI: pantalla desaparece
```

### Test 7: Cargar pantalla personalizada desde BD
```
1. Pantalla guardada con customizaciones
   - Labels personalizados
   - Placeholders personalizados
   - Componentes reordenados
2. Cerrar sala y reabrir
3. Hacer clic en clase
4. Verificar que:
   ✓ Se carga desde BD (no se regenera desde UML)
   ✓ Todos los cambios visuales se mantienen
   ✓ Código Dart muestra customizaciones
```

## 🔌 Cómo Ejecutar Migración

### Opción 1: psql (Recomendado)
```powershell
cd c:\work\U\jk\backend-p1sw1\database
psql -U postgres -d tu_base_datos -f migration-flutter-screens.sql
```

### Opción 2: pgAdmin
1. Abrir pgAdmin
2. Conectar a BD
3. Abrir Query Tool
4. Copiar contenido de `migration-flutter-screens.sql`
5. Ejecutar

### Opción 3: Psql interactivo
```powershell
psql -U postgres -d tu_base_datos
postgres=# \i 'c:\work\U\jk\backend-p1sw1\database\migration-flutter-screens.sql'
```

### Verificar que se crearon las tablas
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_name LIKE 'flutter%';

-- Debe devolver:
-- flutter_screen
-- flutter_component
```

## 🚀 Próximos Pasos (Futuro)

- [ ] Crear UI para editar customizaciones (labels, placeholders)
- [ ] Versioning de Flutter Screens (histórico de cambios)
- [ ] Exportar Flutter Screen con customizaciones personalizadas
- [ ] Diff visual entre versiones
- [ ] Duplicar pantalla Flutter (plantillas)
- [ ] Validación en tiempo real de cambios

## 📊 Estructura de Datos - Ejemplo Real

### Tabla: flutter_screen
```
id_screen: 1
id_clase: 1 (Empleado)
nombre_screen: "EmpleadoScreen"
componentes_json: {
  "components": [
    { "id": "t1", "type": "TextField", "label": "Código", "label_custom": "Código único", "position": 1, ... },
    { "id": "t2", "type": "TextField", "label": "Nombre", "label_custom": "Nombre", "position": 2, ... },
    { "id": "t3", "type": "TextField", "label": "Cargo", "label_custom": "Puesto", "position": 3, ... }
  ]
}
fecha_actualizacion: 2026-01-27 15:30:45
```

### Tabla: flutter_component
```
id_component | id_screen | id_atributo | label_custom    | position
────────────┼───────────┼─────────────┼─────────────────┼──────────
1           | 1         | 1           | Código único    | 1
2           | 1         | 2           | Nombre          | 2
3           | 1         | 3           | Puesto          | 3
```

## ✨ Ventajas del Sistema

| Aspecto | Antes | Después |
|---------|-------|---------|
| Persistencia | Cache en memoria ❌ | BD PostgreSQL ✅ |
| Tras recarga | Datos perdidos ❌ | Datos mantienen ✅ |
| Customizaciones | Se pierden ❌ | Se guardan ✅ |
| Colaboración | No sincroniza ❌ | Sync en tiempo real ✅ |
| Integridad | Sin validación ❌ | Referencial ✅ |
| Recuperación | Imposible ❌ | Histórico en BD ✅ |
| Eliminación UML | Crea conflictos ❌ | Cascada automática ✅ |

## 📞 Soporte

Si algo no funciona:
1. Revisar logs de Angular (F12 → Console)
2. Revisar logs de Node.js (terminal backend)
3. Ejecutar migración SQL (schema.sql o migration-flutter-screens.sql)
4. Limpiar cache: CTRL+SHIFT+DEL
5. Recargar: CTRL+F5 (hard refresh)

## 🎓 Documentación Completa

Ver: [FLUTTER_SCREENS_ARQUITECTURA.md](FLUTTER_SCREENS_ARQUITECTURA.md)
