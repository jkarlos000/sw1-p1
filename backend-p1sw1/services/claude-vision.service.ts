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

      // Validar API Key
      if (!process.env.ANTHROPIC_API_KEY) {
        throw new Error(
          "ANTHROPIC_API_KEY no está configurada. Por favor, establece la variable de entorno."
        );
      }

      // Validar imagen
      if (!imagenBase64 || imagenBase64.length === 0) {
        throw new Error("Imagen vacía o no válida");
      }

      // Validar tamaño de imagen base64 (máximo 5MB)
      const sizeInBytes = Buffer.byteLength(imagenBase64, "base64");
      if (sizeInBytes > 5 * 1024 * 1024) {
        throw new Error("Imagen demasiado grande (máximo 5MB)");
      }

      // Prompt para Claude Vision
      const prompt = this.generarPrompt(className);

      console.log("📤 Enviando imagen a Claude Vision...");
      console.time("⏱️ Tiempo de respuesta Claude");

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

      console.timeEnd("⏱️ Tiempo de respuesta Claude");

      // Extraer el contenido de texto
      const responseText =
        message.content[0].type === "text" ? message.content[0].text : "";

      if (!responseText) {
        throw new Error("Claude Vision no retornó texto en la respuesta");
      }

      console.log("📝 Respuesta recibida, parseando JSON...");

      // Parsear respuesta JSON
      const resultado = this.parseRespuesta(responseText);
      
      console.log(
        `✅ Interpretación completada: ${resultado.screens.length} screen(s), ${
          resultado.screens.reduce((sum: number, s: any) => sum + s.components.length, 0)
        } componente(s) total`
      );
      
      return resultado;
    } catch (error: any) {
      console.error("❌ Error en interpretación Claude Vision:", error.message);
      
      // Manejo específico de errores
      if (error.message.includes("API key")) {
        throw new Error(
          "Error de autenticación: ANTHROPIC_API_KEY no configurada correctamente"
        );
      } else if (error.message.includes("rate limit")) {
        throw new Error("Límite de tasa excedido. Intenta nuevamente en unos momentos.");
      } else if (error.message.includes("timeout")) {
        throw new Error("La solicitud tardó demasiado. Intenta con una imagen más simple.");
      }
      
      throw error;
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
      // Log de la respuesta (primeros 200 caracteres)
      console.log(
        "📋 Respuesta cruda:",
        textoRespuesta.substring(0, 200).replace(/\n/g, " ")
      );

      // Buscar bloque JSON en la respuesta
      const jsonMatch = textoRespuesta.match(/```json\n?([\s\S]*?)\n?```|({[\s\S]*})/);

      if (!jsonMatch) {
        console.warn("⚠️ No se encontró JSON en respuesta, usando estructura vacía");
        return this.crearEstructuraVacia();
      }

      const jsonString = jsonMatch[1] || jsonMatch[2];
      
      // Intentar parsear JSON
      let parsedJson;
      try {
        parsedJson = JSON.parse(jsonString);
      } catch (parseError) {
        console.error("❌ Error al parsear JSON:", parseError);
        // Intentar limpiar y parsear nuevamente
        const jsonLimpio = jsonString
          .replace(/,\s*}/g, "}") // Eliminar comas al final
          .replace(/,\s*]/g, "]") // Eliminar comas en arrays
          .trim();
        
        parsedJson = JSON.parse(jsonLimpio);
      }

      // Validar estructura básica
      if (!parsedJson.screens || !Array.isArray(parsedJson.screens)) {
        console.warn("⚠️ Estructura incorrecta, creando nueva");
        return this.crearEstructuraVacia();
      }

      // Validar y limpiar cada screen
      parsedJson.screens = parsedJson.screens
        .filter((screen: any) => screen && screen.className) // Filtrar screens válidos
        .map((screen: any) => {
          const componentes = Array.isArray(screen.components)
            ? screen.components
                .filter((comp: any) => comp && comp.type && comp.label) // Filtrar componentes válidos
                .map((comp: any, idx: number) => ({
                  id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                  type: this.validarTipo(comp.type),
                  label: String(comp.label || comp.text || comp.placeholder || `component_${idx}`).trim(),
                  position: comp.position || idx + 1,
                  size: comp.size || "medium",
                  variant: comp.variant || "elevated",
                }))
            : [];

          return {
            className: String(screen.className).trim() || "Screen",
            components: componentes,
          };
        });

      // Si no hay screens después de filtrado, crear una estructura vacía
      if (parsedJson.screens.length === 0) {
        console.warn("⚠️ No hay screens válidos después del filtrado");
        return this.crearEstructuraVacia();
      }

      console.log(
        `✅ JSON parseado: ${parsedJson.screens.length} screen(s) con ${parsedJson.screens.reduce(
          (sum: number, s: any) => sum + s.components.length,
          0
        )} componente(s) total`
      );

      return parsedJson;
    } catch (error: any) {
      console.error("❌ Error fatal parseando respuesta:", error.message);
      return this.crearEstructuraVacia();
    }
  }

  /**
   * Crea una estructura vacía por defecto
   */
  private crearEstructuraVacia(): any {
    return {
      screens: [
        {
          className: "Screen",
          components: [],
        },
      ],
    };
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
