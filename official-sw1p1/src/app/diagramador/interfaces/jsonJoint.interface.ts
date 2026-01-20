/**
 * Modificadores de visibilidad según UML 2.5
 */
export type VisibilityModifier = 'public' | 'private' | 'protected' | 'package';

/**
 * Símbolos UML 2.5 para visibilidad
 * + = public
 * - = private  
 * # = protected
 * ~ = package/default
 */
export const VisibilitySymbols: Record<VisibilityModifier, string> = {
  public: '+',
  private: '-',
  protected: '#',
  package: '~'
};

/**
 * Atributo de clase según UML 2.5
 */
export interface AtributoClase {
  id: string;
  titulo: string;
  tipo?: string; // Tipo de dato del atributo
  visibility?: VisibilityModifier; // Modificador de visibilidad
  isStatic?: boolean; // Si es estático (subrayado en UML)
  defaultValue?: string; // Valor por defecto
}

/**
 * Método de clase según UML 2.5
 */
export interface MetodoClase {
  id: string;
  nombre: string;
  parametros?: ParametroMetodo[]; // Parámetros del método
  tipoRetorno?: string; // Tipo de retorno (void, string, int, etc.)
  visibility?: VisibilityModifier; // Modificador de visibilidad
  isStatic?: boolean; // Si es estático
  isAbstract?: boolean; // Si es abstracto (cursiva en UML)
}

/**
 * Parámetro de método
 */
export interface ParametroMetodo {
  nombre: string;
  tipo: string;
  defaultValue?: string;
}

export interface ElementoClase {
  id: string;
  titulo: string;
  posicion: number[];
  size: number[];
  atributos: AtributoClase[];
  metodos?: MetodoClase[]; // ⭐ NUEVO: Métodos de la clase
  isAbstract?: boolean; // Si es clase abstracta
  isInterface?: boolean; // Si es interface
  stereotype?: string; // Estereotipo (<<entity>>, <<controller>>, etc.)
  // LOGIC : #feb663 = Clase Intermedia , #31d0c6 = Clase Normal
  color: string;
}

export interface ElementoLink {
  id: string;
  origen: ElementoCabezera;
  destino: ElementoCabezera;
  // LOGIC : 1 LINK CLASE INTERMEDIA , 2 LINK CLASE NORMAL
  // LOGIC : 1 ATRIBUTO = 0.5 , 2 ATRIBUTOS = [0.2,0.8]
  // LOGIC : 1 ATRIBUTO = ORIGEN , 2 ATRIBUTOS = DESTINO
  atributos: string[];
}

export interface ElementoCabezera {
  id: string;
  // LOGIC : ASOCIACION = 'M 0 0 0 0'
  // LOGIC : COMPOSICION = 'M -10 0 0 10 10 0 0 -10 z'
  // LOGIC : AGREGACION = 'M 0 -10 15 0 0 10 z'
  // LOGIC : HERENCIA = 'M 0 -10 -15 0 0 10 z'
  // LOGIC : DEPENDENCIA = 'M 0 -10 L 2.94 -3.09 L 9.51 -3.09 L 4.29 1.18 L 6.18 8.09 L 0 5 L -6.18 8.09 L -4.29 1.18 L -9.51 -3.09 L -2.94 -3.09 Z',
  tipo: string;
  normal: string;
}

// Movido arriba para incluir visibility y tipo

export interface DetalleClaseIntermedia {
  claseNormal: ElementoClase;
  link: ElementoLink;
  claseIntermedia: ElementoClase;
}

export interface ConnectorXML {
  id: string;
  origen: string;
  destino: string;
  // LOGIC: aggregation
  destinoType: string;
  // LOGIC: ea_type
  properties: string;
  // LOGIC: extendedProperties => associationClass
  intermedia: string;
}
