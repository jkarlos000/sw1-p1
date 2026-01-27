import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from '../auth/auth.service';
import { WebsocketService } from '../common/services/websocket.service';
import { ConfigService } from '../common/services/config.service';

@Injectable({
  providedIn: 'root',
})
export class DiagramadorService {
  private get apiUrl() { return this.configService.apiUrl; }
  public http = inject(HttpClient);
  public wsService = inject(WebsocketService);
  public userAuth = inject(AuthService);
  private configService = inject(ConfigService);

  onListenChangedDiagrama() {
    return this.wsService.listen('changed-diagrama');
  }

  emitChangedDiagrama(diagrama: string) {
    const salaDiagrama = this.userAuth.getSalaDiagrama();
    if (salaDiagrama) {
      this.wsService.emit('changed-diagrama', {
        sala: salaDiagrama.nombre,
        diagrama,
      });
    }
  }

  emitEntraSala() {
    const salaDiagrama = this.userAuth.getSalaDiagrama();
    const usuario = this.userAuth.getUserAuth();
    
    if (salaDiagrama && usuario) {
      this.wsService.emit('entra-sala', {
        sala: salaDiagrama.nombre,
        usuario: {
          id: usuario.id.toString(),
          nombre: usuario.email,
          email: usuario.email
        }
      });
      console.log(`📍 Usuario ${usuario.email} uniéndose a sala: ${salaDiagrama.nombre}`);
    }
  }

  /**
   * 🔄 Emite cambios en el Flutter Screen a todos los usuarios en la sala
   */
  emitFlutterScreenCambios(cellId: string, screen: any): void {
    const salaDiagrama = this.userAuth.getSalaDiagrama();
    const usuario = this.userAuth.getUserAuth();
    
    if (salaDiagrama && usuario) {
      this.wsService.emit('flutter-screen-cambios', {
        sala: salaDiagrama.nombre,
        cellId,
        screen,
        usuario: usuario.email,
        timestamp: new Date().toISOString()
      });
      console.log(`📤 Emitiendo cambios Flutter Screen para clase: ${cellId}`);
    }
  }

  /**
   * 📥 Escucha cambios en el Flutter Screen de otros usuarios
   */
  onListenFlutterScreenCambios() {
    return this.wsService.listen('flutter-screen-cambios');
  }

  contenidoVerifDiagramaBD(nombreSala: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/salas/` + nombreSala);
  }
}
