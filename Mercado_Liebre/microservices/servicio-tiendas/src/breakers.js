/**
 * Circuit breakers del servicio Tiendas.
 *
 * Único breaker: protege la llamada HTTP a `catalogo-service` cuando se
 * compone la vista pública de una tienda. Si catálogo falla repetidamente,
 * la vista pública responde 503/502 controlado en lugar de colgar.
 */

const CircuitBreaker = require('opossum');
const { attachBreakerLogs } = require('@mercadoliebre/resilience');
const { CIRCUIT_BREAKER, HTTP_TIMEOUT_MS } = require('./config');
const { logger } = require('./logger');

async function jsonRequest({ url, options }) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), HTTP_TIMEOUT_MS);
  try {
    const response = await fetch(url, { ...(options || {}), signal: controller.signal });
    const text = await response.text();
    let data = {};
    try { data = text ? JSON.parse(text) : {}; } catch { data = { raw: text }; }
    return { ok: response.ok, status: response.status, data, raw: text };
  } finally {
    clearTimeout(timeout);
  }
}

const catalogoProductosBreaker = attachBreakerLogs(
  new CircuitBreaker(jsonRequest, {
    ...CIRCUIT_BREAKER,
    name: 'tiendas-catalogo-productos',
  }),
  logger
);

const breakers = [catalogoProductosBreaker];

module.exports = { catalogoProductosBreaker, breakers };
