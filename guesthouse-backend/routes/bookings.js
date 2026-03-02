const express = require('express');
const pool = require('../db/pool');
const { authenticate, requireStaffOrOwner } = require('../middleware/auth');

const router = express.Router();

// ─── GET /api/bookings  (admin: all | customer: own) ─────────────────────────
router.get('/', authenticate, async (req, res) => {
  const { status, room_id, from, to, page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;
  const params = [];
  const conditions = [];

  // Non-staff/owner customers see only their own bookings
  if (!(['owner','staff','admin'].includes(req.user.role))) {
    params.push(req.user.id);
    conditions.push(`b.user_id = $${params.length}`);
  }

  if (status)  { params.push(status);          conditions.push(`b.status = $${params.length}`); }
  if (room_id) { params.push(Number(room_id));  conditions.push(`b.room_id = $${params.length}`); }
  if (from)    { params.push(from);             conditions.push(`b.check_in >= $${params.length}`); }
  if (to)      { params.push(to);               conditions.push(`b.check_out <= $${params.length}`); }

  const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';

  try {
    const { rows } = await pool.query(
      `SELECT b.*,
              r.name        AS room_name,
              r.type        AS room_type,
              r.images      AS room_images,
              r.price_per_night,
              u.name        AS user_name
       FROM bookings b
       JOIN rooms r ON r.id = b.room_id
       LEFT JOIN users u ON u.id = b.user_id
       ${where}
       ORDER BY b.created_at DESC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset]
    );
    const { rows: count } = await pool.query(
      `SELECT COUNT(*) FROM bookings b ${where}`, params
    );
    res.json({ bookings: rows, total: Number(count[0].count), page: Number(page), limit: Number(limit) });
  } catch (err) {
    console.error('Get bookings error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// ─── GET /api/bookings/:id ────────────────────────────────────────────────────
router.get('/:id', authenticate, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT b.*, r.name AS room_name, r.type AS room_type, r.images AS room_images,
              r.price_per_night, u.name AS user_name
       FROM bookings b
       JOIN rooms r ON r.id = b.room_id
       LEFT JOIN users u ON u.id = b.user_id
       WHERE b.id = $1`,
      [req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Booking not found.' });

    const booking = rows[0];
    // Customers can only see their own booking
    if (!(['owner','staff','admin'].includes(req.user.role)) && booking.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied.' });
    }
    res.json({ booking });
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
});

// ─── POST /api/bookings  (authenticated or guest) ────────────────────────────
router.post('/', async (req, res) => {
  // JWT is optional for guest bookings; check manually
  let userId = null;
  const authHeader = req.headers['authorization'];
  if (authHeader) {
    try {
      const jwt = require('jsonwebtoken');
      const decoded = jwt.verify(authHeader.split(' ')[1], process.env.JWT_SECRET);
      userId = decoded.id;
    } catch (_) {}
  }

  const { room_id, guest_name, guest_email, guest_phone, check_in, check_out, special_requests } = req.body;

  if (!room_id || !guest_name || !guest_email || !check_in || !check_out) {
    return res.status(400).json({ error: 'room_id, guest_name, guest_email, check_in, and check_out are required.' });
  }
  if (new Date(check_out) <= new Date(check_in)) {
    return res.status(400).json({ error: 'check_out must be after check_in.' });
  }
  if (new Date(check_in) < new Date()) {
    return res.status(400).json({ error: 'check_in cannot be in the past.' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Lock room row to prevent race conditions
    const { rows: roomRows } = await client.query(
      'SELECT * FROM rooms WHERE id = $1 FOR UPDATE', [room_id]
    );
    if (roomRows.length === 0) { await client.query('ROLLBACK'); return res.status(404).json({ error: 'Room not found.' }); }
    const room = roomRows[0];
    if (room.status !== 'available') { await client.query('ROLLBACK'); return res.status(409).json({ error: 'Room is not available.' }); }

    // Check for booking conflicts
    const { rows: conflicts } = await client.query(
      `SELECT id FROM bookings
       WHERE room_id = $1
         AND status IN ('approved', 'pending')
         AND check_in  < $3
         AND check_out > $2`,
      [room_id, check_in, check_out]
    );
    if (conflicts.length > 0) {
      await client.query('ROLLBACK');
      return res.status(409).json({ error: 'Room is already booked for the selected dates.' });
    }

    // Check blocked dates
    const { rows: blocked } = await client.query(
      `SELECT blocked_on FROM blocked_dates WHERE room_id = $1 AND blocked_on >= $2 AND blocked_on < $3`,
      [room_id, check_in, check_out]
    );
    if (blocked.length > 0) {
      await client.query('ROLLBACK');
      return res.status(409).json({ error: 'Some dates in your range are blocked.', blocked_dates: blocked.map(b => b.blocked_on) });
    }

    // Calculate total
    const nights = Math.ceil((new Date(check_out) - new Date(check_in)) / (1000 * 60 * 60 * 24));
    const total_price = nights * room.price_per_night;

    const { rows } = await client.query(
      `INSERT INTO bookings (user_id, room_id, guest_name, guest_email, guest_phone, check_in, check_out, total_price, special_requests)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [userId, room_id, guest_name, guest_email.toLowerCase(), guest_phone || null,
       check_in, check_out, total_price, special_requests || null]
    );

    await client.query('COMMIT');
    res.status(201).json({
      message: 'Booking submitted. Awaiting staff approval.',
      booking: { ...rows[0], room_name: room.name, nights, total_price },
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Create booking error:', err);
    res.status(500).json({ error: 'Server error.' });
  } finally {
    client.release();
  }
});

// ─── PUT /api/bookings/:id/status  (staff or owner) ──────────────────────────
router.put('/:id/status', authenticate, requireStaffOrOwner, async (req, res) => {
  const { status, staff_notes } = req.body;
  const validTransitions = ['approved', 'rejected', 'completed', 'cancelled'];
  if (!validTransitions.includes(status)) {
    return res.status(400).json({ error: `status must be one of: ${validTransitions.join(', ')}` });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    // If approving, ensure there are no conflicting approved bookings for the same room
    if (status === 'approved') {
      const targetSql = `SELECT room_id, check_in, check_out FROM bookings WHERE id::text = $1::text`;
      console.log('DEBUG: running target query', targetSql, [req.params.id]);
      const { rows: targetRows } = await client.query(targetSql, [req.params.id]);
      if (targetRows.length === 0) { 
        await client.query('ROLLBACK'); 
        client.release(); 
        return res.status(404).json({ error: 'Booking not found.' }); 
      }
      const { room_id: roomId, check_in: tCheckIn, check_out: tCheckOut } = targetRows[0];
      const conflictSql = `SELECT id FROM bookings WHERE id::text != $1::text AND room_id::text = $2::text AND status = 'approved' AND check_in < $4 AND check_out > $3`;
      console.log('DEBUG: running conflict check', conflictSql, [req.params.id, roomId, tCheckIn, tCheckOut]);
      const { rows: existing } = await client.query(conflictSql, [req.params.id, roomId, tCheckIn, tCheckOut]);
      if (existing.length > 0) { 
        await client.query('ROLLBACK'); 
        client.release(); 
        return res.status(409).json({ error: 'Cannot approve: room already has an approved booking for these dates.' }); 
      }
    }

    const updateSql = `
      UPDATE bookings
SET status = $1::varchar,
    staff_notes = COALESCE($2, staff_notes),
    approved_by = CASE WHEN $1::varchar = 'approved' THEN $3 ELSE approved_by END,
    approved_at = CASE WHEN $1::varchar = 'approved' THEN NOW() ELSE approved_at END,
    cancelled_at = CASE WHEN $1::varchar = 'cancelled' THEN NOW() ELSE cancelled_at END
WHERE id = $4
RETURNING *
    `;
    
    console.log('DEBUG: running update', updateSql, [status, staff_notes || null, req.user.id, req.params.id]);
    const { rows } = await client.query(updateSql, [status, staff_notes || null, req.user.id, req.params.id]);
    
    if (rows.length === 0) {
      await client.query('ROLLBACK');
      client.release();
      return res.status(404).json({ error: 'Booking not found.' });
    }

    // Log staff action in audit table (use the same client/transaction)
    try {
      await client.query(
        `INSERT INTO staff_actions (actor_id, actor_role, action, target_table, target_id, details)
         VALUES ($1,$2,$3,$4,$5,$6)`,
        [req.user.id, req.user.role, `update_booking_status:${status}`, 'bookings', String(req.params.id), JSON.stringify({ staff_notes: staff_notes || null })]
      );
    } catch (auditErr) {
      console.error('Audit insert failed:', auditErr);
    }

    await client.query('COMMIT');
    client.release();
    res.json({ message: `Booking ${status}.`, booking: rows[0] });
  } catch (err) {
    try { await client.query('ROLLBACK'); } catch (_) {}
    client.release();
    console.error('Update status error:', err.stack || err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// ─── DELETE /api/bookings/:id  (customer cancels own booking) ─────────────────
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM bookings WHERE id = $1', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Booking not found.' });

    const booking = rows[0];
    if (!(['owner','staff','admin'].includes(req.user.role)) && booking.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied.' });
    }
    if (!['pending', 'approved'].includes(booking.status)) {
      return res.status(400).json({ error: 'Only pending or approved bookings can be cancelled.' });
    }

    await pool.query(
      `UPDATE bookings SET status = 'cancelled', cancelled_at = NOW() WHERE id = $1`,
      [req.params.id]
    );
    res.json({ message: 'Booking cancelled.' });
  } catch (err) {
    console.error('Cancel booking error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

module.exports = router;