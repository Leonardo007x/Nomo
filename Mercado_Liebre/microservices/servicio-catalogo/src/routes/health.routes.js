/**
 * Endpoints de health / monitoreo.
 *
 * Mismo contrato en los 6 microservicios (ver `@mercadoliebre/resilience`):
 *   - GET /api/health           → BD + breakers + proceso (status ok/degraded/down).
 *   - GET /api/health/ready     → readiness (200 si la BD responde).
 *   - GET /api/health/breakers  → estado y contadores de cada circuit breaker.
 */

const express = require('express');
const { pingDb, getBreakerState, buildHealthPayload, createBreakerControlHandler } = require('@mercadoliebre/resilience');
const { SERVICE_NAME, TIENDAS_SERVICE_URL, DB, OPS_LAB_TOKEN } = require('../config');
const { breakers } = require('../breakers');
const { logger } = require('../logger');

module.exports = function createHealthRouter({ pool }) {
  const router = express.Router();

  router.get('/health', async (_req, res) => {
    try {
      const db = await pingDb(pool);
      const breakersState = breakers.map(getBreakerState);
      const payload = buildHealthPayload({
        service: SERVICE_NAME,
        db,
        breakers: breakersState,
        extras: {
          database_host: DB.host,
          tiendas_url: TIENDAS_SERVICE_URL,
        },
      });
      res.status(payload.status === 'down' ? 503 : 200).json(payload);
    } catch (err) {
      logger.error({ err: err?.message }, '[catalogo] Fallo al construir respuesta de /api/health.');
      res.status(500).json({ error: 'health_check_failed', service: SERVICE_NAME });
    }
  });

  router.get('/health/ready', async (_req, res) => {
    try {
      const db = await pingDb(pool);
      res.status(db.ok ? 200 : 503).json({ service: SERVICE_NAME, ready: db.ok, db });
    } catch (err) {
      logger.error({ err: err?.message }, '[catalogo] Fallo en /api/health/ready.');
      res.status(500).json({ error: 'health_ready_failed', service: SERVICE_NAME });
    }
  });

  router.get('/health/breakers', (_req, res) => {
    try {
      res.json({ service: SERVICE_NAME, breakers: breakers.map(getBreakerState) });
    } catch (err) {
      logger.error({ err: err?.message }, '[catalogo] Fallo al leer estado de circuit breakers.');
      res.status(500).json({ error: 'health_breakers_failed', service: SERVICE_NAME });
    }
  });

  router.post(
    '/health/breakers/control',
    createBreakerControlHandler({ breakers, logger, labToken: OPS_LAB_TOKEN })
  );

  return router;
};
