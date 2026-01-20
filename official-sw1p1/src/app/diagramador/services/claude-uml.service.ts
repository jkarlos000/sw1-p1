/**
 * Servicio para análisis de diagramas UML con Claude/Anthropic
 * Soporte completo para UML 2.5 con métodos, visibilidad y relaciones
 * 
 * @author Jkarlos
 * @date 2026
 */

import { ElementoClase, MetodoClase, VisibilityModifier } from '../interfaces/jsonJoint.interface';
import { generarTextoClaseUML } from '../utils/uml-formatter';

/**
 * Genera un prompt estructurado para Claude con información UML 2.5 completa
 */
export function generarPromptUMLParaClaude(clases: ElementoClase[], relaciones: any[]): string {
  let prompt = `# Análisis de Diagrama UML 2.5

Por favor, analiza el siguiente diagrama de clases UML 2.5 y proporciona:
1. Validación de la estructura
2. Sugerencias de mejora
3. Métodos faltantes (getters, setters, constructores, etc.)
4. Posibles problemas de diseño
5. Recomendaciones de patrones de diseño

## Clases del Diagrama\n\n`;

  // Agregar cada clase con su información completa
  clases.forEach((clase, index) => {
    prompt += `### ${index + 1}. Clase: ${clase.titulo}\n`;
    
    // Estereotipo si existe
    if (clase.stereotype) {
      prompt += `**Estereotipo:** <<${clase.stereotype}>>\n`;
    }
    
    // Tipo de clase
    if (clase.isAbstract) {
      prompt += `**Tipo:** Clase Abstracta\n`;
    } else if (clase.isInterface) {
      prompt += `**Tipo:** Interface\n`;
    } else {
      prompt += `**Tipo:** Clase Concreta\n`;
    }
    
    prompt += `\n**Estructura:**\n\`\`\`\n`;
    
    // Nombre de clase
    prompt += `${clase.titulo}\n`;
    prompt += `${'─'.repeat(40)}\n`;
    
    // Atributos
    if (clase.atributos && clase.atributos.length > 0) {
      prompt += `// ATRIBUTOS\n`;
      clase.atributos.forEach(attr => {
        const visibilidad = attr.visibility ? obtenerSimboloVisibilidad(attr.visibility) : ' ';
        const tipo = attr.tipo || 'Object';
        const defaultVal = attr.defaultValue ? ` = ${attr.defaultValue}` : '';
        prompt += `${visibilidad} ${attr.titulo} : ${tipo}${defaultVal}\n`;
      });
    }
    
    // Separador entre atributos y métodos
    if (clase.atributos?.length > 0 && clase.metodos && clase.metodos.length > 0) {
      prompt += `${'─'.repeat(40)}\n`;
    }
    
    // Métodos
    if (clase.metodos && clase.metodos.length > 0) {
      prompt += `// MÉTODOS\n`;
      clase.metodos.forEach(metodo => {
        const visibilidad = metodo.visibility ? obtenerSimboloVisibilidad(metodo.visibility) : ' ';
        const params = metodo.parametros 
          ? metodo.parametros.map(p => `${p.nombre}:${p.tipo}`).join(', ')
          : '';
        const retorno = metodo.tipoRetorno || 'void';
        prompt += `${visibilidad} ${metodo.nombre}(${params}) : ${retorno}\n`;
      });
    }
    
    prompt += `\`\`\`\n\n`;
  });

  // Agregar relaciones
  if (relaciones && relaciones.length > 0) {
    prompt += `## Relaciones del Diagrama\n\n`;
    
    relaciones.forEach((rel, index) => {
      const origen = clases.find(c => c.id === rel.source?.id)?.titulo || 'Desconocido';
      const destino = clases.find(c => c.id === rel.target?.id)?.titulo || 'Desconocido';
      const tipo = identificarTipoRelacion(rel);
      const multiplicidad = obtenerMultiplicidad(rel);
      
      prompt += `${index + 1}. **${origen}** ${tipo} **${destino}**`;
      if (multiplicidad) {
        prompt += ` ${multiplicidad}`;
      }
      prompt += `\n`;
    });
    
    prompt += `\n`;
  }

  prompt += `## Instrucciones para el Análisis

Por favor, proporciona:

### 1. Validación
- ¿Las clases están bien estructuradas según UML 2.5?
- ¿Los tipos de datos son apropiados?
- ¿La visibilidad de atributos y métodos es correcta?

### 2. Métodos Faltantes
Para cada clase, sugiere métodos que típicamente deberían existir:
- Constructores
- Getters y Setters para atributos privados
- Métodos de negocio relevantes
- Métodos toString(), equals(), hashCode() si aplica

### 3. Relaciones
- ¿Las relaciones son del tipo correcto?
- ¿La multiplicidad es adecuada?
- ¿Falta alguna relación importante?

### 4. Patrones de Diseño
- ¿Se puede aplicar algún patrón de diseño?
- ¿Hay oportunidades de refactoring?

### 5. Mejores Prácticas
- Nombres descriptivos
- Separación de responsabilidades
- Cohesión y acoplamiento
- Principios SOLID

**Formato de respuesta:** Por favor, estructura tu respuesta de forma clara con secciones numeradas.`;

  return prompt;
}

/**
 * Prompt para generar código desde UML
 */
export function generarPromptGeneracionCodigo(
  clase: ElementoClase,
  lenguaje: 'java' | 'typescript' | 'python' | 'csharp'
): string {
  const textoClase = generarTextoClaseCompleta(clase);
  
  let prompt = `# Generación de Código desde UML 2.5

Genera código ${lenguaje.toUpperCase()} para la siguiente clase UML 2.5:

\`\`\`
${textoClase}
\`\`\`

## Requisitos:

1. **Respetar visibilidad**: Los modificadores UML deben convertirse correctamente:
   - \`+\` (public) → public
   - \`-\` (private) → private
   - \`#\` (protected) → protected
   - \`~\` (package) → package/internal/default

2. **Incluir todos los métodos** definidos en el diagrama

3. **Agregar métodos adicionales** que típicamente se necesitan:
   - Constructor con parámetros importantes
   - Getters y setters para atributos privados
   - toString() / __str__
   - equals() y hashCode() (si aplica al lenguaje)

4. **Documentación**: Agregar comentarios JSDoc/JavaDoc/DocStrings

5. **Tipos de datos**: Convertir los tipos UML a los tipos nativos del lenguaje

6. **Buenas prácticas**: Seguir convenciones del lenguaje

**Genera el código completo y funcional.**`;

  return prompt;
}

/**
 * Prompt para sugerir relaciones faltantes
 */
export function generarPromptSugerirRelaciones(clases: ElementoClase[]): string {
  let prompt = `# Sugerencias de Relaciones UML

Tengo las siguientes clases en mi diagrama UML:

`;

  clases.forEach((clase, i) => {
    prompt += `${i + 1}. **${clase.titulo}**\n`;
    if (clase.atributos && clase.atributos.length > 0) {
      prompt += `   Atributos: ${clase.atributos.map(a => a.titulo).join(', ')}\n`;
    }
  });

  prompt += `\n## Pregunta

¿Qué relaciones (Asociación, Agregación, Composición, Herencia) deberían existir entre estas clases?

Para cada relación sugerida, indica:
1. Tipo de relación
2. Clases involucradas
3. Multiplicidad recomendada
4. Justificación

**Formato de respuesta:**
- [TipoRelación] ClaseA → ClaseB (multiplicidad)
  Justificación: ...`;

  return prompt;
}

/**
 * Genera texto completo de una clase UML para enviar a Claude
 */
function generarTextoClaseCompleta(clase: ElementoClase): string {
  let texto = '';
  
  // Estereotipo
  if (clase.stereotype) {
    texto += `<<${clase.stereotype}>>\n`;
  }
  
  // Nombre (cursiva si es abstracta)
  if (clase.isAbstract || clase.isInterface) {
    texto += `${clase.isInterface ? 'interface' : 'abstract'} ${clase.titulo}\n`;
  } else {
    texto += `${clase.titulo}\n`;
  }
  
  texto += `${'─'.repeat(40)}\n`;
  
  // Atributos
  if (clase.atributos && clase.atributos.length > 0) {
    clase.atributos.forEach(attr => {
      const vis = attr.visibility ? obtenerSimboloVisibilidad(attr.visibility) : ' ';
      const tipo = attr.tipo || 'Object';
      const defaultVal = attr.defaultValue ? ` = ${attr.defaultValue}` : '';
      texto += `${vis} ${attr.titulo} : ${tipo}${defaultVal}\n`;
    });
  }
  
  // Separador
  if (clase.atributos?.length > 0 && clase.metodos && clase.metodos.length > 0) {
    texto += `${'─'.repeat(40)}\n`;
  }
  
  // Métodos
  if (clase.metodos && clase.metodos.length > 0) {
    clase.metodos.forEach(metodo => {
      const vis = metodo.visibility ? obtenerSimboloVisibilidad(metodo.visibility) : ' ';
      const params = metodo.parametros 
        ? metodo.parametros.map(p => `${p.nombre}:${p.tipo}`).join(', ')
        : '';
      const retorno = metodo.tipoRetorno || 'void';
      const abstract = metodo.isAbstract ? ' {abstract}' : '';
      const esStatic = metodo.isStatic ? ' {static}' : '';
      texto += `${vis} ${metodo.nombre}(${params}) : ${retorno}${abstract}${esStatic}\n`;
    });
  }
  
  return texto;
}

/**
 * Obtiene el símbolo de visibilidad
 */
function obtenerSimboloVisibilidad(visibility: VisibilityModifier): string {
  const simbolos: Record<VisibilityModifier, string> = {
    public: '+',
    private: '-',
    protected: '#',
    package: '~'
  };
  return simbolos[visibility];
}

/**
 * Identifica el tipo de relación desde el objeto Joint.js
 */
function identificarTipoRelacion(relacion: any): string {
  // Lógica para identificar el tipo según los atributos de Joint.js
  // Esto depende de cómo se almacenan las relaciones en tu sistema
  
  const attrs = relacion.attrs || {};
  const markerTarget = attrs.line?.targetMarker?.d || '';
  
  if (markerTarget.includes('M -10 0 0 10 10 0 0 -10 z')) {
    return '◆─────→'; // Composición
  } else if (markerTarget.includes('M 0 -10 15 0 0 10 z')) {
    return '◇─────→'; // Agregación
  } else if (markerTarget.includes('M 0 -10 -15 0 0 10 z')) {
    return '─────▷'; // Herencia
  } else if (relacion.attrs?.line?.strokeDasharray) {
    return '----→'; // Dependencia
  } else {
    return '─────→'; // Asociación
  }
}

/**
 * Obtiene la multiplicidad de la relación
 */
function obtenerMultiplicidad(relacion: any): string {
  const sourceLabel = relacion.labels?.[0]?.attrs?.text?.text || '';
  const targetLabel = relacion.labels?.[1]?.attrs?.text?.text || '';
  
  if (sourceLabel || targetLabel) {
    return `(${sourceLabel || '1'} .. ${targetLabel || '*'})`;
  }
  
  return '';
}

/**
 * Procesa la respuesta de Claude y extrae sugerencias estructuradas
 */
export interface SugerenciaClaude {
  tipo: 'metodo' | 'atributo' | 'relacion' | 'validacion' | 'patron';
  clase?: string;
  contenido: string;
  prioridad: 'alta' | 'media' | 'baja';
}

export function procesarRespuestaClaude(respuesta: string): SugerenciaClaude[] {
  // Implementar parsing de la respuesta de Claude
  // para extraer sugerencias estructuradas
  
  const sugerencias: SugerenciaClaude[] = [];
  
  // Ejemplo básico de parsing (mejorar según necesidades)
  const lineas = respuesta.split('\n');
  
  lineas.forEach(linea => {
    if (linea.includes('getter') || linea.includes('setter')) {
      sugerencias.push({
        tipo: 'metodo',
        contenido: linea,
        prioridad: 'media'
      });
    } else if (linea.includes('atributo') || linea.includes('propiedad')) {
      sugerencias.push({
        tipo: 'atributo',
        contenido: linea,
        prioridad: 'baja'
      });
    } else if (linea.includes('relación') || linea.includes('asociación')) {
      sugerencias.push({
        tipo: 'relacion',
        contenido: linea,
        prioridad: 'alta'
      });
    }
  });
  
  return sugerencias;
}
