# 🚀 Guía de Despliegue en Producción

## Dominio: uml.jkhoster.com

Esta guía explica cómo desplegar la aplicación en tu servidor con SSL/HTTPS usando tu dominio `uml.jkhoster.com`.

---

## 📋 Pre-requisitos

### 1. Servidor VPS/Cloud
- Sistema operativo: Ubuntu 22.04 LTS (recomendado) o similar
- RAM: Mínimo 2 GB (recomendado 4 GB)
- Disco: Mínimo 20 GB
- Acceso SSH con permisos sudo

### 2. DNS Configurado
✅ **YA TIENES ESTO** - Verifica que `uml.jkhoster.com` apunta a tu IP del servidor:

```bash
# Verificar DNS
nslookup uml.jkhoster.com

# Debe devolver la IP de tu servidor
```

### 3. Software en el Servidor
```bash
# Actualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Instalar Docker Compose
sudo apt install docker-compose -y

# Verificar instalación
docker --version
docker-compose --version
```

---

## 🔧 Configuración Paso a Paso

### Paso 1: Clonar el Proyecto en el Servidor

```bash
# Conectar al servidor via SSH
ssh usuario@tu-ip-servidor

# Clonar repositorio
cd /var/www  # o la carpeta que prefieras
git clone https://github.com/tu-usuario/tu-repo.git
cd tu-repo
```

### Paso 2: Configurar Variables de Entorno

```bash
# Copiar archivo de ejemplo para producción
cp .env.production .env

# Editar con tus valores reales
nano .env
```

**Variables IMPORTANTES a cambiar en `.env`:**

```env
# ❗ CAMBIAR: Password seguro de PostgreSQL
POSTGRES_PASSWORD=tu_password_super_seguro_aqui

# ❗ CAMBIAR: Tu API key de Anthropic Claude (REQUERIDO)
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxxxxxxx

# ❗ CAMBIAR: Tu email para notificaciones SSL
CERTBOT_EMAIL=tu-email@ejemplo.com

# ✅ VERIFICAR: Dominio correcto
DOMAIN=uml.jkhoster.com
API_URL=https://uml.jkhoster.com/api
WS_URL=https://uml.jkhoster.com
CORS_ORIGIN=https://uml.jkhoster.com

# 🔹 OPCIONAL: API keys de transcripción
ASSEMBLYAI_API_KEY=xxxxx  # Si usas transcripción de audio
OPENAI_API_KEY=sk-xxxxx   # Alternativa
```

### Paso 3: Configurar Firewall

```bash
# Permitir puertos necesarios
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable

# Verificar reglas
sudo ufw status
```

### Paso 4: Configurar config.json del Frontend

El archivo `official-sw1p1/src/assets/config.json` ya está creado con:

```json
{
  "apiUrl": "https://uml.jkhoster.com/api",
  "wsUrl": "https://uml.jkhoster.com"
}
```

**✅ Esto es lo que soluciona tu problema original**: El navegador del cliente ahora hará peticiones a `https://uml.jkhoster.com/api` en lugar de `http://backend:3000`.

### Paso 5: Obtener Certificado SSL

**🔐 Primera vez - Obtener certificado:**

```bash
# Opción A: Linux/Mac
chmod +x setup-ssl.sh
./setup-ssl.sh

# Opción B: Manualmente
mkdir -p ./certbot/conf ./certbot/www

docker-compose up -d nginx  # Levantar solo nginx primero

docker-compose run --rm certbot certonly --webroot \
  --webroot-path=/var/www/certbot \
  --email tu-email@ejemplo.com \
  --agree-tos \
  --no-eff-email \
  -d uml.jkhoster.com

# Reiniciar nginx con SSL
docker-compose restart nginx
```

**Renovación automática:**
El contenedor `certbot` está configurado para renovar automáticamente cada 12 horas.

### Paso 6: Levantar Todos los Servicios

```bash
# Build y levantar servicios
docker-compose up -d --build

# Verificar que todos están corriendo
docker-compose ps

# Ver logs
docker-compose logs -f
```

**Deberías ver:**
- ✅ `sw1-postgres` - healthy
- ✅ `sw1-backend` - healthy
- ✅ `sw1-frontend` - healthy
- ✅ `sw1-nginx` - healthy

### Paso 7: Verificar Funcionamiento

```bash
# 1. Health check del sistema
curl https://uml.jkhoster.com/health

# 2. API backend (a través de nginx)
curl https://uml.jkhoster.com/api/health

# 3. Verificar certificado SSL
openssl s_client -connect uml.jkhoster.com:443 -servername uml.jkhoster.com
```

**En el navegador:**
1. Visita `https://uml.jkhoster.com`
2. Verifica que aparece el **candado SSL** 🔒
3. Abre DevTools (F12) → Network → Verifica que las peticiones van a `https://uml.jkhoster.com/api`

---

## 🔄 Flujo de las Peticiones

### Antes (❌ No funcionaba):
```
Navegador → http://backend:3000  ❌ DNS no válido
```

### Ahora (✅ Funciona):
```
Navegador → https://uml.jkhoster.com/api
    ↓
Nginx (puerto 443) → Proxy reverso
    ↓
Backend (dentro de Docker, puerto 3000)
    ↓
PostgreSQL (dentro de Docker, puerto 5432)
```

**WebSockets:**
```
Navegador → wss://uml.jkhoster.com/socket.io/
    ↓
Nginx → Upgrade WebSocket
    ↓
Backend Socket.IO
```

---

## 🔍 Troubleshooting

### Problema: "NET::ERR_CERT_AUTHORITY_INVALID"

**Causa:** Nginx está usando certificados autofirmados o los de Let's Encrypt no están cargados.

**Solución:**
```bash
# Verificar que existen los certificados
ls -la ./certbot/conf/live/uml.jkhoster.com/

# Si no existen, ejecutar setup-ssl.sh nuevamente
./setup-ssl.sh

# Reiniciar nginx
docker-compose restart nginx
```

### Problema: "502 Bad Gateway"

**Causa:** Nginx no puede conectar con el backend.

**Solución:**
```bash
# Verificar que backend está corriendo
docker-compose ps backend

# Ver logs del backend
docker-compose logs backend

# Verificar que backend está en la misma red
docker network inspect sw1-network
```

### Problema: WebSockets no conectan

**Causa:** Headers de Upgrade no están configurados.

**Solución:**
El archivo `nginx.conf` ya tiene la configuración correcta:
```nginx
location /socket.io/ {
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
}
```

Reinicia nginx:
```bash
docker-compose restart nginx
```

### Problema: CORS Error

**Causa:** CORS_ORIGIN no coincide con el dominio.

**Solución:**
```bash
# Verificar .env
cat .env | grep CORS_ORIGIN

# Debe ser:
# CORS_ORIGIN=https://uml.jkhoster.com

# Si no, corregir y reiniciar backend
docker-compose restart backend
```

---

## 📊 Monitoreo

### Logs en Tiempo Real
```bash
# Todos los servicios
docker-compose logs -f

# Solo backend
docker-compose logs -f backend

# Solo nginx
docker-compose logs -f nginx

# Últimas 100 líneas
docker-compose logs --tail=100
```

### Estado de Servicios
```bash
# Ver estado
docker-compose ps

# Ver recursos (CPU, RAM)
docker stats
```

### Base de Datos
```bash
# Conectar a PostgreSQL
docker-compose exec postgres psql -U postgres -d parcial1sw1

# Ver usuarios
SELECT * FROM usuario;

# Ver salas activas
SELECT * FROM sala;
```

---

## 🔄 Actualizaciones

```bash
# 1. Pull cambios del repositorio
git pull origin main

# 2. Rebuild servicios
docker-compose up -d --build

# 3. Verificar
docker-compose ps
```

---

## 💾 Backups

### Backup de Base de Datos
```bash
# Crear backup
docker-compose exec postgres pg_dump -U postgres parcial1sw1 > backup_$(date +%Y%m%d_%H%M%S).sql

# Restaurar backup
cat backup.sql | docker-compose exec -T postgres psql -U postgres -d parcial1sw1
```

### Backup de Certificados SSL
```bash
# Los certificados están en:
./certbot/conf/live/uml.jkhoster.com/

# Hacer backup
tar -czf ssl_backup_$(date +%Y%m%d).tar.gz ./certbot/conf
```

---

## 🎯 Checklist de Producción

- [ ] DNS `uml.jkhoster.com` apunta a IP del servidor
- [ ] Firewall permite puertos 80 y 443
- [ ] Archivo `.env` configurado con valores de producción
- [ ] `POSTGRES_PASSWORD` es seguro (no "postgres")
- [ ] `ANTHROPIC_API_KEY` configurada (requerido)
- [ ] `CERTBOT_EMAIL` con tu email real
- [ ] Certificados SSL obtenidos de Let's Encrypt
- [ ] Nginx corriendo con HTTPS (puerto 443)
- [ ] `config.json` del frontend apunta a `https://uml.jkhoster.com/api`
- [ ] Todos los contenedores están "healthy"
- [ ] HTTPS funciona en el navegador (candado 🔒)
- [ ] API responde en `/api/health`
- [ ] WebSockets conectan correctamente
- [ ] No hay errores CORS en DevTools
- [ ] Backups automáticos configurados

---

## 📞 Soporte

Si encuentras problemas:

1. Revisa los logs: `docker-compose logs -f`
2. Verifica el estado: `docker-compose ps`
3. Consulta esta guía de troubleshooting
4. Verifica que tu dominio DNS está bien configurado: `nslookup uml.jkhoster.com`

---

**🎉 ¡Listo! Tu aplicación está en producción con SSL en `https://uml.jkhoster.com`**
