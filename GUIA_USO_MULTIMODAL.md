# 🎤📸 Guía de Uso - Chat Multimodal

## Integración en el Componente Chat

### Paso 1: Importar Componente de Attachments

En `chat-ia.component.ts`:

```typescript
import { ChatAttachmentsComponent } from './chat-attachments.component';

@Component({
  selector: 'app-chat-ia',
  standalone: true,
  imports: [CommonModule, FormsModule, ChatAttachmentsComponent],  // ← Agregar
  //...
})
export class ChatIaComponent {
  // ...
  attachments = signal<AttachmentData>({ audios: [], imagenes: [] });
  
  // Método para enviar mensaje
  async enviarMensaje(): Promise<void> {
    const contenido = this.mensajeInput();
    const attachmentsData = this.attachments();
    
    // Si no hay contenido ni attachments, no enviar
    if (!contenido.trim() && attachmentsData.audios.length === 0 && attachmentsData.imagenes.length === 0) {
      return;
    }
    
    const diagramaActual = this.getDiagramaActual ? this.getDiagramaActual() : null;
    const conversacion = this.conversacionActual();
    const usuarioId = this.authService.getCurrentUserId();
    
    // Decidir si usar endpoint multimodal o texto simple
    if (attachmentsData.audios.length > 0 || attachmentsData.imagenes.length > 0) {
      // MULTIMODAL
      this.iaEscribiendo.set(true);
      
      try {
        const respuesta = await this.chatService.enviarMensajeMultimodal(
          conversacion?.id_conversacion!,
          this.idSala,
          usuarioId,
          contenido,
          diagramaActual,
          attachmentsData.audios,
          attachmentsData.imagenes
        ).toPromise();
        
        // Agregar mensaje del usuario
        this.mensajes.update(msgs => [...msgs, {
          tipo_mensaje: 'usuario',
          contenido: respuesta.mensaje_usuario.contenido,
          fecha_envio: new Date(),
          usuario_email: this.authService.getCurrentUserEmail()
        }]);
        
        // La respuesta de IA llegará por WebSocket
        
        // Limpiar inputs
        this.mensajeInput.set('');
        this.attachmentsRef?.clearAll();  // Referencia al componente
        
      } catch (error) {
        console.error('Error enviando mensaje multimodal:', error);
        this.iaEscribiendo.set(false);
      }
    } else {
      // TEXTO SIMPLE (endpoint original)
      // ... código existente
    }
  }
}
```

### Paso 2: Agregar en el Template

En `chat-ia.component.html`, dentro del área de input:

```html
<!-- Input de texto (existente) -->
<div class="chat-input-container">
  <textarea
    [(ngModel)]="mensajeInput"
    (keydown.enter)="onEnterPress($event)"
    placeholder="Escribe un mensaje o adjunta archivos..."
    rows="1"
  ></textarea>
  
  <!-- NUEVO: Componente de Attachments -->
  <app-chat-attachments 
    #attachmentsComponent
    (attachmentsChange)="onAttachmentsChange($event)"
  ></app-chat-attachments>
  
  <button 
    (click)="enviarMensaje()" 
    [disabled]="!mensajeInput().trim() && !hasAttachments()"
  >
    Enviar
  </button>
</div>
```

### Paso 3: Métodos Helper

```typescript
@ViewChild('attachmentsComponent') attachmentsRef?: ChatAttachmentsComponent;

onAttachmentsChange(data: AttachmentData) {
  this.attachments.set(data);
}

hasAttachments(): boolean {
  const data = this.attachments();
  return data.audios.length > 0 || data.imagenes.length > 0;
}
```

## Flujo Completo

### Ejemplo 1: Grabar Audio + Enviar

```
Usuario:
1. Click botón 🎤 micrófono
2. Habla: "Agrega una clase Usuario con email y password"
3. Click 🎤 nuevamente para detener
4. Audio aparece en preview
5. Click "Enviar"

Backend:
→ Recibe audio (webm)
→ AssemblyAI transcribe: "Agrega una clase Usuario con email y password"
→ Claude procesa con contexto del diagrama
→ Genera acciones JSON
→ Emite modificación por WebSocket

Frontend:
→ Recibe modificación
→ Aplica cambios al diagrama
→ Usuario ve la clase creada automáticamente
```

### Ejemplo 2: Foto de Diagrama en Papel

```
Usuario:
1. Click botón 📷 imagen
2. Selecciona foto de cuaderno con diagrama
3. Escribe: "Convierte este diagrama a digital"
4. Click "Enviar"

Backend:
→ Recibe imagen (JPG)
→ Convierte a Base64
→ Claude Vision analiza:
  - Detecta 3 clases: Usuario, Producto, Pedido
  - Extrae atributos de cada clase
  - Identifica relaciones entre ellas
→ Genera JSON con acciones de creación
→ Emite modificación

Frontend:
→ Diagrama completo aparece en el canvas
→ Usuario puede editarlo normalmente
```

### Ejemplo 3: Audio + Imagen Combinados

```
Usuario:
1. Sube imagen de boceto con flechas
2. Graba audio: "Como ves en la imagen, necesito conectar 
   Usuario con Pedido usando una relación de 1 a muchos"
3. Click "Enviar"

Backend:
→ Transcribe audio
→ Analiza imagen
→ Claude recibe AMBOS contextos:
  - Texto: "Como ves en la imagen..."
  - Visual: [boceto con flechas]
→ Comprende la intención completa
→ Aplica modificación precisa
```

## UI/UX del Componente

### Estados Visuales

**Botones:**
- 🎤 Micrófono (gris) → Click → 🔴 Grabando (rojo pulsante)
- 📤 Subir Audio → Abre explorador de archivos
- 📷 Subir Imagen → Abre explorador de archivos

**Previews:**
```
┌─────────────────────────────────────┐
│ 🎵 grabacion_123.webm    (234 KB)  ❌│
│ 📷 [miniatura] diagrama.jpg (1.2 MB) ❌│
│ 📷 [miniatura] boceto.png (856 KB)   ❌│
└─────────────────────────────────────┘
```

**Indicador de Procesamiento:**
```
Enviando... 
🎤 Transcribiendo audio...
📷 Analizando imágenes...
🤖 IA procesando...
```

## Limitaciones y Validaciones

### Backend (`upload.middleware.ts`)

```typescript
limits: {
  fileSize: 50 * 1024 * 1024,  // 50MB por archivo
  files: 10                     // Máximo 10 archivos
}
```

### Frontend (Recomendaciones)

```typescript
// Validar antes de enviar
if (imagenes.length > 10) {
  alert('Máximo 10 imágenes por mensaje');
  return;
}

if (audios.length > 5) {
  alert('Máximo 5 audios por mensaje');
  return;
}

// Validar tamaño
const totalSize = [...audios, ...imagenes].reduce((sum, f) => sum + f.size, 0);
if (totalSize > 100 * 1024 * 1024) {  // 100MB total
  alert('El tamaño total excede 100MB');
  return;
}
```

## Mensajes de Error Comunes

### "Permiso de micrófono denegado"
```typescript
try {
  await audioRecorder.startRecording();
} catch (error: any) {
  if (error.message === 'Permiso de micrófono denegado') {
    alert('Por favor permite acceso al micrófono en la configuración del navegador');
  }
}
```

### "Tipo de archivo no permitido"
```
Backend retorna 400:
{ ok: false, mensaje: "Tipo de archivo no permitido: audio/x-ms-wma" }

Solución: Usar formatos soportados (MP3, WAV, OGG, WEBM, M4A)
```

### "IA no detectó clases en la imagen"
```
Claude responde:
"No pude identificar un diagrama UML claro en la imagen. 
 Por favor asegúrate que las cajas y texto sean legibles."

Consejos:
- Usar buena iluminación
- Evitar sombras
- Asegurar contraste entre líneas y fondo
- Texto manuscrito claro
```

## Mejoras Futuras Sugeridas

1. **Compresión de imágenes** (Sharp)
   ```typescript
   import sharp from 'sharp';
   
   // Reducir tamaño antes de enviar a Claude
   const compressed = await sharp(imagePath)
     .resize(1920, 1080, { fit: 'inside' })
     .jpeg({ quality: 80 })
     .toBuffer();
   ```

2. **Cache de transcripciones**
   - Guardar en BD para no retranscribir si se reenvía

3. **Progreso de upload**
   ```typescript
   this.http.post(url, formData, {
     reportProgress: true,
     observe: 'events'
   }).subscribe(event => {
     if (event.type === HttpEventType.UploadProgress) {
       const progress = Math.round(100 * event.loaded / event.total!);
       this.uploadProgress.set(progress);
     }
   });
   ```

4. **Preview de audio**
   - Reproducir audio grabado antes de enviar

5. **Edición de imagen**
   - Crop, rotación, anotaciones antes de enviar

## Testing

### Backend

```bash
# Test endpoint multimodal
curl -X POST http://localhost:3000/chat-ia/mensaje-multimodal \
  -F "id_sala=1" \
  -F "id_usuario=1" \
  -F "contenido=Prueba multimodal" \
  -F "diagrama_actual={\"cells\":[]}" \
  -F "audios=@test-audio.mp3" \
  -F "imagenes=@test-diagram.jpg"
```

### Frontend

```typescript
// Simular archivos en test
const mockAudio = new File(['audio data'], 'test.webm', { type: 'audio/webm' });
const mockImage = new File(['image data'], 'test.jpg', { type: 'image/jpeg' });

component.attachments.set({
  audios: [mockAudio],
  imagenes: [mockImage]
});

await component.enviarMensaje();
```

---

**¿Necesitas ayuda?** Revisa los logs:
- Backend: Console con prefijos 🎤 📷 🤖
- Frontend: DevTools → Network → Payload del request multipart
