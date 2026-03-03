import { useState } from "react";
import { roomImages, formatPrice } from "../utils";

export default function RoomDetailsModal({
  room,
  onClose,
  onBook,
}: {
  room: any;
  onClose: () => void;
  onBook: (r: any) => void;
}) {
  const [imageIndex, setImageIndex] = useState(0);
  const images = roomImages(room);

  const nextImage = () => setImageIndex((i) => (i + 1) % images.length);
  const prevImage = () => setImageIndex((i) => (i - 1 + images.length) % images.length);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal"
        style={{ maxWidth: 900, maxHeight: "90vh", overflow: "auto" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: 16,
            right: 16,
            zIndex: 10,
            background: "rgba(13,10,7,.8)",
            border: "1px solid #2A2118",
            color: "#C9A96E",
            width: 40,
            height: 40,
            borderRadius: "50%",
            cursor: "pointer",
            fontSize: 20,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          ✕
        </button>

        {/* Image Gallery */}
        <div style={{ position: "relative", height: 400, overflow: "hidden", marginBottom: 24 }}>
          <img
            src={images[imageIndex]}
            alt={`${room.name} - Image ${imageIndex + 1}`}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />

          {/* Image Navigation */}
          {images.length > 1 && (
            <>
              <button
                onClick={prevImage}
                style={{
                  position: "absolute",
                  left: 16,
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "rgba(13,10,7,.7)",
                  border: "1px solid #2A2118",
                  color: "#C9A96E",
                  width: 40,
                  height: 40,
                  borderRadius: "50%",
                  cursor: "pointer",
                  fontSize: 18,
                }}
              >
                ‹
              </button>
              <button
                onClick={nextImage}
                style={{
                  position: "absolute",
                  right: 16,
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "rgba(13,10,7,.7)",
                  border: "1px solid #2A2118",
                  color: "#C9A96E",
                  width: 40,
                  height: 40,
                  borderRadius: "50%",
                  cursor: "pointer",
                  fontSize: 18,
                }}
              >
                ›
              </button>

              {/* Image counter */}
              <div
                style={{
                  position: "absolute",
                  bottom: 16,
                  right: 16,
                  background: "rgba(13,10,7,.8)",
                  color: "#C9A96E",
                  padding: "6px 12px",
                  borderRadius: 4,
                  fontSize: 12,
                  letterSpacing: 1,
                }}
              >
                {imageIndex + 1} / {images.length}
              </div>
            </>
          )}
        </div>

        {/* Thumbnail Gallery */}
        {images.length > 1 && (
          <div
            style={{
              display: "flex",
              gap: 10,
              marginBottom: 24,
              overflowX: "auto",
              paddingBottom: 8,
            }}
          >
            {images.map((img, idx) => (
              <button
                key={idx}
                onClick={() => setImageIndex(idx)}
                style={{
                  flexShrink: 0,
                  width: 80,
                  height: 80,
                  borderRadius: 4,
                  border: idx === imageIndex ? "2px solid #C9A96E" : "1px solid #2A2118",
                  padding: 0,
                  cursor: "pointer",
                  background: "none",
                  overflow: "hidden",
                }}
              >
                <img
                  src={img}
                  alt={`Thumbnail ${idx + 1}`}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    opacity: idx === imageIndex ? 1 : 0.6,
                  }}
                />
              </button>
            ))}
          </div>
        )}

        {/* Room Info */}
        <div style={{ paddingBottom: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: 20 }}>
            <div>
              <h2 className="serif gold" style={{ fontSize: 32, marginBottom: 8 }}>
                {room.name}
              </h2>
              <p style={{ color: "#C9A96E", fontSize: 12, letterSpacing: 1.5, textTransform: "uppercase" }}>
                {room.type}
              </p>
            </div>
            <div style={{ textAlign: "right" }}>
              <span className="serif gold" style={{ fontSize: 28 }}>
                {formatPrice(room.price_per_night)}
              </span>
              <p style={{ color: "#5a4f42", fontSize: 12 }}>per night</p>
            </div>
          </div>

          {/* Description */}
          <p
            style={{
              color: "#9E8E78",
              fontSize: 14,
              lineHeight: 1.8,
              marginBottom: 24,
            }}
          >
            {room.description ||
              ""}
          </p>

          {/* Key Details */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
              gap: 16,
              marginBottom: 24,
            }}
          >
            <div className="card" style={{ padding: "12px 16px" }}>
              <p style={{ color: "#5a4f42", fontSize: 11, letterSpacing: 1, textTransform: "uppercase", marginBottom: 4 }}>
                Capacity
              </p>
              <p className="serif gold" style={{ fontSize: 18 }}>
                {room.capacity} Guest{room.capacity > 1 ? "s" : ""}
              </p>
            </div>
            {room.size_sqm && (
              <div className="card" style={{ padding: "12px 16px" }}>
                <p style={{ color: "#5a4f42", fontSize: 11, letterSpacing: 1, textTransform: "uppercase", marginBottom: 4 }}>
                  Room Size
                </p>
                <p className="serif gold" style={{ fontSize: 18 }}>
                  {room.size_sqm} m²
                </p>
              </div>
            )}
            <div className="card" style={{ padding: "12px 16px" }}>
              <p style={{ color: "#5a4f42", fontSize: 11, letterSpacing: 1, textTransform: "uppercase", marginBottom: 4 }}>
                Status
              </p>
              <p
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: room.status === "available" ? "#86EFAC" : "#FCA5A5",
                  textTransform: "capitalize",
                }}
              >
                {room.status}
              </p>
            </div>
          </div>

          {/* Amenities */}
          {room.amenities?.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <h3 className="serif" style={{ fontSize: 18, color: "#F5F0EA", marginBottom: 12 }}>
                Amenities
              </h3>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {room.amenities.map((amenity: string, idx: number) => (
                  <span
                    key={idx}
                    style={{
                      background: "#1C1712",
                      border: "1px solid #2A2118",
                      color: "#C9A96E",
                      fontSize: 12,
                      padding: "6px 12px",
                      borderRadius: 4,
                    }}
                  >
                    ✓ {amenity}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div
            style={{
              display: "flex",
              gap: 12,
              paddingTop: 20,
              borderTop: "1px solid #2A2118",
            }}
          >
            <button
              className="btn-gold"
              onClick={() => {
                onBook(room);
                onClose();
              }}
              disabled={room.status !== "available"}
              style={{
                flex: 1,
                opacity: room.status !== "available" ? 0.4 : 1,
                cursor: room.status !== "available" ? "not-allowed" : "pointer",
              }}
            >
              {room.status === "available" ? "Book Now" : "Not Available"}
            </button>
            <button className="btn-ghost" onClick={onClose} style={{ flex: 1 }}>
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
