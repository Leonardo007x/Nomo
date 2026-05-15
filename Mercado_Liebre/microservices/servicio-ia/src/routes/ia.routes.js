/**
 * Endpoint principal de IA.
 *
 * - JWT obligatorio para evitar consumo no autenticado.
 * - Proxy controlado hacia Groq (la API key nunca viaja al cliente).
 * - Audita prompt y respuesta (o error) en la BD para trazabilidad operativa.
 */

const express = require('express');
const crypto = require('crypto');
const requireAuth = require('../middleware/auth');
const { GROQ_API_KEY, GROQ_MODEL } = require('../config');
const { generate } = require('../clients/groq.client');

module.exports = function createIaRouter({ pool }) {
  const router = express.Router();

  router.post('/generar', requireAuth, async (req, res) => {
    const {
      mensajeUsuario,
      mensajeSistema = 'Eres un experto en marketing gastronómico de lujo y copywriting persuasivo.',
    } = req.body || {};

    if (!mensajeUsuario || typeof mensajeUsuario !== 'string') {
      return res.status(400).json({ error: 'mensajeUsuario es requerido' });
    }
    if (!GROQ_API_KEY) {
      return res.status(503).json({ error: 'Servicio IA no configurado (GROQ_API_KEY faltante)' });
    }

    const rowId = crypto.randomUUID();
    const result = await generate({ mensajeUsuario, mensajeSistema });

    // Auditoría: persistimos tanto éxito como error para trazabilidad.
    try {
      await pool.query(
        'INSERT INTO ia_generaciones (id, usuario_id, provider, modelo, prompt_usuario, prompt_sistema, respuesta, error_msg) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [
          rowId,
          req.user.sub,
          'groq',
          GROQ_MODEL,
          mensajeUsuario,
          mensajeSistema,
          result.ok ? result.contenido : null,
          result.ok ? null : `[${result.reason}] ${result.errorMsg}`,
        ]
      );
    } catch (auditErr) {
      req.log.warn({ err: auditErr?.message }, '[ia] No se pudo auditar la generación en BD.');
    }

    if (!result.ok) {
      req.log.error(
        { err: result.errorMsg, breaker: 'ia-groq', reason: result.reason },
        '[ia] Generación fallida (circuito o proveedor).'
      );
      return res.status(result.httpStatus).json({
        error: result.reason === 'circuit_open'
          ? 'Servicio IA temporalmente protegido (circuit breaker)'
          : result.errorMsg,
        reason: result.reason,
      });
    }

    req.log.info({ generacion_id: rowId, user_id: req.user.sub }, '[ia] Generación entregada.');
    return res.json({ contenido: result.contenido });
  });

  return router;
};
