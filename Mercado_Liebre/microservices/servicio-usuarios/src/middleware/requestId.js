const crypto = require('crypto');
/** Propaga o genera `X-Request-Id` para correlacionar logs entre servicios. */
module.exports = function requestId(req, res, next) {
  const id = req.headers['x-request-id'] || crypto.randomUUID();
  req.requestId = id;
  res.setHeader('X-Request-Id', id);
  next();
};
