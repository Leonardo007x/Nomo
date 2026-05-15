/**
 * Rutas del recurso Tema (apariencia visual asociada a una tienda).
 * Toda escritura valida que el usuario sea dueño de la tienda asociada.
 */

const express = require('express');
const crypto = require('crypto');
const requireAuth = require('../middleware/auth');

module.exports = function createTemasRouter({ pool }) {
  const router = express.Router();

  /** Lee el tema de una tienda (un tema por tienda). */
  router.get('/', async (req, res) => {
    const tiendaId = req.query.tienda_id;
    if (!tiendaId) return res.status(400).json({ error: 'tienda_id requerido' });
    try {
      const [rows] = await pool.query('SELECT * FROM temas WHERE tienda_id = ? LIMIT 1', [tiendaId]);
      return res.json(rows[0] || null);
    } catch (e) {
      req.log.error({ err: e?.message }, '[tiendas] Error al obtener tema.');
      res.status(500).json({ error: 'Error interno' });
    }
  });

  /** Crea tema para una tienda propia. */
  router.post('/', requireAuth, async (req, res) => {
    try {
      const body = req.body || {};
      if (!body.tienda_id) return res.status(400).json({ error: 'tienda_id requerido' });
      const [own] = await pool.query('SELECT usuario_id FROM tiendas WHERE id = ?', [body.tienda_id]);
      if (!own.length || own[0].usuario_id !== req.user.sub) {
        return res.status(403).json({ error: 'No autorizado' });
      }
      const id = crypto.randomUUID();
      await pool.query(
        `INSERT INTO temas (id, tienda_id, color_primario, color_secundario, color_fondo, color_texto, color_texto_titulos, fuente_titulos, fuente_cuerpo, estilo_plantilla)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id, body.tienda_id,
          body.color_primario || '#FFE600',
          body.color_secundario || '#3483FA',
          body.color_fondo || '#EBEBEB',
          body.color_texto || '#333333',
          body.color_texto_titulos || '#333333',
          body.fuente_titulos || 'Playfair Display',
          body.fuente_cuerpo || 'Inter',
          body.estilo_plantilla || 'moderno',
        ]
      );
      const [rows] = await pool.query('SELECT * FROM temas WHERE id = ?', [id]);
      req.log.info({ tema_id: id, tienda_id: body.tienda_id }, '[tiendas] Tema creado.');
      return res.status(201).json(rows[0]);
    } catch (e) {
      req.log.error({ err: e?.message }, '[tiendas] Error al crear tema.');
      res.status(500).json({ error: 'Error al crear tema' });
    }
  });

  /** Edición parcial del tema; valida ownership vía la tienda asociada. */
  router.patch('/:id', requireAuth, async (req, res) => {
    try {
      const [tem] = await pool.query('SELECT tienda_id FROM temas WHERE id = ?', [req.params.id]);
      if (!tem.length) return res.status(404).json({ error: 'No encontrado' });
      const [own] = await pool.query('SELECT usuario_id FROM tiendas WHERE id = ?', [tem[0].tienda_id]);
      if (!own.length || own[0].usuario_id !== req.user.sub) {
        return res.status(403).json({ error: 'No autorizado' });
      }
      const allowed = [
        'color_primario', 'color_secundario', 'color_fondo',
        'color_texto', 'color_texto_titulos',
        'fuente_titulos', 'fuente_cuerpo', 'estilo_plantilla',
      ];
      const body = req.body || {};
      const updates = [];
      const vals = [];
      for (const k of allowed) {
        if (body[k] !== undefined) { updates.push(`${k} = ?`); vals.push(body[k]); }
      }
      if (!updates.length) {
        const [rows] = await pool.query('SELECT * FROM temas WHERE id = ?', [req.params.id]);
        return res.json(rows[0]);
      }
      vals.push(req.params.id);
      await pool.query(`UPDATE temas SET ${updates.join(', ')} WHERE id = ?`, vals);
      const [rows] = await pool.query('SELECT * FROM temas WHERE id = ?', [req.params.id]);
      req.log.info({ tema_id: req.params.id }, '[tiendas] Tema actualizado.');
      return res.json(rows[0]);
    } catch (e) {
      req.log.error({ err: e?.message, tema_id: req.params.id }, '[tiendas] Error al actualizar tema.');
      res.status(500).json({ error: 'Error al actualizar tema' });
    }
  });

  return router;
};
