/**
 * Microservicio Tiendas — tiendas + temas visuales.
 * BD propia. usuario_id es referencia lógica al dominio usuarios (sin FK cross-DB).
 * Expone /internal para que catalogo valide propiedad de tienda.
 */
const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const pino = require('pino');
const pinoHttp = require('pino-http');
const CircuitBreaker = require('opossum');
// Helpers compartidos para logs de Circuit Breaker (incluye half-open) y healthcheck unificado.
const {
  attachBreakerLogs,
  getBreakerState,
  classifyBreakerError,
  pingDb,
  buildHealthPayload,
} = require('./lib/resilience');

// Inicialización del servicio y variables globales.
const app = express();
const port = process.env.PORT || 3002;
const JWT_SECRET = process.env.JWT_SECRET || 'dev-only-cambiar';
const INTERNAL_TOKEN = process.env.INTERNAL_SERVICE_TOKEN || '';
// URL interna de catálogo para composición de vista pública.
const CATALOGO_URL = (process.env.CATALOGO_SERVICE_URL || 'http://catalogo-service:3003').replace(/\/$/, '');
const SERVICE_NAME = 'tiendas-service';
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

// Configuración de conexión a la base dedicada de tiendas/temas.
const dbConfig = {
  user: process.env.MYSQL_USER || 'admin',
  host: process.env.DB_HOST || 'db-tiendas',
  database: process.env.MYSQL_DATABASE || 'tiendas_db',
  password: process.env.MYSQL_PASSWORD || 'adminpassword',
  port: 3306,
};

let pool;

function createJsonBreaker(name) {
  // Cliente HTTP resiliente con timeout para llamadas internas a otros servicios.
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
      return { ok: response.ok, status: response.status, data, raw: text };
    } finally {
      clearTimeout(timeout);
    }
  };

  // Configuración del circuito (timeout, umbral de error y tiempo de recuperación).
  return new CircuitBreaker(action, {
    timeout: Number(process.env.CB_TIMEOUT_MS || 4500),
    errorThresholdPercentage: Number(process.env.CB_ERROR_THRESHOLD || 50),
    resetTimeout: Number(process.env.CB_RESET_TIMEOUT_MS || 15000),
    volumeThreshold: Number(process.env.CB_VOLUME_THRESHOLD || 5),
    name,
  });
}

// Circuit breaker para la composición de vista pública desde catalogo-service.
// attachBreakerLogs hace observable la transición CLOSED -> OPEN -> HALF-OPEN -> CLOSED
// en los logs (Pino) sin duplicar lógica en cada endpoint.
const catalogoProductosBreaker = attachBreakerLogs(
  createJsonBreaker('tiendas-catalogo-productos'),
  logger
);

// Registro central de breakers de este servicio (lo expone /api/health/breakers).
const breakers = [catalogoProductosBreaker];

// Espera activa de disponibilidad MySQL en entorno containerizado.
async function waitForDb(p, maxAttempts = 40, delayMs = 2000) {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      await p.query('SELECT 1');
      logger.info('[tiendas] MySQL listo');
      return;
    } catch (e) {
      logger.warn({ err: e }, `[tiendas] MySQL intento ${i + 1}/${maxAttempts}`);
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }
  throw new Error('[tiendas] No se pudo conectar a MySQL');
}

// Middleware JWT de rutas de negocio protegidas.
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

// Middleware de seguridad para endpoints internos servicio-a-servicio.
function requireInternal(req, res, next) {
  const t = req.headers['x-internal-token'];
  if (!INTERNAL_TOKEN || t !== INTERNAL_TOKEN) {
    return res.status(403).json({ error: 'Servicio no autorizado' });
  }
  next();
}

// Utilidad para campos JSON persistidos como texto.
function parseJsonField(val, fallback) {
  if (val == null) return fallback;
  if (typeof val === 'object') return val;
  try {
    return JSON.parse(val);
  } catch {
    return fallback;
  }
}

/** Solo uso servidor-a-servidor: dueño de una tienda por ID */
app.get('/internal/tiendas/:id/owner', requireInternal, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT usuario_id FROM tiendas WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'No encontrado' });
    return res.json({ usuario_id: rows[0].usuario_id });
  } catch (e) {
    req.log.error({ err: e }, 'Error /internal/tiendas/:id/owner');
    return res.status(500).json({ error: 'Error interno' });
  }
});

app.get('/api/tiendas', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM tiendas ORDER BY creado_en DESC');
    const mapped = rows.map((r) => ({
      ...r,
      dias_abierto: parseJsonField(r.dias_abierto, {}),
    }));
    res.json(mapped);
  } catch (e) {
    req.log.error({ err: e }, 'Error GET /api/tiendas');
    res.status(500).json({ error: 'Error al listar tiendas' });
  }
});

app.get('/api/tiendas/destacadas', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT * FROM tiendas 
       WHERE imagen_banner_url IS NOT NULL AND imagen_banner_url != '' 
       ORDER BY creado_en DESC LIMIT 6`
    );
    const mapped = rows.map((r) => ({
      ...r,
      dias_abierto: parseJsonField(r.dias_abierto, {}),
    }));
    res.json(mapped);
  } catch (e) {
    req.log.error({ err: e }, 'Error GET /api/tiendas/destacadas');
    res.status(500).json({ error: 'Error al listar destacadas' });
  }
});

app.get('/api/tiendas/mias', requireAuth, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM tiendas WHERE usuario_id = ? LIMIT 1', [
      req.user.sub,
    ]);
    const r = rows[0];
    if (!r) return res.json(null);
    return res.json({
      ...r,
      dias_abierto: parseJsonField(r.dias_abierto, {}),
    });
  } catch (e) {
    req.log.error({ err: e }, 'Error GET /api/tiendas/mias');
    res.status(500).json({ error: 'Error al obtener tienda' });
  }
});

function mapProductoFromCatalog(item) {
  if (!item) return null;
  return {
    ...item,
    id: String(item.id),
    precio: Number(item.precio),
    caracteristicas: Array.isArray(item.caracteristicas) ? item.caracteristicas : [],
    visible: item.activo !== 0 && item.activo !== false,
    activo: item.activo !== 0 && item.activo !== false,
  };
}

// Endpoint agregado que consume catálogo para entregar storefront completo.
app.get('/api/tiendas/:id/vista-publica', async (req, res) => {
  try {
    const id = req.params.id;
    const [tRows] = await pool.query('SELECT * FROM tiendas WHERE id = ?', [id]);
    const tienda = tRows[0];
    if (!tienda) return res.status(404).json({ error: 'Tienda no encontrada' });

    const [temRows] = await pool.query('SELECT * FROM temas WHERE tienda_id = ? LIMIT 1', [id]);
    let tema = temRows[0];
    if (!tema) {
      tema = {
        id: 'default',
        tienda_id: id,
        color_primario: '#000000',
        color_secundario: '#333333',
        color_fondo: '#FFFFFF',
        color_texto: '#000000',
        color_texto_titulos: '#000000',
        fuente_titulos: 'Playfair Display',
        fuente_cuerpo: 'Inter',
        estilo_plantilla: 'moderno',
      };
    }

    // fire() ejecuta la llamada protegida; si falla repetidamente, el circuito se abre.
    let prodResult;
    try {
      prodResult = await catalogoProductosBreaker.fire({
        url: `${CATALOGO_URL}/api/productos?tienda_id=${encodeURIComponent(id)}&activo=true`,
      });
    } catch (fireErr) {
      // Diferenciamos un fallo real del backend frente a un rechazo del propio circuito
      // (estado open) para que el log y el cliente lo distingan claramente.
      const reason = classifyBreakerError(fireErr);
      req.log.warn(
        { reason, breaker: 'tiendas-catalogo-productos', err: fireErr?.message },
        '[tiendas] vista-publica: llamada a catalogo bloqueada o fallida'
      );
      const httpStatus = reason === 'circuit_open' ? 503 : 502;
      return res.status(httpStatus).json({
        error:
          reason === 'circuit_open'
            ? 'Catálogo temporalmente protegido por circuit breaker'
            : 'Catálogo no disponible',
        reason,
      });
    }
    if (!prodResult.ok) {
      req.log.error(
        { status: prodResult.status, body: prodResult.raw, reason: 'upstream_error' },
        '[tiendas] catalogo productos'
      );
      return res.status(502).json({ error: 'Catálogo no disponible', reason: 'upstream_error' });
    }
    const rawProductos = prodResult.data;
    const productos = Array.isArray(rawProductos)
      ? rawProductos.map(mapProductoFromCatalog)
      : [];

    res.json({
      tienda: { ...tienda, dias_abierto: parseJsonField(tienda.dias_abierto, {}) },
      tema,
      productos,
    });
  } catch (e) {
    req.log.error({ err: e }, 'Error GET /api/tiendas/:id/vista-publica');
    res.status(500).json({ error: 'Error interno' });
  }
});

app.get('/api/tiendas/:id', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM tiendas WHERE id = ?', [req.params.id]);
    const r = rows[0];
    if (!r) return res.status(404).json({ error: 'No encontrado' });
    return res.json({
      ...r,
      dias_abierto: parseJsonField(r.dias_abierto, {}),
    });
  } catch (e) {
    req.log.error({ err: e }, 'Error GET /api/tiendas/:id');
    res.status(500).json({ error: 'Error interno' });
  }
});

// CRUD protegido de tiendas: creación.
app.post('/api/tiendas', requireAuth, async (req, res) => {
  try {
    const id = crypto.randomUUID();
    const body = req.body || {};
    await pool.query(
      `INSERT INTO tiendas (id, usuario_id, nombre, descripcion, eslogan, horario_apertura, horario_cierre, dias_abierto)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        req.user.sub,
        body.nombre || 'Mi Nueva Tienda',
        body.descripcion || 'Bienvenido a nuestro catálogo digital.',
        body.eslogan || 'Lo mejor para ti',
        body.horario_apertura || '09:00',
        body.horario_cierre || '22:00',
        JSON.stringify(
          body.dias_abierto || {
            lunes: true,
            martes: true,
            miercoles: true,
            jueves: true,
            viernes: true,
            sabado: true,
            domingo: true,
          }
        ),
      ]
    );
    const [rows] = await pool.query('SELECT * FROM tiendas WHERE id = ?', [id]);
    const r = rows[0];
    return res.status(201).json({
      ...r,
      dias_abierto: parseJsonField(r.dias_abierto, {}),
    });
  } catch (e) {
    req.log.error({ err: e }, 'Error POST /api/tiendas');
    res.status(500).json({ error: 'Error al crear tienda' });
  }
});

// CRUD protegido de tiendas: actualización parcial.
app.patch('/api/tiendas/:id', requireAuth, async (req, res) => {
  try {
    const [own] = await pool.query('SELECT usuario_id FROM tiendas WHERE id = ?', [
      req.params.id,
    ]);
    if (!own.length || own[0].usuario_id !== req.user.sub) {
      return res.status(403).json({ error: 'No autorizado' });
    }
    const allowed = [
      'nombre',
      'descripcion',
      'eslogan',
      'telefono',
      'email',
      'direccion',
      'ciudad',
      'pais',
      'codigo_postal',
      'facebook',
      'instagram',
      'twitter',
      'whatsapp',
      'horario_apertura',
      'horario_cierre',
      'imagen_logo_url',
      'imagen_banner_url',
      'moneda',
      'idioma',
    ];
    const body = req.body || {};
    const updates = [];
    const vals = [];
    for (const k of allowed) {
      if (body[k] !== undefined) {
        updates.push(`${k} = ?`);
        vals.push(body[k]);
      }
    }
    if (body.dias_abierto !== undefined) {
      updates.push('dias_abierto = ?');
      vals.push(typeof body.dias_abierto === 'string' ? body.dias_abierto : JSON.stringify(body.dias_abierto));
    }
    if (!updates.length) {
      const [rows] = await pool.query('SELECT * FROM tiendas WHERE id = ?', [req.params.id]);
      const r = rows[0];
      return res.json({ ...r, dias_abierto: parseJsonField(r.dias_abierto, {}) });
    }
    vals.push(req.params.id);
    await pool.query(`UPDATE tiendas SET ${updates.join(', ')} WHERE id = ?`, vals);
    const [rows] = await pool.query('SELECT * FROM tiendas WHERE id = ?', [req.params.id]);
    const r = rows[0];
    return res.json({ ...r, dias_abierto: parseJsonField(r.dias_abierto, {}) });
  } catch (e) {
    req.log.error({ err: e }, 'Error PATCH /api/tiendas/:id');
    res.status(500).json({ error: 'Error al actualizar tienda' });
  }
});

// CRUD de temas asociados a tienda.
app.get('/api/temas', async (req, res) => {
  const tiendaId = req.query.tienda_id;
  if (!tiendaId) return res.status(400).json({ error: 'tienda_id requerido' });
  try {
    const [rows] = await pool.query('SELECT * FROM temas WHERE tienda_id = ? LIMIT 1', [tiendaId]);
    const r = rows[0];
    if (!r) return res.json(null);
    return res.json(r);
  } catch (e) {
    req.log.error({ err: e }, 'Error GET /api/temas');
    res.status(500).json({ error: 'Error interno' });
  }
});

app.post('/api/temas', requireAuth, async (req, res) => {
  try {
    const body = req.body || {};
    if (!body.tienda_id) return res.status(400).json({ error: 'tienda_id requerido' });
    const [own] = await pool.query('SELECT usuario_id FROM tiendas WHERE id = ?', [body.tienda_id]);
    if (!own.length || own[0].usuario_id !== req.user.sub) {
      return res.status(403).json({ error: 'No autorizado' });
    }
    const id = crypto.randomUUID();
    await pool.query(
      `INSERT INTO temas (id, tienda_id, color_primario, color_secundario, color_fondo, color_texto, color_texto_titulos, fuente_titulos, fuente_cuerpo, estilo_plantilla)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        body.tienda_id,
        body.color_primario || '#FFE600',
        body.color_secundario || '#3483FA',
        body.color_fondo || '#EBEBEB',
        body.color_texto || '#333333',
        body.color_texto_titulos || '#333333',
        body.fuente_titulos || 'Playfair Display',
        body.fuente_cuerpo || 'Inter',
        body.estilo_plantilla || 'moderno',
      ]
    );
    const [rows] = await pool.query('SELECT * FROM temas WHERE id = ?', [id]);
    return res.status(201).json(rows[0]);
  } catch (e) {
    req.log.error({ err: e }, 'Error POST /api/temas');
    res.status(500).json({ error: 'Error al crear tema' });
  }
});

app.patch('/api/temas/:id', requireAuth, async (req, res) => {
  try {
    const [tem] = await pool.query('SELECT tienda_id FROM temas WHERE id = ?', [req.params.id]);
    if (!tem.length) return res.status(404).json({ error: 'No encontrado' });
    const [own] = await pool.query('SELECT usuario_id FROM tiendas WHERE id = ?', [tem[0].tienda_id]);
    if (!own.length || own[0].usuario_id !== req.user.sub) {
      return res.status(403).json({ error: 'No autorizado' });
    }
    const allowed = [
      'color_primario',
      'color_secundario',
      'color_fondo',
      'color_texto',
      'color_texto_titulos',
      'fuente_titulos',
      'fuente_cuerpo',
      'estilo_plantilla',
    ];
    const body = req.body || {};
    const updates = [];
    const vals = [];
    for (const k of allowed) {
      if (body[k] !== undefined) {
        updates.push(`${k} = ?`);
        vals.push(body[k]);
      }
    }
    if (!updates.length) {
      const [rows] = await pool.query('SELECT * FROM temas WHERE id = ?', [req.params.id]);
      return res.json(rows[0]);
    }
    vals.push(req.params.id);
    await pool.query(`UPDATE temas SET ${updates.join(', ')} WHERE id = ?`, vals);
    const [rows] = await pool.query('SELECT * FROM temas WHERE id = ?', [req.params.id]);
    return res.json(rows[0]);
  } catch (e) {
    req.log.error({ err: e }, 'Error PATCH /api/temas/:id');
    res.status(500).json({ error: 'Error al actualizar tema' });
  }
});

// ---------------------------------------------------------------
// Healthchecks unificados
// ---------------------------------------------------------------
// /api/health           -> visión general (DB + breakers + proceso)
// /api/health/ready     -> readiness (200 si está listo para tráfico)
// /api/health/breakers  -> estado y stats de cada circuit breaker
//
// La forma uniforme la genera lib/resilience#buildHealthPayload para
// que todos los microservicios respondan con el mismo contrato.
app.get('/api/health', async (req, res) => {
  try {
    const db = await pingDb(pool);
    const breakersState = breakers.map(getBreakerState);
    const payload = buildHealthPayload({
      service: SERVICE_NAME,
      db,
      breakers: breakersState,
      extras: {
        database_host: process.env.DB_HOST,
        catalogo_url: CATALOGO_URL,
      },
    });
    res.status(payload.status === 'down' ? 503 : 200).json(payload);
  } catch (err) {
    (req.log || logger).error({ err }, '[tiendas] GET /api/health');
    res.status(500).json({ error: 'health_check_failed', service: SERVICE_NAME });
  }
});

app.get('/api/health/ready', async (_req, res) => {
  try {
    const db = await pingDb(pool);
    // Readiness: el servicio está listo si su BD responde. Los breakers
    // abiertos no impiden recibir tráfico (es justamente su trabajo
    // proteger al backend mientras se recupera).
    const ready = db.ok;
    res.status(ready ? 200 : 503).json({ service: SERVICE_NAME, ready, db });
  } catch (err) {
    logger.error({ err }, '[tiendas] GET /api/health/ready');
    res.status(500).json({ error: 'health_ready_failed', service: SERVICE_NAME });
  }
});

app.get('/api/health/breakers', (_req, res) => {
  try {
    res.json({ service: SERVICE_NAME, breakers: breakers.map(getBreakerState) });
  } catch (err) {
    logger.error({ err }, '[tiendas] GET /api/health/breakers');
    res.status(500).json({ error: 'health_breakers_failed', service: SERVICE_NAME });
  }
});

// Secuencia de arranque controlada.
async function bootstrap() {
  try {
    pool = mysql.createPool(dbConfig);
    await waitForDb(pool);
    app.listen(port, () => {
      logger.info(`[tiendas] API en puerto ${port}`);
    });
  } catch (e) {
    logger.error({ err: e }, '[tiendas] Arranque fallido');
    process.exit(1);
  }
}

bootstrap();
