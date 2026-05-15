/**
 * Endpoints servicio-a-servicio (no expuestos al cliente final).
 *
 * Otros microservicios (catálogo, categorías) llaman a `/internal/tiendas/:id/owner`
 * para validar ownership de tienda. Protegido por `X-Internal-Token`.
 */

const express = require('express');
const requireInternal = require('../middleware/internalAuth');

module.exports = function createInternalRouter({ pool }) {
  const router = express.Router();

  /** Devuelve el `usuario_id` dueño de una tienda. */
  router.get('/tiendas/:id/owner', requireInternal, async (req, res) => {
    try {
      const [rows] = await pool.query('SELECT usuario_id FROM tiendas WHERE id = ?', [req.params.id]);
      if (!rows.length) return res.status(404).json({ error: 'No encontrado' });
      return res.json({ usuario_id: rows[0].usuario_id });
    } catch (e) {
      req.log.error({ err: e?.message, tienda_id: req.params.id }, '[tiendas] Error en /internal/tiendas/:id/owner.');
      return res.status(500).json({ error: 'Error interno' });
    }
  });

  return router;
};
