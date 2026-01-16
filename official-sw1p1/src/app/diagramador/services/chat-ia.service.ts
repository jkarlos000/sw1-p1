import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs';
import { environment } from '../../../environments/environment';
import { WebsocketService } from '../../common/services/websocket.service';

export interface Mensaje {
  id_mensaje?: number;
  id_conversacion?: number;
  id_usuario?: number;
  tipo_mensaje: 'usuario' | 'ia' | 'sistema';
  contenido: string;
  metadata?: any;
  fecha_envio: Date;
  usuario_email?: string;
  temporal?: boolean;
}

export interface Conversacion {
  id_conversacion: number;
  id_sala: number;
  titulo: string;
  contexto_inicial?: any;
  fecha_creacion: Date;
  fecha_ultima_actualizacion: Date;
  activa: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class ChatIaService {
  private http = inject(HttpClient);
  private wsService = inject(WebsocketService);
  
  private baseUrl = environment.apiUrl;

  // Signals para estado reactivo
  public mensajes = signal<Mensaje[]>([]);
  public conversacionActual = signal<Conversacion | null>(null);
  public iaEscribiendo = signal<boolean>(false);
  public usuarioEscribiendo = signal<string | null>(null);

  // Subject para mensajes en tiempo real
  private mensajesSubject = new BehaviorSubject<Mensaje[]>([]);
  public mensajes$ = this.mensajesSubject.asObservable();

  // Subject para modificaciones de diagrama por IA
  private modificacionDiagramaSubject = new BehaviorSubject<any>(null);
  public modificacionDiagrama$ = this.modificacionDiagramaSubject.asObservable();

  constructor() {
    this.inicializarWebSocketListeners();
  }

  // ========== INICIALIZAR WEBSOCKET LISTENERS ==========
  private inicializarWebSocketListeners(): void {
    // Escuchar nuevos mensajes
    this.wsService.listen('nuevo-mensaje-chat-ia').subscribe((mensaje: Mensaje) => {
      this.agregarMensaje(mensaje);
    });

    // Escuchar estado de IA escribiendo
    this.wsService.listen('ia-escribiendo').subscribe((data: { escribiendo: boolean }) => {
      this.iaEscribiendo.set(data.escribiendo);
    });

    // Escuchar usuario escribiendo
    this.wsService.listen('usuario-escribiendo-chat').subscribe((data: { usuario: string; escribiendo: boolean }) => {
      this.usuarioEscribiendo.set(data.escribiendo ? data.usuario : null);
    });

    // Escuchar modificaciones de diagrama sugeridas por IA
    this.wsService.listen('modificacion-diagrama-ia').subscribe((data: any) => {
      console.log('🎨 Modificación de diagrama recibida:', data);
      if (data && data.diagrama) {
        this.modificacionDiagramaSubject.next(data.diagrama);
      }
    });

    // Escuchar historial cargado
    this.wsService.listen('historial-chat-ia').subscribe((data: { ok: boolean; mensajes: Mensaje[] }) => {
      if (data.ok && data.mensajes) {
        this.mensajes.set(data.mensajes);
        this.mensajesSubject.next(data.mensajes);
      }
    });
  }

  // ========== MÉTODOS HTTP ==========
  
  /**
   * Obtener conversación activa de una sala
   */
  obtenerConversacionActiva(idSala: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/chat-ia/conversacion/sala/${idSala}`);
  }

  /**
   * Crear nueva conversación
   */
  crearConversacion(idSala: number, titulo?: string, diagramaInicial?: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/chat-ia/conversacion`, {
      id_sala: idSala,
      titulo: titulo || 'Nueva conversación',
      diagrama_inicial: diagramaInicial
    });
  }

  /**
   * Obtener historial de mensajes
   */
  obtenerHistorialMensajes(idConversacion: number, limite: number = 50, offset: number = 0): Observable<any> {
    return this.http.get(`${this.baseUrl}/chat-ia/mensajes/${idConversacion}`, {
      params: { limite: limite.toString(), offset: offset.toString() }
    });
  }

  /**
   * Enviar mensaje a la IA
   */
  enviarMensajeIA(
    idConversacion: number,
    idSala: number,
    idUsuario: number,
    contenido: string,
    diagramaActual?: any
  ): Observable<any> {
    return this.http.post(`${this.baseUrl}/chat-ia/mensaje`, {
      id_conversacion: idConversacion,
      id_sala: idSala,
      id_usuario: idUsuario,
      contenido: contenido,
      diagrama_actual: diagramaActual
    });
  }

  /**
   * Guardar snapshot del diagrama
   */
  guardarSnapshot(idConversacion: number, diagramaJson: any, descripcion?: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/chat-ia/snapshot`, {
      id_conversacion: idConversacion,
      diagrama_json: diagramaJson,
      descripcion: descripcion
    });
  }

  /**
   * Obtener snapshots de una conversación
   */
  obtenerSnapshots(idConversacion: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/chat-ia/snapshots/${idConversacion}`);
  }

  /**
   * Configurar IA para una sala
   */
  configurarIA(idSala: number, config: {
    modelo?: string;
    temperatura?: number;
    max_tokens?: number;
    system_prompt?: string;
  }): Observable<any> {
    return this.http.post(`${this.baseUrl}/chat-ia/config`, {
      id_sala: idSala,
      ...config
    });
  }

  // ========== MÉTODOS WEBSOCKET ==========

  /**
   * Enviar mensaje via WebSocket (para sincronización en tiempo real)
   */
  enviarMensajeWebSocket(
    sala: string,
    idConversacion: number,
    idUsuario: number,
    contenido: string,
    diagramaActual?: any,
    usuarioEmail?: string
  ): void {
    this.wsService.emit('mensaje-chat-ia', {
      sala,
      id_conversacion: idConversacion,
      id_usuario: idUsuario,
      contenido,
      diagrama_actual: diagramaActual,
      usuario_email: usuarioEmail
    });
  }

  /**
   * Emitir respuesta de IA (usado internamente o por el backend)
   */
  emitirRespuestaIA(sala: string, mensaje: any, modificacionDiagrama?: any): void {
    this.wsService.emit('respuesta-chat-ia', {
      sala,
      mensaje,
      modificacion_diagrama: modificacionDiagrama
    });
  }

  /**
   * Cargar historial via WebSocket
   */
  cargarHistorialWebSocket(sala: string, idConversacion: number): void {
    this.wsService.emit('cargar-historial-chat-ia', {
      sala,
      id_conversacion: idConversacion
    });
  }

  /**
   * Notificar que usuario está escribiendo
   */
  notificarEscribiendo(sala: string, usuario: string, escribiendo: boolean): void {
    this.wsService.emit('usuario-escribiendo-chat', {
      sala,
      usuario,
      escribiendo
    });
  }

  // ========== MÉTODOS DE ESTADO ==========

  /**
   * Agregar mensaje al estado local
   */
  private agregarMensaje(mensaje: Mensaje): void {
    const mensajesActuales = this.mensajes();
    this.mensajes.set([...mensajesActuales, mensaje]);
    this.mensajesSubject.next(this.mensajes());
  }

  /**
   * Limpiar mensajes
   */
  limpiarMensajes(): void {
    this.mensajes.set([]);
    this.mensajesSubject.next([]);
  }

  /**
   * Establecer conversación actual
   */
  setConversacionActual(conversacion: Conversacion | null): void {
    this.conversacionActual.set(conversacion);
  }

  /**
   * Obtener conversación actual
   */
  getConversacionActual(): Conversacion | null {
    return this.conversacionActual();
  }

  /**
   * Procesar respuesta completa de IA y actualizar mensajes
   */
  procesarRespuestaIA(respuesta: any): void {
    // Agregar mensaje de IA
    if (respuesta.mensaje_ia) {
      this.agregarMensaje({
        ...respuesta.mensaje_ia,
        tipo_mensaje: 'ia',
        fecha_envio: new Date(respuesta.mensaje_ia.fecha_envio)
      });
    }

    // Si hay modificación de diagrama, emitirla
    if (respuesta.modificacion_diagrama) {
      // El componente del diagramador debe suscribirse a este evento
      this.wsService.emit('modificacion-diagrama-ia', {
        diagrama: respuesta.modificacion_diagrama
      });
    }
  }
}
