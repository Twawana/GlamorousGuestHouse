import { useState, useEffect } from "react";
import { apiFetch, formatPrice, roomImg } from "../utils";
import Spinner from "../components/Spinner";
import "../styles/pages/adminrooms.css";

export default function AdminRooms({ onToast }: { onToast: (m: string, t?: "success"|"error") => void }) {
  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showForm, setShowForm] = useState<boolean>(false);
  const [editRoom, setEditRoom] = useState<any | null>(null);
  const blank: any = { 
    name: "", 
    type: "standard", 
    description: "", 
    price_per_night: "", 
    capacity: 2, 
    size_sqm: "", 
    amenities: "", 
    status: "available",
    images: [] 
  };
  const [form, setForm] = useState<any>(blank);
  const [saving, setSaving] = useState<boolean>(false);
  const [uploading, setUploading] = useState<boolean>(false);
  const [previewImages, setPreviewImages] = useState<string[]>([]);

  const load = async () => {
    setLoading(true);
    const data = await apiFetch("/rooms");
    setRooms(data.rooms || data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openEdit = (r: any) => {
    setEditRoom(r);
    setForm({ 
      ...r, 
      amenities: (r.amenities || []).join(", "),
      images: r.images || []
    });
    setPreviewImages(r.images || []);
    setShowForm(true);
  };

  // Handle image upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    const formData = new FormData();
    
    // Append all selected files
    for (let i = 0; i < files.length; i++) {
      formData.append('images', files[i]);
    }

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('gg_token')}`
        }
      });

      const data = await response.json();
      
      if (data.error) {
        onToast(data.error, "error");
      } else {
        // Add new image URLs to existing ones
        const updatedImages = [...(form.images || []), ...data.urls];
        setForm({ ...form, images: updatedImages });
        setPreviewImages(updatedImages);
        onToast(`${data.urls.length} image(s) uploaded`, "success");
      }
    } catch (error) {
      console.error('Upload error:', error);
      onToast('Upload failed', "error");
    } finally {
      setUploading(false);
      // Clear the input
      e.target.value = '';
    }
  };

  // Remove an image
  const removeImage = (indexToRemove: number) => {
    const updatedImages = form.images.filter((_: any, idx: number) => idx !== indexToRemove);
    setForm({ ...form, images: updatedImages });
    setPreviewImages(updatedImages);
  };

  // Set featured image (first image)
  const setFeatured = (index: number) => {
    const images = [...form.images];
    const [removed] = images.splice(index, 1);
    images.unshift(removed);
    setForm({ ...form, images });
    setPreviewImages(images);
  };

  const save = async () => {
    if (!form.name || !form.price_per_night) return onToast("Name and price are required.", "error");
    setSaving(true);
    const body = {
      ...form,
      price_per_night: parseFloat(form.price_per_night),
      capacity: parseInt(form.capacity),
      size_sqm: form.size_sqm ? parseFloat(form.size_sqm) : null,
      amenities: form.amenities.split(",").map((a: string) => a.trim()).filter(Boolean),
      images: form.images || [] // Include images in the save
    };
    const path = editRoom ? `/rooms/${editRoom.id}` : "/rooms";
    const method = editRoom ? "PUT" : "POST";
    const data = await apiFetch(path, { method, body: JSON.stringify(body) });
    if (data.error) { onToast(data.error, "error"); } else {
      onToast(editRoom ? "Room updated." : "Room created.", "success");
      setShowForm(false); setEditRoom(null); setForm(blank); setPreviewImages([]); load();
    }
    setSaving(false);
  };

  const del = async (id: string | number) => {
    if (!window.confirm("Delete this room?")) return;
    const data = await apiFetch(`/rooms/${id}`, { method: "DELETE" });
    if (data.error) { onToast(data.error, "error"); } else { onToast("Room deleted.", "success"); load(); }
  };

  const sf = (k: string) => (e: any) => setForm((f: any) => ({ ...f, [k]: e.target.value }));

  if (loading) return <Spinner />;

  return (
    <div className="fade-in">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h2 className="serif gold" style={{ fontSize: 28 }}>Manage Rooms</h2>
        <button className="btn-gold" onClick={() => { setEditRoom(null); setForm(blank); setPreviewImages([]); setShowForm(true); }}>+ Add Room</button>
      </div>

      {showForm && (
        <div className="card fade-in" style={{ padding: "24px", marginBottom: 24 }}>
          <h3 className="serif" style={{ fontSize: 22, marginBottom: 20, color: "#F5F0EA" }}>{editRoom ? "Edit Room" : "New Room"}</h3>
          
          {/* Image Upload Section */}
          <div style={{ marginBottom: 24 }}>
            <label style={{ color: "#9E8E78", fontSize: 11, letterSpacing: 1, textTransform: "uppercase", display: "block", marginBottom: 12 }}>
              Room Images
            </label>
            
            {/* Image Previews */}
            {previewImages.length > 0 && (
              <div style={{ 
                display: "grid", 
                gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", 
                gap: 12,
                marginBottom: 16
              }}>
                {previewImages.map((img, idx) => (
                  <div key={idx} style={{ 
                    position: "relative",
                    border: idx === 0 ? "2px solid #C9A96E" : "1px solid #2A2118",
                    borderRadius: 4,
                    overflow: "hidden",
                    aspectRatio: "1/1"
                  }}>
                    <img 
                      src={img} 
                      alt={`Room ${idx + 1}`} 
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                    <div style={{
                      position: "absolute",
                      top: 4,
                      right: 4,
                      display: "flex",
                      gap: 4
                    }}>
                      {idx !== 0 && (
                        <button
                          onClick={() => setFeatured(idx)}
                          style={{
                            background: "rgba(0,0,0,0.7)",
                            border: "none",
                            color: "#C9A96E",
                            width: 24,
                            height: 24,
                            borderRadius: 4,
                            cursor: "pointer",
                            fontSize: 12
                          }}
                          title="Set as featured"
                        >
                          ★
                        </button>
                      )}
                      <button
                        onClick={() => removeImage(idx)}
                        style={{
                          background: "rgba(255,0,0,0.7)",
                          border: "none",
                          color: "white",
                          width: 24,
                          height: 24,
                          borderRadius: 4,
                          cursor: "pointer",
                          fontSize: 12
                        }}
                        title="Remove"
                      >
                        ✕
                      </button>
                    </div>
                    {idx === 0 && (
                      <div style={{
                        position: "absolute",
                        bottom: 4,
                        left: 4,
                        background: "#C9A96E",
                        color: "#0D0A07",
                        fontSize: 10,
                        padding: "2px 6px",
                        borderRadius: 2
                      }}>
                        Featured
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Upload Button */}
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <label style={{ flex: 1 }}>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  disabled={uploading}
                  style={{ display: "none" }}
                />
                <div style={{
                  background: "#1A1410",
                  border: "1px dashed #2A2118",
                  padding: "12px",
                  textAlign: "center",
                  color: "#9E8E78",
                  cursor: "pointer",
                  borderRadius: 4
                }}>
                  {uploading ? "Uploading..." : "📸 Click to upload images (multiple allowed)"}
                </div>
              </label>
            </div>
          </div>

          {/* Room Details Form */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 14 }}>
            <div>
              <label style={{ color: "#9E8E78", fontSize: 11, letterSpacing: 1, textTransform: "uppercase", display: "block", marginBottom: 6 }}>Room Name *</label>
              <input placeholder="The Golden Suite" value={form.name} onChange={sf("name")} />
            </div>
            <div>
              <label style={{ color: "#9E8E78", fontSize: 11, letterSpacing: 1, textTransform: "uppercase", display: "block", marginBottom: 6 }}>Price / Night (R) *</label>
              <input type="number" placeholder="500" value={form.price_per_night} onChange={sf("price_per_night")} />
            </div>
            <div>
              <label style={{ color: "#9E8E78", fontSize: 11, letterSpacing: 1, textTransform: "uppercase", display: "block", marginBottom: 6 }}>Size (m²)</label>
              <input type="number" placeholder="45" value={form.size_sqm} onChange={sf("size_sqm")} />
            </div>
            <div>
              <label style={{ color: "#9E8E78", fontSize: 11, letterSpacing: 1, textTransform: "uppercase", display: "block", marginBottom: 6 }}>Type</label>
              <select value={form.type} onChange={sf("type")}>
                {['standard','deluxe','suite','penthouse'].map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label style={{ color: "#9E8E78", fontSize: 11, letterSpacing: 1, textTransform: "uppercase", display: "block", marginBottom: 6 }}>Capacity</label>
              <input type="number" min={1} value={form.capacity} onChange={sf("capacity")} />
            </div>
            <div>
              <label style={{ color: "#9E8E78", fontSize: 11, letterSpacing: 1, textTransform: "uppercase", display: "block", marginBottom: 6 }}>Status</label>
              <select value={form.status} onChange={sf("status")}>
                {['available','maintenance','unavailable'].map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div style={{ gridColumn: "1/-1" }}>
              <label style={{ color: "#9E8E78", fontSize: 11, letterSpacing: 1, textTransform: "uppercase", display: "block", marginBottom: 6 }}>Amenities (comma-separated)</label>
              <input placeholder="King Bed, Sea View, Jacuzzi, Mini Bar" value={form.amenities} onChange={sf("amenities")} />
            </div>
            <div style={{ gridColumn: "1/-1" }}>
              <label style={{ color: "#9E8E78", fontSize: 11, letterSpacing: 1, textTransform: "uppercase", display: "block", marginBottom: 6 }}>Description</label>
              <textarea rows={3} value={form.description} onChange={sf("description")} />
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
            <button className="btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
            <button className="btn-gold" onClick={save} disabled={saving || uploading}>
              {saving ? "Saving…" : "Save Room"}
            </button>
          </div>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 18 }}>
        {rooms.map(r => (
          <div key={r.id} className="card">
            <img src={roomImg(r)} alt={r.name} style={{ width: "100%", height: 140, objectFit: "cover" }} />
            <div style={{ padding: "16px 18px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                <div>
                  <h4 className="serif" style={{ fontSize: 18, color: "#F5F0EA" }}>{r.name}</h4>
                  <p style={{ color: "#C9A96E", fontSize: 12, textTransform: "uppercase", letterSpacing: 1 }}>{r.type}</p>
                </div>
                <span style={{
                  background: r.status === "available" ? "#14532D22" : "#7F1D1D22",
                  color: r.status === "available" ? "#86EFAC" : "#FCA5A5",
                  padding: "2px 8px", borderRadius: 20, fontSize: 11
                }}>{r.status}</span>
              </div>
              <p className="serif gold" style={{ fontSize: 20, margin: "8px 0" }}>
                {formatPrice(r.price_per_night)}<span style={{ color: "#5a4f42", fontSize: 13, fontFamily: "Jost" }}>/night</span>
              </p>
              <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                <button className="btn-ghost" onClick={() => openEdit(r)} style={{ flex: 1, padding: "7px 0", fontSize: 12 }}>Edit</button>
                <button className="btn-danger" onClick={() => del(r.id)} style={{ flex: 1, fontSize: 12 }}>Delete</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}