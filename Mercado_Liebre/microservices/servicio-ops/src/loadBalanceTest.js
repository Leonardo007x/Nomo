/**
 * Prueba simple de balanceo: N peticiones al gateway y conteo por instance_id.
 */

const { GATEWAY_INTERNAL_URL, GATEWAY_HOST_PORT } = require('./config');

const LB_PATH = '/api/health/usuarios';

async function runLoadBalanceTest(requests = 40) {
  const n = Math.min(Math.max(Number(requests) || 40, 5), 200);
  const counts = {};
  const errors = [];
  const httpStatuses = [];

  const tasks = Array.from({ length: n }, async () => {
    try {
      const res = await fetch(`${GATEWAY_INTERNAL_URL}${LB_PATH}`, {
        headers: { 'Cache-Control': 'no-cache', Pragma: 'no-cache' },
      });
      httpStatuses.push(res.status);
      const data = await res.json().catch(() => ({}));
      const id = data.instance_id || data.instanceId || 'sin_instance_id';
      if (!res.ok) {
        errors.push({ status: res.status, instance_id: id, error: data.error });
      }
      return { ok: res.ok, instance_id: id };
    } catch (e) {
      errors.push({ error: e?.message || 'fetch_failed' });
      return { ok: false, instance_id: null };
    }
  });

  const results = await Promise.all(tasks);
  for (const r of results) {
    if (r.instance_id) {
      counts[r.instance_id] = (counts[r.instance_id] || 0) + 1;
    }
  }

  const replicaCount = Object.keys(counts).length;
  const totalOk = results.filter((r) => r.ok).length;

  return {
    strategy: 'nginx_upstream_round_robin',
    gateway: GATEWAY_INTERNAL_URL,
    path: LB_PATH,
    requests: n,
    ok: totalOk,
    distribution: counts,
    replicas_seen: replicaCount,
    replicas_expected: 2,
    load_balanced: replicaCount >= 2,
    errors: errors.slice(0, 8),
    hint:
      replicaCount < 2
        ? 'Solo una réplica respondió. Verificá que usuarios-service y usuarios-service-2 estén up y reconstruí gateway.'
        : 'El gateway repartió peticiones entre réplicas (Opción 1 + 2 + 3).',
  };
}

function buildLoadBalanceConsoleCommands() {
  const gw = GATEWAY_HOST_PORT;
  return [
    '# Balanceo de carga — usuarios (2 réplicas detrás del gateway)',
    '# Opción implementada: réplicas + distribución Nginx + prueba de escalabilidad',
    '',
    '## 1. Levantar stack con réplicas',
    'cd Mercado_Liebre',
    'docker compose up -d --build gateway usuarios-service usuarios-service-2',
    '',
    '## 2. Prueba desde el panel ops',
    `curl -s -H "Authorization: Bearer <OPS_PANEL_TOKEN>" "http://localhost:${gw}/api/ops/load-balance/test?requests=40"`,
    '',
    '## 3. PowerShell — ver qué réplica atiende cada petición',
    `1..40 | ForEach-Object {`,
    `  (Invoke-RestMethod "http://localhost:${gw}/api/health/usuarios").instance_id`,
    `} | Group-Object | Select-Object Name, Count`,
    '',
    '## 4. curl manual (una petición)',
    `curl -s http://localhost:${gw}/api/health/usuarios`,
    '',
    '## 5. Escalar réplicas (compose scale, alternativa)',
    '# docker compose up -d --scale usuarios-service=2   # requiere quitar container_name fijo',
  ].join('\n');
}

module.exports = { runLoadBalanceTest, buildLoadBalanceConsoleCommands };
