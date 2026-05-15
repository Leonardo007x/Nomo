/**
 * @mercadoliebre/resilience
 *
 * Punto de entrada del paquete: re-exporta los helpers compartidos por todos
 * los microservicios para tener un único contrato de:
 *   - Observabilidad del Circuit Breaker (Opossum + Pino).
 *   - Health checks (estado de BD, breakers, proceso).
 *   - Clasificación de errores tras `breaker.fire()`.
 *
 * El estado del circuit breaker (open / half_open / closed) vive **en memoria
 * de cada microservicio**: este paquete sólo provee el código común. Eso es
 * coherente con un sistema distribuido (aislamiento de fallos por proceso).
 */

const { attachBreakerLogs, classifyBreakerError } = require('./circuit-breaker');
const { pingDb, getBreakerState, buildHealthPayload, getProcessInfo } = require('./health');
const { setBreakerState, createBreakerControlHandler } = require('./breaker-control');

module.exports = {
  // Circuit breaker / tolerancia a fallos.
  attachBreakerLogs,
  classifyBreakerError,
  setBreakerState,
  createBreakerControlHandler,
  // Health / monitoreo.
  pingDb,
  getBreakerState,
  buildHealthPayload,
  getProcessInfo,
};
