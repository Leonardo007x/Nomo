/**
 * Construye la aplicación Express con middlewares y rutas montadas.
 *
 * Patrón factoría: recibe el `pool` ya creado para que pueda ser inyectado
 * en cada router. Esto evita estado global y facilita pruebas.
 */

const express = require('express');
const cors = require('cors');
const requestId = require('./middleware/requestId');
const { httpLogger } = require('./logger');
const createProductosRouter = require('./routes/productos.routes');
const createHealthRouter = require('./routes/health.routes');

function createApp({ pool }) {
  const app = express();

  app.use(cors());
  app.use(express.json({ limit: '2mb' }));
  app.use(requestId);
  app.use(httpLogger);

  app.use('/api/productos', createProductosRouter({ pool }));
  app.use('/api', createHealthRouter({ pool }));

  return app;
}

module.exports = { createApp };
