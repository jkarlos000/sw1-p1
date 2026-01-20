# 🗄️ Base de Datos - Sistema UML Colaborativo

Esquemas y datos de la base de datos PostgreSQL.

## 📁 Archivos Principales

### `schema.sql` ✅
**Esquema consolidado con todas las tablas del sistema.**

Incluye:
- **Usuarios y Salas:**
  - `usuario` - Usuarios del sistema
  - `sala` - Salas de colaboración
  - `asistencia` - Registro de participantes en salas

- **Chat IA:**
  - `conversacion_ia` - Conversaciones con la IA
  - `mensaje_chat_ia` - Mensajes del chat IA
  - `snapshot_diagrama` - Snapshots de diagramas
  - `config_ia` - Configuración de IA por sala

- **Multimodal:**
  - `mensaje_attachment` - Attachments (audio/imágenes)

- **UML 2.5:**
  - `clase_uml` - Clases UML con posición
  - `atributo_clase` - Atributos de clases
  - `metodo_clase` - Métodos de clases
  - `parametro_metodo` - Parámetros de métodos

- **Extras:**
  - Índices para rendimiento
  - Triggers y funciones
  - Comentarios en tablas

**Ejecutar:**
```bash
psql -U postgres -d parcial1sw1 -f schema.sql
```

### `seed.sql` ✅
**Datos de prueba completos para desarrollo.**

Incluye:
- 6 usuarios de ejemplo
- 5 salas con diferentes configuraciones
- 10 registros de asistencia
- 5 conversaciones de IA
- 11 mensajes de chat (usuario, IA, sistema)
- 2 attachments multimodales (audio + imagen)
- 3 snapshots de diagramas
- 3 clases UML con atributos y métodos
- 12 atributos de ejemplo
- 9 métodos con 4 parámetros

**Ejecutar:**
```bash
psql -U postgres -d parcial1sw1 -f seed.sql
```

### `drop-tables.sql`
**Script para eliminar todas las tablas.**

⚠️ **ADVERTENCIA:** Elimina todos los datos del sistema.

Elimina en orden:
1. Tablas UML 2.5 (parametro_metodo, metodo_clase, atributo_clase, clase_uml)
2. Tablas de IA (mensaje_attachment, snapshot_diagrama, mensaje_chat_ia, conversacion_ia, config_ia)
3. Tablas principales (asistencia, sala, usuario)
4. Funciones y triggers

**Ejecutar:**
```bash
psql -U postgres -d parcial1sw1 -f drop-tables.sql
```

## 🐳 Docker

Los archivos se ejecutan automáticamente con Docker Compose:

```yaml
volumes:
  - ./backend-p1sw1/database/schema.sql:/docker-entrypoint-initdb.d/01-schema.sql
  - ./backend-p1sw1/database/seed.sql:/docker-entrypoint-initdb.d/02-seed.sql
```

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

### UML 2.5 - Persistencia de Métodos
```
sala
  ↓
clase_uml (cell_id, nombre_clase, x_position, y_position)
  ↓
atributo_clase (nombre, tipo, visibility, es_static)
metodo_clase (nombre, tipo_retorno, visibility, es_abstract)
  ↓
parametro_metodo (nombre, tipo, orden_parametro)
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
psql -U postgres -d parcial1sw1 < backup_20260120.sql

# Restaurar desde cero
dropdb -U postgres parcial1sw1
createdb -U postgres parcial1sw1
psql -U postgres -d parcial1sw1 -f schema.sql
psql -U postgres -d parcial1sw1 -f seed.sql
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
SELECT 'attachments', COUNT(*) FROM mensaje_attachment
UNION ALL
SELECT 'clases_uml', COUNT(*) FROM clase_uml
UNION ALL
SELECT 'atributos', COUNT(*) FROM atributo_clase
UNION ALL
SELECT 'metodos', COUNT(*) FROM metodo_clase;

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
ORDER BY ma.created_at DESC;

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

-- Ver clases UML con atributos y métodos
SELECT 
  cu.nombre_clase,
  COUNT(DISTINCT ac.id_atributo) as num_atributos,
  COUNT(DISTINCT mc.id_metodo) as num_metodos,
  s.nombre_sala
FROM clase_uml cu
LEFT JOIN atributo_clase ac ON cu.id_clase = ac.id_clase
LEFT JOIN metodo_clase mc ON cu.id_clase = mc.id_clase
JOIN sala s ON cu.id_sala = s.id_sala
GROUP BY cu.id_clase, cu.nombre_clase, s.nombre_sala;
```

## 📝 Notas de Desarrollo

### Índices Importantes
- **Chat IA:**
  - `idx_mensaje_attachment_mensaje` - Foreign key a mensaje_chat_ia
  - `idx_mensaje_attachment_tipo` - Búsqueda por tipo (audio/imagen)
  - `idx_mensaje_chat_conversacion` - Mensajes por conversación
  - `idx_conversacion_sala` - Conversaciones por sala

- **UML 2.5:**
  - `idx_clase_sala` - Clases por sala
  - `idx_clase_cell_id` - Búsqueda por ID de celda JointJS
  - `idx_atributo_clase` - Atributos por clase
  - `idx_metodo_clase` - Métodos por clase
  - `idx_parametro_metodo` - Parámetros por método

### Triggers
- `trigger_actualizar_fecha_conversacion` - Actualiza fecha_ultima_actualizacion en conversacion_ia cuando se inserta un mensaje
- `trigger_actualizar_fecha_clase` - Actualiza fecha_actualizacion en clase_uml antes de UPDATE

### Tipos Enumerados (CHECK)
- `mensaje_chat_ia.tipo_mensaje` → 'usuario', 'ia', 'sistema'
- `mensaje_attachment.tipo` → 'audio', 'imagen'

---

**Última actualización:** Enero 2026  
**Versión:** 2.0 (Schema Consolidado + Multimodal)
