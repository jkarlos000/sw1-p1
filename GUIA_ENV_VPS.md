# 🔐 Guía de Variables de Entorno (.env) para VPS

## Problema Identificado

Tu VPS tiene:
- `.env.production.example` (plantilla correcta)
- El frontend está conectando a `localhost:3000` ❌ INCORRECTO

Esto causa que el frontend en el navegador intente conectarse a `localhost:3000` en tu computadora, no al backend del VPS.

---

## ✅ Solución Correcta

### Paso 1: Crear `.env` en la raíz del VPS

En `/home/sw1/jk/.env`, copia el contenido de `.env.production.example` y actualiza con tus valores:

```bash
# En el VPS:
cd /home/sw1/jk
cp .env.production.example .env
```

Luego edita `.env` con tus valores reales:

```dotenv
# =====================================================
# ENTORNO
# =====================================================
NODE_ENV=production
ENVIRONMENT=production

# =====================================================
# PUERTOS
# =====================================================
BACKEND_PORT=3000
POSTGRES_PORT=5432
HTTP_PORT=80
HTTPS_PORT=443

# =====================================================
# BASE DE DATOS
# =====================================================
POSTGRES_DB=parcial1sw1
POSTGRES_USER=postgres
POSTGRES_PASSWORD=tu_contraseña_real_aqui_12345

DB_HOST=postgres
DB_PORT=5432
DB_NAME=parcial1sw1
DB_USER=postgres
DB_PASSWORD=tu_contraseña_real_aqui_12345

# =====================================================
# URLS Y DOMINIOS ⚠️ CRÍTICO
# =====================================================
DOMAIN=uml.jkhoster.com
API_URL=https://uml.jkhoster.com/api
WS_URL=https://uml.jkhoster.com
BACKEND_URL=https://uml.jkhoster.com/api
CORS_ORIGIN=https://uml.jkhoster.com

# =====================================================
# CERTIFICADO SSL
# =====================================================
SSL_CERT_PATH=/etc/letsencrypt/live/uml.jkhoster.com/fullchain.pem
SSL_KEY_PATH=/etc/letsencrypt/live/uml.jkhoster.com/privkey.pem

# =====================================================
# APIs EXTERNAS (OPCIONAL)
# =====================================================
ANTHROPIC_API_KEY=
OPENAI_API_KEY=
MODELO_IA=claude-sonnet-4.5

TRANSCRIPTION_PROVIDER=assemblyai
ASSEMBLYAI_API_KEY=
DEEPGRAM_API_KEY=
GOOGLE_APPLICATION_CREDENTIALS=

# =====================================================
# LOGGING
# =====================================================
LOG_LEVEL=info
LOG_FILE=/var/log/uml-backend.log

DEBUG=false

# =====================================================
# SEGURIDAD
# =====================================================
JWT_SECRET=tu_jwt_secret_muy_seguro_cambiar_esto_12345
SESSION_TIMEOUT=1440

# =====================================================
# DOCKER
# =====================================================
COMPOSE_PROJECT_NAME=uml-flutter
COMPOSE_FILE=docker-compose.yml
```

### Paso 2: Entender la diferencia .env vs .env.production

| Archivo | Ubicación | Propósito | Uso |
|---------|-----------|----------|-----|
| `.env.production.example` | Raíz del proyecto | Plantilla/Documentación | NO se usa directamente |
| `.env` | Raíz del VPS | Configuración REAL | ✅ USADA por docker-compose |
| `.env.example` (backend) | `backend-p1sw1/` | Plantilla del backend | NO se usa (usar .env raíz) |

**⚠️ NO necesitas múltiples `.env` archivos. Usa solo UNO:**
- **VPS:** Un `.env` en la raíz (`/home/sw1/jk/.env`)
- **Local:** Un `.env` en la raíz (`c:\work\U\jk\.env`) para desarrollo

---

## 🎯 Cómo Funciona docker-compose con .env

```mermaid
┌─────────────────────────────────────────────────────┐
│ Tu PC / Editor                                      │
│                                                     │
│ c:\work\U\jk\.env (LOCAL)                          │
│ └── SOLO para desarrollo local                     │
└─────────────────────────────────────────────────────┘
                          ↓ (git push)
┌─────────────────────────────────────────────────────┐
│ VPS GitHub                                          │
│                                                     │
│ /home/sw1/jk/repo (clonado)                        │
│ ├── .env.production.example                        │
│ ├── .gitignore (ignora .env)                       │
│ └── docker-compose.yml                             │
└─────────────────────────────────────────────────────┘
                          ↓ (VPS setup)
┌─────────────────────────────────────────────────────┐
│ VPS Sistema de Archivos                            │
│                                                     │
│ /home/sw1/jk/                                      │
│ ├── .env (CREADO MANUALMENTE) ✅                   │
│ ├── .env.production.example (NO se usa)            │
│ ├── docker-compose.yml                             │
│ └── ... rest of files                              │
│                                                     │
│ docker-compose.yml LEE → .env ✅                   │
│ docker-compose.yml LEE variables → Pasa a containers
└─────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────┐
│ Dentro de Contenedores Docker                      │
│                                                     │
│ Backend:        API_URL=${API_URL}                 │
│ Frontend:       wsUrl=${WS_URL}                    │
│ Nginx:          SSL_CERT_PATH=${SSL_CERT_PATH}    │
│ PostgreSQL:     POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
└─────────────────────────────────────────────────────┘
```

### Flujo Real:

1. **docker-compose.yml contiene:**
   ```yaml
   environment:
     API_URL: ${API_URL:-https://uml.jkhoster.com/api}
   ```

2. **Tu `.env` contiene:**
   ```
   API_URL=https://uml.jkhoster.com/api
   ```

3. **docker-compose.yml lee `.env` y reemplaza:**
   ```
   ${API_URL} → https://uml.jkhoster.com/api
   ```

4. **Backend recibe:**
   ```
   API_URL=https://uml.jkhoster.com/api ✅
   ```

---

## ❌ Por qué `localhost:3000` es INCORRECTO en VPS

### Escenario Incorrecto:

```
┌─────────────────────────┐
│ Tu Navegador en PC      │
│ (visitando VPS)         │
│                         │
│ https://uml.jkhoster.com
│ ↓ descarga frontend     │
│ ↓ Angular carga         │
│ ↓ intenta conectar a:   │
│ http://localhost:3000   ❌
│ (mira tu PC, no VPS)    │
└─────────────────────────┘
```

### Escenario Correcto:

```
┌─────────────────────────┐
│ Tu Navegador en PC      │
│ (visitando VPS)         │
│                         │
│ https://uml.jkhoster.com
│ ↓ descarga frontend     │
│ ↓ Angular carga         │
│ ↓ intenta conectar a:   │
│ https://uml.jkhoster.com/api ✅
│ (mira el VPS)           │
└─────────────────────────┘
```

---

## 📝 Checklist: Cómo Sé Que Está Correcto

### En el VPS, ejecuta:

```bash
# 1. Ver el contenido del .env
cat /home/sw1/jk/.env | grep -E "API_URL|WS_URL|DOMAIN"

# Output esperado:
# DOMAIN=uml.jkhoster.com
# API_URL=https://uml.jkhoster.com/api
# WS_URL=https://uml.jkhoster.com
# BACKEND_URL=https://uml.jkhoster.com/api
```

```bash
# 2. Ver qué variables están en docker-compose
docker-compose config | grep -A 5 "environment:"

# Debe mostrar API_URL reemplazado (no ${API_URL})
```

```bash
# 3. Revisar que frontend tiene config correcta
docker exec sw1-frontend cat /usr/share/nginx/html/config.json

# Debe mostrar:
# {"apiUrl":"https://uml.jkhoster.com/api","wsUrl":"https://uml.jkhoster.com"}
```

```bash
# 4. Revisar logs del frontend
docker logs sw1-frontend | grep -i "api\|url"

# No debe mostrar localhost:3000
```

---

## 📋 Estructura Final del Proyecto

```
/home/sw1/jk/
├── .env ✅ USAR ESTE (creado manualmente)
│   └── Variables para docker-compose
│
├── .env.production.example (NO modificar)
│   └── Plantilla / Documentación
│
├── .gitignore ✅ Incluye .env
│   └── .env
│   └── .env.local
│   └── .env.*.local
│
├── docker-compose.yml
│   └── Lee variables desde ${VAR_NAME}
│
├── backend-p1sw1/
│   ├── .env.example (NO usar en VPS)
│   └── Dockerfile
│
├── official-sw1p1/
│   ├── src/environments/
│   │   ├── environment.ts (localhost:3000 - DESARROLLO)
│   │   └── environment.prod.ts (dominio real - PRODUCCIÓN)
│   └── Dockerfile
│
└── nginx/
    └── nginx.conf
```

---

## 🚀 Pasos para Arreglarlo en VPS

### Paso 1: SSH al VPS

```bash
ssh -i "ruta/a/tu/key.pem" sw1@uml.jkhoster.com
cd /home/sw1/jk
```

### Paso 2: Crear `.env` si no existe

```bash
# Opción A: Copiar desde plantilla
cp .env.production.example .env

# Opción B: Crear nuevo
touch .env
```

### Paso 3: Editar `.env` con valores REALES

```bash
nano .env  # o vim .env
```

Asegúrate de:
- ✅ `DOMAIN=uml.jkhoster.com`
- ✅ `API_URL=https://uml.jkhoster.com/api`
- ✅ `WS_URL=https://uml.jkhoster.com`
- ✅ `CORS_ORIGIN=https://uml.jkhoster.com`
- ✅ Contraseña BD diferente a `postgres`
- ✅ JWT_SECRET fuerte

### Paso 4: Verificar .gitignore

```bash
cat .gitignore | grep -i env

# Debe contener:
# .env
# .env.local
# .env.*.local
```

### Paso 5: Reconstruir y desplegar

```bash
docker-compose down
docker-compose up -d --build
```

### Paso 6: Verificar conexión

```bash
# En el navegador:
# 1. Abre https://uml.jkhoster.com
# 2. Abre Developer Tools (F12)
# 3. Network tab
# 4. Busca requests a /api/
# 5. Deben ir a https://uml.jkhoster.com/api ✅
#    NO a http://localhost:3000 ❌
```

---

## 🔧 Solución Rápida si Ves localhost:3000

### Causa Probable: Frontend usando `environment.ts` en lugar de `environment.prod.ts`

1. **Verificar Dockerfile del frontend:**

```dockerfile
# Debe tener:
RUN npm run build  # Usa environment.prod.ts en producción
```

2. **Verificar app.config.ts:**

```typescript
// Debe usar import correcto:
import { environment } from './environments/environment.prod';  // ✅ PRODUCCIÓN
// NO:
import { environment } from './environments/environment';  // ❌ DESARROLLO
```

3. **Reconstruir:**

```bash
docker-compose down
docker-compose up -d --build
```

---

## 📚 Variables Clave Explicadas

| Variable | Significado | Ejemplo VPS | Ejemplo Local |
|----------|-------------|------------|---------------|
| `DOMAIN` | Dominio del servidor | `uml.jkhoster.com` | `localhost` |
| `API_URL` | URL del API backend | `https://uml.jkhoster.com/api` | `http://localhost:3000` |
| `WS_URL` | URL WebSocket | `https://uml.jkhoster.com` | `http://localhost:3000` |
| `CORS_ORIGIN` | Sitios permitidos | `https://uml.jkhoster.com` | `*` o `http://localhost:4200` |
| `DB_HOST` | Host BD (en Docker) | `postgres` (nombre servicio) | `localhost` |
| `NODE_ENV` | Entorno ejecución | `production` | `development` |

---

## ✨ Resumen: Qué NO Hacer

❌ NO:
- Commitear `.env` a GitHub (usa `.gitignore`)
- Usar `localhost:3000` en VPS (frontend ve tu PC, no el servidor)
- Usar `environment.ts` en producción (usar `environment.prod.ts`)
- Dejar contraseña por defecto en `.env`
- Múltiples archivos `.env` (solo uno en raíz)

✅ SÍ:
- Usar `.env.production.example` como plantilla
- Crear `.env` real con valores específicos de tu VPS
- Usar dominio real: `uml.jkhoster.com`
- Cambiar contraseña BD
- Una sola verdad: `.env` en raíz

---

## 🆘 Problemas Comunes

### "Frontend no conecta al backend"

```
Causa: API_URL=localhost:3000
Solución: API_URL=https://uml.jkhoster.com/api en .env
Verificar: docker-compose config | grep API_URL
```

### "CORS error desde navegador"

```
Causa: CORS_ORIGIN no coincide con dominio
Solución: CORS_ORIGIN=https://uml.jkhoster.com en .env
Verificar: curl -i https://uml.jkhoster.com/api/health
```

### "Certificado SSL no encontrado"

```
Causa: SSL_CERT_PATH incorrecto
Solución: Verificar que Let's Encrypt está instalado
Verificar: ls -la /etc/letsencrypt/live/uml.jkhoster.com/
```

### "docker-compose no lee .env"

```
Causa: .env en ubicación incorrecta
Solución: .env debe estar donde está docker-compose.yml
Verificar: ls -la /home/sw1/jk/.env
```

---

## 📞 Resumen de Comando Final

Para arreglarlo ahora mismo en VPS:

```bash
# 1. SSH al VPS
ssh -i tu_key.pem sw1@uml.jkhoster.com
cd /home/sw1/jk

# 2. Crear .env si no existe
[ ! -f .env ] && cp .env.production.example .env

# 3. Editar (cambiar ONLY las variables sensibles)
nano .env

# 4. Reemplazar valores:
# POSTGRES_PASSWORD=tu_pwd_real
# JWT_SECRET=tu_jwt_secret_fuerte

# 5. Guardar y cerrar: Ctrl+X, Y, Enter

# 6. Reconstruir
docker-compose down
docker-compose up -d --build

# 7. Esperar 3-5 minutos y verificar:
docker-compose ps
curl -k https://uml.jkhoster.com/api/health

# 8. Abrir navegador:
# https://uml.jkhoster.com
# F12 → Network → Ver requests a /api/
```

✅ **Debería funcionar correctamente ahora.**
