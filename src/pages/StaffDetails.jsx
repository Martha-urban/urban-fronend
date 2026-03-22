import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, Legend,
} from "recharts";
import { api } from "../api/api";
import { useAuth } from "../auth/useAuth";

export default function StaffDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAdmin, isManager } = useAuth();

  const [staff, setStaff] = useState(null);
  const [summary, setSummary] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // ✅ Determine which staff ID to load:
  // Admin/Manager viewing someone else → use URL param
  // Staff viewing their own page → use their own ID from JWT
  const canViewOthers = isAdmin() || isManager();
  const targetId = canViewOthers ? id : user?.id;

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);

        console.log("Loading data for targetId:", targetId); // ✅ add this

        const [staffRes, summaryRes, ordersRes] = await Promise.all([
          api.get(`/api/v1/auth/user/${targetId}`),
          api.get(`/api/v1/orders/staff/${targetId}/summary`),
          api.get(`/api/v1/orders`, {
            params: {
              page: 0,
              size: 10,
              sort: "createdAt,desc",
              staffId: targetId,   // ✅ confirm this is a valid UUID
            }
          }),
        ]);

        console.log("Orders response:", ordersRes.data); // ✅ add this

        setStaff(staffRes.data);
        setSummary(summaryRes.data);
        setOrders(ordersRes.data.content || []);
      } catch (err) {
        console.error("Error loading staff details", err);
      } finally {
        setLoading(false);
      }
    }

    if (targetId) loadData();
  }, [targetId]);

  if (loading) return <div className="p-6">Loading...</div>;
  if (!staff) return <div className="p-6">Staff not found</div>;

  const fullName = `${staff.firstName || ""} ${staff.lastName || ""}`.trim();
  const role = staff.role || "Staff";
  const joinedDate = staff.createdAt
    ? new Date(staff.createdAt).toLocaleDateString()
    : "N/A";

  // Build chart data from summary (real data)
  const chartData = [
    { date: "Total", revenue: summary?.totalRevenue || 0, profit: summary?.totalProfit || 0 },
    { date: "Today", revenue: summary?.revenueToday || 0, profit: summary?.profitToday || 0 },
  ];

  return (
    <div className="flex min-h-screen bg-slate-100">
      <div className="flex-1 p-4 md:p-8">

        {/* TOP BAR */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <h2 className="text-xl font-semibold">
            {canViewOthers ? (
              <>Staff &nbsp;&gt;&nbsp; <span className="font-bold">{fullName}</span></>
            ) : (
              <>My Dashboard — <span className="font-bold">{fullName}</span></>
            )}
          </h2>

          <div className="flex gap-3 flex-wrap">
            {canViewOthers && (
              <button
                onClick={() => navigate("/staff")}
                className="px-4 py-2 border rounded-xl bg-white"
              >
                ← Back to Staff
              </button>
            )}
            <button className="px-4 py-2 rounded-xl bg-blue-600 text-white font-semibold">
              Print Report
            </button>
          </div>
        </div>

        {/* PROFILE HEADER */}
        <div className="bg-white rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-2xl font-bold">
              {fullName.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
            </div>
            <div>
              <h3 className="text-2xl font-bold">{fullName}</h3>
              <p className="text-gray-500">
                Role: {role} • <span className="text-green-600">Active</span>
              </p>
              <p className="text-gray-400 text-sm">Joined {joinedDate}</p>
              <p className="text-gray-400 text-sm">{staff.email}</p>
            </div>
          </div>

          {/* TODAY STATS */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full md:w-auto">
            <SmallStat title="Orders Today" value={summary?.ordersToday ?? 0} />
            <SmallStat title="Revenue Today" value={`Ksh ${(summary?.revenueToday || 0).toLocaleString()}`} />
            <SmallStat title="Profit Today" value={`Ksh ${(summary?.profitToday || 0).toLocaleString()}`} />
            <SmallStat title="Commission Today" value={`Ksh ${(summary?.commissionToday || 0).toLocaleString()}`} />
          </div>
        </div>

        {/* PERFORMANCE OVERVIEW */}
        <div className="bg-white rounded-2xl p-6 shadow-sm mt-6">
          <h3 className="font-semibold mb-4">Performance overview</h3>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            <BigCard title="Total orders" value={summary?.totalOrders ?? 0} />
            <BigCard title="Total revenue" value={`Ksh ${(summary?.totalRevenue || 0).toLocaleString()}`} blue />
            <BigCard title="Total profit" value={`Ksh ${(summary?.totalProfit || 0).toLocaleString()}`} green />
            <BigCard title="Total commission" value={`Ksh ${(summary?.totalCommission || 0).toLocaleString()}`} purple />
            <BigCard title="Avg. order value" value={`Ksh ${(summary?.averageOrderValue || 0).toLocaleString()}`} />
          </div>

          <div className="h-72 min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip formatter={(val) => `Ksh ${val.toLocaleString()}`} />
                <Legend />
                <Line type="monotone" dataKey="revenue" stroke="#2563eb" strokeWidth={3} />
                <Line type="monotone" dataKey="profit" stroke="#16a34a" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* RECENT CONVERTED ORDERS */}
        <div className="bg-white rounded-2xl p-6 shadow-sm mt-6">
          <h3 className="font-semibold mb-4">Recent orders</h3>

          {orders.length === 0 ? (
            <p className="text-gray-400 text-sm">No orders found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="p-3 text-left text-gray-500 font-medium">Customer</th>
                    <th className="p-3 text-left text-gray-500 font-medium">Product</th>
                    <th className="p-3 text-left text-gray-500 font-medium">Amount</th>
                    <th className="p-3 text-left text-gray-500 font-medium">Status</th>
                    <th className="p-3 text-left text-gray-500 font-medium">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((o, idx) => (
                    <tr key={o.id} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                      <td className="p-3 font-medium">{o.customerName || "-"}</td>
                      <td className="p-3 text-gray-600">{o.productName || "-"}</td>
                      <td className="p-3 font-bold">
                        Ksh {Number(o.totalAmount || 0).toLocaleString()}
                      </td>
                      <td className="p-3">
                        <StatusBadge status={o.orderStatus} />
                      </td>
                      <td className="p-3 text-gray-500">
                        {o.createdAt ? String(o.createdAt).slice(0, 10) : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* PAYROLL SUMMARY */}
        <div className="bg-white rounded-2xl p-6 shadow-sm mt-6">
          <h3 className="font-semibold mb-4">Payroll summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-50 p-4 rounded-xl">
              <p className="text-gray-500 text-xs">Total commission</p>
              <p className="font-bold text-lg text-purple-600 mt-1">
                Ksh {(summary?.totalCommission || 0).toLocaleString()}
              </p>
            </div>
            <div className="bg-gray-50 p-4 rounded-xl">
              <p className="text-gray-500 text-xs">Total orders closed</p>
              <p className="font-bold text-lg mt-1">{summary?.totalOrders ?? 0}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-xl">
              <p className="text-gray-500 text-xs">Average order value</p>
              <p className="font-bold text-lg mt-1">
                Ksh {(summary?.averageOrderValue || 0).toLocaleString()}
              </p>
            </div>
          </div>
          <div className="mt-4 p-4 bg-green-50 rounded-xl border border-green-100">
            <p className="text-green-700 text-sm font-medium">Total payable</p>
            <p className="font-bold text-2xl text-green-700 mt-1">
              Ksh {(summary?.totalCommission || 0).toLocaleString()}
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const s = String(status || "").toUpperCase();
  let bg = "#f3f4f6", color = "#374151";
  if (s.includes("DELIVERED") || s === "COMPLETED") { bg = "#dcfce7"; color = "#166534"; }
  else if (s.includes("DISPATCHED")) { bg = "#dbeafe"; color = "#1d4ed8"; }
  else if (s.includes("AWAITING")) { bg = "#ffedd5"; color = "#b45309"; }
  else if (s === "CANCELLED") { bg = "#ffe4e6"; color = "#9f1239"; }

  return (
    <span style={{ background: bg, color, padding: "4px 10px", borderRadius: 999, fontSize: 11, fontWeight: 700 }}>
      {String(status || "").replaceAll("_", " ").toLowerCase().replace(/\b\w/g, c => c.toUpperCase())}
    </span>
  );
}

function SmallStat({ title, value }) {
  return (
    <div className="bg-gray-50 p-4 rounded-xl text-center">
      <p className="text-gray-500 text-xs">{title}</p>
      <p className="font-bold text-lg">{value}</p>
    </div>
  );
}

function BigCard({ title, value, blue, green, purple }) {
  return (
    <div className="bg-gray-50 p-4 rounded-xl">
      <p className="text-gray-500 text-xs">{title}</p>
      <p className={`font-bold text-lg mt-1 ${blue ? "text-blue-600" : green ? "text-green-600" : purple ? "text-purple-600" : ""}`}>
        {value}
      </p>
    </div>
  );
}