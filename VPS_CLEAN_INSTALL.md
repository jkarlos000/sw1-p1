# 🔄 INSTALACIÓN LIMPIA DE BASE DE DATOS EN VPS

**Última actualización:** 2026-01-27

---

## ⚠️ ADVERTENCIA IMPORTANTE

Este procedimiento:
- **Elimina TODOS los datos** de la base de datos
- **Crea tablas nuevas** con schema.sql (incluyendo Flutter Screens)
- **Inserta datos de prueba** con seed.sql
- Genera un **downtime de ~5 minutos**

**No se puede recuperar datos después de esto a menos que tengas backup.**

---

## 📋 REQUISITOS

✅ Backup reciente de la BD (hecho anteriormente)  
✅ docker-compose corriendo  
✅ Acceso SSH al VPS  
✅ Git actualizado en VPS (`feature/flutter-mockup-generator`)

---

## 🚀 PROCEDIMIENTO DE INSTALACIÓN LIMPIA

### PASO 1: Actualizar código en VPS (Sin downtime aún)

```bash
cd /home/sw1/jk

# Verificar que estás en la rama correcta
git branch -v
# Debe mostrar: * feature/flutter-mockup-generator

# Actualizar
git fetch origin
git pull origin feature/flutter-mockup-generator

# Verificar que los archivos SQL están presentes
ls -la backend-p1sw1/database/
# Debe mostrar: schema.sql, seed.sql, drop-tables.sql
```

### PASO 2: INICIAR DOWNTIME (Detener servicios)

```bash
cd /home/sw1/jk

# Mostrar estado actual
docker-compose ps

# Detener TODOS los contenedores (pero NO eliminar volúmenes)
docker-compose down

# Verificar que están detenidos
docker-compose ps
# Debe estar vacío
```

**⏱️ Downtime inicia aquí (~5 minutos)**

### PASO 3: Eliminar base de datos y volúmenes

⚠️ **PUNTO DE NO RETORNO - Ejecuta SOLO si estás 100% seguro**

```bash
# Opción A: Eliminar solo los datos (mantener volumen)
docker volume rm $(docker volume ls -q | grep postgres)

# Opción B: Limpiar TODO (más agresivo)
docker-compose down -v

# Verificar que se eliminó
docker volume ls | grep postgres
# No debe mostrar nada
```

### PASO 4: Crear base de datos nueva

```bash
# Iniciar solo PostgreSQL
docker-compose up -d postgres

# Esperar a que PostgreSQL esté listo (2-3 minutos)
echo "Esperando PostgreSQL..."
sleep 30
docker-compose logs postgres | tail -20

# Verificar que está ready
docker-compose exec postgres pg_isready -U postgres
# Debe mostrar: accepting connections
```

### PASO 5: Ejecutar schema + seed

```bash
# Crear estructura de tablas
echo "Creando schema..."
docker-compose exec postgres psql -U postgres -d parcial1sw1 < backend-p1sw1/database/schema.sql

# Esperar un momento
sleep 2

# Insertar datos de prueba
echo "Insertando datos de prueba..."
docker-compose exec postgres psql -U postgres -d parcial1sw1 < backend-p1sw1/database/seed.sql

# Esperar a que termine
sleep 2

# Verificar tablas creadas
docker-compose exec postgres psql -U postgres -d parcial1sw1 -c '\dt'
# Debe mostrar 15 tablas:
#   - usuario, sala, asistencia
#   - conversacion_ia, mensaje_chat_ia, snapshot_diagrama, config_ia
#   - mensaje_attachment, clase_uml, atributo_clase, metodo_clase
#   - parametro_metodo, flutter_screen, flutter_component
```

### PASO 6: Iniciar servicios (Fin del downtime)

```bash
# Iniciar backend y frontend
docker-compose up -d backend frontend nginx

# Esperar a que se inicien
sleep 10

# Verificar estado
docker-compose ps
# Todos deben estar "Up (healthy)"
```

**✅ Downtime finalizado (~5 minutos totales)**

### PASO 7: Verificación post-instalación

```bash
# 1. Ver número de tablas
docker-compose exec postgres psql -U postgres -d parcial1sw1 -c "SELECT COUNT(*) as total_tablas FROM information_schema.tables WHERE table_schema = 'public';"
# Debe mostrar: 15

# 2. Ver triggers Flutter
docker-compose exec postgres psql -U postgres -d parcial1sw1 -c "SELECT * FROM information_schema.triggers WHERE trigger_schema = 'public' AND trigger_name LIKE '%flutter%';"
# Debe mostrar: trigger_actualizar_fecha_flutter_screen

# 3. Ver datos de prueba insertados
docker-compose exec postgres psql -U postgres -d parcial1sw1 -c "
  SELECT 
    (SELECT COUNT(*) FROM usuario) as usuarios,
    (SELECT COUNT(*) FROM sala) as salas,
    (SELECT COUNT(*) FROM clase_uml) as clases,
    (SELECT COUNT(*) FROM conversacion_ia) as conversaciones,
    (SELECT COUNT(*) FROM flutter_screen) as flutter_screens;
"
# Esperado: usuarios=6, salas=5, clases=3, conversaciones=5, flutter_screens=0

# 4. Ver logs del backend
docker-compose logs backend | tail -30
# Debe mostrar conexión exitosa a BD
```

---

## 🔧 SOLUCIONAR PROBLEMAS COMUNES

### PostgreSQL no inicia
```bash
# Ver logs
docker-compose logs postgres

# Reintentar
docker-compose restart postgres
```

### Error al ejecutar schema.sql
```bash
# Verificar conectividad
docker-compose exec postgres psql -U postgres -d parcial1sw1 -c "SELECT version();"

# Si falla, reiniciar postgres
docker-compose down
docker-compose up -d postgres
sleep 30
```

### Error "database does not exist"
```bash
# Crear BD manualmente
docker-compose exec postgres createdb -U postgres parcial1sw1

# Luego ejecutar schema
docker-compose exec postgres psql -U postgres -d parcial1sw1 < backend-p1sw1/database/schema.sql
```

### Backend no conecta a BD
```bash
# Ver configuración .env
cat .env.production | grep DB

# Verificar credenciales en schema
docker-compose exec postgres psql -U postgres -d parcial1sw1 -c "\du"

# Reiniciar servicios
docker-compose restart backend
```

---

## 🛡️ RECUPERAR DE ERRORES

### Volver al estado anterior (Rollback)
```bash
# Si algo sale mal y tienes backup:
# 1. Detener servicios
docker-compose down -v

# 2. Restaurar desde backup (guía aparte)
# 3. Reiniciar
docker-compose up -d
```

### Verificar integridad de BD
```bash
# Ver tamaño de BD
docker-compose exec postgres psql -U postgres -d parcial1sw1 -c "SELECT pg_size_pretty(pg_database_size('parcial1sw1'));"

# Ver últimas 5 migraciones
docker-compose exec postgres psql -U postgres -d parcial1sw1 -c "SELECT * FROM migration_log ORDER BY executed_at DESC LIMIT 5;" 2>/dev/null || echo "Tabla migration_log no existe"
```

---

## 📊 TIMELINE COMPLETO

```
Minuto 0:  Docker down
Minuto 0-1: Eliminar volumen postgres
Minuto 1-4: PostgreSQL inicia y se estabiliza
Minuto 4:  Schema.sql ejecuta (~10 segundos)
Minuto 4:  Seed.sql ejecuta (~5 segundos)
Minuto 4-5: Backend/Frontend inician
Minuto 5:  ✅ ONLINE - Downtime finalizado
```

---

## ✅ CHECKLIST FINAL

```
☐ Backup reciente existe
☐ BD actualizada en local (git pull)
☐ schema.sql en el VPS
☐ seed.sql en el VPS
☐ drop-tables.sql en el VPS
☐ .env.production está correcto
☐ Preparado para downtime
☐ Ejecuté PASO 1 (git pull)
☐ Ejecuté PASO 2 (docker-compose down)
☐ Ejecuté PASO 3 (eliminar volumen)
☐ Ejecuté PASO 4 (postgres up)
☐ Ejecuté PASO 5 (schema + seed)
☐ Ejecuté PASO 6 (backend up)
☐ Ejecuté PASO 7 (verificación)
☐ BD tiene 15 tablas ✓
☐ Backends conectan ✓
☐ Frontend accesible ✓
☐ Downtime < 5 minutos ✓
```

---

## 🎯 DESPUÉS DE LA INSTALACIÓN

### Verificar aplicación
```bash
# Acceder a la app
curl -k https://uml.jkhoster.com/api/health
# Debe retornar: {"status":"ok","timestamp":"..."}

# Ver logs en tiempo real
docker-compose logs -f backend
docker-compose logs -f frontend
```

### Crear usuario de prueba
```bash
# Acceder a la BD
docker-compose exec postgres psql -U postgres -d parcial1sw1

# Dentro de psql:
SELECT * FROM usuario LIMIT 1;
# Debe mostrar usuarios de seed
```

---

## 💾 ANTES DE HACER ESTO EN PRODUCCIÓN

✅ Backup actualizado (en /backups/)  
✅ Código en git (en rama feature/flutter-mockup-generator)  
✅ Schema.sql testeado localmente  
✅ Seed.sql testeado localmente  
✅ Todos en el equipo saben del downtime  
✅ Ventana de mantenimiento comunicada  
✅ Plan B en caso de error

---

¡Éxito! 🚀
