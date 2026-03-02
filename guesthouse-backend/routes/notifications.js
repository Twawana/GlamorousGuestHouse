const express = require('express');
const pool = require('../db/pool');
const { authenticate } = require('../middleware/auth');
const { markAsRead, deleteNotification, getUnreadCount } = require('../utils/notifications');

const router = express.Router();

// All notification routes require authentication
router.use(authenticate);

// GET /api/notifications - Get all notifications for current user
router.get('/', async (req, res) => {
  try {
    const userId = req.user.id;
    const { rows } = await pool.query(
      `SELECT id, type, title, message, booking_id, is_read, created_at, updated_at
       FROM notifications
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 50`,
      [userId]
    );
    res.json({ notifications: rows });
  } catch (err) {
    console.error('Get notifications error:', err.message);
    console.error('Full error:', err);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// GET /api/notifications/unread - Get unread notification count
router.get('/unread', async (req, res) => {
  try {
    const userId = req.user.id;
    const count = await getUnreadCount(userId);
    res.json({ unread_count: count });
  } catch (err) {
    console.error('Get unread count error:', err);
    res.status(500).json({ error: 'Failed to fetch unread count' });
  }
});

// PUT /api/notifications/:id/read - Mark notification as read
router.put('/:id/read', async (req, res) => {
  try {
    const notificationId = req.params.id;
    const userId = req.user.id;

    // Verify notification belongs to user
    const check = await pool.query(
      `SELECT id FROM notifications WHERE id = $1 AND user_id = $2`,
      [notificationId, userId]
    );

    if (check.rows.length === 0) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    await markAsRead(notificationId);
    res.json({ message: 'Marked as read' });
  } catch (err) {
    console.error('Mark as read error:', err);
    res.status(500).json({ error: 'Failed to update notification' });
  }
});

// DELETE /api/notifications/:id - Delete a notification
router.delete('/:id', async (req, res) => {
  try {
    const notificationId = req.params.id;
    const userId = req.user.id;

    // Verify notification belongs to user
    const check = await pool.query(
      `SELECT id FROM notifications WHERE id = $1 AND user_id = $2`,
      [notificationId, userId]
    );

    if (check.rows.length === 0) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    await deleteNotification(notificationId);
    res.json({ message: 'Notification deleted' });
  } catch (err) {
    console.error('Delete notification error:', err);
    res.status(500).json({ error: 'Failed to delete notification' });
  }
});

// PUT /api/notifications/read-all - Mark all as read
router.put('/read-all', async (req, res) => {
  try {
    const userId = req.user.id;
    await pool.query(
      `UPDATE notifications SET is_read = TRUE, read_at = NOW() WHERE user_id = $1 AND is_read = FALSE`,
      [userId]
    );
    res.json({ message: 'All notifications marked as read' });
  } catch (err) {
    console.error('Mark all as read error:', err);
    res.status(500).json({ error: 'Failed to update notifications' });
  }
});

module.exports = router;
