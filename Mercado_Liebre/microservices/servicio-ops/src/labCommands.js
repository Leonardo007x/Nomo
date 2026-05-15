/**
 * Comandos copy-paste por escenario de laboratorio.
 */

const { GATEWAY_HOST_PORT, OPS_PANEL_TOKEN, OPS_LAB_TOKEN } = require('./config');
const { SCENARIOS } = require('./labScenarios');

const BREAKER_NAMES = {
  usuarios: 'usuarios-mysql',
  tiendas: 'tiendas-catalogo-productos',
  catalogo: 'catalogo-tiendas-owner',
  categorias: 'categorias-tiendas-owner',
  media: 'media-cloudinary-upload',
  ia: 'ia-groq',
};

const LOG_TARGETS = {
  usuarios: 'usuarios-service',
  tiendas: 'tiendas-service',
  catalogo: 'catalogo-service',
  categorias: 'categorias-service',
  media: 'media-service',
  ia: 'ia-service',
};

function curlBreakerControl(service, action, name) {
  const gw = GATEWAY_HOST_PORT;
  const lab = OPS_LAB_TOKEN;
  const body = name ? `{\\"action\\":\\"${action}\\",\\"name\\":\\"${name}\\"}` : `{\\"action\\":\\"${action}\\"}`;
  return [
    `curl -s -X POST http://localhost:${gw}/api/health/breakers/control/${service} ^`,
    `  -H "Content-Type: application/json" ^`,
    `  -H "X-Ops-Lab-Token: ${lab}" ^`,
    `  -d "${body}"`,
  ].join('\n');
}

function curlHealthBreakers(service) {
  return `curl -s http://localhost:${GATEWAY_HOST_PORT}/api/health/breakers/${service}`;
}

function curlOpsLogs(target, tail = 80) {
  const tok = OPS_PANEL_TOKEN;
  return `curl -s -H "Authorization: Bearer ${tok}" "http://localhost:${GATEWAY_HOST_PORT}/api/ops/logs?target=${target}&tail=${tail}"`;
}

function dockerLines(stop, start) {
  const lines = [];
  if (stop) lines.push(`docker compose stop ${stop}`);
  if (start) lines.push(`docker compose start ${start}`);
  return lines;
}

function buildScenarioCommands(scenarioId) {
  const s = SCENARIOS[scenarioId];
  if (!s) return null;

  const gw = GATEWAY_HOST_PORT;
  const tok = OPS_PANEL_TOKEN;
  const svc = s.service;
  const logTarget = LOG_TARGETS[svc] || `${svc}-service`;
  const breakerName = BREAKER_NAMES[svc];

  const lines = [
    `# Escenario: ${s.title}`,
    `# id: ${scenarioId}`,
    '',
  ];

  if (s.dockerStop) {
    lines.push('## 1. Docker (desde carpeta Mercado_Liebre)', ...dockerLines(s.dockerStop, null), '');
  }
  if (s.dockerStart) {
    lines.push('## 1. Docker', ...dockerLines(null, s.dockerStart), '');
  }

  if (s.control) {
    const { action, name } = s.control;
    lines.push(
      '## 2. Forzar breaker (Opossum real)',
      curlBreakerControl(svc, action, name),
      '',
      '## 3. Verificar estado',
      curlHealthBreakers(svc),
      ''
    );
  }

  if (s.probe?.url) {
    const n = s.probe.times || 5;
    lines.push('## 2. Provocar fallos (repetir health)');
    for (let i = 0; i < n; i += 1) {
      lines.push(`curl -s http://localhost:${gw}/api/health/${svc}`);
    }
    lines.push('', '## 3. Verificar breaker', curlHealthBreakers(svc), '');
  }

  if (s.dockerStop && !s.control) {
    lines.push(
      '## 2. Provocar fallos',
      `curl -s http://localhost:${gw}/api/health/${svc}`,
      '(repetir varias veces o hacer login en el front)',
      '',
      '## 3. Verificar breaker',
      curlHealthBreakers(svc),
      ''
    );
  }

  lines.push(
    '## Logs del servicio',
    curlOpsLogs(logTarget, 120),
    `docker compose logs --tail=120 ${logTarget}`,
    `docker compose logs ${logTarget} 2>&1 | findstr circuit_breaker`,
    '',
    '## Panel ops',
    `curl -s -H "Authorization: Bearer ${tok}" http://localhost:${gw}/api/ops/health-summary`,
  );

  return lines.join('\n');
}

function listScenarioIds() {
  return Object.keys(SCENARIOS);
}

/** Comandos de consola para la tarjeta de laboratorio de un microservicio. */
function buildBreakerLabCommands(service) {
  const breakerName = BREAKER_NAMES[service];
  if (!breakerName) return null;

  const logTarget = LOG_TARGETS[service];
  const gw = GATEWAY_HOST_PORT;

  return [
    `# ${service} — breaker: ${breakerName}`,
    `# Gateway: http://localhost:${gw}`,
    '',
    '# Abrir circuito',
    curlBreakerControl(service, 'open', breakerName),
    '',
    '# Semiabierto',
    curlBreakerControl(service, 'half_open', breakerName),
    '',
    '# Cerrar circuito',
    curlBreakerControl(service, 'close', breakerName),
    '',
    '# Ver estado del breaker',
    curlHealthBreakers(service),
    '',
    '# Logs (panel ops)',
    curlOpsLogs(logTarget, 120),
    '',
    '# Logs (docker compose, carpeta Mercado_Liebre)',
    `docker compose logs --tail=120 ${logTarget}`,
    `docker compose logs ${logTarget} 2>&1 | findstr circuit_breaker`,
  ].join('\n');
}

function buildAllBreakerLabCommands() {
  const out = {};
  for (const svc of Object.keys(BREAKER_NAMES)) {
    out[svc] = buildBreakerLabCommands(svc);
  }
  return out;
}

module.exports = {
  buildScenarioCommands,
  buildBreakerLabCommands,
  buildAllBreakerLabCommands,
  listScenarioIds,
};
