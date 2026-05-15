/**
 * Microservicio IA — punto de entrada.
 *
 * Dominio: proxy controlado a Groq (la API key nunca viaja al cliente).
 * Resiliencia: cada llamada al proveedor pasa por un circuit breaker.
 */

const { PORT, SERVICE_NAME, GROQ_API_KEY } = require('./config');
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
        { port: PORT, service: SERVICE_NAME, groq_configured: !!GROQ_API_KEY },
        '[ia] API en escucha; llamadas a Groq protegidas por circuit breaker.'
      );
    });
  } catch (e) {
    logger.error({ err: e?.message }, '[ia] Arranque abortado.');
    process.exit(1);
  }
}

bootstrap();
