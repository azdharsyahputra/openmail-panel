"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { Navbar } from "@/components/layout/Navbar";
import { Sidebar, NavTab } from "@/components/layout/Sidebar";
import { LoginView } from "@/components/views/LoginView";
import { DashboardView } from "@/components/views/DashboardView";
import { DomainsView } from "@/components/views/DomainsView";
import { MailboxesView } from "@/components/views/MailboxesView";
import { IdentityView } from "@/components/views/IdentityView";
import { QueueView } from "@/components/views/QueueView";
import { SecurityView } from "@/components/views/SecurityView";
import { MonitoringView } from "@/components/views/MonitoringView";
import { SystemView } from "@/components/views/SystemView";
import { ConfigurationsView } from "@/components/views/ConfigurationsView";
import { WebmailView } from "@/components/views/WebmailView";
import { Mail, LogOut, Shield } from "lucide-react";

const ADMIN_TABS: NavTab[] = [
  "dashboard",
  "domains",
  "mailboxes",
  "identity",
  "queue",
  "security",
  "monitoring",
  "system",
  "configurations",
];

export default function MainPage() {
  const { user, loading, hasRole, logout } = useAuth();
  const isAdmin = hasRole("admin", "operator");

  const [activeTab, setActiveTab] = useState<NavTab>(() => {
    if (typeof window !== "undefined") {
      const hash = window.location.hash.replace("#", "") as NavTab;
      if (ADMIN_TABS.includes(hash)) return hash;
      const saved = localStorage.getItem("openmail_active_tab") as NavTab;
      if (ADMIN_TABS.includes(saved)) return saved;
    }
    return "dashboard";
  });

  useEffect(() => {
    if (typeof window !== "undefined" && user && isAdmin) {
      window.location.hash = activeTab;
      localStorage.setItem("openmail_active_tab", activeTab);
    }
  }, [activeTab, user, isAdmin]);

  useEffect(() => {
    if (!isAdmin) return;
    const handleHashChange = () => {
      const hash = window.location.hash.replace("#", "") as NavTab;
      if (ADMIN_TABS.includes(hash)) {
        setActiveTab(hash);
      }
    };
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, [isAdmin]);

  if (loading) {
    return (
      <div className="h-screen w-screen bg-[#f8fafc] flex items-center justify-center overflow-hidden">
        <div className="flex flex-col items-center gap-3">
          <div className="w-7 h-7 border-2 border-zinc-300 border-t-zinc-950 rounded-full animate-spin" />
          <span className="text-xs font-medium text-zinc-500 font-mono">
            Loading MailOpen...
          </span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginView />;
  }

  // 1. NON-ADMIN USER PORTAL (Dedicated Webmail Client)
  if (!isAdmin) {
    return (
      <div className="h-screen w-screen bg-[#f8fafc] flex flex-col overflow-hidden select-none">
        {/* User Dedicated Header */}
        <header className="h-14 shrink-0 bg-white border-b border-zinc-200/80 px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-zinc-950 flex items-center justify-center text-white shadow-xs">
              <Mail className="w-4 h-4" />
            </div>
            <div>
              <div className="text-sm font-bold text-zinc-950 tracking-tight flex items-center gap-1.5">
                <span>MailOpen</span>
                <span className="px-1.5 py-0.2 bg-blue-50 text-blue-700 border border-blue-200 rounded text-[10px] font-bold uppercase">
                  Webmail
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 font-sans text-xs">
            <div className="flex items-center gap-2 px-3 py-1 bg-zinc-50 border border-zinc-200/80 rounded-xl">
              <div className="w-6 h-6 rounded-full bg-zinc-900 text-white flex items-center justify-center text-[10px] font-bold">
                {(user.display_name || user.email || "U")[0].toUpperCase()}
              </div>
              <span className="font-semibold text-zinc-800">{user.email}</span>
            </div>

            <button
              onClick={() => logout()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-zinc-200 hover:bg-zinc-100 text-zinc-700 font-medium cursor-pointer transition-all shadow-2xs"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </header>

        {/* User Webmail Workspace */}
        <div className="flex-1 p-4 overflow-hidden">
          <WebmailView />
        </div>
      </div>
    );
  }

  // 2. ADMIN CONTROL PLANE (Dedicated Server Infrastructure Management)
  return (
    <div className="h-screen w-screen bg-[#f8fafc] flex flex-col overflow-hidden select-none">
      <Navbar onNavigate={setActiveTab} />
      <div className="flex-1 flex overflow-hidden px-5 py-4 gap-5 h-[calc(100vh-4rem)]">
        <Sidebar activeTab={activeTab} onSelectTab={setActiveTab} />
        <main className="flex-1 h-full bg-white rounded-xl border border-zinc-200/80 shadow-2xs p-6 md:p-8 overflow-y-auto select-text">
          {activeTab === "dashboard" && <DashboardView onNavigate={setActiveTab} />}
          {activeTab === "domains" && <DomainsView />}
          {activeTab === "mailboxes" && <MailboxesView />}
          {activeTab === "identity" && <IdentityView />}
          {activeTab === "queue" && <QueueView />}
          {activeTab === "security" && <SecurityView />}
          {activeTab === "monitoring" && <MonitoringView />}
          {activeTab === "system" && <SystemView />}
          {activeTab === "configurations" && <ConfigurationsView />}
        </main>
      </div>
    </div>
  );
}
