import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AtributoClase, MetodoClase, ParametroMetodo, VisibilityModifier } from '../interfaces/jsonJoint.interface';
import { formatearAtributoUML, formatearMetodoUML } from '../utils/uml-formatter';

/**
 * Editor UML 2.5 para Atributos y Métodos
 * Permite agregar/editar atributos y métodos con visibilidad, tipos y parámetros
 * 
 * @author Jkarlos
 * @date 2026
 */

@Component({
  selector: 'app-uml-class-editor',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="uml-editor">
      <!-- Sección de Atributos -->
      <div class="uml-section">
        <h3 class="uml-section-title">
          <span>📋 Atributos</span>
          <button class="btn-add" (click)="agregarAtributo()">+ Nuevo</button>
        </h3>

        <div class="uml-items">
          @for (atributo of atributos; track atributo.id) {
            <div class="uml-item">
              <div class="uml-item-header">
                <select 
                  [(ngModel)]="atributo.visibility" 
                  class="visibility-select"
                  (change)="emitirCambio()">
                  <option value="public">+ Public</option>
                  <option value="private">- Private</option>
                  <option value="protected"># Protected</option>
                  <option value="package">~ Package</option>
                </select>
                
                <input 
                  type="text" 
                  [(ngModel)]="atributo.titulo"
                  placeholder="nombreAtributo"
                  class="name-input"
                  (input)="emitirCambio()" />
                
                <span class="separator">:</span>
                
                <select 
                  [(ngModel)]="atributo.tipo" 
                  class="type-select"
                  (change)="emitirCambio()">
                  <option value="String">String</option>
                  <option value="Integer">Integer</option>
                  <option value="Long">Long</option>
                  <option value="Float">Float</option>
                  <option value="Double">Double</option>
                  <option value="Boolean">Boolean</option>
                  <option value="Date">Date</option>
                  <option value="Object">Object</option>
                </select>

                <button class="btn-delete" (click)="eliminarAtributo(atributo.id)">🗑️</button>
              </div>

              <div class="uml-item-footer">
                <input 
                  type="text" 
                  [(ngModel)]="atributo.defaultValue"
                  placeholder="Valor por defecto (opcional)"
                  class="default-input"
                  (input)="emitirCambio()" />
                <span class="preview">{{ formatearAtributo(atributo) }}</span>
              </div>
            </div>
          }

          @if (atributos.length === 0) {
            <p class="empty-message">No hay atributos. Haz clic en "+ Nuevo" para agregar.</p>
          }
        </div>
      </div>

      <div class="separator-line"></div>

      <!-- Sección de Métodos -->
      <div class="uml-section">
        <h3 class="uml-section-title">
          <span>⚙️ Métodos</span>
          <button class="btn-add" (click)="agregarMetodo()">+ Nuevo</button>
        </h3>

        <div class="uml-items">
          @for (metodo of metodos; track metodo.id) {
            <div class="uml-item metodo-item">
              <div class="uml-item-header">
                <select 
                  [(ngModel)]="metodo.visibility" 
                  class="visibility-select"
                  (change)="emitirCambio()">
                  <option value="public">+ Public</option>
                  <option value="private">- Private</option>
                  <option value="protected"># Protected</option>
                  <option value="package">~ Package</option>
                </select>
                
                <input 
                  type="text" 
                  [(ngModel)]="metodo.nombre"
                  placeholder="nombreMetodo"
                  class="name-input"
                  (input)="emitirCambio()" />
                
                <button 
                  class="btn-params" 
                  (click)="toggleParametros(metodo.id)"
                  [class.active]="metodo.id === metodoEditandoParams">
                  () Params
                </button>
                
                <span class="separator">:</span>
                
                <select 
                  [(ngModel)]="metodo.tipoRetorno" 
                  class="type-select"
                  (change)="emitirCambio()">
                  <option value="void">void</option>
                  <option value="String">String</option>
                  <option value="Integer">Integer</option>
                  <option value="Long">Long</option>
                  <option value="Float">Float</option>
                  <option value="Double">Double</option>
                  <option value="Boolean">Boolean</option>
                  <option value="Object">Object</option>
                  <option value="Array">Array</option>
                  <option value="Promise">Promise</option>
                </select>

                <button class="btn-delete" (click)="eliminarMetodo(metodo.id)">🗑️</button>
              </div>

              <!-- Panel de parámetros -->
              @if (metodo.id === metodoEditandoParams) {
                <div class="params-panel">
                  <div class="params-header">
                    <span>Parámetros</span>
                    <button class="btn-add-small" (click)="agregarParametro(metodo)">+ Param</button>
                  </div>

                  @for (param of metodo.parametros; track $index; let i = $index) {
                    <div class="param-row">
                      <input 
                        type="text" 
                        [(ngModel)]="param.nombre"
                        placeholder="nombre"
                        class="param-name"
                        (input)="emitirCambio()" />
                      
                      <span>:</span>
                      
                      <select 
                        [(ngModel)]="param.tipo" 
                        class="param-type"
                        (change)="emitirCambio()">
                        <option value="String">String</option>
                        <option value="Integer">Integer</option>
                        <option value="Boolean">Boolean</option>
                        <option value="Object">Object</option>
                      </select>

                      <button class="btn-delete-small" (click)="eliminarParametro(metodo, i)">×</button>
                    </div>
                  }

                  @if (!metodo.parametros || metodo.parametros.length === 0) {
                    <p class="empty-params">Sin parámetros</p>
                  }
                </div>
              }

              <div class="uml-item-footer">
                <span class="preview">{{ formatearMetodo(metodo) }}</span>
              </div>
            </div>
          }

          @if (metodos.length === 0) {
            <p class="empty-message">No hay métodos. Haz clic en "+ Nuevo" para agregar.</p>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    .uml-editor {
      padding: 16px;
      background: #1e1e1e;
      color: #e0e0e0;
      font-family: 'Roboto', sans-serif;
      max-height: 600px;
      overflow-y: auto;
    }

    .uml-section {
      margin-bottom: 24px;
    }

    .uml-section-title {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
      font-size: 16px;
      font-weight: 600;
      color: #31d0c6;
    }

    .separator-line {
      height: 2px;
      background: #333;
      margin: 24px 0;
    }

    .btn-add {
      background: #31d0c6;
      color: #fff;
      border: none;
      padding: 6px 12px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 12px;
      font-weight: 500;
      transition: background 0.2s;
    }

    .btn-add:hover {
      background: #28b3a8;
    }

    .uml-items {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .uml-item {
      background: #2a2a2a;
      border: 1px solid #404040;
      border-radius: 6px;
      padding: 12px;
    }

    .uml-item-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 8px;
    }

    .visibility-select {
      background: #333;
      color: #e0e0e0;
      border: 1px solid #555;
      padding: 6px;
      border-radius: 4px;
      font-size: 12px;
      width: 110px;
    }

    .name-input {
      flex: 1;
      background: #333;
      color: #e0e0e0;
      border: 1px solid #555;
      padding: 6px 8px;
      border-radius: 4px;
      font-size: 13px;
      font-family: 'Courier New', monospace;
    }

    .separator {
      color: #777;
      font-weight: bold;
    }

    .type-select {
      background: #333;
      color: #feb663;
      border: 1px solid #555;
      padding: 6px;
      border-radius: 4px;
      font-size: 12px;
      min-width: 100px;
    }

    .default-input {
      flex: 1;
      background: #333;
      color: #e0e0e0;
      border: 1px solid #555;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
    }

    .btn-delete {
      background: #ff4444;
      color: #fff;
      border: none;
      padding: 6px 10px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
      transition: background 0.2s;
    }

    .btn-delete:hover {
      background: #cc0000;
    }

    .btn-params {
      background: #7c68fc;
      color: #fff;
      border: none;
      padding: 6px 10px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 11px;
      transition: background 0.2s;
    }

    .btn-params:hover, .btn-params.active {
      background: #5a45d1;
    }

    .uml-item-footer {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-top: 8px;
    }

    .preview {
      font-family: 'Courier New', monospace;
      font-size: 12px;
      color: #31d0c6;
      font-style: italic;
      flex: 1;
    }

    .empty-message {
      color: #777;
      font-size: 13px;
      font-style: italic;
      text-align: center;
      padding: 20px;
    }

    .params-panel {
      background: #252525;
      border: 1px solid #404040;
      border-radius: 4px;
      padding: 8px;
      margin-top: 8px;
    }

    .params-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
      font-size: 12px;
      font-weight: 600;
      color: #7c68fc;
    }

    .btn-add-small {
      background: #7c68fc;
      color: #fff;
      border: none;
      padding: 4px 8px;
      border-radius: 3px;
      cursor: pointer;
      font-size: 10px;
    }

    .param-row {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-bottom: 6px;
    }

    .param-name {
      flex: 1;
      background: #2a2a2a;
      color: #e0e0e0;
      border: 1px solid #555;
      padding: 4px 6px;
      border-radius: 3px;
      font-size: 11px;
      font-family: 'Courier New', monospace;
    }

    .param-type {
      background: #2a2a2a;
      color: #feb663;
      border: 1px solid #555;
      padding: 4px;
      border-radius: 3px;
      font-size: 11px;
    }

    .btn-delete-small {
      background: #ff4444;
      color: #fff;
      border: none;
      padding: 2px 8px;
      border-radius: 3px;
      cursor: pointer;
      font-size: 16px;
      line-height: 1;
    }

    .empty-params {
      color: #666;
      font-size: 11px;
      font-style: italic;
      text-align: center;
      padding: 8px;
    }

    .metodo-item {
      border-left: 3px solid #7c68fc;
    }
  `]
})
export class UmlClassEditorComponent {
  @Input() atributos: AtributoClase[] = [];
  @Input() metodos: MetodoClase[] = [];
  @Output() atributosChange = new EventEmitter<AtributoClase[]>();
  @Output() metodosChange = new EventEmitter<MetodoClase[]>();
  @Output() cambio = new EventEmitter<{ atributos: AtributoClase[], metodos: MetodoClase[] }>();

  metodoEditandoParams: string | null = null;

  agregarAtributo(): void {
    const nuevoAtributo: AtributoClase = {
      id: `attr_${Date.now()}`,
      titulo: 'nuevoAtributo',
      tipo: 'String',
      visibility: 'private'
    };
    this.atributos.push(nuevoAtributo);
    this.emitirCambio();
  }

  eliminarAtributo(id: string): void {
    this.atributos = this.atributos.filter(a => a.id !== id);
    this.emitirCambio();
  }

  agregarMetodo(): void {
    const nuevoMetodo: MetodoClase = {
      id: `method_${Date.now()}`,
      nombre: 'nuevoMetodo',
      tipoRetorno: 'void',
      visibility: 'public',
      parametros: []
    };
    this.metodos.push(nuevoMetodo);
    this.emitirCambio();
  }

  eliminarMetodo(id: string): void {
    this.metodos = this.metodos.filter(m => m.id !== id);
    if (this.metodoEditandoParams === id) {
      this.metodoEditandoParams = null;
    }
    this.emitirCambio();
  }

  toggleParametros(metodoId: string): void {
    this.metodoEditandoParams = this.metodoEditandoParams === metodoId ? null : metodoId;
  }

  agregarParametro(metodo: MetodoClase): void {
    if (!metodo.parametros) {
      metodo.parametros = [];
    }
    metodo.parametros.push({
      nombre: 'param',
      tipo: 'String'
    });
    this.emitirCambio();
  }

  eliminarParametro(metodo: MetodoClase, index: number): void {
    if (metodo.parametros) {
      metodo.parametros.splice(index, 1);
      this.emitirCambio();
    }
  }

  formatearAtributo(atributo: AtributoClase): string {
    return formatearAtributoUML(atributo);
  }

  formatearMetodo(metodo: MetodoClase): string {
    return formatearMetodoUML(metodo);
  }

  emitirCambio(): void {
    this.atributosChange.emit(this.atributos);
    this.metodosChange.emit(this.metodos);
    this.cambio.emit({ atributos: this.atributos, metodos: this.metodos });
  }
}
