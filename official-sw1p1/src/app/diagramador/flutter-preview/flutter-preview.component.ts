import { Component, Input, OnInit } from '@angular/core';
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

  constructor(
    private http: HttpClient,
    private configService: ConfigService
  ) {}

  ngOnInit(): void {
    console.log('📱 Flutter Preview Component iniciado');
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
}
