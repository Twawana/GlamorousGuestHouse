import { useState, useEffect } from "react";
import { apiFetch, formatPrice, formatDate } from "../utils";
import Spinner from "../components/Spinner";
import StatusBadge from "../components/StatusBadge";
import "../styles/pages/adminbookings.css";

export default function AdminBookings({ onToast }: { onToast: (m: string, t?: "success"|"error") => void }) {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [updating, setUpdating] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});

  const load = async () => {
    setLoading(true);
    const params = statusFilter ? `?status=${statusFilter}` : "";
    const data = await apiFetch(`/bookings${params}`);
    setBookings(data.bookings || data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [statusFilter]);

  const updateStatus = async (id: string | number, status: string) => {
    setUpdating(String(id) + status);
    const data = await apiFetch(`/bookings/${id}/status`, {
      method: "PUT",
      body: JSON.stringify({ status, staff_notes: notes[id] || "" }),
    });
    if (data.error) { onToast(data.error, "error"); } else {
      onToast(`Booking ${status}.`, "success"); load();
    }
    setUpdating(null);
  };

  if (loading) return <Spinner />;

  return (
    <div className="fade-in">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 14 }}>
        <h2 className="serif gold" style={{ fontSize: 28 }}>All Bookings</h2>
        <div style={{ display: "flex", gap: 0, overflowX: "auto", borderBottom: "1px solid #2A2118" }}>
          {["", "pending", "approved", "rejected", "completed", "cancelled"].map(s => (
            <button key={s} className={`tab ${statusFilter === s ? "active" : ""}`} onClick={() => setStatusFilter(s)} style={{ fontSize: 11 }}>
              {s || "All"}
            </button>
          ))}
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {bookings.map(b => (
          <div key={b.id} className="card" style={{ padding: "18px 22px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 10, marginBottom: 12 }}>
              <div>
                <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 4, flexWrap: "wrap" }}>
                  <span className="serif" style={{ fontSize: 18, color: "#F5F0EA" }}>{b.guest_name}</span>
                  <StatusBadge status={b.status} />
                </div>
                <p style={{ color: "#5a4f42", fontSize: 12 }}>{b.room_name || `Room #${b.room_id}`} · <span style={{ color: "#C9A96E" }}>{b.booking_ref}</span></p>
                <p style={{ color: "#5a4f42", fontSize: 12 }}>{b.guest_email}</p>
              </div>
              <div style={{ textAlign: "right" }}>
                <p className="serif gold" style={{ fontSize: 20 }}>{formatPrice(b.total_price)}</p>
                <p style={{ color: "#9E8E78", fontSize: 12 }}>{formatDate(b.check_in)} → {formatDate(b.check_out)}</p>
              </div>
            </div>
            {b.status === "pending" && (
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", paddingTop: 12, borderTop: "1px solid #2A2118" }}>
                <input
                  placeholder="Staff notes…"
                  value={notes[b.id] || ""}
                  onChange={e => setNotes(n => ({ ...n, [b.id]: e.target.value }))}
                  style={{ flex: 1, minWidth: 180 }}
                />
                <button
                  onClick={() => updateStatus(b.id, "approved")}
                  disabled={updating === b.id + "approved"}
                  style={{ background: "#14532D", color: "#86EFAC", border: "none", padding: "8px 18px", borderRadius: 4, fontSize: 12, letterSpacing: 1, textTransform: "uppercase", cursor: "pointer" }}
                >Approve</button>
                <button
                  onClick={() => updateStatus(b.id, "rejected")}
                  disabled={updating === b.id + "rejected"}
                  style={{ background: "#7F1D1D", color: "#FCA5A5", border: "none", padding: "8px 18px", borderRadius: 4, fontSize: 12, letterSpacing: 1, textTransform: "uppercase", cursor: "pointer" }}
                >Reject</button>
              </div>
            )}
            {b.status === "approved" && (
              <div style={{ paddingTop: 12, borderTop: "1px solid #2A2118" }}>
                <button
                  onClick={() => updateStatus(b.id, "completed")}
                  disabled={updating === b.id + "completed"}
                  style={{ background: "#4C1D95", color: "#C4B5FD", border: "none", padding: "8px 18px", borderRadius: 4, fontSize: 12, letterSpacing: 1, textTransform: "uppercase", cursor: "pointer" }}
                >Mark Completed</button>
              </div>
            )}
          </div>
        ))}
        {bookings.length === 0 && (
          <p style={{ color: "#5a4f42", textAlign: "center", padding: "40px 0" }}>No bookings found</p>
        )}
      </div>
    </div>
  );
}
