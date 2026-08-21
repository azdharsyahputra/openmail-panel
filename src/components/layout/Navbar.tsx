"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { api, HealthReport } from "@/lib/api";
import { Search, LogOut, Command } from "lucide-react";

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
    <header className="h-14 border-b border-slate-200/80 bg-white/80 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-30 select-none">
      {/* Brand & Context */}
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-zinc-900 flex items-center justify-center text-white font-bold text-xs shadow-xs tracking-tight">
            M
          </div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-900 tracking-tight text-sm">MailOpen</span>
            <span className="text-slate-300 font-light">/</span>
            <span className="text-xs text-slate-500 font-medium font-mono">Control Plane</span>
          </div>
        </div>
      </div>

      {/* Modern Search Bar */}
      <div className="flex-1 max-w-md mx-8 hidden md:block">
        <div className="relative flex items-center">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 pointer-events-none" />
          <input
            type="text"
            placeholder="Search mailboxes, domains, queue ID..."
            onChange={(e) => onSearch?.(e.target.value)}
            className="w-full pl-9 pr-8 py-1.5 text-xs bg-slate-100/70 hover:bg-slate-100 focus:bg-white border border-transparent focus:border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900/5 transition-all text-slate-900 placeholder:text-slate-400 font-sans"
          />
          <div className="absolute right-2.5 flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-white border border-slate-200/80 text-[10px] text-slate-400 font-mono">
            <Command className="w-2.5 h-2.5" />
            <span>K</span>
          </div>
        </div>
      </div>

      {/* Right User & Cluster Status */}
      <div className="flex items-center gap-3.5">
        {/* Status Pill */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 font-mono">
          <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? "bg-emerald-500 animate-pulse" : "bg-red-500"}`} />
          <span>{isOnline ? "Engine Online" : "Degraded"}</span>
        </div>

        {/* User Account */}
        {user && (
          <div className="flex items-center gap-2.5 pl-2 border-l border-slate-200/80">
            <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-800 font-bold text-xs flex items-center justify-center border border-slate-200/80 font-mono">
              {userInitial}
            </div>
            <div className="text-left hidden sm:block">
              <span className="font-semibold text-slate-800 text-xs block leading-tight truncate max-w-36 font-mono">
                {user.email || user.username}
              </span>
              <span className="text-[10px] text-slate-400 font-mono uppercase leading-tight">
                {user.roles?.[0] || "User"}
              </span>
            </div>
            <button
              onClick={() => logout()}
              title="Sign Out"
              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer ml-1"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
