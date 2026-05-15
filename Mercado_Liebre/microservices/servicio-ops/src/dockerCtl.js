/**
 * Acceso real al motor Docker vía socket Unix.
 * Todas las operaciones se limitan a CONTAINER_MAP (whitelist).
 */

const Docker = require('dockerode');
const { CONTAINER_MAP } = require('./config');

const docker = new Docker({ socketPath: process.env.DOCKER_SOCKET_PATH || '/var/run/docker.sock' });

function resolveContainerName(targetId) {
  const name = CONTAINER_MAP[targetId];
  if (!name) return null;
  return name;
}

/**
 * Lista contenedores de la whitelist con estado actual (running/exited).
 */
async function listWhitelistedContainers() {
  const all = await docker.listContainers({ all: true });
  const byName = new Map();
  for (const c of all) {
    const names = c.Names || [];
    for (const n of names) {
      const clean = n.startsWith('/') ? n.slice(1) : n;
      byName.set(clean, c);
    }
  }

  const out = [];
  for (const [id, containerName] of Object.entries(CONTAINER_MAP)) {
    const c = byName.get(containerName);
    out.push({
      id,
      container_name: containerName,
      running: !!c && c.State === 'running',
      state: c ? c.State : 'not_found',
      status: c ? c.Status : 'no encontrado en este host Docker',
    });
  }
  return out;
}

async function stopContainer(targetId) {
  const name = resolveContainerName(targetId);
  if (!name) throw new Error('target_invalido');
  const container = docker.getContainer(name);
  try {
    await container.stop({ t: 10 });
  } catch (e) {
    if (e.statusCode === 304) {
      return { target: targetId, container_name: name, action: 'stop', note: 'ya_estaba_detenido' };
    }
    throw e;
  }
  return { target: targetId, container_name: name, action: 'stop' };
}

async function startContainer(targetId) {
  const name = resolveContainerName(targetId);
  if (!name) throw new Error('target_invalido');
  const container = docker.getContainer(name);
  try {
    await container.start();
  } catch (e) {
    if (e.statusCode === 304) {
      return { target: targetId, container_name: name, action: 'start', note: 'ya_estaba_corriendo' };
    }
    throw e;
  }
  return { target: targetId, container_name: name, action: 'start' };
}

/**
 * Convierte el buffer multiplexado de la API Docker (stdout/stderr) en texto UTF-8.
 * @param {Buffer} buf
 */
function demuxDockerLogs(buf) {
  if (!buf || buf.length === 0) return '';
  let out = '';
  let i = 0;
  while (i + 8 <= buf.length) {
    const size = buf.readUInt32BE(i + 4);
    if (size <= 0 || i + 8 + size > buf.length) break;
    out += buf.subarray(i + 8, i + 8 + size).toString('utf8');
    i += 8 + size;
  }
  return out || buf.toString('utf8');
}

/**
 * Últimas líneas de logs del contenedor (stdout+stderr), texto plano real.
 */
async function tailLogs(targetId, tail = 120) {
  const name = resolveContainerName(targetId);
  if (!name) throw new Error('target_invalido');
  const container = docker.getContainer(name);
  const stream = await container.logs({
    stdout: true,
    stderr: true,
    follow: false,
    tail: Math.min(Math.max(Number(tail) || 120, 1), 2000),
    timestamps: true,
  });
  if (Buffer.isBuffer(stream)) {
    return demuxDockerLogs(stream);
  }
  const chunks = [];
  for await (const chunk of stream) {
    chunks.push(chunk);
  }
  return demuxDockerLogs(Buffer.concat(chunks));
}

module.exports = {
  docker,
  listWhitelistedContainers,
  stopContainer,
  startContainer,
  tailLogs,
  resolveContainerName,
};
