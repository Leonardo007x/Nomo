/**
 * Helpers de dominio compartidos por rutas de tiendas.
 *   - `parseJsonField`           → deserializa columnas JSON guardadas como texto.
 *   - `mapProductoFromCatalog`   → adapta el formato de catálogo al esperado por el front.
 */

function parseJsonField(val, fallback) {
  if (val == null) return fallback;
  if (typeof val === 'object') return val;
  try { return JSON.parse(val); } catch { return fallback; }
}

function mapProductoFromCatalog(item) {
  if (!item) return null;
  return {
    ...item,
    id: String(item.id),
    precio: Number(item.precio),
    caracteristicas: Array.isArray(item.caracteristicas) ? item.caracteristicas : [],
    visible: item.activo !== 0 && item.activo !== false,
    activo: item.activo !== 0 && item.activo !== false,
  };
}

module.exports = { parseJsonField, mapProductoFromCatalog };
