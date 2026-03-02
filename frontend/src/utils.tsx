export const API = (import.meta as any)?.env?.VITE_API_BASE || "http://localhost:5000/api";

export const getToken = (): string | null => localStorage.getItem("gg_token");

export const authHeaders = () => ({
  "Content-Type": "application/json",
  ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
});

export const apiFetch = async (path: string, opts: RequestInit = {}) => {
  const res = await fetch(`${API}${path}`, {
    headers: authHeaders(),
    ...opts,
  });

  // try to parse JSON body; fall back to null on failure
  let data: any = null;
  try {
    data = await res.json();
  } catch {
    /* ignore */
  }

  if (!res.ok) {
    // if unauthorized, clear credentials so app naturally resets
    if (res.status === 401) {
      localStorage.removeItem("gg_token");
      localStorage.removeItem("gg_user");
      // force a reload so root component can redirect to login
      window.location.reload();
    }

    const errMsg = (data && data.error) || res.statusText || "Request failed";
    throw new Error(errMsg);
  }

  return data;
};

export const formatPrice = (n: number) =>
  new Intl.NumberFormat("en-ZA", { 
    style: "currency", 
    currency: "ZAR", 
    maximumFractionDigits: 0 
  }).format(n);

export const formatDate = (d: string | Date) =>
  new Date(d).toLocaleDateString("en-GB", { 
    day: "numeric", 
    month: "short", 
    year: "numeric" 
  });

export const nightsBetween = (a: string | Date, b: string | Date) => {
  const diff = (new Date(b).getTime() - new Date(a).getTime()) / 86400000;
  return diff > 0 ? diff : 0;
};

// Image utilities
export const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=800&q=80";

export const ROOM_IMAGES: string[] = [
  "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800&q=80",
  "https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=800&q=80",
  "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=800&q=80",
  "https://images.unsplash.com/photo-1560185007-cde436f6a4d0?w=800&q=80",
  "https://images.unsplash.com/photo-1596436889106-be35e843f974?w=800&q=80",
];

export const roomImg = (room: any): string => 
  room?.images?.length > 0 ? room.images[0] : FALLBACK_IMAGE;

export const roomImages = (room: any): string[] => 
  room?.images?.length > 0 ? room.images : [FALLBACK_IMAGE];

// Status styling
export type StatusStyle = { bg: string; text: string; dot: string };

export const STATUS_STYLES: Record<string, StatusStyle> = {
  pending: { bg: "#FFF3CD", text: "#856404", dot: "#F0AD00" },
  approved: { bg: "#D1FAE5", text: "#065F46", dot: "#10B981" },
  rejected: { bg: "#FEE2E2", text: "#991B1B", dot: "#EF4444" },
  cancelled: { bg: "#F3F4F6", text: "#6B7280", dot: "#9CA3AF" },
  completed: { bg: "#EDE9FE", text: "#5B21B6", dot: "#8B5CF6" },
};

// legacy name used by some components
export const STATUS_COLORS = STATUS_STYLES;

export const getStatusStyle = (status: string): StatusStyle => 
  STATUS_STYLES[status] || STATUS_STYLES.pending;