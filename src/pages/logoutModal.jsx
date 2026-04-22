import { useState } from "react";
import { api } from "../api/api";
import { useNavigate } from "react-router-dom";

export default function LogoutModal({ isOpen, onClose }) {
  const navigate = useNavigate();

  const [ordersDone, setOrdersDone] = useState(true);
  const [ordersReason, setOrdersReason] = useState("");

  const [parcelsDone, setParcelsDone] = useState(true);
  const [parcelsReason, setParcelsReason] = useState("");

  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    // ✅ validation
    if (!ordersDone && !ordersReason.trim()) {
      return alert("Please provide reason for orders");
    }

    if (!parcelsDone && !parcelsReason.trim()) {
      return alert("Please provide reason for parcels");
    }

    try {
      setLoading(true);

      // 1. logout-check
      await api.post("/api/v1/auth/logout-check", {
        ordersDone,
        ordersReason: ordersDone ? null : ordersReason,
        parcelsDone,
        parcelsReason: parcelsDone ? null : parcelsReason,
        notes,
      });

      // 2. logout
      await api.post("/api/v1/auth/logout");

      // 3. clear storage (CONSISTENT)
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("otp_email");

      // 4. redirect
      navigate("/login");
    } catch (error) {
      console.error(error);
      alert("Logout failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white w-[400px] rounded-xl p-6 space-y-4">
        <h2 className="text-lg font-semibold">Logout Checklist</h2>

        {/* Orders */}
        <div>
          <p className="font-medium">Were all orders made?</p>
          <div className="flex gap-4">
            <label>
              <input
                type="radio"
                checked={ordersDone === true}
                onChange={() => setOrdersDone(true)}
              />{" "}
              Yes
            </label>
            <label>
              <input
                type="radio"
                checked={ordersDone === false}
                onChange={() => setOrdersDone(false)}
              />{" "}
              No
            </label>
          </div>

          {!ordersDone && (
            <input
              className="mt-2 w-full border p-2 rounded"
              placeholder="Why not?"
              value={ordersReason}
              onChange={(e) => setOrdersReason(e.target.value)}
            />
          )}
        </div>

        {/* Parcels */}
        <div>
          <p className="font-medium">Were all parcels dispatched?</p>
          <div className="flex gap-4">
            <label>
              <input
                type="radio"
                checked={parcelsDone === true}
                onChange={() => setParcelsDone(true)}
              />{" "}
              Yes
            </label>
            <label>
              <input
                type="radio"
                checked={parcelsDone === false}
                onChange={() => setParcelsDone(false)}
              />{" "}
              No
            </label>
          </div>

          {!parcelsDone && (
            <input
              className="mt-2 w-full border p-2 rounded"
              placeholder="Why not?"
              value={parcelsReason}
              onChange={(e) => setParcelsReason(e.target.value)}
            />
          )}
        </div>

        {/* Notes */}
        <div>
          <p className="font-medium">Anything worth noting?</p>
          <textarea
            className="w-full border p-2 rounded"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded bg-gray-200"
          >
            Cancel
          </button>

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-4 py-2 rounded bg-red-600 text-white"
          >
            {loading ? "Submitting..." : "Submit & Logout"}
          </button>
        </div>
      </div>
    </div>
  );
}