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
    // eslint-disable-next-line
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
    // eslint-disable-next-line
  }, [payments]);

  // filtering logic stays same
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

  // ---- MAPPERS ----
  function mapMethod(method) {
    if (!method) return "Cash";
    if (method === "MPESA") return "M-Pesa";
    if (method === "CASH") return "Cash";
    if (method === "BANK") return "Bank";
    return String(method);
  }

  function mapStatus(status) {
    if (!status) return "Pending";

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
        className="pay-header"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 12,
          flexWrap: "wrap",
          gap: 10,
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
        className="pay-filters"
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
            className="pay-datebox"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              background: "#fff",
              border: "1px solid #e5e7eb",
              padding: 10,
              borderRadius: 12,
              flexWrap: "wrap",
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
        <div
          className="pay-right"
          style={{ display: "flex", gap: 10, flexWrap: "wrap" }}
        >
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
        className="pay-tabs"
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
          className="pay-search"
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

      {/* Payments */}
      <div
        style={{
          background: "#fff",
          border: "1px solid #e5e7eb",
          borderRadius: 14,
          overflow: "hidden",
        }}
      >
        {/* ✅ Desktop table header */}
        <div
          className="pay-desktop-header"
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
              <React.Fragment key={p.id}>
                {/* ✅ Desktop row */}
                <div
                  className="pay-desktop-row"
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

                {/* ✅ Mobile card (form-like) */}
                <div className="pay-mobile-card">
                  <div className="pay-mobile-top">
                    <div className="pay-mobile-id">{p.id}</div>
                    <div className="pay-mobile-date">{p.date}</div>
                  </div>

                  <div className="pay-mobile-customer">{p.customer}</div>

                  <div className="pay-mobile-grid">
                    <div className="pay-mobile-field">
                      <div className="pay-mobile-label">Method</div>
                      <div className="pay-mobile-value">
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
                    </div>

                    <div className="pay-mobile-field">
                      <div className="pay-mobile-label">Amount</div>
                      <div className="pay-mobile-value" style={{ fontWeight: 900 }}>
                        {money(p.amount)}
                      </div>
                    </div>

                    <div className="pay-mobile-field">
                      <div className="pay-mobile-label">Status</div>
                      <div className="pay-mobile-value">
                        <span
                          style={{
                            background: s.bg,
                            color: s.color,
                            padding: "6px 10px",
                            borderRadius: 999,
                            fontWeight: 900,
                            fontSize: 13,
                            display: "inline-block",
                          }}
                        >
                          {p.status}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </React.Fragment>
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
          <div style={{ padding: 16, color: "#6b7280" }}>No payments found.</div>
        )}
      </div>

      {/* ✅ responsiveness styles */}
      <style>{`
        /* MOBILE CARD HIDDEN BY DEFAULT */
        .pay-mobile-card { display: none; }

        @media (max-width: 768px) {
          .pay-header {
            flex-direction: column;
            align-items: flex-start !important;
            gap: 12px;
          }

          .pay-search {
            min-width: 100% !important;
          }

          /* Hide desktop table on mobile */
          .pay-desktop-header,
          .pay-desktop-row {
            display: none !important;
          }

          /* Show mobile cards */
          .pay-mobile-card {
            display: block;
            padding: 14px 16px;
            border-top: 1px solid #f3f4f6;
            background: #fff;
          }

          .pay-mobile-top {
            display: flex;
            justify-content: space-between;
            gap: 10px;
            align-items: center;
            margin-bottom: 8px;
          }

          .pay-mobile-id {
            font-weight: 900;
            font-size: 16px;
            color: #111827;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            max-width: 70%;
          }

          .pay-mobile-date {
            font-weight: 800;
            color: #111827;
            white-space: nowrap;
          }

          .pay-mobile-customer {
            color: #374151;
            font-weight: 700;
            margin-bottom: 12px;
          }

          .pay-mobile-grid {
            display: grid;
            grid-template-columns: 1fr;
            gap: 12px;
          }

          .pay-mobile-field {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 12px;
          }

          .pay-mobile-label {
            color: #6b7280;
            font-size: 13px;
            font-weight: 800;
          }

          .pay-mobile-value {
            text-align: right;
          }
        }
      `}</style>
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