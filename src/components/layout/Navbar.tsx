"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { api, HealthReport } from "@/lib/api";
import { Search, LogOut, Command, ShieldCheck } from "lucide-react";

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
    <header className="h-14 border-b border-zinc-200/80 bg-white px-6 flex items-center justify-between sticky top-0 z-30 select-none">
      {/* Brand & Organization */}
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-zinc-950 flex items-center justify-center text-white font-semibold text-xs tracking-tight shadow-xs">
            M
          </div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-zinc-950 text-sm tracking-tight">MailOpen</span>
            <span className="text-zinc-300 font-light">/</span>
            <span className="text-xs text-zinc-500 font-medium font-mono">Control Plane</span>
          </div>
        </div>
      </div>

      {/* Global Search Bar */}
      <div className="flex-1 max-w-md mx-8 hidden md:block">
        <div className="relative flex items-center">
          <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 pointer-events-none" />
          <input
            type="text"
            placeholder="Search mailboxes, virtual domains, queue..."
            onChange={(e) => onSearch?.(e.target.value)}
            className="w-full pl-9 pr-9 py-1.5 text-xs bg-zinc-100/70 hover:bg-zinc-100 focus:bg-white border border-transparent focus:border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-950/5 transition-all text-zinc-900 placeholder:text-zinc-400"
          />
          <div className="absolute right-2.5 flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-white border border-zinc-200 text-[10px] text-zinc-400 font-mono shadow-2xs">
            <Command className="w-2.5 h-2.5" />
            <span>K</span>
          </div>
        </div>
      </div>

      {/* Cluster Health & Account */}
      <div className="flex items-center gap-3.5">
        {/* Status Badge */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium bg-emerald-500/10 text-emerald-700 border border-emerald-500/20 font-mono">
          <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? "bg-emerald-500 animate-pulse" : "bg-red-500"}`} />
          <span>{isOnline ? "Engine Operational" : "Degraded"}</span>
        </div>

        {/* User Account */}
        {user && (
          <div className="flex items-center gap-2.5 pl-3 border-l border-zinc-200">
            <div className="w-7 h-7 rounded-full bg-zinc-100 text-zinc-900 font-semibold text-xs flex items-center justify-center border border-zinc-200/80 font-mono">
              {userInitial}
            </div>
            <div className="text-left hidden sm:block">
              <span className="font-medium text-zinc-900 text-xs block leading-tight truncate max-w-36 font-mono">
                {user.email || user.username}
              </span>
              <span className="text-[10px] text-zinc-500 font-mono uppercase leading-tight">
                {user.roles?.[0] || "User"}
              </span>
            </div>
            <button
              onClick={() => logout()}
              title="Sign Out"
              className="p-1.5 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer ml-0.5"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
