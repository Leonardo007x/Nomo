/**
 * Rutas del recurso Categoría.
 *
 * - GET (público) listado por `tienda_id`.
 * - POST / PATCH / DELETE (autenticado) validando ownership vía cliente HTTP con breaker.
 */

const express = require('express');
const crypto = require('crypto');
const requireAuth = require('../middleware/auth');
const { isOwnerOfTienda } = require('../clients/tiendas.client');

module.exports = function createCategoriasRouter({ pool }) {
  const router = express.Router();

  router.get('/', async (req, res) => {
    const tiendaId = req.query.tienda_id;
    if (!tiendaId) return res.status(400).json({ error: 'tienda_id requerido' });
    try {
      const [rows] = await pool.query(
        'SELECT * FROM categorias WHERE tienda_id = ? ORDER BY orden ASC, creado_en DESC',
        [tiendaId]
      );
      res.json(rows);
    } catch (e) {
      req.log.error({ err: e?.message, tienda_id: tiendaId }, '[categorias] Error al listar categorías.');
      res.status(500).json({ error: 'Error interno' });
    }
  });

  router.post('/', requireAuth, async (req, res) => {
    const { tienda_id, nombre, icono, orden } = req.body || {};
    if (!tienda_id || !nombre) {
      return res.status(400).json({ error: 'tienda_id y nombre son requeridos' });
    }
    try {
      const ok = await isOwnerOfTienda(tienda_id, req.user.sub);
      if (!ok) return res.status(403).json({ error: 'No autorizado' });

      const id = crypto.randomUUID();
      await pool.query(
        'INSERT INTO categorias (id, tienda_id, nombre, icono, orden) VALUES (?, ?, ?, ?, ?)',
        [id, tienda_id, nombre, icono || null, Number.isFinite(Number(orden)) ? Number(orden) : 0]
      );
      const [rows] = await pool.query('SELECT * FROM categorias WHERE id = ?', [id]);
      req.log.info({ categoria_id: id, tienda_id }, '[categorias] Categoría creada.');
      res.status(201).json(rows[0]);
    } catch (e) {
      req.log.error({ err: e?.message, tienda_id }, '[categorias] Error al crear categoría.');
      res.status(500).json({ error: 'Error al crear categoría' });
    }
  });

  router.patch('/:id', requireAuth, async (req, res) => {
    try {
      const [catRows] = await pool.query('SELECT * FROM categorias WHERE id = ?', [req.params.id]);
      if (!catRows.length) return res.status(404).json({ error: 'No encontrado' });
      const current = catRows[0];
      const ok = await isOwnerOfTienda(current.tienda_id, req.user.sub);
      if (!ok) return res.status(403).json({ error: 'No autorizado' });

      const body = req.body || {};
      const allowed = ['nombre', 'icono', 'orden'];
      const updates = [];
      const vals = [];
      for (const k of allowed) {
        if (body[k] !== undefined) {
          updates.push(`${k} = ?`);
          vals.push(k === 'orden' ? Number(body[k]) : body[k]);
        }
      }
      if (!updates.length) return res.json(current);
      vals.push(req.params.id);
      await pool.query(`UPDATE categorias SET ${updates.join(', ')} WHERE id = ?`, vals);
      const [rows] = await pool.query('SELECT * FROM categorias WHERE id = ?', [req.params.id]);
      req.log.info({ categoria_id: req.params.id }, '[categorias] Categoría actualizada.');
      res.json(rows[0]);
    } catch (e) {
      req.log.error({ err: e?.message, categoria_id: req.params.id }, '[categorias] Error al actualizar.');
      res.status(500).json({ error: 'Error al actualizar categoría' });
    }
  });

  router.delete('/:id', requireAuth, async (req, res) => {
    try {
      const [catRows] = await pool.query('SELECT * FROM categorias WHERE id = ?', [req.params.id]);
      if (!catRows.length) return res.status(404).json({ error: 'No encontrado' });
      const ok = await isOwnerOfTienda(catRows[0].tienda_id, req.user.sub);
      if (!ok) return res.status(403).json({ error: 'No autorizado' });
      await pool.query('DELETE FROM categorias WHERE id = ?', [req.params.id]);
      req.log.info({ categoria_id: req.params.id }, '[categorias] Categoría eliminada.');
      res.status(204).end();
    } catch (e) {
      req.log.error({ err: e?.message, categoria_id: req.params.id }, '[categorias] Error al eliminar.');
      res.status(500).json({ error: 'Error al eliminar categoría' });
    }
  });

  return router;
};
