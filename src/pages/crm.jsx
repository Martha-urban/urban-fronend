import React, { useEffect, useState } from "react";
import { api } from "../api/api";

export default function CRM() {
  const [leads, setLeads] = useState([]);
  const [pageData, setPageData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(0);
  const [error, setError] = useState("");

  const size = 10;

  useEffect(() => {
    fetchLeads();
  }, [page, statusFilter]);

  const fetchLeads = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await api.get("/api/v1/leads", {
        params: {
          page,
          size,
          status: statusFilter || undefined,
        },
      });

      setLeads(res.data.content);
      setPageData(res.data);
    } catch (err) {
      console.error("Error fetching leads", err);
      setError("Failed to load leads");
    } finally {
      setLoading(false);
    }
  };

  const convertLead = async (id) => {
    try {
      await api.post(`/api/v1/leads/${id}/convert`);
      fetchLeads();
    } catch (err) {
      console.error("Conversion failed", err);
      alert("Conversion failed");
    }
  };

  const totalLeads = pageData?.totalElements || 0;
  const newLeads = leads.filter(l => l.status === "NEW").length;
  const convertedLeads = leads.filter(l => l.status === "CONVERTED").length;
  const contactedLeads = leads.filter(l => l.status === "CONTACTED").length;

  return (
    <div className="p-4 md:p-6">
      <h1 className="text-xl md:text-2xl font-bold mb-6">
        CRM Dashboard
      </h1>

      {/* Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard title="Total Leads" value={totalLeads} />
        <StatCard title="New" value={newLeads} />
        <StatCard title="Converted" value={convertedLeads} />
        <StatCard title="Contacted" value={contactedLeads} />
      </div>

      {/* Filter */}
      <div className="mb-4 flex flex-col sm:flex-row gap-3 sm:items-center">
        <select
          className="border p-2 rounded w-full sm:w-60"
          value={statusFilter}
          onChange={(e) => {
            setPage(0);
            setStatusFilter(e.target.value);
          }}
        >
          <option value="">All</option>
          <option value="NEW">New</option>
          <option value="CONTACTED">Contacted</option>
          <option value="CONVERTED">Converted</option>
        </select>
      </div>

      {error && (
        <div className="mb-4 text-red-600 text-sm">
          {error}
        </div>
      )}


      {/* Desktop Table */}
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
                  <StatusBadge status={lead.status} />
                </td>
                <td className="p-3">
                {formatDateTime(lead.created)}
                </td>
                <td className="p-3">
                  {lead.status !== "CONVERTED" && (
                    <button
                      onClick={() => convertLead(lead.id)}
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

      {/* Mobile Cards */}
      <div className="md:hidden space-y-4">
        {leads.map((lead) => (
          <div
            key={lead.id}
            className="bg-white rounded shadow p-4 space-y-2"
          >
            <div className="font-semibold text-base">
              {lead.name}
            </div>
            <div className="text-sm text-gray-600">
              📞 {lead.phoneNumber}
            </div>
            <div className="text-sm text-gray-600">
              🛍 {lead.formName}
            </div>
            <div className="text-sm text-gray-600">
              📍 {lead.location}
            </div>
            <StatusBadge status={lead.status} />

            {lead.status !== "CONVERTED" && (
              <button
                onClick={() => convertLead(lead.id)}
                className="w-full mt-2 bg-green-600 text-white py-2 rounded hover:bg-green-700"
              >
                Convert
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Pagination */}
      {pageData && (
        <div className="flex justify-between items-center mt-6 text-sm">
          <button
            disabled={pageData.first}
            onClick={() => setPage(p => p - 1)}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            Previous
          </button>

          <span>
            Page {pageData.number + 1} of {pageData.totalPages}
          </span>

          <button
            disabled={pageData.last}
            onClick={() => setPage(p => p + 1)}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}

      {loading && (
        <div className="mt-4 text-center text-gray-500">
          Loading...
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

function StatusBadge({ status }) {
  const colors = {
    NEW: "bg-blue-100 text-blue-600",
    CONTACTED: "bg-yellow-100 text-yellow-600",
    CONVERTED: "bg-green-100 text-green-600",
  };

  return (
    <span
      className={`px-2 py-1 rounded text-xs font-medium ${colors[status] || "bg-gray-100 text-gray-600"}`}
    >
      {status}
    </span>
  );
}

const formatDateTime = (dateString) => {
  if (!dateString) return "";

  const date = new Date(dateString);

  const formattedDate = date.toLocaleDateString("en-CA"); // YYYY-MM-DD
  const formattedTime = date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  return `${formattedDate} ${formattedTime}`;
};