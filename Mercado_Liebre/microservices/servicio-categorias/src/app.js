/** Aplicación Express del servicio Categorías. */
const express = require('express');
const cors = require('cors');
const requestId = require('./middleware/requestId');
const { httpLogger } = require('./logger');
const createCategoriasRouter = require('./routes/categorias.routes');
const createHealthRouter = require('./routes/health.routes');

function createApp({ pool }) {
  const app = express();
  app.use(cors());
  app.use(express.json({ limit: '1mb' }));
  app.use(requestId);
  app.use(httpLogger);

  app.use('/api/categorias', createCategoriasRouter({ pool }));
  app.use('/api', createHealthRouter({ pool }));

  return app;
}

module.exports = { createApp };
