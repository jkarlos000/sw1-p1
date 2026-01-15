import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from '../auth/auth.service';
import { WebsocketService } from '../common/services/websocket.service';

@Injectable({
  providedIn: 'root',
})
export class DiagramadorService {
  private apiUrl = environment.apiUrl;
  public http = inject(HttpClient);
  public wsService = inject(WebsocketService);
  public userAuth = inject(AuthService);

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

  contenidoVerifDiagramaBD(nombreSala: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/salas/` + nombreSala);
  }
}
