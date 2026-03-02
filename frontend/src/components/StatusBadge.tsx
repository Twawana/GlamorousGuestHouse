import React from "react";
import { STATUS_COLORS } from "../utils";

export default function StatusBadge({ status }: { status: string }) {
  const s = STATUS_COLORS[status] || STATUS_COLORS.pending;
  return (
    <span className="badge" style={{ background: s.bg + "22", color: s.text, border: `1px solid ${s.dot}44` }}>
      <span className="badge-dot" style={{ background: s.dot }} />
      {status}
    </span>
  );
}
