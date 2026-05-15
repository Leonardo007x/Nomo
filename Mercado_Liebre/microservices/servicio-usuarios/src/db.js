/**
 * Persistencia de Usuarios: pool MySQL, espera al arranque y migración defensiva.
 *
 * El acceso real a la BD desde rutas pasa por `queryWithBreaker` (ver `breakers.js`),
 * que envuelve cada consulta con el circuit breaker `usuarios-mysql`.
 */

const mysql = require('mysql2/promise');
const { DB } = require('./config');
const { logger } = require('./logger');

function createPool() {
  return mysql.createPool(DB);
}

/** Espera activa a MySQL para arranque por etapas en Docker Compose. */
async function waitForDb(pool, maxAttempts = 40, delayMs = 2000) {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      await pool.query('SELECT 1');
      logger.info(
        { database: DB.database, host: DB.host },
        '[usuarios] Conexión a MySQL establecida; base lista para autenticación.'
      );
      return;
    } catch (e) {
      logger.warn(
        { err: e?.message, attempt: i + 1, maxAttempts, host: DB.host },
        '[usuarios] MySQL aún no responde; reintentando antes de exponer la API.'
      );
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }
  throw new Error('[usuarios] No se pudo conectar a MySQL tras agotar reintentos');
}

/**
 * Migración defensiva: añade `password_hash` si una instalación previa quedó sin esta
 * columna. Idempotente: si ya existe, no hace nada.
 */
async function ensureUsuariosPasswordHash(pool) {
  try {
    const [rows] = await pool.query(
      `SELECT COUNT(*) AS c FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'usuarios' AND COLUMN_NAME = 'password_hash'`,
      [DB.database]
    );
    if (rows[0].c > 0) return;
    await pool.query('ALTER TABLE usuarios ADD COLUMN password_hash VARCHAR(255) NULL AFTER apellido');
    logger.info('[usuarios] Migración aplicada: columna password_hash añadida a tabla usuarios.');
  } catch (e) {
    logger.error({ err: e?.message }, '[usuarios] Falló ensureUsuariosPasswordHash.');
    throw e;
  }
}

module.exports = { createPool, waitForDb, ensureUsuariosPasswordHash };
