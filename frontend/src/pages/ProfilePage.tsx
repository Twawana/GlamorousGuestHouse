import { useState } from "react";
import { apiFetch } from "../utils";
import "../styles/pages/profile.css";

export default function ProfilePage({ user, setUser, onToast }: { user: any; setUser: (u: any) => void; onToast: (m: string, t?: "success"|"error") => void }) {
  const [form, setForm] = useState<any>({ name: user?.name || "", phone: user?.phone || "" });
  const [saving, setSaving] = useState<boolean>(false);

  const save = async () => {
    setSaving(true);
    const data = await apiFetch("/auth/profile", { method: "PUT", body: JSON.stringify(form) });
    if (data.user || data.name) {
      const updated = data.user || { ...user, ...form };
      localStorage.setItem("gg_user", JSON.stringify(updated));
      setUser(updated);
      onToast("Profile updated.", "success");
    } else {
      onToast(data.error || "Update failed.", "error");
    }
    setSaving(false);
  };

  return (
    <div className="fade-in" style={{ maxWidth: 480 }}>
      <h2 className="serif gold" style={{ fontSize: 30, marginBottom: 24 }}>My Profile</h2>
      <div className="card" style={{ padding: "28px" }}>
        <div style={{
          width: 56, height: 56, borderRadius: "50%",
          background: "linear-gradient(135deg, #8B6A3E, #C9A96E)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 22, color: "#0D0A07", fontFamily: "Cormorant Garamond, serif",
          marginBottom: 20, fontWeight: 600
        }}>
          {user?.name?.[0]?.toUpperCase() || "?"}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label style={{ color: "#9E8E78", fontSize: 11, letterSpacing: 1, textTransform: "uppercase", display: "block", marginBottom: 6 }}>Display Name</label>
            <input name="name" id="profile-name" value={form.name} onChange={e => setForm((f: any) => ({ ...f, name: e.target.value }))} />
          </div>
          <div>
            <label style={{ color: "#9E8E78", fontSize: 11, letterSpacing: 1, textTransform: "uppercase", display: "block", marginBottom: 6 }}>Email</label>
            <input name="email" id="profile-email" value={user?.email} disabled style={{ opacity: .5, cursor: "not-allowed" }} />
          </div>
          <div>
            <label style={{ color: "#9E8E78", fontSize: 11, letterSpacing: 1, textTransform: "uppercase", display: "block", marginBottom: 6 }}>Phone</label>
            <input name="phone" id="profile-phone" value={form.phone} onChange={e => setForm((f: any) => ({ ...f, phone: e.target.value }))} placeholder="+27 82 000 0000" />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 4 }}>
            <span style={{ background: "#C9A96E22", color: "#C9A96E", padding: "3px 12px", borderRadius: 20, fontSize: 12, border: "1px solid #C9A96E44", textTransform: "uppercase", letterSpacing: 1 }}>
              {user?.role}
            </span>
            <button className="btn-gold" onClick={save} disabled={saving}>{saving ? "Saving…" : "Save Changes"}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
