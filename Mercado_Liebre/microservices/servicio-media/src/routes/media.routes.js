/**
 * Endpoint principal de subida de media.
 *
 * Flujo:
 *   1. JWT obligatorio.
 *   2. Multer recibe el archivo en memoria.
 *   3. Subida a Cloudinary detrás de circuit breaker.
 *   4. Auditoría en BD (tabla media_assets).
 */

const express = require('express');
const crypto = require('crypto');
const requireAuth = require('../middleware/auth');
const uploadMem = require('../middleware/upload');
const { uploadImage, isCloudinaryConfigured } = require('../clients/cloudinary.client');

module.exports = function createMediaRouter({ pool, isCloudinaryEnabled }) {
  const router = express.Router();

  router.post(
    '/upload',
    requireAuth,
    (req, res, next) => {
      uploadMem.single('file')(req, res, (err) => {
        if (err) return res.status(400).json({ error: err.message || 'Archivo no válido' });
        next();
      });
    },
    async (req, res) => {
      if (!isCloudinaryEnabled() && !isCloudinaryConfigured()) {
        return res.status(503).json({
          error: 'Subida de imágenes no configurada. Define CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY y CLOUDINARY_API_SECRET.',
        });
      }
      if (!req.file || !req.file.buffer) {
        return res.status(400).json({ error: 'Falta el archivo (campo file)' });
      }
      try {
        const b64 = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
        const result = await uploadImage({ b64 });

        if (!result.ok) {
          req.log.warn(
            { reason: result.reason, breaker: 'media-cloudinary-upload', err: result.err?.message },
            '[media] Upload bloqueado o fallido (revise estado del breaker).'
          );
          return res.status(result.httpStatus).json({
            error: result.reason === 'circuit_open'
              ? 'Subida temporalmente protegida por circuit breaker'
              : 'Error al contactar Cloudinary',
            reason: result.reason,
          });
        }

        // Auditoría: persistimos el asset subido (usuario, URL, tamaño, mime).
        await pool.query(
          'INSERT INTO media_assets (id, usuario_id, url, provider, mime_type, bytes_size) VALUES (?, ?, ?, ?, ?, ?)',
          [
            crypto.randomUUID(),
            req.user.sub,
            result.url,
            'cloudinary',
            req.file.mimetype || null,
            Number(req.file.size || 0),
          ]
        );
        req.log.info({ user_id: req.user.sub, bytes: req.file.size }, '[media] Asset subido y registrado.');
        return res.json({ url: result.url });
      } catch (e) {
        req.log.error({ err: e?.message }, '[media] POST /upload — falla inesperada.');
        return res.status(500).json({ error: e?.message || 'Error al subir a Cloudinary' });
      }
    }
  );

  return router;
};
