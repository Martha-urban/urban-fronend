import React, { useEffect, useMemo, useState } from "react";
import { api } from "../api/api";

export default function Expenses() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // list
  const [expenses, setExpenses] = useState([]);

  // modal
  const [isAddOpen, setIsAddOpen] = useState(false);

  // form (matches backend)
  const [form, setForm] = useState({
    expenseType: "OTHER",
    amount: "",
    description: "",
    paymentMethod: "CASH",
    referenceCode: "",
  });

  const totalExpenses = useMemo(() => {
    return expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
  }, [expenses]);

  useEffect(() => {
    loadExpenses();
    // eslint-disable-next-line
  }, []);

  async function loadExpenses() {
    try {
      setLoading(true);
      setError("");

      // If your backend has pagination, update this
      const res = await api.get("/api/v1/expenses", {
        params: { page: 0, size: 200, sort: "createdAt,desc" },
      });

      // supports both Page and List response
      const data = res.data?.content || res.data || [];
      setExpenses(data);
    } catch (e) {
      console.log(e);
      setError("Failed to load expenses.");
    } finally {
      setLoading(false);
    }
  }

  async function addExpense() {
    try {
      setLoading(true);
      setError("");

      if (!form.amount || Number(form.amount) <= 0) {
        setError("Amount must be greater than 0.");
        return;
      }

      await api.post("/api/v1/expenses", {
        expenseType: form.expenseType,
        amount: Number(form.amount),
        description: form.description,
        paymentMethod: form.paymentMethod,
        referenceCode: form.referenceCode,
      });

      setIsAddOpen(false);

      setForm({
        expenseType: "OTHER",
        amount: "",
        description: "",
        paymentMethod: "CASH",
        referenceCode: "",
      });

      await loadExpenses();
    } catch (e) {
      console.log(e);
      setError("Failed to add expense.");
    } finally {
      setLoading(false);
    }
  }

  function money(value) {
    return `KES ${Number(value || 0).toLocaleString()}`;
  }

  return (
    <div style={{ padding: 18 }}>
      {/* Header */}
      <div style={{ marginBottom: 14 }}>
        <h2 style={{ margin: 0, fontSize: 22 }}>Expenses</h2>
        <p style={{ margin: "6px 0 0", color: "#6b7280" }}>
          Record business expenses
        </p>
      </div>

      {/* Actions */}
      <div
        style={{
          display: "flex",
          gap: 10,
          marginBottom: 18,
          flexWrap: "wrap",
        }}
      >
        <button
          onClick={loadExpenses}
          style={{
            border: "1px solid #e5e7eb",
            background: "#111827",
            color: "#fff",
            padding: "10px 14px",
            borderRadius: 12,
            cursor: "pointer",
            fontWeight: 800,
          }}
        >
          {loading ? "Loading..." : "Refresh"}
        </button>

        <button
          onClick={() => setIsAddOpen(true)}
          style={{
            border: "1px solid #e5e7eb",
            background: "#16a34a",
            color: "#fff",
            padding: "10px 14px",
            borderRadius: 12,
            cursor: "pointer",
            fontWeight: 800,
          }}
        >
          + Add Expense
        </button>
      </div>

      {/* Error */}
      {error && (
        <div style={{ marginBottom: 12, color: "crimson" }}>{error}</div>
      )}

      {/* Total */}
      <div
        style={{
          background: "#fff",
          borderRadius: 14,
          padding: 16,
          border: "1px solid #e5e7eb",
          marginBottom: 14,
        }}
      >
        <div style={{ color: "#6b7280", fontSize: 13 }}>Total Expenses</div>
        <div style={{ fontSize: 30, fontWeight: 800 }}>
          {money(totalExpenses)}
        </div>
      </div>

      {/* Table */}
      <div
        style={{
          background: "#fff",
          borderRadius: 14,
          padding: 16,
          border: "1px solid #e5e7eb",
        }}
      >
        <h3 style={{ margin: 0, marginBottom: 14, color: "#374151" }}>
          Expenses List
        </h3>

        {loading ? (
          <div style={{ color: "#6b7280" }}>Loading...</div>
        ) : expenses.length === 0 ? (
          <div style={{ color: "#6b7280" }}>No expenses found.</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ textAlign: "left", color: "#6b7280" }}>
                  <th style={{ paddingBottom: 10 }}>Type</th>
                  <th style={{ paddingBottom: 10 }}>Amount</th>
                  <th style={{ paddingBottom: 10 }}>Payment</th>
                  <th style={{ paddingBottom: 10 }}>Reference</th>
                  <th style={{ paddingBottom: 10 }}>Description</th>
                </tr>
              </thead>

              <tbody>
                {expenses.map((e) => (
                  <tr key={e.id} style={{ borderTop: "1px solid #f3f4f6" }}>
                    <td style={{ padding: "12px 0", fontWeight: 800 }}>
                      {e.expenseType}
                    </td>

                    <td style={{ padding: "12px 0", fontWeight: 800 }}>
                      {money(e.amount)}
                    </td>

                    <td style={{ padding: "12px 0" }}>{e.paymentMethod}</td>

                    <td style={{ padding: "12px 0", color: "#6b7280" }}>
                      {e.referenceCode || "-"}
                    </td>

                    <td style={{ padding: "12px 0", color: "#6b7280" }}>
                      {e.description || "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Expense Modal */}
      {isAddOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.4)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            padding: 14,
            zIndex: 9999,
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: 520,
              background: "#fff",
              borderRadius: 16,
              padding: 18,
              border: "1px solid #e5e7eb",
            }}
          >
            <h3 style={{ margin: 0, marginBottom: 12 }}>Add Expense</h3>

            <div style={{ display: "grid", gap: 10 }}>
              <select
                value={form.expenseType}
                onChange={(e) =>
                  setForm({ ...form, expenseType: e.target.value })
                }
                style={{
                  border: "1px solid #e5e7eb",
                  padding: "10px 12px",
                  borderRadius: 12,
                }}
              >
                <option value="RENT">RENT</option>
                <option value="SALARY">SALARY</option>
                <option value="TRANSPORT">TRANSPORT</option>
                <option value="MARKETING">MARKETING</option>
                <option value="UTILITIES">UTILITIES</option>
                <option value="SUPPLIES">SUPPLIES</option>
                <option value="PACKAGING">PACKAGING</option>
                <option value="OTHER">OTHER</option>
              </select>

              <input
                type="number"
                placeholder="Amount"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                style={{
                  border: "1px solid #e5e7eb",
                  padding: "10px 12px",
                  borderRadius: 12,
                }}
              />

              <select
                value={form.paymentMethod}
                onChange={(e) =>
                  setForm({ ...form, paymentMethod: e.target.value })
                }
                style={{
                  border: "1px solid #e5e7eb",
                  padding: "10px 12px",
                  borderRadius: 12,
                }}
              >
                <option value="CASH">CASH</option>
                <option value="MPESA">MPESA</option>
                <option value="BANK">BANK</option>
                <option value="CARD">CARD</option>
              </select>

              <input
                placeholder="Reference Code (optional)"
                value={form.referenceCode}
                onChange={(e) =>
                  setForm({ ...form, referenceCode: e.target.value })
                }
                style={{
                  border: "1px solid #e5e7eb",
                  padding: "10px 12px",
                  borderRadius: 12,
                }}
              />

              <textarea
                placeholder="Description (optional)"
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                rows={3}
                style={{
                  border: "1px solid #e5e7eb",
                  padding: "10px 12px",
                  borderRadius: 12,
                }}
              />
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: 10,
                marginTop: 14,
              }}
            >
              <button
                onClick={() => setIsAddOpen(false)}
                style={{
                  border: "1px solid #e5e7eb",
                  background: "#fff",
                  padding: "10px 14px",
                  borderRadius: 12,
                  cursor: "pointer",
                  fontWeight: 800,
                }}
              >
                Cancel
              </button>

              <button
                onClick={addExpense}
                style={{
                  border: "1px solid #e5e7eb",
                  background: "#111827",
                  color: "#fff",
                  padding: "10px 14px",
                  borderRadius: 12,
                  cursor: "pointer",
                  fontWeight: 800,
                }}
              >
                {loading ? "Saving..." : "Save Expense"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
