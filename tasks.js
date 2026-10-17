const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { createTaskSchema, updateTaskSchema, listTasksQuerySchema } = require('../validation/tasks');
const HttpError = require('../utils/http-error');

function createTasksRouter(db) {
  const router = express.Router();
  router.use(requireAuth);

  router.post('/', (req, res, next) => {
    try {
      const input = createTaskSchema.parse(req.body);
      const result = db.prepare(`
        INSERT INTO tasks (user_id, title, description, status, priority, due_date)
        VALUES (@user_id, @title, @description, @status, @priority, @due_date)
      `).run({ user_id: req.user.id, ...input, due_date: input.due_date ?? null });
      const task = db.prepare('SELECT * FROM tasks WHERE id = ? AND user_id = ?')
        .get(result.lastInsertRowid, req.user.id);
      return res.status(201).json({ data: { task } });
    } catch (err) { return next(err); }
  });

  router.get('/', (req, res, next) => {
    try {
      const query = listTasksQuerySchema.parse(req.query);
      const where = ['user_id = @user_id'];
      const params = { user_id: req.user.id };
      if (query.status) { where.push('status = @status'); params.status = query.status; }
      if (query.priority) { where.push('priority = @priority'); params.priority = query.priority; }
      if (query.q) { where.push('(title LIKE @search OR description LIKE @search)'); params.search = `%${query.q}%`; }

      const whereSql = where.join(' AND ');
      const count = db.prepare(`SELECT COUNT(*) AS total FROM tasks WHERE ${whereSql}`).get(params).total;
      const offset = (query.page - 1) * query.limit;
      const sortColumns = { created_at: 'created_at', due_date: 'due_date', priority: 'priority', title: 'title' };
      const order = query.order.toUpperCase();
      const tasks = db.prepare(`
        SELECT * FROM tasks WHERE ${whereSql}
        ORDER BY ${sortColumns[query.sort]} ${order}, id DESC
        LIMIT @limit OFFSET @offset
      `).all({ ...params, limit: query.limit, offset });

      return res.json({
        data: { tasks },
        meta: { page: query.page, limit: query.limit, total: count, totalPages: Math.ceil(count / query.limit) }
      });
    } catch (err) { return next(err); }
  });

  router.get('/:id', (req, res, next) => {
    try {
      const id = parseId(req.params.id);
      const task = db.prepare('SELECT * FROM tasks WHERE id = ? AND user_id = ?').get(id, req.user.id);
      if (!task) throw new HttpError(404, 'Task not found');
      return res.json({ data: { task } });
    } catch (err) { return next(err); }
  });

  router.patch('/:id', (req, res, next) => {
    try {
      const id = parseId(req.params.id);
      const input = updateTaskSchema.parse(req.body);
      const existing = db.prepare('SELECT * FROM tasks WHERE id = ? AND user_id = ?').get(id, req.user.id);
      if (!existing) throw new HttpError(404, 'Task not found');

      const updated = { ...existing, ...input };
      db.prepare(`
        UPDATE tasks
        SET title = @title, description = @description, status = @status,
            priority = @priority, due_date = @due_date,
            updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now')
        WHERE id = @id AND user_id = @user_id
      `).run({
        id, user_id: req.user.id, title: updated.title, description: updated.description,
        status: updated.status, priority: updated.priority, due_date: updated.due_date ?? null
      });
      const task = db.prepare('SELECT * FROM tasks WHERE id = ? AND user_id = ?').get(id, req.user.id);
      return res.json({ data: { task } });
    } catch (err) { return next(err); }
  });

  router.delete('/:id', (req, res, next) => {
    try {
      const id = parseId(req.params.id);
      const result = db.prepare('DELETE FROM tasks WHERE id = ? AND user_id = ?').run(id, req.user.id);
      if (result.changes === 0) throw new HttpError(404, 'Task not found');
      return res.status(204).send();
    } catch (err) { return next(err); }
  });

  return router;
}

function parseId(value) {
  if (!/^[1-9]\d*$/.test(value)) throw new HttpError(400, 'Task ID must be a positive integer');
  const id = Number(value);
  if (!Number.isSafeInteger(id)) throw new HttpError(400, 'Invalid task ID');
  return id;
}

module.exports = { createTasksRouter };
