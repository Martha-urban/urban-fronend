import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginUser } from "../api/authApi";

export default function Login() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleLogin(e) {
    e.preventDefault();
    setError("");

    if (!form.email || !form.password) {
      setError("Please enter email and password.");
      return;
    }

    try {
      setLoading(true);

      // Backend call
      const data = await loginUser({
        email: form.email,
        password: form.password,
      });

      // Store email for OTP
      localStorage.setItem("otp_email", form.email);

      // Redirect to OTP verification
      navigate("/verify-otp");
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data ||
        "Login failed. Check your credentials.";

      setError(typeof msg === "string" ? msg : "Login failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        background: "#f3f4f6",
        padding: 16,
      }}
    >
      <div
        style={{
          width: "460px",
          maxWidth: "95vw",
          background: "#fff",
          borderRadius: 18,
          border: "1px solid #e5e7eb",
          padding: 22,
          boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
        }}
      >
        {/* Title */}
        <div style={{ marginBottom: 18 }}>
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 900 }}>
            URBAN TRENDS
          </h2>
          <p style={{ margin: "6px 0 0", color: "#6b7280" }}>
            Login to access your POS dashboard
          </p>
        </div>

        {/* Error */}
        {error && (
          <div
            style={{
              background: "#ffe4e6",
              color: "#9f1239",
              border: "1px solid #fecdd3",
              padding: "10px 12px",
              borderRadius: 12,
              marginBottom: 14,
              fontWeight: 700,
            }}
          >
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleLogin} style={{ display: "grid", gap: 12 }}>
          <div>
            <label style={labelStyle}>Email</label>
            <input
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="Enter email"
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>Password</label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="Enter password"
              style={inputStyle}
            />
          </div>

          <button
            disabled={loading}
            type="submit"
            style={{
              background: loading ? "#9ca3af" : "#2c3244",
              color: "#fff",
              border: "none",
              padding: "12px 14px",
              borderRadius: 12,
              fontWeight: 900,
              cursor: loading ? "not-allowed" : "pointer",
              marginTop: 6,
            }}
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
}

const inputStyle = {
  width: "100%",
  border: "1px solid #e5e7eb",
  borderRadius: 12,
  padding: "12px 12px",
  outline: "none",
};

const labelStyle = {
  display: "block",
  marginBottom: 6,
  fontSize: 13,
  fontWeight: 800,
  color: "#374151",
};
