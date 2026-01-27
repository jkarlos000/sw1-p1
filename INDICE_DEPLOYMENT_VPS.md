# 📑 ÍNDICE: ARCHIVOS DE DEPLOYMENT VPS

**Fecha:** 2026-01-27  
**Versión:** 1.0  
**Tema:** Flutter Screens + VPS Deployment Seguro

---

## 🎯 Punto de Entrada Recomendado

### Primero Lee:
1. **[RESUMEN_DEPLOY_VPS.md](RESUMEN_DEPLOY_VPS.md)** (5 min)
   - Situación general
   - Qué cambios se harán
   - Checklist

2. **[DEPLOY_VPS_MIGRACION.md](DEPLOY_VPS_MIGRACION.md)** (30 min)
   - Procedimiento paso a paso
   - Troubleshooting
   - Instrucciones detalladas

---

## 📁 Archivos Principales

### Base de Datos

```
backend-p1sw1/database/
├── migration-flutter-screens.sql  ← SCRIPT DE MIGRACIÓN
│   └── Crea tablas Flutter
│   └── Tabla de auditoría
│   └── Triggers automáticos
│
├── backup-vps.sh                  ← SCRIPT DE BACKUP
│   └── Backup automático de BD
│   └── Copia de volúmenes
│   └── Limpieza automática
│
├── rollback-flutter.sh            ← SCRIPT DE ROLLBACK
│   └── Revertir migración
│   └── Restaurar desde backup
│   └── Opciones de emergencia
│
├── tests/
│   └── README.md (Queries de debugging)
│
├── schema.sql (Sin cambios)
└── seed.sql (Sin cambios)
```

### Configuración Docker

```
docker-compose.yml  ← ACTUALIZADO
├── Incluye: ./backend-p1sw1/database/migration-flutter-screens.sql
├── Mantiene: Certificados SSL
├── Preserva: Volúmenes de datos
└── Ready: Para VPS
```

### Configuración de Producción

```
.env.production.example  ← COPIAR COMO .env
├── Todas las variables necesarias
├── Instrucciones de seguridad
└── Valores por defecto documentados
```

### Verificación Pre-Deploy

```
verify-pre-deploy.sh  ← EJECUTAR ANTES
├── 40+ validaciones automáticas
├── Verifica código, BD, config
├── Go/No-Go decision
└── Instrucciones siguientes
```

---

## 📚 Documentación

### Guías de Deployment

| Archivo | Duración | Contenido | Cuándo Leer |
|---------|----------|----------|------------|
| [RESUMEN_DEPLOY_VPS.md](RESUMEN_DEPLOY_VPS.md) | 5 min | Visión general | Primero |
| [DEPLOY_VPS_MIGRACION.md](DEPLOY_VPS_MIGRACION.md) | 30 min | Paso a paso detallado | Antes de desplegar |
| [.env.production.example](.env.production.example) | 5 min | Variables config | Al configurar VPS |

### Secciones de Referencia

**En DEPLOY_VPS_MIGRACION.md:**
- 📋 Índice Rápido
- ✅ Requisitos Previos
- 🔄 Estructura de Migración
- 🔐 Paso a Paso
- ✅ Verificación Post-Deploy
- 📊 Monitoreo
- 🐛 Troubleshooting (34 páginas de soluciones)
- 🔄 Rollback de Emergencia
- 📅 Programación de Mantenimiento
- 📋 Checklists

---

## 🚀 Flujo de Trabajo

### Para Desplegar

```
1. LOCAL
   ↓ Leer: RESUMEN_DEPLOY_VPS.md
   ↓ Leer: DEPLOY_VPS_MIGRACION.md
   ↓ Ejecutar: ./verify-pre-deploy.sh
   ↓ Si pasa: git push origin main

2. VPS
   ↓ ssh al servidor
   ↓ Ejecutar: backend-p1sw1/database/backup-vps.sh
   ↓ git pull origin main
   ↓ docker-compose down && docker-compose up -d
   ↓ Esperar 2-3 minutos para migraciones

3. VERIFICAR
   ↓ docker-compose ps (todos healthy)
   ↓ Conectar a BD y verificar tablas flutter
   ↓ Test: curl https://...
   ↓ ¡Listo!
```

### Si Algo Sale Mal

```
1. Ver logs
   docker-compose logs -f

2. Rollback seguro
   ./backend-p1sw1/database/rollback-flutter.sh safe

3. Si persiste, restaurar
   ./backend-p1sw1/database/rollback-flutter.sh restore

4. Consultar documentación
   → DEPLOY_VPS_MIGRACION.md > Troubleshooting
```

---

## ✅ Checklists

### Pre-Deploy
- [ ] Leer RESUMEN_DEPLOY_VPS.md
- [ ] Leer DEPLOY_VPS_MIGRACION.md completo
- [ ] Ejecutar verify-pre-deploy.sh (debe pasar)
- [ ] Hacer git push origin main
- [ ] Tener acceso SSH a VPS

### Durante Deploy
- [ ] Ejecutar backup-vps.sh
- [ ] Verificar backup generado
- [ ] git pull origin main en VPS
- [ ] docker-compose down (sin perder datos)
- [ ] docker-compose up -d postgres (esperar 2-3 min)
- [ ] docker-compose up -d (resto)

### Post-Deploy
- [ ] docker-compose ps (todos healthy)
- [ ] Tablas flutter_screen existen
- [ ] Datos históricos intactos
- [ ] API responde: /health
- [ ] Frontend carga
- [ ] WebSocket funciona

---

## 🔍 Búsqueda Rápida

### Necesito...

**Instalar en VPS**
→ Leer: DEPLOY_VPS_MIGRACION.md > FASE 2

**Hacer backup manualmente**
→ Ejecutar: `./backend-p1sw1/database/backup-vps.sh`

**Revertir cambios**
→ Ejecutar: `./backend-p1sw1/database/rollback-flutter.sh safe`

**Restaurar desde backup**
→ Ejecutar: `./backend-p1sw1/database/rollback-flutter.sh restore`

**Verificar migraciones**
→ SQL: `SELECT * FROM migration_log ORDER BY executed_at DESC;`

**Entender la migración**
→ Leer: `backend-p1sw1/database/migration-flutter-screens.sql`

**Configurar variables**
→ Copiar: `.env.production.example` → `.env` y editar

**Solucionar problemas**
→ Leer: DEPLOY_VPS_MIGRACION.md > Troubleshooting

**Entender la seguridad**
→ Leer: DEPLOY_VPS_MIGRACION.md > Paso a Paso

---

## 📊 Archivos por Tipo

### Scripts Bash
- `verify-pre-deploy.sh` - Validación pre-deploy
- `backend-p1sw1/database/backup-vps.sh` - Backup automático
- `backend-p1sw1/database/rollback-flutter.sh` - Rollback

### SQL
- `backend-p1sw1/database/migration-flutter-screens.sql` - Migración

### Markdown (Documentación)
- `RESUMEN_DEPLOY_VPS.md` - Visión general
- `DEPLOY_VPS_MIGRACION.md` - Guía detallada
- `backend-p1sw1/database/tests/README.md` - Queries de debugging

### Configuración
- `.env.production.example` - Variables de producción
- `docker-compose.yml` - Contenedores (actualizado)

---

## 🎯 Duración Estimada

| Tarea | Duración |
|-------|----------|
| Leer documentación | 40 minutos |
| Preparar local | 5 minutos |
| Backup en VPS | 10 minutos |
| Deploy en VPS | 5-7 minutos |
| Verificación | 5 minutos |
| **TOTAL** | **65-75 minutos** |

---

## 🆘 Soporte

### Documentación
- **Preguntas generales**: RESUMEN_DEPLOY_VPS.md
- **Procedimiento paso a paso**: DEPLOY_VPS_MIGRACION.md
- **Problemas específicos**: DEPLOY_VPS_MIGRACION.md > Troubleshooting
- **Recuperación**: rollback-flutter.sh

### Si Necesitas Ayuda
1. Leer la sección relevante en DEPLOY_VPS_MIGRACION.md
2. Ver logs: `docker-compose logs`
3. Conectar a BD: `docker-compose exec postgres psql -U postgres -d parcial1sw1`
4. Ejecutar rollback si es necesario

---

## ✨ Resumen de Archivos Nuevos

```
CREADOS PARA ESTE DEPLOYMENT:
├── backend-p1sw1/database/migration-flutter-screens.sql (400+ líneas)
├── backend-p1sw1/database/backup-vps.sh (600+ líneas)
├── backend-p1sw1/database/rollback-flutter.sh (400+ líneas)
├── DEPLOY_VPS_MIGRACION.md (500+ líneas)
├── RESUMEN_DEPLOY_VPS.md (300+ líneas)
├── verify-pre-deploy.sh (250+ líneas)
└── .env.production.example (100+ líneas)

MODIFICADOS:
└── docker-compose.yml (1 línea nueva: migration SQL)

TOTAL: 2500+ líneas de código + documentación
```

---

## 🎉 Siguiente Paso

**Ahora debes:**
1. ✅ Leer [RESUMEN_DEPLOY_VPS.md](RESUMEN_DEPLOY_VPS.md) (5 min)
2. ✅ Leer [DEPLOY_VPS_MIGRACION.md](DEPLOY_VPS_MIGRACION.md) (30 min)
3. ✅ Ejecutar `./verify-pre-deploy.sh` (1 min)
4. ✅ Si pasa: Proceder con deployment en VPS

---

**Generado:** 2026-01-27  
**Versión:** 1.0 Production Ready  
**Estado:** ✅ Completado
