/**
 * mailer.js — Nodemailer email utility
 * Run: npm install nodemailer
 * Add to .env:
 *   MAIL_USER=yourgmail@gmail.com
 *   MAIL_PASS=your_gmail_app_password   ← NOT your Gmail login password
 *   MAIL_TO=staff@yourdomain.com        ← where staff notifications go
 *
 * To get a Gmail App Password:
 *   1. Go to myaccount.google.com → Security
 *   2. Enable 2-Step Verification
 *   3. Go to App Passwords → generate one for "Mail"
 *   4. Paste that 16-char password as MAIL_PASS
 */

const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

// ─── Format helpers ───────────────────────────────────────────────────────────
const fmt = (date) =>
  new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

const fmtPrice = (n) =>
  new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR', maximumFractionDigits: 0 }).format(n);

// ─── Send helper ──────────────────────────────────────────────────────────────
const send = async ({ to, subject, text, html }) => {
  if (!process.env.MAIL_USER || !process.env.MAIL_PASS) {
    console.warn('[Mailer] MAIL_USER or MAIL_PASS not set — skipping email.');
    return;
  }
  try {
    await transporter.sendMail({
      from: `"Glamorous GuestHouse" <${process.env.MAIL_USER}>`,
      to,
      subject,
      text,
      html,
    });
    console.log(`[Mailer] ✉ Email sent to ${to} — "${subject}"`);
  } catch (err) {
    console.error('[Mailer] Failed to send email:', err.message);
  }
};

// ─── Email templates ──────────────────────────────────────────────────────────

/**
 * Notify staff when a new booking is submitted
 */
const notifyStaffNewBooking = async (booking, room) => {
  const nights = Math.ceil(
    (new Date(booking.check_out) - new Date(booking.check_in)) / (1000 * 60 * 60 * 24)
  );
  await send({
    to: process.env.MAIL_TO,
    subject: `📋 New Booking — ${room.name} | Ref: ${booking.booking_ref}`,
    text: `
NEW BOOKING RECEIVED
────────────────────────────────
Reference:     ${booking.booking_ref}
Room:          ${room.name} (${room.type})
────────────────────────────────
Guest Name:    ${booking.guest_name}
Guest Email:   ${booking.guest_email}
Guest Phone:   ${booking.guest_phone || '—'}
────────────────────────────────
Check-in:      ${fmt(booking.check_in)}
Check-out:     ${fmt(booking.check_out)}
Nights:        ${nights}
Total:         ${fmtPrice(booking.total_price)}
────────────────────────────────
Special Requests:
${booking.special_requests || 'None'}

Please log in to approve or reject this booking.
    `.trim(),
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;background:#17130F;color:#F5F0EA;padding:32px;border-radius:8px;">
        <h2 style="color:#C9A96E;font-family:Georgia,serif;margin-bottom:4px;">New Booking Received</h2>
        <p style="color:#9E8E78;margin-top:0;">Ref: <strong style="color:#C9A96E;">${booking.booking_ref}</strong></p>
        <hr style="border-color:#2A2118;margin:20px 0;">
        <table style="width:100%;font-size:14px;border-collapse:collapse;">
          <tr><td style="padding:6px 0;color:#9E8E78;">Room</td><td style="color:#F5F0EA;">${room.name} (${room.type})</td></tr>
          <tr><td style="padding:6px 0;color:#9E8E78;">Guest</td><td style="color:#F5F0EA;">${booking.guest_name}</td></tr>
          <tr><td style="padding:6px 0;color:#9E8E78;">Email</td><td style="color:#F5F0EA;">${booking.guest_email}</td></tr>
          <tr><td style="padding:6px 0;color:#9E8E78;">Phone</td><td style="color:#F5F0EA;">${booking.guest_phone || '—'}</td></tr>
          <tr><td style="padding:6px 0;color:#9E8E78;">Check-in</td><td style="color:#F5F0EA;">${fmt(booking.check_in)}</td></tr>
          <tr><td style="padding:6px 0;color:#9E8E78;">Check-out</td><td style="color:#F5F0EA;">${fmt(booking.check_out)}</td></tr>
          <tr><td style="padding:6px 0;color:#9E8E78;">Nights</td><td style="color:#F5F0EA;">${nights}</td></tr>
          <tr><td style="padding:6px 0;color:#9E8E78;">Total</td><td style="color:#C9A96E;font-size:18px;font-weight:bold;">${fmtPrice(booking.total_price)}</td></tr>
          ${booking.special_requests ? `<tr><td style="padding:6px 0;color:#9E8E78;vertical-align:top;">Requests</td><td style="color:#F5F0EA;">${booking.special_requests}</td></tr>` : ''}
        </table>
        <hr style="border-color:#2A2118;margin:20px 0;">
        <p style="color:#9E8E78;font-size:13px;">Log in to the dashboard to approve or reject this booking.</p>
      </div>
    `,
  });
};

/**
 * Notify guest when their booking is approved
 */
const notifyGuestApproved = async (booking, room, staffNotes) => {
  const nights = Math.ceil(
    (new Date(booking.check_out) - new Date(booking.check_in)) / (1000 * 60 * 60 * 24)
  );
  await send({
    to: booking.guest_email,
    subject: `✅ Booking Confirmed — ${room.name} | Ref: ${booking.booking_ref}`,
    text: `
Dear ${booking.guest_name},

Great news! Your booking has been CONFIRMED.

────────────────────────────────
BOOKING CONFIRMATION
────────────────────────────────
Reference:   ${booking.booking_ref}
Room:        ${room.name}
Check-in:    ${fmt(booking.check_in)}
Check-out:   ${fmt(booking.check_out)}
Nights:      ${nights}
Total:       ${fmtPrice(booking.total_price)}
────────────────────────────────
${staffNotes ? `Note from us:\n${staffNotes}\n────────────────────────────────` : ''}

We look forward to welcoming you to Glamorous GuestHouse.

Warm regards,
Glamorous GuestHouse Team
    `.trim(),
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;background:#17130F;color:#F5F0EA;padding:32px;border-radius:8px;">
        <h2 style="color:#C9A96E;font-family:Georgia,serif;">Booking Confirmed ✅</h2>
        <p style="color:#9E8E78;">Dear <strong style="color:#F5F0EA;">${booking.guest_name}</strong>, your booking has been confirmed.</p>
        <hr style="border-color:#2A2118;margin:20px 0;">
        <table style="width:100%;font-size:14px;border-collapse:collapse;">
          <tr><td style="padding:6px 0;color:#9E8E78;">Reference</td><td style="color:#C9A96E;font-weight:bold;">${booking.booking_ref}</td></tr>
          <tr><td style="padding:6px 0;color:#9E8E78;">Room</td><td style="color:#F5F0EA;">${room.name}</td></tr>
          <tr><td style="padding:6px 0;color:#9E8E78;">Check-in</td><td style="color:#F5F0EA;">${fmt(booking.check_in)}</td></tr>
          <tr><td style="padding:6px 0;color:#9E8E78;">Check-out</td><td style="color:#F5F0EA;">${fmt(booking.check_out)}</td></tr>
          <tr><td style="padding:6px 0;color:#9E8E78;">Nights</td><td style="color:#F5F0EA;">${nights}</td></tr>
          <tr><td style="padding:6px 0;color:#9E8E78;">Total</td><td style="color:#C9A96E;font-size:18px;font-weight:bold;">${fmtPrice(booking.total_price)}</td></tr>
        </table>
        ${staffNotes ? `<hr style="border-color:#2A2118;margin:20px 0;"><p style="color:#9E8E78;font-size:13px;"><strong style="color:#F5F0EA;">Note from us:</strong> ${staffNotes}</p>` : ''}
        <hr style="border-color:#2A2118;margin:20px 0;">
        <p style="color:#9E8E78;font-size:13px;">We look forward to welcoming you. Please keep your reference number safe.</p>
        <p style="color:#5a4f42;font-size:12px;margin-top:24px;">Glamorous GuestHouse · Retreat, Western Cape</p>
      </div>
    `,
  });
};

/**
 * Notify guest when their booking is rejected
 */
const notifyGuestRejected = async (booking, room, staffNotes) => {
  await send({
    to: booking.guest_email,
    subject: `Booking Update — ${room.name} | Ref: ${booking.booking_ref}`,
    text: `
Dear ${booking.guest_name},

Unfortunately we are unable to accommodate your booking request at this time.

────────────────────────────────
Reference:   ${booking.booking_ref}
Room:        ${room.name}
Check-in:    ${fmt(booking.check_in)}
Check-out:   ${fmt(booking.check_out)}
────────────────────────────────
${staffNotes ? `Reason:\n${staffNotes}\n────────────────────────────────` : ''}

Please feel free to browse our other available rooms or contact us directly.

Warm regards,
Glamorous GuestHouse Team
    `.trim(),
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;background:#17130F;color:#F5F0EA;padding:32px;border-radius:8px;">
        <h2 style="color:#C9A96E;font-family:Georgia,serif;">Booking Update</h2>
        <p style="color:#9E8E78;">Dear <strong style="color:#F5F0EA;">${booking.guest_name}</strong>,</p>
        <p style="color:#9E8E78;">Unfortunately we are unable to accommodate your booking request at this time.</p>
        <hr style="border-color:#2A2118;margin:20px 0;">
        <table style="width:100%;font-size:14px;border-collapse:collapse;">
          <tr><td style="padding:6px 0;color:#9E8E78;">Reference</td><td style="color:#C9A96E;">${booking.booking_ref}</td></tr>
          <tr><td style="padding:6px 0;color:#9E8E78;">Room</td><td style="color:#F5F0EA;">${room.name}</td></tr>
          <tr><td style="padding:6px 0;color:#9E8E78;">Check-in</td><td style="color:#F5F0EA;">${fmt(booking.check_in)}</td></tr>
          <tr><td style="padding:6px 0;color:#9E8E78;">Check-out</td><td style="color:#F5F0EA;">${fmt(booking.check_out)}</td></tr>
        </table>
        ${staffNotes ? `<hr style="border-color:#2A2118;margin:20px 0;"><p style="color:#9E8E78;font-size:13px;"><strong style="color:#F5F0EA;">Reason:</strong> ${staffNotes}</p>` : ''}
        <hr style="border-color:#2A2118;margin:20px 0;">
        <p style="color:#9E8E78;font-size:13px;">Feel free to browse our other available rooms or contact us directly.</p>
        <p style="color:#5a4f42;font-size:12px;margin-top:24px;">Glamorous GuestHouse · Retreat, Western Cape</p>
      </div>
    `,
  });
};

/**
 * Notify staff when a guest cancels
 */
const notifyStaffCancellation = async (booking, room) => {
  await send({
    to: process.env.MAIL_TO,
    subject: `❌ Booking Cancelled — ${room.name} | Ref: ${booking.booking_ref}`,
    text: `
BOOKING CANCELLED BY GUEST
────────────────────────────────
Reference:   ${booking.booking_ref}
Room:        ${room.name}
Guest:       ${booking.guest_name} (${booking.guest_email})
Check-in:    ${fmt(booking.check_in)}
Check-out:   ${fmt(booking.check_out)}
Total:       ${fmtPrice(booking.total_price)}
────────────────────────────────
The room is now available for re-booking.
    `.trim(),
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;background:#17130F;color:#F5F0EA;padding:32px;border-radius:8px;">
        <h2 style="color:#FCA5A5;font-family:Georgia,serif;">Booking Cancelled</h2>
        <p style="color:#9E8E78;">A guest has cancelled their booking.</p>
        <hr style="border-color:#2A2118;margin:20px 0;">
        <table style="width:100%;font-size:14px;border-collapse:collapse;">
          <tr><td style="padding:6px 0;color:#9E8E78;">Reference</td><td style="color:#C9A96E;">${booking.booking_ref}</td></tr>
          <tr><td style="padding:6px 0;color:#9E8E78;">Room</td><td style="color:#F5F0EA;">${room.name}</td></tr>
          <tr><td style="padding:6px 0;color:#9E8E78;">Guest</td><td style="color:#F5F0EA;">${booking.guest_name}</td></tr>
          <tr><td style="padding:6px 0;color:#9E8E78;">Email</td><td style="color:#F5F0EA;">${booking.guest_email}</td></tr>
          <tr><td style="padding:6px 0;color:#9E8E78;">Check-in</td><td style="color:#F5F0EA;">${fmt(booking.check_in)}</td></tr>
          <tr><td style="padding:6px 0;color:#9E8E78;">Check-out</td><td style="color:#F5F0EA;">${fmt(booking.check_out)}</td></tr>
          <tr><td style="padding:6px 0;color:#9E8E78;">Total</td><td style="color:#C9A96E;">${fmtPrice(booking.total_price)}</td></tr>
        </table>
        <hr style="border-color:#2A2118;margin:20px 0;">
        <p style="color:#9E8E78;font-size:13px;">The room is now available for re-booking.</p>
      </div>
    `,
  });
};

module.exports = {
  notifyStaffNewBooking,
  notifyGuestApproved,
  notifyGuestRejected,
  notifyStaffCancellation,
};