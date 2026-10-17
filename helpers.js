const { createApp } = require('../src/app');
const { createDatabase } = require('../src/db');

function setupTestApp() {
  const db = createDatabase(':memory:');
  const app = createApp({ db });
  return { app, db };
}

async function registerAndLogin(request, app, email = 'test@example.com') {
  const response = await request(app).post('/api/v1/auth/register').send({
    name: 'Test User', email, password: 'StrongPass123'
  });
  return { response, token: response.body?.data?.token };
}

module.exports = { setupTestApp, registerAndLogin };
