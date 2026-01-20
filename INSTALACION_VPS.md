# 🚀 Instalación VPS - Modo Desarrollo (Sin Docker)

## 📋 Pre-requisitos del Sistema

### 1. **Node.js y npm**
```bash
# Verificar si está instalado
node --version
npm --version

# Si no está instalado (Ubuntu/Debian):
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Si no está instalado (CentOS/RHEL):
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
sudo yum install -y nodejs
```

---

## 🌍 Paquetes Globales Necesarios

### Backend (Obligatorios)

#### 1. **TypeScript Compiler**
```bash
npm install -g typescript
```
- **¿Por qué?** Para compilar TypeScript a JavaScript
- **Versión del proyecto:** ~5.5.4
- **Comando de verificación:** `tsc --version`

#### 2. **ts-node**
```bash
npm install -g ts-node
```
- **¿Por qué?** Para ejecutar archivos TypeScript directamente sin compilar
- **Usado en:** `npm start` y `npm run dev`
- **Comando de verificación:** `ts-node --version`

#### 3. **nodemon**
```bash
npm install -g nodemon
```
- **¿Por qué?** Auto-reinicio del servidor cuando detecta cambios en archivos
- **Usado en:** Scripts de desarrollo (`npm start`, `npm run dev`)
- **Comando de verificación:** `nodemon --version`

### Frontend (Obligatorios)

#### 4. **Angular CLI**
```bash
npm install -g @angular/cli
```
- **¿Por qué?** CLI de Angular para ejecutar `ng serve`, `ng build`, etc.
- **Versión del proyecto:** ^18.2.6
- **Comando de verificación:** `ng version`

---

## 🔧 Instalación Completa en Una Línea

```bash
npm install -g typescript ts-node nodemon @angular/cli
```

---

## 📦 Dependencias de Proyecto (Locales)

### Backend
```bash
cd backend-p1sw1
npm install
```

**Dependencias principales:**
- express - Servidor HTTP
- socket.io - WebSockets
- pg - Cliente PostgreSQL
- @anthropic-ai/sdk - API de Claude AI
- multer - Subida de archivos
- cors - CORS
- dotenv - Variables de entorno

### Frontend
```bash
cd official-sw1p1
npm install
```

**Dependencias principales:**
- @angular/core - Framework Angular
- ngx-socket-io - Cliente WebSockets
- @joint/plus - Diagramas UML
- tailwindcss - Estilos

---

## 🗄️ Base de Datos PostgreSQL

### Instalación de PostgreSQL
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install postgresql postgresql-contrib

# CentOS/RHEL
sudo yum install postgresql-server postgresql-contrib
sudo postgresql-setup initdb
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### Configuración de Base de Datos
```bash
# Acceder a PostgreSQL
sudo -u postgres psql

# Crear base de datos y usuario
CREATE DATABASE uml_ficct;
CREATE USER uml_user WITH PASSWORD 'tu_password_seguro';
GRANT ALL PRIVILEGES ON DATABASE uml_ficct TO uml_user;
\q
```

### Ejecutar Schema
```bash
cd backend-p1sw1/database
psql -U uml_user -d uml_ficct -f schema-completo.sql
psql -U uml_user -d uml_ficct -f seed-completo.sql
```

---

## ⚙️ Variables de Entorno

### Backend - Crear archivo `.env`
```bash
cd backend-p1sw1
nano .env
```

**Contenido del .env:**
```env
# Servidor
PORT=8080

# Base de Datos PostgreSQL
DB_HOST=localhost
DB_PORT=5432
DB_NAME=uml_ficct
DB_USER=uml_user
DB_PASSWORD=tu_password_seguro

# API de Anthropic Claude
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxxxxxxxxxx

# Configuración de subida de archivos
MAX_FILE_SIZE=10485760
UPLOAD_PATH=./uploads

# CORS
CORS_ORIGIN=http://localhost:4200
```

### Frontend - Actualizar environment
```bash
cd official-sw1p1/src/environments
nano environment.ts
```

**Actualizar URLs:**
```typescript
export const environment = {
  production: false,
  apiUrl: 'http://TU_IP_VPS:8080',
  socketUrl: 'http://TU_IP_VPS:8080'
};
```

---

## 🚀 Ejecutar en Modo Desarrollo

### Terminal 1: Backend
```bash
cd backend-p1sw1
npm start
# O alternativamente:
# npm run dev
```

### Terminal 2: Frontend
```bash
cd official-sw1p1
npm start
# O alternativamente:
# ng serve --host 0.0.0.0 --port 4200
```

---

## 🔒 Opcional: PM2 para Producción

### Instalar PM2
```bash
npm install -g pm2
```

### Ejecutar Backend con PM2
```bash
cd backend-p1sw1
pm2 start npm --name "uml-backend" -- start
pm2 save
pm2 startup
```

### Ejecutar Frontend con PM2
```bash
cd official-sw1p1
pm2 start npm --name "uml-frontend" -- start
pm2 save
```

### Comandos útiles de PM2
```bash
pm2 list              # Ver procesos
pm2 logs              # Ver logs
pm2 restart all       # Reiniciar todos
pm2 stop all          # Detener todos
pm2 delete all        # Eliminar todos
pm2 monit             # Monitor en tiempo real
```

---

## 🔥 Firewall (Opcional pero Recomendado)

```bash
# Permitir puertos necesarios
sudo ufw allow 8080/tcp   # Backend
sudo ufw allow 4200/tcp   # Frontend (desarrollo)
sudo ufw allow 80/tcp     # HTTP
sudo ufw allow 443/tcp    # HTTPS
sudo ufw allow 5432/tcp   # PostgreSQL (solo si es remoto)
sudo ufw enable
```

---

## ✅ Verificación Final

### 1. Verificar paquetes globales
```bash
node --version          # v20.x.x o superior
npm --version           # 10.x.x o superior
typescript --version    # 5.x.x
ts-node --version       # 10.x.x
nodemon --version       # 3.x.x
ng version              # 18.x.x
```

### 2. Verificar servicios
```bash
# Backend
curl http://localhost:8080

# Frontend
curl http://localhost:4200

# PostgreSQL
psql -U uml_user -d uml_ficct -c "SELECT version();"
```

---

## 📝 Resumen de Comandos

```bash
# 1. Instalar paquetes globales
npm install -g typescript ts-node nodemon @angular/cli

# 2. Clonar o copiar proyecto al VPS
# (usa git clone, scp, rsync, etc.)

# 3. Instalar dependencias backend
cd backend-p1sw1
npm install

# 4. Instalar dependencias frontend
cd ../official-sw1p1
npm install

# 5. Configurar .env en backend

# 6. Configurar base de datos PostgreSQL
sudo -u postgres psql
CREATE DATABASE uml_ficct;
CREATE USER uml_user WITH PASSWORD 'password';
GRANT ALL PRIVILEGES ON DATABASE uml_ficct TO uml_user;
\q

# 7. Ejecutar schema
cd backend-p1sw1/database
psql -U uml_user -d uml_ficct -f schema-completo.sql

# 8. Ejecutar backend
cd ..
npm start

# 9. Ejecutar frontend (en otra terminal)
cd ../official-sw1p1
npm start
```

---

## 🐛 Troubleshooting

### Error: "command not found: tsc"
```bash
npm install -g typescript
# O agregar al PATH: export PATH=$PATH:$(npm get prefix)/bin
```

### Error: "EACCES: permission denied"
```bash
# Opción 1: Usar sudo (no recomendado)
sudo npm install -g typescript ts-node nodemon @angular/cli

# Opción 2: Configurar npm prefix (recomendado)
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc
source ~/.bashrc
npm install -g typescript ts-node nodemon @angular/cli
```

### Error: "Port already in use"
```bash
# Ver qué está usando el puerto
lsof -i :8080
# O
netstat -tulpn | grep 8080

# Matar el proceso
kill -9 <PID>
```

### Error: PostgreSQL connection refused
```bash
# Verificar que PostgreSQL esté corriendo
sudo systemctl status postgresql

# Reiniciar PostgreSQL
sudo systemctl restart postgresql

# Verificar configuración en pg_hba.conf
sudo nano /etc/postgresql/*/main/pg_hba.conf
# Agregar: host all all 0.0.0.0/0 md5
```

---

## 📊 Monitoreo

```bash
# Ver logs en tiempo real
tail -f ~/.pm2/logs/uml-backend-out.log
tail -f ~/.pm2/logs/uml-backend-error.log

# Ver uso de recursos
htop

# Ver conexiones activas
netstat -an | grep :8080
```

---

## 🎯 Checklist Final

- [ ] Node.js y npm instalados
- [ ] Paquetes globales instalados (typescript, ts-node, nodemon, @angular/cli)
- [ ] PostgreSQL instalado y configurado
- [ ] Base de datos creada con schema y seed
- [ ] Archivo .env configurado en backend
- [ ] Environments configurados en frontend
- [ ] Backend corriendo en puerto 8080
- [ ] Frontend corriendo en puerto 4200
- [ ] Firewall configurado (si aplica)
- [ ] PM2 configurado (opcional)

---

¡Listo! Tu proyecto debería estar corriendo en modo desarrollo en el VPS. 🚀
