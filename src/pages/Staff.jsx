import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/api";
import { useAuth } from "../auth/useAuth";
import PermissionGate from "../auth/PermissionGate";

const PERMISSION_GROUPS = {
  "CRM / Leads":  ["CAN_VIEW_LEADS","CAN_CREATE_LEADS","CAN_UPDATE_LEAD_STATUS","CAN_CONVERT_LEADS"],
  "Orders":       ["CAN_VIEW_ORDERS","CAN_CREATE_ORDERS","CAN_UPDATE_ORDER_STATUS","CAN_VIEW_ORDER_SUMMARY","CAN_VIEW_TOP_SELLING"],
  "Products":     ["CAN_VIEW_PRODUCTS","CAN_CREATE_PRODUCTS","CAN_EDIT_PRODUCTS","CAN_DELETE_PRODUCTS"],
  "Categories":   ["CAN_VIEW_CATEGORIES","CAN_CREATE_CATEGORIES","CAN_EDIT_CATEGORIES","CAN_DELETE_CATEGORIES"],
  "Customers":    ["CAN_VIEW_CUSTOMERS","CAN_CREATE_CUSTOMERS","CAN_DELETE_CUSTOMERS"],
  "Inventory":    ["CAN_VIEW_INVENTORY","CAN_VIEW_LOW_STOCK","CAN_RESTOCK_INVENTORY","CAN_REDUCE_INVENTORY"],
  "Payments":     ["CAN_VIEW_PAYMENTS","CAN_CREATE_PAYMENTS","CAN_MATCH_PAYMENTS","CAN_VIEW_ORDER_PAYMENTS"],
  "Requisitions": ["CAN_VIEW_REQUISITIONS","CAN_CREATE_REQUISITIONS","CAN_VIEW_OWN_REQUISITIONS","CAN_APPROVE_REQUISITIONS","CAN_REJECT_REQUISITIONS","CAN_MARK_REQUISITION_PAID"],
  "Expenses":     ["CAN_VIEW_EXPENSES","CAN_CREATE_EXPENSES","CAN_DELETE_EXPENSES"],
  "Payroll":      ["CAN_VIEW_OWN_PAYROLL","CAN_VIEW_PAYROLL_SUMMARY"],
  "Reports":      ["CAN_VIEW_PROFIT_REPORT"],
  "Admin":        ["CAN_VIEW_STAFF","CAN_DELETE_STAFF","CAN_MANAGE_PERMISSIONS"],
};

const PERMISSION_LABELS = {
  CAN_VIEW_LEADS: "View leads", CAN_CREATE_LEADS: "Create leads",
  CAN_UPDATE_LEAD_STATUS: "Update lead status", CAN_CONVERT_LEADS: "Convert leads",
  CAN_VIEW_ORDERS: "View orders", CAN_CREATE_ORDERS: "Create orders",
  CAN_UPDATE_ORDER_STATUS: "Update order status", CAN_VIEW_ORDER_SUMMARY: "View order summary",
  CAN_VIEW_TOP_SELLING: "View top selling", CAN_VIEW_PRODUCTS: "View products",
  CAN_CREATE_PRODUCTS: "Create products", CAN_EDIT_PRODUCTS: "Edit products",
  CAN_DELETE_PRODUCTS: "Delete products", CAN_VIEW_CATEGORIES: "View categories",
  CAN_CREATE_CATEGORIES: "Create categories", CAN_EDIT_CATEGORIES: "Edit categories",
  CAN_DELETE_CATEGORIES: "Delete categories", CAN_VIEW_CUSTOMERS: "View customers",
  CAN_CREATE_CUSTOMERS: "Create customers", CAN_DELETE_CUSTOMERS: "Delete customers",
  CAN_VIEW_INVENTORY: "View inventory", CAN_VIEW_LOW_STOCK: "View low stock",
  CAN_RESTOCK_INVENTORY: "Restock inventory", CAN_REDUCE_INVENTORY: "Reduce inventory",
  CAN_VIEW_PAYMENTS: "View payments", CAN_CREATE_PAYMENTS: "Create payments",
  CAN_MATCH_PAYMENTS: "Match payments", CAN_VIEW_ORDER_PAYMENTS: "View order payments",
  CAN_VIEW_REQUISITIONS: "View requisitions", CAN_CREATE_REQUISITIONS: "Create requisitions",
  CAN_VIEW_OWN_REQUISITIONS: "View own requisitions", CAN_APPROVE_REQUISITIONS: "Approve requisitions",
  CAN_REJECT_REQUISITIONS: "Reject requisitions", CAN_MARK_REQUISITION_PAID: "Mark requisition paid",
  CAN_VIEW_EXPENSES: "View expenses", CAN_CREATE_EXPENSES: "Create expenses",
  CAN_DELETE_EXPENSES: "Delete expenses", CAN_VIEW_OWN_PAYROLL: "View own payroll",
  CAN_VIEW_PAYROLL_SUMMARY: "View payroll summary", CAN_VIEW_PROFIT_REPORT: "View profit report",
  CAN_VIEW_STAFF: "View staff", CAN_DELETE_STAFF: "Delete staff",
  CAN_MANAGE_PERMISSIONS: "Manage permissions",
};

export default function Staff() {
  const navigate = useNavigate();
  const { can } = useAuth();

  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [page, setPage] = useState(0);
  const size = 10;
  const [pageData, setPageData] = useState(null);
  const [staffList, setStaffList] = useState([]);
  const roles = ["CASHIER", "MANAGER", "STAFF","ATTENDANT"];
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [form, setForm] = useState({
    fullName: "", email: "", phone: "", role: "CASHIER", password: "",
  });

  const [permStaff, setPermStaff] = useState(null);
  const [grantedPerms, setGrantedPerms] = useState([]);
  const [permLoading, setPermLoading] = useState(false);
  const [permSaving, setPermSaving] = useState(false);
  const [permSuccess, setPermSuccess] = useState("");

  useEffect(() => { loadStaff(); }, [page]);

  async function loadStaff() {
    try {
      setLoading(true);
      setError("");
      const res = await api.get("/api/v1/auth/staffs", {
        params: { page, size, sort: "createdAt,desc" },
      });
      setPageData(res.data);
      setStaffList(res.data.content || []);
    } catch (e) {
      setError("Failed to load staff.");
    } finally {
      setLoading(false);
    }
  }

  async function openPermissions(staff) {
    setPermStaff(staff);
    setGrantedPerms([]);
    setPermSuccess("");
    setPermLoading(true);
    try {
      const res = await api.get(`/api/v1/admin/permissions/${staff.id}`);
      const granted = res.data.filter(p => p.granted).map(p => p.permission);
      setGrantedPerms(granted);
    } catch (e) {
      console.error("Failed to load permissions", e);
    } finally {
      setPermLoading(false);
    }
  }

  function closePermissions() {
    setPermStaff(null);
    setGrantedPerms([]);
    setPermSuccess("");
  }

  function togglePerm(perm) {
    setGrantedPerms(prev =>
      prev.includes(perm) ? prev.filter(p => p !== perm) : [...prev, perm]
    );
  }

  async function savePermissions() {
    try {
      setPermSaving(true);
      await api.put(`/api/v1/admin/permissions/${permStaff.id}`, grantedPerms);
      setPermSuccess("Permissions saved successfully!");
      setTimeout(() => setPermSuccess(""), 3000);
    } catch (e) {
      alert("Failed to save permissions.");
    } finally {
      setPermSaving(false);
    }
  }

  const filteredStaff = useMemo(() => {
    return staffList.filter((s) => {
      const q = search.toLowerCase();
      const fullName = `${s.firstName || ""} ${s.lastName || ""}`;
      return (
        fullName.toLowerCase().includes(q) ||
        (s.phoneNumber || "").toLowerCase().includes(q) ||
        (s.role || "").toLowerCase().includes(q)
      );
    });
  }, [staffList, search]);

  function openAddModal() {
    setForm({ fullName: "", email: "", phone: "", role: "CASHIER", password: "" });
    setIsAddOpen(true);
  }

  function closeAddModal() { setIsAddOpen(false); }
  function handleAddChange(e) { setForm({ ...form, [e.target.name]: e.target.value }); }

  function splitName(fullName) {
    const parts = String(fullName || "").trim().split(" ").filter(Boolean);
    if (parts.length === 0) return { firstName: "", lastName: "" };
    if (parts.length === 1) return { firstName: parts[0], lastName: "" };
    return { firstName: parts[0], lastName: parts.slice(1).join(" ") };
  }

  async function handleAddStaff() {
    if (!form.fullName || !form.phone || !form.email || !form.password) {
      alert("Please fill all fields.");
      return;
    }
    try {
      setLoading(true);
      const { firstName, lastName } = splitName(form.fullName);
      await api.post("/api/v1/auth/register", {
        firstName, lastName,
        email: form.email,
        phoneNumber: form.phone,
        password: form.password,
        role: form.role,
      });
      closeAddModal();
      setPage(0);
      await loadStaff();
    } catch (e) {
      alert("Failed to add staff.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteStaff(id) {
    if (!window.confirm("Delete this staff member?")) return;
    try {
      setLoading(true);
      await api.delete(`/api/v1/auth/user/${id}`);
      await loadStaff();
    } catch (e) {
      alert("Delete failed.");
    } finally {
      setLoading(false);
    }
  }

  function normalizeRole(role) {
    if (!role) return "-";
    return role.charAt(0) + role.slice(1).toLowerCase();
  }

  return (
    <div style={{ padding: 18 }}>

      <div style={{ marginBottom: 14 }}>
        <h2 style={{ margin: 0, fontSize: 22 }}>Staff</h2>
        <p style={{ margin: "6px 0 0", color: "#6b7280" }}>Add and manage your staff accounts</p>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, border: "1px solid #e5e7eb", background: "#fff", padding: "10px 14px", borderRadius: 12, minWidth: 280 }}>
          <span style={{ opacity: 0.7 }}>🔍</span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search staff..."
            style={{ border: "none", outline: "none", background: "transparent", width: "100%" }}
          />
        </div>

        <PermissionGate permission="CAN_MANAGE_PERMISSIONS">
          <button
            onClick={openAddModal}
            style={{ background: "#657dccff", color: "#fff", border: "none", padding: "12px 16px", borderRadius: 12, fontWeight: 900, cursor: "pointer" }}
          >
            + Add Staff
          </button>
        </PermissionGate>
      </div>

      {loading && <div style={{ marginBottom: 10, color: "#6b7280" }}>Loading...</div>}
      {error && <div style={{ marginBottom: 10, color: "crimson" }}>{error}</div>}

      <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 14, overflow: "hidden" }}>

        {/* Table header */}
        <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1.2fr 1fr 1fr 1.6fr", gap: 10, padding: "14px 16px", background: "#f9fafb", fontWeight: 900, color: "#374151", fontSize: 13 }}>
          <div>Full name</div>
          <div>Phone</div>
          <div>Role</div>
          <div>Status</div>
          <div>Actions</div>
        </div>

        {/* Rows */}
        {filteredStaff.map((s, idx) => {
          const fullName = `${s.firstName || ""} ${s.lastName || ""}`.trim();
          return (
            <div
              key={s.id}
              onClick={() => navigate(`/staff/${s.id}`)}
              style={{
                display: "grid", gridTemplateColumns: "1.4fr 1.2fr 1fr 1fr 1.6fr",
                gap: 10, padding: "14px 16px",
                borderTop: idx === 0 ? "none" : "1px solid #f3f4f6",
                alignItems: "center", fontSize: 14,
                cursor: "pointer",
                transition: "background 0.15s",
              }}
              onMouseEnter={e => e.currentTarget.style.background = "#f9fafb"}
              onMouseLeave={e => e.currentTarget.style.background = "#fff"}
            >
              <div style={{ fontWeight: 800 }}>{fullName || "-"}</div>
              <div style={{ fontWeight: 700 }}>{s.phoneNumber || "-"}</div>
              <div style={{ fontWeight: 800 }}>{normalizeRole(s.role)}</div>
              <div>
                <span style={{ background: "#dcfce7", color: "#166534", padding: "6px 10px", borderRadius: 999, fontWeight: 900, fontSize: 13 }}>
                  Active
                </span>
              </div>

              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>

                <PermissionGate permission="CAN_VIEW_STAFF">
                  <button
                    onClick={e => { e.stopPropagation(); navigate(`/staff/${s.id}`); }}
                    style={actionBtn}
                  >
                    ✏️ Edit
                  </button>
                </PermissionGate>

                <PermissionGate permission="CAN_MANAGE_PERMISSIONS">
                  <button
                    onClick={e => { e.stopPropagation(); openPermissions(s); }}
                    style={{ ...actionBtn, background: "#eff6ff", color: "#1d4ed8", border: "1px solid #bfdbfe" }}
                  >
                    🔐 Permissions
                  </button>
                </PermissionGate>

                <PermissionGate permission="CAN_DELETE_STAFF">
                  <button
                    onClick={e => { e.stopPropagation(); handleDeleteStaff(s.id); }}
                    style={{ ...actionBtn, background: "#fee2e2", color: "#991b1b" }}
                  >
                    🗑 Delete
                  </button>
                </PermissionGate>

              </div>
            </div>
          );
        })}

        {filteredStaff.length === 0 && !loading && (
          <div style={{ padding: 16, color: "#6b7280" }}>No staff found.</div>
        )}

        {/* Pagination */}
        {pageData && (
          <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 16px", borderTop: "1px solid #e5e7eb", background: "#fff", color: "#6b7280", fontSize: 14, flexWrap: "wrap", gap: 10 }}>
            <div>Showing {filteredStaff.length} of {pageData.totalElements} staff</div>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <button style={pageBtnStyle} disabled={page === 0} onClick={() => setPage(p => Math.max(0, p - 1))}>‹</button>
              <span style={{ fontWeight: 900 }}>Page {page + 1} / {pageData.totalPages || 1}</span>
              <button style={pageBtnStyle} disabled={pageData.last} onClick={() => setPage(p => p + 1)}>›</button>
            </div>
          </div>
        )}
      </div>

      {/* ADD STAFF MODAL */}
      {isAddOpen && can("CAN_MANAGE_PERMISSIONS") && (
        <div style={modalOverlay}>
          <div style={modalBox}>
            <h3 style={{ marginTop: 0 }}>Add Staff</h3>
            <div style={{ display: "grid", gap: 12 }}>
              <input name="fullName" value={form.fullName} onChange={handleAddChange} placeholder="Full Name" style={inputStyle} />
              <input name="email" value={form.email} onChange={handleAddChange} placeholder="Email" style={inputStyle} />
              <input name="phone" value={form.phone} onChange={handleAddChange} placeholder="Phone" style={inputStyle} />
              <input name="password" value={form.password} onChange={handleAddChange} placeholder="Password" type="password" style={inputStyle} />
              <select name="role" value={form.role} onChange={handleAddChange} style={inputStyle}>
                {roles.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 16 }}>
              <button onClick={closeAddModal} style={cancelBtn}>Cancel</button>
              <button onClick={handleAddStaff} style={saveBtn}>
                {loading ? "Adding..." : "Add Staff"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PERMISSIONS MODAL */}
      {permStaff && (
        <div style={modalOverlay}>
          <div style={{ ...modalBox, width: "680px", maxHeight: "85vh", overflowY: "auto" }}>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div>
                <h3 style={{ margin: 0 }}>
                  Permissions — {permStaff.firstName} {permStaff.lastName}
                </h3>
                <div style={{ fontSize: 13, color: "#6b7280", marginTop: 3 }}>
                  {normalizeRole(permStaff.role)}
                </div>
              </div>
              <button onClick={savePermissions} disabled={permSaving} style={saveBtn}>
                {permSaving ? "Saving..." : "Save"}
              </button>
            </div>

            {permSuccess && (
              <div style={{ background: "#dcfce7", color: "#166534", padding: "10px 14px", borderRadius: 10, marginBottom: 14, fontSize: 13, fontWeight: 700 }}>
                {permSuccess}
              </div>
            )}

            {permLoading ? (
              <div style={{ padding: 20, color: "#6b7280" }}>Loading permissions...</div>
            ) : (
              Object.entries(PERMISSION_GROUPS).map(([group, perms]) => (
                <div key={group} style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 11, fontWeight: 900, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>
                    {group}
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                    {perms.map(perm => {
                      const checked = grantedPerms.includes(perm);
                      return (
                        <label
                          key={perm}
                          onClick={() => togglePerm(perm)}
                          style={{
                            display: "flex", alignItems: "center", gap: 10,
                            padding: "8px 10px", borderRadius: 8, cursor: "pointer",
                            border: checked ? "1px solid #86efac" : "1px solid #e5e7eb",
                            background: checked ? "#f0fdf4" : "#fff",
                            transition: "all 0.12s",
                          }}
                        >
                          <div style={{
                            width: 16, height: 16, borderRadius: 4, flexShrink: 0,
                            background: checked ? "#16a34a" : "#fff",
                            border: checked ? "none" : "1.5px solid #d1d5db",
                            display: "flex", alignItems: "center", justifyContent: "center",
                          }}>
                            {checked && (
                              <svg width="10" height="10" viewBox="0 0 10 10">
                                <polyline points="1,5 4,8 9,2" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
                              </svg>
                            )}
                          </div>
                          <span style={{ fontSize: 12, color: checked ? "#15803d" : "#374151", fontWeight: checked ? 700 : 400 }}>
                            {PERMISSION_LABELS[perm] || perm}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))
            )}

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 8, paddingTop: 16, borderTop: "1px solid #e5e7eb" }}>
              <button onClick={closePermissions} style={cancelBtn}>Close</button>
              <button onClick={savePermissions} disabled={permSaving} style={saveBtn}>
                {permSaving ? "Saving..." : "Save Permissions"}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

const inputStyle = { border: "1px solid #e5e7eb", borderRadius: 12, padding: "12px 12px", outline: "none" };
const actionBtn = { border: "1px solid #e5e7eb", background: "#f9fafb", padding: "6px 8px", borderRadius: 8, cursor: "pointer", fontWeight: 800, fontSize: 12, lineHeight: 1 };
const modalOverlay = { position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)", display: "grid", placeItems: "center", zIndex: 999 };
const modalBox = { width: "520px", maxWidth: "95vw", background: "#fff", borderRadius: 16, padding: 18, border: "1px solid #e5e7eb" };
const cancelBtn = { border: "1px solid #e5e7eb", background: "#fff", padding: "10px 14px", borderRadius: 12, cursor: "pointer", fontWeight: 800 };
const saveBtn = { border: "none", background: "#647dceff", color: "#fff", padding: "10px 14px", borderRadius: 12, cursor: "pointer", fontWeight: 900 };
const pageBtnStyle = { border: "1px solid #e5e7eb", background: "#fff", borderRadius: 10, padding: "6px 10px", cursor: "pointer" };