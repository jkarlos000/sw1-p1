# 🐳 ACTUALIZAR CONTENEDORES CON NUEVOS CAMBIOS

**Última actualización:** 2026-01-27

---

## 📌 SITUACIÓN

✅ BD actualizada con Flutter Screens  
✅ Código en Git con nuevos cambios  
❌ **Contenedores todavía usan imágenes viejas**  
❌ **Frontend/Backend sin los nuevos features**

El sitio web muestra la versión antigua porque los contenedores no se reconstruyeron con el código nuevo.

---

## 🔧 SOLUCIÓN: REBUILD DE CONTENEDORES

### OPCIÓN A: Rebuild Rápido (RECOMENDADO)

```bash
cd /home/sw1/jk

# 1. Detener contenedores (pero mantener volúmenes de BD)
docker-compose down

# 2. Reconstruir e iniciar con un comando
docker-compose up -d --build

# 3. Esperar a que se inicien
sleep 10

# 4. Verificar estado
docker-compose ps
# Todos deben estar "Up (healthy)"
```

**Tiempo:** ~3-5 minutos  
**Downtime:** ~2-3 minutos  
**Datos:** ✅ BD preservada

---

### OPCIÓN B: Rebuild Granular (Más control)

```bash
cd /home/sw1/jk

# 1. Ver imágenes actuales
docker images | grep -E "official-sw1p1|backend-p1sw1"

# 2. Eliminar imágenes viejas (opcionalmente)
docker rmi $(docker images -q jk_backend:latest) 2>/dev/null || echo "Backend image no encontrado"
docker rmi $(docker images -q jk_frontend:latest) 2>/dev/null || echo "Frontend image no encontrado"

# 3. Detener contenedores
docker-compose down

# 4. Reconstruir solo backend
docker-compose build backend

# 5. Reconstruir solo frontend
docker-compose build frontend

# 6. Iniciar todos
docker-compose up -d

# 7. Verificar
docker-compose ps
```

**Tiempo:** ~5-7 minutos  
**Downtime:** ~3-4 minutos  
**Ventaja:** Ves qué se está recompilando

---

### OPCIÓN C: Rebuild Sin Caché (Para problemas)

```bash
cd /home/sw1/jk

# Rebuild sin usar caché (limpia completamente)
docker-compose down
docker-compose build --no-cache backend frontend
docker-compose up -d

# Esto toma más tiempo pero garantiza build limpio
```

**Tiempo:** ~10-15 minutos  
**Para usar:** Si Opción A falla

---

## ✅ VERIFICACIÓN POST-REBUILD

### 1. Estado de Contenedores
```bash
docker-compose ps
# Esperado: 4 contenedores "Up (healthy)"
#   - postgres: Up (healthy)
#   - backend: Up (healthy)
#   - frontend: Up (healthy)
#   - nginx: Up (healthy)
```

### 2. Backend está compilado
```bash
docker-compose logs backend | grep -E "listening|started|ready|error"
# Debe mostrar algo como: "Server listening on port 3000"
```

### 3. Frontend está compilado
```bash
docker-compose logs frontend | grep -E "compiled|built|ready|error"
# Debe mostrar que compiló exitosamente
```

### 4. Ver imágenes nuevas
```bash
docker images | head -10
# Debe mostrar timestamps recientes para backend y frontend
```

### 5. Conectividad con BD
```bash
docker-compose exec backend npm run test:db
# O verificar manualmente:
docker-compose exec postgres psql -U postgres -d parcial1sw1 -c "SELECT COUNT(*) FROM flutter_screen;"
```

### 6. Probar en navegador
```bash
# HTTPS
curl -k https://uml.jkhoster.com/

# Ver que devuelve HTML con los nuevos cambios
# Busca evidencia de Flutter Screens en el HTML
```

---

## 🔍 VERIFICAR QUE TIENE LOS NUEVOS CAMBIOS

### En Terminal

```bash
# Ver si la BD tiene las tablas Flutter
docker-compose exec postgres psql -U postgres -d parcial1sw1 -c "\dt" | grep flutter

# Debe mostrar:
#   flutter_screen
#   flutter_component
```

### En el Navegador

1. Abre: `https://uml.jkhoster.com`
2. Crea una clase UML
3. En el menú, busca opción **"Generar Pantalla Flutter"** (o similar)
4. Si aparece → ✅ Tiene los cambios
5. Si NO aparece → ❌ Contenedor todavía es viejo

---

## ⚠️ PROBLEMAS COMUNES

### "Port already in use"
```bash
# Verificar puertos
docker-compose ps

# Si algo está en estado "Exited", eliminarlo
docker-compose rm -f <nombre_servicio>

# Reintentar
docker-compose up -d --build
```

### "Build failed - dependency error"
```bash
# Limpiar dependencias
docker-compose down
rm -rf backend-p1sw1/node_modules official-sw1p1/node_modules

# Rebuild
docker-compose up -d --build
```

### Frontend muestra código viejo
```bash
# Limpiar caché del navegador
# Chrome: Ctrl+Shift+Delete

# O reconstruir sin caché
docker-compose down
docker-compose build --no-cache frontend
docker-compose up -d
```

### Backend conecta pero BD no
```bash
# Verificar que BD tiene datos
docker-compose exec postgres psql -U postgres -d parcial1sw1 -c "\dt"

# Si está vacío, ejecutar seed
docker-compose exec postgres psql -U postgres -d parcial1sw1 < backend-p1sw1/database/seed.sql
```

---

## 📊 TIMELINE COMPLETO

```
Minuto 0:    docker-compose down (para contenedores viejos)
Minuto 0-3:  docker-compose up --build (compila nuevo código)
  ├─ Backend compila (2 min)
  ├─ Frontend compila (1-2 min)
  └─ Nginx y Postgres se inician (10 seg)
Minuto 3:    docker-compose ps (todos "Up")
Minuto 4:    curl https://uml.jkhoster.com (responde)
Minuto 5:    ✅ ONLINE CON NUEVOS CAMBIOS

Total downtime: ~3-5 minutos
```

---

## 🚀 PROCEDIMIENTO COMPLETO (BD + Contenedores)

Si necesitas hacer TODO de una vez (BD limpia + código nuevo):

```bash
cd /home/sw1/jk

# 1. Actualizar código
git pull origin feature/flutter-mockup-generator

# 2. Iniciar downtime
docker-compose down

# 3. Eliminar BD vieja
docker volume rm $(docker volume ls -q | grep postgres)

# 4. Reconstruir e iniciar TODO
docker-compose up -d --build postgres
sleep 180

# 5. Crear BD limpia
docker-compose exec postgres psql -U postgres -d parcial1sw1 < backend-p1sw1/database/schema.sql
docker-compose exec postgres psql -U postgres -d parcial1sw1 < backend-p1sw1/database/seed.sql

# 6. Iniciar servicios (con compilación)
docker-compose up -d --build

# 7. Esperar compilación
sleep 60

# 8. Verificar
docker-compose ps
curl -k https://uml.jkhoster.com/api/health
```

---

## 🎯 CHECKLIST

```
PRE-REBUILD:
☐ Código está en rama feature/flutter-mockup-generator
☐ git pull ejecutado
☐ Backup de BD existe
☐ Todos notificados del downtime

DURANTE REBUILD:
☐ docker-compose down (sin -v, para mantener BD)
☐ docker-compose up -d --build
☐ Esperar 3-5 minutos
☐ docker-compose ps muestra todos "Up"

POST-REBUILD:
☐ curl https://uml.jkhoster.com/api/health retorna 200
☐ Frontend carga sin errores
☐ BD tiene tablas flutter_screen y flutter_component
☐ Navegador NO muestra versión vieja
☐ Logs sin errores críticos (docker-compose logs)
```

---

## 📝 NOTAS IMPORTANTES

### docker-compose up -d --build

- `up` = Iniciar contenedores
- `-d` = Detached mode (en background)
- `--build` = Reconstruir imágenes antes de iniciar

Sin `--build`, Docker reutiliza las imágenes viejas.

### Diferencia entre:

```bash
# ESTO NO RECONSTRUYE:
docker-compose up -d
# ↑ Usa imágenes existentes

# ESTO SÍ RECONSTRUYE:
docker-compose up -d --build
# ↑ Compila Dockerfile nuevamente

# ESTO FUERZA RECONSTRUCCIÓN:
docker-compose build --no-cache backend frontend
docker-compose up -d
# ↑ Borra caché de Docker
```

---

## 🔗 DOCUMENTACIÓN RELACIONADA

- [VPS_CLEAN_INSTALL.md](VPS_CLEAN_INSTALL.md) - BD limpia
- [DEPLOY_VPS_MIGRACION.md](DEPLOY_VPS_MIGRACION.md) - Deployment inicial
- `docker-compose.yml` - Configuración de servicios

---

¡Rebuild completado! Ahora tienes el código nuevo compilado en los contenedores. 🚀
