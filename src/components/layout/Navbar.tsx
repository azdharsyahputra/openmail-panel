"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { api, HealthReport } from "@/lib/api";

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

  return (
    <header className="h-14 border-b border-slate-200 bg-white px-6 flex items-center justify-between sticky top-0 z-30">
      {/* Brand & Context */}
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded bg-blue-600 flex items-center justify-center text-white font-bold text-sm tracking-tight">
            M
          </div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-900 tracking-tight text-sm">MailOpen</span>
            <span className="text-slate-300">/</span>
            <span className="text-xs text-slate-600 font-medium">Admin Console</span>
          </div>
        </div>
      </div>

      {/* Center Search */}
      <div className="flex-1 max-w-sm mx-6 hidden md:block">
        <input
          type="text"
          placeholder="Search mailboxes, domains, queue..."
          onChange={(e) => onSearch?.(e.target.value)}
          className="w-full px-3 py-1.5 text-xs bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600 transition-colors text-slate-800 placeholder:text-slate-400"
        />
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-4">
        {/* Status Pill */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-50 border border-slate-200 text-[11px] font-mono">
          <span className={`w-2 h-2 rounded-full ${isOnline ? "bg-emerald-500" : "bg-red-500"}`} />
          <span className="text-slate-600">{isOnline ? "API Online" : "API Offline"}</span>
        </div>

        {/* User Session */}
        {user && (
          <div className="flex items-center gap-3 pl-3 border-l border-slate-200 text-xs">
            <div className="text-right">
              <span className="font-semibold text-slate-800 block">{user.email || user.username}</span>
              <span className="text-[10px] text-slate-600 uppercase font-mono">{user.roles?.[0] || "User"}</span>
            </div>
            <button
              onClick={() => logout()}
              className="text-xs font-medium text-slate-600 hover:text-red-600 transition-colors cursor-pointer"
            >
              Sign out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
