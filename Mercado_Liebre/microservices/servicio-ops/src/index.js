/**
 * Servicio de operaciones — panel real para demos de resiliencia.
 *
 * - Health / breakers: HTTP al gateway interno (datos reales de cada microservicio).
 * - Logs: docker logs vía socket (texto real del contenedor).
 * - Start/Stop: Docker API real (igual que `docker compose stop`).
 *
 * IMPORTANTE: montar /var/run/docker.sock y definir OPS_PANEL_TOKEN en producción.
 */

const express = require('express');
const path = require('path');
const cors = require('cors');
const { PORT, OPS_PANEL_TOKEN, CONTAINER_MAP } = require('./config');
const { healthSummary } = require('./gatewayFetch');
const { controlBreaker } = require('./breakerProxy');
const { listScenarios, runScenario } = require('./labScenarios');
const { buildScenarioCommands, buildBreakerLabCommands, buildAllBreakerLabCommands } = require('./labCommands');
const { runLoadBalanceTest, buildLoadBalanceConsoleCommands } = require('./loadBalanceTest');
const {
  listWhitelistedContainers,
  stopContainer,
  startContainer,
  tailLogs,
} = require('./dockerCtl');

const app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '32kb' }));

function requireOpsToken(req, res, next) {
  if (!OPS_PANEL_TOKEN) {
    return res.status(503).json({
      error: 'OPS_PANEL_TOKEN no configurado. Definilo en .env para usar el panel.',
    });
  }
  const h = req.headers.authorization || '';
  let token = h.startsWith('Bearer ') ? h.slice(7).trim() : '';
  if (/^bearer\s+/i.test(token)) token = token.replace(/^bearer\s+/i, '').trim();
  if (token !== OPS_PANEL_TOKEN) {
    return res.status(401).json({ error: 'Token inválido. Usá Authorization: Bearer <OPS_PANEL_TOKEN>' });
  }
  next();
}

// UI estática (sin token): solo HTML/JS; las llamadas a /api/ops/* llevan el token.
app.use(
  '/ops-panel',
  express.static(path.join(__dirname, '..', 'public'), { index: 'index.html' })
);
app.get('/ops-panel', (_req, res) => res.redirect(302, '/ops-panel/'));

// --- API protegida ---
app.get('/api/ops/health-summary', requireOpsToken, async (_req, res) => {
  try {
    const data = await healthSummary();
    res.json(data);
  } catch (e) {
    res.status(502).json({ error: 'No se pudo leer el gateway', detail: e?.message });
  }
});

app.get('/api/ops/containers', requireOpsToken, async (_req, res) => {
  try {
    const list = await listWhitelistedContainers();
    res.json({ containers: list });
  } catch (e) {
    res.status(500).json({ error: 'docker_list_failed', detail: e?.message });
  }
});

app.get('/api/ops/logs', requireOpsToken, async (req, res) => {
  const target = String(req.query.target || '');
  const tail = req.query.tail;
  try {
    const text = await tailLogs(target, tail);
    res.type('text/plain; charset=utf-8').send(text);
  } catch (e) {
    if (e?.message === 'target_invalido') {
      return res.status(400).json({ error: 'target inválido', allowed: Object.keys(CONTAINER_MAP) });
    }
    res.status(500).type('text/plain').send(String(e?.message || e));
  }
});

app.post('/api/ops/breaker-control', requireOpsToken, async (req, res) => {
  const { service, action, name } = req.body || {};
  if (!service || !action) {
    return res.status(400).json({
      error: 'Body requiere { service: "usuarios"|..., action: "open"|"close"|"half_open", name?: "..." }',
    });
  }
  try {
    const result = await controlBreaker(service, action, name);
    return res.status(result.ok ? 200 : 502).json(result);
  } catch (e) {
    return res.status(500).json({ error: 'breaker_control_failed', detail: e?.message });
  }
});

app.get('/api/ops/lab/scenarios', requireOpsToken, (_req, res) => {
  res.json({ scenarios: listScenarios() });
});

app.post('/api/ops/lab/run', requireOpsToken, async (req, res) => {
  const { scenarioId } = req.body || {};
  if (!scenarioId) return res.status(400).json({ error: 'scenarioId requerido' });
  try {
    const result = await runScenario(scenarioId);
    return res.json({ ok: true, result });
  } catch (e) {
    return res.status(400).json({ error: e?.message || 'scenario_failed' });
  }
});

app.get('/api/ops/load-balance/test', requireOpsToken, async (req, res) => {
  const requests = req.query.requests;
  try {
    const result = await runLoadBalanceTest(requests);
    return res.json(result);
  } catch (e) {
    return res.status(500).json({ error: 'load_balance_test_failed', detail: e?.message });
  }
});

app.get('/api/ops/load-balance/commands', requireOpsToken, (_req, res) => {
  res.type('text/plain; charset=utf-8').send(buildLoadBalanceConsoleCommands());
});

app.get('/api/ops/lab/breaker-commands', requireOpsToken, (req, res) => {
  const service = String(req.query.service || '').trim();
  if (service) {
    const text = buildBreakerLabCommands(service);
    if (!text) return res.status(404).json({ error: 'servicio_invalido', service });
    return res.type('text/plain; charset=utf-8').send(text);
  }
  res.json({ commands: buildAllBreakerLabCommands() });
});

app.get('/api/ops/lab/commands', requireOpsToken, (req, res) => {
  const scenarioId = String(req.query.scenarioId || '').trim();
  if (!scenarioId) {
    return res.status(400).json({
      error: 'scenarioId requerido',
      example: '/api/ops/lab/commands?scenarioId=usuarios-breaker-open',
    });
  }
  const text = buildScenarioCommands(scenarioId);
  if (!text) {
    return res.status(404).json({ error: 'scenario_invalido', scenarioId });
  }
  res.type('text/plain; charset=utf-8').send(text);
});

app.post('/api/ops/action', requireOpsToken, async (req, res) => {
  const { target, action } = req.body || {};
  if (!target || !['start', 'stop'].includes(action)) {
    return res.status(400).json({ error: 'Body requiere { target: "<id>", action: "start"|"stop" }' });
  }
  try {
    if (action === 'stop') {
      const r = await stopContainer(target);
      return res.json({ ok: true, ...r });
    }
    const r = await startContainer(target);
    return res.json({ ok: true, ...r });
  } catch (e) {
    const msg = String(e?.message || e);
    if (msg.includes('target_invalido')) {
      return res.status(400).json({ error: 'target inválido' });
    }
    // Docker devuelve 304 "already stopped" como error en algunos casos
    return res.status(500).json({ error: 'docker_action_failed', detail: msg });
  }
});

app.get('/api/ops/ping', (_req, res) => {
  res.json({ service: 'ops-service', docker_socket: process.env.DOCKER_SOCKET_PATH || '/var/run/docker.sock' });
});

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`[ops] escuchando en :${PORT} — panel: /ops-panel/ — API: /api/ops/*`);
});
