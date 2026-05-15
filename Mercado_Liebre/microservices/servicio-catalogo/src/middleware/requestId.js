/**
 * Propaga (o genera) un `X-Request-Id` por request.
 * Permite correlacionar logs del frontend → gateway → microservicio.
 */
const crypto = require('crypto');

module.exports = function requestId(req, res, next) {
  const id = req.headers['x-request-id'] || crypto.randomUUID();
  req.requestId = id;
  res.setHeader('X-Request-Id', id);
  next();
};
