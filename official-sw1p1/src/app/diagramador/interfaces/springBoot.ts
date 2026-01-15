import { ElementoLink } from './jsonJoint.interface';

export class AtributosSB {
  nombre: string;
  tipo: string;

  constructor(nombre: string, tipo: string) {
    this.nombre = nombre;
    this.tipo = tipo;
  }
}

export class ClassJPA {
  contenido: string;
  attrsEspeciales: string[];

  constructor(contenido: string, attrsEspeciales: string[]) {
    this.contenido = contenido;
    this.attrsEspeciales = attrsEspeciales;
  }
}

export class TicketOneToOne {
  linkOneToOne: ElementoLink;
  origenStatus: number;
  destinoStatus: number;
  // LOGIC : ORIGEN =@OneToOne(cascade = CascadeType.ALL)
  // LOGIC : DESTINO =@OneToOne(mappedBy

  constructor(
    linkOneToOne: ElementoLink,
    origenStatus: number,
    destinoStatus: number
  ) {
    this.linkOneToOne = linkOneToOne;
    this.origenStatus = origenStatus;
    this.destinoStatus = destinoStatus;
  }
}
