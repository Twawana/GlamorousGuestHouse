const express = require('express');
const pool = require('../db/pool');
const { authenticate, requireOwner } = require('../middleware/auth');

const router = express.Router();

// ─── GET /api/users  (admin only) ────────────────────────────────────────────
router.get('/', authenticate, requireOwner, async (req, res) => {
  const { role, page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;
  const params = [];
  const conditions = [];

  if (role) { params.push(role); conditions.push(`role = $${params.length}`); }
  const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';

  try {
    const { rows } = await pool.query(
      `SELECT id, name, email, phone, role, created_at,
         (SELECT COUNT(*) FROM bookings b WHERE b.user_id = u.id) AS booking_count
       FROM users u ${where}
       ORDER BY created_at DESC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset]
    );
    const { rows: count } = await pool.query(`SELECT COUNT(*) FROM users ${where}`, params);
    res.json({ users: rows, total: Number(count[0].count) });
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
});

// ─── GET /api/users/:id  (admin only) ────────────────────────────────────────
router.get('/:id', authenticate, requireOwner, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, name, email, phone, role, created_at FROM users WHERE id = $1`,
      [req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'User not found.' });
    res.json({ user: rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
});

// ─── PUT /api/users/:id/role  (admin only) ───────────────────────────────────
router.put('/:id/role', authenticate, requireOwner, async (req, res) => {
  const { role } = req.body;
  if (!['customer', 'owner', 'staff'].includes(role)) {
    return res.status(400).json({ error: 'role must be customer, owner or staff.' });
  }
  try {
    const { rows } = await pool.query(
      'UPDATE users SET role = $1 WHERE id = $2 RETURNING id, name, email, role',
      [role, req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'User not found.' });
    res.json({ user: rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
});

// ─── DELETE /api/users/:id  (owner only) ────────────────────────────────────
router.delete('/:id', authenticate, requireOwner, async (req, res) => {
  if (Number(req.params.id) === req.user.id) {
    return res.status(400).json({ error: 'You cannot delete your own account.' });
  }
  try {
    const { rowCount } = await pool.query('DELETE FROM users WHERE id = $1', [req.params.id]);
    if (rowCount === 0) return res.status(404).json({ error: 'User not found.' });
    res.json({ message: 'User deleted.' });
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
});

module.exports = router;
