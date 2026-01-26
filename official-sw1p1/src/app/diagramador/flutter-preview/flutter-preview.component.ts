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
  public paletaDraggedType: FlutterComponent['type'] | null = null;
  public selectedComponentIndex: number | null = null;
  public selectedComponent: FlutterComponent | null = null;
  @Input() screen: FlutterScreen | null = null;
  @Output() cerrar = new EventEmitter<void>();
  public modoEdicion: boolean = false;
  public draggedIndex: number | null = null;
  public dragOverIndex: number | null = null;
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
  }

  /**
   * Cambia entre modo vista y modo edición
   */
  toggleModoEdicion(): void {
    this.modoEdicion = !this.modoEdicion;
    console.log('🎨 Modo edición:', this.modoEdicion ? 'ACTIVADO' : 'DESACTIVADO');
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
    }
  }

  /**
   * Maneja cuando se arrastra sobre otro componente
   */
  onDragOver(event: DragEvent, index: number): void {
    event.preventDefault();
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
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'copy';
    }
  }

  /**
   * Maneja el drop de un componente desde la paleta
   */
  onPreviewDrop(event: DragEvent): void {
    event.preventDefault();
    if (!this.paletaDraggedType || !this.screen) return;
    this.agregarComponente(this.paletaDraggedType);
    this.paletaDraggedType = null;
  }

  /**
   * Elimina el componente seleccionado
   */
  eliminarComponente(): void {
    if (!this.screen || this.selectedComponentIndex === null) return;
    this.screen.components.splice(this.selectedComponentIndex, 1);
    this.selectedComponent = null;
    this.selectedComponentIndex = null;
  }
}
