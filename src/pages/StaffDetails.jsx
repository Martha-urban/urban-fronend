import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";
import { api } from "../api/api";

const chartData = [
  { date: "Feb 15", revenue: 40000, profit: 20000 },
  { date: "Feb 16", revenue: 62000, profit: 40000 },
  { date: "Feb 17", revenue: 41000, profit: 21000 },
  { date: "Feb 18", revenue: 71000, profit: 47000 },
  { date: "Feb 19", revenue: 50000, profit: 27000 },
  { date: "Feb 20", revenue: 73000, profit: 49000 },
  { date: "Feb 21", revenue: 52000, profit: 32000 },
  { date: "Feb 22", revenue: 98000, profit: 61000 },
];

export default function StaffDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [staff, setStaff] = useState(null);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [staffRes, summaryRes] = await Promise.all([
          api.get(`/api/v1/auth/${id}`),
          api.get(`/api/v1/orders/staff/${id}/summary`)
        ]);

        setStaff(staffRes.data);
        setSummary(summaryRes.data);
      } catch (err) {
        console.error("Error loading staff details", err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [id]);

  if (loading) return <div className="p-6">Loading...</div>;
  if (!staff) return <div className="p-6">Staff not found</div>;

  const fullName = `${staff.firstName || ""} ${staff.lastName || ""}`.trim();
  const role = staff.role || "Staff";
  const joinedDate = staff.createdAt
    ? new Date(staff.createdAt).toLocaleDateString()
    : "N/A";

  return (
    <div className="flex min-h-screen bg-slate-100">
      <div className="flex-1 p-4 md:p-8">

        {/* TOP BAR */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <h2 className="text-xl font-semibold">
            Staff &nbsp; &gt; &nbsp;
            <span className="font-bold">{fullName}</span>
          </h2>

          <div className="flex gap-3 flex-wrap">
            <button
              onClick={() => navigate("/staff")}
              className="px-4 py-2 border rounded-xl bg-white"
            >
              ← Back to Staff
            </button>
            <button className="px-4 py-2 border rounded-xl bg-white">
              Actions ▾
            </button>
            <button className="px-4 py-2 rounded-xl bg-blue-600 text-white font-semibold">
              Print Report
            </button>
          </div>
        </div>

        {/* PROFILE HEADER */}
        <div className="bg-white rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-6">

          <div className="flex items-center gap-4">
            <img
              src={`https://i.pravatar.cc/120?u=${staff.id}`}
              alt="staff"
              className="w-20 h-20 rounded-full object-cover"
            />
            <div>
              <h3 className="text-2xl font-bold">{fullName}</h3>
              <p className="text-gray-500">
                Role: {role} • <span className="text-green-600">Active</span>
              </p>
              <p className="text-gray-400 text-sm">
                Joined {joinedDate}
              </p>
            </div>
          </div>

          {/* TODAY CARDS */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full md:w-auto">
            <SmallStat
              title="Orders Today"
              value={summary?.ordersToday ?? 0}
            />
            <SmallStat
              title="Revenue Today"
              value={`Ksh ${summary?.revenueToday?.toLocaleString() ?? 0}`}
            />
            <SmallStat
              title="Profit Today"
              value={`Ksh ${summary?.profitToday?.toLocaleString() ?? 0}`}
            />
            <SmallStat
              title="Commission Today"
              value={`Ksh ${summary?.commissionToday?.toLocaleString() ?? 0}`}
            />
          </div>
        </div>

        {/* PERFORMANCE OVERVIEW */}
        <div className="bg-white rounded-2xl p-6 shadow-sm mt-6">
          <h3 className="font-semibold mb-4">Performance Overview</h3>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            <BigCard title="Total Orders" value={summary?.totalOrders ?? 0} />
            <BigCard
              title="Total Revenue"
              value={`Ksh ${summary?.totalRevenue?.toLocaleString() ?? 0}`}
              blue
            />
            <BigCard
              title="Total Profit"
              value={`Ksh ${summary?.totalProfit?.toLocaleString() ?? 0}`}
              green
            />
            <BigCard
              title="Total Commission"
              value={`Ksh ${summary?.totalCommission?.toLocaleString() ?? 0}`}
              purple
            />
            <BigCard
              title="Avg. Order Value"
              value={`Ksh ${summary?.averageOrderValue?.toLocaleString() ?? 0}`}
            />
          </div>

          <div className="h-72 min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="revenue" stroke="#2563eb" strokeWidth={3} />
                <Line type="monotone" dataKey="profit" stroke="#16a34a" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* PAYROLL SUMMARY */}
        <div className="bg-white rounded-2xl p-6 shadow-sm mt-6">
          <h3 className="font-semibold mb-4">Payroll Summary</h3>

          <p>
            Commission Earned: Ksh {summary?.totalCommission?.toLocaleString() ?? 0}
          </p>

          <div className="mt-4 p-3 bg-gray-100 rounded-xl font-bold text-lg">
            Total Payable: Ksh {summary?.totalCommission?.toLocaleString() ?? 0}
          </div>
        </div>

      </div>
    </div>
  );
}

/* COMPONENTS */

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
      <p
        className={`font-bold text-lg mt-1 ${
          blue
            ? "text-blue-600"
            : green
            ? "text-green-600"
            : purple
            ? "text-purple-600"
            : ""
        }`}
      >
        {value}
      </p>
    </div>
  );
}