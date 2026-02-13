import React, { useEffect, useMemo, useState } from "react";
import { api } from "../api/api"; // adjust if needed

export default function Staff() {
  const [search, setSearch] = useState("");

  // Backend state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Pageable
  const [page, setPage] = useState(0);
  const size = 10;
  const [pageData, setPageData] = useState(null);

  // Staff list
  const [staffList, setStaffList] = useState([]);

  // Backend roles
  const roles = ["CASHIER", "MANAGER", "ADMIN"];

  // Modal states
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);

  // Add staff form state
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    role: "CASHIER",
    password: "",
  });

  // Load staff on mount + page change
  useEffect(() => {
    loadStaff();
    // eslint-disable-next-line
  }, [page]);

  async function loadStaff() {
    try {
      setLoading(true);
      setError("");

      const res = await api.get("/api/v1/auth/staffs", {
        params: {
          page,
          size,
          sort: "createdAt,desc",
        },
      });

      setPageData(res.data);
      setStaffList(res.data.content || []);
    } catch (e) {
      console.log(e);
      setError("Failed to load staff. Check backend, token, and CORS.");
    } finally {
      setLoading(false);
    }
  }

  const filteredStaff = useMemo(() => {
    return staffList.filter((s) => {
      const q = search.toLowerCase();

      const fullName =
        (s.firstName ? s.firstName : "") +
        " " +
        (s.lastName ? s.lastName : "");

      return (
        fullName.toLowerCase().includes(q) ||
        (s.phoneNumber || "").toLowerCase().includes(q) ||
        (s.role || "").toLowerCase().includes(q)
      );
    });
  }, [staffList, search]);

  function openAddModal() {
    setForm({
      fullName: "",
      email: "",
      phone: "",
      role: "CASHIER",
      password: "",
    });
    setIsAddOpen(true);
  }

  function closeAddModal() {
    setIsAddOpen(false);
  }

  function handleAddChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function splitName(fullName) {
    const parts = String(fullName || "")
      .trim()
      .split(" ")
      .filter(Boolean);

    if (parts.length === 0) return { firstName: "", lastName: "" };
    if (parts.length === 1) return { firstName: parts[0], lastName: "" };

    return {
      firstName: parts[0],
      lastName: parts.slice(1).join(" "),
    };
  }

  async function handleAddStaff() {
    if (!form.fullName || !form.phone || !form.email || !form.password) {
      alert("Please fill full name, email, phone and password.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const { firstName, lastName } = splitName(form.fullName);

      const payload = {
        firstName,
        lastName,
        email: form.email,
        phoneNumber: form.phone,
        password: form.password,
        role: form.role,
      };

      await api.post("/api/v1/auth/register", payload);

      closeAddModal();
      setPage(0);
      await loadStaff();
    } catch (e) {
      console.log(e);
      setError("Failed to add staff. Check if you are ADMIN.");
      alert("Failed to add staff. Check console.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteStaff(id) {
    const ok = window.confirm("Are you sure you want to delete this staff?");
    if (!ok) return;

    try {
      setLoading(true);
      setError("");

      await api.delete(`/api/v1/staff/${id}`);
      await loadStaff();
    } catch (e) {
      console.log(e);
      setError("Delete failed. Backend endpoint may not exist yet.");
      alert("Delete failed. Backend endpoint may not exist yet.");
    } finally {
      setLoading(false);
    }
  }

  function openEditModal(staff) {
    setEditingStaff({
      ...staff,
      fullName: `${staff.firstName || ""} ${staff.lastName || ""}`.trim(),
      phone: staff.phoneNumber || "",
    });
  }

  function closeEditModal() {
    setEditingStaff(null);
  }

  function handleEditChange(e) {
    setEditingStaff({ ...editingStaff, [e.target.name]: e.target.value });
  }

  async function handleSaveEdit() {
    if (!editingStaff.fullName || !editingStaff.phone || !editingStaff.email) {
      alert("Please fill full name, email and phone.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const { firstName, lastName } = splitName(editingStaff.fullName);

      const payload = {
        firstName,
        lastName,
        email: editingStaff.email,
        phoneNumber: editingStaff.phone,
        role: editingStaff.role,
      };

      await api.put(`/api/v1/staff/${editingStaff.id}`, payload);

      closeEditModal();
      await loadStaff();
    } catch (e) {
      console.log(e);
      setError("Update failed. Backend endpoint may not exist yet.");
      alert("Update failed. Backend endpoint may not exist yet.");
    } finally {
      setLoading(false);
    }
  }

  function statusStyle(status) {
    if (status === "Active") return { color: "#166534", bg: "#dcfce7" };
    return { color: "#9f1239", bg: "#ffe4e6" };
  }

  function normalizeRole(role) {
    if (!role) return "-";
    if (role === "CASHIER") return "Cashier";
    if (role === "MANAGER") return "Manager";
    if (role === "ADMIN") return "Admin";
    return role;
  }

  return (
    <div style={{ padding: 18 }}>
      {/* Header */}
      <div style={{ marginBottom: 14 }}>
        <h2 style={{ margin: 0, fontSize: 22 }}>Staff</h2>
        <p style={{ margin: "6px 0 0", color: "#6b7280" }}>
          Add and manage your staff accounts
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
            placeholder="Search staff..."
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
          + Add Staff
        </button>
      </div>

      {/* Loading/Error */}
      {loading && <div style={{ marginBottom: 10 }}>Loading...</div>}
      {error && (
        <div style={{ marginBottom: 10, color: "crimson" }}>{error}</div>
      )}

      {/* Staff table */}
      <div
        style={{
          background: "#fff",
          border: "1px solid #e5e7eb",
          borderRadius: 14,
          overflow: "hidden",
        }}
      >
        {/* Table headings (REDESIGNED AFTER REMOVING EMAIL) */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.6fr 1.3fr 1fr 1fr 1.2fr",
            gap: 10,
            padding: "14px 16px",
            background: "#f9fafb",
            fontWeight: 900,
            color: "#374151",
            fontSize: 13,
          }}
        >
          <div>Full Name</div>
          <div>Phone</div>
          <div>Role</div>
          <div>Status</div>
          <div>Actions</div>
        </div>

        {/* Rows */}
        {filteredStaff.map((s, idx) => {
          const fullName = `${s.firstName || ""} ${s.lastName || ""}`.trim();
          const st = statusStyle("Active");

          return (
            <div
              key={s.id}
              style={{
                display: "grid",
                gridTemplateColumns: "1.6fr 1.3fr 1fr 1fr 1.2fr",
                gap: 10,
                padding: "14px 16px",
                borderTop: idx === 0 ? "none" : "1px solid #f3f4f6",
                alignItems: "center",
                fontSize: 14,
              }}
            >
              <div style={{ fontWeight: 800 }}>{fullName || "-"}</div>

              <div style={{ fontWeight: 700 }}>{s.phoneNumber || "-"}</div>

              <div style={{ fontWeight: 800 }}>{normalizeRole(s.role)}</div>

              <div>
                <span
                  style={{
                    background: st.bg,
                    color: st.color,
                    padding: "6px 10px",
                    borderRadius: 999,
                    fontWeight: 900,
                    fontSize: 13,
                  }}
                >
                  Active
                </span>
              </div>

              <div style={{ display: "flex", gap: 8, whiteSpace: "nowrap" }}>
                <button onClick={() => openEditModal(s)} style={actionBtn}>
                  ✏️ Edit
                </button>

                <button
                  onClick={() => handleDeleteStaff(s.id)}
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
          );
        })}

        {filteredStaff.length === 0 && (
          <div style={{ padding: 16, color: "#6b7280" }}>
            No staff found.
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
              Showing {filteredStaff.length} of {pageData.totalElements} staff
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

      {/* ADD STAFF MODAL */}
      {isAddOpen && (
        <div style={modalOverlay}>
          <div style={modalBox}>
            <h3 style={{ marginTop: 0 }}>Add Staff</h3>

            <div style={{ display: "grid", gap: 12 }}>
              <input
                name="fullName"
                value={form.fullName}
                onChange={handleAddChange}
                placeholder="Full Name"
                style={inputStyle}
              />

              <input
                name="email"
                value={form.email}
                onChange={handleAddChange}
                placeholder="Email"
                style={inputStyle}
              />

              <input
                name="phone"
                value={form.phone}
                onChange={handleAddChange}
                placeholder="Phone"
                style={inputStyle}
              />

              <input
                name="password"
                value={form.password}
                onChange={handleAddChange}
                placeholder="Password"
                type="password"
                style={inputStyle}
              />

              <select
                name="role"
                value={form.role}
                onChange={handleAddChange}
                style={inputStyle}
              >
                {roles.map((r) => (
                  <option key={r} value={r}>
                    {r}
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

              <button onClick={handleAddStaff} style={saveBtn}>
                Add Staff
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {editingStaff && (
        <div style={modalOverlay}>
          <div style={modalBox}>
            <h3 style={{ marginTop: 0 }}>Edit Staff</h3>

            <div style={{ display: "grid", gap: 12 }}>
              <input
                name="fullName"
                value={editingStaff.fullName}
                onChange={handleEditChange}
                placeholder="Full Name"
                style={inputStyle}
              />

              <input
                name="email"
                value={editingStaff.email}
                onChange={handleEditChange}
                placeholder="Email"
                style={inputStyle}
              />

              <input
                name="phone"
                value={editingStaff.phone}
                onChange={handleEditChange}
                placeholder="Phone"
                style={inputStyle}
              />

              <select
                name="role"
                value={editingStaff.role}
                onChange={handleEditChange}
                style={inputStyle}
              >
                {roles.map((r) => (
                  <option key={r} value={r}>
                    {r}
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

/* --------------------------
   Styles (UNCHANGED)
-------------------------- */

const inputStyle = {
  border: "1px solid #e5e7eb",
  borderRadius: 12,
  padding: "12px 12px",
  outline: "none",
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
