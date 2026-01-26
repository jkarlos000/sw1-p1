/**
 * Middleware para manejar upload de imágenes en memoria (para mockups)
 */

import multer from 'multer';

// Almacenamiento en memoria (no guardar archivo)
const storage = multer.memoryStorage();

// Filtro para aceptar solo imágenes
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp'
  ];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Tipo de archivo no permitido: ${file.mimetype}`));
  }
};

// Límite de tamaño: 5MB
const limits = {
  fileSize: 5 * 1024 * 1024 // 5MB
};

export const uploadImagenMockup = multer({
  storage,
  fileFilter,
  limits
}).single('imagen');
