import { useState, useEffect } from "react";
import { apiFetch } from "../utils";
import Spinner from "../components/Spinner";
import "../styles/pages/staff.css";

export default function ManageStaff({ onToast }: { onToast: (m: string, t?: "success"|"error") => void }) {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showForm, setShowForm] = useState<boolean>(false);
  const [form, setForm] = useState<any>({ name: "", email: "", password: "", role: "staff" });
  const [saving, setSaving] = useState<boolean>(false);
  const [roleFilter, setRoleFilter] = useState<string>("");

  const loadUsers = async () => {
    setLoading(true);
    try {
      const params = roleFilter ? `?role=${roleFilter}` : "";
      const data: any = await apiFetch(`/users${params}`);

      // data may be { users: [...] } or directly an array;
      if (Array.isArray(data.users)) {
        setUsers(data.users);
      } else if (Array.isArray(data)) {
        setUsers(data);
      } else {
        setUsers([]);
      }
    } catch (error: any) {
      onToast(error?.message || "Failed to load users.", "error");
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    loadUsers(); 
  }, [roleFilter]);

  const createStaff = async () => {
    if (!form.name || !form.email || !form.password) {
      return onToast("Name, email, and password are required.", "error");
    }
    if (form.password.length < 6) {
      return onToast("Password must be at least 6 characters.", "error");
    }

    setSaving(true);
    try {
      const data = await apiFetch("/auth/register", {
        method: "POST",
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          password: form.password,
          role: form.role
        }),
      });

      if (data.error) {
        onToast(data.error, "error");
      } else {
        onToast(`${form.role.charAt(0).toUpperCase() + form.role.slice(1)} account created.`, "success");
        setForm({ name: "", email: "", password: "", role: "staff" });
        setShowForm(false);
        loadUsers();
      }
    } catch (error) {
      onToast("Failed to create account.", "error");
    } finally {
      setSaving(false);
    }
  };

  const updateRole = async (userId: string | number, newRole: string) => {
    try {
      const data = await apiFetch(`/users/${userId}/role`, {
        method: "PUT",
        body: JSON.stringify({ role: newRole }),
      });

      if (data.error) {
        onToast(data.error, "error");
      } else {
        onToast("Role updated.", "success");
        loadUsers();
      }
    } catch (error) {
      onToast("Failed to update role.", "error");
    }
  };

  const deleteUser = async (userId: string | number) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;

    try {
      const data = await apiFetch(`/users/${userId}`, { method: "DELETE" });

      if (data.error) {
        onToast(data.error, "error");
      } else {
        onToast("User deleted.", "success");
        loadUsers();
      }
    } catch (error) {
      onToast("Failed to delete user.", "error");
    }
  };

  const set = (k: string) => (e: any) => setForm((f: any) => ({ ...f, [k]: e.target.value }));

  if (loading) return <Spinner />;

  return (
    <div className="fade-in">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h2 className="serif gold" style={{ fontSize: 28 }}>Manage Staff</h2>
        <button className="btn-gold" onClick={() => setShowForm(true)}>+ Add Staff Member</button>
      </div>

      {showForm && (
        <div className="card fade-in" style={{ padding: "24px", marginBottom: 24 }}>
          <h3 className="serif" style={{ fontSize: 22, marginBottom: 20, color: "#F5F0EA" }}>Create New Account</h3>
          
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <label style={{ color: "#9E8E78", fontSize: 11, letterSpacing: 1, textTransform: "uppercase", display: "block", marginBottom: 6 }}>Full Name</label>
              <input name="name" id="staff-name" placeholder="Jane Doe" value={form.name} onChange={set("name")} />
            </div>

            <div>
              <label style={{ color: "#9E8E78", fontSize: 11, letterSpacing: 1, textTransform: "uppercase", display: "block", marginBottom: 6 }}>Email</label>
              <input name="email" id="staff-email" type="email" placeholder="jane@example.com" value={form.email} onChange={set("email") } />
            </div>

            <div>
              <label style={{ color: "#9E8E78", fontSize: 11, letterSpacing: 1, textTransform: "uppercase", display: "block", marginBottom: 6 }}>Password</label>
              <input name="password" id="staff-password" type="password" placeholder="••••••••" value={form.password} onChange={set("password")} />
            </div>

            <div>
              <label style={{ color: "#9E8E78", fontSize: 11, letterSpacing: 1, textTransform: "uppercase", display: "block", marginBottom: 6 }}>Role</label>
              <select value={form.role} onChange={set("role")} style={{ padding: "10px", borderRadius: 6, border: "1px solid #2A2118", background: "#15100B", color: "#F5F0EA" }}>
                <option value="staff">Staff</option>
                <option value="customer">Customer</option>
              </select>
            </div>

            <div style={{ display: "flex", gap: 12 }}>
              <button className="btn-gold" onClick={createStaff} disabled={saving} style={{ flex: 1 }}>
                {saving ? "Creating…" : "Create Account"}
              </button>
              <button className="btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      <div style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", gap: 0, borderBottom: "1px solid #2A2118" }}>
          {["", "customer", "staff", "owner"].map(role => (
            <button key={role} className={`tab ${roleFilter === role ? "active" : ""}`} onClick={() => setRoleFilter(role)} style={{ fontSize: 11 }}>
              {role ? role.charAt(0).toUpperCase() + role.slice(1) : "All"}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {users.length === 0 ? (
          <p style={{ color: "#5a4f42", textAlign: "center", padding: "40px 0" }}>No users found</p>
        ) : (
          users.map(user => (
            <div key={user.id} className="card" style={{ padding: "18px 22px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
                <div>
                  <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 8 }}>
                    <span className="serif" style={{ fontSize: 18, color: "#F5F0EA" }}>{user.name}</span>
                    <span style={{ background: "#C9A96E22", color: "#C9A96E", padding: "3px 12px", borderRadius: 20, fontSize: 11, border: "1px solid #C9A96E44", textTransform: "uppercase", letterSpacing: 1 }}>
                      {user.role}
                    </span>
                  </div>
                  <p style={{ color: "#5a4f42", fontSize: 12 }}>{user.email}</p>
                  {user.phone && <p style={{ color: "#5a4f42", fontSize: 12 }}>{user.phone}</p>}
                  <p style={{ color: "#9E8E78", fontSize: 11 }}>ID: {user.id}</p>
                </div>

                <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "flex-end" }}>
                  {user.role !== "staff" && (
                    <button
                      onClick={() => updateRole(user.id, "staff")}
                      style={{ background: "#1e3a8a", color: "#93c5fd", border: "none", padding: "8px 14px", borderRadius: 4, fontSize: 11, letterSpacing: 1, textTransform: "uppercase", cursor: "pointer" }}
                    >
                      Make Staff
                    </button>
                  )}
                  {user.role !== "customer" && user.role !== "staff" && (
                    <button
                      onClick={() => updateRole(user.id, "customer")}
                      style={{ background: "#78350f", color: "#fed7aa", border: "none", padding: "8px 14px", borderRadius: 4, fontSize: 11, letterSpacing: 1, textTransform: "uppercase", cursor: "pointer" }}
                    >
                      Make Customer
                    </button>
                  )}
                  <button
                    onClick={() => deleteUser(user.id)}
                    style={{ background: "#7F1D1D", color: "#FCA5A5", border: "none", padding: "8px 14px", borderRadius: 4, fontSize: 11, letterSpacing: 1, textTransform: "uppercase", cursor: "pointer" }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
