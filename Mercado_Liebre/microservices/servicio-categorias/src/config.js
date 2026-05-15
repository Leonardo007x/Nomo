/** Configuración del servicio Categorías. */
module.exports = {
  PORT: Number(process.env.PORT || 3005),
  SERVICE_NAME: 'categorias-service',
  JWT_SECRET: process.env.JWT_SECRET || 'dev-only-cambiar',
  INTERNAL_SERVICE_TOKEN: process.env.INTERNAL_SERVICE_TOKEN || '',
  TIENDAS_SERVICE_URL: (process.env.TIENDAS_SERVICE_URL || 'http://tiendas-service:3002').replace(/\/$/, ''),

  DB: {
    user: process.env.MYSQL_USER || 'admin',
    host: process.env.DB_HOST || 'db-categorias',
    database: process.env.MYSQL_DATABASE || 'categorias_db',
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
