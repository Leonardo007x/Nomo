/**
 * Cliente HTTP hacia `catalogo-service`.
 *
 * Solo se usa para componer la **vista pública** de una tienda (storefront).
 * Toda la llamada va detrás del circuit breaker `tiendas-catalogo-productos`,
 * así una degradación de catálogo no tumba la API de tiendas.
 */

const { classifyBreakerError } = require('@mercadoliebre/resilience');
const { CATALOGO_SERVICE_URL } = require('../config');
const { catalogoProductosBreaker } = require('../breakers');

/**
 * Trae productos activos de una tienda específica.
 *
 * Retorna:
 *   - `{ ok: true, productos: any[] }`        en éxito.
 *   - `{ ok: false, reason, httpStatus }`     en cualquier fallo, listo para mapear a HTTP.
 */
async function fetchProductosDeTienda(tiendaId) {
  try {
    const result = await catalogoProductosBreaker.fire({
      url: `${CATALOGO_SERVICE_URL}/api/productos?tienda_id=${encodeURIComponent(tiendaId)}&activo=true`,
    });
    if (!result.ok) {
      return { ok: false, reason: 'upstream_error', httpStatus: 502, raw: result.raw, status: result.status };
    }
    const productos = Array.isArray(result.data) ? result.data : [];
    return { ok: true, productos };
  } catch (fireErr) {
    const reason = classifyBreakerError(fireErr);
    return {
      ok: false,
      reason,
      httpStatus: reason === 'circuit_open' ? 503 : 502,
      err: fireErr,
    };
  }
}

module.exports = { fetchProductosDeTienda };
