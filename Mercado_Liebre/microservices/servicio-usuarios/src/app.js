/** Aplicación Express del servicio Usuarios: middlewares + montaje de rutas. */

const express = require('express');
const cors = require('cors');
const requestId = require('./middleware/requestId');
const { httpLogger } = require('./logger');
const createAuthRouter = require('./routes/auth.routes');
const createHealthRouter = require('./routes/health.routes');

function createApp({ pool }) {
  const app = express();
  app.use(cors());
  app.use(express.json({ limit: '2mb' }));
  app.use(requestId);
  app.use(httpLogger);

  app.use('/api', createAuthRouter({ pool }));
  app.use('/api', createHealthRouter({ pool }));

  return app;
}

module.exports = { createApp };
