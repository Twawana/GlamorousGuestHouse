// simple script to verify owner login works against a running backend
// usage: node scripts/testAdminLogin.js
// optional environment variables:
//   API_BASE (default http://localhost:5000)
//   OWNER_EMAIL (default owner@glamorous.com)
//   OWNER_PASS  (default Glamorous!23 or set to whatever you seeded)

const fetch = global.fetch || require('node-fetch'); // node 18+ has global

const apiBase = process.env.API_BASE || 'http://localhost:5000';
const email = process.env.OWNER_EMAIL || process.env.ADMIN_EMAIL || 'owner@glamorous.com';
const password = process.env.OWNER_PASS || process.env.ADMIN_PASS || 'Glamorous!23';

async function run() {
  console.log(`Testing login to ${apiBase}/api/auth/login`);
  console.log(`Using credentials: ${email} / ${password}`);

  try {
    const res = await fetch(`${apiBase}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();
    if (res.ok) {
      console.log('Login succeeded!');
      console.log('Response:', data);
    } else {
      console.error('Login failed', res.status, data);
      process.exit(1);
    }
  } catch (err) {
    console.error('Request error:', err.message);
    process.exit(1);
  }
}

run();
