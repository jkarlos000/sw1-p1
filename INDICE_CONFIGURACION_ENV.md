# 📚 Índice Completo de Documentación - Configuración .env

## 🚀 PARA LEER PRIMERO (TU SITUACIÓN)

### 1️⃣ [CONFIGURAR_ENV_EN_VPS.md](CONFIGURAR_ENV_EN_VPS.md) ⭐ COMIENZA AQUÍ
**Si tienes 10 minutos:** Lee esto primero
- Pasos EXACTOS para arreglar el problema en VPS
- Paso a paso: SSH → crear .env → editar → reconstruir
- Verificación en cada paso
- Solución de problemas comunes

---

## 📖 DOCUMENTACIÓN DE REFERENCIA

### 2️⃣ [GUIA_ENV_VPS.md](GUIA_ENV_VPS.md)
**Si quieres ENTENDER todo:**
- ¿Por qué localhost:3000 es incorrecto?
- Cómo funciona docker-compose con .env
- Variables clave explicadas
- Problemas y soluciones
- 950+ líneas de documentación

### 3️⃣ [DESARROLLO_LOCAL_VS_PRODUCCION_VPS.md](DESARROLLO_LOCAL_VS_PRODUCCION_VPS.md)
**Si quieres entender el flujo completo:**
- Desarrollo local vs. Producción
- Cómo diferente URLs en environment.ts y environment.prod.ts
- Docker interpreta variables
- Tabla comparativa
- Diagramas de flujo

---

## 📋 PLANTILLAS (.env)

### 4️⃣ [.env.production.example](.env.production.example)
**Para VPS (Producción)**
- Plantilla lista para copiar
- Valores comentados
- NO se usa directamente
- Cópialo como `.env` y edita

### 5️⃣ [.env.local.example](.env.local.example)
**Para desarrollo local**
- Plantilla para tu PC
- Usa localhost:3000
- Para `npm run dev` del backend + `ng serve` del frontend

---

## 🎯 SOLUCIÓN RÁPIDA (5 MINUTOS)

Si solo quieres arreglar ahora:

```bash
# En VPS:
ssh sw1@uml.jkhoster.com
cd /home/sw1/jk

# Crear .env
cp .env.production.example .env

# Editar valores críticos
nano .env
# Cambiar: POSTGRES_PASSWORD, API_URL, JWT_SECRET
# Guardar: Ctrl+X, Y, Enter

# Reconstruir
docker-compose down
docker-compose up -d --build

# Esperar 3-5 minutos

# Verificar
docker-compose ps
curl -k https://uml.jkhoster.com/api/health

# Probar en navegador
# https://uml.jkhoster.com
# F12 → Network → Ver requests a /api/
```

**Fin.**

---

## 🔍 BÚSQUEDA POR TEMA

### ¿Dónde está localhost:3000 en mi código?

→ [environment.ts](official-sw1p1/src/environments/environment.ts)

```typescript
export const environment = {
  apiUrl: 'http://localhost:3000',  // ← AQUÍ
};
```

### ¿Cuál es la URL correcta en VPS?

→ [environment.prod.ts](official-sw1p1/src/environments/environment.prod.ts)

```typescript
export const environment = {
  apiUrl: 'https://uml.jkhoster.com/api',  // ← AQUÍ
};
```

### ¿Cómo docker-compose pasa variables?

→ [docker-compose.yml](docker-compose.yml) líneas 75-85

```yaml
frontend:
  environment:
    API_URL: ${API_URL:-https://uml.jkhoster.com/api}
    WS_URL: ${WS_URL:-https://uml.jkhoster.com}
```

### ¿Dónde guardo el .env en VPS?

→ `/home/sw1/jk/.env` (donde está docker-compose.yml)

```
/home/sw1/jk/
├── .env ← AQUÍ
├── docker-compose.yml
├── .env.production.example
└── ... más archivos
```

---

## ❓ PREGUNTAS FRECUENTES

### P: ¿.env se commita a GitHub?
**R:** NO. Está en `.gitignore`. Es local de cada servidor.

### P: ¿Qué diferencia hay entre .env y .env.production.example?
**R:**
- `.env.production.example` = Plantilla (documentación)
- `.env` = Configuración real (NO en GitHub)

### P: ¿Necesito .env en mi PC (desarrollo local)?
**R:** NO. Usas `ng serve` (environment.ts) y `npm run dev` (backend). No necesitas .env ni Docker en local.

### P: ¿Qué pasa si dejo localhost:3000 en VPS?
**R:** El navegador busca localhost:3000 en TU PC, no en el VPS. Frontend no conecta.

### P: ¿Cómo docker sabe qué valor poner?
**R:** Lee `.env` del mismo directorio que `docker-compose.yml` y reemplaza variables.

### P: ¿Cuándo debo usar --build?
**R:** Siempre que cambies código (TypeScript, Angular, etc.). No es necesario para cambios de BD.

---

## 🚨 PROBLEMAS COMUNES

### ❌ "Frontend aún conecta a localhost:3000"

**Solución:**
1. Verificar que `.env` existe en VPS
2. Verificar que tiene `API_URL=https://uml.jkhoster.com/api`
3. Reconstruir: `docker-compose down && docker-compose up -d --build`
4. Esperar 5 minutos completos
5. Verificar: `docker-compose logs frontend | grep -i "url\|api"`

Ver: [CONFIGURAR_ENV_EN_VPS.md - Sección Problemas](CONFIGURAR_ENV_EN_VPS.md#-solución-de-problemas)

### ❌ "CORS error desde navegador"

**Solución:**
1. Editar `.env`: `CORS_ORIGIN=https://uml.jkhoster.com`
2. Reconstruir: `docker-compose down && docker-compose up -d --build`
3. Esperar compilación

Ver: [GUIA_ENV_VPS.md - CORS error](GUIA_ENV_VPS.md#cors-error-desde-navegador)

### ❌ "docker-compose up -d --build falla"

**Solución:**
1. Ver logs: `docker-compose logs backend`
2. Buscar error real
3. Revisar contraseña BD en `.env`
4. Probar con `docker-compose logs -f`

Ver: [CONFIGURAR_ENV_EN_VPS.md - Troubleshooting](CONFIGURAR_ENV_EN_VPS.md#-solución-de-problemas)

---

## 📊 ESTRUCTURA DE ARCHIVOS

```
/home/sw1/jk/
│
├── .env ⭐ TÚ CREAS ESTO
│   └─ Configuración REAL del servidor
│   └─ Nunca se commita (en .gitignore)
│
├── .env.production.example 📋 Plantilla
│   └─ Cópialos como .env
│   └─ Se commita a GitHub
│
├── docker-compose.yml
│   ├─ Lee variables desde .env
│   └─ Pasa a contenedores
│
├── official-sw1p1/ (Frontend)
│   └─ src/environments/
│       ├─ environment.ts (desarrollo: localhost:3000)
│       └─ environment.prod.ts (producción: ${API_URL})
│
├── backend-p1sw1/ (Backend)
│   └─ Dockerfile
│       └─ Compila y corre con variables de docker-compose
│
└── nginx/
    └─ nginx.conf
        └─ Genera config.json dinámicamente
```

---

## 🔄 FLUJO DE CAMBIOS

### Cuando hagas cambios de CÓDIGO

```
1. Editar código local (TypeScript, Angular)
2. git commit y git push a GitHub
3. En VPS: git pull
4. En VPS: docker-compose down
5. En VPS: docker-compose up -d --build  ← CRÍTICO
6. Esperar 3-5 minutos de compilación
7. Verificar en navegador
```

### Cuando hagas cambios de BD

```
1. En VPS: mysql/psql comando directo
2. O: Usar API para insertar datos
3. NO necesita docker-compose down
```

### Cuando hagas cambios de .env

```
1. Editar .env en VPS
2. docker-compose down
3. docker-compose up -d (NO necesita --build)
4. Verificar
```

---

## 📞 RESUMEN DE COMANDOS VPS

```bash
# Ver si .env existe
test -f /home/sw1/jk/.env && echo "Existe" || echo "No existe"

# Crear .env desde plantilla
cd /home/sw1/jk
cp .env.production.example .env

# Editar .env
nano .env
# Cambiar valores
# Ctrl+X, Y, Enter para guardar

# Ver valores críticos
grep -E "API_URL|WS_URL|POSTGRES_PASSWORD" .env

# Reconstruir docker
docker-compose down
docker-compose up -d --build

# Ver logs en vivo
docker-compose logs -f backend
docker-compose logs -f frontend

# Verificar health
docker-compose ps
curl -k https://uml.jkhoster.com/api/health

# Ver config del frontend
docker exec sw1-frontend cat /usr/share/nginx/html/config.json
```

---

## ✅ CHECKLIST FINAL

- [ ] Leí [CONFIGURAR_ENV_EN_VPS.md](CONFIGURAR_ENV_EN_VPS.md)
- [ ] SSH al VPS funcionando
- [ ] Creé `.env` desde `.env.production.example`
- [ ] Edité `.env` con valores reales
- [ ] Ejecuté `docker-compose down`
- [ ] Ejecuté `docker-compose up -d --build`
- [ ] Esperé 3-5 minutos
- [ ] `docker-compose ps` muestra "Up (healthy)"
- [ ] `curl` retorna 200 OK
- [ ] Navegador muestra sitio (https://uml.jkhoster.com)
- [ ] F12 → Network tab muestra requests a `/api/`
- [ ] Requests van a dominio real, NO localhost:3000

✨ **¡LISTO PARA PRODUCCIÓN!**

---

## 🔗 ENLACES RÁPIDOS

**Documentos principales:**
- [CONFIGURAR_ENV_EN_VPS.md](CONFIGURAR_ENV_EN_VPS.md) - Pasos para arreglar ahora
- [GUIA_ENV_VPS.md](GUIA_ENV_VPS.md) - Explicación completa
- [DESARROLLO_LOCAL_VS_PRODUCCION_VPS.md](DESARROLLO_LOCAL_VS_PRODUCCION_VPS.md) - Flujo completo

**Plantillas:**
- [.env.production.example](.env.production.example) - Para VPS
- [.env.local.example](.env.local.example) - Para desarrollo

**Archivos del proyecto:**
- [docker-compose.yml](docker-compose.yml) - Orquestación
- [official-sw1p1/src/environments/environment.ts](official-sw1p1/src/environments/environment.ts) - Config desarrollo
- [official-sw1p1/src/environments/environment.prod.ts](official-sw1p1/src/environments/environment.prod.ts) - Config producción

---

**Última actualización:** 27 de Enero 2026
**Versión:** 1.0 - Documentación inicial para .env
