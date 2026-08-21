"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { api, HealthReport } from "@/lib/api";
import { Search, LogOut } from "lucide-react";

export function Navbar({ onSearch }: { onSearch?: (q: string) => void }) {
  const { user, logout } = useAuth();
  const [health, setHealth] = useState<HealthReport | null>(null);

  const checkLiveHealth = async () => {
    try {
      const res = await api.getLiveHealth();
      setHealth(res);
    } catch {
      setHealth({ status: "offline" });
    }
  };

  useEffect(() => {
    checkLiveHealth();
    const interval = setInterval(checkLiveHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  const isOnline = health?.status === "healthy" || health?.status === "live";
  const userInitial = (user?.display_name || user?.email || user?.username || "A").charAt(0).toUpperCase();

  return (
    <header className="h-16 bg-[#f6f8fc] px-6 flex items-center justify-between sticky top-0 z-30 select-none">
      {/* Brand */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold text-base shadow-xs">
          <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
            <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
          </svg>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="font-bold text-slate-900 tracking-tight text-base">MailOpen</span>
          <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100 font-mono">
            Control Plane
          </span>
        </div>
      </div>

      {/* Signature Gmail Pill Search */}
      <div className="flex-1 max-w-xl mx-8 hidden md:block">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search mailboxes, domains, queue ID..."
            onChange={(e) => onSearch?.(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 text-xs bg-[#eaf1fb] hover:bg-[#e4ecf7] focus:bg-white border border-transparent focus:border-slate-300 rounded-full focus:outline-none focus:shadow-xs transition-all text-slate-800 placeholder:text-slate-500"
          />
        </div>
      </div>

      {/* Right User & Cluster Status */}
      <div className="flex items-center gap-3">
        {/* Status Pill */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-slate-200/80 text-xs text-slate-600 shadow-2xs">
          <span className={`w-2 h-2 rounded-full ${isOnline ? "bg-emerald-500" : "bg-red-500"}`} />
          <span className="font-medium text-[11px]">{isOnline ? "System Ready" : "Degraded"}</span>
        </div>

        {/* User Account */}
        {user && (
          <div className="flex items-center gap-3 pl-2">
            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center ring-2 ring-blue-50">
              {userInitial}
            </div>
            <div className="text-left hidden sm:block">
              <span className="font-semibold text-slate-800 text-xs block leading-tight truncate max-w-36">
                {user.email || user.username}
              </span>
              <span className="text-[10px] text-slate-500 font-mono uppercase leading-tight">
                {user.roles?.[0] || "User"}
              </span>
            </div>
            <button
              onClick={() => logout()}
              title="Sign Out"
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-full transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
