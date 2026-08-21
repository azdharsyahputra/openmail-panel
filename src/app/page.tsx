"use client";

import React, { useState } from "react";
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

export default function MainPage() {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<NavTab>("dashboard");

  if (loading) {
    return (
      <div className="h-screen w-screen bg-[#f6f8fc] flex items-center justify-center overflow-hidden">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-blue-600/20 border-t-blue-600 rounded-full animate-spin" />
          <span className="text-xs font-medium text-slate-500 font-mono">
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
    <div className="h-screen w-screen bg-[#f6f8fc] flex flex-col overflow-hidden select-none">
      <Navbar />
      <div className="flex-1 flex overflow-hidden px-4 pb-4 gap-4 h-[calc(100vh-4rem)]">
        <Sidebar activeTab={activeTab} onSelectTab={setActiveTab} />
        <main className="flex-1 h-full bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-6 md:p-8 overflow-y-auto select-text">
          {activeTab === "dashboard" && <DashboardView onNavigate={setActiveTab} />}
          {activeTab === "domains" && <DomainsView />}
          {activeTab === "mailboxes" && <MailboxesView />}
          {activeTab === "identity" && <IdentityView />}
          {activeTab === "queue" && <QueueView />}
          {activeTab === "security" && <SecurityView />}
          {activeTab === "monitoring" && <MonitoringView />}
          {activeTab === "system" && <SystemView />}
        </main>
      </div>
    </div>
  );
}
