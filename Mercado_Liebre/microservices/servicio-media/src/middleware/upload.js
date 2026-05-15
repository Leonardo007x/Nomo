/**
 * Middleware de subida en memoria (Multer).
 *
 * - Almacena el archivo en memoria (no en disco) para subirlo directo a Cloudinary.
 * - Acepta solo imágenes (`image/*`) y limita el tamaño a 6 MB.
 */
const multer = require('multer');

const uploadMem = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 6 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype || !file.mimetype.startsWith('image/')) {
      return cb(new Error('Solo se permiten archivos de imagen'));
    }
    cb(null, true);
  },
});

module.exports = uploadMem;
