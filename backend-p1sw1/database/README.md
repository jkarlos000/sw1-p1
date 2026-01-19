# 🗄️ Base de Datos - Sistema UML Colaborativo

Esquemas y datos de la base de datos PostgreSQL.

## 📁 Archivos Principales

### `schema-completo.sql` ✅
**Esquema consolidado con todas las tablas del sistema.**

Incluye:
- `usuario` - Usuarios del sistema
- `sala` - Salas de colaboración
- `asistencia` - Registro de participantes en salas
- `conversacion_ia` - Conversaciones con la IA
- `mensaje_chat_ia` - Mensajes del chat IA
- `mensaje_attachment` - Attachments multimodales (audio/imágenes)
- `snapshot_diagrama` - Snapshots de diagramas
- `config_ia` - Configuración de IA por sala
- Índices, triggers y funciones

**Ejecutar:**
```bash
psql -U postgres -d parcial1sw1 -f schema-completo.sql
```

### `seed-completo.sql` ✅
**Datos de prueba completos para desarrollo.**

Incluye:
- 6 usuarios de ejemplo
- 5 salas con diferentes configuraciones
- 10 registros de asistencia
- 5 conversaciones de IA
- 11 mensajes de chat (usuario, IA, sistema)
- 2 attachments multimodales (audio + imagen)
- 3 snapshots de diagramas

**Ejecutar:**
```bash
psql -U postgres -d parcial1sw1 -f seed-completo.sql
```

### `drop-tables.sql`
**Script para eliminar todas las tablas.**

⚠️ **ADVERTENCIA:** Elimina todos los datos del sistema.

**Ejecutar:**
```bash
psql -U postgres -d parcial1sw1 -f drop-tables.sql
```

## 🐳 Docker

Los archivos se ejecutan automáticamente con Docker Compose:

```yaml
volumes:
  - ./backend-p1sw1/database/schema-completo.sql:/docker-entrypoint-initdb.d/01-schema.sql
  - ./backend-p1sw1/database/seed-completo.sql:/docker-entrypoint-initdb.d/02-seed.sql
```

## 🔄 Migración desde Archivos Antiguos

Los archivos antiguos fueron renombrados con extensión `.old`:
- `schema.sql.old` ❌ (reemplazado por schema-completo.sql)
- `chat-ia-schema.sql.old` ❌ (consolidado en schema-completo.sql)
- `multimodal-schema.sql.old` ❌ (consolidado en schema-completo.sql)
- `seed.sql.old` ❌ (reemplazado por seed-completo.sql)

**No usar estos archivos antiguos.** Se mantienen solo como referencia histórica.

## 📊 Estructura de Tablas

### Core del Sistema
```
usuario (id_usuario, email, password)
  ↓
sala (id_sala, nombre_sala, host_sala, informacion)
  ↓
asistencia (id_usuario, id_sala, fecha_hora)
```

### Sistema de IA
```
sala
  ↓
config_ia (modelo, temperatura, system_prompt)
  ↓
conversacion_ia (titulo, contexto_inicial, activa)
  ↓
mensaje_chat_ia (tipo_mensaje, contenido, metadata)
  ↓
mensaje_attachment (tipo: audio/imagen, transcripcion, analisis_ia)
  ↓
snapshot_diagrama (diagrama_json, descripcion)
```

## 🎙️ Funcionalidades Multimodales

La tabla `mensaje_attachment` soporta:

### Audio
- Transcripción de voz a texto
- Servicios: AssemblyAI, OpenAI Whisper, Deepgram, Google Speech
- Campos: `transcripcion`, `duracion_segundos`, `servicio_transcripcion`

### Imágenes
- Análisis visual con Claude Vision
- Detección de diagramas UML dibujados a mano
- Campos: `analisis_ia`, `ancho`, `alto`

## 🔧 Comandos Útiles

### Backup
```bash
# Backup completo
pg_dump -U postgres parcial1sw1 > backup_$(date +%Y%m%d).sql

# Backup solo datos
pg_dump -U postgres -a parcial1sw1 > backup_data.sql

# Backup solo esquema
pg_dump -U postgres -s parcial1sw1 > backup_schema.sql
```

### Restaurar
```bash
# Restaurar completo
psql -U postgres -d parcial1sw1 < backup_20260116.sql

# Restaurar desde cero
dropdb -U postgres parcial1sw1
createdb -U postgres parcial1sw1
psql -U postgres -d parcial1sw1 -f schema-completo.sql
psql -U postgres -d parcial1sw1 -f seed-completo.sql
```

### Consultas Útiles
```sql
-- Ver todas las tablas
\dt

-- Ver estructura de una tabla
\d mensaje_attachment

-- Contar registros
SELECT 
  'usuarios' as tabla, COUNT(*) FROM usuario
UNION ALL
SELECT 'salas', COUNT(*) FROM sala
UNION ALL
SELECT 'conversaciones', COUNT(*) FROM conversacion_ia
UNION ALL
SELECT 'mensajes', COUNT(*) FROM mensaje_chat_ia
UNION ALL
SELECT 'attachments', COUNT(*) FROM mensaje_attachment;

-- Ver attachments multimodales
SELECT 
  ma.tipo,
  ma.archivo_nombre,
  ma.archivo_tamano / 1024 as kb,
  ma.transcripcion,
  ma.servicio_transcripcion,
  m.contenido as mensaje
FROM mensaje_attachment ma
JOIN mensaje_chat_ia m ON ma.mensaje_id = m.id_mensaje
ORDER BY ma.fecha_subida DESC;

-- Ver configuración de IA por sala
SELECT 
  s.nombre_sala,
  c.modelo,
  c.temperatura,
  c.max_tokens,
  c.configuracion_extra->>'supports_vision' as vision,
  c.configuracion_extra->>'supports_audio' as audio
FROM config_ia c
JOIN sala s ON c.id_sala = s.id_sala;
```

## 📝 Notas de Desarrollo

### Índices Importantes
- `idx_mensaje_attachment_mensaje` - Foreign key a mensaje_chat_ia
- `idx_mensaje_attachment_tipo` - Búsqueda por tipo (audio/imagen)
- `idx_mensaje_chat_conversacion` - Mensajes por conversación
- `idx_conversacion_sala` - Conversaciones por sala

### Triggers
- `trigger_actualizar_fecha_conversacion` - Actualiza fecha_ultima_modificacion en conversacion_ia cuando se inserta un mensaje

### Tipos Enumerados (CHECK)
- `mensaje_chat_ia.tipo_mensaje` → 'usuario', 'ia', 'sistema'
- `mensaje_attachment.tipo` → 'audio', 'imagen'

---

**Última actualización:** Enero 2026  
**Versión:** 2.0 (Schema Consolidado + Multimodal)
