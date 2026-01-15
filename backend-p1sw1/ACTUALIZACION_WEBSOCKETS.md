# Actualización del Backend - Migración a WebSockets

## 📋 Resumen de Cambios

El backend ha sido actualizado para soportar completamente la comunicación via WebSockets, alineándose con la implementación actual del frontend. Se han agregado nuevos manejadores de eventos mientras se mantiene la compatibilidad con los endpoints HTTP existentes.

## 🔄 Eventos WebSocket Implementados

### Chat General
- **`init-chatGeneral`** (Frontend → Backend)
  - Payload: `{ id: string, nombre: string }` (UsuarioDto)
  - Respuesta: `clientes-conectados` (emit a todos los clientes)
  - Función: Registra un usuario en el chat general y notifica a todos

- **`clientes-conectados`** (Backend → Frontend)
  - Payload: `UsuarioDto[]`
  - Función: Lista actualizada de usuarios conectados al chat general

### Salas de Chat
- **`entra-sala`** (Frontend → Backend)
  - Payload: `{ usuario: UsuarioDto, sala: string }`
  - Respuesta: `clientes-conectados-sala` (emit a la sala)
  - Función: Usuario se une a una sala de chat específica

- **`clientes-conectados-sala`** (Backend → Frontend)
  - Payload: `UsuarioDto[]`
  - Función: Lista de usuarios conectados a una sala específica

### Salas Privadas SW1
- **`init-sala-privada`** (Frontend → Backend)
  - Payload: `{ usuario: UsuarioDto, idSala: string }`
  - Respuestas:
    - `clientes-conectados-sala-privada` - Lista de usuarios
    - `updated-eventos` - Lista de eventos de la sala
  - Función: Inicializa una sala privada y une al usuario

- **`evento-new-sp`** (Frontend → Backend)
  - Payload: `{ idSala: string, evento: string }`
  - Respuesta: `updated-eventos` (emit a la sala)
  - Función: Agrega un nuevo evento a la sala privada

- **`delete-evento-sp`** (Frontend → Backend)
  - Payload: `{ idSala: string, evento: string }`
  - Respuesta: `updated-eventos` (emit a la sala)
  - Función: Elimina un evento de la sala privada

- **`updated-eventos`** (Backend → Frontend)
  - Payload: `string[]`
  - Función: Lista actualizada de eventos en la sala privada

- **`clientes-conectados-sala-privada`** (Backend → Frontend)
  - Payload: `UsuarioDto[]`
  - Función: Lista de usuarios conectados a la sala privada

### Reuniones y Diagramas
- **`nueva-reunion`** (Frontend → Backend)
  - Payload: `{ id: number, nombre: string }`
  - Respuesta: `nueva-reunion` con `{ ok: boolean, sala: SalaData }`
  - Función: Crea una nueva reunión en la base de datos y una sala de WebSocket

- **`unirse-reunion`** (Frontend → Backend)
  - Payload: `{ id: number, nombre: string }`
  - Respuestas:
    - `unirse-reunion` al emisor
    - `colaboradores-sala-trabajo` broadcast a la sala
  - Función: Une un usuario a una reunión existente

- **`changed-diagrama`** (Frontend → Backend)
  - Payload: `{ sala?: string, ...data }`
  - Respuesta: `changed-diagrama` (broadcast a todos excepto emisor)
  - Función: Sincroniza cambios en diagramas en tiempo real

## 🗂️ Estructura de Datos

### UsuarioDto
```typescript
interface UsuarioDto {
    id: string;      // ID del socket del usuario
    nombre: string;  // Nombre del usuario
}
```

### Salas Activas (En memoria)
```typescript
interface SalaData {
    [idSala: string]: {
        usuarios: UsuarioDto[];
        eventos: string[];
    };
}
```

## 📝 Archivos Modificados

### 1. `/sockets/socket.ts`
**Funciones Nuevas:**
- `initChatGeneral()` - Maneja inicio de sesión en chat general
- `entraSala()` - Maneja entrada a salas de chat
- `initSalaPrivada()` - Inicializa salas privadas SW1
- `addEventoSalaPrivada()` - Agrega eventos a salas privadas
- `deleteEventoSalaPrivada()` - Elimina eventos de salas privadas
- `nuevaReunion()` - Crea nuevas reuniones con BD
- `unirseReunion()` - Une usuarios a reuniones existentes
- `changedDiagrama()` - Sincroniza cambios de diagramas

**Funciones Legacy (Mantenidas):**
- `crearSala()` - Renombrada a evento `nueva-reunion-legacy`
- `entrarSala()` - Versión antigua
- `salirSala()` - Versión antigua
- `dataSala()` - Versión antigua
- `mensaje()` - Versión antigua
- `mensajePrueba()` - Versión antigua
- `desconectar()` - Mantenido igual

### 2. `/classes/server.ts`
**Método `escucharSockets()` actualizado:**
- Agregados todos los nuevos listeners de WebSocket
- Organizado por categorías (Chat General, Salas, Reuniones, etc.)
- Mantenidos listeners legacy para compatibilidad
- Agregado logging del ID del cliente

### 3. `/routes/router.ts`
**Sin cambios funcionales, solo documentación:**
- Agregados comentarios identificando endpoints HTTP como fallback/complemento
- Todas las rutas existentes se mantienen funcionales
- Endpoints disponibles para uso alternativo a WebSocket

## 🔌 Conexión Frontend-Backend

### Configuración del Frontend
El frontend usa `ngx-socket-io` y el servicio `WebsocketService` para gestionar la conexión:

```typescript
// Emitir evento
websocketService.emit('init-sala-privada', { usuario, idSala });

// Escuchar evento
websocketService.listen('clientes-conectados-sala-privada')
  .subscribe((usuarios) => { ... });
```

### Configuración del Backend
El servidor Socket.IO está configurado con CORS habilitado:

```typescript
this.io = new IOServer(this.httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    credentials: true
  }
});
```

## 🔄 Flujos de Trabajo Principales

### 1. Crear y Unirse a Sala Privada
```
Frontend                           Backend
   |                                  |
   |--- init-sala-privada ----------->|
   |                                  | (Crea/actualiza sala en memoria)
   |<-- clientes-conectados-sala-privada ---|
   |<-- updated-eventos ---------------|
```

### 2. Gestionar Eventos en Sala
```
Frontend                           Backend
   |                                  |
   |--- evento-new-sp --------------->|
   |                                  | (Agrega evento a sala)
   |<-- updated-eventos ---------------|
   |                                  |
   |--- delete-evento-sp ------------->|
   |                                  | (Elimina evento)
   |<-- updated-eventos ---------------|
```

### 3. Crear Reunión con BD
```
Frontend                           Backend
   |                                  |
   |--- nueva-reunion ---------------->|
   |                                  | (INSERT en BD: sala, asistencia)
   |                                  | (Join socket room)
   |<-- nueva-reunion (respuesta) -----|
```

## 💾 Interacción con Base de Datos

### Tablas Utilizadas
- **`sala`**: Almacena información de salas/reuniones
  - `id_sala`, `nombre_sala`, `host_sala`, `informacion`
- **`usuario`**: Almacena usuarios registrados
  - `id_usuario`, `email`, `password`
- **`asistencia`**: Relaciona usuarios con salas
  - `id_usuario`, `id_sala`, `fecha_hora`

### Eventos con BD
- `nueva-reunion`: INSERT en `sala` y `asistencia`
- `unirse-reunion`: SELECT `sala`, INSERT `asistencia` (si no existe)

### Eventos Solo en Memoria
- Salas privadas SW1 (usuarios y eventos)
- Chat general (usuarios conectados)
- Salas de chat (usuarios por sala)

## 🚀 Próximos Pasos Recomendados

1. **Testing**: Probar todos los flujos de WebSocket con el frontend
2. **Persistencia**: Considerar guardar eventos de salas privadas en BD
3. **Limpieza**: Implementar limpieza de salas en memoria cuando quedan vacías
4. **Desconexión**: Manejar desconexiones de usuarios y actualizar listas
5. **Reconexión**: Implementar lógica de reconexión para usuarios desconectados
6. **Validación**: Agregar más validaciones de permisos y autenticación

## 🔒 Consideraciones de Seguridad

- [ ] Validar tokens de autenticación en eventos WebSocket
- [ ] Verificar permisos de usuario antes de modificar salas
- [ ] Sanitizar datos de entrada
- [ ] Implementar rate limiting para eventos
- [ ] Agregar logging de auditoría

## 📚 Referencias

- Frontend Service: `/official-sw1p1/src/app/common/services/websocket.service.ts`
- Salas SW1: `/official-sw1p1/src/app/chatsw1/sala-sw1.service.ts`
- Auth Service: `/official-sw1p1/src/app/auth/auth.service.ts`
- Chat Services: `/official-sw1p1/src/app/chat*/`
