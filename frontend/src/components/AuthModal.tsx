import { useState } from "react";
import { apiFetch } from "../utils";
import type { CE } from "../types";

export default function AuthModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: (user: any) => void }) {
  const [mode, setMode] = useState<string>("login");
  const [form, setForm] = useState<any>({ name: "", email: "", password: "", phone: "" });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const set = (k: string) => (e: CE) => setForm((f: any) => ({ ...f, [k]: e.target.value }));

  const submit = async () => {
    setErr(""); setLoading(true);
    try {
      const path = mode === "login" ? "/auth/login" : "/auth/register";
      const body = mode === "login"
        ? { email: form.email, password: form.password }
        : { name: form.name, email: form.email, password: form.password, phone: form.phone };
      const data = await apiFetch(path, { method: "POST", body: JSON.stringify(body) });
      if (data.token) {
        localStorage.setItem("gg_token", data.token);
        localStorage.setItem("gg_user", JSON.stringify(data.user));
        onSuccess(data.user);
      } else {
        setErr(data.error || data.message || "Something went wrong.");
      }
    } catch { setErr("Network error. Is the backend running on localhost:5000?"); }
    setLoading(false);
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
          <div>
            <h2 className="serif gold" style={{ fontSize: 28, marginBottom: 4 }}>{mode === "login" ? "Welcome Back" : "Create Account"}</h2>
            <p style={{ color: "#5a4f42", fontSize: 13 }}>{mode === "login" ? "Sign in to manage your bookings" : "Join Glamorous GuestHouse"}</p>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#5a4f42", fontSize: 20, lineHeight: 1 }}>✕</button>
        </div>

        <div style={{ display: "flex", gap: 0, marginBottom: 24, borderBottom: "1px solid #2A2118" }}>
          {[("login"), ("register")].map((m) => (
            <button key={m} className={`tab ${mode === m ? "active" : ""}`} onClick={() => { setMode(m); setErr(""); }}>
              {m === "login" ? "Sign In" : "Register"}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {mode === "register" && (
            <div>
              <label style={{ color: "#9E8E78", fontSize: 11, letterSpacing: 1, textTransform: "uppercase", display: "block", marginBottom: 6 }}>Full Name</label>
              <input placeholder="Jane Doe" value={form.name} onChange={set("name")} />
            </div>
          )}
          <div>
            <label style={{ color: "#9E8E78", fontSize: 11, letterSpacing: 1, textTransform: "uppercase", display: "block", marginBottom: 6 }}>Email</label>
            <input type="email" placeholder="you@example.com" value={form.email} onChange={set("email")} onKeyDown={e => e.key === "Enter" && submit()} />
          </div>
          <div>
            <label style={{ color: "#9E8E78", fontSize: 11, letterSpacing: 1, textTransform: "uppercase", display: "block", marginBottom: 6 }}>Password</label>
            <input type="password" placeholder="••••••••" value={form.password} onChange={set("password")} onKeyDown={e => e.key === "Enter" && submit()} />
          </div>
          {mode === "register" && (
            <div>
              <label style={{ color: "#9E8E78", fontSize: 11, letterSpacing: 1, textTransform: "uppercase", display: "block", marginBottom: 6 }}>Phone (optional)</label>
              <input placeholder="+27 82 000 0000" value={form.phone} onChange={set("phone")} />
            </div>
          )}
          {err && <p style={{ color: "#FCA5A5", fontSize: 13, background: "#7F1D1D22", padding: "8px 12px", borderRadius: 6, border: "1px solid #7F1D1D55" }}>{err}</p>}
          <button className="btn-gold" onClick={submit} disabled={loading} style={{ marginTop: 6 }}>{loading ? "Please wait…" : mode === "login" ? "Sign In" : "Create Account"}</button>
        </div>
        {mode === "login" && (
          <p style={{ color: "#5a4f42", fontSize: 12, marginTop: 16, textAlign: "center" }}>Demo: owner@glamorous.com / Glamorous!23</p>
        )}
      </div>
    </div>
  );
}
