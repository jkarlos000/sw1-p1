import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import {
  AfterViewInit,
  Component,
  ElementRef,
  inject,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { NgxQrcodeStylingService, Options } from 'ngx-qrcode-styling';
import { Subscription } from 'rxjs';
import { sampleGraphs } from '../../config/sample-graphs copy';
import { AuthService } from '../auth/auth.service';
import { ChatIaComponent } from './chat-ia/chat-ia.component';
import { ChatIaService } from './services/chat-ia.service';
import { ThemePicker } from './components/theme-picker';
import { DiagramadorService } from './diagramador.service';
import { HaloService } from './services/halo.service';
import { InspectorService } from './services/inspector.service';
import { KeyboardService } from './services/keyboard.service';
import RappidService from './services/kitchensink.service';
import { StencilService } from './services/stencil.service';
import { ToolbarService } from './services/toolbar.service';

@Component({
  selector: 'app-diagramador',
  standalone: true,
  imports: [FormsModule, CommonModule, ReactiveFormsModule, RouterModule, ChatIaComponent],
  templateUrl: './diagramador.component.html',
  styleUrl: './diagramador.component.css',
})
export default class DiagramadorComponent
  implements OnInit, OnDestroy, AfterViewInit
{
  @ViewChild('qrCodeHTML', { static: false }) qrCodeHTML!: ElementRef;
  public config: Options;
  public viewModalQR: boolean;
  public qrcode = inject(NgxQrcodeStylingService);
  public diagramadorService = inject(DiagramadorService);
  public route = inject(Router);
  public userAuth = inject(AuthService);
  public chatIaService = inject(ChatIaService);
  onListenRespUnirseReunion!: Subscription;
  onListenModificacionesDiagrama!: Subscription;
  private rappid: RappidService;

  public http = inject(HttpClient);
  
  // READ : LINK DE LA PAGINA ACTUAL
  public currentUrl: string = '';
  public viewModalShare: boolean = false;

  // Propiedades para el chat con IA
  public salaDiagrama: any = null;
  public idSala: number = 0;
  public nombreSala: string = '';

  // Contador para posicionamiento de clases en grid
  private contadorClasesAgregadas = 0;

  constructor(private element: ElementRef) {}

  ngOnInit() {
    this.rappid = new RappidService(
      this.element.nativeElement,
      new StencilService(),
      new ToolbarService(),
      new InspectorService(),
      new HaloService(),
      new KeyboardService(),
      this.http
    );
    
    // Asignar callback para limpiar diagrama y sincronizar
    this.rappid.onClearDiagram = () => this.limpiarDiagrama();
    
    this.rappid.startRappid();
    const themePicker = new ThemePicker({ mainView: this.rappid });
    document.body.appendChild(themePicker.render().el);
    // LOGIC : VERIFICAR SI HAY CONTENIDO PREVIO EN EL DIAGRAMA

    this.currentUrl = this.route.url;
    this.currentUrl = window.location.href;
    
    const salaDiagrama = this.userAuth.getSalaDiagrama();
    if (!salaDiagrama) {
      console.error('No hay información de sala disponible');
      this.route.navigate(['/']);
      return;
    }

    // Guardar información de la sala para el chat
    this.salaDiagrama = salaDiagrama;
    this.nombreSala = salaDiagrama.nombre;
    
    // Unirse a la sala via WebSocket
    this.diagramadorService.emitEntraSala();
    
    // Obtener el id_sala desde la BD
    this.obtenerIdSala(salaDiagrama.nombre);
    
    this.diagramadorService
      .contenidoVerifDiagramaBD(salaDiagrama.nombre)
      .subscribe({
        next: (respuesta: any) => {
          try {
            // Verificar si hay diagrama válido
            if (!respuesta.diagrama || respuesta.diagrama === '' || respuesta.diagrama === 'NO TIENE INFORMACION') {
              // Cargar diagrama por defecto
              this.rappid.graph.fromJSON(
                JSON.parse(sampleGraphs.emergencyProcedure)
              );
            } else {
              // Intentar parsear el diagrama guardado
              const diagramaData = typeof respuesta.diagrama === 'string'
                ? JSON.parse(respuesta.diagrama)
                : respuesta.diagrama;
              this.rappid.graph.fromJSON(diagramaData);
            }
          } catch (error) {
            console.error('Error al procesar el diagrama:', error);
            // En caso de error, cargar diagrama por defecto
            this.rappid.graph.fromJSON(
              JSON.parse(sampleGraphs.emergencyProcedure)
            );
          }
        },
        error: (error) => {
          console.error('Error en la suscripción:', error);
        },
        complete: () => {
          console.log('Suscripción completada');
        },
      });

    // READ : EVENTOS DE ESCUCHA PARA CAMBIOS EN EL DIAGRAMA
    this.onListenRespUnirseReunion = this.diagramadorService
      .onListenChangedDiagrama()
      .subscribe((data: any) => {
        if (data && data.diagrama) {
          try {
            const diagramaData = typeof data.diagrama === 'string' 
              ? JSON.parse(data.diagrama) 
              : data.diagrama;
            this.rappid.graph.fromJSON(diagramaData);
          } catch (error) {
            console.error('Error al parsear diagrama recibido:', error);
          }
        }
      });

    // ESCUCHAR MODIFICACIONES DE DIAGRAMA POR IA
    this.onListenModificacionesDiagrama = this.chatIaService.modificacionDiagrama$.subscribe((modificaciones: any) => {
      if (modificaciones) {
        this.aplicarModificacionesDiagrama(modificaciones);
      }
    });

    // READ : EVENTOS PARA NOTIFICAR CAMBIOS A LOS DEMAS INTERGRANTES
    // READ : INICIO

    // Evento para cuando se suelta el clic en un elemento
    this.rappid.paper.on(
      'element:pointerup',
      (elementView: joint.dia.ElementView) => {
        this.diagramadorService.emitChangedDiagrama(JSON.stringify(this.rappid.graph.toJSON()));
      }
    );

    // Evento para cuando se suelta el clic en un conector
    this.rappid.paper.on('link:pointerup', (linkView: joint.dia.LinkView) => {
      console.log('Conector clicado y soltado:', linkView.model);
      this.diagramadorService.emitChangedDiagrama(JSON.stringify(this.rappid.graph.toJSON()));
    });

    // Evento para cuando se suelta el clic en un conector
    this.rappid.graph.on('link:pointerup', (linkView: joint.dia.LinkView) => {
      console.log('Conector clicado y soltado:', linkView.model);
      this.diagramadorService.emitChangedDiagrama(JSON.stringify(this.rappid.graph.toJSON()));
    });

    // Evento para cambio de tamaño de elementos
    this.rappid.graph.on('change:size', (cell: joint.dia.Cell) => {
      console.log('Tamaño cambiado:', cell);
      this.diagramadorService.emitChangedDiagrama(JSON.stringify(this.rappid.graph.toJSON()));
    });

    // Evento para cambio de atributos de elementos y conectores
    this.rappid.graph.on('change:attrs', (cell: joint.dia.Cell) => {
      const attrs = cell.get('attrs');
      if (attrs) {
        console.log('Atributos cambiados:', attrs);
        this.diagramadorService.emitChangedDiagrama(JSON.stringify(this.rappid.graph.toJSON()));
      }
    });

    // Evento para adición de elementos y conectores
    this.rappid.graph.on('add', (cell: joint.dia.Cell) => {
      console.log('Elemento o conector añadido:', cell);
      this.diagramadorService.emitChangedDiagrama(JSON.stringify(this.rappid.graph.toJSON()));
    });

    // Evento para eliminación de elementos y conectores
    this.rappid.graph.on('remove', (cell: joint.dia.Cell) => {
      console.log('Elemento o conector eliminado:', cell);
      // Si el elemento se elimina del gráfico, también se elimina de la selección.
      if (this.rappid.selection.collection.has(cell)) {
        this.rappid.selection.collection.reset(
          this.rappid.selection.collection.models.filter((c) => c !== cell)
        );
        this.diagramadorService.emitChangedDiagrama(JSON.stringify(this.rappid.graph.toJSON()));
      }
    });

    this.rappid.selection.on(
      'selection-box:pointerdown',
      (elementView: joint.dia.ElementView, evt: joint.dia.Event) => {
        // Unselect an element if the CTRL/Meta key is pressed while a selected element is clicked.
        if (this.rappid.keyboardService.keyboard.isActive('ctrl meta', evt)) {
          this.rappid.selection.collection.remove(elementView.model);
          this.diagramadorService.emitChangedDiagrama(
            JSON.stringify(this.rappid.graph.toJSON())
          );
        }
      },
      this
    );

    // READ : FIN
  }

  ngAfterViewInit(): void {
    const salaDiagrama = this.userAuth.getSalaDiagrama();
    const nombreSala = salaDiagrama ? salaDiagrama.nombre : 'Sala de Diagramas';
    this.config = {
      width: 250,
      height: 250,
      data: nombreSala ? nombreSala : 'Sala de Diagramas',
      margin: 5,
      dotsOptions: {
        color: '#1977f3',
        type: 'dots',
      },
      backgroundOptions: {
        color: '#ffffff',
      },
      imageOptions: {
        crossOrigin: 'anonymous',
        margin: 0,
      },
    };
    this.qrcode
      .create(this.config, this.qrCodeHTML.nativeElement)
      .subscribe((res) => {});
    // READ : CERRAR EL MODAL DE COMPARTIR DESPUES DE 5 SEGUNDOS
    setInterval(() => {
      this.viewModalShare = true;
    }, 5000);
  }

  ngOnDestroy(): void {
    if (this.onListenRespUnirseReunion) {
      this.onListenRespUnirseReunion.unsubscribe();
    }
    if (this.onListenModificacionesDiagrama) {
      this.onListenModificacionesDiagrama.unsubscribe();
    }
  }

  onDownloadQR(): void {
    this.qrcode
      .download(this.qrCodeHTML.nativeElement, 'qr-sala.png')
      .subscribe((res: any) => {
        console.log('download:', res);
      });
  }

  onChangedValueViewQR(): void {
    this.rappid.viewModalQR = !this.rappid.viewModalQR;
  }

  getViewQr(): boolean {
    return this.rappid.viewModalQR;
  }

  copyToClipboard(): void {
    navigator.clipboard
      .writeText(this.currentUrl)
      .then(() => {
        console.log('URL copiada al portapapeles');
      })
      .catch((err: any) => {
        console.error('Error al copiar:', err);
      });
  }

  closeShareModal(): void {
    this.viewModalShare = true;
  }

  // ========== MÉTODOS PARA EL CHAT CON IA ==========

  /**
   * Obtiene el ID de la sala desde el backend
   */
  async obtenerIdSala(nombreSala: string): Promise<void> {
    try {
      const respuesta: any = await this.diagramadorService
        .contenidoVerifDiagramaBD(nombreSala)
        .toPromise();
      
      if (respuesta && respuesta.id_sala) {
        this.idSala = respuesta.id_sala;
      } else {
        console.warn('No se pudo obtener el id_sala, usando valor por defecto');
        this.idSala = 0;
      }
    } catch (error) {
      console.error('Error al obtener id_sala:', error);
      this.idSala = 0;
    }
  }

  /**
   * Obtiene el diagrama actual en formato JSON
   */
  getDiagramaActual(): any {
    if (this.rappid && this.rappid.graph) {
      return this.rappid.graph.toJSON();
    }
    return null;
  }

  /**
   * Sincroniza diagrama limpio con otros usuarios (llamado después de clear)
   */
  limpiarDiagrama(): void {
    if (this.rappid && this.rappid.graph) {
      console.log('🗑️ Sincronizando diagrama limpio...');
      
      // Emitir cambio para sincronizar con otros usuarios (el graph ya fue limpiado)
      this.diagramadorService.emitChangedDiagrama(JSON.stringify(this.rappid.graph.toJSON()));
      console.log('✅ Diagrama limpiado y sincronizado');
    }
  }

  /**
   * Genera un UUID v4 para identificadores únicos
   */
  private generarUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  /**
   * Calcula posición en grid para evitar superposición de clases
   * Distribuye las clases en filas de 3 columnas con espaciado adecuado
   */
  private calcularPosicionGrid(): { x: number, y: number } {
    const ANCHO_CLASE = 220; // Ancho de la clase + margen
    const ALTO_CLASE = 200;  // Alto promedio de la clase + margen
    const MARGEN_IZQUIERDO = 100;
    const MARGEN_SUPERIOR = 100;
    const COLUMNAS_POR_FILA = 3;

    const fila = Math.floor(this.contadorClasesAgregadas / COLUMNAS_POR_FILA);
    const columna = this.contadorClasesAgregadas % COLUMNAS_POR_FILA;

    const x = MARGEN_IZQUIERDO + (columna * ANCHO_CLASE);
    const y = MARGEN_SUPERIOR + (fila * ALTO_CLASE);

    this.contadorClasesAgregadas++;

    return { x, y };
  }

  /**
   * Aplica modificaciones estructuradas del diagrama por IA
   */
  aplicarModificacionesDiagrama(modificaciones: any): void {
    if (!this.rappid || !this.rappid.graph || !modificaciones.acciones) {
      console.error('No se puede aplicar modificaciones: Faltan datos');
      return;
    }

    console.log('📝 Aplicando', modificaciones.acciones.length, 'acciones...');

    // Resetear contador al inicio de un batch de modificaciones
    this.contadorClasesAgregadas = 0;

    modificaciones.acciones.forEach((accion: any, index: number) => {
      try {
        console.log(`Acción ${index + 1}:`, accion);

        switch (accion.tipo) {
          case 'limpiar':
            this.rappid.graph.clear();

            if (accion.elemento === 'clase') {
              this.eliminarClasePorNombre(accion.nombre);
            } else if (accion.elemento === 'relacion') {
              this.eliminarRelacionPorNombres(accion.origen, accion.destino);
            }
            break;

          case 'agregar':
            if (accion.elemento === 'clase') {
              this.agregarClase(accion.nombre, accion.atributos || []);
            } else if (accion.elemento === 'relacion') {
              this.agregarRelacion(accion.origen, accion.destino, accion.cardinalidad || '1...*');
            }
            break;

          default:
            console.warn('Tipo de acción desconocido:', accion.tipo);
        }
      } catch (error) {
        console.error(`Error en acción ${index + 1}:`, error);
      }
    });

    // Notificar cambios a otros usuarios
    this.diagramadorService.emitChangedDiagrama(JSON.stringify(this.rappid.graph.toJSON()));
    console.log('✅ Todas las modificaciones aplicadas');
  }

  private eliminarClasePorNombre(nombre: string): void {
    const elementos = this.rappid.graph.getElements();
    const elemento = elementos.find((el: any) => {
      const nombreClase = el.attr('headerText/text') || el.attr('label/text') || el.prop('name');
      return nombreClase === nombre;
    });

    if (elemento) {
      elemento.remove();
      console.log(`✅ Clase "${nombre}" eliminada`);
    } else {
      console.warn(`⚠️ Clase "${nombre}" no encontrada`);
    }
  }

  private eliminarRelacionPorNombres(origen: string, destino: string): void {
    const elementos = this.rappid.graph.getElements();
    const links = this.rappid.graph.getLinks();
    
    const elementoOrigen = elementos.find((el: any) => {
      const nombreClase = el.attr('headerText/text') || el.attr('label/text') || el.prop('name');
      return nombreClase === origen;
    });
    
    const elementoDestino = elementos.find((el: any) => {
      const nombreClase = el.attr('headerText/text') || el.attr('label/text') || el.prop('name');
      return nombreClase === destino;
    });

    if (!elementoOrigen || !elementoDestino) {
      console.warn(`⚠️ No se encontraron las clases ${origen} o ${destino}`);
      return;
    }

    const link = links.find((l: any) => 
      l.getSourceElement()?.id === elementoOrigen.id && 
      l.getTargetElement()?.id === elementoDestino.id
    );

    if (link) {
      link.remove();
      console.log(`✅ Relación ${origen} → ${destino} eliminada`);
    } else {
      console.warn(`⚠️ Relación ${origen} → ${destino} no encontrada`);
    }
  }

  private agregarClase(nombre: string, atributos: string[]): void {
    console.log(`🎨 Agregando clase "${nombre}" con ${atributos.length} atributos`);
    
    try {
      // Calcular posición en grid para evitar superposición
      const posicion = this.calcularPosicionGrid();
      console.log(`📍 Posición calculada para "${nombre}": (${posicion.x}, ${posicion.y})`);
      
      // Crear una nueva clase usando el formato de objeto plano
      const nuevaClase = {
        id: this.generarUUID(),
        type: 'standard.HeaderedRectangle',
        position: posicion,
        size: { width: 200, height: Math.max(150, 100 + atributos.length * 15) },
        attrs: {
          root: {
            dataTooltip: 'Clase',
            dataTooltipPosition: 'left',
            dataTooltipPositionSelector: '.joint-stencil'
          },
          body: {
            fill: 'transparent',
            stroke: '#31d0c6',
            strokeWidth: 2,
            strokeDasharray: '0'
          },
          header: {
            stroke: '#31d0c6',
            fill: '#31d0c6',
            strokeWidth: 2,
            strokeDasharray: '0',
            height: 30
          },
          headerText: {
            text: nombre,
            fill: '#000000',
            fontFamily: 'Averia Libre',
            fontWeight: 'Bold',
            fontSize: 14,
            strokeWidth: 0,
            y: 15
          },
          bodyText: {
            textWrap: {
              text: atributos.join('\n'),
              width: -10,
              height: -40,
              ellipsis: true
            },
            fill: '#FFFFFF',
            fontFamily: 'Averia Libre',
            fontWeight: 'Bold',
            fontSize: 11,
            strokeWidth: 0,
            y: 'calc(h/2 + 15)'
          }
        }
      };

      this.rappid.graph.addCell(nuevaClase);
      console.log(`✅ Clase "${nombre}" agregada exitosamente en grid`);
    } catch (error) {
      console.error(`❌ Error al agregar clase "${nombre}":`, error);
    }
  }

  private agregarRelacion(origen: string, destino: string, cardinalidad: string): void {
    console.log(`🔗 Agregando relación ${origen} → ${destino} (${cardinalidad})`);
    
    try {
      const elementos = this.rappid.graph.getElements();
      
      const elementoOrigen = elementos.find((el: any) => {
        const nombreClase = el.attr('headerText/text') || el.attr('label/text') || el.prop('name');
        return nombreClase === origen;
      });
      
      const elementoDestino = elementos.find((el: any) => {
        const nombreClase = el.attr('headerText/text') || el.attr('label/text') || el.prop('name');
        return nombreClase === destino;
      });

      if (!elementoOrigen || !elementoDestino) {
        console.warn(`⚠️ No se encontraron las clases ${origen} o ${destino} para crear la relación`);
        return;
      }

      // Crear relación usando formato de objeto plano
      const nuevaRelacion = {
        id: this.generarUUID(),
        type: 'app.Link',
        router: {
          name: 'normal'
        },
        connector: {
          name: 'rounded'
        },
        labels: [{
          attrs: {
            text: {
              text: cardinalidad,
              fill: '#000000'
            }
          }
        }],
        source: {
          id: elementoOrigen.id
        },
        target: {
          id: elementoDestino.id
        },
        attrs: {}
      };

      this.rappid.graph.addCell(nuevaRelacion);
      console.log(`✅ Relación ${origen} → ${destino} agregada exitosamente`);
    } catch (error) {
      console.error(`❌ Error al agregar relación ${origen} → ${destino}:`, error);
    }
  }
}
