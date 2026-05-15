/**
 * Circuit breaker hacia el proveedor externo Groq.
 *
 * Evita reintentos infinitos / cascada cuando el LLM falla o se degrada.
 * Logs de transición CLOSED / OPEN / HALF-OPEN vienen de `attachBreakerLogs`.
 */

const CircuitBreaker = require('opossum');
const { attachBreakerLogs } = require('@mercadoliebre/resilience');
const { CIRCUIT_BREAKER, HTTP_TIMEOUT_MS, GROQ_API_KEY, GROQ_ENDPOINT } = require('./config');
const { logger } = require('./logger');

/** Llamada HTTP a Groq con timeout vía AbortController. */
async function callGroq({ body }) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), HTTP_TIMEOUT_MS);
  try {
    const response = await fetch(GROQ_ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    const data = await response.json().catch(() => ({}));
    return { ok: response.ok, status: response.status, data };
  } finally {
    clearTimeout(timeout);
  }
}

const groqBreaker = attachBreakerLogs(
  new CircuitBreaker(callGroq, { ...CIRCUIT_BREAKER, name: 'ia-groq' }),
  logger
);

const breakers = [groqBreaker];

module.exports = { groqBreaker, breakers };
