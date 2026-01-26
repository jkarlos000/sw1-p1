import Anthropic from "@anthropic-ai/sdk";
import * as fs from "fs";
import * as path from "path";

/**
 * Servicio para interpretar mockups dibujados a mano usando Claude Vision
 */
export class ClaudeVisionService {
  private client: Anthropic;

  constructor() {
    this.client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }

  /**
   * Interpreta una imagen de mockup y extrae componentes Flutter
   */
  async interpretarMockup(imagenBase64: string, className?: string): Promise<any> {
    try {
      console.log("🤖 Iniciando interpretación con Claude Vision...");

      // Prompt para Claude Vision
      const prompt = this.generarPrompt(className);

      // Llamada a Claude Vision API
      const message = await this.client.messages.create({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 2048,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image",
                source: {
                  type: "base64",
                  media_type: "image/jpeg",
                  data: imagenBase64,
                },
              },
              {
                type: "text",
                text: prompt,
              },
            ],
          },
        ],
      });

      // Extraer el contenido de texto
      const responseText =
        message.content[0].type === "text" ? message.content[0].text : "";

      console.log("📝 Respuesta de Claude:", responseText.substring(0, 100) + "...");

      // Parsear respuesta JSON
      const resultado = this.parseRespuesta(responseText);
      return resultado;
    } catch (error: any) {
      console.error("❌ Error en interpretación Claude Vision:", error);
      throw new Error(`Error interpretando mockup: ${error.message}`);
    }
  }

  /**
   * Genera el prompt para Claude Vision
   */
  private generarPrompt(className?: string): string {
    return `Analiza este mockup de Flutter dibujado a mano.

INSTRUCCIONES:
1. Identifica el NOMBRE DE LA CLASE (siempre arriba del screen). Si no lo encuentras, usa el nombre proporcionado o "Screen"
2. Detecta componentes Flutter según formas:
   - Rectángulos con líneas internas = TextField
   - Rectángulos rellenos grandes = Button/ElevatedButton
   - Rectángulos con solo borde = OutlinedButton/TextButton
   - Texto pequeño sin rectángulo = TextButton
   - Lista de elementos = ListView
   - Cuadrícula = GridView
   - Icono o símbolo pequeño = Icon
   - Contenedor genérico = Container
3. Extrae POSICIÓN RELATIVA (1, 2, 3... de arriba a abajo)
4. Detecta anotaciones de texto del usuario
5. Si hay MÚLTIPLES SCREENS, identifica cada uno por su nombre de clase

${className ? `NOTA: La clase principal se llama "${className}". Si ves componentes para esa clase, inclúyelos.` : ""}

FORMATO DE SALIDA (JSON válido):
\`\`\`json
{
  "screens": [
    {
      "className": "NombreDeLaClase",
      "components": [
        {
          "type": "TextField|Button|TextButton|ListView|AppBar|Icon|Container|ElevatedButton",
          "label": "texto del componente",
          "position": 1,
          "size": "small|medium|large",
          "variant": "elevated|outlined|text"
        }
      ]
    }
  ]
}
\`\`\`

REGLAS IMPORTANTES:
- NO inventes componentes que no veas
- Si el dibujo es confuso, usa type "Container" genérico
- SIEMPRE incluye el className
- Los componentes DEBEN estar en orden vertical (position 1, 2, 3...)
- Si no hay componentes claros, devuelve array vacío en "components"
- Responde SOLO con JSON válido, sin explicación adicional`;
  }

  /**
   * Parsea la respuesta JSON de Claude
   */
  private parseRespuesta(textoRespuesta: string): any {
    try {
      // Buscar bloque JSON en la respuesta
      const jsonMatch = textoRespuesta.match(/```json\n?([\s\S]*?)\n?```|({[\s\S]*})/);

      if (!jsonMatch) {
        console.warn("⚠️ No se encontró JSON en respuesta");
        return {
          screens: [
            {
              className: "Screen",
              components: [],
            },
          ],
        };
      }

      const jsonString = jsonMatch[1] || jsonMatch[2];
      const parsedJson = JSON.parse(jsonString);

      // Validar estructura básica
      if (!parsedJson.screens || !Array.isArray(parsedJson.screens)) {
        throw new Error("Respuesta no contiene 'screens' array");
      }

      // Validar y limpiar cada screen
      parsedJson.screens = parsedJson.screens.map((screen: any) => {
        return {
          className: screen.className || "Screen",
          components: Array.isArray(screen.components)
            ? screen.components.map((comp: any) => ({
                id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                type: this.validarTipo(comp.type),
                label: comp.label || comp.text || comp.placeholder || "component",
                position: comp.position || 1,
                size: comp.size || "medium",
                variant: comp.variant || "elevated",
              }))
            : [],
        };
      });

      console.log("✅ JSON parseado correctamente:", JSON.stringify(parsedJson).substring(0, 150));
      return parsedJson;
    } catch (error: any) {
      console.error("❌ Error parseando JSON:", error.message);
      // Retornar estructura vacía en caso de error
      return {
        screens: [
          {
            className: "Screen",
            components: [],
          },
        ],
      };
    }
  }

  /**
   * Valida y normaliza los tipos de componentes
   */
  private validarTipo(tipo: string): string {
    const tiposValidos = [
      "TextField",
      "Button",
      "ElevatedButton",
      "TextButton",
      "AppBar",
      "ListView",
      "Icon",
      "Container",
    ];

    const tipoNormalizado = tipo
      ? tipo.charAt(0).toUpperCase() + tipo.slice(1).toLowerCase()
      : "Container";

    return tiposValidos.includes(tipoNormalizado) ? tipoNormalizado : "Container";
  }
}
