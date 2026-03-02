/**
 * db/migrate-add-notifications.js
 * Add notifications table to existing database
 */
const pool = require('./pool');

async function migrate() {
  const client = await pool.connect();
  try {
    console.log('🔧 Adding notifications table to schema...');
    
    // Check if notifications table exists
    const checkTable = `SELECT EXISTS(
      SELECT FROM information_schema.tables 
      WHERE table_name = 'notifications'
    )`;
    const result = await client.query(checkTable);
    
    if (!result.rows[0].exists) {
      // Create table without initially adding foreign keys
      await client.query(`
        CREATE TABLE notifications (
          id            SERIAL PRIMARY KEY,
          user_id       INTEGER NOT NULL,
          type          VARCHAR(50) NOT NULL,
          title         VARCHAR(255) NOT NULL,
          message       TEXT NOT NULL,
          booking_id    INTEGER,
          is_read       BOOLEAN NOT NULL DEFAULT FALSE,
          read_at       TIMESTAMPTZ,
          created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `);
      console.log('✓ Created notifications table');
      
      // Add foreign keys
      try {
        await client.query(
          `ALTER TABLE notifications ADD CONSTRAINT fk_notifications_user_id 
           FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE`
        );
        console.log('✓ Added user_id foreign key');
      } catch (err) {
        console.warn('⚠ Could not add user_id foreign key:', err.message);
      }
      
      try {
        await client.query(
          `ALTER TABLE notifications ADD CONSTRAINT fk_notifications_booking_id 
           FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE SET NULL`
        );
        console.log('✓ Added booking_id foreign key');
      } catch (err) {
        console.warn('⚠ Could not add booking_id foreign key:', err.message);
      }
    } else {
      console.log('ℹ Notifications table already exists');
    }
    
    // Create indexes
    await client.query(`CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(is_read)`);
    console.log('✓ Created indexes');
    
    // Create trigger function if it doesn't exist
    await client.query(`
      CREATE OR REPLACE FUNCTION set_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
      $$ LANGUAGE plpgsql;
    `);
    
    // Drop and recreate trigger
    await client.query(`DROP TRIGGER IF EXISTS trg_notifications_updated ON notifications`);
    await client.query(`
      CREATE TRIGGER trg_notifications_updated
        BEFORE UPDATE ON notifications
        FOR EACH ROW EXECUTE FUNCTION set_updated_at()
    `);
    console.log('✓ Created trigger');
    
    console.log('✅ Migration completed successfully!');
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
  } finally {
    client.release();
    pool.end();
  }
}

migrate();
