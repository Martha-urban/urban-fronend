import React from "react";
import { NavLink } from "react-router-dom";

export default function Sidebar() {
  const linkClass = ({ isActive }) =>
    `block px-4 py-3 rounded-xl transition font-medium
     ${
       isActive
         ? "bg-white/10 text-white"
         : "text-white/80 hover:bg-white/5"
     }`;

  return (
    <aside className="w-[260px] h-full bg-slate-800 text-white flex flex-col">
      {/* Brand */}
      <div className="px-6 py-5 font-bold tracking-wide text-lg border-b border-white/10">
        URBAN TRENDS
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-2">
        <NavLink to="/dashboard" className={linkClass}>
          Dashboard
        </NavLink>

        <NavLink to="/orders" className={linkClass}>
          Orders
        </NavLink>
        <NavLink to="/categories" className={linkClass}>
          Categories
        </NavLink>
        <NavLink to="/products" className={linkClass}>
          Products
        </NavLink>        
        <NavLink to="/payments" className={linkClass}>
          Payments
        </NavLink>

        <NavLink to="/inventory" className={linkClass}>
          Inventory
        </NavLink>

        <NavLink to="/staff" className={linkClass}>
          Staff
        </NavLink>

        <NavLink to="/staff-logs" className={linkClass}>
          Staff Logs
        </NavLink>
        
      </nav>
    </aside>
  );
}
