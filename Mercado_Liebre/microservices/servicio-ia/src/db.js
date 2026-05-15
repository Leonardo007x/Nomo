const mysql = require('mysql2/promise');
const { DB } = require('./config');
const { logger } = require('./logger');

function createPool() { return mysql.createPool(DB); }

async function waitForDb(pool, maxAttempts = 40, delayMs = 2000) {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      await pool.query('SELECT 1');
      logger.info(
        { database: DB.database, host: DB.host },
        '[ia] Conexión a MySQL establecida; base lista para trazabilidad de generaciones.'
      );
      return;
    } catch (e) {
      logger.warn(
        { err: e?.message, attempt: i + 1, maxAttempts, host: DB.host },
        '[ia] MySQL aún no responde; reintentando.'
      );
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }
  throw new Error('[ia] No se pudo conectar a MySQL tras agotar reintentos');
}

module.exports = { createPool, waitForDb };
