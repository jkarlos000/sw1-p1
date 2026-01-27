# 🔄 Flujos de Sincronización - Flutter Screens

## Diagrama 1: Guardar Cambios (Un Usuario)

```
┌─────────────────────────────────────────────────────────────┐
│                    USUARIO A                                │
│                  (Angular Frontend)                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│   Hace clic → Reordena componente Cargo arriba              │
│       │                                                      │
│       ├─→ flutter-preview.component.ts                      │
│       │   onDrop() dispara                                  │
│       │   - Crea nueva referencia de screen                 │
│       │   - Llama generarCodigoDart()                       │
│       │   - Código Dart se actualiza ✅                     │
│       │                                                      │
│       └─→ diagramador.component.ts                          │
│           onFlutterScreenCambios(screen)                    │
│           - Guarda en Cache local ✅                        │
│           - Llama guardarFlutterScreenEnBD(screen)          │
│           │                                                  │
│           ├─→ HTTP POST /flutter-screen/save                │
│           │   - Backend recibe                              │
│           │   - Valida clase existe                         │
│           │   - Inserta/actualiza flutter_screen ✅          │
│           │   - Inserta componentes en flutter_component ✅ │
│           │   - Response: { ok: true, id_screen: 1 }       │
│           │   - Logs: "✅ Flutter Screen guardado"         │
│           │                                                  │
│           └─→ Emitir WebSocket                              │
│               emit('flutterScreenCambios', {                │
│                 cellId: 'class_1',                          │
│                 screen: { ... }                             │
│               })                                            │
│                   │                                          │
│                   └─→ Backend recibe evento                 │
│                       socket.on('flutterScreenCambios')    │
│                       │                                     │
│                       └─→ Transmitir a otros usuarios       │
│                           io.to(roomId).emit(               │
│                             'onFlutterScreenCambios', data  │
│                           )                                 │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Diagrama 2: Recibir Cambios (Múltiples Usuarios)

```
┌──────────────────────────────────────────────────────────────────┐
│                   SERVIDOR (Backend)                             │
│                  Socket.IO Event Handler                         │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Event: 'flutterScreenCambios' desde Usuario A                   │
│    └─→ Retransmitir a sala (excepto sender)                      │
│        io.to(roomId).emit('onFlutterScreenCambios', {            │
│          cellId: 'class_1',                                      │
│          screen: { ... },                                        │
│          usuario: 'usuarioA@email.com'                           │
│        })                                                        │
│          │                                                        │
│          └─────────────────────────────────────────┐             │
│                                                    │             │
└────────────────────────────────────────────────────┼─────────────┘
                                                    │
                            ┌───────────────────────┼───────────────────────┐
                            │                       │                       │
                    ┌───────┴──────────┐  ┌───────┴──────────┐  ┌──────────┴────────┐
                    │                  │  │                  │  │                   │
                    ▼                  ▼  ▼                  ▼  ▼                   ▼
              ┌──────────────┐   ┌──────────────┐   ┌──────────────────┐
              │  USUARIO B   │   │  USUARIO C   │   │    USUARIO D      │
              │  (Angular)   │   │  (Angular)   │   │   (Angular)       │
              └──────────────┘   └──────────────┘   └──────────────────┘
                    │                   │                   │
                    │                   │                   │
                    └─────────────┬─────┴───────────────────┘
                                  │
                    Listener: onListenFlutterScreenCambios()
                    Event: 'onFlutterScreenCambios' dispara
                                  │
                    ┌─────────────┴─────────────┐
                    │                           │
                    ▼                           ▼
              ┌──────────────────┐        ┌──────────────────────┐
              │ Actualizar Cache │        │ Si clase visible:    │
              │ Local            │        │ Actualizar Preview   │
              │ guardarEnCache() │        │ cdr.markForCheck()   │
              │ ✅               │        │ ✅                   │
              └──────────────────┘        └──────────────────────┘
                    │                           │
                    └─────────────┬─────────────┘
                                  │
                    guardarFlutterScreenEnBD()
                    POST /flutter-screen/save
                    - Actualiza BD con cambios del otro usuario
                    - ✅ Ahora Usuario B tiene datos actualizados
```

## Diagrama 3: Flujo Completo (Escenario Colaborativo)

```
LÍNEA DE TIEMPO
═══════════════════════════════════════════════════════════════

T=0s:  Usuario A abre clase Empleado
       └─→ generarFlutterScreenDesdeClase(cell)
       └─→ Intenta cargar de BD via GET /flutter-screen/:id_clase
       └─→ Si existe, carga con customizaciones
       └─→ Si NO existe, genera desde UML y guarda en BD

T=2s:  Usuario B abre MISMA clase Empleado
       └─→ generarFlutterScreenDesdeClase(cell)
       └─→ GET /flutter-screen/:id_clase
       └─→ Carga desde BD (misma pantalla que Usuario A)

T=5s:  Usuario A reordena: Nombre → Cargo → ID
       └─→ onDrop() en flutter-preview
       └─→ generarCodigoDart() actualiza código
       └─→ onFlutterScreenCambios() dispara
           ├─→ Guardar en cache local
           ├─→ POST /flutter-screen/save (actualiza BD)
           └─→ emit WebSocket a otros usuarios
               │
               └─→ Usuario B recibe evento
                   └─→ onListenFlutterScreenCambios() dispara
                   └─→ Actualizar cache
                   └─→ Si clase visible, actualizar preview
                   └─→ POST /flutter-screen/save (sincroniza BD)
                   └─→ Usuario B ve: Nombre → Cargo → ID ✅

T=8s:  Usuario A customiza label: "id" → "Código Único"
       └─→ Edita input en componente
       └─→ onFlutterScreenCambios() dispara
           └─→ PUT /flutter-screen/component/:id_component
               └─→ Actualiza BD: label_custom = "Código Único"
           └─→ emit WebSocket
               └─→ Usuario B recibe
               └─→ Preview actualiza: "Código Único" visible ✅

T=12s: Usuario A recarga página (F5)
       └─→ Vuelve a abrir clase
       └─→ GET /flutter-screen/:id_clase desde BD
       └─→ Obtiene:
           - Orden: Nombre → Cargo → ID ✅
           - Label: "Código Único" ✅
           - Todos los cambios persisten ✅

T=15s: Usuario A elimina atributo "id" en UML
       └─→ DELETE FROM atributo_clase WHERE id_atributo = 1
       └─→ Trigger: ON DELETE SET NULL
           └─→ UPDATE flutter_component SET id_atributo = NULL
                 WHERE id_atributo = 1
       └─→ Componente Flutter sigue existiendo pero sin referencia ✅

T=18s: Usuario B hace cambios mientras Usuario A está offline
       └─→ Reordena componentes nuevamente
       └─→ POST /flutter-screen/save → BD ✅
       └─→ emit WebSocket (Usuario A offline, no recibe)
       
T=21s: Usuario A se reconecta
       └─→ Abre clase nuevamente
       └─→ GET /flutter-screen/:id_clase
       └─→ Obtiene cambios que hizo Usuario B (desde BD) ✅
       └─→ Sincronizado sin conflictos ✅

═══════════════════════════════════════════════════════════════
```

## Diagrama 4: Integridad Referencial - Casos de Uso

```
CASO 1: Eliminar atributo en UML
─────────────────────────────────────

ANTES:
┌─────────────────┐          ┌──────────────────┐
│ clase_uml       │          │ flutter_component│
│ id_clase: 1     │          │ id_component: 1  │
└─────────────────┘          │ id_atributo: 5   │ ← REFERENCIA
                             │ label: "id"      │
atributo_clase:              └──────────────────┘
id_atributo: 5
nombre: "id"

ACCIÓN:
DELETE FROM atributo_clase WHERE id_atributo = 5

TRIGGER:
ON DELETE SET NULL en flutter_component.id_atributo

DESPUÉS:
┌──────────────────┐
│ flutter_component│
│ id_component: 1  │
│ id_atributo: NULL│ ← REFERENCIA ROTA, pero componente existe
│ label: "id"      │
└──────────────────┘

RESULTADO:
✅ No se elimina el componente Flutter
✅ Se marca como NULL (componente huérfano)
✅ En next reload, se muestra pero sin referencia a UML


CASO 2: Eliminar clase UML completa
─────────────────────────────────────

ANTES:
┌──────────────────┐
│ clase_uml        │ id_clase: 1 (Empleado)
└──────────────────┘
        │
        ├─→ flutter_screen (id_screen: 1)
        ├─→ flutter_component (múltiples registros)
        ├─→ atributo_clase (id_atributo: 1,2,3...)
        └─→ metodo_clase (id_metodo: 1,2...)

ACCIÓN:
DELETE FROM clase_uml WHERE id_clase = 1

TRIGGER:
ON DELETE CASCADE en:
  - flutter_screen (elimina id_screen: 1)
  - atributo_clase (elimina todos)
  - metodo_clase (elimina todos)

CASCADA en flutter_component:
  - DELETE FROM flutter_component WHERE id_screen = 1 (todos)

DESPUÉS:
[TODO ELIMINADO - Base de datos limpia]

RESULTADO:
✅ Clase UML eliminada
✅ Pantalla Flutter eliminada
✅ Componentes eliminados
✅ Atributos y métodos eliminados
✅ Sin datos huérfanos en BD
```

## Diagrama 5: Estados de Sincronización

```
STATE MACHINE
═════════════════════════════════════════════════════════════

                    [IDLE]
                      │
                      │ Usuario hace cambio en Flutter
                      ▼
                  [CAMBIO_LOCAL]
                      │
        ┌─────────────┼─────────────┐
        │             │             │
        ▼             ▼             ▼
    [CACHE]      [BD_SAVING]   [WEBSOCKET_EMIT]
        │             │             │
        └─────────────┼─────────────┘
                      │
                      ▼
                 [CAMBIO_ENVIADO] ✅
                      │
                      │ Otros usuarios reciben WebSocket
                      ▼
              [SINCRONIZANDO_REMOTO]
                      │
        ┌─────────────┼─────────────┐
        │             │             │
        ▼             ▼             ▼
    [CACHE]      [BD_SAVING]   [UI_UPDATE]
        │             │             │
        └─────────────┼─────────────┘
                      │
                      ▼
                 [SINCRONIZADO] ✅
                      │
                      │ Todos los usuarios tienen mismo estado
                      ▼
                    [IDLE]


TRANSICIONES:
• CAMBIO_LOCAL → CACHE: Siempre (rápido)
• CAMBIO_LOCAL → BD_SAVING: Si id_clase conocido
• BD_SAVING fallido → CACHE (reintentará después)
• WEBSOCKET_EMIT → Todos reciben
• Remoto recibe → SINCRONIZANDO_REMOTO
• SINCRONIZANDO_REMOTO → SINCRONIZADO cuando BD guardada
```

## Diagrama 6: Base de Datos - Relaciones

```
┌──────────────────────────────────────────────────────────────────┐
│                    ESQUEMA DE RELACIONES                          │
└──────────────────────────────────────────────────────────────────┘

┌─────────────────────┐
│   clase_uml         │
├─────────────────────┤
│ id_clase (PK)       │◄──────┐
│ id_sala (FK)        │       │
│ nombre_clase        │       │
│ cell_id             │       │ UNIQUE
│ ...                 │       │
└─────────────────────┘       │
  │         │                 │
  │         ├─→ atributo_clase│
  │         │   id_atributo   │
  │         │   nombre        │
  │         │   tipo          │
  │         │                 │
  │         └─→ metodo_clase  │
  │             id_metodo     │
  │             nombre        │
  │             tipo_retorno  │
  │                           │
  └──────────────────────────▶┌──────────────────────┐
                              │ flutter_screen       │
                              ├──────────────────────┤
                              │ id_screen (PK)       │
                              │ id_clase (FK,UNIQUE) │
                              │ nombre_screen        │
                              │ componentes_json     │
                              │ fecha_actualizacion  │
                              └──────────────────────┘
                                      │
                                      │ 1:M
                                      │
                              ┌───────▼────────────────┐
                              │ flutter_component      │
                              ├────────────────────────┤
                              │ id_component (PK)      │
                              │ id_screen (FK)         │
                              │ id_atributo (FK,NULL)◄─┘
                              │ id_metodo (FK,NULL)    │
                              │ label_custom           │
                              │ placeholder_custom     │
                              │ position               │
                              │ tipo_componente        │
                              │ propiedades_json       │
                              └────────────────────────┘


VISTAS LÓGICAS:
• Una clase → Una pantalla Flutter (UNIQUE id_clase)
• Una pantalla → Muchos componentes (1:M)
• Un componente → Opcional un atributo (0:1, NULL permitido)
• Un componente → Opcional un método (0:1, NULL permitido)

INTEGRIDAD:
• ON DELETE CASCADE: Eliminar clase → Elimina pantalla y componentes
• ON DELETE SET NULL: Eliminar atributo → Marca componente como NULL
```

## Diagrama 7: Secuencia de Peticiones HTTP

```
USUARIO A                    BACKEND                    BD
│                              │                         │
├──────────────────────────────────────────────────────▶│
│  POST /flutter-screen/save                           │
│  {                                                    │
│    id_sala: 1,                                        │
│    id_clase: 1,                                       │
│    componentes: [...]                                 │
│  }                                                    │
│                          ┌───────────────────────────▶│
│                          │ BEGIN TRANSACTION          │
│                          │                            │
│                          │ ┌─────────────────────────▶│
│                          │ │ UPDATE/INSERT flutter_   │
│                          │ │ screen                   │
│                          │ │◀────────────────────────┐│
│                          │ │ OK                      ││
│                          │ │                          ││
│                          │ ┌─────────────────────────▶│
│                          │ │ DELETE flutter_         │
│                          │ │ component               │
│                          │ │◀────────────────────────┐│
│                          │ │ OK                      ││
│                          │ │                          ││
│                          │ ┌─────────────────────────▶│
│                          │ │ INSERT flutter_         │
│                          │ │ component (x3)          │
│                          │ │◀────────────────────────┐│
│                          │ │ OK                      ││
│                          │ │                          ││
│                          │ ┌─────────────────────────▶│
│                          │ │ COMMIT                  │
│                          │ │◀────────────────────────┐│
│                          │ │ OK (Guardado)           ││
│                          │                            │
│ {                        │                            │
│  ok: true,              │                            │
│  id_screen: 1,          │                            │
│  componentes_guardados:3│                            │
│ }◀──────────────────────┤                            │
│                          │                            │

[Sin errores en esta secuencia]

SI HUBIERA ERROR:
│                          │ ROLLBACK
│ {                        │
│  ok: false,              │
│  error: "..."            │
│ }◀──────────────────────┤
```

---

**Nota**: Estos diagramas son conceptuales. La implementación actual maneja todos estos flujos automáticamente mediante Angular, Express, WebSockets y PostgreSQL.
