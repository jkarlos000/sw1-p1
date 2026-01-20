import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ConfigService } from './config.service';

/**
 * 🎯 Servicio: Gestión de Clases UML con Métodos
 * Consume las APIs del backend para persistencia de clases UML 2.5
 */

export interface AtributoUML {
  titulo: string;
  tipo: string;
  visibility: string;
  esStatic?: boolean;
  defaultValue?: string;
}

export interface ParametroMetodo {
  nombre: string;
  tipo: string;
}

export interface MetodoUML {
  nombre: string;
  tipoRetorno: string;
  visibility: string;
  esStatic?: boolean;
  esAbstract?: boolean;
  parametros: ParametroMetodo[];
}

export interface ClaseUML {
  cell_id: string;
  nombre: string;
  atributos: AtributoUML[];
  metodos: MetodoUML[];
  posicion?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

@Injectable({
  providedIn: 'root'
})
export class ClaseUmlService {
  private http = inject(HttpClient);
  private configService = inject(ConfigService);
  
  private get apiUrl(): string {
    return this.configService.apiUrl;
  }

  /**
   * 💾 Guardar una clase completa
   */
  guardarClase(id_sala: number, clase: ClaseUML): Observable<any> {
    const body = {
      id_sala,
      cell_id: clase.cell_id,
      nombre: clase.nombre,
      atributos: clase.atributos,
      metodos: clase.metodos,
      posicion: clase.posicion
    };
    
    return this.http.post(`${this.apiUrl}/uml/clase`, body);
  }

  /**
   * 💾 Guardar múltiples clases (batch)
   */
  guardarClasesMultiples(id_sala: number, clases: ClaseUML[]): Observable<any> {
    const body = {
      id_sala,
      clases
    };
    
    return this.http.post(`${this.apiUrl}/uml/clases`, body);
  }

  /**
   * 🔍 Obtener todas las clases de una sala
   */
  obtenerClases(id_sala: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/uml/clases/${id_sala}`);
  }

  /**
   * 🗑️ Eliminar una clase
   */
  eliminarClase(id_sala: number, cell_id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/uml/clase/${id_sala}/${cell_id}`);
  }

  /**
   * 🔄 Extraer clases del diagrama actual (JointJS graph)
   */
  extraerClasesDelGrafo(graph: any): ClaseUML[] {
    const clases: ClaseUML[] = [];
    const cells = graph.getCells();
    
    for (const cell of cells) {
      if (cell.get('type') === 'app.RectangularModel') {
        const texto = cell.attr('label/text') || '';
        const lineas = texto.split('\n');
        const nombre = lineas[0] || 'Clase';
        
        const atributos: AtributoUML[] = [];
        const metodos: MetodoUML[] = [];
        
        let enSeccionMetodos = false;
        
        for (let i = 1; i < lineas.length; i++) {
          const linea = lineas[i].trim();
          
          if (linea.includes('───') || linea === '---') {
            enSeccionMetodos = true;
            continue;
          }
          
          if (linea && linea !== '' && !linea.includes('─')) {
            if (linea.includes('(') && linea.includes(')')) {
              // Es un método
              metodos.push(this.parsearMetodo(linea));
            } else if (linea.includes(':')) {
              // Es un atributo
              atributos.push(this.parsearAtributo(linea));
            }
          }
        }
        
        const position = cell.get('position');
        const size = cell.get('size');
        
        clases.push({
          cell_id: cell.id,
          nombre,
          atributos,
          metodos,
          posicion: {
            x: position?.x || 0,
            y: position?.y || 0,
            width: size?.width || 200,
            height: size?.height || 150
          }
        });
      }
    }
    
    return clases;
  }

  /**
   * 📝 Parsear un atributo desde el formato UML
   * Formato: [+|-|#|~] nombre : tipo [= valor]
   */
  private parsearAtributo(linea: string): AtributoUML {
    const match = linea.match(/^([+\-#~])?\s*(\w+)\s*:\s*(\w+)(?:\s*=\s*(.+))?/);
    
    if (match) {
      return {
        titulo: match[2],
        tipo: match[3],
        visibility: this.simboloAVisibilidad(match[1] || '-'),
        defaultValue: match[4]
      };
    }
    
    return {
      titulo: 'atributo',
      tipo: 'String',
      visibility: 'private'
    };
  }

  /**
   * 📝 Parsear un método desde el formato UML
   * Formato: [+|-|#|~] nombre(params) : tipo
   */
  private parsearMetodo(linea: string): MetodoUML {
    const match = linea.match(/^([+\-#~])?\s*(\w+)\(([^)]*)\)\s*:\s*(\w+)/);
    
    if (match) {
      const parametros: ParametroMetodo[] = [];
      
      if (match[3]) {
        const paramsStr = match[3].split(',');
        for (const p of paramsStr) {
          const parts = p.trim().split(':');
          parametros.push({
            nombre: parts[0].trim(),
            tipo: parts[1] ? parts[1].trim() : 'Object'
          });
        }
      }
      
      return {
        nombre: match[2],
        tipoRetorno: match[4],
        visibility: this.simboloAVisibilidad(match[1] || '+'),
        parametros
      };
    }
    
    return {
      nombre: 'metodo',
      tipoRetorno: 'void',
      visibility: 'public',
      parametros: []
    };
  }

  /**
   * 🔤 Convertir símbolo UML a visibility
   */
  private simboloAVisibilidad(simbolo: string): string {
    switch (simbolo) {
      case '+': return 'public';
      case '-': return 'private';
      case '#': return 'protected';
      case '~': return 'package';
      default: return 'private';
    }
  }
}
