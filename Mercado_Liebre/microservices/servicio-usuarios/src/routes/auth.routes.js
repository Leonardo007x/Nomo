/**
 * Rutas de autenticación: registro, login y perfil del usuario autenticado.
 *
 * Toda consulta a MySQL pasa por `queryWithBreaker`: en lugar de propagar
 * la excepción de Opossum, devolvemos un objeto normalizado para mapear
 * a códigos HTTP claros (503 si el circuito está abierto, 500 en error real).
 */

const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const requireAuth = require('../middleware/auth');
const { queryWithBreaker } = require('../breakers');
const { JWT_SECRET } = require('../config');

/** Firma un token de sesión estándar (7 días). */
function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

/** Convierte el resultado del breaker a respuesta HTTP cuando hay error. */
function sendBreakerError(res, q, fallbackMsg) {
  if (q.reason === 'circuit_open') {
    return res.status(503).json({
      error: 'Servicio temporalmente protegido (circuit breaker sobre base de datos)',
      reason: q.reason,
    });
  }
  return res.status(500).json({ error: fallbackMsg, detail: q.err?.message });
}

module.exports = function createAuthRouter({ pool }) {
  const router = express.Router();

  /** Registro: valida unicidad de email, hashea contraseña y emite token. */
  async function handleRegister(req, res) {
    const { email, password, nombre, apellido } = req.body || {};
    if (!email || !password || !nombre || !apellido) {
      return res.status(400).json({ error: 'Faltan campos obligatorios' });
    }
    try {
      const q1 = await queryWithBreaker({ pool, req, sql: 'SELECT id FROM usuarios WHERE email = ?', params: [email] });
      if (!q1.ok) return sendBreakerError(res, q1, 'Error al registrar');
      if (q1.rows.length) return res.status(409).json({ error: 'Este correo ya está registrado' });

      const id = crypto.randomUUID();
      const password_hash = await bcrypt.hash(password, 10);
      const q2 = await queryWithBreaker({
        pool, req,
        sql: 'INSERT INTO usuarios (id, email, nombre, apellido, password_hash) VALUES (?, ?, ?, ?, ?)',
        params: [id, email, nombre, apellido, password_hash],
      });
      if (!q2.ok) return sendBreakerError(res, q2, 'Error al registrar');

      const token = signToken({ sub: id, email });
      req.log.info({ user_id: id }, '[usuarios] Nuevo usuario registrado.');
      return res.status(201).json({
        token,
        user: { id, email, nombre, apellido },
        userId: id,
      });
    } catch (e) {
      req.log.error({ err: e?.message }, '[usuarios] Falla inesperada en POST register.');
      const msg = process.env.NODE_ENV === 'production' ? 'Error al registrar' : e.message || 'Error al registrar';
      return res.status(500).json({ error: 'Error al registrar', detail: msg });
    }
  }

  /** Login: verifica credenciales y emite token JWT. */
  async function handleLogin(req, res) {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: 'Email y contraseña requeridos' });
    try {
      const q1 = await queryWithBreaker({
        pool, req,
        sql: 'SELECT id, email, nombre, apellido, password_hash FROM usuarios WHERE email = ?',
        params: [email],
      });
      if (!q1.ok) return sendBreakerError(res, q1, 'Error al iniciar sesión');

      const u = q1.rows[0];
      if (!u || !u.password_hash) return res.status(401).json({ error: 'Credenciales inválidas' });
      const ok = await bcrypt.compare(password, u.password_hash);
      if (!ok) return res.status(401).json({ error: 'Credenciales inválidas' });

      const token = signToken({ sub: u.id, email: u.email });
      req.log.info({ user_id: u.id }, '[usuarios] Login exitoso.');
      return res.json({
        token,
        user: { id: u.id, email: u.email, nombre: u.nombre, apellido: u.apellido },
        userId: u.id,
      });
    } catch (e) {
      req.log.error({ err: e?.message }, '[usuarios] Falla inesperada en POST login.');
      const msg = process.env.NODE_ENV === 'production' ? 'Error al iniciar sesión' : e.message || 'Error al iniciar sesión';
      return res.status(500).json({ error: 'Error al iniciar sesión', detail: msg });
    }
  }

  // Aliases mantenidos por compatibilidad con clientes existentes.
  router.post('/auth/register', handleRegister);
  router.post('/registro', handleRegister);
  router.post('/auth/login', handleLogin);
  router.post('/login', handleLogin);

  /** Perfil del usuario autenticado (a partir del JWT). */
  router.get('/auth/me', requireAuth, async (req, res) => {
    try {
      const q = await queryWithBreaker({
        pool, req,
        sql: 'SELECT id, email, nombre, apellido FROM usuarios WHERE id = ?',
        params: [req.user.sub],
      });
      if (!q.ok) return sendBreakerError(res, q, 'Error interno');
      const u = q.rows[0];
      if (!u) return res.status(404).json({ error: 'Usuario no encontrado' });
      return res.json({ id: u.id, email: u.email, nombre: u.nombre, apellido: u.apellido });
    } catch (e) {
      req.log.error({ err: e?.message }, '[usuarios] Falla en GET /auth/me.');
      return res.status(500).json({ error: 'Error interno' });
    }
  });

  return router;
};
