/*! JointJS+ v4.0.1 - HTML5 Diagramming Framework - TRIAL VERSION

Copyright (c) 2024 client IO

 2024-09-07


This Source Code Form is subject to the terms of the JointJS+ Trial License
, v. 2.0. If a copy of the JointJS+ License was not distributed with this
file, You can obtain one at https://www.jointjs.com/license
 or from the JointJS+ archive as was distributed by client IO. See the LICENSE file.*/

export const sampleGraphs = {
  // credit goes to `http://www.continuitycentral.com/`
  emergencyProcedure: `
{
  "cells": [
    {
      "type": "standard.HeaderedRectangle",
      "position": {
        "x": 100,
        "y": 50
      },
      "size": {
        "width": 200,
        "height": 100
      },
      "angle": 0,
      "id": "9605c5c3-9c0d-4e5a-8511-cf5f2637435a",
      "z": 1,
      "attrs": {
        "root": {
          "dataTooltipPosition": "left",
          "dataTooltipPositionSelector": ".joint-stencil"
        },
        "body": {
          "stroke": "#31d0c6",
          "fill": "transparent",
          "strokeDasharray": "0"
        },
        "header": {
          "height": 20,
          "stroke": "#31d0c6",
          "fill": "#31d0c6",
          "strokeDasharray": "0"
        },
        "headerText": {
          "y": 10,
          "fontSize": 11,
          "fill": "#000000",
          "text": "Cliente",
          "fontFamily": "Averia Libre",
          "fontWeight": "Bold",
          "strokeWidth": 0
        },
        "bodyText": {
          "y": "calc(h/2 + 10)",
          "fontSize": 11,
          "fill": "#FFFFFF",
          "textWrap": {
            "text": "-id:integer\\n-nombre:varchar(255)\\n-meta:varchar(255)\\n-telefono:varchar(255)",
            "width": -10,
            "height": -20,
            "ellipsis": true
          },
          "fontFamily": "Averia Libre",
          "fontWeight": "Bold",
          "strokeWidth": 0
        }
      }
    },
    {
      "type": "standard.HeaderedRectangle",
      "position": {
        "x": 30,
        "y": 171
      },
      "size": {
        "width": 200,
        "height": 100
      },
      "angle": 0,
      "id": "c8c32bb6-3a8c-4c9d-bc42-f599966aa67c",
      "z": 2,
      "attrs": {
        "root": {
          "dataTooltipPosition": "left",
          "dataTooltipPositionSelector": ".joint-stencil"
        },
        "body": {
          "stroke": "#31d0c6",
          "fill": "transparent",
          "strokeDasharray": "0"
        },
        "header": {
          "height": 20,
          "stroke": "#31d0c6",
          "fill": "#31d0c6",
          "strokeDasharray": "0"
        },
        "headerText": {
          "y": 10,
          "fontSize": 11,
          "fill": "#000000",
          "text": "Rutina",
          "fontFamily": "Averia Libre",
          "fontWeight": "Bold",
          "strokeWidth": 0
        },
        "bodyText": {
          "y": "calc(h/2 + 10)",
          "fontSize": 11,
          "fill": "#FFFFFF",
          "textWrap": {
            "text": "-id:integer\\n-titulo:text",
            "width": -10,
            "height": -20,
            "ellipsis": true
          },
          "fontFamily": "Averia Libre",
          "fontWeight": "Bold",
          "strokeWidth": 0
        }
      }
    },
    {
      "type": "standard.HeaderedRectangle",
      "position": {
        "x": 300,
        "y": 310
      },
      "size": {
        "width": 200,
        "height": 100
      },
      "angle": 0,
      "id": "7d0f12b7-43eb-4cfa-aff7-7b31c0c088ef",
      "z": 3,
      "attrs": {
        "root": {
          "dataTooltipPosition": "left",
          "dataTooltipPositionSelector": ".joint-stencil"
        },
        "body": {
          "stroke": "#feb663",
          "fill": "transparent",
          "strokeDasharray": "0"
        },
        "header": {
          "height": 20,
          "stroke": "#feb663",
          "fill": "#feb663",
          "strokeDasharray": "0"
        },
        "headerText": {
          "y": 10,
          "fontSize": 11,
          "fill": "#000000",
          "text": "Rutina_Planejercicio",
          "fontFamily": "Averia Libre",
          "fontWeight": "Bold",
          "strokeWidth": 0
        },
        "bodyText": {
          "y": "calc(h/2 + 10)",
          "fontSize": 11,
          "fill": "#FFFFFF",
          "textWrap": {
            "text": "-id:integer",
            "width": -10,
            "height": -20,
            "ellipsis": true
          },
          "fontFamily": "Averia Libre",
          "fontWeight": "Bold",
          "strokeWidth": 0
        }
      }
    },
    {
      "type": "standard.HeaderedRectangle",
      "position": {
        "x": 560,
        "y": 171
      },
      "size": {
        "width": 200,
        "height": 100
      },
      "angle": 0,
      "id": "3787a278-9808-454a-9191-4248136561e3",
      "z": 4,
      "attrs": {
        "root": {
          "dataTooltipPosition": "left",
          "dataTooltipPositionSelector": ".joint-stencil"
        },
        "body": {
          "stroke": "#31d0c6",
          "fill": "transparent",
          "strokeDasharray": "0"
        },
        "header": {
          "height": 20,
          "stroke": "#31d0c6",
          "fill": "#31d0c6",
          "strokeDasharray": "0"
        },
        "headerText": {
          "y": 10,
          "fontSize": 11,
          "fill": "#000000",
          "text": "Planejercicio",
          "fontFamily": "Averia Libre",
          "fontWeight": "Bold",
          "strokeWidth": 0
        },
        "bodyText": {
          "y": "calc(h/2 + 10)",
          "fontSize": 11,
          "fill": "#FFFFFF",
          "textWrap": {
            "text": "-id:integer\\n-motivo:text\\n-proceso:text\\n-video:text\\n-titulo:text",
            "width": -10,
            "height": -20,
            "ellipsis": true
          },
          "fontFamily": "Averia Libre",
          "fontWeight": "Bold",
          "strokeWidth": 0
        }
      }
    },
    {
      "type": "standard.HeaderedRectangle",
      "position": {
        "x": 30,
        "y": 440
      },
      "size": {
        "width": 200,
        "height": 100
      },
      "angle": 0,
      "id": "45637230-81ce-436c-b83d-d57a9292e2b9",
      "z": 5,
      "attrs": {
        "root": {
          "dataTooltipPosition": "left",
          "dataTooltipPositionSelector": ".joint-stencil"
        },
        "body": {
          "stroke": "#31d0c6",
          "fill": "transparent",
          "strokeDasharray": "0"
        },
        "header": {
          "height": 20,
          "stroke": "#31d0c6",
          "fill": "#31d0c6",
          "strokeDasharray": "0"
        },
        "headerText": {
          "y": 10,
          "fontSize": 11,
          "fill": "#000000",
          "text": "PlanAlimentacion",
          "fontFamily": "Averia Libre",
          "fontWeight": "Bold",
          "strokeWidth": 0
        },
        "bodyText": {
          "y": "calc(h/2 + 10)",
          "fontSize": 11,
          "fill": "#FFFFFF",
          "textWrap": {
            "text": "-id:integer\\n-titulo:text\\n-descripcion:text\\n-noprocesado:text\\n-procesado:text",
            "width": -10,
            "height": -20,
            "ellipsis": true
          },
          "fontFamily": "Averia Libre",
          "fontWeight": "Bold",
          "strokeWidth": 0
        }
      }
    },
    {
      "type": "standard.HeaderedRectangle",
      "position": {
        "x": 710,
        "y": 330
      },
      "size": {
        "width": 200,
        "height": 100
      },
      "angle": 0,
      "id": "03b9e005-287b-4f7e-b21f-5b9f8b3ea9af",
      "z": 6,
      "attrs": {
        "root": {
          "dataTooltipPosition": "left",
          "dataTooltipPositionSelector": ".joint-stencil"
        },
        "body": {
          "stroke": "#feb663",
          "fill": "transparent",
          "strokeDasharray": "0"
        },
        "header": {
          "height": 20,
          "stroke": "#feb663",
          "fill": "#feb663",
          "strokeDasharray": "0"
        },
        "headerText": {
          "y": 10,
          "fontSize": 11,
          "fill": "#000000",
          "text": "Planejercicio_Categoriaejer",
          "fontFamily": "Averia Libre",
          "fontWeight": "Bold",
          "strokeWidth": 0
        },
        "bodyText": {
          "y": "calc(h/2 + 10)",
          "fontSize": 11,
          "fill": "#FFFFFF",
          "textWrap": {
            "text": "-id:integer",
            "width": -10,
            "height": -20,
            "ellipsis": true
          },
          "fontFamily": "Averia Libre",
          "fontWeight": "Bold",
          "strokeWidth": 0
        }
      }
    },
    {
      "type": "standard.HeaderedRectangle",
      "position": {
        "x": 710,
        "y": 500
      },
      "size": {
        "width": 200,
        "height": 100
      },
      "angle": 0,
      "id": "5a780138-19d7-4ff7-b6d4-4a1bd3c8fb94",
      "z": 7,
      "attrs": {
        "root": {
          "dataTooltipPosition": "left",
          "dataTooltipPositionSelector": ".joint-stencil"
        },
        "body": {
          "stroke": "#31d0c6",
          "fill": "transparent",
          "strokeDasharray": "0"
        },
        "header": {
          "height": 20,
          "stroke": "#31d0c6",
          "fill": "#31d0c6",
          "strokeDasharray": "0"
        },
        "headerText": {
          "y": 10,
          "fontSize": 11,
          "fill": "#000000",
          "text": "Categoriaejer",
          "fontFamily": "Averia Libre",
          "fontWeight": "Bold",
          "strokeWidth": 0
        },
        "bodyText": {
          "y": "calc(h/2 + 10)",
          "fontSize": 11,
          "fill": "#FFFFFF",
          "textWrap": {
            "text": "-id:integer\\n-descripcion:text\\n-nombre:text",
            "width": -10,
            "height": -20,
            "ellipsis": true
          },
          "fontFamily": "Averia Libre",
          "fontWeight": "Bold",
          "strokeWidth": 0
        }
      }
    },
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
              "text": "0...*",
              "fill": null
            }
          }
        }
      ],
      "source": {
        "id": "c8c32bb6-3a8c-4c9d-bc42-f599966aa67c"
      },
      "target": {
        "id": "7d0f12b7-43eb-4cfa-aff7-7b31c0c088ef"
      },
      "id": "a026bafe-9785-4dfb-b093-1b28f5061e33",
      "z": 8,
      "attrs": {}
    },
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
              "text": "1...*",
              "fill": null
            }
          }
        }
      ],
      "source": {
        "id": "3787a278-9808-454a-9191-4248136561e3"
      },
      "target": {
        "id": "7d0f12b7-43eb-4cfa-aff7-7b31c0c088ef"
      },
      "id": "17c28736-7b06-4dc4-b934-fe51593305d6",
      "z": 9,
      "attrs": {}
    },
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
              "text": "0...*",
              "fill": null
            }
          },
          "position": {
            "distance": 0.24522292993630573,
            "offset": 0,
            "angle": 0
          }
        },
        {
          "attrs": {
            "text": {
              "text": "1...1",
              "fill": null
            }
          },
          "position": {
            "distance": 0.7547770700636943,
            "offset": 0,
            "angle": 0
          }
        }
      ],
      "source": {
        "id": "c8c32bb6-3a8c-4c9d-bc42-f599966aa67c"
      },
      "target": {
        "id": "45637230-81ce-436c-b83d-d57a9292e2b9"
      },
      "id": "14f42aaf-f334-4dae-95d1-a5e4c284abea",
      "z": 10,
      "attrs": {}
    },
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
              "text": "0...*",
              "fill": null
            }
          }
        }
      ],
      "source": {
        "id": "3787a278-9808-454a-9191-4248136561e3"
      },
      "target": {
        "id": "03b9e005-287b-4f7e-b21f-5b9f8b3ea9af"
      },
      "id": "91796f61-80ae-4d2a-9336-035a04702705",
      "z": 11,
      "attrs": {}
    },
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
              "text": "1...*",
              "fill": null
            }
          }
        }
      ],
      "source": {
        "id": "5a780138-19d7-4ff7-b6d4-4a1bd3c8fb94"
      },
      "target": {
        "id": "03b9e005-287b-4f7e-b21f-5b9f8b3ea9af"
      },
      "id": "fd4e2179-ac7e-479c-9eda-d83b36841109",
      "z": 12,
      "attrs": {}
    },
    {
      "type": "standard.HeaderedRectangle",
      "position": {
        "x": 70,
        "y": 610
      },
      "size": {
        "width": 120,
        "height": 90
      },
      "angle": 0,
      "id": "e5af29f2-906c-4d2a-b649-c90cca4bc96f",
      "z": 13,
      "attrs": {
        "root": {
          "dataTooltipPosition": "left",
          "dataTooltipPositionSelector": ".joint-stencil"
        },
        "body": {
          "stroke": "#31d0c6",
          "fill": "transparent",
          "strokeDasharray": "0"
        },
        "header": {
          "height": 20,
          "stroke": "#31d0c6",
          "fill": "#31d0c6",
          "strokeDasharray": "0"
        },
        "headerText": {
          "y": 10,
          "fontSize": 11,
          "fill": "#000000",
          "text": "Aclass",
          "fontFamily": "Averia Libre",
          "fontWeight": "Bold",
          "strokeWidth": 0
        },
        "bodyText": {
          "y": "calc(h/2 + 10)",
          "fontSize": 11,
          "fill": "#FFFFFF",
          "textWrap": {
            "text": "-id:integer\\n-descripcion:text",
            "width": -10,
            "height": -20,
            "ellipsis": true
          },
          "fontFamily": "Averia Libre",
          "fontWeight": "Bold",
          "strokeWidth": 0
        }
      }
    },
    {
      "type": "standard.HeaderedRectangle",
      "position": {
        "x": 260,
        "y": 810
      },
      "size": {
        "width": 140,
        "height": 80
      },
      "angle": 0,
      "id": "2d67df8e-707d-4eb6-a68d-5bf4241e2354",
      "z": 14,
      "attrs": {
        "root": {
          "dataTooltipPosition": "left",
          "dataTooltipPositionSelector": ".joint-stencil"
        },
        "body": {
          "stroke": "#31d0c6",
          "fill": "transparent",
          "strokeDasharray": "0"
        },
        "header": {
          "height": 20,
          "stroke": "#31d0c6",
          "fill": "#31d0c6",
          "strokeDasharray": "0"
        },
        "headerText": {
          "y": 10,
          "fontSize": 11,
          "fill": "#000000",
          "text": "Bclass",
          "fontFamily": "Averia Libre",
          "fontWeight": "Bold",
          "strokeWidth": 0
        },
        "bodyText": {
          "y": "calc(h/2 + 10)",
          "fontSize": 11,
          "fill": "#FFFFFF",
          "textWrap": {
            "text": "-id:integer\\n-descripcion:text",
            "width": -10,
            "height": -20,
            "ellipsis": true
          },
          "fontFamily": "Averia Libre",
          "fontWeight": "Bold",
          "strokeWidth": 0
        }
      }
    },
    {
      "type": "standard.HeaderedRectangle",
      "position": {
        "x": 410,
        "y": 620
      },
      "size": {
        "width": 130,
        "height": 70
      },
      "angle": 0,
      "id": "478ea83d-5f89-4d1e-8c3c-be49d8baded9",
      "z": 15,
      "attrs": {
        "root": {
          "dataTooltipPosition": "left",
          "dataTooltipPositionSelector": ".joint-stencil"
        },
        "body": {
          "stroke": "#31d0c6",
          "fill": "transparent",
          "strokeDasharray": "0"
        },
        "header": {
          "height": 20,
          "stroke": "#31d0c6",
          "fill": "#31d0c6",
          "strokeDasharray": "0"
        },
        "headerText": {
          "y": 10,
          "fontSize": 11,
          "fill": "#000000",
          "text": "Cclass",
          "fontFamily": "Averia Libre",
          "fontWeight": "Bold",
          "strokeWidth": 0
        },
        "bodyText": {
          "y": "calc(h/2 + 10)",
          "fontSize": 11,
          "fill": "#FFFFFF",
          "textWrap": {
            "text": "-id:integer\\n-descripcion:text",
            "width": -10,
            "height": -20,
            "ellipsis": true
          },
          "fontFamily": "Averia Libre",
          "fontWeight": "Bold",
          "strokeWidth": 0
        }
      }
    },
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
              "text": "0...1",
              "fill": null
            }
          },
          "position": {
            "distance": 0.18707765079833874,
            "offset": -0.5377134386921886,
            "angle": 0
          }
        },
        {
          "attrs": {
            "text": {
              "text": "0...1",
              "fill": null
            }
          },
          "position": {
            "distance": 0.7086150563419461,
            "offset": 0.3585003537443095,
            "angle": 0
          }
        }
      ],
      "source": {
        "id": "e5af29f2-906c-4d2a-b649-c90cca4bc96f"
      },
      "target": {
        "id": "2d67df8e-707d-4eb6-a68d-5bf4241e2354"
      },
      "id": "92012fc8-8299-4bff-945a-e142faea16d9",
      "z": 16,
      "attrs": {
        "line": {
          "targetMarker": {
            "d": "M -10 0 0 10 10 0 0 -10 z",
            "fill": null
          }
        }
      }
    },
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
              "text": "0...1",
              "fill": null
            }
          },
          "position": {
            "distance": 0.7097902097902098,
            "offset": 0,
            "angle": 0
          }
        },
        {
          "attrs": {
            "text": {
              "text": "1...1",
              "fill": null
            }
          },
          "position": {
            "distance": 0.2044334975369458,
            "offset": 0,
            "angle": 0
          }
        }
      ],
      "source": {
        "id": "478ea83d-5f89-4d1e-8c3c-be49d8baded9"
      },
      "target": {
        "id": "e5af29f2-906c-4d2a-b649-c90cca4bc96f"
      },
      "id": "29305b86-6da9-4ccb-bf06-1a7972f3d55b",
      "z": 17,
      "vertices": [],
      "attrs": {
        "line": {
          "targetMarker": {
            "d": "M 0 -10 15 0 0 10 z",
            "fill": null
          }
        }
      }
    },
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
              "text": "0...1",
              "fill": null
            }
          },
          "position": {
            "distance": 0.2283305464144601,
            "offset": 1.8522459729908611,
            "angle": 0
          }
        },
        {
          "attrs": {
            "text": {
              "text": "0...1",
              "fill": null
            }
          },
          "position": {
            "distance": 0.7716692940282098,
            "offset": -1.8522089501032777,
            "angle": 0
          }
        }
      ],
      "source": {
        "id": "478ea83d-5f89-4d1e-8c3c-be49d8baded9"
      },
      "target": {
        "id": "2d67df8e-707d-4eb6-a68d-5bf4241e2354"
      },
      "id": "160bcc35-a75f-4f16-9aa9-29b2f0363f0d",
      "z": 18,
      "attrs": {
        "line": {
          "targetMarker": {
            "d": "M 0 -10 -15 0 0 10 z",
            "fill": null
          }
        }
      }
    },
    {
      "type": "standard.HeaderedRectangle",
      "position": {
        "x": 680,
        "y": 720
      },
      "size": {
        "width": 200,
        "height": 100
      },
      "angle": 0,
      "id": "9085cb51-f8f8-4fb2-9f6a-cece9aa02eab",
      "z": 19,
      "attrs": {
        "root": {
          "dataTooltipPosition": "left",
          "dataTooltipPositionSelector": ".joint-stencil"
        },
        "body": {
          "stroke": "#31d0c6",
          "fill": "transparent",
          "strokeDasharray": "0"
        },
        "header": {
          "height": 20,
          "stroke": "#31d0c6",
          "fill": "#31d0c6",
          "strokeDasharray": "0"
        },
        "headerText": {
          "y": 10,
          "fontSize": 11,
          "fill": "#000000",
          "text": "Dclass",
          "fontFamily": "Averia Libre",
          "fontWeight": "Bold",
          "strokeWidth": 0
        },
        "bodyText": {
          "y": "calc(h/2 + 10)",
          "fontSize": 11,
          "fill": "#FFFFFF",
          "textWrap": {
            "text": "-id:integer\\n-descripcion:text",
            "width": -10,
            "height": -20,
            "ellipsis": true
          },
          "fontFamily": "Averia Libre",
          "fontWeight": "Bold",
          "strokeWidth": 0
        }
      }
    },
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
              "text": "1...1",
              "fill": null
            }
          },
          "position": {
            "distance": 0.1035328943746664,
            "offset": 3.11529541015625,
            "angle": 0
          }
        },
        {
          "attrs": {
            "text": {
              "text": "0...*",
              "fill": null
            }
          },
          "position": {
            "distance": 0.8881969633010877,
            "offset": 0,
            "angle": 0
          }
        }
      ],
      "source": {
        "id": "9085cb51-f8f8-4fb2-9f6a-cece9aa02eab"
      },
      "target": {
        "id": "9085cb51-f8f8-4fb2-9f6a-cece9aa02eab"
      },
      "id": "2e87e21d-7a04-46aa-b2ab-29ce3dcf2c10",
      "z": 20,
      "vertices": [
        {
          "x": 780,
          "y": 880
        },
        {
          "x": 620,
          "y": 880
        },
        {
          "x": 620,
          "y": 770
        }
      ],
      "attrs": {}
    }
  ]
}
    `,
};
