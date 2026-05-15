/**
 * Circuit breakers del servicio Categorías.
 * Único breaker: valida ownership de tienda contra `tiendas-service`.
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
    return { ok: response.ok, status: response.status, data };
  } finally {
    clearTimeout(timeout);
  }
}

const tiendasOwnerBreaker = attachBreakerLogs(
  new CircuitBreaker(jsonRequest, {
    ...CIRCUIT_BREAKER,
    name: 'categorias-tiendas-owner',
  }),
  logger
);

const breakers = [tiendasOwnerBreaker];

module.exports = { tiendasOwnerBreaker, breakers };
