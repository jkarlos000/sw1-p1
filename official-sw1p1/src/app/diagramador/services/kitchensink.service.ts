/*! JointJS+ v4.0.1 - HTML5 Diagramming Framework - TRIAL VERSION

Copyright (c) 2024 client IO

 2024-09-07


This Source Code Form is subject to the terms of the JointJS+ Trial License
, v. 2.0. If a copy of the JointJS+ License was not distributed with this
file, You can obtain one at https://www.jointjs.com/license
 or from the JointJS+ archive as was distributed by client IO. See the LICENSE file.*/
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { DirectedGraph } from '@joint/layout-directed-graph';
import * as joint from '@joint/plus';
import { saveAs } from 'file-saver';
import JSZip from 'jszip';
import pluralize from 'pluralize';
import { v4 as uuidv4 } from 'uuid';
import { DOMParser } from 'xmldom';
import { environment } from '../../../environments/environment';
import { ConfigService } from '../../common/services/config.service';
import {
  AtributoClase,
  ConnectorXML,
  ElementoCabezera,
  ElementoClase,
  ElementoLink,
  MetodoClase,
} from '../interfaces/jsonJoint.interface';
import {
  AtributosSB,
  ClassJPA,
  TicketOneToOne,
} from '../interfaces/springBoot';
import * as appShapes from '../shapes/app-shapes';
import { HaloService } from './halo.service';
import { InspectorService } from './inspector.service';
import { KeyboardService } from './keyboard.service';
import { StencilService } from './stencil.service';
import { ToolbarService } from './toolbar.service';

class KitchenSinkService {
  public viewModalQR: boolean = false;
  private get apiUrl() { return this.configService.apiUrl; }
  public http: HttpClient;
  el: HTMLElement;

  graph: joint.dia.Graph;
  paper: joint.dia.Paper;
  paperScroller: joint.ui.PaperScroller;

  commandManager: joint.dia.CommandManager;
  snaplines: joint.ui.Snaplines;
  clipboard: joint.ui.Clipboard;
  selection: joint.ui.Selection;
  navigator: joint.ui.Navigator;

  stencilService: StencilService;
  toolbarService: ToolbarService;
  inspectorService: InspectorService;
  haloService: HaloService;
  keyboardService: KeyboardService;
  
  // Callbacks para sincronizaciÃ³n con otros usuarios
  onClearDiagram?: () => void;
  onImportDiagram?: () => void;

  configService: ConfigService;
  router: Router;

  constructor(
    el: HTMLElement,
    stencilService: StencilService,
    toolbarService: ToolbarService,
    inspectorService: InspectorService,
    haloService: HaloService,
    keyboardService: KeyboardService,
    http: HttpClient,
    configService: ConfigService,
    router: Router
  ) {
    this.http = http;
    this.configService = configService;
    this.router = router;
    this.el = el;
    // apply current joint js theme
    const view = new joint.mvc.View({ el });
    view.delegateEvents({
      'mouseup input[type="range"]': (evt) => evt.target.blur(),
    });

    this.stencilService = stencilService;
    this.toolbarService = toolbarService;
    this.inspectorService = inspectorService;
    this.haloService = haloService;
    this.keyboardService = keyboardService;
  }

  startRappid() {
    // READ : CAMBIAMOS EL FONDOS DE LA APLICACION
    joint.setTheme('dark');

    this.initializePaper();
    this.initializeStencil();
    this.initializeSelection();
    this.initializeToolsAndInspector();
    this.initializeNavigator();
    this.initializeToolbar();
    this.initializeKeyboardShortcuts();
    this.initializeTooltips();
  }

  initializePaper() {
    const graph = (this.graph = new joint.dia.Graph(
      {},
      {
        cellNamespace: appShapes,
      }
    ));

    this.commandManager = new joint.dia.CommandManager({ graph: graph });

    const paper = (this.paper = new joint.dia.Paper({
      width: 1000,
      height: 1000,
      gridSize: 10,
      drawGrid: true,
      model: graph,
      cellViewNamespace: appShapes,
      defaultLink: <joint.dia.Link>new appShapes.app.Link(),
      defaultConnectionPoint: appShapes.app.Link.connectionPoint,
      interactive: { linkMove: false },
      async: true,
      sorting: joint.dia.Paper.sorting.APPROX,
    }));

    paper.on('blank:contextmenu', (evt) => {
      const x = evt.clientX ?? 0; // Proporcionar un valor predeterminado de 0 si es undefined
      const y = evt.clientY ?? 0; // Proporcionar un valor predeterminado de 0 si es undefined
      this.renderContextToolbar({ x, y });
    });

    paper.on('cell:contextmenu', (cellView, evt) => {
      const x = evt.clientX ?? 0; // Proporcionar un valor predeterminado de 0 si es undefined
      const y = evt.clientY ?? 0; // Proporcionar un valor predeterminado de 0 si es undefined
      this.renderContextToolbar({ x, y }, [cellView.model]);
    });
    this.snaplines = new joint.ui.Snaplines({ paper: paper });

    const paperScroller = (this.paperScroller = new joint.ui.PaperScroller({
      paper,
      autoResizePaper: true,
      scrollWhileDragging: true,
      cursor: 'grab',
    }));

    this.renderPlugin('.paper-container', paperScroller);
    paperScroller.render().center();

    paper.on('paper:pan', (evt, tx, ty) => {
      evt.preventDefault();
      paperScroller.el.scrollLeft += tx;
      paperScroller.el.scrollTop += ty;
    });

    paper.on('paper:pinch', (_evt, ox, oy, scale) => {
      // the default is already prevented
      const zoom = paperScroller.zoom();
      paperScroller.zoom(zoom * scale, {
        min: 0.2,
        max: 5,
        ox,
        oy,
        absolute: true,
      });
    });
  }

  initializeStencil() {
    const { stencilService, paperScroller, snaplines } = this;
    stencilService.create(paperScroller, snaplines);

    this.renderPlugin('.stencil-container', stencilService.stencil);
    stencilService.setShapes();

    stencilService.stencil.on(
      'element:drop',
      (elementView: joint.dia.ElementView) => {
        this.selection.collection.reset([elementView.model]);
      }
    );
  }

  initializeSelection() {
    this.clipboard = new joint.ui.Clipboard();
    this.selection = new joint.ui.Selection({
      paper: this.paperScroller,
      useModelGeometry: true,
      translateConnectedLinks:
        joint.ui.Selection.ConnectedLinksTranslation.SUBGRAPH,
    });
    this.selection.collection.on(
      'reset add remove',
      this.onSelectionChange.bind(this)
    );

    const keyboard = this.keyboardService.keyboard;

    // Initiate selecting when the user grabs the blank area of the paper while the Shift key is pressed.
    // Otherwise, initiate paper pan.
    this.paper.on(
      'blank:pointerdown',
      (evt: joint.dia.Event, _x: number, _y: number) => {
        if (keyboard.isActive('shift', evt)) {
          this.selection.startSelecting(evt);
        } else {
          this.selection.collection.reset([]);
          this.paperScroller.startPanning(evt);
          this.paper.removeTools();
        }
      }
    );

    // Initiate selecting when the user grabs a cell while shift is pressed.
    this.paper.on(
      'cell:pointerdown element:magnet:pointerdown',
      (cellView: joint.dia.CellView, evt: joint.dia.Event) => {
        if (keyboard.isActive('shift', evt)) {
          cellView.preventDefaultInteraction(evt);
          this.selection.startSelecting(evt);
        }
      }
    );

    this.paper.on(
      'element:pointerdown',
      (elementView: joint.dia.ElementView, evt: joint.dia.Event) => {
        // Select an element if CTRL/Meta key is pressed while the element is clicked.
        if (keyboard.isActive('ctrl meta', evt)) {
          this.selection.collection.add(elementView.model);
        }
      }
    );

    this.selection.on(
      'selection-box:pointerup',
      (elementView: joint.dia.ElementView, evt: joint.dia.Event) => {
        if (evt.button === 2) {
          evt.stopPropagation();
          const x = evt.clientX ?? 0; // Proporcionar un valor predeterminado de 0 si es undefined
          const y = evt.clientY ?? 0; // Proporcionar un valor predeterminado de 0 si es undefined
          this.renderContextToolbar(
            { x, y },
            this.selection.collection.toArray()
          );
        }
      },
      this
    );
  }

  renderContextToolbar(
    point: joint.dia.Point,
    cellsToCopy: joint.dia.Cell[] = []
  ) {
    this.selection.collection.reset(cellsToCopy);
    const contextToolbar = new joint.ui.ContextToolbar({
      target: point,
      root: this.paper.el,
      padding: 0,
      vertical: true,
      anchor: 'top-left',
      tools: [
        {
          action: 'copy',
          content: 'Copy',
          attrs: {
            disabled: cellsToCopy.length === 0,
          },
        },
        {
          action: 'paste',
          content: 'Paste',
          attrs: {
            disabled: this.clipboard.isEmpty(),
          },
        },
      ],
    });

    contextToolbar.on('action:copy', () => {
      contextToolbar.remove();

      this.clipboard.copyElements(cellsToCopy, this.graph);
    });

    contextToolbar.on('action:paste', () => {
      contextToolbar.remove();
      const pastedCells = this.clipboard.pasteCellsAtPoint(
        this.graph,
        this.paper.clientToLocalPoint(point)
      );

      const elements = pastedCells.filter((cell) => cell.isElement());

      // Make sure pasted elements get selected immediately. This makes the UX better as
      // the user can immediately manipulate the pasted elements.
      this.selection.collection.reset(elements);
    });
    contextToolbar.render();
  }

  onSelectionChange() {
    const { paper, selection } = this;
    const { collection } = selection;
    paper.removeTools();
    joint.ui.Halo.clear(paper);
    joint.ui.FreeTransform.clear(paper);
    joint.ui.Inspector.close();
    if (collection.length === 1) {
      const primaryCell: joint.dia.Cell = collection.first();
      const primaryCellView = paper.findViewByModel(primaryCell);
      selection.destroySelectionBox(primaryCell);
      this.selectPrimaryCell(primaryCellView);
    } else if (collection.length === 2) {
      collection.each(function (cell: joint.dia.Cell) {
        selection.createSelectionBox(cell);
      });
    }
  }

  selectPrimaryCell(cellView: joint.dia.CellView) {
    const cell = cellView.model;
    if (cell.isElement()) {
      this.selectPrimaryElement(<joint.dia.ElementView>cellView);
    } else {
      this.selectPrimaryLink(<joint.dia.LinkView>cellView);
    }
    this.inspectorService.create(cell);
  }

  selectPrimaryElement(elementView: joint.dia.ElementView) {
    const element = elementView.model;

    new joint.ui.FreeTransform({
      cellView: elementView,
      allowRotation: false,
      preserveAspectRatio: !!element.get('preserveAspectRatio'),
      allowOrthogonalResize: element.get('allowOrthogonalResize') !== false,
    }).render();

    this.haloService.create(elementView);
  }

  selectPrimaryLink(linkView: joint.dia.LinkView) {
    const ns = joint.linkTools;
    const toolsView = new joint.dia.ToolsView({
      name: 'link-pointerdown',
      tools: [
        new ns.Vertices(),
        new ns.SourceAnchor(),
        new ns.TargetAnchor(),
        new ns.SourceArrowhead(),
        new ns.TargetArrowhead(),
        new ns.Segments(),
        new ns.Boundary({ padding: 15 }),
        new ns.Remove({ offset: -20, distance: 40 }),
      ],
    });

    linkView.addTools(toolsView);
  }

  initializeToolsAndInspector() {
    this.paper.on('cell:pointerup', (cellView: joint.dia.CellView) => {
      const cell = cellView.model;
      const { collection } = this.selection;
      if (collection.includes(cell)) {
        return;
      }
      collection.reset([cell]);
    });

    this.paper.on('link:mouseenter', (linkView: joint.dia.LinkView) => {
      // Open tool only if there is none yet
      if (linkView.hasTools()) {
        return;
      }

      const ns = joint.linkTools;
      const toolsView = new joint.dia.ToolsView({
        name: 'link-hover',
        tools: [
          new ns.Vertices({ vertexAdding: false }),
          new ns.SourceArrowhead(),
          new ns.TargetArrowhead(),
        ],
      });

      linkView.addTools(toolsView);
    });

    this.paper.on('link:mouseleave', (linkView: joint.dia.LinkView) => {
      // Remove only the hover tool, not the pointerdown tool
      if (linkView.hasTools('link-hover')) {
        linkView.removeTools();
      }
    });

    this.graph.on('change', (cell: joint.dia.Cell, opt: any) => {
      if (!cell.isLink() || !opt.inspector) {
        return;
      }

      // LOGIC : CUANDO HAY UN CAMBIO EN LA CREACION DE ATRIBUTOS
      console.log('cambio algo aqui');

      const ns = joint.linkTools;
      const toolsView = new joint.dia.ToolsView({
        name: 'link-inspected',
        tools: [new ns.Boundary({ padding: 15 })],
      });

      cell.findView(this.paper).addTools(toolsView);
    });
  }

  initializeNavigator() {
    const navigator = (this.navigator = new joint.ui.Navigator({
      width: 240,
      height: 115,
      paperScroller: this.paperScroller,
      zoom: false,
      paperOptions: {
        async: true,
        sorting: joint.dia.Paper.sorting.NONE,
        elementView: appShapes.NavigatorElementView,
        linkView: appShapes.NavigatorLinkView,
        cellViewNamespace: {
          /* no other views are accessible in the navigator */
        },
      },
    }));

    this.renderPlugin('.navigator-container', navigator);
  }

  convertirCadenaALista(cadena: string): AtributoClase[] {
    if (!cadena || cadena.trim() === '') {
      return [];
    }

    // Separar atributos de mÃ©todos usando el separador UML â”€â”€â”€â”€â”€â”€â”€
    const partes = cadena.split(/â”€{5,}/); // Separador de 5 o mÃ¡s guiones largos
    const seccionAtributos = partes[0] || '';
    
    // Dividir por saltos de lÃ­nea
    const lineas = seccionAtributos.split(/\\n|\n/);
    
    // Filtrar solo lÃ­neas que NO contengan parÃ©ntesis (mÃ©todos)
    const lineasAtributos = lineas.filter(linea => {
      const lineaTrim = linea.trim();
      return lineaTrim !== '' && 
             !lineaTrim.includes('(') && 
             !lineaTrim.includes(')') &&
             lineaTrim.includes(':'); // Debe tener el separador tipo
    });

    // Crear lista de atributos
    const listaAtributos: AtributoClase[] = lineasAtributos.map((linea) => {
      return {
        id: uuidv4(),
        titulo: linea.trim()
      };
    });

    return listaAtributos;
  }

  convertirCadenaAMetodos(cadena: string): MetodoClase[] {
    if (!cadena || cadena.trim() === '') {
      return [];
    }

    // Separar atributos de mÃ©todos usando el separador UML â”€â”€â”€â”€â”€â”€â”€
    const partes = cadena.split(/â”€{5,}/); // Separador de 5 o mÃ¡s guiones largos
    const seccionMetodos = partes[1] || '';
    
    // Dividir por saltos de lÃ­nea
    const lineas = seccionMetodos.split(/\\n|\n/);
    
    // Filtrar solo lÃ­neas que contengan parÃ©ntesis (mÃ©todos)
    const lineasMetodos = lineas.filter(linea => {
      const lineaTrim = linea.trim();
      return lineaTrim !== '' && 
             (lineaTrim.includes('(') || lineaTrim.includes(')'));
    });

    // Crear lista de mÃ©todos
    const listaMetodos: MetodoClase[] = lineasMetodos.map((linea) => {
      return {
        id: uuidv4(),
        nombre: linea.trim()
      };
    });

    return listaMetodos;
  }

  tipoCabecera(tipo: string): string {
    switch (tipo) {
      case 'M 0 0 0 0':
        return 'ASOCIACION';
      case 'M -10 0 0 10 10 0 0 -10 z':
        return 'COMPOSICION';
      case 'M 0 -10 15 0 0 10 z':
        return 'AGREGACION';
      case 'M 0 -10 -15 0 0 10 z':
        return 'HERENCIA';
      case 'M 0 -10 L 2.94 -3.09 L 9.51 -3.09 L 4.29 1.18 L 6.18 8.09 L 0 5 L -6.18 8.09 L -4.29 1.18 L -9.51 -3.09 L -2.94 -3.09 Z':
        return 'DEPENDENCIA';
      default:
        return 'ASOCIACION';
    }
  }

  getC0andCI(
    link: ElementoLink,
    elementosClase: ElementoClase[]
  ): ElementoClase[] {
    let clasesUso: ElementoClase[] = [];
    let sourceClase: ElementoClase = elementosClase.find(
      (elementoClase) => elementoClase.id == link.origen.id
    )!;
    let targetClase: ElementoClase = elementosClase.find(
      (elementoClase) => elementoClase.id == link.destino.id
    )!;

    if (sourceClase.titulo.includes('_')) {
      clasesUso.push(targetClase);
      clasesUso.push(sourceClase);
    } else {
      clasesUso.push(sourceClase);
      clasesUso.push(targetClase);
    }

    return clasesUso;
  }

  getClaseFByName(
    claseOxClaseI: ElementoClase[],
    elementosClase: ElementoClase[]
  ): ElementoClase {
    let claseUso: ElementoClase;

    let claseI = claseOxClaseI[1].titulo;
    let partes = claseI.split('_');
    let tituloClaseF = partes[partes.length - 1];
    console.log(claseOxClaseI[0].titulo);
    console.log(tituloClaseF);
    console.log(claseI);
    if (tituloClaseF == claseOxClaseI[0].titulo) {
      tituloClaseF = partes[0];
    }

    claseUso = elementosClase.find(
      (elementoClase) => elementoClase.titulo == tituloClaseF
    )!;
    console.log(claseUso);
    return claseUso;
  }

  getLinkCIxClaseF(
    claseI: ElementoClase,
    claseF: ElementoClase,
    elementosLinks: ElementoLink[]
  ): ElementoLink {
    let linkResult: ElementoLink;

    elementosLinks.forEach((elementoLink) => {
      if (elementoLink.atributos.length == 1) {
        if (
          claseI.id == elementoLink.origen.id &&
          claseF.id == elementoLink.destino.id
        ) {
          linkResult = elementoLink;
          return;
        }

        if (
          claseI.id == elementoLink.destino.id &&
          claseF.id == elementoLink.origen.id
        ) {
          linkResult = elementoLink;
          return;
        }
      }
    });

    return linkResult!;
  }

  initializeToolbar() {
    this.toolbarService.create(this.commandManager, this.paperScroller);

    this.toolbarService.toolbar.on({
      'xmlExportar:pointerclick': () => {
        const entrada = document.createElement('input');
        entrada.type = 'file';
        entrada.accept = '.xml,.xmi,.zip';
        entrada.onchange = async (event: any) => {
          const archivo = event.target.files[0];
          if (archivo) {
            try {
              let xmlContent: string = '';

              // Si es un ZIP, extraer el archivo XMI/XML
              if (archivo.name.endsWith('.zip')) {
                console.log('ðŸ“¦ Archivo ZIP detectado, extrayendo...');
                const zip = new JSZip();
                const zipContent = await zip.loadAsync(archivo);
                
                // Buscar archivo .xmi o .xml en el ZIP
                const xmiFile = Object.keys(zipContent.files).find(name => 
                  name.endsWith('.xmi') || name.endsWith('.xml')
                );
                
                if (!xmiFile) {
                  alert('No se encontrÃ³ ningÃºn archivo XMI o XML en el ZIP');
                  return;
                }
                
                console.log('ðŸ“„ Archivo encontrado:', xmiFile);
                xmlContent = await zipContent.files[xmiFile].async('string');
              } else {
                // Leer archivo XMI/XML directamente
                console.log('ðŸ“„ Leyendo archivo XML/XMI directamente...');
                xmlContent = await new Promise<string>((resolve, reject) => {
                  const lector = new FileReader();
                  lector.onload = (e) => {
                    if (e.target && e.target.result) {
                      resolve(e.target.result as string);
                    } else {
                      reject(new Error('No se pudo leer el contenido del archivo'));
                    }
                  };
                  lector.onerror = () => reject(new Error('Error al leer el archivo'));
                  lector.readAsText(archivo);
                });
              }

              // Verificar que se leyÃ³ contenido
              if (!xmlContent || xmlContent.trim() === '') {
                throw new Error('El archivo estÃ¡ vacÃ­o o no se pudo leer');
              }

              console.log('âœ… Archivo leÃ­do correctamente, tamaÃ±o:', xmlContent.length, 'caracteres');
              
              // Buscar la palabra 'connector' en el XML para verificar
              const connectorsEnXML = (xmlContent.match(/<connector/g) || []).length;
              console.log(`ðŸ” Conectores encontrados en XML (bÃºsqueda de texto): ${connectorsEnXML}`);
              
              // Mostrar un fragmento del XML donde aparece "connector"
              if (connectorsEnXML > 0) {
                const indexConnector = xmlContent.indexOf('<connector');
                if (indexConnector !== -1) {
                  const fragmento = xmlContent.substring(Math.max(0, indexConnector - 100), Math.min(xmlContent.length, indexConnector + 500));
                  console.log('ðŸ“„ Fragmento del XML con connector:', fragmento);
                }
              }

              // Parsear el contenido del XML
              const parser = new DOMParser();
              const xmlDoc = parser.parseFromString(
                xmlContent,
                'application/xml'
              );

              // Verificar errores de parsing
              const parserError = xmlDoc.getElementsByTagName('parsererror');
              if (parserError.length > 0) {
                console.error('âŒ Error al parsear XML:', parserError[0].textContent);
                throw new Error('XML malformado: ' + parserError[0].textContent);
              }

              console.log('âœ… XML parseado correctamente');

              // LOGIC : ACCEDER <element> con xmi:type="uml:Class"
              // LOGIC : ACCEDER <element> aqui van los datos de coordenadas en el papel
              // Primero buscar el contenedor <elements>
              const elementsContainer = xmlDoc.getElementsByTagName('elements')[0];
              let packagedElements: HTMLCollectionOf<Element> | Element[] = [] as any;
              
              if (elementsContainer) {
                packagedElements = elementsContainer.getElementsByTagName('element');
                console.log(`ðŸ“Š Total de elementos <element> encontrados: ${packagedElements.length}`);
              } else {
                // Intentar bÃºsqueda global si no hay contenedor
                packagedElements = xmlDoc.getElementsByTagName('element');
                console.log(`ðŸ“Š Total de elementos encontrados (bÃºsqueda global): ${packagedElements.length}`);
              }
              
              let clasesJoint: Element[] = [];
              let dataClasesJoint: Element[] = [];

              console.log(`ðŸ“Š Total de elementos encontrados: ${packagedElements.length}`);

              for (let i = 0; i < packagedElements.length; i++) {
                const element = packagedElements[i];
                // Verificar si el atributo 'xmi:idref' existe
                if (element.hasAttribute('xmi:idref')) {
                  clasesJoint.push(element);
                  console.log(`âœ… Clase encontrada: ${element.getAttribute('name')}`);
                }
                // Verificar si el atributo 'geometry' existe
                if (element.hasAttribute('geometry')) {
                  dataClasesJoint.push(element);
                }
              }

              // Buscar geometrÃ­as en la secciÃ³n <diagrams>
              const diagramsContainer = xmlDoc.getElementsByTagName('diagrams')[0];
              if (diagramsContainer) {
                console.log('ðŸ“ Contenedor <diagrams> encontrado');
                const diagramElements = diagramsContainer.getElementsByTagName('element');
                console.log(`ðŸ“ Elementos con geometrÃ­a encontrados: ${diagramElements.length}`);
                
                for (let i = 0; i < diagramElements.length; i++) {
                  const element = diagramElements[i];
                  if (element.hasAttribute('geometry')) {
                    dataClasesJoint.push(element);
                  }
                }
              }

              console.log(`ðŸ“¦ Total de clases: ${clasesJoint.length}, GeometrÃ­as: ${dataClasesJoint.length}`);

              function getGeometryValues(id: string): string[] {
                for (let i = 0; i < dataClasesJoint.length; i++) {
                  const element = dataClasesJoint[i];
                  const subject = element.getAttribute('subject');

                  if (subject == id) {
                    const geometry = element.getAttribute('geometry');
                    if (geometry) {
                      // Extraer los valores numÃ©ricos de geometry
                      const values = geometry.match(/\d+/g);
                      if (values) {
                        return values;
                      }
                    }
                  }
                }
                return ['100', '100']; // PosiciÃ³n por defecto si no se encuentra
              }

              // LOGIC : ACCEDER <connector>
              // Primero buscar el contenedor <connectors>
              const connectorsContainer = xmlDoc.getElementsByTagName('connectors')[0];
              let connectors: HTMLCollectionOf<Element> | Element[] = [] as any;
              
              if (connectorsContainer) {
                console.log('ðŸ“¦ Contenedor <connectors> encontrado');
                console.log('ðŸ“¦ Hijos directos:', connectorsContainer.childNodes.length);
                
                // Ver quÃ© hay dentro
                for (let i = 0; i < Math.min(connectorsContainer.childNodes.length, 10); i++) {
                  const child = connectorsContainer.childNodes[i];
                  if (child.nodeType === 1) {
                    console.log(`  â””â”€ ${child.nodeName}`);
                  }
                }
                
                // Buscar los <connector> dentro del contenedor
                connectors = connectorsContainer.getElementsByTagName('connector');
                console.log(`ðŸ”— Total de conectores encontrados: ${connectors.length}`);
              } else {
                console.log('âŒ No se encontrÃ³ el elemento <connectors>');
                connectors = [] as any;
              }

              let clasesJsonToJoint: string[] = [];
              // READ : CREAR LAS Clases Normales e intermedias
              clasesJoint.forEach((element, index) => {
                const id = element.getAttribute('xmi:idref');
                const nombre = element.getAttribute('name');
                let color = nombre?.includes('_') ? '#feb663' : '#31d0c6';
                let coordenadas: string[] = getGeometryValues(id!);

                // LOGIC: Lista para almacenar atributos y mÃ©todos
                let attributeList = '';
                const attributes = element.getElementsByTagName('attribute');
                for (let j = 0; j < attributes.length; j++) {
                  const attribute = attributes[j];
                  const name = attribute.getAttribute('name');
                  const properties =
                    attribute.getElementsByTagName('properties')[0];
                  const type = properties
                    ? properties.getAttribute('type')
                    : '';
                  if (name && type) {
                      attributeList += `-${name}:${type}\\n`;
                    }
                  }

                // LOGIC: Importar mÃ©todos
                let methodList = '';
                const operations = element.getElementsByTagName('operation');
                for (let j = 0; j < operations.length; j++) {
                  const operation = operations[j];
                  const name = operation.getAttribute('name');
                  if (name) {
                    methodList += `+${name}\\n`;
                  }
                }

                // LOGIC: Combinar atributos y mÃ©todos con separador UML
                let bodyText = attributeList;
                if (methodList) {
                  bodyText += 'â”€â”€â”€â”€â”€â”€â”€â”€â”€\\n' + methodList;
                }
                bodyText = bodyText.replace(/\\n$/,''); // Quitar Ãºltimo salto

                  clasesJsonToJoint.push(`
          {
    "type": "standard.HeaderedRectangle",
    "position": {
      "x": ${coordenadas[0]},
      "y": ${coordenadas[1]}
    },
    "size": {
      "width": 250,
      "height": 300
    },
    "angle": 0,
    "id": "${id}",
    "z": 1,
    "attrs": {
      "root": {
        "dataTooltipPosition": "left",
        "dataTooltipPositionSelector": ".joint-stencil"
      },
      "body": {
        "stroke": "${color}",
        "fill": "transparent",
        "strokeDasharray": "0"
      },
      "header": {
        "height": 20,
        "stroke": "${color}",
        "fill": "${color}",
        "strokeDasharray": "0"
      },
      "headerText": {
        "y": 10,
        "fontSize": 11,
        "fill": "#000000",
        "text": "${nombre}",
        "fontFamily": "Averia Libre",
        "fontWeight": "Bold",
        "strokeWidth": 0
      },
      "bodyText": {
        "y": "calc(h/2 + 10)",
        "fontSize": 11,
        "fill": "#FFFFFF",
        "textWrap": {
          "text": "${bodyText}",
          "width": -10,
          "height": -20,
          "ellipsis": false
        },
        "fontFamily": "Averia Libre",
        "fontWeight": "Bold",
        "strokeWidth": 0
      }
    }
  }`);
                });

                let linksJsonToJoint: string[] = [];
                
                for (let i = 0; i < connectors.length; i++) {
                  const connector = connectors[i];
                  let sourceId = '';
                  let sourceMultiplicity = '';
                  let targetMultiplicity = '';
                  let targetId = '';
                  let eaType = '';
                  let subtype = '';
                  let intermediaId = '';
                  // Obtener el atributo xmi:idref del connector
                  const connectorId = connector.getAttribute('xmi:idref');

                  // Obtener el elemento source y su atributo xmi:idref
                  let sourceAggregation = '';
                  let targetAggregation = '';
                  
                  const source = connector.getElementsByTagName('source')[0];
                  if (source) {
                    sourceId = source.getAttribute('xmi:idref')!;

                    // Obtener el elemento type dentro de source y su atributo multiplicity y aggregation
                    const sourceType = source.getElementsByTagName('type')[0];
                    if (sourceType) {
                      sourceMultiplicity =
                        sourceType.getAttribute('multiplicity')!;
                      sourceAggregation = sourceType.getAttribute('aggregation') || '';
                    }
                  }

                  // Obtener el elemento target y su atributo xmi:idref
                  const target = connector.getElementsByTagName('target')[0];
                  if (target) {
                    targetId = target.getAttribute('xmi:idref')!;

                    // Obtener el elemento type dentro de target y su atributo multiplicity y aggregation
                    const targetType = target.getElementsByTagName('type')[0];
                    if (targetType) {
                      targetMultiplicity =
                        targetType.getAttribute('multiplicity')!;
                      targetAggregation = targetType.getAttribute('aggregation') || '';
                    }
                  }
                  
                  // Determinar quÃ© agregaciÃ³n usar basÃ¡ndose en cuÃ¡l lado la tiene
                  if (sourceAggregation && sourceAggregation !== 'none') {
                    subtype = sourceAggregation;
                  } else if (targetAggregation && targetAggregation !== 'none') {
                    subtype = targetAggregation;
                  }

                  // Obtener el elemento properties y su atributo ea_type
                  const properties =
                    connector.getElementsByTagName('properties')[0];
                  if (properties) {
                    eaType = properties.getAttribute('ea_type')!;
                    const subtypeFromProps = properties.getAttribute('subtype') ?? '';
                    
                    // Solo usar subtype de properties si existe, sino mantener el de aggregation
                    if (subtypeFromProps && subtypeFromProps !== '') {
                      subtype = subtypeFromProps;
                    }
                  }

                  const extendedProperties =
                    connector.getElementsByTagName('extendedProperties')[0];
                  if (extendedProperties) {
                    intermediaId =
                      extendedProperties.getAttribute('associationclass') ?? '';
                  }
                  
                  const uuid1 = uuidv4();
                  const uuid2 = uuidv4();
                  if (
                    sourceMultiplicity.includes('*') &&
                    targetMultiplicity.includes('*')
                  ) {
                    linksJsonToJoint.push(`
                      {
      "type": "app.Link",
      "router": {
        "name": "normal"
      },
      "connector": {
        "name": "rounded"
      },
      "labels": [
        {
          "attrs": {
            "text": {
              "text": "${sourceMultiplicity}",
              "fill": null
            }
          }
        }
      ],
      "source": {
        "id": "${sourceId}"
      },
      "target": {
        "id": "${intermediaId}"
      },
      "id": "${uuid1}",
      "z": 12,
      "attrs": {}
    }`);

                    linksJsonToJoint.push(`
      {
"type": "app.Link",
"router": {
"name": "normal"
},
"connector": {
"name": "rounded"
},
"labels": [
{
"attrs": {
"text": {
"text": "${targetMultiplicity}",
"fill": null
}
}
}
],
"source": {
"id": "${targetId}"
},
"target": {
"id": "${intermediaId}"
},
"id": "${uuid2}",
"z": 12,
"attrs": {}
}`);
                  } else {
                    // Determinar si el marcador va en source o target
                    let markerEnSource = false;
                    let d = '';
                    
                    if (eaType == 'Association' && (subtype == '' || subtype == 'none')) {
                      d = this.tipoCabeceraInversa('ASOCIACION');
                    }
                    if (eaType == 'Generalization' && (subtype == '' || subtype == 'none')) {
                      d = this.tipoCabeceraInversa('HERENCIA');
                    }
                    if (eaType == 'Aggregation' && subtype == 'composite') {
                      d = this.tipoCabeceraInversa('COMPOSICION');
                      markerEnSource = (sourceAggregation === 'composite');
                    }
                    if (eaType == 'Aggregation' && subtype == 'shared') {
                      d = this.tipoCabeceraInversa('AGREGACION');
                      markerEnSource = (sourceAggregation === 'shared');
                    }
                    if (eaType == 'Dependency' && (subtype == '' || subtype == 'none')) {
                      d = this.tipoCabeceraInversa('DEPENDENCIA');
                      markerEnSource = false; // Las dependencias siempre van al target
                    }

                    // Construir labels array correctamente sin comas sobrantes
                    const labels: string[] = [];
                    if (sourceMultiplicity) {
                      labels.push(`{
"attrs": {
"text": {
"text": "${sourceMultiplicity}",
"fill": null
}
},
"position": {
"distance": 0.2,
"offset": 0,
"angle": 0
}
}`);
                    }
                    if (targetMultiplicity) {
                      labels.push(`{
"attrs": {
"text": {
"text": "${targetMultiplicity}",
"fill": null
}
},
"position": {
"distance": 0.8,
"offset": 0,
"angle": 0
}
}`);
                    }
                    
                    // Construir el JSON segÃºn donde va el marcador
                    let markerJson = '';
                    if (markerEnSource) {
                      markerJson = `"sourceMarker": { "d": "${d}", "fill": "#feb663" }`;
                    } else {
                      markerJson = `"targetMarker": { "d": "${d}", "fill": "#feb663" }`;
                    }
                    
                    linksJsonToJoint.push(`{
"type": "app.Link",
"router": {
"name": "normal"
},
"connector": {
"name": "rounded"
},
"labels": [
${labels.join(',')}
],
"source": {
"id": "${sourceId}"
},
"target": {
"id": "${targetId}"
},
"id": "${connectorId}",
"z": 17,
"vertices": [],
"attrs": {
"line": {
${markerJson}
}
}
}`);
                  }
                }

                // READ : GENERAR EL JSON - Filtrar elementos vacÃ­os
                const allCells = [...clasesJsonToJoint, ...linksJsonToJoint].filter(c => c && c.trim() !== '');
                
                const jsonJoint = `{
"cells": [
${allCells.join(',\n')}
]
}`;
                console.log('ðŸ“‹ Diagrama generado desde XML:', jsonJoint.substring(0, 500) + '...');
                this.graph.fromJSON(JSON.parse(jsonJoint));
                console.log('âœ… Diagrama cargado exitosamente');
                
                // Sincronizar con otros usuarios
                if (this.onImportDiagram) {
                  this.onImportDiagram();
                  console.log('ðŸ”„ Diagrama sincronizado con otros usuarios');
                }
                
                alert(`Â¡Diagrama importado exitosamente!\n\n${clasesJoint.length} clases y ${connectors.length} relaciones cargadas.`);
              
            } catch (error) {
              console.error('âŒ Error al leer el archivo XML:', error);
              alert('Error al importar el diagrama XML.\n\nVerifica que el archivo sea un XMI/XML vÃ¡lido.\n\nRevisa la consola para mÃ¡s detalles.');
            }
          }
        };
        entrada.click();
      },
      'qr:pointerclick': () => {
        this.viewModalQR = !this.viewModalQR;
      },
      'layout:pointerclick': this.layoutDirectedGraph.bind(this),
      'snapline:change': this.changeSnapLines.bind(this),
      'clear:pointerclick': () => {
        this.graph.clear();
        // Llamar al callback para sincronizar con otros usuarios
        if (this.onClearDiagram) {
          this.onClearDiagram();
        }
      },
      'springBoot:pointerclick': () => {
        const jsonJoint = this.graph.toJSON();
        let elementosClases: ElementoClase[] = [];
        let elementosLinks: ElementoLink[] = [];
        let ticketsOneToOne: TicketOneToOne[] = [];
        jsonJoint.cells.forEach((cell: any) => {
          if (cell.type == 'standard.HeaderedRectangle') {
            let elementoClase: ElementoClase = {
              titulo: cell.attrs.headerText.text,
              id: cell.id,
              posicion: [cell.position.x, cell.position.y],
              size: [cell.size.width, cell.size.height],
              atributos: this.convertirCadenaALista(
                cell.attrs.bodyText.textWrap.text
              ),
              color: cell.attrs.body.stroke,
            };
            elementosClases.push(elementoClase);
          } else if (cell.type == 'app.Link') {
            let cabezeraOrigen: ElementoCabezera = {
              id: cell.source.id,
              tipo: cell.attrs?.line?.sourceMarker?.d ?? 'M 0 0 0 0',
              normal: this.tipoCabecera(cell.attrs?.line?.sourceMarker?.d),
            };

            let cabezeraDestino: ElementoCabezera = {
              id: cell.target.id,
              tipo: cell.attrs?.line?.targetMarker?.d ?? 'M 0 0 0 0',
              normal: this.tipoCabecera(cell.attrs?.line?.targetMarker?.d),
            };

            let elementoLink: ElementoLink = {
              id: cell.id,
              origen: cabezeraOrigen,
              destino: cabezeraDestino,
              atributos: cell.labels.map((label: any) => label.attrs.text.text),
            };
            elementosLinks.push(elementoLink);
          }
        });

        // READ : PAQUETES CLASES JPA
        let clasesJPA: ClassJPA[] = [];

        elementosClases.forEach((elementoClase) => {
          let atributosEspeciales: string[] = [];
          if (elementoClase.color == '#feb663') {
            return;
          }

          //LOGIC : Crear una lista de atributos de la clase
          let atributosClase: AtributosSB[] = elementoClase.atributos.map(
            (atributo) => {
              return this.parsearAtributo(atributo.titulo);
            }
          );

          // LOGIC : Atributos de la clase en formato JPA
          let atributosJPA: string = atributosClase
            .map((atributo) => {
              return `private ${atributo.tipo} ${atributo.nombre};`;
            })
            .join('\n');

          let jpaClase: string = `
package com.proyecto.modelos;
import jakarta.persistence.*;
import lombok.Data;
import java.io.Serializable;
import java.util.List;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Entity
@Table (name = "${elementoClase.titulo.toLocaleLowerCase()}")
public class ${elementoClase.titulo} implements Serializable {
@Id
@GeneratedValue(strategy = GenerationType.SEQUENCE)
${atributosJPA}
`;

          for (let elementoLink of elementosLinks) {
            if (
              elementoLink.origen.id != elementoClase.id &&
              elementoLink.destino.id != elementoClase.id
            ) {
              continue;
            }

            if (
              elementoLink.origen.id == elementoClase.id &&
              elementoLink.destino.id == elementoClase.id
            ) {
              jpaClase += `
@ManyToOne
@JoinColumn(name = "id_padre_${elementoClase.titulo.toLowerCase()}")
private ${elementoClase.titulo} ${elementoClase.titulo.toLowerCase()}Padre;

@OneToMany(mappedBy = "${elementoClase.titulo.toLowerCase()}Padre", cascade = CascadeType.ALL)
private List<${elementoClase.titulo}> sub${pluralize(
                elementoClase.titulo.toLowerCase()
              )};
              `;
              atributosEspeciales.push(
                this.capitalizeFirstLetter(
                  `${elementoClase.titulo.toLowerCase()}Padre`
                )
              );
              atributosEspeciales.push(
                this.capitalizeFirstLetter(
                  `sub${pluralize(elementoClase.titulo.toLowerCase())}`
                )
              );
              continue;
            }

            //LOGIC : Verificar que tenga solo un atributo
            // if (
            //   elementoLink.atributos.length == 1 &&
            //   elementoClase.color != '#feb663'
            // ) {
            if (elementoLink.atributos.length == 1) {
              // READ : CLASE_A LINK CLASE_A_B LINK CLASE_B
              // LOGIC : ALMACENA LA CLASE ORIGEN Y LA INTERMEDIA
              let claseOxClaseI: ElementoClase[] = [];
              // LOGIC : FUNCION PARA BUSCAR SU OTRA MITAD
              claseOxClaseI = this.getC0andCI(elementoLink, elementosClases);
              // LOGIC : ALMACENA LA CLASE FINAL
              let claseF: ElementoClase;
              // LOGIC : FUNCION PARA BUSCAR LA CLASE FINAL
              claseF = this.getClaseFByName(claseOxClaseI, elementosClases);
              // LOGIC : PARA ALMACENAR Y BUSCAR EL LINK ENTRE LA INTERMDIA Y LA FINAL
              let linkTarget: ElementoLink;
              linkTarget = this.getLinkCIxClaseF(
                claseOxClaseI[1],
                claseF,
                elementosLinks
              );

              if (
                elementoLink.atributos[0].includes('0...*') ||
                elementoLink.atributos[0].includes('*...0')
              ) {
                jpaClase += `
@ManyToMany
@JoinTable(
name = "${claseOxClaseI[1].titulo.toLowerCase()}",
joinColumns = @JoinColumn(name = "id_${claseOxClaseI[0].titulo.toLowerCase()}"),
inverseJoinColumns = @JoinColumn(name = "id_${claseF.titulo.toLowerCase()}")
)
private List<${claseF.titulo}> ${pluralize(claseF.titulo.toLowerCase())};
                `;
                atributosEspeciales.push(
                  this.capitalizeFirstLetter(
                    pluralize(claseF.titulo.toLowerCase())
                  )
                );
              } else {
                jpaClase += `
@ManyToMany(mappedBy = "${pluralize(claseOxClaseI[0].titulo.toLowerCase())}")
private List<${claseF.titulo}> ${pluralize(claseF.titulo.toLowerCase())};
                `;

                atributosEspeciales.push(
                  this.capitalizeFirstLetter(
                    pluralize(claseF.titulo.toLowerCase())
                  )
                );
              }
            } else {
              // LOGIC : Verificar si tiene dos atributos
              // LOGIC : Verificar si esta unida al origen
              let claseTrabajo: ElementoClase;
              let relacionesClaseJPA: string;
              if (elementoLink.origen.id == elementoClase.id) {
                claseTrabajo = this.encontrarClaseTrabajo(
                  'origen',
                  elementoLink,
                  elementosClases
                );
                // LOGIC : HACER RELACION DE CLASES A JPA
                const [relacionesJPA, tickes, attrEspeciales] =
                  this.relacionesClaseJPA(
                    elementoClase,
                    elementoLink,
                    claseTrabajo,
                    'origen',
                    ticketsOneToOne,
                    atributosEspeciales
                  );
                atributosEspeciales = attrEspeciales;
                relacionesClaseJPA = relacionesJPA;
                ticketsOneToOne = tickes;
                jpaClase += relacionesClaseJPA;
              } else {
                // LOGIC : Verificar si esta unida al final
                claseTrabajo = this.encontrarClaseTrabajo(
                  'destino',
                  elementoLink,
                  elementosClases
                );
                const [relacionesJPA, tickes, attrEspeciales] =
                  this.relacionesClaseJPA(
                    elementoClase,
                    elementoLink,
                    claseTrabajo,
                    'destino',
                    ticketsOneToOne,
                    atributosEspeciales
                  );
                atributosEspeciales = attrEspeciales;
                relacionesClaseJPA = relacionesJPA;
                ticketsOneToOne = tickes;
                jpaClase += relacionesClaseJPA;
              }
            }
          }
          // clasesJPA.push(jpaClase + '\n}');
          clasesJPA.push({
            contenido: jpaClase + '\n}',
            attrsEspeciales: atributosEspeciales,
          });
        });

        // READ : PAQUETES REPOSITORIOS

        // READ : PAQUETES CONTROLADORES

        // READ : PAQUETES SERVICIOS

        const zip = new JSZip();
        
        // Crear estructura de directorios Maven
        const srcMainJava = zip.folder('src/main/java/com/proyecto');
        const srcMainResources = zip.folder('src/main/resources');
        
        const carpetaModelos = srcMainJava!.folder('modelos');
        const carpetaServicios = srcMainJava!.folder('servicios');
        const carpetaControladores = srcMainJava!.folder('controladores');
        const carpetaRepositorios = srcMainJava!.folder('repositorios');

        // Crear pom.xml
        const pomXml = `<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0
         https://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>
    
    <parent>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>3.2.1</version>
        <relativePath/>
    </parent>
    
    <groupId>com.proyecto</groupId>
    <artifactId>api-rest</artifactId>
    <version>1.0.0</version>
    <name>API REST Generada</name>
    <description>Proyecto Spring Boot generado desde diagrama UML 2.5</description>
    
    <properties>
        <java.version>17</java.version>
    </properties>
    
    <dependencies>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-data-jpa</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>
        <dependency>
            <groupId>org.postgresql</groupId>
            <artifactId>postgresql</artifactId>
            <scope>runtime</scope>
        </dependency>
        <dependency>
            <groupId>org.projectlombok</groupId>
            <artifactId>lombok</artifactId>
            <optional>true</optional>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-test</artifactId>
            <scope>test</scope>
        </dependency>
    </dependencies>
    
    <build>
        <plugins>
            <plugin>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-maven-plugin</artifactId>
                <configuration>
                    <excludes>
                        <exclude>
                            <groupId>org.projectlombok</groupId>
                            <artifactId>lombok</artifactId>
                        </exclude>
                    </excludes>
                </configuration>
            </plugin>
        </plugins>
    </build>
</project>`;

        zip.file('pom.xml', pomXml);

        // Crear application.properties
        const applicationProperties = `# ConfiguraciÃ³n de la base de datos PostgreSQL
spring.datasource.url=jdbc:postgresql://localhost:5432/nombre_base_datos
spring.datasource.username=postgres
spring.datasource.password=tu_password

# ConfiguraciÃ³n de JPA/Hibernate
spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=true
spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.PostgreSQLDialect
spring.jpa.properties.hibernate.format_sql=true

# Puerto del servidor
server.port=8080

# ConfiguraciÃ³n de logs
logging.level.org.hibernate.SQL=DEBUG
logging.level.org.hibernate.type.descriptor.sql.BasicBinder=TRACE`;

        srcMainResources!.file('application.properties', applicationProperties);

        // Crear clase principal Application.java
        const applicationJava = `package com.proyecto;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class Application {
    public static void main(String[] args) {
        SpringApplication.run(Application.class, args);
    }
}`;

        srcMainJava!.file('Application.java', applicationJava);

        // Crear archivo README.md con un contenido simplificado pero completo
        const contenidoREADME = [
          '# Proyecto Spring Boot - Generado AutomÃ¡ticamente',
          '',
          'Este proyecto Spring Boot fue generado automÃ¡ticamente a partir de un diagrama UML 2.5 y contiene una API REST completamente funcional.',
          '',
          '## Estructura del Proyecto',
          '',
          'proyecto/',
          'â”œâ”€â”€ modelos/           # Entidades JPA (@Entity) con relaciones',
          'â”œâ”€â”€ repositorios/      # Interfaces JpaRepository para acceso a datos',
          'â”œâ”€â”€ servicios/         # LÃ³gica de negocio',
          'â”œâ”€â”€ controladores/     # Endpoints REST (@RestController)',
          'â”œâ”€â”€ application.properties  # ConfiguraciÃ³n',
          'â””â”€â”€ pom.xml           # Dependencias Maven',
          '',
          '## Requisitos Previos',
          '',
          '1. Java JDK 17+ - https://adoptium.net/',
          '2. Maven 3.8+ - https://maven.apache.org/download.cgi',
          '3. PostgreSQL 13+ - https://www.postgresql.org/download/',
          '4. Postman (opcional) - https://www.postman.com/downloads/',
          '',
          '## ConfiguraciÃ³n de la Base de Datos',
          '',
          '### Crear la Base de Datos:',
          '',
          'psql -U postgres',
          'CREATE DATABASE proyecto;',
          '',
          '### Configurar Credenciales en application.properties:',
          '',
          'spring.datasource.username=postgres',
          'spring.datasource.password=clave123',
          '',
          '## Ejecutar el Proyecto',
          '',
          '### Con Maven:',
          'mvn spring-boot:run',
          '',
          '### Con JAR:',
          'mvn clean package',
          'java -jar target/proyecto-0.0.1-SNAPSHOT.jar',
          '',
          '## Probar con Postman',
          '',
          '### Endpoints por Entidad (ejemplo: Usuario):',
          '',
          '- GET    http://localhost:8081/usuario       | Listar todos',
          '- GET    http://localhost:8081/usuario/{id}  | Obtener por ID',
          '- POST   http://localhost:8081/usuario       | Crear nuevo',
          '- PUT    http://localhost:8081/usuario/{id}  | Actualizar',
          '- DELETE http://localhost:8081/usuario/{id}  | Eliminar',
          '',
          '### Ejemplo de Body (POST/PUT):',
          '{',
          '  "nombre": "Juan Perez",',
          '  "email": "juan@example.com",',
          '  "edad": 30',
          '}',
          '',
          '## ConfiguraciÃ³n (application.properties)',
          '',
          'spring.datasource.url=jdbc:postgresql://localhost:5432/proyecto',
          'spring.jpa.hibernate.ddl-auto=update',
          'server.port=8081',
          '',
          '## SoluciÃ³n de Problemas',
          '',
          '- Error "Database does not exist" â†’ Crear con CREATE DATABASE proyecto;',
          '- Error "Connection refused" â†’ Verificar PostgreSQL: sudo service postgresql status',
          '- Error "Port already in use" â†’ Cambiar puerto en application.properties',
          '',
          '## Recursos',
          '',
          '- Spring Boot: https://spring.io/projects/spring-boot',
          '- Spring Data JPA: https://spring.io/projects/spring-data-jpa',
          '- PostgreSQL: https://www.postgresql.org/docs/',
          '',
          '---',
          'Generado desde diagrama UML 2.5',
        ].join('\\n');

        zip.file('README.md', contenidoREADME);

        clasesJPA.forEach((claseJPA) => {
          const nombreClase = this.extraerNombreClase(claseJPA.contenido);
          const nombreArchivo = nombreClase + '.java';

          carpetaModelos!.file(nombreArchivo, claseJPA.contenido);

          carpetaRepositorios!.file(
            nombreClase + 'Repositorio.java',
            this.generarRepositorio(nombreClase)
          );

          carpetaServicios!.file(
            nombreClase + 'Servicio.java',
            this.generarServicio(nombreClase, claseJPA)
          );

          carpetaControladores!.file(
            nombreClase + 'Controlador.java',
            this.generarControlador(nombreClase)
          );
        });

        zip.generateAsync({ type: 'blob' }).then((content) => {
          // Solicitar nombre del proyecto al usuario
          const nombreProyecto = prompt('Ingrese el nombre del proyecto Spring Boot:', 'mi-proyecto-spring');
          
          // Si el usuario cancela o no ingresa nombre, usar uno por defecto
          const fileName = nombreProyecto && nombreProyecto.trim() !== '' 
            ? `${nombreProyecto.trim()}.zip` 
            : 'complemento.zip';
          
          saveAs(content, fileName);
          console.log('âœ… Proyecto Spring Boot generado:', fileName);
        });
      },
      'postmanCollection:pointerclick': async () => {
        try {
          console.log('ðŸš€ Generando colecciÃ³n de Postman con IA...');
          
          // Obtener las clases del diagrama
          const jsonJoint = this.graph.toJSON();
          let elementosClases: ElementoClase[] = [];
          
          jsonJoint.cells.forEach((cell: any) => {
            if (cell.type == 'standard.HeaderedRectangle') {
              let elementoClase: ElementoClase = {
                titulo: cell.attrs.headerText.text,
                id: cell.id,
                posicion: [cell.position.x, cell.position.y],
                size: [cell.size.width, cell.size.height],
                atributos: this.convertirCadenaALista(
                  cell.attrs.bodyText.textWrap.text
                ),
                color: cell.attrs.body.stroke,
              };
              
              // Filtrar clases intermedias (muchos a muchos)
              if (!elementoClase.color.includes('#feb663')) {
                elementosClases.push(elementoClase);
              }
            }
          });

          if (elementosClases.length === 0) {
            alert('No hay clases en el diagrama para generar la colecciÃ³n');
            return;
          }

          // Construir descripciÃ³n de las clases para el prompt
          let descripcionClases = elementosClases.map(clase => {
            const atributos = clase.atributos.map(a => {
              // Limpiar sÃ­mbolos de visibilidad UML 2.5 (+, -, #, ~)
              const atributoLimpio = a.titulo.replace(/^[+\-#~]\s*/, '').trim();
              return `  - ${atributoLimpio}`;
            }).join('\n');
            return `Clase: ${clase.titulo}\nAtributos:\n${atributos}`;
          }).join('\n\n');

          // Construir el prompt para Claude
          const promptText = `Genera una colecciÃ³n de Postman v2.1 en formato JSON para una API REST Spring Boot basada en las siguientes clases JPA.

Los atributos estÃ¡n en formato UML 2.5 (pueden tener sÃ­mbolos de visibilidad como +, -, #, ~ al inicio, ignÃ³ralos).
Formato: nombre : tipo

CLASES DEL DIAGRAMA:

${descripcionClases}

REQUISITOS DE LA COLECCIÃ“N:

1. **InformaciÃ³n General:**
   - Nombre de colecciÃ³n: "API REST"
   - Variable: {{baseUrl}} = http://localhost:8080/api

2. **Para cada clase, crea UNA carpeta con estos 5 endpoints:**
   - GET /[clase-plural]?page=0&size=10 (Listar con paginaciÃ³n)
   - GET /[clase-plural]/{id} (Obtener por ID)
   - POST /[clase-plural] (Crear - incluye body JSON de ejemplo)
   - PUT /[clase-plural]/{id} (Actualizar - incluye body JSON de ejemplo)
   - DELETE /[clase-plural]/{id} (Eliminar)

3. **Reglas de nombres:**
   - Rutas en minÃºsculas y plural: "clientes", "productos", "ventas"
   - Variables path: {id}, {clienteId}, etc.

4. **Body JSON de ejemplo:**
   - Para POST/PUT: crea un JSON con todos los atributos
   - Usa valores realistas segÃºn el tipo de dato
   - String â†’ "texto ejemplo", Integer â†’ 1, Boolean â†’ true, Date â†’ "2024-01-20"
   - NO incluyas el campo "id" en POST (es auto-generado)
   - SÃ incluye "id" en PUT

5. **Headers:**
   - Content-Type: application/json (en todos los requests)

6. **NO incluyas:**
   - El campo "response" (omite ejemplos de respuesta para reducir tamaÃ±o)
   - Explicaciones adicionales

FORMATO DE RESPUESTA:
Responde ÃšNICAMENTE con el JSON vÃ¡lido de Postman v2.1, sin markdown, sin \`\`\`json, sin explicaciones.
Estructura compacta pero legible.`;

          // Llamar a la API de IA
          const response = await this.http.post<any>(`${this.apiUrl}/chat-ia/generar-postman`, {
            prompt: promptText
          }).toPromise();

          if (!response || !response.ok) {
            throw new Error('Error al generar la colecciÃ³n con IA');
          }

          // Extraer el JSON de la respuesta
          let collectionJson = response.coleccion;
          
          // Si viene como string, intentar parsearlo
          if (typeof collectionJson === 'string') {
            // Limpiar markdown si viene envuelto en ```json
            collectionJson = collectionJson.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
            collectionJson = JSON.parse(collectionJson);
          }

          // Solicitar nombre de la colecciÃ³n
          const nombreColeccion = window.prompt('Ingrese el nombre de la colecciÃ³n:', 'API-REST-Collection');
          const nombreFinal = nombreColeccion && nombreColeccion.trim() !== '' 
            ? nombreColeccion.trim() 
            : 'API-REST-Collection';

          // Actualizar el nombre interno de la colecciÃ³n (el que se ve en Postman)
          if (collectionJson && collectionJson.info) {
            collectionJson.info.name = nombreFinal;
          }

          // Nombre del archivo
          const fileName = `${nombreFinal}.postman_collection.json`;

          // Descargar el archivo JSON
          const blob = new Blob([JSON.stringify(collectionJson, null, 2)], { 
            type: 'application/json' 
          });
          saveAs(blob, fileName);
          
          console.log('âœ… ColecciÃ³n de Postman generada:', fileName);
          alert('Â¡ColecciÃ³n de Postman generada exitosamente! Puedes importarla en Postman.');
          
        } catch (error) {
          console.error('âŒ Error al generar colecciÃ³n de Postman:', error);
          alert('Error al generar la colecciÃ³n de Postman. Revisa la consola para mÃ¡s detalles.');
        }
      },
      'exportarSQL:pointerclick': async () => {
        try {
          console.log('ðŸ—„ï¸ Generando schema SQL con IA...');
          
          // Obtener las clases y relaciones del diagrama
          const jsonJoint = this.graph.toJSON();
          let elementosClases: ElementoClase[] = [];
          let elementosRelaciones: any[] = [];
          
          jsonJoint.cells.forEach((cell: any) => {
            if (cell.type == 'standard.HeaderedRectangle') {
              let elementoClase: ElementoClase = {
                titulo: cell.attrs.headerText.text,
                id: cell.id,
                posicion: [cell.position.x, cell.position.y],
                size: [cell.size.width, cell.size.height],
                atributos: this.convertirCadenaALista(
                  cell.attrs.bodyText.textWrap.text
                ),
                color: cell.attrs.body.stroke,
              };
              
              // Filtrar clases intermedias
              if (!elementoClase.color.includes('#feb663')) {
                elementosClases.push(elementoClase);
              }
            } else if (cell.type == 'standard.Link') {
              // Extraer informaciÃ³n de la relaciÃ³n
              const labels = cell.labels || [];
              const cardinalidadOrigen = labels.find((l: any) => l.position?.distance < 0.5)?.attrs?.text?.text || '1';
              const cardinalidadDestino = labels.find((l: any) => l.position?.distance >= 0.5)?.attrs?.text?.text || '1';
              
              const sourceMarker = cell.attrs?.line?.sourceMarker?.d || '';
              const tipoRelacion = this.tipoCabecera(sourceMarker);
              
              elementosRelaciones.push({
                origen: cell.source.id,
                destino: cell.target.id,
                tipoRelacion,
                cardinalidadOrigen,
                cardinalidadDestino
              });
            }
          });

          if (elementosClases.length === 0) {
            alert('No hay clases en el diagrama para generar SQL');
            return;
          }

          // Construir descripciÃ³n detallada para Claude
          let descripcionClases = elementosClases.map(clase => {
            const atributos = clase.atributos.map(a => {
              const atributoLimpio = a.titulo.replace(/^[+\-#~]\s*/, '').trim();
              return `  - ${atributoLimpio}`;
            }).join('\n');
            return `Clase: ${clase.titulo}\nAtributos:\n${atributos}`;
          }).join('\n\n');

          // Construir descripciÃ³n de relaciones
          let descripcionRelaciones = elementosRelaciones.map(rel => {
            const origenClase = elementosClases.find(c => c.id === rel.origen);
            const destinoClase = elementosClases.find(c => c.id === rel.destino);
            if (!origenClase || !destinoClase) return '';
            
            return `${origenClase.titulo} --[${rel.tipoRelacion}]--> ${destinoClase.titulo} (${rel.cardinalidadOrigen}..${rel.cardinalidadDestino})`;
          }).filter(r => r !== '').join('\n');

          // Construir prompt para Claude
          const promptText = `Genera schema SQL completo para PostgreSQL basado en el siguiente diagrama UML 2.5.

**CLASES DEL DIAGRAMA:**

${descripcionClases}

**RELACIONES:**

${descripcionRelaciones}

**REQUISITOS DEL SCHEMA (schema.sql):**

1. **Tablas:**
   - Nombre en minÃºsculas y plural: clientes, productos, ventas
   - Columna id SERIAL PRIMARY KEY en todas las tablas
   - Tipos PostgreSQL: INTEGER, VARCHAR(255), TEXT, BOOLEAN, DATE, TIMESTAMP, DECIMAL(10,2)
   - Mapeo de tipos UML â†’ PostgreSQL:
     * Integer â†’ INTEGER
     * String â†’ VARCHAR(255)
     * Boolean â†’ BOOLEAN
     * Date â†’ DATE
     * DateTime â†’ TIMESTAMP
     * Double/Float â†’ DECIMAL(10,2)

2. **Relaciones segÃºn cardinalidad:**
   - 1:1 (COMPOSICION/ASOCIACION) â†’ Foreign key con UNIQUE
   - 1:N (ASOCIACION) â†’ Foreign key en tabla "muchos"
   - N:M (ASOCIACION) â†’ Tabla intermedia con dos foreign keys
   - HERENCIA â†’ Foreign key a tabla padre

3. **Constraints:**
   - NOT NULL en campos obligatorios
   - UNIQUE donde corresponda
   - ON DELETE CASCADE/SET NULL segÃºn tipo de relaciÃ³n
   - CHECK constraints para validaciones

4. **Ãndices:**
   - CREATE INDEX en foreign keys
   - CREATE INDEX en campos frecuentemente consultados

**REQUISITOS DEL SEED (seed.sql):**

1. **Datos de prueba realistas:**
   - MÃ­nimo 5 registros por tabla
   - Respetar foreign keys (insertar padres antes que hijos)
   - Valores coherentes y realistas
   - Fechas actuales o recientes

2. **Orden de inserciÃ³n:**
   - Tablas sin dependencias primero
   - Luego tablas con foreign keys
   - Finalmente tablas intermedias (N:M)

**FORMATO DE RESPUESTA:**

Genera DOS archivos SQL separados por comentarios:

-- SCHEMA.SQL
-- CreaciÃ³n de tablas con relaciones

DROP TABLE IF EXISTS [tablas] CASCADE;

CREATE TABLE ... ;

-- SEED.SQL  
-- Datos de prueba

INSERT INTO ... ;

IMPORTANTE:
- SQL vÃ¡lido para PostgreSQL
- Sin markdown, sin \`\`\`sql
- Comentarios descriptivos
- Script ejecutable directamente`;

          // Llamar a la API de IA
          const response = await this.http.post<any>(`${this.apiUrl}/chat-ia/generar-sql`, {
            prompt: promptText
          }).toPromise();

          if (!response || !response.ok) {
            throw new Error('Error al generar SQL con IA');
          }

          // Obtener los archivos SQL
          const schemaSQL = response.schema;
          const seedSQL = response.seed;

          // Solicitar nombre base para los archivos
          const nombreBase = window.prompt('Ingrese el nombre base para los archivos SQL:', 'database');
          const nombreFinal = nombreBase && nombreBase.trim() !== '' 
            ? nombreBase.trim() 
            : 'database';

          // Crear ZIP con ambos archivos
          const zip = new JSZip();
          zip.file(`${nombreFinal}-schema.sql`, schemaSQL);
          zip.file(`${nombreFinal}-seed.sql`, seedSQL);

          // Descargar ZIP
          zip.generateAsync({ type: 'blob' }).then((content) => {
            saveAs(content, `${nombreFinal}-postgresql.zip`);
            console.log('âœ… Archivos SQL generados:', `${nombreFinal}-postgresql.zip`);
            alert('Â¡Archivos SQL generados exitosamente!\n\nContiene:\n- schema.sql (estructura de tablas)\n- seed.sql (datos de prueba)');
          });
          
        } catch (error) {
          console.error('âŒ Error al generar SQL:', error);
          alert('Error al generar archivos SQL. Revisa la consola para mÃ¡s detalles.');
        }
      },
      'jsonExportar:pointerclick': () => {
        // LOGIC : Convertir el objeto JSON a una cadena
        let graphJSON = this.graph.toJSON();
        let contenidoGraph: string = JSON.stringify(
          graphJSON,
          (key, value) => {
            if (key === 'text' && typeof value === 'string') {
              // LOGIC : Reemplazar todas las ocurrencias de \n con \\n
              return value.replace(/\n/g, '\\n');
            }
            return value;
          },
          2
        );

        const textoDocumento = new Blob([contenidoGraph], {
          type: 'application/octet-stream',
        });
        const url = window.URL.createObjectURL(textoDocumento);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${uuidv4().substring(0, 6)}.json`;
        a.click();
        window.URL.revokeObjectURL(url);
      },
      'flutterExportar:pointerclick': () => {
        // Navigate to Flutter Export component
        this.router.navigate(['/flutter-export']);
      },
      'jsonImportar:pointerclick': () => {
        const entrada = document.createElement('input');
        entrada.type = 'file';
        entrada.accept = '.json';
        entrada.onchange = (event: any) => {
          const archivo = event.target.files[0];
          if (archivo) {
            const lector = new FileReader();
            lector.onload = (e) => {
              try {
                let jsonString = e.target!.result as string;
                // LOGIC : Convertir la cadena JSON a un objeto
                const json = JSON.parse(jsonString);

                // LOGIC : Modificar el valor del campo "text"
                const modifyTextFields = (obj: any) => {
                  for (const key in obj) {
                    if (typeof obj[key] === 'object' && obj[key] !== null) {
                      modifyTextFields(obj[key]);
                    } else if (key === 'text' && typeof obj[key] === 'string') {
                      obj[key] = obj[key].replace(/\\n/g, '\n');
                    }
                  }
                };

                modifyTextFields(json);

                this.graph.fromJSON(json);
                
                // Sincronizar con otros usuarios y guardar en BD
                if (this.onImportDiagram) {
                  this.onImportDiagram();
                }
              } catch (error) {
                console.error('Error al leer el archivo JSON:', error);
              }
            };
            lector.readAsText(archivo);
          }
        };
        entrada.click();
      },
      'xmlImportar:pointerclick': () => {
        const jsonJoint = this.graph.toJSON();
        let elementosClases: ElementoClase[] = [];
        let elementosLinks: ElementoLink[] = [];
        let linkOcupados: ElementoLink[] = [];
        let diagramElement: string[] = [];
        let connectorsXML: ConnectorXML[] = [];
        
        console.log(`ðŸ” EXPORTACIÃ“N XML - Total de cells: ${jsonJoint.cells.length}`);
        
        jsonJoint.cells.forEach((cell: any) => {
          console.log(`ðŸ” Cell tipo: ${cell.type}, id: ${cell.id}`);
          
          if (cell.type == 'standard.HeaderedRectangle') {
            console.log(`ðŸ“¦ Clase encontrada: ${cell.attrs.headerText.text}`);
            let elementoClase: ElementoClase = {
              titulo: cell.attrs.headerText.text,
              id: cell.id,
              posicion: [cell.position.x, cell.position.y],
              size: [cell.size.width, cell.size.height],
              atributos: this.convertirCadenaALista(
                cell.attrs.bodyText.textWrap.text
              ),
              metodos: this.convertirCadenaAMetodos(
                cell.attrs.bodyText.textWrap.text
              ),
              color: cell.attrs.body.stroke,
            };
            elementosClases.push(elementoClase);
          } else if (cell.type == 'app.Link' || cell.type == 'standard.Link') {
            let cabezeraOrigen: ElementoCabezera = {
              id: cell.source.id,
              tipo: cell.attrs?.line?.sourceMarker?.d ?? 'M 0 0 0 0',
              normal: this.tipoCabecera(cell.attrs?.line?.sourceMarker?.d),
            };

            let cabezeraDestino: ElementoCabezera = {
              id: cell.target.id,
              tipo: cell.attrs?.line?.targetMarker?.d ?? 'M 0 0 0 0',
              normal: this.tipoCabecera(cell.attrs?.line?.targetMarker?.d),
            };

            let elementoLink: ElementoLink = {
              id: cell.id,
              origen: cabezeraOrigen,
              destino: cabezeraDestino,
              atributos: cell.labels.map((label: any) => label.attrs.text.text),
            };
            elementosLinks.push(elementoLink);
          }
        });

        let cabezaXML = `<?xml version="1.0" encoding="windows-1252"?>
            <xmi:XMI xmlns:uml="http://www.omg.org/spec/UML/20131001"
            xmlns:xmi="http://www.omg.org/spec/XMI/20131001"
            xmlns:umldi="http://www.omg.org/spec/UML/20131001/UMLDI"
            xmlns:dc="http://www.omg.org/spec/UML/20131001/UMLDC">
            <xmi:Documentation exporter="Enterprise Architect" exporterVersion="6.5" />
            <uml:Model xmi:type="uml:Model" name="EA_Model">
        `;

        let connectors: string = '<connectors>';
        for (let elementoLink of elementosLinks) {
          // Verificar si el elementoLink ya estÃ¡ en linkOcupados
          if (linkOcupados.some((link) => link.id === elementoLink.id)) {
            continue; // Saltar a la siguiente iteraciÃ³n si el link ya estÃ¡ ocupado
          }
          
          // Verificar si es una asociaciÃ³n muchos-a-muchos (con clase intermedia)
          // Solo procesar como M:N si alguna de las clases conectadas tiene "_" en el nombre
          if (elementoLink.atributos.length == 1) {
            // Buscar las clases origen y destino
            const claseOrigen = elementosClases.find(c => c.id === elementoLink.origen.id);
            const claseDestino = elementosClases.find(c => c.id === elementoLink.destino.id);
            
            // Verificar si alguna es clase intermedia (contiene "_")
            const esAsociacionMuchosAMuchos = claseOrigen?.titulo.includes('_') || claseDestino?.titulo.includes('_');
            
            if (esAsociacionMuchosAMuchos) {
              // PROCESAR COMO ASOCIACIÃ“N MUCHOS-A-MUCHOS
              let idUnificado: string = uuidv4();

              // READ : CLASE_A LINK CLASE_A_B LINK CLASE_B
              // LOGIC : ALMACENA LA CLASE INTERMDIA AQUI
              let claseOxClaseI: ElementoClase[] = [];
              // LOGIC : FUNCION PARA BUSCAR SU OTRA MITAD
              claseOxClaseI = this.getC0andCI(elementoLink, elementosClases);

              // LOGIC : ALMACENA LA CLASE FINAL
              let claseF: ElementoClase;
              // LOGIC : FUNCION PARA BUSCAR LA CLASE FINAL
              claseF = this.getClaseFByName(claseOxClaseI, elementosClases);
              
              // Validar que la clase final sea diferente de la intermedia
              if (claseF.id === claseOxClaseI[1].id) {
                console.warn('No se encontrÃ³ la clase final para la asociaciÃ³n M:N, se omitirÃ¡');
                continue;
              }
              
              // LOGIC : PARA ALMACENAR Y BUSCAR EL LINK ENTRE LA INTERMDIA Y LA FINAL
              let linkTarget: ElementoLink;
              linkTarget = this.getLinkCIxClaseF(
                claseOxClaseI[1],
                claseF,
                elementosLinks
              );

              // Validar que se encontrÃ³ el linkTarget
              if (!linkTarget) {
                console.error('No se encontrÃ³ linkTarget para la clase intermedia:', claseOxClaseI[1].titulo, 'y clase final:', claseF.titulo);
                continue;
              }

            connectors += `
            	<connector xmi:idref="${idUnificado}">
                <source xmi:idref="${claseOxClaseI[0].id}">
                  <type multiplicity="${elementoLink.atributos[0]}" aggregation="none" containment="Unspecified" />
                </source>
                <target xmi:idref="${claseF.id}">
                  <type multiplicity="${linkTarget.atributos[0]}" aggregation="none" containment="Unspecified" />
                </target>
                <properties ea_type="Association" subtype="Class" direction="Unspecified" />
                <labels lb="${elementoLink.atributos[0]}" rb="${linkTarget.atributos[0]}" />
                <extendedProperties associationclass="${claseOxClaseI[1].id}" />
              </connector>
            `;

              linkOcupados.push(elementoLink);
              linkOcupados.push(linkTarget);
              diagramElement.push(idUnificado);
              connectorsXML.push({
                id: idUnificado,
                origen: claseOxClaseI[0].id,
                destino: claseF.id,
                destinoType: 'none',
                properties: 'Association',
                intermedia: claseOxClaseI[1].id,
              });
            } else {
              // PROCESAR COMO ASOCIACIÃ“N NORMAL (1 multiplicidad)
              connectors += `
              <connector xmi:idref="${elementoLink.id}">
                <source xmi:idref="${elementoLink.origen.id}">
                  <type multiplicity="${elementoLink.atributos[0]}" aggregation="none" containment="Unspecified" />
                </source>
                <target xmi:idref="${elementoLink.destino.id}">
                  <type multiplicity="" aggregation="none" containment="Unspecified" />
                </target>
                <properties ea_type="Association" direction="Unspecified" />
                <labels lb="${elementoLink.atributos[0]}" rb=""/>
                <extendedProperties />
              </connector>
              `;
              
              diagramElement.push(elementoLink.id);
              connectorsXML.push({
                id: elementoLink.id,
                origen: elementoLink.origen.id,
                destino: elementoLink.destino.id,
                destinoType: 'none',
                properties: 'Association',
                intermedia: '',
              });
            }
          } else {
            // Verificar COMPOSICION (puede estar en origen o destino)
            if (elementoLink.destino.normal == 'COMPOSICION' || elementoLink.origen.normal == 'COMPOSICION') {
              // Determinar en quÃ© lado estÃ¡ el diamante
              const compositEnSource = elementoLink.origen.normal == 'COMPOSICION';
              
              connectors += `
                <connector xmi:idref="${elementoLink.id}">
                  <source xmi:idref="${elementoLink.origen.id}">
                    <type multiplicity="${
                      elementoLink.atributos[0] ?? ''
                    }" aggregation="${compositEnSource ? 'composite' : 'none'}" containment="Unspecified" />
                  </source>
                  <target  xmi:idref="${elementoLink.destino.id}">
                    <type multiplicity="${
                      elementoLink.atributos[1] ?? ''
                    }" aggregation="${compositEnSource ? 'none' : 'composite'}" containment="Unspecified" />
                  </target>
                  <properties ea_type="Aggregation" />
                  <labels lb="${elementoLink.atributos[0] ?? ''}" rb="${
                elementoLink.atributos[1] ?? ''
              }"/>
                  <extendedProperties />
                </connector>
              `;

              connectorsXML.push({
                id: elementoLink.id,
                origen: elementoLink.origen.id,
                destino: elementoLink.destino.id,
                destinoType: 'composite',
                properties: 'Aggregation',
                intermedia: '',
              });
            }
            // Verificar AGREGACION
            else if (elementoLink.destino.normal == 'AGREGACION' || elementoLink.origen.normal == 'AGREGACION') {
              // Determinar en quÃ© lado estÃ¡ el diamante
              const sharedEnSource = elementoLink.origen.normal == 'AGREGACION';
              
              connectors += `
               <connector xmi:idref="${elementoLink.id}">
                  <source xmi:idref="${elementoLink.origen.id}">
                    <type multiplicity="${
                      elementoLink.atributos[0] ?? ''
                    }" aggregation="${sharedEnSource ? 'shared' : 'none'}" containment="Unspecified" />
                  </source>
                  <target  xmi:idref="${elementoLink.destino.id}">
                    <type multiplicity="${
                      elementoLink.atributos[1] ?? ''
                    }" aggregation="${sharedEnSource ? 'none' : 'shared'}" containment="Unspecified" />
                  </target>
                  <properties ea_type="Aggregation" />
                  <labels lb="${elementoLink.atributos[0] ?? ''}" rb="${
                elementoLink.atributos[1] ?? ''
              }"/>
                  <extendedProperties />
                </connector>
              `;

              connectorsXML.push({
                id: elementoLink.id,
                origen: elementoLink.origen.id,
                destino: elementoLink.destino.id,
                destinoType: 'shared',
                properties: 'Aggregation',
                intermedia: '',
              });
            }
            // Verificar HERENCIA
            else if (elementoLink.destino.normal == 'HERENCIA' || elementoLink.origen.normal == 'HERENCIA') {
              // Detectar si el marcador (triÃ¡ngulo) estÃ¡ en origen o destino
              const marcadorEnOrigen = elementoLink.origen.normal == 'HERENCIA';
              // Si marcador en origen: intercambiar source/target para que la flecha apunte correctamente
              const sourceId = marcadorEnOrigen ? elementoLink.destino.id : elementoLink.origen.id;
              const targetId = marcadorEnOrigen ? elementoLink.origen.id : elementoLink.destino.id;
              const sourceMultiplicity = marcadorEnOrigen ? (elementoLink.atributos[1] ?? '') : (elementoLink.atributos[0] ?? '');
              const targetMultiplicity = marcadorEnOrigen ? (elementoLink.atributos[0] ?? '') : (elementoLink.atributos[1] ?? '');
              
              connectors += `
              <connector xmi:idref="${elementoLink.id}">
                <source xmi:idref="${sourceId}">
                  <type multiplicity="${sourceMultiplicity}" aggregation="none" containment="Unspecified" />
                </source>
                <target  xmi:idref="${targetId}">
                  <type multiplicity="${targetMultiplicity}" aggregation="none" containment="Unspecified" />
                </target>
                <properties ea_type="Generalization"/>
                <labels lb="${sourceMultiplicity}" rb="${targetMultiplicity}"/>
        				<extendedProperties />
              </connector>
              `;

              connectorsXML.push({
                id: elementoLink.id,
                origen: elementoLink.origen.id,
                destino: elementoLink.destino.id,
                destinoType: 'none',
                properties: 'Generalization',
                intermedia: 'esG',
              });
            }
            // Verificar DEPENDENCIA
            else if (elementoLink.destino.normal == 'DEPENDENCIA' || elementoLink.origen.normal == 'DEPENDENCIA') {
              // Detectar si el marcador (flecha) estÃ¡ en origen o destino
              const marcadorEnOrigen = elementoLink.origen.normal == 'DEPENDENCIA';
              // Si marcador en origen: intercambiar source/target para que la flecha apunte correctamente
              const sourceId = marcadorEnOrigen ? elementoLink.destino.id : elementoLink.origen.id;
              const targetId = marcadorEnOrigen ? elementoLink.origen.id : elementoLink.destino.id;
              const sourceMultiplicity = marcadorEnOrigen ? (elementoLink.atributos[1] ?? '') : (elementoLink.atributos[0] ?? '');
              const targetMultiplicity = marcadorEnOrigen ? (elementoLink.atributos[0] ?? '') : (elementoLink.atributos[1] ?? '');
              
              connectors += `
                <connector xmi:idref="${elementoLink.id}">
                  <source xmi:idref="${sourceId}">
                    <type multiplicity="${sourceMultiplicity}" aggregation="none" containment="Unspecified" />
                  </source>
                  <target  xmi:idref="${targetId}">
                    <type multiplicity="${targetMultiplicity}" aggregation="none" containment="Unspecified" />
                  </target>
                  <properties ea_type="Dependency" direction="Unspecified" />
                  <labels lb="${sourceMultiplicity}" rb="${targetMultiplicity}"/>
                  <extendedProperties />
                </connector>
              `;

              connectorsXML.push({
                id: elementoLink.id,
                origen: elementoLink.origen.id,
                destino: elementoLink.destino.id,
                destinoType: 'none',
                properties: 'Dependency',
                intermedia: '',
              });
            }
            // Por defecto: ASOCIACION
            else if (elementoLink.destino.normal == 'ASOCIACION' || elementoLink.origen.normal == 'ASOCIACION') {
              // Detectar si el marcador (flecha) estÃ¡ en origen o destino
              const marcadorEnOrigen = elementoLink.origen.normal == 'ASOCIACION';
              // Si marcador en origen: intercambiar source/target para que la flecha apunte correctamente
              const sourceId = marcadorEnOrigen ? elementoLink.destino.id : elementoLink.origen.id;
              const targetId = marcadorEnOrigen ? elementoLink.origen.id : elementoLink.destino.id;
              const sourceMultiplicity = marcadorEnOrigen ? (elementoLink.atributos[1] ?? '') : (elementoLink.atributos[0] ?? '');
              const targetMultiplicity = marcadorEnOrigen ? (elementoLink.atributos[0] ?? '') : (elementoLink.atributos[1] ?? '');
              
              connectors += `
              <connector xmi:idref="${elementoLink.id}">
                <source xmi:idref="${sourceId}">
                  <type multiplicity="${sourceMultiplicity}" aggregation="none" containment="Unspecified" />
                </source>
                <target xmi:idref="${targetId}">
                  <type multiplicity="${targetMultiplicity}" aggregation="none" containment="Unspecified" />
                </target>
                <properties ea_type="Association" direction="Unspecified" />
                <labels lb="${sourceMultiplicity}" rb="${targetMultiplicity}"/>
      				  <extendedProperties />
              </connector>
              `;

              connectorsXML.push({
                id: elementoLink.id,
                origen: elementoLink.origen.id,
                destino: elementoLink.destino.id,
                destinoType: 'none',
                properties: 'Association',
                intermedia: '',
              });
            }

            diagramElement.push(elementoLink.id);
          }
        }
        connectors += `</connectors>`;

        let elements: string = '<elements>';
        for (let elementoClase of elementosClases) {
          elements += `
        <element xmi:idref="${elementoClase.id}" xmi:type="uml:Class" name="${elementoClase.titulo}"
				scope="public">
        <attributes>
         `;
          for (let atributo of elementoClase.atributos) {
            // Extraer nombre y tipo del atributo formato: -nombre:tipo
            const atributoPartes = atributo.titulo.replace(/^-/, '').split(':');
            const nombreAtributo = atributoPartes[0] || atributo.titulo;
            const tipoAtributo = atributoPartes[1] || 'String';
            
            elements += `
            <attribute xmi:idref="${atributo.id}" name="${nombreAtributo}" scope="Private">
						    <properties type="${tipoAtributo}" />
					  </attribute>
            `;
          }
          elements += `
          </attributes>
          <operations>
         `;
          // Exportar mÃ©todos
          if (elementoClase.metodos && elementoClase.metodos.length > 0) {
            for (let metodo of elementoClase.metodos) {
              elements += `
            <operation xmi:idref="${metodo.id}" name="${metodo.nombre}" scope="Public" />
              `;
            }
          }
          elements += `
          </operations>
          <links>
          `;
          for (let connector of connectorsXML) {
            if (
              elementoClase.id == connector.origen &&
              connector.properties == 'Association' &&
              connector.destinoType == 'none' &&
              connector.intermedia == ''
            ) {
              elements += `
            <Association xmi:id="${connector.id}"
						start="${connector.origen}" end="${connector.destino}" />
              `;
            }

            if (
              elementoClase.id == connector.origen &&
              connector.properties == 'Association' &&
              connector.destinoType == 'none' &&
              connector.intermedia != ''
            ) {
              elements += `
            <Association xmi:id="${connector.id}"
						start="${connector.origen}" end="${connector.destino}" />
              `;
            }

            if (
              elementoClase.id == connector.destino &&
              connector.properties == 'Aggregation' &&
              connector.destinoType == 'shared' &&
              connector.intermedia == ''
            ) {
              elements += `
            <Aggregation xmi:id="${connector.id}"
						start="${connector.origen}" end="${connector.destino}" />
              `;
            }

            if (
              elementoClase.id == connector.destino &&
              connector.properties == 'Aggregation' &&
              connector.destinoType == 'composite' &&
              connector.intermedia == ''
            ) {
              elements += `
            <Aggregation xmi:id="${connector.id}"
						start="${connector.origen}" end="${connector.destino}" />
              `;
            }

            if (
              elementoClase.id == connector.destino &&
              connector.properties == 'Dependency' &&
              connector.destinoType == 'none' &&
              connector.intermedia == ''
            ) {
              // LOG REMOVED
              elements += `
            <Dependency xmi:id="${connector.id}"
						start="${connector.origen}" end="${connector.destino}" />
              `;
            }
          }
          elements += `
          </links>
          </element>
          `;
        }
        elements += `
        </elements>
        `;

        let packagedElements: string = `<packagedElement xmi:type="uml:Package" xmi:id="carpetaPrincipal"
			name="Domain Objects">`;

        for (let elementoClase of elementosClases) {
          if (elementoClase.color == '#feb663') {
            packagedElements += `<packagedElement xmi:type="uml:AssociationClass" xmi:id="${elementoClase.id}" name="${elementoClase.titulo}">`;
          } else {
            packagedElements += `<packagedElement xmi:type="uml:Class" xmi:id="${elementoClase.id}" name="${elementoClase.titulo}">`;
          }

          for (let atributo of elementoClase.atributos) {
            packagedElements += `
            <ownedAttribute xmi:type="uml:Property" xmi:id="${atributo.id}" name="${atributo.titulo}">
				    </ownedAttribute>
            `;
          }

          for (let connector of connectorsXML) {
            if (
              elementoClase.id == connector.origen &&
              connector.destinoType == 'none' &&
              connector.properties == 'Generalization' &&
              connector.intermedia == 'esG'
            ) {
              packagedElements += `
                <generalization xmi:type="uml:Generalization"
                xmi:id="${connector.id}"
                general="${connector.destino}" />
              `;
            }
          }
          packagedElements += `</packagedElement>`;
        }
        packagedElements += `
          </packagedElement>
        `;

        let antepenultimo = `
        <diagrams>
        <diagram xmi:id="EAID_BAE75F5F_1D59_47c7_BAFB_1AEA07247773">
				<model package="carpetaPrincipal" localID="40"
				owner="carpetaPrincipal" />
				<properties name="Domain Objects" type="Logical" />
				<extendedProperties />
				<elements>
        `;
        for (let elementoClase of elementosClases) {
          antepenultimo += `
            <element
            geometry="Left=${elementoClase.posicion[0]};
            Top=${elementoClase.size[0]};
            Right=${elementoClase.posicion[1]};
            Bottom=${elementoClase.size[1]};"
            subject="${elementoClase.id}"
					/>
          `;
        }
        for (let elementoLink of diagramElement) {
          // Verificar si el elementoLink ya estÃ¡ en linkOcupados
          // if (linkOcupados.some((link) => link.id === elementoLink.id)) {
          //   continue; // Saltar a la siguiente iteraciÃ³n si el link ya estÃ¡ ocupado
          // }
          antepenultimo += `
            <element
            subject="${elementoLink}"
                      /> `;
        }
        let final: string = `
				</elements>
			  </diagram>
		    </diagrams>
	      </xmi:Extension>
        </xmi:XMI>
        `;

        //   let etapa1Inicio = `
        //   <packagedElement xmi:type="uml:Package" xmi:id="carpetaPrincipal" name="System">
        //  `;

        // READ : EXTENSION XML
        let etapa2Inicio = `
        </uml:Model>
        <xmi:Extension extender="Enterprise Architect" extenderID="6.5">`;

        cabezaXML +=
          // etapa1Inicio +
          packagedElements +
          etapa2Inicio +
          elements +
          connectors +
          antepenultimo +
          final;

        // Solicitar nombre del archivo al usuario
        const nombreArchivo = prompt('Ingrese el nombre del diagrama UML:', 'diagrama_uml');
        
        // Si el usuario cancela o no ingresa nombre, usar uno por defecto
        const nombreBase = nombreArchivo && nombreArchivo.trim() !== '' 
          ? nombreArchivo.trim() 
          : `diagrama_${uuidv4().slice(0, 6)}`;

        // Crear README con instrucciones
        const readmeContent = [
          `# ${nombreBase} - Diagrama UML 2.5`,
          '',
          'Este archivo XMI contiene un diagrama de clases UML 2.5 compatible con Enterprise Architect y otras herramientas de modelado.',
          '',
          '## Archivos Incluidos',
          '',
          `- \`${nombreBase}.xmi\` - Diagrama de clases en formato XMI 2.5`,
          '- `README.md` - Este archivo de instrucciones',
          '',
          '## CÃ³mo Abrir en Enterprise Architect',
          '',
          '### OpciÃ³n 1: Importar XMI',
          '1. Abre Enterprise Architect',
          '2. Menu: **File â†’ Import Model from XMI...**',
          '3. Selecciona el archivo `' + nombreBase + '.xmi`',
          '4. Elige el paquete destino o crea uno nuevo',
          '5. Click en **Import**',
          '',
          '### OpciÃ³n 2: Arrastrar y Soltar',
          '1. Abre Enterprise Architect',
          '2. En el **Project Browser**, selecciona el paquete donde quieres importar',
          '3. Arrastra el archivo `' + nombreBase + '.xmi` al Project Browser',
          '',
          '## CÃ³mo Abrir en la AplicaciÃ³n Web',
          '',
          '1. Ve a la aplicaciÃ³n web: http://localhost:4200',
          '2. Click en el botÃ³n **"Importar XML"** en la toolbar',
          '3. Selecciona el archivo `' + nombreBase + '.xmi`',
          '4. El diagrama se cargarÃ¡ automÃ¡ticamente',
          '',
          '## Especificaciones TÃ©cnicas',
          '',
          '- **Formato**: XMI 2.5 (XML Metadata Interchange)',
          '- **VersiÃ³n UML**: 2.5.1',
          '- **Compatibilidad**: Enterprise Architect 6.5+, Visual Paradigm, ArgoUML, StarUML',
          '- **Encoding**: windows-1252',
          '',
          '## Estructura del Diagrama',
          '',
          '### Clases',
          '- Cada clase tiene un ID Ãºnico (XMI)',
          '- Atributos con visibilidad UML 2.5 (+, -, #, ~)',
          '- MÃ©todos con parÃ¡metros y tipos de retorno',
          '',
          '### Relaciones',
          '- **AsociaciÃ³n**: RelaciÃ³n estÃ¡ndar entre clases',
          '- **ComposiciÃ³n**: AgregaciÃ³n fuerte (diamante relleno)',
          '- **AgregaciÃ³n**: AgregaciÃ³n dÃ©bil (diamante vacÃ­o)',
          '- **Herencia**: GeneralizaciÃ³n (flecha vacÃ­a)',
          '- **Dependencia**: RelaciÃ³n de uso (flecha punteada)',
          '',
          '### Cardinalidad',
          '- Se especifica en ambos extremos de las relaciones',
          '- Formato: `0..1`, `1..1`, `0..*`, `1..*`, etc.',
          '',
          '## Notas Importantes',
          '',
          '- Las **clases intermedias** (relaciones N:M) se identifican con guiÃ³n bajo en el nombre',
          '- Las **coordenadas** de posiciÃ³n se preservan en el elemento `<diagram>`',
          '- Los **colores** de las clases se mantienen en el atributo `color`',
          '',
          '## SoluciÃ³n de Problemas',
          '',
          '### "No se puede importar el archivo"',
          '- Verifica que el archivo no estÃ© corrupto',
          '- AsegÃºrate de tener Enterprise Architect 6.5 o superior',
          '- Intenta abrirlo con un editor de texto para validar el XML',
          '',
          '### "Las relaciones no se muestran correctamente"',
          '- Verifica que todas las clases referenciadas existan',
          '- Revisa que los IDs de origen y destino coincidan',
          '',
          '### "Los atributos aparecen vacÃ­os"',
          '- El formato original usa `name:type` separado por dos puntos',
          '- Algunos editores pueden requerir formato diferente',
          '',
          '## MÃ¡s InformaciÃ³n',
          '',
          '- DocumentaciÃ³n UML 2.5: https://www.omg.org/spec/UML/2.5.1',
          '- XMI Specification: https://www.omg.org/spec/XMI/2.5.1',
          '- Enterprise Architect: https://sparxsystems.com',
          '',
          '---',
          `Generado el ${new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`,
        ].join('\n');

        // Crear ZIP con XMI y README
        const zip = new JSZip();
        zip.file(`${nombreBase}.xmi`, cabezaXML);
        zip.file('README.md', readmeContent);

        // Generar y descargar ZIP
        zip.generateAsync({ type: 'blob' }).then((content) => {
          saveAs(content, `${nombreBase}-uml.zip`);
          console.log('âœ… Diagrama UML exportado:', `${nombreBase}-uml.zip`);
          alert(`Â¡Diagrama exportado exitosamente!\n\nArchivo: ${nombreBase}-uml.zip\n\nContiene:\n- ${nombreBase}.xmi (diagrama UML 2.5)\n- README.md (instrucciones de uso)`);
        });
      },

      'grid-size:change': this.paper.setGridSize.bind(this.paper),
    });

    this.renderPlugin('.toolbar-container', this.toolbarService.toolbar);
  }

  tipoCabeceraInversa(descripcion: string): string {
    const mapaInverso: { [key: string]: string } = {
      ASOCIACION: 'M 0 0 0 0',
      COMPOSICION: 'M -10 0 0 10 10 0 0 -10 z',
      AGREGACION: 'M 0 -10 15 0 0 10 z',
      HERENCIA: 'M 0 -10 -15 0 0 10 z',
      DEPENDENCIA:
        'M 0 -10 L 2.94 -3.09 L 9.51 -3.09 L 4.29 1.18 L 6.18 8.09 L 0 5 L -6.18 8.09 L -4.29 1.18 L -9.51 -3.09 L -2.94 -3.09 Z',
    };

    return mapaInverso[descripcion] || 'M 0 0 0 0';
  }

  generarServicio(nombreClase: string, jpaClass: ClassJPA): string {
    const parsearAtributos = (jpaClass: string) => {
      const simples: string[] = [];
      const lines = jpaClass.split('\n');

      for (let line of lines) {
        line = line.trim();

        // Detectar atributos simples
        if (
          line.startsWith('private') &&
          !line.includes('id') && // Excluir el atributo id
          (line.includes('String') ||
            line.includes('Long') ||
            line.includes('int') ||
            line.includes('boolean') ||
            line.includes('LocalDate') ||
            line.includes('BigDecimal') ||
            line.includes('Date') ||
            line.includes('Time') ||
            line.includes('Timestamp') ||
            line.includes('LocalDateTime') ||
            line.includes('LocalTime') ||
            line.includes('Double') ||
            line.includes('Float'))
        ) {
          const parts = line.split(' ');
          const nombre = parts[2].replace(';', '');
          simples.push(nombre.charAt(0).toUpperCase() + nombre.slice(1));
        }
      }

      return { simples };
    };

    const { simples } = parsearAtributos(jpaClass.contenido);

    return `package com.proyecto.servicios;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.proyecto.modelos.${nombreClase};
import com.proyecto.repositorios.${nombreClase}Repositorio;

import java.util.List;
import java.util.Optional;

@Service
public class ${nombreClase}Servicio {

    @Autowired
    private ${nombreClase}Repositorio repositorio;

    public List<${nombreClase}> listar() {
        return repositorio.findAll();
    }

    public ${nombreClase} obtenerPorId(Long id) {
        return repositorio.findById(id).orElse(null);
    }

    @Transactional
    public String guardar(${nombreClase} ${nombreClase.toLowerCase()}) {
        try {
            repositorio.save(${nombreClase.toLowerCase()});
            return "${nombreClase} guardado con Ã©xito.";
        } catch (Exception e) {
            // Manejar la excepciÃ³n y retornar un mensaje de error
            return "Error al guardar ${nombreClase}: " + e.getMessage();
        }
    }

    @Transactional
    public String actualizar(Long id, ${nombreClase} ${nombreClase.toLowerCase()}) {
        if (repositorio.existsById(id)) {
            Optional<${nombreClase}> optionalObjetoExistente = repositorio.findById(id);

            if (optionalObjetoExistente.isPresent()) {
                ${nombreClase} objetoExistente = optionalObjetoExistente.get();
                // Actualizar atributos simples
                ${simples
                  .map(
                    (attr) =>
                      `objetoExistente.set${
                        attr.charAt(0).toUpperCase() + attr.slice(1)
                      }(${nombreClase.toLowerCase()}.get${
                        attr.charAt(0).toUpperCase() + attr.slice(1)
                      }());`
                  )
                  .join('\n                ')}

                // Actualizar relaciones ManyToOne
                // Actualizar relaciones OneToOne
                // Actualizar relaciones ManyToMany
                // Actualizar relaciones OneToMany
                ${jpaClass.attrsEspeciales
                  .map(
                    (attr) =>
                      `objetoExistente.set${
                        attr.charAt(0).toUpperCase() + attr.slice(1)
                      }(${nombreClase.toLowerCase()}.get${
                        attr.charAt(0).toUpperCase() + attr.slice(1)
                      }());`
                  )
                  .join('\n                ')}

                repositorio.save(objetoExistente);
                return "${nombreClase} actualizado con Ã©xito.";
            } else {
                return "${nombreClase} no encontrado.";
            }
        } else {
            return "${nombreClase} no encontrado.";
        }
    }

    @Transactional
    public String eliminar(Long id) {
        if (repositorio.existsById(id)) {
            try {
                repositorio.deleteById(id);
                return "${nombreClase} eliminado con Ã©xito.";
            } catch (Exception e) {
                // Manejar la excepciÃ³n y retornar un mensaje de error
                return "Error al eliminar ${nombreClase}: " + e.getMessage();
            }
        } else {
            return "${nombreClase} no encontrado.";
        }
    }
}
`;
  }

  // Generar controlador
  generarControlador(nombreClase: string): string {
    const nombrePlural = pluralize(nombreClase.toLowerCase());
    return `package com.proyecto.controladores;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.proyecto.modelos.${nombreClase};
import com.proyecto.servicios.${nombreClase}Servicio;

import java.util.List;

@RestController
@RequestMapping("/api/${nombrePlural}")
@CrossOrigin(origins = "*")
public class ${nombreClase}Controlador {

@Autowired
private ${nombreClase}Servicio servicio;

@GetMapping
public List<${nombreClase}> listar() {
    return servicio.listar();
}

@GetMapping("/{id}")
public ResponseEntity<${nombreClase}> obtenerPorId(@PathVariable Long id) {
    ${nombreClase} ${nombreClase.toLowerCase()} = servicio.obtenerPorId(id);
    return ${nombreClase.toLowerCase()} != null ? ResponseEntity.ok(${nombreClase.toLowerCase()}) : ResponseEntity.notFound().build();
}

@PostMapping
public ResponseEntity<String> guardar(@RequestBody ${nombreClase} ${nombreClase.toLowerCase()}) {
    String respuesta = servicio.guardar(${nombreClase.toLowerCase()});
    return ResponseEntity.ok(respuesta);
}

@PutMapping("/{id}")
public ResponseEntity<String> actualizar(@PathVariable Long id, @RequestBody ${nombreClase} ${nombreClase.toLowerCase()}) {
    String respuesta = servicio.actualizar(id, ${nombreClase.toLowerCase()});
    return ResponseEntity.ok(respuesta);
}

@DeleteMapping("/{id}")
public ResponseEntity<String> eliminar(@PathVariable Long id) {
    String respuesta = servicio.eliminar(id);
    return ResponseEntity.ok(respuesta);
}
}
`;
  }

  // Generar repositorio
  generarRepositorio(nombreClase: string): string {
    return `package com.proyecto.repositorios;

import org.springframework.data.jpa.repository.JpaRepository;
import com.proyecto.modelos.${nombreClase};

public interface ${nombreClase}Repositorio extends JpaRepository<${nombreClase}, Long> {
}
`;
  }

  // MÃ©todo para extraer el nombre de la clase JPA
  extraerNombreClase(claseJPA: string): string {
    const nombreClaseRegex = /public class (\w+)/;
    const resultado = claseJPA.match(nombreClaseRegex);
    return resultado ? resultado[1] : 'ClaseDesconocida';
  }

  capitalizeFirstLetter(str: string): string {
    if (!str) return str;
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  relacionesClaseJPA(
    elementoClase1: ElementoClase,
    link: ElementoLink,
    elementoClase2: ElementoClase,
    posicion: string,
    ticketsOneToOne: TicketOneToOne[],
    atributosEspeciales: string[]
  ): [string, TicketOneToOne[], string[]] {
    let respuesta: string = '';
    const cardinalidad: string =
      posicion == 'origen' ? link.atributos[1] : link.atributos[0];

    if (
      (link.atributos[0] == '0...1' && link.atributos[1] == '0...1') ||
      (link.atributos[0] == '1...1' && link.atributos[1] == '1...1') ||
      (link.atributos[0] == '0...1' && link.atributos[1] == '1...1') ||
      (link.atributos[0] == '1...1' && link.atributos[1] == '0...1')
    ) {
      // LOGIC : DEBE CUMPLIR ESTA CARDINALIDAD PARA OneToOne
      // LOGIC : VERIFICA SI SE ENCUENTRA O EXISTE
      if (!ticketsOneToOne.some((ticket) => ticket.linkOneToOne == link)) {
        if (link.origen.id == elementoClase1.id) {
          // LOGIC : CUANDO LA CLASE JPA CONTRUCCION ESTA EN EL ORIGEN
          let cardinalidaBase: string = link.atributos[1];
          respuesta = `
          @OneToOne(cascade = CascadeType.ALL)
          @JoinColumn(name = "id_${elementoClase2.titulo.toLowerCase()}", nullable = ${
            cardinalidaBase.includes('0') ? 'true' : 'false'
          })
          private ${
            elementoClase2.titulo
          } ${elementoClase2.titulo.toLowerCase()};`;
          let ticketOneToOne: TicketOneToOne = {
            linkOneToOne: link,
            origenStatus: 1,
            destinoStatus: 0,
          };
          ticketsOneToOne.push(ticketOneToOne);
          atributosEspeciales.push(
            this.capitalizeFirstLetter(elementoClase2.titulo.toLowerCase())
          );
          return [respuesta, ticketsOneToOne, atributosEspeciales];
        } else {
          // LOGIC : CUANDO LA CLASE JPA CONTRUCCION ESTA EN EL DESTINO
          let cardinalidaBase: string = link.atributos[0];
          respuesta = `
          @OneToOne(mappedBy = "${elementoClase1.titulo.toLowerCase()}" ${
            cardinalidaBase.includes('0') ? ', optional = true' : ''
          })
          private ${
            elementoClase2.titulo
          } ${elementoClase2.titulo.toLowerCase()};`;
          let ticketOneToOne: TicketOneToOne = {
            linkOneToOne: link,
            origenStatus: 0,
            destinoStatus: 1,
          };
          ticketsOneToOne.push(ticketOneToOne);
          atributosEspeciales.push(
            this.capitalizeFirstLetter(elementoClase2.titulo.toLowerCase())
          );
          return [respuesta, ticketsOneToOne, atributosEspeciales];
        }
      } else {
        // LOGIC : PRIMERO VA VERIFICAR SI TICKET ES VALIDO PARA OneToOne VERIFICA SI CUMPLIO SU CICLO
        let ticketTrabajo: TicketOneToOne = ticketsOneToOne.find(
          (ticket) => ticket.linkOneToOne == link
        )!;
        let index = ticketsOneToOne.findIndex(
          (ticket) => ticket.linkOneToOne == link
        );
        if (
          ticketTrabajo.origenStatus == 1 &&
          ticketTrabajo.destinoStatus == 1
        ) {
          return [respuesta, ticketsOneToOne, atributosEspeciales];
        }

        // LOGIC : SI ESTA EN LA LISTA PERO FALTA TRABAJARLO
        if (ticketTrabajo.linkOneToOne.origen.id == elementoClase1.id) {
          let cardinalidaBase: string = link.atributos[1];
          respuesta = `
          @OneToOne(cascade = CascadeType.ALL)
          @JoinColumn(name = "id_${elementoClase2.titulo.toLowerCase()}", nullable = ${
            cardinalidaBase.includes('0') ? 'true' : 'false'
          })
          private ${
            elementoClase2.titulo
          } ${elementoClase2.titulo.toLowerCase()};`;
          ticketsOneToOne[index] = {
            ...ticketsOneToOne[index],
            origenStatus: 1,
          };
          atributosEspeciales.push(
            this.capitalizeFirstLetter(elementoClase2.titulo.toLowerCase())
          );
          return [respuesta, ticketsOneToOne, atributosEspeciales];
        } else {
          let cardinalidaBase: string = link.atributos[0];
          // LOGIC : CUANDO LA CLASE JPA CONTRUCCION ESTA EN EL DESTINO
          respuesta = `
          @OneToOne(mappedBy = "${elementoClase1.titulo.toLowerCase()}" ${
            cardinalidaBase.includes('0') ? ', optional = true' : ''
          })
          private ${
            elementoClase2.titulo
          } ${elementoClase2.titulo.toLowerCase()};`;
          ticketsOneToOne[index] = {
            ...ticketsOneToOne[index],
            destinoStatus: 1,
          };
          atributosEspeciales.push(
            this.capitalizeFirstLetter(elementoClase2.titulo.toLowerCase())
          );
          return [respuesta, ticketsOneToOne, atributosEspeciales];
        }
      }
    }

    if (
      cardinalidad == '0...1' ||
      cardinalidad == '1...1' ||
      cardinalidad == '1...0'
    ) {
      respuesta = `
      @ManyToOne
      @JoinColumn(name = "id_${elementoClase2.titulo.toLowerCase()}", nullable = ${
        cardinalidad.includes('0') ? 'true' : 'false'
      })
      private ${elementoClase2.titulo} ${elementoClase2.titulo.toLowerCase()};`;
      atributosEspeciales.push(
        this.capitalizeFirstLetter(elementoClase2.titulo.toLowerCase())
      );
      return [respuesta, ticketsOneToOne, atributosEspeciales];
    }

    if (
      cardinalidad == '0...*' ||
      cardinalidad == '1...*' ||
      cardinalidad == '*...0' ||
      cardinalidad == '*...1'
    ) {
      respuesta = `
      @OneToMany(mappedBy = "${elementoClase1.titulo.toLowerCase()}")
      private List<${elementoClase2.titulo}> ${pluralize(
        elementoClase2.titulo.toLowerCase()
      )};`;
      atributosEspeciales.push(
        this.capitalizeFirstLetter(
          pluralize(elementoClase2.titulo.toLowerCase())
        )
      );
      return [respuesta, ticketsOneToOne, atributosEspeciales];
    }
    return [respuesta, ticketsOneToOne, atributosEspeciales];
  }

  parsearAtributo(atributo: string): AtributosSB {
    // Formato UML 2.5: [+|-|#|~] nombre : tipo
    const atributoTrim = atributo.trim();
    
    // Remover sÃ­mbolos de visibilidad (+, -, #, ~)
    const sinVisibilidad = atributoTrim.replace(/^[+\-#~]\s*/, '');
    
    // Separar nombre y tipo por :
    const partes = sinVisibilidad.split(':');
    
    if (partes.length < 2) {
      // Si no tiene formato correcto, retornar con tipo String
      return new AtributosSB(sinVisibilidad.trim(), 'String');
    }
    
    const nombre = partes[0].trim();
    const tipoUML = partes[1].trim();
    
    // Convertir tipo UML a tipo Java
    const tipoJava = this.convertirTipoUMLATipoJava(tipoUML);
    
    return new AtributosSB(nombre, tipoJava);
  }

  convertirTipoUMLATipoJava(tipoUML: string): string {
    // Mapeo de tipos UML/PostgreSQL a tipos Java
    const mapeoTipos: { [key: string]: string } = {
      // Tipos UML 2.5
      'Integer': 'Long',
      'String': 'String',
      'Boolean': 'Boolean',
      'Double': 'Double',
      'Float': 'Float',
      'Date': 'LocalDate',
      'DateTime': 'LocalDateTime',
      'Long': 'Long',
      'Object': 'Object',
      
      // Tipos PostgreSQL (compatibilidad)
      'integer': 'Long',
      'serial': 'Long',
      'bigint': 'Long',
      'smallint': 'Long',
      'numeric': 'BigDecimal',
      'decimal': 'BigDecimal',
      'double': 'double',
      'real': 'Float',
      'char': 'String',
      'varchar': 'String',
      'text': 'String',
      'boolean': 'Boolean',
      'date': 'LocalDate',
      'timestamp': 'LocalDateTime',
    };
    
    return mapeoTipos[tipoUML] || 'String';
  }

  encontrarClaseTrabajo(
    tipo: string,
    elementoLink: ElementoLink,
    elementosClases: ElementoClase[]
  ): ElementoClase {
    for (let clase of elementosClases) {
      if (tipo == 'origen' && clase.id == elementoLink.destino.id) {
        return clase;
      } else if (tipo == 'destino' && clase.id == elementoLink.origen.id) {
        return clase;
      }
    }
    // Si no se encuentra la clase, devolver el primer elemento como fallback
    return elementosClases[0];
  }

  applyOnSelection(method: string) {
    this.graph.startBatch('selection');
    this.selection.collection.models.forEach(function (model: joint.dia.Cell) {
      (model as any)[method]();
    });
    this.graph.stopBatch('selection');
  }

  changeSnapLines(checked: boolean) {
    if (checked) {
      this.snaplines.enable();
    } else {
      this.snaplines.disable();
    }
  }

  initializeKeyboardShortcuts() {
    this.keyboardService.create(
      this.graph,
      this.clipboard,
      this.selection,
      this.paperScroller,
      this.commandManager
    );
  }

  initializeTooltips(): joint.ui.Tooltip {
    return new joint.ui.Tooltip({
      rootTarget: document.body,
      target: '[data-tooltip]',
      direction: joint.ui.Tooltip.TooltipArrowPosition.Auto,
      padding: 10,
    });
  }

  openAsSVG() {
    this.paper.hideTools();
    joint.format.toSVG(
      this.paper,
      (svg: string) => {
        new joint.ui.Lightbox({
          image: 'data:image/svg+xml,' + encodeURIComponent(svg),
          downloadable: true,
          fileName: 'Rappid',
        }).open();
        this.paper.showTools();
      },
      {
        preserveDimensions: true,
        convertImagesToDataUris: true,
        useComputedStyles: false,
        grid: true,
      }
    );
  }

  openAsPNG() {
    this.paper.hideTools();
    joint.format.toPNG(
      this.paper,
      (dataURL: string) => {
        new joint.ui.Lightbox({
          image: dataURL,
          downloadable: true,
          fileName: 'Rappid',
        }).open();
        this.paper.showTools();
      },
      {
        padding: 10,
        useComputedStyles: false,
        grid: true,
      }
    );
  }

  layoutDirectedGraph() {
    DirectedGraph.layout(this.graph, {
      setVertices: true,
      rankDir: 'TB',
      marginX: 100,
      marginY: 100,
    });

    this.paperScroller.centerContent({ useModelGeometry: true });
  }

  renderPlugin(selector: string, plugin: any): void {
    this.el.querySelector(selector)!.appendChild(plugin.el);
    plugin.render();
  }
}

export default KitchenSinkService;
