import React, { useEffect, useMemo, useState } from "react";
import { api } from "../api/api"; // adjust if needed

export default function Products() {
  const [search, setSearch] = useState("");

  // Backend state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Pageable
  const [page, setPage] = useState(0);
  const size = 10;
  const [pageData, setPageData] = useState(null);

  // Products list
  const [products, setProducts] = useState([]);

  // Categories (for dropdown)
  const [categories, setCategories] = useState([]);

  // Modal states
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  // Add form
  const [form, setForm] = useState({
    name: "",
    sku: "",
    sellingPrice: "",
    costPrice: "",
    categoryId: "",
  });

  // Load products on mount + page change
  useEffect(() => {
    loadProducts();
    // eslint-disable-next-line
  }, [page]);

  // Load categories once (for select dropdown)
  useEffect(() => {
    loadCategories();
  }, []);

  async function loadProducts() {
    try {
      setLoading(true);
      setError("");

      const res = await api.get("/api/v1/products", {
        params: {
          page,
          size,
          sort: "createdAt,desc",
        },
      });

      setPageData(res.data);
      setProducts(res.data.content || []);
    } catch (e) {
      console.log(e);
      setError("Failed to load products. Check backend, token, and CORS.");
    } finally {
      setLoading(false);
    }
  }

  async function loadCategories() {
    try {
      const res = await api.get("/api/v1/category", {
        params: {
          page: 0,
          size: 200,
          sort: "name,asc",
        },
      });

      setCategories(res.data.content || []);
    } catch (e) {
      console.log(e);
    }
  }

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const q = search.toLowerCase();

      const categoryName =
        p.category?.name ||
        categories.find((c) => c.id === p.categoryId)?.name ||
        "";

      return (
        (p.name || "").toLowerCase().includes(q) ||
        (p.sku || "").toLowerCase().includes(q) ||
        String(p.sellingPrice || "").toLowerCase().includes(q) ||
        String(p.costPrice || "").toLowerCase().includes(q) ||
        categoryName.toLowerCase().includes(q)
      );
    });
  }, [products, search, categories]);

  function openAddModal() {
    setForm({
      name: "",
      sku: "",
      sellingPrice: "",
      costPrice: "",
      categoryId: "",
    });
    setIsAddOpen(true);
  }

  function closeAddModal() {
    setIsAddOpen(false);
  }

  function handleFormChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function openEditModal(product) {
    setEditingProduct({
      ...product,
      categoryId: product.category?.id || product.categoryId || "",
      sellingPrice: product.sellingPrice ?? "",
      costPrice: product.costPrice ?? "",
    });
  }

  function closeEditModal() {
    setEditingProduct(null);
  }

  function handleEditChange(e) {
    setEditingProduct({ ...editingProduct, [e.target.name]: e.target.value });
  }

  function money(v) {
    if (v === null || v === undefined || v === "") return "-";
    return `KES ${Number(v).toLocaleString()}`;
  }

  function getCategoryName(product) {
    if (product?.category?.name) return product.category.name;

    const id = product.categoryId || product.category?.id;
    const found = categories.find((c) => c.id === id);
    return found?.name || "-";
  }

  async function handleAddProduct() {
    if (!form.name.trim() || !form.sku.trim()) {
      alert("Please fill product name and SKU.");
      return;
    }

    if (!form.categoryId) {
      alert("Please select a category.");
      return;
    }

    if (!form.sellingPrice || !form.costPrice) {
      alert("Please fill selling price and cost price.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      await api.post("/api/v1/products", {
        name: form.name,
        sku: form.sku,
        sellingPrice: Number(form.sellingPrice),
        costPrice: Number(form.costPrice),
        categoryId: form.categoryId,
      });

      closeAddModal();
      setPage(0);
      await loadProducts();
    } catch (e) {
      console.log(e);
      alert("Failed to add product. Check console.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveEdit() {
    if (!editingProduct.name.trim() || !editingProduct.sku.trim()) {
      alert("Please fill product name and SKU.");
      return;
    }

    if (!editingProduct.categoryId) {
      alert("Please select a category.");
      return;
    }

    if (!editingProduct.sellingPrice || !editingProduct.costPrice) {
      alert("Please fill selling price and cost price.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      await api.put(`/api/v1/products/${editingProduct.id}`, {
        name: editingProduct.name,
        sku: editingProduct.sku,
        sellingPrice: Number(editingProduct.sellingPrice),
        costPrice: Number(editingProduct.costPrice),
        categoryId: editingProduct.categoryId,
      });

      closeEditModal();
      await loadProducts();
    } catch (e) {
      console.log(e);
      alert("Failed to update product. Check console.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteProduct(id) {
    const ok = window.confirm("Are you sure you want to delete this product?");
    if (!ok) return;

    try {
      setLoading(true);
      setError("");

      await api.delete(`/api/v1/products/${id}`);
      await loadProducts();
    } catch (e) {
      console.log(e);
      alert("Failed to delete product. Check console.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: 18 }}>
      {/* Header */}
      <div style={{ marginBottom: 14 }}>
        <h2 style={{ margin: 0, fontSize: 22 }}>Products</h2>
        <p style={{ margin: "6px 0 0", color: "#6b7280" }}>
          Add and manage products in your shop
        </p>
      </div>

      {/* Toolbar */}
      <div
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
            placeholder="Search products..."
            style={{
              border: "none",
              outline: "none",
              background: "transparent",
              width: "100%",
            }}
          />
        </div>

        {/* Add button */}
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
          + Add Product
        </button>
      </div>

      {/* Loading/Error */}
      {loading && <div style={{ marginBottom: 10 }}>Loading...</div>}
      {error && (
        <div style={{ marginBottom: 10, color: "crimson" }}>{error}</div>
      )}

      {/* Products table */}
      <div
        style={{
          background: "#fff",
          border: "1px solid #e5e7eb",
          borderRadius: 14,
          overflow: "hidden",
        }}
      >
        {/* Table headings */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.6fr 1.2fr 1.2fr 1.2fr 1.3fr 1fr",
            gap: 10,
            padding: "14px 16px",
            background: "#f9fafb",
            fontWeight: 900,
            color: "#374151",
            fontSize: 13,
          }}
        >
          <div>Name</div>
          <div>SKU</div>
          <div>Selling</div>
          <div>Cost</div>
          <div>Category</div>
          <div>Actions</div>
        </div>

        {/* Rows */}
        {filtered.map((p, idx) => (
          <div
            key={p.id}
            style={{
              display: "grid",
              gridTemplateColumns: "1.6fr 1.2fr 1.2fr 1.2fr 1.3fr 1fr",
              gap: 10,
              padding: "14px 16px",
              borderTop: idx === 0 ? "none" : "1px solid #f3f4f6",
              alignItems: "center",
              fontSize: 14,
            }}
          >
            <div style={{ fontWeight: 900 }}>{p.name}</div>
            <div style={{ fontWeight: 700 }}>{p.sku}</div>
            <div style={{ fontWeight: 800 }}>{money(p.sellingPrice)}</div>
            <div style={{ fontWeight: 800 }}>{money(p.costPrice)}</div>
            <div style={{ fontWeight: 700 }}>{getCategoryName(p)}</div>

            <div style={{ display: "flex", gap: 8, whiteSpace: "nowrap" }}>
              <button onClick={() => openEditModal(p)} style={actionBtn}>
                ✏️ Edit
              </button>

              <button
                onClick={() => handleDeleteProduct(p.id)}
                style={{
                  ...actionBtn,
                  background: "#fee2e2",
                  color: "#991b1b",
                }}
              >
                🗑 Delete
              </button>
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div style={{ padding: 16, color: "#6b7280" }}>
            No products found.
          </div>
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
              Showing {filtered.length} of {pageData.totalElements} products
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

      {/* ADD MODAL */}
      {isAddOpen && (
        <div style={modalOverlay}>
          <div style={modalBox}>
            <h3 style={{ marginTop: 0 }}>Add Product</h3>

            <div style={{ display: "grid", gap: 12 }}>
              <input
                name="name"
                value={form.name}
                onChange={handleFormChange}
                placeholder="Product Name"
                style={inputStyle}
              />

              <input
                name="sku"
                value={form.sku}
                onChange={handleFormChange}
                placeholder="SKU"
                style={inputStyle}
              />

              <input
                name="sellingPrice"
                value={form.sellingPrice}
                onChange={handleFormChange}
                placeholder="Selling Price"
                type="number"
                style={inputStyle}
              />

              <input
                name="costPrice"
                value={form.costPrice}
                onChange={handleFormChange}
                placeholder="Cost Price"
                type="number"
                style={inputStyle}
              />

              <select
                name="categoryId"
                value={form.categoryId}
                onChange={handleFormChange}
                style={inputStyle}
              >
                <option value="">Select Category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: 10,
                marginTop: 16,
              }}
            >
              <button onClick={closeAddModal} style={cancelBtn}>
                Cancel
              </button>

              <button onClick={handleAddProduct} style={saveBtn}>
                Add Product
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {editingProduct && (
        <div style={modalOverlay}>
          <div style={modalBox}>
            <h3 style={{ marginTop: 0 }}>Edit Product</h3>

            <div style={{ display: "grid", gap: 12 }}>
              <input
                name="name"
                value={editingProduct.name}
                onChange={handleEditChange}
                placeholder="Product Name"
                style={inputStyle}
              />

              <input
                name="sku"
                value={editingProduct.sku}
                onChange={handleEditChange}
                placeholder="SKU"
                style={inputStyle}
              />

              <input
                name="sellingPrice"
                value={editingProduct.sellingPrice}
                onChange={handleEditChange}
                placeholder="Selling Price"
                type="number"
                style={inputStyle}
              />

              <input
                name="costPrice"
                value={editingProduct.costPrice}
                onChange={handleEditChange}
                placeholder="Cost Price"
                type="number"
                style={inputStyle}
              />

              <select
                name="categoryId"
                value={editingProduct.categoryId}
                onChange={handleEditChange}
                style={inputStyle}
              >
                <option value="">Select Category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

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

              <button onClick={handleSaveEdit} style={saveBtn}>
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const inputStyle = {
  border: "1px solid #e5e7eb",
  borderRadius: 12,
  padding: "12px 12px",
  outline: "none",
  fontFamily: "inherit",
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

const pageBtnStyle = {
  border: "1px solid #e5e7eb",
  background: "#fff",
  borderRadius: 10,
  padding: "6px 10px",
  cursor: "pointer",
};
