# 📁 Configuración del Frontend

## ⚙️ Sistema de Configuración

El frontend usa **`environment.ts`** para configurar URLs automáticamente según el entorno:

### DESARROLLO (`ng serve`)
```typescript
// src/environments/environment.ts
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000',
  wsUrl: 'http://localhost:3000'
};
```
✅ **Backend debe correr en localhost:3000**

### PRODUCCIÓN (`npm run build`)
```typescript
// src/environments/environment.prod.ts
export const environment = {
  production: true,
  apiUrl: 'https://uml.jkhoster.com/api',
  wsUrl: 'https://uml.jkhoster.com'
};
```
✅ **Usa URLs de producción automáticamente**

---

## 🚀 Flujo de Trabajo

### Desarrollo Local
```bash
# 1. Iniciar backend (debe estar en puerto 3000)
cd backend-p1sw1
npm run dev

# 2. Iniciar frontend (usa environment.ts → localhost:3000)
cd official-sw1p1
ng serve

# ✅ Frontend apunta automáticamente a http://localhost:3000
```

### Build de Producción
```bash
# Compila con environment.prod.ts (uml.jkhoster.com)
npm run build

# Resultado: dist/ apunta a https://uml.jkhoster.com
```

### Deploy con Docker
```bash
# Docker usa el build compilado (environment.prod.ts)
docker-compose build frontend
docker-compose up -d

# ✅ Frontend apunta automáticamente a https://uml.jkhoster.com
```

---

## 🔧 Cambiar URLs

### Para desarrollo local (apuntar a otro servidor):
Edita `src/environments/environment.ts`:
```typescript
export const environment = {
  production: false,
  apiUrl: 'http://192.168.1.100:3000',  // ← Cambia aquí
  wsUrl: 'http://192.168.1.100:3000'    // ← Cambia aquí
};
```

### Para producción (cambiar dominio):
Edita `src/environments/environment.prod.ts`:
```typescript
export const environment = {
  production: true,
  apiUrl: 'https://nuevo-dominio.com/api',  // ← Cambia aquí
  wsUrl: 'https://nuevo-dominio.com'        // ← Cambia aquí
};
```

---

## 📋 Archivos config.json (DEPRECADOS)

Los siguientes archivos **YA NO SE USAN**:
- ~~`config.json`~~ → Ahora en `environment.prod.ts`
- ~~`config.local.json`~~ → Ahora en `environment.ts`
- ~~`config.example.json`~~ → Ahora en `environment.ts`

**Puedes eliminarlos** (se mantienen por compatibilidad temporal).

---

## 🐛 Troubleshooting

### Frontend apunta a localhost en producción
**NO DEBERÍA PASAR** con el nuevo sistema de environments.

Si pasa, verifica:
1. ¿Usaste `npm run build`? (no `ng serve`)
2. Revisa el build: debe usar `environment.prod.ts`
3. Verifica console del navegador: debe mostrar "Modo: PRODUCCIÓN"

### Frontend apunta a producción en desarrollo
**Causa:** Estás usando `npm run build` en lugar de `ng serve`

**Solución:**
```bash
# Para desarrollo usa:
ng serve

# NO uses npm run build (ese es para producción)
```

### ConfigService no carga las URLs
Revisa la consola del navegador. Debe mostrar:
```
✅ Configuración cargada desde environment:
   - Modo: DESARROLLO
   - API: http://localhost:3000
   - WebSocket: http://localhost:3000
```

---

## 📝 Checklist Pre-Deploy

Antes de hacer `docker-compose build frontend`:

- [ ] Verificar `environment.prod.ts` tiene URLs correctas
- [ ] Ejecutar `npm run build` (usa environment.prod.ts)
- [ ] Verificar consola del build: debe decir "production: true"
- [ ] Commit y push cambios
- [ ] En servidor: `git pull`
- [ ] En servidor: `docker-compose build frontend`
- [ ] En servidor: `docker-compose up -d`
- [ ] Verificar en browser: debe mostrar "Modo: PRODUCCIÓN"

---

**Última actualización:** 25 enero 2026  
**Sistema:** Environments de Angular (reemplaza config.json)
