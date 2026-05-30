import { Router } from 'express';
import pool from '../db/index.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

// GET /api/tasks — list tasks (optionally filtered by ?date=YYYY-MM-DD or ?month=YYYY-MM)
router.get('/', async (req, res) => {
  try {
    let query = 'SELECT * FROM tasks WHERE user_id = $1';
    const params = [req.user.id];

    if (req.query.date) {
      query += ' AND task_date = $2';
      params.push(req.query.date);
    } else if (req.query.month) {
      query += " AND to_char(task_date, 'YYYY-MM') = $2";
      params.push(req.query.month);
    }

    query += ' ORDER BY task_date ASC, task_time ASC, created_at DESC';

    const result = await pool.query(query, params);
    res.json({ tasks: result.rows });
  } catch (err) {
    console.error('Fetch tasks error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/tasks — create task
router.post('/', async (req, res) => {
  try {
    const { title, description, task_date, task_time, location, priority } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }

    const result = await pool.query(
      `INSERT INTO tasks (user_id, title, description, task_date, task_time, location, priority)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [req.user.id, title, description || '', task_date || null, task_time || null, location || '', priority || 'medium']
    );

    res.status(201).json({ task: result.rows[0] });
  } catch (err) {
    console.error('Create task error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /api/tasks/:id — update task (ownership verified)
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Verify ownership
    const owner = await pool.query('SELECT id FROM tasks WHERE id = $1 AND user_id = $2', [id, req.user.id]);
    if (owner.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const { title, description, task_date, task_time, location, priority, done } = req.body;

    const result = await pool.query(
      `UPDATE tasks SET
        title = COALESCE($1, title),
        description = COALESCE($2, description),
        task_date = COALESCE($3, task_date),
        task_time = COALESCE($4, task_time),
        location = COALESCE($5, location),
        priority = COALESCE($6, priority),
        done = COALESCE($7, done)
       WHERE id = $8 AND user_id = $9
       RETURNING *`,
      [title, description, task_date, task_time, location, priority, done, id, req.user.id]
    );

    res.json({ task: result.rows[0] });
  } catch (err) {
    console.error('Update task error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/tasks/:id — delete task (ownership verified)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM tasks WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }

    res.json({ message: 'Task deleted successfully' });
  } catch (err) {
    console.error('Delete task error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
