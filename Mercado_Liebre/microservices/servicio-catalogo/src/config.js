/**
 * Configuración del servicio (sólo lectura de `process.env`).
 *
 * Centraliza variables de entorno para evitar leerlas en otros módulos.
 * Cada constante documenta su origen en el `docker-compose.yml` / `.env`.
 */

module.exports = {
  /** Puerto interno del contenedor (Compose expone 3003 para catálogo). */
  PORT: Number(process.env.PORT || 3003),

  /** Nombre lógico del servicio: aparece en cada log estructurado de Pino. */
  SERVICE_NAME: 'catalogo-service',

  /** Secreto JWT compartido con `usuarios-service` para validar tokens. */
  JWT_SECRET: process.env.JWT_SECRET || 'dev-only-cambiar',

  /** Token compartido servidor-a-servidor con `tiendas-service`. */
  INTERNAL_SERVICE_TOKEN: process.env.INTERNAL_SERVICE_TOKEN || '',

  /** URL interna del microservicio de tiendas (red Docker). */
  TIENDAS_SERVICE_URL: (process.env.TIENDAS_SERVICE_URL || 'http://tiendas-service:3002').replace(/\/$/, ''),

  /** Credenciales y host de la base de datos exclusiva del catálogo. */
  DB: {
    user: process.env.MYSQL_USER || 'admin',
    host: process.env.DB_HOST || 'db-catalogo',
    database: process.env.MYSQL_DATABASE || 'catalogo_db',
    password: process.env.MYSQL_PASSWORD || 'adminpassword',
    port: 3306,
  },

  /** Parámetros del Circuit Breaker (Opossum) para la integración con tiendas. */
  CIRCUIT_BREAKER: {
    timeout: Number(process.env.CB_TIMEOUT_MS || 4500),
    errorThresholdPercentage: Number(process.env.CB_ERROR_THRESHOLD || 50),
    resetTimeout: Number(process.env.CB_RESET_TIMEOUT_MS || 15000),
    volumeThreshold: Number(process.env.CB_VOLUME_THRESHOLD || 5),
  },

  /** Timeout HTTP individual para llamadas a otros microservicios. */
  HTTP_TIMEOUT_MS: Number(process.env.HTTP_TIMEOUT_MS || 3500),

  /** Nivel de logs de Pino. */
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
  OPS_LAB_TOKEN: process.env.OPS_LAB_TOKEN || process.env.OPS_PANEL_TOKEN || '',
};
