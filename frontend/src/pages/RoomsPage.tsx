import { useState, useEffect, useCallback } from "react";
import { apiFetch } from "../utils";
import RoomCard from "../components/RoomCard";
import RoomDetailsModal from "../components/RoomDetailsModal";
import BookingModal from "../components/BookingModal";
import Spinner from "../components/Spinner";
import type { CE } from "../types";
import "../styles/pages/rooms.css";

export default function RoomsPage({ user, onToast }: { user?: any; onToast: (m: string, t?: "success"|"error") => void }) {
  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filters, setFilters] = useState<Record<string,string>>({ type: "", min_price: "", max_price: "", capacity: "" });
  const [selectedRoom, setSelectedRoom] = useState<any | null>(null);
  const [bookingRoom, setBookingRoom] = useState<any | null>(null);
  const [successBooking, setSuccessBooking] = useState<any | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filters.type) params.set("type", filters.type);
    if (filters.min_price) params.set("min_price", filters.min_price);
    if (filters.max_price) params.set("max_price", filters.max_price);
    if (filters.capacity) params.set("capacity", filters.capacity);
    const data = await apiFetch(`/rooms?${params}`);
    setRooms(data.rooms || data || []);
    setLoading(false);
  }, [filters]);

  useEffect(() => { load(); }, [load]);

  const handleBookingSuccess = (booking: any) => {
    setBookingRoom(null);
    setSuccessBooking(booking);
    onToast("Booking submitted! Awaiting confirmation.", "success");
  };

  const setF = (k: string) => (e: CE) => setFilters(f => ({ ...f, [k]: e.target.value }));

  return (
    <div>
      <div className="rooms-filters">
        <div className="filter-col">
          <label>Room Type</label>
          <select value={filters.type} onChange={setF("type")}>
            <option value="">All Types</option>
            <option value="standard">Standard</option>
            <option value="deluxe">Deluxe</option>
            <option value="suite">Suite</option>
            <option value="penthouse">Penthouse</option>
          </select>
        </div>
        <div className="filter-col">
          <label>Min Price</label>
          <input type="number" placeholder="R 0" value={filters.min_price} onChange={setF("min_price")} />
        </div>
        <div className="filter-col">
          <label>Max Price</label>
          <input type="number" placeholder="No limit" value={filters.max_price} onChange={setF("max_price")} />
        </div>
        <div className="filter-col">
          <label>Guests</label>
          <select value={filters.capacity} onChange={setF("capacity")}>
            <option value="">Any</option>
            <option value="1">1+</option>
            <option value="2">2+</option>
            <option value="4">4+</option>
          </select>
        </div>
        <button className="btn-ghost" onClick={() => setFilters({ type: "", min_price: "", max_price: "", capacity: "" })}>Clear</button>
      </div>

      {loading ? <Spinner /> : (
        <>
          <p className="rooms-count">{rooms.length} room{rooms.length !== 1 ? "s" : ""} found</p>
          <div className="rooms-grid">
            {rooms.map(r => (
              <RoomCard key={r.id} room={r} onBook={setBookingRoom} onViewDetails={setSelectedRoom} />
            ))}
          </div>
          {rooms.length === 0 && (
            <div className="no-rooms">
              <p className="serif">No rooms found</p>
              <p>Try adjusting your filters</p>
            </div>
          )}
        </>
      )}

      {bookingRoom && (
        <BookingModal room={bookingRoom} user={user} onClose={() => setBookingRoom(null)} onSuccess={handleBookingSuccess} />
      )}

      {selectedRoom && (
        <RoomDetailsModal room={selectedRoom} onClose={() => setSelectedRoom(null)} onBook={setBookingRoom} />
      )}

      {successBooking && (
        <div className="modal-overlay" onClick={() => setSuccessBooking(null)}>
          <div className="modal" style={{ textAlign: "center", maxWidth: 420 }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>✨</div>
            <h2 className="serif gold" style={{ fontSize: 28, marginBottom: 8 }}>Booking Received!</h2>
            <p className="muted">Your booking reference is:</p>
            <div className="ref-box">
              <span className="serif gold ref">{successBooking.booking_ref || successBooking.id}</span>
            </div>
            <p className="muted">We'll confirm your booking shortly. Please keep your reference safe.</p>
            <button className="btn-gold" onClick={() => setSuccessBooking(null)}>Done</button>
          </div>
        </div>
      )}
    </div>
  );
}
