import { Router } from 'express';
import pool from '../db/index.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

// GET /api/dashboard/stats — dashboard widgets
router.get('/stats', async (req, res) => {
  try {
    const userId = req.user.id;

    // 1. General counts
    const generalStats = await pool.query(
      `SELECT 
         COUNT(*) as total,
         COUNT(*) FILTER (WHERE done = true) as completed,
         COUNT(*) FILTER (WHERE done = false) as pending,
         COUNT(*) FILTER (WHERE done = false AND priority = 'high') as high_priority
       FROM tasks 
       WHERE user_id = $1`,
      [userId]
    );

    const stats = {
      total: parseInt(generalStats.rows[0].total || 0),
      completed: parseInt(generalStats.rows[0].completed || 0),
      pending: parseInt(generalStats.rows[0].pending || 0),
      highPriority: parseInt(generalStats.rows[0].high_priority || 0),
    };

    stats.completionRate = stats.total > 0 ? Math.round((stats.completed * 100) / stats.total) : 0;

    // 2. Daily completion (last 7 days including today)
    const dailyStats = await pool.query(
      `SELECT 
         d.day::date as date,
         to_char(d.day, 'Dy') as name,
         COUNT(t.id) as total,
         COUNT(t.id) FILTER (WHERE t.done = true) as completed
       FROM generate_series(CURRENT_DATE - INTERVAL '6 days', CURRENT_DATE, '1 day'::interval) d(day)
       LEFT JOIN tasks t ON t.user_id = $1 AND t.task_date = d.day::date
       GROUP BY d.day
       ORDER BY d.day ASC`,
      [userId]
    );

    const daily = dailyStats.rows.map(row => ({
      date: row.date,
      name: row.name,
      total: parseInt(row.total || 0),
      completed: parseInt(row.completed || 0),
    }));

    // 3. Category breakdown
    const categoryStats = await pool.query(
      `SELECT 
         c.id as category_id,
         c.name as category_name,
         c.color as category_color,
         COUNT(t.id) as total,
         COUNT(t.id) FILTER (WHERE t.done = true) as completed
       FROM categories c
       LEFT JOIN tasks t ON t.category_id = c.id
       WHERE c.user_id = $1
       GROUP BY c.id, c.name, c.color
       ORDER BY total DESC`,
      [userId]
    );

    const categories = categoryStats.rows.map(row => ({
      id: row.category_id,
      name: row.category_name,
      color: row.category_color,
      total: parseInt(row.total || 0),
      completed: parseInt(row.completed || 0),
    }));

    res.json({
      stats,
      daily,
      categories,
    });
  } catch (err) {
    console.error('Fetch dashboard stats error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
