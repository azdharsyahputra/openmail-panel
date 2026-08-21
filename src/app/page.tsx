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
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-blue-600/20 border-t-blue-600 rounded-full animate-spin" />
          <span className="text-xs font-semibold text-slate-500 font-mono">
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
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />
      <div className="flex-1 flex overflow-hidden">
        <Sidebar activeTab={activeTab} onSelectTab={setActiveTab} />
        <main className="flex-1 p-6 md:p-8 overflow-y-auto max-w-7xl mx-auto w-full">
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
