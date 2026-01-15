# 🐳 Despliegue Docker - SW1 Project

## 📋 Requisitos Previos

- Docker Engine 20.10+
- Docker Compose 2.0+
- Al menos 2GB de RAM disponible
- Puertos 80, 3000 y 5432 disponibles

## 🚀 Inicio Rápido

### 1. Configurar Variables de Entorno

```bash
# Copiar archivo de ejemplo
cp .env.example .env

# Editar con tus valores
nano .env
```

**Importante:** Cambiar `POSTGRES_PASSWORD` por una contraseña segura.

### 2. Actualizar Configuración del Frontend

Editar `official-sw1p1/src/environments/environment.prod.ts`:

```typescript
export const environment = {
  production: true,
  apiUrl: 'http://YOUR_VPS_IP:3000'  // Cambiar por la IP de tu VPS
};
```

### 3. Actualizar Configuración de Base de Datos

Editar `backend-p1sw1/database/config.ts`:

```typescript
export const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 5432,
    database: process.env.DB_NAME || 'sw1_database',
    user: process.env.DB_USER || 'sw1_user',
    password: process.env.DB_PASSWORD || 'your_password',
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});
```

### 4. Construir y Levantar Servicios

```bash
# Construir imágenes
docker-compose build

# Levantar todos los servicios
docker-compose up -d

# Ver logs
docker-compose logs -f
```

## 📦 Servicios Incluidos

| Servicio | Puerto | Descripción |
|----------|--------|-------------|
| **Frontend** | 80 | Angular con Nginx |
| **Backend** | 3000 | Node.js + Socket.IO |
| **PostgreSQL** | 5432 | Base de datos |

## 🔧 Comandos Útiles

### Ver Estado de Servicios
```bash
docker-compose ps
```

### Ver Logs
```bash
# Todos los servicios
docker-compose logs -f

# Solo backend
docker-compose logs -f backend

# Solo frontend
docker-compose logs -f frontend
```

### Reiniciar Servicios
```bash
# Todos
docker-compose restart

# Uno específico
docker-compose restart backend
```

### Detener Servicios
```bash
# Detener sin eliminar
docker-compose stop

# Detener y eliminar contenedores
docker-compose down

# Detener, eliminar y limpiar volúmenes
docker-compose down -v
```

### Ejecutar Comandos en Contenedores
```bash
# Entrar al backend
docker-compose exec backend sh

# Entrar a PostgreSQL
docker-compose exec postgres psql -U sw1_user -d sw1_database

# Ver tablas en la BD
docker-compose exec postgres psql -U sw1_user -d sw1_database -c "\dt"
```

## 🔐 Seguridad en Producción

### 1. Configurar Firewall
```bash
# Permitir solo puertos necesarios
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 22/tcp
sudo ufw enable
```

### 2. Usar HTTPS (Recomendado)

Agregar servicio de Nginx reverse proxy con SSL:

```yaml
# Agregar en docker-compose.yml
  nginx-proxy:
    image: nginx:alpine
    ports:
      - "443:443"
    volumes:
      - ./nginx-ssl.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - frontend
```

### 3. Cambiar Contraseñas
- PostgreSQL: En archivo `.env`
- Usuario admin: En la base de datos

### 4. Configurar CORS Restrictivo
```env
# En .env
CORS_ORIGIN=https://tudominio.com
```

## 📊 Monitoreo

### Health Checks
```bash
# Backend
curl http://localhost:3000/health

# Frontend
curl http://localhost/

# PostgreSQL
docker-compose exec postgres pg_isready
```

### Recursos del Sistema
```bash
# Ver uso de recursos
docker stats

# Ver espacio en disco
docker system df
```

## 🔄 Actualización

### Actualizar Código
```bash
# En tu máquina de desarrollo
git pull origin main

# En el VPS
git pull origin main
docker-compose build
docker-compose up -d
```

### Backup de Base de Datos
```bash
# Crear backup
docker-compose exec postgres pg_dump -U sw1_user sw1_database > backup_$(date +%Y%m%d).sql

# Restaurar backup
cat backup_20260115.sql | docker-compose exec -T postgres psql -U sw1_user -d sw1_database
```

## 🐛 Troubleshooting

### El Backend no se conecta a PostgreSQL
```bash
# Verificar que postgres esté corriendo
docker-compose ps postgres

# Ver logs de conexión
docker-compose logs postgres | grep "database system is ready"

# Verificar variables de entorno
docker-compose exec backend env | grep DB_
```

### El Frontend no carga
```bash
# Verificar logs de nginx
docker-compose logs frontend

# Verificar archivos compilados
docker-compose exec frontend ls -la /usr/share/nginx/html
```

### Error de permisos en PostgreSQL
```bash
# Eliminar volumen y recrear
docker-compose down -v
docker-compose up -d
```

### Puerto ya en uso
```bash
# Ver qué está usando el puerto
sudo lsof -i :3000
sudo lsof -i :80

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
│       ├── schema.sql          # Estructura de BD (auto-ejecutado)
│       └── seed.sql            # Datos iniciales (auto-ejecutado)
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
