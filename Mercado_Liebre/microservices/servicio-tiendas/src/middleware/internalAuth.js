/**
 * Middleware servicio-a-servicio.
 *
 * Restringe endpoints `/internal/*` a llamadas con el header `X-Internal-Token`
 * cuyo valor coincida con `INTERNAL_SERVICE_TOKEN`. Esto bloquea acceso desde
 * el gateway/cliente y permite que solo otros microservicios consulten datos
 * que no deben quedar expuestos al exterior.
 */
const { INTERNAL_SERVICE_TOKEN } = require('../config');

module.exports = function requireInternal(req, res, next) {
  const t = req.headers['x-internal-token'];
  if (!INTERNAL_SERVICE_TOKEN || t !== INTERNAL_SERVICE_TOKEN) {
    return res.status(403).json({ error: 'Servicio no autorizado' });
  }
  next();
};
