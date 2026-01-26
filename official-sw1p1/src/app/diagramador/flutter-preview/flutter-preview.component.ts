// ...existing code...
// ...existing code...
import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { FlutterScreen, FlutterComponent } from '../../common/interfaces/flutter-screen.interface';
import { ConfigService } from '../../common/services/config.service';

@Component({
  selector: 'app-flutter-preview',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './flutter-preview.component.html',
  styleUrls: ['./flutter-preview.component.css']
})
export class FlutterPreviewComponent implements OnInit {
  public historialEstados: FlutterScreen[] = [];
  public indiceHistorial: number = -1;
  public paletaDraggedType: FlutterComponent['type'] | null = null;
  public selectedComponentIndex: number | null = null;
  public selectedComponent: FlutterComponent | null = null;
  @Input() screen: FlutterScreen | null = null;
  @Output() cerrar = new EventEmitter<void>();
  public modoEdicion: boolean = false;
  public draggedIndex: number | null = null;
  public dragOverIndex: number | null = null;
  public mostrarCodigoDart: boolean = false;
  public codigoDartGenerado: string = '';
  public componentesPaleta = [
    { type: 'TextField', icon: '📝', label: 'TextField' },
    { type: 'ElevatedButton', icon: '🔘', label: 'Button' },
    { type: 'TextButton', icon: '🔗', label: 'Text Button' },
    { type: 'Icon', icon: '⭐', label: 'Icon' },
    { type: 'Container', icon: '📦', label: 'Container' }
  ];

  constructor(
    private http: HttpClient,
    private configService: ConfigService
  ) {}

  ngOnInit(): void {
    console.log('📱 Flutter Preview Component iniciado');
    if (this.screen) {
      this.guardarEstado();
    }
  }

  /**
   * Guarda el estado actual en el historial
   */
  private guardarEstado(): void {
    if (!this.screen) return;
    // Eliminar cualquier estado futuro si estamos en el medio del historial
    this.historialEstados = this.historialEstados.slice(0, this.indiceHistorial + 1);
    // Hacer una copia profunda del screen actual
    const estadoCopia = JSON.parse(JSON.stringify(this.screen));
    this.historialEstados.push(estadoCopia);
    this.indiceHistorial++;
    console.log('💾 Estado guardado en historial. Total:', this.historialEstados.length);
    // Regenerar código Dart si está visible
    if (this.mostrarCodigoDart) {
      this.generarCodigoDart();
    }
  }

  /**
   * Guarda el estado cuando se edita el nombre de la pantalla
   */
  public guardarEstadoEdicion(): void {
    this.guardarEstado();
    console.log('📝 Nombre de pantalla actualizado:', this.screen?.className);
  }

  /**
   * Deshacer última acción (Ctrl+Z)
   */
  deshacer(): void {
    if (this.indiceHistorial > 0) {
      this.indiceHistorial--;
      this.screen = JSON.parse(JSON.stringify(this.historialEstados[this.indiceHistorial]));
      this.selectedComponent = null;
      this.selectedComponentIndex = null;
      console.log('↩️ Deshacer - Índice:', this.indiceHistorial);
    }
  }

  /**
   * Rehacer última acción (Ctrl+Y)
   */
  rehacer(): void {
    if (this.indiceHistorial < this.historialEstados.length - 1) {
      this.indiceHistorial++;
      this.screen = JSON.parse(JSON.stringify(this.historialEstados[this.indiceHistorial]));
      this.selectedComponent = null;
      this.selectedComponentIndex = null;
      console.log('↪️ Rehacer - Índice:', this.indiceHistorial);
    }
  }

  /**
   * Escucha atajos de teclado (Ctrl+Z, Ctrl+Y)
   */
  onKeyDown(event: KeyboardEvent): void {
    if (event.ctrlKey || event.metaKey) {
      if (event.key === 'z' || event.key === 'Z') {
        event.preventDefault();
        this.deshacer();
      } else if (event.key === 'y' || event.key === 'Y') {
        event.preventDefault();
        this.rehacer();
      }
    }
  }

  /**
   * Cambia entre modo vista y modo edición
   */
  toggleModoEdicion(): void {
    this.modoEdicion = !this.modoEdicion;
    console.log('🎨 Modo edición:', this.modoEdicion ? 'ACTIVADO' : 'DESACTIVADO');
  }

  /**
   * Toggle para mostrar/ocultar vista previa de código Dart
   */
  toggleCodigoDart(): void {
    this.mostrarCodigoDart = !this.mostrarCodigoDart;
    if (this.mostrarCodigoDart) {
      this.generarCodigoDart();
    }
  }

  /**
   * Genera el código Dart basado en la pantalla actual
   */
  private generarCodigoDart(): void {
    if (!this.screen) return;

    const className = this.screen.className || 'MiPantalla';
    const components = this.screen.components || [];

    // Generar imports
    let codigo = `import 'package:flutter/material.dart';\n\n`;

    // Generar clase principal
    codigo += `class ${className}Screen extends StatefulWidget {\n`;
    codigo += `  const ${className}Screen({Key? key}) : super(key: key);\n\n`;
    codigo += `  @override\n`;
    codigo += `  State<${className}Screen> createState() => _${className}ScreenState();\n`;
    codigo += `}\n\n`;

    // Generar State
    codigo += `class _${className}ScreenState extends State<${className}Screen> {\n`;

    // Agregar controllers si hay TextFields
    const hasTextFields = components.some(c => c.type === 'TextField');
    if (hasTextFields) {
      codigo += `  late TextEditingController _controller;\n\n`;
      codigo += `  @override\n`;
      codigo += `  void initState() {\n`;
      codigo += `    super.initState();\n`;
      codigo += `    _controller = TextEditingController();\n`;
      codigo += `  }\n\n`;
      codigo += `  @override\n`;
      codigo += `  void dispose() {\n`;
      codigo += `    _controller.dispose();\n`;
      codigo += `    super.dispose();\n`;
      codigo += `  }\n\n`;
    }

    // Build method
    codigo += `  @override\n`;
    codigo += `  Widget build(BuildContext context) {\n`;
    codigo += `    return Scaffold(\n`;
    codigo += `      appBar: AppBar(\n`;
    codigo += `        title: const Text('${className}'),\n`;
    codigo += `        backgroundColor: Colors.blue,\n`;
    codigo += `      ),\n`;
    codigo += `      body: Padding(\n`;
    codigo += `        padding: const EdgeInsets.all(16.0),\n`;
    codigo += `        child: SingleChildScrollView(\n`;
    codigo += `          child: Column(\n`;
    codigo += `            children: [\n`;

    // Agregar componentes
    components.forEach((comp, index) => {
      const padding = '              ';
      const size = this.getSizeClassValue(comp.size || 'medium');

      switch (comp.type) {
        case 'TextField':
          codigo += `${padding}TextField(\n`;
          codigo += `${padding}  controller: _controller,\n`;
          codigo += `${padding}  decoration: InputDecoration(\n`;
          codigo += `${padding}    labelText: '${comp.label}',\n`;
          codigo += `${padding}    hintText: '${comp.placeholder || 'Ingrese ' + comp.label}',\n`;
          codigo += `${padding}    border: OutlineInputBorder(),\n`;
          codigo += `${padding}  ),\n`;
          codigo += `${padding}),\n`;
          if (index < components.length - 1) codigo += `${padding}const SizedBox(height: 16),\n`;
          break;

        case 'ElevatedButton':
        case 'Button':
          codigo += `${padding}ElevatedButton(\n`;
          codigo += `${padding}  onPressed: () {},\n`;
          if (comp.color && comp.color !== '#2196F3') {
            codigo += `${padding}  style: ElevatedButton.styleFrom(\n`;
            codigo += `${padding}    backgroundColor: Color(0x${comp.color.substring(1)}),\n`;
            codigo += `${padding}  ),\n`;
          }
          codigo += `${padding}  child: Text('${comp.label}'),\n`;
          codigo += `${padding}),\n`;
          if (index < components.length - 1) codigo += `${padding}const SizedBox(height: 16),\n`;
          break;

        case 'TextButton':
          codigo += `${padding}TextButton(\n`;
          codigo += `${padding}  onPressed: () {},\n`;
          if (comp.color && comp.color !== '#2196F3') {
            codigo += `${padding}  style: TextButton.styleFrom(\n`;
            codigo += `${padding}    foregroundColor: Color(0x${comp.color.substring(1)}),\n`;
            codigo += `${padding}  ),\n`;
          }
          codigo += `${padding}  child: Text('${comp.label}'),\n`;
          codigo += `${padding}),\n`;
          if (index < components.length - 1) codigo += `${padding}const SizedBox(height: 16),\n`;
          break;

        case 'Icon':
          codigo += `${padding}const Icon(Icons.star, size: 40, color: Colors.yellow),\n`;
          if (index < components.length - 1) codigo += `${padding}const SizedBox(height: 16),\n`;
          break;

        case 'Container':
          codigo += `${padding}Container(\n`;
          codigo += `${padding}  width: double.infinity,\n`;
          codigo += `${padding}  height: ${size},\n`;
          codigo += `${padding}  decoration: BoxDecoration(\n`;
          codigo += `${padding}    color: Colors.grey[300],\n`;
          codigo += `${padding}    borderRadius: BorderRadius.circular(8),\n`;
          codigo += `${padding}  ),\n`;
          codigo += `${padding}  child: Center(child: Text('${comp.label}')),\n`;
          codigo += `${padding}),\n`;
          if (index < components.length - 1) codigo += `${padding}const SizedBox(height: 16),\n`;
          break;

        default:
          codigo += `${padding}// ${comp.type}: ${comp.label}\n`;
      }
    });

    // Cerrar Column
    codigo += `            ],\n`;
    codigo += `          ),\n`;
    codigo += `        ),\n`;
    codigo += `      ),\n`;
    codigo += `    );\n`;
    codigo += `  }\n`;
    codigo += `}\n`;

    this.codigoDartGenerado = codigo;
    console.log('📝 Código Dart generado para:', className);
  }

  /**
   * Obtiene el valor numérico del tamaño para Dart
   */
  private getSizeClassValue(size: string): number {
    const sizeMap: { [key: string]: number } = {
      small: 80,
      medium: 150,
      large: 250
    };
    return sizeMap[size] || 150;
  }

  /**
   * Copia el código Dart al portapapeles
   */
  copiarCodigoAlPortapapeles(): void {
    if (!this.codigoDartGenerado) return;
    navigator.clipboard.writeText(this.codigoDartGenerado).then(() => {
      console.log('✅ Código copiado al portapapeles');
      alert('Código Dart copiado al portapapeles');
    }).catch(err => {
      console.error('❌ Error al copiar:', err);
      alert('Error al copiar el código');
    });
  }

  /**
   * Inicia el arrastre de un componente
   */
  onDragStart(event: DragEvent, index: number): void {
    this.draggedIndex = index;
    console.log('👋 Arrastrando componente:', index);
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/html', index.toString());
      // Opcional: set drag image
      if (event.target instanceof HTMLElement) {
        event.dataTransfer.setDragImage(event.target, 0, 0);
      }
    }
    event.stopPropagation();
  }

  /**
   * Maneja cuando se arrastra sobre otro componente
   */
  onDragOver(event: DragEvent, index: number): void {
    event.preventDefault();
    event.stopPropagation();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move';
    }
    this.dragOverIndex = index;
  }

  /**
   * Maneja cuando se suelta un componente
   */
  onDrop(event: DragEvent, dropIndex: number): void {
    event.preventDefault();
    event.stopPropagation();
    if (this.draggedIndex === null || !this.screen) {
      return;
    }
    // Reordenar componentes
    const components = [...this.screen.components];
    const draggedComponent = components[this.draggedIndex];
    // Eliminar del índice original
    components.splice(this.draggedIndex, 1);
    // Insertar en el nuevo índice
    components.splice(dropIndex, 0, draggedComponent);
    // Actualizar posiciones
    components.forEach((comp, idx) => {
      comp.position = idx + 1;
    });
    // Actualizar el screen
    this.screen.components = components;
    // Si el componente seleccionado se movió, actualizar el índice
    if (this.selectedComponentIndex !== null) {
      if (this.selectedComponentIndex === this.draggedIndex) {
        this.selectedComponentIndex = dropIndex;
      } else if (
        this.selectedComponentIndex > this.draggedIndex &&
        this.selectedComponentIndex <= dropIndex
      ) {
        this.selectedComponentIndex--;
      } else if (
        this.selectedComponentIndex < this.draggedIndex &&
        this.selectedComponentIndex >= dropIndex
      ) {
        this.selectedComponentIndex++;
      }
      this.selectedComponent = this.screen.components[this.selectedComponentIndex];
    }
    console.log('✅ Componente reordenado de', this.draggedIndex, 'a', dropIndex);
    // Limpiar estado
    this.draggedIndex = null;
    this.dragOverIndex = null;
    this.guardarEstado();
  }

  /**
   * Maneja cuando el arrastre sale del componente
   */
  onDragLeave(event: DragEvent): void {
    this.dragOverIndex = null;
  }

  /**
   * Maneja cuando termina el arrastre
   */
  onDragEnd(event: DragEvent): void {
    this.draggedIndex = null;
    this.dragOverIndex = null;
  }

  /**
   * Obtiene clases CSS según el tamaño del componente
   */
  getSizeClass(component: FlutterComponent): string {
    const sizeMap = {
      small: 'flutter-component-small',
      medium: 'flutter-component-medium',
      large: 'flutter-component-large'
    };
    return sizeMap[component.size || 'medium'];
  }

  /**
   * Obtiene clases CSS según el tipo de botón
   */
  getButtonClass(component: FlutterComponent): string {
    const variantMap = {
      elevated: 'flutter-button-elevated',
      outlined: 'flutter-button-outlined',
      text: 'flutter-button-text'
    };
    return variantMap[component.variant || 'elevated'];
  }

  /**
   * Obtiene el estilo de color para un botón
   */
  getButtonStyle(component: FlutterComponent): { [key: string]: string } {
    if (!component.color || !this.isButton(component.type)) {
      return {};
    }
    return {
      'background-color': component.color,
      'border-color': component.color
    };
  }

  /**
   * Determina si el componente es un tipo de botón
   */
  isButton(type: string): boolean {
    return ['Button', 'ElevatedButton', 'TextButton'].includes(type);
  }

  /**
   * Exportar código Dart (funcionalidad básica)
   */
  exportarDart(): void {
    if (!this.screen) {
      console.warn('⚠️ No hay screen para exportar');
      return;
    }
    console.log('📤 Exportando código Dart para:', this.screen.className);
    const apiUrl = this.configService.getConfig().apiUrl;
    this.http.post<any>(`${apiUrl}/flutter/generar-codigo`, { screen: this.screen })
      .subscribe({
        next: (response) => {
          if (response.ok && response.dartCode) {
            console.log('✅ Código Dart generado:', response.dartCode);
            this.descargarArchivoDart(response.dartCode, this.screen!.className);
          } else {
            alert('Error: No se pudo generar el código');
          }
        },
        error: (error) => {
          console.error('❌ Error llamando al backend:', error);
          alert('Error al generar código Dart. Ver consola para detalles.');
        }
      });
  }

  /**
   * Descarga el código como archivo .dart
   */
  private descargarArchivoDart(codigo: string, className: string): void {
    const blob = new Blob([codigo], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${className.toLowerCase()}_screen.dart`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    console.log(`✅ Archivo ${className}_screen.dart descargado`);
  }

  /**
   * Formatea el label para mostrar en UI
   */
  formatLabel(label: string): string {
    return label.charAt(0).toUpperCase() + label.slice(1);
  }

  /**
   * Cerrar panel de Flutter Preview
   */
  cerrarPanel(): void {
    this.cerrar.emit();
  }

  /**
   * Agregar componente desde la paleta
   */
  public agregarComponente(tipo: string): void {
    if (!this.screen) return;
    // Crear un nuevo componente básico según el tipo
    const allowedTypes = [
      'TextField', 'Button', 'ElevatedButton', 'TextButton', 'Icon', 'Container', 'AppBar', 'ListView'
    ] as const;
    const safeType = allowedTypes.includes(tipo as any) ? tipo as FlutterComponent['type'] : 'Container';
    const nuevo: FlutterComponent = {
      id: Date.now().toString(),
      type: safeType,
      label: safeType.toLowerCase(),
      position: this.screen.components.length + 1,
      size: 'medium',
      variant: safeType === 'ElevatedButton' ? 'elevated' : safeType === 'TextButton' ? 'text' : undefined,
      placeholder: safeType === 'TextField' ? `Ingrese ${safeType.toLowerCase()}` : undefined
    };
    this.screen.components.push(nuevo);
    this.selectedComponentIndex = this.screen.components.length - 1;
    this.selectedComponent = nuevo;
  }

  /**
   * Selecciona un componente para editarlo
   */
  onSelectComponent(index: number): void {
    if (!this.screen) return;
    this.selectedComponentIndex = index;
    this.selectedComponent = this.screen.components[index];
  }

  /**
   * Inicia el arrastre desde la paleta de componentes
   */
  onPaletaDragStart(event: DragEvent, type: string): void {
    this.paletaDraggedType = type as FlutterComponent['type'];
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'copy';
      event.dataTransfer.setData('text/plain', type);
    }
  }

  /**
   * Permite soltar componentes en el área de preview
   */
  onPreviewDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'copy';
    }
  }

  /**
   * Maneja el drop de un componente desde la paleta
   */
  onPreviewDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    if (!this.paletaDraggedType || !this.screen) return;
    this.agregarComponente(this.paletaDraggedType);
    this.paletaDraggedType = null;
    this.guardarEstado();
  }

  /**
   * Elimina el componente seleccionado
   */
  eliminarComponente(): void {
    if (!this.screen || this.selectedComponentIndex === null) return;
    this.screen.components.splice(this.selectedComponentIndex, 1);
    this.selectedComponent = null;
    this.selectedComponentIndex = null;
    this.guardarEstado();
  }

  /**
   * Duplica el componente seleccionado
   */
  duplicarComponente(): void {
    if (!this.screen || this.selectedComponentIndex === null || !this.selectedComponent) return;
    
    // Crear una copia profunda del componente seleccionado
    const componenteCopia: FlutterComponent = JSON.parse(JSON.stringify(this.selectedComponent));
    
    // Asignar un nuevo ID único
    componenteCopia.id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    
    // Actualizar el label para indicar que es una copia
    if (!componenteCopia.label.includes('(copia)')) {
      componenteCopia.label = componenteCopia.label + ' (copia)';
    }
    
    // Insertar después del componente actual
    const indexNuevo = this.selectedComponentIndex + 1;
    this.screen.components.splice(indexNuevo, 0, componenteCopia);
    
    // Actualizar posiciones
    this.screen.components.forEach((comp, idx) => {
      comp.position = idx + 1;
    });
    
    // Seleccionar el nuevo componente duplicado
    this.selectedComponentIndex = indexNuevo;
    this.selectedComponent = componenteCopia;
    
    console.log('📋 Componente duplicado:', componenteCopia.label);
    this.guardarEstado();
  }
}
