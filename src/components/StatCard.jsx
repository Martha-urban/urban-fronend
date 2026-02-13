import React from "react";

const tones = {
  green: { bg: "#eef7f0", text: "#14532d" },
  blue: { bg: "#eef4ff", text: "#1e40af" },
  orange: { bg: "#fff5eb", text: "#9a3412" },
  red: { bg: "#fff1f2", text: "#9f1239" },
};

export default function StatCard({ title, value, tone = "green" }) {
  const t = tones[tone] || tones.green;

  return (
    <div
      style={{
        background: t.bg,
        borderRadius: 14,
        padding: 18,
        border: "1px solid #e5e7eb",
      }}
    >
      <div style={{ fontSize: 15, color: "#374151", marginBottom: 10 }}>
        {title}
      </div>

      <div style={{ fontSize: 34, fontWeight: 800, color: t.text }}>
        {value}
      </div>
    </div>
  );
}
