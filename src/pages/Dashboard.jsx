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

      // 2) Profit Report
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
    <div className="p-4 sm:p-6">
      {/* Header */}
      <div className="mb-4">
        <h2 className="m-0 text-[22px] font-bold text-slate-900">Dashboard</h2>
        <p className="mt-1 text-slate-500">
          {from} to {to}
        </p>
      </div>

      {/* Filters row */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div className="flex flex-wrap items-center gap-3 bg-white rounded-xl p-3 border border-slate-200">
          <label className="text-slate-500 text-sm">From:</label>
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="border border-slate-200 px-3 py-2 rounded-xl"
          />

          <label className="text-slate-500 text-sm">To:</label>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="border border-slate-200 px-3 py-2 rounded-xl"
          />
        </div>

        <button
          onClick={loadDashboard}
          className="border border-slate-200 bg-slate-900 text-white px-4 py-2.5 rounded-xl font-extrabold"
        >
          {loading ? "Loading..." : "Apply"}
        </button>
      </div>

      {/* Error */}
      {error && <div className="mb-3 text-red-600">{error}</div>}

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <BigCard title="Revenue" value={money(revenue)} green />
        <BigCard title="Orders" value={ordersCount} blue />
        <BigCard title="Gross Profit" value={money(grossProfit)} orange />
        <BigCard title="COGS" value={money(cogs)} red />
        <BigCard title="Expenses" value={money(expenses)} />
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
        {/* LEFT SIDE */}
        <div className="flex flex-col gap-4 lg:col-span-2">
          {/* Gross Profit */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200">
            <h3 className="m-0 text-slate-700 font-bold">Gross Profit</h3>

            <div className="text-[38px] sm:text-[44px] font-bold mt-2 text-slate-900">
              {money(grossProfit)}
            </div>

            <div className="mt-1 text-slate-500 text-sm">
              Net Profit: {money(netProfit)}
            </div>
          </div>

          {/* Profit Breakdown */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200">
            <h3 className="m-0 mb-3 text-slate-700 font-bold">
              Profit Breakdown (Demo)
            </h3>

            <div className="text-slate-500 text-sm mb-3">
              This chart will become real after we implement daily report APIs.
            </div>

            <div className="h-[280px] sm:h-[300px]">
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
        <div className="flex flex-col gap-4 lg:col-span-1">
          {/* Top Selling Products */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200">
            <h3 className="m-0 mb-3 text-slate-700 font-bold">
              Top Selling Products
            </h3>

            <div className="text-slate-500 text-sm mb-3">
              (We will integrate real top products next)
            </div>

            <div className="flex flex-col gap-3">
              {topSelling.map((p, index) => (
                <div
                  key={p.name}
                  className={`flex justify-between items-center pb-3 ${
                    index === topSelling.length - 1
                      ? ""
                      : "border-b border-slate-100"
                  }`}
                >
                  <div className="flex gap-3">
                    <strong className="w-5">{index + 1}.</strong>
                    <span>{p.name}</span>
                  </div>
                  <span className="font-bold">{p.qty}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Orders */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200">
            <h3 className="m-0 mb-3 text-slate-700 font-bold">
              Recent Orders
            </h3>

            <div className="text-slate-500 text-sm mb-3">
              (We will integrate real recent orders next)
            </div>

            <div className="flex flex-col gap-3">
              {recentOrders.map((o, idx) => (
                <div
                  key={idx}
                  className={`flex justify-between pb-3 ${
                    idx === recentOrders.length - 1
                      ? ""
                      : "border-b border-slate-100"
                  }`}
                >
                  <div>
                    <div className="font-semibold">{o.customer}</div>
                    <div className="text-slate-500 text-sm">{o.date}</div>
                  </div>

                  <div className="font-bold">{money(o.amount)}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
function BigCard({ title, value, green, blue, orange, red, purple }) {
  let color = "text-slate-900";
  let accent = "bg-slate-200";

  if (green) {
    color = "text-green-600";
    accent = "bg-green-500";
  }
  if (blue) {
    color = "text-blue-600";
    accent = "bg-blue-500";
  }
  if (orange) {
    color = "text-orange-600";
    accent = "bg-orange-500";
  }
  if (red) {
    color = "text-red-600";
    accent = "bg-red-500";
  }
  if (purple) {
    color = "text-purple-600";
    accent = "bg-purple-500";
  }

  return (
    <div className="relative bg-white rounded-2xl p-5 shadow-sm border border-slate-200 hover:shadow-md transition duration-300">

      {/* Accent line */}
      <div className={`absolute top-0 left-0 right-0 h-1 rounded-t-2xl ${accent}`} />

      <p className="text-sm text-slate-500">{title}</p>

      <h3 className={`text-2xl md:text-3xl font-bold mt-2 ${color}`}>
        {value}
      </h3>
    </div>
  );
}
