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

const VALID_TABS: NavTab[] = [
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
  const { user, loading } = useAuth();

  const [activeTab, setActiveTab] = useState<NavTab>(() => {
    if (typeof window !== "undefined") {
      const hash = window.location.hash.replace("#", "") as NavTab;
      if (VALID_TABS.includes(hash)) return hash;
      const saved = localStorage.getItem("openmail_active_tab") as NavTab;
      if (VALID_TABS.includes(saved)) return saved;
    }
    return "dashboard";
  });

  useEffect(() => {
    if (typeof window !== "undefined" && user) {
      window.location.hash = activeTab;
      localStorage.setItem("openmail_active_tab", activeTab);
    }
  }, [activeTab, user]);

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace("#", "") as NavTab;
      if (VALID_TABS.includes(hash)) {
        setActiveTab(hash);
      }
    };
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  if (loading) {
    return (
      <div className="h-screen w-screen bg-[#f8fafc] flex items-center justify-center overflow-hidden">
        <div className="flex flex-col items-center gap-3">
          <div className="w-7 h-7 border-2 border-zinc-300 border-t-zinc-950 rounded-full animate-spin" />
          <span className="text-xs font-medium text-zinc-500 font-mono">
            Loading MailOpen Control Plane...
          </span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginView />;
  }

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
