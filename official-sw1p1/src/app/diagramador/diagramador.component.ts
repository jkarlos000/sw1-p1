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
  ChangeDetectorRef,
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
import { ConfigService } from '../common/services/config.service';
import { ClaseUmlService } from '../common/services/clase-uml.service';
import { UmlClassEditorComponent } from './components/uml-class-editor.component';
import { FlutterPreviewComponent } from './flutter-preview/flutter-preview.component';
import { FlutterScreen } from '../common/interfaces/flutter-screen.interface';
import { FlutterGeneratorService } from './services/flutter-generator.service';

@Component({
  selector: 'app-diagramador',
  standalone: true,
  imports: [
    FormsModule, 
    CommonModule, 
    ReactiveFormsModule, 
    RouterModule, 
    ChatIaComponent, 
    UmlClassEditorComponent,
    FlutterPreviewComponent
  ],
  templateUrl: './diagramador.component.html',
  styleUrls: ['./diagramador.component.css', './components/uml-editor.css'],
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
  private configService = inject(ConfigService);
  private claseUmlService = inject(ClaseUmlService);
  private flutterGeneratorService = inject(FlutterGeneratorService);
  private cdr = inject(ChangeDetectorRef);
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

  // 🆕 Propiedades para el editor UML 2.5
  public claseSeleccionada: any = null;

  // 📱 Propiedad para Flutter Preview
  public flutterScreenActual: FlutterScreen | null = null;
  public mostrarFlutterPanel: boolean = false;

  constructor(private element: ElementRef) {}

  ngOnInit() {
    this.rappid = new RappidService(
      this.element.nativeElement,
      new StencilService(),
      new ToolbarService(),
      new InspectorService(),
      new HaloService(),
      new KeyboardService(),
      this.http,
      this.configService
    );
    
    // Asignar callbacks para sincronización con otros usuarios
    this.rappid.onClearDiagram = () => this.limpiarDiagrama();
    this.rappid.onImportDiagram = () => this.sincronizarDiagramaImportado();
    
    this.rappid.startRappid();
    
    // 🆕 Agregar listener para selección de clases
    this.rappid.paper.on('cell:pointerclick', (cellView: any) => {
      const cell = cellView.model;
      const tipo = cell.get('type');
      
      console.log('🖱️ CLICK en celda, tipo:', tipo);
      
      // Detectar clases UML (standard.HeaderedRectangle)
      if (tipo === 'standard.HeaderedRectangle') {
        console.log('✅ Es una clase UML, generando Flutter screen...');
        this.onCellSelected(cell);
        
        // 📱 Generar Flutter screen automáticamente
        this.generarFlutterScreenDesdeClase(cell);
        
        // Hacer scroll después de un pequeño delay para que el panel se renderice
        setTimeout(() => {
          console.log('🔄 Ejecutando detectChanges...');
          this.cdr.detectChanges();
          console.log('🎯 flutterScreenActual:', this.flutterScreenActual);
          
          // Hacer scroll hacia el panel Flutter
          setTimeout(() => {
            this.scrollToFlutterPanel();
          }, 350); // Esperar a que termine la animación
        }, 100);
        
        // Prevenir que se muestre el inspector tradicional
        event?.stopPropagation();
      } else {
        console.log('❌ No es una clase UML');
        this.claseSeleccionada = null;
        this.flutterScreenActual = null;
        this.cdr.detectChanges();
      }
    });
    
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

  sincronizarDiagramaImportado(): void {
    if (this.rappid && this.rappid.graph) {
      console.log('📥 Sincronizando diagrama importado desde XML...');
      
      // Emitir cambio para sincronizar con otros usuarios (el graph ya fue actualizado)
      this.diagramadorService.emitChangedDiagrama(JSON.stringify(this.rappid.graph.toJSON()));
      console.log('✅ Diagrama importado y sincronizado con todos los usuarios');
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
            console.log('🗑️ Diagrama limpiado completamente');
            break;

          case 'eliminar':
            if (accion.elemento === 'clase') {
              this.eliminarClasePorNombre(accion.nombre);
            } else if (accion.elemento === 'relacion') {
              this.eliminarRelacionPorNombres(accion.origen, accion.destino);
            }
            break;

          case 'agregar':
            if (accion.elemento === 'clase') {
              this.agregarClase(accion.nombre, accion.atributos || [], accion.metodos || [], accion.posicion);
            } else if (accion.elemento === 'relacion') {
              this.agregarRelacion(
                accion.origen, 
                accion.destino, 
                accion.tipoRelacion || 'asociacion',
                accion.cardinalidadOrigen || '1',
                accion.cardinalidadDestino || '1'
              );
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
    console.log(`🗑️ Buscando clase "${nombre}" para eliminar...`);
    const elementos = this.rappid.graph.getElements();
    console.log(`📊 Total de elementos en el grafo: ${elementos.length}`);
    
    // Listar todas las clases para debug
    elementos.forEach((el: any) => {
      const nombreClase = el.attr('headerText/text') || el.attr('label/text') || el.prop('name');
      console.log(`  - Elemento encontrado: "${nombreClase}" (type: ${el.get('type')})`);
    });
    
    const elemento = elementos.find((el: any) => {
      const nombreClase = el.attr('headerText/text') || el.attr('label/text') || el.prop('name');
      // Comparación case-insensitive y sin espacios extra
      return nombreClase?.trim().toLowerCase() === nombre?.trim().toLowerCase();
    });

    if (elemento) {
      elemento.remove();
      console.log(`✅ Clase "${nombre}" eliminada exitosamente`);
      
      // También eliminar sus relaciones (links conectados)
      const linksConectados = this.rappid.graph.getConnectedLinks(elemento);
      linksConectados.forEach((link: any) => {
        link.remove();
        console.log(`🔗 Relación conectada eliminada`);
      });
    } else {
      console.warn(`⚠️ Clase "${nombre}" no encontrada en el diagrama`);
      console.warn(`   Nombres disponibles: ${elementos.map((el: any) => 
        el.attr('headerText/text') || el.attr('label/text') || el.prop('name')
      ).join(', ')}`);
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

  private agregarClase(nombre: string, atributos: string[], metodos: string[] = [], posicionCustom?: {x: number, y: number}): void {
    console.log(`🎨 Agregando clase "${nombre}" con ${atributos.length} atributos y ${metodos.length} métodos`);
    
    try {
      // Usar posición personalizada o calcular en grid
      const posicion = posicionCustom || this.calcularPosicionGrid();
      console.log(`📍 Posición para "${nombre}": (${posicion.x}, ${posicion.y})`);
      
      // Combinar atributos y métodos con separador UML
      let textoBody = '';
      if (atributos.length > 0) {
        textoBody += atributos.join('\n');
      }
      if (metodos.length > 0) {
        if (atributos.length > 0) {
          textoBody += '\n───────────────────────\n';
        }
        textoBody += metodos.join('\n');
      }
      
      const alturaBase = 100;
      const alturaTotal = Math.max(150, alturaBase + (atributos.length + metodos.length) * 15);
      
      // Crear una nueva clase usando el formato de objeto plano
      const nuevaClase = {
        id: this.generarUUID(),
        type: 'standard.HeaderedRectangle',
        position: posicion,
        size: { width: 220, height: alturaTotal },
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
              text: textoBody,
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

  private agregarRelacion(
    origen: string, 
    destino: string, 
    tipoRelacion: string = 'asociacion',
    cardinalidadOrigen: string = '1',
    cardinalidadDestino: string = '1'
  ): void {
    console.log(`🔗 Agregando relación ${tipoRelacion}: ${origen} [${cardinalidadOrigen}] → [${cardinalidadDestino}] ${destino}`);
    
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

      // Determinar marcadores según el tipo de relación UML 2.5
      let sourceMarker: any = { d: 'M 0 0 0 0' }; // Sin marcador por defecto
      let targetMarker: any = { d: 'M 0 0 0 0' };
      let strokeDasharray = '0';
      let strokeColor = '#31d0c6';
      
      switch (tipoRelacion.toLowerCase()) {
        case 'asociacion':
          // Asociación con navegabilidad
          sourceMarker = { d: 'M 0 0 0 0' };
          targetMarker = { d: 'M 0 -10 15 0 0 10 z', fill: strokeColor };
          break;
          
        case 'composicion':
          // Composición (diamante negro en origen)
          sourceMarker = { d: 'M -10 0 0 10 10 0 0 -10 z', fill: strokeColor };
          targetMarker = { d: 'M 0 0 0 0' };
          break;
          
        case 'agregacion':
          // Agregación (diamante blanco en origen)
          sourceMarker = { d: 'M 0 -10 15 0 0 10 z', fill: 'transparent', stroke: strokeColor };
          targetMarker = { d: 'M 0 0 0 0' };
          break;
          
        case 'herencia':
        case 'generalizacion':
          // Herencia (triángulo en destino)
          sourceMarker = { d: 'M 0 0 0 0' };
          targetMarker = { d: 'M 0 -10 -15 0 0 10 z', fill: '#FFFFFF', stroke: strokeColor };
          break;
          
        case 'dependencia':
          // Dependencia (línea punteada con flecha)
          sourceMarker = { d: 'M 0 0 0 0' };
          targetMarker = { d: 'M 0 -10 15 0 0 10 z', fill: strokeColor };
          strokeDasharray = '5,5';
          break;
          
        default:
          console.warn(`Tipo de relación "${tipoRelacion}" no reconocido, usando asociación por defecto`);
      }

      // Crear relación usando standard.Link para compatibilidad con inspector
      const nuevaRelacion = {
        id: this.generarUUID(),
        type: 'standard.Link',
        router: {
          name: 'normal'
        },
        connector: {
          name: 'rounded'
        },
        labels: [
          {
            attrs: {
              text: {
                text: cardinalidadOrigen,
                fill: '#FFFFFF',
                fontSize: 14,
                fontWeight: 'bold'
              },
              rect: {
                fill: strokeColor,
                stroke: strokeColor,
                strokeWidth: 0,
                rx: 3,
                ry: 3
              }
            },
            position: { distance: 0.15, offset: 15 }
          },
          {
            attrs: {
              text: {
                text: cardinalidadDestino,
                fill: '#FFFFFF',
                fontSize: 14,
                fontWeight: 'bold'
              },
              rect: {
                fill: strokeColor,
                stroke: strokeColor,
                strokeWidth: 0,
                rx: 3,
                ry: 3
              }
            },
            position: { distance: 0.85, offset: 15 }
          }
        ],
        source: {
          id: elementoOrigen.id
        },
        target: {
          id: elementoDestino.id
        },
        attrs: {
          line: {
            stroke: strokeColor,
            strokeWidth: 2,
            strokeDasharray: strokeDasharray,
            sourceMarker: sourceMarker,
            targetMarker: targetMarker
          }
        }
      };

      this.rappid.graph.addCell(nuevaRelacion);
      console.log(`✅ Relación ${origen} → ${destino} agregada exitosamente`);
    } catch (error) {
      console.error(`❌ Error al agregar relación ${origen} → ${destino}:`, error);
    }
  }

  // 🆕 MÉTODOS PARA EL EDITOR UML 2.5
  
  onCellSelected(cell: any) {
    console.log('📝 Procesando selección de clase:', cell.id);
    
    // Para standard.HeaderedRectangle, el nombre está en el header y los atributos en el body
    const nombreHeader = cell.attr('headerText/text') || cell.attr('header/text') || '';
    // CRÍTICO: bodyText usa textWrap para wrapping automático
    const bodyText = cell.attr('bodyText/textWrap/text') || cell.attr('bodyText/text') || cell.attr('body/text') || '';
    
    console.log('📄 Header:', nombreHeader);
    console.log('📄 Body:', bodyText);
    
    const nombre = nombreHeader || 'Nueva Clase';
    console.log('🏷️ Nombre de clase:', nombre);
    
    // Extraer atributos del body
    const atributos: any[] = [];
    const metodos: any[] = [];
    
    if (bodyText) {
      const lineas = bodyText.split('\n');
      
      // Parsear cada línea del body
      let enSeccionMetodos = false;
      for (let i = 0; i < lineas.length; i++) {
        const linea = lineas[i].trim();
        
        if (linea.includes('───') || linea === '---') {
          enSeccionMetodos = true;
          continue;
        }
        
        if (linea && linea !== '' && !linea.includes('─')) {
          if (linea.includes('(') && linea.includes(')')) {
            // Es un método
            metodos.push(this.parsearMetodoSimple(linea, `method_${i}`));
          } else if (linea.includes(':')) {
            // Es un atributo
            atributos.push(this.parsearAtributoSimple(linea, `attr_${i}`));
          }
        }
      }
    }
    
    this.claseSeleccionada = {
      cell: cell,
      nombre: nombre,
      atributos: atributos,
      metodos: metodos
    };
    
    console.log('✨ Clase seleccionada actualizada:', this.claseSeleccionada);
    console.log('📊 Atributos:', atributos.length, 'Métodos:', metodos.length);
  }

  parsearAtributoSimple(linea: string, id: string): any {
    // Formato: [+|-|#|~] nombre : tipo [= valor]
    const match = linea.match(/^([+\-#~])?\s*(\w+)\s*:\s*(\w+)(?:\s*=\s*(.+))?/);
    if (match) {
      return {
        id,
        titulo: match[2],
        tipo: match[3],
        visibility: this.simboloAVisibilidad(match[1] || '-'),
        defaultValue: match[4]
      };
    }
    return { id, titulo: 'atributo', tipo: 'String', visibility: 'private' };
  }

  parsearMetodoSimple(linea: string, id: string): any {
    // Formato: [+|-|#|~] nombre(params) : tipo
    const match = linea.match(/^([+\-#~])?\s*(\w+)\(([^)]*)\)\s*:\s*(\w+)/);
    if (match) {
      const params = match[3] ? match[3].split(',').map((p: string) => {
        const parts = p.trim().split(':');
        return { nombre: parts[0].trim(), tipo: parts[1] ? parts[1].trim() : 'Object' };
      }) : [];
      
      return {
        id,
        nombre: match[2],
        parametros: params,
        tipoRetorno: match[4],
        visibility: this.simboloAVisibilidad(match[1] || '+')
      };
    }
    return { id, nombre: 'metodo', parametros: [], tipoRetorno: 'void', visibility: 'public' };
  }

  simboloAVisibilidad(simbolo: string): string {
    switch (simbolo) {
      case '+': return 'public';
      case '-': return 'private';
      case '#': return 'protected';
      case '~': return 'package';
      default: return 'private';
    }
  }
  
  onNombreClaseCambio() {
    if (this.claseSeleccionada && this.claseSeleccionada.cell) {
      this.actualizarTextoClase();
    }
  }

  onClaseEditada(cambio: any) {
    if (this.claseSeleccionada) {
      this.claseSeleccionada.atributos = cambio.atributos;
      this.claseSeleccionada.metodos = cambio.metodos;
      this.actualizarTextoClase();
    }
  }

  actualizarTextoClase() {
    if (!this.claseSeleccionada || !this.claseSeleccionada.cell) return;
    
    const { generarTextoClaseUML } = require('./utils/uml-formatter');
    
    // Para standard.HeaderedRectangle, actualizar header y body por separado
    // Header: nombre de la clase
    this.claseSeleccionada.cell.attr('headerText/text', this.claseSeleccionada.nombre);
    
    // Body: atributos y métodos en formato UML
    const textoUML = generarTextoClaseUML(
      this.claseSeleccionada.atributos,
      this.claseSeleccionada.metodos
    );
    
    // CRÍTICO: Usar textWrap para que JointJS maneje el wrapping automático
    this.claseSeleccionada.cell.attr('bodyText/textWrap/text', textoUML);
    
    // 💾 Persistir en la base de datos
    if (this.idSala) {
      const claseData = {
        cell_id: this.claseSeleccionada.cell.id,
        nombre: this.claseSeleccionada.nombre,
        atributos: this.claseSeleccionada.atributos || [],
        metodos: this.claseSeleccionada.metodos || [],
        posicion: {
          x: this.claseSeleccionada.cell.get('position')?.x || 0,
          y: this.claseSeleccionada.cell.get('position')?.y || 0,
          width: this.claseSeleccionada.cell.get('size')?.width || 200,
          height: this.claseSeleccionada.cell.get('size')?.height || 150
        }
      };
      
      this.claseUmlService.guardarClase(this.idSala, claseData).subscribe({
        next: (resp) => console.log('✅ Clase guardada en BD:', resp),
        error: (err) => console.error('❌ Error al guardar clase:', err)
      });
    }
    
    // Emitir cambio via WebSocket
    if (this.rappid && this.rappid.graph) {
      const jsonDiagrama = this.rappid.graph.toJSON();
      this.diagramadorService.wsService.emit('modificar-diagrama', {
        sala: this.nombreSala,
        diagrama: jsonDiagrama
      });
    }
  }

  cerrarEditor() {
    this.claseSeleccionada = null;
  }

  cerrarFlutterPanel() {
    // Limpiar completamente el estado
    this.flutterScreenActual = null;
    this.claseSeleccionada = null;
    
    // Forzar actualización de la vista
    this.cdr.detectChanges();
    
    // Volver al diagrama
    this.scrollToDiagram();
  }

  /**
   * Hace scroll suave hacia el panel de Flutter Preview
   */
  private scrollToFlutterPanel(): void {
    const flutterPanel = document.getElementById('flutter-panel');
    if (flutterPanel && this.flutterScreenActual) {
      flutterPanel.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start',
        inline: 'nearest'
      });
    }
  }

  /**
   * Scroll hacia arriba para ver el diagrama UML
   */
  scrollToDiagram(): void {
    const wrapper = document.querySelector('.uml-diagram-wrapper');
    if (wrapper) {
      wrapper.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      // Si no encuentra el wrapper, scroll to top
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  // 📱 FLUTTER SCREENS GENERATOR

  /**
   * Genera Flutter Screen desde una clase UML seleccionada
   */
  generarFlutterScreenDesdeClase(cell: any): void {
    console.log('📱 Iniciando generación de Flutter Screen...');
    
    try {
      // Extraer datos de la clase UML
      const classData = this.flutterGeneratorService.extraerDatosClase(cell);
      
      if (!classData) {
        console.warn('⚠️ No se pudieron extraer datos de la clase');
        return;
      }

      console.log('📊 Datos de clase extraídos:', classData);

      // Generar el FlutterScreen
      const flutterScreen = this.flutterGeneratorService.generarDesdeClaseUML(classData);
      
      // Actualizar la vista
      this.flutterScreenActual = flutterScreen;
      
      console.log('✅ Flutter Screen generado exitosamente:', flutterScreen);
      console.log('🎯 Componentes generados:', flutterScreen.components.length);
    } catch (error) {
      console.error('❌ Error generando Flutter Screen:', error);
      this.flutterScreenActual = null;
    }
  }
}
