/**
 * Utilidades para formateo UML 2.5
 * Maneja la notación estándar de UML 2.5 para atributos, métodos y visibilidad
 * 
 * @author Jkarlos
 * @date 2026
 */

import { AtributoClase, MetodoClase, ParametroMetodo, VisibilityModifier, VisibilitySymbols } from '../interfaces/jsonJoint.interface';

/**
 * Formatea un atributo según notación UML 2.5
 * Formato: [visibility] [name] : [type] [= defaultValue]
 * 
 * Ejemplos:
 * - nombre : String
 * + id : Integer
 * - password : String
 * # createdAt : Date = now()
 * ~ status : Boolean = true
 * 
 * @param atributo Atributo a formatear
 * @returns String formateado según UML 2.5
 */
export function formatearAtributoUML(atributo: AtributoClase): string {
  let resultado = '';
  
  // 1. Agregar símbolo de visibilidad
  if (atributo.visibility) {
    resultado += VisibilitySymbols[atributo.visibility] + ' ';
  }
  
  // 2. Agregar nombre del atributo
  resultado += atributo.titulo;
  
  // 3. Agregar tipo si existe
  if (atributo.tipo) {
    resultado += ' : ' + atributo.tipo;
  }
  
  // 4. Agregar valor por defecto si existe
  if (atributo.defaultValue) {
    resultado += ' = ' + atributo.defaultValue;
  }
  
  return resultado;
}

/**
 * Formatea un método según notación UML 2.5
 * Formato: [visibility] [name]([param1:type1, param2:type2]) : [returnType]
 * 
 * Ejemplos:
 * + getNombre() : String
 * - validar(email:String) : Boolean
 * # calcular(a:Integer, b:Integer) : Integer
 * + guardar() : void
 * ~ inicializar() : void
 * 
 * @param metodo Método a formatear
 * @returns String formateado según UML 2.5
 */
export function formatearMetodoUML(metodo: MetodoClase): string {
  let resultado = '';
  
  // 1. Agregar símbolo de visibilidad
  if (metodo.visibility) {
    resultado += VisibilitySymbols[metodo.visibility] + ' ';
  }
  
  // 2. Agregar nombre del método
  resultado += metodo.nombre;
  
  // 3. Agregar parámetros
  resultado += '(';
  if (metodo.parametros && metodo.parametros.length > 0) {
    const params = metodo.parametros.map(p => formatearParametro(p)).join(', ');
    resultado += params;
  }
  resultado += ')';
  
  // 4. Agregar tipo de retorno
  if (metodo.tipoRetorno) {
    resultado += ' : ' + metodo.tipoRetorno;
  }
  
  return resultado;
}

/**
 * Formatea un parámetro de método
 * Formato: [name]:[type] [= defaultValue]
 * 
 * @param parametro Parámetro a formatear
 * @returns String formateado
 */
function formatearParametro(parametro: ParametroMetodo): string {
  let resultado = parametro.nombre + ':' + parametro.tipo;
  
  if (parametro.defaultValue) {
    resultado += ' = ' + parametro.defaultValue;
  }
  
  return resultado;
}

/**
 * Parsea un string de atributo UML y retorna el objeto AtributoClase
 * Soporta formatos:
 * - "nombre : String"
 * - "+ nombre : String"
 * - "- password : String = '123'"
 * 
 * @param atributoStr String del atributo en formato UML
 * @param id ID para el atributo
 * @returns Objeto AtributoClase
 */
export function parsearAtributoUML(atributoStr: string, id: string): AtributoClase {
  const atributo: AtributoClase = {
    id,
    titulo: '',
  };
  
  let str = atributoStr.trim();
  
  // 1. Detectar visibilidad
  const firstChar = str.charAt(0);
  if (firstChar === '+') {
    atributo.visibility = 'public';
    str = str.substring(1).trim();
  } else if (firstChar === '-') {
    atributo.visibility = 'private';
    str = str.substring(1).trim();
  } else if (firstChar === '#') {
    atributo.visibility = 'protected';
    str = str.substring(1).trim();
  } else if (firstChar === '~') {
    atributo.visibility = 'package';
    str = str.substring(1).trim();
  }
  
  // 2. Separar por valor por defecto si existe
  const defaultSplit = str.split('=');
  if (defaultSplit.length > 1) {
    atributo.defaultValue = defaultSplit[1].trim();
    str = defaultSplit[0].trim();
  }
  
  // 3. Separar nombre y tipo
  const typeSplit = str.split(':');
  if (typeSplit.length > 1) {
    atributo.titulo = typeSplit[0].trim();
    atributo.tipo = typeSplit[1].trim();
  } else {
    atributo.titulo = str;
  }
  
  return atributo;
}

/**
 * Parsea un string de método UML y retorna el objeto MetodoClase
 * Soporta formatos:
 * - "getNombre() : String"
 * - "+ calcular(a:Integer, b:Integer) : Integer"
 * - "- validar(email:String) : Boolean"
 * 
 * @param metodoStr String del método en formato UML
 * @param id ID para el método
 * @returns Objeto MetodoClase
 */
export function parsearMetodoUML(metodoStr: string, id: string): MetodoClase {
  const metodo: MetodoClase = {
    id,
    nombre: '',
  };
  
  let str = metodoStr.trim();
  
  // 1. Detectar visibilidad
  const firstChar = str.charAt(0);
  if (firstChar === '+') {
    metodo.visibility = 'public';
    str = str.substring(1).trim();
  } else if (firstChar === '-') {
    metodo.visibility = 'private';
    str = str.substring(1).trim();
  } else if (firstChar === '#') {
    metodo.visibility = 'protected';
    str = str.substring(1).trim();
  } else if (firstChar === '~') {
    metodo.visibility = 'package';
    str = str.substring(1).trim();
  }
  
  // 2. Separar por tipo de retorno
  const returnSplit = str.split(':');
  if (returnSplit.length > 1) {
    metodo.tipoRetorno = returnSplit[1].trim();
    str = returnSplit[0].trim();
  }
  
  // 3. Extraer nombre y parámetros
  const paramMatch = str.match(/^([^(]+)\(([^)]*)\)$/);
  if (paramMatch) {
    metodo.nombre = paramMatch[1].trim();
    
    // Parsear parámetros
    const paramsStr = paramMatch[2].trim();
    if (paramsStr) {
      metodo.parametros = paramsStr.split(',').map(p => {
        const parts = p.trim().split(':');
        const param: ParametroMetodo = {
          nombre: parts[0].trim(),
          tipo: parts.length > 1 ? parts[1].trim() : 'Object'
        };
        return param;
      });
    }
  } else {
    metodo.nombre = str;
  }
  
  return metodo;
}

/**
 * Genera un texto UML completo para una clase con atributos y métodos
 * 
 * @param atributos Array de atributos
 * @param metodos Array de métodos
 * @returns String con el formato completo separado por líneas
 */
export function generarTextoClaseUML(atributos: AtributoClase[], metodos?: MetodoClase[]): string {
  let texto = '';
  
  // Agregar atributos
  if (atributos && atributos.length > 0) {
    texto += atributos.map(a => formatearAtributoUML(a)).join('\n');
  }
  
  // Agregar separador entre atributos y métodos si hay ambos
  if (atributos && atributos.length > 0 && metodos && metodos.length > 0) {
    texto += '\n---\n'; // Línea separadora UML
  }
  
  // Agregar métodos
  if (metodos && metodos.length > 0) {
    texto += metodos.map(m => formatearMetodoUML(m)).join('\n');
  }
  
  return texto;
}

/**
 * Obtiene el símbolo de visibilidad desde el modificador
 */
export function obtenerSimboloVisibilidad(visibility?: VisibilityModifier): string {
  if (!visibility) return '';
  return VisibilitySymbols[visibility];
}

/**
 * Obtiene el modificador de visibilidad desde el símbolo
 */
export function obtenerVisibilidadDesdeSimbol(symbol: string): VisibilityModifier | undefined {
  switch (symbol) {
    case '+': return 'public';
    case '-': return 'private';
    case '#': return 'protected';
    case '~': return 'package';
    default: return undefined;
  }
}
