const { Pool } = require('pg');
require('dotenv').config();

// make sure password is string (pg requires it)
const rawPassword = process.env.DB_PASSWORD;
const password = typeof rawPassword === 'string' ? rawPassword : '';
if (rawPassword !== undefined && typeof rawPassword !== 'string') {
  console.warn('DB_PASSWORD environment variable is not a string; coercing to string');
}
if (!password) {
  console.error('DB_PASSWORD environment variable is not set. Please create a .env file or set it before running the server.');
  process.exit(1);
}

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'glamorous_guesthouse',
  user: process.env.DB_USER || 'postgres',
  password,
  max: 20,                  // max pool connections
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle PostgreSQL client', err);
  process.exit(-1);
});

// Test connection on startup
pool.connect((err, client, release) => {
  if (err) {
    console.error('❌ Failed to connect to PostgreSQL:', err.message);
  } else {
    console.log('✅ Connected to PostgreSQL database');
    release();
  }
});

module.exports = pool;
