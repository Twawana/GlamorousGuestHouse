import React from "react";
import { roomImg, formatPrice } from "../utils";

export default function RoomCard({ room, onBook }: { room: any; onBook: (r: any) => void }) {
  return (
    <div className="card room-card fade-in">
      <div style={{ position: "relative", height: 220, overflow: "hidden" }}>
        <img
          src={roomImg(room)}
          alt={room.name}
          style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform .4s" }}
          onMouseEnter={(e: React.MouseEvent<HTMLImageElement>) => e.currentTarget.style.transform = "scale(1.05)"}
          onMouseLeave={(e: React.MouseEvent<HTMLImageElement>) => e.currentTarget.style.transform = "scale(1)"}
        />
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(to top, rgba(13,10,7,.9) 0%, transparent 50%)"
        }} />
        <div style={{ position: "absolute", top: 12, right: 12 }}>
          <span style={{
            background: room.status === "available" ? "#14532D" : "#7F1D1D",
            color: room.status === "available" ? "#86EFAC" : "#FCA5A5",
            padding: "3px 10px", borderRadius: 20, fontSize: 11, letterSpacing: .5
          }}>
            {room.status}
          </span>
        </div>
        <div style={{ position: "absolute", bottom: 14, left: 16, right: 16 }}>
          <h3 className="serif" style={{ fontSize: 22, color: "#F5F0EA", lineHeight: 1.2 }}>{room.name}</h3>
          <p style={{ color: "#C9A96E", fontSize: 12, letterSpacing: 1, textTransform: "uppercase", marginTop: 2 }}>{room.type}</p>
        </div>
      </div>
      <div style={{ padding: "18px 20px" }}>
        <p style={{ color: "#7A6E63", fontSize: 13, lineHeight: 1.6, marginBottom: 14, height: 60, overflow: "hidden" }}>
          {room.description || "A beautifully appointed room with premium finishes and thoughtful amenities."}
        </p>
        <div style={{ display: "flex", gap: 16, marginBottom: 14, flexWrap: "wrap" }}>
          <span style={{ color: "#9E8E78", fontSize: 12, display: "flex", alignItems: "center", gap: 4 }}>
            👤 {room.capacity} guest{room.capacity > 1 ? "s" : ""}
          </span>
          {room.size_sqm && (
            <span style={{ color: "#9E8E78", fontSize: 12, display: "flex", alignItems: "center", gap: 4 }}>
              📐 {room.size_sqm} m²
            </span>
          )}
        </div>
        {room.amenities?.length > 0 && (
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 }}>
            {room.amenities.slice(0, 4).map((a: string, i: number) => (
              <span key={i} style={{ background: "#1C1712", border: "1px solid #2A2118", color: "#9E8E78", fontSize: 11, padding: "2px 8px", borderRadius: 4 }}>{a}</span>
            ))}
            {room.amenities.length > 4 && (
              <span style={{ color: "#5a4f42", fontSize: 11, padding: "2px 4px" }}>+{room.amenities.length - 4}</span>
            )}
          </div>
        )}
        <hr className="divider" style={{ marginBottom: 16 }} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <span className="serif gold" style={{ fontSize: 24, fontWeight: 600 }}>{formatPrice(room.price_per_night)}</span>
            <span style={{ color: "#5a4f42", fontSize: 12 }}> / night</span>
          </div>
          <button
            className="btn-gold"
            onClick={() => onBook(room)}
            disabled={room.status !== "available"}
            style={{ opacity: room.status !== "available" ? 0.4 : 1, cursor: room.status !== "available" ? "not-allowed" : "pointer" }}
          >
            Book Now
          </button>
        </div>
      </div>
    </div>
  );
}
