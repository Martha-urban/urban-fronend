import React, { useEffect, useMemo, useState } from "react";
import { api } from "../api/api";

export default function Couriers() {
  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [page, setPage] = useState(0);
  const size = 10;
  const [pageData, setPageData] = useState(null);

  const [couriers, setCouriers] = useState([]);
  const [showInactive, setShowInactive] = useState(false);

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingCourier, setEditingCourier] = useState(null);
  const [selectedCourier, setSelectedCourier] = useState(null);
  const [courierOrders, setCourierOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState("");

  const [form, setForm] = useState({
    name: "",
    phoneNumber: "",
    vehicleInfo: "",
    notes: "",
  });

  useEffect(() => {
    loadCouriers();
    // eslint-disable-next-line
  }, [page, showInactive]);

  async function loadCouriers() {
    try {
      setLoading(true);
      setError("");

      const res = await api.get("/api/v1/couriers", {
        params: { page, size, activeOnly: !showInactive },
      });

      setPageData(res.data);
      setCouriers(res.data.content || []);
    } catch (e) {
      setError("Failed to load couriers.");
    } finally {
      setLoading(false);
    }
  }

  const filtered = useMemo(() => {
    return couriers.filter((c) => {
      const q = search.toLowerCase();
      return (
        (c.name || "").toLowerCase().includes(q) ||
        (c.phoneNumber || "").toLowerCase().includes(q) ||
        (c.vehicleInfo || "").toLowerCase().includes(q)
      );
    });
  }, [couriers, search]);

  function openAddModal() {
    setForm({ name: "", phoneNumber: "", vehicleInfo: "", notes: "" });
    setIsAddOpen(true);
  }

  function closeAddModal() {
    setIsAddOpen(false);
  }

  function handleFormChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleAddCourier() {
    if (!form.name.trim()) {
      alert("Courier name is required.");
      return;
    }
    if (!form.phoneNumber.trim()) {
      alert("Courier phone number is required.");
      return;
    }

    try {
      setLoading(true);
      await api.post("/api/v1/couriers", form);
      closeAddModal();
      setPage(0);
      await loadCouriers();
    } catch (e) {
      alert(e.response?.data?.message || "Failed to add courier.");
    } finally {
      setLoading(false);
    }
  }

  function openEditModal(courier) {
    setEditingCourier({ ...courier });
  }

  function closeEditModal() {
    setEditingCourier(null);
  }

  function handleEditChange(e) {
    const { name, value, type, checked } = e.target;
    setEditingCourier({
      ...editingCourier,
      [name]: type === "checkbox" ? checked : value,
    });
  }

  async function handleSaveEdit() {
    if (!editingCourier.name.trim()) {
      alert("Courier name is required.");
      return;
    }
    if (!editingCourier.phoneNumber.trim()) {
      alert("Courier phone number is required.");
      return;
    }

    try {
      setLoading(true);
      await api.put(`/api/v1/couriers/${editingCourier.id}`, editingCourier);
      closeEditModal();
      await loadCouriers();
    } catch (e) {
      alert(e.response?.data?.message || "Failed to update courier.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDeactivateCourier(id) {
    if (!window.confirm("Deactivate this courier? They won't show up when assigning couriers to new orders, but past orders keep their history.")) return;

    try {
      setLoading(true);
      await api.delete(`/api/v1/couriers/${id}`);
      await loadCouriers();
    } catch {
      alert("Failed to deactivate courier.");
    } finally {
      setLoading(false);
    }
  }

  async function openCourierOrders(courier) {
    setSelectedCourier(courier);
    setCourierOrders([]);
    setOrdersError("");
    setOrdersLoading(true);

    try {
      const res = await api.get("/api/v1/orders", {
        params: {
          page: 0,
          size: 10,
          sort: "createdAt,desc",
          courierId: String(courier.id),
        },
      });
      setCourierOrders(Array.isArray(res.data) ? res.data : res.data.content || []);
    } catch (e) {
      const status = e.response?.status;
      setOrdersError(
        status === 403
          ? "You do not have permission to view orders."
          : status === 404
            ? "The orders endpoint was not found."
            : "Failed to load orders for this courier."
      );
    } finally {
      setOrdersLoading(false);
    }
  }

  function closeCourierOrders() {
    setSelectedCourier(null);
    setCourierOrders([]);
    setOrdersError("");
  }

  return (
    <div style={{ padding: 18 }}>

      {/* RESPONSIVE CSS */}
      <style>{`
        @media (max-width: 768px) {

          .desktop-header,
          .desktop-row {
            display: none !important;
          }

          .mobile-card {
            display: block;
            padding: 14px;
            border-top: 1px solid #f3f4f6;
            background: #fff;
          }

          .toolbar {
            flex-direction: column !important;
            align-items: stretch !important;
          }

          .toolbar button {
            width: 100%;
          }

          .search-box {
            width: 100% !important;
            min-width: 100% !important;
          }
        }

        @media (min-width: 769px) {
          .mobile-card {
            display: none;
          }
        }
      `}</style>

      {/* Header */}
      <div style={{ marginBottom: 14 }}>
        <h2 style={{ margin: 0, fontSize: 22 }}>Couriers</h2>
        <p style={{ margin: "6px 0 0", color: "#6b7280" }}>
          Manage the couriers you dispatch orders to
        </p>
      </div>

      {/* Toolbar */}
      <div
        className="toolbar"
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 12,
          flexWrap: "wrap",
          marginBottom: 14,
        }}
      >
        {/* Search */}
        <div
          className="search-box"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            border: "1px solid #e5e7eb",
            background: "#fff",
            padding: "10px 14px",
            borderRadius: 12,
            minWidth: 280,
          }}
        >
          <span style={{ opacity: 0.7 }}>🔍</span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search couriers..."
            style={{
              border: "none",
              outline: "none",
              background: "transparent",
              width: "100%",
            }}
          />
        </div>

        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontSize: 13,
            fontWeight: 700,
            color: "#374151",
          }}
        >
          <input
            type="checkbox"
            checked={showInactive}
            onChange={(e) => {
              setPage(0);
              setShowInactive(e.target.checked);
            }}
          />
          Show inactive
        </label>

        <button
          onClick={openAddModal}
          style={{
            background: "#657dccff",
            color: "#fff",
            border: "none",
            padding: "12px 16px",
            borderRadius: 12,
            fontWeight: 900,
            cursor: "pointer",
          }}
        >
          + Add Courier
        </button>
      </div>

      {error && (
        <div style={{ color: "#991b1b", marginBottom: 12, fontWeight: 700 }}>
          {error}
        </div>
      )}

      {/* Table Container */}
      <div
        style={{
          background: "#fff",
          border: "1px solid #e5e7eb",
          borderRadius: 14,
          overflow: "hidden",
        }}
      >
        {/* Desktop Header */}
        <div
          className="desktop-header"
          style={{
            display: "grid",
            gridTemplateColumns: "1.2fr 1fr 1.2fr 0.8fr 1fr",
            gap: 10,
            padding: "14px 16px",
            background: "#f9fafb",
            fontWeight: 900,
            fontSize: 13,
          }}
        >
          <div>Name</div>
          <div>Phone</div>
          <div>Vehicle Info</div>
          <div>Status</div>
          <div>Actions</div>
        </div>

        {!loading && filtered.length === 0 && (
          <div style={{ padding: 24, textAlign: "center", color: "#6b7280" }}>
            No couriers found.
          </div>
        )}

        {/* Rows */}
        {filtered.map((c, idx) => (
          <React.Fragment key={c.id}>
            {/* Desktop row */}
            <div
              className="desktop-row"
              onClick={() => openCourierOrders(c)}
              style={{
                display: "grid",
                gridTemplateColumns: "1.2fr 1fr 1.2fr 0.8fr 1fr",
                gap: 10,
                padding: "14px 16px",
                borderTop: idx === 0 ? "none" : "1px solid #f3f4f6",
                alignItems: "center",
                cursor: "pointer",
              }}
            >
              <div style={{ fontWeight: 900 }}>{c.name}</div>
              <div>{c.phoneNumber}</div>
              <div>{c.vehicleInfo || "-"}</div>
              <div>
                <span
                  style={{
                    padding: "4px 10px",
                    borderRadius: 999,
                    fontSize: 12,
                    fontWeight: 800,
                    background: c.active ? "#dcfce7" : "#f3f4f6",
                    color: c.active ? "#166534" : "#6b7280",
                  }}
                >
                  {c.active ? "Active" : "Inactive"}
                </span>
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button onClick={() => openCourierOrders(c)} style={actionBtn}>
                  📦 Orders
                </button>
                <button onClick={(e) => { e.stopPropagation(); openEditModal(c); }} style={actionBtn}>
                  ✏️ Edit
                </button>
                {c.active && (
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDeactivateCourier(c.id); }}
                    style={{
                      ...actionBtn,
                      background: "#fee2e2",
                      color: "#991b1b",
                    }}
                  >
                    🚫 Deactivate
                  </button>
                )}
              </div>
            </div>

            {/* Mobile Card */}
            <div className="mobile-card" onClick={() => openCourierOrders(c)} style={{ cursor: "pointer" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ fontWeight: 900, fontSize: 16 }}>{c.name}</div>
                <span
                  style={{
                    padding: "4px 10px",
                    borderRadius: 999,
                    fontSize: 12,
                    fontWeight: 800,
                    background: c.active ? "#dcfce7" : "#f3f4f6",
                    color: c.active ? "#166534" : "#6b7280",
                  }}
                >
                  {c.active ? "Active" : "Inactive"}
                </span>
              </div>
              <div style={{ marginTop: 6, color: "#6b7280" }}>{c.phoneNumber}</div>
              <div style={{ marginTop: 2, color: "#6b7280" }}>
                {c.vehicleInfo || "No vehicle info"}
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
                <button onClick={() => openCourierOrders(c)} style={actionBtn}>
                  📦 Orders
                </button>
                <button onClick={(e) => { e.stopPropagation(); openEditModal(c); }} style={actionBtn}>
                  ✏️ Edit
                </button>
                {c.active && (
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDeactivateCourier(c.id); }}
                    style={{
                      ...actionBtn,
                      background: "#fee2e2",
                      color: "#991b1b",
                    }}
                  >
                    🚫 Deactivate
                  </button>
                )}
              </div>
            </div>
          </React.Fragment>
        ))}
      </div>

      {/* Pagination */}
      {pageData && pageData.totalPages > 1 && (
        <div style={{ display: "flex", justifyContent: "center", gap: 10, marginTop: 16 }}>
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            style={{ ...actionBtn, opacity: page === 0 ? 0.5 : 1 }}
          >
            ← Prev
          </button>
          <span style={{ alignSelf: "center", fontSize: 13, color: "#6b7280" }}>
            Page {page + 1} of {pageData.totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(pageData.totalPages - 1, p + 1))}
            disabled={page + 1 >= pageData.totalPages}
            style={{ ...actionBtn, opacity: page + 1 >= pageData.totalPages ? 0.5 : 1 }}
          >
            Next →
          </button>
        </div>
      )}

      {/* ADD MODAL */}
      {isAddOpen && (
        <div style={modalOverlay}>
          <div style={modalBox}>
            <h3>Add Courier</h3>
            <div style={{ display: "grid", gap: 12 }}>
              <input
                name="name"
                value={form.name}
                onChange={handleFormChange}
                placeholder="Courier Name"
                style={inputStyle}
              />
              <input
                name="phoneNumber"
                value={form.phoneNumber}
                onChange={handleFormChange}
                placeholder="Phone Number"
                style={inputStyle}
              />
              <input
                name="vehicleInfo"
                value={form.vehicleInfo}
                onChange={handleFormChange}
                placeholder="Vehicle Info (e.g. Motorbike - KMEA 123X)"
                style={inputStyle}
              />
              <textarea
                name="notes"
                value={form.notes}
                onChange={handleFormChange}
                placeholder="Notes (e.g. coverage area)"
                rows={3}
                style={{ ...inputStyle, resize: "none" }}
              />
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 16 }}>
              <button onClick={closeAddModal} style={cancelBtn}>
                Cancel
              </button>
              <button onClick={handleAddCourier} style={saveBtn}>
                Add Courier
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {editingCourier && (
        <div style={modalOverlay}>
          <div style={modalBox}>
            <h3>Edit Courier</h3>
            <div style={{ display: "grid", gap: 12 }}>
              <input
                name="name"
                value={editingCourier.name}
                onChange={handleEditChange}
                style={inputStyle}
              />
              <input
                name="phoneNumber"
                value={editingCourier.phoneNumber}
                onChange={handleEditChange}
                style={inputStyle}
              />
              <input
                name="vehicleInfo"
                value={editingCourier.vehicleInfo || ""}
                onChange={handleEditChange}
                style={inputStyle}
              />
              <textarea
                name="notes"
                value={editingCourier.notes || ""}
                onChange={handleEditChange}
                rows={3}
                style={{ ...inputStyle, resize: "none" }}
              />
              <label style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 700 }}>
                <input
                  type="checkbox"
                  name="active"
                  checked={!!editingCourier.active}
                  onChange={handleEditChange}
                />
                Active
              </label>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 16 }}>
              <button onClick={closeEditModal} style={cancelBtn}>
                Cancel
              </button>
              <button onClick={handleSaveEdit} style={saveBtn}>
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedCourier && (
        <div style={modalOverlay} onClick={closeCourierOrders}>
          <div style={ordersModalBox} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
              <div>
                <h3 style={{ margin: 0 }}>{selectedCourier.name}'s Orders</h3>
                <div style={{ marginTop: 4, color: "#6b7280", fontSize: 13 }}>
                  Orders assigned to this courier
                </div>
              </div>
              <button onClick={closeCourierOrders} style={xBtn}>✖</button>
            </div>

            {ordersLoading && <div style={{ padding: "28px 0", color: "#6b7280" }}>Loading orders...</div>}
            {ordersError && <div style={{ padding: "28px 0", color: "#991b1b", fontWeight: 700 }}>{ordersError}</div>}
            {!ordersLoading && !ordersError && courierOrders.length === 0 && (
              <div style={{ padding: "28px 0", color: "#6b7280", textAlign: "center" }}>
                No orders found for this courier.
              </div>
            )}
            {!ordersLoading && !ordersError && courierOrders.length > 0 && (
              <div style={{ overflowX: "auto", marginTop: 16 }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead>
                    <tr style={{ textAlign: "left", background: "#f9fafb" }}>
                      <th style={orderCellStyle}>Customer</th>
                      <th style={orderCellStyle}>Product</th>
                      <th style={orderCellStyle}>Amount</th>
                      <th style={orderCellStyle}>Status</th>
                      <th style={orderCellStyle}>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {courierOrders.map((order) => (
                      <tr key={order.id} style={{ borderTop: "1px solid #f3f4f6" }}>
                        <td style={orderCellStyle}>{order.customerName || "-"}</td>
                        <td style={orderCellStyle}>{order.productName || "-"}</td>
                        <td style={{ ...orderCellStyle, fontWeight: 800 }}>
                          KES {Number(order.totalAmount || 0).toLocaleString()}
                        </td>
                        <td style={orderCellStyle}>{order.orderStatus || "-"}</td>
                        <td style={orderCellStyle}>{order.createdAt ? String(order.createdAt).slice(0, 10) : "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* Styles */
const inputStyle = {
  border: "1px solid #e5e7eb",
  borderRadius: 12,
  padding: "12px",
  outline: "none",
  width: "100%",
};

const actionBtn = {
  border: "1px solid #e5e7eb",
  background: "#f9fafb",
  padding: "6px 8px",
  borderRadius: 8,
  cursor: "pointer",
  fontWeight: 800,
  fontSize: 12,
};

const modalOverlay = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.35)",
  display: "grid",
  placeItems: "center",
  zIndex: 999,
};

const modalBox = {
  width: "520px",
  maxWidth: "95vw",
  background: "#fff",
  borderRadius: 16,
  padding: 18,
};

const cancelBtn = {
  border: "1px solid #e5e7eb",
  background: "#fff",
  padding: "10px 14px",
  borderRadius: 12,
  cursor: "pointer",
  fontWeight: 800,
};

const saveBtn = {
  border: "none",
  background: "#647dceff",
  color: "#fff",
  padding: "10px 14px",
  borderRadius: 12,
  cursor: "pointer",
  fontWeight: 900,
};

const xBtn = {
  border: "1px solid #e5e7eb",
  background: "#fff",
  color: "#374151",
  width: 34,
  height: 34,
  borderRadius: 10,
  cursor: "pointer",
  fontWeight: 900,
};

const ordersModalBox = {
  ...modalBox,
  width: "900px",
  maxHeight: "85vh",
  overflow: "auto",
};

const orderCellStyle = {
  padding: "10px 8px",
  verticalAlign: "top",
};