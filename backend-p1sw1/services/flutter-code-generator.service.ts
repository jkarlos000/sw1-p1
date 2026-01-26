/**
 * Servicio que genera código Dart desde FlutterScreen
 */

interface FlutterComponent {
  id: string;
  type: string;
  label: string;
  position: number;
  size?: string;
  variant?: string;
  customProperties?: any;
}

interface UMLAtributo {
  titulo: string;
  tipo?: string;
  visibility?: string;
  defaultValue?: string;
}

interface UMLMetodo {
  nombre: string;
  parametros?: { nombre: string; tipo: string }[];
  tipoRetorno?: string;
  visibility?: string;
}

interface FlutterScreen {
  className: string;
  components: FlutterComponent[];
  atributos?: UMLAtributo[];    // ⭐ NEW: UML attributes
  metodos?: UMLMetodo[];        // ⭐ NEW: UML methods
  theme?: {
    primaryColor?: string;
    accentColor?: string;
    fontFamily?: string;
  };
}

export class FlutterCodeGeneratorService {
  
  /**
   * Genera código Dart completo desde un FlutterScreen
   */
  generarCodigoDart(screen: FlutterScreen): string {
    console.log(`🎨 Generando código Dart para: ${screen.className}`);

    const imports = this.generarImports();
    const classDeclaration = this.generarClassDeclaration(screen.className);
    
    // ⭐ NEW: Generar propiedades desde atributos UML
    const properties = this.generarProperties(screen.atributos || []);
    
    // ⭐ NEW: Generar controllers desde atributos
    const controllers = this.generarControllersDesdeAtributos(screen.atributos || []);
    
    const buildMethod = this.generarBuildMethod(screen);
    
    // ⭐ NEW: Generar métodos desde UML + métodos de componentes
    const methods = this.generarMetodos(screen.metodos || [], screen.components);
    
    const dartCode = `${imports}

${classDeclaration}
${properties}
${controllers}

  @override
  Widget build(BuildContext context) {
${buildMethod}
  }

${methods}
}
`;

    console.log('✅ Código Dart generado exitosamente');
    return dartCode;
  }

  /**
   * ⭐ NEW: Genera propiedades desde atributos UML
   */
  private generarProperties(atributos: UMLAtributo[]): string {
    if (atributos.length === 0) {
      return '';
    }

    const properties = atributos.map(attr => {
      const dartType = this.mapearTipoDart(attr.tipo || 'String');
      const visibility = attr.visibility === 'public' ? '' : '';  // Dart por defecto es private con _
      const defaultValue = attr.defaultValue ? ` = ${this.parseDefaultValue(attr.defaultValue)}` : '';
      
      return `  final ${dartType} ${attr.titulo}${defaultValue};`;
    }).join('\n');

    return `\n${properties}`;
  }

  /**
   * ⭐ NEW: Genera controllers basados en atributos UML
   */
  private generarControllersDesdeAtributos(atributos: UMLAtributo[]): string {
    // Generar controllers solo para atributos String (TextFields)
    const textAttributes = atributos.filter(a => 
      !a.tipo || a.tipo === 'String' || a.tipo === 'string'
    );
    
    if (textAttributes.length === 0) {
      return '';
    }

    const controllers = textAttributes.map(attr => {
      const controllerName = `${attr.titulo}Controller`;
      return `  final TextEditingController ${controllerName} = TextEditingController();`;
    }).join('\n');

    return `\n${controllers}`;
  }

  /**
   * ⭐ NEW: Genera métodos desde UML + componentes
   */
  private generarMetodos(metodos: UMLMetodo[], components: FlutterComponent[]): string {
    const codigoMetodos: string[] = [];
    
    // Generar métodos desde UML
    if (metodos && metodos.length > 0) {
      metodos.forEach(metodo => {
        const paramsCode = metodo.parametros?.map(p => `${this.mapearTipoDart(p.tipo)} ${p.nombre}`).join(', ') || '';
        const returnType = this.mapearTipoDart(metodo.tipoRetorno || 'void');
        
        codigoMetodos.push(`  ${returnType} ${metodo.nombre}(${paramsCode}) {
    // TODO: Implementar ${metodo.nombre}
    print('${metodo.nombre} ejecutado');
  }`);
      });
    }
    
    // Generar métodos para componentes (botones)
    const buttons = components.filter(c => 
      c.type === 'Button' || 
      c.type === 'ElevatedButton' || 
      c.type === 'TextButton'
    );

    buttons.forEach(btn => {
      // No duplicar si ya existe en métodos UML
      if (!metodos?.some(m => m.nombre === btn.label)) {
        codigoMetodos.push(`  void ${btn.label}() {
    // TODO: Implementar lógica de ${btn.label}
    print('${this.capitalize(btn.label)} presionado');
  }`);
      }
    });

    return codigoMetodos.length > 0 ? `\n${codigoMetodos.join('\n\n')}\n` : '';
  }

  /**
   * ⭐ NEW: Mapea tipos UML a tipos Dart
   */
  private mapearTipoDart(tipo?: string): string {
    if (!tipo) return 'dynamic';
    
    const tipoLower = tipo.toLowerCase();
    
    switch (tipoLower) {
      case 'string': return 'String';
      case 'integer':
      case 'int': return 'int';
      case 'double':
      case 'float': return 'double';
      case 'boolean':
      case 'bool': return 'bool';
      case 'date':
      case 'datetime': return 'DateTime';
      case 'list': return 'List';
      case 'map': return 'Map';
      case 'object': return 'dynamic';
      default: return tipo;
    }
  }

  /**
   * ⭐ NEW: Parse default values
   */
  private parseDefaultValue(value: string): string {
    const trimmed = value.trim();
    
    // Si es un número
    if (!isNaN(Number(trimmed))) {
      return trimmed;
    }
    
    // Si es booleano
    if (trimmed === 'true' || trimmed === 'false') {
      return trimmed;
    }
    
    // Si es string, agregar comillas
    if (!trimmed.startsWith('"') && !trimmed.startsWith("'")) {
      return `'${trimmed}'`;
    }
    
    return trimmed;
  }

  /**
   * Genera imports de Flutter
   */
  private generarImports(): string {
    return `import 'package:flutter/material.dart';`;
  }

  /**
   * Genera declaración de clase
   */
  private generarClassDeclaration(className: string): string {
    return `class ${className}Screen extends StatelessWidget {`;
  }

  /**
   * Genera controllers para TextFields
   */
  private generarControllers(components: FlutterComponent[]): string {
    const textFields = components.filter(c => c.type === 'TextField');
    
    if (textFields.length === 0) {
      return '';
    }

    const controllers = textFields.map(tf => {
      const controllerName = `${tf.label}Controller`;
      return `  final TextEditingController ${controllerName} = TextEditingController();`;
    }).join('\n');

    return `\n${controllers}`;
  }

  /**
   * Genera método build() con todos los widgets
   */
  private generarBuildMethod(screen: FlutterScreen): string {
    const appBarTitle = screen.className;
    const primaryColor = screen.theme?.primaryColor || '#2196F3';
    
    // ⭐ NEW: Si hay atributos UML, generar widgets desde ellos
    let widgetsCode = '';
    
    if (screen.atributos && screen.atributos.length > 0) {
      // Generar widgets desde atributos UML
      const textFields = screen.atributos
        .filter(attr => !attr.tipo || attr.tipo === 'String' || attr.tipo === 'string')
        .map((attr, idx) => this.generarTextFieldDesdeAtributo(attr, idx));
      
      const otrosWidgets = screen.atributos
        .filter(attr => attr.tipo && attr.tipo !== 'String' && attr.tipo !== 'string')
        .map((attr, idx) => {
          const tipo = this.mapearTipoDart(attr.tipo);
          return `Container(
              padding: EdgeInsets.all(12),
              decoration: BoxDecoration(
                border: Border.all(color: Colors.grey[300]!),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Text('${attr.titulo} (${tipo})'),
            ),
            SizedBox(height: 16)`;
        });

      const componentWidgets = screen.components
        .sort((a, b) => a.position - b.position)
        .map(c => this.generarWidget(c))
        .filter(w => w); // Remove empty strings

      widgetsCode = [...textFields, ...otrosWidgets, ...componentWidgets]
        .filter(w => w)
        .join(',\n            ');
    } else {
      // Fallback: generar desde componentes
      widgetsCode = screen.components
        .sort((a, b) => a.position - b.position)
        .map(c => this.generarWidget(c))
        .join(',\n            ');
    }

    return `    return Scaffold(
      appBar: AppBar(
        title: Text('${appBarTitle}'),
        backgroundColor: Color(${this.hexToColorInt(primaryColor)}),
      ),
      body: Padding(
        padding: EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            ${widgetsCode}
          ],
        ),
      ),
    );`;
  }

  /**
   * ⭐ NEW: Genera TextField desde atributo UML
   */
  private generarTextFieldDesdeAtributo(attr: UMLAtributo, index: number): string {
    const controllerName = `${attr.titulo}Controller`;
    const labelText = this.capitalize(attr.titulo);
    const hint = attr.tipo ? `(${attr.tipo})` : '';
    
    return `TextField(
              controller: ${controllerName},
              decoration: InputDecoration(
                labelText: '${labelText}',
                hintText: 'Ingrese ${labelText.toLowerCase()} ${hint}',
                border: OutlineInputBorder(),
              ),
            ),
            SizedBox(height: 16)`;
  }

  /**
   * Genera código para un widget específico
   */
  private generarWidget(component: FlutterComponent): string {
    switch (component.type) {
      case 'TextField':
        return this.generarTextField(component);
      
      case 'ElevatedButton':
      case 'Button':
        return this.generarElevatedButton(component);
      
      case 'TextButton':
        return this.generarTextButton(component);
      
      case 'Icon':
        return `Icon(Icons.${component.label}, size: 32)`;
      
      default:
        return `Container(child: Text('${component.label}'))`;
    }
  }

  /**
   * Genera TextField
   */
  private generarTextField(component: FlutterComponent): string {
    const controllerName = `${component.label}Controller`;
    const labelText = this.capitalize(component.label);
    
    return `TextField(
              controller: ${controllerName},
              decoration: InputDecoration(
                labelText: '${labelText}',
                border: OutlineInputBorder(),
              ),
            ),
            SizedBox(height: 16)`;
  }

  /**
   * Genera ElevatedButton
   */
  private generarElevatedButton(component: FlutterComponent): string {
    const methodName = component.label;
    const buttonText = this.capitalize(component.label);
    
    const sizeStyle = component.size === 'large' 
      ? 'padding: EdgeInsets.symmetric(vertical: 16), '
      : component.size === 'small'
      ? 'padding: EdgeInsets.symmetric(vertical: 8), '
      : '';

    return `ElevatedButton(
              onPressed: ${methodName},
              style: ElevatedButton.styleFrom(
                ${sizeStyle}
              ),
              child: Text('${buttonText.toUpperCase()}', style: TextStyle(fontSize: 16)),
            ),
            SizedBox(height: 16)`;
  }

  /**
   * Genera TextButton
   */
  private generarTextButton(component: FlutterComponent): string {
    const methodName = component.label;
    const buttonText = this.capitalize(component.label);
    
    return `TextButton(
              onPressed: ${methodName},
              child: Text('${buttonText}'),
            ),
            SizedBox(height: 8)`;
  }

  /**
   * Genera métodos (stubs) para los botones
   */
  private generarMethods(components: FlutterComponent[]): string {
    const buttons = components.filter(c => 
      c.type === 'Button' || 
      c.type === 'ElevatedButton' || 
      c.type === 'TextButton'
    );

    if (buttons.length === 0) {
      return '';
    }

    const methods = buttons.map(btn => {
      return `  void ${btn.label}() {
    // TODO: Implementar lógica de ${btn.label}
    print('${this.capitalize(btn.label)} presionado');
  }`;
    }).join('\n\n');

    return `\n${methods}\n`;
  }

  /**
   * Convierte HEX a Color integer de Flutter
   */
  private hexToColorInt(hex: string): string {
    const cleaned = hex.replace('#', '');
    return `0xFF${cleaned}`;
  }

  /**
   * Capitaliza primera letra
   */
  private capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
}
