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
  const [to, setTo] = useState("2026-02-29");

  // Backend state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Dashboard stats
  const [ordersCount, setOrdersCount] = useState(0);
  const [revenue, setRevenue] = useState(0);
  const [expenses, setExpenses] = useState(0); // backend not yet
  const [profit, setProfit] = useState(0);

  const profitData = useMemo(
    () => [
      { name: "Mon", profit: 1200 },
      { name: "Tue", profit: 1900 },
      { name: "Wed", profit: 900 },
      { name: "Thu", profit: 2200 },
      { name: "Fri", profit: 1600 },
      { name: "Sat", profit: 2800 },
      { name: "Sun", profit: 2000 },
    ],
    []
  );

  const topSelling = [
    { name: "Casual Sneakers", qty: 350 },
    { name: "Denim Jacket", qty: 330 },
    { name: "Sports Watch", qty: 320 },
  ];

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

      // 1) Orders (count)
      const ordersRes = await api.get("/api/v1/orders", {
        params: { page: 0, size: 1, sort: "createdAt,desc" },
      });

      const totalOrders = ordersRes.data.totalElements || 0;
      setOrdersCount(totalOrders);

      // 2) Payments (revenue)
      // We fetch first 500 payments and sum (MVP)
      const paymentsRes = await api.get("/api/v1/payments", {
        params: { page: 0, size: 500, sort: "createdAt,desc" },
      });

      const payments = paymentsRes.data.content || [];

      // Revenue = sum of paid payments
      // Update this depending on your PaymentStatus enum
      const paidPayments = payments.filter(
        (p) => String(p.status || "").toUpperCase() === "PAID"
      );

      const totalRevenue = paidPayments.reduce((sum, p) => {
        return sum + Number(p.amount || 0);
      }, 0);

      setRevenue(totalRevenue);

      // Expenses not yet implemented
      setExpenses(0);

      // Profit = Revenue - Expenses
      setProfit(totalRevenue - 0);
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
        <StatCard title="Profit" value={money(profit)} tone="orange" />
        <StatCard title="Expenses" value={money(expenses)} tone="red" />
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
              {money(profit)}
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
              Profit Breakdown
            </h3>

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
            grid-template-columns: repeat(4, minmax(0, 1fr));
            gap: 14px;
            margin-bottom: 16px;
          }

          .dashboard-grid {
            display: grid;
            grid-template-columns: 2fr 1fr;
            gap: 14px;
            align-items: start;
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
        `}
      </style>
    </div>
  );
}
