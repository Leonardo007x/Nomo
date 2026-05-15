/**
 * Control de laboratorio sobre instancias Opossum **reales** (misma memoria del proceso).
 * No simula estado en el panel: llama a `.open()`, `.close()` o fuerza half-open en el breaker vivo.
 */

const { getBreakerState } = require('./health');

/**
 * @param {import('opossum')} breaker
 * @param {'open'|'close'|'half_open'} action
 */
function setBreakerState(breaker, action) {
  if (!breaker) throw new Error('breaker_required');
  const a = String(action).toLowerCase().replace('-', '_');

  if (a === 'open') {
    if (typeof breaker.open === 'function') breaker.open();
    else breaker.opened = true;
    return getBreakerState(breaker);
  }

  if (a === 'close' || a === 'closed') {
    if (typeof breaker.close === 'function') breaker.close();
    else {
      breaker.opened = false;
      breaker.halfOpen = false;
    }
    return getBreakerState(breaker);
  }

  if (a === 'half_open' || a === 'halfopen') {
    breaker.opened = true;
    breaker.halfOpen = true;
    if (typeof breaker.emit === 'function') breaker.emit('halfOpen');
    return getBreakerState(breaker);
  }

  throw new Error('invalid_action');
}

/**
 * Express handler: POST /api/health/breakers/control
 * Body: { action: 'open'|'close'|'half_open', name?: string }
 * Header: X-Ops-Lab-Token (debe coincidir con OPS_LAB_TOKEN del servicio)
 */
function createBreakerControlHandler({ breakers, logger, labToken }) {
  return function breakerControl(req, res) {
    const hdr = req.headers['x-ops-lab-token'] || req.headers['x-internal-token'] || '';
    if (!labToken || hdr !== labToken) {
      return res.status(403).json({
        error: 'lab_token_invalid',
        hint: 'Enviá header X-Ops-Lab-Token con el valor OPS_LAB_TOKEN / OPS_PANEL_TOKEN del .env',
      });
    }

    const { action, name } = req.body || {};
    if (!action) {
      return res.status(400).json({
        error: 'action_required',
        allowed: ['open', 'close', 'half_open'],
        breakers: breakers.map((b) => b.name),
      });
    }

    const targets = name ? breakers.filter((b) => b.name === name) : breakers;
    if (!targets.length) {
      return res.status(404).json({
        error: 'breaker_not_found',
        name,
        available: breakers.map((b) => b.name),
      });
    }

    try {
      const results = targets.map((b) => ({
        before: getBreakerState(b),
        ...setBreakerState(b, action),
        name: b.name,
      }));
      (logger || console).warn(
        { event: 'circuit_breaker_lab', action, names: results.map((r) => r.name) },
        `[resilience] Laboratorio: estado forzado (${action}) en breaker(s) Opossum.`
      );
      return res.json({
        ok: true,
        action,
        forced: true,
        note: 'Estado aplicado en la instancia Opossum de este proceso (real, no simulado en ops).',
        breakers: results,
      });
    } catch (e) {
      return res.status(400).json({ error: e.message || 'control_failed' });
    }
  };
}

module.exports = {
  setBreakerState,
  createBreakerControlHandler,
};
