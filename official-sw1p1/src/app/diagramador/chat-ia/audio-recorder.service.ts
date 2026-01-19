/**
 * Servicio para grabación de audio usando MediaRecorder API
 * Permite grabar audio desde el micrófono del navegador
 */

import { Injectable, signal } from '@angular/core';

export interface RecordingState {
  isRecording: boolean;
  isPaused: boolean;
  duration: number; // segundos
  audioBlob: Blob | null;
  audioUrl: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class AudioRecorderService {
  
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private startTime: number = 0;
  private timerInterval: any = null;
  
  // Signals para estado reactivo
  recordingState = signal<RecordingState>({
    isRecording: false,
    isPaused: false,
    duration: 0,
    audioBlob: null,
    audioUrl: null
  });
  
  /**
   * Iniciar grabación
   */
  async startRecording(): Promise<void> {
    try {
      // Solicitar permiso de micrófono
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      
      // Crear MediaRecorder
      this.mediaRecorder = new MediaRecorder(stream, {
        mimeType: this.getSupportedMimeType()
      });
      
      this.audioChunks = [];
      
      // Eventos
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };
      
      this.mediaRecorder.onstop = () => {
        this.handleRecordingStopped();
      };
      
      // Iniciar grabación
      this.mediaRecorder.start();
      this.startTime = Date.now();
      
      // Timer
      this.timerInterval = setInterval(() => {
        const duration = Math.floor((Date.now() - this.startTime) / 1000);
        this.recordingState.update(state => ({ ...state, duration }));
      }, 1000);
      
      // Actualizar estado
      this.recordingState.update(state => ({
        ...state,
        isRecording: true,
        isPaused: false,
        duration: 0,
        audioBlob: null,
        audioUrl: null
      }));
      
      console.log('🎤 Grabación iniciada');
      
    } catch (error: any) {
      console.error('❌ Error al iniciar grabación:', error);
      
      if (error.name === 'NotAllowedError') {
        throw new Error('Permiso de micrófono denegado');
      } else if (error.name === 'NotFoundError') {
        throw new Error('No se encontró micrófono');
      } else {
        throw new Error('Error al acceder al micrófono');
      }
    }
  }
  
  /**
   * Pausar grabación
   */
  pauseRecording(): void {
    if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
      this.mediaRecorder.pause();
      clearInterval(this.timerInterval);
      
      this.recordingState.update(state => ({ ...state, isPaused: true }));
      console.log('⏸️  Grabación pausada');
    }
  }
  
  /**
   * Reanudar grabación
   */
  resumeRecording(): void {
    if (this.mediaRecorder && this.mediaRecorder.state === 'paused') {
      this.mediaRecorder.resume();
      
      const pausedDuration = this.recordingState().duration;
      this.startTime = Date.now() - (pausedDuration * 1000);
      
      this.timerInterval = setInterval(() => {
        const duration = Math.floor((Date.now() - this.startTime) / 1000);
        this.recordingState.update(state => ({ ...state, duration }));
      }, 1000);
      
      this.recordingState.update(state => ({ ...state, isPaused: false }));
      console.log('▶️  Grabación reanudada');
    }
  }
  
  /**
   * Detener grabación
   */
  stopRecording(): void {
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
      clearInterval(this.timerInterval);
      
      // Detener el stream de audio
      this.mediaRecorder.stream.getTracks().forEach(track => track.stop());
      
      console.log('⏹️  Grabación detenida');
    }
  }
  
  /**
   * Cancelar grabación (sin guardar)
   */
  cancelRecording(): void {
    if (this.mediaRecorder) {
      if (this.mediaRecorder.state !== 'inactive') {
        this.mediaRecorder.stop();
        this.mediaRecorder.stream.getTracks().forEach(track => track.stop());
      }
      
      clearInterval(this.timerInterval);
      this.audioChunks = [];
      
      this.recordingState.set({
        isRecording: false,
        isPaused: false,
        duration: 0,
        audioBlob: null,
        audioUrl: null
      });
      
      console.log('❌ Grabación cancelada');
    }
  }
  
  /**
   * Manejar cuando la grabación se detiene
   */
  private handleRecordingStopped(): void {
    // Crear blob de audio
    const mimeType = this.mediaRecorder?.mimeType || 'audio/webm';
    const audioBlob = new Blob(this.audioChunks, { type: mimeType });
    const audioUrl = URL.createObjectURL(audioBlob);
    
    // Actualizar estado
    this.recordingState.update(state => ({
      ...state,
      isRecording: false,
      isPaused: false,
      audioBlob,
      audioUrl
    }));
    
    console.log(`✅ Audio grabado: ${(audioBlob.size / 1024).toFixed(2)} KB`);
  }
  
  /**
   * Obtener MIME type soportado por el navegador
   */
  private getSupportedMimeType(): string {
    const types = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/ogg;codecs=opus',
      'audio/mp4',
      'audio/mpeg'
    ];
    
    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) {
        return type;
      }
    }
    
    return ''; // Usar default
  }
  
  /**
   * Convertir audio blob a File para subir
   */
  blobToFile(blob: Blob, filename: string = 'grabacion.webm'): File {
    return new File([blob], filename, { 
      type: blob.type,
      lastModified: Date.now()
    });
  }
  
  /**
   * Formatear duración en MM:SS
   */
  formatDuration(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  
  /**
   * Verificar si el navegador soporta grabación
   */
  isSupported(): boolean {
    return !!(navigator.mediaDevices && typeof navigator.mediaDevices.getUserMedia === 'function' && window.MediaRecorder);
  }
  
  /**
   * Limpiar recursos
   */
  cleanup(): void {
    if (this.recordingState().audioUrl) {
      URL.revokeObjectURL(this.recordingState().audioUrl!);
    }
    this.recordingState.set({
      isRecording: false,
      isPaused: false,
      duration: 0,
      audioBlob: null,
      audioUrl: null
    });
  }
}
