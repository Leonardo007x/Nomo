/**
 * Cliente HTTP hacia `tiendas-service` para validación de ownership.
 *
 * Las escrituras (POST/PATCH/DELETE) requieren confirmar que el usuario
 * autenticado sea dueño de la tienda asociada a la categoría. La llamada
 * va detrás del circuit breaker para no propagar caídas de tiendas.
 */

const { classifyBreakerError } = require('@mercadoliebre/resilience');
const { TIENDAS_SERVICE_URL, INTERNAL_SERVICE_TOKEN } = require('../config');
const { tiendasOwnerBreaker } = require('../breakers');
const { logger } = require('../logger');

/**
 * Pregunta a tiendas-service: ¿es `userId` el dueño de `tiendaId`?
 * Nunca lanza; cualquier fallo devuelve `false` con log clasificado.
 */
async function isOwnerOfTienda(tiendaId, userId) {
  if (!INTERNAL_SERVICE_TOKEN) {
    logger.warn(
      { tienda_id: tiendaId },
      '[categorias] INTERNAL_SERVICE_TOKEN no configurado; no se puede validar propiedad.'
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
        '[categorias] tiendas-service rechazó la consulta de ownership.'
      );
      return false;
    }
    return result.data?.usuario_id === userId;
  } catch (e) {
    const reason = classifyBreakerError(e);
    logger.error(
      { err: e?.message, tienda_id: tiendaId, breaker: 'categorias-tiendas-owner', reason },
      `[categorias] Validación de ownership no completada: ${reason}.`
    );
    return false;
  }
}

module.exports = { isOwnerOfTienda };
