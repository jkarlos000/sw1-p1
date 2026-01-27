# ⚡ REFERENCIA RÁPIDA: REBUILD CONTENEDORES

**Cuando el código cambia pero el sitio sigue igual → Reconstruir contenedores**

---

## 🚀 COMANDO RÁPIDO

```bash
cd /home/sw1/jk
docker-compose down
docker-compose up -d --build
```

**Esperar 3 minutos. Listo.**

---

## ✅ VERIFICAR

```bash
# Todos "Up (healthy)"
docker-compose ps

# Sitio web actualizado
curl -k https://uml.jkhoster.com/api/health
```

---

## 🔧 SI NO FUNCIONA

**Opción 1: Reconstruir sin caché**
```bash
docker-compose down
docker-compose build --no-cache backend frontend
docker-compose up -d
```

**Opción 2: Ver logs**
```bash
docker-compose logs backend
docker-compose logs frontend
```

**Opción 3: Limpiar todo y reintentar**
```bash
docker-compose down
docker system prune -f
docker-compose up -d --build
```

---

## 📚 MÁS INFO

→ [VPS_REBUILD_CONTAINERS.md](VPS_REBUILD_CONTAINERS.md)

---

**Resumen:** Sin `--build`, Docker no recompila. Con `--build`, sí.
