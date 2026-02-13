import React, { useEffect, useMemo, useState } from "react";
import { api } from "../api/api"; // adjust path if needed

export default function Payments() {
  const [from, setFrom] = useState("2026-02-01");
  const [to, setTo] = useState("2026-02-29");
  const [activeTab, setActiveTab] = useState("All Payments");
  const [search, setSearch] = useState("");

  // Backend state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [pageData, setPageData] = useState(null);

  // Pageable
  const [page, setPage] = useState(0);
  const size = 10;

  const tabs = ["All Payments", "M-Pesa", "Card", "Cash", "Bank"];

  useEffect(() => {
    loadPayments();
  }, [page]);

  async function loadPayments() {
    try {
      setLoading(true);
      setError("");

      const res = await api.get("/api/v1/payments", {
        params: {
          page,
          size,
          sort: "paymentDate,desc",
        },
      });

      setPageData(res.data);
    } catch (e) {
      console.log(e);
      setError("Failed to load payments. Check backend, token, and CORS.");
    } finally {
      setLoading(false);
    }
  }

  // Backend payments
  const payments = pageData?.content || [];

  // Convert backend PaymentResponse -> UI row format (UI expects strings)
  const normalized = useMemo(() => {
    return payments.map((p) => {
      return {
        id: p.transactionRef || String(p.id).slice(0, 8) + "...",
        customer: p.payerName || p.payerPhone || "-",
        method: mapMethod(p.method),
        amount: Number(p.amount || 0),
        status: mapStatus(p.status),
        date: formatDate(p.paymentDate || p.createdAt),
      };
    });
  }, [payments]);

  // Your filtering logic stays same
  const filtered = normalized.filter((p) => {
    const matchesSearch =
      p.id.toLowerCase().includes(search.toLowerCase()) ||
      p.customer.toLowerCase().includes(search.toLowerCase()) ||
      p.method.toLowerCase().includes(search.toLowerCase()) ||
      p.status.toLowerCase().includes(search.toLowerCase());

    if (activeTab === "All Payments") return matchesSearch;

    return matchesSearch && p.method === activeTab;
  });

  function money(value) {
    return `KES ${value.toLocaleString()}`;
  }

  function statusStyle(status) {
    if (status === "Paid") return { color: "#166534", bg: "#dcfce7" };
    if (status === "Pending") return { color: "#b45309", bg: "#ffedd5" };
    if (status === "Failed") return { color: "#9f1239", bg: "#ffe4e6" };
    return { color: "#374151", bg: "#f3f4f6" };
  }

  function methodBadge(method) {
    const map = {
      "M-Pesa": { bg: "#ecfdf5", color: "#166534" },
      Card: { bg: "#eef2ff", color: "#1e40af" },
      Cash: { bg: "#fff7ed", color: "#9a3412" },
      Bank: { bg: "#f3f4f6", color: "#374151" },
    };
    return map[method] || { bg: "#f3f4f6", color: "#374151" };
  }

  // ---- MAPPERS (no UI changes, just data conversion) ----

  function mapMethod(method) {
    if (!method) return "Cash";

    // If your backend enum is like MPESA
    if (method === "MPESA") return "M-Pesa";

    // If backend enum is already "M-Pesa"
    if (method === "M-Pesa") return "M-Pesa";

    if (method === "CARD") return "Card";
    if (method === "CASH") return "Cash";
    if (method === "BANK") return "Bank";

    return String(method);
  }

  function mapStatus(status) {
    if (!status) return "Pending";

    // Typical mapping
    if (status === "SUCCESS" || status === "PAID" || status === "COMPLETED")
      return "Paid";

    if (status === "PENDING") return "Pending";

    if (status === "FAILED" || status === "CANCELLED" || status === "REVERSED")
      return "Failed";

    return "Pending";
  }

  function formatDate(iso) {
    if (!iso) return "-";
    const d = new Date(iso);
    return d.toLocaleDateString();
  }

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
        <h2 style={{ margin: 0, fontSize: 22 }}>Payments</h2>

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
          marginBottom: 14,
        }}
      >
        {/* Left date filter */}
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
            onClick={() => {
              setPage(0);
              loadPayments();
            }}
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

        {/* Right controls */}
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
            💳 Payment Methods ▾
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

      {/* Tabs + Search */}
      <div
        style={{
          display: "flex",
          gap: 10,
          background: "#fff",
          border: "1px solid #e5e7eb",
          borderRadius: 14,
          padding: 10,
          marginBottom: 14,
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        {tabs.map((tab) => {
          const active = activeTab === tab;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                border: "none",
                padding: "10px 14px",
                borderRadius: 12,
                cursor: "pointer",
                background: active ? "#2563eb" : "transparent",
                color: active ? "#fff" : "#374151",
                fontWeight: 800,
              }}
            >
              {tab}
            </button>
          );
        })}

        <div style={{ flex: 1 }} />

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            border: "1px solid #e5e7eb",
            background: "#f9fafb",
            padding: "10px 14px",
            borderRadius: 12,
            minWidth: 240,
          }}
        >
          <span style={{ opacity: 0.7 }}>🔍</span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search"
            style={{
              border: "none",
              outline: "none",
              background: "transparent",
              width: "100%",
            }}
          />
        </div>
      </div>

      {/* Payments Table */}
      <div
        style={{
          background: "#fff",
          border: "1px solid #e5e7eb",
          borderRadius: 14,
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.1fr 1.6fr 1.1fr 1.2fr 1.2fr 1.2fr",
            gap: 10,
            padding: "14px 16px",
            background: "#f9fafb",
            fontWeight: 900,
            color: "#374151",
            fontSize: 13,
          }}
        >
          <div>Transaction ID ▾</div>
          <div>Customer</div>
          <div>Method ▾</div>
          <div>Amount</div>
          <div>Status ▾</div>
          <div>Date ▾</div>
        </div>

        {/* Loading / Error */}
        {loading && <div style={{ padding: 16 }}>Loading payments...</div>}
        {error && <div style={{ padding: 16, color: "crimson" }}>{error}</div>}

        {/* Rows */}
        {!loading &&
          !error &&
          filtered.map((p, idx) => {
            const s = statusStyle(p.status);
            const m = methodBadge(p.method);

            return (
              <div
                key={p.id}
                style={{
                  display: "grid",
                  gridTemplateColumns: "1.1fr 1.6fr 1.1fr 1.2fr 1.2fr 1.2fr",
                  gap: 10,
                  padding: "14px 16px",
                  borderTop: idx === 0 ? "none" : "1px solid #f3f4f6",
                  alignItems: "center",
                  fontSize: 14,
                }}
              >
                <div style={{ fontWeight: 900 }}>{p.id}</div>

                <div style={{ fontWeight: 600, color: "#374151" }}>
                  {p.customer}
                </div>

                <div>
                  <span
                    style={{
                      background: m.bg,
                      color: m.color,
                      padding: "6px 10px",
                      borderRadius: 10,
                      fontWeight: 900,
                      fontSize: 13,
                      display: "inline-block",
                    }}
                  >
                    {p.method}
                  </span>
                </div>

                <div style={{ fontWeight: 800 }}>{money(p.amount)}</div>

                <div>
                  <span
                    style={{
                      background: s.bg,
                      color: s.color,
                      padding: "6px 10px",
                      borderRadius: 999,
                      fontWeight: 900,
                      fontSize: 13,
                    }}
                  >
                    {p.status}
                  </span>
                </div>

                <div style={{ fontWeight: 700 }}>{p.date}</div>
              </div>
            );
          })}

        {/* Footer (pageable) */}
        {pageData && (
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              padding: "12px 16px",
              borderTop: "1px solid #e5e7eb",
              background: "#fff",
              color: "#6b7280",
              fontSize: 14,
              flexWrap: "wrap",
              gap: 10,
            }}
          >
            <div>
              Showing 1 to {filtered.length} of {pageData.totalElements} payments
            </div>

            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <button
                style={pageBtnStyle}
                disabled={page === 0}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
              >
                ‹
              </button>

              <span style={{ fontWeight: 900 }}>
                Page {page + 1} / {pageData.totalPages || 1}
              </span>

              <button
                style={pageBtnStyle}
                disabled={pageData.last}
                onClick={() => setPage((p) => p + 1)}
              >
                ›
              </button>
            </div>
          </div>
        )}

        {/* Empty */}
        {!loading && !error && pageData && payments.length === 0 && (
          <div style={{ padding: 16, color: "#6b7280" }}>
            No payments found.
          </div>
        )}
      </div>
    </div>
  );
}

const pageBtnStyle = {
  border: "1px solid #e5e7eb",
  background: "#fff",
  borderRadius: 10,
  padding: "6px 10px",
  cursor: "pointer",
};
