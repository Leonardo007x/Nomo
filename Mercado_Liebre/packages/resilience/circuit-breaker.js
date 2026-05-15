/**
 * Circuit Breaker — helpers de observabilidad y clasificación de errores.
 *
 * Pieza compartida que conecta el ciclo de vida del breaker de **Opossum**
 * (`closed` → `open` → `half_open` → `closed`) con logs estructurados de
 * **Pino**. El estado y los contadores los gestiona Opossum; este módulo
 * sólo añade trazabilidad uniforme entre microservicios.
 */

/**
 * Suscribe los eventos de un Circuit Breaker de Opossum a un logger Pino.
 * Cada transición y rechazo deja un log estructurado con `event: 'circuit_breaker'`
 * para poder filtrar/auditar fácilmente desde `docker compose logs` o un agregador.
 *
 * @param {import('opossum')} breaker  Instancia retornada por `new CircuitBreaker(...)`.
 * @param {import('pino').Logger} logger  Logger del servicio (mismo `base.service`).
 * @returns {import('opossum')} La misma instancia, para encadenar.
 */
function attachBreakerLogs(breaker, logger) {
  const name = breaker.name || 'breaker';

  // Transición: CLOSED → OPEN. Se corta el tráfico al backend protegido.
  breaker.on('open', () => {
    logger.warn(
      { event: 'circuit_breaker', breaker: name, state: 'open' },
      `[resilience] Circuito ABIERTO (${name}): se bloquean nuevas llamadas hasta cumplir resetTimeout.`
    );
  });

  // Transición: OPEN → HALF-OPEN. Opossum permite una sola petición de prueba.
  breaker.on('halfOpen', () => {
    logger.warn(
      { event: 'circuit_breaker', breaker: name, state: 'half_open' },
      `[resilience] Circuito HALF-OPEN (${name}): se permite una solicitud de prueba para verificar recuperación.`
    );
  });

  // Transición: HALF-OPEN → CLOSED. Recuperación confirmada.
  breaker.on('close', () => {
    logger.info(
      { event: 'circuit_breaker', breaker: name, state: 'closed' },
      `[resilience] Circuito CERRADO (${name}): backend estable, tráfico restablecido.`
    );
  });

  // Llamada rechazada por el propio breaker (estado open). No llega al backend.
  breaker.on('reject', () => {
    logger.warn(
      { event: 'circuit_breaker', breaker: name, reason: 'circuit_open' },
      `[resilience] Solicitud rechazada (${name}): circuito abierto; no se invoca al backend.`
    );
  });

  // Timeout del breaker (la dependencia no respondió a tiempo).
  breaker.on('timeout', () => {
    logger.warn(
      { event: 'circuit_breaker', breaker: name, reason: 'timeout' },
      `[resilience] Timeout (${name}): la dependencia superó el tiempo máximo configurado.`
    );
  });

  // Fallo de la acción: el backend devolvió error o lanzó excepción.
  breaker.on('failure', (err) => {
    logger.error(
      { event: 'circuit_breaker', breaker: name, reason: 'upstream_error', err: err?.message },
      `[resilience] Fallo del backend a través de ${name}.`
    );
  });

  // Éxito durante half-open: evidencia explícita de recuperación.
  breaker.on('success', () => {
    if (breaker.halfOpen) {
      logger.info(
        { event: 'circuit_breaker', breaker: name, state: 'half_open_success' },
        `[resilience] Prueba en HALF-OPEN exitosa (${name}): el circuito volverá a CERRADO.`
      );
    }
  });

  return breaker;
}

/**
 * Distingue el origen de un error dentro del `catch` que envuelve `breaker.fire()`.
 * Útil para etiquetar logs y decidir el código HTTP a devolver al cliente:
 *   - `circuit_open`  → el breaker rechazó sin llegar al backend (503).
 *   - `timeout`       → el breaker abortó por superar `timeout` (502/503).
 *   - `upstream_error`→ error real del backend (502).
 *
 * @param {unknown} err
 * @returns {'circuit_open' | 'timeout' | 'upstream_error'}
 */
function classifyBreakerError(err) {
  const msg = (err && err.message ? String(err.message) : '').toLowerCase();
  const code = err && err.code ? String(err.code) : '';
  if (code === 'EOPENBREAKER' || msg.includes('breaker is open')) return 'circuit_open';
  if (code === 'ETIMEDOUT' || msg.includes('timed out')) return 'timeout';
  return 'upstream_error';
}

module.exports = {
  attachBreakerLogs,
  classifyBreakerError,
};
