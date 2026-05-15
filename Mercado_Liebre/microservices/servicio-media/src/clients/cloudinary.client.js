/**
 * Cliente de Cloudinary.
 *
 * - `initCloudinary()`     → configura el SDK con credenciales del entorno.
 * - `uploadImage()`        → sube vía circuit breaker; nunca lanza, devuelve forma uniforme.
 * - `optimizeCloudinaryUrl()` → inserta transformaciones automáticas (calidad/formato).
 */

const cloudinary = require('cloudinary').v2;
const { classifyBreakerError } = require('@mercadoliebre/resilience');
const { CLOUDINARY } = require('../config');
const { cloudinaryUploadBreaker } = require('../breakers');
const { logger } = require('../logger');

function isCloudinaryConfigured() {
  const { cloud_name, api_key, api_secret } = CLOUDINARY;
  return !!(cloud_name && api_key && api_secret);
}

function initCloudinary() {
  if (!isCloudinaryConfigured()) {
    logger.warn('[media] Cloudinary no configurado: subida de imágenes deshabilitada.');
    return false;
  }
  cloudinary.config(CLOUDINARY);
  logger.info('[media] Cloudinary inicializado correctamente.');
  return true;
}

/** Inserta transformaciones automáticas en la URL de entrega. */
function optimizeCloudinaryUrl(secureUrl) {
  const insertIndex = secureUrl.indexOf('/upload/') + 8;
  if (insertIndex < 8) return secureUrl;
  return secureUrl.slice(0, insertIndex) + 'q_auto,f_auto/' + secureUrl.slice(insertIndex);
}

/**
 * Sube un buffer base64 a Cloudinary detrás del breaker.
 * Retorna:
 *   - `{ ok: true, url }`
 *   - `{ ok: false, reason, httpStatus, err }`
 */
async function uploadImage({ b64, folder = 'mercadoliebre' }) {
  try {
    const result = await cloudinaryUploadBreaker.fire({
      b64,
      uploadOpts: { folder, resource_type: 'image' },
    });
    return { ok: true, url: optimizeCloudinaryUrl(result.secure_url) };
  } catch (fireErr) {
    const reason = classifyBreakerError(fireErr);
    return {
      ok: false,
      reason,
      httpStatus: reason === 'circuit_open' ? 503 : 502,
      err: fireErr,
    };
  }
}

module.exports = { initCloudinary, isCloudinaryConfigured, uploadImage };
