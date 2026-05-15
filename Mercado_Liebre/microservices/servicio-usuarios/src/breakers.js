/**
 * Circuit breakers del servicio Usuarios.
 *
 * `mysqlAuthBreaker` protege **toda** consulta hecha por las rutas HTTP:
 * si MySQL falla repetidamente, el breaker abre y devolvemos 503 al cliente
 * sin agotar el pool ni mantener al usuario esperando.
 *
 * Diseño: el breaker es **stateless** respecto al pool; recibe `pool` por
 * argumento cada vez, así puede crearse en tiempo de carga del módulo.
 */

const CircuitBreaker = require('opossum');
const { attachBreakerLogs, classifyBreakerError } = require('@mercadoliebre/resilience');
const { CIRCUIT_BREAKER } = require('./config');
const { logger } = require('./logger');

const mysqlAuthBreaker = attachBreakerLogs(
  new CircuitBreaker(
    async ({ pool, sql, params }) => pool.query(sql, params),
    { ...CIRCUIT_BREAKER, name: 'usuarios-mysql' }
  ),
  logger
);

const breakers = [mysqlAuthBreaker];

/**
 * Ejecuta una consulta SQL protegida por el breaker.
 * Resultado normalizado para no propagar excepciones de Opossum hacia las rutas:
 *   - `{ ok: true, rows }`                       en éxito.
 *   - `{ ok: false, reason: 'circuit_open' }`    si el breaker rechazó.
 *   - `{ ok: false, reason: 'timeout' | 'upstream_error', err }` en fallo real.
 */
async function queryWithBreaker({ pool, req, sql, params }) {
  try {
    const [rows] = await mysqlAuthBreaker.fire({ pool, sql, params });
    return { ok: true, rows };
  } catch (e) {
    const reason = classifyBreakerError(e);
    (req?.log || logger).warn(
      { reason, breaker: 'usuarios-mysql', err: e?.message },
      '[usuarios] Consulta a MySQL bloqueada o fallida (revise estado del breaker).'
    );
    return { ok: false, reason, err: e };
  }
}

module.exports = { mysqlAuthBreaker, breakers, queryWithBreaker };
