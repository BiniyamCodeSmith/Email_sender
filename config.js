const path = require('node:path');
require('dotenv').config();

const jwtSecret = process.env.JWT_SECRET;
if (process.env.NODE_ENV === 'production' &&
    (!jwtSecret || jwtSecret.length < 32 ||
     jwtSecret === 'replace_this_with_a_long_random_secret_at_least_32_characters')) {
  throw new Error('Set a strong JWT_SECRET (at least 32 characters) in production.');
}

module.exports = {
  port: Number(process.env.PORT || 3000),
  nodeEnv: process.env.NODE_ENV || 'development',
  jwtSecret: jwtSecret || 'development-only-secret-change-before-deploying-12345',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1h',
  databaseFile: process.env.DATABASE_FILE || path.join(process.cwd(), 'data', 'tasks.db'),
  corsOrigin: process.env.CORS_ORIGIN || '*'
};
