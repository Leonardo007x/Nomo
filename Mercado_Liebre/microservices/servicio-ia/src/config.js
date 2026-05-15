/** Configuración del servicio IA. */
module.exports = {
  PORT: Number(process.env.PORT || 3006),
  SERVICE_NAME: 'ia-service',
  JWT_SECRET: process.env.JWT_SECRET || 'dev-only-cambiar',

  /** Credenciales y modelo del proveedor LLM (Groq). */
  GROQ_API_KEY: (process.env.GROQ_API_KEY || '').trim(),
  GROQ_MODEL: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
  GROQ_ENDPOINT: 'https://api.groq.com/openai/v1/chat/completions',

  DB: {
    user: process.env.MYSQL_USER || 'admin',
    host: process.env.DB_HOST || 'db-ia',
    database: process.env.MYSQL_DATABASE || 'ia_db',
    password: process.env.MYSQL_PASSWORD || 'adminpassword',
    port: 3306,
  },

  /** Parámetros del breaker para el proveedor externo (Groq). */
  CIRCUIT_BREAKER: {
    timeout: Number(process.env.CB_TIMEOUT_MS || 8000),
    errorThresholdPercentage: Number(process.env.CB_ERROR_THRESHOLD || 50),
    resetTimeout: Number(process.env.CB_RESET_TIMEOUT_MS || 20000),
    volumeThreshold: Number(process.env.CB_VOLUME_THRESHOLD || 5),
  },

  HTTP_TIMEOUT_MS: Number(process.env.HTTP_TIMEOUT_MS || 6000),
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
  OPS_LAB_TOKEN: process.env.OPS_LAB_TOKEN || process.env.OPS_PANEL_TOKEN || '',
};
