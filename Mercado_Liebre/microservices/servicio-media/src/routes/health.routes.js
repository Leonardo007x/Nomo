/** Health checks unificados (incluye flag de Cloudinary y conteo de uploads). */

const express = require('express');
const { pingDb, getBreakerState, buildHealthPayload, createBreakerControlHandler } = require('@mercadoliebre/resilience');
const { SERVICE_NAME, DB, OPS_LAB_TOKEN } = require('../config');
const { breakers } = require('../breakers');
const { logger } = require('../logger');

module.exports = function createHealthRouter({ pool, isCloudinaryEnabled }) {
  const router = express.Router();

  router.get('/health', async (_req, res) => {
    try {
      const db = await pingDb(pool);
      let uploads = null;
      if (db.ok) {
        try {
          const [rows] = await pool.query('SELECT COUNT(*) AS total FROM media_assets');
          uploads = rows[0].total;
        } catch { uploads = null; }
      }
      const breakersState = breakers.map(getBreakerState);
      const payload = buildHealthPayload({
        service: SERVICE_NAME,
        db,
        breakers: breakersState,
        extras: {
          database_host: DB.host,
          cloudinary_enabled: isCloudinaryEnabled(),
          uploads_count: uploads,
        },
      });
      res.status(payload.status === 'down' ? 503 : 200).json(payload);
    } catch (err) {
      logger.error({ err: err?.message }, '[media] Fallo al construir /api/health.');
      res.status(500).json({ error: 'health_check_failed', service: SERVICE_NAME });
    }
  });

  router.get('/health/ready', async (_req, res) => {
    try {
      const db = await pingDb(pool);
      res.status(db.ok ? 200 : 503).json({
        service: SERVICE_NAME,
        ready: db.ok,
        db,
        cloudinary_enabled: isCloudinaryEnabled(),
      });
    } catch (err) {
      logger.error({ err: err?.message }, '[media] Fallo en /api/health/ready.');
      res.status(500).json({ error: 'health_ready_failed', service: SERVICE_NAME });
    }
  });

  router.get('/health/breakers', (_req, res) => {
    try {
      res.json({ service: SERVICE_NAME, breakers: breakers.map(getBreakerState) });
    } catch (err) {
      logger.error({ err: err?.message }, '[media] Fallo al leer breakers.');
      res.status(500).json({ error: 'health_breakers_failed', service: SERVICE_NAME });
    }
  });

  router.post(
    '/health/breakers/control',
    createBreakerControlHandler({ breakers, logger, labToken: OPS_LAB_TOKEN })
  );

  return router;
};
