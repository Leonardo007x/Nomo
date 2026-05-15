/**
 * Microservicio Usuarios — punto de entrada.
 *
 * Dominio: única fuente de verdad para credenciales/identidad (tabla `usuarios`).
 * Resiliencia: todas las consultas pasan por un circuit breaker sobre MySQL.
 */

const { PORT, SERVICE_NAME } = require('./config');
const { logger } = require('./logger');
const { createPool, waitForDb, ensureUsuariosPasswordHash } = require('./db');
const { createApp } = require('./app');

async function bootstrap() {
  try {
    const pool = createPool();
    await waitForDb(pool);
    await ensureUsuariosPasswordHash(pool);

    const app = createApp({ pool });
    app.listen(PORT, () => {
      logger.info(
        { port: PORT, service: SERVICE_NAME },
        '[usuarios] API en escucha; consultas protegidas por circuit breaker sobre MySQL.'
      );
    });
  } catch (e) {
    logger.error({ err: e?.message }, '[usuarios] Arranque abortado.');
    process.exit(1);
  }
}

bootstrap();
