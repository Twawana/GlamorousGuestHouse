const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../db/pool');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// ─── POST /api/auth/register ──────────────────────────────────────────────────
router.post('/register', async (req, res) => {
  const { name, email, password, phone, role } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email, and password are required.' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters.' });
  }

  try {
    // Check if email already exists
    const exists = await pool.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
    if (exists.rows.length > 0) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }

    // If a non-customer role is requested, only an authenticated owner can create it
    const desiredRole = role ? String(role).toLowerCase() : 'customer';
    if (desiredRole !== 'customer') {
      const authHeader = req.headers['authorization'];
      if (!authHeader) return res.status(403).json({ error: 'Owner credentials required to create staff or owner accounts.' });
      try {
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (decoded.role !== 'owner') return res.status(403).json({ error: 'Owner access required.' });
      } catch (err) {
        return res.status(403).json({ error: 'Invalid owner token.' });
      }
    }

    const password_hash = await bcrypt.hash(password, 12);

    const { rows } = await pool.query(
      `INSERT INTO users (name, email, password_hash, phone, role)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, name, email, phone, role, created_at`,
      [name.trim(), email.toLowerCase().trim(), password_hash, phone || null, desiredRole]
    );

    const user = rows[0];
    const token = signToken(user);

    res.status(201).json({
      message: 'Account created successfully.',
      token,
      user: sanitizeUser(user),
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Server error. Please try again.' });
  }
});

// ─── POST /api/auth/login ─────────────────────────────────────────────────────
// on failure we allow an env-defined admin fallback password to ease development
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  try {
    const { rows } = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email.toLowerCase().trim()]
    );

    if (rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const user = rows[0];
    let valid = await bcrypt.compare(password, user.password_hash);

    // fallback for owner (environment variable ADMIN_FALLBACK_PASSWORD or OWNER_FALLBACK_PASSWORD)
    if (!valid && user.role === 'owner' && (process.env.ADMIN_FALLBACK_PASSWORD || process.env.OWNER_FALLBACK_PASSWORD)) {
      valid = password === process.env.ADMIN_FALLBACK_PASSWORD || password === process.env.OWNER_FALLBACK_PASSWORD;
    }

    if (!valid) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const token = signToken(user);

    res.json({
      message: 'Login successful.',
      token,
      user: sanitizeUser(user),
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error. Please try again.' });
  }
});

// ─── GET /api/auth/me  (protected) ───────────────────────────────────────────
router.get('/me', authenticate, async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, name, email, phone, role, created_at FROM users WHERE id = $1',
      [req.user.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'User not found.' });
    res.json({ user: rows[0] });
  } catch (err) {
    console.error('Me error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// ─── PUT /api/auth/profile (protected) ───────────────────────────────────────
router.put('/profile', authenticate, async (req, res) => {
  const { name, phone } = req.body;
  try {
    const { rows } = await pool.query(
      `UPDATE users SET name = COALESCE($1, name), phone = COALESCE($2, phone)
       WHERE id = $3
       RETURNING id, name, email, phone, role`,
      [name || null, phone || null, req.user.id]
    );
    res.json({ message: 'Profile updated.', user: rows[0] });
  } catch (err) {
    console.error('Profile update error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// ─── NEW: Staff/Owner middleware for room routes ─────────────────────────────
const requireStaffOrOwner = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  const allowedRoles = ['staff', 'owner', 'admin'];
  if (!allowedRoles.includes(req.user.role)) {
    return res.status(403).json({ error: 'Access denied. Staff or owner privileges required.' });
  }
  
  next();
};

// ─── NEW: Owner-only middleware for reports ───────────────────────────────────
const requireOwner = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  const allowedRoles = ['owner', 'admin'];
  if (!allowedRoles.includes(req.user.role)) {
    return res.status(403).json({ error: 'Access denied. Owner privileges required.' });
  }
  
  next();
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function signToken(user) {
  return jwt.sign(
    { id: user.id, name: user.name, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

function sanitizeUser(user) {
  const { password_hash, ...safe } = user;
  return safe;
}

module.exports = router;