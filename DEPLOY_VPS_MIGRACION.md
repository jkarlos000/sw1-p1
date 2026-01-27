# 🚀 GUÍA DE DESPLIEGUE EN VPS CON MIGRACIÓN SEGURA

**Última actualización:** 2026-01-27  
**Versión:** 1.0  
**Estado:** Listo para Producción

---

## 📋 ÍNDICE RÁPIDO

1. [Descripción General](#descripción-general)
2. [Requisitos Previos](#requisitos-previos)
3. [Estructura de Migración](#estructura-de-migración)
4. [Paso a Paso: Migración Segura](#paso-a-paso-migración-segura)
5. [Verificación Post-Deploy](#verificación-post-deploy)
6. [Monitoreo y Mantenimiento](#monitoreo-y-mantenimiento)
7. [Troubleshooting](#troubleshooting)
8. [Rollback de Emergencia](#rollback-de-emergencia)

---

## 🎯 Descripción General

Esta guía documenta cómo desplegar la **versión actualizada con Flutter Screens** en un VPS que ya tiene:

✅ **Base de datos PostgreSQL** en ejecución  
✅ **Certificado SSL** instalado  
✅ **Docker Compose** configurado  
✅ **Datos históricos** que deben preservarse

### Cambios Principales en Esta Versión

```
ANTES                          DESPUÉS
═════════════════════════════════════════════
- 10 tablas UML                - 12 tablas (+ flutter_screen, flutter_component)
- Sin pantallas Flutter        - Pantallas Flutter automáticas
- Soporte para diagrama UML    - Generación de código Flutter
- Sin migraciones log          - Tabla migration_log para auditoría
```

---

## ✅ Requisitos Previos

### En el VPS

```bash
# Verificar Docker
docker --version        # v20.10+
docker-compose --version  # v2.0+

# Verificar PostgreSQL
docker ps | grep postgres  # Debe estar corriendo

# Verificar SSL
ls -la /etc/letsencrypt/live/uml.jkhoster.com/  # O tu dominio

# Verificar permisos
whoami                  # Debe ser 'root' o estar en grupo 'docker'
```

### En tu máquina local

```bash
# Git
git --version          # v2.0+

# Node.js (para compilación backend)
node --version         # v18+
npm --version          # v9+
```

---

## 🔄 Estructura de Migración

### Archivos Principales

```
backend-p1sw1/database/
├── schema.sql                     ← Schema base (TODAS las tablas)
├── seed.sql                       ← Datos de inicialización
├── migration-flutter-screens.sql  ← NUEVO: Migración segura
├── backup-vps.sh                  ← NUEVO: Script de backup
├── rollback-flutter.sh            ← NUEVO: Script de rollback
└── tests/                         ← Queries de debugging
    ├── flutter-debugging.sql
    ├── flutter-diagnostico.sql
    ├── migration-flutter-screens.sql
    └── README.md
```

### Orden de Ejecución en Docker

```
docker-entrypoint-initdb.d/ se ejecuta en orden:
1️⃣  01-schema.sql                    ← Crea todas las tablas base
2️⃣  02-seed.sql                      ← Inserta datos de inicialización
3️⃣  03-migration-flutter.sql         ← Añade nuevas tablas (SEGURO)
```

**Importante:** El script de migración usa `IF NOT EXISTS` para ser idempotente.

---

## 🔐 Paso a Paso: Migración Segura

### FASE 1: Preparación en Local (Antes de Subir)

#### 1.1 Actualizar tu rama local

```bash
# En tu máquina local
cd /ruta/al/proyecto

# Sincronizar con main
git fetch origin
git rebase origin/main

# O si prefieres merge
git merge origin/main
```

#### 1.2 Verificar que todo compila

```bash
# Backend
cd backend-p1sw1
npm install
npm run build
npm run test  # Si tienes tests

# Frontend
cd ../official-sw1p1
npm install
npm run build
```

#### 1.3 Crear backup local de la rama anterior

```bash
# En caso de que necesites revertir
git tag backup/antes-flutter-$(date +%Y%m%d-%H%M%S)
git push origin --tags
```

---

### FASE 2: Preparación en VPS (Sin Downtime)

#### 2.1 Conectar al VPS

```bash
ssh root@uml.jkhoster.com
# O tu usuario/host del VPS

# Navegar al proyecto
cd /var/www/uml-flutter
# O donde tengas el proyecto
```

#### 2.2 Hacer backup ANTES de cualquier cambio

```bash
# FUNDAMENTAL: Backup de BD actual
chmod +x backend-p1sw1/database/backup-vps.sh
./backend-p1sw1/database/backup-vps.sh

# Debería mostrar:
# ✓ Dump SQL completado: XXX MB
# ✓ Compresión completada: XXX MB
# ✓ Información de migraciones registrada

# Verificar backup
ls -lh /backups/docker-uml-flutter/ | head -5
```

#### 2.3 Verificar estado actual de BD

```bash
# Conectar a BD
docker-compose exec postgres psql -U postgres -d parcial1sw1

# En psql:
\dt                    # Ver todas las tablas (¿está flutter_screen?)
SELECT * FROM migration_log;  # Ver historial de migraciones
\q                     # Salir
```

**Si ya tiene `flutter_screen`:**
```sql
-- Entonces la migración ya se ejecutó. Ver estado:
SELECT COUNT(*) FROM flutter_screen;
SELECT COUNT(*) FROM flutter_component;
```

---

### FASE 3: Descargar Cambios en VPS

#### 3.1 Pull de cambios

```bash
# En VPS, en el directorio del proyecto
git fetch origin
git status

# Ver qué ha cambiado
git diff origin/main..HEAD

# O si estás en una rama diferente de main:
git status
git log --oneline -5
```

#### 3.2 Decidir sobre la rama

**Opción A: Actualizar actual a main**
```bash
git checkout main
git pull origin main
```

**Opción B: Crear rama de producción (Recomendado)**
```bash
# Crear rama de deployment
git checkout -b prod/flutter-screens
git pull origin main
# Esto te permite rollback fácil si necesitas
```

---

### FASE 4: Actualizar Docker Compose

#### 4.1 Detener contenedores SIN eliminar datos

```bash
# Pausar (sin eliminar volúmenes)
docker-compose down

# Verificar que postgreSQL paró
docker ps | grep postgres  # No debe aparecer

# Pero el volumen sigue intacto
docker volume ls | grep sw1-postgres-data
```

#### 4.2 Verificar cambios en docker-compose.yml

```bash
# Ver qué cambió en el archivo
git diff origin/main docker-compose.yml

# Debería mostrar:
# + - ./backend-p1sw1/database/migration-flutter-screens.sql:/docker-entrypoint-initdb.d/03-migration-flutter.sql
```

---

### FASE 5: Reiniciar con Nueva Migración

#### 5.1 Levantar contenedores (triggering migration)

```bash
# Importante: Levanta solo PostgreSQL primero
docker-compose up -d postgres

# Esperar a que inicie y ejecute migraciones (2-3 minutos)
docker-compose logs postgres | tail -50

# Ver que completed:
docker-compose logs postgres | grep -i "migration\|flutter\|complete"
```

#### 5.2 Levantar resto de servicios

```bash
# Ahora backend, frontend, nginx
docker-compose up -d backend frontend nginx

# Esperar a que compilar y arrancar (3-5 minutos)
sleep 30
docker-compose logs backend | tail -30
docker-compose logs frontend | tail -30
```

#### 5.3 Verificar toda la stack

```bash
# Ver estado
docker-compose ps

# Debe mostrar:
# NAME              STATUS
# sw1-postgres      Up (healthy)
# sw1-backend       Up (healthy)
# sw1-frontend      Up (healthy)
# sw1-nginx         Up (healthy)

# Si alguno no está healthy, ver logs:
docker-compose logs <nombre>
```

---

## ✅ Verificación Post-Deploy

### 1. Verificar Migración Ejecutada

```bash
# Conectar a BD
docker-compose exec postgres psql -U postgres -d parcial1sw1

# Verificar tablas flutter existen
\dt flutter*

# Debería mostrar:
# public | flutter_component | table | postgres
# public | flutter_screen    | table | postgres

# Verificar migración registrada
SELECT migration_name, status FROM migration_log 
WHERE migration_name LIKE '%Flutter%' 
ORDER BY executed_at DESC LIMIT 3;

# Ver historial
SELECT COUNT(*) as total_registros FROM migration_log;

\q
```

### 2. Verificar Backend Conecta a BD

```bash
# Ver logs
docker-compose logs backend | grep -i "database\|connected\|migrations"

# Debería mostrar:
# "Database connection established"
# "Migrations completed"

# Verificar puerto
curl http://localhost:3000/health
# Response: {"status":"ok"}
```

### 3. Verificar Frontend Funciona

```bash
# Check frontend
curl http://localhost/

# Debería retornar HTML (no error)

# Verificar WebSocket
curl -i http://localhost:80/socket.io/
```

### 4. Verificar SSL Funciona

```bash
# Test SSL
curl -I https://uml.jkhoster.com/

# Debería retornar 200 (o redirect 301/302 a https)
curl -I https://uml.jkhoster.com/api/health
```

### 5. Test de Datos

```bash
# Ver qué datos están en BD
docker-compose exec postgres psql -U postgres -d parcial1sw1 << EOF
SELECT 
    (SELECT COUNT(*) FROM usuario) as usuarios,
    (SELECT COUNT(*) FROM sala) as salas,
    (SELECT COUNT(*) FROM clase_uml) as clases_uml,
    (SELECT COUNT(*) FROM flutter_screen) as flutter_screens;
EOF
```

---

## 📊 Monitoreo y Mantenimiento

### Logs en Tiempo Real

```bash
# Ver todos los logs
docker-compose logs -f

# Por componente
docker-compose logs -f postgres
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f nginx

# Últimas N líneas
docker-compose logs postgres | tail -50
```

### Verificación de Salud

```bash
# Script rápido de salud
#!/bin/bash
echo "=== ESTADO DE SERVICIOS ==="
docker-compose ps

echo ""
echo "=== CONECTIVIDAD ==="
curl -s http://localhost:3000/health | jq .
curl -s http://localhost/ | head -1

echo ""
echo "=== BASE DE DATOS ==="
docker-compose exec -T postgres psql -U postgres -d parcial1sw1 -c "SELECT COUNT(*) FROM usuario;"
```

### Limpiar Logs Antiguos

```bash
# Si los logs son muy grandes
docker system prune -a --volumes

# O específicamente
docker logs --tail 1000 sw1-backend > /tmp/backend.log
docker logs sw1-backend --since 7d  # Últimos 7 días
```

---

## 🐛 Troubleshooting

### Problema 1: PostgreSQL no inicia con migración

**Síntoma:**
```
ERROR: syntax error in line X of migration-flutter-screens.sql
```

**Solución:**
```bash
# Rollback seguro
./backend-p1sw1/database/rollback-flutter.sh safe

# Ver error específico
docker-compose logs postgres | grep -A5 -B5 ERROR

# Opción: editar migración manualmente
docker-compose exec postgres psql -U postgres -d parcial1sw1 < backend-p1sw1/database/migration-flutter-screens.sql
```

### Problema 2: Backend no conecta a BD

**Síntoma:**
```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**Solución:**
```bash
# Verificar postgresql está running
docker-compose exec postgres pg_isready

# Esperar más tiempo
sleep 30
docker-compose up -d backend

# O reiniciar todo
docker-compose restart
```

### Problema 3: Frontend no ve backend

**Síntoma:**
```
CORS error / Cannot reach API
```

**Solución:**
```bash
# Verificar CORS_ORIGIN en .env
cat .env | grep CORS

# Debe ser tu dominio
CORS_ORIGIN=https://uml.jkhoster.com

# Reiniciar backend
docker-compose restart backend
```

### Problema 4: SSL/HTTPS falla

**Síntoma:**
```
SSL_ERROR_BAD_CERT_DOMAIN
```

**Solución:**
```bash
# Verificar certificados
ls -la /etc/letsencrypt/live/uml.jkhoster.com/

# Renovar si necesario
docker-compose --profile certbot run certbot renew

# O reiniciar nginx
docker-compose restart nginx
```

### Problema 5: Tablas Flutter no aparecen

**Síntoma:**
```
relation "flutter_screen" does not exist
```

**Solución:**
```bash
# Ejecutar migración manualmente
docker-compose exec postgres psql -U postgres -d parcial1sw1 << 'EOF'
\i /docker-entrypoint-initdb.d/03-migration-flutter.sql
EOF

# O verificar si ya existe
docker-compose exec postgres psql -U postgres -d parcial1sw1 -c "\dt flutter*"
```

---

## 🔄 Rollback de Emergencia

### Opción 1: Rollback Seguro (Recomendado)

```bash
# Solo revierte la migración, preserva datos
./backend-p1sw1/database/rollback-flutter.sh safe

# Verificar
docker-compose exec postgres psql -U postgres -d parcial1sw1 -c "SELECT * FROM migration_log ORDER BY executed_at DESC LIMIT 3;"
```

### Opción 2: Rollback Completo (Peligroso)

```bash
# SOLO si es necesario. Elimina TODAS las tablas flutter
./backend-p1sw1/database/rollback-flutter.sh full

# Los datos están en flutter_screen_backup y flutter_component_backup
```

### Opción 3: Restaurar desde Backup

```bash
# Ver backups disponibles
ls -lh /backups/docker-uml-flutter/

# Restaurar fecha específica
./backend-p1sw1/database/rollback-flutter.sh restore /backups/docker-uml-flutter/backup_20260127_120000.sql

# Esto:
# 1. Para contenedores
# 2. Elimina volumen postgreSQL
# 3. Restaura desde backup
# 4. Reinicia servicios
```

---

## 📅 Programación de Mantenimiento

### Backups Automáticos (Recomendado)

```bash
# Crear cron job (ejecutar como root)
sudo crontab -e

# Añadir línea:
# Backup cada día a las 2 AM
0 2 * * * /var/www/uml-flutter/backend-p1sw1/database/backup-vps.sh >> /var/log/uml-backup.log 2>&1

# Verificar
sudo crontab -l
```

### Limpiar Backups Antiguos

```bash
# El script backup-vps.sh ya limpia automáticamente
# Backups mayores a 7 días se eliminan

# O manualmente:
find /backups/docker-uml-flutter -type f -name "backup_*.sql" -mtime +7 -delete
```

### Monitoreo de Espacio en Disco

```bash
# Ver uso de disco
df -h

# Ver tamaño BD
docker-compose exec postgres psql -U postgres -d parcial1sw1 -c "SELECT pg_database.datname, pg_size_pretty(pg_database_size(pg_database.datname)) FROM pg_database ORDER BY pg_database_size(pg_database.datname) DESC;"
```

---

## 📊 Checklists

### Pre-Deploy

```
☐ Backup de BD actual hecho
☐ Git actualizado (pull de main)
☐ Backend compila
☐ Frontend compila
☐ Docker-compose.yml actualizado
☐ .env tiene variables correctas
☐ Certificado SSL existe
☐ Permisos de archivos OK
```

### Post-Deploy

```
☐ Todos los contenedores running
☐ Migraciones ejecutadas exitosamente
☐ Tablas flutter_screen y flutter_component existen
☐ BD no perdió datos históricos
☐ Backend responde a /health
☐ Frontend carga
☐ SSL funciona (https)
☐ WebSocket conecta
```

### Rollback

```
☐ Backup seguro antes de intentar rollback
☐ Usar opción 'safe' primero
☐ Verificar datos no se perdieron
☐ Reiniciar servicios después
☐ Documentar qué pasó
```

---

## 📞 Soporte

### Si algo sale mal:

1. **Ver logs:**
   ```bash
   docker-compose logs <servicio>
   ```

2. **Conectar a BD:**
   ```bash
   docker-compose exec postgres psql -U postgres -d parcial1sw1
   ```

3. **Restore desde backup:**
   ```bash
   ./backend-p1sw1/database/rollback-flutter.sh restore <archivo>
   ```

4. **Documentar el error:**
   - Guardar logs en `/var/log/uml-deploy-error-FECHA.log`
   - Incluir salida de `docker-compose ps`
   - Incluir salida de `docker-compose logs`

---

## 🎉 ¡Listo!

Si todo está ✅ en Verificación Post-Deploy, tu deploy fue exitoso.

**Ahora puedes:**
- ✅ Crear diagramas UML
- ✅ Generar pantallas Flutter automáticamente
- ✅ Usar chat con IA
- ✅ Colaboración en tiempo real
- ✅ Todo con datos históricos preservados

---

**Última actualización:** 2026-01-27  
**Versión:** 1.0 Production Ready  
**Autor:** Sistema de Documentación Automático
