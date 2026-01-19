/**
 * EJEMPLO DE INTEGRACIÓN RÁPIDA
 * Copia estos fragmentos en chat-ia.component.ts para habilitar multimodal
 */

// ============================================================
// 1. IMPORTS (Agregar al inicio del archivo)
// ============================================================

import { ChatAttachmentsComponent, AttachmentData } from './chat-attachments.component';

// ============================================================
// 2. COMPONENT DECORATOR (Actualizar imports)
// ============================================================

@Component({
  selector: 'app-chat-ia',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule,
    ChatAttachmentsComponent  // ← AGREGAR
  ],
  templateUrl: './chat-ia.component.html',
  styleUrl: './chat-ia.component.css'
})

// ============================================================
// 3. PROPIEDADES DE CLASE (Agregar dentro de la clase)
// ============================================================

export class ChatIaComponent implements OnInit, OnChanges, OnDestroy {
  // ... propiedades existentes ...
  
  // NUEVAS PROPIEDADES para multimodal
  public attachments = signal<AttachmentData>({ audios: [], imagenes: [] });
  @ViewChild('attachmentsRef') attachmentsRef?: ChatAttachmentsComponent;

  // ============================================================
  // 4. MÉTODOS (Agregar estos métodos)
  // ============================================================
  
  /**
   * Callback cuando cambian los attachments
   */
  onAttachmentsChange(data: AttachmentData): void {
    this.attachments.set(data);
  }

  /**
   * Verificar si hay attachments
   */
  hasAttachments(): boolean {
    const data = this.attachments();
    return data.audios.length > 0 || data.imagenes.length > 0;
  }

  /**
   * Enviar mensaje - MODIFICADO para soportar multimodal
   */
  async enviarMensaje(): Promise<void> {
    const contenido = this.mensajeInput().trim();
    const attachmentsData = this.attachments();
    const tieneAttachments = attachmentsData.audios.length > 0 || attachmentsData.imagenes.length > 0;

    // Validar que haya al menos contenido o attachments
    if (!contenido && !tieneAttachments) {
      return;
    }

    // Obtener datos necesarios
    const conversacion = this.conversacionActual();
    if (!conversacion) {
      console.error('No hay conversación activa');
      return;
    }

    const usuarioData = this.authService.getCurrentUser();
    const idUsuario = usuarioData?.id_usuario;
    const usuarioEmail = usuarioData?.email;

    if (!idUsuario) {
      console.error('No se pudo obtener el ID del usuario');
      return;
    }

    const diagramaActual = this.getDiagramaActual ? this.getDiagramaActual() : null;

    // Agregar mensaje temporal del usuario (para feedback inmediato)
    const mensajeTemporal: Mensaje = {
      tipo_mensaje: 'usuario',
      contenido: contenido || '[Adjuntos enviados]',
      fecha_envio: new Date(),
      usuario_email: usuarioEmail,
      temporal: true
    };
    this.mensajes.update(msgs => [...msgs, mensajeTemporal]);
    this.mensajeInput.set('');

    // Indicar que IA está procesando
    this.iaEscribiendo.set(true);

    try {
      // ========== DECISIÓN: Multimodal vs Texto Simple ==========
      
      if (tieneAttachments) {
        // ✅ ENDPOINT MULTIMODAL (con audio/imágenes)
        console.log('📤 Enviando mensaje multimodal:', {
          texto: !!contenido,
          audios: attachmentsData.audios.length,
          imagenes: attachmentsData.imagenes.length
        });

        const respuesta = await this.chatService.enviarMensajeMultimodal(
          conversacion.id_conversacion,
          this.idSala,
          idUsuario,
          contenido,
          diagramaActual,
          attachmentsData.audios,
          attachmentsData.imagenes
        ).toPromise();

        console.log('✅ Respuesta multimodal recibida:', respuesta);

        // Limpiar attachments
        if (this.attachmentsRef) {
          this.attachmentsRef.clearAll();
        }
        
        // El mensaje de IA llegará por WebSocket (evento 'nuevo-mensaje-chat-ia')
        // Las modificaciones del diagrama llegarán por 'modificacion-diagrama-ia'
        
      } else {
        // ✅ ENDPOINT TEXTO SIMPLE (sin attachments)
        console.log('📤 Enviando mensaje de texto');
        
        const respuesta = await this.chatService.enviarMensajeIA(
          conversacion.id_conversacion,
          this.idSala,
          idUsuario,
          contenido,
          diagramaActual
        ).toPromise();

        console.log('✅ Respuesta recibida:', respuesta);
        
        // Procesar respuesta (el mensaje de IA debería llegar por WebSocket)
        // Si no llega por WebSocket, agregarlo manualmente:
        if (respuesta.mensaje_ia) {
          this.mensajes.update(msgs => {
            // Remover mensaje temporal
            const sinTemporal = msgs.filter(m => !m.temporal);
            // Agregar mensaje real del usuario
            return [...sinTemporal, 
              {
                ...respuesta.mensaje_usuario,
                tipo_mensaje: 'usuario',
                fecha_envio: new Date(respuesta.mensaje_usuario.fecha_envio)
              },
              {
                ...respuesta.mensaje_ia,
                tipo_mensaje: 'ia',
                fecha_envio: new Date(respuesta.mensaje_ia.fecha_envio)
              }
            ];
          });
        }
      }

      // Scroll al final del chat
      setTimeout(() => this.scrollToBottom(), 100);

    } catch (error: any) {
      console.error('❌ Error al enviar mensaje:', error);
      
      // Remover mensaje temporal en caso de error
      this.mensajes.update(msgs => msgs.filter(m => !m.temporal));
      
      // Mostrar error al usuario
      alert(error.error?.mensaje || 'Error al enviar mensaje. Por favor intenta nuevamente.');
      
    } finally {
      this.iaEscribiendo.set(false);
    }
  }
}

// ============================================================
// 5. TEMPLATE (Modificar chat-ia.component.html)
// ============================================================

/* 
Buscar el área de input (cerca del final del archivo) y REEMPLAZAR con:

<div class="chat-input-area">
  <!-- Componente de attachments -->
  <app-chat-attachments 
    #attachmentsRef
    (attachmentsChange)="onAttachmentsChange($event)"
  ></app-chat-attachments>

  <!-- Input de texto -->
  <div class="chat-input-container">
    <textarea
      [value]="mensajeInput()"
      (input)="onInputChange($event)"
      (keydown.enter)="onEnterPress($event)"
      placeholder="Escribe un mensaje o adjunta archivos..."
      rows="1"
      [disabled]="cargando() || iaEscribiendo()"
    ></textarea>
    
    <button 
      class="btn-enviar"
      (click)="enviarMensaje()"
      [disabled]="cargando() || iaEscribiendo() || (!mensajeInput().trim() && !hasAttachments())"
      [title]="iaEscribiendo() ? 'IA está procesando...' : 'Enviar mensaje'"
    >
      <svg *ngIf="!iaEscribiendo()" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
        <path stroke-linecap="round" stroke-linejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
      </svg>
      <div *ngIf="iaEscribiendo()" class="loading-spinner-small"></div>
    </button>
  </div>
</div>
*/

// ============================================================
// 6. ESTILOS (Agregar a chat-ia.component.css)
// ============================================================

/*
.chat-input-area {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
  background: white;
  border-top: 1px solid #e5e7eb;
}

.chat-input-container {
  display: flex;
  gap: 8px;
  align-items: flex-end;
}

.chat-input-container textarea {
  flex: 1;
  min-height: 40px;
  max-height: 120px;
  padding: 10px 12px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 14px;
  resize: none;
  font-family: inherit;
}

.chat-input-container textarea:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.chat-input-container textarea:disabled {
  background: #f3f4f6;
  cursor: not-allowed;
}

.btn-enviar {
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-enviar:hover:not(:disabled) {
  background: #2563eb;
}

.btn-enviar:disabled {
  background: #9ca3af;
  cursor: not-allowed;
}

.loading-spinner-small {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
*/

// ============================================================
// 7. TESTING RÁPIDO
// ============================================================

/*
1. Abrir aplicación en navegador
2. Entrar a una sala
3. Abrir chat con IA (botón flotante)
4. Probar grabación de audio:
   - Click en 🎤
   - Hablar: "Agrega una clase Producto"
   - Click 🎤 nuevamente
   - Verificar preview del audio
   - Click Enviar
   - Esperar respuesta de IA

5. Probar carga de imagen:
   - Click en 📷
   - Seleccionar imagen de diagrama
   - Escribir: "Convierte este diagrama"
   - Click Enviar
   - Verificar que aparezcan clases

6. Verificar logs en consola del backend:
   🎤 Transcribiendo con [servicio]
   📷 Imagen cargada
   🤖 Enviando a [modelo]
*/

// ============================================================
// 8. TROUBLESHOOTING
// ============================================================

/*
ERROR: "Cannot find module './chat-attachments.component'"
SOLUCIÓN: Verificar que el archivo existe en:
  official-sw1p1/src/app/diagramador/chat-ia/chat-attachments.component.ts

ERROR: "Permiso de micrófono denegado"
SOLUCIÓN: 
  - Chrome: chrome://settings/content/microphone
  - Firefox: about:preferences#privacy
  - Permitir acceso para localhost

ERROR: "API key not found"
SOLUCIÓN: Verificar .env en backend:
  ANTHROPIC_API_KEY=sk-ant-xxxxx
  ASSEMBLYAI_API_KEY=xxxxx  (o tu servicio elegido)

ERROR: "Tipo de archivo no permitido"
SOLUCIÓN: Solo se permiten:
  - Audio: MP3, WAV, OGG, WEBM, M4A, AAC
  - Imagen: JPG, PNG, GIF, WEBP
*/
