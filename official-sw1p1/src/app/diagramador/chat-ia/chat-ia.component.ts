/**
 * Chat IA Component
 * Componente de chat con IA integrado al diagramador UML
 * 
 * @author Jkarlos
 * @date 2026
 */

import { CommonModule } from '@angular/common';
import { Component, effect, EventEmitter, inject, Input, OnChanges, OnDestroy, OnInit, Output, signal, SimpleChanges, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { AuthService } from '../../auth/auth.service';
import { ChatIaService, Conversacion, Mensaje } from '../services/chat-ia.service';
import { ChatAttachmentsComponent, AttachmentData } from './chat-attachments.component';

@Component({
  selector: 'app-chat-ia',
  standalone: true,
  imports: [CommonModule, FormsModule, ChatAttachmentsComponent],
  templateUrl: './chat-ia.component.html',
  styleUrl: './chat-ia.component.css'
})
export class ChatIaComponent implements OnInit, OnChanges, OnDestroy {
  @Input() sala!: string;
  @Input() idSala!: number;
  @Input() getDiagramaActual!: () => any; // Cambiar a función
  // @Output() modificarDiagrama - Eliminado: Las modificaciones se manejan por WebSocket

  @ViewChild(ChatAttachmentsComponent) attachmentsComponent!: ChatAttachmentsComponent;

  private chatService = inject(ChatIaService);
  private authService = inject(AuthService);

  // Estado del componente
  public mensajes = signal<Mensaje[]>([]);
  public conversacionActual = signal<Conversacion | null>(null);
  public mensajeInput = signal<string>('');
  public iaEscribiendo = signal<boolean>(false);
  public usuarioEscribiendo = signal<string | null>(null);
  public chatAbierto = signal<boolean>(false);
  public cargando = signal<boolean>(false);
  public attachments = signal<AttachmentData>({ audios: [], imagenes: [] });

  private subscriptions: Subscription[] = [];
  private chatInicializado = false;

  constructor() {
    // Los effect() deben ser llamados en el constructor para estar en el contexto de inyección
    effect(() => {
      this.iaEscribiendo.set(this.chatService.iaEscribiendo());
    });

    effect(() => {
      this.usuarioEscribiendo.set(this.chatService.usuarioEscribiendo());
    });
  }

  ngOnInit(): void {
    this.suscribirseAMensajes();
    // No inicializar el chat aquí, esperar a que idSala esté disponible
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Cuando idSala cambia y es válido, inicializar el chat
    if (changes['idSala'] && changes['idSala'].currentValue && !this.chatInicializado) {
      console.log('✨ idSala disponible:', changes['idSala'].currentValue);
      this.chatInicializado = true;
      this.inicializarChat();
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  // ========== INICIALIZACIÓN ==========

  async inicializarChat(): Promise<void> {
    this.cargando.set(true);
    console.log('🚀 Inicializando chat para sala:', this.idSala);

    try {
      // Obtener conversación activa
      const respuesta = await this.chatService.obtenerConversacionActiva(this.idSala).toPromise();
      console.log('📡 Respuesta obtenerConversacionActiva:', respuesta);

      if (respuesta && respuesta.conversacion) {
        // Hay una conversación activa
        console.log('✅ Conversación activa encontrada:', respuesta.conversacion);
        this.conversacionActual.set(respuesta.conversacion);
        this.chatService.setConversacionActual(respuesta.conversacion);

        // Cargar historial
        await this.cargarHistorial(respuesta.conversacion.id_conversacion);
      } else {
        // No hay conversación, crear una nueva
        console.log('⚠️ No hay conversación activa, creando nueva...');
        await this.crearNuevaConversacion();
      }
    } catch (error) {
      console.error('❌ Error al inicializar chat:', error);
      // Intentar crear conversación si falla
      await this.crearNuevaConversacion();
    } finally {
      this.cargando.set(false);
    }
  }

  async crearNuevaConversacion(): Promise<void> {
    try {
      const diagramaActual = this.getDiagramaActual ? this.getDiagramaActual() : null;
      const respuesta = await this.chatService.crearConversacion(
        this.idSala,
        'Chat con IA',
        diagramaActual
      ).toPromise();

      if (respuesta.ok && respuesta.conversacion) {
        this.conversacionActual.set(respuesta.conversacion);
        this.chatService.setConversacionActual(respuesta.conversacion);
      }
    } catch (error) {
      console.error('Error al crear conversación:', error);
    }
  }

  async cargarHistorial(idConversacion: number): Promise<void> {
    try {
      console.log('📚 Cargando historial para conversación:', idConversacion);
      const respuesta = await this.chatService.obtenerHistorialMensajes(idConversacion).toPromise();
      console.log('📨 Respuesta historial:', respuesta);

      if (respuesta && respuesta.ok && respuesta.mensajes) {
        console.log(`✅ Historial cargado: ${respuesta.mensajes.length} mensajes`);
        this.mensajes.set(respuesta.mensajes);
        this.chatService.mensajes.set(respuesta.mensajes);
        setTimeout(() => this.scrollToBottom(), 100);
      } else {
        console.log('⚠️ No hay mensajes en el historial');
      }
    } catch (error) {
      console.error('❌ Error al cargar historial:', error);
    }
  }

  // ========== SUSCRIPCIONES ==========

  suscribirseAMensajes(): void {
    // Suscribirse a mensajes en tiempo real
    const sub1 = this.chatService.mensajes$.subscribe(mensajes => {
      this.mensajes.set(mensajes);
      setTimeout(() => this.scrollToBottom(), 100);
    });

    this.subscriptions.push(sub1);
  }

  // ========== ENVIAR MENSAJE ==========

  async enviarMensaje(): Promise<void> {
    const contenido = this.mensajeInput().trim();
    const currentAttachments = this.attachments();
    const hasAttachments = currentAttachments.audios.length > 0 || currentAttachments.imagenes.length > 0;
    
    if (!contenido && !hasAttachments) return;
    if (!this.conversacionActual()) return;

    const usuario = this.authService.getUserAuth();
    if (!usuario || !usuario.id) {
      console.error('Usuario no autenticado');
      return;
    }

    // Limpiar input inmediatamente
    this.mensajeInput.set('');
    this.attachments.set({ audios: [], imagenes: [] });
    
    // Limpiar attachments en el componente hijo
    if (this.attachmentsComponent) {
      this.attachmentsComponent.clearAll();
    }

    // Obtener diagrama actual en el momento del envío
    const diagramaActual = this.getDiagramaActual ? this.getDiagramaActual() : null;

    try {
      if (hasAttachments) {
        // Agregar mensaje temporal del usuario inmediatamente para feedback visual
        const mensajeTemporal: Mensaje = {
          id_conversacion: this.conversacionActual()!.id_conversacion,
          id_usuario: usuario.id,
          tipo_mensaje: 'usuario',
          contenido: contenido || '[Adjuntos: ' + 
            (currentAttachments.audios.length > 0 ? currentAttachments.audios.length + ' audio(s)' : '') +
            (currentAttachments.audios.length > 0 && currentAttachments.imagenes.length > 0 ? ', ' : '') +
            (currentAttachments.imagenes.length > 0 ? currentAttachments.imagenes.length + ' imagen(es)' : '') + ']',
          tiene_attachments: true,
          metadata_multimodal: {
            num_audios: currentAttachments.audios.length,
            num_imagenes: currentAttachments.imagenes.length
          },
          fecha_envio: new Date(),
          usuario_email: usuario.email,
          temporal: true
        };
        this.mensajes.update(mensajes => [...mensajes, mensajeTemporal]);

        // Enviar mensaje multimodal con attachments
        const respuesta = await this.chatService.enviarMensajeMultimodal(
          this.conversacionActual()!.id_conversacion,
          this.idSala,
          usuario.id,
          contenido,
          diagramaActual,
          currentAttachments.audios,
          currentAttachments.imagenes
        ).toPromise();

        if (respuesta.ok) {
          console.log('✅ Mensaje multimodal enviado correctamente', respuesta);
          
          // Remover mensaje temporal
          this.mensajes.update(mensajes => mensajes.filter(m => !m.temporal));
          
          // Los mensajes reales llegarán por WebSocket, no los agregamos aquí para evitar duplicados
          // Las modificaciones del diagrama también llegarán por WebSocket (modificacion-diagrama-ia)
          // El diagramador.component.ts está suscrito a chatIaService.modificacionDiagrama$
        }
      } else {
        // Enviar via WebSocket para sincronización inmediata
        this.chatService.enviarMensajeWebSocket(
          this.sala,
          this.conversacionActual()!.id_conversacion,
          usuario.id,
          contenido,
          diagramaActual,
          usuario.email
        );

        // Enviar via HTTP para procesamiento con IA
        const respuesta = await this.chatService.enviarMensajeIA(
          this.conversacionActual()!.id_conversacion,
          this.idSala,
          usuario.id,
          contenido,
          diagramaActual
        ).toPromise();

        if (respuesta.ok) {
          // NO procesamos el mensaje_ia aquí porque llegará via WebSocket
          // Las modificaciones del diagrama también llegan por WebSocket (modificacion-diagrama-ia)
          // No necesitamos hacer nada más aquí
        }
      }
    } catch (error) {
      console.error('Error al enviar mensaje:', error);
    }
  }

  // ========== MANEJO DE ATTACHMENTS ==========

  onAttachmentsChange(attachmentData: AttachmentData): void {
    this.attachments.set(attachmentData);
  }

  // ========== EVENTOS DE INPUT ==========

  onInputChange(): void {
    const usuario = this.authService.getUserAuth();
    if (!usuario) return;

    // Notificar que el usuario está escribiendo
    this.chatService.notificarEscribiendo(
      this.sala,
      usuario.email,
      this.mensajeInput().length > 0
    );
  }

  onKeyPress(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.enviarMensaje();
    }
  }

  // ========== UTILIDADES ==========

  async toggleChat(): Promise<void> {
    const nuevoEstado = !this.chatAbierto();
    this.chatAbierto.set(nuevoEstado);
    
    // Si se abre el chat y hay conversación, recargar historial
    if (nuevoEstado && this.conversacionActual()) {
      console.log('🔄 Recargando historial del chat...');
      await this.cargarHistorial(this.conversacionActual()!.id_conversacion);
      setTimeout(() => this.scrollToBottom(), 150);
    }
  }

  scrollToBottom(): void {
    const chatContainer = document.querySelector('.chat-messages-container');
    if (chatContainer) {
      chatContainer.scrollTop = chatContainer.scrollHeight;
    }
  }

  esUsuarioActual(mensaje: Mensaje): boolean {
    const usuario = this.authService.getUserAuth();
    return mensaje.id_usuario === usuario?.id;
  }

  formatearFecha(fecha: Date): string {
    const d = new Date(fecha);
    return d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  }

  trackByMensaje(index: number, mensaje: Mensaje): any {
    return mensaje.id_mensaje || index;
  }
}
