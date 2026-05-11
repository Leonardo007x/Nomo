const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const pino = require('pino');
const pinoHttp = require('pino-http');
const CircuitBreaker = require('opossum');

/**
 * Microservicio IA — encapsula llamadas a Groq para evitar exponer API keys en frontend.
 * BD propia para trazabilidad básica de prompts y respuestas.
 */
// Inicialización del servicio y parámetros globales.
const app = express();
const port = process.env.PORT || 3006;
const JWT_SECRET = process.env.JWT_SECRET || 'dev-only-cambiar';
const GROQ_API_KEY = (process.env.GROQ_API_KEY || '').trim();
const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
const SERVICE_NAME = 'ia-service';
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

// Configuración de la base de datos propia del dominio IA.
const dbConfig = {
  user: process.env.MYSQL_USER || 'admin',
  host: process.env.DB_HOST || 'db-ia',
  database: process.env.MYSQL_DATABASE || 'ia_db',
  password: process.env.MYSQL_PASSWORD || 'adminpassword',
  port: 3306,
};

let pool;

// Circuit breaker para proveedor externo (Groq): evita reintentos infinitos/cascada.
const groqBreaker = new CircuitBreaker(
  async ({ body }) => {
    const controller = new AbortController();
    const timeoutMs = Number(process.env.HTTP_TIMEOUT_MS || 6000);
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
      const data = await response.json().catch(() => ({}));
      return { ok: response.ok, status: response.status, data };
    } finally {
      clearTimeout(timeout);
    }
  },
  {
    timeout: Number(process.env.CB_TIMEOUT_MS || 8000),
    errorThresholdPercentage: Number(process.env.CB_ERROR_THRESHOLD || 50),
    resetTimeout: Number(process.env.CB_RESET_TIMEOUT_MS || 20000),
    volumeThreshold: Number(process.env.CB_VOLUME_THRESHOLD || 5),
    name: 'ia-groq',
  }
);

// Espera activa para soportar arranques por etapas en Docker Compose.
async function waitForDb(p, maxAttempts = 40, delayMs = 2000) {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      await p.query('SELECT 1');
      logger.info('[ia] MySQL listo');
      return;
    } catch (e) {
      logger.warn({ err: e }, `[ia] MySQL intento ${i + 1}/${maxAttempts}`);
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }
  throw new Error('[ia] No se pudo conectar a MySQL');
}

// Middleware de autorización JWT para proteger consumo de IA.
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

// Endpoint principal de generación IA (proxy controlado hacia proveedor externo).
app.post('/api/ia/generar', requireAuth, async (req, res) => {
  const {
    mensajeUsuario,
    mensajeSistema = 'Eres un experto en marketing gastronómico de lujo y copywriting persuasivo.',
  } = req.body || {};

  if (!mensajeUsuario || typeof mensajeUsuario !== 'string') {
    return res.status(400).json({ error: 'mensajeUsuario es requerido' });
  }
  if (!GROQ_API_KEY) {
    return res.status(503).json({ error: 'Servicio IA no configurado (GROQ_API_KEY faltante)' });
  }

  // ID de auditoría para correlacionar request y respuesta/error en la BD de IA.
  const rowId = crypto.randomUUID();
  try {
    // Llamada server-to-server a Groq (la API key nunca viaja al cliente).
    // Ejecuta la llamada a Groq bajo política del circuito (timeout + apertura por fallos).
    const groqResult = await groqBreaker.fire({
      body: {
        messages: [
          { role: 'system', content: mensajeSistema },
          { role: 'user', content: mensajeUsuario },
        ],
        model: GROQ_MODEL,
        temperature: 0.7,
        max_tokens: 1024,
        top_p: 1,
        stream: false,
      },
    });
    if (!groqResult.ok) {
      // Persistimos errores del proveedor para trazabilidad operativa.
      const errorMsg = groqResult.data?.error?.message || `Error Groq: ${groqResult.status}`;
      await pool.query(
        'INSERT INTO ia_generaciones (id, usuario_id, provider, modelo, prompt_usuario, prompt_sistema, respuesta, error_msg) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [rowId, req.user.sub, 'groq', GROQ_MODEL, mensajeUsuario, mensajeSistema, null, errorMsg]
      );
      return res.status(502).json({ error: errorMsg });
    }

    // Contenido final entregado al frontend.
    const contenido = groqResult.data?.choices?.[0]?.message?.content || '';
    await pool.query(
      'INSERT INTO ia_generaciones (id, usuario_id, provider, modelo, prompt_usuario, prompt_sistema, respuesta, error_msg) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [rowId, req.user.sub, 'groq', GROQ_MODEL, mensajeUsuario, mensajeSistema, contenido, null]
    );
    return res.json({ contenido });
  } catch (e) {
    // Error técnico inesperado (red, timeout, parse, DB, etc.).
    const msg = e?.message || 'Error generando contenido';
    try {
      await pool.query(
        'INSERT INTO ia_generaciones (id, usuario_id, provider, modelo, prompt_usuario, prompt_sistema, respuesta, error_msg) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [rowId, req.user.sub, 'groq', GROQ_MODEL, mensajeUsuario, mensajeSistema, null, msg]
      );
    } catch {
      // noop
    }
    req.log.error({ err: e }, '[ia] /api/ia/generar');
    return res.status(500).json({ error: msg });
  }
});

app.get('/api/health', async (_req, res) => {
  let total = null;
  try {
    const [rows] = await pool.query('SELECT COUNT(*) AS total FROM ia_generaciones');
    total = rows[0].total;
  } catch {
    total = null;
  }
  res.json({
    service: 'ia-service',
    status: 'ok',
    database_host: process.env.DB_HOST,
    groq_configured: !!GROQ_API_KEY,
    total_generaciones: total,
  });
});

// Secuencia de arranque controlada.
async function bootstrap() {
  try {
    pool = mysql.createPool(dbConfig);
    await waitForDb(pool);
    app.listen(port, () => {
      logger.info(`[ia] API en puerto ${port}`);
    });
  } catch (e) {
    logger.error({ err: e }, '[ia] Arranque fallido');
    process.exit(1);
  }
}

bootstrap();
