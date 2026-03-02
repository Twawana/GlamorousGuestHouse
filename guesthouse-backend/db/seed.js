const pool = require('./pool');
const bcrypt = require('bcryptjs');

async function seed() {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    console.log('🌱 Seeding database...');

    // ───── USERS ─────
    // security: allow override of seed passwords via environment variables
    const ownerPlain = process.env.SEED_OWNER_PASS || process.env.SEED_ADMIN_PASS || 'Glamorous!23';
    const userPlain  = process.env.SEED_USER_PASS  || 'pass123';
    // if requested, remove any existing owner account so we can recreate it
    if (process.env.RESET_OWNER === '1' || process.env.RESET_ADMIN === '1') {
      await client.query(`DELETE FROM users WHERE email = 'owner@glamorous.com'`);
      console.log('Owner record was reset');
    }
    const ownerHash = await bcrypt.hash(ownerPlain, 12);
    const userHash = await bcrypt.hash(userPlain, 12);

    await client.query(
      `
      INSERT INTO users (name, email, password_hash, phone, role)
      VALUES
        ('Owner', 'owner@glamorous.com', $1, '+27 21 555 0000', 'owner'),
        ('Sophie Laurent', 'sophie@email.com', $2, '+27 82 555 0101', 'customer'),
        ('Marco Vitelli', 'marco@email.com', $2, '+27 83 555 0202', 'customer'),
        ('Priya Sharma', 'priya@email.com', $2, '+27 84 555 0303', 'customer')
      ON CONFLICT (email) DO NOTHING
      `,
      [ownerHash, userHash]
    );

    console.log('✅ Users inserted');

    // Debug: show plaintext for testing (only for local dev)
    console.log('Owner plaintext password:', ownerPlain);
    console.log('User plaintext password :', userPlain);
    if (process.env.RESET_OWNER === '1' || process.env.RESET_ADMIN === '1') {
      console.log('Owner record was reset');
    }

    const { rows: users } = await client.query(`SELECT id, email FROM users`);

    const sophieId = users.find(u => u.email === 'sophie@email.com')?.id;
    const marcoId  = users.find(u => u.email === 'marco@email.com')?.id;
    const priyaId  = users.find(u => u.email === 'priya@email.com')?.id;

    // ───── ROOMS ─────
    await client.query(`
      INSERT INTO rooms (name, type, description, price_per_night, capacity, size_sqm, amenities, images, status)
      VALUES
      ('Ivory Suite','suite','Luxury suite.',280,2,65,
        ARRAY['King Bed','Jacuzzi'],
        ARRAY['https://images.unsplash.com/photo-1631049307264-da0ec9d70304'],
        'available'),
      ('Garden Loft','loft','Loft with garden view.',195,3,55,
        ARRAY['Queen Bed','Garden View'],
        ARRAY['https://images.unsplash.com/photo-1586105251261-72a756497a11'],
        'available'),
      ('Onyx Chamber','double','Dark elegant room.',145,2,38,
        ARRAY['Double Bed','Rain Shower'],
        ARRAY['https://images.unsplash.com/photo-1618773928121-c32242e63f39'],
        'maintenance')
      ON CONFLICT DO NOTHING
    `);

    console.log('✅ Rooms inserted');

    // after inserting rooms we need their ids for bookings
    const { rows: rooms } = await client.query(
      `SELECT id, name FROM rooms
       WHERE name IN ('Ivory Suite','Garden Loft','Onyx Chamber')
       ORDER BY id`);

    // ───── BOOKINGS ─────
    if (sophieId && marcoId && priyaId && rooms.length >= 3) {
      await client.query(
        `
        INSERT INTO bookings
        (user_id, room_id, guest_name, guest_email, check_in, check_out, total_price, status, staff_notes)
        VALUES
        ($1, $2, 'Sophie Laurent', 'sophie@email.com', '2026-03-10', '2026-03-13', 840, 'approved', NULL),
        ($3, $4, 'Marco Vitelli', 'marco@email.com', '2026-04-01', '2026-04-04', 585, 'pending', NULL),
        ($5, $6, 'Priya Sharma', 'priya@email.com', '2026-02-28', '2026-03-02', 330, 'approved', 'Late check-in')
        ON CONFLICT DO NOTHING
        `,
        [sophieId, rooms[0].id, marcoId, rooms[1].id, priyaId, rooms[2].id]
      );

      console.log('✅ Bookings inserted');
    }

    await client.query('COMMIT');
    console.log('\n🎉 Database seeded successfully!');
    console.log(`Owner: owner@glamorous.com / ${ownerPlain}`);
    console.log(`User:  sophie@email.com / ${userPlain}`);

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Seed failed:', err.message);
  } finally {
    client.release();
    pool.end();
  }
}

seed();