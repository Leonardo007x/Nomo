/** Configuración del servicio Tiendas (lectura única de `process.env`). */

module.exports = {
  PORT: Number(process.env.PORT || 3002),
  SERVICE_NAME: 'tiendas-service',
  JWT_SECRET: process.env.JWT_SECRET || 'dev-only-cambiar',
  INTERNAL_SERVICE_TOKEN: process.env.INTERNAL_SERVICE_TOKEN || '',

  /** URL interna del microservicio catálogo para composición de vista pública. */
  CATALOGO_SERVICE_URL: (process.env.CATALOGO_SERVICE_URL || 'http://catalogo-service:3003').replace(/\/$/, ''),

  DB: {
    user: process.env.MYSQL_USER || 'admin',
    host: process.env.DB_HOST || 'db-tiendas',
    database: process.env.MYSQL_DATABASE || 'tiendas_db',
    password: process.env.MYSQL_PASSWORD || 'adminpassword',
    port: 3306,
  },

  CIRCUIT_BREAKER: {
    timeout: Number(process.env.CB_TIMEOUT_MS || 4500),
    errorThresholdPercentage: Number(process.env.CB_ERROR_THRESHOLD || 50),
    resetTimeout: Number(process.env.CB_RESET_TIMEOUT_MS || 15000),
    volumeThreshold: Number(process.env.CB_VOLUME_THRESHOLD || 5),
  },

  HTTP_TIMEOUT_MS: Number(process.env.HTTP_TIMEOUT_MS || 3500),
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
  OPS_LAB_TOKEN: process.env.OPS_LAB_TOKEN || process.env.OPS_PANEL_TOKEN || '',
};
