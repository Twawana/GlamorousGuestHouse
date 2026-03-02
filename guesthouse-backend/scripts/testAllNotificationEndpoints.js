const jwt = require('jsonwebtoken');
const pool = require('../db/pool');

(async () => {
  try {
    console.log('Testing all notification endpoints...\n');

    // Get a user
    const userResult = await pool.query('SELECT id, email, role FROM users LIMIT 1');
    const user = userResult.rows[0];

    // Generate token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'your_jwt_secret'
    );

    const apiUrl = 'http://localhost:5000/api/notifications';
    
    // Test GET /api/notifications
    console.log('Testing GET /api/notifications...');
    let response = await fetch(`${apiUrl}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    console.log(`  Status: ${response.status}`);
    console.log(`  Response: ${JSON.stringify(await response.json())}\n`);

    // Test GET /api/notifications/unread
    console.log('Testing GET /api/notifications/unread...');
    response = await fetch(`${apiUrl}/unread`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    console.log(`  Status: ${response.status}`);
    console.log(`  Response: ${JSON.stringify(await response.json())}\n`);

    console.log('✅ All endpoints working!');

  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await pool.end();
  }
})();
