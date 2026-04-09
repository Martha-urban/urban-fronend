import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/api";

export default function OTPVerification() {
  const navigate = useNavigate();

  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");

  useEffect(() => {
    const savedEmail = localStorage.getItem("otp_email");
    if (!savedEmail) {
      navigate("/login");
      return;
    }
    setEmail(savedEmail);
  }, [navigate]);

  const handleVerifyOtp = async (e) => {
    if (e) e.preventDefault();
    setError("");

    if (!otp) {
      setError("Please enter the OTP.");
      return;
    }

    if (!email) {
      setError("Unable to verify OTP. Please login again.");
      return;
    }

    try {
      setLoading(true);

      const res = await api.post("/api/v1/auth/verify-otp", {
        email,
        otp,
      });

      localStorage.setItem("accessToken", res.data.accessToken);
      localStorage.setItem("refreshToken", res.data.refreshToken);
      localStorage.removeItem("otp_email");

      navigate("/dashboard");
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data ||
        "OTP verification failed.";

      setError(typeof msg === "string" ? msg : "OTP verification failed.");
    } finally {
      setLoading(false);
    }
  };

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
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 900, color: "#2c3244" }}>
            URBAN TRENDS
          </h2>
          <p style={{ margin: "6px 0 0", color: "#6b7280" }}>
            Enter the OTP sent to your SMS
          </p>
        </div>

        {/* Error Display */}
        {error && (
          <div
            style={{
              background: "#ffe4e6",
              color: "#9f1239",
              border: "1px solid #fecdd3",
              padding: "10px 12px",
              borderRadius: 12,
              marginBottom: 14,
              fontSize: "14px",
              fontWeight: 600,
            }}
          >
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleVerifyOtp} style={{ display: "grid", gap: 12 }}>
          <div>
            <label style={{ display: "block", marginBottom: 6, fontWeight: 700, fontSize: "14px" }}>
              OTP Code
            </label>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={otp}
              // Basic regex to ensure only numbers are typed
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
              placeholder="Enter 6-digit code"
              style={{
                width: "100%",
                padding: "12px",
                border: "1px solid #d1d5db",
                borderRadius: 8,
                fontSize: 16,
                boxSizing: "border-box",
                outlineColor: "#2c3244",
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              background: loading ? "#9ca3af" : "#2c3244",
              color: "#fff",
              border: "none",
              padding: "14px",
              borderRadius: 12,
              fontWeight: 900,
              cursor: loading ? "not-allowed" : "pointer",
              marginTop: 6,
              transition: "background 0.2s",
            }}
          >
            {loading ? "Verifying..." : "Verify OTP"}
          </button>
        </form>
      </div>
    </div>
  );
}