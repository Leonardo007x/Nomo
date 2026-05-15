/**
 * Middleware de autenticación JWT.
 * Exige `Authorization: Bearer <token>` firmado con el mismo `JWT_SECRET`
 * que emite `usuarios-service`. En éxito deja `req.user = payload`.
 */
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config');

module.exports = function requireAuth(req, res, next) {
  const h = req.headers.authorization;
  if (!h || !h.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No autorizado' });
  }
  try {
    req.user = jwt.verify(h.slice(7), JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: 'Token inválido o expirado' });
  }
};
