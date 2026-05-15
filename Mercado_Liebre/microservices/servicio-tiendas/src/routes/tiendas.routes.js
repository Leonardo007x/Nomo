/**
 * Rutas del recurso Tienda.
 *
 * - Lecturas públicas (listado, destacadas, vista pública).
 * - Lecturas/escrituras protegidas con JWT (mis tiendas, crear, editar).
 * - La vista pública compone datos de catálogo vía cliente HTTP con breaker.
 */

const express = require('express');
const crypto = require('crypto');
const requireAuth = require('../middleware/auth');
const { parseJsonField, mapProductoFromCatalog } = require('../domain/helpers');
const { fetchProductosDeTienda } = require('../clients/catalogo.client');
const { logger } = require('../logger');

module.exports = function createTiendasRouter({ pool }) {
  const router = express.Router();

  /** Listado completo de tiendas (orden por fecha de creación). */
  router.get('/', async (req, res) => {
    try {
      const [rows] = await pool.query('SELECT * FROM tiendas ORDER BY creado_en DESC');
      res.json(rows.map((r) => ({ ...r, dias_abierto: parseJsonField(r.dias_abierto, {}) })));
    } catch (e) {
      req.log.error({ err: e?.message }, '[tiendas] Error al listar tiendas.');
      res.status(500).json({ error: 'Error al listar tiendas' });
    }
  });

  /** Top tiendas con banner (carrusel/destacadas en home). */
  router.get('/destacadas', async (req, res) => {
    try {
      const [rows] = await pool.query(
        `SELECT * FROM tiendas
         WHERE imagen_banner_url IS NOT NULL AND imagen_banner_url != ''
         ORDER BY creado_en DESC LIMIT 6`
      );
      res.json(rows.map((r) => ({ ...r, dias_abierto: parseJsonField(r.dias_abierto, {}) })));
    } catch (e) {
      req.log.error({ err: e?.message }, '[tiendas] Error al listar destacadas.');
      res.status(500).json({ error: 'Error al listar destacadas' });
    }
  });

  /** Tienda del usuario autenticado (uno a uno). */
  router.get('/mias', requireAuth, async (req, res) => {
    try {
      const [rows] = await pool.query('SELECT * FROM tiendas WHERE usuario_id = ? LIMIT 1', [req.user.sub]);
      const r = rows[0];
      if (!r) return res.json(null);
      return res.json({ ...r, dias_abierto: parseJsonField(r.dias_abierto, {}) });
    } catch (e) {
      req.log.error({ err: e?.message }, '[tiendas] Error al obtener tienda propia.');
      res.status(500).json({ error: 'Error al obtener tienda' });
    }
  });

  /**
   * Vista pública: tienda + tema + productos (estos últimos vía catálogo).
   * Si el breaker hacia catálogo rechaza, respondemos 503 controlado.
   */
  router.get('/:id/vista-publica', async (req, res) => {
    try {
      const id = req.params.id;
      const [tRows] = await pool.query('SELECT * FROM tiendas WHERE id = ?', [id]);
      const tienda = tRows[0];
      if (!tienda) return res.status(404).json({ error: 'Tienda no encontrada' });

      const [temRows] = await pool.query('SELECT * FROM temas WHERE tienda_id = ? LIMIT 1', [id]);
      let tema = temRows[0];
      if (!tema) {
        tema = {
          id: 'default', tienda_id: id,
          color_primario: '#000000', color_secundario: '#333333',
          color_fondo: '#FFFFFF', color_texto: '#000000', color_texto_titulos: '#000000',
          fuente_titulos: 'Playfair Display', fuente_cuerpo: 'Inter', estilo_plantilla: 'moderno',
        };
      }

      const prod = await fetchProductosDeTienda(id);
      if (!prod.ok) {
        req.log.warn(
          { tienda_id: id, reason: prod.reason, breaker: 'tiendas-catalogo-productos' },
          '[tiendas] vista-publica: catálogo bloqueado o degradado por circuit breaker.'
        );
        return res.status(prod.httpStatus).json({
          error: prod.reason === 'circuit_open'
            ? 'Catálogo temporalmente protegido por circuit breaker'
            : 'Catálogo no disponible',
          reason: prod.reason,
        });
      }

      res.json({
        tienda: { ...tienda, dias_abierto: parseJsonField(tienda.dias_abierto, {}) },
        tema,
        productos: prod.productos.map(mapProductoFromCatalog),
      });
    } catch (e) {
      req.log.error({ err: e?.message, tienda_id: req.params.id }, '[tiendas] Error en /:id/vista-publica.');
      res.status(500).json({ error: 'Error interno' });
    }
  });

  /** Detalle público de una tienda. */
  router.get('/:id', async (req, res) => {
    try {
      const [rows] = await pool.query('SELECT * FROM tiendas WHERE id = ?', [req.params.id]);
      const r = rows[0];
      if (!r) return res.status(404).json({ error: 'No encontrado' });
      return res.json({ ...r, dias_abierto: parseJsonField(r.dias_abierto, {}) });
    } catch (e) {
      req.log.error({ err: e?.message }, '[tiendas] Error al obtener tienda.');
      res.status(500).json({ error: 'Error interno' });
    }
  });

  /** Alta de tienda asociada al usuario autenticado. */
  router.post('/', requireAuth, async (req, res) => {
    try {
      const id = crypto.randomUUID();
      const body = req.body || {};
      await pool.query(
        `INSERT INTO tiendas (id, usuario_id, nombre, descripcion, eslogan, horario_apertura, horario_cierre, dias_abierto)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id, req.user.sub,
          body.nombre || 'Mi Nueva Tienda',
          body.descripcion || 'Bienvenido a nuestro catálogo digital.',
          body.eslogan || 'Lo mejor para ti',
          body.horario_apertura || '09:00',
          body.horario_cierre || '22:00',
          JSON.stringify(body.dias_abierto || {
            lunes: true, martes: true, miercoles: true, jueves: true,
            viernes: true, sabado: true, domingo: true,
          }),
        ]
      );
      const [rows] = await pool.query('SELECT * FROM tiendas WHERE id = ?', [id]);
      const r = rows[0];
      req.log.info({ tienda_id: id, usuario_id: req.user.sub }, '[tiendas] Tienda creada.');
      return res.status(201).json({ ...r, dias_abierto: parseJsonField(r.dias_abierto, {}) });
    } catch (e) {
      req.log.error({ err: e?.message }, '[tiendas] Error al crear tienda.');
      res.status(500).json({ error: 'Error al crear tienda' });
    }
  });

  /** Edición parcial; valida que el usuario sea dueño. */
  router.patch('/:id', requireAuth, async (req, res) => {
    try {
      const [own] = await pool.query('SELECT usuario_id FROM tiendas WHERE id = ?', [req.params.id]);
      if (!own.length || own[0].usuario_id !== req.user.sub) {
        return res.status(403).json({ error: 'No autorizado' });
      }
      const allowed = [
        'nombre', 'descripcion', 'eslogan', 'telefono', 'email',
        'direccion', 'ciudad', 'pais', 'codigo_postal',
        'facebook', 'instagram', 'twitter', 'whatsapp',
        'horario_apertura', 'horario_cierre',
        'imagen_logo_url', 'imagen_banner_url',
        'moneda', 'idioma',
      ];
      const body = req.body || {};
      const updates = [];
      const vals = [];
      for (const k of allowed) {
        if (body[k] !== undefined) { updates.push(`${k} = ?`); vals.push(body[k]); }
      }
      if (body.dias_abierto !== undefined) {
        updates.push('dias_abierto = ?');
        vals.push(typeof body.dias_abierto === 'string' ? body.dias_abierto : JSON.stringify(body.dias_abierto));
      }
      if (!updates.length) {
        const [rows] = await pool.query('SELECT * FROM tiendas WHERE id = ?', [req.params.id]);
        const r = rows[0];
        return res.json({ ...r, dias_abierto: parseJsonField(r.dias_abierto, {}) });
      }
      vals.push(req.params.id);
      await pool.query(`UPDATE tiendas SET ${updates.join(', ')} WHERE id = ?`, vals);
      const [rows] = await pool.query('SELECT * FROM tiendas WHERE id = ?', [req.params.id]);
      const r = rows[0];
      req.log.info({ tienda_id: req.params.id }, '[tiendas] Tienda actualizada.');
      return res.json({ ...r, dias_abierto: parseJsonField(r.dias_abierto, {}) });
    } catch (e) {
      req.log.error({ err: e?.message, tienda_id: req.params.id }, '[tiendas] Error al actualizar tienda.');
      res.status(500).json({ error: 'Error al actualizar tienda' });
    }
  });

  return router;
};
