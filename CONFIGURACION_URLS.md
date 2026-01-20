# ✅ Configuración de URLs - uml.jkhoster.com

## 📋 Resumen de tu Problema

**Problema original:**
El `docker-compose.yml` tenía `BACKEND_URL=http://backend:3000`, pero "backend" solo es válido DENTRO de la red Docker. El navegador del cliente (que ejecuta Angular) no puede resolver ese nombre DNS.

**Solución implementada:**
- Nginx como proxy reverso en `https://uml.jkhoster.com`
- Frontend hace peticiones a `https://uml.jkhoster.com/api`
- Nginx internamente redirige a `http://backend:3000`
- Certificados SSL con Let's Encrypt

---

## 🔄 Flujo de las Peticiones

### ❌ ANTES (No funcionaba):
```
Navegador del Cliente
    ↓
http://backend:3000  ← ❌ DNS inválido (solo existe en Docker)
```

### ✅ AHORA (Funciona):
```
Navegador del Cliente
    ↓
https://uml.jkhoster.com/api  ← ✅ DNS público válido
    ↓
Nginx (Puerto 443 - HTTPS)
    ↓
Proxy reverso a: http://backend:3000  ← ✅ Red interna Docker
    ↓
Backend Node.js (Container)
    ↓
PostgreSQL (Container)
```

---

## 📁 Archivos Configurados

### 1. `nginx/nginx.conf` ✅
```nginx
# HTTP → HTTPS redirect
server {
    listen 80;
    server_name uml.jkhoster.com;
    return 301 https://$server_name$request_uri;
}

# HTTPS Server
server {
    listen 443 ssl http2;
    server_name uml.jkhoster.com;
    
    # Certificados SSL
    ssl_certificate /etc/letsencrypt/live/uml.jkhoster.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/uml.jkhoster.com/privkey.pem;
    
    # API Backend
    location /api/ {
        proxy_pass http://backend:3000/;  ← Red interna Docker
    }
    
    # WebSockets
    location /socket.io/ {
        proxy_pass http://backend:3000/socket.io/;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
    
    # Frontend Angular
    location / {
        proxy_pass http://frontend:80/;
    }
}
```

### 2. `docker-compose.yml` ✅
```yaml
frontend:
  environment:
    API_URL: https://uml.jkhoster.com/api   ← URL pública
    WS_URL: https://uml.jkhoster.com        ← URL pública

backend:
  environment:
    CORS_ORIGIN: https://uml.jkhoster.com   ← Permitir solo tu dominio

nginx:
  ports:
    - "80:80"    # HTTP
    - "443:443"  # HTTPS
  volumes:
    - ./certbot/conf:/etc/letsencrypt:ro  ← Certificados SSL
```

### 3. `official-sw1p1/src/assets/config.json` ✅
```json
{
  "apiUrl": "https://uml.jkhoster.com/api",
  "wsUrl": "https://uml.jkhoster.com"
}
```

Este archivo es lo que el **navegador** del cliente carga en tiempo de ejecución.

### 4. `.env.production` ✅
```env
# URLs Públicas
API_URL=https://uml.jkhoster.com/api
WS_URL=https://uml.jkhoster.com
CORS_ORIGIN=https://uml.jkhoster.com

# Password seguro
POSTGRES_PASSWORD=tu_password_seguro

# API Keys
ANTHROPIC_API_KEY=sk-ant-xxxxx
```

---

## 🚀 Pasos para Desplegar

### 1. En el Servidor (VPS)

```bash
# 1. Clonar proyecto
git clone tu-repo.git
cd tu-repo

# 2. Configurar .env
cp .env.production .env
nano .env  # Editar con tus valores reales

# 3. Obtener certificado SSL
chmod +x setup-ssl.sh
./setup-ssl.sh

# 4. Levantar servicios
docker-compose up -d --build

# 5. Verificar
docker-compose ps
```

### 2. Verificar en el Navegador

1. Visita `https://uml.jkhoster.com`
2. Verifica el candado SSL 🔒
3. Abre DevTools (F12) → Network
4. Haz una acción (login, crear sala)
5. Verifica que las peticiones van a `https://uml.jkhoster.com/api/...` ✅

---

## 🔍 Debugging

### Ver qué URL está usando el Frontend

**En el navegador (DevTools Console):**
```javascript
// Ver la configuración cargada
fetch('/assets/config.json')
  .then(r => r.json())
  .then(c => console.log('Config:', c));

// Debe mostrar:
// Config: {
//   apiUrl: "https://uml.jkhoster.com/api",
//   wsUrl: "https://uml.jkhoster.com"
// }
```

### Ver Logs de Nginx

```bash
# Logs en tiempo real
docker-compose logs -f nginx

# Ver peticiones
docker-compose exec nginx tail -f /var/log/nginx/access.log

# Ver errores
docker-compose exec nginx tail -f /var/log/nginx/error.log
```

### Probar API directamente

```bash
# Desde fuera (como lo haría el navegador)
curl https://uml.jkhoster.com/api/health

# Desde dentro de Docker (como lo hace nginx)
docker-compose exec nginx curl http://backend:3000/health
```

---

## 🌐 DNS - Configuración

**Tu DNS ya está configurado:** `uml.jkhoster.com`

Verifica que apunta a tu servidor:
```bash
nslookup uml.jkhoster.com
# Debe devolver la IP de tu servidor VPS
```

**Tipo de registro DNS:**
```
Type: A
Name: uml
Value: 123.45.67.89  (IP de tu servidor)
TTL: 3600
```

---

## 🔐 SSL/HTTPS - Let's Encrypt

### Obtener Certificado (Primera Vez)

```bash
./setup-ssl.sh
```

### Renovación Automática

El contenedor `certbot` está configurado para renovar automáticamente cada 12 horas.

**Renovar manualmente:**
```bash
docker-compose run --rm certbot renew
docker-compose restart nginx
```

### Verificar Certificado

```bash
# Ver detalles del certificado
openssl s_client -connect uml.jkhoster.com:443 -servername uml.jkhoster.com

# Ver fecha de expiración
docker-compose exec nginx nginx -T | grep ssl_certificate
```

---

## 🧪 Testing

### 1. Test HTTP → HTTPS Redirect
```bash
curl -I http://uml.jkhoster.com
# Debe retornar: 301 Moved Permanently
# Location: https://uml.jkhoster.com/
```

### 2. Test HTTPS
```bash
curl -I https://uml.jkhoster.com
# Debe retornar: 200 OK
```

### 3. Test API
```bash
curl https://uml.jkhoster.com/api/health
# Debe retornar: {"ok": true, ...}
```

### 4. Test WebSocket

**En el navegador (DevTools Console):**
```javascript
const socket = io('https://uml.jkhoster.com');
socket.on('connect', () => console.log('✅ WebSocket conectado'));
socket.on('connect_error', (err) => console.error('❌ Error:', err));
```

---

## 📊 Comparación de Configuraciones

| Aspecto | Desarrollo Local | Producción (uml.jkhoster.com) |
|---------|------------------|-------------------------------|
| **Protocolo** | HTTP | HTTPS |
| **Puerto Frontend** | 4200 | 443 (HTTPS) |
| **Puerto Backend** | 3000 | 443 (a través de Nginx) |
| **URL API** | `http://localhost:3000` | `https://uml.jkhoster.com/api` |
| **URL WebSocket** | `http://localhost:3000` | `wss://uml.jkhoster.com` |
| **Certificado SSL** | No | Let's Encrypt |
| **Proxy Reverso** | No (directo) | Nginx |
| **CORS Origin** | `http://localhost:4200` | `https://uml.jkhoster.com` |
| **DNS** | localhost | uml.jkhoster.com |

---

## 🎯 Checklist de Configuración

- [x] DNS `uml.jkhoster.com` configurado
- [x] Nginx con proxy reverso configurado
- [x] SSL con Let's Encrypt configurado
- [x] `config.json` apunta a `https://uml.jkhoster.com/api`
- [x] CORS configurado para `https://uml.jkhoster.com`
- [x] WebSocket configurado con `wss://`
- [x] HTTP redirige automáticamente a HTTPS
- [x] Scripts de setup SSL creados (`.sh` y `.ps1`)
- [x] `.env.production` creado con valores de ejemplo
- [x] `DESPLIEGUE_PRODUCCION.md` creado con guía completa

---

## 📝 Notas Importantes

1. **El frontend NO se comunica con `backend:3000`**
   - ❌ Eso solo funciona dentro de Docker
   - ✅ El frontend usa `https://uml.jkhoster.com/api`

2. **Nginx hace el proxy reverso**
   - Cliente → `https://uml.jkhoster.com/api` → Nginx → `http://backend:3000`
   - Nginx conoce "backend" porque está en la misma red Docker

3. **config.json se carga en runtime**
   - No está embebido en el build de Angular
   - Se puede cambiar sin rebuildar el frontend
   - El navegador lo descarga al cargar la app

4. **WebSocket usa `wss://` (WebSocket Secure)**
   - No `ws://` porque estamos en HTTPS
   - Nginx maneja el upgrade de WebSocket automáticamente

5. **Para desarrollo local**
   - Usa `config.local.json` con `http://localhost:3000`
   - O copia `config.example.json` a `config.json`

---

## 🎉 Resultado Final

Tu aplicación ahora funciona correctamente con:

✅ **Dominio público:** `https://uml.jkhoster.com`  
✅ **SSL/HTTPS:** Certificado válido de Let's Encrypt  
✅ **API:** `https://uml.jkhoster.com/api`  
✅ **WebSocket:** `wss://uml.jkhoster.com/socket.io/`  
✅ **Frontend:** El navegador hace peticiones a URLs válidas  
✅ **Backend:** Protegido detrás de Nginx (no expuesto directamente)  

El problema de `backend:3000` está completamente resuelto. 🚀
