const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;

const app = express();
const port = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'dev-only-cambiar';

app.use(cors());
app.use(express.json({ limit: '2mb' }));

const dbConfig = {
  user: process.env.MYSQL_USER || 'admin',
  host: process.env.DB_HOST || 'db-service',
  database: process.env.MYSQL_DATABASE || 'mercadoliebre_db_prod',
  password: process.env.MYSQL_PASSWORD || 'adminpassword',
  port: 3306,
};

let pool;
/** Subida firmada al servidor (sin upload_preset en el navegador). */
let cloudinaryUploadsEnabled = false;

const uploadMem = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 6 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype || !file.mimetype.startsWith('image/')) {
      return cb(new Error('Solo se permiten archivos de imagen'));
    }
    cb(null, true);
  },
});

function readCloudinaryEnv() {
  const cloud_name = (process.env.CLOUDINARY_CLOUD_NAME || '').trim();
  const api_key = (process.env.CLOUDINARY_API_KEY || '').trim();
  const api_secret = (process.env.CLOUDINARY_API_SECRET || '').trim();
  return { cloud_name, api_key, api_secret, ok: !!(cloud_name && api_key && api_secret) };
}

function tryInitCloudinary() {
  const { cloud_name, api_key, api_secret, ok } = readCloudinaryEnv();
  if (!ok) return false;
  cloudinary.config({ cloud_name, api_key, api_secret });
  return true;
}

/** Espera a que MySQL acepte conexiones (típico retraso al levantar Docker). */
async function waitForDb(p, maxAttempts = 40, delayMs = 2000) {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      await p.query('SELECT 1');
      console.log('MySQL respondió correctamente');
      return;
    } catch (e) {
      console.warn(`MySQL no listo (intento ${i + 1}/${maxAttempts}):`, e.message);
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }
  throw new Error('No se pudo conectar a MySQL tras varios intentos');
}

/** Volúmenes antiguos: la tabla existía sin password_hash; la añadimos sin borrar datos. */
async function ensureUsuariosPasswordHash(p) {
  const dbName = dbConfig.database;
  try {
    const [rows] = await p.query(
      `SELECT COUNT(*) AS c FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'usuarios' AND COLUMN_NAME = 'password_hash'`,
      [dbName]
    );
    if (rows[0].c > 0) return;
    console.log('Migrando esquema: añadiendo usuarios.password_hash...');
    await p.query(
      'ALTER TABLE usuarios ADD COLUMN password_hash VARCHAR(255) NULL AFTER apellido'
    );
  } catch (e) {
    console.error('ensureUsuariosPasswordHash:', e.message);
    throw e;
  }
}

function requireAuth(req, res, next) {
  const h = req.headers.authorization;
  if (!h || !h.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No autorizado' });
  }
  try {
    req.user = jwt.verify(h.slice(7), JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: 'Token inválido o expirado' });
  }
}

function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

function parseJsonField(val, fallback) {
  if (val == null) return fallback;
  if (typeof val === 'object') return val;
  try {
    return JSON.parse(val);
  } catch {
    return fallback;
  }
}

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

function optimizeCloudinaryUrl(secureUrl) {
  const insertIndex = secureUrl.indexOf('/upload/') + 8;
  if (insertIndex < 8) return secureUrl;
  return secureUrl.slice(0, insertIndex) + 'q_auto,f_auto/' + secureUrl.slice(insertIndex);
}

// ---------- Subida de imágenes (Cloudinary vía API, usuario autenticado) ----------
app.post(
  '/api/media/upload',
  requireAuth,
  (req, res, next) => {
    uploadMem.single('file')(req, res, (err) => {
      if (err) return res.status(400).json({ error: err.message || 'Archivo no válido' });
      next();
    });
  },
  async (req, res) => {
    if (!cloudinaryUploadsEnabled) {
      return res.status(503).json({
        error:
          'Subida de imágenes no configurada. Define CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY y CLOUDINARY_API_SECRET en el entorno del servicio api-service (por ejemplo en un archivo .env en la raíz del proyecto usado por docker compose).',
      });
    }
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({ error: 'Falta el archivo (campo file)' });
    }
    try {
      const b64 = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
      const result = await cloudinary.uploader.upload(b64, {
        folder: 'mercadoliebre',
        resource_type: 'image',
      });
      const url = optimizeCloudinaryUrl(result.secure_url);
      return res.json({ url });
    } catch (e) {
      console.error('POST /api/media/upload:', e);
      return res.status(500).json({ error: e.message || 'Error al subir a Cloudinary' });
    }
  }
);

// ---------- Auth ----------
const handleRegister = async (req, res) => {
  const { email, password, nombre, apellido } = req.body || {};
  if (!email || !password || !nombre || !apellido) {
    return res.status(400).json({ error: 'Faltan campos obligatorios' });
  }
  try {
    const [exists] = await pool.query('SELECT id FROM usuarios WHERE email = ?', [email]);
    if (exists.length) {
      return res.status(409).json({ error: 'Este correo ya está registrado' });
    }
    const id = crypto.randomUUID();
    const password_hash = await bcrypt.hash(password, 10);
    await pool.query(
      'INSERT INTO usuarios (id, email, nombre, apellido, password_hash) VALUES (?, ?, ?, ?, ?)',
      [id, email, nombre, apellido, password_hash]
    );
    const token = signToken({ sub: id, email });
    return res.status(201).json({
      token,
      user: { id, email, nombre, apellido },
      userId: id,
    });
  } catch (e) {
    console.error('POST register:', e);
    const msg =
      process.env.NODE_ENV === 'production'
        ? 'Error al registrar'
        : e.message || 'Error al registrar';
    return res.status(500).json({ error: 'Error al registrar', detail: msg });
  }
};

app.post('/api/auth/register', handleRegister);
/** Alias para evidencias / guías que citan POST /api/registro */
app.post('/api/registro', handleRegister);

const handleLogin = async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: 'Email y contraseña requeridos' });
  }
  try {
    const [rows] = await pool.query(
      'SELECT id, email, nombre, apellido, password_hash FROM usuarios WHERE email = ?',
      [email]
    );
    const u = rows[0];
    if (!u || !u.password_hash) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }
    const ok = await bcrypt.compare(password, u.password_hash);
    if (!ok) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }
    const token = signToken({ sub: u.id, email: u.email });
    return res.json({
      token,
      user: { id: u.id, email: u.email, nombre: u.nombre, apellido: u.apellido },
      userId: u.id,
    });
  } catch (e) {
    console.error('POST login:', e);
    const msg =
      process.env.NODE_ENV === 'production'
        ? 'Error al iniciar sesión'
        : e.message || 'Error al iniciar sesión';
    return res.status(500).json({ error: 'Error al iniciar sesión', detail: msg });
  }
};

app.post('/api/auth/login', handleLogin);
/** Alias para evidencias / guías que citan POST /api/login */
app.post('/api/login', handleLogin);

app.get('/api/auth/me', requireAuth, async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, email, nombre, apellido FROM usuarios WHERE id = ?',
      [req.user.sub]
    );
    const u = rows[0];
    if (!u) return res.status(404).json({ error: 'Usuario no encontrado' });
    return res.json({ id: u.id, email: u.email, nombre: u.nombre, apellido: u.apellido });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Error interno' });
  }
});

// ---------- Tiendas ----------
app.get('/api/tiendas', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM tiendas ORDER BY creado_en DESC');
    const mapped = rows.map((r) => ({
      ...r,
      dias_abierto: parseJsonField(r.dias_abierto, {}),
    }));
    res.json(mapped);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error al listar tiendas' });
  }
});

app.get('/api/tiendas/destacadas', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT * FROM tiendas 
       WHERE imagen_banner_url IS NOT NULL AND imagen_banner_url != '' 
       ORDER BY creado_en DESC LIMIT 6`
    );
    const mapped = rows.map((r) => ({
      ...r,
      dias_abierto: parseJsonField(r.dias_abierto, {}),
    }));
    res.json(mapped);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error al listar destacadas' });
  }
});

app.get('/api/tiendas/mias', requireAuth, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM tiendas WHERE usuario_id = ? LIMIT 1', [
      req.user.sub,
    ]);
    const r = rows[0];
    if (!r) return res.json(null);
    return res.json({
      ...r,
      dias_abierto: parseJsonField(r.dias_abierto, {}),
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error al obtener tienda' });
  }
});

app.get('/api/tiendas/:id', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM tiendas WHERE id = ?', [req.params.id]);
    const r = rows[0];
    if (!r) return res.status(404).json({ error: 'No encontrado' });
    return res.json({
      ...r,
      dias_abierto: parseJsonField(r.dias_abierto, {}),
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error interno' });
  }
});

app.get('/api/tiendas/:id/vista-publica', async (req, res) => {
  try {
    const id = req.params.id;
    const [tRows] = await pool.query('SELECT * FROM tiendas WHERE id = ?', [id]);
    const tienda = tRows[0];
    if (!tienda) return res.status(404).json({ error: 'Tienda no encontrada' });

    const [temRows] = await pool.query('SELECT * FROM temas WHERE tienda_id = ? LIMIT 1', [id]);
    let tema = temRows[0];
    if (!tema) {
      tema = {
        id: 'default',
        tienda_id: id,
        color_primario: '#000000',
        color_secundario: '#333333',
        color_fondo: '#FFFFFF',
        color_texto: '#000000',
        color_texto_titulos: '#000000',
        fuente_titulos: 'Playfair Display',
        fuente_cuerpo: 'Inter',
        estilo_plantilla: 'moderno',
      };
    }

    const [pRows] = await pool.query(
      `SELECT * FROM productos WHERE tienda_id = ? AND activo = TRUE ORDER BY creado_en DESC`,
      [id]
    );
    const productos = pRows.map(mapProductoRow);

    res.json({
      tienda: { ...tienda, dias_abierto: parseJsonField(tienda.dias_abierto, {}) },
      tema,
      productos,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error interno' });
  }
});

app.post('/api/tiendas', requireAuth, async (req, res) => {
  try {
    const id = crypto.randomUUID();
    const body = req.body || {};
    await pool.query(
      `INSERT INTO tiendas (id, usuario_id, nombre, descripcion, eslogan, horario_apertura, horario_cierre, dias_abierto)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        req.user.sub,
        body.nombre || 'Mi Nueva Tienda',
        body.descripcion || 'Bienvenido a nuestro catálogo digital.',
        body.eslogan || 'Lo mejor para ti',
        body.horario_apertura || '09:00',
        body.horario_cierre || '22:00',
        JSON.stringify(
          body.dias_abierto || {
            lunes: true,
            martes: true,
            miercoles: true,
            jueves: true,
            viernes: true,
            sabado: true,
            domingo: true,
          }
        ),
      ]
    );
    const [rows] = await pool.query('SELECT * FROM tiendas WHERE id = ?', [id]);
    const r = rows[0];
    return res.status(201).json({
      ...r,
      dias_abierto: parseJsonField(r.dias_abierto, {}),
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error al crear tienda' });
  }
});

app.patch('/api/tiendas/:id', requireAuth, async (req, res) => {
  try {
    const [own] = await pool.query('SELECT usuario_id FROM tiendas WHERE id = ?', [
      req.params.id,
    ]);
    if (!own.length || own[0].usuario_id !== req.user.sub) {
      return res.status(403).json({ error: 'No autorizado' });
    }
    const allowed = [
      'nombre',
      'descripcion',
      'eslogan',
      'telefono',
      'email',
      'direccion',
      'ciudad',
      'pais',
      'codigo_postal',
      'facebook',
      'instagram',
      'twitter',
      'whatsapp',
      'horario_apertura',
      'horario_cierre',
      'imagen_logo_url',
      'imagen_banner_url',
      'moneda',
      'idioma',
    ];
    const body = req.body || {};
    const updates = [];
    const vals = [];
    for (const k of allowed) {
      if (body[k] !== undefined) {
        updates.push(`${k} = ?`);
        vals.push(body[k]);
      }
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
    return res.json({ ...r, dias_abierto: parseJsonField(r.dias_abierto, {}) });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error al actualizar tienda' });
  }
});

// ---------- Temas ----------
app.get('/api/temas', async (req, res) => {
  const tiendaId = req.query.tienda_id;
  if (!tiendaId) return res.status(400).json({ error: 'tienda_id requerido' });
  try {
    const [rows] = await pool.query('SELECT * FROM temas WHERE tienda_id = ? LIMIT 1', [tiendaId]);
    const r = rows[0];
    if (!r) return res.json(null);
    return res.json(r);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error interno' });
  }
});

app.post('/api/temas', requireAuth, async (req, res) => {
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
        id,
        body.tienda_id,
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
    return res.status(201).json(rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error al crear tema' });
  }
});

app.patch('/api/temas/:id', requireAuth, async (req, res) => {
  try {
    const [tem] = await pool.query('SELECT tienda_id FROM temas WHERE id = ?', [req.params.id]);
    if (!tem.length) return res.status(404).json({ error: 'No encontrado' });
    const [own] = await pool.query('SELECT usuario_id FROM tiendas WHERE id = ?', [tem[0].tienda_id]);
    if (!own.length || own[0].usuario_id !== req.user.sub) {
      return res.status(403).json({ error: 'No autorizado' });
    }
    const allowed = [
      'color_primario',
      'color_secundario',
      'color_fondo',
      'color_texto',
      'color_texto_titulos',
      'fuente_titulos',
      'fuente_cuerpo',
      'estilo_plantilla',
    ];
    const body = req.body || {};
    const updates = [];
    const vals = [];
    for (const k of allowed) {
      if (body[k] !== undefined) {
        updates.push(`${k} = ?`);
        vals.push(body[k]);
      }
    }
    if (!updates.length) {
      const [rows] = await pool.query('SELECT * FROM temas WHERE id = ?', [req.params.id]);
      return res.json(rows[0]);
    }
    vals.push(req.params.id);
    await pool.query(`UPDATE temas SET ${updates.join(', ')} WHERE id = ?`, vals);
    const [rows] = await pool.query('SELECT * FROM temas WHERE id = ?', [req.params.id]);
    return res.json(rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error al actualizar tema' });
  }
});

// ---------- Categorías ----------
app.get('/api/categorias', async (req, res) => {
  const tiendaId = req.query.tienda_id;
  if (!tiendaId) return res.status(400).json({ error: 'tienda_id requerido' });
  try {
    const [rows] = await pool.query(
      'SELECT * FROM categorias WHERE tienda_id = ? ORDER BY orden ASC',
      [tiendaId]
    );
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error interno' });
  }
});

// ---------- Productos ----------
app.get('/api/productos', async (req, res) => {
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
    console.error('Error GET /api/productos:', error);
    res.status(500).json({ error: 'Error interno conectando a la BD' });
  }
});

app.post('/api/productos', requireAuth, async (req, res) => {
  const { nombre, descripcion, precio, tienda_id, categoria, categoria_id, imagen_url, caracteristicas, disponible, activo, destacado } =
    req.body || {};
  if (!tienda_id) return res.status(400).json({ error: 'tienda_id requerido' });
  try {
    const [own] = await pool.query('SELECT usuario_id FROM tiendas WHERE id = ?', [tienda_id]);
    if (!own.length || own[0].usuario_id !== req.user.sub) {
      return res.status(403).json({ error: 'No autorizado' });
    }
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
    res.status(201).json(mapProductoRow(newProduct[0]));
  } catch (error) {
    console.error('Error POST /api/productos:', error);
    res.status(500).json({ error: 'Error al insertar producto en la BD' });
  }
});

app.patch('/api/productos/:id', requireAuth, async (req, res) => {
  try {
    const [p] = await pool.query('SELECT tienda_id FROM productos WHERE id = ?', [req.params.id]);
    if (!p.length) return res.status(404).json({ error: 'No encontrado' });
    const tid = p[0].tienda_id;
    if (tid) {
      const [own] = await pool.query('SELECT usuario_id FROM tiendas WHERE id = ?', [tid]);
      if (!own.length || own[0].usuario_id !== req.user.sub) {
        return res.status(403).json({ error: 'No autorizado' });
      }
    } else {
      return res.status(403).json({ error: 'Producto sin tienda asignada' });
    }
    const body = req.body || {};
    const allowed = [
      'nombre',
      'descripcion',
      'precio',
      'categoria',
      'categoria_id',
      'imagen_url',
      'caracteristicas',
      'disponible',
      'activo',
      'destacado',
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
    res.json(mapProductoRow(rows[0]));
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error al actualizar' });
  }
});

app.delete('/api/productos/:id', requireAuth, async (req, res) => {
  try {
    const [p] = await pool.query('SELECT tienda_id FROM productos WHERE id = ?', [req.params.id]);
    if (!p.length) return res.status(404).json({ error: 'No encontrado' });
    const tid = p[0].tienda_id;
    if (!tid) return res.status(403).json({ error: 'No autorizado' });
    const [own] = await pool.query('SELECT usuario_id FROM tiendas WHERE id = ?', [tid]);
    if (!own.length || own[0].usuario_id !== req.user.sub) {
      return res.status(403).json({ error: 'No autorizado' });
    }
    await pool.query('DELETE FROM productos WHERE id = ?', [req.params.id]);
    res.status(204).end();
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error al eliminar' });
  }
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'API 100% Viva', database_host_target: process.env.DB_HOST });
});

async function bootstrap() {
  try {
    pool = mysql.createPool(dbConfig);
    await waitForDb(pool);
    await ensureUsuariosPasswordHash(pool);
    cloudinaryUploadsEnabled = tryInitCloudinary();
    if (cloudinaryUploadsEnabled) {
      console.log('Cloudinary listo para /api/media/upload');
    } else {
      console.warn(
        'Cloudinary no configurado (CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET). Las subidas de imagen responderán 503.'
      );
    }
    app.listen(port, () => {
      console.log(`Backend API ejecutándose en el puerto ${port}`);
    });
  } catch (e) {
    console.error('Arranque de la API fallido:', e);
    process.exit(1);
  }
}
bootstrap();
