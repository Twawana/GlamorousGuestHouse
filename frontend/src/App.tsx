import { useState, useEffect } from "react";
import Toast from "./components/Toast";
import AuthModal from "./components/AuthModal";
import Hero from "./components/Hero";
import RoomsPage from "./pages/RoomsPage";
import MyBookingsPage from "./pages/MyBookingsPage";
import AdminBookings from "./pages/AdminBookings";
import AdminRooms from "./pages/AdminRooms";
import ReportsPage from "./pages/ReportsPage";
import ProfilePage from "./pages/ProfilePage";
import ManageStaff from "./pages/ManageStaff";
import type { ToastType } from "./types";
import { apiFetch } from "./utils";

// Authentication and Staff Management App

// ─── APP ─────────────────────────────────────────────────────────────────────
export default function App() {
  const [user, setUser] = useState<any | null>(() => {
    try {
      const stored = localStorage.getItem("gg_user");
      return stored ? JSON.parse(stored) : null;
    } catch { return null; }
  });
  
  // Validate token on app load
  useEffect(() => {
    const validateToken = async () => {
      const token = localStorage.getItem("gg_token");
      if (token && user) {
        try {
          const data = await apiFetch("/auth/me");
          if (data.user) {
            // Token is still valid, update user if needed
            localStorage.setItem("gg_user", JSON.stringify(data.user));
            setUser(data.user);
          } else {
            // Token is invalid or expired
            localStorage.removeItem("gg_token");
            localStorage.removeItem("gg_user");
            setUser(null);
          }
        } catch (error) {
          // Token validation failed, clear it
          localStorage.removeItem("gg_token");
          localStorage.removeItem("gg_user");
          setUser(null);
        }
      }
    };
    validateToken();
  }, []);
  const [page, setPage] = useState<string>("home");
  const [showAuth, setShowAuth] = useState<boolean>(false);
  const [toast, setToast] = useState<ToastType>(null);
  const [mobileMenu, setMobileMenu] = useState<boolean>(false);

  const isOwner = user?.role === "owner" || user?.role === "admin";
  const isStaff = user?.role === "staff";
  const toast_ = (msg: string, type: "success"|"error" = "success") => setToast({ msg, type, key: Date.now() });

  const logout = () => {
    localStorage.removeItem("gg_token");
    localStorage.removeItem("gg_user");
    setUser(null);
    setPage("home");
    toast_("Signed out.", "success");
  };

  const navItems = [
    { id: "rooms", label: "Rooms" },
    ...(user ? [{ id: "bookings", label: "My Bookings" }] : []),
    ...((isOwner || isStaff) ? [
      { id: "admin-bookings", label: "All Bookings" },
      { id: "admin-rooms", label: "Manage Rooms" },
    ] : []),
    ...(isOwner ? [ 
      { id: "manage-staff", label: "Manage Staff" },
      { id: "reports", label: "Reports" } 
    ] : []),
  ];

  const goTo = (p: string) => { setPage(p); setMobileMenu(false); window.scrollTo(0,0); };

  return (
    <div style={{ minHeight: "100vh", background: "#0D0A07" }}>
      {/* global styles are imported in main.tsx */}

      {/* NAV */}
      <nav style={{
        position: "sticky", top: 0, zIndex: 100,
        background: "rgba(13,10,7,.92)", backdropFilter: "blur(16px)",
        borderBottom: "1px solid #2A2118",
      }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 clamp(16px,4vw,48px)", display: "flex", alignItems: "center", height: 66 }}>
          <button onClick={() => goTo("home")} style={{ background: "none", border: "none", flex: 1, textAlign: "left" }}>
            <span className="serif gold" style={{ fontSize: 20, letterSpacing: 1 }}>Glamorous GuestHouse</span>
          </button>

          <div style={{ display: "flex", gap: 4, alignItems: "center" }} className="desktop-nav">
            {navItems.map(n => (
              <button key={n.id} className={`nav-link ${page === n.id ? "active" : ""}`} onClick={() => goTo(n.id)}
                style={{ padding: "6px 14px" }}>
                {n.label}
              </button>
            ))}
          </div>

          <div style={{ display: "flex", gap: 10, marginLeft: 20, alignItems: "center" }} className="desktop-nav">
            {user ? (
              <>
                <button className="nav-link" onClick={() => goTo("profile")} style={{ padding: "6px 14px" }}>
                  {user.name?.split(" ")[0]}
                </button>
                <button className="btn-ghost" onClick={logout} style={{ padding: "7px 18px", fontSize: 11 }}>Out</button>
              </>
            ) : (
              <button className="btn-gold" onClick={() => setShowAuth(true)} style={{ padding: "8px 22px", fontSize: 11 }}>Sign In</button>
            )}
          </div>

          <button
            onClick={() => setMobileMenu(!mobileMenu)}
            style={{ background: "none", border: "none", color: "#C9A96E", fontSize: 22, marginLeft: 12, display: "none" }}
            className="mobile-burger"
          >{mobileMenu ? "✕" : "☰"}</button>
        </div>

        {mobileMenu && (
          <div style={{ borderTop: "1px solid #2A2118", padding: "14px clamp(16px,4vw,48px)", display: "flex", flexDirection: "column", gap: 2 }}>
            {navItems.map(n => (
              <button key={n.id} className={`nav-link ${page === n.id ? "active" : ""}`} onClick={() => goTo(n.id)}
                style={{ textAlign: "left", padding: "10px 0" }}>
                {n.label}
              </button>
            ))}
            {user ? (
              <>
                <button className="nav-link" onClick={() => goTo("profile")} style={{ textAlign: "left", padding: "10px 0" }}>Profile</button>
                <button className="nav-link" onClick={logout} style={{ textAlign: "left", padding: "10px 0", color: "#FCA5A5" }}>Sign Out</button>
              </>
            ) : (
              <button className="nav-link" onClick={() => { setShowAuth(true); setMobileMenu(false); }} style={{ textAlign: "left", padding: "10px 0" }}>Sign In</button>
            )}
          </div>
        )}
        <style>{`
          @media (max-width: 640px) {
            .desktop-nav { display: none !important; }
            .mobile-burger { display: block !important; }
          }
        `}</style>
      </nav>

      {/* MAIN - hero full width, others centered */}
      <main style={{ width: "100%" }}>
        {page === "home" ? (
          <div style={{ width: "100vw" }}>
  <Hero
    user={user}
    onBrowse={() => goTo("rooms")}
    onAuth={() => setShowAuth(true)}
  />
</div>
        ) : (
<div style={{ 
  width: "100%", 
  display: "flex", 
  justifyContent: "center",
  padding: "0 24px 100px 24px",
  boxSizing: "border-box",
  overflowX: "auto"
}}>
            <div style={{ width: "100%", maxWidth: 1280 }}>
              {page === "rooms" && (
                <div style={{ paddingTop: 44 }}>
                  <div style={{ marginBottom: 32 }}>
                    <h2 className="serif gold" style={{ fontSize: 38, marginBottom: 8 }}>Our Rooms</h2>
                    <p style={{ color: "#5a4f42", fontSize: 14 }}>Thoughtfully curated spaces for discerning guests</p>
                  </div>
                  <RoomsPage user={user} onToast={toast_} />
                </div>
              )}
              {page === "bookings" && <div style={{ paddingTop: 44 }}><MyBookingsPage onToast={toast_} /></div>}
              {page === "admin-bookings" && <div style={{ paddingTop: 44 }}><AdminBookings onToast={toast_} /></div>}
              {page === "admin-rooms" && <div style={{ paddingTop: 44 }}><AdminRooms onToast={toast_} /></div>}
              {page === "manage-staff" && <div style={{ paddingTop: 44 }}><ManageStaff onToast={toast_} /></div>}
              {page === "reports" && <div style={{ paddingTop: 44 }}><ReportsPage /></div>}
              {page === "profile" && <div style={{ paddingTop: 44 }}><ProfilePage user={user} setUser={setUser} onToast={toast_} /></div>}
            </div>
          </div>
        )}
      </main>

      {showAuth && (
        <AuthModal
          onClose={() => setShowAuth(false)}
          onSuccess={(u) => { setUser(u); setShowAuth(false); setPage("rooms"); toast_(`Welcome, ${u.name}!`); }}
        />
      )}

      {toast && <Toast key={toast.key} msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      <footer style={{ borderTop: "1px solid #1a1410", padding: "36px clamp(16px,4vw,48px)", textAlign: "center" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", display: "flex", gap: 24, alignItems: "center", flexWrap: "wrap", justifyContent: "center" }}>
          <div style={{ flex: "1 1 280px", minWidth: 220, textAlign: "left" }}>
            <p className="serif gold" style={{ fontSize: 18, marginBottom: 8 }}>Glamorous GuestHouse</p>
            <p style={{ color: "#3D3428", fontSize: 12, letterSpacing: 1 }}>Penguin Street, 19 · Windhoek · Namibia</p>
          </div>

          <div style={{ flex: "1 1 320px", minWidth: 260, display: "flex", justifyContent: "center" }}>
            <div style={{ width: "100%", maxWidth: 420, borderRadius: 8, overflow: "hidden", boxShadow: "0 4px 12px rgba(0,0,0,.35)" }}>
              <iframe
                title="Glamorous GuestHouse Location"
                src="https://www.google.com/maps?q=Penguin%20Street%2019%20Windhoek%20Namibia&output=embed"
                width="100%"
                height="220"
                style={{ border: 0 }}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}