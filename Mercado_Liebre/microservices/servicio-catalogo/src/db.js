/**
 * Pool MySQL y espera de disponibilidad (arranque por etapas en Docker Compose).
 *
 * Expone:
 *   - `createPool()`  → crea el pool con la config del servicio.
 *   - `waitForDb(p)`  → reintenta `SELECT 1` hasta que MySQL acepte conexiones.
 */

const mysql = require('mysql2/promise');
const { DB } = require('./config');
const { logger } = require('./logger');

function createPool() {
  return mysql.createPool(DB);
}

/**
 * Espera activa: el contenedor del servicio puede arrancar antes que MySQL.
 * Sin esto, `bootstrap` fallaría y el contenedor se reiniciaría sin necesidad.
 */
async function waitForDb(pool, maxAttempts = 40, delayMs = 2000) {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      await pool.query('SELECT 1');
      logger.info(
        { database: DB.database, host: DB.host },
        '[catalogo] Conexión a MySQL establecida; base lista para consultas.'
      );
      return;
    } catch (e) {
      logger.warn(
        { err: e?.message, attempt: i + 1, maxAttempts, host: DB.host },
        '[catalogo] MySQL aún no responde; reintentando antes de exponer la API.'
      );
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }
  throw new Error('[catalogo] No se pudo conectar a MySQL tras agotar reintentos');
}

module.exports = { createPool, waitForDb };
