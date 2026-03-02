import { useState, useEffect } from "react";
import { apiFetch, formatPrice } from "../utils";
import Spinner from "../components/Spinner";
import "../styles/pages/reports.css";

export default function ReportsPage() {
  const [summary, setSummary] = useState<any | null>(null);
  const [monthly, setMonthly] = useState<any[]>([]);
  const [roomPerf, setRoomPerf] = useState<any[]>([]);
  const [occupancy, setOccupancy] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [year, setYear] = useState<number>(new Date().getFullYear());

  useEffect(() => {
    const load = async () => {
      try {
        const [s, m, r, o] = await Promise.all([
          apiFetch("/reports/summary"),
          apiFetch(`/reports/monthly-revenue?year=${year}`),
          apiFetch("/reports/room-performance"),
          apiFetch("/reports/occupancy"),
        ]);
        
        setSummary(s);
        setMonthly(m.monthly_revenue || []);
        setRoomPerf(r.room_performance || []);
        setOccupancy(o.occupancy || []);
      } catch (error) {
        console.error("Failed to load reports:", error);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [year]);

  if (loading) return <Spinner />;

  const maxRev = Math.max(...monthly.map(m => parseFloat(String(m.revenue || 0))), 1);
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

  return (
    <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
        <h2 className="serif gold" style={{ fontSize: "clamp(24px, 5vw, 36px)" }}>Reports & Analytics</h2>
        <select 
          value={year} 
          onChange={(e) => setYear(Number(e.target.value))}
          style={{ background: "#1A1410", color: "#C9A96E", border: "1px solid #2A2118", padding: "8px 16px", borderRadius: 4 }}
        >
          {[2024, 2025, 2026].map(y => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>

      {/* Summary Cards */}
      {summary && (
        <>
          <div>
            <h3 className="serif" style={{ fontSize: "clamp(16px, 3vw, 22px)", color: "#F5F0EA", marginBottom: 16 }}>Overview</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12, width: "100%" }}>
              {[
                { label: "Total Rooms", value: summary.rooms?.total_rooms },
                { label: "Available", value: summary.rooms?.available },
                { label: "Maintenance", value: summary.rooms?.maintenance },
                { label: "Total Bookings", value: summary.bookings?.total_bookings },
                { label: "Pending", value: summary.bookings?.pending },
                { label: "Approved", value: summary.bookings?.approved },
                { label: "Completed", value: summary.bookings?.completed },
                { label: "Cancelled", value: summary.bookings?.cancelled },
              ].map(s => s.value !== undefined && (
                <div key={s.label} className="card" style={{ padding: "clamp(12px, 2vw, 20px)" }}>
                  <p style={{ color: "#5a4f42", fontSize: "clamp(9px, 1vw, 11px)", letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 }}>{s.label}</p>
                  <p className="serif gold" style={{ fontSize: "clamp(20px, 4vw, 28px)" }}>{s.value}</p>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="serif" style={{ fontSize: "clamp(16px, 3vw, 22px)", color: "#F5F0EA", marginBottom: 16 }}>Financial</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, width: "100%" }}>
              {[
                { label: "Total Revenue", value: formatPrice(summary.revenue?.total_revenue || 0) },
                { label: "This Month", value: formatPrice(summary.revenue?.this_month_revenue || 0) },
                { label: "Avg Booking", value: formatPrice(summary.revenue?.avg_booking_value || 0) },
                { label: "Total Users", value: summary.users?.total_users },
              ].map(s => (
                <div key={s.label} className="card" style={{ padding: "clamp(12px, 2vw, 20px)" }}>
                  <p style={{ color: "#5a4f42", fontSize: "clamp(9px, 1vw, 11px)", letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 }}>{s.label}</p>
                  <p className="serif gold" style={{ fontSize: "clamp(20px, 4vw, 28px)" }}>{s.value}</p>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Monthly Revenue Chart */}
      {monthly.length > 0 && (
        <div className="card" style={{ padding: "clamp(16px, 3vw, 24px)" }}>
          <h3 className="serif" style={{ fontSize: "clamp(16px, 3vw, 24px)", color: "#F5F0EA", marginBottom: 20 }}>
            Monthly Revenue {year}
          </h3>
          <div style={{ display: "flex", alignItems: "flex-end", gap: "clamp(4px, 1vw, 8px)", height: "clamp(150px, 30vh, 280px)", padding: "0 4px", width: "100%" }}>
            {monthly.map((m, i) => {
              const rev = parseFloat(m.revenue || 0);
              const h = Math.max(4, (rev / maxRev) * 170);
              return (
                <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4, minWidth: 0 }}>
                  {rev > 0 && <div style={{ fontSize: "clamp(8px, 1vw, 10px)", color: "#5a4f42" }}>R{(rev/1000).toFixed(0)}k</div>}
                  <div style={{
                    width: "100%", height: h,
                    background: rev > 0 ? "linear-gradient(to top, #8B6A3E, #C9A96E)" : "#2A2118",
                    borderRadius: "3px 3px 0 0", transition: "height .5s",
                  }} title={`${m.month_name || months[m.month-1]}: ${formatPrice(rev)} (${m.bookings} bookings)`} />
                  <div style={{ fontSize: "clamp(8px, 1vw, 11px)", color: "#5a4f42" }}>{m.month_name || months[m.month-1]}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Room Performance */}
      {roomPerf.length > 0 && (
        <div className="card" style={{ padding: "clamp(16px, 3vw, 24px)" }}>
          <h3 className="serif" style={{ fontSize: "clamp(16px, 3vw, 24px)", color: "#F5F0EA", marginBottom: 20 }}>Room Performance</h3>
          <div style={{ overflowX: "auto", width: "100%" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "clamp(11px, 1.5vw, 14px)", minWidth: 600 }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #2A2118" }}>
                  {["Room", "Type", "Price", "Bookings", "Confirmed", "Revenue", "Avg Stay", "Approval %"].map(h => (
                    <th key={h} style={{ padding: "clamp(6px, 1vw, 12px)", textAlign: "left", color: "#5a4f42", fontSize: "clamp(9px, 1vw, 11px)", letterSpacing: 1, textTransform: "uppercase" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {roomPerf.map((r, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid #1a1410" }}>
                    <td style={{ padding: "clamp(8px, 1.5vw, 12px)", color: "#F5F0EA" }}>{r.name}</td>
                    <td style={{ padding: "clamp(8px, 1.5vw, 12px)", color: "#9E8E78" }}>{r.type}</td>
                    <td style={{ padding: "clamp(8px, 1.5vw, 12px)", color: "#C9A96E" }}>{formatPrice(r.price_per_night)}</td>
                    <td style={{ padding: "clamp(8px, 1.5vw, 12px)", color: "#9E8E78" }}>{r.total_bookings}</td>
                    <td style={{ padding: "clamp(8px, 1.5vw, 12px)", color: "#9E8E78" }}>{r.confirmed_bookings}</td>
                    <td style={{ padding: "clamp(8px, 1.5vw, 12px)", color: "#C9A96E" }}>{formatPrice(r.revenue || 0)}</td>
                    <td style={{ padding: "clamp(8px, 1.5vw, 12px)", color: "#9E8E78" }}>{r.avg_stay_nights ? Number(r.avg_stay_nights).toFixed(1) : '0'} nights</td>
                    <td style={{ padding: "clamp(8px, 1.5vw, 12px)", color: "#9E8E78" }}>{r.approval_rate_pct || 0}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Occupancy Rates */}
      {occupancy.length > 0 && (
        <div className="card" style={{ padding: "clamp(16px, 3vw, 24px)" }}>
          <h3 className="serif" style={{ fontSize: "clamp(16px, 3vw, 24px)", color: "#F5F0EA", marginBottom: 20 }}>Occupancy (Last 30 Days)</h3>
          <div style={{ overflowX: "auto", width: "100%" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "clamp(11px, 1.5vw, 14px)", minWidth: 500 }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #2A2118" }}>
                  {["Room", "Booked Days", "Total Days", "Occupancy %"].map(h => (
                    <th key={h} style={{ padding: "clamp(6px, 1vw, 12px)", textAlign: "left", color: "#5a4f42", fontSize: "clamp(9px, 1vw, 11px)", letterSpacing: 1, textTransform: "uppercase" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {occupancy.slice(0, 5).map((r, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid #1a1410" }}>
                    <td style={{ padding: "clamp(8px, 1.5vw, 12px)", color: "#F5F0EA" }}>{r.name}</td>
                    <td style={{ padding: "clamp(8px, 1.5vw, 12px)", color: "#9E8E78" }}>{r.booked_days}</td>
                    <td style={{ padding: "clamp(8px, 1.5vw, 12px)", color: "#9E8E78" }}>{r.total_days}</td>
                    <td style={{ padding: "clamp(8px, 1.5vw, 12px)", color: "#C9A96E" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                        <span>{r.occupancy_pct}%</span>
                        <div style={{ width: "clamp(40px, 10vw, 80px)", height: 4, background: "#2A2118", borderRadius: 2 }}>
                          <div style={{ width: `${r.occupancy_pct}%`, height: 4, background: "#C9A96E", borderRadius: 2 }} />
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}