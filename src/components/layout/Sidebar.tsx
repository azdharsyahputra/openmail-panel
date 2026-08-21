"use client";

import React from "react";

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
    items: { id: NavTab; label: string }[];
  }[] = [
    {
      title: "Core",
      items: [
        { id: "dashboard", label: "Overview" },
        { id: "domains", label: "Domains & DNS" },
        { id: "mailboxes", label: "Mailboxes & Aliases" },
      ],
    },
    {
      title: "Services",
      items: [
        { id: "identity", label: "Identity & LDAP" },
        { id: "queue", label: "Mail Queue" },
        { id: "security", label: "Security & Audit" },
      ],
    },
    {
      title: "Operations",
      items: [
        { id: "monitoring", label: "Monitoring" },
        { id: "system", label: "System Doctor" },
      ],
    },
  ];

  return (
    <aside className="w-56 bg-slate-50/50 border-r border-slate-200 h-[calc(100vh-3.5rem)] p-3 flex flex-col justify-between overflow-y-auto">
      <div className="space-y-4">
        {navSections.map((section, sIdx) => (
          <div key={sIdx} className="space-y-0.5">
            <div className="px-2.5 py-1 text-[10px] font-bold text-slate-600 uppercase tracking-wider font-mono">
              {section.title}
            </div>
            {section.items.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectTab(item.id)}
                  className={`w-full text-left px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                    isActive
                      ? "bg-slate-200 text-slate-900 font-semibold"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      <div className="p-2.5 bg-white rounded border border-slate-200 text-[11px] font-mono text-slate-500 space-y-1">
        <div className="flex justify-between">
          <span>Engine</span>
          <span className="font-semibold text-slate-700">v0.9.0-GA</span>
        </div>
        <div className="flex justify-between">
          <span>Control Plane</span>
          <span className="text-blue-600 font-semibold">W3.3</span>
        </div>
      </div>
    </aside>
  );
}
