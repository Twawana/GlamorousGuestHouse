const pool = require('../db/pool');

(async () => {
  try {
    // Check table structure
    const result = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'notifications'
      ORDER BY ordinal_position
    `);
    
    console.log('Notifications table structure:');
    console.log(result.rows);
    
    // Also try the query that's failing
    console.log('\nTesting the query that fails in the route:');
    const testResult = await pool.query(`
      SELECT id, type, title, message, booking_id, is_read, created_at, updated_at
      FROM notifications
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT 50
    `, ['d190f474-c6b8-4b65-beff-10aa9f050eba']);
    
    console.log('Query result:', testResult.rows);
    console.log('✅ Query works!');
    
  } catch (err) {
    console.error('Error:', err.message);
    console.error('Full error:', err);
  } finally {
    await pool.end();
  }
})();
