/**
 * Componente para manejar attachments multimodales en el chat
 * Permite agregar/grabar audio e imágenes
 */

import { CommonModule } from '@angular/common';
import { Component, EventEmitter, inject, Output, signal } from '@angular/core';
import { AudioRecorderService } from './audio-recorder.service';

export interface AttachmentData {
  audios: File[];
  imagenes: File[];
}

@Component({
  selector: 'app-chat-attachments',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="attachments-container">
      <!-- Barra de botones -->
      <div class="attachment-buttons">
        <!-- Botón grabar audio -->
        <button 
          type="button"
          class="btn-attachment"
          (click)="toggleRecording()"
          [class.recording]="audioRecorder.recordingState().isRecording"
          title="{{ audioRecorder.recordingState().isRecording ? 'Detener grabación' : 'Grabar audio' }}"
        >
          <svg *ngIf="!audioRecorder.recordingState().isRecording" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
          </svg>
          <div *ngIf="audioRecorder.recordingState().isRecording" class="recording-indicator">
            <span class="recording-dot"></span>
            <span class="recording-time">{{ audioRecorder.formatDuration(audioRecorder.recordingState().duration) }}</span>
          </div>
        </button>

        <!-- Botón subir audio -->
        <label class="btn-attachment" title="Subir audio">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
          </svg>
          <input 
            #audioFileInput
            type="file" 
            accept="audio/*" 
            multiple 
            (change)="onAudioFilesSelected($event)"
            class="hidden"
          />
        </label>

        <!-- Botón subir imágenes -->
        <label class="btn-attachment" title="Subir imágenes">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
          </svg>
          <input 
            #imageFileInput
            type="file" 
            accept="image/*" 
            multiple 
            (change)="onImageFilesSelected($event)"
            class="hidden"
          />
        </label>
      </div>

      <!-- Previews de archivos -->
      <div class="attachments-preview" *ngIf="hasAttachments()">
        <!-- Audios -->
        <div class="attachment-item" *ngFor="let audio of audios(); let i = index">
          <div class="attachment-icon audio">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
              <path stroke-linecap="round" stroke-linejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
            </svg>
          </div>
          <div class="attachment-info">
            <span class="attachment-name">{{ audio.name }}</span>
            <span class="attachment-size">{{ formatFileSize(audio.size) }}</span>
          </div>
          <button type="button" class="btn-remove" (click)="removeAudio(i)" title="Eliminar">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Imágenes -->
        <div class="attachment-item image" *ngFor="let imagen of imagenes(); let i = index">
          <div class="attachment-preview" [style.background-image]="'url(' + getImagePreview(imagen) + ')'"></div>
          <div class="attachment-info">
            <span class="attachment-name">{{ imagen.name }}</span>
            <span class="attachment-size">{{ formatFileSize(imagen.size) }}</span>
          </div>
          <button type="button" class="btn-remove" (click)="removeImage(i)" title="Eliminar">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .attachments-container {
      display: flex;
      flex-direction: column;
      gap: 8px;
      width: 100%;
      max-width: 100%;
      overflow: hidden;
    }

    .attachment-buttons {
      display: flex;
      gap: 6px;
      flex-shrink: 0;
    }

    .btn-attachment {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 8px;
      border: 1px solid #e5e7eb;
      border-radius: 6px;
      background: white;
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn-attachment:hover {
      background: #f9fafb;
      border-color: #d1d5db;
    }

    .btn-attachment.recording {
      background: #fee2e2;
      border-color: #ef4444;
      animation: pulse 1.5s infinite;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.7; }
    }

    .recording-indicator {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .recording-dot {
      width: 8px;
      height: 8px;
      background: #ef4444;
      border-radius: 50%;
      animation: blink 1s infinite;
    }

    @keyframes blink {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.3; }
    }

    .recording-time {
      font-size: 12px;
      font-weight: 600;
      color: #ef4444;
    }

    .hidden {
      display: none;
    }

    .attachments-preview {
      display: flex;
      flex-direction: column;
      gap: 6px;
      max-height: 200px;
      overflow-y: auto;
      width: 100%;
      max-width: 100%;
    }

    .attachment-item {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px;
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 6px;
      min-width: 0;
      max-width: 100%;
    }

    .attachment-icon {
      flex-shrink: 0;
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 4px;
    }

    .attachment-icon.audio {
      background: #dbeafe;
      color: #3b82f6;
    }

    .attachment-preview {
      flex-shrink: 0;
      width: 48px;
      height: 48px;
      border-radius: 4px;
      background-size: cover;
      background-position: center;
      background-color: #e5e7eb;
    }

    .attachment-info {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .attachment-name {
      font-size: 13px;
      font-weight: 500;
      color: #374151;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .attachment-size {
      font-size: 11px;
      color: #9ca3af;
    }

    .btn-remove {
      flex-shrink: 0;
      padding: 4px;
      border: none;
      background: transparent;
      color: #9ca3af;
      cursor: pointer;
      border-radius: 4px;
      transition: all 0.2s;
    }

    .btn-remove:hover {
      background: #fee2e2;
      color: #ef4444;
    }
  `]
})
export class ChatAttachmentsComponent {
  audioRecorder = inject(AudioRecorderService);

  audios = signal<File[]>([]);
  imagenes = signal<File[]>([]);

  @Output() attachmentsChange = new EventEmitter<AttachmentData>();

  async toggleRecording() {
    const state = this.audioRecorder.recordingState();
    
    if (state.isRecording) {
      // Detener y agregar a la lista
      this.audioRecorder.stopRecording();
      
      // Esperar a que el blob esté disponible
      setTimeout(() => {
        const finalState = this.audioRecorder.recordingState();
        if (finalState.audioBlob) {
          const file = this.audioRecorder.blobToFile(
            finalState.audioBlob,
            `grabacion_${Date.now()}.webm`
          );
          this.addAudio(file);
          this.audioRecorder.cleanup();
        }
      }, 100);
    } else {
      // Iniciar grabación
      try {
        await this.audioRecorder.startRecording();
      } catch (error: any) {
        alert(error.message || 'Error al iniciar grabación');
      }
    }
  }

  onAudioFilesSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      Array.from(input.files).forEach(file => this.addAudio(file));
      input.value = ''; // Reset input
    }
  }

  onImageFilesSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      Array.from(input.files).forEach(file => this.addImage(file));
      input.value = ''; // Reset input
    }
  }

  private addAudio(file: File) {
    this.audios.update(audios => [...audios, file]);
    this.emitChange();
  }

  private addImage(file: File) {
    this.imagenes.update(imagenes => [...imagenes, file]);
    this.emitChange();
  }

  removeAudio(index: number) {
    this.audios.update(audios => audios.filter((_, i) => i !== index));
    this.emitChange();
  }

  removeImage(index: number) {
    this.imagenes.update(imagenes => imagenes.filter((_, i) => i !== index));
    this.emitChange();
  }

  private emitChange() {
    this.attachmentsChange.emit({
      audios: this.audios(),
      imagenes: this.imagenes()
    });
  }

  hasAttachments(): boolean {
    return this.audios().length > 0 || this.imagenes().length > 0;
  }

  clearAll() {
    this.audios.set([]);
    this.imagenes.set([]);
    this.emitChange();
  }

  getAttachments(): AttachmentData {
    return {
      audios: this.audios(),
      imagenes: this.imagenes()
    };
  }

  formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  getImagePreview(file: File): string {
    return URL.createObjectURL(file);
  }
}
