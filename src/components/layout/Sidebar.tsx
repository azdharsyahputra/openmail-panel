"use client";

import React from "react";
import {
  LayoutDashboard,
  Globe,
  Inbox,
  Users,
  Layers,
  ShieldCheck,
  Activity,
  Server,
} from "lucide-react";

export type NavTab =
  | "dashboard"
  | "domains"
  | "mailboxes"
  | "identity"
  | "queue"
  | "security"
  | "monitoring"
  | "system";

interface SidebarProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
}

export function Sidebar({ activeTab, onSelectTab }: SidebarProps) {
  const navItems: { id: NavTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: "dashboard", label: "Overview", icon: LayoutDashboard },
    { id: "domains", label: "Domains & DNS", icon: Globe },
    { id: "mailboxes", label: "Mailboxes & Aliases", icon: Inbox },
    { id: "identity", label: "Identity & LDAP", icon: Users },
    { id: "queue", label: "Mail Queue", icon: Layers },
    { id: "security", label: "Security Doctor", icon: ShieldCheck },
    { id: "monitoring", label: "Monitoring", icon: Activity },
    { id: "system", label: "System Health", icon: Server },
  ];

  return (
    <aside className="w-60 bg-[#f6f8fc] h-[calc(100vh-4rem)] p-3 pr-4 flex flex-col justify-between select-none">
      <div className="space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center gap-3.5 px-4 py-2.5 rounded-full text-xs transition-all cursor-pointer ${
                isActive
                  ? "bg-[#c2e7ff] text-[#001d35] font-bold shadow-2xs"
                  : "text-slate-700 hover:bg-[#e8eaed]/70 font-medium"
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? "text-[#001d35]" : "text-slate-500"}`} />
              <span className="truncate">{item.label}</span>
            </button>
          );
        })}
      </div>

      <div className="p-3 bg-white rounded-2xl border border-slate-200/60 shadow-2xs text-[11px] font-mono text-slate-500 space-y-1">
        <div className="flex justify-between">
          <span>Engine</span>
          <span className="font-semibold text-slate-800">v0.9.0-GA</span>
        </div>
        <div className="flex justify-between">
          <span>Control Plane</span>
          <span className="text-blue-600 font-semibold">W3.3 Active</span>
        </div>
      </div>
    </aside>
  );
}
