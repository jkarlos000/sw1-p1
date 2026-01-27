# 🔧 CONFIGURACIÓN VPS - RAMA feature/flutter-mockup-generator

**Última actualización:** 2026-01-27

---

## 📌 SITUACIÓN ACTUAL

Tu VPS está apuntando a la rama equivocada y tiene archivos locales que conflictúan.

**Rama correcta:** `feature/flutter-mockup-generator`

---

## ✅ SOLUCIÓN RÁPIDA (5 minutos)

### Paso 1: Conectar al VPS

```bash
ssh root@vmi2832482
cd /home/sw1/jk
```

### Paso 2: Limpiar cambios locales

```bash
# Guardar temporalmente cambios locales (si los quieres)
git stash

# Borrar archivos locales que conflictúan
rm -f .env.production
rm -f CONFIGURACION_URLS.md
rm -f DESPLIEGUE_PRODUCCION.md
rm -f setup-ssl.ps1 setup-ssl.sh switch-env.ps1 switch-env.sh
rm -f backend-p1sw1/database/schema.sql
rm -f backend-p1sw1/database/seed.sql
rm -f official-sw1p1/src/assets/config.local.json

# Limpiar cambios tracked
git reset --hard HEAD
```

### Paso 3: Cambiar a la rama correcta

```bash
# Ver ramas disponibles
git branch -a

# Cambiar a la rama correcta
git checkout feature/flutter-mockup-generator

# Actualizar
git pull origin feature/flutter-mockup-generator

# Verificar que estás en la rama correcta
git branch -v
git log --oneline -3
```

### Paso 4: Verificar que todo está bien

```bash
# Ver estado
git status
# Debe mostrar: "On branch feature/flutter-mockup-generator"
# y "Your branch is up to date with 'origin/feature/flutter-mockup-generator'."

# Ver cambios recientes
git log --oneline -5
```

---

## 🔄 PARA FUTUROS PULLS

Ahora que estás en la rama correcta, usa esto:

```bash
# Actualizar desde la rama correcta
git pull origin feature/flutter-mockup-generator

# O más seguro, con verificación
git fetch origin
git status
git pull
```

---

## 🚀 PRÓXIMO PASO: DEPLOYMENT

Una vez limpio todo, sigue los pasos en:

→ [DEPLOY_VPS_MIGRACION.md](DEPLOY_VPS_MIGRACION.md)

Específicamente la **FASE 2: Preparación en VPS** desde línea 178.

---

## ⚠️ SI ALGO SALE MAL

### Si necesitas volver atrás completamente

```bash
# Restaurar la rama a como estaba
git reset --hard origin/feature/flutter-mockup-generator

# Confirmar
git status
```

### Si quieres ver qué cambios locales tenías

```bash
# Ver cambios que hiciste localmente (antes de limpiar)
git diff HEAD
git stash show -p
```

---

## 📋 CHECKLIST DESPUÉS DE LIMPIAR

```
☐ git branch -v muestra: * feature/flutter-mockup-generator
☐ git status muestra: "Your branch is up to date with 'origin/feature/flutter-mockup-generator'"
☐ No hay archivos modificados (git status limpio)
☐ Puedes hacer: git pull origin feature/flutter-mockup-generator sin errores
```

Si todo está ✅, ya puedes proceder con el deployment.

---

## 🎯 RESUMEN DE CAMBIOS REALIZADOS

### En Local (ya hecho):
✅ Actualizado `.gitignore` para ignorar:
  - `.env.production`, `.env.development`
  - Archivos de configuración local
  - Assets de configuración local
  - Backups y dumps de BD

### En VPS (tú debes hacer):
1. Limpiar cambios locales (git stash, rm archivos)
2. Cambiar a rama `feature/flutter-mockup-generator`
3. Hacer `git pull origin feature/flutter-mockup-generator`
4. Verificar con `git status`

---

**¿Necesitas ayuda en algún paso?** Avísame qué error ves exactamente.
