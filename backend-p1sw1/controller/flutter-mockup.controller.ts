import { Request, Response } from 'express';
import { FlutterCodeGeneratorService } from '../services/flutter-code-generator.service';
import { ClaudeVisionService } from '../services/claude-vision.service';

const flutterGenerator = new FlutterCodeGeneratorService();
const claudeVision = new ClaudeVisionService();

/**
 * POST /api/flutter/generar-codigo
 * Genera código Dart desde un FlutterScreen
 */
export const generarCodigoDart = (req: Request, res: Response) => {
  try {
    console.log('📱 Request para generar código Dart');

    const { screen } = req.body;

    // Validación
    if (!screen || !screen.className || !screen.components) {
      return res.status(400).json({
        ok: false,
        mensaje: 'Faltan datos requeridos: screen, className, components'
      });
    }

    // Generar código Dart
    const dartCode = flutterGenerator.generarCodigoDart(screen);

    return res.json({
      ok: true,
      dartCode: dartCode,
      className: screen.className
    });

  } catch (error: any) {
    console.error('❌ Error generando código Dart:', error);
    return res.status(500).json({
      ok: false,
      mensaje: 'Error al generar código Dart',
      error: error.message
    });
  }
};

/**
 * GET /api/flutter/health
 * Health check del servicio
 */
export const healthCheck = (req: Request, res: Response) => {
  return res.json({
    ok: true,
    mensaje: 'Flutter Code Generator Service activo',
    timestamp: new Date().toISOString()
  });
};

/**
 * POST /api/flutter/interpretar-mockup
 * Interpreta una imagen de mockup usando Claude Vision
 */
export const interpretarMockup = async (req: Request, res: Response) => {
  try {
    console.log('📸 Request para interpretar mockup');

    // Obtener archivo de la request
    const archivo = (req as any).file;
    const { className } = req.body;

    // Validación
    if (!archivo) {
      return res.status(400).json({
        ok: false,
        mensaje: 'No se proporcionó archivo de imagen'
      });
    }

    // Validar tamaño máximo (5MB)
    const maxSize = 5 * 1024 * 1024;
    if (archivo.size > maxSize) {
      return res.status(400).json({
        ok: false,
        mensaje: 'Archivo demasiado grande (máximo 5MB)'
      });
    }

    // Convertir buffer a base64
    const imagenBase64 = archivo.buffer.toString('base64');

    console.log(`🖼️ Procesando imagen: ${archivo.originalname} (${archivo.size} bytes)`);
    console.log(`📝 Clase proporcionada: ${className || 'ninguna'}`);

    // Interpretar mockup con Claude Vision
    const resultado = await claudeVision.interpretarMockup(imagenBase64, className);

    console.log(`✅ Mockup interpretado: ${resultado.screens.length} screen(s) detectado(s)`);

    return res.json({
      ok: true,
      screens: resultado.screens,
      mensaje: `${resultado.screens.length} screen(s) interpretado(s) correctamente`
    });

  } catch (error: any) {
    console.error('❌ Error interpretando mockup:', error);
    return res.status(500).json({
      ok: false,
      mensaje: 'Error al interpretar mockup',
      error: error.message
    });
  }
};
