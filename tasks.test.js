const test = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const { setupTestApp, registerAndLogin } = require('./helpers');

test('creates, lists, updates, and deletes a task', async t => {
  const { app, db } = setupTestApp();
  t.after(() => db.close());
  const { token } = await registerAndLogin(request, app);
  const auth = { Authorization: `Bearer ${token}` };

  const created = await request(app).post('/api/v1/tasks').set(auth).send({
    title: 'Build API', description: 'Finish portfolio project', priority: 'high'
  });
  assert.equal(created.status, 201);
  assert.equal(created.body.data.task.title, 'Build API');
  const id = created.body.data.task.id;

  const list = await request(app).get('/api/v1/tasks?status=pending').set(auth);
  assert.equal(list.status, 200);
  assert.equal(list.body.data.tasks.length, 1);

  const updated = await request(app).patch(`/api/v1/tasks/${id}`).set(auth).send({
    status: 'completed'
  });
  assert.equal(updated.status, 200);
  assert.equal(updated.body.data.task.status, 'completed');

  const deleted = await request(app).delete(`/api/v1/tasks/${id}`).set(auth);
  assert.equal(deleted.status, 204);
});

test('rejects invalid task input', async t => {
  const { app, db } = setupTestApp();
  t.after(() => db.close());
  const { token } = await registerAndLogin(request, app);
  const response = await request(app).post('/api/v1/tasks')
    .set('Authorization', `Bearer ${token}`)
    .send({ title: '', priority: 'urgent' });
  assert.equal(response.status, 400);
});

test('a user cannot read another user task', async t => {
  const { app, db } = setupTestApp();
  t.after(() => db.close());
  const first = await registerAndLogin(request, app, 'first@example.com');
  const second = await registerAndLogin(request, app, 'second@example.com');
  const created = await request(app).post('/api/v1/tasks')
    .set('Authorization', `Bearer ${first.token}`)
    .send({ title: 'Private task' });

  const response = await request(app).get(`/api/v1/tasks/${created.body.data.task.id}`)
    .set('Authorization', `Bearer ${second.token}`);
  assert.equal(response.status, 404);
});

test('supports search and pagination', async t => {
  const { app, db } = setupTestApp();
  t.after(() => db.close());
  const { token } = await registerAndLogin(request, app);
  const auth = { Authorization: `Bearer ${token}` };
  await request(app).post('/api/v1/tasks').set(auth).send({ title: 'Read a book' });
  await request(app).post('/api/v1/tasks').set(auth).send({ title: 'Write code' });

  const response = await request(app).get('/api/v1/tasks?q=book&page=1&limit=1').set(auth);
  assert.equal(response.status, 200);
  assert.equal(response.body.data.tasks.length, 1);
  assert.equal(response.body.meta.total, 1);
});
