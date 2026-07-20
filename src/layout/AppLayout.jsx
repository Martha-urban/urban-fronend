import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import LogoutModal from "../pages/logoutModal";

export default function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  return (
    <div className="h-screen w-screen flex bg-slate-100">
      <Sidebar onShowLogoutModal={() => setShowLogoutModal(true)} />

      {/* Mobile Sidebar Drawer */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        >
          <div
            className="h-full w-[260px]"
            onClick={(e) => e.stopPropagation()}
          >
            <Sidebar mobile={true} onClose={() => setMobileOpen(false)} onShowLogoutModal={() => setShowLogoutModal(true)} />
          </div>
        </div>
      )}

      {/* Right side */}
      <div className="flex-1 flex flex-col">
        <Topbar onMenuClick={() => setMobileOpen(true)} />

        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>

      {/* Logout Modal - rendered at top level */}
      <LogoutModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
      />
    </div>
  );
}
