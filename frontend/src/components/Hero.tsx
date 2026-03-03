import { useState, useEffect } from "react";
import { apiFetch } from "../utils";

export default function LandingPage({ onBrowse, onAuth, user }: { 
  onBrowse: () => void; 
  onAuth: () => void;
  user?: any | null;
}) {
  const [featuredRooms, setFeaturedRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const heroImages = [
    "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=1600&q=80",
    "https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=1600&q=80",
    "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1600&q=80",
    "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=1600&q=80"
  ];

  // Fetch featured rooms
  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const data = await apiFetch("/rooms?limit=3");
        setFeaturedRooms(data.rooms || data || []);
      } catch (error) {
        console.error("Failed to fetch rooms:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchFeatured();
  }, []);

  // Rotate hero images
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % heroImages.length);
    }, 6000);
    return () => clearInterval(interval);
  }, []);


  const testimonials = [
    {
      name: "Sarah Johnson",
      location: "Cape Town",
      text: "An unforgettable experience. The attention to detail and service was impeccable. Every moment felt curated just for us.",
      rating: 5,
      date: "March 2026"
    },
    {
      name: "Michael Chen",
      location: "Singapore",
      text: "The most luxurious stay in Western Cape. The suites are absolutely stunning, and the staff anticipated our every need.",
      rating: 5,
      date: "February 2026"
    },
    {
      name: "Emma Watson",
      location: "London",
      text: "Perfect romantic getaway. Woke up to the most breathtaking mountain views. We'll definitely be back.",
      rating: 5,
      date: "January 2026"
    }
  ];

  return (
    <div className="landing-page">
      {/* HERO SECTION with slideshow */}
      <section className="hero-section" style={{
        position: "relative",
        width: "100%",
        height: "100vh",
        minHeight: 700,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        marginTop: -44, // Offset main padding
      }}>
        {/* Background slideshow */}
        {heroImages.map((img, idx) => (
          <div key={idx} style={{
            position: "absolute",
            inset: 0,
            backgroundImage: `url(${img})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            opacity: idx === currentImageIndex ? 1 : 0,
            transition: "opacity 1.5s ease-in-out",
            filter: "brightness(0.4) saturate(0.9)"
          }} />
        ))}
        
        {/* Gradient overlay */}
        <div style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(135deg, rgba(13,10,7,0.8) 0%, rgba(13,10,7,0.4) 50%, rgba(13,10,7,0.8) 100%)"
        }} />

        {/* Hero content */}
        <div style={{ 
          position: "relative", 
          textAlign: "center", 
          padding: "0 24px", 
          maxWidth: 800,
          zIndex: 2
        }}>
          <div style={{ 
            display: "flex", 
            alignItems: "center", 
            justifyContent: "center", 
            gap: 12, 
            marginBottom: 24 
          }}>
            <div style={{ height: 1, width: 60, background: "linear-gradient(to right, transparent, #C9A96E)" }} />
            <p style={{ color: "#C9A96E", letterSpacing: 6, fontSize: 12, textTransform: "uppercase" }}>
              Retreat · Western Cape
            </p>
            <div style={{ height: 1, width: 60, background: "linear-gradient(to left, transparent, #C9A96E)" }} />
          </div>

          <h1 className="serif" style={{ 
            fontSize: "clamp(56px, 10vw, 120px)", 
            lineHeight: 0.9, 
            marginBottom: 24, 
            color: "#F5F0EA",
            fontWeight: 300,
            textShadow: "0 2px 20px rgba(0,0,0,0.3)"
          }}>
            <span style={{ fontStyle: "italic", fontWeight: 300 }}>Glamorous</span><br />
            <span style={{ fontWeight: 600, letterSpacing: 4 }}>GuestHouse</span>
          </h1>

          <p style={{ 
            color: "#E5D5B5", 
            fontSize: "clamp(16px, 2vw, 20px)", 
            lineHeight: 1.8, 
            maxWidth: 560, 
            margin: "0 auto 40px",
            textShadow: "0 1px 10px rgba(0,0,0,0.5)"
          }}>
            Bespoke luxury nestled in the heart of the Winelands. 
            Every stay, a story worth telling.
          </p>

          <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
            <button 
              className="btn-gold" 
              style={{ 
                fontSize: 13, 
                padding: "16px 48px", 
                letterSpacing: 2,
                borderRadius: 0
              }} 
              onClick={onBrowse}
            >
              Explore Rooms
            </button>
            {!user && (
              <button 
                className="btn-outline" 
                style={{ 
                  fontSize: 13, 
                  padding: "16px 48px", 
                  letterSpacing: 2,
                  background: "transparent",
                  border: "1px solid rgba(201, 169, 110, 0.5)",
                  color: "#F5F0EA",
                  borderRadius: 0
                }} 
                onClick={onAuth}
              >
                Sign In
              </button>
            )}
          </div>

          {/* Scroll indicator */}
          <div style={{
            position: "absolute",
            bottom: -100,
            left: "50%",
            transform: "translateX(-50%)",
            animation: "bounce 2s infinite"
          }}>
            <div style={{
              width: 30,
              height: 50,
              border: "2px solid rgba(201, 169, 110, 0.5)",
              borderRadius: 15,
              position: "relative"
            }}>
              <div style={{
                width: 4,
                height: 10,
                background: "#C9A96E",
                borderRadius: 2,
                position: "absolute",
                top: 8,
                left: "50%",
                transform: "translateX(-50%)",
                animation: "scrollWheel 2s infinite"
              }} />
            </div>
          </div>
        </div>
      </section>

      {/* WELCOME SECTION */}
      <section style={{ 
        maxWidth: 900, 
        margin: "80px auto",
        padding: "0 24px",
        textAlign: "center"
      }}>
        <span className="serif gold" style={{ fontSize: 12, letterSpacing: 4, textTransform: "uppercase" }}>
          Welcome to
        </span>
        <h2 className="serif" style={{ fontSize: 48, margin: "16px 0 24px", color: "#F5F0EA" }}>
          A Hidden Gem in the Winelands
        </h2>
        <p style={{ color: "#9E8E78", fontSize: 16, lineHeight: 1.9 }}>
          Nestled among rolling vineyards and majestic mountains, Glamorous GuestHouse offers 
          an intimate escape where timeless elegance meets modern luxury. Each of our carefully 
          curated suites tells a unique story, promising an unforgettable stay in South Africa's 
          most beautiful region.
        </p>
      </section>

  

      {/* FEATURED ROOMS */}
      {!loading && featuredRooms.length > 0 && (
        <section style={{ maxWidth: 1280, margin: "0 auto 80px", padding: "0 24px" }}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <span className="serif gold" style={{ fontSize: 12, letterSpacing: 4, textTransform: "uppercase" }}>
              Luxury Accommodations
            </span>
            <h2 className="serif" style={{ fontSize: 42, margin: "12px 0", color: "#F5F0EA" }}>
              Featured Suites
            </h2>
          </div>

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))",
            gap: 30
          }}>
            {featuredRooms.map((room: any) => (
              <div key={room.id} className="room-card" style={{
                background: "#15100B",
                border: "1px solid #2A2118",
                overflow: "hidden",
                transition: "transform 0.3s ease",
                cursor: "pointer"
              }}
              onClick={onBrowse}>
                <div style={{
                  height: 280,
                  backgroundImage: `url(${room.image_url || "https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=800&q=80"})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  position: "relative"
                }}>
                  <div style={{
                    position: "absolute",
                    top: 20,
                    right: 20,
                    background: "#C9A96E",
                    padding: "8px 20px",
                    color: "#0D0A07",
                    fontWeight: "bold",
                    fontSize: 14
                  }}>
                    R {room.price_per_night} <span style={{ fontSize: 11, fontWeight: "normal" }}>/ night</span>
                  </div>
                </div>
                <div style={{ padding: 24 }}>
                  <h3 className="serif" style={{ fontSize: 24, marginBottom: 8, color: "#F5F0EA" }}>{room.name}</h3>
                  <p style={{ color: "#9E8E78", fontSize: 14, marginBottom: 16, lineHeight: 1.7 }}>
                    {room.description?.substring(0, 100)}...
                  </p>
                  <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                    {room.capacity && (
                      <span style={{ fontSize: 12, color: "#C9A96E" }}>👥 Up to {room.capacity} guests</span>
                    )}
                    {room.size && (
                      <span style={{ fontSize: 12, color: "#C9A96E" }}>📐 {room.size} m²</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div style={{ textAlign: "center", marginTop: 40 }}>
            <button 
              className="btn-gold"
              onClick={onBrowse}
              style={{ padding: "14px 42px", fontSize: 13, letterSpacing: 2 }}
            >
              View All Rooms
            </button>
          </div>
        </section>
      )}

      {/* CTA SECTION */}
      <section style={{
        maxWidth: 900,
        margin: "0 auto 80px",
        padding: "60px 24px",
        textAlign: "center",
        borderTop: "1px solid #2A2118",
        borderBottom: "1px solid #2A2118"
      }}>
        <span className="serif gold" style={{ fontSize: 14, letterSpacing: 6, textTransform: "uppercase" }}>
          Begin Your Journey
        </span>
        <h2 className="serif" style={{ fontSize: 48, margin: "24px 0 32px", color: "#F5F0EA" }}>
          Ready for an Unforgettable Experience?
        </h2>
        <p style={{ color: "#9E8E78", marginBottom: 40, fontSize: 16, maxWidth: 600, margin: "0 auto 40px" }}>
          Book your stay at Glamorous GuestHouse and indulge in the finest hospitality 
          the Western Cape has to offer.
        </p>
        <button 
          className="btn-gold"
          onClick={user ? onBrowse : onAuth}
          style={{ padding: "18px 54px", fontSize: 14, letterSpacing: 2 }}
        >
          {user ? "Book Your Suite Now" : "Sign In to Book"}
        </button>
      </section>

      {/* CSS Animations */}
      <style>{`
        @keyframes bounce {
          0%, 20%, 50%, 80%, 100% {transform: translateY(0) translateX(-50%);}
          40% {transform: translateY(-30px) translateX(-50%);}
          60% {transform: translateY(-15px) translateX(-50%);}
        }
        @keyframes scrollWheel {
          0% {opacity: 1; transform: translate(-50%, 0);}
          100% {opacity: 0; transform: translate(-50%, 20px);}
        }
        .feature-card:hover, .room-card:hover {
          transform: translateY(-8px);
          border-color: #C9A96E;
          box-shadow: 0 10px 30px -10px rgba(201, 169, 110, 0.2);
        }
      `}</style>
    </div>
  );
}