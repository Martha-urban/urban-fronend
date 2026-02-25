import React, { useEffect, useMemo, useState } from "react";
import { api } from "../api/api"; // adjust path if needed

export default function Inventory() {
  const [activeTab, setActiveTab] = useState("All Inventory");
  const [search, setSearch] = useState("");

  // Backend state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Products
  const [products, setProducts] = useState([]);

  // Inventory map: productId -> inventory
  const [inventoryMap, setInventoryMap] = useState({});

  // Low stock list (normalized to products shape)
  const [lowStock, setLowStock] = useState([]);

  // Modal states
  const [restockProduct, setRestockProduct] = useState(null);
  const [reduceProduct, setReduceProduct] = useState(null);

  // Forms
  const [restockForm, setRestockForm] = useState({
    quantity: "",
    reorderLevel: "",
  });

  const [reduceForm, setReduceForm] = useState({
    quantity: "",
  });

  const tabs = ["All Inventory", "Low Stock"];

  useEffect(() => {
    loadProducts();
    loadLowStock();
  }, []);

  async function loadProducts() {
    try {
      setLoading(true);
      setError("");

      const res = await api.get("/api/v1/products", {
        params: { page: 0, size: 200, sort: "createdAt,desc" },
      });

      const list = res.data.content || [];
      setProducts(list);

      await loadInventoryForProducts(list);
    } catch (e) {
      console.log(e);
      setError("Failed to load products/inventory.");
    } finally {
      setLoading(false);
    }
  }

  async function loadInventoryForProducts(productList) {
    try {
      const results = await Promise.all(
        productList.map(async (p) => {
          try {
            const invRes = await api.get(`/api/v1/inventory/${p.id}`);
            return { productId: p.id, inventory: invRes.data };
          } catch (e) {
            return { productId: p.id, inventory: null };
          }
        })
      );

      const map = {};
      results.forEach((r) => {
        map[r.productId] = r.inventory;
      });

      setInventoryMap(map);
    } catch (e) {
      console.log(e);
    }
  }

  async function loadLowStock() {
    try {
      const res = await api.get("/api/v1/inventory/low-stock");
      const data = res.data || [];

      const normalized = data
        .map((x) => {
          if (x.id && x.name && x.sku) return x;

          return {
            id: x.productId || x.product?.id || x.id,
            name: x.productName || x.product?.name || x.name,
            sku: x.sku || x.product?.sku || "",
          };
        })
        .filter((x) => x.id);

      setLowStock(normalized);
    } catch (e) {
      console.log(e);
    }
  }

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const q = search.toLowerCase();
      return (
        (p.name || "").toLowerCase().includes(q) ||
        (p.sku || "").toLowerCase().includes(q)
      );
    });
  }, [products, search]);

  function getStock(productId) {
    const inv = inventoryMap[productId];
    if (!inv) return "-";

    if (inv.quantity !== undefined) return inv.quantity;
    if (inv.stock !== undefined) return inv.stock;
    if (inv.available !== undefined) return inv.available;

    return "-";
  }

  function openRestockModal(product) {
    setRestockProduct(product);
    setRestockForm({ quantity: "", reorderLevel: "" });
  }

  function closeRestockModal() {
    setRestockProduct(null);
  }

  function openReduceModal(product) {
    setReduceProduct(product);
    setReduceForm({ quantity: "" });
  }

  function closeReduceModal() {
    setReduceProduct(null);
  }

  async function handleRestock() {
    if (!restockForm.quantity || Number(restockForm.quantity) <= 0) {
      alert("Enter a valid restock quantity.");
      return;
    }

    if (
      restockForm.reorderLevel === "" ||
      Number(restockForm.reorderLevel) < 0
    ) {
      alert("Enter a valid reorder level (0 or above).");
      return;
    }

    try {
      setLoading(true);
      setError("");

      await api.post("/api/v1/inventory/restock", {
        productId: restockProduct.id,
        quantity: Number(restockForm.quantity),
        reorderLevel: Number(restockForm.reorderLevel),
      });

      closeRestockModal();
      await loadProducts();
      await loadLowStock();
    } catch (e) {
      console.log(e);
      alert("Restock failed.");
    } finally {
      setLoading(false);
    }
  }

  async function handleReduce() {
    if (!reduceForm.quantity || Number(reduceForm.quantity) <= 0) {
      alert("Enter a valid reduce quantity.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      await api.post("/api/v1/inventory/reduce", {
        productId: reduceProduct.id,
        quantity: Number(reduceForm.quantity),
      });

      closeReduceModal();
      await loadProducts();
      await loadLowStock();
    } catch (e) {
      console.log(e);
      alert("Reduce failed.");
    } finally {
      setLoading(false);
    }
  }

  function stockBadge(stock) {
    const qty = Number(stock);
    if (isNaN(qty)) return { bg: "#f3f4f6", color: "#374151" };

    if (qty <= 5) return { bg: "#fee2e2", color: "#991b1b" };
    if (qty <= 15) return { bg: "#ffedd5", color: "#b45309" };

    return { bg: "#dcfce7", color: "#166534" };
  }

  const tableData = activeTab === "Low Stock" ? lowStock : filteredProducts;

  return (
    <div style={{ padding: 18 }}>
      {/* ✅ RESPONSIVE CSS */}
      <style>{`
        @media (max-width: 768px) {
          .inv-toolbar {
            flex-direction: column !important;
            align-items: stretch !important;
            gap: 12px !important;
          }

          .inv-search {
            min-width: 100% !important;
            width: 100% !important;
          }

          .inv-tabs {
            width: 100%;
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
          }

          .inv-desktop-header,
          .inv-desktop-row {
            display: none !important;
          }

          .inv-mobile-card {
            display: block;
            padding: 14px;
            border-top: 1px solid #f3f4f6;
            background: #fff;
          }

          .inv-actions {
            flex-wrap: wrap;
            white-space: normal !important;
          }
        }

        @media (min-width: 769px) {
          .inv-mobile-card {
            display: none;
          }
        }
      `}</style>

      {/* Header */}
      <div style={{ marginBottom: 14 }}>
        <h2 style={{ margin: 0, fontSize: 22 }}>Inventory</h2>
        <p style={{ margin: "6px 0 0", color: "#6b7280" }}>
          Track stock, restock, and reduce inventory
        </p>
      </div>

      {/* Tabs + Search */}
      <div
        className="inv-toolbar"
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
        <div className="inv-tabs">
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
        </div>

        <div style={{ flex: 1 }} />

        <div
          className="inv-search"
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
            placeholder="Search product..."
            style={{
              border: "none",
              outline: "none",
              background: "transparent",
              width: "100%",
            }}
          />
        </div>
      </div>

      {/* Loading/Error */}
      {loading && <div style={{ marginBottom: 10 }}>Loading...</div>}
      {error && (
        <div style={{ marginBottom: 10, color: "crimson" }}>{error}</div>
      )}

      {/* TABLE */}
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
          className="inv-desktop-header"
          style={{
            display: "grid",
            gridTemplateColumns: "1.6fr 1fr 1fr 1fr",
            gap: 10,
            padding: "14px 16px",
            background: "#f9fafb",
            fontWeight: 900,
            color: "#374151",
            fontSize: 13,
          }}
        >
          <div>Product</div>
          <div>SKU</div>
          <div>Stock</div>
          <div>Actions</div>
        </div>

        {/* Rows */}
        {tableData.map((p, idx) => {
          const stock = getStock(p.id);
          const badge = stockBadge(stock);

          return (
            <React.Fragment key={p.id}>
              {/* Desktop Row */}
              <div
                className="inv-desktop-row"
                style={{
                  display: "grid",
                  gridTemplateColumns: "1.6fr 1fr 1fr 1fr",
                  gap: 10,
                  padding: "14px 16px",
                  borderTop: idx === 0 ? "none" : "1px solid #f3f4f6",
                  alignItems: "center",
                  fontSize: 14,
                }}
              >
                <div style={{ fontWeight: 900 }}>{p.name}</div>
                <div style={{ fontWeight: 700 }}>{p.sku}</div>

                <div>
                  <span
                    style={{
                      background: badge.bg,
                      color: badge.color,
                      padding: "6px 10px",
                      borderRadius: 999,
                      fontWeight: 900,
                      fontSize: 13,
                    }}
                  >
                    {stock}
                  </span>
                </div>

                <div className="inv-actions" style={{ display: "flex", gap: 8, whiteSpace: "nowrap" }}>
                  <button onClick={() => openRestockModal(p)} style={actionBtn}>
                    ➕ Restock
                  </button>

                  <button
                    onClick={() => openReduceModal(p)}
                    style={{
                      ...actionBtn,
                      background: "#fff7ed",
                      color: "#9a3412",
                    }}
                  >
                    ➖ Reduce
                  </button>
                </div>
              </div>

              {/* Mobile Card */}
              <div className="inv-mobile-card">
                <div style={{ fontWeight: 900, fontSize: 16 }}>{p.name}</div>
                <div style={{ marginTop: 6, color: "#6b7280" }}>
                  SKU: <b style={{ color: "#374151" }}>{p.sku || "-"}</b>
                </div>

                <div style={{ marginTop: 10 }}>
                  <span
                    style={{
                      background: badge.bg,
                      color: badge.color,
                      padding: "6px 10px",
                      borderRadius: 999,
                      fontWeight: 900,
                      fontSize: 13,
                      display: "inline-block",
                    }}
                  >
                    Stock: {stock}
                  </span>
                </div>

                <div className="inv-actions" style={{ display: "flex", gap: 8, marginTop: 12 }}>
                  <button onClick={() => openRestockModal(p)} style={actionBtn}>
                    ➕ Restock
                  </button>

                  <button
                    onClick={() => openReduceModal(p)}
                    style={{
                      ...actionBtn,
                      background: "#fff7ed",
                      color: "#9a3412",
                    }}
                  >
                    ➖ Reduce
                  </button>
                </div>
              </div>
            </React.Fragment>
          );
        })}

        {tableData.length === 0 && (
          <div style={{ padding: 16, color: "#6b7280" }}>
            No inventory found.
          </div>
        )}
      </div>

      {/* RESTOCK MODAL */}
      {restockProduct && (
        <div style={modalOverlay}>
          <div style={modalBox}>
            <h3 style={{ marginTop: 0 }}>Restock</h3>

            <p style={{ marginTop: 0, color: "#6b7280" }}>
              Product: <b>{restockProduct.name}</b>
            </p>

            <input
              value={restockForm.quantity}
              onChange={(e) =>
                setRestockForm({ ...restockForm, quantity: e.target.value })
              }
              placeholder="Quantity"
              type="number"
              style={inputStyle}
            />

            <input
              value={restockForm.reorderLevel}
              onChange={(e) =>
                setRestockForm({
                  ...restockForm,
                  reorderLevel: e.target.value,
                })
              }
              placeholder="Reorder Level"
              type="number"
              style={{ ...inputStyle, marginTop: 12 }}
            />

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 16 }}>
              <button onClick={closeRestockModal} style={cancelBtn}>
                Cancel
              </button>

              <button onClick={handleRestock} style={saveBtn}>
                Restock
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REDUCE MODAL */}
      {reduceProduct && (
        <div style={modalOverlay}>
          <div style={modalBox}>
            <h3 style={{ marginTop: 0 }}>Reduce Stock</h3>

            <p style={{ marginTop: 0, color: "#6b7280" }}>
              Product: <b>{reduceProduct.name}</b>
            </p>

            <input
              value={reduceForm.quantity}
              onChange={(e) => setReduceForm({ quantity: e.target.value })}
              placeholder="Quantity"
              type="number"
              style={inputStyle}
            />

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 16 }}>
              <button onClick={closeReduceModal} style={cancelBtn}>
                Cancel
              </button>

              <button onClick={handleReduce} style={saveBtn}>
                Reduce
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

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

const actionBtn = {
  border: "1px solid #e5e7eb",
  background: "#f9fafb",
  padding: "6px 8px",
  borderRadius: 8,
  cursor: "pointer",
  fontWeight: 800,
  fontSize: 12,
  lineHeight: 1,
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
  border: "1px solid #e5e7eb",
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