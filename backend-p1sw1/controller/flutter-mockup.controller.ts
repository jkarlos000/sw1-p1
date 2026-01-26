import { Request, Response } from 'express';
import { FlutterCodeGeneratorService } from '../services/flutter-code-generator.service';

const flutterGenerator = new FlutterCodeGeneratorService();

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
