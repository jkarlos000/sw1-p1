# ⚙️ Configuración de .env en VPS - Pasos Detallados

## 🎯 Tu Situación Actual

**Problema:**
- Frontend en VPS intenta conectar a `localhost:3000`
- `localhost` en el navegador = tu computadora (NO el VPS)
- Por eso no conecta al backend del servidor

**Solución:**
- Crear `.env` en VPS con URLs correctas
- Frontend debe conectar a `https://uml.jkhoster.com/api`
- No a `localhost:3000`

---

## 📋 Archivos .env en tu Proyecto

```
c:\work\U\jk\
├── .gitignore                    ✅ Protege .env (NO se commita)
├── .env.production.example       📋 Plantilla para VPS
├── .env.local.example            📋 Plantilla para desarrollo local
│
└── backend-p1sw1\
    └── .env.example              📋 Plantilla antigua (IGNORAR en VPS)
```

### Diferencias:

| Archivo | Ubicación | Propósito | En VPS? |
|---------|-----------|----------|--------|
| `.env` | No existe, creas tú | Config REAL | ✅ SÍ, crear aquí |
| `.env.production.example` | Raíz repo | Plantilla/documentación | ❌ NO usar, es plantilla |
| `.env.local.example` | Raíz repo | Plantilla para local | ❌ NO en VPS |
| `backend-p1sw1/.env.example` | Backend | Plantilla antigua | ❌ IGNORAR en VPS |

---

## 🚀 Pasos EXACTOS para Configurar en VPS

### PASO 1: Conectar al VPS

```bash
ssh -i "C:\Ruta\A\Tu\Clave.pem" sw1@uml.jkhoster.com
```

**Reemplaza:**
- `C:\Ruta\A\Tu\Clave.pem` = ruta a tu clave privada
- `sw1@uml.jkhoster.com` = tu usuario y dominio VPS

---

### PASO 2: Ir a la carpeta del proyecto

```bash
cd /home/sw1/jk
```

**Verifica dónde estás:**
```bash
pwd
# Debe mostrar: /home/sw1/jk

ls -la
# Debe mostrar: docker-compose.yml, .env.production.example, etc
```

---

### PASO 3: Crear `.env` copiando la plantilla

```bash
cp .env.production.example .env
```

**Verifica:**
```bash
ls -la .env
# Debe mostrar el archivo creado
```

---

### PASO 4: Editar `.env` con valores reales

```bash
nano .env
```

**Ahora estás en el editor nano. Busca y CAMBIA estos valores:**

#### A. Contraseña Base de Datos (CRÍTICO)

Encuentra estas líneas:
```dotenv
POSTGRES_PASSWORD=change_me_in_production_12345
DB_PASSWORD=change_me_in_production_12345
```

Cámbialas a algo fuerte, ej:
```dotenv
POSTGRES_PASSWORD=Mi_Pwd_Super_Segura_2025_#x@z9K
DB_PASSWORD=Mi_Pwd_Super_Segura_2025_#x@z9K
```

**Requisitos:**
- Mínimo 20 caracteres
- Incluye mayúsculas, minúsculas, números, símbolos
- Diferente a `postgres` (contraseña por defecto)

#### B. URLs de Dominio (CRÍTICO)

Encuentra estas líneas:
```dotenv
DOMAIN=uml.jkhoster.com
API_URL=https://uml.jkhoster.com/api
WS_URL=https://uml.jkhoster.com
BACKEND_URL=https://uml.jkhoster.com/api
CORS_ORIGIN=https://uml.jkhoster.com
```

**VERIFICA que coincidan con tu dominio real:**
- Si tu dominio es `uml.jkhoster.com` → Déjalo igual ✅
- Si tu dominio es diferente → Cámbialo
- Si estás en IP, ej `192.168.1.100` → Usa IP en todas

Ejemplos:
```dotenv
# Opción 1: Con dominio (RECOMENDADO)
DOMAIN=uml.jkhoster.com
API_URL=https://uml.jkhoster.com/api
WS_URL=https://uml.jkhoster.com
BACKEND_URL=https://uml.jkhoster.com/api
CORS_ORIGIN=https://uml.jkhoster.com

# Opción 2: Con IP (si no tienes dominio)
DOMAIN=192.168.1.100
API_URL=http://192.168.1.100:3000
WS_URL=http://192.168.1.100:3000
BACKEND_URL=http://192.168.1.100:3000
CORS_ORIGIN=http://192.168.1.100
```

#### C. JWT Secret (SEGURIDAD)

Encuentra:
```dotenv
JWT_SECRET=your_super_secret_jwt_key_change_this_12345
```

Cámbialo a algo aleatorio, ej:
```dotenv
JWT_SECRET=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9_aLcQkEy7r5xQ2mN8p9vR3sT6wX
```

**Opción: Generar aleatorio en Linux:**
```bash
# Presiona Ctrl+X para salir de nano temporalmente
# Luego en terminal:
openssl rand -base64 48
# Copia el resultado y vuelve a nano
```

#### D. APIs Externas (OPCIONAL)

Si tienes claves de Anthropic/OpenAI, agrégalas:
```dotenv
ANTHROPIC_API_KEY=sk-ant-v1-xxxxxxxxxxx
MODELO_IA=claude-sonnet-4.5
```

Si NO tienes, déjalas vacías (el sistema funciona sin IA):
```dotenv
ANTHROPIC_API_KEY=
OPENAI_API_KEY=
```

---

### PASO 5: Guardar cambios en nano

Después de hacer todas las ediciones:

```bash
# Presiona: Ctrl + X
# Te pregunta: Save modified buffer? (Y/N): Y
# Te pregunta: File Name to Write: .env
# Presiona: Enter
```

**Verificar que se guardó:**
```bash
cat .env | head -20
# Debe mostrar tus cambios
```

---

### PASO 6: Verificar que .env está correcto

```bash
# Ver valores críticos
grep -E "DOMAIN|API_URL|POSTGRES_PASSWORD" .env

# Esperado:
# DOMAIN=uml.jkhoster.com
# API_URL=https://uml.jkhoster.com/api
# POSTGRES_PASSWORD=Mi_Pwd_Super_Segura_2025_#x@z9K
```

**Si algo está mal:**
```bash
nano .env
# Y edita nuevamente
```

---

### PASO 7: Asegurar que .env NO se commita

```bash
# Verificar .gitignore
cat .gitignore | grep ".env"

# Debe mostrar:
# .env
# .env.local
# .env.*.local
```

**Si no está, agregarlo:**
```bash
echo ".env" >> .gitignore
echo ".env.local" >> .gitignore
echo ".env.*.local" >> .gitignore
```

---

### PASO 8: Reconstruir contenedores con nuevo .env

```bash
# Detener servicios antiguos
docker-compose down

# Verificar que leyó el .env nuevo
docker-compose config | grep -E "API_URL|WS_URL" | head -5

# Construir y iniciar
docker-compose up -d --build
```

**Esperar 3-5 minutos mientras compila...**

---

### PASO 9: Verificar que funcionó

```bash
# Ver estado de contenedores
docker-compose ps

# Esperado: todos en "Up (healthy)"
```

```bash
# Verificar backend conectado a BD
docker logs sw1-backend | grep -i "connected\|database"

# NO debe mostrar errores de conexión
```

```bash
# Verificar que frontend tiene URLs correctas
docker exec sw1-frontend cat /usr/share/nginx/html/config.json

# Esperado:
# {"apiUrl":"https://uml.jkhoster.com/api","wsUrl":"https://uml.jkhoster.com"}

# NO:
# {"apiUrl":"http://localhost:3000",...}
```

```bash
# Prueba API directamente
curl -k https://uml.jkhoster.com/api/health

# Esperado: Status 200 con respuesta JSON
```

---

### PASO 10: Prueba en navegador

1. Abre: `https://uml.jkhoster.com`

2. Abre Developer Tools: `F12`

3. Ve a tab `Network`

4. Recarga: `F5`

5. Busca requests a `/api/`

6. **DEBE MOSTRAR:**
   - URL: `https://uml.jkhoster.com/api/...` ✅
   - Status: `200` ✅

7. **NO DEBE MOSTRAR:**
   - `localhost:3000` ❌
   - Errores CORS ❌
   - Status `500` ❌

---

## 🆘 Solución de Problemas

### "Sigo viendo localhost:3000"

**Causa:** Frontend aún tiene config vieja

**Solución:**
```bash
# Verificar config.json en contenedor
docker exec sw1-frontend cat /usr/share/nginx/html/config.json

# Si muestra localhost:3000:
docker-compose down
docker-compose up -d --build
# Esperar 5 minutos completos
```

### "CORS error"

**Causa:** `CORS_ORIGIN` no coincide con tu dominio

**Solución:**
```bash
# Editar .env
nano .env

# Cambiar CORS_ORIGIN a tu dominio exacto:
# CORS_ORIGIN=https://uml.jkhoster.com

# Salvar y reconstruir:
docker-compose down
docker-compose up -d --build
```

### "No puedo editar .env"

**Si obtienes error de permisos:**
```bash
# Ver permisos
ls -la .env

# Si dice "-rw------- root root":
sudo chown sw1:sw1 .env
sudo chmod 600 .env

# Intentar editar nuevamente
nano .env
```

### "docker-compose up -d --build falla"

**Verificar logs:**
```bash
docker-compose logs backend | tail -50
docker-compose logs frontend | tail -50

# Buscar el error real
```

**Posible causa: Contraseña BD incorrecta**
```bash
# Editar .env
nano .env

# Cambiar POSTGRES_PASSWORD a algo diferente
# Luego:
docker-compose down
# Eliminar volumen BD (⚠️ PIERDE DATOS):
docker volume rm uml-flutter_postgres_data
# O instalar BD limpia antes:
docker-compose up -d postgres
# Esperar health check
docker-compose exec postgres psql -U postgres -d parcial1sw1 -f /docker-entrypoint-initdb.d/01-schema.sql
# Luego:
docker-compose up -d --build
```

---

## 📞 Resumen de Comandos

```bash
# 1. Conectar al VPS
ssh -i "tu_clave.pem" sw1@uml.jkhoster.com

# 2. Ir a proyecto
cd /home/sw1/jk

# 3. Crear .env
cp .env.production.example .env

# 4. Editar
nano .env
# (Cambiar: POSTGRES_PASSWORD, URLs, JWT_SECRET)
# Guardar: Ctrl+X, Y, Enter

# 5. Verificar
grep -E "DOMAIN|API_URL|POSTGRES_PASSWORD" .env

# 6. Reconstruir
docker-compose down
docker-compose up -d --build

# 7. Esperar 3-5 minutos

# 8. Verificar
docker-compose ps
curl -k https://uml.jkhoster.com/api/health

# 9. Probar navegador
# https://uml.jkhoster.com → F12 → Network → Ver requests
```

---

## ✅ Checklist Final

- [ ] Conecté al VPS vía SSH
- [ ] Creé `.env` copiando `.env.production.example`
- [ ] Cambié `POSTGRES_PASSWORD` a valor seguro
- [ ] Cambié `DB_PASSWORD` a mismo valor
- [ ] Cambié `JWT_SECRET` a valor aleatorio
- [ ] Verifiqué URLs apunten a mi dominio (no localhost)
- [ ] Guardé `.env` en nano (Ctrl+X, Y, Enter)
- [ ] Ejecuté `docker-compose down`
- [ ] Ejecuté `docker-compose up -d --build`
- [ ] Esperé 3-5 minutos
- [ ] Ejecuté `docker-compose ps` y todos están "Up (healthy)"
- [ ] Verificé `curl -k https://uml.jkhoster.com/api/health`
- [ ] Abrí navegador en `https://uml.jkhoster.com`
- [ ] Abrí F12, Network tab
- [ ] Vi requests a `/api/` con URLs correctas (no localhost)
- [ ] NO hay errores CORS

✨ **Si todo pasó, ¡funciona correctamente!**
