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
  const navSections: {
    title: string;
    items: { id: NavTab; label: string; icon: React.ComponentType<{ className?: string }> }[];
  }[] = [
    {
      title: "Core Mail",
      items: [
        { id: "dashboard", label: "Overview", icon: LayoutDashboard },
        { id: "domains", label: "Domains & DNS", icon: Globe },
        { id: "mailboxes", label: "Mailboxes", icon: Inbox },
      ],
    },
    {
      title: "Control Plane",
      items: [
        { id: "identity", label: "Identity & LDAP", icon: Users },
        { id: "queue", label: "Mail Queue", icon: Layers },
        { id: "security", label: "Security Doctor", icon: ShieldCheck },
      ],
    },
    {
      title: "Operations",
      items: [
        { id: "monitoring", label: "Monitoring", icon: Activity },
        { id: "system", label: "System Health", icon: Server },
      ],
    },
  ];

  return (
    <aside className="w-56 h-full pb-2 flex flex-col justify-between select-none shrink-0 overflow-y-auto pr-1">
      <div className="space-y-4">
        {navSections.map((section, sIdx) => (
          <div key={sIdx} className="space-y-0.5">
            <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
              {section.title}
            </div>
            {section.items.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectTab(item.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs transition-all cursor-pointer ${
                    isActive
                      ? "bg-zinc-900 text-white font-medium shadow-xs"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50 font-normal"
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? "text-white" : "text-slate-400"}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        ))}
      </div>

      <div className="p-3 bg-white rounded-xl border border-slate-200/80 shadow-2xs text-[11px] font-mono text-slate-500 space-y-1">
        <div className="flex justify-between">
          <span>Release</span>
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
