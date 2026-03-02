const nodemailer = require('nodemailer');

// Create email transporter - using Gmail or SMTP configuration from env
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: process.env.SMTP_PORT || 587,
  secure: process.env.SMTP_SECURE === 'true' || false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

/**
 * Send email
 */
const sendEmail = async (to, subject, html) => {
  try {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.warn('⚠️  Email not configured. Skipping email to:', to);
      return { success: false, reason: 'Email not configured' };
    }

    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER || 'noreply@glamorous-guesthouse.com',
      to,
      subject,
      html,
    });

    console.log('✉️  Email sent to', to, '(messageId:', info.messageId, ')');
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error('❌ Email send failed:', err.message);
    return { success: false, error: err.message };
  }
};

/**
 * Email templates
 */
const emailTemplates = {
  bookingPending: (customerName, bookingRef, roomName, checkIn, checkOut) => ({
    subject: `New Booking Pending Approval - ${bookingRef}`,
    html: `
      <p>Hello,</p>
      <p>A new booking has been submitted for approval.</p>
      <br />
      <strong>Booking Details:</strong>
      <ul>
        <li><strong>Reference:</strong> ${bookingRef}</li>
        <li><strong>Customer:</strong> ${customerName}</li>
        <li><strong>Room:</strong> ${roomName}</li>
        <li><strong>Check-in:</strong> ${checkIn}</li>
        <li><strong>Check-out:</strong> ${checkOut}</li>
      </ul>
      <p>Please log in to your admin dashboard to review and approve/reject this booking.</p>
      <br />
      <p>Best regards,<br />Glamorous Guest House Team</p>
    `,
  }),

  bookingApproved: (customerName, bookingRef, roomName, checkIn, checkOut) => ({
    subject: `Your Booking is Approved - ${bookingRef}`,
    html: `
      <p>Hello ${customerName},</p>
      <p>Great news! Your booking has been approved.</p>
      <br />
      <strong>Booking Confirmation:</strong>
      <ul>
        <li><strong>Reference:</strong> ${bookingRef}</li>
        <li><strong>Room:</strong> ${roomName}</li>
        <li><strong>Check-in:</strong> ${checkIn}</li>
        <li><strong>Check-out:</strong> ${checkOut}</li>
      </ul>
      <p>We look forward to welcoming you at Glamorous Guest House!</p>
      <br />
      <p>If you have any questions, please don't hesitate to contact us.</p>
      <br />
      <p>Best regards,<br />Glamorous Guest House Team</p>
    `,
  }),

  bookingRejected: (customerName, bookingRef, reason) => ({
    subject: `Booking Update - ${bookingRef}`,
    html: `
      <p>Hello ${customerName},</p>
      <p>Unfortunately, your booking request has been rejected.</p>
      <br />
      <strong>Booking Reference:</strong> ${bookingRef}
      ${reason ? `<br /><strong>Reason:</strong> ${reason}` : ''}
      <p>Please feel free to submit another booking at a different date or contact us for assistance.</p>
      <br />
      <p>Best regards,<br />Glamorous Guest House Team</p>
    `,
  }),

  bookingCancelledStaff: (staffName, bookingRef, customerName, roomName, reason) => ({
    subject: `Booking Cancelled - ${bookingRef}`,
    html: `
      <p>Hello,</p>
      <p>A booking has been cancelled.</p>
      <br />
      <strong>Booking Details:</strong>
      <ul>
        <li><strong>Reference:</strong> ${bookingRef}</li>
        <li><strong>Customer:</strong> ${customerName}</li>
        <li><strong>Room:</strong> ${roomName}</li>
        ${reason ? `<li><strong>Reason:</strong> ${reason}</li>` : ''}
      </ul>
      <p>The room is now available for other bookings.</p>
      <br />
      <p>Glamorous Guest House Team</p>
    `,
  }),
};

module.exports = {
  sendEmail,
  emailTemplates,
};
