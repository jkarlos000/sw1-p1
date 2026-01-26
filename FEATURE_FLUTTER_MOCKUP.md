# 🎨 Feature: Generación de Flutter Screens desde UML

## 📋 Descripción General

Sistema que genera automáticamente interfaces Flutter desde diagramas de clases UML, con capacidad de actualización mediante dibujos a mano alzada interpretados por IA.

---

## 🔄 Flujo Completo

### FASE 1: Generación Automática ✅
```
Usuario dibuja clase UML "Usuario" en Pizarra 1
         ↓
Sistema AUTO-GENERA Flutter Screen (por defecto)
         ↓
Pizarra 2 muestra layout básico:
┌──────────────┐
│ Usuario      │ ← Título (nombre de clase)
│ ──────────── │
│ TextField    │ ← email (atributo)
│ TextField    │ ← password (atributo)
│ [Login]      │ ← login() (método)
└──────────────┘
```

### FASE 2: Usuario NO está conforme 🎨
```
Usuario dibuja en papel su idea y sube foto:
┌─────────────────┐
│   Usuario       │ ← Nombre de clase (OBLIGATORIO arriba)
│                 │
│  [  email   ]   │ ← TextField
│  [ ******* ]    │ ← TextField password
│                 │
│ ┌───────────┐   │
│ │  LOGIN    │   │ ← Button
│ └───────────┘   │
│                 │
│  ¿Olvidaste?    │ ← TextButton (agregado por usuario)
└─────────────────┘
```

### FASE 3: IA Interpreta y Actualiza 🤖
```
Claude Vision analiza imagen → Genera JSON estructurado
         ↓
{
  "screens": [{
    "className": "Usuario",
    "components": [
      {"type": "TextField", "label": "email", "position": 1},
      {"type": "TextField", "label": "password", "position": 2},
      {"type": "Button", "text": "LOGIN", "position": 3, "size": "large"},
      {"type": "TextButton", "text": "¿Olvidaste?", "position": 4}
    ]
  }]
}
         ↓
Sistema ACTUALIZA Pizarra 2 con nuevo layout
```

### FASE 4: Edición Manual ✏️
```
Usuario puede:
- Renombrar widgets
- Mover componentes (drag & drop)
- Cambiar colores/tamaños
- Agregar/eliminar elementos
- Exportar código .dart final
```

---

## 📐 Convenciones para Dibujos a Mano Alzada

### ⭐ Regla #1: Nombre de Clase Obligatorio
```
┌──────────────────┐
│  USUARIO         │ ← SIEMPRE arriba, identifica la clase
│  ════════════    │
│  [ TextField ]   │
│  [ Button    ]   │
└──────────────────┘
```

### 📱 Regla #2: Múltiples Screens en una Imagen
```
┌─────────────┐      ┌─────────────┐
│  Usuario    │      │  Producto   │
│  ─────────  │      │  ─────────  │
│  [email]    │      │  [nombre]   │
│  [LOGIN]    │      │  [precio]   │
└─────────────┘      │  [GUARDAR]  │
                     └─────────────┘
```
IA detecta 2 clases → Actualiza "Usuario" y "Producto"

### 🏷️ Regla #3: Anotaciones de Componentes
Usuario puede escribir en el dibujo:
- "TextField email"
- "Button LOGIN grande"
- "AppBar azul"
- "ListView productos"
- "Icon inicio"

### 🎯 Regla #4: Reconocimiento de Formas
- **Rectángulos con línea** = TextField
- **Rectángulos rellenos** = Button/ElevatedButton
- **Rectángulos con borde** = OutlinedButton
- **Texto pequeño** = TextButton/InkWell
- **Lista vertical** = ListView/Column
- **Grid** = GridView

---

## 🤖 Prompt para Claude Vision

```typescript
const PROMPT_INTERPRETAR_MOCKUP = `
Analiza este mockup de Flutter dibujado a mano.

INSTRUCCIONES:
1. Identifica el NOMBRE DE LA CLASE (siempre arriba del screen)
2. Detecta componentes Flutter según formas:
   - Rectángulos con líneas internas = TextField
   - Rectángulos rellenos grandes = Button/ElevatedButton
   - Rectángulos con solo borde = OutlinedButton
   - Texto pequeño sin rectángulo = TextButton
   - Lista de elementos = ListView
   - Cuadrícula = GridView
3. Extrae POSICIÓN RELATIVA (1, 2, 3... de arriba a abajo)
4. Detecta anotaciones de texto del usuario
5. Si hay MÚLTIPLES SCREENS, identifica cada uno por su nombre de clase

FORMATO DE SALIDA (JSON estricto):
{
  "screens": [
    {
      "className": "NombreDeLaClase",
      "components": [
        {
          "type": "TextField|Button|TextButton|ListView|AppBar|Icon",
          "label": "texto del componente",
          "position": numero_orden,
          "size": "small|medium|large" (opcional),
          "variant": "elevated|outlined|text" (para buttons)
        }
      ]
    }
  ]
}

IMPORTANTE: 
- NO inventes componentes que no veas
- Si el dibujo es confuso, usa "type": "Container" genérico
- SIEMPRE incluye el className
`;
```

---

## 🛠️ Arquitectura Técnica

### Frontend (Angular)

#### 1. Componente Principal
```
official-sw1p1/src/app/
├── diagramador/
│   ├── diagramador.component.ts        (Pizarra 1 - UML existente)
│   ├── flutter-preview/
│   │   ├── flutter-preview.component.ts (Pizarra 2 - NUEVO)
│   │   ├── flutter-preview.component.html
│   │   ├── flutter-preview.component.css
│   │   └── flutter-widget-renderer.ts   (Renderiza widgets)
│   └── services/
│       ├── flutter-generator.service.ts  (Auto-generación)
│       └── flutter-mockup.service.ts     (Interpretación IA)
```

#### 2. Interfaces TypeScript
```typescript
// interfaces/flutter-screen.interface.ts
export interface FlutterScreen {
  className: string;
  components: FlutterComponent[];
  theme?: ThemeConfig;
}

export interface FlutterComponent {
  id: string;
  type: 'TextField' | 'Button' | 'TextButton' | 'AppBar' | 'ListView' | 'Icon';
  label: string;
  position: number;
  size?: 'small' | 'medium' | 'large';
  variant?: 'elevated' | 'outlined' | 'text';
  customProperties?: Record<string, any>;
}

export interface ThemeConfig {
  primaryColor?: string;
  accentColor?: string;
  fontFamily?: string;
}
```

### Backend (Node.js + TypeScript)

#### 1. Controlador
```
backend-p1sw1/
├── controller/
│   └── flutter-mockup.controller.ts (NUEVO)
├── services/
│   ├── claude-vision.service.ts     (NUEVO - integración Claude)
│   └── flutter-code-generator.service.ts (NUEVO - genera .dart)
└── routes/
    └── router.ts (agregar rutas)
```

#### 2. Endpoints
```typescript
POST /api/flutter/interpretar-mockup
  - Body: FormData con imagen
  - Response: { screens: FlutterScreen[] }

GET /api/flutter/generar-codigo/:className
  - Params: className
  - Response: { dartCode: string }

POST /api/flutter/exportar-proyecto
  - Body: { screens: FlutterScreen[] }
  - Response: ZIP con proyecto Flutter completo
```

---

## ✅ CHECKLIST DE IMPLEMENTACIÓN

### 🟢 Sprint 1: Generación Automática (3-4 días)

**Objetivo:** Auto-generar Flutter screen cuando se hace clic en clase UML

#### Frontend
- [ ] **1.1** Crear componente `flutter-preview.component.ts`
- [ ] **1.2** Agregar Pizarra 2 en `diagramador.component.html` (debajo del UML)
- [ ] **1.3** Listener de CLIC en clases UML (evento `cell:pointerclick`)
- [ ] **1.4** Servicio `flutter-generator.service.ts`:
  - [ ] Método `generarDesdeClaseUML(className, attributes, methods)`
  - [ ] Mapeo: atributos → TextField
  - [ ] Mapeo: métodos → Button
- [ ] **1.5** Renderizado HTML/CSS básico de widgets Flutter
  - [ ] AppBar (título = nombre de clase)
  - [ ] TextField por cada atributo
  - [ ] Button por cada método
- [ ] **1.6** Estilos CSS que simulen Material Design Flutter
- [ ] **1.7** Botón "Exportar .dart" (funcionalidad básica)

#### Backend
- [ ] **1.8** Servicio `flutter-code-generator.service.ts`
- [ ] **1.9** Endpoint `GET /api/flutter/generar-codigo/:className`
- [ ] **1.10** Template básico de Flutter Screen:
  ```dart
  class {{ClassName}}Screen extends StatelessWidget {
    @override
    Widget build(BuildContext context) {
      return Scaffold(
        appBar: AppBar(title: Text('{{ClassName}}')),
        body: Column(children: [
          // TextFields generados
          // Buttons generados
        ])
      );
    }
  }
  ```

#### Testing
- [ ] **1.11** Test: Clic en clase UML → genera screen
- [ ] **1.12** Test: Clase con 3 atributos → 3 TextFields
- [ ] **1.13** Test: Clase con 2 métodos → 2 Buttons
- [ ] **1.14** Test: Exportar código .dart funciona

---

### 🟡 Sprint 2: Interpretación de Dibujos con IA (5-7 días)

**Objetivo:** Usuario sube foto de mockup → IA actualiza Pizarra 2

#### Frontend
- [ ] **2.1** Botón "📸 Actualizar desde dibujo" en toolbar
- [ ] **2.2** Input file para subir imagen (PNG, JPG, PDF)
- [ ] **2.3** Preview de imagen cargada antes de enviar
- [ ] **2.4** Servicio `flutter-mockup.service.ts`:
  - [ ] Método `interpretarDibujo(imagen: File): Promise<FlutterScreen[]>`
  - [ ] Llamada HTTP POST a backend
- [ ] **2.5** Lógica de actualización:
  - [ ] Buscar screen existente por `className`
  - [ ] Si existe → actualizar componentes
  - [ ] Si no existe → mostrar warning
- [ ] **2.6** Loading spinner mientras IA procesa
- [ ] **2.7** Toast/notification de éxito/error

#### Backend
- [ ] **2.8** Endpoint `POST /api/flutter/interpretar-mockup`
- [ ] **2.9** Middleware de upload (multer) para imágenes
- [ ] **2.10** Servicio `claude-vision.service.ts`:
  - [ ] Integración con Anthropic API
  - [ ] Envío de imagen + prompt
  - [ ] Parsing de respuesta JSON
- [ ] **2.11** Validación de respuesta de IA:
  - [ ] Verificar que tenga estructura correcta
  - [ ] Validar tipos de componentes permitidos
  - [ ] Sanitizar datos
- [ ] **2.12** Manejo de errores:
  - [ ] Imagen muy grande
  - [ ] Formato no soportado
  - [ ] IA no detecta nombre de clase
  - [ ] Rate limit de API

#### Prompt Engineering
- [ ] **2.13** Refinar prompt de Claude Vision (ver sección arriba)
- [ ] **2.14** Agregar ejemplos few-shot al prompt
- [ ] **2.15** Manejo de edge cases:
  - [ ] Dibujos muy abstractos
  - [ ] Múltiples screens en una imagen
  - [ ] Dibujos sin nombre de clase

#### Testing
- [ ] **2.16** Test: Dibujo simple → JSON correcto
- [ ] **2.17** Test: Múltiples screens → detecta ambos
- [ ] **2.18** Test: Dibujo sin nombre → error descriptivo
- [ ] **2.19** Test: Imagen corrupta → manejo de error
- [ ] **2.20** Test: Actualización de screen existente funciona

---

### 🔵 Sprint 3: Edición Manual (3-4 días)

**Objetivo:** Usuario puede editar manualmente el screen generado

#### Frontend
- [ ] **3.1** Toggle "Modo Edición" / "Modo Vista"
- [ ] **3.2** En modo edición:
  - [ ] Componentes son draggables (drag & drop)
  - [ ] Click en componente → panel de propiedades
  - [ ] Botón eliminar componente
  - [ ] Botón agregar nuevo componente (dropdown)
- [ ] **3.3** Panel lateral de propiedades:
  - [ ] Input para label/texto
  - [ ] Select para tipo de componente
  - [ ] Input para tamaño (small/medium/large)
  - [ ] Color picker (para buttons)
- [ ] **3.4** Toolbar de componentes disponibles:
  - [ ] TextField
  - [ ] Button (elevated, outlined, text)
  - [ ] AppBar
  - [ ] ListView
  - [ ] Icon
  - [ ] Container
- [ ] **3.5** Guardar cambios en estado del componente
- [ ] **3.6** Deshacer/Rehacer (Ctrl+Z / Ctrl+Y)

#### Funcionalidades Extra
- [ ] **3.7** Renombrar screen (cambiar className)
- [ ] **3.8** Duplicar componente
- [ ] **3.9** Alinear componentes (izquierda, centro, derecha)
- [ ] **3.10** Espaciado automático entre componentes
- [ ] **3.11** Vista previa de código .dart en tiempo real

#### Testing
- [ ] **3.12** Test: Drag & drop funciona
- [ ] **3.13** Test: Eliminar componente actualiza preview
- [ ] **3.14** Test: Agregar nuevo TextField funciona
- [ ] **3.15** Test: Cambiar label se refleja en código

---

### 🟣 Sprint 4: Exportación Completa (2-3 días)

**Objetivo:** Exportar proyecto Flutter completo, no solo código

#### Backend
- [ ] **4.1** Endpoint `POST /api/flutter/exportar-proyecto`
- [ ] **4.2** Generador de proyecto Flutter completo:
  - [ ] `pubspec.yaml` con dependencias
  - [ ] `main.dart` con MaterialApp
  - [ ] Carpeta `screens/` con todos los screens
  - [ ] Carpeta `models/` con clases de datos
  - [ ] `routes.dart` con navegación
- [ ] **4.3** Integración con Spring Boot (opcional):
  - [ ] Generar modelos Dart desde entidades Java
  - [ ] Generar servicios HTTP que consuman API Spring
  - [ ] ApiClient con Dio/http
- [ ] **4.4** Comprimir en ZIP
- [ ] **4.5** Almacenar temporalmente (1 hora) para descarga

#### Frontend
- [ ] **4.6** Botón "Exportar Proyecto Completo"
- [ ] **4.7** Modal de configuración:
  - [ ] Nombre del proyecto
  - [ ] Package name (com.example.app)
  - [ ] Incluir integración con backend (checkbox)
  - [ ] URL del backend Spring Boot
- [ ] **4.8** Descarga automática del ZIP
- [ ] **4.9** Mostrar estructura del proyecto antes de exportar

#### Testing
- [ ] **4.10** Test: Proyecto exportado compila sin errores
- [ ] **4.11** Test: `flutter run` funciona
- [ ] **4.12** Test: Navegación entre screens funciona
- [ ] **4.13** Test: Integración con API Spring (si se incluyó)

---

## 🎨 Ejemplo Completo de Uso

### Paso 1: Usuario crea clase UML
```
Pizarra 1 (UML):
┌──────────────┐
│  Producto    │
├──────────────┤
│ +nombre: String
│ +precio: double
│ +stock: int
├──────────────┤
│ +guardar()
│ +eliminar()
└──────────────┘
```

### Paso 2: Sistema auto-genera (Clic en clase)
```
Pizarra 2 (Flutter - Auto):
┌───────────────────────┐
│ ProductoScreen        │
│ ─────────────────────│
│ TextField: nombre     │
│ TextField: precio     │
│ TextField: stock      │
│ [Guardar]             │
│ [Eliminar]            │
└───────────────────────┘
```

### Paso 3: Usuario no está conforme, dibuja:
```
Foto del cuaderno:
┌─────────────────────────┐
│      PRODUCTO           │
│ ======================= │
│                         │
│  Nombre: [_________]    │
│  Precio: [_________] 💵 │
│  Stock:  [_________]    │
│                         │
│  ┌─────────────────┐    │
│  │  GUARDAR TODO   │    │ ← Button grande
│  └─────────────────┘    │
│                         │
│      [eliminar]         │ ← TextButton pequeño
└─────────────────────────┘
```

### Paso 4: IA actualiza automáticamente
```
Pizarra 2 (Flutter - Actualizado):
┌───────────────────────────┐
│ ProductoScreen            │
│ ───────────────────────── │
│ TextField: Nombre         │
│ Row: [TextField: Precio] 💵 │ ← Detectó icon
│ TextField: Stock          │
│                           │
│ ┌───────────────────────┐ │
│ │   GUARDAR TODO        │ │ ← Button grande
│ └───────────────────────┘ │
│                           │
│      eliminar             │ ← TextButton
└───────────────────────────┘
```

### Paso 5: Código Flutter generado
```dart
import 'package:flutter/material.dart';

class ProductoScreen extends StatelessWidget {
  final TextEditingController nombreController = TextEditingController();
  final TextEditingController precioController = TextEditingController();
  final TextEditingController stockController = TextEditingController();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Producto'),
      ),
      body: Padding(
        padding: EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            TextField(
              controller: nombreController,
              decoration: InputDecoration(
                labelText: 'Nombre',
                border: OutlineInputBorder(),
              ),
            ),
            SizedBox(height: 16),
            
            Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: precioController,
                    decoration: InputDecoration(
                      labelText: 'Precio',
                      border: OutlineInputBorder(),
                    ),
                    keyboardType: TextInputType.number,
                  ),
                ),
                SizedBox(width: 8),
                Icon(Icons.attach_money, size: 32),
              ],
            ),
            SizedBox(height: 16),
            
            TextField(
              controller: stockController,
              decoration: InputDecoration(
                labelText: 'Stock',
                border: OutlineInputBorder(),
              ),
              keyboardType: TextInputType.number,
            ),
            SizedBox(height: 32),
            
            ElevatedButton(
              onPressed: guardarTodo,
              style: ElevatedButton.styleFrom(
                padding: EdgeInsets.symmetric(vertical: 16),
              ),
              child: Text('GUARDAR TODO', style: TextStyle(fontSize: 18)),
            ),
            SizedBox(height: 16),
            
            TextButton(
              onPressed: eliminar,
              child: Text('eliminar'),
            ),
          ],
        ),
      ),
    );
  }
  
  void guardarTodo() {
    // TODO: Implementar lógica de guardado
    print('Guardando: ${nombreController.text}');
  }
  
  void eliminar() {
    // TODO: Implementar lógica de eliminación
  }
}
```

---

## 📊 Métricas de Éxito

### Sprint 1
- [ ] 100% de clases UML generan screen automáticamente
- [ ] Código .dart exportado compila sin errores
- [ ] Tiempo de generación < 500ms

### Sprint 2
- [ ] IA detecta correctamente nombre de clase en 95% de casos
- [ ] Reconocimiento de componentes básicos > 90% precisión
- [ ] Tiempo de procesamiento IA < 3 segundos

### Sprint 3
- [ ] Usuario puede editar cualquier propiedad de componente
- [ ] Drag & drop funciona sin lag
- [ ] Cambios se reflejan en código en < 100ms

### Sprint 4
- [ ] Proyecto exportado compila con `flutter run`
- [ ] Navegación entre screens funciona
- [ ] Integración con Spring Boot (opcional) conecta correctamente

---

## 🚨 Riesgos y Mitigaciones

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|--------------|---------|------------|
| IA no interpreta dibujos correctamente | Alta | Alto | Mejorar prompt, agregar ejemplos, permitir edición manual |
| Performance lento en tiempo real | Media | Medio | Debounce en eventos, lazy loading, web workers |
| Código Flutter generado no compila | Media | Alto | Testing exhaustivo, validación de templates |
| Usuario dibuja mockup muy complejo | Alta | Medio | Documentación clara, límite de componentes, simplificación automática |
| Costos de API Claude Vision altos | Media | Medio | Cacheo de resultados, límite de requests por usuario |

---

## 📚 Recursos y Referencias

### Documentación
- [Flutter Widget Catalog](https://docs.flutter.dev/ui/widgets)
- [Material Design Components](https://m3.material.io/components)
- [Anthropic Claude Vision API](https://docs.anthropic.com/claude/docs/vision)
- [JointJS Documentation](https://resources.jointjs.com/docs/jointjs)

### Librerías a Evaluar
- **Frontend:**
  - [tldraw](https://tldraw.dev/) - Canvas colaborativo
  - [Excalidraw](https://excalidraw.com/) - Dibujo libre
  - [Fabric.js](http://fabricjs.com/) - Canvas manipulation
  
- **Backend:**
  - [Anthropic SDK](https://www.npmjs.com/package/@anthropic-ai/sdk)
  - [Handlebars](https://handlebarsjs.com/) - Templates Dart
  - [archiver](https://www.npmjs.com/package/archiver) - Generar ZIP

---

## 🎯 Próximos Pasos

1. **Revisar y aprobar este checklist** ✅
2. **Priorizar sprints** (¿Empezamos por Sprint 1?)
3. **Configurar entorno de desarrollo** (dependencias, APIs)
4. **Crear branch feature**: `git checkout -b feature/flutter-mockup-generator`
5. **Iniciar Sprint 1** 🚀

---

## 📝 Notas de Desarrollo

### Consideraciones
- Mantener compatibilidad con UML existente (no romper nada)
- Sincronización en tiempo real también para Flutter screens
- Guardar screens en base de datos junto con UML
- Permitir múltiples screens por sala (no solo uno)

### Schema SQL Adicional (futuro)
```sql
CREATE TABLE flutter_screen (
  id_screen SERIAL PRIMARY KEY,
  id_sala INTEGER REFERENCES sala(id_sala) ON DELETE CASCADE,
  class_name VARCHAR(100) NOT NULL,
  components JSONB NOT NULL,
  theme_config JSONB,
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_flutter_screen_id_sala ON flutter_screen(id_sala);
CREATE INDEX idx_flutter_screen_class_name ON flutter_screen(class_name);
```

---

**Última actualización:** 25 de enero de 2026  
**Versión:** 1.0  
**Estado:** 📋 Planificación completa
