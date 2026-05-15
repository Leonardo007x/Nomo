/**
 * Circuit breaker hacia Cloudinary (SaaS externo).
 *
 * Protege el endpoint de subida cuando el proveedor falla o tarda demasiado.
 * `attachBreakerLogs` añade trazabilidad de transiciones (open / half_open / closed).
 */

const CircuitBreaker = require('opossum');
const cloudinary = require('cloudinary').v2;
const { attachBreakerLogs } = require('@mercadoliebre/resilience');
const { CIRCUIT_BREAKER } = require('./config');
const { logger } = require('./logger');

const cloudinaryUploadBreaker = attachBreakerLogs(
  new CircuitBreaker(
    async ({ b64, uploadOpts }) => cloudinary.uploader.upload(b64, uploadOpts),
    { ...CIRCUIT_BREAKER, name: 'media-cloudinary-upload' }
  ),
  logger
);

const breakers = [cloudinaryUploadBreaker];

module.exports = { cloudinaryUploadBreaker, breakers };
