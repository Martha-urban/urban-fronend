import React, { useEffect, useMemo, useState } from "react";
import { api } from "../api/api";

export default function Categories() {
  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [page, setPage] = useState(0);
  const size = 10;
  const [pageData, setPageData] = useState(null);

  const [categories, setCategories] = useState([]);

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);

  const [form, setForm] = useState({
    name: "",
    description: "",
  });

  useEffect(() => {
    loadCategories();
  }, [page]);

  async function loadCategories() {
    try {
      setLoading(true);
      setError("");

      const res = await api.get("/api/v1/category", {
        params: { page, size, sort: "createdAt,desc" },
      });

      setPageData(res.data);
      setCategories(res.data.content || []);
    } catch (e) {
      setError("Failed to load categories.");
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
      await api.post("/api/v1/category", form);
      closeAddModal();
      setPage(0);
      await loadCategories();
    } catch {
      alert("Failed to add category.");
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
    setEditingCategory({
      ...editingCategory,
      [e.target.name]: e.target.value,
    });
  }

  async function handleSaveEdit() {
    if (!editingCategory.name.trim()) {
      alert("Category name is required.");
      return;
    }

    try {
      setLoading(true);
      await api.put(
        `/api/v1/category/${editingCategory.id}`,
        editingCategory
      );
      closeEditModal();
      await loadCategories();
    } catch {
      alert("Failed to update category.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteCategory(id) {
    if (!window.confirm("Delete this category?")) return;

    try {
      setLoading(true);
      await api.delete(`/api/v1/category/${id}`);
      await loadCategories();
    } catch {
      alert("Failed to delete category.");
    } finally {
      setLoading(false);
    }
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
        <h2 style={{ margin: 0, fontSize: 22 }}>Categories</h2>
        <p style={{ margin: "6px 0 0", color: "#6b7280" }}>
          Create and manage product categories
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
            placeholder="Search categories..."
            style={{
              border: "none",
              outline: "none",
              background: "transparent",
              width: "100%",
            }}
          />
        </div>

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
            gridTemplateColumns: "1.2fr 2fr 1fr",
            gap: 10,
            padding: "14px 16px",
            background: "#f9fafb",
            fontWeight: 900,
            fontSize: 13,
          }}
        >
          <div>Name</div>
          <div>Description</div>
          <div>Actions</div>
        </div>

        {/* Rows */}
        {filtered.map((c, idx) => (
          <React.Fragment key={c.id}>
            {/* Desktop row */}
            <div
              className="desktop-row"
              style={{
                display: "grid",
                gridTemplateColumns: "1.2fr 2fr 1fr",
                gap: 10,
                padding: "14px 16px",
                borderTop: idx === 0 ? "none" : "1px solid #f3f4f6",
                alignItems: "center",
              }}
            >
              <div style={{ fontWeight: 900 }}>{c.name}</div>
              <div>{c.description || "-"}</div>
              <div style={{ display: "flex", gap: 8 }}>
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

            {/* Mobile Card */}
            <div className="mobile-card">
              <div style={{ fontWeight: 900, fontSize: 16 }}>
                {c.name}
              </div>
              <div style={{ marginTop: 6, color: "#6b7280" }}>
                {c.description || "No description"}
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
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
          </React.Fragment>
        ))}
      </div>

      {/* ADD MODAL */}
      {isAddOpen && (
        <div style={modalOverlay}>
          <div style={modalBox}>
            <h3>Add Category</h3>
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

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 16 }}>
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
            <h3>Edit Category</h3>
            <div style={{ display: "grid", gap: 12 }}>
              <input
                name="name"
                value={editingCategory.name}
                onChange={handleEditChange}
                style={inputStyle}
              />
              <textarea
                name="description"
                value={editingCategory.description || ""}
                onChange={handleEditChange}
                rows={4}
                style={{ ...inputStyle, resize: "none" }}
              />
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