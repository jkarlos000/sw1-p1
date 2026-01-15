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
  imports: [FormsModule, CommonModule, ReactiveFormsModule, RouterModule],
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
  onListenRespUnirseReunion!: Subscription;
  private rappid: RappidService;

  public http = inject(HttpClient);
  constructor(private element: ElementRef) {}

  // READ : LINK DE LA PAGINA ACTUAL
  public currentUrl: string = '';
  public viewModalShare: boolean = false;

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
        console.log('Diagrama actualizado recibido:', data);
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

    // READ : EVENTOS PARA NOTIFICAR CAMBIOS A LOS DEMAS INTERGRANTES
    // READ : INICIO

    // Evento para cuando se suelta el clic en un elemento
    this.rappid.paper.on(
      'element:pointerup',
      (elementView: joint.dia.ElementView) => {
        console.log('Elemento clicado y soltado:', elementView.model);
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
        console.log('Texto copiado al portapapeles:', this.currentUrl);
      })
      .catch((err) => {
        console.error('Error al copiar el texto al portapapeles:', err);
      });
  }

  closeShareModal(): void {
    this.viewModalShare = true;
  }
}
