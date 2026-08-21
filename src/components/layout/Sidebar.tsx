"use client";

import React from "react";
import {
  LayoutDashboard,
  Globe,
  Inbox,
  Users,
  Layers,
  ShieldAlert,
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
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "domains", label: "Domains & DNS", icon: Globe },
    { id: "mailboxes", label: "Mailboxes & Aliases", icon: Inbox },
    { id: "identity", label: "Identity & LDAP", icon: Users },
    { id: "queue", label: "Mail Queue", icon: Layers },
    { id: "security", label: "Security & Audit", icon: ShieldAlert },
    { id: "monitoring", label: "Monitoring", icon: Activity },
    { id: "system", label: "System Doctor", icon: Server },
  ];

  return (
    <aside className="w-64 bg-slate-50 border-r border-slate-200 h-[calc(100vh-4rem)] p-4 flex flex-col justify-between overflow-y-auto">
      <div className="space-y-1">
        <div className="px-3 py-2 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
          Operations
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? "bg-blue-600 text-white shadow-sm shadow-blue-600/20 font-semibold"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-slate-500"}`} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs text-xs space-y-1.5">
        <div className="flex items-center justify-between text-slate-500">
          <span>Engine Release</span>
          <span className="font-semibold text-slate-800 font-mono">v0.9.0-GA</span>
        </div>
        <div className="flex items-center justify-between text-slate-500">
          <span>Control Plane</span>
          <span className="font-semibold text-blue-600 font-mono">W3.3 Active</span>
        </div>
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-600">
          <span>PostgreSQL · OpenLDAP · Dovecot · Postfix</span>
        </div>
      </div>
    </aside>
  );
}
