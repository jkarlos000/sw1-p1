# 🎨 Sistema UML Colaborativo con IA

Sistema de diagramación UML en tiempo real con chat de IA integrado para análisis y modificaciones automáticas.

## ✨ Características

- 🎨 **Editor UML colaborativo** - Múltiples usuarios en tiempo real
- 🤖 **IA integrada** - Claude Sonnet 4.5 analiza y modifica diagramas
- 🎤 **Chat multimodal** - Texto, audio y imágenes
- 📸 **Análisis visual** - Convierte diagramas en papel a digital
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

# Transcripción de Audio (opcional - elige uno)
# Prioridad: TRANSCRIPTION_PROVIDER > OpenAI > AssemblyAI > Deepgram > Google > Whisper Local
TRANSCRIPTION_PROVIDER=assemblyai  # o 'openai', 'deepgram', 'google', 'whisper-local'

# OpenAI (Whisper + GPT)
OPENAI_API_KEY=sk-xxxxx

# AssemblyAI (Recomendado - $0.015/min, español excelente)
ASSEMBLYAI_API_KEY=xxxxx

# Deepgram (Muy rápido - $0.0043/min)
DEEPGRAM_API_KEY=xxxxx

# Google Cloud Speech-to-Text (60min gratis/mes)
GOOGLE_CLOUD_KEY_PATH=/path/to/service-account.json
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

4. **Entrada Multimodal** 🆕
   - **Texto**: Instrucciones escritas
   - **Audio**: Grabación o archivo de audio (transcripción automática)
   - **Imágenes**: Fotos de diagramas en papel, bocetos, referencias visuales

### Casos de Uso Multimodal

#### 📸 Foto → Diagrama Digital
```
Usuario: "Convierte este diagrama que dibujé en papel"
[Adjunta foto del cuaderno]

→ Claude Vision analiza la imagen
→ Extrae clases, atributos, relaciones
→ Genera acciones de creación
→ Diagrama aparece automáticamente en el editor
```

#### 🎤 Audio + Imagen
```
Usuario: [Grabación] "Agrega los métodos que faltan en Usuario 
         y conéctalo con Pedido como muestro aquí"
[Adjunta boceto con flechas]

→ Whisper/AssemblyAI transcribe el audio
→ Claude Vision analiza la imagen
→ Combina ambos contextos
→ Aplica modificaciones precisas
```

#### 📝 Múltiples Archivos
```
- Hasta 5 audios simultáneos
- Hasta 10 imágenes simultáneas
- Combinación libre de texto + audio + imágenes
```

### Configuración IA

**Obtener API Key:**
- Claude: [console.anthropic.com](https://console.anthropic.com)
- GPT: [platform.openai.com](https://platform.openai.com)

**Modelos disponibles:**
- `claude-sonnet-4.5` ⭐ Recomendado (incluye Vision)
- `claude-opus-4` (más potente, más caro)
- `gpt-4` (alternativa OpenAI)
- `gpt-3.5-turbo` (más económico)

**Servicios de Transcripción:**

| Servicio | Calidad | Precio/min | Velocidad | Recomendado |
|----------|---------|------------|-----------|-------------|
| **AssemblyAI** | ⭐⭐⭐⭐⭐ | $0.015 | Rápida | ✅ **Sí** |
| OpenAI Whisper | ⭐⭐⭐⭐ | $0.006 | Media | ✅ Muy bueno |
| Deepgram | ⭐⭐⭐⭐ | $0.0043 | Muy rápida | ✅ Bueno |
| Google Cloud | ⭐⭐⭐⭐ | Gratis 60min | Media | ✅ Gratis |
| Whisper Local | ⭐⭐⭐ | Gratis | Lenta | 💻 Sin internet |

**Configuración en .env:**
```env
# Elige tu servicio preferido
TRANSCRIPTION_PROVIDER=assemblyai

# O deja que elija automáticamente según las API keys disponibles
# Orden de prioridad: OpenAI > AssemblyAI > Deepgram > Google > Local
```

## 📡 API Reference

### HTTP Endpoints

```
POST   /users/confirm-login              # Login
POST   /users                            # Registro
GET    /chat-ia/conversacion/sala/:id   # Conversación activa
POST   /chat-ia/mensaje                 # Mensaje + IA (texto)
POST   /chat-ia/mensaje-multimodal      # Mensaje + IA (multimodal) 🆕
POST   /chat-ia/generar-postman         # Generar colección
GET    /chat-ia/mensaje/:id/attachments # Obtener attachments 🆕
GET    /chat-ia/attachment/:id/download # Descargar archivo 🆕
```

### Ejemplo Multimodal (cURL)

```bash
curl -X POST http://localhost:3000/chat-ia/mensaje-multimodal \
  -F "id_sala=1" \
  -F "id_usuario=1" \
  -F "contenido=Convierte este diagrama a digital" \
  -F "diagrama_actual={\"cells\":[]}" \
  -F "audios=@grabacion.webm" \
  -F "imagenes=@diagrama_papel.jpg" \
  -F "imagenes=@boceto.png"
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

**Core:**
- `usuario` - Usuarios del sistema
- `sala` - Salas de colaboración
- `mensaje_general` - Chat general

**Chat con IA:**
- `conversacion_ia` - Conversaciones por sala
- `mensaje_chat_ia` - Mensajes (usuario ↔ IA)
- `mensaje_attachment` 🆕 - Archivos adjuntos (audio/imágenes)
- `snapshot_diagrama` - Versiones del diagrama
- `config_ia` - Configuración de IA por sala

**Schemas:**
- `backend-p1sw1/database/schema.sql` - Esquema principal
- `backend-p1sw1/database/chat-ia-schema.sql` - Chat IA
- `backend-p1sw1/database/multimodal-schema.sql` 🆕 - Attachments

### Setup

```bash
# Ejecutar schemas (en orden)
docker exec -i postgres_container psql -U postgres -d parcial1sw1 < backend-p1sw1/database/schema.sql
docker exec -i postgres_container psql -U postgres -d parcial1sw1 < backend-p1sw1/database/chat-ia-schema.sql
docker exec -i postgres_container psql -U postgres -d parcial1sw1 < backend-p1sw1/database/multimodal-schema.sql

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

**Transcripción de audio falla:**
```bash
# Verificar API keys
echo $ASSEMBLYAI_API_KEY  # o la que uses

# Revisar logs del backend
# Buscar: "🎤 Transcribiendo con [servicio]"

# Si usas Whisper local, instalarlo:
pip install openai-whisper
# O whisper.cpp para mejor rendimiento
```

**Imágenes no se analizan:**
- Claude Sonnet 4.5 requiere ANTHROPIC_API_KEY
- Verificar que las imágenes sean JPG/PNG válidas
- Tamaño máximo: 50MB por archivo
- Comprobar logs: "📷 Imagen cargada"

## 📚 Documentación Adicional

- [Backend README](backend-p1sw1/README.md)
- [Frontend README](official-sw1p1/README.md)
- [Instalación Multimodal](INSTALACION_MULTIMODAL.md) 🆕
- [Guía de Uso Multimodal](GUIA_USO_MULTIMODAL.md) 🆕
- [Resumen de Implementación](RESUMEN_IMPLEMENTACION.md) 🆕
- [Ejemplo de Integración](EJEMPLO_INTEGRACION.ts) 🆕

## 🚀 Setup Rápido Multimodal

**Windows (PowerShell):**
```powershell
.\setup-multimodal.ps1
```

**Linux/Mac:**
```bash
chmod +x setup-multimodal.sh
./setup-multimodal.sh
```

O manualmente:
```bash
# 1. Instalar dependencias backend
cd backend-p1sw1
npm install multer @types/multer form-data axios

# 2. Aplicar schema de BD
docker exec -i postgres_container psql -U postgres -d parcial1sw1 < database/multimodal-schema.sql

# 3. Configurar API keys en .env
nano .env  # Agregar ASSEMBLYAI_API_KEY o OPENAI_API_KEY

# 4. Iniciar servicios
npm start  # Backend
cd ../official-sw1p1 && npm start  # Frontend
```

## 🤝 Contribuir

Proyecto desarrollado para fines académicos.

## 🌟 Características Destacadas

### Chat Multimodal 🆕
```
📝 Texto: "Agrega una clase Usuario"
🎤 Audio: [Grabación de voz con instrucciones]
📸 Imagen: Foto de diagrama en papel
→ IA procesa todo y genera el diagrama automáticamente
```

### Transcripción Inteligente
- 5 servicios intercambiables (AssemblyAI, Whisper, Deepgram, Google, Local)
- Detección automática de API keys disponibles
- Fallback a modo gratuito (Whisper local)

### Análisis Visual
- Claude Vision extrae estructura de diagramas dibujados a mano
- Reconoce clases, atributos, métodos, relaciones
- OCR automático para texto manuscrito

### Sincronización en Tiempo Real
- Modificaciones visibles para todos los usuarios
- WebSockets para comunicación instantánea
- Estado del chat compartido

---

**Universidad:** UAGRM - Ingeniería de Sistemas  
**Materia:** Ingeniería de Software 1  
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
