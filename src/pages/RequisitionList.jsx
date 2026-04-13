import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getRequisitions,
  approveRequisition,
  rejectRequisition,
  markPaidRequisition,
} from "../api/requisitionApi";

export default function RequisitionList() {
  const navigate = useNavigate();
  const [requisitions, setRequisitions] = useState([]);
  const [page, setPage] = useState(0);
  const [size] = useState(10);
  const [pageData, setPageData] = useState(null);
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 900);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    loadRequisitions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, statusFilter]);

  async function loadRequisitions() {
    try {
      setLoading(true);
      setError("");
      const res = await getRequisitions({
        page,
        size,
        sort: "createdAt,desc",
        status: statusFilter || undefined,
      });
      setPageData(res);
      setRequisitions(res.content || []);
    } catch (e) {
      console.error(e);
      setError("Failed to load requisitions. Check backend and token.");
    } finally {
      setLoading(false);
    }
  }

  async function handleApprove(id) {
    if (!window.confirm("Approve this requisition?")) return;
    try {
      setLoading(true);
      await approveRequisition(id);
      await loadRequisitions();
      alert("Requisition approved.");
    } catch (e) {
      console.error(e);
      alert("Failed to approve requisition.");
    } finally {
      setLoading(false);
    }
  }

  async function handleReject(id) {
    const reason = window.prompt("Enter rejection reason:");
    if (!reason) return;
    try {
      setLoading(true);
      await rejectRequisition(id, reason);
      await loadRequisitions();
      alert("Requisition rejected.");
    } catch (e) {
      console.error(e);
      alert("Failed to reject requisition.");
    } finally {
      setLoading(false);
    }
  }

  async function handleMarkPaid(id) {
    if (!window.confirm("Mark this requisition as paid?")) return;
    try {
      setLoading(true);
      await markPaidRequisition(id);
      await loadRequisitions();
      alert("Requisition marked as paid.");
    } catch (e) {
      console.error(e);
      alert("Failed to mark requisition as paid.");
    } finally {
      setLoading(false);
    }
  }

  function formatMoney(value) {
    return `KES ${Number(value || 0).toLocaleString()}`;
  }

  function niceStatus(status) {
    return String(status || "")
      .replaceAll("_", " ")
      .toLowerCase()
      .replace(/\b\w/g, (c) => c.toUpperCase());
  }

  function getStatusBadgeStyle(status) {
    const normalized = String(status || "").toUpperCase();
    if (normalized === "REJECTED") {
      return { background: "#fee2e2", color: "#991b1b" };
    }
    if (normalized === "PAID") {
      return { background: "#d1fae5", color: "#047857" };
    }
    if (normalized === "APPROVED") {
      return { background: "#dbeafe", color: "#1d4ed8" };
    }
    return { background: "#f3f4f6", color: "#111827" };
  }

  return (
    <div style={{ padding: 18 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 18,
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div>
          <h2 style={{ margin: 0 }}>Requisitions</h2>
          <p style={{ margin: "6px 0 0", color: "#6b7280" }}>
            Approve or reject requisitions from the list below.
          </p>
        </div>

        <button onClick={() => navigate("/requisitions/new")} style={buttonStyle}>
          + New Requisition
        </button>
      </div>

      <div style={{ marginBottom: 16, display: "flex", gap: 10, flexWrap: "wrap" }}>
        <select
          value={statusFilter}
          onChange={(e) => {
            setPage(0);
            setStatusFilter(e.target.value);
          }}
          style={selectStyle}
        >
          <option value="">All statuses</option>
          <option value="PENDING">Pending</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
          <option value="PAID">Paid</option>
        </select>

        {statusFilter && (
          <button
            onClick={() => {
              setStatusFilter("");
              setPage(0);
            }}
            style={secondaryButtonStyle}
          >
            Clear filter
          </button>
        )}
      </div>

      <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 14, overflow: "hidden" }}>
        {!isMobile && (
          <div style={headerRowStyle}>
            <div>Title</div>
            <div>Type</div>
            <div>Requested By</div>
            <div>Amount</div>
            <div>Status</div>
            <div>Approved By</div>
            <div>Paid By</div>
            <div>Paid At</div>
            <div>Requested At</div>
            <div>Action</div>
          </div>
        )}

        {loading && <div style={{ padding: 16 }}>Loading requisitions...</div>}
        {error && !loading && <div style={{ padding: 16, color: "crimson" }}>{error}</div>}

        {!loading && requisitions.length === 0 && (
          <div style={{ padding: 16, color: "#6b7280" }}>No requisitions found.</div>
        )}

        {!loading && requisitions.map((req, idx) => (
          isMobile ? (
            <div key={req.id} style={{ ...mobileCardStyle, borderTop: idx === 0 ? "none" : "1px solid #f3f4f6" }}>
              <div style={mobileCardHeaderStyle}>
                <div>
                  <div style={mobileTitleStyle}>{req.title}</div>
                  <div style={mobileMetaStyle}>{req.requisitionType?.replaceAll("_", " ")}</div>
                </div>
                <div style={{ ...statusTagStyle, ...getStatusBadgeStyle(req.status) }}>{niceStatus(req.status)}</div>
              </div>

              <div style={mobileInfoGridStyle}>
                <div>
                  <strong>Requested By</strong>
                  <div>{req.requestedBy?.name || req.requestedBy?.email || "-"}</div>
                </div>
                <div>
                  <strong>Amount</strong>
                  <div>{formatMoney(req.amountRequested)}</div>
                </div>
                <div>
                  <strong>Requested At</strong>
                  <div>{new Date(req.createdAt).toLocaleDateString("en-CA")}</div>
                </div>
                <div>
                  <strong>Approved By</strong>
                  <div>{req.approvedBy?.name || req.approvedBy?.email || "-"}</div>
                </div>
                <div>
                  <strong>Paid By</strong>
                  <div>{req.paidBy?.name || req.paidBy?.email || "-"}</div>
                </div>
                <div>
                  <strong>Paid At</strong>
                  <div>{req.paidAt ? new Date(req.paidAt).toLocaleDateString("en-CA") : "-"}</div>
                </div>
              </div>

              <div style={mobileActionsStyle}>
                {req.status === "PENDING" && (
                  <>
                    <button onClick={() => handleApprove(req.id)} style={approveBtn}>
                      Approve
                    </button>
                    <button onClick={() => handleReject(req.id)} style={rejectBtn}>
                      Reject
                    </button>
                  </>
                )}
                {req.status === "APPROVED" && (
                  <button onClick={() => handleMarkPaid(req.id)} style={paidBtn}>
                    Mark Paid
                  </button>
                )}
                {(req.status === "REJECTED" || req.status === "PAID") && <span style={{ color: "#6b7280" }}>No actions</span>}
              </div>
            </div>
          ) : (
            <div key={req.id} style={{ ...rowStyle, borderTop: idx === 0 ? "none" : "1px solid #f3f4f6" }}>
              <div>{req.title}</div>
              <div>{req.requisitionType?.replaceAll("_", " ")}</div>
              <div>{req.requestedBy?.name || req.requestedBy?.email || "-"}</div>
              <div>{formatMoney(req.amountRequested)}</div>
              <div>
                <span style={{ ...statusTagStyle, ...getStatusBadgeStyle(req.status), display: "inline-flex", minWidth: 80, justifyContent: "center" }}>
                  {niceStatus(req.status)}
                </span>
              </div>
              <div>{req.approvedBy?.name || req.approvedBy?.email || "-"}</div>
              <div>{req.paidBy?.name || req.paidBy?.email || "-"}</div>
              <div>{req.paidAt ? new Date(req.paidAt).toLocaleDateString("en-CA") : "-"}</div>
              <div>{new Date(req.createdAt).toLocaleDateString("en-CA")}</div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {req.status === "PENDING" && (
                  <>
                    <button onClick={() => handleApprove(req.id)} style={approveBtn}>
                      Approve
                    </button>
                    <button onClick={() => handleReject(req.id)} style={rejectBtn}>
                      Reject
                    </button>
                  </>
                )}
                {req.status === "APPROVED" && (
                  <button onClick={() => handleMarkPaid(req.id)} style={paidBtn}>
                    Mark Paid
                  </button>
                )}
                {(req.status === "REJECTED" || req.status === "PAID") && <span style={{ color: "#6b7280" }}>No actions</span>}
              </div>
            </div>
          )
        ))}

        {pageData && (
          <div style={footerStyle}>
            <div>
              Showing {requisitions.length} of {pageData.totalElements}
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <button disabled={page === 0} onClick={() => setPage((p) => Math.max(0, p - 1))} style={pageBtnStyle}>
                ‹
              </button>
              <span style={{ fontWeight: 700 }}>Page {page + 1} / {pageData.totalPages || 1}</span>
              <button disabled={pageData.last} onClick={() => setPage((p) => p + 1)} style={pageBtnStyle}>
                ›
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const buttonStyle = {
  border: "none",
  background: "#1e40af",
  color: "#fff",
  padding: "10px 14px",
  borderRadius: 12,
  cursor: "pointer",
  fontWeight: 900,
};

const secondaryButtonStyle = {
  border: "1px solid #e5e7eb",
  background: "#fff",
  color: "#111827",
  padding: "10px 14px",
  borderRadius: 12,
  cursor: "pointer",
  fontWeight: 900,
};

const selectStyle = {
  padding: "10px 12px",
  borderRadius: 10,
  border: "1px solid #e5e7eb",
  background: "#fff",
  fontWeight: 700,
};

const headerRowStyle = {
  display: "grid",
  gridTemplateColumns: "1.5fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr 1.4fr",
  gap: 10,
  padding: "14px 16px",
  background: "#f9fafb",
  fontWeight: 800,
  color: "#374151",
  fontSize: 14,
};

const rowStyle = {
  display: "grid",
  gridTemplateColumns: "1.5fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr 1.4fr",
  gap: 10,
  padding: "14px 16px",
  alignItems: "center",
  fontSize: 14,
};

const mobileCardStyle = {
  padding: 16,
  display: "flex",
  flexDirection: "column",
  gap: 14,
  background: "#fff",
};

const mobileCardHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: 12,
  flexWrap: "wrap",
};

const mobileTitleStyle = {
  fontWeight: 700,
  fontSize: 16,
  marginBottom: 6,
};

const mobileMetaStyle = {
  color: "#6b7280",
  fontSize: 13,
};

const statusTagStyle = {
  padding: "6px 10px",
  borderRadius: 999,
  background: "#f3f4f6",
  color: "#111827",
  fontWeight: 700,
  fontSize: 12,
  alignSelf: "flex-start",
};

const mobileInfoGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: 12,
  width: "100%",
};

const mobileActionsStyle = {
  display: "flex",
  flexDirection: "column",
  gap: 10,
};

const approveBtn = {
  border: "none",
  background: "#10b981",
  color: "#fff",
  borderRadius: 10,
  padding: "8px 12px",
  cursor: "pointer",
  fontWeight: 700,
};

const rejectBtn = {
  border: "none",
  background: "#ef4444",
  color: "#fff",
  borderRadius: 10,
  padding: "8px 12px",
  cursor: "pointer",
  fontWeight: 700,
};

const paidBtn = {
  border: "none",
  background: "#3b82f6",
  color: "#fff",
  borderRadius: 10,
  padding: "8px 12px",
  cursor: "pointer",
  fontWeight: 700,
};

const footerStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  flexWrap: "wrap",
  gap: 10,
  padding: "12px 16px",
  borderTop: "1px solid #e5e7eb",
  background: "#fff",
};

const pageBtnStyle = {
  border: "1px solid #e5e7eb",
  background: "#fff",
  borderRadius: 10,
  padding: "6px 10px",
  cursor: "pointer",
};
