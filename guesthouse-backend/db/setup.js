/**
 * db/setup.js
 * Run once to create all tables: `npm run db:setup`
 */
const pool = require('./pool');

const schema = `

-- ─── Extensions ──────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── Users ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id            SERIAL PRIMARY KEY,
  name          VARCHAR(120) NOT NULL,
  email         VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  phone         VARCHAR(30),
  role          VARCHAR(20) NOT NULL DEFAULT 'customer'  -- 'customer' | 'admin'
                CHECK (role IN ('customer', 'owner', 'staff')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Rooms ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS rooms (
  id            SERIAL PRIMARY KEY,
  name          VARCHAR(120) NOT NULL,
  type          VARCHAR(50)  NOT NULL,
  description   TEXT,
  price_per_night NUMERIC(10,2) NOT NULL,
  capacity      INTEGER NOT NULL DEFAULT 2,
  size_sqm      INTEGER,
  amenities     TEXT[]       NOT NULL DEFAULT '{}',
  images        TEXT[]       NOT NULL DEFAULT '{}',  -- array of image URLs
  status        VARCHAR(30)  NOT NULL DEFAULT 'available'
                CHECK (status IN ('available', 'maintenance', 'disabled')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Blocked Dates ───────────────────────────────────────────────────────────
-- Staff can manually block dates per room
CREATE TABLE IF NOT EXISTS blocked_dates (
  id          SERIAL PRIMARY KEY,
  room_id     INTEGER NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  blocked_on  DATE NOT NULL,
  reason      VARCHAR(255),
  created_by  INTEGER REFERENCES users(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (room_id, blocked_on)
);

-- ─── Bookings ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS bookings (
  id              SERIAL PRIMARY KEY,
  booking_ref     VARCHAR(12) UNIQUE NOT NULL DEFAULT 'BK' || UPPER(SUBSTR(gen_random_uuid()::TEXT, 1, 6)),
  user_id         INTEGER REFERENCES users(id) ON DELETE SET NULL,
  room_id         INTEGER NOT NULL REFERENCES rooms(id),
  guest_name      VARCHAR(120) NOT NULL,
  guest_email     VARCHAR(255) NOT NULL,
  guest_phone     VARCHAR(30),
  check_in        DATE NOT NULL,
  check_out       DATE NOT NULL,
  nights          INTEGER GENERATED ALWAYS AS ((check_out - check_in)) STORED,
  total_price     NUMERIC(10,2) NOT NULL,
  status          VARCHAR(30) NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled', 'completed')),
  staff_notes     TEXT,
  special_requests TEXT,
  approved_by     INTEGER REFERENCES users(id),
  approved_at     TIMESTAMPTZ,
  cancelled_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT valid_dates CHECK (check_out > check_in)
);

-- ─── Staff actions audit ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS staff_actions (
  id          SERIAL PRIMARY KEY,
  actor_id    INTEGER REFERENCES users(id),
  actor_role  VARCHAR(20) NOT NULL,
  action      VARCHAR(100) NOT NULL,
  target_table VARCHAR(100),
  target_id   TEXT,
  details     JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Payments (Phase 2 ready) ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS payments (
  id              SERIAL PRIMARY KEY,
  booking_id      INTEGER NOT NULL REFERENCES bookings(id),
  amount          NUMERIC(10,2) NOT NULL,
  currency        VARCHAR(5) NOT NULL DEFAULT 'USD',
  method          VARCHAR(50),   -- 'card', 'payfast', 'manual', etc.
  status          VARCHAR(30) NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending', 'paid', 'failed', 'refunded')),
  provider_ref    VARCHAR(255),  -- external payment gateway reference
  paid_at         TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Notifications ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
  id            SERIAL PRIMARY KEY,
  user_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type          VARCHAR(50) NOT NULL,  -- 'booking_pending', 'booking_approved', 'booking_rejected', 'booking_cancelled'
  title         VARCHAR(255) NOT NULL,
  message       TEXT NOT NULL,
  booking_id    INTEGER REFERENCES bookings(id) ON DELETE SET NULL,
  is_read       BOOLEAN NOT NULL DEFAULT FALSE,
  read_at       TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Indexes ──────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_bookings_user      ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_room      ON bookings(room_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status    ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_dates     ON bookings(check_in, check_out);
CREATE INDEX IF NOT EXISTS idx_blocked_room_date  ON blocked_dates(room_id, blocked_on);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(is_read);

-- ─── Auto-update updated_at ──────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_users_updated   ON users;
DROP TRIGGER IF EXISTS trg_rooms_updated   ON rooms;
DROP TRIGGER IF EXISTS trg_bookings_updated ON bookings;
DROP TRIGGER IF EXISTS trg_notifications_updated ON notifications;

CREATE TRIGGER trg_users_updated
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_rooms_updated
  BEFORE UPDATE ON rooms
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_bookings_updated
  BEFORE UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_notifications_updated
  BEFORE UPDATE ON notifications
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
`;

async function setup() {
  const client = await pool.connect();
  try {
    console.log('🔧 Creating database schema...');
    await client.query(schema);
    console.log('✅ Schema created successfully!');
    console.log('👉 Now run: npm run db:seed');
  } catch (err) {
    console.error('❌ Schema creation failed:', err.message);
  } finally {
    client.release();
    pool.end();
  }
}

setup();
