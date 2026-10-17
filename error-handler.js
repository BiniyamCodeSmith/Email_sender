const { ZodError } = require('zod');

function notFound(req, res) {
  res.status(404).json({
    error: { message: `Route not found: ${req.method} ${req.originalUrl}` }
  });
}

function errorHandler(err, req, res, next) {
  if (res.headersSent) return next(err);

  if (err instanceof ZodError) {
    return res.status(400).json({
      error: {
        message: 'Validation failed',
        details: err.issues.map(issue => ({
          field: issue.path.join('.'),
          message: issue.message
        }))
      }
    });
  }

  if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
    return res.status(409).json({ error: { message: 'A record with that value already exists' } });
  }

  const status = err.status || 500;
  if (status >= 500) console.error(err);
  return res.status(status).json({
    error: {
      message: status >= 500 ? 'Internal server error' : err.message,
      ...(err.details ? { details: err.details } : {})
    }
  });
}

module.exports = { notFound, errorHandler };
