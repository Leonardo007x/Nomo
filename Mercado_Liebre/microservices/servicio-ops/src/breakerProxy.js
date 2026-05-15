/**
 * Proxy de control de breakers hacia cada microservicio (red Docker interna).
 * Invoca POST /api/health/breakers/control en la instancia Opossum real del proceso.
 */

const { SERVICE_URLS, OPS_LAB_TOKEN } = require('./config');

async function controlBreaker(service, action, name) {
  const base = SERVICE_URLS[service];
  if (!base) throw new Error('servicio_invalido');

  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), 12000);
  try {
    const res = await fetch(`${base}/api/health/breakers/control`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Ops-Lab-Token': OPS_LAB_TOKEN,
      },
      body: JSON.stringify({ action, name: name || undefined }),
      signal: controller.signal,
    });
    const text = await res.text();
    let data;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = { raw: text };
    }
    return { ok: res.ok, status: res.status, data, service };
  } finally {
    clearTimeout(t);
  }
}

module.exports = { controlBreaker };
