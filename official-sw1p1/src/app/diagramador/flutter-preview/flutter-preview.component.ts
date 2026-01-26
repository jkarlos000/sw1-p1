import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FlutterScreen, FlutterComponent } from '../../common/interfaces/flutter-screen.interface';
import { ConfigService } from '../../common/services/config.service';

@Component({
  selector: 'app-flutter-preview',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './flutter-preview.component.html',
  styleUrls: ['./flutter-preview.component.css']
})
export class FlutterPreviewComponent implements OnInit {
  @Input() screen: FlutterScreen | null = null;
  @Output() cerrar = new EventEmitter<void>();

  // 🎨 Modo de edición
  public modoEdicion: boolean = false;

  // 👋 Drag & Drop
  private draggedIndex: number | null = null;
  public dragOverIndex: number | null = null;

  // Paleta de componentes disponibles
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
   * Agregar componente desde la paleta (placeholder para futura implementación)
   */
  agregarComponente(tipo: string): void {
    console.log('➕ Agregar componente:', tipo);
    // TODO: Implementar drag & drop o click para agregar
    alert(`Funcionalidad de agregar ${tipo} en desarrollo (Sprint 3)`);
  }
}
