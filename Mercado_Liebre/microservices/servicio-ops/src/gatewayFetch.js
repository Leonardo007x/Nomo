/**
 * Agrega health y breakers desde el API Gateway interno (misma red Docker).
 * Son llamadas HTTP reales a los mismos endpoints que usa el front.
 */

const { GATEWAY_INTERNAL_URL } = require('./config');

const SERVICES = ['usuarios', 'tiendas', 'catalogo', 'media', 'categorias', 'ia'];

async function fetchJson(url) {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), 12000);
  try {
    const res = await fetch(url, { signal: controller.signal });
    const text = await res.text();
    let data;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = { raw: text };
    }
    return { ok: res.ok, status: res.status, data };
  } finally {
    clearTimeout(t);
  }
}

async function healthSummary() {
  const results = {};
  for (const s of SERVICES) {
    const health = await fetchJson(`${GATEWAY_INTERNAL_URL}/api/health/${s}`);
    const breakers = await fetchJson(`${GATEWAY_INTERNAL_URL}/api/health/breakers/${s}`);
    results[s] = {
      health: health.data,
      health_http: health.status,
      breakers: breakers.data,
      breakers_http: breakers.status,
    };
  }
  return { gateway: GATEWAY_INTERNAL_URL, services: results };
}

module.exports = { healthSummary, SERVICES };
