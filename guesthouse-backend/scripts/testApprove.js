(async function(){
  try{
    const fetch = global.fetch || require('node-fetch');
    const loginRes = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST', headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ email: 'owner@glamorous.com', password: 'Glamorous!23' })
    });
    const login = await loginRes.json();
    if (!login.token) { console.error('Login failed', login); process.exit(1); }
    const token = login.token;
    const bookingId = '7d5faea4-167e-43cd-b363-ed39ab9ee7f4';
    const res = await fetch(`http://localhost:5000/api/bookings/${bookingId}/status`, {
      method: 'PUT', headers: { 'Content-Type':'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ status: 'approved', staff_notes: 'Approved via API test' })
    });
    const data = await res.json();
    console.log('STATUS:', res.status, data);
  } catch (err) { console.error('ERR', err); process.exit(2); }
})();
