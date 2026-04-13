import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createRequisition } from "../api/requisitionApi";

const REQUISITION_TYPES = [
  { value: "SHOP_OPERATIONAL", label: "Shop Operational" },
  { value: "SALARY_ADVANCE", label: "Salary Advance" },
];

export default function Requisition() {
  const navigate = useNavigate();
  const [type, setType] = useState(REQUISITION_TYPES[0].value);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [amountRequested, setAmountRequested] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!title || !description || !amountRequested) {
      setError("Please fill all fields before submitting.");
      return;
    }

    const amount = Number(amountRequested);
    if (!amount || amount <= 0) {
      setError("Enter a valid amount.");
      return;
    }

    try {
      setLoading(true);
      await createRequisition({
        requisitionType: type,
        title,
        description,
        amountRequested: amount,
      });
      setSuccess("Requisition created successfully.");
      setTitle("");
      setDescription("");
      setAmountRequested("");
    } catch (err) {
      console.log(err);
      const msg =
        err?.response?.data?.message ||
        err?.response?.data ||
        "Failed to create requisition.";
      setError(typeof msg === "string" ? msg : "Failed to create requisition.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="requisition-page">
      <style>{`
        .requisition-page {
          padding: 22px;
          max-width: 920px;
          margin: 0 auto;
        }

        .requisition-card {
          background: #ffffff;
          border: 1px solid #e5e7eb;
          border-radius: 18px;
          padding: 32px;
          box-shadow: 0 18px 45px rgba(15, 23, 42, 0.08);
        }

        .requisition-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 16px;
          margin-bottom: 24px;
          flex-wrap: wrap;
        }

        .requisition-header h2 {
          margin: 0;
          font-size: 28px;
        }

        .requisition-header p {
          margin: 6px 0 0;
          color: #6b7280;
          max-width: 560px;
        }

        .requisition-form {
          display: grid;
          gap: 18px;
        }

        .field-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 18px;
          align-items: flex-start;
        }

        .field-row > div {
          min-width: 0;
        }

        .form-actions {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
          margin-top: 6px;
        }

        .full-width-button {
          width: auto;
        }

        @media (max-width: 768px) {
          .requisition-page {
            padding: 16px;
          }

          .requisition-card {
            padding: 20px;
          }

          .requisition-header {
            flex-direction: column;
            align-items: stretch;
          }

          .requisition-header h2 {
            font-size: 24px;
          }

          .requisition-header p {
            max-width: 100%;
          }

          .field-row {
            grid-template-columns: 1fr;
          }

          .form-actions {
            flex-direction: column;
          }

          .full-width-button {
            width: 100%;
          }
        }
      `}</style>

      <div className="requisition-header">
        <div>
          <h2>Create Requisition</h2>
          <p>
            Submit a new requisition request for approval. Once approved, finance can mark it
            paid and the backend will create the matching expense or salary advance.
          </p>
        </div>
      </div>

      <div className="requisition-card">
        {error && (
          <div style={alertError}>
            {error}
          </div>
        )}

        {success && (
          <div style={alertSuccess}>
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="requisition-form">
          <div className="field-row">
            <div>
              <label style={labelStyle}>Requisition Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                style={inputStyle}
              >
                {REQUISITION_TYPES.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={labelStyle}>Amount Requested</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={amountRequested}
                onChange={(e) => setAmountRequested(e.target.value)}
                placeholder="Enter amount"
                style={inputStyle}
              />
            </div>
          </div>

          <div>
            <label style={labelStyle}>Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Short title for the requisition"
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe why this requisition is needed"
              style={{
                ...inputStyle,
                minHeight: 140,
                resize: "vertical",
              }}
            />
          </div>

          <div className="form-actions">
            <button type="submit" disabled={loading} style={{ ...submitBtn, ...buttonWide }} className="full-width-button">
              {loading ? "Saving..." : "Create Requisition"}
            </button>
            <button
              type="button"
              onClick={() => navigate(-1)}
              style={{ ...secondaryBtn, ...buttonWide }}
              className="full-width-button"
            >
              Back
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const labelStyle = {
  display: "block",
  marginBottom: 8,
  fontWeight: 700,
  color: "#111827",
};

const inputStyle = {
  width: "100%",
  padding: "14px 16px",
  borderRadius: 14,
  border: "1px solid #d1d5db",
  outline: "none",
  fontFamily: "inherit",
  fontSize: 15,
  background: "#f9fafb",
};

const submitBtn = {
  border: "none",
  background: "#1e40af",
  color: "#fff",
  padding: "14px 18px",
  borderRadius: 14,
  cursor: "pointer",
  fontWeight: 900,
  fontSize: 15,
};

const secondaryBtn = {
  border: "1px solid #e5e7eb",
  background: "#fff",
  color: "#111827",
  padding: "14px 18px",
  borderRadius: 14,
  cursor: "pointer",
  fontWeight: 900,
  fontSize: 15,
};

const buttonWide = {
  minWidth: 160,
};

const alertBase = {
  borderRadius: 12,
  padding: "14px 16px",
  marginBottom: 18,
  fontWeight: 700,
};

const alertError = {
  ...alertBase,
  background: "#fee2e2",
  color: "#991b1b",
};

const alertSuccess = {
  ...alertBase,
  background: "#d1fae5",
  color: "#065f46",
};
