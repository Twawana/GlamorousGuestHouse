(async function(){
  try{
    const fetch = global.fetch || require('node-fetch');
    const loginRes = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST', headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ email: 'owner@glamorous.com', password: 'Glamorous!23' })
    });
    const login = await loginRes.json();
    console.log('LOGIN:', login);
    if (!login.token) process.exit(1);
    const token = login.token;
    const bookingsRes = await fetch('http://localhost:5000/api/bookings', { headers: { Authorization: `Bearer ${token}` } });
    const bookings = await bookingsRes.json();
    console.log('BOOKINGS:', JSON.stringify(bookings, null, 2));
  } catch (err) { console.error('ERR', err); process.exit(2); }
})();
