/**
 * Microservicio Categorías — punto de entrada.
 *
 * Dominio: CRUD de categorías por tienda (BD propia).
 * Integración: ownership distribuida vía `tiendas-service` con circuit breaker.
 */

const { PORT, SERVICE_NAME, TIENDAS_SERVICE_URL } = require('./config');
const { logger } = require('./logger');
const { createPool, waitForDb } = require('./db');
const { createApp } = require('./app');

async function bootstrap() {
  try {
    const pool = createPool();
    await waitForDb(pool);

    const app = createApp({ pool });
    app.listen(PORT, () => {
      logger.info(
        { port: PORT, service: SERVICE_NAME, tiendas_url: TIENDAS_SERVICE_URL },
        '[categorias] API en escucha; autorización distribuida vía tiendas + circuit breaker.'
      );
    });
  } catch (e) {
    logger.error({ err: e?.message }, '[categorias] Arranque abortado.');
    process.exit(1);
  }
}

bootstrap();
