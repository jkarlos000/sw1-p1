import { Injectable } from '@angular/core';
import { FlutterScreen, FlutterComponent, UMLClassData } from '../../common/interfaces/flutter-screen.interface';

@Injectable({
  providedIn: 'root'
})
export class FlutterGeneratorService {

  constructor() {}

  /**
   * Genera un FlutterScreen desde datos de clase UML
   * Atributos → TextFields
   * Métodos → Buttons
   */
  generarDesdeClaseUML(classData: UMLClassData): FlutterScreen {
    console.log('🏗️ Generando Flutter Screen desde clase UML:', classData.className);

    const components: FlutterComponent[] = [];
    let position = 1;

    // Convertir atributos a TextFields
    classData.attributes.forEach(attr => {
      components.push({
        id: `textfield_${attr.name}_${Date.now()}_${position}`,
        type: 'TextField',
        label: attr.name,
        position: position++,
        size: 'medium',
        customProperties: {
          attributeType: attr.type,
          visibility: attr.visibility
        }
      });
    });

    // Convertir métodos a Buttons
    classData.methods.forEach(method => {
      components.push({
        id: `button_${method.name}_${Date.now()}_${position}`,
        type: 'ElevatedButton',
        label: method.name,
        position: position++,
        size: 'medium',
        variant: 'elevated',
        customProperties: {
          returnType: method.returnType,
          visibility: method.visibility,
          parameters: method.parameters
        }
      });
    });

    const screen: FlutterScreen = {
      className: classData.className,
      components: components,
      theme: {
        primaryColor: '#2196F3',
        accentColor: '#FF9800',
        fontFamily: 'Roboto'
      }
    };

    console.log(`✅ Flutter Screen generado: ${components.length} componentes`);
    return screen;
  }

  /**
   * Extrae datos de clase UML desde un elemento JointJS
   */
  extraerDatosClase(cell: any): UMLClassData | null {
    try {
      const tipo = cell.get('type');
      
      // Verificar que sea una clase UML
      if (tipo !== 'uml.Class') {
        console.warn('⚠️ El elemento no es una clase UML:', tipo);
        return null;
      }

      const nombre = cell.get('name') || 'Clase';
      const atributosRaw = cell.get('attributes') || [];
      const metodosRaw = cell.get('methods') || [];

      // Parsear atributos
      const attributes = atributosRaw.map((attr: string, index: number) => {
        const match = attr.match(/([+\-#~]?)(\w+)\s*:\s*(\w+)/);
        if (match) {
          return {
            name: match[2],
            type: match[3],
            visibility: this.mapVisibility(match[1])
          };
        }
        // Formato simple: solo nombre
        return {
          name: attr.replace(/[+\-#~]/, '').trim(),
          type: 'String',
          visibility: 'public'
        };
      });

      // Parsear métodos
      const methods = metodosRaw.map((method: string, index: number) => {
        const match = method.match(/([+\-#~]?)(\w+)\s*\((.*?)\)\s*(?::\s*(\w+))?/);
        if (match) {
          return {
            name: match[2],
            returnType: match[4] || 'void',
            visibility: this.mapVisibility(match[1]),
            parameters: match[3] ? match[3].split(',').map(p => p.trim()) : []
          };
        }
        // Formato simple: solo nombre
        return {
          name: method.replace(/[+\-#~()]/, '').trim(),
          returnType: 'void',
            visibility: 'public',
          parameters: []
        };
      });

      return {
        className: nombre,
        attributes: attributes,
        methods: methods
      };
    } catch (error) {
      console.error('❌ Error extrayendo datos de clase:', error);
      return null;
    }
  }

  /**
   * Mapea símbolos de visibilidad UML a strings
   */
  private mapVisibility(symbol: string): string {
    const map: Record<string, string> = {
      '+': 'public',
      '-': 'private',
      '#': 'protected',
      '~': 'package'
    };
    return map[symbol] || 'public';
  }

  /**
   * Genera FlutterScreen básico cuando no hay atributos ni métodos
   */
  generarScreenBasico(className: string): FlutterScreen {
    console.log('📱 Generando screen básico para:', className);
    return {
      className: className,
      components: [
        {
          id: `textfield_example_${Date.now()}`,
          type: 'TextField',
          label: 'ejemplo',
          position: 1,
          size: 'medium'
        },
        {
          id: `button_accion_${Date.now()}`,
          type: 'ElevatedButton',
          label: 'acción',
          position: 2,
          size: 'medium',
          variant: 'elevated'
        }
      ],
      theme: {
        primaryColor: '#2196F3'
      }
    };
  }
}
