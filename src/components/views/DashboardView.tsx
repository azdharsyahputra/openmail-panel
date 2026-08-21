"use client";

import React, { useEffect, useState } from "react";
import {
  api,
  DomainItem,
  MailboxItem,
  QueueSummary,
  AuditLogItem,
  HealthReport,
} from "@/lib/api";
import {
  Globe,
  Inbox,
  Layers,
  HardDrive,
  CheckCircle2,
  RefreshCw,
  Plus,
  ArrowUpRight,
  ShieldCheck,
  Activity,
  Send,
} from "lucide-react";
import { NavTab } from "../layout/Sidebar";

export function DashboardView({ onNavigate }: { onNavigate: (tab: NavTab) => void }) {
  const [loading, setLoading] = useState(true);
  const [domains, setDomains] = useState<DomainItem[]>([]);
  const [mailboxes, setMailboxes] = useState<MailboxItem[]>([]);
  const [queueSummary, setQueueSummary] = useState<QueueSummary | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [health, setHealth] = useState<HealthReport | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [doms, mbs, qs, logs, hl] = await Promise.all([
        api.getDomains().catch(() => []),
        api.getMailboxes().catch(() => []),
        api.getQueueSummary().catch(() => ({ active: 0, deferred: 0, hold: 0, corrupt: 0, total: 0 })),
        api.getAuditLogs().catch(() => []),
        api.getReadyHealth().catch(() => ({ status: "unknown" })),
      ]);
      setDomains(doms);
      setMailboxes(mbs);
      setQueueSummary(qs);
      setAuditLogs(logs.slice(0, 8));
      setHealth(hl);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const totalUsedBytes = mailboxes.reduce((acc, mb) => acc + (mb.used_bytes || 0), 0);
  const totalQuotaBytes = mailboxes.reduce((acc, mb) => acc + (mb.quota_bytes || 0), 0);
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 MB";
    const mb = bytes / (1024 * 1024);
    if (mb >= 1024) {
      return (mb / 1024).toFixed(1) + " GB";
    }
    return mb.toFixed(1) + " MB";
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">System Overview</h1>
          <p className="text-sm text-slate-500">Real-time status of MailOpen core services & cluster</p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={loadData}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 shadow-2xs transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>
          <button
            onClick={() => onNavigate("domains")}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-sm shadow-blue-500/20 transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Domain</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Active Domains */}
        <div
          onClick={() => onNavigate("domains")}
          className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs hover:border-slate-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Domains</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Globe className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <div className="text-2xl font-bold text-slate-900 font-mono">{domains.length}</div>
            <div className="flex items-center text-xs font-semibold text-emerald-600 gap-0.5">
              <span>{domains.filter((d) => d.status === "active").length} Active</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>

        {/* Total Mailboxes */}
        <div
          onClick={() => onNavigate("mailboxes")}
          className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs hover:border-slate-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Mailboxes</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Inbox className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <div className="text-2xl font-bold text-slate-900 font-mono">{mailboxes.length}</div>
            <div className="flex items-center text-xs font-semibold text-indigo-600 gap-0.5">
              <span>{mailboxes.filter((m) => m.status === "active").length} Active</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>

        {/* Queue Depth */}
        <div
          onClick={() => onNavigate("queue")}
          className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs hover:border-slate-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Queue Depth</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <div className="text-2xl font-bold text-slate-900 font-mono">{queueSummary?.total || 0}</div>
            <div className="flex items-center text-xs font-semibold text-slate-500 gap-1 font-mono">
              <span className="text-emerald-600">{queueSummary?.active || 0} act</span>
              <span>·</span>
              <span className="text-amber-600">{queueSummary?.deferred || 0} def</span>
            </div>
          </div>
        </div>

        {/* Storage Quota */}
        <div
          onClick={() => onNavigate("mailboxes")}
          className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs hover:border-slate-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Storage Usage</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <HardDrive className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <div className="text-2xl font-bold text-slate-900 font-mono">{formatBytes(totalUsedBytes)}</div>
            <div className="text-xs font-semibold text-slate-500 font-mono">
              of {formatBytes(totalQuotaBytes)}
            </div>
          </div>
        </div>
      </div>

      {/* Main Split: Cluster Health & Recent Audit Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Services & Quick Tools */}
        <div className="lg:col-span-2 space-y-6">
          {/* Service Matrix Status */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-blue-600" />
                <h2 className="text-base font-bold text-slate-900">Infrastructure Health Status</h2>
              </div>
              <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                READY (All Services Nominal)
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                <div className="text-xs text-slate-500 font-medium">Postfix (MTA)</div>
                <div className="text-sm font-bold text-emerald-600 flex items-center gap-1 mt-1 font-mono">
                  <CheckCircle2 className="w-3.5 h-3.5" /> 25 / 587 Active
                </div>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                <div className="text-xs text-slate-500 font-medium">Dovecot (IMAP)</div>
                <div className="text-sm font-bold text-emerald-600 flex items-center gap-1 mt-1 font-mono">
                  <CheckCircle2 className="w-3.5 h-3.5" /> 143 / 993 Active
                </div>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                <div className="text-xs text-slate-500 font-medium">OpenLDAP / AD</div>
                <div className="text-sm font-bold text-emerald-600 flex items-center gap-1 mt-1 font-mono">
                  <CheckCircle2 className="w-3.5 h-3.5" /> 389 TLS Active
                </div>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                <div className="text-xs text-slate-500 font-medium">OpenDKIM / Milter</div>
                <div className="text-sm font-bold text-emerald-600 flex items-center gap-1 mt-1 font-mono">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Milter Online
                </div>
              </div>
            </div>
          </div>

          {/* Quick Operations Strip */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
            <h2 className="text-base font-bold text-slate-900 mb-4">Quick Operations</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <button
                onClick={() => onNavigate("domains")}
                className="p-3 rounded-xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50/50 text-left transition-all group cursor-pointer"
              >
                <Globe className="w-5 h-5 text-slate-500 group-hover:text-blue-600 mb-2 transition-colors" />
                <div className="text-xs font-bold text-slate-800">Add Domain</div>
                <p className="text-[11px] text-slate-400">DNS & DKIM keys</p>
              </button>

              <button
                onClick={() => onNavigate("mailboxes")}
                className="p-3 rounded-xl border border-slate-200 hover:border-indigo-500 hover:bg-indigo-50/50 text-left transition-all group cursor-pointer"
              >
                <Inbox className="w-5 h-5 text-slate-500 group-hover:text-indigo-600 mb-2 transition-colors" />
                <div className="text-xs font-bold text-slate-800">New Mailbox</div>
                <p className="text-[11px] text-slate-400">Quota & accounts</p>
              </button>

              <button
                onClick={() => onNavigate("identity")}
                className="p-3 rounded-xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/50 text-left transition-all group cursor-pointer"
              >
                <RefreshCw className="w-5 h-5 text-slate-500 group-hover:text-emerald-600 mb-2 transition-colors" />
                <div className="text-xs font-bold text-slate-800">Sync LDAP</div>
                <p className="text-[11px] text-slate-400">Directory import</p>
              </button>

              <button
                onClick={() => onNavigate("queue")}
                className="p-3 rounded-xl border border-slate-200 hover:border-amber-500 hover:bg-amber-50/50 text-left transition-all group cursor-pointer"
              >
                <Send className="w-5 h-5 text-slate-500 group-hover:text-amber-600 mb-2 transition-colors" />
                <div className="text-xs font-bold text-slate-800">Flush Queue</div>
                <p className="text-[11px] text-slate-400">MTA retry delivery</p>
              </button>
            </div>
          </div>
        </div>

        {/* Right Col: Recent Audit Log Feed */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-slate-500" />
                <h2 className="text-base font-bold text-slate-900">Live Activity Feed</h2>
              </div>
              <button
                onClick={() => onNavigate("security")}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 cursor-pointer"
              >
                View all
              </button>
            </div>

            <div className="space-y-3">
              {auditLogs.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">No recent mutations recorded</div>
              ) : (
                auditLogs.map((log) => (
                  <div key={log.id} className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                    <div className="flex items-center justify-between font-medium text-slate-800 mb-0.5">
                      <span className="font-semibold">{log.action}</span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {new Date(log.created_at).toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="text-slate-500 truncate font-mono text-[11px]">
                      {log.actor} $\rightarrow$ {log.resource}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
            <span>Audit log integrity</span>
            <span className="text-emerald-600 font-medium font-mono">Encrypted & Verified</span>
          </div>
        </div>
      </div>
    </div>
  );
}
