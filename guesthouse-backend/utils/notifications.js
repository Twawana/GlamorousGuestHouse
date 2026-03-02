const pool = require('../db/pool');
const { sendEmail, emailTemplates } = require('./email');

/**
 * Create a notification for a user and optionally send email
 */
const createNotification = async (userId, type, title, message, bookingId = null, emailData = null) => {
  try {
    // Insert notification into database
    const result = await pool.query(
      `INSERT INTO notifications (user_id, type, title, message, booking_id)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, created_at`,
      [userId, type, title, message, bookingId]
    );

    // Send email if configured and emailData provided
    if (emailData && emailData.to && emailData.subject && emailData.html) {
      await sendEmail(emailData.to, emailData.subject, emailData.html);
    }

    return result.rows[0];
  } catch (err) {
    console.error('Error creating notification:', err);
    return null;
  }
};

/**
 * Get all unread notification count for a user
 */
const getUnreadCount = async (userId) => {
  try {
    const result = await pool.query(
      `SELECT COUNT(*) as count FROM notifications WHERE user_id = $1 AND is_read = FALSE`,
      [userId]
    );
    return parseInt(result.rows[0].count, 10);
  } catch (err) {
    console.error('Error getting unread count:', err);
    return 0;
  }
};

/**
 * Mark notification as read
 */
const markAsRead = async (notificationId) => {
  try {
    await pool.query(
      `UPDATE notifications SET is_read = TRUE, read_at = NOW() WHERE id = $1`,
      [notificationId]
    );
    return true;
  } catch (err) {
    console.error('Error marking notification as read:', err);
    return false;
  }
};

/**
 * Delete a notification
 */
const deleteNotification = async (notificationId) => {
  try {
    await pool.query(`DELETE FROM notifications WHERE id = $1`, [notificationId]);
    return true;
  } catch (err) {
    console.error('Error deleting notification:', err);
    return false;
  }
};

/**
 * Notify staff about new pending booking
 */
const notifyStaffNewBooking = async (booking, room) => {
  try {
    // Get all staff and owner users
    const staffUsers = await pool.query(
      `SELECT id, email, name FROM users WHERE role IN ('staff', 'owner')`
    );

    const title = `New Booking Pending: ${room.name}`;
    const message = `Customer ${booking.guest_name} has booked ${room.name} from ${booking.check_in} to ${booking.check_out}. Approval required.`;

    for (const staff of staffUsers.rows) {
      const emailData = emailTemplates.bookingPending(
        booking.guest_name,
        booking.booking_ref,
        room.name,
        booking.check_in,
        booking.check_out
      );

      await createNotification(
        staff.id,
        'booking_pending',
        title,
        message,
        booking.id,
        {
          to: staff.email,
          subject: emailData.subject,
          html: emailData.html,
        }
      );
    }
  } catch (err) {
    console.error('Error notifying staff:', err);
  }
};

/**
 * Notify customer about booking approval
 */
const notifyCustomerApproved = async (booking, room, customer) => {
  try {
    const title = `Booking Approved: ${room.name}`;
    const message = `Your booking for ${room.name} from ${booking.check_in} to ${booking.check_out} has been approved!`;

    const emailData = emailTemplates.bookingApproved(
      customer.name,
      booking.booking_ref,
      room.name,
      booking.check_in,
      booking.check_out
    );

    await createNotification(
      customer.id,
      'booking_approved',
      title,
      message,
      booking.id,
      {
        to: customer.email,
        subject: emailData.subject,
        html: emailData.html,
      }
    );
  } catch (err) {
    console.error('Error notifying customer approval:', err);
  }
};

/**
 * Notify customer about booking rejection
 */
const notifyCustomerRejected = async (booking, room, customer, reason = null) => {
  try {
    const title = `Booking Update: ${room.name}`;
    const message = `Your booking for ${room.name} has been rejected. ${reason || ''}`;

    const emailData = emailTemplates.bookingRejected(customer.name, booking.booking_ref, reason);

    await createNotification(
      customer.id,
      'booking_rejected',
      title,
      message,
      booking.id,
      {
        to: customer.email,
        subject: emailData.subject,
        html: emailData.html,
      }
    );
  } catch (err) {
    console.error('Error notifying customer rejection:', err);
  }
};

/**
 * Notify staff about booking cancellation
 */
const notifyStaffCancelled = async (booking, room, actor) => {
  try {
    // Get all staff and owner users
    const staffUsers = await pool.query(
      `SELECT id, email, name FROM users WHERE role IN ('staff', 'owner')`
    );

    const title = `Booking Cancelled: ${room.name}`;
    const message = `Booking ${booking.booking_ref} for ${room.name} has been cancelled by ${booking.guest_name}.`;

    for (const staff of staffUsers.rows) {
      const emailData = emailTemplates.bookingCancelledStaff(
        staff.name,
        booking.booking_ref,
        booking.guest_name,
        room.name,
        null
      );

      await createNotification(
        staff.id,
        'booking_cancelled',
        title,
        message,
        booking.id,
        {
          to: staff.email,
          subject: emailData.subject,
          html: emailData.html,
        }
      );
    }
  } catch (err) {
    console.error('Error notifying staff cancellation:', err);
  }
};

module.exports = {
  createNotification,
  getUnreadCount,
  markAsRead,
  deleteNotification,
  notifyStaffNewBooking,
  notifyCustomerApproved,
  notifyCustomerRejected,
  notifyStaffCancelled,
};
