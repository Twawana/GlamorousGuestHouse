const pool = require('../db/pool');

(async function () {
  try {
    const from = new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().slice(0, 10);
    const to = new Date().toISOString().slice(0, 10);
    const totalDays = Math.ceil((new Date(to) - new Date(from)) / (1000 * 60 * 60 * 24));

    console.log('from', from, 'to', to, 'totalDays', totalDays);

    try {
      const res = await pool.query(
        `SELECT r.id, r.name,
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
      console.log('occupancy rows:', res.rows.length);
    } catch (err) {
      console.error('occupancy query failed', err.message);
    }

    try {
      const res2 = await pool.query(
        `SELECT r.id, r.name, r.type, r.price_per_night,
          COUNT(b.id) AS total_bookings,
          COUNT(b.id) FILTER (WHERE b.status IN ('approved','completed')) AS confirmed_bookings,
          COALESCE(SUM(b.total_price) FILTER (WHERE b.status IN ('approved','completed')), 0) AS revenue,
          COALESCE(AVG((b.check_out - b.check_in)) FILTER (WHERE b.status IN ('approved','completed')), 0) AS avg_stay_nights,
          ROUND(
            COUNT(b.id) FILTER (WHERE b.status IN ('approved','completed'))::NUMERIC
            / NULLIF(COUNT(b.id), 0) * 100, 1
          ) AS approval_rate_pct
        FROM rooms r
        LEFT JOIN bookings b ON b.room_id = r.id
        GROUP BY r.id
        ORDER BY revenue DESC`
      );
      console.log('room performance rows:', res2.rows.length);
    } catch (err) {
      console.error('room performance query failed', err.message);
    }
  } finally {
    pool.end();
  }
})();