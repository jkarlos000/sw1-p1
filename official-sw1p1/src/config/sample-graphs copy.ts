/*! JointJS+ v4.0.1 - HTML5 Diagramming Framework - TRIAL VERSION

Copyright (c) 2024 client IO

 2024-09-07


This Source Code Form is subject to the terms of the JointJS+ Trial License
, v. 2.0. If a copy of the JointJS+ License was not distributed with this
file, You can obtain one at https://www.jointjs.com/license
 or from the JointJS+ archive as was distributed by client IO. See the LICENSE file.*/

export const sampleGraphs = {
  // Ejemplo completo de UML 2.5 - Sistema de Biblioteca
  emergencyProcedure: `
{
  "cells": [
    {
      "type": "standard.HeaderedRectangle",
      "position": { "x": 50, "y": 50 },
      "size": { "width": 220, "height": 180 },
      "angle": 0,
      "id": "clase-usuario",
      "z": 1,
      "attrs": {
        "body": { "stroke": "#31d0c6", "fill": "transparent", "strokeDasharray": "0" },
        "header": { "height": 20, "stroke": "#31d0c6", "fill": "#31d0c6", "strokeDasharray": "0" },
        "headerText": {
          "text": "Usuario",
          "fontSize": 12,
          "fill": "#000000",
          "fontFamily": "Averia Libre",
          "fontWeight": "Bold"
        },
        "bodyText": {
          "textWrap": {
            "text": "- id : Integer\\n- nombre : String\\n- email : String\\n- fechaRegistro : Date\\n───────────────────────\\n+ validarEmail(email : String) : Boolean\\n+ cambiarNombre(nuevoNombre : String) : void\\n+ calcularAntiguedad() : Integer\\n# notificar(mensaje : String) : void",
            "width": -10,
            "height": -20
          },
          "fontSize": 10,
          "fill": "#FFFFFF",
          "fontFamily": "Courier New",
          "fontWeight": "normal"
        }
      }
    },
    {
      "type": "standard.HeaderedRectangle",
      "position": { "x": 350, "y": 50 },
      "size": { "width": 240, "height": 200 },
      "angle": 0,
      "id": "clase-libro",
      "z": 2,
      "attrs": {
        "body": { "stroke": "#31d0c6", "fill": "transparent", "strokeDasharray": "0" },
        "header": { "height": 20, "stroke": "#31d0c6", "fill": "#31d0c6", "strokeDasharray": "0" },
        "headerText": {
          "text": "Libro",
          "fontSize": 12,
          "fill": "#000000",
          "fontFamily": "Averia Libre",
          "fontWeight": "Bold"
        },
        "bodyText": {
          "textWrap": {
            "text": "- isbn : String\\n- titulo : String\\n- autor : String\\n- anioPublicacion : Integer\\n- disponible : Boolean\\n───────────────────────\\n+ prestar(usuario : Usuario) : Prestamo\\n+ devolver() : void\\n+ estaDisponible() : Boolean\\n+ getInformacion() : String\\n- actualizarEstado(estado : Boolean) : void",
            "width": -10,
            "height": -20
          },
          "fontSize": 10,
          "fill": "#FFFFFF",
          "fontFamily": "Courier New",
          "fontWeight": "normal"
        }
      }
    },
    {
      "type": "standard.HeaderedRectangle",
      "position": { "x": 680, "y": 50 },
      "size": { "width": 260, "height": 180 },
      "angle": 0,
      "id": "clase-biblioteca",
      "z": 3,
      "attrs": {
        "body": { "stroke": "#FFA500", "fill": "transparent", "strokeDasharray": "0" },
        "header": { "height": 20, "stroke": "#FFA500", "fill": "#FFA500", "strokeDasharray": "0" },
        "headerText": {
          "text": "Biblioteca",
          "fontSize": 12,
          "fill": "#000000",
          "fontFamily": "Averia Libre",
          "fontWeight": "Bold"
        },
        "bodyText": {
          "textWrap": {
            "text": "- nombre : String\\n- direccion : String\\n- libros : List<Libro>\\n───────────────────────\\n+ agregarLibro(libro : Libro) : void\\n+ buscarLibro(isbn : String) : Libro\\n+ listarDisponibles() : List<Libro>\\n+ registrarPrestamo(libro : Libro, usuario : Usuario) : Prestamo",
            "width": -10,
            "height": -20
          },
          "fontSize": 10,
          "fill": "#FFFFFF",
          "fontFamily": "Courier New",
          "fontWeight": "normal"
        }
      }
    },
    {
      "type": "standard.HeaderedRectangle",
      "position": { "x": 200, "y": 320 },
      "size": { "width": 240, "height": 180 },
      "angle": 0,
      "id": "clase-prestamo",
      "z": 4,
      "attrs": {
        "body": { "stroke": "#9C27B0", "fill": "transparent", "strokeDasharray": "0" },
        "header": { "height": 20, "stroke": "#9C27B0", "fill": "#9C27B0", "strokeDasharray": "0" },
        "headerText": {
          "text": "Prestamo",
          "fontSize": 12,
          "fill": "#FFFFFF",
          "fontFamily": "Averia Libre",
          "fontWeight": "Bold"
        },
        "bodyText": {
          "textWrap": {
            "text": "- id : Integer\\n- fechaPrestamo : Date\\n- fechaDevolucion : Date\\n- estadoPrestamo : String\\n───────────────────────\\n+ calcularDiasRestantes() : Integer\\n+ estaVencido() : Boolean\\n+ extenderPlazo(dias : Integer) : void\\n+ marcarDevuelto() : void\\n# calcularMulta() : Double",
            "width": -10,
            "height": -20
          },
          "fontSize": 10,
          "fill": "#FFFFFF",
          "fontFamily": "Courier New",
          "fontWeight": "normal"
        }
      }
    },
    {
      "type": "standard.Link",
      "source": { "id": "clase-usuario" },
      "target": { "id": "clase-prestamo" },
      "id": "relacion-usuario-prestamo",
      "z": 5,
      "attrs": {
        "line": { 
          "stroke": "#31d0c6", 
          "strokeWidth": 2,
          "sourceMarker": {
            "d": "M 0 0 0 0"
          },
          "targetMarker": {
            "d": "M 0 -10 15 0 0 10 z",
            "fill": "#31d0c6"
          }
        }
      },
      "labels": [
        { 
          "attrs": { 
            "text": { 
              "text": "1", 
              "fill": "#FFFFFF",
              "fontSize": 14,
              "fontWeight": "bold"
            },
            "rect": {
              "fill": "#31d0c6",
              "stroke": "#31d0c6",
              "strokeWidth": 0,
              "rx": 3,
              "ry": 3
            }
          }, 
          "position": { "distance": 0.15, "offset": 15 }
        },
        { 
          "attrs": { 
            "text": { 
              "text": "0..*", 
              "fill": "#FFFFFF",
              "fontSize": 14,
              "fontWeight": "bold"
            },
            "rect": {
              "fill": "#31d0c6",
              "stroke": "#31d0c6",
              "strokeWidth": 0,
              "rx": 3,
              "ry": 3
            }
          }, 
          "position": { "distance": 0.85, "offset": 15 }
        }
      ]
    },
    {
      "type": "standard.Link",
      "source": { "id": "clase-libro" },
      "target": { "id": "clase-prestamo" },
      "id": "relacion-libro-prestamo",
      "z": 6,
      "attrs": {
        "line": { 
          "stroke": "#31d0c6", 
          "strokeWidth": 2,
          "sourceMarker": {
            "d": "M 0 0 0 0"
          },
          "targetMarker": {
            "d": "M 0 -10 15 0 0 10 z",
            "fill": "#31d0c6"
          }
        }
      },
      "labels": [
        { 
          "attrs": { 
            "text": { 
              "text": "1", 
              "fill": "#FFFFFF",
              "fontSize": 14,
              "fontWeight": "bold"
            },
            "rect": {
              "fill": "#31d0c6",
              "stroke": "#31d0c6",
              "strokeWidth": 0,
              "rx": 3,
              "ry": 3
            }
          }, 
          "position": { "distance": 0.15, "offset": -15 }
        },
        { 
          "attrs": { 
            "text": { 
              "text": "0..*", 
              "fill": "#FFFFFF",
              "fontSize": 14,
              "fontWeight": "bold"
            },
            "rect": {
              "fill": "#31d0c6",
              "stroke": "#31d0c6",
              "strokeWidth": 0,
              "rx": 3,
              "ry": 3
            }
          }, 
          "position": { "distance": 0.85, "offset": -15 }
        }
      ]
    },
    {
      "type": "standard.Link",
      "source": { "id": "clase-biblioteca" },
      "target": { "id": "clase-libro" },
      "id": "relacion-biblioteca-libro",
      "z": 7,
      "attrs": {
        "line": { 
          "stroke": "#FFA500", 
          "strokeWidth": 2,
          "sourceMarker": {
            "d": "M -10 0 0 10 10 0 0 -10 z",
            "fill": "#FFA500"
          },
          "targetMarker": {
            "d": "M 0 0 0 0"
          }
        }
      },
      "labels": [
        { 
          "attrs": { 
            "text": { 
              "text": "1", 
              "fill": "#FFFFFF",
              "fontSize": 14,
              "fontWeight": "bold"
            },
            "rect": {
              "fill": "#FFA500",
              "stroke": "#FFA500",
              "strokeWidth": 0,
              "rx": 3,
              "ry": 3
            }
          }, 
          "position": { "distance": 0.15, "offset": 15 }
        },
        { 
          "attrs": { 
            "text": { 
              "text": "1..*", 
              "fill": "#FFFFFF",
              "fontSize": 14,
              "fontWeight": "bold"
            },
            "rect": {
              "fill": "#FFA500",
              "stroke": "#FFA500",
              "strokeWidth": 0,
              "rx": 3,
              "ry": 3
            }
          }, 
          "position": { "distance": 0.85, "offset": 15 }
        }
      ]
    }
  ]
}
  `
};
