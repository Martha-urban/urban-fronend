import React, { useEffect, useMemo, useState } from "react";
import { api } from "../api/api"; // adjust path if needed

export default function Categories() {
  const [search, setSearch] = useState("");

  // Backend state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Pageable
  const [page, setPage] = useState(0);
  const size = 10;
  const [pageData, setPageData] = useState(null);

  // Categories list
  const [categories, setCategories] = useState([]);

  // Modal states
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);

  // Add category form
  const [form, setForm] = useState({
    name: "",
    description: "",
  });

  // Load categories on mount + page change
  useEffect(() => {
    loadCategories();
    // eslint-disable-next-line
  }, [page]);

  async function loadCategories() {
    try {
      setLoading(true);
      setError("");

      const res = await api.get("/api/v1/category", {
        params: {
          page,
          size,
          sort: "createdAt,desc",
        },
      });

      setPageData(res.data);
      setCategories(res.data.content || []);
    } catch (e) {
      console.log(e);
      setError("Failed to load categories. Check backend, token, and CORS.");
    } finally {
      setLoading(false);
    }
  }

  const filtered = useMemo(() => {
    return categories.filter((c) => {
      const q = search.toLowerCase();
      return (
        (c.name || "").toLowerCase().includes(q) ||
        (c.description || "").toLowerCase().includes(q)
      );
    });
  }, [categories, search]);

  function openAddModal() {
    setForm({ name: "", description: "" });
    setIsAddOpen(true);
  }

  function closeAddModal() {
    setIsAddOpen(false);
  }

  function handleFormChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleAddCategory() {
    if (!form.name.trim()) {
      alert("Category name is required.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      await api.post("/api/v1/category", {
        name: form.name,
        description: form.description,
      });

      closeAddModal();
      setPage(0);
      await loadCategories();
    } catch (e) {
      console.log(e);
      alert("Failed to add category. Check console.");
    } finally {
      setLoading(false);
    }
  }

  function openEditModal(cat) {
    setEditingCategory({ ...cat });
  }

  function closeEditModal() {
    setEditingCategory(null);
  }

  function handleEditChange(e) {
    setEditingCategory({ ...editingCategory, [e.target.name]: e.target.value });
  }

  async function handleSaveEdit() {
    if (!editingCategory.name.trim()) {
      alert("Category name is required.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      await api.put(`/api/v1/category/${editingCategory.id}`, {
        name: editingCategory.name,
        description: editingCategory.description,
      });

      closeEditModal();
      await loadCategories();
    } catch (e) {
      console.log(e);
      alert("Failed to update category. Check console.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteCategory(id) {
    const ok = window.confirm("Are you sure you want to delete this category?");
    if (!ok) return;

    try {
      setLoading(true);
      setError("");

      await api.delete(`/api/v1/category/${id}`);
      await loadCategories();
    } catch (e) {
      console.log(e);
      alert("Failed to delete category. Check console.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: 18 }}>
      {/* Header */}
      <div style={{ marginBottom: 14 }}>
        <h2 style={{ margin: 0, fontSize: 22 }}>Categories</h2>
        <p style={{ margin: "6px 0 0", color: "#6b7280" }}>
          Create and manage product categories
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
            placeholder="Search categories..."
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
          + Add Category
        </button>
      </div>

      {/* Loading/Error */}
      {loading && <div style={{ marginBottom: 10 }}>Loading...</div>}
      {error && (
        <div style={{ marginBottom: 10, color: "crimson" }}>{error}</div>
      )}

      {/* Categories table */}
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
            gridTemplateColumns: "1.2fr 2fr 1fr",
            gap: 10,
            padding: "14px 16px",
            background: "#f9fafb",
            fontWeight: 900,
            color: "#374151",
            fontSize: 13,
          }}
        >
          <div>Name</div>
          <div>Description</div>
          <div>Actions</div>
        </div>

        {/* Rows */}
        {filtered.map((c, idx) => (
          <div
            key={c.id}
            style={{
              display: "grid",
              gridTemplateColumns: "1.2fr 2fr 1fr",
              gap: 10,
              padding: "14px 16px",
              borderTop: idx === 0 ? "none" : "1px solid #f3f4f6",
              alignItems: "center",
              fontSize: 14,
            }}
          >
            <div style={{ fontWeight: 900 }}>{c.name}</div>
            <div style={{ color: "#374151" }}>{c.description || "-"}</div>

            <div style={{ display: "flex", gap: 8, whiteSpace: "nowrap" }}>
              <button onClick={() => openEditModal(c)} style={actionBtn}>
                ✏️ Edit
              </button>

              <button
                onClick={() => handleDeleteCategory(c.id)}
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
            No categories found.
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
              Showing {filtered.length} of {pageData.totalElements} categories
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
            <h3 style={{ marginTop: 0 }}>Add Category</h3>

            <div style={{ display: "grid", gap: 12 }}>
              <input
                name="name"
                value={form.name}
                onChange={handleFormChange}
                placeholder="Category Name"
                style={inputStyle}
              />

              <textarea
                name="description"
                value={form.description}
                onChange={handleFormChange}
                placeholder="Description"
                rows={4}
                style={{ ...inputStyle, resize: "none" }}
              />
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

              <button onClick={handleAddCategory} style={saveBtn}>
                Add Category
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {editingCategory && (
        <div style={modalOverlay}>
          <div style={modalBox}>
            <h3 style={{ marginTop: 0 }}>Edit Category</h3>

            <div style={{ display: "grid", gap: 12 }}>
              <input
                name="name"
                value={editingCategory.name}
                onChange={handleEditChange}
                placeholder="Category Name"
                style={inputStyle}
              />

              <textarea
                name="description"
                value={editingCategory.description || ""}
                onChange={handleEditChange}
                placeholder="Description"
                rows={4}
                style={{ ...inputStyle, resize: "none" }}
              />
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
