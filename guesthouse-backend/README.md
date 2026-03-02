# Glamorous GuestHouse — Backend API

Node.js + Express + PostgreSQL REST API for the Glamorous GuestHouse Booking System.

---

## 🚀 Quick Start

### 1. Prerequisites
- Node.js 18+
- PostgreSQL 14+

### 2. Create the database
```sql
-- In psql or pgAdmin:
CREATE DATABASE glamorous_guesthouse;
```

### 3. Configure environment
```bash
cp .env.example .env
# Edit .env with your DB credentials and a strong JWT_SECRET
```

### 4. Install dependencies
```bash
npm install
```

### 5. Create tables
```bash
npm run db:setup
```

### 6. Seed demo data
You can override the seeded passwords or reset the admin account using environment variables:

```bash
# normal seed uses default complex admin password
npm run db:seed

# customize passwords (example):
SEED_ADMIN_PASS="Glamorous!23" SEED_USER_PASS="pass123" npm run db:seed

# force deletion of existing admin and recreate (useful during development):
RESET_ADMIN=1 npm run db:seed
```

### 7. Start the server
```bash
npm run dev      # development (auto-reload)
npm start        # production
```

Server runs at: **http://localhost:5000**

---

## 🔐 Authentication

All protected routes require a Bearer token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

Tokens are obtained from `/api/auth/login` or `/api/auth/register`.

### Demo Accounts (after seeding)
| Role     | Email                   | Password  |
|----------|-------------------------|-----------|
| Admin    | admin@glamorous.com     | Glamorous!23 (default) |
| Customer | sophie@email.com        | pass123   |
| Customer | marco@email.com         | pass123   |

---

## 📋 API Reference

### Auth

> **Env helpers**
>
> - `ADMIN_FALLBACK_PASSWORD` – if set, any admin login that fails bcrypt comparison will also try this value. Handy for local development.

| Method | Endpoint             | Auth     | Description              |
|--------|----------------------|----------|--------------------------|
| POST   | /api/auth/register   | None     | Create customer account  |
| POST   | /api/auth/login      | None     | Login, get JWT token     |
| GET    | /api/auth/me         | Required | Get current user profile |
| PUT    | /api/auth/profile    | Required | Update name/phone        |

#### POST /api/auth/register
```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "securepass",
  "phone": "+27 82 000 0000"
}
```

#### POST /api/auth/login
```json
{
  "email": "sophie@email.com",
  "password": "pass123"
}
```
Response includes `token` and `user` object.

You can also verify admin credentials quickly with the supplied test script:
```bash
# make sure your server is running
npm run test:admin
# or provide custom values:
API_BASE=http://localhost:5000 ADMIN_PASS="YourPass" npm run test:admin
```

---

### Rooms
| Method | Endpoint                         | Auth         | Description           |
|--------|----------------------------------|--------------|-----------------------|
| GET    | /api/rooms                       | None         | List all rooms        |
| GET    | /api/rooms/:id                   | None         | Get single room       |
| GET    | /api/rooms/:id/availability      | None         | Check availability    |
| POST   | /api/rooms                       | Admin        | Create room           |
| PUT    | /api/rooms/:id                   | Admin        | Update room           |
| DELETE | /api/rooms/:id                   | Admin        | Delete room           |
| POST   | /api/rooms/:id/block-dates       | Admin        | Block specific dates  |

#### GET /api/rooms (query params)
```
?type=suite&status=available&min_price=100&max_price=500&capacity=2&page=1&limit=10
```

#### GET /api/rooms/:id/availability
```
?check_in=2026-04-01&check_out=2026-04-05
```
Response:
```json
{
  "available": true,
  "blocked_dates": [],
  "reason": null
}
```

#### POST /api/rooms (Admin)
```json
{
  "name": "The Blue Suite",
  "type": "suite",
  "description": "A beautiful room...",
  "price_per_night": 220.00,
  "capacity": 2,
  "size_sqm": 50,
  "amenities": ["King Bed", "Sea View", "Jacuzzi"],
  "images": ["https://example.com/image1.jpg"]
}
```

---

### Bookings
| Method | Endpoint                        | Auth              | Description                  |
|--------|---------------------------------|-------------------|------------------------------|
| GET    | /api/bookings                   | Required          | List bookings (own/all)      |
| GET    | /api/bookings/:id               | Required          | Get booking detail           |
| POST   | /api/bookings                   | Optional          | Create booking               |
| PUT    | /api/bookings/:id/status        | Admin             | Approve/reject/complete      |
| DELETE | /api/bookings/:id               | Required          | Cancel booking               |

#### POST /api/bookings
```json
{
  "room_id": 1,
  "guest_name": "Jane Doe",
  "guest_email": "jane@example.com",
  "guest_phone": "+27 82 000 0000",
  "check_in": "2026-04-10",
  "check_out": "2026-04-14",
  "special_requests": "Late check-in please"
}
```
Booking status starts as `pending`. The system automatically:
- Checks room availability
- Detects date conflicts (with row-level locking)
- Checks manually blocked dates
- Calculates total price

#### PUT /api/bookings/:id/status (Admin)
```json
{
  "status": "approved",
  "staff_notes": "Confirmed. Key left at reception."
}
```
Valid statuses: `approved`, `rejected`, `completed`, `cancelled`

#### GET /api/bookings (query params)
```
?status=pending&room_id=1&from=2026-03-01&to=2026-03-31&page=1&limit=20
```

---

### Reports (Admin only)
| Method | Endpoint                       | Description               |
|--------|--------------------------------|---------------------------|
| GET    | /api/reports/summary           | Overall stats             |
| GET    | /api/reports/monthly-revenue   | Revenue by month          |
| GET    | /api/reports/room-performance  | Per-room stats            |
| GET    | /api/reports/occupancy         | Occupancy rates by room   |

#### GET /api/reports/monthly-revenue
```
?year=2026
```

#### GET /api/reports/occupancy
```
?from=2026-01-01&to=2026-03-31
```

---

### Users (Admin only)
| Method | Endpoint              | Description       |
|--------|-----------------------|-------------------|
| GET    | /api/users            | List all users    |
| GET    | /api/users/:id        | Get user          |
| PUT    | /api/users/:id/role   | Change user role  |
| DELETE | /api/users/:id        | Delete user       |

---

## 🗄️ Database Schema

```
users
  id, name, email, password_hash, phone, role, created_at, updated_at

rooms
  id, name, type, description, price_per_night, capacity, size_sqm,
  amenities (TEXT[]), images (TEXT[]), status, created_at, updated_at

bookings
  id, booking_ref, user_id, room_id, guest_name, guest_email, guest_phone,
  check_in, check_out, nights (computed), total_price, status,
  staff_notes, special_requests, approved_by, approved_at, cancelled_at,
  created_at, updated_at

blocked_dates
  id, room_id, blocked_on, reason, created_by, created_at

payments  (Phase 2 ready)
  id, booking_id, amount, currency, method, status, provider_ref, paid_at, created_at
```

---

## 🔌 Connecting to the Frontend

In your React app (the `.jsx` file), replace the hardcoded data with API calls:

```javascript
const API = 'http://localhost:5000/api';

// Login
const res = await fetch(`${API}/auth/login`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password })
});
const { token, user } = await res.json();
localStorage.setItem('token', token);

// Authenticated request
const bookings = await fetch(`${API}/bookings`, {
  headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
}).then(r => r.json());

// Create booking
const booking = await fetch(`${API}/bookings`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`
  },
  body: JSON.stringify({ room_id, guest_name, guest_email, check_in, check_out })
}).then(r => r.json());
```

---

## 📦 Production Deployment

1. Set `NODE_ENV=production` in your environment
2. Use a process manager like **PM2**: `pm2 start server.js --name guesthouse-api`
3. Put **Nginx** in front as a reverse proxy
4. Use **SSL/TLS** (Let's Encrypt)
5. Set strong `JWT_SECRET` (32+ random characters)
