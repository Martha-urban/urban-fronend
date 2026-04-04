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

export default function StaffLogs() {
  const [from, setFrom] = useState("2026-02-01");
  const [to, setTo] = useState("2026-12-29");

  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);

 const fetchLogs = async () => {
  try {
    setLoading(true);

    const token = localStorage.getItem("token"); // Make sure token is stored after login

    const res = await fetch(
      `http://localhost:8080/api/v1/staff-logs?from=${from}&to=${to}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }

    const data = await res.json();
    setLogs(data);
  } catch (err) {
    console.error("FETCH ERROR:", err);
  } finally {
    setLoading(false);
  }
};
  useEffect(() => {
    fetchLogs();
  }, []);

  // 📊 Stats
  const stats = useMemo(() => {
    const total = logs.length;

    const creates = logs.filter(l => l.action === "CREATE").length;
    const updates = logs.filter(l => l.action === "UPDATE").length;
    const deletes = logs.filter(l => l.action === "DELETE").length;

    return [
      { title: "Total Actions", value: total, tone: "blue" },
      { title: "Creates", value: creates, tone: "green" },
      { title: "Updates", value: updates, tone: "orange" },
      { title: "Deletes", value: deletes, tone: "red" },
      {
        title: "Active Staff",
        value: new Set(logs.map(l => l.staffId)).size,
        tone: "greenSoft",
      },
    ];
  }, [logs]);

  // 📈 Chart data
  const chartData = useMemo(() => {
    const map = {};

    logs.forEach(log => {
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
    return "#2563eb";
  };

  return (
    <div style={{ padding: 18 }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: 12,
        }}
      >
        <h2 style={{ margin: 0 }}>Staff Activity Logs</h2>

        <div style={{ display: "flex", gap: 10 }}>
          {["💬", "🔔", "⚙️", "👤"].map((i, idx) => (
            <div key={idx} style={{ cursor: "pointer" }}>
              {i}
            </div>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: 16 }}>
        {from} to {to}
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
        <input type="date" value={from} onChange={e => setFrom(e.target.value)} />
        <input type="date" value={to} onChange={e => setTo(e.target.value)} />

        <button onClick={fetchLogs}>Apply</button>
      </div>

      {/* Stats */}
      <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
        {stats.map(s => (
          <div key={s.title} style={{ padding: 10, border: "1px solid #ccc" }}>
            <div>{s.title}</div>
            <div style={{ fontWeight: "bold" }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div style={{ height: 300, marginBottom: 20 }}>
        <ResponsiveContainer>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="actions" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Activity Table */}
      <div style={{ border: "1px solid #ccc", borderRadius: 10 }}>
        {loading ? (
          <div style={{ padding: 10 }}>Loading...</div>
        ) : logs.length === 0 ? (
          <div style={{ padding: 10 }}>No logs found</div>
        ) : (
          logs.map((log, i) => (
            <div
              key={i}
              style={{
                display: "grid",
                gridTemplateColumns: "120px 100px 100px 1fr 180px",
                padding: 10,
                borderBottom: "1px solid #eee",
              }}
            >
              <div>{log.staffId}</div>

              <div style={{ color: actionColor(log.action) }}>
                {log.action}
              </div>

              <div>{log.entity}</div>

              <div>{log.description}</div>

              <div>
                {new Date(log.timestamp).toLocaleString()}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}