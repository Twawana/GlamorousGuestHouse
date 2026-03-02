const jwt = require('jsonwebtoken');
const pool = require('../db/pool');

(async () => {
  try {
    console.log('Testing notifications API endpoint...\n');

    // 1. Get a user from database
    const userResult = await pool.query('SELECT id, email, role FROM users LIMIT 1');
    if (userResult.rows.length === 0) {
      console.error('No users in database');
      process.exit(1);
    }

    const user = userResult.rows[0];
    console.log('Test user:', user);

    // 2. Generate a valid JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'your_jwt_secret'
    );
    console.log('Generated token:', token.substring(0, 20) + '...\n');

    // 3. Test the API endpoint
    const apiUrl = 'http://localhost:5000/api/notifications';
    console.log(`Making request to: ${apiUrl}`);
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    const responseData = await response.json();
    console.log('Response status:', response.status);
    console.log('Response:', JSON.stringify(responseData, null, 2));

    if (response.ok) {
      console.log('\n✅ API endpoint working!');
    } else {
      console.log('\n❌ API endpoint returned error');
    }

  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await pool.end();
  }
})();
