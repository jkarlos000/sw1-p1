# 📋 Resumen de Actualización Docker - Enero 2026

## ✅ Cambios Realizados

### 1. 🗄️ Consolidación de Base de Datos

#### Archivos Nuevos
- ✅ `schema-completo.sql` - Schema unificado con todas las tablas
- ✅ `seed-completo.sql` - Datos de prueba completos con ejemplos multimodales
- ✅ `database/README.md` - Documentación completa de la BD

#### Archivos Renombrados (ya no se usan)
- ❌ `schema.sql` → `schema.sql.old`
- ❌ `chat-ia-schema.sql` → `chat-ia-schema.sql.old`
- ❌ `multimodal-schema.sql` → `multimodal-schema.sql.old`
- ❌ `seed.sql` → `seed.sql.old`

#### Archivos Actualizados
- ✅ `drop-tables.sql` - Actualizado con todas las tablas (incluye mensaje_attachment)

**Beneficios:**
- ✨ Instalación más simple (2 archivos en vez de 4)
- ✨ Menos errores por orden de ejecución
- ✨ Mantenimiento más fácil

---

### 2. 🐳 Docker Compose

#### Cambios en `docker-compose.yml`
```yaml
# ANTES (3 archivos SQL)
volumes:
  - ./backend-p1sw1/database/schema.sql:/docker-entrypoint-initdb.d/01-schema.sql
  - ./backend-p1sw1/database/chat-ia-schema.sql:/docker-entrypoint-initdb.d/02-chat-ia-schema.sql
  - ./backend-p1sw1/database/seed.sql:/docker-entrypoint-initdb.d/03-seed.sql

# AHORA (2 archivos SQL consolidados)
volumes:
  - ./backend-p1sw1/database/schema-completo.sql:/docker-entrypoint-initdb.d/01-schema.sql
  - ./backend-p1sw1/database/seed-completo.sql:/docker-entrypoint-initdb.d/02-seed.sql
```

#### Variables de Entorno Multimodal
```yaml
environment:
  # Transcripción Multimodal (opcional)
  TRANSCRIPTION_PROVIDER: ${TRANSCRIPTION_PROVIDER:-assemblyai}
  ASSEMBLYAI_API_KEY: ${ASSEMBLYAI_API_KEY:-}
  DEEPGRAM_API_KEY: ${DEEPGRAM_API_KEY:-}
  GOOGLE_APPLICATION_CREDENTIALS: ${GOOGLE_APPLICATION_CREDENTIALS:-}
```

#### Nuevo Volumen para Uploads
```yaml
volumes:
  postgres_data:
    driver: local
    name: sw1-postgres-data
  backend_uploads:  # ← NUEVO
    driver: local
    name: sw1-backend-uploads
```

```yaml
backend:
  volumes:
    - backend_uploads:/app/uploads  # ← NUEVO
```

---

### 3. 🏗️ Dockerfile Backend

#### Cambios
```dockerfile
# AGREGADO: Directorio para uploads multimodales
RUN mkdir -p /app/uploads && chown nodejs:nodejs /app/uploads
```

**Beneficios:**
- ✅ Soporta almacenamiento de audio e imágenes
- ✅ Volumen persistente para no perder archivos
- ✅ Permisos correctos para usuario no-root

---

### 4. 📄 .dockerignore

#### Agregado
```ignore
database/*.old     # Ignorar archivos SQL antiguos
uploads/*          # No copiar uploads en build
!uploads/.gitkeep  # Mantener carpeta
```

---

### 5. 📚 README_DOCKER.md

#### Secciones Actualizadas
- ✅ Variables de entorno con transcripción multimodal
- ✅ Comandos para verificar attachments
- ✅ Nueva sección "🎙️ Funcionalidades Multimodales"
- ✅ Comandos para backup/restore de uploads
- ✅ Estructura de archivos actualizada

#### Nueva Sección Multimodal
```bash
# Ver configuración de transcripción
docker-compose exec backend env | grep TRANSCRIPTION

# Probar endpoint multimodal
curl -X POST http://localhost:3000/api/chat-ia/mensaje-multimodal \
  -F "imagenes=@diagrama.jpg"

# Ver attachments en BD
docker-compose exec postgres psql -U postgres -d parcial1sw1 \
  -c "SELECT tipo, archivo_nombre FROM mensaje_attachment;"
```

---

### 6. ⚙️ .env.example

#### Variables Agregadas
```env
# ====================================
# Transcripción Multimodal (Opcional)
# ====================================
TRANSCRIPTION_PROVIDER=assemblyai
ASSEMBLYAI_API_KEY=
DEEPGRAM_API_KEY=
GOOGLE_APPLICATION_CREDENTIALS=
```

---

## 🚀 Instrucciones de Migración

### Para Instalaciones Nuevas
```bash
# 1. Configurar entorno
cp .env.example .env
nano .env  # Agregar API keys

# 2. Levantar servicios
docker-compose up -d --build

# 3. Verificar
docker-compose ps
docker-compose logs -f backend
```

### Para Instalaciones Existentes

#### Opción A: Mantener Datos (Recomendado)
```bash
# 1. Backup de datos
docker-compose exec postgres pg_dump -U postgres parcial1sw1 > backup_antes_migracion.sql

# 2. Actualizar código
git pull origin main

# 3. Rebuild sin borrar volúmenes
docker-compose up -d --build

# 4. Verificar
docker-compose ps
```

#### Opción B: Desde Cero (Limpio)
```bash
# 1. Backup si necesitas
docker-compose exec postgres pg_dump -U postgres parcial1sw1 > backup.sql

# 2. Detener y limpiar todo
docker-compose down -v

# 3. Actualizar código
git pull origin main

# 4. Rebuild y start
docker-compose up -d --build

# 5. La BD se crea automáticamente con los nuevos archivos consolidados
```

---

## 🔍 Verificación Post-Migración

### 1. Verificar Tablas
```bash
docker-compose exec postgres psql -U postgres -d parcial1sw1 -c "\dt"
```

**Esperado:** 8 tablas (usuario, sala, asistencia, conversacion_ia, mensaje_chat_ia, mensaje_attachment, snapshot_diagrama, config_ia)

### 2. Verificar Datos de Prueba
```bash
docker-compose exec postgres psql -U postgres -d parcial1sw1 -c \
  "SELECT COUNT(*) as usuarios FROM usuario; 
   SELECT COUNT(*) as salas FROM sala;
   SELECT COUNT(*) as mensajes FROM mensaje_chat_ia;
   SELECT COUNT(*) as attachments FROM mensaje_attachment;"
```

**Esperado:** 6 usuarios, 5 salas, 11 mensajes, 2 attachments

### 3. Verificar Uploads
```bash
docker volume ls | grep sw1
```

**Esperado:** 
- `sw1-postgres-data`
- `sw1-backend-uploads`

### 4. Verificar Variables Multimodal
```bash
docker-compose exec backend env | grep TRANSCRIPTION
```

---

## 📊 Comparación Antes vs Ahora

| Aspecto | Antes | Ahora |
|---------|-------|-------|
| Archivos SQL | 4 (schema.sql, chat-ia-schema.sql, multimodal-schema.sql, seed.sql) | 2 (schema-completo.sql, seed-completo.sql) |
| Tablas | 7 | 8 (+ mensaje_attachment) |
| Volúmenes | 1 (postgres_data) | 2 (+ backend_uploads) |
| Variables ENV | 10 | 14 (+ multimodal) |
| Funcionalidades | Chat IA texto | Chat IA texto + audio + imágenes |
| Documentación | Básica | Completa con ejemplos |

---

## 🎯 Próximos Pasos

1. ✅ Configurar API key de AssemblyAI en `.env`
2. ✅ Probar endpoint multimodal con audio/imágenes
3. ✅ Verificar transcripción de audio
4. ✅ Verificar análisis de imágenes con Claude Vision
5. ✅ Integrar componente `ChatAttachmentsComponent` en frontend

---

## 📞 Troubleshooting

### Problema: No se crearon las tablas nuevas
```bash
# Re-ejecutar schema manualmente
docker-compose exec postgres psql -U postgres -d parcial1sw1 -f /docker-entrypoint-initdb.d/01-schema.sql
```

### Problema: Faltan datos de prueba
```bash
# Re-ejecutar seed
docker-compose exec postgres psql -U postgres -d parcial1sw1 -f /docker-entrypoint-initdb.d/02-seed.sql
```

### Problema: No hay volumen de uploads
```bash
# Crear volumen manualmente
docker volume create sw1-backend-uploads

# Reiniciar backend
docker-compose restart backend
```

### Problema: Variables multimodal no aparecen
```bash
# Verificar .env
cat .env | grep TRANSCRIPTION

# Rebuild backend
docker-compose up -d --build backend
```

---

**Fecha:** 16 de Enero 2026  
**Versión:** 2.0 - Consolidación + Multimodal  
**Autor:** Jkarlos
