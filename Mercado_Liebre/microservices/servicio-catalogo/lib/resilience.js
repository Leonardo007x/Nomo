/**
 * lib/resilience.js
 * ---------------------------------------------------------------
 * Helpers de observabilidad y resiliencia compartidos por todos
 * los microservicios. Convención única para:
 *
 *   - Logs estructurados del Circuit Breaker (Opossum):
 *       open       -> state: 'open'      (se corta el tráfico al backend)
 *       halfOpen   -> state: 'half_open' (intento de prueba tras resetTimeout)
 *       close      -> state: 'closed'    (recuperación confirmada)
 *       reject     -> reason: 'circuit_open'
 *       timeout    -> reason: 'timeout'
 *       failure    -> reason: 'upstream_error'
 *       success    -> útil para demostrar cierre tras half-open
 *
 *   - Detección del tipo de fallo (circuito abierto vs upstream real)
 *     en los catch que rodean breaker.fire().
 *
 *   - Healthcheck unificado:
 *       /api/health          -> resumen amigable + dependencias
 *       /api/health/ready    -> readiness (DB lista + dependencias críticas)
 *       /api/health/breakers -> estado y stats de cada circuit breaker
 *
 * Todo el archivo está pensado para ser idéntico en cada servicio:
 * así se garantiza una experiencia y unos logs uniformes en toda la
 * plataforma (Mercado Liebre).
 * ---------------------------------------------------------------
 */

/**
 * Suscribe todos los eventos relevantes de un Circuit Breaker de
 * Opossum a un logger de Pino. La idea es que la *transición* entre
 * estados (CLOSED -> OPEN -> HALF-OPEN -> CLOSED) quede registrada
 * de forma explícita y se pueda demostrar en evidencias o auditar
 * en producción sin tocar la lógica de negocio.
 *
 * @param {import('opossum')} breaker
 * @param {import('pino').Logger} logger
 */
function attachBreakerLogs(breaker, logger) {
  const name = breaker.name || 'breaker';

  // Transiciones de estado del circuito (lo más importante para la demo).
  breaker.on('open', () => {
    logger.warn(
      { event: 'circuit_breaker', breaker: name, state: 'open' },
      `Circuito ABIERTO para ${name}: se bloquean nuevas llamadas hasta resetTimeout`
    );
  });

  breaker.on('halfOpen', () => {
    logger.warn(
      { event: 'circuit_breaker', breaker: name, state: 'half_open' },
      `Circuito HALF-OPEN para ${name}: se permite un intento de prueba`
    );
  });

  breaker.on('close', () => {
    logger.info(
      { event: 'circuit_breaker', breaker: name, state: 'closed' },
      `Circuito CERRADO para ${name}: backend estable, tráfico restablecido`
    );
  });

  // Cada llamada bloqueada por el propio breaker (sin tocar al backend).
  breaker.on('reject', () => {
    logger.warn(
      { event: 'circuit_breaker', breaker: name, reason: 'circuit_open' },
      `Llamada rechazada por circuito abierto en ${name}`
    );
  });

  // Timeout del propio breaker (la dependencia no respondió a tiempo).
  breaker.on('timeout', () => {
    logger.warn(
      { event: 'circuit_breaker', breaker: name, reason: 'timeout' },
      `Timeout en ${name} (la dependencia no respondió a tiempo)`
    );
  });

  // Fallo de la acción (upstream devolvió error o lanzó excepción).
  breaker.on('failure', (err) => {
    logger.error(
      { event: 'circuit_breaker', breaker: name, reason: 'upstream_error', err: err?.message },
      `Fallo del backend a través de ${name}`
    );
  });

  // Éxito tras half-open: evidencia explícita de recuperación.
  breaker.on('success', () => {
    if (breaker.halfOpen) {
      logger.info(
        { event: 'circuit_breaker', breaker: name, state: 'half_open_success' },
        `Intento de prueba OK en HALF-OPEN para ${name}: el circuito se cerrará`
      );
    }
  });

  return breaker;
}

/**
 * Devuelve el estado actual de un breaker en un formato uniforme
 * para los endpoints /api/health y /api/health/breakers.
 *
 * @param {import('opossum')} breaker
 */
function getBreakerState(breaker) {
  try {
    if (!breaker) {
      return { name: 'unknown', state: 'closed', stats: {} };
    }
    let state = 'closed';
    if (breaker.opened) state = 'open';
    else if (breaker.halfOpen) state = 'half_open';

    const stats = breaker.stats || {};
    return {
      name: breaker.name || 'breaker',
      state,
      stats: {
        successes: stats.successes || 0,
        failures: stats.failures || 0,
        rejects: stats.rejects || 0,
        timeouts: stats.timeouts || 0,
        fires: stats.fires || 0,
      },
    };
  } catch (err) {
    return {
      name: breaker?.name || 'breaker',
      state: 'error',
      stats: {},
      error: err?.message || String(err),
    };
  }
}

/**
 * Heurística para distinguir, dentro de un catch alrededor de
 * breaker.fire(), si el fallo fue por el propio breaker (circuito
 * abierto / timeout) o por un error real de la dependencia.
 * Útil para etiquetar logs y devolver mensajes claros al cliente.
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

/**
 * Ping ligero a la BD con SELECT 1 y medición de latencia.
 * Si el pool aún no existe (arranque), devolvemos ok=false sin lanzar.
 *
 * @param {import('mysql2/promise').Pool | undefined} pool
 */
async function pingDb(pool) {
  if (!pool) return { ok: false, latency_ms: null, error: 'pool_not_ready' };
  const t0 = Date.now();
  try {
    await pool.query('SELECT 1');
    return { ok: true, latency_ms: Date.now() - t0 };
  } catch (e) {
    return { ok: false, latency_ms: Date.now() - t0, error: e?.message || 'db_error' };
  }
}

/**
 * Información ligera del proceso para el healthcheck:
 * uptime, pid y consumo de memoria en MB. Se usa tanto en /api/health
 * como en /api/health/ready para dar una foto rápida del servicio.
 */
function getProcessInfo() {
  const mem = process.memoryUsage();
  return {
    pid: process.pid,
    uptime_s: Math.round(process.uptime()),
    memory_mb: {
      rss: Math.round(mem.rss / 1024 / 1024),
      heap_used: Math.round(mem.heapUsed / 1024 / 1024),
    },
  };
}

/**
 * Construye el payload estándar de /api/health para que todos los
 * microservicios respondan con el mismo contrato. El campo `status`
 * será 'ok' si la BD responde y todos los breakers están cerrados;
 * 'degraded' si la BD responde pero algún circuito está abierto;
 * 'down' si la BD no responde.
 */
function buildHealthPayload({ service, db, breakers = [], extras = {} }) {
  try {
    let status = 'ok';
    if (!db || !db.ok) status = 'down';
    else if (breakers.some((b) => b && b.state !== 'closed')) status = 'degraded';

    return {
      service,
      status,
      ...getProcessInfo(),
      db,
      breakers,
      ...extras,
    };
  } catch (err) {
    return {
      service: service || 'unknown',
      status: 'error',
      error: err?.message || 'health_payload_failed',
      db,
      breakers: Array.isArray(breakers) ? breakers : [],
      ...extras,
    };
  }
}

module.exports = {
  attachBreakerLogs,
  getBreakerState,
  classifyBreakerError,
  pingDb,
  getProcessInfo,
  buildHealthPayload,
};
