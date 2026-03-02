const express = require('express');
const pool = require('../db/pool');
const { authenticate, requireOwner } = require('../middleware/auth');

const router = express.Router();

// All report routes are owner-only
router.use(authenticate, requireOwner);

const cache = require('../utils/cache');

// ─── GET /api/reports/summary ─────────────────────────────────────────────────
router.get('/summary', async (req, res) => {
  try {
    const cacheKey = 'reports:summary';
    const cached = cache.get(cacheKey);
    if (cached) return res.json(cached);

    const [bookings, revenue, rooms, users] = await Promise.all([
      pool.query(`
        SELECT
          COUNT(*)                                                  AS total_bookings,
          COUNT(*) FILTER (WHERE status = 'pending')               AS pending,
          COUNT(*) FILTER (WHERE status = 'approved')              AS approved,
          COUNT(*) FILTER (WHERE status = 'completed')             AS completed,
          COUNT(*) FILTER (WHERE status = 'rejected')              AS rejected,
          COUNT(*) FILTER (WHERE status = 'cancelled')             AS cancelled
        FROM bookings
      `),
      pool.query(`
        SELECT
          COALESCE(SUM(total_price) FILTER (WHERE status IN ('approved','completed')), 0) AS total_revenue,
          COALESCE(SUM(total_price) FILTER (WHERE status IN ('approved','completed')
            AND DATE_TRUNC('month', created_at) = DATE_TRUNC('month', NOW())), 0)         AS this_month_revenue,
          COALESCE(AVG(total_price) FILTER (WHERE status IN ('approved','completed')), 0) AS avg_booking_value
        FROM bookings
      `),
      pool.query(`
        SELECT
          COUNT(*) AS total_rooms,
          COUNT(*) FILTER (WHERE status = 'available')   AS available,
          COUNT(*) FILTER (WHERE status = 'maintenance') AS maintenance
        FROM rooms
      `),
      pool.query(`SELECT COUNT(*) AS total_users FROM users WHERE role = 'customer'`),
    ]);

    const response = {
      bookings: bookings.rows[0],
      revenue: revenue.rows[0],
      rooms: rooms.rows[0],
      users: users.rows[0],
    };

    cache.set(cacheKey, response, 30 * 1000); // cache 30s
    res.json(response);
  } catch (err) {
    console.error('Summary error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// ─── GET /api/reports/monthly-revenue?year=2026 ───────────────────────────────
router.get('/monthly-revenue', async (req, res) => {
  const year = req.query.year || new Date().getFullYear();
  try {
    const { rows } = await pool.query(
      `SELECT
         EXTRACT(MONTH FROM created_at)::INT           AS month,
         TO_CHAR(created_at, 'Mon')                    AS month_name,
         COALESCE(SUM(total_price), 0)                 AS revenue,
         COUNT(*)                                      AS bookings
       FROM bookings
       WHERE EXTRACT(YEAR FROM created_at) = $1
         AND status IN ('approved', 'completed')
       GROUP BY 1, 2
       ORDER BY 1`,
      [year]
    );
    res.json({ year, monthly_revenue: rows });
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
});

// ─── GET /api/reports/room-performance ───────────────────────────────────────
router.get('/room-performance', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT
        r.id,
        r.name,
        r.type,
        r.price_per_night,
        COUNT(b.id)                                                   AS total_bookings,
        COUNT(b.id) FILTER (WHERE b.status IN ('approved','completed')) AS confirmed_bookings,
        COALESCE(SUM(b.total_price) FILTER (WHERE b.status IN ('approved','completed')), 0) AS revenue,
        COALESCE(
  AVG((b.check_out - b.check_in))
  FILTER (WHERE b.status IN ('approved','completed')),
0) AS avg_stay_nights,
        ROUND(
          COUNT(b.id) FILTER (WHERE b.status IN ('approved','completed'))::NUMERIC
          / NULLIF(COUNT(b.id), 0) * 100, 1
        ) AS approval_rate_pct
      FROM rooms r
      LEFT JOIN bookings b ON b.room_id = r.id
      GROUP BY r.id
      ORDER BY revenue DESC
    `);
    res.json({ room_performance: rows });
  } catch (err) {
    console.error('Room performance error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// ─── GET /api/reports/occupancy?from=&to= ────────────────────────────────────
router.get('/occupancy', async (req, res) => {
  const from = req.query.from || new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().slice(0, 10);
  const to   = req.query.to   || new Date().toISOString().slice(0, 10);
  const totalDays = Math.ceil((new Date(to) - new Date(from)) / (1000 * 60 * 60 * 24));

  try {
    const { rows } = await pool.query(
      `SELECT
         r.id,
         r.name,
         COALESCE(SUM(
           LEAST(b.check_out, $2::DATE) - GREATEST(b.check_in, $1::DATE)
         ) FILTER (WHERE b.status IN ('approved','completed')), 0) AS booked_days,
         $3::INT AS total_days,
         ROUND(
           COALESCE(SUM(
             LEAST(b.check_out, $2::DATE) - GREATEST(b.check_in, $1::DATE)
           ) FILTER (WHERE b.status IN ('approved','completed')), 0)::NUMERIC
           / $3::NUMERIC * 100, 1
         ) AS occupancy_pct
       FROM rooms r
       LEFT JOIN bookings b ON b.room_id = r.id
         AND b.check_in < $2 AND b.check_out > $1
       GROUP BY r.id
       ORDER BY occupancy_pct DESC`,
      [from, to, totalDays]
    );
    res.json({ from, to, total_days: totalDays, occupancy: rows });
  } catch (err) {
    console.error('Occupancy error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

module.exports = router;
