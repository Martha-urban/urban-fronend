import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import AppLayout from "./layout/AppLayout";
import Dashboard from "./pages/Dashboard";
import Orders from "./pages/Orders";
import Inventory from "./pages/Inventory";
import StaffLogs from "./pages/StaffLogs";
import Payment from "./pages/Payment";
import Staff from "./pages/Staff";
import Requisition from "./pages/Requisition";
import RequisitionList from "./pages/RequisitionList";
import Login from "./pages/Login";
import OTPVerification from "./pages/OTPVerification";
import Category from "./pages/Category";
import Product from "./pages/Product";
import Expenses from "./pages/Expense";
import StaffDetails from "./pages/StaffDetails";
import CRM from "./pages/crm";

/* Protect private routes */
function PrivateRoute({ children }) {
  const token = localStorage.getItem("accessToken");

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

/* Prevent logged-in users from seeing login */
function PublicRoute({ children }) {
  const token = localStorage.getItem("accessToken");

  if (token) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

export default function App() {

  const token = localStorage.getItem("accessToken");

  return (
    <Routes>

      {/* Root route decides where to go */}
      <Route
        path="/"
        element={
          token
            ? <Navigate to="/dashboard" replace />
            : <Navigate to="/login" replace />
        }
      />

      {/* Public */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />
      <Route
        path="/verify-otp"
        element={
          <PublicRoute>
            <OTPVerification />
          </PublicRoute>
        }
      />

      {/* Protected */}
      <Route
        element={
          <PrivateRoute>
            <AppLayout />
          </PrivateRoute>
        }
      >
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/crm" element={<CRM />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="/requisitions" element={<RequisitionList />} />
        <Route path="/requisitions/new" element={<Requisition />} />
        <Route path="/categories" element={<Category />} />
        <Route path="/products" element={<Product />} />
        <Route path="/payments" element={<Payment />} />
        <Route path="/expenses" element={<Expenses />} />
        <Route path="/inventory" element={<Inventory />} />
        <Route path="/staff" element={<Staff />} />
        <Route path="/staff/:id" element={<StaffDetails />} />
        <Route path="/staff-details" element={<StaffDetails />} />
        <Route path="/staff-logs" element={<StaffLogs />} />
      </Route>

      {/* Catch everything */}
      <Route path="*" element={<Navigate to="/" replace />} />

    </Routes>
  );
}