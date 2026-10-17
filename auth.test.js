const test = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const { setupTestApp, registerAndLogin } = require('./helpers');

test('registers a user and returns a token without password hash', async t => {
  const { app, db } = setupTestApp();
  t.after(() => db.close());
  const { response, token } = await registerAndLogin(request, app);
  assert.equal(response.status, 201);
  assert.ok(token);
  assert.equal(response.body.data.user.email, 'test@example.com');
  assert.equal('password_hash' in response.body.data.user, false);
});

test('rejects duplicate email addresses', async t => {
  const { app, db } = setupTestApp();
  t.after(() => db.close());
  await registerAndLogin(request, app);
  const response = await request(app).post('/api/v1/auth/register').send({
    name: 'Another User', email: 'TEST@example.com', password: 'StrongPass123'
  });
  assert.equal(response.status, 409);
});

test('login returns 401 for invalid credentials', async t => {
  const { app, db } = setupTestApp();
  t.after(() => db.close());
  await registerAndLogin(request, app);
  const response = await request(app).post('/api/v1/auth/login').send({
    email: 'test@example.com', password: 'wrong-password'
  });
  assert.equal(response.status, 401);
});

test('protected profile endpoint requires a token', async t => {
  const { app, db } = setupTestApp();
  t.after(() => db.close());
  const response = await request(app).get('/api/v1/auth/me');
  assert.equal(response.status, 401);
});
