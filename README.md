# 🎨 FICCT UML - Sistema de Diagramación UML Colaborativo con IA

> **Sistema de diagramación UML en tiempo real con chat de IA multimodal integrado**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-20+-green.svg)](https://nodejs.org/)
[![Angular](https://img.shields.io/badge/Angular-18-red.svg)](https://angular.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue.svg)](https://www.postgresql.org/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED.svg)](https://www.docker.com/)

## ✨ Características Principales

- 🎨 **Editor UML colaborativo** - Múltiples usuarios editando en tiempo real
- 🤖 **IA integrada** - Claude Sonnet 4.5 analiza y modifica diagramas automáticamente
- 🎤 **Chat multimodal** - Soporta texto, audio (transcripción) e imágenes (análisis visual)
- 📸 **Análisis visual** - Convierte diagramas dibujados en papel a digital con Claude Vision
- 🔄 **Sincronización WebSocket** - Cambios instantáneos entre todos los usuarios
- 💾 **Persistencia automática** - Guardado en PostgreSQL con versionado
- 🚀 **Generación de código** - Spring Boot (JPA + Services + Controllers), Postman Collections
- 📤 **Exportación múltiple** - XML (Enterprise Architect), JSON (JointJS), Spring Boot
- 🗑️ **Gestión de salas** - Crear, unirse, eliminar salas con verificación de host

## 📋 Tabla de Contenidos

- [Inicio Rápido](#-inicio-rápido)
- [Prerequisitos](#prerequisitos)
- [Instalación](#-instalación)
  - [Desarrollo Local](#desarrollo-local)
  - [Docker (Producción)](#-docker-producción)
  - [SSL con Let's Encrypt](#-ssl-con-lets-encrypt)
- [Stack Tecnológico](#-stack-tecnológico)
- [Arquitectura](#-arquitectura)
- [Configuración](#-configuración)
- [API Reference](#-api-reference)
- [Base de Datos](#-base-de-datos)
- [Funcionalidades](#-funcionalidades)
- [Troubleshooting](#-troubleshooting)
- [Despliegue en Producción](#-despliegue-en-producción)

---

## 🚀 Inicio Rápido

### Prerequisitos

- **Node.js 18+** ([Descargar](https://nodejs.org/))
- **Docker & Docker Compose** ([Descargar](https://www.docker.com/))
- **Git** ([Descargar](https://git-scm.com/))

### Desarrollo Local

```bash
# 1. Clonar repositorio
git clone <repo-url>
cd jk

# 2. Iniciar PostgreSQL con Docker
docker-compose up -d postgres

# 3. Configurar y ejecutar Backend
cd backend-p1sw1
npm install
cp .env.example .env
# Editar .env con tus credenciales (ver sección Configuración)
npm start

# 4. Configurar y ejecutar Frontend (nueva terminal)
cd official-sw1p1
npm install
npm start

# 5. Abrir navegador
http://localhost:4200
```

---

## 🌐 Configuración de URLs - IMPORTANTE

### ⚠️ Problema Común: DNS en Docker

**El problema:** Si configuras `BACKEND_URL=http://backend:3000`, el navegador del cliente NO puede resolver ese nombre DNS (solo funciona dentro de Docker).

**La solución:** Usar un dominio público con Nginx como proxy reverso.

### ✅ Configuración Correcta para Producción

**Tu dominio:** `uml.jkhoster.com`

```
Navegador → https://uml.jkhoster.com/api
    ↓
Nginx (Puerto 443)
    ↓
Backend (Red Docker: http://backend:3000)
    ↓
PostgreSQL
```

**Archivos clave:**

1. **`official-sw1p1/src/assets/config.json`** - Lo que usa el navegador:
```json
{
  "apiUrl": "https://uml.jkhoster.com/api",
  "wsUrl": "https://uml.jkhoster.com"
}
```

2. **`.env`** - Variables de entorno:
```env
API_URL=https://uml.jkhoster.com/api
WS_URL=https://uml.jkhoster.com
CORS_ORIGIN=https://uml.jkhoster.com
```

3. **`nginx/nginx.conf`** - Proxy reverso ya configurado para `uml.jkhoster.com`

### 🔄 Cambiar entre Desarrollo y Producción

**Linux/Mac:**
```bash
# Desarrollo local
./switch-env.sh dev

# Producción
./switch-env.sh prod
```

**Windows:**
```powershell
# Desarrollo local
.\switch-env.ps1 dev

# Producción
.\switch-env.ps1 prod
```

📖 **Para más detalles, ver:** [CONFIGURACION_URLS.md](CONFIGURACION_URLS.md) y [DESPLIEGUE_PRODUCCION.md](DESPLIEGUE_PRODUCCION.md)

---

## 🐳 Docker (Producción)

### Despliegue Completo

```bash
# 1. Configurar variables de entorno
cp .env.example .env
nano .env  # Editar credenciales

# 2. Build y start de todos los servicios
docker-compose up -d --build

# 3. Ver logs en tiempo real
docker-compose logs -f

# 4. Verificar estado
docker-compose ps
```

### Acceder a la Aplicación

- **Frontend:** http://localhost (puerto 80)
- **Backend API:** http://localhost/api
- **PostgreSQL:** localhost:5432

### Servicios del Stack

```
┌─────────────────────────────────────────┐
│  Nginx Proxy (Puerto 80/443)            │
│  ├─ Frontend: /                         │
│  ├─ Backend API: /api                   │
│  └─ WebSocket: /socket.io               │
└─────────────────────────────────────────┘
            │               │
    ┌───────┴───────┐   ┌──┴────────┐
    │  Frontend     │   │  Backend  │
    │  Angular 18   │   │  Node.js  │
    │  + Nginx      │   │  + Socket │
    └───────────────┘   └─────┬─────┘
                              │
                        ┌─────┴────────┐
                        │  PostgreSQL  │
                        │  16-alpine   │
                        └──────────────┘
```

---

## 🔐 SSL con Let's Encrypt

### Paso 1: Instalar Certbot

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install certbot

# CentOS/RHEL
sudo yum install certbot

# macOS
brew install certbot
```

### Paso 2: Obtener Certificado SSL

```bash
# Detener nginx temporalmente
docker-compose stop nginx

# Obtener certificado (reemplazar tu-dominio.com)
sudo certbot certonly --standalone -d tu-dominio.com -d www.tu-dominio.com

# Certificados se guardan en:
# /etc/letsencrypt/live/tu-dominio.com/fullchain.pem
# /etc/letsencrypt/live/tu-dominio.com/privkey.pem
```

### Paso 3: Configurar Nginx para SSL

Editar `nginx/nginx.conf`:

```nginx
http {
    # ... configuración existente ...

    # Redirigir HTTP a HTTPS
    server {
        listen 80;
        server_name tu-dominio.com www.tu-dominio.com;
        
        # Permitir validación de Let's Encrypt
        location /.well-known/acme-challenge/ {
            root /var/www/certbot;
        }
        
        # Redirigir todo lo demás a HTTPS
        location / {
            return 301 https://$server_name$request_uri;
        }
    }

    # Servidor HTTPS
    server {
        listen 443 ssl http2;
        server_name tu-dominio.com www.tu-dominio.com;

        # Certificados SSL
        ssl_certificate /etc/letsencrypt/live/tu-dominio.com/fullchain.pem;
        ssl_certificate_key /etc/letsencrypt/live/tu-dominio.com/privkey.pem;

        # Configuración SSL moderna
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384';
        ssl_prefer_server_ciphers off;
        ssl_session_cache shared:SSL:10m;
        ssl_session_timeout 1d;
        ssl_stapling on;
        ssl_stapling_verify on;

        # HSTS (opcional pero recomendado)
        add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

        # Health check
        location /health {
            access_log off;
            return 200 "healthy\n";
            add_header Content-Type text/plain;
        }

        # API y WebSocket Backend
        location /api/ {
            proxy_pass http://backend:3000/;
            proxy_http_version 1.1;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_connect_timeout 60s;
            proxy_send_timeout 60s;
            proxy_read_timeout 60s;
        }

        # Socket.IO WebSocket
        location /socket.io/ {
            proxy_pass http://backend:3000/socket.io/;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_connect_timeout 7d;
            proxy_send_timeout 7d;
            proxy_read_timeout 7d;
        }

        # Frontend Angular
        location / {
            proxy_pass http://frontend:80/;
            proxy_http_version 1.1;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
        }

        # Security headers
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;
        add_header Referrer-Policy "no-referrer-when-downgrade" always;
    }
}
```

### Paso 4: Actualizar docker-compose.yml

```yaml
services:
  nginx:
    image: nginx:1.26-alpine
    container_name: sw1-nginx
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"  # Agregar puerto HTTPS
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - /etc/letsencrypt:/etc/letsencrypt:ro  # Certificados SSL
      - ./nginx/ssl:/etc/nginx/ssl:ro  # Certificados personalizados (opcional)
    depends_on:
      - backend
      - frontend
    networks:
      - sw1-network
```

### Paso 5: Reiniciar Servicios

```bash
# Rebuild y restart
docker-compose up -d --build nginx

# Verificar logs
docker-compose logs -f nginx

# Probar acceso HTTPS
curl -I https://tu-dominio.com
```

### Paso 6: Renovación Automática

```bash
# Configurar cron para renovación automática (cada 12 horas)
sudo crontab -e

# Agregar línea:
0 */12 * * * certbot renew --quiet --deploy-hook "docker-compose -f /ruta/a/tu/proyecto/docker-compose.yml restart nginx"
```

### Configurar Firewall

```bash
# UFW (Ubuntu)
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable

# Firewalld (CentOS/RHEL)
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --reload
```

---

## 💻 Stack Tecnológico

### Backend
- **Node.js 20** + TypeScript
- **Express 4.19** - Framework web
- **Socket.IO 4.7** - WebSockets tiempo real
- **PostgreSQL 16** - Base de datos relacional
- **Multer** - Upload de archivos (multimodal)
- **Anthropic Claude API** - IA para análisis y generación
- **AssemblyAI / OpenAI Whisper** - Transcripción de audio

### Frontend
- **Angular 18** - Framework (Standalone Components)
- **Signals API** - Estado reactivo
- **JointJS+ / Rappid** - Editor UML
- **Tailwind CSS** - Estilos modernos
- **Socket.IO Client** - WebSockets

### Infraestructura
- **Docker & Docker Compose** - Contenedores
- **Nginx** - Reverse proxy + SSL
- **Let's Encrypt** - Certificados SSL gratuitos

---

## 🏗️ Arquitectura

### Estructura del Proyecto

```
jk/
├── backend-p1sw1/              # API + WebSockets + IA
│   ├── controller/
│   │   ├── auth.controller.ts          # Login/registro
│   │   ├── chat-ia.controller.ts       # Chat IA (texto)
│   │   └── chat-ia-multimodal.controller.ts  # Multimodal (audio/imagen)
│   ├── routes/
│   │   └── router.ts                   # Rutas HTTP
│   ├── sockets/
│   │   └── socket.ts                   # Eventos WebSocket
│   ├── services/
│   │   └── transcription.service.ts    # Transcripción audio
│   ├── middleware/
│   │   └── upload.middleware.ts        # Upload de archivos
│   ├── database/
│   │   ├── schema.sql                  # Schema completo (UML 2.5)
│   │   ├── seed.sql                    # Datos de prueba
│   │   ├── drop-tables.sql             # Limpiar BD
│   │   └── README.md                   # Documentación de BD
│   └── index.ts                        # Entry point
│
├── official-sw1p1/             # Frontend Angular
│   └── src/app/
│       ├── auth/                       # Login/registro
│       ├── diagramador/                # Editor UML principal
│       │   ├── chat-ia/                # Chat IA integrado
│       │   └── services/
│       │       ├── kitchensink.service.ts   # JointJS + lógica UML
│       │       ├── websocket.service.ts     # WebSocket client
│       │       └── chat-ia.service.ts       # Chat IA + multimodal
│       ├── chat/                       # Chat general
│       └── chatsw1/                    # Salas de chat
│
├── nginx/
│   ├── nginx.conf              # Configuración proxy + SSL
│   └── ssl/                    # Certificados SSL (si no usas Let's Encrypt)
│
├── uploads/                    # Archivos subidos (audio/imágenes)
│   └── sala_*/
│
├── docker-compose.yml          # Orquestación de servicios
├── .env.example                # Template de variables
└── README.md                   # Este archivo
```

---

## ⚙️ Configuración

### Variables de Entorno (.env)

Crear archivo `.env` en la raíz del proyecto:

```env
# ============================================
# BASE DE DATOS
# ============================================
POSTGRES_DB=parcial1sw1
POSTGRES_USER=postgres
POSTGRES_PASSWORD=tu_password_seguro_aqui
POSTGRES_PORT=5432

DB_HOST=localhost  # En Docker: postgres
DB_PORT=5432
DB_NAME=parcial1sw1
DB_USER=postgres
DB_PASSWORD=tu_password_seguro_aqui

# ============================================
# BACKEND
# ============================================
PORT=3000
NODE_ENV=development  # production en producción

# CORS (ajustar según tu dominio)
CORS_ORIGIN=http://localhost:4200  # https://tu-dominio.com en producción

# ============================================
# IA - CLAUDE (Recomendado)
# ============================================
# Obtener en: https://console.anthropic.com
ANTHROPIC_API_KEY=sk-ant-api03-xxxxxxxxxxxxxxxxxxxxx
MODELO_IA=claude-sonnet-4.5

# Alternativa: OpenAI GPT
# OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxx
# MODELO_IA=gpt-4

# ============================================
# TRANSCRIPCIÓN DE AUDIO (Opcional)
# ============================================
# Seleccionar servicio preferido
TRANSCRIPTION_PROVIDER=assemblyai  # o 'openai', 'deepgram', 'google', 'whisper-local'

# AssemblyAI (Recomendado - Excelente calidad español)
# Obtener en: https://www.assemblyai.com
ASSEMBLYAI_API_KEY=xxxxxxxxxxxxxxxxxxxxxxxx

# OpenAI Whisper (Alternativa - Requiere OPENAI_API_KEY arriba)

# Deepgram (Muy rápido)
# Obtener en: https://deepgram.com
# DEEPGRAM_API_KEY=xxxxxxxxxxxxxxxxxxxxxxxx

# Google Cloud Speech-to-Text (60min gratis/mes)
# GOOGLE_CLOUD_KEY_PATH=/ruta/a/service-account.json

# Whisper Local (Sin costo, más lento, requiere instalación)
# pip install openai-whisper
```

### Servicios de Transcripción - Comparativa

| Servicio | Calidad | Precio/min | Velocidad | API Key Requerida |
|----------|---------|------------|-----------|-------------------|
| **AssemblyAI** ⭐ | ⭐⭐⭐⭐⭐ | $0.015 | Rápida | ✅ Sí |
| OpenAI Whisper | ⭐⭐⭐⭐ | $0.006 | Media | ✅ Sí |
| Deepgram | ⭐⭐⭐⭐ | $0.0043 | Muy rápida | ✅ Sí |
| Google Cloud | ⭐⭐⭐⭐ | Gratis 60min | Media | ✅ Sí |
| Whisper Local | ⭐⭐⭐ | Gratis | Lenta | ❌ No |

---

## 📡 API Reference

### HTTP Endpoints

#### Autenticación
```http
POST   /users/confirm-login              # Login
POST   /users                            # Registro
GET    /users/:email/salas               # Salas del usuario
```

#### Chat IA
```http
GET    /chat-ia/conversacion/sala/:id   # Conversación activa
POST   /chat-ia/conversacion             # Nueva conversación
POST   /chat-ia/mensaje                 # Mensaje texto + IA
POST   /chat-ia/mensaje-multimodal      # Mensaje multimodal (audio/imagen)
GET    /chat-ia/mensajes/:id             # Historial
POST   /chat-ia/generar-postman         # Generar colección Postman
GET    /chat-ia/mensaje/:id/attachments # Obtener attachments
GET    /chat-ia/attachment/:id/download # Descargar archivo
```

#### Salas
```http
POST   /salas                           # Crear sala
GET    /salas/:codigo                   # Info de sala
DELETE /salas/:id_sala                  # Eliminar sala (solo host)
```

### WebSocket Events

#### Cliente → Servidor
```javascript
socket.emit('entra-sala', { usuario, sala });
socket.emit('changed-diagrama', { sala, diagrama });
socket.emit('mensaje-general', { sala, usuario, mensaje });
socket.emit('mensaje-chat-ia', { sala, usuario, mensaje });
```

#### Servidor → Cliente
```javascript
socket.on('listen-changed-diagrama', (diagrama) => { ... });
socket.on('usuarios-activos', (usuarios) => { ... });
socket.on('nuevo-mensaje-general', (mensaje) => { ... });
socket.on('nuevo-mensaje-chat-ia', (mensaje) => { ... });
socket.on('modificacion-diagrama-ia', (acciones) => { ... });
```

### Ejemplo Multimodal (cURL)

```bash
curl -X POST http://localhost:3000/chat-ia/mensaje-multimodal \
  -F "id_sala=1" \
  -F "id_usuario=1" \
  -F "contenido=Convierte este diagrama a digital" \
  -F "diagrama_actual={\"cells\":[]}" \
  -F "audios=@grabacion.webm" \
  -F "imagenes=@diagrama_papel.jpg"
```

---

## 💾 Base de Datos

### Estructura de Tablas

**Core del Sistema:**
```
usuario (id_usuario, email, password, fecha_creacion)
  ↓
sala (id_sala, nombre_sala, host_sala, informacion, fecha_creacion)
  ↓
asistencia (id_usuario, id_sala, fecha_hora)
```

**Chat con IA:**
```
sala → config_ia (modelo, temperatura, system_prompt)
     ↓
     conversacion_ia (titulo, contexto_inicial, activa)
       ↓
       mensaje_chat_ia (tipo_mensaje, contenido, metadata)
         ↓
         mensaje_attachment (tipo: audio/imagen, transcripcion, analisis_ia)
         snapshot_diagrama (diagrama_json, descripcion)
```

**UML 2.5 (Persistencia de Métodos):**
```
sala → clase_uml (cell_id, nombre_clase, x_position, y_position)
         ↓
         atributo_clase (nombre, tipo, visibility, es_static)
         metodo_clase (nombre, tipo_retorno, visibility, es_abstract)
           ↓
           parametro_metodo (nombre, tipo, orden_parametro)
```

### Inicializar Base de Datos

```bash
# Con Docker (automático en primer inicio)
docker-compose up -d postgres

# Ejecutar manualmente si es necesario
docker-compose exec postgres psql -U postgres -d parcial1sw1 -f /docker-entrypoint-initdb.d/01-schema.sql
docker-compose exec postgres psql -U postgres -d parcial1sw1 -f /docker-entrypoint-initdb.d/02-seed.sql

# Sin Docker
psql -U postgres -d parcial1sw1 -f backend-p1sw1/database/schema.sql
psql -U postgres -d parcial1sw1 -f backend-p1sw1/database/seed.sql
```

### Limpiar Base de Datos

```bash
# Eliminar todas las tablas
docker-compose exec postgres psql -U postgres -d parcial1sw1 -f /docker-entrypoint-initdb.d/drop-tables.sql

# Sin Docker
psql -U postgres -d parcial1sw1 -f backend-p1sw1/database/drop-tables.sql
```

Ver más detalles en [backend-p1sw1/database/README.md](backend-p1sw1/database/README.md)

---

## 🎨 Funcionalidades

### Editor UML Colaborativo
- ✅ Clases con atributos y métodos
- ✅ Relaciones: Herencia, Composición, Agregación, Asociación, Dependencia
- ✅ Drag & drop con grid inteligente 3x∞
- ✅ Sincronización en tiempo real entre usuarios
- ✅ Clear sincronizado (limpia diagrama para todos)
- ✅ Persistencia automática en base de datos

### Chat con IA Multimodal
- 📝 **Texto**: Instrucciones escritas
- 🎤 **Audio**: Grabación o archivo de audio con transcripción automática
- 📸 **Imágenes**: Fotos de diagramas en papel, bocetos, referencias visuales
- 🤖 **Análisis inteligente**: Claude Vision extrae clases, atributos, relaciones
- 🔄 **Modificaciones automáticas**: IA genera JSON con acciones de modificación
- 💬 **Historial persistente**: Todas las conversaciones guardadas en BD

#### Casos de Uso Multimodal

**📸 Foto → Diagrama Digital:**
```
Usuario: "Convierte este diagrama que dibujé en papel"
[Adjunta foto del cuaderno]

→ Claude Vision analiza la imagen
→ Extrae: 3 clases (Usuario, Producto, Pedido)
→ Detecta: atributos, métodos, relaciones
→ Genera: JSON con acciones de creación
→ Diagrama aparece automáticamente en el editor
```

**🎤 Audio + Contexto Visual:**
```
Usuario: [Grabación] "Agrega los métodos login y logout 
         en la clase Usuario, y conéctala con Pedido"
[Adjunta boceto con flechas]

→ AssemblyAI transcribe el audio
→ Claude Vision analiza el boceto
→ IA combina ambos contextos
→ Aplica modificaciones precisas al diagrama
```

### Exportación y Generación de Código
- 📤 **XML (XMI 2.5)**: Compatible con Enterprise Architect
- 📄 **JSON**: Formato JointJS para importar/exportar
- ☕ **Spring Boot**: Proyecto completo con:
  - Entidades JPA con relaciones
  - Repositories
  - Services
  - Controllers REST
  - DTOs
  - Configuración Spring
- 📮 **Postman Collection**: API REST generada automáticamente por IA

### Gestión de Salas
- ➕ Crear salas nuevas
- 🔗 Unirse con código de 6 caracteres
- 👥 Ver usuarios activos en tiempo real
- 🏷️ Badge de "Host" para el creador
- 🗑️ Eliminar salas (solo el host)
- 📊 Ver total de participantes
- 📅 Fecha de creación

---

## 🔧 Troubleshooting

### Backend no inicia

```bash
# Verificar PostgreSQL
docker ps | grep postgres

# Ver logs
docker-compose logs -f postgres

# Verificar .env
cat .env | grep DB_

# Reiniciar servicios
docker-compose restart
```

### Error de conexión a base de datos

```bash
# Conectar manualmente
docker-compose exec postgres psql -U postgres -d parcial1sw1

# Ver tablas
\dt

# Ejecutar schema si faltan tablas
docker-compose exec postgres psql -U postgres -d parcial1sw1 -f /docker-entrypoint-initdb.d/01-schema.sql
```

### IA no responde

```bash
# Verificar API key
echo $ANTHROPIC_API_KEY

# Ver logs del backend (buscar errores de IA)
docker-compose logs -f backend | grep -i "anthropic\|claude\|error"

# Modo simulación (si no hay key válida)
# Backend responderá con mensaje de ejemplo
```

### Transcripción de audio falla

```bash
# Verificar provider configurado
echo $TRANSCRIPTION_PROVIDER

# Verificar API key del servicio activo
echo $ASSEMBLYAI_API_KEY

# Ver logs de transcripción
docker-compose logs -f backend | grep "🎤"

# Si usas Whisper local, instalarlo:
pip install openai-whisper
```

### WebSocket no sincroniza

```bash
# Verificar CORS
docker-compose exec backend env | grep CORS

# Ver conexiones WebSocket en navegador
# DevTools → Network → WS → Ver mensajes

# Ver logs de Socket.IO
docker-compose logs -f backend | grep socket

# Reiniciar servicios
docker-compose restart backend
```

### Imágenes no se analizan

- ✅ Verificar que tienes `ANTHROPIC_API_KEY` configurado
- ✅ Claude Sonnet 4.5 requiere Vision habilitado
- ✅ Imágenes válidas: JPG, PNG, WEBP
- ✅ Tamaño máximo: 50MB por archivo
- ✅ Ver logs: `docker-compose logs -f backend | grep "📷"`

### Error de permisos en uploads/

```bash
# Dar permisos al directorio
chmod -R 777 uploads/

# O crear estructura
mkdir -p uploads/sala_general
chmod -R 777 uploads/
```

---

## 🚀 Despliegue en Producción

### 1. Preparar Servidor (VPS/Cloud)

```bash
# Actualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Instalar Docker Compose
sudo apt install docker-compose-plugin

# Configurar firewall
sudo ufw allow 22/tcp  # SSH
sudo ufw allow 80/tcp  # HTTP
sudo ufw allow 443/tcp  # HTTPS
sudo ufw enable
```

### 2. Clonar y Configurar

```bash
# Clonar proyecto
git clone <repo-url>
cd jk

# Configurar variables de producción
cp .env.example .env
nano .env
```

**Variables importantes para producción:**

```env
NODE_ENV=production
CORS_ORIGIN=https://tu-dominio.com

POSTGRES_PASSWORD=password_muy_seguro_generado_con_openssl

ANTHROPIC_API_KEY=sk-ant-xxxxx
ASSEMBLYAI_API_KEY=xxxxx

# Configurar URLs correctas
DB_HOST=postgres
BACKEND_URL=https://tu-dominio.com/api
```

### 3. SSL con Let's Encrypt (Ver sección anterior)

### 4. Iniciar Servicios

```bash
# Build y start en modo producción
docker-compose up -d --build

# Ver logs
docker-compose logs -f

# Verificar estado
docker-compose ps
```

### 5. Monitoreo y Mantenimiento

```bash
# Ver estado de health checks
docker inspect sw1-backend --format='{{.State.Health.Status}}'

# Uso de recursos
docker stats

# Logs con límite
docker-compose logs --tail=100 backend

# Backup automático de BD (agregar a cron)
0 2 * * * docker-compose exec postgres pg_dump -U postgres parcial1sw1 > /backups/db_$(date +\%Y\%m\%d).sql
```

### 6. Renovación SSL Automática

```bash
# Editar crontab
sudo crontab -e

# Agregar línea (renovar cada 12 horas)
0 */12 * * * certbot renew --quiet --deploy-hook "docker-compose -f /ruta/proyecto/docker-compose.yml restart nginx"
```

### 7. Actualizar Aplicación

```bash
# Pull cambios
git pull origin main

# Rebuild y restart
docker-compose up -d --build

# Ver logs de actualización
docker-compose logs -f
```

---

## 📚 Comandos Docker Útiles

### Gestión de Servicios

```bash
# Iniciar todos
docker-compose up -d

# Solo PostgreSQL
docker-compose up -d postgres

# Backend + Frontend
docker-compose up -d backend frontend

# Detener
docker-compose stop

# Detener y eliminar contenedores
docker-compose down

# Limpiar todo (incluye volúmenes)
docker-compose down -v
```

### Logs y Debugging

```bash
# Ver logs en tiempo real
docker-compose logs -f

# Logs de un servicio específico
docker-compose logs -f backend

# Últimas 100 líneas
docker-compose logs --tail=100 backend

# Ejecutar comandos dentro del contenedor
docker-compose exec backend sh
docker-compose exec postgres psql -U postgres -d parcial1sw1
```

### Base de Datos

```bash
# Backup
docker-compose exec postgres pg_dump -U postgres parcial1sw1 > backup.sql

# Restaurar
cat backup.sql | docker-compose exec -T postgres psql -U postgres -d parcial1sw1

# Conectar a PostgreSQL
docker-compose exec postgres psql -U postgres -d parcial1sw1

# Ver tablas
docker-compose exec postgres psql -U postgres -d parcial1sw1 -c "\dt"
```

---

## � Checklist de Verificación - Chat Multimodal

### Pre-Instalación

- [ ] Node.js 18+ instalado
- [ ] Docker y Docker Compose instalados
- [ ] PostgreSQL corriendo (docker-compose up -d)
- [ ] Puerto 3000 libre (backend)
- [ ] Puerto 4200 libre (frontend)

### Backend - Archivos y Dependencias

**Archivos Creados:**
- [ ] `backend-p1sw1/database/multimodal-schema.sql`
- [ ] `backend-p1sw1/services/transcription.service.ts`
- [ ] `backend-p1sw1/middleware/upload.middleware.ts`
- [ ] `backend-p1sw1/controller/chat-ia-multimodal.controller.ts`

**Dependencias NPM:**
```bash
npm install multer @types/multer form-data axios
npm install @google-cloud/speech sharp  # Opcional
```

**Base de Datos:**
- [ ] Schema `multimodal-schema.sql` aplicado
- [ ] Tabla `mensaje_attachment` creada
- [ ] Columnas `tiene_attachments` y `metadata_multimodal` agregadas

**Configuración (.env):**
- [ ] `ANTHROPIC_API_KEY` configurada (requerido)
- [ ] Al menos una API key de transcripción:
  - [ ] `ASSEMBLYAI_API_KEY` (recomendado)
  - [ ] O `OPENAI_API_KEY`
  - [ ] O `DEEPGRAM_API_KEY`
  - [ ] O `GOOGLE_CLOUD_KEY_PATH`
  - [ ] O Whisper local instalado

**Rutas:**
- [ ] `/chat-ia/mensaje-multimodal` agregada en `routes/router.ts`
- [ ] `/chat-ia/mensaje/:id/attachments` agregada
- [ ] `/chat-ia/attachment/:id/download` agregada

### Frontend - Componentes y Servicios

**Archivos Creados:**
- [ ] `src/app/diagramador/chat-ia/audio-recorder.service.ts`
- [ ] `src/app/diagramador/chat-ia/chat-attachments.component.ts`

**Servicios Actualizados:**
- [ ] `chat-ia.service.ts` tiene `enviarMensajeMultimodal()`
- [ ] `chat-ia.service.ts` tiene `obtenerAttachments()`
- [ ] `chat-ia.service.ts` tiene `getAttachmentDownloadUrl()`

### Testing

**Backend:**
```bash
# Test básico
curl http://localhost:3000/health

# Test multimodal
curl -X POST http://localhost:3000/chat-ia/mensaje-multimodal \
  -F "id_sala=1" -F "id_usuario=1" -F "contenido=Prueba" \
  -F "diagrama_actual={}"
```

**Frontend:**
- [ ] Login funciona
- [ ] Chat IA se abre
- [ ] Botón 🎤 micrófono visible
- [ ] Grabación funciona correctamente
- [ ] Preview de archivos aparece

**Base de Datos:**
```sql
-- Verificar tabla
\d mensaje_attachment

-- Ver mensajes con attachments
SELECT id_mensaje, contenido, tiene_attachments 
FROM mensaje_chat_ia 
WHERE tiene_attachments = TRUE;

-- Ver attachments
SELECT ma.tipo, ma.archivo_nombre, ma.transcripcion
FROM mensaje_attachment ma
ORDER BY ma.created_at DESC
LIMIT 10;
```

---

## 🎤📸 Guía de Uso - Chat Multimodal

### Integración en el Componente Chat

**Paso 1: Importar Componente de Attachments**

```typescript
import { ChatAttachmentsComponent } from './chat-attachments.component';

@Component({
  selector: 'app-chat-ia',
  standalone: true,
  imports: [CommonModule, FormsModule, ChatAttachmentsComponent],
  // ...
})
export class ChatIaComponent {
  attachments = signal<AttachmentData>({ audios: [], imagenes: [] });
  
  async enviarMensaje(): Promise<void> {
    const contenido = this.mensajeInput();
    const attachmentsData = this.attachments();
    
    if (attachmentsData.audios.length > 0 || attachmentsData.imagenes.length > 0) {
      // MULTIMODAL
      const respuesta = await this.chatService.enviarMensajeMultimodal(
        conversacion?.id_conversacion!,
        this.idSala,
        usuarioId,
        contenido,
        diagramaActual,
        attachmentsData.audios,
        attachmentsData.imagenes
      ).toPromise();
      
      this.mensajeInput.set('');
      this.attachmentsRef?.clearAll();
    } else {
      // Texto simple
    }
  }
}
```

**Paso 2: Template**

```html
<div class="chat-input-container">
  <textarea
    [(ngModel)]="mensajeInput"
    placeholder="Escribe un mensaje o adjunta archivos..."
  ></textarea>
  
  <app-chat-attachments 
    #attachmentsComponent
    (attachmentsChange)="onAttachmentsChange($event)"
  ></app-chat-attachments>
  
  <button (click)="enviarMensaje()">Enviar</button>
</div>
```

### Flujo Completo de Uso

**Ejemplo 1: Grabar Audio + Enviar**

1. Click botón 🎤 micrófono
2. Habla: "Agrega una clase Usuario con email y password"
3. Click 🎤 nuevamente para detener
4. Audio aparece en preview
5. Click "Enviar"

Backend:
- Recibe audio (webm)
- AssemblyAI transcribe el audio
- Claude procesa con contexto del diagrama
- Genera acciones JSON
- Emite modificación por WebSocket

Frontend:
- Recibe modificación
- Aplica cambios al diagrama
- Usuario ve la clase creada automáticamente

**Ejemplo 2: Foto de Diagrama en Papel**

1. Click botón 📷 imagen
2. Selecciona foto de cuaderno con diagrama
3. Escribe: "Convierte este diagrama a digital"
4. Click "Enviar"

Backend:
- Recibe imagen (JPG)
- Claude Vision analiza y detecta clases, atributos, relaciones
- Genera JSON con acciones de creación
- Emite modificación

Frontend:
- Diagrama completo aparece en el canvas

**Ejemplo 3: Audio + Imagen Combinados**

1. Sube imagen de boceto
2. Graba audio: "Como ves en la imagen, necesito conectar Usuario con Pedido"
3. Click "Enviar"

Backend:
- Transcribe audio + Analiza imagen
- Claude recibe AMBOS contextos
- Aplica modificación precisa

### Validaciones y Limitaciones

```typescript
// Límites recomendados
if (imagenes.length > 10) {
  alert('Máximo 10 imágenes por mensaje');
  return;
}

if (audios.length > 5) {
  alert('Máximo 5 audios por mensaje');
  return;
}

const totalSize = [...audios, ...imagenes].reduce((sum, f) => sum + f.size, 0);
if (totalSize > 100 * 1024 * 1024) {  // 100MB
  alert('El tamaño total excede 100MB');
  return;
}
```

---

## 🚀 Guía de Implementación - Editor UML 2.5

### Pasos para Activar la Funcionalidad

**1️⃣ Actualizar Base de Datos**

```bash
# Conectar a PostgreSQL
psql -U postgres -d nombre_de_tu_base_de_datos

# Ejecutar el schema de UML 2.5
\i backend-p1sw1/database/uml-metodos-schema.sql

# Verificar tablas creadas
\dt
```

Tablas esperadas:
- ✅ `clase_uml`
- ✅ `atributo_clase`
- ✅ `metodo_clase`
- ✅ `parametro_metodo`

**2️⃣ Configurar Backend**

```bash
cd backend-p1sw1
npm install
npm run dev
```

Nuevos endpoints:
- `POST /uml/clase` - Guardar clase
- `POST /uml/clases` - Guardar múltiples clases
- `GET /uml/clases/:id_sala` - Obtener clases
- `DELETE /uml/clase/:id_sala/:cell_id` - Eliminar clase

**3️⃣ Configurar Frontend**

```bash
cd official-sw1p1
npm install
ng serve
```

**4️⃣ Probar la Funcionalidad**

1. Ir a `http://localhost:4200`
2. Crear o unirse a una sala
3. Arrastrar una clase UML al canvas
4. **Hacer clic en la clase** → Se abre el editor UML 2.5
5. Agregar atributos con visibilidad (-, +, #, ~)
6. Agregar métodos con parámetros

**Ejemplo de clase renderizada:**

```
Usuario
──────────────────────────────
- nombre : String = "Sin nombre"
- email : String
+ id : Number
───────────────────────────────
+ validarEmail(email : String) : Boolean
+ getNombre() : String
- calcularEdad(fechaNacimiento : Date) : Number
```

### Verificar Persistencia

```sql
-- Ver todas las clases guardadas
SELECT * FROM clase_uml;

-- Ver atributos de una clase
SELECT * FROM atributo_clase WHERE id_clase = 1;

-- Ver métodos con parámetros
SELECT 
  m.nombre AS metodo,
  m.tipo_retorno,
  p.nombre AS parametro,
  p.tipo AS param_tipo
FROM metodo_clase m
LEFT JOIN parametro_metodo p ON m.id_metodo = p.id_metodo
WHERE m.id_clase = 1;
```

### Solución de Problemas

**El editor no se abre al hacer clic:**
```typescript
// Verificar en diagramador.component.ts ngOnInit()
this.rappid.paper.on('cell:pointerclick', (cellView: any) => {
  console.log('Clic detectado:', cellView.model.get('type'));
});
```

**Error 404 en APIs:**
```bash
# Verificar rutas en backend
curl http://localhost:3000/uml/clases/1
```

**Los cambios no se sincronizan:**
```typescript
// Verificar en actualizarTextoClase()
this.diagramadorService.wsService.emit('modificar-diagrama', {
  sala: this.nombreSala,
  diagrama: jsonDiagrama
});
```

---

## 📦 Instalación de Dependencias Multimodales

### Backend (Node.js + TypeScript)

```bash
cd backend-p1sw1

# Multer - Manejo de uploads
npm install multer @types/multer

# Form-Data - Enviar archivos a APIs
npm install form-data

# Axios
npm install axios

# (Opcional) Google Cloud Speech
npm install @google-cloud/speech

# (Opcional) Sharp - Procesamiento de imágenes
npm install sharp
```

### Servicios de Transcripción

**OpenAI Whisper:**
- Solo necesitas `OPENAI_API_KEY` en `.env`
- Costo: $0.006/min

**AssemblyAI (Recomendado):**
- Solo necesitas `ASSEMBLYAI_API_KEY` en `.env`
- Costo: $0.015/min
- Mejor para español

**Deepgram:**
- Solo necesitas `DEEPGRAM_API_KEY` en `.env`
- Costo: $0.0043/min
- Más rápido

**Google Cloud Speech-to-Text:**
```bash
npm install @google-cloud/speech
# Configurar GOOGLE_CLOUD_KEY_PATH en .env
# 60 minutos gratis/mes
```

**Whisper Local (Sin API, gratis):**
```bash
# Opción Python
pip install openai-whisper

# Requiere: ffmpeg, Python 3.8+
```

### Configuración .env

```env
# Base de datos
DB_HOST=localhost
DB_PORT=5432
DB_NAME=parcial1sw1
DB_USER=postgres
DB_PASSWORD=your_password

# IA Principal (obligatorio)
ANTHROPIC_API_KEY=sk-ant-xxxxx

# Transcripción (elige UNO)
ASSEMBLYAI_API_KEY=xxxxx           # Recomendado
# O
OPENAI_API_KEY=sk-xxxxx
# O
DEEPGRAM_API_KEY=xxxxx
# O
GOOGLE_CLOUD_KEY_PATH=/path/to/service-account.json

# Especificar provider
TRANSCRIPTION_PROVIDER=assemblyai
```

### Costos Estimados

| Servicio | Transcripción | Análisis IA | Total por mensaje |
|----------|---------------|-------------|-------------------|
| AssemblyAI + Claude | $0.015 | $0.003 | **$0.018** |
| Whisper + Claude | $0.006 | $0.003 | **$0.009** |
| Deepgram + Claude | $0.004 | $0.003 | **$0.007** |
| Whisper Local + Claude | $0 | $0.003 | **$0.003** |

**1000 mensajes con audio+imagen = $3-18 USD**

---

## 📋 Historial de Cambios Docker

### Consolidación de Base de Datos (Enero 2026)

**Archivos Actuales:**
- ✅ `schema.sql` - Schema unificado (12 tablas)
- ✅ `seed.sql` - Datos de prueba completos
- ✅ `drop-tables.sql` - Limpieza completa
- ✅ `database/README.md` - Documentación

**Beneficios:**
- ✨ Instalación más simple (2 archivos en vez de 4)
- ✨ Menos errores por orden de ejecución
- ✨ Mantenimiento más fácil

**Docker Compose - Cambios:**

```yaml
volumes:
  - ./backend-p1sw1/database/schema.sql:/docker-entrypoint-initdb.d/01-schema.sql
  - ./backend-p1sw1/database/seed.sql:/docker-entrypoint-initdb.d/02-seed.sql
```

**Variables de Entorno Multimodal:**

```yaml
environment:
  TRANSCRIPTION_PROVIDER: ${TRANSCRIPTION_PROVIDER:-assemblyai}
  ASSEMBLYAI_API_KEY: ${ASSEMBLYAI_API_KEY:-}
  DEEPGRAM_API_KEY: ${DEEPGRAM_API_KEY:-}
  GOOGLE_APPLICATION_CREDENTIALS: ${GOOGLE_APPLICATION_CREDENTIALS:-}
```

**Nuevo Volumen para Uploads:**

```yaml
volumes:
  postgres_data:
    driver: local
  backend_uploads:  # ← NUEVO
    driver: local
```

### Instrucciones de Migración

**Para Instalaciones Nuevas:**

```bash
# 1. Configurar entorno
cp .env.example .env
nano .env  # Agregar API keys

# 2. Levantar servicios
docker-compose up -d --build

# 3. Verificar
docker-compose ps
```

**Para Instalaciones Existentes:**

```bash
# 1. Backup
docker-compose exec postgres pg_dump -U postgres parcial1sw1 > backup.sql

# 2. Actualizar
git pull origin main

# 3. Rebuild
docker-compose up -d --build
```

### Verificación Post-Migración

```bash
# Verificar tablas
docker-compose exec postgres psql -U postgres -d parcial1sw1 -c "\dt"

# Esperado: 12 tablas
# usuario, sala, asistencia, conversacion_ia, mensaje_chat_ia, 
# mensaje_attachment, snapshot_diagrama, config_ia,
# clase_uml, atributo_clase, metodo_clase, parametro_metodo

# Verificar datos
docker-compose exec postgres psql -U postgres -d parcial1sw1 -c \
  "SELECT COUNT(*) FROM usuario;"

# Verificar volúmenes
docker volume ls | grep sw1
# Esperado: sw1-postgres-data, sw1-backend-uploads
```

---

## 🎯 Integración del Editor UML 2.5

### Componentes Modificados

**Frontend (Angular):**

1. **diagramador.component.ts**
   - Listener `cell:pointerclick` para detectar clics
   - Método `onCellSelected()` para abrir editor
   - Método `actualizarTextoClase()` para persistir en BD
   - Parseo de atributos y métodos desde texto UML

2. **diagramador.component.html**
   - Condicional `@if (claseSeleccionada)` para mostrar editor
   - Componente `<app-uml-class-editor>` integrado

3. **clase-uml.service.ts** *(NUEVO)*
   - Servicio para APIs REST
   - Métodos: `guardarClase()`, `obtenerClases()`, `eliminarClase()`

**Backend (Node.js):**

1. **clase-uml.controller.ts** *(NUEVO)*
   - 4 endpoints: POST /uml/clase, GET /uml/clases/:id_sala, etc.
   - Transacciones atómicas con BEGIN/COMMIT/ROLLBACK
   - Soporte para parámetros de métodos

2. **router.ts**
   - Rutas `/uml/*` agregadas

3. **uml-metodos-schema.sql** *(NUEVO)*
   - 4 tablas: clase_uml, atributo_clase, metodo_clase, parametro_metodo
   - Índices para rendimiento
   - Triggers para actualización automática

### Estructura de Base de Datos

```
sala
 ├── clase_uml (cell_id, nombre, posición)
      ├── atributo_clase (nombre, tipo, visibility, valor_default)
      └── metodo_clase (nombre, tipo_retorno, visibility)
           └── parametro_metodo (nombre, tipo, orden)
```

### Flujo de Funcionamiento

1. **Usuario hace clic en clase** → Evento detectado → Editor se abre
2. **Usuario edita atributos/métodos** → Evento `claseEditada` emitido
3. **Renderizado UML 2.5** → Texto formateado con separadores
4. **Persistencia Backend** → INSERT en PostgreSQL (transaccional)
5. **Sincronización WebSocket** → Otros usuarios ven cambios en tiempo real

---

## 📋 Resumen Técnico de Implementación

### Funcionalidades Multimodales

**🎤 Audio:**
- Grabación desde navegador (MediaRecorder API)
- Carga de archivos: MP3, WAV, OGG, WEBM, M4A
- 5 opciones de transcripción: AssemblyAI, Whisper, Deepgram, Google, Local

**📸 Imágenes:**
- Carga múltiple: JPG, PNG, GIF, WEBP (máx 50MB)
- Análisis con Claude Vision
- OCR implícito para texto manuscrito
- Detección automática de clases, atributos, relaciones

**🔄 Flujo:**
```
Usuario → [Texto + Audio + Imágenes]
   ↓
Transcripción (Whisper/AssemblyAI)
   ↓
Análisis Visual (Claude Vision)
   ↓
Procesamiento IA (contexto completo)
   ↓
Generación de acciones JSON
   ↓
WebSocket → Sincronización
   ↓
Aplicación automática al diagrama
```

### Archivos del Sistema

**Backend - Nuevos:**
- `database/multimodal-schema.sql`
- `services/transcription.service.ts`
- `middleware/upload.middleware.ts`
- `controller/chat-ia-multimodal.controller.ts`

**Frontend - Nuevos:**
- `chat-ia/audio-recorder.service.ts`
- `chat-ia/chat-attachments.component.ts`

**Backend - Modificados:**
- `routes/router.ts` (3 rutas nuevas)
- `chat-ia.service.ts` (métodos multimodales)

### APIs y Dependencias

| API | Uso | Costo |
|-----|-----|-------|
| Anthropic Claude | Análisis texto + Vision | $3/1M tokens |
| AssemblyAI | Transcripción | $0.015/min |
| OpenAI Whisper | Transcripción | $0.006/min |
| Deepgram | Transcripción | $0.0043/min |
| Google Speech | Transcripción | 60min gratis/mes |

**NPM Backend:**
```json
{
  "multer": "^1.4.5-lts.1",
  "form-data": "^4.0.0",
  "axios": "^1.6.0",
  "@google-cloud/speech": "^6.0.0",
  "sharp": "^0.33.0"
}
```

### Métricas de Rendimiento

| Operación | Tiempo Aprox |
|-----------|--------------|
| Grabar 1 min audio | 1 min (tiempo real) |
| Transcribir (Whisper) | 5-10s |
| Transcribir (AssemblyAI) | 8-15s |
| Transcribir (Deepgram) | 2-5s |
| Analizar imagen (Claude) | 3-8s |
| Procesamiento total | 10-20s |

### Casos de Uso

1. **Convertir diagrama en papel a digital** → Foto + Claude Vision
2. **Instrucciones por voz** → Audio + Whisper + Claude
3. **Boceto + explicación** → Imagen + Audio → Contexto completo
4. **Análisis de diagramas externos** → Screenshot → Recreación

### Consideraciones de Producción

**Seguridad:**
- ✅ Validación de tipos MIME
- ✅ Límite 50MB/archivo, 10 archivos máx
- ⚠️ TODO: Sanitización de nombres
- ⚠️ TODO: Rate limiting

**Escalabilidad:**
- ⚠️ TODO: Mover a S3/Cloud Storage
- ⚠️ TODO: CDN para archivos estáticos
- ⚠️ TODO: Métricas de costos por sala

---

## 📖 Documentación Adicional

### Configuración y Despliegue
- 🌐 [CONFIGURACION_URLS.md](CONFIGURACION_URLS.md) - **IMPORTANTE:** Configuración de URLs, DNS y proxy reverso
- 🚀 [DESPLIEGUE_PRODUCCION.md](DESPLIEGUE_PRODUCCION.md) - Guía completa de despliegue con SSL en `uml.jkhoster.com`

### Base de Datos y Código
- 💾 [backend-p1sw1/database/README.md](backend-p1sw1/database/README.md) - Documentación detallada de base de datos
- 💻 [EJEMPLO_INTEGRACION.ts](EJEMPLO_INTEGRACION.ts) - Ejemplos de código para integración

---

## 🤝 Contribuir

Este proyecto fue desarrollado para fines académicos. Si deseas contribuir:

1. Fork el proyecto
2. Crea una rama: `git checkout -b feature/nueva-funcionalidad`
3. Commit cambios: `git commit -m 'Agregar nueva funcionalidad'`
4. Push a la rama: `git push origin feature/nueva-funcionalidad`
5. Abre un Pull Request

---

## 📄 Licencia

MIT License - Ver [LICENSE](LICENSE) para más detalles.

---

## 👨‍💻 Autor

**Jkarlos**  
Universidad Autónoma Gabriel René Moreno (UAGRM)  
Facultad de Ciencias Exactas y Tecnología (FICCT)  
Ingeniería de Sistemas  
Ingeniería de Software 1

---

## 🌟 Agradecimientos

- **JointJS/Rappid** por el excelente editor de diagramas
- **Anthropic** por Claude Sonnet 4.5 con Vision
- **AssemblyAI** por el servicio de transcripción
- **Comunidad Open Source** por todas las librerías utilizadas

---

**🎓 Desarrollado como proyecto final de Ingeniería de Software 1 - 2026**
