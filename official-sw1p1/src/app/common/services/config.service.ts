import { Injectable, Inject } from '@angular/core';
import { Socket } from 'ngx-socket-io';
import { environment } from '../../../environments/environment';

/**
 * Servicio de Configuración
 * Usa los archivos environment.ts para configurar URLs
 * 
 * DESARROLLO: ng serve → environment.ts → localhost:3000
 * PRODUCCIÓN: npm run build → environment.prod.ts → uml.jkhoster.com
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
  private config: AppConfig;

  constructor(
    @Inject(Socket) private socket: Socket
  ) {
    // Cargar config desde environment (compile-time)
    this.config = {
      apiUrl: environment.apiUrl,
      wsUrl: environment.wsUrl
    };
  }

  /**
   * Inicializa la configuración del socket
   * Este método debe llamarse ANTES de inicializar la app
   */
  async loadConfig(): Promise<void> {
    console.log('✅ Configuración cargada desde environment:', this.config);
    console.log(`   - Modo: ${environment.production ? 'PRODUCCIÓN' : 'DESARROLLO'}`);
    console.log(`   - API: ${this.config.apiUrl}`);
    console.log(`   - WebSocket: ${this.config.wsUrl}`);
    
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
      
      console.log('✅ Socket.IO configurado para:', this.config.wsUrl);
    }
  }

  /**
   * Obtiene la configuración completa
   */
  getConfig(): AppConfig {
    return this.config;
  }

  /**
   * Obtiene la URL del API
   */
  get apiUrl(): string {
    return this.config.apiUrl;
  }

  /**
   * Obtiene la URL de WebSockets
   */
  get wsUrl(): string {
    return this.config.wsUrl;
  }
}
