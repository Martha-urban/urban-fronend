import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import AppLayout from "./layout/AppLayout";
import Dashboard from "./pages/Dashboard";
import Orders from "./pages/Orders";
import Inventory from "./pages/Inventory";
import StaffLogs from "./pages/StaffLogs";
import Payment from "./pages/Payment";
import Staff from "./pages/Staff";
import Login from "./pages/Login";
import Category from "./pages/Category";
import Product from "./pages/Product";
import Expenses from "./pages/Expense";
import StaffDetails from "./pages/StaffDetails";
import CRM from "./pages/crm";

function PrivateRoute({ children }) {
const token = localStorage.getItem("urban_access_token");
  return token ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<Login />} />

      {/* Protected */}
      <Route
        path="/"
        element={
          <PrivateRoute>
            <AppLayout />
          </PrivateRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="crm" element={<CRM />} />
        <Route path="orders" element={<Orders />} />
        <Route path="categories" element={<Category />} />
        <Route path="products" element={<Product />} /> 
        <Route path="payments" element={<Payment />} />
        <Route path="expenses" element={<Expenses/>} />
        <Route path="inventory" element={<Inventory />} />
        <Route path="staff" element={<Staff />} />
        <Route path="/staff/:id" element={<StaffDetails />} />
        <Route path="staff-details" element={<StaffDetails />} />
        <Route path="staff-logs" element={<StaffLogs />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
