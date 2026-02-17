import React, { useEffect, useMemo, useState } from "react";
import StatCard from "../components/StatCard";
import { api } from "../api/api";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

export default function Dashboard() {
  const [from, setFrom] = useState("2026-02-01");
  const [to, setTo] = useState("2026-02-28");

  // Backend state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Dashboard stats
  const [ordersCount, setOrdersCount] = useState(0);

  const [revenue, setRevenue] = useState(0);
  const [cogs, setCogs] = useState(0);
  const [grossProfit, setGrossProfit] = useState(0);

  // Expenses + Net Profit
  const [expenses, setExpenses] = useState(0);
  const [netProfit, setNetProfit] = useState(0);

  // Demo chart based on net profit (until we build real daily breakdown)
  const profitData = useMemo(() => {
    const value = Number(netProfit || 0);

    return [
      { name: "Mon", profit: Math.round(value * 0.12) },
      { name: "Tue", profit: Math.round(value * 0.14) },
      { name: "Wed", profit: Math.round(value * 0.1) },
      { name: "Thu", profit: Math.round(value * 0.16) },
      { name: "Fri", profit: Math.round(value * 0.18) },
      { name: "Sat", profit: Math.round(value * 0.2) },
      { name: "Sun", profit: Math.round(value * 0.1) },
    ];
  }, [netProfit]);

  // Still static for now
  const topSelling = [
    { name: "Casual Sneakers", qty: 350 },
    { name: "Denim Jacket", qty: 330 },
    { name: "Sports Watch", qty: 320 },
  ];

  // Still static for now
  const recentOrders = [
    { customer: "Emily Johnson", date: "25 Feb", amount: 500 },
    { customer: "Michael Brown", date: "24 Feb", amount: 1200 },
    { customer: "Sophia Lee", date: "23 Feb", amount: 800 },
  ];

  useEffect(() => {
    loadDashboard();
    // eslint-disable-next-line
  }, []);

  async function loadDashboard() {
    try {
      setLoading(true);
      setError("");

      // Basic validation
      if (new Date(to) < new Date(from)) {
        setError("To date cannot be before From date.");
        return;
      }

      // 1) Orders count
      const ordersRes = await api.get("/api/v1/orders", {
        params: { page: 0, size: 1, sort: "createdAt,desc" },
      });

      const totalOrders = ordersRes.data.totalElements || 0;
      setOrdersCount(totalOrders);

      // 2) Profit Report (Revenue + COGS + Gross Profit + Expenses + Net Profit)
      const fromDate = `${from}T00:00:00`;
      const toDate = `${to}T23:59:59`;

      const reportRes = await api.get("/api/reports/profit", {
        params: { from: fromDate, to: toDate },
      });

      const rep = reportRes.data || {};

      setRevenue(Number(rep.revenue || 0));
      setCogs(Number(rep.cogs || 0));
      setGrossProfit(Number(rep.grossProfit || 0));
      setExpenses(Number(rep.expenses || 0));
      setNetProfit(Number(rep.netProfit || 0));
    } catch (e) {
      console.log(e);
      setError("Failed to load dashboard data.");
    } finally {
      setLoading(false);
    }
  }

  function money(value) {
    return `KES ${Number(value || 0).toLocaleString()}`;
  }

  return (
    <div style={{ padding: 18 }}>
      {/* Header */}
      <div style={{ marginBottom: 14 }}>
        <h2 style={{ margin: 0, fontSize: 22 }}>Dashboard</h2>
        <p style={{ margin: "6px 0 0", color: "#6b7280" }}>
          {from} to {to}
        </p>
      </div>

      {/* Filters row */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginBottom: 18,
          flexWrap: "wrap",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            background: "#fff",
            borderRadius: 12,
            padding: 12,
            border: "1px solid #e5e7eb",
            flexWrap: "wrap",
          }}
        >
          <label style={{ color: "#6b7280", fontSize: 14 }}>From:</label>
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            style={{
              border: "1px solid #e5e7eb",
              padding: "8px 10px",
              borderRadius: 10,
            }}
          />

          <label style={{ color: "#6b7280", fontSize: 14 }}>To:</label>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            style={{
              border: "1px solid #e5e7eb",
              padding: "8px 10px",
              borderRadius: 10,
            }}
          />
        </div>

        <button
          onClick={loadDashboard}
          style={{
            border: "1px solid #e5e7eb",
            background: "#111827",
            color: "#fff",
            padding: "10px 14px",
            borderRadius: 12,
            cursor: "pointer",
            fontWeight: 800,
          }}
        >
          {loading ? "Loading..." : "Apply"}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div style={{ marginBottom: 12, color: "crimson" }}>{error}</div>
      )}

      {/* Stat Cards */}
      <div className="stat-grid">
        <StatCard title="Revenue" value={money(revenue)} tone="green" />
        <StatCard title="Orders" value={ordersCount} tone="blue" />
        <StatCard title="Gross Profit" value={money(grossProfit)} tone="orange" />
        <StatCard title="COGS" value={money(cogs)} tone="red" />
        <StatCard title="Expenses" value={money(expenses)} tone="black" />
      </div>

      {/* Main grid */}
      <div className="dashboard-grid">
        {/* LEFT SIDE */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Gross Profit */}
          <div
            style={{
              background: "#fff",
              borderRadius: 14,
              padding: 18,
              border: "1px solid #e5e7eb",
            }}
          >
            <h3 style={{ margin: 0, color: "#374151" }}>Gross Profit</h3>
            <div style={{ fontSize: 44, fontWeight: 700, marginTop: 10 }}>
              {money(grossProfit)}
            </div>

            <div style={{ marginTop: 6, color: "#6b7280", fontSize: 14 }}>
              Net Profit: {money(netProfit)}
            </div>
          </div>

          {/* Profit Breakdown */}
          <div
            style={{
              background: "#fff",
              borderRadius: 14,
              padding: 18,
              border: "1px solid #e5e7eb",
            }}
          >
            <h3 style={{ margin: 0, marginBottom: 14, color: "#374151" }}>
              Profit Breakdown (Demo)
            </h3>

            <div style={{ color: "#6b7280", fontSize: 13, marginBottom: 10 }}>
              This chart will become real after we implement daily report APIs.
            </div>

            <div style={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={profitData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="profit" fill="#1f2937" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* RIGHT SIDE */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Top Selling Products */}
          <div
            style={{
              background: "#fff",
              borderRadius: 14,
              padding: 18,
              border: "1px solid #e5e7eb",
            }}
          >
            <h3 style={{ margin: 0, marginBottom: 12, color: "#374151" }}>
              Top Selling Products
            </h3>

            <div style={{ color: "#6b7280", fontSize: 13, marginBottom: 10 }}>
              (We will integrate real top products next)
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {topSelling.map((p, index) => (
                <div
                  key={p.name}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    paddingBottom: 10,
                    borderBottom:
                      index === topSelling.length - 1
                        ? "none"
                        : "1px solid #f3f4f6",
                  }}
                >
                  <div style={{ display: "flex", gap: 10 }}>
                    <strong style={{ width: 18 }}>{index + 1}.</strong>
                    <span>{p.name}</span>
                  </div>
                  <span style={{ fontWeight: 700 }}>{p.qty}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Orders */}
          <div
            style={{
              background: "#fff",
              borderRadius: 14,
              padding: 18,
              border: "1px solid #e5e7eb",
            }}
          >
            <h3 style={{ margin: 0, marginBottom: 12, color: "#374151" }}>
              Recent Orders
            </h3>

            <div style={{ color: "#6b7280", fontSize: 13 }}>
              (We will integrate real recent orders next)
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {recentOrders.map((o, idx) => (
                <div
                  key={idx}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    borderBottom:
                      idx === recentOrders.length - 1
                        ? "none"
                        : "1px solid #f3f4f6",
                    paddingBottom: 10,
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600 }}>{o.customer}</div>
                    <div style={{ color: "#6b7280", fontSize: 13 }}>
                      {o.date}
                    </div>
                  </div>

                  <div style={{ fontWeight: 700 }}>{money(o.amount)}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* RESPONSIVE CSS */}
      <style>
        {`
          .stat-grid {
            display: grid;
            grid-template-columns: repeat(5, minmax(0, 1fr));
            gap: 10px;
            margin-bottom: 14px;
          }

          /* Shrink all cards inside stat grid */
          .stat-grid > div {
            padding: 12px !important;
            border-radius: 12px !important;
          }

          /* Reduce title spacing */
          .stat-grid > div h4,
          .stat-grid > div h3,
          .stat-grid > div p {
            margin: 0 !important;
          }

          /* Smaller title */
          .stat-grid > div p {
            font-size: 12px !important;
            color: #6b7280;
          }

          /* Smaller value */
          .stat-grid > div strong {
            font-size: 20px !important;
          }

          .dashboard-grid {
            display: grid;
            grid-template-columns: 2fr 1fr;
            gap: 14px;
            align-items: start;
          }

          @media (max-width: 1300px) {
            .stat-grid {
              grid-template-columns: repeat(3, minmax(0, 1fr));
            }
          }

          @media (max-width: 1100px) {
            .stat-grid {
              grid-template-columns: repeat(2, minmax(0, 1fr));
            }
          }

          @media (max-width: 1000px) {
            .dashboard-grid {
              grid-template-columns: 1fr;
            }
          }

          @media (max-width: 600px) {
            .stat-grid {
              grid-template-columns: 1fr;
            }
          }

          /* HIDE SIDEBAR ON MOBILE */
          @media (max-width: 900px) {
            .sidebar {
              display: none !important;
            }
          }
        `}
      </style>
    </div>
  );
}
