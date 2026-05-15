/** Health checks unificados (incluye conteo total como métrica de dominio). */

const express = require('express');
const { pingDb, getBreakerState, buildHealthPayload, createBreakerControlHandler } = require('@mercadoliebre/resilience');
const { SERVICE_NAME, DB, TIENDAS_SERVICE_URL, OPS_LAB_TOKEN } = require('../config');
const { breakers } = require('../breakers');
const { logger } = require('../logger');

module.exports = function createHealthRouter({ pool }) {
  const router = express.Router();

  router.get('/health', async (_req, res) => {
    try {
      const db = await pingDb(pool);
      let total = null;
      if (db.ok) {
        try {
          const [rows] = await pool.query('SELECT COUNT(*) AS total FROM categorias');
          total = rows[0].total;
        } catch { total = null; }
      }
      const breakersState = breakers.map(getBreakerState);
      const payload = buildHealthPayload({
        service: SERVICE_NAME,
        db,
        breakers: breakersState,
        extras: { database_host: DB.host, tiendas_url: TIENDAS_SERVICE_URL, total_categorias: total },
      });
      res.status(payload.status === 'down' ? 503 : 200).json(payload);
    } catch (err) {
      logger.error({ err: err?.message }, '[categorias] Fallo al construir /api/health.');
      res.status(500).json({ error: 'health_check_failed', service: SERVICE_NAME });
    }
  });

  router.get('/health/ready', async (_req, res) => {
    try {
      const db = await pingDb(pool);
      res.status(db.ok ? 200 : 503).json({ service: SERVICE_NAME, ready: db.ok, db });
    } catch (err) {
      logger.error({ err: err?.message }, '[categorias] Fallo en /api/health/ready.');
      res.status(500).json({ error: 'health_ready_failed', service: SERVICE_NAME });
    }
  });

  router.get('/health/breakers', (_req, res) => {
    try {
      res.json({ service: SERVICE_NAME, breakers: breakers.map(getBreakerState) });
    } catch (err) {
      logger.error({ err: err?.message }, '[categorias] Fallo al leer breakers.');
      res.status(500).json({ error: 'health_breakers_failed', service: SERVICE_NAME });
    }
  });

  router.post(
    '/health/breakers/control',
    createBreakerControlHandler({ breakers, logger, labToken: OPS_LAB_TOKEN })
  );

  return router;
};
