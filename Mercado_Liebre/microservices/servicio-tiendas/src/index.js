/**
 * Microservicio Tiendas — punto de entrada.
 *
 * Dominio: tiendas + temas (BD propia). Expone:
 *   - API pública/autenticada bajo `/api/*`.
 *   - API servicio-a-servicio bajo `/internal/*` (token compartido).
 *
 * Integración: consume `catalogo-service` para la vista pública, protegida
 * por circuit breaker `tiendas-catalogo-productos`.
 */

const { PORT, SERVICE_NAME, CATALOGO_SERVICE_URL } = require('./config');
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
        { port: PORT, service: SERVICE_NAME, catalogo_url: CATALOGO_SERVICE_URL },
        '[tiendas] API en escucha; integración con catálogo protegida por circuit breaker.'
      );
    });
  } catch (e) {
    logger.error({ err: e?.message }, '[tiendas] Arranque abortado.');
    process.exit(1);
  }
}

bootstrap();
