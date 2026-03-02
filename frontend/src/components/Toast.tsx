import { useEffect } from "react";
import type { ToastType } from "../types";

export default function Toast({ msg, type, onClose }: { msg: string; type: "success" | "error"; onClose: () => void }) {
  useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t); }, [onClose]);
  return (
    <div style={{
      position: "fixed", bottom: 24, right: 24, zIndex: 2000,
      background: type === "error" ? "#7F1D1D" : "#14532D",
      border: `1px solid ${type === "error" ? "#B91C1C" : "#166534"}`,
      color: type === "error" ? "#FCA5A5" : "#86EFAC",
      padding: "12px 20px", borderRadius: 8, fontSize: 14,
      animation: "fadeIn .3s ease", maxWidth: 320,
      display: "flex", gap: 10, alignItems: "center"
    }}>
      <span>{type === "error" ? "✕" : "✓"}</span>
      <span>{msg}</span>
    </div>
  );
}
