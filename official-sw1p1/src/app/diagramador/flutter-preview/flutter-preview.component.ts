// ...existing code...
// ...existing code...
import { Component, Input, OnInit, Output, EventEmitter, ViewChild, ElementRef, OnChanges, SimpleChanges, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
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
export class FlutterPreviewComponent implements OnInit, OnChanges {
  public historialEstados: FlutterScreen[] = [];
  public indiceHistorial: number = -1;
  public paletaDraggedType: FlutterComponent['type'] | null = null;
  public selectedComponentIndex: number | null = null;
  public selectedComponent: FlutterComponent | null = null;
  @Input() screen: FlutterScreen | null = null;
  @Input() atributos: any[] = [];
  @Input() metodos: any[] = [];
  @Output() cerrar = new EventEmitter<void>();
  @Output() cambiosGuardados = new EventEmitter<FlutterScreen>();
  @ViewChild('inputFile') inputFile!: ElementRef<HTMLInputElement>;
  public modoEdicion: boolean = false;
  public draggedIndex: number | null = null;
  public dragOverIndex: number | null = null;
  public mostrarCodigoDart: boolean = false;
  public codigoDartGenerado: string = '';
  public cargandoMockup: boolean = false;
  public imagenPreview: string | null = null;
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
    
    // 🔄 Emitir cambios guardados para que se sincronicen al cache
    this.cambiosGuardados.emit(this.screen);
    console.log('📤 Cambios emitidos:', this.screen?.className);
    
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
   * Método de ciclo de vida para detectar cambios en inputs
   */
  ngOnChanges(changes: SimpleChanges): void {
    // Si el screen cambió, regenerar código si está visible
    if (changes['screen'] && !changes['screen'].firstChange && this.mostrarCodigoDart) {
      console.log('🔄 Screen detectó cambios, regenerando código Dart...');
      this.generarCodigoDart();
    }
  }

  /**
   * Genera el código Dart basado en los componentes visuales (orden del screen)
   */
  private generarCodigoDart(): void {
    if (!this.screen) return;

    const className = this.screen.className || 'MiPantalla';
    const components = this.screen.components || [];
    const metodos = this.metodos || [];

    console.log(`📝 Generando código Dart para ${className}`);
    console.log(`   - Componentes visuales: ${components.length}`);
    console.log(`   - Métodos: ${metodos.length}`);
    console.log(`   - Orden de componentes: ${components.map(c => c.label).join(' → ')}`);

    // Generar imports
    let codigo = `import 'package:flutter/material.dart';\n\n`;

    // Generar clase principal como StatelessWidget
    codigo += `class ${className}Screen extends StatelessWidget {\n`;
    codigo += `  const ${className}Screen({Key? key}) : super(key: key);\n\n`;

    // Propiedades basadas en atributos UML (no en orden visual)
    if (this.atributos.length > 0) {
      codigo += `  // Properties\n`;
      this.atributos.forEach(attr => {
        const tipo = this.mapearTipoDart(attr.tipo);
        codigo += `  final ${tipo} ${attr.titulo};\n`;
      });
      codigo += `\n`;
    }

    // TextEditingControllers solo para componentes String del preview visual
    const stringComponents = components.filter(c => c.type === 'TextField');
    if (stringComponents.length > 0) {
      codigo += `  // Controllers for input\n`;
      stringComponents.forEach(comp => {
        codigo += `  final TextEditingController ${comp.label}Controller = TextEditingController();\n`;
      });
      codigo += `\n`;
    }

    codigo += `  @override\n`;
    codigo += `  Widget build(BuildContext context) {\n`;
    codigo += `    return Scaffold(\n`;
    codigo += `      appBar: AppBar(\n`;
    codigo += `        title: const Text('${className}'),\n`;
    codigo += `        backgroundColor: const Color(0xFF2196F3),\n`;
    codigo += `      ),\n`;
    codigo += `      body: SingleChildScrollView(\n`;
    codigo += `        padding: const EdgeInsets.all(16.0),\n`;
    codigo += `        child: Column(\n`;
    codigo += `          crossAxisAlignment: CrossAxisAlignment.stretch,\n`;
    codigo += `          children: [\n`;

    // 🔥 Generar widgets en el ORDEN VISUAL de los componentes
    components.forEach((component, idx) => {
      if (component.type === 'TextField') {
        codigo += `            TextField(\n`;
        codigo += `              controller: ${component.label}Controller,\n`;
        codigo += `              decoration: InputDecoration(\n`;
        codigo += `                labelText: '${component.label}',\n`;
        codigo += `                hintText: '${component.placeholder || 'Ingrese ' + component.label}',\n`;
        codigo += `                border: OutlineInputBorder(\n`;
        codigo += `                  borderRadius: BorderRadius.circular(8),\n`;
        codigo += `                ),\n`;
        codigo += `              ),\n`;
        codigo += `            ),\n`;
        codigo += `            const SizedBox(height: 16),\n`;
      } else if (component.type.includes('Button')) {
        const buttonLabel = this.camelCaseASnakeCase(component.label);
        codigo += `            ElevatedButton.icon(\n`;
        codigo += `              onPressed: () => ${component.label}(),\n`;
        codigo += `              icon: const Icon(Icons.play_arrow),\n`;
        codigo += `              label: Text('${buttonLabel}'),\n`;
        codigo += `            ),\n`;
        codigo += `            const SizedBox(height: 16),\n`;
      }
    });

    // Cerrar Column
    codigo += `          ],\n`;
    codigo += `        ),\n`;
    codigo += `      ),\n`;
    codigo += `    );\n`;
    codigo += `  }\n\n`;

    // Generar métodos basados en UML
    if (metodos.length > 0) {
      codigo += `  // Methods\n`;
      metodos.forEach((metodo, index) => {
        const tipoRetorno = this.mapearTipoDart(metodo.tipoRetorno || 'void');
        const parametros = (metodo.parametros || []).map((p: any) => 
          `${this.mapearTipoDart(p.tipo)} ${p.nombre}`
        ).join(', ');
        
        codigo += `  ${tipoRetorno} ${metodo.nombre}(${parametros}) {\n`;
        codigo += `    // TODO: Implementar ${metodo.nombre}\n`;
        codigo += `    print('${metodo.nombre} ejecutado');\n`;
        if (tipoRetorno !== 'void') {
          codigo += `    return null;\n`;
        }
        codigo += `  }\n`;
        if (index < metodos.length - 1) codigo += `\n`;
      });
    }

    codigo += `}\n`;

    this.codigoDartGenerado = codigo;
    console.log('✅ Código Dart generado (completo) usando orden visual para:', className);
  }

  /**
   * Mapea tipos UML a tipos Dart
   */
  private mapearTipoDart(tipo: string): string {
    const mapa: { [key: string]: string } = {
      'String': 'String',
      'Integer': 'int',
      'Long': 'int',
      'Float': 'double',
      'Double': 'double',
      'Boolean': 'bool',
      'Date': 'DateTime',
      'void': 'void',
      'Object': 'dynamic',
      'List': 'List',
      'Array': 'List'
    };
    return mapa[tipo] || 'dynamic';
  }

  /**
   * Convierte camelCase a SNAKE_CASE
   */
  private camelCaseASnakeCase(texto: string): string {
    return texto.replace(/([a-z])([A-Z])/g, '$1_$2').toUpperCase();
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
   * Abre el selector de archivos para subir una imagen de mockup
   */
  abrirSelectorImagen(): void {
    this.inputFile.nativeElement.click();
  }

  /**
   * Maneja cuando el usuario selecciona una imagen
   */
  onImagenSeleccionada(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = input.files;

    if (!files || files.length === 0) {
      return;
    }

    const archivo = files[0];

    // Validar tamaño (máximo 5MB)
    if (archivo.size > 5 * 1024 * 1024) {
      alert('La imagen es demasiado grande (máximo 5MB)');
      return;
    }

    // Validar tipo
    if (!archivo.type.startsWith('image/')) {
      alert('Por favor selecciona un archivo de imagen válido');
      return;
    }

    // Mostrar preview
    const reader = new FileReader();
    reader.onload = (e) => {
      this.imagenPreview = e.target?.result as string;
      console.log('📸 Imagen cargada, preview mostrado');
      // Automáticamente procesar la imagen
      this.interpretarMockup(archivo);
    };
    reader.readAsDataURL(archivo);
  }

  /**
   * Envía la imagen al backend para que IA la interprete
   */
  private interpretarMockup(archivo: File): void {
    this.cargandoMockup = true;
    console.log('🤖 Iniciando interpretación de mockup con IA...');

    const formData = new FormData();
    formData.append('imagen', archivo);
    if (this.screen?.className) {
      formData.append('className', this.screen.className);
    }

    const apiUrl = this.configService.getConfig().apiUrl;
    this.http.post<any>(`${apiUrl}/flutter/interpretar-mockup`, formData)
      .subscribe({
        next: (response) => {
          if (response.ok && response.screens && response.screens.length > 0) {
            console.log('✅ Mockup interpretado exitosamente:', response.screens);
            // Actualizar el screen con los componentes interpretados
            this.actualizarScreenDesdeIA(response.screens[0]);
            alert('✅ Mockup interpretado correctamente!');
          } else {
            console.warn('⚠️ Respuesta inesperada:', response);
            alert('No se pudo interpretar el mockup. Intenta con un dibujo más claro.');
          }
          this.cargandoMockup = false;
          this.imagenPreview = null;
        },
        error: (error) => {
          console.error('❌ Error al interpretar mockup:', error);
          this.cargandoMockup = false;
          alert('Error al procesar la imagen. Verifica tu conexión e intenta nuevamente.');
        }
      });
  }

  /**
   * Actualiza el screen actual con los componentes interpretados de la IA
   */
  private actualizarScreenDesdeIA(screenInterpretado: FlutterScreen): void {
    if (!this.screen) return;

    // Si el screen interpretado tiene un className diferente, actualizar el actual
    if (screenInterpretado.className && screenInterpretado.className !== this.screen.className) {
      console.log('📝 Actualizando className:', screenInterpretado.className);
      this.screen.className = screenInterpretado.className;
    }

    // Reemplazar componentes con los interpretados
    if (screenInterpretado.components && screenInterpretado.components.length > 0) {
      console.log('🔄 Reemplazando componentes:', screenInterpretado.components.length);
      this.screen.components = screenInterpretado.components;
      
      // Regenerar código Dart si está visible
      if (this.mostrarCodigoDart) {
        this.generarCodigoDart();
      }

      // Guardar estado en historial
      this.guardarEstado();
    }
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
    
    // 🔥 IMPORTANTE: Crear una nueva referencia del screen para que Angular detecte el cambio
    this.screen = {
      ...this.screen,
      components: components
    };
    
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
    console.log('📋 Nuevo orden:', this.screen.components.map(c => c.label).join(' → '));
    
    // Limpiar estado
    this.draggedIndex = null;
    this.dragOverIndex = null;
    this.guardarEstado();
    
    // 🔄 Forzar regeneración de código Dart si está visible
    if (this.mostrarCodigoDart) {
      console.log('🔄 Regenerando código Dart inmediatamente...');
      this.generarCodigoDart();
    }
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
    
    const nuevosComponentes = this.screen.components.filter((_, idx) => idx !== this.selectedComponentIndex);
    
    // 🔥 Crear nueva referencia del screen
    this.screen = {
      ...this.screen,
      components: nuevosComponentes
    };
    
    this.selectedComponent = null;
    this.selectedComponentIndex = null;
    console.log('🗑️ Componente eliminado');
    
    this.guardarEstado();
    
    // 🔄 Regenerar código Dart si está visible
    if (this.mostrarCodigoDart) {
      this.generarCodigoDart();
    }
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
    const nuevosComponentes = [...this.screen.components];
    nuevosComponentes.splice(indexNuevo, 0, componenteCopia);
    
    // Actualizar posiciones
    nuevosComponentes.forEach((comp, idx) => {
      comp.position = idx + 1;
    });
    
    // 🔥 Crear nueva referencia del screen
    this.screen = {
      ...this.screen,
      components: nuevosComponentes
    };
    
    // Seleccionar el nuevo componente duplicado
    this.selectedComponentIndex = indexNuevo;
    this.selectedComponent = componenteCopia;
    
    console.log('📋 Componente duplicado:', componenteCopia.label);
    
    this.guardarEstado();
    
    // 🔄 Regenerar código Dart si está visible
    if (this.mostrarCodigoDart) {
      this.generarCodigoDart();
    }
  }
}
