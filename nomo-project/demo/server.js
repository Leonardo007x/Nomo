const express = require('express');
const path = require('path');
const { Pool } = require('pg');

const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, 'frontend')));

const pool = new Pool({
  user: 'postgres',
  host: 'supabase-db',
  database: 'postgres',
  password: 'postgres',
  port: 5432
});

async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL
    )
  `);

  await pool.query(`
    INSERT INTO users (email, password)
    VALUES ('demo@ejemplo.com', 'demo123')
    ON CONFLICT (email) DO NOTHING
  `);
}

initDb().catch(err => {
  console.error('Error inicializando la base de datos:', err);
});

// Ruta simple para ver que el backend responde
app.get('/health', (req, res) => res.send('Backend OK'));

// Endpoint de login que valida contra la base de datos
app.post('/login', async (req, res) => {
  const { email, password } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({
      ok: false,
      message: 'Faltan email o contraseña'
    });
  }

  try {
    const result = await pool.query(
      'SELECT id, email FROM users WHERE email = $1 AND password = $2',
      [email, password]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        ok: false,
        message: 'Credenciales inválidas'
      });
    }

    return res.json({
      ok: true,
      message: 'Login correcto',
      user: result.rows[0]
    });
  } catch (err) {
    console.error('Error en /login:', err);
    return res.status(500).json({
      ok: false,
      message: 'Error interno en el servidor'
    });
  }
});

app.listen(3000, () => console.log('Backend on 3000'));