/**
 * server.js — Glamorous Guest House API
 * ──────────────────────────────────────
 * Start:       npm start
 * Development: npm run dev
 * Setup DB:    npm run db:setup
 * Seed data:   npm run db:seed
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');

// ─── Routes ───────────────────────────────────────────────────────────────────
const authRoutes    = require('./routes/auth');
const roomRoutes    = require('./routes/rooms');
const bookingRoutes = require('./routes/bookings');
const reportRoutes  = require('./routes/reports');
const userRoutes    = require('./routes/users');

const app = express();
const PORT = process.env.PORT || 5000;

// ─── Middleware ────────────────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? ['https://yourdomain.com']        // ← replace with your frontend URL
    : ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ─── Request logger (dev only) ────────────────────────────────────────────────
if (process.env.NODE_ENV !== 'production') {
  app.use((req, _res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
  });
}

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use('/api/auth',     authRoutes);
app.use('/api/rooms',    roomRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/reports',  reportRoutes);
app.use('/api/users',    userRoutes);

// ─── Health check ─────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), service: 'Glamorous GuestHouse API' });
});

// ─── 404 handler ──────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found.' });
});

// ─── Global error handler ─────────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error.' });
});

const uploadRoutes = require('./routes/upload');

// Serve uploaded files statically
app.use('/uploads', express.static('uploads'));

// Register upload routes
app.use('/api/upload', uploadRoutes);

// ─── Start ────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log('');
  console.log('✨ Glamorous GuestHouse API');
  console.log(`🚀 Running on http://localhost:${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log('');
  console.log('Endpoints:');
  console.log(`  POST   /api/auth/register`);
  console.log(`  POST   /api/auth/login`);
  console.log(`  GET    /api/auth/me`);
  console.log(`  GET    /api/rooms`);
  console.log(`  GET    /api/rooms/:id`);
  console.log(`  GET    /api/rooms/:id/availability`);
  console.log(`  GET    /api/bookings`);
  console.log(`  POST   /api/bookings`);
  console.log(`  PUT    /api/bookings/:id/status`);
  console.log(`  GET    /api/reports/summary`);
  console.log(`  GET    /api/reports/monthly-revenue`);
  console.log(`  GET    /api/reports/room-performance`);
  console.log(`  GET    /api/reports/occupancy`);
  console.log('');
});

module.exports = app;
