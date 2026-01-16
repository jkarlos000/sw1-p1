# Backend - Sistema UML Colaborativo

Backend con Node.js, Express, Socket.IO y PostgreSQL para diagramación UML colaborativa en tiempo real con IA.

## 🚀 Inicio Rápido

```bash
npm install
cp .env.example .env
npm start
```

## 💻 Stack Tecnológico

- **Node.js 18+** con TypeScript
- **Express 4.19** - Framework web
- **Socket.IO 4.7** - WebSockets tiempo real
- **PostgreSQL 14+** - Base de datos
- **Anthropic Claude / OpenAI** - APIs de IA

## 📁 Estructura

```
backend-p1sw1/
├── controller/
│   ├── auth.controller.ts      # Autenticación
│   └── chat-ia.controller.ts   # Chat IA + modificaciones diagrama
├── routes/
│   └── router.ts              # Endpoints HTTP
├── sockets/
│   └── socket.ts              # Eventos WebSocket
├── database/
│   ├── schema.sql             # Tablas principales
│   └── seed.sql               # Datos de prueba
└── index.ts                   # Entry point
```

## ⚙️ Configuración (.env)

```env
# Base de datos
DB_HOST=localhost
DB_PORT=5432
DB_NAME=parcial1sw1
DB_USER=postgres
DB_PASSWORD=your_password

# Servidor
PORT=3000

# IA (Claude recomendado)
ANTHROPIC_API_KEY=sk-ant-xxxxx
MODELO_IA=claude-sonnet-4.5
```

## 🔌 API Reference

### Autenticación
```
POST   /users/confirm-login    # Login
POST   /users                  # Registro
```

### Chat IA
```
GET    /chat-ia/conversacion/sala/:id    # Conversación activa
POST   /chat-ia/conversacion             # Nueva conversación
POST   /chat-ia/mensaje                  # Enviar mensaje + IA
GET    /chat-ia/mensajes/:id             # Historial
POST   /chat-ia/generar-postman          # Generar colección Postman
```

### WebSocket Events
```
entra-sala                # Unirse a sala
changed-diagrama          # Actualizar diagrama (emit)
listen-changed-diagrama   # Recibir actualización (listen)
nuevo-mensaje-chat-ia     # Nuevo mensaje de IA (broadcast)
modificacion-diagrama-ia  # Modificaciones sugeridas por IA
```

## 🤖 Funcionalidades IA

- **Análisis de diagramas UML**: Extrae clases, atributos, relaciones
- **Modificaciones estructuradas**: JSON con acciones (agregar, eliminar, limpiar)
- **Generación automática**: Colecciones de Postman basadas en el diagrama
- **Persistencia**: Guarda cambios en BD y sincroniza via WebSocket

## 📊 Base de Datos

### Tablas principales
- `usuario` - Usuarios del sistema
- `sala` - Salas de colaboración
- `mensaje_general` - Chat general
- `conversacion_ia` - Conversaciones con IA
- `mensaje_chat_ia` - Mensajes del chat IA
- `config_ia` - Configuración por sala (modelo, temperatura, etc.)

### Ejecutar schemas
```bash
docker exec -i postgres_container psql -U postgres -d parcial1sw1 < database/schema.sql
docker exec -i postgres_container psql -U postgres -d parcial1sw1 < database/seed.sql
```
