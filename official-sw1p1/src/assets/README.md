# 📁 Configuración del Frontend

## Archivos de Configuración

Este directorio contiene **3 archivos de configuración**:

### 1. `config.json` ⭐ (PRODUCCIÓN)
```json
{
  "apiUrl": "https://uml.jkhoster.com/api",
  "wsUrl": "https://uml.jkhoster.com"
}
```
- **Propósito:** Configuración de PRODUCCIÓN
- **Cuándo se usa:** Build de producción (`npm run build`)
- **Deploy:** Este archivo se copia al `dist/` y se usa en Docker/VPS
- **Git:** ✅ Commiteado al repositorio

---

### 2. `config.local.json` 🏠 (DESARROLLO LOCAL)
```json
{
  "apiUrl": "http://localhost:3000",
  "wsUrl": "http://localhost:3000"
}
```
- **Propósito:** Desarrollo local en tu máquina
- **Cuándo se usa:** `ng serve` (desarrollo)
- **Deploy:** ❌ **NO se copia al dist/** (excluido en `angular.json`)
- **Git:** ✅ Commiteado (para que otros devs lo tengan)

---

### 3. `config.example.json` 📋 (PLANTILLA)
```json
{
  "apiUrl": "http://localhost:3000",
  "wsUrl": "http://localhost:3000"
}
```
- **Propósito:** Plantilla para nuevos desarrolladores
- **Cuándo se usa:** Copiar y renombrar a `config.json` si es necesario
- **Deploy:** ❌ **NO se copia al dist/** (excluido en `angular.json`)
- **Git:** ✅ Commiteado

---

## 🚀 Flujo de Trabajo

### Desarrollo Local
```bash
# ConfigService carga /assets/config.json
# Debe apuntar a localhost:3000
ng serve
```

### Build de Producción
```bash
# Solo config.json se copia al dist/
# config.local.json y config.example.json se IGNORAN
npm run build

# Verificar que solo exista config.json en dist:
ls dist/client-socket/browser/assets/config*.json
# ✅ Debería mostrar SOLO: config.json
```

### Deploy con Docker
```bash
# Docker copia el dist/ al contenedor
# Solo existe config.json (producción)
docker-compose build frontend
docker-compose up -d
```

---

## ⚙️ Cómo Funciona

### angular.json (configuración de build)
```json
"assets": [
  "src/favicon.ico",
  {
    "glob": "**/*",
    "input": "src/assets",
    "output": "assets",
    "ignore": ["config.local.json", "config.example.json"]
  }
]
```

### ConfigService (carga la configuración)
```typescript
async loadConfig(): Promise<void> {
  // SIEMPRE carga /assets/config.json
  this.config = await firstValueFrom(
    this.http.get<AppConfig>('/assets/config.json')
  );
}
```

---

## 🔧 Cambiar URLs de Desarrollo

Si necesitas apuntar a otro servidor en desarrollo:

1. **Editar `config.json`** (NO `config.local.json`):
   ```json
   {
     "apiUrl": "http://192.168.1.100:3000",
     "wsUrl": "http://192.168.1.100:3000"
   }
   ```

2. **Reiniciar ng serve:**
   ```bash
   ng serve
   ```

---

## 🐛 Troubleshooting

### Frontend apunta a localhost en producción
**Problema:** Después de `docker-compose up`, el frontend hace peticiones a `localhost:3000`

**Causa:** El `dist/` tiene `config.local.json` copiado

**Solución:**
1. Verificar que `angular.json` tenga el `ignore` configurado
2. Limpiar dist: `rm -rf dist/`
3. Rebuild: `npm run build`
4. Verificar: `cat dist/client-socket/browser/assets/config.json`
5. Debe mostrar URLs de producción (uml.jkhoster.com)

### ConfigService carga config.local.json en lugar de config.json
**NO PUEDE PASAR:** ConfigService está hardcodeado a cargar `/assets/config.json`

Si esto pasa, revisar `config.service.ts` línea 36:
```typescript
this.http.get<AppConfig>('/assets/config.json')  // ← Siempre config.json
```

---

## 📝 Checklist Pre-Deploy

Antes de hacer `docker-compose build frontend`:

- [ ] `config.json` tiene URLs de producción (https://uml.jkhoster.com)
- [ ] Ejecutar `npm run build`
- [ ] Verificar `dist/client-socket/browser/assets/` solo tiene `config.json`
- [ ] NO debe existir `config.local.json` en dist
- [ ] Commit y push cambios
- [ ] En servidor: `git pull`
- [ ] En servidor: `docker-compose build frontend`
- [ ] En servidor: `docker-compose up -d`
- [ ] Verificar en browser que NO hay errores de `localhost:3000`

---

**Última actualización:** 25 enero 2026  
**Responsable:** Configuración de builds
