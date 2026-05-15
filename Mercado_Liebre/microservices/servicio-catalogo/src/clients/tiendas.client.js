/**
 * Cliente HTTP hacia `tiendas-service`.
 *
 * Encapsula la integración entre servicios para que las rutas de catálogo
 * **no conozcan** detalles de red: sólo piden "¿este usuario es dueño de
 * esta tienda?" y obtienen `true` / `false`. La llamada está protegida
 * por circuit breaker (ver `../breakers.js`).
 */

const { classifyBreakerError } = require('@mercadoliebre/resilience');
const { TIENDAS_SERVICE_URL, INTERNAL_SERVICE_TOKEN } = require('../config');
const { tiendasOwnerBreaker } = require('../breakers');
const { logger } = require('../logger');

/**
 * Comprueba contra `tiendas-service` que `userId` sea dueño de `tiendaId`.
 *
 * Resultado:
 *   - `true`           → el usuario es dueño.
 *   - `false`          → no lo es, o tiendas respondió error, o el breaker rechazó.
 *
 * Nunca lanza: en cualquier fallo se loguea con el `reason` clasificado
 * (`circuit_open` | `timeout` | `upstream_error`) y se devuelve `false`,
 * lo que las rutas traducen a 403 sin cascadas de error.
 */
async function isOwnerOfTienda(tiendaId, userId) {
  if (!INTERNAL_SERVICE_TOKEN) {
    logger.warn(
      { tienda_id: tiendaId },
      '[catalogo] INTERNAL_SERVICE_TOKEN no configurado; no se puede validar propiedad con tiendas-service.'
    );
    return false;
  }
  try {
    const result = await tiendasOwnerBreaker.fire({
      url: `${TIENDAS_SERVICE_URL}/internal/tiendas/${encodeURIComponent(tiendaId)}/owner`,
      options: { headers: { 'X-Internal-Token': INTERNAL_SERVICE_TOKEN } },
    });
    if (!result.ok) {
      logger.warn(
        { tienda_id: tiendaId, http_status: result.status },
        '[catalogo] tiendas-service respondió error al consultar dueño de tienda; se deniega la operación.'
      );
      return false;
    }
    const owns = result.data?.usuario_id === userId;
    if (!owns) {
      logger.warn(
        { tienda_id: tiendaId, user_id: userId },
        '[catalogo] El usuario autenticado no es el dueño registrado de la tienda.'
      );
    }
    return owns;
  } catch (e) {
    const reason = classifyBreakerError(e);
    logger.error(
      { err: e?.message, tienda_id: tiendaId, breaker: 'catalogo-tiendas-owner', reason },
      `[catalogo] Validación de propiedad no completada: ${reason} (circuito o red hacia tiendas-service).`
    );
    return false;
  }
}

module.exports = { isOwnerOfTienda };
