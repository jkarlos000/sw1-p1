/**
 * Middleware para manejar uploads de archivos (audio/imágenes)
 */

import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Directorio base para uploads
const UPLOADS_DIR = path.join(__dirname, '../../uploads');

// Crear directorio si no existe
if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Configuración de almacenamiento
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // Organizar por sala
        const salaId = req.body.salaId || 'general';
        const salaDir = path.join(UPLOADS_DIR, `sala_${salaId}`);
        
        if (!fs.existsSync(salaDir)) {
            fs.mkdirSync(salaDir, { recursive: true });
        }
        
        cb(null, salaDir);
    },
    filename: (req, file, cb) => {
        // Generar nombre único: timestamp_random_originalname
        const uniqueSuffix = `${Date.now()}_${Math.round(Math.random() * 1E9)}`;
        const ext = path.extname(file.originalname);
        const baseName = path.basename(file.originalname, ext);
        cb(null, `${baseName}_${uniqueSuffix}${ext}`);
    }
});

// Filtro de archivos permitidos
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    const allowedMimes = [
        // Audio
        'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/webm',
        'audio/m4a', 'audio/x-m4a', 'audio/aac',
        // Imágenes
        'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'
    ];
    
    if (allowedMimes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error(`Tipo de archivo no permitido: ${file.mimetype}`));
    }
};

// Configuración de Multer
export const uploadMiddleware = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 50 * 1024 * 1024, // 50MB máximo por archivo
        files: 10 // Máximo 10 archivos simultáneos
    }
});

/**
 * Middleware para procesar múltiples archivos
 * Nombres de campos: 'audios[]' y 'imagenes[]'
 */
export const uploadMultipleFiles = uploadMiddleware.fields([
    { name: 'audios', maxCount: 5 },
    { name: 'imagenes', maxCount: 10 }
]);

/**
 * Limpiar archivos antiguos (opcional - cronjob)
 */
export function cleanOldFiles(daysOld: number = 30) {
    const cutoffDate = Date.now() - (daysOld * 24 * 60 * 60 * 1000);
    
    function scanDirectory(dir: string) {
        if (!fs.existsSync(dir)) return;
        
        const files = fs.readdirSync(dir);
        
        files.forEach(file => {
            const filePath = path.join(dir, file);
            const stats = fs.statSync(filePath);
            
            if (stats.isDirectory()) {
                scanDirectory(filePath);
            } else if (stats.mtimeMs < cutoffDate) {
                fs.unlinkSync(filePath);
                console.log(`🗑️  Archivo eliminado: ${filePath}`);
            }
        });
    }
    
    scanDirectory(UPLOADS_DIR);
}
