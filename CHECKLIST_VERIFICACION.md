# ✅ Checklist de Verificación - Chat Multimodal

## Pre-Instalación

- [ ] Node.js 18+ instalado
- [ ] Docker y Docker Compose instalados
- [ ] PostgreSQL corriendo (docker-compose up -d)
- [ ] Puerto 3000 libre (backend)
- [ ] Puerto 4200 libre (frontend)

## Backend

### Archivos Creados
- [ ] `backend-p1sw1/database/multimodal-schema.sql`
- [ ] `backend-p1sw1/services/transcription.service.ts`
- [ ] `backend-p1sw1/middleware/upload.middleware.ts`
- [ ] `backend-p1sw1/controller/chat-ia-multimodal.controller.ts`

### Dependencias NPM
- [ ] `multer` instalado
- [ ] `@types/multer` instalado
- [ ] `form-data` instalado
- [ ] `axios` instalado
- [ ] (Opcional) `@google-cloud/speech` instalado
- [ ] (Opcional) `sharp` instalado

### Base de Datos
- [ ] Schema `multimodal-schema.sql` aplicado
- [ ] Tabla `mensaje_attachment` creada
- [ ] Columnas `tiene_attachments` y `metadata_multimodal` agregadas

### Configuración
- [ ] Archivo `.env` existe en `backend-p1sw1/`
- [ ] `ANTHROPIC_API_KEY` configurada (requerido)
- [ ] Al menos una API key de transcripción configurada:
  - [ ] `ASSEMBLYAI_API_KEY` (recomendado)
  - [ ] O `OPENAI_API_KEY`
  - [ ] O `DEEPGRAM_API_KEY`
  - [ ] O `GOOGLE_CLOUD_KEY_PATH`
  - [ ] O Whisper local instalado
- [ ] (Opcional) `TRANSCRIPTION_PROVIDER` especificado

### Rutas
- [ ] Ruta `/chat-ia/mensaje-multimodal` agregada en `routes/router.ts`
- [ ] Ruta `/chat-ia/mensaje/:id/attachments` agregada
- [ ] Ruta `/chat-ia/attachment/:id/download` agregada
- [ ] Import de `chat-ia-multimodal.controller` agregado
- [ ] Import de `upload.middleware` agregado

### Directorio
- [ ] Carpeta `uploads/` creada en raíz de backend
- [ ] Permisos de escritura correctos en `uploads/`

## Frontend

### Archivos Creados
- [ ] `src/app/diagramador/chat-ia/audio-recorder.service.ts`
- [ ] `src/app/diagramador/chat-ia/chat-attachments.component.ts`

### Servicios Actualizados
- [ ] `chat-ia.service.ts` tiene método `enviarMensajeMultimodal()`
- [ ] `chat-ia.service.ts` tiene método `obtenerAttachments()`
- [ ] `chat-ia.service.ts` tiene método `getAttachmentDownloadUrl()`

### Integración (Opcional para MVP)
- [ ] `ChatAttachmentsComponent` importado en `chat-ia.component.ts`
- [ ] Componente agregado al template de `chat-ia.component.html`
- [ ] Método `onAttachmentsChange()` implementado
- [ ] Método `hasAttachments()` implementado
- [ ] Lógica de envío actualizada para soportar multimodal

## Testing Backend

### Servidor Iniciado
- [ ] `npm start` ejecuta sin errores
- [ ] Mensaje "🎤 Transcripción configurada: [servicio]" aparece en consola
- [ ] Mensaje "✅ PostgreSQL conectado" aparece

### Endpoints Funcionando
```bash
# Test básico
curl http://localhost:3000/health

# Test multimodal (reemplazar valores)
curl -X POST http://localhost:3000/chat-ia/mensaje-multimodal \
  -F "id_sala=1" \
  -F "id_usuario=1" \
  -F "contenido=Prueba" \
  -F "diagrama_actual={}"
```

- [ ] Endpoint `/health` responde 200 OK
- [ ] Endpoint `/chat-ia/mensaje-multimodal` responde (puede ser 400 si faltan datos)
- [ ] No hay errores 500 en los logs

### Transcripción
- [ ] Crear archivo de audio de prueba (test.mp3 o test.webm)
- [ ] Enviar via endpoint multimodal
- [ ] Verificar logs: "🎤 Transcribiendo con [servicio]"
- [ ] Verificar logs: "✅ Transcrito: ..."
- [ ] Sin mensajes "❌ Error transcribiendo"

### Imágenes
- [ ] Crear archivo de imagen de prueba (test.jpg)
- [ ] Enviar via endpoint multimodal
- [ ] Verificar logs: "📷 Imagen cargada: test.jpg"
- [ ] Sin errores de Claude Vision

## Testing Frontend

### Servidor Iniciado
- [ ] `npm start` ejecuta sin errores
- [ ] Navegador abre en `http://localhost:4200`
- [ ] Sin errores de compilación en consola

### UI Básica
- [ ] Login funciona
- [ ] Crear/unirse a sala funciona
- [ ] Chat IA se abre con botón flotante
- [ ] Mensajes de texto funcionan (sin attachments)

### Componente de Attachments (si está integrado)
- [ ] Botón 🎤 micrófono visible
- [ ] Botón 📤 subir audio visible
- [ ] Botón 📷 subir imagen visible
- [ ] Click en botones no genera errores

### Grabación de Audio
- [ ] Click en 🎤 solicita permiso de micrófono
- [ ] Indicador de grabación aparece (punto rojo pulsante)
- [ ] Timer cuenta segundos
- [ ] Click nuevamente detiene grabación
- [ ] Preview del audio aparece
- [ ] Botón ❌ elimina el audio

### Carga de Archivos
- [ ] Click en 📤 abre explorador de archivos (audio)
- [ ] Seleccionar archivo agrega preview
- [ ] Click en 📷 abre explorador de archivos (imágenes)
- [ ] Imágenes muestran miniatura
- [ ] Múltiples archivos se pueden agregar

### Envío Multimodal
- [ ] Con audio adjunto, botón "Enviar" se activa
- [ ] Click envía mensaje
- [ ] Indicador "IA está procesando" aparece
- [ ] No hay errores en DevTools Console
- [ ] Respuesta de IA llega después de unos segundos

### Network (DevTools)
- [ ] Request a `/chat-ia/mensaje-multimodal` aparece
- [ ] Content-Type es `multipart/form-data`
- [ ] FormData contiene: contenido, audios, imagenes, diagrama_actual
- [ ] Response es 200 OK con JSON

## Funcionalidad End-to-End

### Caso 1: Solo Audio
1. [ ] Entrar a sala
2. [ ] Abrir chat IA
3. [ ] Grabar audio: "Agrega una clase Usuario"
4. [ ] Enviar
5. [ ] IA responde con texto
6. [ ] (Opcional) IA modifica diagrama

### Caso 2: Solo Imagen
1. [ ] Subir imagen de diagrama en papel
2. [ ] Escribir: "Convierte este diagrama"
3. [ ] Enviar
4. [ ] IA responde describiendo lo que ve
5. [ ] (Opcional) IA genera acciones de creación

### Caso 3: Audio + Imagen
1. [ ] Subir imagen de boceto
2. [ ] Grabar audio explicando lo que necesitas
3. [ ] Enviar
4. [ ] IA procesa ambos contextos
5. [ ] Respuesta combina información visual y auditiva

### Caso 4: Múltiples Archivos
1. [ ] Agregar 2 audios diferentes
2. [ ] Agregar 3 imágenes diferentes
3. [ ] Enviar
4. [ ] Verificar que todos se procesan
5. [ ] Verificar en BD tabla `mensaje_attachment`

## Verificación en Base de Datos

```sql
-- Verificar tabla existe
\d mensaje_attachment

-- Ver mensajes con attachments
SELECT id_mensaje, contenido, tiene_attachments, metadata_multimodal
FROM mensaje_chat_ia
WHERE tiene_attachments = TRUE;

-- Ver attachments
SELECT ma.id, ma.tipo, ma.archivo_nombre, ma.transcripcion
FROM mensaje_attachment ma
JOIN mensaje_chat_ia m ON ma.mensaje_id = m.id_mensaje
ORDER BY ma.created_at DESC
LIMIT 10;
```

- [ ] Tabla `mensaje_attachment` existe
- [ ] Mensajes con attachments tienen `tiene_attachments = TRUE`
- [ ] Registros en `mensaje_attachment` se crean correctamente
- [ ] Transcripciones se guardan en campo `transcripcion`
- [ ] URLs de archivos apuntan a `/uploads/sala_X/...`

## Verificación de Archivos en Disco

```bash
# Backend
ls -la backend-p1sw1/uploads/sala_*/
```

- [ ] Directorio `uploads/` existe
- [ ] Subdirectorios por sala se crean: `sala_1/`, `sala_2/`, etc.
- [ ] Archivos de audio se guardan (.webm, .mp3, etc.)
- [ ] Archivos de imagen se guardan (.jpg, .png, etc.)
- [ ] Nombres de archivo son únicos (timestamp + random)

## Costos y Performance

### APIs
- [ ] Verificar consumo en dashboard de AssemblyAI/OpenAI
- [ ] Costos están dentro del presupuesto esperado
- [ ] No hay errores de límite de rate

### Performance
- [ ] Transcripción toma < 15 segundos para audio de 1 minuto
- [ ] Análisis de imagen toma < 8 segundos
- [ ] Respuesta total < 25 segundos
- [ ] No hay timeouts

## Documentación

- [ ] README.md actualizado con sección multimodal
- [ ] INSTALACION_MULTIMODAL.md creado
- [ ] GUIA_USO_MULTIMODAL.md creado
- [ ] RESUMEN_IMPLEMENTACION.md creado
- [ ] EJEMPLO_INTEGRACION.ts creado
- [ ] Scripts de setup creados (sh y ps1)

## Troubleshooting Común

### "Module 'multer' not found"
- [ ] Ejecutar `npm install multer @types/multer` en backend

### "Cannot access 'uploadMultipleFiles'"
- [ ] Verificar import en `routes/router.ts`
- [ ] Verificar que `upload.middleware.ts` exporta correctamente

### "Permiso de micrófono denegado"
- [ ] Permitir acceso en configuración del navegador
- [ ] Usar HTTPS o localhost (HTTP solo funciona en localhost)

### "API key not found"
- [ ] Verificar `.env` tiene la API key correcta
- [ ] Reiniciar servidor backend después de cambiar `.env`
- [ ] No hay espacios antes/después del `=` en `.env`

### "Transcripción falla"
- [ ] Verificar que el servicio esté disponible (dashboard de la API)
- [ ] Verificar límites de rate
- [ ] Probar con otro servicio (cambiar `TRANSCRIPTION_PROVIDER`)
- [ ] Ver logs: "🎤 Transcribiendo con [servicio]"

### "Claude Vision no detecta clases"
- [ ] Verificar que `ANTHROPIC_API_KEY` es válida
- [ ] Imagen tiene buena calidad y contraste
- [ ] Texto es legible (manuscrito o impreso)
- [ ] Probar con imagen de mejor calidad

## Conclusión

Si todos los checks están ✅:
- **Backend:** Configurado correctamente
- **Frontend:** Componentes creados
- **BD:** Schema aplicado
- **APIs:** Funcionando

**Estado:** ✅ Listo para producción / 🚧 Requiere integración frontend

---

**Fecha de verificación:** _________________

**Verificado por:** _________________

**Notas adicionales:**
