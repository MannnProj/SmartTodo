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
    const { title, description, task_date, task_time, location, priority, category_id, repeat_type } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }

    const result = await pool.query(
      `INSERT INTO tasks (user_id, title, description, task_date, task_time, location, priority, category_id, repeat_type)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        req.user.id,
        title,
        description || '',
        task_date || null,
        task_time || null,
        location || '',
        priority || 'medium',
        category_id || null,
        repeat_type || 'none'
      ]
    );

    res.status(201).json({ task: result.rows[0] });
  } catch (err) {
    console.error('Create task error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Helper to calculate next task date for recurring tasks
function getNextDate(dateStr, type) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return null;

  if (type === 'daily') {
    d.setDate(d.getDate() + 1);
  } else if (type === 'weekly') {
    d.setDate(d.getDate() + 7);
  } else if (type === 'monthly') {
    d.setMonth(d.getMonth() + 1);
  } else {
    return dateStr;
  }
  return d.toISOString().slice(0, 10);
}

// PATCH /api/tasks/:id — update task (ownership verified)
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Verify ownership
    const owner = await pool.query('SELECT * FROM tasks WHERE id = $1 AND user_id = $2', [id, req.user.id]);
    if (owner.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const existingTask = owner.rows[0];
    const { title, description, task_date, task_time, location, priority, done, category_id, repeat_type } = req.body;

    // Perform update
    const result = await pool.query(
      `UPDATE tasks SET
        title = COALESCE($1, title),
        description = COALESCE($2, description),
        task_date = COALESCE($3, task_date),
        task_time = COALESCE($4, task_time),
        location = COALESCE($5, location),
        priority = COALESCE($6, priority),
        done = COALESCE($7, done),
        category_id = COALESCE($8, category_id),
        repeat_type = COALESCE($9, repeat_type)
       WHERE id = $10 AND user_id = $11
       RETURNING *`,
      [
        title,
        description,
        task_date === undefined ? existingTask.task_date : task_date,
        task_time === undefined ? existingTask.task_time : task_time,
        location,
        priority,
        done,
        category_id === undefined ? existingTask.category_id : category_id,
        repeat_type === undefined ? existingTask.repeat_type : repeat_type,
        id,
        req.user.id
      ]
    );

    const updatedTask = result.rows[0];

    // Handle recurring tasks logic
    // If done is changing from false to true, and repeat_type is active, auto-clone next instance
    if (done === true && !existingTask.done && updatedTask.repeat_type !== 'none') {
      const nextDate = getNextDate(updatedTask.task_date, updatedTask.repeat_type);
      if (nextDate) {
        await pool.query(
          `INSERT INTO tasks (user_id, title, description, task_date, task_time, location, priority, category_id, repeat_type, parent_id)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
          [
            req.user.id,
            updatedTask.title,
            updatedTask.description,
            nextDate,
            updatedTask.task_time,
            updatedTask.location,
            updatedTask.priority,
            updatedTask.category_id,
            updatedTask.repeat_type,
            updatedTask.id
          ]
        );
      }
    }

    res.json({ task: updatedTask });
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
