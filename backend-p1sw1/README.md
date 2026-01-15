# Backend Socket Server - SW1 Project

## 📝 Descripción

Backend actualizado del proyecto SW1 con soporte completo de WebSockets para comunicación en tiempo real. Incluye gestión de salas de chat, salas privadas, reuniones con persistencia en base de datos y sincronización de diagramas.

## 🚀 Instalación y Configuración

### 1. Instalar Dependencias
```bash
npm install
```

### 2. Configurar Base de Datos
Asegurarse de tener PostgreSQL instalado y configurado. Revisar la configuración en:
- `database/config.ts` - Configuración de conexión
- `database/schema.sql` - Esquema de tablas
- `database/seed.sql` - Datos de prueba

Ejecutar los scripts SQL:
```bash
# Crear tablas
psql -U tu_usuario -d tu_base_datos -f database/schema.sql

# (Opcional) Cargar datos de prueba
psql -U tu_usuario -d tu_base_datos -f database/seed.sql
```

### 3. Compilar TypeScript
```bash
# Compilación en modo watch (recompila automáticamente)
tsc -w
```

### 4. Levantar el Servidor
```bash
# Con nodemon (recomendado para desarrollo)
nodemon dist/

# O con node
node dist/
```

El servidor se levantará en el puerto configurado en `global/environment.ts`.

## 📚 Documentación

### Documentación Principal
- **[ACTUALIZACION_WEBSOCKETS.md](./ACTUALIZACION_WEBSOCKETS.md)** - Resumen completo de la actualización, eventos implementados y arquitectura
- **[GUIA_USO_WEBSOCKETS.md](./GUIA_USO_WEBSOCKETS.md)** - Guía práctica con ejemplos de código para el frontend

### Archivos de Configuración
- `tsconfig.json` - Configuración de TypeScript
- `package.json` - Dependencias y scripts del proyecto

## 🔌 Eventos WebSocket Disponibles

### Chat y Salas
- `init-chatGeneral` - Iniciar sesión en chat general
- `entra-sala` - Unirse a sala de chat
- `init-sala-privada` - Iniciar/unirse a sala privada
- `evento-new-sp` - Agregar evento a sala privada
- `delete-evento-sp` - Eliminar evento de sala privada

### Reuniones con Base de Datos
- `nueva-reunion` - Crear nueva reunión (persiste en BD)
- `unirse-reunion` - Unirse a reunión existente

### Sincronización
- `changed-diagrama` - Sincronizar cambios de diagrama en tiempo real

Ver documentación completa en [ACTUALIZACION_WEBSOCKETS.md](./ACTUALIZACION_WEBSOCKETS.md).

## 🗂️ Estructura del Proyecto

```
backend-p1sw1/
├── classes/          # Clase principal del servidor
│   └── server.ts
├── controller/       # Controladores (autenticación)
│   └── auth.controller.ts
├── database/         # Configuración y scripts SQL
│   ├── config.ts
│   ├── schema.sql
│   ├── seed.sql
│   └── drop-tables.sql
├── global/           # Configuración global
│   └── environment.ts
├── routes/           # Rutas HTTP (endpoints REST)
│   └── router.ts
├── sockets/          # Manejadores de eventos WebSocket
│   └── socket.ts
├── index.ts          # Punto de entrada
├── test-websockets.ts # Script de prueba
└── README.md
```

## 🔧 Testing

### Pruebas Manuales
Se incluye un script de prueba en `test-websockets.ts` con funciones para probar todos los eventos.

### Pruebas con Cliente
Usar el frontend en `../official-sw1p1` que ya está configurado para usar estos eventos.

### Herramientas Recomendadas
- **Postman** - Para probar endpoints HTTP
- **Socket.IO Client Tool** - Para probar eventos WebSocket
- **Browser DevTools** - Inspeccionar WebSocket en pestaña Network

## 🔐 Base de Datos

### Tablas Principales
- `usuario` - Usuarios registrados
- `sala` - Salas/reuniones creadas
- `asistencia` - Relación usuario-sala

### Operaciones Principales
- Las salas privadas y chats se manejan en memoria (sin BD)
- Las reuniones se persisten en la base de datos
- Los eventos de salas privadas están en memoria (considerar persistencia)

Ver más detalles en [ACTUALIZACION_WEBSOCKETS.md](./ACTUALIZACION_WEBSOCKETS.md).

## 🌐 Endpoints HTTP (Fallback)

El servidor mantiene endpoints HTTP como alternativa/complemento a WebSockets:

- `POST /users/confirm-login` - Login
- `POST /users` - Registro
- `POST /salaCreate` - Crear sala
- `POST /salaData` - Obtener datos de sala
- `POST /unirseSalaXcodigo` - Verificar existencia de sala
- `POST /asistenciaAnotar` - Registrar asistencia
- `POST /asistenciaBorrar` - Eliminar asistencia
- `POST /asistentesSala` - Listar asistentes
- `POST /borrarSala` - Eliminar sala vacía
- `POST /codigoIA` - Generar código con IA

Ver más en `routes/router.ts`.

## 📦 Dependencias Principales

```json
{
  "express": "^4.x",
  "socket.io": "^4.x",
  "pg": "^8.x",
  "typescript": "^5.x",
  "cors": "^2.x"
}
```

## ⚙️ Variables de Entorno

Configurar en `global/environment.ts`:
- `SERVER_PORT` - Puerto del servidor (default: 5000)
- Configuración de base de datos en `database/config.ts`

## 🤝 Integración con Frontend

El frontend está en `../official-sw1p1` y usa:
- `ngx-socket-io` para conexión WebSocket
- `WebsocketService` como servicio principal
- Servicios específicos por funcionalidad (chat, salas, auth)

Ver ejemplos de uso en [GUIA_USO_WEBSOCKETS.md](./GUIA_USO_WEBSOCKETS.md).

## 🐛 Debugging

### Logs del Servidor
Todos los eventos imprimen logs con formato:
```
nombre-evento: { payload }
Descripción de la acción realizada
```

### Errores Comunes
- **Socket no conectado**: Verificar CORS y URL del servidor
- **Error en BD**: Verificar conexión y que las tablas existan
- **Eventos no llegan**: Verificar que el evento esté registrado en `server.ts`

## 📝 Notas Importantes

- ✅ Backend completamente actualizado con WebSockets
- ✅ Compatible con la implementación actual del frontend
- ✅ Endpoints HTTP mantenidos como fallback
- ⚠️ Salas en memoria se pierden al reiniciar el servidor
- 🔜 Considerar implementar persistencia de eventos de salas
- 🔜 Agregar autenticación en eventos WebSocket
- 🔜 Implementar limpieza de salas vacías

## 📄 Licencia

[Especificar licencia del proyecto]

## 👥 Autores

[Información de contacto y contribuidores]

---

**Última actualización**: Enero 2026
**Versión**: 2.0 - WebSocket Full Support 
