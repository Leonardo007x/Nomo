/**
 * Rutas de negocio del catálogo (CRUD de productos).
 *
 * - Lectura pública con filtros opcionales (`tienda_id`, `activo`).
 * - Escritura protegida con JWT y autorización distribuida (cliente `tiendas`).
 *
 * Se exporta como **factoría** para inyectar dependencias (pool MySQL) y
 * mantener este módulo libre de estado global.
 */

const express = require('express');
const requireAuth = require('../middleware/auth');
const { isOwnerOfTienda } = require('../clients/tiendas.client');

/** Deserializa JSON guardado como texto en MySQL sin romper si el dato es inválido. */
function parseJsonField(val, fallback) {
  if (val == null) return fallback;
  if (typeof val === 'object') return val;
  try { return JSON.parse(val); } catch { return fallback; }
}

/** Normaliza fila de MySQL → forma esperada por el frontend. */
function mapProductoRow(row) {
  if (!row) return null;
  const c = parseJsonField(row.caracteristicas, []);
  return {
    ...row,
    id: String(row.id),
    tienda_id: row.tienda_id,
    precio: Number(row.precio),
    caracteristicas: Array.isArray(c) ? c : [],
    visible: row.activo !== 0 && row.activo !== false,
    activo: row.activo !== 0 && row.activo !== false,
  };
}

module.exports = function createProductosRouter({ pool }) {
  const router = express.Router();

  /** Lista productos con filtros opcionales. Consulta directa al pool. */
  router.get('/', async (req, res) => {
    try {
      let sql = 'SELECT * FROM productos';
      const cond = [];
      const vals = [];
      if (req.query.tienda_id) {
        cond.push('tienda_id = ?');
        vals.push(req.query.tienda_id);
      }
      if (req.query.activo !== undefined) {
        cond.push('activo = ?');
        vals.push(req.query.activo === 'true' || req.query.activo === '1' ? 1 : 0);
      }
      if (cond.length) sql += ' WHERE ' + cond.join(' AND ');
      sql += ' ORDER BY creado_en DESC';
      const [rows] = await pool.query(sql, vals);
      res.json(rows.map(mapProductoRow));
    } catch (error) {
      req.log.error(
        { err: error?.message, filters: { tienda_id: req.query.tienda_id, activo: req.query.activo } },
        '[catalogo] Error al listar productos desde MySQL.'
      );
      res.status(500).json({ error: 'Error interno conectando a la BD' });
    }
  });

  /** Crea producto tras validar propiedad de tienda contra tiendas-service (con breaker). */
  router.post('/', requireAuth, async (req, res) => {
    const {
      nombre, descripcion, precio, tienda_id, categoria, categoria_id,
      imagen_url, caracteristicas, disponible, activo, destacado,
    } = req.body || {};
    if (!tienda_id) return res.status(400).json({ error: 'tienda_id requerido' });
    try {
      const ok = await isOwnerOfTienda(tienda_id, req.user.sub);
      if (!ok) return res.status(403).json({ error: 'No autorizado' });

      const [result] = await pool.query(
        `INSERT INTO productos (tienda_id, categoria_id, categoria, nombre, descripcion, precio, imagen_url, caracteristicas, disponible, activo, destacado)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          tienda_id,
          categoria_id || null,
          categoria || 'General',
          nombre,
          descripcion || null,
          precio,
          imagen_url || null,
          caracteristicas ? JSON.stringify(caracteristicas) : null,
          disponible !== false ? 1 : 0,
          activo !== false ? 1 : 0,
          destacado ? 1 : 0,
        ]
      );
      const [newProduct] = await pool.query('SELECT * FROM productos WHERE id = ?', [result.insertId]);
      req.log.info(
        { product_id: result.insertId, tienda_id },
        '[catalogo] Producto creado correctamente tras validación de tienda.'
      );
      res.status(201).json(mapProductoRow(newProduct[0]));
    } catch (error) {
      req.log.error({ err: error?.message, tienda_id }, '[catalogo] Error al insertar producto en MySQL.');
      res.status(500).json({ error: 'Error al insertar producto en la BD' });
    }
  });

  /** Actualiza campos permitidos del producto si el usuario es dueño de su tienda. */
  router.patch('/:id', requireAuth, async (req, res) => {
    try {
      const [p] = await pool.query('SELECT tienda_id FROM productos WHERE id = ?', [req.params.id]);
      if (!p.length) return res.status(404).json({ error: 'No encontrado' });
      const tid = p[0].tienda_id;
      if (!tid) return res.status(403).json({ error: 'Producto sin tienda asignada' });
      const owned = await isOwnerOfTienda(tid, req.user.sub);
      if (!owned) return res.status(403).json({ error: 'No autorizado' });

      const body = req.body || {};
      const allowed = [
        'nombre', 'descripcion', 'precio', 'categoria', 'categoria_id',
        'imagen_url', 'caracteristicas', 'disponible', 'activo', 'destacado',
      ];
      const updates = [];
      const vals = [];
      for (const k of allowed) {
        if (body[k] !== undefined) {
          updates.push(`${k} = ?`);
          if (k === 'caracteristicas') vals.push(JSON.stringify(body[k]));
          else if (k === 'disponible' || k === 'activo' || k === 'destacado') vals.push(body[k] ? 1 : 0);
          else vals.push(body[k]);
        }
      }
      if (!updates.length) {
        const [rows] = await pool.query('SELECT * FROM productos WHERE id = ?', [req.params.id]);
        return res.json(mapProductoRow(rows[0]));
      }
      vals.push(req.params.id);
      await pool.query(`UPDATE productos SET ${updates.join(', ')} WHERE id = ?`, vals);
      const [rows] = await pool.query('SELECT * FROM productos WHERE id = ?', [req.params.id]);
      req.log.info({ product_id: req.params.id, tienda_id: tid }, '[catalogo] Producto actualizado.');
      res.json(mapProductoRow(rows[0]));
    } catch (e) {
      req.log.error({ err: e?.message, product_id: req.params.id }, '[catalogo] Error al actualizar producto.');
      res.status(500).json({ error: 'Error al actualizar' });
    }
  });

  /** Elimina el producto si el usuario es dueño de la tienda asociada. */
  router.delete('/:id', requireAuth, async (req, res) => {
    try {
      const [p] = await pool.query('SELECT tienda_id FROM productos WHERE id = ?', [req.params.id]);
      if (!p.length) return res.status(404).json({ error: 'No encontrado' });
      const tid = p[0].tienda_id;
      if (!tid) return res.status(403).json({ error: 'No autorizado' });
      const owned = await isOwnerOfTienda(tid, req.user.sub);
      if (!owned) return res.status(403).json({ error: 'No autorizado' });
      await pool.query('DELETE FROM productos WHERE id = ?', [req.params.id]);
      req.log.info({ product_id: req.params.id, tienda_id: tid }, '[catalogo] Producto eliminado.');
      res.status(204).end();
    } catch (e) {
      req.log.error({ err: e?.message, product_id: req.params.id }, '[catalogo] Error al eliminar producto.');
      res.status(500).json({ error: 'Error al eliminar' });
    }
  });

  return router;
};
