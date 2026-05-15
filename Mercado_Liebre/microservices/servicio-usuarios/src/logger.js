/** Logger único del servicio: Pino + middleware Pino-HTTP. */

const pino = require('pino');
const pinoHttp = require('pino-http');
const { LOG_LEVEL, SERVICE_NAME } = require('./config');

const logger = pino({ level: LOG_LEVEL, base: { service: SERVICE_NAME } });

const httpLogger = pinoHttp({
  logger,
  genReqId: (req) => req.requestId,
  customProps: (req) => ({ requestId: req.requestId }),
});

module.exports = { logger, httpLogger };
