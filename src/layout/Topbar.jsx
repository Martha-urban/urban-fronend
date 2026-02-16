import React from "react";

export default function Topbar({ onMenuClick }) {
  return (
    <header className="h-[60px] bg-white border-b border-slate-200 px-6 flex items-center gap-3">
      {/* Hamburger (mobile only) */}
      <button
        onClick={onMenuClick}
        className="lg:hidden text-2xl font-bold text-slate-700"
      >
        ☰
      </button>

      <h1 className="font-semibold text-slate-700">Urban Trends</h1>
    </header>
  );
}
