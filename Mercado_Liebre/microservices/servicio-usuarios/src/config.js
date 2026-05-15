/**
 * Configuración del servicio Usuarios (lectura única de `process.env`).
 */

module.exports = {
  PORT: Number(process.env.PORT || 3001),
  SERVICE_NAME: 'usuarios-service',
  /** Identificador de réplica (balanceo en gateway). */
  INSTANCE_ID: process.env.INSTANCE_ID || process.env.HOSTNAME || 'usuarios-1',
  JWT_SECRET: process.env.JWT_SECRET || 'dev-only-cambiar',

  DB: {
    user: process.env.MYSQL_USER || 'admin',
    host: process.env.DB_HOST || 'db-usuarios',
    database: process.env.MYSQL_DATABASE || 'usuarios_db',
    password: process.env.MYSQL_PASSWORD || 'adminpassword',
    port: 3306,
  },

  /**
   * Parámetros del circuit breaker sobre MySQL.
   * Timeout más alto que en breakers HTTP (las consultas locales suelen ser más rápidas
   * pero un MySQL bajo presión puede tardar más en responder bajo carga inicial).
   */
  CIRCUIT_BREAKER: {
    timeout: Number(process.env.CB_TIMEOUT_MS || 8000),
    errorThresholdPercentage: Number(process.env.CB_ERROR_THRESHOLD || 50),
    resetTimeout: Number(process.env.CB_RESET_TIMEOUT_MS || 15000),
    volumeThreshold: Number(process.env.CB_VOLUME_THRESHOLD || 5),
  },

  LOG_LEVEL: process.env.LOG_LEVEL || 'info',

  /** Token para POST /api/health/breakers/control (panel ops / laboratorio). */
  OPS_LAB_TOKEN: process.env.OPS_LAB_TOKEN || process.env.OPS_PANEL_TOKEN || '',
};
