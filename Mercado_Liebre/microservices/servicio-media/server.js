const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const crypto = require('crypto');
const pino = require('pino');
const pinoHttp = require('pino-http');
const CircuitBreaker = require('opossum');
// Helpers compartidos: logs de Circuit Breaker (half-open), health y clasificación de errores.
const {
  attachBreakerLogs,
  getBreakerState,
  classifyBreakerError,
  pingDb,
  buildHealthPayload,
} = require('./lib/resilience');

/**
 * Microservicio Media — responsable de subida de archivos e integración Cloudinary.
 * BD propia para auditoría básica de assets subidos.
 */
// Inicialización del servicio y parámetros globales.
const app = express();
const port = process.env.PORT || 3004;
const JWT_SECRET = process.env.JWT_SECRET || 'dev-only-cambiar';
const SERVICE_NAME = 'media-service';
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

// Configuración de conexión a la BD propia de media.
const dbConfig = {
  user: process.env.MYSQL_USER || 'admin',
  host: process.env.DB_HOST || 'db-media',
  database: process.env.MYSQL_DATABASE || 'media_db',
  password: process.env.MYSQL_PASSWORD || 'adminpassword',
  port: 3306,
};

let pool;
let cloudinaryUploadsEnabled = false;

// Circuit breaker sobre la API externa Cloudinary (half-open vía resetTimeout de Opossum).
// Protege el endpoint de subida cuando el SaaS falla o tarda demasiado.
const cloudinaryUploadBreaker = attachBreakerLogs(
  new CircuitBreaker(
    async ({ b64, uploadOpts }) => cloudinary.uploader.upload(b64, uploadOpts),
    {
      timeout: Number(process.env.CB_TIMEOUT_MS || 60000),
      errorThresholdPercentage: Number(process.env.CB_ERROR_THRESHOLD || 50),
      resetTimeout: Number(process.env.CB_RESET_TIMEOUT_MS || 15000),
      volumeThreshold: Number(process.env.CB_VOLUME_THRESHOLD || 3),
      name: 'media-cloudinary-upload',
    }
  ),
  logger
);

const breakers = [cloudinaryUploadBreaker];

// Validación de archivos entrantes (tipo + tamaño) en memoria.
const uploadMem = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 6 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype || !file.mimetype.startsWith('image/')) {
      return cb(new Error('Solo se permiten archivos de imagen'));
    }
    cb(null, true);
  },
});

// Middleware JWT para asegurar que solo usuarios autenticados suban archivos.
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

// Lectura y validación de credenciales Cloudinary.
function readCloudinaryEnv() {
  const cloud_name = (process.env.CLOUDINARY_CLOUD_NAME || '').trim();
  const api_key = (process.env.CLOUDINARY_API_KEY || '').trim();
  const api_secret = (process.env.CLOUDINARY_API_SECRET || '').trim();
  return { cloud_name, api_key, api_secret, ok: !!(cloud_name && api_key && api_secret) };
}

// Inicialización de SDK externo de media.
function tryInitCloudinary() {
  const { cloud_name, api_key, api_secret, ok } = readCloudinaryEnv();
  if (!ok) return false;
  cloudinary.config({ cloud_name, api_key, api_secret });
  return true;
}

// Optimización automática de transformación en URL de entrega.
function optimizeCloudinaryUrl(secureUrl) {
  const insertIndex = secureUrl.indexOf('/upload/') + 8;
  if (insertIndex < 8) return secureUrl;
  return secureUrl.slice(0, insertIndex) + 'q_auto,f_auto/' + secureUrl.slice(insertIndex);
}

// Espera activa de MySQL para arranque confiable en Docker.
async function waitForDb(p, maxAttempts = 40, delayMs = 2000) {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      await p.query('SELECT 1');
      logger.info('[media] MySQL listo');
      return;
    } catch (e) {
      logger.warn({ err: e }, `[media] MySQL intento ${i + 1}/${maxAttempts}`);
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }
  throw new Error('[media] No se pudo conectar a MySQL');
}

// Endpoint principal de subida de media.
app.post(
  '/api/media/upload',
  requireAuth,
  (req, res, next) => {
    uploadMem.single('file')(req, res, (err) => {
      if (err) return res.status(400).json({ error: err.message || 'Archivo no válido' });
      next();
    });
  },
  async (req, res) => {
    if (!cloudinaryUploadsEnabled) {
      return res.status(503).json({
        error:
          'Subida de imágenes no configurada. Define CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY y CLOUDINARY_API_SECRET.',
      });
    }
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({ error: 'Falta el archivo (campo file)' });
    }
    try {
      const b64 = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
      let uploadResult;
      try {
        uploadResult = await cloudinaryUploadBreaker.fire({
          b64,
          uploadOpts: {
            folder: 'mercadoliebre',
            resource_type: 'image',
          },
        });
      } catch (fireErr) {
        const reason = classifyBreakerError(fireErr);
        req.log.warn(
          { reason, breaker: 'media-cloudinary-upload', err: fireErr?.message },
          '[media] upload: Cloudinary bloqueado o fallido por circuit breaker'
        );
        const status = reason === 'circuit_open' ? 503 : 502;
        return res.status(status).json({
          error:
            reason === 'circuit_open'
              ? 'Subida temporalmente protegida por circuit breaker'
              : 'Error al contactar Cloudinary',
          reason,
        });
      }
      const url = optimizeCloudinaryUrl(uploadResult.secure_url);
      await pool.query(
        'INSERT INTO media_assets (id, usuario_id, url, provider, mime_type, bytes_size) VALUES (?, ?, ?, ?, ?, ?)',
        [
          crypto.randomUUID(),
          req.user.sub,
          url,
          'cloudinary',
          req.file.mimetype || null,
          Number(req.file.size || 0),
        ]
      );
      return res.json({ url });
    } catch (e) {
      req.log.error({ err: e }, 'POST /api/media/upload');
      return res.status(500).json({ error: e.message || 'Error al subir a Cloudinary' });
    }
  }
);

// ---------------------------------------------------------------
// Healthchecks unificados (mismo contrato que el resto de servicios)
// ---------------------------------------------------------------
app.get('/api/health', async (_req, res) => {
  try {
    const db = await pingDb(pool);
    let uploads = null;
    if (db.ok) {
      try {
        const [rows] = await pool.query('SELECT COUNT(*) AS total FROM media_assets');
        uploads = rows[0].total;
      } catch {
        uploads = null;
      }
    }
    const breakersState = breakers.map(getBreakerState);
    const payload = buildHealthPayload({
      service: SERVICE_NAME,
      db,
      breakers: breakersState,
      extras: {
        database_host: process.env.DB_HOST,
        cloudinary_enabled: cloudinaryUploadsEnabled,
        uploads_count: uploads,
      },
    });
    res.status(payload.status === 'down' ? 503 : 200).json(payload);
  } catch (err) {
    logger.error({ err }, '[media] GET /api/health');
    res.status(500).json({ error: 'health_check_failed', service: SERVICE_NAME });
  }
});

app.get('/api/health/ready', async (_req, res) => {
  try {
    const db = await pingDb(pool);
    const ready = db.ok;
    res.status(ready ? 200 : 503).json({
      service: SERVICE_NAME,
      ready,
      db,
      cloudinary_enabled: cloudinaryUploadsEnabled,
    });
  } catch (err) {
    logger.error({ err }, '[media] GET /api/health/ready');
    res.status(500).json({ error: 'health_ready_failed', service: SERVICE_NAME });
  }
});

app.get('/api/health/breakers', (_req, res) => {
  try {
    res.json({ service: SERVICE_NAME, breakers: breakers.map(getBreakerState) });
  } catch (err) {
    logger.error({ err }, '[media] GET /api/health/breakers');
    res.status(500).json({ error: 'health_breakers_failed', service: SERVICE_NAME });
  }
});

// Secuencia de arranque: DB -> Cloudinary -> servidor HTTP.
async function bootstrap() {
  try {
    pool = mysql.createPool(dbConfig);
    await waitForDb(pool);
    cloudinaryUploadsEnabled = tryInitCloudinary();
    if (cloudinaryUploadsEnabled) {
      logger.info('[media] Cloudinary listo');
    } else {
      logger.warn('[media] Cloudinary no configurado');
    }
    app.listen(port, () => {
      logger.info(`[media] API en puerto ${port}`);
    });
  } catch (e) {
    logger.error({ err: e }, '[media] Arranque fallido');
    process.exit(1);
  }
}

bootstrap();
