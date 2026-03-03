import { useState } from "react";
import { nightsBetween, formatPrice, apiFetch } from "../utils";
import type { CE } from "../types";

const FORMSPREE_ID = "mpqjgkqw";

export default function BookingModal({ room, onClose, onSuccess, user }: { room: any; onClose: () => void; onSuccess: (b: any) => void; user?: any }) {
  const today = new Date().toISOString().split("T")[0];
  const [form, setForm] = useState<any>({
    guest_name: user?.name || "",
    guest_email: user?.email || "",
    guest_phone: user?.phone || "",
    check_in: "",
    check_out: "",
    special_requests: "",
  });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [success, setSuccess] = useState<{ booking_ref: string; email: string } | null>(null);

  const set = (k: string) => (e: CE) => setForm((f: any) => ({ ...f, [k]: e.target.value }));
  const nights = nightsBetween(form.check_in, form.check_out);
  const total = nights * (room?.price_per_night || 0);

  const sendStaffEmail = async (bookingRef: string) => {
    try {
      await fetch(`https://formspree.io/f/${FORMSPREE_ID}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          // Formspree uses "email" field as reply-to
          email: form.guest_email,
          subject: `New Booking — ${room.name} | Ref: ${bookingRef}`,
          message: `
NEW BOOKING RECEIVED
────────────────────────────────
Reference:     ${bookingRef}
Room:          ${room.name} (${room.type})
────────────────────────────────
Guest Name:    ${form.guest_name}
Guest Email:   ${form.guest_email}
Guest Phone:   ${form.guest_phone || "—"}
────────────────────────────────
Check-in:      ${form.check_in}
Check-out:     ${form.check_out}
Nights:        ${nights}
Total:         ${formatPrice(total)}
────────────────────────────────
Special Requests:
${form.special_requests || "None"}
          `.trim(),
        }),
      });
    } catch (e) {
      // Email failure should not block the booking
      console.warn("Staff email failed to send:", e);
    }
  };

  const submit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!form.check_in || !form.check_out) return setErr("Please select check-in and check-out dates.");
    if (nights < 1) return setErr("Check-out must be after check-in.");
    if (!form.guest_name || !form.guest_email) return setErr("Name and email are required.");
    setErr(""); setLoading(true);
    try {
      const data = await apiFetch("/bookings", {
        method: "POST",
        body: JSON.stringify({ room_id: room.id, ...form }),
      });
      if (data.booking || data.id || data.booking_ref) {
        const booking = data.booking || data;
        const bookingRef = booking.booking_ref || booking.booking_ref || String(booking.id || "");
        
        // Send staff notification email via Formspree
        await sendStaffEmail(bookingRef);

        // Show confirmation modal instead of closing immediately
        setSuccess({ booking_ref: bookingRef, email: form.guest_email });
      } else {
        setErr(data.error || data.message || "Booking failed.");
      }
    } catch (err: any) {
  const msg = err?.message || "";
  if (msg.toLowerCase().includes("past")) {
    setErr("Check-in date cannot be in the past. Please select a future date.");
  } else if (msg.toLowerCase().includes("unavailable") || msg.toLowerCase().includes("not available")) {
    setErr("This room is not available for the selected dates. Please choose different dates.");
  } else if (msg.toLowerCase().includes("conflict") || msg.toLowerCase().includes("already booked")) {
    setErr("These dates are already booked. Please choose different dates.");
  } else if (msg.toLowerCase().includes("network") || msg.toLowerCase().includes("fetch")) {
    setErr("Cannot connect to server. Is the backend running?");
  } else {
    setErr(msg || "Booking failed. Please try again.");
  }
}
    setLoading(false);
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 560 }}>
        {success ? (
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 48, color: "#86EFAC", marginBottom: 16 }}>✓</div>
            <h2 className="serif gold" style={{ fontSize: 26, marginBottom: 8 }}>Booking Confirmed!</h2>
            <p style={{ color: "#9E8E78", fontSize: 14, marginBottom: 24 }}>Your booking has been submitted successfully.</p>
            
            <div style={{ background: "#1A1410", border: "1px solid #2A2118", borderRadius: 8, padding: 20, marginBottom: 24, textAlign: "left" }}>
              <div style={{ marginBottom: 16 }}>
                <p style={{ color: "#9E8E78", fontSize: 11, letterSpacing: 1, textTransform: "uppercase", marginBottom: 4 }}>Confirmation Email</p>
                <p className="serif" style={{ fontSize: 16, color: "#C9A96E", wordBreak: "break-all" }}>{success.email}</p>
                <p style={{ color: "#5a4f42", fontSize: 12, marginTop: 4 }}>A confirmation email has been sent to this address.</p>
              </div>
              
              <div style={{ paddingTop: 16, borderTop: "1px solid #2A2118", marginTop: 16 }}>
                <p style={{ color: "#9E8E78", fontSize: 11, letterSpacing: 1, textTransform: "uppercase", marginBottom: 4 }}>Your Reference Code</p>
                <p className="serif" style={{ fontSize: 18, color: "#F5F0EA", fontWeight: 700, fontFamily: "monospace", letterSpacing: 2 }}>{success.booking_ref}</p>
                <p style={{ color: "#5a4f42", fontSize: 12, marginTop: 4 }}>Save this code for your records. You'll need it for check-in.</p>
              </div>
            </div>

            <button
              className="btn-gold"
              onClick={() => {
                setSuccess(null);
                onSuccess({ booking_ref: success.booking_ref });
                onClose();
              }}
              style={{ width: "100%", padding: "12px 0" }}
            >
              Close
            </button>
          </div>
        ) : (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
              <div>
                <h2 className="serif gold" style={{ fontSize: 26 }}>Book This Room</h2>
                <p style={{ color: "#9E8E78", fontSize: 13 }}>{room.name}</p>
              </div>
              <button onClick={onClose} style={{ background: "none", border: "none", color: "#5a4f42", fontSize: 20 }}>✕</button>
            </div>

            <form onSubmit={submit} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <div style={{ gridColumn: "1/-1" }}>
                <label style={{ color: "#9E8E78", fontSize: 11, letterSpacing: 1, textTransform: "uppercase", display: "block", marginBottom: 6 }}>Guest Name *</label>
                <input name="guest_name" value={form.guest_name} onChange={set("guest_name")} placeholder="Full name" />
              </div>
              <div>
                <label style={{ color: "#9E8E78", fontSize: 11, letterSpacing: 1, textTransform: "uppercase", display: "block", marginBottom: 6 }}>Email *</label>
                <input name="guest_email" type="email" value={form.guest_email} onChange={set("guest_email")} placeholder="email@example.com" />
              </div>
              <div>
                <label style={{ color: "#9E8E78", fontSize: 11, letterSpacing: 1, textTransform: "uppercase", display: "block", marginBottom: 6 }}>Phone</label>
                <input name="guest_phone" value={form.guest_phone} onChange={set("guest_phone")} placeholder="+264 81 …" />
              </div>
              <div>
                <label style={{ color: "#9E8E78", fontSize: 11, letterSpacing: 1, textTransform: "uppercase", display: "block", marginBottom: 6 }}>Check-in</label>
                <input name="check_in" type="date" min={today} value={form.check_in} onChange={set("check_in")} />
              </div>
              <div>
                <label style={{ color: "#9E8E78", fontSize: 11, letterSpacing: 1, textTransform: "uppercase", display: "block", marginBottom: 6 }}>Check-out</label>
                <input name="check_out" type="date" min={form.check_in || today} value={form.check_out} onChange={set("check_out")} />
              </div>
              <div style={{ gridColumn: "1/-1" }}>
                <label style={{ color: "#9E8E78", fontSize: 11, letterSpacing: 1, textTransform: "uppercase", display: "block", marginBottom: 6 }}>Special Requests</label>
                <textarea name="special_requests" rows={3} value={form.special_requests} onChange={set("special_requests")} placeholder="Late check-in, dietary requirements, etc." />
              </div>

              {nights > 0 && (
                <div style={{ gridColumn: "1/-1", background: "#1C1712", border: "1px solid #2A2118", borderRadius: 8, padding: "14px 18px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ color: "#9E8E78", fontSize: 13 }}>{nights} night{nights > 1 ? "s" : ""} × {formatPrice(room.price_per_night)}</span>
                  <span className="serif gold" style={{ fontSize: 22, fontWeight: 600 }}>{formatPrice(total)}</span>
                </div>
              )}

              {err && (
                <p style={{ gridColumn: "1/-1", color: "#FCA5A5", fontSize: 13, background: "#7F1D1D22", padding: "8px 12px", borderRadius: 6, border: "1px solid #7F1D1D55" }}>{err}</p>
              )}

              <div style={{ gridColumn: "1/-1", display: "flex", gap: 10 }}>
                <button type="button" className="btn-ghost" onClick={onClose} style={{ flex: 1 }}>Cancel</button>
                <button type="submit" className="btn-gold" disabled={loading} style={{ flex: 2 }}>{loading ? "Booking…" : "Confirm Booking"}</button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}