# 🚀 Flutter Screens con Persistencia en BD

## 📋 Descripción General

Este sistema implementa **persistencia de pantallas Flutter** vinculadas a clases UML 2.5, con **sincronización colaborativa en tiempo real** mediante WebSockets.

### ¿Qué Problema Resuelve?

Anteriormente:
- 🔴 Las pantallas Flutter se guardaban **solo en memoria (cache)**
- 🔴 Los cambios visuales (reordenamiento de componentes, customización de labels) **no se persistían**
- 🔴 Si un usuario refrescaba la página, **perdía todos sus cambios**
- 🔴 No había forma de recuperar pantallas después de cerrar la sala

Ahora:
- ✅ Las pantallas Flutter se guardan en **BD PostgreSQL**
- ✅ Cada componente tiene **referencia al atributo/método UML** que representa
- ✅ Los cambios se **sincronizan automáticamente** entre todos los usuarios en la sala (WebSockets)
- ✅ Las customizaciones (labels, placeholders) se **persisten sin afectar el UML original**
- ✅ Si se elimina un atributo en UML, el componente Flutter correspondiente se marca como NULL (integridad referencial)

## 🏗️ Arquitectura de Datos

### Tablas Creadas

#### `flutter_screen`
```sql
{
  id_screen: number,              -- PK
  id_clase: number,               -- FK UNIQUE (una pantalla por clase UML)
  nombre_screen: string,          -- Nombre customizado de la pantalla
  componentes_json: JSONB,        -- Array de componentes visuales con customizaciones
  fecha_creacion: timestamp,
  fecha_actualizacion: timestamp
}
```

#### `flutter_component`
```sql
{
  id_component: number,           -- PK
  id_screen: number,              -- FK a flutter_screen
  id_atributo: number | NULL,     -- FK OPTIONAL a atributo_clase (NULL si sin referencia)
  id_metodo: number | NULL,       -- FK OPTIONAL a metodo_clase (NULL si sin referencia)
  label_custom: string,           -- Label personalizado (ej: "Código único de usuario")
  placeholder_custom: string,     -- Placeholder personalizado (ej: "Ingrese su código")
  position: number,               -- Orden visual en la pantalla
  tipo_componente: string,        -- TextField, ElevatedButton, Container
  propiedades_json: JSONB,        -- Props adicionales del componente
  fecha_creacion: timestamp
}
```

## 🔄 Flujo de Sincronización

### 1️⃣ Usuario A modifica un componente Flutter

```
Frontend (Angular)
  └─ Usuario reordena/edita componente
    └─ onFlutterScreenCambios() dispara
      └─ Guardar en BD: POST /flutter-screen/save
      └─ Guardar en Cache local
      └─ Emitir WebSocket: flutterScreenCambios
        └─ Backend recibe socket
          └─ Emitir a otros usuarios en la sala
```

### 2️⃣ Usuario B recibe cambios vía WebSocket

```
Backend (Socket.IO)
  └─ Recibe event: flutterScreenCambios
    └─ Emitir a sala (todos menos el sender)

Frontend (Angular) Usuario B
  └─ Listener onListenFlutterScreenCambios() dispara
    └─ Actualizar cache local
    └─ Guardar en BD: POST /flutter-screen/save
    └─ Si clase visible, actualizar preview
```

## 📱 Endpoints API

### POST `/flutter-screen/save`
Guardar o actualizar una pantalla Flutter completa.

**Request:**
```typescript
{
  id_sala: number,
  id_clase: number,
  nombre_screen: string,
  componentes: Array<{
    id: string,
    type: string,
    label: string,
    label_custom?: string,
    placeholder_custom?: string,
    position: number,
    customProperties?: {
      atributoBD?: number,
      metodobD?: number,
      ...
    }
  }>
}
```

**Response:**
```typescript
{
  ok: true,
  id_screen: number,
  componentes_guardados: number
}
```

### GET `/flutter-screen/:id_clase`
Obtener pantalla Flutter con referencias a UML.

**Response:**
```typescript
{
  ok: true,
  screen: {
    id_screen: number,
    nombre_screen: string,
    componentes_json: JSONB,
    fecha_actualizacion: timestamp
  },
  componentes: Array<{
    id_component: number,
    label_custom: string,
    atributo_nombre: string,      // Nombre del atributo UML
    atributo_tipo: string,         // Tipo del atributo (String, Integer, etc)
    ...
  }>
}
```

### PUT `/flutter-screen/component/:id_component`
Actualizar un componente individual.

### DELETE `/flutter-screen/:id_screen`
Eliminar una pantalla Flutter (elimina todos sus componentes por cascada).

## 🔐 Integridad Referencial

### Escenario 1: Usuario elimina atributo en UML

```
Usuario elimina atributo "id" en clase Empleado
  ↓
DELETE FROM atributo_clase WHERE id_atributo = 123
  ↓
Trigger: ON DELETE SET NULL
  ↓
UPDATE flutter_component SET id_atributo = NULL WHERE id_atributo = 123
  ↓
Componente Flutter sigue existiendo, pero pierde referencia al atributo
  ↓
En próximo reload, se muestra componente huérfano (sin conexión a UML)
```

### Escenario 2: Usuario elimina clase UML completa

```
Usuario elimina clase Empleado
  ↓
DELETE FROM clase_uml WHERE id_clase = 1
  ↓
Trigger: ON DELETE CASCADE
  ↓
DELETE FROM flutter_screen WHERE id_clase = 1
  ↓
DELETE FROM flutter_component WHERE id_screen = ... (cascada)
  ↓
Pantalla Flutter completa eliminada
```

## 🚀 Instalación

### 1. Aplicar migración a BD

```bash
cd c:\work\U\jk\backend-p1sw1\database
psql -U postgres -d tu_db -f migration-flutter-screens.sql
```

O ejecutar manualmente:
1. Abrir pgAdmin
2. Conectar a tu BD
3. Copiar contenido de `migration-flutter-screens.sql`
4. Ejecutar

### 2. Backend ya está actualizado

- ✅ Controlador creado: `flutter-screen.controller.ts`
- ✅ Rutas agregadas a `router.ts`
- ✅ Solo necesita compilar TypeScript:

```bash
cd c:\work\U\jk\backend-p1sw1
npm run build
```

### 3. Frontend ya está actualizado

- ✅ Métodos agregados a `ClasePersistenciaService`
- ✅ Llamadas a BD agregadas en `onFlutterScreenCambios()`
- ✅ WebSocket sincronización lista
- ✅ Solo necesita recargar:

```bash
# El hot reload de Angular ya lo detectó
# Pero si necesitas reconstruir:
cd c:\work\U\jk\official-sw1p1
npx ng build
```

## 📊 Ejemplo Completo

### Clase UML
```
┌──────────────────────┐
│      Empleado        │
├──────────────────────┤
│ -id: Integer         │ ← id_atributo: 1
│ -nombre: String      │ ← id_atributo: 2
│ -cargo: String       │ ← id_atributo: 3
│ -salario: Double     │ ← id_atributo: 4
├──────────────────────┤
│ +guardar()           │ ← id_metodo: 1
│ +eliminar()          │ ← id_metodo: 2
└──────────────────────┘
```

### Flutter Screen Generado (Visual)
```
┌─────────────────────────────────┐
│       EmpleadoScreen            │ ← nombre_screen
├─────────────────────────────────┤
│ [Código único de usuario]       │ ← label_custom (antes: "id")
│  Ingrese su código              │ ← placeholder_custom
│                                 │
│ [Nombre del empleado]           │ ← label_custom (antes: "nombre")
│  Ingrese nombre completo        │ ← placeholder_custom
│                                 │
│ [Puesto laboral]                │ ← label_custom (antes: "cargo")
│  Seleccione puesto              │
│                                 │
│ [Salario]                       │ ← label_custom (antes: "salario")
│  Ingrese cantidad               │ ← placeholder_custom
├─────────────────────────────────┤
│  [Guardar]    [Eliminar]        │ ← Botones para métodos UML
└─────────────────────────────────┘
```

### BD - flutter_component

```
id_component | id_atributo | label_custom            | position
─────────────┼─────────────┼─────────────────────────┼──────────
1            | 1           | Código único de usuario | 1
2            | 2           | Nombre del empleado     | 2
3            | 3           | Puesto laboral          | 3
4            | 4           | Salario                 | 4
```

## 🔄 Sincronización Colaborativa

### Situación: Dos usuarios en la misma sala

```
Usuario A                           Usuario B
┌─────────────────────┐        ┌─────────────────────┐
│ Reordena: Cargo arriba           │ Viendo: Nombre arriba
│ ↓ onFlutterScreenCambios()  │                     │
│ ↓ POST /flutter-screen/save │                     │
│ ↓ Cache local actualizado   │                     │
│ ↓ Emite WebSocket           │──────────────────→  │
│ ┌───────────────────┐        │ Recibe evento      │
│ │ Cargo             │        │ ↓ cache actualizado
│ │ Nombre            │        │ ↓ POST /flutter-screen/save
│ │ ID                │        │ ↓ Preview actualizado
│ └───────────────────┘        │ ┌───────────────────┐
│                              │ │ Cargo (nuevo)     │
│                              │ │ Nombre            │
│                              │ │ ID                │
│                              │ └───────────────────┘
└─────────────────────┘        └─────────────────────┘
```

## ⚙️ Configuración WebSocket

El sistema utiliza el mismo socket.IO que ya existe:

```typescript
// Backend (server.ts)
socket.flutterScreenCambios(cliente, this.io);

// Socket Event Listeners
socket.on('flutterScreenCambios', (cellId, screen) => {
  // Emitir a otros usuarios en la sala
  io.to(roomId).emit('onFlutterScreenCambios', {
    cellId,
    screen,
    usuario: usuario_email
  });
});

// Frontend
onListenFlutterScreenCambios(): Observable<any> {
  return this.socket$.pipe(
    switchMap(socket => 
      new Observable(observer => {
        socket.on('onFlutterScreenCambios', (data) => {
          observer.next(data);
        });
      })
    )
  );
}
```

## 📝 Notas Importantes

1. **Orden de componentes**: Se persiste en `position` column
2. **Customizaciones**: No afectan el UML original (están separadas)
3. **Caché local**: Se sincroniza con BD en background (no bloquea UI)
4. **Offline**: Si no se puede guardar en BD, se guarda en cache local (reintentará cuando se reconecte)
5. **Borrado en cascada**: Eliminar clase UML borra automáticamente su Flutter Screen

## 🐛 Debugging

### Ver qué se está guardando en BD

```sql
SELECT * FROM flutter_screen WHERE id_clase = 1;
SELECT * FROM flutter_component WHERE id_screen = 1 ORDER BY position;
```

### Ver referencia entre UML y Flutter

```sql
SELECT 
  fc.id_component,
  ac.nombre as atributo_uml,
  fc.label_custom as label_flutter
FROM flutter_component fc
LEFT JOIN atributo_clase ac ON fc.id_atributo = ac.id_atributo
WHERE fc.id_screen = 1
ORDER BY fc.position;
```

## 📚 Referencias

- Controlador: `backend-p1sw1/controller/flutter-screen.controller.ts`
- Rutas: `backend-p1sw1/routes/router.ts`
- Servicio: `official-sw1p1/src/app/diagramador/services/clase-persistencia.service.ts`
- Componente: `official-sw1p1/src/app/diagramador/diagramador.component.ts`
- Migración: `backend-p1sw1/database/migration-flutter-screens.sql`
