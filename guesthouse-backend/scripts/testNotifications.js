const pool = require('../db/pool');

(async () => {
  try {
    console.log('Testing notifications table...');
    const result = await pool.query(
      `SELECT id, user_id, type, title, message, is_read, created_at FROM notifications LIMIT 1`
    );
    console.log('✓ Notifications table query succeeded');
    console.log('Sample row:', result.rows[0] || 'No rows');
  } catch (err) {
    console.error('✗ Query error:', err.message);
  } finally {
    pool.end();
  }
})();
