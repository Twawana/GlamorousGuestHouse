import { useState } from "react";
import { nightsBetween, formatPrice, apiFetch } from "../utils";
import type { CE } from "../types";

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

  const set = (k: string) => (e: CE) => setForm((f: any) => ({ ...f, [k]: e.target.value }));
  const nights = nightsBetween(form.check_in, form.check_out);
  const total = nights * (room?.price_per_night || 0);

  const submit = async () => {
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
        onSuccess(data.booking || data);
      } else {
        setErr(data.error || data.message || "Booking failed.");
      }
    } catch { setErr("Network error."); }
    setLoading(false);
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 560 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
          <div>
            <h2 className="serif gold" style={{ fontSize: 26 }}>Book This Room</h2>
            <p style={{ color: "#9E8E78", fontSize: 13 }}>{room.name}</p>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#5a4f42", fontSize: 20 }}>✕</button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <div style={{ gridColumn: "1/-1" }}>
            <label style={{ color: "#9E8E78", fontSize: 11, letterSpacing: 1, textTransform: "uppercase", display: "block", marginBottom: 6 }}>Guest Name *</label>
            <input value={form.guest_name} onChange={set("guest_name")} placeholder="Full name" />
          </div>
          <div>
            <label style={{ color: "#9E8E78", fontSize: 11, letterSpacing: 1, textTransform: "uppercase", display: "block", marginBottom: 6 }}>Email *</label>
            <input type="email" value={form.guest_email} onChange={set("guest_email")} placeholder="email@example.com" />
          </div>
          <div>
            <label style={{ color: "#9E8E78", fontSize: 11, letterSpacing: 1, textTransform: "uppercase", display: "block", marginBottom: 6 }}>Phone</label>
            <input value={form.guest_phone} onChange={set("guest_phone")} placeholder="+27 82 …" />
          </div>
          <div>
            <label style={{ color: "#9E8E78", fontSize: 11, letterSpacing: 1, textTransform: "uppercase", display: "block", marginBottom: 6 }}>Check-in</label>
            <input type="date" min={today} value={form.check_in} onChange={set("check_in")} />
          </div>
          <div>
            <label style={{ color: "#9E8E78", fontSize: 11, letterSpacing: 1, textTransform: "uppercase", display: "block", marginBottom: 6 }}>Check-out</label>
            <input type="date" min={form.check_in || today} value={form.check_out} onChange={set("check_out")} />
          </div>
          <div style={{ gridColumn: "1/-1" }}>
            <label style={{ color: "#9E8E78", fontSize: 11, letterSpacing: 1, textTransform: "uppercase", display: "block", marginBottom: 6 }}>Special Requests</label>
            <textarea rows={3} value={form.special_requests} onChange={set("special_requests")} placeholder="Late check-in, dietary requirements, etc." />
          </div>
        </div>

        {nights > 0 && (
          <div style={{ background: "#1C1712", border: "1px solid #2A2118", borderRadius: 8, padding: "14px 18px", margin: "18px 0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ color: "#9E8E78", fontSize: 13 }}>{nights} night{nights > 1 ? "s" : ""} × {formatPrice(room.price_per_night)}</span>
            <span className="serif gold" style={{ fontSize: 22, fontWeight: 600 }}>{formatPrice(total)}</span>
          </div>
        )}

        {err && <p style={{ color: "#FCA5A5", fontSize: 13, background: "#7F1D1D22", padding: "8px 12px", borderRadius: 6, border: "1px solid #7F1D1D55", marginBottom: 14 }}>{err}</p>}

        <div style={{ display: "flex", gap: 10 }}>
          <button className="btn-ghost" onClick={onClose} style={{ flex: 1 }}>Cancel</button>
          <button className="btn-gold" onClick={submit} disabled={loading} style={{ flex: 2 }}>{loading ? "Booking…" : "Confirm Booking"}</button>
        </div>
      </div>
    </div>
  );
}
