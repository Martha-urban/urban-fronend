import React, { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../api/api";
import { publishNotification } from "../utils/notificationBus.js";

// ─── Toast Component ───────────────────────────────────────────────────────────
function Toast({ notifications, onDismiss, onNavigate }) {
  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 max-w-sm w-full">
      {notifications.map((n) => (
        <div
          key={n.id}
          className="bg-white border-l-4 border-green-500 shadow-lg rounded-lg p-4 flex items-start gap-3 animate-slide-in"
        >
          <div className="flex-1">
            <div className="font-semibold text-sm text-gray-800">{n.title}</div>
            <div className="text-xs text-gray-500 mt-1">{n.message}</div>
            <button
              onClick={() => onNavigate(n)}
              className="mt-2 text-xs bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
            >
              View Lead →
            </button>
          </div>
          <button
            onClick={() => onDismiss(n.id)}
            className="text-gray-400 hover:text-gray-600 text-lg leading-none"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}

// ─── Notification Bell ─────────────────────────────────────────────────────────
function NotificationBell({ onNavigate }) {
  const [unread, setUnread] = useState([]);
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  const fetchUnread = useCallback(async () => {
    try {
      const res = await api.get("/api/v1/notifications/unread");
      setUnread(res.data);
    } catch (err) {
      console.error("Failed to fetch notifications", err);
    }
  }, []);

  useEffect(() => {
    fetchUnread();
  }, [fetchUnread]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const markAsRead = async (id) => {
    try {
      await api.patch(`/api/v1/notifications/${id}/read`);
      setUnread((prev) => prev.filter((n) => n.id !== id));
    } catch (err) {
      console.error("Failed to mark as read", err);
    }
  };

  const markAllRead = async () => {
    try {
      await api.patch("/api/v1/notifications/read-all");
      setUnread([]);
    } catch (err) {
      console.error("Failed to mark all as read", err);
    }
  };

  const handleClick = (notification) => {
    markAsRead(notification.id);
    setOpen(false);
    onNavigate(notification);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-full hover:bg-gray-100"
      >
        {/* Bell icon */}
        <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unread.length > 0 && (
          <span className="absolute top-1 right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold">
            {unread.length > 9 ? "9+" : unread.length}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-screen sm:w-80 bg-white rounded-lg shadow-xl border z-50 max-h-96 overflow-y-auto sm:max-w-sm mx-4 sm:mx-0">
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <span className="font-semibold text-sm">Notifications</span>
            {unread.length > 0 && (
              <button
                onClick={markAllRead}
                className="text-xs text-blue-600 hover:underline"
              >
                Mark all read
              </button>
            )}
          </div>

          {unread.length === 0 ? (
            <div className="px-4 py-6 text-sm text-gray-400 text-center">
              No unread notifications
            </div>
          ) : (
            unread.map((n) => (
              <div
                key={n.id}
                onClick={() => handleClick(n)}
                className="px-4 py-3 border-b hover:bg-gray-50 cursor-pointer flex items-start gap-3"
              >
                <div className="mt-1 w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-800 truncate">{n.title}</div>
                  <div className="text-xs text-gray-500 mt-0.5 truncate">{n.message}</div>
                  <div className="text-xs text-gray-400 mt-1">
                    {formatDateTime(n.sentAt)}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main CRM Component ────────────────────────────────────────────────────────
export default function CRM() {
  const navigate = useNavigate();
  const { id: leadId } = useParams();

  const [leads, setLeads] = useState([]);
  const [pageData, setPageData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(0);
  const [error, setError] = useState("");
  const [followUps, setFollowUps] = useState({});

  const [selectedLead, setSelectedLead] = useState(null);
  const [highlightedLeadId, setHighlightedLeadId] = useState(null);
  const leadRefs = useRef({});
  const [quantity, setQuantity] = useState(1);
  const [deliveryCity, setDeliveryCity] = useState("");
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [converting, setConverting] = useState(false);
  const [productPrice, setProductPrice] = useState(0);
  const [noteEdits, setNoteEdits] = useState({});
  const [focusedNoteId, setFocusedNoteId] = useState(null);
  const [extraInfo, setExtraInfo] = useState("");
  const [customerNotes, setCustomerNotes] = useState("");

  // Toast notifications (live SSE popups)
  const [toasts, setToasts] = useState([]);

  const size = 10;

  // ── Navigate to lead from notification ──────────────────────────────────────
  const handleNotificationNavigate = (notification) => {
    navigate(`/crm/leads/${notification.referenceId}`);
  };

  // ── SSE: subscribe to live notifications ────────────────────────────────────
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    const es = new EventSource(
      `${import.meta.env.VITE_API_URL}/api/v1/notifications/subscribe`,
      // Note: EventSource doesn't support custom headers natively
      // If your backend uses cookie/session auth this works directly.
      // For JWT, see the note below ↓
    );

    es.addEventListener("notification", (e) => {
      try {
        const notification = JSON.parse(e.data);
        // Show toast popup
        setToasts((prev) => [...prev, notification]);
        // Auto-dismiss after 8 seconds
        setTimeout(() => {
          setToasts((prev) => prev.filter((t) => t.id !== notification.id));
          // Publish to global notification bus so other UI (dashboard/topbar) can react
          try {
            publishNotification(notification);
          } catch (busErr) {
            console.warn("Failed to publish notification to bus", busErr);
          }
        }, 8000);
      } catch (err) {
        console.error("Failed to parse SSE notification", err);
      }
    });

    es.onerror = () => {
      console.warn("SSE connection lost, will retry automatically");
    };

    return () => es.close();
  }, []);

  // ── Fetch leads ─────────────────────────────────────────────────────────────
  useEffect(() => {
    fetchLeads();
  }, [page, statusFilter]);

  useEffect(() => {
    if (!leadId) return;
    setHighlightedLeadId(leadId);
    const element = leadRefs.current[leadId];
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [leadId, leads]);

  const fetchLeads = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await api.get("/api/v1/leads", {
        params: { page, size, status: statusFilter || undefined },
      });
      setLeads(res.data.content);
      setPageData(res.data);
    } catch (err) {
      console.error(err);
      setError("Failed to load leads");
    } finally {
      setLoading(false);
    }
  };

  // ── Update lead status (handles RESCHEDULED with date) ──────────────────────
  const updateLeadStatus = async (leadId, status) => {
    try {
      const payload = { status };
      if (status === "RESCHEDULED") {
        if (!followUps[leadId]) {
          alert("Please pick a follow-up date before setting status to Rescheduled.");
          return;
        }
        payload.followUpAt = followUps[leadId];
      }
      await api.patch(`/api/v1/leads/${leadId}/status`, payload);
      // Clear the follow-up input for this lead after successful save
      setFollowUps((prev) => ({ ...prev, [leadId]: "" }));
      fetchLeads();
    } catch (err) {
      console.error("Status update failed", err);
      alert("Failed to update lead status");
    }
  };

  // ── Open convert modal ───────────────────────────────────────────────────────
  const openConvertModal = async (lead) => {
    try {
      const res = await api.get("/api/v1/products/by-name", {
        params: { name: lead.formName },
      });
      
      if (!res.data || !res.data.sellingPrice) {
        const notification = {
          id: Date.now(),
          title: "Product Not Available",
          message: `The product "${lead.formName}" is not available in your inventory`,
        };
        setToasts((prev) => [...prev, notification]);
        setTimeout(() => {
          setToasts((prev) => prev.filter((t) => t.id !== notification.id));
        }, 4000);
        return;
      }
      
      setSelectedLead(lead);
      setQuantity(1);
      setDeliveryCity(lead.location || "");
      setDeliveryFee(0);
      setDiscount(0);
      setProductPrice(res.data.sellingPrice);
    } catch (err) {
      console.error("Failed to fetch product price", err);
      const notification = {
        id: Date.now(),
        title: "Product Not Available",
        message: `The product "${lead.formName}" is not available in your inventory`,
      };
      setToasts((prev) => [...prev, notification]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== notification.id));
      }, 4000);
    }
  };

  // ── Convert lead ─────────────────────────────────────────────────────────────
  const convertLead = async () => {
    try {
      setConverting(true);
      const subtotal = Number(quantity) * Number(productPrice);
      const safeDeliveryFee = Number(deliveryFee) >= 0 ? Number(deliveryFee) : 0;
      const safeDiscount = Number(discount || 0) >= 0 ? Number(discount || 0) : 0;
      const totalAmount = Math.max(0, subtotal + safeDeliveryFee - safeDiscount);

      if (safeDiscount < 0) { alert("Discount cannot be negative."); return; }
      if (safeDiscount > subtotal + safeDeliveryFee) {
        alert("Discount cannot exceed the total order amount."); return;
      }

      await api.post(`/api/v1/leads/${selectedLead.id}/convert`, {
        quantity: Number(quantity),
        deliveryCity,
        deliveryFee: safeDeliveryFee,
        discount: safeDiscount,
        totalAmount,
      });
      setSelectedLead(null);
      fetchLeads();
    } catch (err) {
      console.error(err);
      const errorMsg = err.response?.data?.message || err.message;
      if (errorMsg && errorMsg.includes("product") && errorMsg.includes("not")) {
        alert(`The product "${selectedLead.formName}" is not available in your inventory`);
      } else {
        alert("Conversion failed");
      }
    } finally {
      setConverting(false);
    }
  };

  // ── Computed totals for modal ────────────────────────────────────────────────
  const safeQuantity = Number(quantity) > 0 ? Number(quantity) : 1;
  const subtotal = safeQuantity * Number(productPrice);
  const safeDeliveryFee = Number(deliveryFee) >= 0 ? Number(deliveryFee) : 0;
  const safeDiscount = Number(discount) >= 0 ? Number(discount) : 0;
  const totalAmount = Math.max(0, subtotal + safeDeliveryFee - safeDiscount);

  // ── Stats ────────────────────────────────────────────────────────────────────
  const totalLeads = pageData?.totalElements || 0;
  const newLeads = leads.filter((l) => l.status === "NEW").length;
  const convertedLeads = leads.filter((l) => l.status === "CONVERTED").length;
  const contactedLeads = leads.filter((l) => l.status === "CONTACTED").length;
  const cancelledLeads = leads.filter((l) => l.status === "CANCELLED").length;
  const rescheduledLeads = leads.filter((l) => l.status === "RESCHEDULED").length;

  return (
    <div className="min-h-screen bg-gray-50 p-3 sm:p-4 md:p-6">

      {/* ── Live Toast Notifications ── */}
      <Toast
        notifications={toasts}
        onDismiss={(id) => setToasts((prev) => prev.filter((t) => t.id !== id))}
        onNavigate={handleNotificationNavigate}
      />

      {/* ── Header with Bell ── */}
      <div className="flex items-center justify-between mb-6 gap-3">
        <h1 className="text-lg sm:text-xl md:text-2xl font-bold truncate">CRM Dashboard</h1>
        <NotificationBell onNavigate={handleNotificationNavigate} />
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3 md:gap-4 mb-6">
        <StatCard title="Total" value={totalLeads} />
        <StatCard title="New" value={newLeads} />
        <StatCard title="Converted" value={convertedLeads} />
        <StatCard title="Contacted" value={contactedLeads} />
        <StatCard title="Cancelled" value={cancelledLeads} />
        <StatCard title="Rescheduled" value={rescheduledLeads} />
      </div>

      {/* ── Filter ── */}
      <div className="mb-4 flex flex-col sm:flex-row gap-2 sm:items-center">
        <label className="text-sm font-medium text-gray-700 sm:hidden">Filter:</label>
        <select
          className="border border-gray-300 p-2 rounded text-sm w-full sm:w-64"
          value={statusFilter}
          onChange={(e) => { setPage(0); setStatusFilter(e.target.value); }}
        >
          <option value="">All Status</option>
          <option value="NEW">New</option>
          <option value="CONTACTED">Contacted</option>
          <option value="CONVERTED">Converted</option>
          <option value="CANCELLED">Cancelled</option>
          <option value="RESCHEDULED">Rescheduled</option>
        </select>
      </div>

      {error && <div className="mb-4 text-red-600 text-sm">{error}</div>}

      {/* ── MOBILE VIEW ── */}
      <div className="lg:hidden space-y-3">
        {leads.map((lead) => {
          const statusColor = {
            NEW: "bg-blue-100 text-blue-800",
            CONTACTED: "bg-purple-100 text-purple-800",
            RESCHEDULED: "bg-orange-100 text-orange-800",
            CANCELLED: "bg-red-100 text-red-800",
            CONVERTED: "bg-green-100 text-green-800",
          }[lead.status] || "bg-gray-100 text-gray-800";

          return (
            <div
              key={lead.id}
              ref={(el) => { if (el) leadRefs.current[lead.id] = el; }}
              className={`bg-white p-4 rounded-lg shadow-sm border-l-4 transition-all ${
                String(highlightedLeadId) === String(lead.id)
                  ? "border-green-500 ring-2 ring-green-200"
                  : "border-gray-200"
              }`}
            >
              {/* Name and Status Badge */}
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-base truncate">{lead.name}</div>
                  <div className="text-xs text-gray-500 truncate">{lead.phoneNumber}</div>
                </div>
                <span className={`px-2 py-1 rounded text-xs font-medium whitespace-nowrap ${statusColor}`}>
                  {lead.status}
                </span>
              </div>

              {/* Product and Location */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3 text-xs">
                <div>
                  <div className="text-gray-500">Product</div>
                  <div className="font-medium truncate">{lead.formName}</div>
                </div>
                <div>
                  <div className="text-gray-500">Location</div>
                  <div className="font-medium truncate">{lead.location}</div>
                </div>
                <div>
                  <div className="text-gray-500">Extra Details</div>
                  <div className="font-medium truncate">{lead.additionalInfo}</div>
                </div>
                <div className="sm:col-span-2">
                  <div className="text-gray-500">Customer Notes</div>
                  <textarea
                    rows={3}
                    value={noteEdits[lead.id] ?? lead.customerNotes ?? lead.notes ?? ""}
                    onFocus={() => setFocusedNoteId(lead.id)}
                    onBlur={() => setTimeout(() => setFocusedNoteId((prev) => (prev === lead.id ? null : prev)), 100)}
                    onChange={(e) =>
                      setNoteEdits((prev) => ({ ...prev, [lead.id]: e.target.value }))
                    }
                    className="w-full border rounded p-2 text-sm"
                    placeholder="Add customer notes here"
                  />
                  {(focusedNoteId === lead.id || noteEdits[lead.id] !== undefined) && (
                    <button
                      onClick={async () => {
                        const notes = noteEdits[lead.id] ?? lead.customerNotes ?? lead.notes ?? "";
                        try {
                          await api.patch(`/api/v1/leads/${lead.id}`, { notes: notes || null });
                          setNoteEdits((prev) => {
                            const next = { ...prev };
                            delete next[lead.id];
                            return next;
                          });
                          setFocusedNoteId(null);
                          fetchLeads();
                        } catch (err) {
                          console.error("Failed to save notes", err);
                          alert("Failed to save notes");
                        }
                      }}
                      className="mt-2 w-full bg-blue-600 text-white py-2 rounded text-sm hover:bg-blue-700"
                    >
                      Save Notes
                    </button>
                  )}
                </div>
              </div>

              {/* Timestamp */}
              <div className="text-xs text-gray-400 mb-3">{formatDateTime(lead.created)}</div>

              {/* Follow-up date picker — only shown when RESCHEDULED */}
              {lead.status === "RESCHEDULED" && lead.followUpAt && (
                <div className="mb-3 p-2 bg-orange-50 rounded text-xs border border-orange-200">
                  <div className="text-gray-600 font-medium">Follow-up: {formatDateTime(lead.followUpAt)}</div>
                </div>
              )}

              {/* Status and Date Actions */}
              <div className="space-y-2">
                <div>
                  <label className="text-xs font-medium text-gray-700 block mb-1">Update Status</label>
                  <select
                    value={lead.status}
                    onChange={(e) => {
                      const newStatus = e.target.value;
                      if (newStatus === "RESCHEDULED") {
                        // Just mark in local state — date picker will appear
                        setFollowUps((prev) => ({
                          ...prev,
                          [lead.id]: prev[lead.id] || "",
                        }));
                      } else {
                        updateLeadStatus(lead.id, newStatus);
                      }
                    }}
                    className="border border-gray-300 rounded px-2 py-1.5 w-full text-sm"
                  >
                    <option value="NEW">NEW</option>
                    <option value="CONTACTED">CONTACTED</option>
                    <option value="RESCHEDULED">RESCHEDULED</option>
                    <option value="CANCELLED">CANCELLED</option>
                    <option value="CONVERTED">CONVERTED</option>
                  </select>
                </div>

                {/* Date picker appears only when RESCHEDULED is selected */}
                {(lead.status === "RESCHEDULED" || followUps[lead.id] !== undefined) && (
                  <div>
                    <label className="text-xs font-medium text-gray-700 block mb-1">
                      Follow-up Date & Time
                    </label>
                    <input
                      type="datetime-local"
                      value={followUps[lead.id] || ""}
                      min={new Date().toISOString().slice(0, 16)}
                      onChange={(e) =>
                        setFollowUps((prev) => ({ ...prev, [lead.id]: e.target.value }))
                      }
                      className="border border-gray-300 rounded px-2 py-1.5 w-full text-sm"
                    />
                    {followUps[lead.id] && (
                      <button
                        onClick={() => updateLeadStatus(lead.id, "RESCHEDULED")}
                        className="mt-1.5 w-full bg-blue-600 text-white py-1.5 rounded text-sm font-medium hover:bg-blue-700"
                      >
                        Save Follow-up
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Convert Button */}
              {lead.status !== "CONVERTED" && (
                <button
                  onClick={() => openConvertModal(lead)}
                  className="mt-3 w-full bg-green-600 text-white py-2 rounded font-medium hover:bg-green-700 transition-colors"
                >
                  Convert to Order
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* ── DESKTOP TABLE ── */}
      <div className="hidden lg:block bg-white rounded-lg shadow-sm overflow-x-auto border border-gray-200">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3 text-left">Name</th>
              <th className="p-3 text-left">Phone</th>
              <th className="p-3 text-left">Product</th>
              <th className="p-3 text-left">Location</th>
              <th className="p-3 text-left">Extra Details</th>
              <th className="p-3 text-left">Notes</th>
              <th className="p-3 text-left">Status</th>
              <th className="p-3 text-left">Follow-up Date</th>
              <th className="p-3 text-left">Timestamp</th>
              <th className="p-3 text-left">Action</th>
            </tr>
          </thead>
          <tbody>
            {leads.map((lead) => (
              <tr
              key={lead.id}
              ref={(el) => { if (el) leadRefs.current[lead.id] = el; }}
              className={`border-t hover:bg-gray-50 ${String(highlightedLeadId) === String(lead.id) ? "bg-green-50" : ""}`}
            >
                <td className="p-3">{lead.name}</td>
                <td className="p-3">{lead.phoneNumber}</td>
                <td className="p-3">{lead.formName}</td>
                <td className="p-3">{lead.location}</td>
                <td className="p-3">{lead.additionalInfo || "—"}</td>
                <td className="p-3">
                  <textarea
                    rows={2}
                    value={noteEdits[lead.id] ?? lead.customerNotes ?? lead.notes ?? ""}
                    onFocus={() => setFocusedNoteId(lead.id)}
                    onBlur={() => setTimeout(() => setFocusedNoteId((prev) => (prev === lead.id ? null : prev)), 100)}
                    onChange={(e) =>
                      setNoteEdits((prev) => ({ ...prev, [lead.id]: e.target.value }))
                    }
                    className="w-full border rounded p-1 text-sm"
                    placeholder="Add notes..."
                  />
                  {(focusedNoteId === lead.id || noteEdits[lead.id] !== undefined) && (
                    <button
                      onClick={async () => {
                        const notes = noteEdits[lead.id] ?? lead.customerNotes ?? lead.notes ?? "";
                        try {
                          await api.patch(`/api/v1/leads/${lead.id}`, { notes: notes || null });
                          setNoteEdits((prev) => {
                            const next = { ...prev };
                            delete next[lead.id];
                            return next;
                          });
                          setFocusedNoteId(null);
                          fetchLeads();
                        } catch (err) {
                          console.error("Failed to save notes", err);
                          alert("Failed to save notes");
                        }
                      }}
                      className="mt-2 bg-blue-600 text-white px-3 py-1 rounded text-xs hover:bg-blue-700"
                    >
                      Save
                    </button>
                  )}
                </td>

                <td className="p-3">
                  <select
                    value={lead.status}
                    onChange={(e) => {
                      const newStatus = e.target.value;
                      if (newStatus === "RESCHEDULED") {
                        // Just mark in local state — date picker will appear
                        setFollowUps((prev) => ({
                          ...prev,
                          [lead.id]: prev[lead.id] || "",
                        }));
                      } else {
                        updateLeadStatus(lead.id, newStatus);
                      }
                    }}
                    className="border rounded px-2 py-1 text-sm"
                  >
                    <option value="NEW">NEW</option>
                    <option value="CONTACTED">CONTACTED</option>
                    <option value="RESCHEDULED">RESCHEDULED</option>
                    <option value="CANCELLED">CANCELLED</option>
                    <option value="CONVERTED">CONVERTED</option>
                  </select>
                </td>

                {/* Follow-up date column */}
                <td className="p-3 min-w-[220px]">
                  {lead.status === "RESCHEDULED" || followUps[lead.id] !== undefined ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="datetime-local"
                        value={followUps[lead.id] ?? (lead.followUpAt ? lead.followUpAt.slice(0, 16) : "")}
                        min={new Date().toISOString().slice(0, 16)}
                        onChange={(e) =>
                          setFollowUps((prev) => ({ ...prev, [lead.id]: e.target.value }))
                        }
                        className="border rounded p-1 text-xs"
                      />
                      {followUps[lead.id] && (
                        <button
                          onClick={() => updateLeadStatus(lead.id, "RESCHEDULED")}
                          className="bg-blue-600 text-white px-2 py-1 rounded text-xs whitespace-nowrap hover:bg-blue-700"
                        >
                          Save
                        </button>
                      )}
                    </div>
                  ) : (
                    <span className="text-gray-400 text-xs">
                      {lead.followUpAt ? formatDateTime(lead.followUpAt) : "—"}
                    </span>
                  )}
                </td>

                <td className="p-3">{formatDateTime(lead.created)}</td>

                <td className="p-3">
                  {lead.status !== "CONVERTED" && (
                    <button
                      onClick={() => openConvertModal(lead)}
                      className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
                    >
                      Convert
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── PAGINATION ── */}
      {pageData && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-6">
          <button
            disabled={page === 0}
            onClick={() => setPage(page - 1)}
            className="w-full sm:w-auto px-4 py-2 bg-gray-200 rounded disabled:opacity-50 hover:bg-gray-300 transition-colors text-sm"
          >
            ← Previous
          </button>
          <div className="text-sm font-medium text-gray-700">
            Page <span className="font-bold">{page + 1}</span> of <span className="font-bold">{pageData.totalPages}</span>
          </div>
          <button
            disabled={page + 1 >= pageData.totalPages}
            onClick={() => setPage(page + 1)}
            className="w-full sm:w-auto px-4 py-2 bg-gray-200 rounded disabled:opacity-50 hover:bg-gray-300 transition-colors text-sm"
          >
            Next →
          </button>
        </div>
      )}

      {/* ── CONVERT MODAL ── */}
      {selectedLead && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-50 p-3 sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-lg shadow-2xl w-full max-w-sm p-5 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold mb-4">Convert Lead</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-600">Customer</label>
                <div className="font-semibold">{selectedLead.name}</div>
              </div>
              <div>
                <label className="text-sm text-gray-600">Product</label>
                <div>{selectedLead.formName}</div>
              </div>
              <div>
                <label className="text-sm text-gray-600">Unit Price</label>
                <div className="font-medium">
                  {productPrice > 0
                    ? `KES ${Number(productPrice).toLocaleString()}`
                    : <span className="text-gray-400 text-sm">Loading...</span>}
                </div>
              </div>
              <div>
                <label className="text-sm text-gray-600">Quantity</label>
                <input type="number" min="1" value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="w-full border rounded p-2 mt-1" />
              </div>
              <div>
                <label className="text-sm text-gray-600">Delivery Fee</label>
                <input type="number" min="0" value={deliveryFee}
                  onChange={(e) => setDeliveryFee(e.target.value)}
                  className="w-full border rounded p-2 mt-1" />
              </div>
              <div>
                <label className="text-sm text-gray-600">Discount</label>
                <input type="number" min="0" value={discount}
                  onChange={(e) => setDiscount(e.target.value)}
                  className="w-full border rounded p-2 mt-1" />
              </div>
              <div>
                <label className="text-sm text-gray-600">Customer Notes</label>
                <textarea
                  value={customerNotes}
                  onChange={(e) => setCustomerNotes(e.target.value)}
                  rows={4}
                  className="w-full border rounded p-2 mt-1 resize-none"
                  placeholder="Add what the customer said..."
                />
              </div>
              <div>
                <label className="text-sm text-gray-600">
                  Total ({safeQuantity} × KES {Number(productPrice).toLocaleString()} + KES {Number(safeDeliveryFee).toLocaleString()} delivery − KES {Number(safeDiscount).toLocaleString()} discount)
                </label>
                <div className="text-lg font-bold text-green-600">
                  KES {totalAmount.toLocaleString()}
                </div>
              </div>
              <div>
                <label className="text-sm text-gray-600">Delivery Location</label>
                <input type="text" value={deliveryCity}
                  onChange={(e) => setDeliveryCity(e.target.value)}
                  className="w-full border rounded p-2 mt-1" />
              </div>
            </div>
            <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 mt-6">
              <button onClick={() => setSelectedLead(null)}
                className="px-4 py-2 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-colors">
                Cancel
              </button>
              <button onClick={convertLead}
                disabled={converting || productPrice === 0}
                className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium disabled:opacity-50 hover:bg-green-700 transition-colors">
                {converting ? "Converting..." : "Confirm Convert"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

// ─── Helpers ───────────────────────────────────────────────────────────────────
function StatCard({ title, value }) {
  return (
    <div className="bg-white p-3 sm:p-4 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
      <div className="text-gray-500 text-xs sm:text-sm font-medium">{title}</div>
      <div className="text-lg sm:text-2xl font-bold text-gray-900 mt-1">{value}</div>
    </div>
  );
}

const formatDateTime = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  return `${date.toLocaleDateString("en-CA")} ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
};
