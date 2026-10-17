const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const config = require('./config');
const { createDatabase } = require('./db');
const { createAuthRouter } = require('./routes/auth');
const { createTasksRouter } = require('./routes/tasks');
const { notFound, errorHandler } = require('./middleware/error-handler');

function createApp(options = {}) {
  const db = options.db || createDatabase(options.databaseFile);
  const app = express();

  app.disable('x-powered-by');
  app.use(helmet());
  app.use(cors({
    origin: config.corsOrigin === '*' ? '*' : config.corsOrigin.split(',').map(item => item.trim())
  }));
  app.use(express.json({ limit: '20kb' }));

  app.get('/health', (req, res) => res.json({ status: 'ok' }));
  app.use('/api/v1/auth', createAuthRouter(db));
  app.use('/api/v1/tasks', createTasksRouter(db));
  app.use(notFound);
  app.use(errorHandler);

  app.locals.db = db;
  return app;
}

module.exports = { createApp };
