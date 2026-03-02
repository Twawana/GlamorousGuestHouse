const express = require('express');
const pool = require('../db/pool');
const { authenticate, requireStaffOrOwner, requireOwner } = require('../middleware/auth');
const cache = require('../utils/cache');

const router = express.Router();

// ─── GET /api/rooms  (public) ─────────────────────────────────────────────────
// Query params: type, status, min_price, max_price, capacity, page, limit
router.get('/', async (req, res) => {
  const { type, status, min_price, max_price, capacity, page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;
  const params = [];
  const conditions = [];

  if (type)      { params.push(type);            conditions.push(`type = $${params.length}`); }
  if (status)    { params.push(status);           conditions.push(`status = $${params.length}`); }
  if (min_price) { params.push(Number(min_price)); conditions.push(`price_per_night >= $${params.length}`); }
  if (max_price) { params.push(Number(max_price)); conditions.push(`price_per_night <= $${params.length}`); }
  if (capacity)  { params.push(Number(capacity)); conditions.push(`capacity >= $${params.length}`); }

  const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';

  try {
    // Check cache first (cache key includes query params)
    const cacheKey = `rooms:${type || ''}:${status || ''}:${min_price || ''}:${max_price || ''}:${capacity || ''}:p${page}:l${limit}`;
    const cached = cache.get(cacheKey);
    if (cached) return res.json(cached);

    const { rows } = await pool.query(
      `SELECT * FROM rooms ${where} ORDER BY id LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset]
    );
    const { rows: count } = await pool.query(
      `SELECT COUNT(*) FROM rooms ${where}`, params
    );
    const result = { rooms: rows, total: Number(count[0].count), page: Number(page), limit: Number(limit) };
    cache.set(cacheKey, result, 30 * 1000); // cache 30s
    res.json(result);
  } catch (err) {
    console.error('Get rooms error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// ─── GET /api/rooms/:id  (public) ────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM rooms WHERE id = $1', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Room not found.' });
    res.json({ room: rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
});

// ─── GET /api/rooms/:id/availability?check_in=&check_out= (public) ───────────
router.get('/:id/availability', async (req, res) => {
  const { check_in, check_out } = req.query;
  if (!check_in || !check_out) {
    return res.status(400).json({ error: 'check_in and check_out dates are required.' });
  }

  try {
    // Check room exists and is not in maintenance
    const { rows: roomRows } = await pool.query('SELECT status FROM rooms WHERE id = $1', [req.params.id]);
    if (roomRows.length === 0) return res.status(404).json({ error: 'Room not found.' });
    if (roomRows[0].status !== 'available') {
      return res.json({ available: false, reason: 'Room is not available for booking.' });
    }

    // Check for overlapping approved/pending bookings
    const { rows: conflicts } = await pool.query(
      `SELECT id FROM bookings
       WHERE room_id = $1
         AND status IN ('approved', 'pending')
         AND check_in  < $3
         AND check_out > $2`,
      [req.params.id, check_in, check_out]
    );

    // Check for manually blocked dates in the requested range
    const { rows: blocked } = await pool.query(
      `SELECT blocked_on FROM blocked_dates
       WHERE room_id = $1
         AND blocked_on >= $2
         AND blocked_on <  $3`,
      [req.params.id, check_in, check_out]
    );

    const available = conflicts.length === 0 && blocked.length === 0;
    res.json({
      available,
      blocked_dates: blocked.map(b => b.blocked_on),
      reason: !available ? 'Room is already booked or blocked for selected dates.' : null,
    });
  } catch (err) {
    console.error('Availability check error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// ─── POST /api/rooms  (staff/owner only) ─────────────────────────────────────
router.post('/', authenticate, requireStaffOrOwner, async (req, res) => {
  try {
    const { name, type, description, price_per_night, capacity, size_sqm, amenities, status, images } = req.body;
    
    const { rows } = await pool.query(
      `INSERT INTO rooms (name, type, description, price_per_night, capacity, size_sqm, amenities, status, images)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [name, type, description, price_per_night, capacity, size_sqm, amenities, status, images || []]
    );
    
    res.status(201).json({ room: rows[0] });
  } catch (err) {
    console.error('Create room error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// ─── PUT /api/rooms/:id  (staff/owner only) ──────────────────────────────────
router.put('/:id', authenticate, requireStaffOrOwner, async (req, res) => {
  try {
    const { name, type, description, price_per_night, capacity, size_sqm, amenities, status, images } = req.body;
    
    const { rows } = await pool.query(
      `UPDATE rooms 
       SET name = COALESCE($1, name),
           type = COALESCE($2, type),
           description = COALESCE($3, description),
           price_per_night = COALESCE($4, price_per_night),
           capacity = COALESCE($5, capacity),
           size_sqm = COALESCE($6, size_sqm),
           amenities = COALESCE($7, amenities),
           status = COALESCE($8, status),
           images = COALESCE($9, images)
       WHERE id = $10 RETURNING *`,
      [name, type, description, price_per_night, capacity, size_sqm, amenities, status, images || [], req.params.id]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Room not found.' });
    }
    
    res.json({ room: rows[0] });
  } catch (err) {
    console.error('Update room error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// ─── DELETE /api/rooms/:id  (owner only) ────────────────────────────────────
router.delete('/:id', authenticate, requireOwner, async (req, res) => {
  try {
    const { rowCount } = await pool.query('DELETE FROM rooms WHERE id = $1', [req.params.id]);
    if (rowCount === 0) return res.status(404).json({ error: 'Room not found.' });
    res.json({ message: 'Room deleted.' });
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
});

// ─── POST /api/rooms/:id/block-dates  (owner only) ──────────────────────────
router.post('/:id/block-dates', authenticate, requireOwner, async (req, res) => {
  const { dates, reason } = req.body; // dates: string[]
  if (!dates || !dates.length) return res.status(400).json({ error: 'dates array is required.' });
  try {
    const values = dates.map((d, i) => `($1, $${i + 2}, $${dates.length + 2}, $${dates.length + 3})`).join(',');
    await pool.query(
      `INSERT INTO blocked_dates (room_id, blocked_on, reason, created_by) VALUES ${values} ON CONFLICT DO NOTHING`,
      [req.params.id, ...dates, reason || null, req.user.id]
    );
    res.json({ message: `${dates.length} date(s) blocked.` });
  } catch (err) {
    console.error('Block dates error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

module.exports = router;