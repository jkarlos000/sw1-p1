# 🐳 Docker - Sistema UML Colaborativo

Guía completa para desplegar el sistema con Docker y Docker Compose.

## 📋 Requisitos

- Docker Engine 24.0+
- Docker Compose 2.0+
- 2GB RAM mínimo
- Puertos libres: 80, 443, 3000, 5432

## 🚀 Despliegue Rápido

### 1. Configurar Variables de Entorno

```bash
# Copiar template
cp .env.example .env

# Editar configuración
nano .env
```

**Variables principales:**
```env
# Base de datos
POSTGRES_PASSWORD=tu_password_seguro

# IA (Claude para análisis de diagramas)
ANTHROPIC_API_KEY=sk-ant-xxxxx  # Requerido para IA
MODELO_IA=claude-sonnet-4.5

# Transcripción Multimodal (opcional)
TRANSCRIPTION_PROVIDER=assemblyai
ASSEMBLYAI_API_KEY=your_key  # Para audio

# URLs
BACKEND_URL=http://backend:3000
CORS_ORIGIN=http://localhost
```

### 2. Iniciar Todo el Stack

```bash
# Build y start en una línea
docker-compose up -d --build

# Ver logs en tiempo real
docker-compose logs -f

# Verificar estado
docker-compose ps
```

### 3. Acceder a la Aplicación

- **Frontend:** http://localhost
- **Backend API:** http://localhost:3000
- **PostgreSQL:** localhost:5432

## 📦 Arquitectura de Servicios

### Stack Completo

```
┌─────────────────────────────────────────┐
│  Nginx Proxy (Puerto 80/443)            │
│  ├─ Frontend: http://frontend           │
│  └─ Backend API: http://backend:3000    │
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

### Servicios Individuales

| Servicio | Imagen | Puerto | Health Check |
|----------|--------|--------|--------------|
| **postgres** | postgres:16-alpine | 5432 | pg_isready |
| **backend** | node:20-alpine | 3000 | /health |
| **frontend** | nginx:1.26-alpine | 80 | / |
| **nginx** | nginx:1.26-alpine | 80, 443 | /health |

## 🔧 Comandos Útiles

### Gestión de Servicios

```bash

### Detener Servicios
```bash
# Detener sin eliminar
docker-compose stop

# Detener y eliminar contenedores
docker-compose down

# Detener, eliminar y limpiar volúmenes
docker-compose down -v
```

# Iniciar todos
docker-compose up -d

# Solo base de datos
docker-compose up -d postgres

# Rebuild específico
docker-compose up -d --build backend

# Ver estado
docker-compose ps

# Ver logs
docker-compose logs -f
docker-compose logs -f backend  # Solo backend
```

### Acceso a Contenedores

```bash
# Shell en backend
docker-compose exec backend sh

# Shell en PostgreSQL
docker-compose exec postgres psql -U postgres -d parcial1sw1

# Ver tablas
docker-compose exec postgres psql -U postgres -d parcial1sw1 -c "\dt"

# Ejecutar SQL
docker-compose exec postgres psql -U postgres -d parcial1sw1 -c "SELECT * FROM usuario;"
```

### Gestión de Datos

```bash
# Backup de base de datos
docker-compose exec postgres pg_dump -U postgres parcial1sw1 > backup_$(date +%Y%m%d).sql

# Restaurar backup
cat backup_20260115.sql | docker-compose exec -T postgres psql -U postgres -d parcial1sw1

# Re-ejecutar schemas manualmente (si es necesario)
docker-compose exec postgres psql -U postgres -d parcial1sw1 -f /docker-entrypoint-initdb.d/01-schema.sql
docker-compose exec postgres psql -U postgres -d parcial1sw1 -f /docker-entrypoint-initdb.d/02-seed.sql

# Limpiar datos
docker-compose exec postgres psql -U postgres -d parcial1sw1 -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
```

## 🔐 Seguridad en Producción

### 1. Variables de Entorno Seguras

```env
# Generar password seguro
POSTGRES_PASSWORD=$(openssl rand -base64 32)

# CORS restrictivo
CORS_ORIGIN=https://tudominio.com

# Modo producción
NODE_ENV=production
```

### 2. Firewall

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

### 3. HTTPS con Let's Encrypt

```bash
# Instalar certbot
sudo apt install certbot

# Obtener certificado
sudo certbot certonly --standalone -d tudominio.com

# Actualizar nginx/nginx.conf con rutas SSL
# /etc/letsencrypt/live/tudominio.com/fullchain.pem
# /etc/letsencrypt/live/tudominio.com/privkey.pem
```

## 📊 Monitoreo

### Health Checks

```bash
# Backend
curl http://localhost:3000/health

# Frontend
curl http://localhost/

# PostgreSQL
docker-compose exec postgres pg_isready -U postgres

# Estado de health checks
docker inspect sw1-backend --format='{{.State.Health.Status}}'
```

### Recursos

```bash
# Uso en tiempo real
docker stats

# Espacio en disco
docker system df

# Logs de tamaño limitado
docker-compose logs --tail=100 backend
```

## 🔄 Actualización y Mantenimiento

### Actualizar Aplicación

```bash
# Pull cambios
git pull origin main

# Rebuild y restart
docker-compose up -d --build
# Verificar CORS en backend
docker-compose exec backend env | grep CORS

# Ver logs de WebSocket
docker-compose logs -f backend | grep socket

# Reiniciar backend
docker-compose restart backend
```

### IA no responde

```bash
# Verificar API keys
docker-compose exec backend env | grep API_KEY

# Ver logs de IA
docker-compose logs backend | grep -i claude
docker-compose logs backend | grep -i openai

# Verificar modelo configurado
docker-compose exec backend env | grep MODELO_IA
```

## 🎯 Comandos Rápidos

```bash
# Setup completo
cp .env.example .env && docker-compose up -d --build

# Restart todo
docker-compose restart

# Ver todo
docker-compose ps && docker-compose logs --tail=50

# Limpieza total (⚠️ borra todo)
docker-compose down -v && docker system prune -af

# Backup completo
mkdir -p backups && \
docker-compose exec postgres pg_dump -U postgres parcial1sw1 > backups/db_$(date +%Y%m%d_%H%M%S).sql

# Logs en tiempo real de todos los servicios
docker-compose logs -f --tail=100
```

## 🎙️ Funcionalidades Multimodales

El sistema soporta análisis de audio e imágenes para el chat de IA.

### Configuración de Transcripción

```bash
# En .env - Configurar proveedor de transcripción
TRANSCRIPTION_PROVIDER=assemblyai  # assemblyai, openai, deepgram, google, local

# AssemblyAI (recomendado - $0.015/min)
ASSEMBLYAI_API_KEY=your_key_here

# OpenAI Whisper ($0.006/min)
OPENAI_API_KEY=sk-xxx

# Deepgram ($0.0043/min)
DEEPGRAM_API_KEY=your_key

# Google Cloud Speech (60min gratis/mes)
GOOGLE_APPLICATION_CREDENTIALS=/path/to/credentials.json
```

### Verificar Multimodal

```bash
# Ver configuración de transcripción
docker-compose exec backend env | grep TRANSCRIPTION

# Probar endpoint multimodal
curl -X POST http://localhost:3000/api/chat-ia/mensaje-multimodal \
  -H "Content-Type: multipart/form-data" \
  -F "salaId=1" \
  -F "texto=Analiza este diagrama" \
  -F "imagenes=@diagrama.jpg"

# Ver archivos subidos
docker-compose exec backend ls -lh /app/uploads/

# Ver attachments en BD
docker-compose exec postgres psql -U postgres -d parcial1sw1 \
  -c "SELECT tipo, archivo_nombre, archivo_tamano FROM mensaje_attachment;"
```

### Volúmenes Persistentes

```bash
# Ver volúmenes
docker volume ls | grep sw1

# Backup de uploads
docker run --rm -v sw1-backend-uploads:/uploads -v $(pwd):/backup \
  alpine tar czf /backup/uploads_backup.tar.gz -C /uploads .

# Restaurar uploads
docker run --rm -v sw1-backend-uploads:/uploads -v $(pwd):/backup \
  alpine tar xzf /backup/uploads_backup.tar.gz -C /uploads
```

## 📚 Recursos Adicionales

### Archivos de Configuración

- **docker-compose.yml** - Orquestación de servicios
- **.env.example** - Variables de entorno template
- **backend-p1sw1/Dockerfile** - Imagen del backend
- **official-sw1p1/Dockerfile** - Imagen del frontend
- **nginx/nginx.conf** - Configuración Nginx proxy
- **backend-p1sw1/database/schema-completo.sql** - Schema BD unificado
- **backend-p1sw1/database/seed-completo.sql** - Datos de prueba
- **backend-p1sw1/database/drop-tables.sql** - Limpieza de BD

### Documentación

- [README principal](README.md)
- [Backend README](backend-p1sw1/README.md)
- [Frontend README](official-sw1p1/README.md)

### Puertos y URLs

| Servicio | Desarrollo | Docker | Producción |
|----------|------------|--------|------------|
| Frontend | :4200 | :80 | https://dominio.com |
| Backend | :3000 | :3000 | https://api.dominio.com |
| PostgreSQL | :5432 | :5432 | (interno) |

---

**Nota:** Este proyecto usa Docker Compose v2 (sin guión). Si usas v1, reemplaza `docker-compose` por `docker compose`.bash

# Cambiar puertos en docker-compose.yml
# Por ejemplo: "8080:80" para frontend
```

## 📝 Estructura de Archivos Docker

```
.
├── docker-compose.yml           # Orquestación de servicios
├── .env                         # Variables de entorno
├── .env.example                 # Ejemplo de configuración
├── backend-p1sw1/
│   ├── Dockerfile              # Imagen del backend
│   ├── .dockerignore           # Archivos ignorados
│   └── database/
│       ├── schema-completo.sql # Estructura completa de BD (auto-ejecutado)
│       ├── seed-completo.sql   # Datos iniciales + ejemplos (auto-ejecutado)
│       └── drop-tables.sql     # Script de limpieza
└── official-sw1p1/
    ├── Dockerfile              # Imagen del frontend
    ├── nginx.conf              # Configuración de Nginx
    └── .dockerignore           # Archivos ignorados
```

## 🌐 Despliegue en VPS

### 1. Conectar al VPS
```bash
ssh usuario@tu-vps-ip
```

### 2. Instalar Docker
```bash
# Ubuntu/Debian
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Instalar Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### 3. Clonar Repositorio
```bash
git clone https://github.com/tu-usuario/tu-repo.git
cd tu-repo
```

### 4. Configurar y Desplegar
```bash
cp .env.example .env
nano .env  # Editar valores
docker-compose up -d
```

### 5. Verificar
```bash
# Ver que todo esté corriendo
docker-compose ps

# Verificar acceso
curl http://localhost
curl http://localhost:3000/health
```

## 📞 Soporte

Si encuentras problemas:
1. Revisar logs: `docker-compose logs`
2. Verificar health checks: `docker-compose ps`
3. Consultar documentación principal del proyecto

---

**Autor:** Jkarlos  
**Fecha:** Enero 2026  
**Versión:** 1.0
