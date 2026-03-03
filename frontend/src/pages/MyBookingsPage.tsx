import { useState, useEffect } from "react";
import { apiFetch, formatPrice, formatDate } from "../utils";
import Spinner from "../components/Spinner";
import StatusBadge from "../components/StatusBadge";
import "../styles/pages/mybookings.css";

export default function MyBookingsPage({ onToast }: { onToast: (m: string, t?: "success"|"error") => void }) {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [cancelling, setCancelling] = useState<string | number | null>(null);

  const load = async () => {
    setLoading(true);
    const data = await apiFetch("/bookings");
    setBookings(data.bookings || data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const cancel = async (id: string | number) => {
    if (!window.confirm("Cancel this booking?")) return;
    setCancelling(id);
    const data = await apiFetch(`/bookings/${id}`, { method: "DELETE" });
    if (data.error) { onToast(data.error, "error"); } else {
      onToast("Booking cancelled.", "success"); load();
    }
    setCancelling(null);
  };

  if (loading) return <Spinner />;

  return (
    <div className="fade-in">
      <h2 className="serif gold" style={{ fontSize: 30, marginBottom: 24 }}>My Bookings</h2>
      {bookings.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 0", color: "#5a4f42" }}>
          <p className="serif" style={{ fontSize: 24, color: "#9E8E78", marginBottom: 8 }}>No bookings yet</p>
          <p style={{ fontSize: 13 }}>Browse our rooms to make your first booking</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {bookings.map(b => (
            <div key={b.id} className="card fade-in" style={{ padding: "20px 24px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6, flexWrap: "wrap" }}>
                    <h3 className="serif" style={{ fontSize: 20, color: "#F5F0EA" }}>{b.room_name || `Room #${b.room_id}`}</h3>
                    <StatusBadge status={b.status} />
                  </div>
                  <p style={{ color: "#5a4f42", fontSize: 12, letterSpacing: .5 }}>Ref: <span style={{ color: "#C9A96E" }}>{b.booking_ref}</span></p>
                </div>
                <div style={{ textAlign: "right" }}>
                  <p className="serif gold" style={{ fontSize: 22 }}>{formatPrice(b.total_price)}</p>
                  <p style={{ color: "#5a4f42", fontSize: 12 }}>{b.nights} Per Night{b.nights !== 1 ? "s" : ""}</p>
                </div>
              </div>
              <hr className="divider" style={{ margin: "14px 0" }} />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
                <div style={{ display: "flex", gap: 24 }}>
                  <div>
                    <p style={{ color: "#5a4f42", fontSize: 11, letterSpacing: 1, textTransform: "uppercase", marginBottom: 2 }}>Check-in</p>
                    <p style={{ color: "#F5F0EA", fontSize: 14 }}>{formatDate(b.check_in)}</p>
                  </div>
                  <div>
                    <p style={{ color: "#5a4f42", fontSize: 11, letterSpacing: 1, textTransform: "uppercase", marginBottom: 2 }}>Check-out</p>
                    <p style={{ color: "#F5F0EA", fontSize: 14 }}>{formatDate(b.check_out)}</p>
                  </div>
                </div>
                {['pending','approved'].includes(b.status) && (
                  <button className="btn-danger" onClick={() => cancel(b.id)} disabled={cancelling === b.id}>
                    {cancelling === b.id ? "Cancelling…" : "Cancel Booking"}
                  </button>
                )}
              </div>
              {b.special_requests && (
                <p style={{ color: "#5a4f42", fontSize: 12, marginTop: 10, fontStyle: "italic" }}>&quot;{b.special_requests}&quot;</p>
              )}
              {b.staff_notes && (
                <div style={{ marginTop: 10, padding: "8px 12px", background: "#1C1712", borderRadius: 6, borderLeft: "2px solid #C9A96E" }}>
                  <p style={{ color: "#9E8E78", fontSize: 12 }}>Staff: {b.staff_notes}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
