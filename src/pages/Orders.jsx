import React, { useEffect, useMemo, useState } from "react";
import { api } from "../api/api";

export default function Orders() {
  const [from, setFrom] = useState("2026-02-01");
  const [to, setTo] = useState("2026-02-29");

  // Backend state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Pageable orders
  const [page, setPage] = useState(0);
  const size = 10;
  const [pageData, setPageData] = useState(null);
  const [orders, setOrders] = useState([]);

  // Products for dropdown
  const [products, setProducts] = useState([]);

  // filter state

  const [statusFilter, setStatusFilter] = useState("");

  // Create order modal
  const [isAddOpen, setIsAddOpen] = useState(false);

  // Edit status modal
  const [editingOrder, setEditingOrder] = useState(null);
  const [editStatus, setEditStatus] = useState("AWAITING_DISPATCH");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [noteText, setNoteText] = useState("");
  const [noteError, setNoteError] = useState("");

  // Quick Order form
  const [customerForm, setCustomerForm] = useState({
    name: "",
    phone: "",
    email: "",
    city_town: "",
  });

  const [orderForm, setOrderForm] = useState({
    orderType: "ONLINE",
    deliveryCity: "",
    deliveryNotes: "",
    assignedTo: "",
  });

  const [itemForm, setItemForm] = useState({
    productId: "",
    quantity: 1,
  });

  const [cartItems, setCartItems] = useState([]);

  // Order status enums
  const ORDER_STATUSES = [
    "AWAITING_DISPATCH",
    "DISPATCHED_PAID",
    "DISPATCHED_PARTIAL",
    "DISPATCHED_UNPAID",
    "DELIVERED_PAID",
    "DELIVERED_UNPAID",
    "RETURN_REQUESTED",
    "RETURN_IN_TRANSIT",
    "RETURNED_AWAITING_INSPECTION",
    "RETURNED_GOOD",
    "RETURNED_DAMAGED",
    "CANCELLED",
    "COMPLETED",
  ];

  useEffect(() => {
    loadOrders();
    // eslint-disable-next-line
  }, [page, statusFilter]);

  useEffect(() => {
    loadProducts();
    // eslint-disable-next-line
  }, []);

  async function loadOrders() {
    try {
      setLoading(true);
      setError("");

      const res = await api.get("/api/v1/orders", {
        params: {
          page,
          size,
          sort: "createdAt,desc",
          status: statusFilter || undefined,
        },
      });

      setPageData(res.data);
      setOrders(res.data.content || []);
    } catch (e) {
      console.log(e);
      setError("Failed to load orders. Check backend, token, and CORS.");
    } finally {
      setLoading(false);
    }
  }

  async function loadProducts() {
    try {
      const res = await api.get("/api/v1/products", {
        params: { page: 0, size: 500, sort: "createdAt,desc" },
      });

      const list = res.data.content || [];
      setProducts(list);

      if (list.length > 0) {
        setItemForm((prev) => ({ ...prev, productId: list[0].id }));
      }
    } catch (e) {
      console.log(e);
    }
  }

  function openAddModal() {
    setCustomerForm({ name: "", phone: "", email: "", city_town: "" });
    setOrderForm({
      orderType: "ONLINE",
      deliveryCity: "",
      deliveryNotes: "",
      assignedTo: "",
    });

    setCartItems([]);
    setError("");
    setIsAddOpen(true);
  }

  function closeAddModal() {
    setIsAddOpen(false);
  }

  function openEditModal(order) {
    setEditingOrder(order);
    setEditStatus(order.orderStatus || "AWAITING_DISPATCH");
    setError("");
  }

  function closeEditModal() {
    setEditingOrder(null);
  }

  function formatMoney(value) {
    return `KES ${Number(value || 0).toLocaleString()}`;
  }

  function statusStyle(status) {
    const s = String(status || "").toUpperCase();

    if (s.includes("DELIVERED") || s === "COMPLETED")
      return { color: "#166534", bg: "#dcfce7" };

    if (s.includes("DISPATCHED"))
      return { color: "#1d4ed8", bg: "#dbeafe" };

    if (s.includes("AWAITING"))
      return { color: "#b45309", bg: "#ffedd5" };

    if (s === "CANCELLED") return { color: "#9f1239", bg: "#ffe4e6" };

    return { color: "#374151", bg: "#f3f4f6" };
  }

  function niceStatus(status) {
    return String(status || "")
      .replaceAll("_", " ")
      .toLowerCase()
      .replace(/\b\w/g, (c) => c.toUpperCase());
  }

  function handleCustomerChange(e) {
    setCustomerForm({ ...customerForm, [e.target.name]: e.target.value });
  }

  function handleOrderChange(e) {
    setOrderForm({ ...orderForm, [e.target.name]: e.target.value });
  }

  function handleItemChange(e) {
    setItemForm({ ...itemForm, [e.target.name]: e.target.value });
  }

  function addItemToCart() {
    if (!itemForm.productId) {
      alert("Select a product");
      return;
    }

    const qty = Number(itemForm.quantity);
    if (!qty || qty <= 0) {
      alert("Enter valid quantity");
      return;
    }

    const product = products.find((p) => p.id === itemForm.productId);
    if (!product) {
      alert("Invalid product");
      return;
    }

    const exists = cartItems.find((i) => i.productId === itemForm.productId);
    if (exists) {
      setCartItems(
        cartItems.map((i) =>
          i.productId === itemForm.productId
            ? { ...i, quantity: Number(i.quantity) + qty }
            : i
        )
      );
      return;
    }

    setCartItems([
      ...cartItems,
      {
        productId: itemForm.productId,
        productName: product.name,
        sellingPrice: product.sellingPrice,
        quantity: qty,
      },
    ]);
  }

  function removeCartItem(productId) {
    setCartItems(cartItems.filter((i) => i.productId !== productId));
  }

  const cartTotal = useMemo(() => {
    return cartItems.reduce((sum, i) => {
      return sum + Number(i.sellingPrice || 0) * Number(i.quantity || 0);
    }, 0);
  }, [cartItems]);

  async function handleCreateOrder() {
    if (!customerForm.name) {
      alert("Customer name is required.");
      return;
    }

    // phone required only for ONLINE orders
    if (orderForm.orderType === "ONLINE" && !customerForm.phone) {
      alert("Customer phone is required for ONLINE orders.");
      return;
    }

    // delivery city required only for ONLINE orders
    if (orderForm.orderType === "ONLINE" && !orderForm.deliveryCity) {
      alert("Delivery city is required for ONLINE orders.");
      return;
    }

    if (cartItems.length === 0) {
      alert("Add at least one product to the order.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      // 1) Create customer first
      const customerPayload = {
        name: customerForm.name,
        phone: customerForm.phone || null,
        email: customerForm.email || null,
        city_town:
          customerForm.city_town ||
          (orderForm.orderType === "ONLINE" ? orderForm.deliveryCity : null),
      };

      const customerRes = await api.post("/api/v1/customers", customerPayload);

      const customerId = customerRes.data.id || customerRes.data.customerId;
      if (!customerId)
        throw new Error("Customer created but no customerId returned.");

      // 2) Create order
      const orderPayload = {
        customerId,
        orderType: orderForm.orderType || "ONLINE",
        assignedTo: orderForm.assignedTo || null,

        deliveryCity:
          orderForm.orderType === "ONLINE" ? orderForm.deliveryCity : null,

        deliveryNotes:
          orderForm.orderType === "ONLINE"
            ? orderForm.deliveryNotes || null
            : null,

        items: cartItems.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
        })),
      };

      console.log("ORDER PAYLOAD:", orderPayload);

      await api.post("/api/v1/orders", orderPayload);

      closeAddModal();
      setPage(0);
      await loadOrders();

      alert("Order created successfully!");
    } catch (e) {
      console.log(e);
      setError("Failed to create order. Check backend + customer endpoint.");
      alert("Failed to create order. Check console.");
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdateStatus() {
    if (!editingOrder?.id) return;

    try {
      setLoading(true);
      setError("");

      await api.patch(`/api/v1/orders/${editingOrder.id}/status`, null, {
        params: { status: editStatus },
      });

      closeEditModal();
      await loadOrders();

      alert("Order status updated!");
    } catch (e) {
      console.log(e);
      setError("Failed to update status.");
      alert("Failed to update status. Check console.");
    } finally {
      setLoading(false);
    }
  }

  function openNotesModal(order) {
    setSelectedOrder(order);
    setNoteText(order.deliveryNotes || "");
    setNoteError("");
  }

  function closeNotesModal() {
    setSelectedOrder(null);
    setNoteText("");
    setNoteError("");
  }

  async function handleUpdateNotes() {
    if (!selectedOrder?.id) return;

    try {
      setLoading(true);
      setNoteError("");

      await api.patch(`/api/v1/orders/${selectedOrder.id}`, {
        deliveryNotes: noteText || null,
      });

      closeNotesModal();
      await loadOrders();

      alert("Delivery notes updated.");
    } catch (e) {
      console.log(e);
      setNoteError("Failed to update delivery notes.");
      alert("Failed to update notes. Check console.");
    } finally {
      setLoading(false);
    }
  }

  function previewText(text, maxLength = 60) {
    if (!text) return "No delivery notes";
    return text.length <= maxLength ? text : `${text.slice(0, maxLength)}…`;
  }

  return (
    <div style={{ padding: 18 }}>
      {/* ✅ Responsive CSS must be INSIDE return */}
      <style>{`
        @media (max-width: 768px) {
          .desktop-table-header,
          .desktop-row {
            display: none !important;
          }

          .mobile-card {
            display: block;
            padding: 14px;
            border-top: 1px solid #f3f4f6;
            background: #fff;
          }

          .responsive-grid-2 {
            grid-template-columns: 1fr !important;
          }

          .responsive-grid-3 {
            grid-template-columns: 1fr !important;
          }

          .header-flex {
            flex-direction: column;
            align-items: flex-start !important;
            gap: 12px;
          }

          .header-actions {
            width: 100%;
            justify-content: space-between;
          }

          .actions-row {
            flex-wrap: wrap;
          }
        }

        @media (min-width: 769px) {
          .mobile-card {
            display: none;
          }
        }
      `}</style>

      {/* Header */}
      <div
        className="header-flex"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 12,
          flexWrap: "wrap",
          gap: 10,
        }}
      >
        <h2 style={{ margin: 0, fontSize: 22 }}>Orders</h2>

        <div
          className="header-actions"
          style={{ display: "flex", gap: 10, alignItems: "center" }}
        >
          <button onClick={openAddModal} style={addOrderBtn}>
            + Add Order
          </button>

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

      <div style={{ marginBottom: 16, display: "flex", gap: 10, flexWrap: "wrap" }}>
        <select
          value={statusFilter}
          onChange={(e) => {
            setPage(0);
            setStatusFilter(e.target.value);
          }}
          style={{
            padding: "10px 12px",
            borderRadius: 10,
            border: "1px solid #e5e7eb",
            fontWeight: 700,
            background: "#fff",
          }}
        >
          <option value="">All Statuses</option>

          {ORDER_STATUSES.map((s) => (
            <option key={s} value={s}>
              {niceStatus(s)}
            </option>
          ))}
        </select>

        {statusFilter && (
          <button
            onClick={() => setStatusFilter("")}
            style={{
              border: "1px solid #e5e7eb",
              background: "#fff",
              borderRadius: 10,
              padding: "10px 12px",
              cursor: "pointer",
              fontWeight: 800,
            }}
          >
            Clear Filter
          </button>
        )}
      </div>

      {/* Orders Table */}
      <div
        style={{
          background: "#fff",
          border: "1px solid #e5e7eb",
          borderRadius: 14,
          overflow: "hidden",
        }}
      >
        {/* Table Header (Desktop only) */}
        <div
          className="desktop-table-header"
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr 1.3fr 1fr 1.6fr 1fr 1fr 1fr 1.1fr",
            gap: 10,
            padding: "14px 16px",
            background: "#f9fafb",
            fontWeight: 800,
            color: "#374151",
            fontSize: 14,
          }}
        >
          <div>Customer</div>
          <div>Product</div>
          <div>Phone Number</div>
          <div>Amount</div>
          <div>Status</div>
          <div>Notes</div>
          <div>Delivery City</div>
          <div>Account Number</div>
          <div>Date</div>
          <div>Action</div>
        </div>

        {loading && <div style={{ padding: 16 }}>Loading orders...</div>}
        {error && !isAddOpen && !editingOrder && (
          <div style={{ padding: 16, color: "crimson" }}>{error}</div>
        )}

        {/* Rows */}
        {!loading &&
          orders.map((o, idx) => {
            const s = statusStyle(o.orderStatus);

            return (
              <React.Fragment key={o.id}>
                {/* Desktop row */}
                <div
                  className="desktop-row"
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr 1fr 1.3fr 1fr 1.6fr 1fr 1fr 1fr 1.1fr",
                    gap: 10,
                    padding: "14px 16px",
                    borderTop: idx === 0 ? "none" : "1px solid #f3f4f6",
                    alignItems: "center",
                    fontSize: 14,
                  }}
                >
                  <div style={{ color: "#374151" }}>
                    {String(o.customerName)}
                  </div>

                  <div style={{ color: "#374151" }}>
                    {String(o.productName)}
                  </div>

                  <div style={{ color: "#6b7280" }}>
                    {String(o.phoneNumber)}
                  </div>

                  <div>
                    <span
                      style={{
                        background: "#e5e7eb",
                        padding: "6px 10px",
                        borderRadius: 10,
                        fontWeight: 900,
                        display: "inline-block",
                        minWidth: 80,
                        textAlign: "center",
                      }}
                    >
                      {formatMoney(o.totalAmount)}
                    </span>
                  </div>

                  <div>
                    <span
                      style={{
                        background: s.bg,
                        color: s.color,
                        padding: "6px 10px",
                        borderRadius: 999,
                        fontWeight: 900,
                        fontSize: 12,
                      }}
                    >
                      {niceStatus(o.orderStatus)}
                    </span>
                  </div>

                  <div style={{ color: "#374151", fontSize: 13, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {previewText(o.deliveryNotes, 40)}
                  </div>

                  <div>{o.deliveryCity || "-"}</div>

                  <div>{o.accountNumber || "-"}</div>

                  <div style={{ fontWeight: 700 }}>
                    {formatDateTime(o.createdAt)}
                  </div>

                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <button onClick={() => openEditModal(o)} style={editBtn}>
                      ✏️ Edit
                    </button>
                    <button onClick={() => openNotesModal(o)} style={noteBtn}>
                      📝 Notes
                    </button>
                  </div>
                </div>

                {/* Mobile card */}
                <div className="mobile-card">
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                    <div>
                      <div style={{ fontWeight: 900, fontSize: 16 }}>
                        {String(o.customerName)}
                      </div>
                      <div style={{ color: "#6b7280", marginTop: 2 }}>
                        {String(o.productName)}
                      </div>
                    </div>

                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontWeight: 900 }}>{formatMoney(o.totalAmount)}</div>
                      <div style={{ marginTop: 6 }}>
                        <span
                          style={{
                            background: s.bg,
                            color: s.color,
                            padding: "6px 10px",
                            borderRadius: 999,
                            fontWeight: 900,
                            fontSize: 12,
                            display: "inline-block",
                          }}
                        >
                          {niceStatus(o.orderStatus)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div style={{ marginTop: 10, color: "#374151", fontSize: 13 }}>
                    📍 {o.deliveryCity || "No delivery city"}
                  </div>

                  <div style={{ color: "#6b7280" }}>
                    {String(o.accountNumber)}
                  </div>

                  <div style={{ marginTop: 6, color: "#374151", fontSize: 13 }}>
                    <strong>Notes:</strong> {previewText(o.deliveryNotes, 80)}
                  </div>

                  <div style={{ marginTop: 6, color: "#374151", fontSize: 13 }}>
                    📅 {formatDateTime(o.createdAt)}
                  </div>

                  <div className="actions-row" style={{ display: "flex", gap: 10, marginTop: 12, flexWrap: "wrap" }}>
                    <button onClick={() => openEditModal(o)} style={editBtn}>
                      ✏️ Edit
                    </button>
                    <button onClick={() => openNotesModal(o)} style={noteBtn}>
                      📝 Notes
                    </button>
                  </div>
                </div>
              </React.Fragment>
            );
          })}

        {!loading && orders.length === 0 && (
          <div style={{ padding: 16, color: "#6b7280" }}>No orders found.</div>
        )}

        {/* Footer pagination */}
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
              Showing {orders.length} of {pageData.totalElements} orders
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
      </div>

      {/* ADD ORDER MODAL */}
      {isAddOpen && (
        <div style={modalOverlay} onClick={closeAddModal}>
          <div style={modalBox} onClick={(e) => e.stopPropagation()}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 12,
              }}
            >
              <h3 style={{ margin: 0 }}>Create Order</h3>

              <button onClick={closeAddModal} style={xBtn}>
                ✖
              </button>
            </div>

            {/* Customer */}
            <div style={{ fontWeight: 900, marginBottom: 8 }}>Customer</div>
            <div
              className="responsive-grid-2"
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 12,
              }}
            >
              <input
                name="name"
                value={customerForm.name}
                onChange={handleCustomerChange}
                placeholder="Customer Name"
                style={inputStyle}
              />
              <input
                name="phone"
                value={customerForm.phone}
                onChange={handleCustomerChange}
                placeholder="Phone Number"
                style={inputStyle}
              />
              <input
                name="email"
                value={customerForm.email}
                onChange={handleCustomerChange}
                placeholder="Email (optional)"
                style={inputStyle}
              />
              <input
                name="city_town"
                value={customerForm.city_town}
                onChange={handleCustomerChange}
                placeholder="City / Town"
                style={inputStyle}
              />
            </div>

            <div style={{ marginBottom: 12, marginTop: 12 }}>
              <label style={{ fontWeight: 800, fontSize: 13, color: "#374151" }}>
                Order Type
              </label>

              <select
                value={orderForm.orderType}
                onChange={(e) =>
                  setOrderForm((f) => ({ ...f, orderType: e.target.value }))
                }
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: 10,
                  border: "1px solid #e5e7eb",
                  marginTop: 6,
                  outline: "none",
                  background: "#fff",
                  fontWeight: 700,
                }}
              >
                <option value="COUNTER">COUNTER (Walk-in)</option>
                <option value="ONLINE">ONLINE (Delivery)</option>
              </select>
            </div>

            {orderForm.orderType === "ONLINE" && (
              <>
                <div style={{ fontWeight: 900, marginTop: 14, marginBottom: 8 }}>
                  Delivery
                </div>

                <div
                  className="responsive-grid-2"
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 12,
                  }}
                >
                  <input
                    name="deliveryCity"
                    value={orderForm.deliveryCity}
                    onChange={handleOrderChange}
                    placeholder="Delivery City"
                    style={inputStyle}
                  />
                  <input
                    name="deliveryNotes"
                    value={orderForm.deliveryNotes}
                    onChange={handleOrderChange}
                    placeholder="Delivery Notes"
                    style={inputStyle}
                  />
                </div>
              </>
            )}

            {/* Items */}
            <div style={{ fontWeight: 900, marginTop: 14, marginBottom: 8 }}>
              Items
            </div>

            <div
              className="responsive-grid-3"
              style={{
                display: "grid",
                gridTemplateColumns: "2fr 1fr 1fr",
                gap: 12,
                alignItems: "center",
              }}
            >
              <select
                name="productId"
                value={itemForm.productId}
                onChange={handleItemChange}
                style={inputStyle}
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.sku})
                  </option>
                ))}
              </select>

              <input
                name="quantity"
                value={itemForm.quantity}
                onChange={handleItemChange}
                placeholder="Qty"
                type="number"
                style={inputStyle}
              />

              <button onClick={addItemToCart} style={addItemBtn}>
                + Add
              </button>
            </div>

            {/* Cart */}
            {cartItems.length > 0 && (
              <div style={{ marginTop: 12 }}>
                {cartItems.map((i) => (
                  <div
                    key={i.productId}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "10px 12px",
                      border: "1px solid #e5e7eb",
                      borderRadius: 12,
                      marginBottom: 8,
                      background: "#f9fafb",
                      gap: 10,
                    }}
                  >
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 900, wordBreak: "break-word" }}>
                        {i.productName}
                      </div>
                      <div style={{ color: "#6b7280", fontSize: 13 }}>
                        {i.quantity} × {formatMoney(i.sellingPrice)}
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                      <div style={{ fontWeight: 900 }}>
                        {formatMoney(Number(i.sellingPrice) * Number(i.quantity))}
                      </div>

                      <button onClick={() => removeCartItem(i.productId)} style={removeBtn}>
                        ✖
                      </button>
                    </div>
                  </div>
                ))}

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginTop: 10,
                    fontWeight: 900,
                  }}
                >
                  <div>Total</div>
                  <div>{formatMoney(cartTotal)}</div>
                </div>
              </div>
            )}

            {/* Footer */}
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 16 }}>
              <button onClick={handleCreateOrder} style={createBtn}>
                {loading ? "Saving..." : "Create Order"}
              </button>
            </div>

            {error && (
              <div style={{ marginTop: 10, color: "crimson", fontWeight: 700 }}>
                {error}
              </div>
            )}
          </div>
        </div>
      )}

      {/* EDIT STATUS MODAL */}
      {editingOrder && (
        <div style={modalOverlay} onClick={closeEditModal}>
          <div style={modalBoxSmall} onClick={(e) => e.stopPropagation()}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 12,
              }}
            >
              <h3 style={{ margin: 0 }}>Edit Order Status</h3>

              <button onClick={closeEditModal} style={xBtn}>
                ✖
              </button>
            </div>

            <div style={{ marginBottom: 10, color: "#6b7280" }}>
              Order: <b>{String(editingOrder.id).slice(0, 8).toUpperCase()}</b>
            </div>

            <select
              value={editStatus}
              onChange={(e) => setEditStatus(e.target.value)}
              style={inputStyle}
            >
              {ORDER_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {niceStatus(s)}
                </option>
              ))}
            </select>

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: 10,
                marginTop: 16,
              }}
            >
              <button onClick={closeEditModal} style={cancelBtn}>
                Cancel
              </button>

              <button onClick={handleUpdateStatus} style={saveBtn}>
                {loading ? "Saving..." : "Update"}
              </button>
            </div>

            {error && (
              <div style={{ marginTop: 10, color: "crimson", fontWeight: 700 }}>
                {error}
              </div>
            )}
          </div>
        </div>
      )}

      {selectedOrder && (
        <div style={modalOverlay} onClick={closeNotesModal}>
          <div style={modalBoxSmall} onClick={(e) => e.stopPropagation()}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 12,
              }}
            >
              <h3 style={{ margin: 0 }}>Delivery Notes</h3>
              <button onClick={closeNotesModal} style={xBtn}>
                ✖
              </button>
            </div>

            <div style={{ marginBottom: 10, color: "#6b7280" }}>
              Order: <b>{String(selectedOrder.id).slice(0, 8).toUpperCase()}</b>
            </div>

            <textarea
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="Enter delivery notes, customer comments, or pickup instructions"
              style={{
                width: "100%",
                minHeight: 140,
                borderRadius: 12,
                border: "1px solid #e5e7eb",
                padding: 12,
                fontFamily: "inherit",
                resize: "vertical",
              }}
            />

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: 10,
                marginTop: 16,
              }}
            >
              <button onClick={closeNotesModal} style={cancelBtn}>
                Cancel
              </button>

              <button onClick={handleUpdateNotes} style={saveBtn}>
                {loading ? "Saving..." : "Save Notes"}
              </button>
            </div>

            {noteError && (
              <div style={{ marginTop: 10, color: "crimson", fontWeight: 700 }}>
                {noteError}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const formatDateTime = (dateString) => {
  if (!dateString) return "-";

  const date = new Date(dateString);

  return `${date.toLocaleDateString("en-CA")} ${date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })}`;
};

/* --------------------------
   Styles (same theme)
-------------------------- */

const inputStyle = {
  border: "1px solid #e5e7eb",
  borderRadius: 12,
  padding: "12px 12px",
  outline: "none",
  fontFamily: "inherit",
  width: "100%",
};

const addOrderBtn = {
  border: "none",
  background: "#111827",
  color: "#fff",
  padding: "10px 14px",
  borderRadius: 12,
  cursor: "pointer",
  fontWeight: 900,
};

const editBtn = {
  border: "1px solid #e5e7eb",
  background: "#f9fafb",
  padding: "8px 10px",
  borderRadius: 10,
  cursor: "pointer",
  fontWeight: 900,
  fontSize: 12,
};

const addItemBtn = {
  border: "none",
  background: "#1e40af",
  color: "#fff",
  padding: "12px 12px",
  borderRadius: 12,
  cursor: "pointer",
  fontWeight: 900,
};

const createBtn = {
  border: "none",
  background: "#1e40af",
  color: "#fff",
  padding: "12px 16px",
  borderRadius: 12,
  cursor: "pointer",
  fontWeight: 900,
};

const removeBtn = {
  border: "none",
  background: "#fee2e2",
  color: "#991b1b",
  padding: "8px 10px",
  borderRadius: 10,
  cursor: "pointer",
  fontWeight: 900,
};

const pageBtnStyle = {
  border: "1px solid #e5e7eb",
  background: "#fff",
  borderRadius: 10,
  padding: "6px 10px",
  cursor: "pointer",
};

const modalOverlay = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.35)",
  display: "grid",
  placeItems: "center",
  zIndex: 999,
  padding: 14,
};

const modalBox = {
  width: "760px",
  maxWidth: "98vw",
  background: "#fff",
  borderRadius: 16,
  padding: 18,
  border: "1px solid #e5e7eb",
  maxHeight: "90vh",
  overflowY: "auto",
};

const modalBoxSmall = {
  width: "520px",
  maxWidth: "95vw",
  background: "#fff",
  borderRadius: 16,
  padding: 18,
  border: "1px solid #e5e7eb",
};

const xBtn = {
  border: "1px solid #e5e7eb",
  background: "#fff",
  borderRadius: 10,
  padding: "6px 10px",
  cursor: "pointer",
  fontWeight: 900,
};

const cancelBtn = {
  border: "1px solid #e5e7eb",
  background: "#fff",
  padding: "10px 14px",
  borderRadius: 12,
  cursor: "pointer",
  fontWeight: 900,
};

const saveBtn = {
  border: "none",
  background: "#1e40af",
  color: "#fff",
  padding: "10px 14px",
  borderRadius: 12,
  cursor: "pointer",
  fontWeight: 900,
};

const noteBtn = {
  border: "1px solid #e5e7eb",
  background: "#fff",
  padding: "8px 10px",
  borderRadius: 10,
  cursor: "pointer",
  fontWeight: 900,
  fontSize: 12,
};