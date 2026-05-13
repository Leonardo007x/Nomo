/**
 * Microservicio Catálogo — productos.
 * BD propia. Validación de dueño de tienda vía HTTP al microservicio tiendas (/internal).
 */
const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const pino = require('pino');
const pinoHttp = require('pino-http');
const CircuitBreaker = require('opossum');
// Helpers compartidos: logs de eventos del Circuit Breaker (incluye half-open) y health uniforme.
const {
  attachBreakerLogs,
  getBreakerState,
  classifyBreakerError,
  pingDb,
  buildHealthPayload,
} = require('./lib/resilience');

// Inicialización del microservicio catálogo (productos).
const app = express();
const port = process.env.PORT || 3003;
const JWT_SECRET = process.env.JWT_SECRET || 'dev-only-cambiar';
const INTERNAL_TOKEN = process.env.INTERNAL_SERVICE_TOKEN || '';
// URL interna para validar ownership de tienda.
const TIENDAS_URL = (process.env.TIENDAS_SERVICE_URL || 'http://tiendas-service:3002').replace(/\/$/, '');
const SERVICE_NAME = 'catalogo-service';
const logger = pino({ level: process.env.LOG_LEVEL || 'info', base: { service: SERVICE_NAME } });

// Middleware base.
app.use(cors());
app.use(express.json({ limit: '2mb' }));
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

// Configuración de la base de datos exclusiva de productos.
const dbConfig = {
  user: process.env.MYSQL_USER || 'admin',
  host: process.env.DB_HOST || 'db-catalogo',
  database: process.env.MYSQL_DATABASE || 'catalogo_db',
  password: process.env.MYSQL_PASSWORD || 'adminpassword',
  port: 3306,
};

let pool;

function createJsonBreaker(name) {
  // Wrapper HTTP con timeout + parse JSON para usar detrás del circuit breaker.
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

  // Política del circuito: abre con fallos repetidos y reintenta tras ventana de reset.
  return new CircuitBreaker(action, {
    timeout: Number(process.env.CB_TIMEOUT_MS || 4500),
    errorThresholdPercentage: Number(process.env.CB_ERROR_THRESHOLD || 50),
    resetTimeout: Number(process.env.CB_RESET_TIMEOUT_MS || 15000),
    volumeThreshold: Number(process.env.CB_VOLUME_THRESHOLD || 5),
    name,
  });
}

// Circuit breaker para proteger la validación distribuida de owner en tiendas-service.
// attachBreakerLogs deja en logs estructurados cada transición de estado del circuito.
const tiendasOwnerBreaker = attachBreakerLogs(
  createJsonBreaker('catalogo-tiendas-owner'),
  logger
);

// Registro central de breakers del servicio (lo expone /api/health/breakers).
const breakers = [tiendasOwnerBreaker];

// Espera activa de DB para arranque robusto en Compose.
async function waitForDb(p, maxAttempts = 40, delayMs = 2000) {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      await p.query('SELECT 1');
      logger.info('[catalogo] MySQL listo');
      return;
    } catch (e) {
      logger.warn({ err: e }, `[catalogo] MySQL intento ${i + 1}/${maxAttempts}`);
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }
  throw new Error('[catalogo] No se pudo conectar a MySQL');
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

// Parseo seguro de JSON persistido en MySQL.
function parseJsonField(val, fallback) {
  if (val == null) return fallback;
  if (typeof val === 'object') return val;
  try {
    return JSON.parse(val);
  } catch {
    return fallback;
  }
}

// Adaptador de fila SQL al contrato de salida del frontend.
function mapProductoRow(row) {
  if (!row) return null;
  const c = parseJsonField(row.caracteristicas, []);
  return {
    ...row,
    id: String(row.id),
    tienda_id: row.tienda_id,
    precio: Number(row.precio),
    caracteristicas: Array.isArray(c) ? c : [],
    visible: row.activo !== 0 && row.activo !== false,
    activo: row.activo !== 0 && row.activo !== false,
  };
}

// Autorización distribuida: valida dueño de tienda consultando tiendas-service.
async function assertUserOwnsTienda(tiendaId, userId) {
  if (!INTERNAL_TOKEN) {
    logger.warn('[catalogo] INTERNAL_SERVICE_TOKEN no configurado');
    return false;
  }
  try {
    // Si el circuito está abierto o hay timeout, entra al catch y evitamos cascada de fallos.
    const result = await tiendasOwnerBreaker.fire({
      url: `${TIENDAS_URL}/internal/tiendas/${encodeURIComponent(tiendaId)}/owner`,
      options: {
        headers: { 'X-Internal-Token': INTERNAL_TOKEN },
      },
    });
    if (!result.ok) return false;
    return result.data?.usuario_id === userId;
  } catch (e) {
    // Etiquetamos la razón: bloqueo del propio breaker vs error real del backend.
    const reason = classifyBreakerError(e);
    logger.error(
      { err: e?.message, breaker: 'catalogo-tiendas-owner', reason },
      '[catalogo] assertUserOwnsTienda'
    );
    return false;
  }
}

// Lectura de catálogo con filtros por tienda y estado.
app.get('/api/productos', async (req, res) => {
  try {
    let sql = 'SELECT * FROM productos';
    const cond = [];
    const vals = [];
    if (req.query.tienda_id) {
      cond.push('tienda_id = ?');
      vals.push(req.query.tienda_id);
    }
    if (req.query.activo !== undefined) {
      cond.push('activo = ?');
      vals.push(req.query.activo === 'true' || req.query.activo === '1' ? 1 : 0);
    }
    if (cond.length) sql += ' WHERE ' + cond.join(' AND ');
    sql += ' ORDER BY creado_en DESC';
    const [rows] = await pool.query(sql, vals);
    res.json(rows.map(mapProductoRow));
  } catch (error) {
    req.log.error({ err: error }, 'Error GET /api/productos');
    res.status(500).json({ error: 'Error interno conectando a la BD' });
  }
});

// Alta protegida de producto.
app.post('/api/productos', requireAuth, async (req, res) => {
  const { nombre, descripcion, precio, tienda_id, categoria, categoria_id, imagen_url, caracteristicas, disponible, activo, destacado } =
    req.body || {};
  if (!tienda_id) return res.status(400).json({ error: 'tienda_id requerido' });
  try {
    const ok = await assertUserOwnsTienda(tienda_id, req.user.sub);
    if (!ok) {
      return res.status(403).json({ error: 'No autorizado' });
    }
    const [result] = await pool.query(
      `INSERT INTO productos (tienda_id, categoria_id, categoria, nombre, descripcion, precio, imagen_url, caracteristicas, disponible, activo, destacado)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        tienda_id,
        categoria_id || null,
        categoria || 'General',
        nombre,
        descripcion || null,
        precio,
        imagen_url || null,
        caracteristicas ? JSON.stringify(caracteristicas) : null,
        disponible !== false ? 1 : 0,
        activo !== false ? 1 : 0,
        destacado ? 1 : 0,
      ]
    );
    const [newProduct] = await pool.query('SELECT * FROM productos WHERE id = ?', [result.insertId]);
    res.status(201).json(mapProductoRow(newProduct[0]));
  } catch (error) {
    req.log.error({ err: error }, 'Error POST /api/productos');
    res.status(500).json({ error: 'Error al insertar producto en la BD' });
  }
});

// Edición protegida de producto.
app.patch('/api/productos/:id', requireAuth, async (req, res) => {
  try {
    const [p] = await pool.query('SELECT tienda_id FROM productos WHERE id = ?', [req.params.id]);
    if (!p.length) return res.status(404).json({ error: 'No encontrado' });
    const tid = p[0].tienda_id;
    if (!tid) return res.status(403).json({ error: 'Producto sin tienda asignada' });
    const owned = await assertUserOwnsTienda(tid, req.user.sub);
    if (!owned) return res.status(403).json({ error: 'No autorizado' });

    const body = req.body || {};
    const allowed = [
      'nombre',
      'descripcion',
      'precio',
      'categoria',
      'categoria_id',
      'imagen_url',
      'caracteristicas',
      'disponible',
      'activo',
      'destacado',
    ];
    const updates = [];
    const vals = [];
    for (const k of allowed) {
      if (body[k] !== undefined) {
        updates.push(`${k} = ?`);
        if (k === 'caracteristicas') vals.push(JSON.stringify(body[k]));
        else if (k === 'disponible' || k === 'activo' || k === 'destacado') vals.push(body[k] ? 1 : 0);
        else vals.push(body[k]);
      }
    }
    if (!updates.length) {
      const [rows] = await pool.query('SELECT * FROM productos WHERE id = ?', [req.params.id]);
      return res.json(mapProductoRow(rows[0]));
    }
    vals.push(req.params.id);
    await pool.query(`UPDATE productos SET ${updates.join(', ')} WHERE id = ?`, vals);
    const [rows] = await pool.query('SELECT * FROM productos WHERE id = ?', [req.params.id]);
    res.json(mapProductoRow(rows[0]));
  } catch (e) {
    req.log.error({ err: e }, 'Error PATCH /api/productos/:id');
    res.status(500).json({ error: 'Error al actualizar' });
  }
});

// Eliminación protegida de producto.
app.delete('/api/productos/:id', requireAuth, async (req, res) => {
  try {
    const [p] = await pool.query('SELECT tienda_id FROM productos WHERE id = ?', [req.params.id]);
    if (!p.length) return res.status(404).json({ error: 'No encontrado' });
    const tid = p[0].tienda_id;
    if (!tid) return res.status(403).json({ error: 'No autorizado' });
    const owned = await assertUserOwnsTienda(tid, req.user.sub);
    if (!owned) return res.status(403).json({ error: 'No autorizado' });
    await pool.query('DELETE FROM productos WHERE id = ?', [req.params.id]);
    res.status(204).end();
  } catch (e) {
    req.log.error({ err: e }, 'Error DELETE /api/productos/:id');
    res.status(500).json({ error: 'Error al eliminar' });
  }
});

// ---------------------------------------------------------------
// Healthchecks unificados (mismo contrato en todos los servicios)
// ---------------------------------------------------------------
app.get('/api/health', async (_req, res) => {
  try {
    const db = await pingDb(pool);
    const breakersState = breakers.map(getBreakerState);
    const payload = buildHealthPayload({
      service: SERVICE_NAME,
      db,
      breakers: breakersState,
      extras: {
        database_host: process.env.DB_HOST,
        tiendas_url: TIENDAS_URL,
      },
    });
    res.status(payload.status === 'down' ? 503 : 200).json(payload);
  } catch (err) {
    logger.error({ err }, '[catalogo] GET /api/health');
    res.status(500).json({ error: 'health_check_failed', service: SERVICE_NAME });
  }
});

app.get('/api/health/ready', async (_req, res) => {
  try {
    const db = await pingDb(pool);
    res.status(db.ok ? 200 : 503).json({ service: SERVICE_NAME, ready: db.ok, db });
  } catch (err) {
    logger.error({ err }, '[catalogo] GET /api/health/ready');
    res.status(500).json({ error: 'health_ready_failed', service: SERVICE_NAME });
  }
});

app.get('/api/health/breakers', (_req, res) => {
  try {
    res.json({ service: SERVICE_NAME, breakers: breakers.map(getBreakerState) });
  } catch (err) {
    logger.error({ err }, '[catalogo] GET /api/health/breakers');
    res.status(500).json({ error: 'health_breakers_failed', service: SERVICE_NAME });
  }
});

// Arranque ordenado del servicio.
async function bootstrap() {
  try {
    pool = mysql.createPool(dbConfig);
    await waitForDb(pool);
    app.listen(port, () => {
      logger.info(`[catalogo] API en puerto ${port}`);
    });
  } catch (e) {
    logger.error({ err: e }, '[catalogo] Arranque fallido');
    process.exit(1);
  }
}

bootstrap();
