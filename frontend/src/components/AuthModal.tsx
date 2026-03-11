import { useState } from "react";
import { apiFetch } from "../utils";
import type { CE } from "../types";


export default function AuthModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: (user: any) => void }) {
  const [mode, setMode] = useState<string>("login");
  const [form, setForm] = useState<any>({ name: "", email: "", password: "", phone: "" });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const set = (k: string) => (e: CE) => setForm((f: any) => ({ ...f, [k]: e.target.value }));

  // Client-side validation before hitting the API
  const validate = (): string => {
    if (mode === "register" && !form.name.trim()) return "Full name is required.";
    if (!form.email.trim()) return "Email is required.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return "Please enter a valid email address.";
    if (!form.password) return "Password is required.";
    if (mode === "register" && form.password.length < 6) return "Password must be at least 6 characters.";
    return "";
  };

  const submit = async () => {
    const validationErr = validate();
    if (validationErr) return setErr(validationErr);

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
    } catch (e: any) {
      // apiFetch throws an Error with the message from the server
      const msg = e?.message || "";
      // Try to detect common cases from the error message
      if (msg.toLowerCase().includes("already exists") || msg.toLowerCase().includes("conflict") || msg.includes("409")) {
        setErr("An account with this email already exists. Try signing in instead.");
      } else if (msg.toLowerCase().includes("invalid") || msg.toLowerCase().includes("incorrect") || msg.includes("401")) {
        setErr("Incorrect email or password. Please try again.");
      } else if (msg.toLowerCase().includes("not found") || msg.includes("404")) {
        setErr("No account found with that email. Try registering instead.");
      } else if (msg.toLowerCase().includes("too many") || msg.includes("429")) {
        setErr("Too many attempts. Please wait a moment and try again.");
      } else if (msg.toLowerCase().includes("network") || msg.toLowerCase().includes("fetch")) {
        setErr("Cannot connect to server. Is the backend running on localhost:5000?");
      } else {
        setErr(msg || "Something went wrong. Please try again.");
      }
    }
    setLoading(false);
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
          <div>
            <h2 className="serif gold" style={{ fontSize: 28, marginBottom: 4 }}>
              {mode === "login" ? "Welcome Back" : "Create Account"}
            </h2>
            <p style={{ color: "#5a4f42", fontSize: 13 }}>
              {mode === "login" ? "Sign in to manage your bookings" : "Join Glamorous GuestHouse"}
            </p>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#5a4f42", fontSize: 20, lineHeight: 1 }}>✕</button>
        </div>

        <div style={{ display: "flex", gap: 0, marginBottom: 24, borderBottom: "1px solid #2A2118" }}>
          {["login", "register"].map((m) => (
            <button key={m} className={`tab ${mode === m ? "active" : ""}`} onClick={() => { setMode(m); setErr(""); }}>
              {m === "login" ? "Sign In" : "Register"}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {mode === "register" && (
            <div>
              <label style={{ color: "#9E8E78", fontSize: 11, letterSpacing: 1, textTransform: "uppercase", display: "block", marginBottom: 6 }}>Full Name</label>
              <input name="name" id="auth-name" placeholder="Glamorous Guest" value={form.name} onChange={set("name")} />
            </div>
          )}
          <div>
            <label style={{ color: "#9E8E78", fontSize: 11, letterSpacing: 1, textTransform: "uppercase", display: "block", marginBottom: 6 }}>Email</label>
            <input name="email" id="auth-email" type="email" placeholder="you@example.com" value={form.email} onChange={set("email")} onKeyDown={e => e.key === "Enter" && submit()} />
          </div>
          <div>
            <label style={{ color: "#9E8E78", fontSize: 11, letterSpacing: 1, textTransform: "uppercase", display: "block", marginBottom: 6 }}>Password</label>
            <input name="password" id="auth-password" type="password" placeholder="••••••••" value={form.password} onChange={set("password")} onKeyDown={e => e.key === "Enter" && submit()} />
            {mode === "register" && (
              <p style={{ color: "#5a4f42", fontSize: 11, marginTop: 4 }}>Minimum 6 characters</p>
            )}
          </div>
          {mode === "register" && (
            <div>
              <label style={{ color: "#9E8E78", fontSize: 11, letterSpacing: 1, textTransform: "uppercase", display: "block", marginBottom: 6 }}>Phone (optional)</label>
              <input name="phone" id="auth-phone" placeholder="+264 81 000 0000" value={form.phone} onChange={set("phone")} />
            </div>
          )}

          {err && (
            <div style={{ display: "flex", alignItems: "flex-start", gap: 8, color: "#FCA5A5", fontSize: 13, background: "#7F1D1D22", padding: "10px 12px", borderRadius: 6, border: "1px solid #7F1D1D55" }}>
              <span style={{ flexShrink: 0, marginTop: 1 }}>⚠</span>
              <span>{err}</span>
            </div>
          )}

          {/* Helpful hint when email already exists */}
          {err.includes("already exists") && (
            <button
              onClick={() => { setMode("login"); setErr(""); }}
              style={{ background: "none", border: "none", color: "#C9A96E", fontSize: 13, textAlign: "left", cursor: "pointer", padding: 0, textDecoration: "underline" }}
            >
              → Switch to Sign In
            </button>
          )}

          {/* Helpful hint when account not found */}
          {err.includes("No account found") && (
            <button
              onClick={() => { setMode("register"); setErr(""); }}
              style={{ background: "none", border: "none", color: "#C9A96E", fontSize: 13, textAlign: "left", cursor: "pointer", padding: 0, textDecoration: "underline" }}
            >
              → Switch to Register
            </button>
          )}

          <button className="btn-gold" onClick={submit} disabled={loading} style={{ marginTop: 6 }}>
            {loading ? "Please wait…" : mode === "login" ? "Sign In" : "Create Account"}
          </button>
        </div>

        {mode === "login" && (
          <p style={{ color: "#5a4f42", fontSize: 12, marginTop: 16, textAlign: "center" }}>
            Don't have an account?{" "}
            <button
              onClick={() => { setMode("register"); setErr(""); }}
              style={{ background: "none", border: "none", color: "#C9A96E", fontSize: 12, cursor: "pointer", padding: 0, textDecoration: "underline" }}
            >
              Register here
            </button>
          </p>
        )}
      </div>
    </div>
  );
}