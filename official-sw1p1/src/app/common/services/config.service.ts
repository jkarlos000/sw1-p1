import { Injectable, Inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { Socket } from 'ngx-socket-io';

/**
 * Servicio de Configuración
 * Carga la configuración desde config.json al iniciar la aplicación
 * 
 * @author Jkarlos
 * @date 2026
 */

export interface AppConfig {
  apiUrl: string;
  wsUrl: string;
}

@Injectable({
  providedIn: 'root'
})
export class ConfigService {
  private config: AppConfig | null = null;

  constructor(
    private http: HttpClient,
    @Inject(Socket) private socket: Socket
  ) {}

  /**
   * Carga la configuración desde assets/config.json
   * Este método debe llamarse ANTES de inicializar la app
   */
  async loadConfig(): Promise<void> {
    try {
      this.config = await firstValueFrom(
        this.http.get<AppConfig>('/assets/config.json')
      );
      console.log('✅ Configuración cargada:', this.config);
      
      // Actualizar la URL del socket dinámicamente
      if (this.socket && this.config.wsUrl) {
        // Desconectar el socket actual si está conectado
        if (this.socket.ioSocket.connected) {
          this.socket.disconnect();
        }
        
        // Actualizar la URL del socket
        this.socket.ioSocket.io.uri = this.config.wsUrl;
        
        // Reconectar con la nueva URL
        this.socket.connect();
        
        console.log('✅ Socket.IO reconfigurado para:', this.config.wsUrl);
      }
    } catch (error) {
      console.error('❌ Error al cargar configuración, usando valores por defecto:', error);
      // Valores por defecto en caso de error
      this.config = {
        apiUrl: 'http://localhost:3000',
        wsUrl: 'http://localhost:3000'
      };
    }
  }

  /**
   * Obtiene la configuración completa
   */
  getConfig(): AppConfig {
    if (!this.config) {
      throw new Error('Configuración no cargada. Llama a loadConfig() primero.');
    }
    return this.config;
  }

  /**
   * Obtiene la URL del API
   */
  get apiUrl(): string {
    return this.getConfig().apiUrl;
  }

  /**
   * Obtiene la URL de WebSockets
   */
  get wsUrl(): string {
    return this.getConfig().wsUrl;
  }
}
