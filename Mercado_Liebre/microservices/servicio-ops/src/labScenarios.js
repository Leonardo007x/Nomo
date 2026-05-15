/**
 * Escenarios de laboratorio con acciones reales (Docker + HTTP de provocación).
 */

const { SERVICE_URLS, GATEWAY_INTERNAL_URL } = require('./config');
const { controlBreaker } = require('./breakerProxy');
const { stopContainer, startContainer } = require('./dockerCtl');

const SCENARIOS = {
  'usuarios-db-down': {
    title: 'Usuarios: apagar MySQL (fallos reales → breaker puede abrir)',
    service: 'usuarios',
    steps: ['stop db-usuarios', 'probe health x8'],
    dockerStop: 'db-usuarios',
    probe: { url: `${SERVICE_URLS.usuarios}/api/health`, times: 8 },
  },
  'usuarios-db-up': {
    title: 'Usuarios: levantar MySQL',
    service: 'usuarios',
    steps: ['start db-usuarios'],
    dockerStart: 'db-usuarios',
  },
  'usuarios-breaker-open': {
    title: 'Usuarios: forzar breaker ABIERTO (Opossum.open)',
    service: 'usuarios',
    steps: ['POST control open'],
    control: { service: 'usuarios', action: 'open', name: 'usuarios-mysql' },
  },
  'usuarios-breaker-half': {
    title: 'Usuarios: forzar SEMIABIERTO',
    service: 'usuarios',
    steps: ['POST control half_open'],
    control: { service: 'usuarios', action: 'half_open', name: 'usuarios-mysql' },
  },
  'usuarios-breaker-close': {
    title: 'Usuarios: forzar CERRADO',
    service: 'usuarios',
    steps: ['POST control close'],
    control: { service: 'usuarios', action: 'close', name: 'usuarios-mysql' },
  },
  'tiendas-catalogo-down': {
    title: 'Tiendas: apagar catálogo (vista pública falla / breaker HTTP)',
    service: 'tiendas',
    steps: ['stop catalogo-service', 'probe vista-publica placeholder'],
    dockerStop: 'catalogo-service',
  },
  'tiendas-catalogo-up': {
    title: 'Tiendas: levantar catálogo',
    service: 'tiendas',
    dockerStart: 'catalogo-service',
  },
  'tiendas-breaker-open': {
    title: 'Tiendas: forzar breaker hacia catálogo ABIERTO',
    service: 'tiendas',
    control: { service: 'tiendas', action: 'open', name: 'tiendas-catalogo-productos' },
  },
  'catalogo-tiendas-down': {
    title: 'Catálogo: apagar tiendas (validación owner falla)',
    service: 'catalogo',
    dockerStop: 'tiendas-service',
  },
  'catalogo-breaker-open': {
    title: 'Catálogo: forzar breaker tiendas-owner ABIERTO',
    service: 'catalogo',
    control: { service: 'catalogo', action: 'open', name: 'catalogo-tiendas-owner' },
  },
  'categorias-breaker-half': {
    title: 'Categorías: forzar SEMIABIERTO',
    service: 'categorias',
    control: { service: 'categorias', action: 'half_open', name: 'categorias-tiendas-owner' },
  },
  'media-breaker-open': {
    title: 'Media: forzar breaker Cloudinary ABIERTO',
    service: 'media',
    control: { service: 'media', action: 'open', name: 'media-cloudinary-upload' },
  },
  'ia-breaker-close': {
    title: 'IA: forzar breaker Groq CERRADO',
    service: 'ia',
    control: { service: 'ia', action: 'close', name: 'ia-groq' },
  },
};

function listScenarios() {
  return Object.entries(SCENARIOS).map(([id, s]) => ({
    id,
    title: s.title,
    service: s.service,
    steps: s.steps || [],
  }));
}

async function probeUrl(url, times = 5) {
  const results = [];
  for (let i = 0; i < times; i += 1) {
    const t0 = Date.now();
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 8000);
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timer);
      results.push({ attempt: i + 1, status: res.status, ms: Date.now() - t0 });
    } catch (e) {
      results.push({ attempt: i + 1, error: e?.message || String(e), ms: Date.now() - t0 });
    }
  }
  return results;
}

async function runScenario(id) {
  const scenario = SCENARIOS[id];
  if (!scenario) throw new Error('scenario_invalido');

  const log = { id, title: scenario.title, actions: [] };

  if (scenario.dockerStop) {
    const r = await stopContainer(scenario.dockerStop);
    log.actions.push({ type: 'docker_stop', ...r });
  }
  if (scenario.dockerStart) {
    const r = await startContainer(scenario.dockerStart);
    log.actions.push({ type: 'docker_start', ...r });
  }
  if (scenario.control) {
    const r = await controlBreaker(
      scenario.control.service,
      scenario.control.action,
      scenario.control.name
    );
    log.actions.push({ type: 'breaker_control', ...r });
  }
  if (scenario.probe?.url) {
    const probes = await probeUrl(scenario.probe.url, scenario.probe.times || 5);
    log.actions.push({ type: 'http_probe', url: scenario.probe.url, probes });
  }

  log.gateway = GATEWAY_INTERNAL_URL;
  return log;
}

module.exports = { listScenarios, runScenario, SCENARIOS };
