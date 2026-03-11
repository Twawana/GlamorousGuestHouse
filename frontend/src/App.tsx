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
import { FaFacebookF, FaInstagram, FaWhatsapp } from "react-icons/fa";
import logo from "./images/Logo.jpeg";

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
  <button onClick={() => goTo("home")} style={{ background: "none", border: "none", flex: 1, textAlign: "left", display: "flex", alignItems: "center", gap: 12 }}>
    {/* Logo space — replace with <img src="..." /> when ready */}
    <div style={{
      width: 38,
      height: 38,
      borderRadius: "50%",
      border: "1.5px solid #c9a84c",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
      overflow: "hidden"
    }}>
      <img src={logo} alt="Logo" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
    </div>
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

      <footer
  style={{
    borderTop: "1px solid #2A2118",
    padding: "48px clamp(16px,4vw,48px)",
    background: "#060b06",
    marginTop: 60,
  }}
>
  <div
    style={{
      maxWidth: 1280,
      margin: "0 auto",
      display: "flex",
      gap: 40,
      alignItems: "flex-start",
      flexWrap: "wrap",
      justifyContent: "space-between",
    }}
  >
    {/* LEFT SECTION */}
    <div style={{ flex: "1 1 280px", minWidth: 220 }}>
      <p
        className="serif gold"
        style={{ fontSize: 20, marginBottom: 12 }}
      >
        Glamorous GuestHouse
      </p>

      <p style={{ color: "#8B7355", fontSize: 13, marginBottom: 8 }}>
        Penguin Street, 19 · Windhoek · Namibia
      </p>

      <p style={{ color: "#C9A96E", fontSize: 14, marginBottom: 16 }}>
        📞 +264 81 234 5678
      </p>

      {/* SOCIAL ICONS */}
      <div style={{ display: "flex", gap: 16 }}>
        <a
          href="https://facebook.com"
          target="_blank"
          rel="noreferrer"
          style={{ color: "#C9A96E", transition: "0.3s" }}
        >
          <FaFacebookF size={18} />
        </a>

        <a
          href="https://wa.me/264812345678"
          target="_blank"
          rel="noreferrer"
          style={{ color: "#C9A96E", transition: "0.3s" }}
        >
          <FaWhatsapp size={18} />
        </a>

        <a
          href="https://instagram.com"
          target="_blank"
          rel="noreferrer"
          style={{ color: "#C9A96E", transition: "0.3s" }}
        >
          <FaInstagram size={18} />
        </a>
      </div>
    </div>

    {/* MAP SECTION */}
    <div
      style={{
        flex: "1 1 380px",
        minWidth: 260,
        display: "flex",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 420,
          borderRadius: 12,
          overflow: "hidden",
          boxShadow: "0 6px 20px rgba(0,0,0,.45)",
        }}
      >
        <iframe
          title="Glamorous GuestHouse Location"
          src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3377.8957508883704!2d17.082604!3d-22.559203!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x1d4555277f47a581%3A0x1234567890abcdef!2sPenguin%20Street%2019%2C%20Windhoek%2C%20Namibia!5e0!3m2!1sen!2sna!4v1234567890"
          width="100%"
          height="220"
          style={{ border: 0 }}
          loading="lazy"
          allowFullScreen
        />
      </div>
    </div>
  </div>

  {/* COPYRIGHT */}
  <div
    style={{
      marginTop: 40,
      textAlign: "center",
      fontSize: 12,
      color: "#6F5E46",
    }}
  >
    © {new Date().getFullYear()} Glamorous GuestHouse. All rights reserved.
    <p>TCentral</p>
  </div>
</footer>
    </div>
  );
}