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
    const [exists] = await pool.query('SELECT id FROM usuarios WHERE email = ?', [email]);
    if (exists.length) {
      return res.status(409).json({ error: 'Este correo ya está registrado' });
    }
    const id = crypto.randomUUID();
    const password_hash = await bcrypt.hash(password, 10);
    await pool.query(
      'INSERT INTO usuarios (id, email, nombre, apellido, password_hash) VALUES (?, ?, ?, ?, ?)',
      [id, email, nombre, apellido, password_hash]
    );
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
    const [rows] = await pool.query(
      'SELECT id, email, nombre, apellido, password_hash FROM usuarios WHERE email = ?',
      [email]
    );
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
    const [rows] = await pool.query(
      'SELECT id, email, nombre, apellido FROM usuarios WHERE id = ?',
      [req.user.sub]
    );
    const u = rows[0];
    if (!u) return res.status(404).json({ error: 'Usuario no encontrado' });
    return res.json({ id: u.id, email: u.email, nombre: u.nombre, apellido: u.apellido });
  } catch (e) {
    req.log.error({ err: e }, '[usuarios] GET /api/auth/me');
    return res.status(500).json({ error: 'Error interno' });
  }
});

// Healthcheck de servicio para gateway/observabilidad.
app.get('/api/health', (req, res) => {
  res.json({
    service: 'usuarios-service',
    status: 'ok',
    database_host: process.env.DB_HOST,
  });
});

// Secuencia de arranque controlada: DB -> migración -> HTTP server.
async function bootstrap() {
  try {
    pool = mysql.createPool(dbConfig);
    await waitForDb(pool);
    await ensureUsuariosPasswordHash(pool);
    app.listen(port, () => {
      logger.info(`[usuarios] API en puerto ${port}`);
    });
  } catch (e) {
    logger.error({ err: e }, '[usuarios] Arranque fallido');
    process.exit(1);
  }
}

bootstrap();
