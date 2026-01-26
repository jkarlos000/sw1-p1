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

interface FlutterScreen {
  className: string;
  components: FlutterComponent[];
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
    const controllers = this.generarControllers(screen.components);
    const buildMethod = this.generarBuildMethod(screen);
    const methods = this.generarMethods(screen.components);
    
    const dartCode = `${imports}

${classDeclaration}
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
    
    const componentsCode = screen.components
      .sort((a, b) => a.position - b.position)
      .map(c => this.generarWidget(c))
      .join(',\n            ');

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
            ${componentsCode}
          ],
        ),
      ),
    );`;
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
