# 🎨 Sistema UML Colaborativo con IA

Sistema de diagramación UML en tiempo real con chat de IA integrado para análisis y modificaciones automáticas.

## ✨ Características

- 🎨 **Editor UML colaborativo** - Múltiples usuarios en tiempo real
- 🤖 **IA integrada** - Claude Sonnet 4.5 analiza y modifica diagramas
- 🔄 **Sincronización WebSocket** - Cambios instantáneos
- 💾 **Persistencia automática** - PostgreSQL
- 🚀 **Generación de código** - Spring Boot, Postman
- 📤 **Exportación** - XML (EA), JSON, Spring Boot

## 🚀 Instalación Rápida

### Prerequisitos
- Node.js 18+
- Docker & Docker Compose
- Git

### Setup Completo

```bash
# 1. Clonar repositorio
git clone <repo-url>
cd jk

# 2. Iniciar base de datos
docker-compose up -d

# 3. Backend
cd backend-p1sw1
npm install
cp .env.example .env
# Editar .env con credenciales BD y API keys
npm start

# 4. Frontend (nueva terminal)
cd ../official-sw1p1
npm install
npm start

# 5. Abrir http://localhost:4200
```

### Variables de Entorno (.env)

```env
# Base de datos
DB_HOST=localhost
DB_PORT=5432
DB_NAME=parcial1sw1
DB_USER=postgres
DB_PASSWORD=your_password

# IA (Claude recomendado)
ANTHROPIC_API_KEY=sk-ant-xxxxx
MODELO_IA=claude-sonnet-4.5
```

## 🏗️ Arquitectura

### Stack

**Backend:**
- Node.js 18 + TypeScript + Express
- Socket.IO 4.7 (WebSockets)
- PostgreSQL 14+
- Anthropic Claude API

**Frontend:**
- Angular 18 (Standalone)
- Signals API
- JointJS/Rappid
- Tailwind CSS

### Estructura

```
jk/
├── backend-p1sw1/              # API + WebSockets
│   ├── controller/
│   │   ├── auth.controller.ts
│   │   └── chat-ia.controller.ts
│   ├── routes/router.ts
│   ├── sockets/socket.ts
│   └── database/
│       ├── schema.sql
│       └── seed.sql
│
├── official-sw1p1/             # Angular App
│   └── src/app/
│       ├── auth/
│       ├── diagramador/
│       │   ├── chat-ia/
│       │   └── services/
│       └── chatsw1/
│
└── docker-compose.yml          # PostgreSQL
```

## 🤖 Chat con IA

### Capacidades

1. **Análisis de Diagramas**
   - Extrae clases, atributos, relaciones
   - Identifica patrones de diseño
   - Sugiere mejoras

2. **Modificaciones Automáticas**
   ```json
   {
     "acciones": [
       {"tipo": "agregar", "elemento": "clase", "nombre": "Usuario", ...},
       {"tipo": "eliminar", "elemento": "clase", "nombre": "Temporal"}
     ]
   }
   ```

3. **Generación de Código**
   - Colecciones Postman (API REST)
   - Proyectos Spring Boot
   - Documentación

### Configuración IA

**Obtener API Key:**
- Claude: [console.anthropic.com](https://console.anthropic.com)
- GPT: [platform.openai.com](https://platform.openai.com)

**Modelos disponibles:**
- `claude-sonnet-4.5` ⭐ Recomendado
- `claude-opus-4`
- `gpt-4`
- `gpt-3.5-turbo`

## 📡 API Reference

### HTTP Endpoints

```
POST   /users/confirm-login              # Login
POST   /users                            # Registro
GET    /chat-ia/conversacion/sala/:id   # Conversación activa
POST   /chat-ia/mensaje                 # Mensaje + IA
POST   /chat-ia/generar-postman         # Generar colección
```

### WebSocket Events

```
entra-sala                    # Unirse a sala
changed-diagrama              # Actualizar diagrama
listen-changed-diagrama       # Recibir actualización
nuevo-mensaje-chat-ia         # Mensaje de IA
modificacion-diagrama-ia      # Modificaciones IA
```

## 💾 Base de Datos

### Tablas

- `usuario` - Usuarios del sistema
- `sala` - Salas de colaboración
- `mensaje_general` - Chat general
- `conversacion_ia` - Conversaciones con IA
- `mensaje_chat_ia` - Mensajes del chat
- `config_ia` - Configuración por sala

### Setup

```bash
# Ejecutar schemas
docker exec -i postgres_container psql -U postgres -d parcial1sw1 < backend-p1sw1/database/schema.sql

# Datos de prueba (opcional)
docker exec -i postgres_container psql -U postgres -d parcial1sw1 < backend-p1sw1/database/seed.sql
```

## 🛠️ Funcionalidades

### Editor UML
- Clases con atributos
- Relaciones (herencia, composición, agregación, asociación)
- Drag & drop
- Grid inteligente 3x∞
- Clear sincronizado

### Exportación
- **XML**: Compatible con Enterprise Architect
- **JSON**: Formato JointJS
- **Spring Boot**: Proyecto completo (JPA + Services + Controllers)
- **Postman**: Colección API REST generada por IA

### Colaboración
- Múltiples usuarios simultáneos
- Sincronización en tiempo real
- Chat por sala
- Guardado automático

## 🔧 Troubleshooting

**Error de conexión BD:**
```bash
# Verificar contenedor
docker ps

# Ver logs
docker logs postgres_container

# Reiniciar
docker-compose restart
```

**Error WebSocket:**
- Verificar puertos 3000 y 4200 libres
- Revisar CORS en backend
- Comprobar firewall

**IA no responde:**
- Verificar API key en .env
- Revisar límites de rate
- Comprobar logs del backend

## 📚 Documentación Adicional

- [Backend README](backend-p1sw1/README.md)
- [Frontend README](official-sw1p1/README.md)

## 🤝 Contribuir

Proyecto desarrollado para fines académicos.

---

**Universidad:** UMSA - Ingeniería de Sistemas  
**Materia:** Sistemas Web 1  
**Año:** 2026
- `sala` - Salas de diagramación

**Chat con IA:**
- `conversacion_ia` - Conversaciones por sala
- `mensaje_chat_ia` - Mensajes (usuario ↔ IA)
- `snapshot_diagrama` - Versiones del diagrama
- `config_ia` - Configuración de IA por sala

**Schemas:**
- `backend-p1sw1/database/schema.sql` - Esquema principal
- `backend-p1sw1/database/chat-ia-schema.sql` - Chat IA

---

## 🐛 Troubleshooting

### Backend no inicia
```bash
# Verificar PostgreSQL
docker ps | grep postgres

# Ver logs
docker logs <postgres-container-id>

# Verificar .env
cat backend-p1sw1/.env
```

### IA no responde
```bash
# Verificar API key en .env
echo $ANTHROPIC_API_KEY

# Ver logs del backend (modo simulación si no hay key)
# Buscar: "⚠️  No se encontró ANTHROPIC_API_KEY"
```

### Sincronización entre navegadores falla
```bash
# Verificar WebSocket en navegador
# DevTools → Network → WS → Ver mensajes

# Backend debería mostrar:
# "Cliente conectado", "Usuario conectado a sala X"
```

### Error de base de datos
```bash
# Verificar conexión
docker exec -it $(docker ps -qf "name=postgres") psql -U sw1_user -d sw1_database

# Re-ejecutar schemas
\i backend-p1sw1/database/schema.sql
\i backend-p1sw1/database/chat-ia-schema.sql
```

---

## 📚 Variables de Entorno

**Backend (.env):**
```env
# Base de datos
DB_HOST=localhost
DB_PORT=5432
DB_NAME=sw1_database
DB_USER=sw1_user
DB_PASSWORD=tu_password

# Servidor
PORT=3000

# IA (opcional - al menos una)
ANTHROPIC_API_KEY=sk-ant-xxxxx
OPENAI_API_KEY=sk-xxxxx
```

---

## 🤝 Flujo de Trabajo

### Usuario se une a sala
1. Login → Frontend guarda token
2. Crea/une sala → Backend crea registro en BD
3. Unirse via WebSocket → `entra-sala`
4. Cargar diagrama → GET `/diagrama/:sala`
5. Editar → Emitir `changed-diagrama`
6. Otros usuarios reciben cambios en tiempo real

### Chat con IA
1. Usuario escribe mensaje → `mensaje-chat-ia` (WebSocket)
2. Frontend envía a API → POST `/chat-ia/mensaje` (HTTP)
3. Backend analiza diagrama actual
4. Backend envía a Claude/GPT con contexto
5. Backend guarda respuesta en BD
6. Backend emite a toda la sala → `nuevo-mensaje-chat-ia`
7. Todos los usuarios ven la respuesta

---

## 📝 Licencia

MIT

## 👨‍💻 Autor

**Jkarlos** - 2026
