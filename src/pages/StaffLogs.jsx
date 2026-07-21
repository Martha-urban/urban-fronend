import React, { useMemo, useState, useEffect } from "react";
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
import { api } from "../api/api";

export default function StaffLogs() {
  const [from, setFrom] = useState("2026-02-01");
  const [to, setTo] = useState("2026-12-29");

  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const ITEMS_PER_PAGE = 20;

  const fetchLogs = async () => {
    try {
      setLoading(true);

      // Backend expects LocalDateTime (yyyy-MM-dd'T'HH:mm:ss),
      // but our date inputs only give yyyy-MM-dd. Convert here
      // so we don't have to touch the backend controller.
      const fromDateTime = `${from}T00:00:00`;
      const toDateTime = `${to}T23:59:59`;

      const res = await api.get(`/api/v1/staff-logs`, {
        params: { from: fromDateTime, to: toDateTime },
      });
      setLogs(res.data);
      setPage(1);
    } catch (err) {
      console.error("Failed to fetch logs", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [from, to]);

  // 🔃 Newest first
  const sortedLogs = useMemo(() => {
    return [...logs].sort(
      (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
    );
  }, [logs]);

  // 📊 Stats
  const stats = useMemo(() => {
    const total = logs.length;

    const creates = logs.filter((l) => l.action === "CREATE").length;
    const updates = logs.filter((l) => l.action === "UPDATE").length;
    const deletes = logs.filter((l) => l.action === "DELETE").length;

    return [
      { title: "Total Actions", value: total, tone: "blue" },
      { title: "Creates", value: creates, tone: "green" },
      { title: "Updates", value: updates, tone: "orange" },
      { title: "Deletes", value: deletes, tone: "red" },
      {
        title: "Active Staff",
        value: new Set(logs.map((l) => l.staffId)).size,
        tone: "greenSoft",
      },
    ];
  }, [logs]);

  // 📈 Chart data
  const chartData = useMemo(() => {
    const map = {};

    logs.forEach((log) => {
      const date = log.timestamp.split("T")[0];

      if (!map[date]) {
        map[date] = { name: date, actions: 0 };
      }

      map[date].actions++;
    });

    return Object.values(map);
  }, [logs]);

  const actionColor = (action) => {
    if (action === "CREATE") return "#16a34a";
    if (action === "UPDATE") return "#f59e0b";
    if (action === "DELETE") return "#dc2626";
    if (action === "CONVERT") return "#7c3aed";
    return "#151920";
  };

  // 📄 Pagination (newest logs first)
  const totalPages = Math.ceil(sortedLogs.length / ITEMS_PER_PAGE);
  const startIdx = (page - 1) * ITEMS_PER_PAGE;
  const endIdx = startIdx + ITEMS_PER_PAGE;
  const paginatedLogs = sortedLogs.slice(startIdx, endIdx);

  return (
    <div className="min-h-screen bg-gray-50 p-3 sm:p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-lg sm:text-xl md:text-2xl font-bold">Staff Activity Logs</h1>
      </div>

      <div className="text-sm text-gray-600 mb-4">
        {from} to {to}
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-6">
        <input
          type="date"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
          className="border rounded px-3 py-2 text-sm"
        />
        <input
          type="date"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          className="border rounded px-3 py-2 text-sm"
        />
        <button
          onClick={fetchLogs}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-400 transition-colors"
        >
          Apply
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 mb-6">
        {stats.map((s) => (
          <div
            key={s.title}
            className="bg-white p-3 sm:p-4 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
          >
            <div className="text-xs sm:text-sm text-gray-600 font-medium">{s.title}</div>
            <div className="text-lg sm:text-2xl font-bold mt-1 text-gray-900">{s.value}</div>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="h-72 mb-6 bg-white p-4 rounded-lg shadow-sm border border-gray-100">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="actions" fill="#222730" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Activity Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-4 text-center text-gray-500">Loading...</div>
        ) : sortedLogs.length === 0 ? (
          <div className="p-4 text-center text-gray-500">No logs found</div>
        ) : (
          <div className="overflow-x-auto">
            {/* Header Row */}
            <div
              className="hidden sm:grid gap-4 p-3 sm:p-4 bg-gray-50 border-b border-gray-200 font-semibold text-gray-700 text-sm sticky top-0"
              style={{
                gridTemplateColumns: "150px 100px 100px 1fr 180px",
              }}
            >
              <div>Staff Name</div>
              <div>Action</div>
              <div>Entity</div>
              <div>Description</div>
              <div className="text-right">Timestamp</div>
            </div>
            <div className="min-w-max">
              {paginatedLogs.map((log, i) => (
                <div key={i}>
                  {/* Desktop view */}
                  <div
                    className="hidden sm:grid gap-4 p-3 sm:p-4 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition-colors"
                    style={{
                      gridTemplateColumns: "150px 100px 100px 1fr 180px",
                    }}
                  >
                    <div className="text-sm text-gray-700 truncate font-medium">{log.staffFirstName || "Unknown"}</div>
                    <div
                      className="text-sm font-medium"
                      style={{ color: actionColor(log.action) }}
                    >
                      {log.action}
                    </div>
                    <div className="text-sm text-gray-700 truncate">{log.entity}</div>
                    <div className="text-sm text-gray-600 truncate">{log.description}</div>
                    <div className="text-sm text-gray-500 text-right whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString()}
                    </div>
                  </div>

                  {/* Mobile view */}
                  <div className="sm:hidden p-3 border-b border-gray-100 last:border-b-0 bg-white hover:bg-gray-50 transition-colors">
                    <div className="space-y-2">
                      <div className="flex justify-between items-start gap-2">
                        <span className="font-medium text-gray-700">{log.staffFirstName || "Unknown"}</span>
                        <span
                          className="text-xs font-bold px-2 py-1 rounded"
                          style={{ backgroundColor: actionColor(log.action) + "20", color: actionColor(log.action) }}
                        >
                          {log.action}
                        </span>
                      </div>
                      <div className="text-xs text-gray-600">
                        <div><span className="font-semibold">Entity:</span> {log.entity}</div>
                        <div><span className="font-semibold">Description:</span> {log.description}</div>
                        <div className="text-gray-500 text-xs mt-1">{new Date(log.timestamp).toLocaleString()}</div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Pagination */}
      {sortedLogs.length > 0 && (
        <div className="mt-6 px-3 sm:px-4 py-3 bg-white rounded-lg shadow-sm border border-gray-100">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="text-xs sm:text-sm text-gray-600">
              Showing {startIdx + 1} to {Math.min(endIdx, sortedLogs.length)} of {sortedLogs.length}
            </div>
            <div className="flex items-center justify-between sm:justify-end gap-1 sm:gap-2">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="px-2 sm:px-3 py-2 border border-gray-300 rounded-lg text-xs sm:text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
              >
                ← Prev
              </button>
              
              {/* Page numbers - hidden on mobile, shown on sm and up */}
              <div className="hidden sm:flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const pageNum = i + 1;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setPage(pageNum)}
                      className={`w-8 h-8 rounded text-xs font-medium transition-colors ${
                        page === pageNum
                          ? "bg-blue-600 text-white"
                          : "border border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                {totalPages > 5 && <span className="text-gray-500 text-xs px-1">...</span>}
              </div>

              {/* Mobile page indicator */}
              <div className="sm:hidden text-xs text-gray-600 px-2">
                {page} / {totalPages}
              </div>

              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="px-2 sm:px-3 py-2 border border-gray-300 rounded-lg text-xs sm:text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
              >
                Next →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
