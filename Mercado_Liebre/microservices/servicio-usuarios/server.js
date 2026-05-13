/**
 * Microservicio Usuarios — única fuente de verdad para credenciales e identidad.
 * BD propia: solo tabla usuarios.
 */
const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const pino = require('pino');
const pinoHttp = require('pino-http');
const CircuitBreaker = require('opossum');
// Helpers compartidos: logs del Circuit Breaker (half-open), health y clasificación de errores.
const {
  attachBreakerLogs,
  getBreakerState,
  classifyBreakerError,
  pingDb,
  buildHealthPayload,
} = require('./lib/resilience');

// Inicialización del servicio y parámetros globales.
const app = express();
const port = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'dev-only-cambiar';
const SERVICE_NAME = 'usuarios-service';
const logger = pino({ level: process.env.LOG_LEVEL || 'info', base: { service: SERVICE_NAME } });

// Middleware base del servicio (CORS + parseo JSON).
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

// Configuración de conexión a la base de datos propia del dominio usuarios.
const dbConfig = {
  user: process.env.MYSQL_USER || 'admin',
  host: process.env.DB_HOST || 'db-usuarios',
  database: process.env.MYSQL_DATABASE || 'usuarios_db',
  password: process.env.MYSQL_PASSWORD || 'adminpassword',
  port: 3306,
};

let pool;
/** Circuit breaker sobre MySQL (dependencia del servicio). Se crea en bootstrap tras tener pool. */
let mysqlAuthBreaker;

/**
 * Ejecuta SQL detrás del circuit breaker. Unifica logs y códigos cuando el circuito está abierto.
 * @returns {{ ok: true, rows: any[] } | { ok: false, reason: string, err?: unknown }}
 */
async function queryThroughBreaker(req, sql, params) {
  try {
    const [rows] = await mysqlAuthBreaker.fire({ sql, params });
    return { ok: true, rows };
  } catch (e) {
    const reason = classifyBreakerError(e);
    (req?.log || logger).warn(
      { reason, breaker: 'usuarios-mysql', err: e?.message },
      '[usuarios] consulta MySQL bloqueada o fallida'
    );
    return { ok: false, reason, err: e };
  }
}

// Reintenta conexión a MySQL para soportar arranques por etapas en Docker.
async function waitForDb(p, maxAttempts = 40, delayMs = 2000) {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      await p.query('SELECT 1');
      logger.info('[usuarios] MySQL listo');
      return;
    } catch (e) {
      logger.warn({ err: e }, `[usuarios] MySQL intento ${i + 1}/${maxAttempts}`);
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }
  throw new Error('[usuarios] No se pudo conectar a MySQL');
}

// Migración defensiva para instalaciones previas sin password_hash.
async function ensureUsuariosPasswordHash(p) {
  const dbName = dbConfig.database;
  try {
    const [rows] = await p.query(
      `SELECT COUNT(*) AS c FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'usuarios' AND COLUMN_NAME = 'password_hash'`,
      [dbName]
    );
    if (rows[0].c > 0) return;
    await p.query(
      'ALTER TABLE usuarios ADD COLUMN password_hash VARCHAR(255) NULL AFTER apellido'
    );
  } catch (e) {
    logger.error({ err: e }, '[usuarios] ensureUsuariosPasswordHash');
    throw e;
  }
}

// Middleware de autenticación JWT para rutas protegidas.
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

// Firma de token de sesión estándar del sistema.
function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

// Registro de usuario con validaciones mínimas y hash de contraseña.
const handleRegister = async (req, res) => {
  const { email, password, nombre, apellido } = req.body || {};
  if (!email || !password || !nombre || !apellido) {
    return res.status(400).json({ error: 'Faltan campos obligatorios' });
  }
  try {
    const q1 = await queryThroughBreaker(req, 'SELECT id FROM usuarios WHERE email = ?', [email]);
    if (!q1.ok) {
      if (q1.reason === 'circuit_open') {
        return res.status(503).json({
          error: 'Servicio temporalmente protegido (circuit breaker sobre base de datos)',
          reason: q1.reason,
        });
      }
      return res.status(500).json({ error: 'Error al registrar', detail: q1.err?.message });
    }
    const exists = q1.rows;
    if (exists.length) {
      return res.status(409).json({ error: 'Este correo ya está registrado' });
    }
    const id = crypto.randomUUID();
    const password_hash = await bcrypt.hash(password, 10);
    const q2 = await queryThroughBreaker(
      req,
      'INSERT INTO usuarios (id, email, nombre, apellido, password_hash) VALUES (?, ?, ?, ?, ?)',
      [id, email, nombre, apellido, password_hash]
    );
    if (!q2.ok) {
      if (q2.reason === 'circuit_open') {
        return res.status(503).json({
          error: 'Servicio temporalmente protegido (circuit breaker sobre base de datos)',
          reason: q2.reason,
        });
      }
      return res.status(500).json({ error: 'Error al registrar', detail: q2.err?.message });
    }
    const token = signToken({ sub: id, email });
    return res.status(201).json({
      token,
      user: { id, email, nombre, apellido },
      userId: id,
    });
  } catch (e) {
    req.log.error({ err: e }, '[usuarios] POST register');
    const msg =
      process.env.NODE_ENV === 'production' ? 'Error al registrar' : e.message || 'Error al registrar';
    return res.status(500).json({ error: 'Error al registrar', detail: msg });
  }
};

// Login de usuario y emisión de token JWT.
const handleLogin = async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: 'Email y contraseña requeridos' });
  }
  try {
    const q1 = await queryThroughBreaker(
      req,
      'SELECT id, email, nombre, apellido, password_hash FROM usuarios WHERE email = ?',
      [email]
    );
    if (!q1.ok) {
      if (q1.reason === 'circuit_open') {
        return res.status(503).json({
          error: 'Servicio temporalmente protegido (circuit breaker sobre base de datos)',
          reason: q1.reason,
        });
      }
      return res.status(500).json({ error: 'Error al iniciar sesión', detail: q1.err?.message });
    }
    const rows = q1.rows;
    const u = rows[0];
    if (!u || !u.password_hash) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }
    const ok = await bcrypt.compare(password, u.password_hash);
    if (!ok) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }
    const token = signToken({ sub: u.id, email: u.email });
    return res.json({
      token,
      user: { id: u.id, email: u.email, nombre: u.nombre, apellido: u.apellido },
      userId: u.id,
    });
  } catch (e) {
    req.log.error({ err: e }, '[usuarios] POST login');
    const msg =
      process.env.NODE_ENV === 'production'
        ? 'Error al iniciar sesión'
        : e.message || 'Error al iniciar sesión';
    return res.status(500).json({ error: 'Error al iniciar sesión', detail: msg });
  }
};

// Rutas públicas de autenticación.
app.post('/api/auth/register', handleRegister);
app.post('/api/registro', handleRegister);
app.post('/api/auth/login', handleLogin);
app.post('/api/login', handleLogin);

// Ruta protegida: perfil actual del usuario autenticado.
app.get('/api/auth/me', requireAuth, async (req, res) => {
  try {
    const q1 = await queryThroughBreaker(
      req,
      'SELECT id, email, nombre, apellido FROM usuarios WHERE id = ?',
      [req.user.sub]
    );
    if (!q1.ok) {
      if (q1.reason === 'circuit_open') {
        return res.status(503).json({
          error: 'Servicio temporalmente protegido (circuit breaker sobre base de datos)',
          reason: q1.reason,
        });
      }
      return res.status(500).json({ error: 'Error interno' });
    }
    const rows = q1.rows;
    const u = rows[0];
    if (!u) return res.status(404).json({ error: 'Usuario no encontrado' });
    return res.json({ id: u.id, email: u.email, nombre: u.nombre, apellido: u.apellido });
  } catch (e) {
    req.log.error({ err: e }, '[usuarios] GET /api/auth/me');
    return res.status(500).json({ error: 'Error interno' });
  }
});

// Healthchecks unificados (incluye estado del circuit breaker sobre MySQL).
app.get('/api/health', async (_req, res) => {
  try {
    const db = await pingDb(pool);
    const breakersState = mysqlAuthBreaker ? [mysqlAuthBreaker].map(getBreakerState) : [];
    const payload = buildHealthPayload({
      service: SERVICE_NAME,
      db,
      breakers: breakersState,
      extras: { database_host: process.env.DB_HOST },
    });
    res.status(payload.status === 'down' ? 503 : 200).json(payload);
  } catch (err) {
    logger.error({ err }, '[usuarios] GET /api/health');
    res.status(500).json({ error: 'health_check_failed', service: SERVICE_NAME });
  }
});

app.get('/api/health/ready', async (_req, res) => {
  try {
    const db = await pingDb(pool);
    res.status(db.ok ? 200 : 503).json({ service: SERVICE_NAME, ready: db.ok, db });
  } catch (err) {
    logger.error({ err }, '[usuarios] GET /api/health/ready');
    res.status(500).json({ error: 'health_ready_failed', service: SERVICE_NAME });
  }
});

app.get('/api/health/breakers', (_req, res) => {
  try {
    const list = mysqlAuthBreaker ? [mysqlAuthBreaker] : [];
    res.json({ service: SERVICE_NAME, breakers: list.map(getBreakerState) });
  } catch (err) {
    logger.error({ err }, '[usuarios] GET /api/health/breakers');
    res.status(500).json({ error: 'health_breakers_failed', service: SERVICE_NAME });
  }
});

// Secuencia de arranque controlada: DB -> migración -> breaker MySQL -> HTTP server.
async function bootstrap() {
  try {
    pool = mysql.createPool(dbConfig);
    await waitForDb(pool);
    await ensureUsuariosPasswordHash(pool);
    // Todas las consultas de rutas HTTP pasan por este breaker (logs open/half_open/close).
    mysqlAuthBreaker = attachBreakerLogs(
      new CircuitBreaker(
        async ({ sql, params }) => pool.query(sql, params),
        {
          timeout: Number(process.env.CB_TIMEOUT_MS || 8000),
          errorThresholdPercentage: Number(process.env.CB_ERROR_THRESHOLD || 50),
          resetTimeout: Number(process.env.CB_RESET_TIMEOUT_MS || 15000),
          volumeThreshold: Number(process.env.CB_VOLUME_THRESHOLD || 5),
          name: 'usuarios-mysql',
        }
      ),
      logger
    );
    app.listen(port, () => {
      logger.info(`[usuarios] API en puerto ${port}`);
    });
  } catch (e) {
    logger.error({ err: e }, '[usuarios] Arranque fallido');
    process.exit(1);
  }
}

bootstrap();
