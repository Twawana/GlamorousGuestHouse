import React, { useState, useEffect } from "react";
import { apiFetch } from "../utils";

export default function NotificationCenter({ user }: { user?: any }) {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showPanel, setShowPanel] = useState(false);
  const [loading, setLoading] = useState(false);

  // Load unread count periodically
  useEffect(() => {
    if (!user) return;

    const loadUnreadCount = async () => {
      try {
        const data = await apiFetch("/notifications/unread");
        setUnreadCount(data.unread_count || 0);
      } catch (err) {
        console.error("Unread count error:", err);
      }
    };

    loadUnreadCount();
    const interval = setInterval(loadUnreadCount, 10000); // Poll every 10 seconds
    return () => clearInterval(interval);
  }, [user]);

  // Load all notifications when panel opens
  const loadNotifications = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await apiFetch("/notifications");
      setNotifications(data.notifications || []);
    } catch (err) {
      console.error("Load notifications error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenPanel = () => {
    setShowPanel(true);
    loadNotifications();
  };

  const handleMarkAsRead = async (notificationId: number) => {
    try {
      await apiFetch(`/notifications/${notificationId}/read`, { method: "PUT" });
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, is_read: true } : n))
      );
      setUnreadCount(Math.max(0, unreadCount - 1));
    } catch (err) {
      console.error("Mark as read error:", err);
    }
  };

  const handleDelete = async (notificationId: number) => {
    try {
      await apiFetch(`/notifications/${notificationId}`, { method: "DELETE" });
      setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
    } catch (err) {
      console.error("Delete notification error:", err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await apiFetch(`/notifications/read-all`, { method: "PUT" });
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error("Mark all as read error:", err);
    }
  };

  if (!user) return null;

  return (
    <>
      {/* Notification Bell Button */}
      <button
        onClick={handleOpenPanel}
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          position: "relative",
          padding: "0 12px",
          display: "flex",
          alignItems: "center",
          fontSize: 20,
        }}
      >
        🔔
        {unreadCount > 0 && (
          <span
            style={{
              position: "absolute",
              top: -4,
              right: 0,
              background: "#EF4444",
              color: "white",
              borderRadius: "50%",
              width: 20,
              height: 20,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 10,
              fontWeight: "bold",
            }}
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Panel */}
      {showPanel && (
        <>
          <div
            style={{
              position: "fixed",
              inset: 0,
              backgroundColor: "rgba(0,0,0,0.3)",
              zIndex: 99,
            }}
            onClick={() => setShowPanel(false)}
          />
          <div
            style={{
              position: "fixed",
              top: 70,
              right: 20,
              width: 380,
              maxHeight: 500,
              backgroundColor: "#15100B",
              border: "1px solid #2A2118",
              borderRadius: 8,
              boxShadow: "0 10px 40px rgba(0,0,0,0.4)",
              zIndex: 100,
              display: "flex",
              flexDirection: "column",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div
              style={{
                padding: "16px 20px",
                borderBottom: "1px solid #2A2118",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <h3 className="serif" style={{ fontSize: 18, color: "#F5F0EA", margin: 0 }}>
                Notifications
              </h3>
              <div style={{ display: "flex", gap: 8 }}>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllAsRead}
                    style={{
                      background: "none",
                      border: "1px solid #C9A96E",
                      color: "#C9A96E",
                      padding: "4px 10px",
                      borderRadius: 4,
                      fontSize: 10,
                      cursor: "pointer",
                      letterSpacing: 0.5,
                      textTransform: "uppercase",
                    }}
                  >
                    Mark All Read
                  </button>
                )}
                <button
                  onClick={() => setShowPanel(false)}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#C9A96E",
                    fontSize: 18,
                    cursor: "pointer",
                  }}
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Notifications List */}
            <div
              style={{
                flex: 1,
                overflowY: "auto",
                display: notifications.length === 0 && !loading ? "flex" : "block",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {loading ? (
                <p style={{ color: "#5a4f42", textAlign: "center", padding: "40px 20px" }}>
                  Loading...
                </p>
              ) : notifications.length === 0 ? (
                <p style={{ color: "#5a4f42", textAlign: "center", padding: "40px 20px" }}>
                  No notifications yet
                </p>
              ) : (
                notifications.map((notif) => (
                  <div
                    key={notif.id}
                    style={{
                      padding: "14px 16px",
                      borderBottom: "1px solid #2A2118",
                      backgroundColor: notif.is_read ? undefined : "#1C1712",
                      cursor: "pointer",
                      transition: "background 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      if (!notif.is_read) {
                        (e.currentTarget as HTMLDivElement).style.backgroundColor = "#1E1812";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!notif.is_read) {
                        (e.currentTarget as HTMLDivElement).style.backgroundColor = "#1C1712";
                      }
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "start",
                        gap: 12,
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            marginBottom: 6,
                          }}
                        >
                          {!notif.is_read && (
                            <span
                              style={{
                                width: 8,
                                height: 8,
                                borderRadius: "50%",
                                backgroundColor: "#C9A96E",
                              }}
                            />
                          )}
                          <p
                            style={{
                              margin: 0,
                              fontSize: 13,
                              fontWeight: "600",
                              color: "#F5F0EA",
                            }}
                          >
                            {notif.title}
                          </p>
                        </div>
                        <p
                          style={{
                            margin: 0,
                            fontSize: 12,
                            color: "#9E8E78",
                            lineHeight: 1.4,
                          }}
                        >
                          {notif.message}
                        </p>
                        <p
                          style={{
                            margin: "6px 0 0 0",
                            fontSize: 10,
                            color: "#5a4f42",
                          }}
                        >
                          {new Date(notif.created_at).toLocaleDateString("en-GB", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                      <div style={{ display: "flex", gap: 4 }}>
                        {!notif.is_read && (
                          <button
                            onClick={() => handleMarkAsRead(notif.id)}
                            style={{
                              background: "none",
                              border: "none",
                              color: "#C9A96E",
                              cursor: "pointer",
                              fontSize: 12,
                              padding: "2px 4px",
                            }}
                            title="Mark as read"
                          >
                            ✓
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(notif.id)}
                          style={{
                            background: "none",
                            border: "none",
                            color: "#5a4f42",
                            cursor: "pointer",
                            fontSize: 12,
                            padding: "2px 4px",
                          }}
                          title="Delete"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}
