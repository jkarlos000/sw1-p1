# 🚀 Guía de Desarrollo Local

## Requisitos Previos
- Node.js 20+
- PostgreSQL 16
- Git

---

## 🔧 Configuración Inicial (Solo Primera Vez)

### 1. Clonar repositorio
```bash
git clone https://github.com/jkarlos000/sw1-p1.git
cd sw1-p1
```

### 2. Configurar Base de Datos

#### Opción A: Con Docker (Recomendada)
```bash
# Levantar solo PostgreSQL
docker-compose up -d postgres

# Verificar que esté corriendo
docker ps | grep postgres
```

#### Opción B: PostgreSQL Local
```bash
# Crear base de datos
psql -U postgres
CREATE DATABASE parcial1sw1;
\q

# Ejecutar schema y seed
psql -U postgres -d parcial1sw1 -f backend-p1sw1/database/schema.sql
psql -U postgres -d parcial1sw1 -f backend-p1sw1/database/seed.sql
```

### 3. Backend - Instalar dependencias
```bash
cd backend-p1sw1
npm install

# Verificar que .env esté configurado para desarrollo
cat .env | grep "DB_HOST\|PORT"
# Debe mostrar:
# DB_HOST=localhost
# PORT=3000
```

### 4. Frontend - Instalar dependencias
```bash
cd ../official-sw1p1
npm install

# Verificar configuración de desarrollo
cat src/environments/environment.ts
# Debe mostrar:
# apiUrl: 'http://localhost:3000'
# wsUrl: 'http://localhost:3000'
```

---

## ▶️ Ejecutar en Modo Desarrollo

### Terminal 1: Backend
```bash
cd backend-p1sw1
npm run dev

# Debe mostrar:
# 🚀 Servidor corriendo en puerto 3000
# ✅ Conectado a PostgreSQL
```

### Terminal 2: Frontend
```bash
cd official-sw1p1
ng serve

# Debe mostrar:
# ✔ Browser application bundle generation complete.
# Local:   http://localhost:4200/
```

### Abrir navegador
```
http://localhost:4200
```

**Verificar en consola del navegador:**
```
✅ Configuración cargada desde environment:
   - Modo: DESARROLLO
   - API: http://localhost:3000
   - WebSocket: http://localhost:3000
```

---

## 🔍 Verificación de Configuración

### Backend corriendo correctamente
```bash
curl http://localhost:3000
# Respuesta: {"message": "API funcionando"} o similar
```

### Frontend conectando al backend
```bash
# En DevTools → Network:
# Debe ver peticiones a http://localhost:3000/api/...
# NO debe ver peticiones a https://uml.jkhoster.com
```

### Socket.IO funcionando
```bash
# En DevTools → Console:
# Debe mostrar: ✅ Socket.IO configurado para: http://localhost:3000
# NO debe mostrar errores de WebSocket
```

---

## 📦 Estructura de URLs

| Servicio | Desarrollo Local | Producción (Docker) |
|----------|------------------|---------------------|
| Frontend | http://localhost:4200 | https://uml.jkhoster.com |
| Backend API | http://localhost:3000 | https://uml.jkhoster.com/api |
| WebSocket | http://localhost:3000 | https://uml.jkhoster.com |
| PostgreSQL | localhost:5432 | postgres:5432 (Docker) |

---

## 🐛 Troubleshooting

### Backend no inicia
```bash
# Verificar PostgreSQL
docker ps | grep postgres  # Si usas Docker
# O
psql -U postgres -l  # Si es local

# Ver logs del backend
cd backend-p1sw1
npm run dev

# Error común: Puerto 3000 ocupado
# Solución: Matar proceso
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### Frontend no conecta al backend
```bash
# 1. Verificar que backend esté corriendo
curl http://localhost:3000

# 2. Verificar environment.ts
cat official-sw1p1/src/environments/environment.ts

# 3. Reiniciar ng serve
# Ctrl+C en la terminal del frontend
ng serve
```

### Error "Cannot connect to database"
```bash
# Verificar .env del backend
cd backend-p1sw1
cat .env | grep DB_

# Debe ser:
# DB_HOST=localhost  (NO 'postgres')
# DB_PORT=5432
# DB_NAME=parcial1sw1
# DB_USER=postgres
# DB_PASSWORD=12345
```

### Socket.IO errors
```bash
# En consola del navegador, si ves:
# "GET http://localhost:3000/socket.io/ 404"

# Solución:
# 1. Verificar backend corriendo
# 2. Reiniciar frontend (ng serve)
# 3. Hard refresh: Ctrl+Shift+R
```

---

## 🔄 Flujo de Trabajo Diario

### Iniciar desarrollo
```bash
# Terminal 1: Backend
cd backend-p1sw1
npm run dev

# Terminal 2: Frontend
cd official-sw1p1
ng serve
```

### Hacer cambios
```bash
# Backend: Nodemon recarga automáticamente
# Frontend: ng serve recarga automáticamente

# Solo reinicia si cambias:
# - environment.ts
# - app.config.ts
# - Archivos de configuración
```

### Probar cambios
```bash
# 1. Abre http://localhost:4200
# 2. Haz tus pruebas
# 3. Revisa consola del navegador
# 4. Revisa logs del backend en terminal
```

### Commit cambios
```bash
git add .
git commit -m "feat: descripción del cambio"
git push
```

---

## 🚢 Deploy a Producción (VPS)

```bash
# En tu máquina local:
git push

# En el servidor (SSH):
ssh root@vmi2832482
cd /home/sw1/jk
git pull
docker-compose build frontend backend
docker-compose up -d
docker-compose logs -f frontend backend
```

---

## 📝 Variables de Entorno

### Backend (.env)
```env
# Desarrollo Local
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=parcial1sw1
DB_USER=postgres
DB_PASSWORD=12345
CORS_ORIGIN=http://localhost:4200
ANTHROPIC_API_KEY=tu-api-key

# Producción (docker-compose.yml)
PORT=3000
DB_HOST=postgres
DB_PORT=5432
DB_NAME=parcial1sw1
DB_USER=postgres
DB_PASSWORD=postgres_prod_password
CORS_ORIGIN=https://uml.jkhoster.com
```

### Frontend (environments)
```typescript
// Desarrollo: environment.ts
{
  production: false,
  apiUrl: 'http://localhost:3000',
  wsUrl: 'http://localhost:3000'
}

// Producción: environment.prod.ts
{
  production: true,
  apiUrl: 'https://uml.jkhoster.com/api',
  wsUrl: 'https://uml.jkhoster.com'
}
```

---

## 🎯 Checklist de Desarrollo

Antes de hacer push:

- [ ] Backend corre sin errores
- [ ] Frontend carga correctamente
- [ ] No hay errores en consola del navegador
- [ ] Socket.IO conecta correctamente
- [ ] Cambios probados localmente
- [ ] Commit con mensaje descriptivo
- [ ] Push a GitHub

---

**Última actualización:** 25 enero 2026  
**Versión:** 1.0 (Sistema de Environments)
