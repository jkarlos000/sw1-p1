# Editor UML 2.5 - Guía de Uso

## 📋 ¿Qué se ha implementado?

He creado un **Editor Visual UML 2.5** completo que permite gestionar clases con:

✅ **Atributos con:**
- Modificadores de visibilidad (`+` `-` `#` `~`)
- Tipos de datos (String, Integer, Boolean, etc.)
- Valores por defecto opcionales
- Vista previa en formato UML 2.5

✅ **Métodos con:**
- Modificadores de visibilidad (`+` `-` `#` `~`)
- Parámetros múltiples (cada uno con nombre y tipo)
- Tipos de retorno (void, String, Integer, etc.)
- Vista previa en formato UML 2.5

## 🎨 Componente Creado

### `UmlClassEditorComponent`

**Ubicación:** `src/app/diagramador/components/uml-class-editor.component.ts`

**Características:**
- ✅ UI moderna con tema oscuro
- ✅ Editor inline para atributos y métodos
- ✅ Selectores dropdown para visibilidad y tipos
- ✅ Panel expandible para gestionar parámetros de métodos
- ✅ Vista previa en tiempo real del formato UML 2.5
- ✅ Botones para agregar/eliminar elementos
- ✅ Emite eventos de cambio para sincronizar con el diagrama

## 🚀 Cómo Integrarlo

### Paso 1: Importar el Componente

En tu archivo donde quieras usar el editor (por ejemplo, `diagramador.component.ts` o en un modal):

```typescript
import { UmlClassEditorComponent } from './components/uml-class-editor.component';

@Component({
  // ...
  imports: [
    // ... otros imports
    UmlClassEditorComponent
  ]
})
```

### Paso 2: Usar en el Template

```html
<!-- En tu HTML -->
<app-uml-class-editor
  [atributos]="claseSeleccionada.atributos"
  [metodos]="claseSeleccionada.metodos"
  (cambio)="onClaseEditada($event)">
</app-uml-class-editor>
```

### Paso 3: Manejar Cambios

```typescript
onClaseEditada(cambio: { atributos: AtributoClase[], metodos: MetodoClase[] }) {
  // Actualizar la clase en el diagrama
  claseSeleccionada.atributos = cambio.atributos;
  claseSeleccionada.metodos = cambio.metodos;
  
  // Actualizar el texto visual de la clase
  actualizarTextoClase(claseSeleccionada);
}
```

## 📐 Actualizar el Renderizado de Clases

Ahora necesitas modificar cómo se muestra el texto en las clases del diagrama para incluir los métodos.

### Opción 1: Actualizar en `kitchensink.service.ts`

Busca donde se crea/actualiza el texto de las clases y usa la función de formateo:

```typescript
import { generarTextoClaseUML } from '../utils/uml-formatter';

// Cuando se actualiza una clase:
const textoClase = generarTextoClaseUML(clase.atributos, clase.metodos);

// Actualizar el elemento visual:
cell.attr('label/text', textoClase);
```

### Opción 2: Modificar el Inspector Tradicional

Si quieres mantener el inspector actual de JointJS pero agregar soporte para métodos, puedes:

1. Agregar un campo personalizado en `inspector.service.ts`:

```typescript
'app.RectangularModel': {
  inputs: {
    // ... inputs existentes
    
    // 🆕 Campo de métodos
    metodos: {
      type: 'list',
      label: 'Métodos UML',
      group: 'uml',
      item: {
        type: 'object',
        properties: {
          nombre: { type: 'text', label: 'Nombre' },
          visibility: { 
            type: 'select-box',
            options: options.visibilityModifier,
            label: 'Visibilidad'
          },
          tipoRetorno: {
            type: 'select-box',
            options: options.dataTypes,
            label: 'Tipo Retorno'
          }
        }
      }
    }
  },
  groups: {
    // ... grupos existentes
    uml: {
      label: 'UML 2.5',
      index: 6
    }
  }
}
```

## 🎯 Integración Completa Sugerida

### Crear un Modal/Panel para Editar Clases

```typescript
// diagrama-class-editor.component.ts
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UmlClassEditorComponent } from './uml-class-editor.component';

@Component({
  selector: 'app-diagrama-class-editor',
  standalone: true,
  imports: [CommonModule, UmlClassEditorComponent],
  template: `
    <div class="modal-overlay" *ngIf="visible" (click)="cerrar()">
      <div class="modal-content" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h2>Editar Clase: {{ nombreClase }}</h2>
          <button (click)="cerrar()">✕</button>
        </div>

        <div class="modal-body">
          <div class="class-name-editor">
            <label>Nombre de la Clase:</label>
            <input [(ngModel)]="nombreClase" (input)="onNombreCambio()" />
          </div>

          <app-uml-class-editor
            [atributos]="atributos"
            [metodos]="metodos"
            (cambio)="onCambio($event)">
          </app-uml-class-editor>
        </div>

        <div class="modal-footer">
          <button class="btn-cancel" (click)="cerrar()">Cancelar</button>
          <button class="btn-save" (click)="guardar()">Guardar</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.7);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }

    .modal-content {
      background: #1e1e1e;
      border-radius: 8px;
      width: 90%;
      max-width: 800px;
      max-height: 90vh;
      display: flex;
      flex-direction: column;
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px;
      border-bottom: 1px solid #333;
    }

    .modal-header h2 {
      color: #31d0c6;
      margin: 0;
    }

    .modal-header button {
      background: none;
      border: none;
      color: #fff;
      font-size: 24px;
      cursor: pointer;
    }

    .modal-body {
      flex: 1;
      overflow-y: auto;
      padding: 20px;
    }

    .class-name-editor {
      margin-bottom: 20px;
    }

    .class-name-editor label {
      display: block;
      color: #e0e0e0;
      margin-bottom: 8px;
      font-weight: 600;
    }

    .class-name-editor input {
      width: 100%;
      background: #2a2a2a;
      color: #e0e0e0;
      border: 1px solid #555;
      padding: 10px;
      border-radius: 4px;
      font-size: 16px;
      font-family: 'Courier New', monospace;
    }

    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      padding: 20px;
      border-top: 1px solid #333;
    }

    .btn-cancel, .btn-save {
      padding: 10px 20px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-weight: 600;
    }

    .btn-cancel {
      background: #555;
      color: #fff;
    }

    .btn-save {
      background: #31d0c6;
      color: #fff;
    }
  `]
})
export class DiagramaClassEditorComponent {
  @Input() visible = false;
  @Input() nombreClase = '';
  @Input() atributos: AtributoClase[] = [];
  @Input() metodos: MetodoClase[] = [];
  
  @Output() guardarCambios = new EventEmitter<any>();
  @Output() cerrarEditor = new EventEmitter<void>();

  onCambio(cambio: any) {
    this.atributos = cambio.atributos;
    this.metodos = cambio.metodos;
  }

  onNombreCambio() {
    // Emitir cambio de nombre si es necesario
  }

  guardar() {
    this.guardarCambios.emit({
      nombre: this.nombreClase,
      atributos: this.atributos,
      metodos: this.metodos
    });
  }

  cerrar() {
    this.cerrarEditor.emit();
  }
}
```

### Usar el Modal en el Diagramador

```typescript
// En diagramador.component.ts
export class DiagramadorComponent {
  // ...
  mostrarEditorClase = false;
  claseEnEdicion: any = null;

  // Detectar doble clic en una clase
  onCellDoubleClick(cell: any) {
    if (cell.get('type') === 'app.RectangularModel') {
      this.claseEnEdicion = {
        cell: cell,
        nombre: cell.attr('label/text').split('\n')[0],
        atributos: this.extraerAtributos(cell),
        metodos: this.extraerMetodos(cell)
      };
      this.mostrarEditorClase = true;
    }
  }

  guardarCambiosClase(cambios: any) {
    const cell = this.claseEnEdicion.cell;
    
    // Actualizar nombre
    // Actualizar atributos y métodos
    const textoCompleto = generarTextoClaseUML(cambios.atributos, cambios.metodos);
    cell.attr('label/text', `${cambios.nombre}\n─────\n${textoCompleto}`);
    
    // Cerrar modal
    this.mostrarEditorClase = false;
    this.claseEnEdicion = null;
  }
}
```

## 🎨 Captura de Pantalla del Editor

El editor tiene:

```
┌─────────────────────────────────────────┐
│ 📋 Atributos              [+ Nuevo]     │
├─────────────────────────────────────────┤
│ [- Private] nombre  : [String]     [🗑️] │
│ Valor por defecto: ________            │
│ Preview: - nombre : String             │
│                                         │
│ [- Private] edad    : [Integer]    [🗑️] │
│ Valor por defecto: 0                   │
│ Preview: - edad : Integer = 0          │
├─────────────────────────────────────────┤
│ ⚙️ Métodos                [+ Nuevo]     │
├─────────────────────────────────────────┤
│ [+ Public] getNombre [() Params] : [String] [🗑️] │
│ Preview: + getNombre() : String        │
│                                         │
│ [+ Public] setNombre [() Params] : [void] [🗑️]   │
│   ┌─ Parámetros ──────── [+ Param]    │
│   │ nombre : String            [×]    │
│   └──────────────────────────────────  │
│ Preview: + setNombre(nombre:String):void│
└─────────────────────────────────────────┘
```

## ✅ Checklist de Integración

- [x] Componente UmlClassEditorComponent creado
- [x] Utilidades de formateo UML 2.5 disponibles
- [x] Interfaces actualizadas con métodos y visibilidad
- [ ] Integrar editor en el diagramador (doble clic o botón)
- [ ] Actualizar renderizado de clases para mostrar métodos
- [ ] Sincronizar cambios del editor con el grafo de JointJS
- [ ] Probar con Claude para análisis de diagramas
- [ ] Exportar/Importar clases con métodos

## 🔄 Próximos Pasos

1. **Integrar el editor**: Crear el modal o panel donde se usará el componente
2. **Actualizar visualización**: Modificar cómo se renderiza el texto en las clases
3. **Sincronización bidireccional**: Asegurar que los cambios se reflejen en el diagrama
4. **Persistencia**: Guardar/cargar clases con métodos desde/hacia el backend
5. **Integración con Claude**: Usar los prompts de `claude-uml.service.ts` para análisis

## 💡 Ejemplo de Uso Completo

```typescript
// 1. Usuario hace doble clic en una clase
onCellDoubleClick(cell) {
  // Abrir editor con datos actuales
  this.abrirEditorClase(cell);
}

// 2. Editor permite modificar atributos y métodos
// (El componente UmlClassEditorComponent maneja la UI)

// 3. Usuario guarda cambios
guardarCambios(cambios) {
  // Actualizar modelo de datos
  clase.atributos = cambios.atributos;
  clase.metodos = cambios.metodos;
  
  // Actualizar visualización
  const textoUML = generarTextoClaseUML(cambios.atributos, cambios.metodos);
  cell.attr('label/text', textoUML);
  
  // Sincronizar con backend
  this.diagramadorService.actualizarClase(clase);
}

// 4. Enviar a Claude para análisis
async analizarConClaude() {
  const prompt = generarPromptUMLParaClaude(todasLasClases, relaciones);
  const respuesta = await this.chatIaService.enviarMensaje(prompt);
  // Claude responderá con sugerencias de mejora
}
```

---

**Autor:** Jkarlos  
**Fecha:** 2026  
**Versión:** 1.0
