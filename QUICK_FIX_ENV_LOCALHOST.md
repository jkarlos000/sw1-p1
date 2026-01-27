# ⚡ REFERENCIA RÁPIDA: Problema localhost:3000

## El Problema en 1 Línea

Tu frontend en VPS intenta conectar a `localhost:3000` (tu PC) en lugar de `https://uml.jkhoster.com/api` (el VPS).

## La Solución en 5 Pasos

```bash
# En el VPS:
ssh sw1@uml.jkhoster.com
cd /home/sw1/jk
cp .env.production.example .env
nano .env                          # Edita: POSTGRES_PASSWORD, URLs, JWT_SECRET
docker-compose down && docker-compose up -d --build
# Espera 3-5 minutos, luego abre navegador en https://uml.jkhoster.com
```

## ¿Por Qué Pasa?

```
Sin .env en VPS:
  ❌ docker-compose no sabe qué URL poner
  ❌ Frontend se compila con localhost:3000 (por defecto)
  ❌ Navegador busca localhost:3000 en TU PC
  ❌ No encuentra nada
  ❌ ERROR: API no responde

Con .env correcto:
  ✅ docker-compose sabe la URL real
  ✅ Frontend se compila con https://uml.jkhoster.com/api
  ✅ Navegador conecta al VPS
  ✅ Backend responde
  ✅ ¡FUNCIONA!
```

## Archivos Clave

| Archivo | Ubicación | Propósito |
|---------|-----------|----------|
| `environment.ts` | `official-sw1p1/src/environments/` | Desarrollo: `localhost:3000` |
| `environment.prod.ts` | `official-sw1p1/src/environments/` | Producción: `${API_URL}` |
| `.env.production.example` | Raíz VPS | Plantilla (copiar como .env) |
| `.env` | Raíz VPS | Valores reales (TÚ CREAS ESTO) |
| `docker-compose.yml` | Raíz VPS | Lee .env, pasa a contenedores |

## Qué Editar en .env

```dotenv
# Cambiar estas líneas:
POSTGRES_PASSWORD=cambiar_esto → Mi_Pwd_Segura_2025_#x@z9K
DB_PASSWORD=cambiar_esto → Mi_Pwd_Segura_2025_#x@z9K
JWT_SECRET=cambiar_esto → valor_aleatorio_fuerte

# Verificar que tengan estos valores:
DOMAIN=uml.jkhoster.com ✅
API_URL=https://uml.jkhoster.com/api ✅
WS_URL=https://uml.jkhoster.com ✅
CORS_ORIGIN=https://uml.jkhoster.com ✅
```

## Verificación Rápida

```bash
# Ver si .env existe
test -f .env && echo "✅ Existe" || echo "❌ No existe"

# Ver valores
grep -E "API_URL|DOMAIN" .env

# Ver logs
docker-compose logs frontend | grep -i "localhost\|api\|url"

# En navegador, F12 → Network → Ver requests a /api/
# ✅ Deben ir a: https://uml.jkhoster.com/api
# ❌ NO a: http://localhost:3000
```

## Checklist

- [ ] Creé `.env` desde `.env.production.example`
- [ ] Edité contraseña BD (POSTGRES_PASSWORD, DB_PASSWORD)
- [ ] Edité JWT_SECRET
- [ ] Verifiqué URLs (API_URL, WS_URL, CORS_ORIGIN)
- [ ] Ejecuté `docker-compose down && docker-compose up -d --build`
- [ ] Esperé 3-5 minutos
- [ ] `docker-compose ps` muestra "Up (healthy)"
- [ ] Abrí navegador, F12, Network tab
- [ ] Vi requests a `/api/` (no localhost:3000)

✅ **Si todo pasó, ¡FUNCIONA!**

---

**Documentación completa:** Ver [CONFIGURAR_ENV_EN_VPS.md](CONFIGURAR_ENV_EN_VPS.md)

**Índice de todos los docs:** Ver [INDICE_CONFIGURACION_ENV.md](INDICE_CONFIGURACION_ENV.md)
