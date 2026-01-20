# Soporte UML 2.5 en el Diagramador

Este documento explica cómo el sistema soporta la notación completa de UML 2.5 para diagramas de clases.

## 📐 Notación UML 2.5 Implementada

### 1. Modificadores de Visibilidad

Según el estándar UML 2.5, cada atributo y método debe tener un modificador de visibilidad:

| Símbolo | Modificador | Significado | Ejemplo |
|---------|-------------|-------------|---------|
| `+` | public | Visible desde cualquier clase | `+ nombre : String` |
| `-` | private | Visible solo dentro de la clase | `- password : String` |
| `#` | protected | Visible en la clase y sus hijos | `# createdAt : Date` |
| `~` | package | Visible en el mismo paquete | `~ config : Object` |

### 2. Atributos (Propiedades)

**Formato completo:**
```
[visibility] [nombre] : [tipo] [= valorDefault]
```

**Ejemplos válidos:**
```
+ id : Integer
- email : String
# fecha : Date = now()
~ activo : Boolean = true
nombre : String         (sin visibilidad explícita)
```

**Componentes:**
- ✅ Visibilidad: `+`, `-`, `#`, `~`
- ✅ Nombre: identificador del atributo
- ✅ Tipo: String, Integer, Boolean, Date, etc.
- ✅ Valor por defecto: opcional con `= valor`
- ✅ Estático: se puede marcar (subrayado en UI)

### 3. Métodos (Operaciones)

**Formato completo:**
```
[visibility] [nombre]([param1:tipo1, param2:tipo2]) : [tipoRetorno]
```

**Ejemplos válidos:**
```
+ getNombre() : String
- validarEmail(email:String) : Boolean
# calcular(a:Integer, b:Integer) : Integer
+ guardar() : void
+ actualizar(datos:Object) : Promise
- inicializar() : void
```

**Componentes:**
- ✅ Visibilidad: `+`, `-`, `#`, `~`
- ✅ Nombre: identificador del método
- ✅ Parámetros: lista separada por comas, formato `nombre:tipo`
- ✅ Tipo de retorno: void, String, Integer, Boolean, Promise, etc.
- ✅ Abstracto: se puede marcar (cursiva en UI)
- ✅ Estático: se puede marcar (subrayado en UI)

## 🎨 Estructura Visual de una Clase UML 2.5

```
┌─────────────────────────────────────┐
│        <<stereotype>>               │ ← Estereotipo (opcional)
│          NombreClase                │ ← Nombre (cursiva si abstracta)
├─────────────────────────────────────┤
│ ATRIBUTOS:                          │
│ + id : Integer                      │
│ - nombre : String                   │
│ # createdAt : Date                  │
│ ~ status : Boolean = true           │
├─────────────────────────────────────┤
│ MÉTODOS:                            │
│ + getId() : Integer                 │
│ + setNombre(n:String) : void        │
│ - validar() : Boolean               │
│ # actualizar() : Promise            │
└─────────────────────────────────────┘
```

## 🔗 Tipos de Relaciones Soportadas

### 1. Asociación (Association)
**Notación:** Línea continua
**Uso:** Relación general entre clases
```
[ClaseA] ────── [ClaseB]
```

### 2. Agregación (Aggregation)
**Notación:** Línea con diamante vacío
**Uso:** Relación "tiene-un" débil (las partes pueden existir independientemente)
```
[Todo] ◇────── [Parte]
```

### 3. Composición (Composition)
**Notación:** Línea con diamante relleno
**Uso:** Relación "tiene-un" fuerte (las partes no pueden existir sin el todo)
```
[Todo] ◆────── [Parte]
```

### 4. Herencia (Generalization/Inheritance)
**Notación:** Línea con triángulo vacío
**Uso:** Relación "es-un"
```
[ClaseHija] ────▷ [ClasePadre]
```

### 5. Dependencia (Dependency)
**Notación:** Línea discontinua con flecha
**Uso:** Una clase usa a otra temporalmente
```
[ClaseA] ----→ [ClaseB]
```

### 6. Realización (Realization/Implementation)
**Notación:** Línea discontinua con triángulo vacío
**Uso:** Implementación de interface
```
[Clase] ----▷ <<interface>>
```

## 💡 Multiplicidad en Relaciones

Las relaciones pueden tener multiplicidad en ambos extremos:

| Notación | Significado |
|----------|-------------|
| `0..1` | Cero o uno |
| `1` | Exactamente uno |
| `0..*` o `*` | Cero o muchos |
| `1..*` | Uno o muchos |
| `2..5` | Entre 2 y 5 |

**Ejemplo:**
```
[Profesor] 1 ────── 0..* [Estudiante]
```
Un profesor puede tener 0 o más estudiantes.

## 🤖 Integración con Claude (Anthropic API)

### ¿Claude entiende UML 2.5?

**✅ SÍ, perfectamente.** Claude Sonnet 4.5 y Opus tienen comprensión nativa de:

1. **Notación UML 2.5 completa**
   - Modificadores de visibilidad
   - Tipos de datos
   - Métodos con parámetros y retornos
   - Todas las relaciones

2. **Análisis semántico**
   - Puede sugerir métodos faltantes (getters, setters, constructores)
   - Identifica relaciones incorrectas
   - Detecta problemas de diseño
   - Sugiere patrones de diseño

3. **Generación de código**
   - Java, Python, TypeScript, C#, etc.
   - Respeta modificadores de visibilidad
   - Genera métodos completos con tipos
   - Incluye documentación

### Ejemplos de Prompts para Claude

#### 1. Análisis de diagrama
```
Analiza este diagrama UML de clases y sugiere mejoras:

Clase Usuario:
- id : Integer
- email : String
- password : String
+ login(email:String, pass:String) : Boolean
+ register() : void

Clase Pedido:
- id : Integer
- fecha : Date
- total : Float
+ calcularTotal() : Float

Usuario 1 ────── 0..* Pedido
```

#### 2. Generación de código
```
Genera código Java para esta clase UML:

<<entity>>
Usuario
─────────────────
- id : Long
- nombre : String
- email : String
- activo : Boolean = true
─────────────────
+ Usuario(nombre:String, email:String)
+ getId() : Long
+ setNombre(n:String) : void
+ validarEmail() : Boolean
- encriptarPassword(pass:String) : String
```

#### 3. Sugerencias de métodos
```
Tengo esta clase. ¿Qué métodos me faltan?

Clase Producto:
- id : Integer
- nombre : String
- precio : Float
- stock : Integer
```

Claude responderá con métodos comunes como:
- `+ getId() : Integer`
- `+ setStock(cantidad:Integer) : void`
- `+ calcularPrecioConIVA() : Float`
- `+ hayStock() : Boolean`
- etc.

## 🛠️ Uso en el Código

### Importar utilidades
```typescript
import { 
  formatearAtributoUML,
  formatearMetodoUML,
  parsearAtributoUML,
  parsearMetodoUML,
  generarTextoClaseUML
} from '../utils/uml-formatter';
```

### Formatear atributo
```typescript
const atributo: AtributoClase = {
  id: '1',
  titulo: 'email',
  tipo: 'String',
  visibility: 'private'
};

const texto = formatearAtributoUML(atributo);
// Resultado: "- email : String"
```

### Formatear método
```typescript
const metodo: MetodoClase = {
  id: '1',
  nombre: 'calcular',
  parametros: [
    { nombre: 'a', tipo: 'Integer' },
    { nombre: 'b', tipo: 'Integer' }
  ],
  tipoRetorno: 'Integer',
  visibility: 'public'
};

const texto = formatearMetodoUML(metodo);
// Resultado: "+ calcular(a:Integer, b:Integer) : Integer"
```

### Parsear desde string
```typescript
const atributo = parsearAtributoUML('- password : String', 'attr_1');
// Resultado: { id: 'attr_1', titulo: 'password', tipo: 'String', visibility: 'private' }

const metodo = parsearMetodoUML('+ guardar() : void', 'method_1');
// Resultado: { id: 'method_1', nombre: 'guardar', tipoRetorno: 'void', visibility: 'public' }
```

## 📚 Referencias UML 2.5

- **Especificación oficial:** [OMG UML 2.5.1](https://www.omg.org/spec/UML/2.5.1/)
- **Modificadores de visibilidad:** Sección 7.3.54 (VisibilityKind)
- **Diagramas de clases:** Sección 11 (Class Diagrams)
- **Relaciones:** Sección 11.5 (Associations, Aggregations, Compositions)

## ✨ Próximas Mejoras

- [ ] Soporte para clases abstractas (nombre en cursiva)
- [ ] Soporte para interfaces (<<interface>>)
- [ ] Atributos y métodos estáticos (subrayado)
- [ ] Propiedades derivadas (/ prefix)
- [ ] Constantes (ALL_CAPS con final/const)
- [ ] Estereotipos personalizados
- [ ] Notas y comentarios UML
- [ ] Restricciones OCL

## 🎯 Ejemplo Completo

```typescript
import { ElementoClase, AtributoClase, MetodoClase } from './interfaces/jsonJoint.interface';
import { generarTextoClaseUML } from './utils/uml-formatter';

const clase: ElementoClase = {
  id: 'class_1',
  titulo: 'Usuario',
  posicion: [100, 100],
  size: [200, 300],
  color: '#31d0c6',
  stereotype: 'entity',
  atributos: [
    {
      id: 'attr_1',
      titulo: 'id',
      tipo: 'Long',
      visibility: 'private'
    },
    {
      id: 'attr_2',
      titulo: 'email',
      tipo: 'String',
      visibility: 'private'
    },
    {
      id: 'attr_3',
      titulo: 'activo',
      tipo: 'Boolean',
      visibility: 'private',
      defaultValue: 'true'
    }
  ],
  metodos: [
    {
      id: 'method_1',
      nombre: 'getId',
      tipoRetorno: 'Long',
      visibility: 'public'
    },
    {
      id: 'method_2',
      nombre: 'setEmail',
      parametros: [{ nombre: 'email', tipo: 'String' }],
      tipoRetorno: 'void',
      visibility: 'public'
    },
    {
      id: 'method_3',
      nombre: 'validar',
      tipoRetorno: 'Boolean',
      visibility: 'private'
    }
  ]
};

// Generar texto UML
const textoUML = generarTextoClaseUML(clase.atributos, clase.metodos);
console.log(textoUML);

/*
Salida:
- id : Long
- email : String
- activo : Boolean = true
---
+ getId() : Long
+ setEmail(email:String) : void
- validar() : Boolean
*/
```

---

**Autor:** Jkarlos  
**Fecha:** 2026  
**Versión UML:** 2.5.1
