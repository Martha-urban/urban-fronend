import React, { useEffect, useState } from "react";
import { api } from "../api/api";

export default function CRM() {

  const [leads, setLeads] = useState([]);
  const [pageData, setPageData] = useState(null);

  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(0);
  const [error, setError] = useState("");
  const [followUps, setFollowUps] = useState({});

  const [selectedLead, setSelectedLead] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [deliveryCity, setDeliveryCity] = useState("");
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [converting, setConverting] = useState(false);
  const [productPrice, setProductPrice] = useState(0);         // ✅ KEEP this state

  const size = 10;

  useEffect(() => {
    fetchLeads();
  }, [page, statusFilter]);

  const fetchLeads = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await api.get("/api/v1/leads", {
        params: { page, size, status: statusFilter || undefined }
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

  const updateLeadStatus = async (leadId, status) => {
    try {
      const payload = { status };
      if (status === "RESCHEDULED") {
        payload.followUpAt = followUps[leadId];
      }
      await api.patch(`/api/v1/leads/${leadId}/status`, payload);
      fetchLeads();
    } catch (err) {
      console.error("Status update failed", err);
      alert("Failed to update lead status");
    }
  };

  // ✅ FIX 1: make async and fetch product price
  const openConvertModal = async (lead) => {
    setSelectedLead(lead);
    setQuantity(1);
    setDeliveryCity(lead.location || "");
    setDeliveryFee(0);
    setProductPrice(0);

    try {
      const res = await api.get("/api/v1/products/by-name", {
        params: { name: lead.formName }
      });
      setProductPrice(res.data.sellingPrice || 0);
    } catch (err) {
      console.error("Failed to fetch product price", err);
    }
  };

  const convertLead = async () => {
    try {
      setConverting(true);
      await api.post(`/api/v1/leads/${selectedLead.id}/convert`, {
        quantity: Number(quantity),
        deliveryCity,
        deliveryFee: Number(deliveryFee)
      });
      setSelectedLead(null);
      fetchLeads();
    } catch (err) {
      console.error(err);
      alert("Conversion failed");
    } finally {
      setConverting(false);
    }
  };

  // ✅ FIX 2: remove the duplicate `const productPrice` line that was here
  // and use the state variable instead
  const safeQuantity = Number(quantity) > 0 ? Number(quantity) : 1;
  const subtotal = safeQuantity * Number(productPrice);
  const totalAmount = subtotal + Number(deliveryFee);

  const totalLeads = pageData?.totalElements || 0;
  const newLeads = leads.filter(l => l.status === "NEW").length;
  const convertedLeads = leads.filter(l => l.status === "CONVERTED").length;
  const contactedLeads = leads.filter(l => l.status === "CONTACTED").length;
  const cancelledLeads = leads.filter(l => l.status === "CANCELLED").length;
  const rescheduledLeads = leads.filter(l => l.status === "RESCHEDULED").length;

  return (
    <div className="p-4 md:p-6">

      <h1 className="text-xl md:text-2xl font-bold mb-6">CRM Dashboard</h1>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard title="Total Leads" value={totalLeads} />
        <StatCard title="New" value={newLeads} />
        <StatCard title="Converted" value={convertedLeads} />
        <StatCard title="Contacted" value={contactedLeads} />
        <StatCard title="Cancelled" value={cancelledLeads} />
        <StatCard title="Rescheduled" value={rescheduledLeads} />
      </div>

      {/* Filter */}
      <div className="mb-4">
        <select
          className="border p-2 rounded w-full md:w-60"
          value={statusFilter}
          onChange={(e) => { setPage(0); setStatusFilter(e.target.value); }}
        >
          <option value="">All</option>
          <option value="NEW">New</option>
          <option value="CONTACTED">Contacted</option>
          <option value="CONVERTED">Converted</option>
          <option value="CANCELLED">Cancelled</option>
          <option value="RESCHEDULED">Rescheduled</option>
        </select>
      </div>

      {error && <div className="mb-4 text-red-600 text-sm">{error}</div>}

      {/* MOBILE VIEW */}
      <div className="md:hidden space-y-4">
        {leads.map((lead) => (
          <div key={lead.id} className="bg-white p-4 rounded shadow">
            <div className="font-semibold text-lg">{lead.name}</div>
            <div className="text-sm text-gray-500">{lead.phoneNumber}</div>
            <div className="text-sm mt-2">Product: {lead.formName}</div>
            <div className="text-sm">Location: {lead.location}</div>
            <div className="text-sm">{formatDateTime(lead.created)}</div>
            <div className="mt-2">
              <select
                value={lead.status}
                onChange={(e) => updateLeadStatus(lead.id, e.target.value)}
                className="border rounded px-2 py-1 w-full"
              >
                <option value="NEW">NEW</option>
                <option value="CONTACTED">CONTACTED</option>
                <option value="RESCHEDULED">RESCHEDULED</option>
                <option value="CANCELLED">CANCELLED</option>
                <option value="CONVERTED">CONVERTED</option>
              </select>
            </div>
            {lead.status !== "CONVERTED" && (
              <button
                onClick={() => openConvertModal(lead)}
                className="mt-3 w-full bg-green-600 text-white py-2 rounded"
              >
                Convert
              </button>
            )}
          </div>
        ))}
      </div>

      {/* DESKTOP TABLE */}
      <div className="hidden md:block bg-white rounded shadow overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3 text-left">Name</th>
              <th className="p-3 text-left">Phone</th>
              <th className="p-3 text-left">Product</th>
              <th className="p-3 text-left">Location</th>
              <th className="p-3 text-left">Status</th>
              <th className="p-3 text-left">Timestamp</th>
              <th className="p-3 text-left">Action</th>
            </tr>
          </thead>
          <tbody>
            {leads.map((lead) => (
              <tr key={lead.id} className="border-t hover:bg-gray-50">
                <td className="p-3">{lead.name}</td>
                <td className="p-3">{lead.phoneNumber}</td>
                <td className="p-3">{lead.formName}</td>
                <td className="p-3">{lead.location}</td>
                <td className="p-3">
                  <select
                    value={lead.status}
                    onChange={(e) => updateLeadStatus(lead.id, e.target.value)}
                    className="border rounded px-2 py-1 text-sm"
                  >
                    <option value="NEW">NEW</option>
                    <option value="CONTACTED">CONTACTED</option>
                    <option value="RESCHEDULED">RESCHEDULED</option>
                    <option value="CANCELLED">CANCELLED</option>
                    <option value="CONVERTED">CONVERTED</option>
                  </select>
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

      {/* PAGINATION */}
      {pageData && (
        <div className="flex items-center justify-between mt-6">
          <button
            disabled={page === 0}
            onClick={() => setPage(page - 1)}
            className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
          >
            Previous
          </button>
          <div className="text-sm">Page {page + 1} of {pageData.totalPages}</div>
          <button
            disabled={page + 1 >= pageData.totalPages}
            onClick={() => setPage(page + 1)}
            className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}

      {/* CONVERT MODAL */}
      {selectedLead && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6">

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

              {/* ✅ FIX 3: show unit price so user knows the price was fetched */}
              <div>
                <label className="text-sm text-gray-600">Unit Price</label>
                <div className="font-medium">
                  {productPrice > 0
                    ? `KES ${Number(productPrice).toLocaleString()}`
                    : <span className="text-gray-400 text-sm">Loading...</span>
                  }
                </div>
              </div>

              <div>
                <label className="text-sm text-gray-600">Quantity</label>
                <input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="w-full border rounded p-2 mt-1"
                />
              </div>

              <div>
                <label className="text-sm text-gray-600">Delivery Fee</label>
                <input
                  type="number"
                  min="0"
                  value={deliveryFee}
                  onChange={(e) => setDeliveryFee(e.target.value)}
                  className="w-full border rounded p-2 mt-1"
                />
              </div>

              <div>
                <label className="text-sm text-gray-600">
                  Total ({safeQuantity} × KES {Number(productPrice).toLocaleString()} + KES {Number(deliveryFee).toLocaleString()} delivery)
                </label>
                <div className="text-lg font-bold text-green-600">
                  KES {totalAmount.toLocaleString()}
                </div>
              </div>

              <div>
                <label className="text-sm text-gray-600">Delivery Location</label>
                <input
                  type="text"
                  value={deliveryCity}
                  onChange={(e) => setDeliveryCity(e.target.value)}
                  className="w-full border rounded p-2 mt-1"
                />
              </div>

            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setSelectedLead(null)}
                className="px-4 py-2 border rounded"
              >
                Cancel
              </button>
              <button
                onClick={convertLead}
                disabled={converting || productPrice === 0}
                className="px-4 py-2 bg-green-600 text-white rounded disabled:opacity-50"
              >
                {converting ? "Converting..." : "Confirm Convert"}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

function StatCard({ title, value }) {
  return (
    <div className="bg-white p-4 rounded shadow">
      <div className="text-gray-500 text-sm">{title}</div>
      <div className="text-xl font-bold">{value}</div>
    </div>
  );
}

const formatDateTime = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  const formattedDate = date.toLocaleDateString("en-CA");
  const formattedTime = date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  return `${formattedDate} ${formattedTime}`;
};