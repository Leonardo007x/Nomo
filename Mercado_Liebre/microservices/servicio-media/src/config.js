/** Configuración del servicio Media. */
module.exports = {
  PORT: Number(process.env.PORT || 3004),
  SERVICE_NAME: 'media-service',
  JWT_SECRET: process.env.JWT_SECRET || 'dev-only-cambiar',

  DB: {
    user: process.env.MYSQL_USER || 'admin',
    host: process.env.DB_HOST || 'db-media',
    database: process.env.MYSQL_DATABASE || 'media_db',
    password: process.env.MYSQL_PASSWORD || 'adminpassword',
    port: 3306,
  },

  CLOUDINARY: {
    cloud_name: (process.env.CLOUDINARY_CLOUD_NAME || '').trim(),
    api_key: (process.env.CLOUDINARY_API_KEY || '').trim(),
    api_secret: (process.env.CLOUDINARY_API_SECRET || '').trim(),
  },

  /**
   * Subida a SaaS externo (Cloudinary). Timeout más alto que en breakers entre
   * microservicios: la transferencia de bytes domina la latencia.
   */
  CIRCUIT_BREAKER: {
    timeout: Number(process.env.CB_TIMEOUT_MS || 60000),
    errorThresholdPercentage: Number(process.env.CB_ERROR_THRESHOLD || 50),
    resetTimeout: Number(process.env.CB_RESET_TIMEOUT_MS || 15000),
    volumeThreshold: Number(process.env.CB_VOLUME_THRESHOLD || 3),
  },

  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
  OPS_LAB_TOKEN: process.env.OPS_LAB_TOKEN || process.env.OPS_PANEL_TOKEN || '',
};
