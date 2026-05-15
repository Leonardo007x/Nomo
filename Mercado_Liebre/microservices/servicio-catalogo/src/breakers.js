/**
 * Circuit breakers del servicio (instancias Opossum).
 *
 * Cada breaker protege una integración externa concreta. Los **logs de
 * transición** (open / half_open / closed) los publica `attachBreakerLogs`
 * del paquete compartido `@mercadoliebre/resilience`.
 *
 * En catálogo sólo hay un breaker: el que protege la validación de propiedad
 * de tienda contra `tiendas-service`.
 */

const CircuitBreaker = require('opossum');
const { attachBreakerLogs } = require('@mercadoliebre/resilience');
const { CIRCUIT_BREAKER, HTTP_TIMEOUT_MS } = require('./config');
const { logger } = require('./logger');

/**
 * Acción HTTP genérica para usar detrás del breaker:
 *   - `AbortController` para timeout independiente del breaker.
 *   - Parseo JSON tolerante (si el body no es JSON, devuelve `{ raw }`).
 */
async function jsonRequest({ url, options }) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), HTTP_TIMEOUT_MS);
  try {
    const response = await fetch(url, { ...(options || {}), signal: controller.signal });
    const text = await response.text();
    let data = {};
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      data = { raw: text };
    }
    return { ok: response.ok, status: response.status, data };
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Breaker para `tiendas-service` (`GET /internal/tiendas/:id/owner`).
 * Si `tiendas-service` falla repetidamente, este breaker pasa a `open`
 * y catálogo deja de propagar la presión al servicio caído.
 */
const tiendasOwnerBreaker = attachBreakerLogs(
  new CircuitBreaker(jsonRequest, {
    ...CIRCUIT_BREAKER,
    name: 'catalogo-tiendas-owner',
  }),
  logger
);

/** Lista expuesta en `/api/health` y `/api/health/breakers` para monitoreo. */
const breakers = [tiendasOwnerBreaker];

module.exports = { tiendasOwnerBreaker, breakers };
