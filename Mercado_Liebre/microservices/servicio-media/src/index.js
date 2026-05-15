/**
 * Microservicio Media — punto de entrada.
 *
 * Dominio: subida de archivos (imágenes) y auditoría en BD propia.
 * Integración: Cloudinary (SaaS externo) detrás de circuit breaker.
 */

const { PORT, SERVICE_NAME } = require('./config');
const { logger } = require('./logger');
const { createPool, waitForDb } = require('./db');
const { initCloudinary } = require('./clients/cloudinary.client');
const { createApp } = require('./app');

async function bootstrap() {
  try {
    const pool = createPool();
    await waitForDb(pool);

    let cloudinaryEnabled = initCloudinary();
    const isCloudinaryEnabled = () => cloudinaryEnabled;

    const app = createApp({ pool, isCloudinaryEnabled });
    app.listen(PORT, () => {
      logger.info(
        { port: PORT, service: SERVICE_NAME, cloudinary_enabled: cloudinaryEnabled },
        '[media] API en escucha; subidas a Cloudinary protegidas por circuit breaker.'
      );
    });
  } catch (e) {
    logger.error({ err: e?.message }, '[media] Arranque abortado.');
    process.exit(1);
  }
}

bootstrap();
