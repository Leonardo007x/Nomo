const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const pino = require('pino');
const pinoHttp = require('pino-http');
const CircuitBreaker = require('opossum');

/**
 * Microservicio Categorías — CRUD de categorías por tienda.
 * BD propia y autorización distribuida vía tiendas-service.
 */
// Inicialización del servicio y parámetros globales.
const app = express();
const port = process.env.PORT || 3005;
const JWT_SECRET = process.env.JWT_SECRET || 'dev-only-cambiar';
const INTERNAL_TOKEN = process.env.INTERNAL_SERVICE_TOKEN || '';
// URL interna para validación de ownership de tienda.
const TIENDAS_URL = (process.env.TIENDAS_SERVICE_URL || 'http://tiendas-service:3002').replace(/\/$/, '');
const SERVICE_NAME = 'categorias-service';
const logger = pino({ level: process.env.LOG_LEVEL || 'info', base: { service: SERVICE_NAME } });

// Middleware base.
app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use((req, res, next) => {
  const requestId = req.headers['x-request-id'] || crypto.randomUUID();
  req.requestId = requestId;
  res.setHeader('X-Request-Id', requestId);
  next();
});
app.use(
  pinoHttp({
    logger,
    genReqId: (req) => req.requestId,
    customProps: (req) => ({ requestId: req.requestId }),
  })
);

// Configuración de conexión a la base dedicada de categorías.
const dbConfig = {
  user: process.env.MYSQL_USER || 'admin',
  host: process.env.DB_HOST || 'db-categorias',
  database: process.env.MYSQL_DATABASE || 'categorias_db',
  password: process.env.MYSQL_PASSWORD || 'adminpassword',
  port: 3306,
};

let pool;

function createJsonBreaker(name) {
  // Acción HTTP base reutilizable para ejecutar detrás del circuit breaker.
  const action = async ({ url, options }) => {
    const controller = new AbortController();
    const timeoutMs = Number(process.env.HTTP_TIMEOUT_MS || 3500);
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(url, { ...(options || {}), signal: controller.signal });
      const text = await response.text();
      let data = {};
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        data = { raw: text };
      }
      return { ok: response.ok, status: response.status, data };
    } finally {
      clearTimeout(timeout);
    }
  };

  // Parámetros de resiliencia: cuándo abrir circuito y cuándo intentar recuperación.
  return new CircuitBreaker(action, {
    timeout: Number(process.env.CB_TIMEOUT_MS || 4500),
    errorThresholdPercentage: Number(process.env.CB_ERROR_THRESHOLD || 50),
    resetTimeout: Number(process.env.CB_RESET_TIMEOUT_MS || 15000),
    volumeThreshold: Number(process.env.CB_VOLUME_THRESHOLD || 5),
    name,
  });
}

// Circuit breaker para la autorización distribuida contra tiendas-service.
const tiendasOwnerBreaker = createJsonBreaker('categorias-tiendas-owner');

// Espera activa de disponibilidad DB.
async function waitForDb(p, maxAttempts = 40, delayMs = 2000) {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      await p.query('SELECT 1');
      logger.info('[categorias] MySQL listo');
      return;
    } catch (e) {
      logger.warn({ err: e }, `[categorias] MySQL intento ${i + 1}/${maxAttempts}`);
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }
  throw new Error('[categorias] No se pudo conectar a MySQL');
}

// Middleware JWT para operaciones de escritura.
function requireAuth(req, res, next) {
  const h = req.headers.authorization;
  if (!h || !h.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No autorizado' });
  }
  try {
    req.user = jwt.verify(h.slice(7), JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: 'Token inválido o expirado' });
  }
}

// Validación distribuida: dueño de tienda consultando tiendas-service.
async function assertUserOwnsTienda(tiendaId, userId) {
  if (!INTERNAL_TOKEN) return false;
  try {
    // Llamada protegida por circuito para evitar saturación cuando tiendas está degradado.
    const result = await tiendasOwnerBreaker.fire({
      url: `${TIENDAS_URL}/internal/tiendas/${encodeURIComponent(tiendaId)}/owner`,
      options: {
        headers: { 'X-Internal-Token': INTERNAL_TOKEN },
      },
    });
    if (!result.ok) return false;
    return result.data?.usuario_id === userId;
  } catch (e) {
    logger.error({ err: e }, '[categorias] assertUserOwnsTienda');
    return false;
  }
}

// Lectura pública de categorías por tienda.
app.get('/api/categorias', async (req, res) => {
  const tiendaId = req.query.tienda_id;
  if (!tiendaId) return res.status(400).json({ error: 'tienda_id requerido' });
  try {
    const [rows] = await pool.query(
      'SELECT * FROM categorias WHERE tienda_id = ? ORDER BY orden ASC, creado_en DESC',
      [tiendaId]
    );
    res.json(rows);
  } catch (e) {
    req.log.error({ err: e }, 'Error GET /api/categorias');
    res.status(500).json({ error: 'Error interno' });
  }
});

// Alta protegida de categoría.
app.post('/api/categorias', requireAuth, async (req, res) => {
  const { tienda_id, nombre, icono, orden } = req.body || {};
  if (!tienda_id || !nombre) {
    return res.status(400).json({ error: 'tienda_id y nombre son requeridos' });
  }
  try {
    const ok = await assertUserOwnsTienda(tienda_id, req.user.sub);
    if (!ok) return res.status(403).json({ error: 'No autorizado' });

    const id = crypto.randomUUID();
    await pool.query(
      'INSERT INTO categorias (id, tienda_id, nombre, icono, orden) VALUES (?, ?, ?, ?, ?)',
      [id, tienda_id, nombre, icono || null, Number.isFinite(Number(orden)) ? Number(orden) : 0]
    );
    const [rows] = await pool.query('SELECT * FROM categorias WHERE id = ?', [id]);
    res.status(201).json(rows[0]);
  } catch (e) {
    req.log.error({ err: e }, 'Error POST /api/categorias');
    res.status(500).json({ error: 'Error al crear categoría' });
  }
});

// Edición protegida de categoría.
app.patch('/api/categorias/:id', requireAuth, async (req, res) => {
  try {
    const [catRows] = await pool.query('SELECT * FROM categorias WHERE id = ?', [req.params.id]);
    if (!catRows.length) return res.status(404).json({ error: 'No encontrado' });
    const current = catRows[0];
    const ok = await assertUserOwnsTienda(current.tienda_id, req.user.sub);
    if (!ok) return res.status(403).json({ error: 'No autorizado' });

    const body = req.body || {};
    const allowed = ['nombre', 'icono', 'orden'];
    const updates = [];
    const vals = [];
    for (const k of allowed) {
      if (body[k] !== undefined) {
        updates.push(`${k} = ?`);
        vals.push(k === 'orden' ? Number(body[k]) : body[k]);
      }
    }
    if (!updates.length) return res.json(current);
    vals.push(req.params.id);
    await pool.query(`UPDATE categorias SET ${updates.join(', ')} WHERE id = ?`, vals);
    const [rows] = await pool.query('SELECT * FROM categorias WHERE id = ?', [req.params.id]);
    res.json(rows[0]);
  } catch (e) {
    req.log.error({ err: e }, 'Error PATCH /api/categorias/:id');
    res.status(500).json({ error: 'Error al actualizar categoría' });
  }
});

// Eliminación protegida de categoría.
app.delete('/api/categorias/:id', requireAuth, async (req, res) => {
  try {
    const [catRows] = await pool.query('SELECT * FROM categorias WHERE id = ?', [req.params.id]);
    if (!catRows.length) return res.status(404).json({ error: 'No encontrado' });
    const ok = await assertUserOwnsTienda(catRows[0].tienda_id, req.user.sub);
    if (!ok) return res.status(403).json({ error: 'No autorizado' });
    await pool.query('DELETE FROM categorias WHERE id = ?', [req.params.id]);
    res.status(204).end();
  } catch (e) {
    req.log.error({ err: e }, 'Error DELETE /api/categorias/:id');
    res.status(500).json({ error: 'Error al eliminar categoría' });
  }
});

// Healthcheck con métrica simple del dominio.
app.get('/api/health', async (_req, res) => {
  let total = null;
  try {
    const [rows] = await pool.query('SELECT COUNT(*) AS total FROM categorias');
    total = rows[0].total;
  } catch {
    total = null;
  }
  res.json({
    service: 'categorias-service',
    status: 'ok',
    database_host: process.env.DB_HOST,
    tiendas_url: TIENDAS_URL,
    total_categorias: total,
  });
});

// Arranque controlado del microservicio.
async function bootstrap() {
  try {
    pool = mysql.createPool(dbConfig);
    await waitForDb(pool);
    app.listen(port, () => {
      logger.info(`[categorias] API en puerto ${port}`);
    });
  } catch (e) {
    logger.error({ err: e }, '[categorias] Arranque fallido');
    process.exit(1);
  }
}

bootstrap();
