"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { api, HealthReport } from "@/lib/api";
import { Mail, Search, LogOut, CheckCircle2, AlertCircle, RefreshCw } from "lucide-react";

export function Navbar({ onSearch }: { onSearch?: (q: string) => void }) {
  const { user, logout } = useAuth();
  const [health, setHealth] = useState<HealthReport | null>(null);
  const [checkingHealth, setCheckingHealth] = useState(false);

  const checkLiveHealth = async () => {
    try {
      setCheckingHealth(true);
      const res = await api.getLiveHealth();
      setHealth(res);
    } catch {
      setHealth({ status: "unavailable" });
    } finally {
      setCheckingHealth(false);
    }
  };

  useEffect(() => {
    checkLiveHealth();
    const interval = setInterval(checkLiveHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="h-16 border-b border-slate-200 bg-white px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-sm shadow-blue-500/20">
            <Mail className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-900 tracking-tight text-base">MailOpen</span>
              <span className="px-1.5 py-0.5 text-[10px] font-bold tracking-wider rounded bg-blue-50 text-blue-700 border border-blue-200 uppercase">
                Control Plane
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">Enterprise Mail Engine & Identity</p>
          </div>
        </div>
      </div>

      <div className="flex-1 max-w-md mx-8 hidden md:block">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search domains, mailboxes, queue ID..."
            onChange={(e) => onSearch?.(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 text-sm bg-slate-50 hover:bg-slate-100/80 focus:bg-white border border-slate-200 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400 text-slate-800"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Health Indicator */}
        <button
          onClick={checkLiveHealth}
          title="Click to re-check API health"
          className="flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-colors"
        >
          <span className="relative flex h-2 w-2">
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                health?.status === "healthy" || health?.status === "live" ? "bg-emerald-400" : "bg-amber-400"
              }`}
            ></span>
            <span
              className={`relative inline-flex rounded-full h-2 w-2 ${
                health?.status === "healthy" || health?.status === "live" ? "bg-emerald-500" : "bg-amber-500"
              }`}
            ></span>
          </span>
          <span className="text-slate-600 font-mono">
            {health?.status === "healthy" || health?.status === "live" ? "API Online" : "Degraded"}
          </span>
          <RefreshCw className={`w-3 h-3 text-slate-400 ${checkingHealth ? "animate-spin" : ""}`} />
        </button>

        {/* User Info & Logout */}
        {user && (
          <div className="flex items-center gap-3 pl-3 border-l border-slate-200">
            <div className="text-right hidden sm:block">
              <div className="text-sm font-semibold text-slate-800 flex items-center justify-end gap-1.5">
                <span>{user.display_name || user.username}</span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 uppercase">
                  {user.roles?.[0] || "User"}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-mono">{user.email || user.username}</p>
            </div>
            <button
              onClick={() => logout()}
              title="Sign Out"
              className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
