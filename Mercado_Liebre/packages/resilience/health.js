/**
 * Health checks y monitoreo básico.
 *
 * Conjunto de utilidades para que los endpoints `/api/health`, `/api/health/ready`
 * y `/api/health/breakers` respondan con el **mismo contrato** en todos los
 * microservicios (disponibilidad de BD, estado de breakers, info del proceso).
 */

/**
 * Ping ligero a MySQL con medición de latencia. No lanza: si el pool aún no
 * existe (arranque), devuelve `ok: false` con motivo, para que el endpoint
 * de health pueda responder sin caer.
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
 * Serializa el estado actual y los contadores de un breaker para exponerlos
 * en `/api/health` y `/api/health/breakers` en formato uniforme.
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
 * Foto rápida del proceso para enriquecer health (pid, uptime, memoria en MB).
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
 * Construye el payload estándar de `/api/health` con la siguiente semántica
 * en `status`:
 *   - `ok`        → BD responde y todos los breakers están closed.
 *   - `degraded`  → BD responde pero algún breaker no está closed.
 *   - `down`      → la BD no responde.
 *
 * @param {{ service: string, db: object, breakers?: object[], extras?: object }} args
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
  pingDb,
  getBreakerState,
  getProcessInfo,
  buildHealthPayload,
};
