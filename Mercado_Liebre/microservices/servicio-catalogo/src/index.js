/**
 * Microservicio Catálogo — punto de entrada.
 *
 * Dominio: CRUD de productos sobre la BD `db-catalogo`.
 * Integración: valida propiedad de tienda contra `tiendas-service`
 *              vía HTTP, protegida por circuit breaker (Opossum).
 *
 * Secuencia de arranque: pool → MySQL disponible → app Express → escucha HTTP.
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
        '[catalogo] API en escucha; validación de tiendas vía HTTP con circuit breaker.'
      );
    });
  } catch (e) {
    logger.error(
      { err: e?.message },
      '[catalogo] Arranque abortado: revise conectividad a MySQL y variables de entorno.'
    );
    process.exit(1);
  }
}

bootstrap();
