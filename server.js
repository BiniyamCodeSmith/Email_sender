const { createApp } = require('./app');
const config = require('./config');

const app = createApp();
const server = app.listen(config.port, () => {
  console.log(`Task Management API listening on http://localhost:${config.port}`);
});

function shutdown(signal) {
  console.log(`${signal} received. Shutting down...`);
  server.close(() => {
    app.locals.db.close();
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10000).unref();
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
