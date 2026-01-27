import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { ConfigService } from '../../common/services/config.service';

/**
 * 🔄 Servicio de Persistencia de Clases UML
 * Guarda y carga los cambios de clases en el backend
 */
@Injectable({
  providedIn: 'root'
})
export class ClasePersistenciaService {
  
  private clasesModificadas = new BehaviorSubject<Map<string, any>>(new Map());
  public clasesModificadas$ = this.clasesModificadas.asObservable();

  constructor(
    private http: HttpClient,
    private configService: ConfigService
  ) {}

  /**
   * 💾 Guardar cambios de una clase en la base de datos
   */
  guardarClase(idSala: number, cellId: string, nombre: string, atributos: any[], metodos: any[]): Observable<any> {
    const url = `${this.configService.apiUrl}/api/v1/clase-uml/guardar`;
    
    const payload = {
      id_sala: idSala,
      cell_id: cellId,
      nombre: nombre,
      atributos: atributos.map((attr, index) => ({
        nombre: attr.titulo,
        tipo: attr.tipo,
        visibility: attr.visibility,
        es_static: false,
        valor_default: attr.defaultValue || null,
        orden_visualizacion: index
      })),
      metodos: metodos.map((met, index) => ({
        nombre: met.nombre,
        tipo_retorno: met.tipoRetorno,
        visibility: met.visibility,
        es_static: false,
        parametros: (met.parametros || []).map((param: any) => ({
          nombre: param.nombre,
          tipo: param.tipo
        })),
        orden_visualizacion: index
      })),
      posicion: {
        x: 0,
        y: 0,
        width: 220,
        height: 150
      }
    };

    console.log('📤 Enviando cambios de clase al backend:', payload);
    
    return this.http.post(url, payload);
  }

  /**
   * 📥 Obtener clases guardadas de una sala
   */
  obtenerClases(idSala: number): Observable<any> {
    const url = `${this.configService.apiUrl}/api/v1/clase-uml/sala/${idSala}`;
    return this.http.get(url);
  }

  /**
   * 🔍 Obtener clase específica
   */
  obtenerClase(cellId: string): Observable<any> {
    const url = `${this.configService.apiUrl}/api/v1/clase-uml/cell/${cellId}`;
    return this.http.get(url);
  }

  /**
   * 📝 Guardar en cache local (memory)
   */
  guardarEnCache(cellId: string, claseData: any): void {
    const modificadas = this.clasesModificadas.value;
    modificadas.set(cellId, claseData);
    this.clasesModificadas.next(modificadas);
    console.log('💾 Clase guardada en cache:', cellId);
  }

  /**
   * 🔍 Obtener del cache local
   */
  obtenerDelCache(cellId: string): any {
    return this.clasesModificadas.value.get(cellId);
  }

  /**
   * 🗑️ Limpiar cache
   */
  limpiarCache(): void {
    this.clasesModificadas.next(new Map());
  }

  /**
   * 📱 FLUTTER SCREENS - Guardar pantalla Flutter en BD
   */
  guardarFlutterScreen(idSala: number, idClase: number, screen: any): Observable<any> {
    const url = `${this.configService.apiUrl}/api/v1/flutter-screen/save`;
    
    const payload = {
      id_sala: idSala,
      id_clase: idClase,
      nombre_screen: screen.className,
      componentes: screen.components || []
    };

    console.log('📱 Guardando Flutter Screen en BD:', payload);
    return this.http.post(url, payload);
  }

  /**
   * 📱 Obtener pantalla Flutter de BD
   */
  obtenerFlutterScreen(idClase: number): Observable<any> {
    const url = `${this.configService.apiUrl}/api/v1/flutter-screen/${idClase}`;
    return this.http.get(url);
  }

  /**
   * 📱 Actualizar componente individual de Flutter Screen
   */
  actualizarComponenteFlutter(idComponent: number, componentData: any): Observable<any> {
    const url = `${this.configService.apiUrl}/api/v1/flutter-screen/component/${idComponent}`;
    return this.http.put(url, componentData);
  }

  /**
   * 📱 Eliminar pantalla Flutter
   */
  eliminarFlutterScreen(idScreen: number): Observable<any> {
    const url = `${this.configService.apiUrl}/api/v1/flutter-screen/${idScreen}`;
    return this.http.delete(url);
  }

  /**
   * 🔄 SINCRONIZACIÓN: Crear Flutter Screen para clase antigua que no tiene
   */
  sincronizarClaseAntigua(idSala: number, idClase: number): Observable<any> {
    const url = `${this.configService.apiUrl}/api/v1/flutter-screen/sincronizar/${idSala}/${idClase}`;
    console.log(`🔄 Sincronizando clase antigua: id_clase=${idClase}`);
    return this.http.post(url, {});
  }

  /**
   * 🔄 MIGRACIÓN MASIVA: Sincronizar todas las clases de una sala
   */
  migrarSalaCompleta(idSala: number): Observable<any> {
    const url = `${this.configService.apiUrl}/api/v1/flutter-screen/migrar-sala/${idSala}`;
    console.log(`🔄 Iniciando migración masiva para sala: ${idSala}`);
    return this.http.post(url, {});
  }
}
