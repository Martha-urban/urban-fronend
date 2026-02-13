import React, { useMemo, useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  LineChart,
  Line,
} from "recharts";

export default function StaffLogs() {
  const [from, setFrom] = useState("2026-02-01");
  const [to, setTo] = useState("2026-02-29");

  const stats = [
    { title: "Total Orders", value: "320", tone: "blue" },
    { title: "Paid Orders", value: "250", tone: "green" },
    { title: "Total Revenue", value: "$25,600", tone: "greenSoft" },
    { title: "Avg. Order Value", value: "$87.50", tone: "orange" },
    { title: "Avg. Order Value", value: "$25,250", tone: "red" },
  ];

  const topSelling = [
    "Casual Sneakers",
    "Denim Jacket",
    "Sports Watch",
  ];

  const chartData = useMemo(
    () => [
      { name: "24000", sales: 18, profit: 20 },
      { name: "25000", sales: 20, profit: 23 },
      { name: "26000", sales: 22, profit: 25 },
      { name: "27000", sales: 25, profit: 32 },
      { name: "28000", sales: 21, profit: 26 },
      { name: "29000", sales: 23, profit: 24 },
      { name: "30000", sales: 26, profit: 25 },
      { name: "31000", sales: 34, profit: 23 },
      { name: "32000", sales: 38, profit: 29 },
      { name: "33000", sales: 27, profit: 25 },
      { name: "34000", sales: 25, profit: 24 },
    ],
    []
  );

  return (
    <div style={{ padding: 18 }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 12,
        }}
      >
        <h2 style={{ margin: 0, fontSize: 22 }}>Staff Activity Logs</h2>

        {/* icons */}
        <div style={{ display: "flex", gap: 10 }}>
          {["💬", "🔔", "⚙️", "👤"].map((i, idx) => (
            <div
              key={idx}
              style={{
                width: 34,
                height: 34,
                borderRadius: 10,
                border: "1px solid #e5e7eb",
                background: "#fff",
                display: "grid",
                placeItems: "center",
                cursor: "pointer",
              }}
            >
              {i}
            </div>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: 16, color: "#6b7280" }}>
        {from} to {to}
      </div>

      {/* Filters row */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 12,
          flexWrap: "wrap",
          marginBottom: 16,
        }}
      >
        {/* Left: date */}
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              background: "#fff",
              border: "1px solid #e5e7eb",
              padding: 10,
              borderRadius: 12,
            }}
          >
            <label style={{ fontSize: 14, color: "#6b7280" }}>From:</label>
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              style={{
                border: "1px solid #e5e7eb",
                borderRadius: 10,
                padding: "8px 10px",
              }}
            />

            <label style={{ fontSize: 14, color: "#6b7280" }}>To</label>
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              style={{
                border: "1px solid #e5e7eb",
                borderRadius: 10,
                padding: "8px 10px",
              }}
            />
          </div>

          <button
            style={{
              background: "#2563eb",
              color: "#fff",
              border: "none",
              padding: "10px 18px",
              borderRadius: 12,
              fontWeight: 800,
              cursor: "pointer",
            }}
          >
            Apply
          </button>
        </div>

        {/* Right */}
        <div style={{ display: "flex", gap: 10 }}>
          <button
            style={{
              background: "#fff",
              border: "1px solid #e5e7eb",
              padding: "10px 14px",
              borderRadius: 12,
              cursor: "pointer",
              fontWeight: 700,
            }}
          >
            🧾 Staff Logs ▾
          </button>

          <button
            style={{
              background: "#374151",
              color: "#fff",
              border: "none",
              padding: "10px 16px",
              borderRadius: 12,
              cursor: "pointer",
              fontWeight: 800,
            }}
          >
            🔎 Search
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
          gap: 14,
          marginBottom: 16,
        }}
      >
        {stats.map((s) => (
          <MiniStatCard key={s.title + s.value} {...s} />
        ))}
      </div>

      {/* Bottom Panels */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 2fr",
          gap: 14,
          alignItems: "start",
        }}
      >
        {/* Top selling */}
        <div
          style={{
            background: "#fff",
            border: "1px solid #e5e7eb",
            borderRadius: 14,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: 16,
              fontWeight: 900,
              color: "#374151",
              borderBottom: "1px solid #f3f4f6",
              fontSize: 16,
            }}
          >
            Top Selling Products
          </div>

          <div style={{ padding: 16 }}>
            {topSelling.map((p, idx) => (
              <div
                key={p}
                style={{
                  display: "flex",
                  gap: 10,
                  padding: "12px 0",
                  borderBottom:
                    idx === topSelling.length - 1
                      ? "none"
                      : "1px solid #f3f4f6",
                }}
              >
                <div style={{ fontWeight: 900, width: 24 }}>{idx + 1}.</div>
                <div style={{ fontWeight: 700, color: "#374151" }}>{p}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Sales overview */}
        <div
          style={{
            background: "#fff",
            border: "1px solid #e5e7eb",
            borderRadius: 14,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: 16,
              fontWeight: 900,
              color: "#374151",
              borderBottom: "1px solid #f3f4f6",
              fontSize: 16,
            }}
          >
            Sales Overview
          </div>

          <div style={{ padding: 16, height: 310 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="sales" fill="#1f2937" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Line overlay (optional) */}
          <div style={{ padding: 16, height: 240 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="profit" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* mobile responsiveness */}
      <style>
        {`
          @media (max-width: 1200px) {
            .stats-grid {
              grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
            }
          }
        `}
      </style>
    </div>
  );
}

/* -----------------------------
   Mini stat card component
------------------------------ */

function MiniStatCard({ title, value, tone }) {
  const colors = {
    blue: { bg: "#eef4ff", text: "#1e40af" },
    green: { bg: "#ecfdf5", text: "#166534" },
    greenSoft: { bg: "#eef7f0", text: "#14532d" },
    orange: { bg: "#fff7ed", text: "#9a3412" },
    red: { bg: "#fff1f2", text: "#9f1239" },
  };

  const c = colors[tone] || colors.blue;

  return (
    <div
      style={{
        background: c.bg,
        borderRadius: 14,
        padding: 16,
        border: "1px solid #e5e7eb",
      }}
    >
      <div style={{ fontSize: 14, color: "#374151", fontWeight: 700 }}>
        {title}
      </div>

      <div style={{ fontSize: 34, fontWeight: 900, marginTop: 10, color: c.text }}>
        {value}
      </div>
    </div>
  );
}
