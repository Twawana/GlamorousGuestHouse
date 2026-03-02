const pool = require('../db/pool');

(async () => {
  try {
    console.log('Fixing notifications table user_id type...\n');

    // Drop and recreate the notifications table with correct types
    await pool.query(`DROP TABLE IF EXISTS notifications CASCADE`);
    console.log('✓ Dropped old notifications table');

    await pool.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        type VARCHAR(50) NOT NULL,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        booking_id INTEGER,
        is_read BOOLEAN NOT NULL DEFAULT false,
        read_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ Created notifications table with correct schema');

    // Add indexes
    await pool.query(`CREATE INDEX idx_notifications_user_id ON notifications(user_id)`);
    await pool.query(`CREATE INDEX idx_notifications_is_read ON notifications(is_read)`);
    console.log('✓ Added indexes');

    console.log('\n✅ Migration completed successfully!');
    
  } catch (err) {
    console.error('Migration error:', err.message);
  } finally {
    await pool.end();
  }
})();
