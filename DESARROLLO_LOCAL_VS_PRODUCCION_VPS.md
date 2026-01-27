# 🌐 Flujo: Desarrollo Local vs. Producción VPS

## El Gran Problema que Resolvemos

Tu frontend en VPS intenta conectar a:
```
http://localhost:3000  ❌ INCORRECTO
```

Pero `localhost` en el navegador = **tu computadora**, no el VPS.

---

## 📊 Tabla Comparativa

| Aspecto | Desarrollo Local | Producción VPS |
|--------|------------------|-----------------|
| **Dónde corre backend** | Tu PC, puerto 3000 | Contenedor Docker en VPS |
| **Dónde corre frontend** | Tu PC, puerto 4200 | Contenedor Nginx en VPS |
| **URL frontend en navegador** | `http://localhost:4200` | `https://uml.jkhoster.com` |
| **URL backend que frontend usa** | `http://localhost:3000` | `https://uml.jkhoster.com/api` |
| **Archivo config** | `environment.ts` | `environment.prod.ts` |
| **Archivo .env** | `.env` local (opcional) | `.env` en VPS (REQUERIDO) |
| **Certificado SSL** | NO (http) | SÍ (https con Let's Encrypt) |
| **Base de datos** | PostgreSQL en localhost | PostgreSQL en Docker |
| **Docker** | NO se usa | SÍ, docker-compose |

---

## 🔄 Flujo de Desarrollo Local

```
┌──────────────────────────────────────┐
│ Tu Computadora (Puerto 4200)         │
│                                      │
│  Angular Frontend                    │
│  (ng serve)                          │
│  ↓ Importa environment.ts            │
│  ↓ apiUrl = localhost:3000           │
│  ↓                                   │
│  http://localhost:4200 (navegador)   │
│     ↓                                │
│     Intenta conectar a ↓             │
│     http://localhost:3000 ✅ CORRECTO
└──────────────────────────────────────┘
           ↓
┌──────────────────────────────────────┐
│ Tu Computadora (Puerto 3000)         │
│                                      │
│  Node.js Backend                     │
│  (npm run dev)                       │
│  ↓                                   │
│  Responde requests                   │
└──────────────────────────────────────┘
```

### Comando para desarrollo:
```bash
# Terminal 1: Frontend
cd official-sw1p1
npm install
ng serve

# Terminal 2: Backend
cd backend-p1sw1
npm install
npm run dev

# Terminal 3: BD
# O tener PostgreSQL corriendo en tu PC

# Luego abre: http://localhost:4200
```

---

## 🔄 Flujo de Producción en VPS

### ❌ Lo que ESTÁ PASANDO (INCORRECTO):

```
┌─────────────────────────────────────────┐
│ NAVEGADOR DE USUARIO (EN INTERNET)      │
│ Abre: https://uml.jkhoster.com          │
│                                         │
│ Lee index.html descargado VPS           │
│ Ve JS que dice: apiUrl=localhost:3000   │
│ Intenta conectar a: localhost:3000 ❌   │
│ (Busca en computadora del usuario, no  │
│  en el VPS!)                            │
└─────────────────────────────────────────┘
    ↓ (No llega al VPS)
┌─────────────────────────────────────────┐
│ VPS - Contenedor Backend (Puerto 3000)  │
│                                         │
│ Node.js Backend corriendo               │
│ Esperando requests...                   │
│ ❌ NO RECIBE NADA (cliente no lo ve)   │
└─────────────────────────────────────────┘
```

### ✅ Lo que DEBERÍA PASAR (CORRECTO):

```
┌─────────────────────────────────────────┐
│ NAVEGADOR DE USUARIO (EN INTERNET)      │
│ Abre: https://uml.jkhoster.com          │
│                                         │
│ Descarga index.html del VPS             │
│ Carga config.json con:                  │
│   apiUrl=https://uml.jkhoster.com/api   │
│ Intenta conectar a:                     │
│   https://uml.jkhoster.com/api ✅       │
└─────────────────────────────────────────┘
    ↓ (Va al VPS)
┌─────────────────────────────────────────┐
│ VPS - Nginx (Puerto 443)                │
│                                         │
│ Recibe request HTTPS                    │
│ Redirige a: /api/ → localhost:3000      │
│ (internamente en Docker)                │
└─────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────┐
│ VPS - Contenedor Backend (Puerto 3000)  │
│                                         │
│ Node.js Backend recibe request          │
│ Responde con datos ✅                   │
└─────────────────────────────────────────┘
```

---

## 🔑 Punto Crítico: Cómo Cambia la Configuración

### En tu computadora (Desarrollo)

**archivo: `src/environments/environment.ts`**
```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000',    // ✅ Tu PC
  wsUrl: 'http://localhost:3000'
};
```

### En el VPS (Producción)

**archivo: `src/environments/environment.prod.ts`**
```typescript
export const environment = {
  production: true,
  apiUrl: 'https://uml.jkhoster.com/api',   // ✅ El VPS
  wsUrl: 'https://uml.jkhoster.com'
};
```

### Cómo Angular elige cuál usar

```bash
# Desarrollo: Usa environment.ts
ng serve
# ↓ importa environment.ts
# ↓ apiUrl = localhost:3000

# Build/Producción: Usa environment.prod.ts
npm run build
# ↓ importa environment.prod.ts
# ↓ apiUrl = https://uml.jkhoster.com/api
```

---

## 🐳 Cómo Docker Usa las Variables

### En VPS, dentro de docker-compose.yml:

```yaml
frontend:
  environment:
    API_URL: ${API_URL:-https://uml.jkhoster.com/api}
    WS_URL: ${WS_URL:-https://uml.jkhoster.com}
```

### Docker busca estas variables en `.env`:

```dotenv
# .env (en /home/sw1/jk/.env)
API_URL=https://uml.jkhoster.com/api
WS_URL=https://uml.jkhoster.com
```

### Docker reemplaza:

```yaml
# ANTES (plantilla):
API_URL: ${API_URL:-default}

# DESPUÉS (con .env):
API_URL: https://uml.jkhoster.com/api
```

### Frontend recibe en HTML:

```html
<!-- En nginx, dentro del contenedor -->
<!-- docker-compose pasa API_URL a nginx.conf -->
<!-- nginx genera config.json con el valor -->
<script>
  window.config = {
    apiUrl: "https://uml.jkhoster.com/api",
    wsUrl: "https://uml.jkhoster.com"
  }
</script>
```

### JavaScript del navegador usa:

```typescript
// En component o servicio
constructor() {
  const apiUrl = window.config?.apiUrl || environment.apiUrl;
  // apiUrl = https://uml.jkhoster.com/api ✅
}
```

---

## 📝 Archivos que Controlan Todo

### LOCAL (Tu PC)

```
c:\work\U\jk\
├── official-sw1p1\src\environments\
│   ├── environment.ts (← ng serve usa esto)
│   │   apiUrl: localhost:3000
│   └── environment.prod.ts (← npm run build usa esto)
│       apiUrl: https://uml.jkhoster.com/api
│
├── .env (opcional en local, para docker-compose local)
└── docker-compose.yml (NO usas en desarrollo local)
```

### VPS (Tu Servidor)

```
/home/sw1/jk/
├── .env (← CREAS aquí con valores reales)
│   API_URL=https://uml.jkhoster.com/api
│   WS_URL=https://uml.jkhoster.com
│
├── docker-compose.yml
│   └── Lee variables desde .env
│   └── Pasa a contenedores
│
├── official-sw1p1\src\environments\
│   ├── environment.ts (no se usa en prod)
│   └── environment.prod.ts (se compila en Docker)
│       apiUrl: ${API_URL} (reemplazado por .env)
│
└── nginx\nginx.conf
    └── Genera config.json dinámicamente
    └── Usa variables de docker-compose
```

---

## 🚦 Checklist de Configuración

### Para DESARROLLO LOCAL

```bash
# ✅ Requerido:
cd backend-p1sw1 && npm install && npm run dev
cd official-sw1p1 && npm install && ng serve

# ❌ NO requerido:
# - .env (desarrollo sin docker)
# - docker-compose
# - Variables de producción
```

### Para PRODUCCIÓN VPS

```bash
# ✅ Requerido:
/home/sw1/jk/.env          # Con valores reales
docker-compose.yml         # Usa variables desde .env
environment.prod.ts        # Compilado en Docker

# ❌ NO requerido:
# - Correr backend/frontend localmente
# - environment.ts (solo para desarrollo)
# - Estar conectado a la BD directamente
```

---

## 🔍 Cómo Verificar que Estás en Modo PRODUCCIÓN

### En el navegador:

```
F12 → Network → Ver una request a /api/
↓
¿URL es https://uml.jkhoster.com/api/... ?
✅ SÍ → Producción correcta
❌ NO → Todavía modo desarrollo

¿URL es http://localhost:3000/... ?
❌ INCORRECTO → Necesita arreglarse
```

### En el VPS (verificar .env):

```bash
grep API_URL /home/sw1/jk/.env
# Debe mostrar:
# API_URL=https://uml.jkhoster.com/api
# NO: API_URL=http://localhost:3000
```

### En el contenedor (verificar lo que recibió):

```bash
docker exec sw1-frontend cat /usr/share/nginx/html/config.json
# Debe mostrar:
# {"apiUrl":"https://uml.jkhoster.com/api",...}
# NO: {"apiUrl":"http://localhost:3000",...}
```

---

## 📚 Resumen: Dónde VA Cada Variable

| Variable | Ubicación | Usa En | Valor |
|----------|-----------|--------|-------|
| `apiUrl` | `environment.ts` | Desarrollo local | `http://localhost:3000` |
| `apiUrl` | `environment.prod.ts` | Compilación Docker | `${API_URL}` (variable) |
| `API_URL` | `.env` VPS | docker-compose | `https://uml.jkhoster.com/api` |
| `API_URL` | docker-compose.yml | Pasa a contenedor | Reemplaza `${API_URL}` |
| `API_URL` | Contenedor nginx | Genera config.json | En `/usr/share/nginx/html/` |
| `apiUrl` | JavaScript navegador | Hace requests | Desde `window.config` |

---

## 🎓 El Concepto Clave

```
┌─────────────────────────────────────────────────────┐
│ DIFERENTES CONTEXTOS = DIFERENTES VALORES          │
├─────────────────────────────────────────────────────┤
│                                                     │
│ 1. Cuando PROGRAMAS en local:                      │
│    → Usas localhost:3000 (tu PC)                   │
│    → environment.ts lo define                      │
│                                                     │
│ 2. Cuando COMPILES para producción:                │
│    → TypeScript busca environment.prod.ts          │
│    → Usa ${API_URL} como placeholder               │
│                                                     │
│ 3. Cuando DESPLIEGAS en VPS:                       │
│    → .env proporciona API_URL real                 │
│    → docker-compose lo inyecta en contenedor       │
│    → Contenedor reemplaza ${API_URL}               │
│    → Frontend recibe URL final correcta            │
│                                                     │
│ 4. Cuando el USUARIO abre el navegador:            │
│    → Ve la URL final correcta                      │
│    → Hace requests al VPS                          │
│    → ✅ Funciona                                   │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

## 🚀 Resumen de Acciones

### AHORA (Arreglarlo en VPS):

```bash
# En VPS:
ssh sw1@uml.jkhoster.com
cd /home/sw1/jk
cp .env.production.example .env
nano .env
# Editar: POSTGRES_PASSWORD, URLs, JWT_SECRET
# Guardar: Ctrl+X, Y, Enter
docker-compose down
docker-compose up -d --build
# Esperar 3-5 minutos
curl -k https://uml.jkhoster.com/api/health
```

### DESPUÉS (Desarrollo futuro):

```bash
# Cambios de CÓDIGO (TypeScript, Angular):
# 1. Cambiar en local
# 2. Testear con ng serve
# 3. Commit a GitHub
# 4. En VPS: git pull
# 5. docker-compose down
# 6. docker-compose up -d --build  ← CRÍTICO
# 7. Esperar 3-5 minutos
# 8. Verificar en navegador

# Cambios de DATOS (BD):
# 1. En VPS: docker exec sw1-postgres psql ...
# 2. O usar API para insertar datos
# 3. NO necesita docker-compose down
```

---

## ✨ Conclusión

El problema `localhost:3000` es porque:

1. ❌ `environment.ts` fue usado en producción (debería ser `environment.prod.ts`)
2. ❌ O no hay `.env` en VPS con URLs correctas
3. ❌ O docker-compose no fue reconstruido (falta `--build`)

**La solución:**
1. ✅ Crear `.env` en VPS
2. ✅ Poner URLs correctas en `.env`
3. ✅ Reconstruir con `docker-compose up -d --build`
4. ✅ Esperar compilación de Angular (1-2 minutos)
5. ✅ Verificar en navegador

**Listo.**
