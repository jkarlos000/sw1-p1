# Configuración de URLs del Backend

Este proyecto usa un sistema de configuración basado en archivos para gestionar las URLs del backend de forma segura y flexible.

## 📋 Cómo funciona

1. **Configuración en runtime**: Las URLs se cargan desde `assets/config.json` cuando la aplicación inicia
2. **No se commitea**: El archivo `config.json` está en `.gitignore` para evitar exponer URLs específicas
3. **Ejemplo incluido**: El archivo `config.example.json` SÍ se commitea como referencia

## 🚀 Configuración para Desarrollo

### Primera vez o después de clonar el repositorio:

```bash
# Navegar a la carpeta de assets
cd official-sw1p1/src/assets

# Copiar el archivo de ejemplo
cp config.example.json config.json

# Editar con tus URLs locales
# Usar tu editor favorito para modificar config.json
```

### Contenido de `config.json`:

```json
{
  "apiUrl": "http://localhost:3000",
  "wsUrl": "http://localhost:3000"
}
```

Para desarrollo remoto (VPS, servidor de pruebas):

```json
{
  "apiUrl": "http://uml.jkhoster.com:3000",
  "wsUrl": "http://uml.jkhoster.com:3000"
}
```

## 🌍 Configuración para Producción

### Opción 1: Manual

Crear el archivo `config.json` en el servidor con las URLs de producción:

```json
{
  "apiUrl": "https://api.tudominio.com",
  "wsUrl": "https://api.tudominio.com"
}
```

### Opción 2: Con Docker

En tu `Dockerfile`, puedes crear el archivo dinámicamente:

```dockerfile
# Crear config.json durante el build
RUN echo '{"apiUrl":"'$API_URL'","wsUrl":"'$WS_URL'"}' > /usr/share/nginx/html/assets/config.json
```

### Opción 3: Con variables de entorno en el servidor

Script para generar `config.json` desde variables de entorno:

```bash
#!/bin/bash
cat > /path/to/app/assets/config.json << EOF
{
  "apiUrl": "${API_URL}",
  "wsUrl": "${WS_URL}"
}
EOF
```

## 🔒 Seguridad

### ¿Por qué las URLs NO son sensibles?

Las URLs del backend **NO son secretas** porque:

1. **Código del frontend es público**: El navegador siempre puede ver las peticiones HTTP
2. **Las URLs son necesariamente públicas**: Cualquier usuario puede inspeccionar el tráfico de red
3. **La seguridad está en el backend**: Autenticación, autorización y validación

### ⚠️ Lo que SÍ debe ser privado (en el backend):

```bash
# backend-p1sw1/.env (NUNCA commitear)
DB_PASSWORD=secret123
ANTHROPIC_API_KEY=sk-ant-xxxxx
OPENAI_API_KEY=sk-xxxxx
JWT_SECRET=your-secret-key
```

## 📝 Archivos Importantes

| Archivo | Se commitea | Propósito |
|---------|-------------|-----------|
| `config.example.json` | ✅ SÍ | Plantilla de referencia |
| `config.json` | ❌ NO | Configuración real (en .gitignore) |
| `.gitignore` | ✅ SÍ | Excluye config.json |

## 🛠️ Uso en el código

El código ahora usa `ConfigService` en lugar de `environment`:

### Antes:
```typescript
import { environment } from '../environments/environment';
private apiUrl = environment.apiUrl;
```

### Ahora:
```typescript
import { ConfigService } from './common/services/config.service';
constructor(private configService: ConfigService) {}
private get apiUrl() { return this.configService.apiUrl; }
```

## 🔄 Flujo de carga

1. App arranca
2. `APP_INITIALIZER` ejecuta `ConfigService.loadConfig()`
3. Se carga `assets/config.json`
4. Los servicios acceden a las URLs via `configService.apiUrl` y `configService.wsUrl`

## ❓ Troubleshooting

### Error: "Cannot GET /assets/config.json"

**Causa**: No existe el archivo `config.json`

**Solución**: 
```bash
cp src/assets/config.example.json src/assets/config.json
```

### Las URLs no se actualizan

**Causa**: Caché del navegador

**Solución**: 
- Hacer hard refresh (Ctrl+Shift+R / Cmd+Shift+R)
- O limpiar caché del navegador

### En producción no funciona

**Causa**: El archivo `config.json` no se incluyó en el build o deployment

**Solución**: 
- Verificar que `assets/config.json` existe en el servidor
- Revisar la configuración de nginx/Apache para servir archivos estáticos
