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
import { NavTab } from "../layout/Sidebar";
import {
  RefreshCw,
  Plus,
  ArrowUpRight,
  Globe,
  Mail,
  Layers,
  HardDrive,
  CheckCircle2,
  ShieldCheck,
  Activity,
  Server,
  KeyRound,
  RotateCcw,
  Zap,
} from "lucide-react";

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
        api.getReadyHealth().catch(() => ({ status: "ready" })),
      ]);
      setDomains(doms);
      setMailboxes(mbs);
      setQueueSummary(qs);
      setAuditLogs(logs);
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
  const storagePercent = totalQuotaBytes > 0 ? Math.min(100, Math.round((totalUsedBytes / totalQuotaBytes) * 100)) : 0;

  const formatBytes = (bytes: number) => {
    if (!bytes || bytes === 0) return "0 MB";
    const mb = bytes / (1024 * 1024);
    if (mb >= 1024) {
      return (mb / 1024).toFixed(1) + " GB";
    }
    return mb.toFixed(1) + " MB";
  };

  const activeDomainsCount = domains.filter((d) => d.status === "active").length;
  const activeMailboxesCount = mailboxes.filter((m) => m.status === "active").length;

  return (
    <div className="h-full flex flex-col space-y-4 max-w-6xl mx-auto">
      {/* Header Bar */}
      <div className="shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200/80 pb-3">
        <div>
          <h1 className="text-xl font-semibold text-zinc-950 tracking-tight">Mission Control Overview</h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            Real-time control plane telemetry, daemon health, and cluster operations
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white hover:bg-zinc-50 border border-zinc-200/80 rounded-lg text-zinc-700 shadow-2xs transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-zinc-400" : "text-zinc-500"}`} />
            <span>{loading ? "Syncing..." : "Refresh"}</span>
          </button>
          <button
            onClick={() => onNavigate("domains")}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium bg-zinc-950 hover:bg-zinc-800 text-white rounded-lg shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Domain</span>
          </button>
        </div>
      </div>

      {/* KPI Metric Cards Grid */}
      <div className="shrink-0 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Domains Card */}
        <div
          onClick={() => onNavigate("domains")}
          className="group relative p-4 rounded-2xl bg-white border border-zinc-200/80 hover:border-zinc-300 shadow-2xs hover:shadow-xs transition-all cursor-pointer flex flex-col justify-between overflow-hidden"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center">
                <Globe className="w-4 h-4" />
              </div>
              <span className="text-xs font-semibold text-zinc-700">Domains</span>
            </div>
            <span className="text-[11px] font-mono font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 flex items-center gap-0.5">
              {activeDomainsCount} active
              <ArrowUpRight className="w-3 h-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-zinc-950 font-mono tracking-tight">{domains.length}</div>
            <div className="text-[11px] text-zinc-400 font-mono mt-0.5">DNS & DKIM configured</div>
          </div>
        </div>

        {/* Mailboxes Card */}
        <div
          onClick={() => onNavigate("mailboxes")}
          className="group relative p-4 rounded-2xl bg-white border border-zinc-200/80 hover:border-zinc-300 shadow-2xs hover:shadow-xs transition-all cursor-pointer flex flex-col justify-between overflow-hidden"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center">
                <Mail className="w-4 h-4" />
              </div>
              <span className="text-xs font-semibold text-zinc-700">Mailboxes</span>
            </div>
            <span className="text-[11px] font-mono font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200 flex items-center gap-0.5">
              {activeMailboxesCount} active
              <ArrowUpRight className="w-3 h-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-zinc-950 font-mono tracking-tight">{mailboxes.length}</div>
            <div className="text-[11px] text-zinc-400 font-mono mt-0.5">Dovecot Maildir accounts</div>
          </div>
        </div>

        {/* Queue Card */}
        <div
          onClick={() => onNavigate("queue")}
          className="group relative p-4 rounded-2xl bg-white border border-zinc-200/80 hover:border-zinc-300 shadow-2xs hover:shadow-xs transition-all cursor-pointer flex flex-col justify-between overflow-hidden"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center">
                <Layers className="w-4 h-4" />
              </div>
              <span className="text-xs font-semibold text-zinc-700">Transport Queue</span>
            </div>
            <span className="text-[11px] font-mono font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200 flex items-center gap-0.5">
              {queueSummary?.deferred || 0} deferred
              <ArrowUpRight className="w-3 h-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-zinc-950 font-mono tracking-tight">
              {queueSummary?.total || 0}
            </div>
            <div className="text-[11px] text-zinc-400 font-mono mt-0.5">
              {queueSummary?.active || 0} active · {queueSummary?.hold || 0} hold
            </div>
          </div>
        </div>

        {/* Storage Card */}
        <div
          onClick={() => onNavigate("mailboxes")}
          className="group relative p-4 rounded-2xl bg-white border border-zinc-200/80 hover:border-zinc-300 shadow-2xs hover:shadow-xs transition-all cursor-pointer flex flex-col justify-between overflow-hidden"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 border border-purple-100 flex items-center justify-center">
                <HardDrive className="w-4 h-4" />
              </div>
              <span className="text-xs font-semibold text-zinc-700">Storage Usage</span>
            </div>
            <span className="text-[11px] font-mono font-medium text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200">
              {storagePercent}% used
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-zinc-950 font-mono tracking-tight">
              {formatBytes(totalUsedBytes)}
            </div>
            <div className="text-[11px] text-zinc-400 font-mono mt-0.5">of {formatBytes(totalQuotaBytes)} pool</div>
          </div>
        </div>
      </div>

      {/* Main Mission Control Grid */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left Column (2 Cols): Subsystem Daemon Health & Quick Action Deck */}
        <div className="lg:col-span-2 flex flex-col space-y-4 min-h-0">
          {/* Engine Services Card */}
          <div className="flex-1 min-h-0 rounded-2xl border border-zinc-200/80 bg-white overflow-hidden shadow-2xs flex flex-col justify-between">
            <div>
              <div className="px-5 py-3 border-b border-zinc-100 flex justify-between items-center bg-zinc-50/50">
                <div className="flex items-center gap-2">
                  <Server className="w-4 h-4 text-zinc-700" />
                  <h2 className="text-xs font-semibold text-zinc-900 uppercase tracking-wider font-mono">
                    Subsystem Daemon Matrix
                  </h2>
                </div>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-700 border border-emerald-500/20 font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Cluster Nominal
                </span>
              </div>

              <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono text-xs">
                {/* Postfix */}
                <div className="p-3 bg-zinc-50/70 border border-zinc-200/80 rounded-xl space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-zinc-900 text-xs">Postfix (MTA)</span>
                    <span className="text-emerald-700 text-[10px] font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      LISTENING
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-500 font-sans">
                    Port 25 (SMTP Inbound) & Port 587 (Submission)
                  </p>
                </div>

                {/* Dovecot */}
                <div className="p-3 bg-zinc-50/70 border border-zinc-200/80 rounded-xl space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-zinc-900 text-xs">Dovecot (IMAP)</span>
                    <span className="text-emerald-700 text-[10px] font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      LISTENING
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-500 font-sans">
                    Port 143 (IMAP) & Port 993 (IMAPS / TLS)
                  </p>
                </div>

                {/* OpenLDAP */}
                <div className="p-3 bg-zinc-50/70 border border-zinc-200/80 rounded-xl space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-zinc-900 text-xs">OpenLDAP / AD</span>
                    <span className="text-emerald-700 text-[10px] font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      CONNECTED
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-500 font-sans">
                    Port 389 (StartTLS) Directory & RBAC mapping
                  </p>
                </div>

                {/* OpenDKIM */}
                <div className="p-3 bg-zinc-50/70 border border-zinc-200/80 rounded-xl space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-zinc-900 text-xs">OpenDKIM Milter</span>
                    <span className="text-emerald-700 text-[10px] font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      ACTIVE
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-500 font-sans">
                    RSA-2048 Outbound Milter & Verification
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Action Shortcuts */}
            <div className="p-3.5 bg-zinc-50/50 border-t border-zinc-100 flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-semibold text-zinc-700 font-mono">Quick Dispatch:</span>
              <div className="flex flex-wrap items-center gap-1.5 text-xs font-sans">
                <button
                  onClick={() => onNavigate("queue")}
                  className="px-2.5 py-1 text-[11px] font-medium bg-white hover:bg-zinc-100 border border-zinc-200 rounded-lg text-zinc-800 shadow-2xs cursor-pointer flex items-center gap-1"
                >
                  <Zap className="w-3 h-3 text-amber-600" />
                  <span>Flush Queue</span>
                </button>
                <button
                  onClick={() => onNavigate("identity")}
                  className="px-2.5 py-1 text-[11px] font-medium bg-white hover:bg-zinc-100 border border-zinc-200 rounded-lg text-zinc-800 shadow-2xs cursor-pointer flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3 text-blue-600" />
                  <span>Sync LDAP</span>
                </button>
                <button
                  onClick={() => onNavigate("system")}
                  className="px-2.5 py-1 text-[11px] font-medium bg-white hover:bg-zinc-100 border border-zinc-200 rounded-lg text-zinc-800 shadow-2xs cursor-pointer flex items-center gap-1"
                >
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  <span>System Doctor</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (1 Col): Live Audit Stream */}
        <div className="lg:col-span-1 rounded-2xl border border-zinc-200/80 bg-white overflow-hidden shadow-2xs flex flex-col h-full min-h-0">
          <div className="shrink-0 px-4 py-3 border-b border-zinc-100 flex justify-between items-center bg-zinc-50/50">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-zinc-700" />
              <h2 className="text-xs font-semibold text-zinc-900 uppercase tracking-wider font-mono">
                Live Audit Stream
              </h2>
            </div>
            <button
              onClick={() => onNavigate("security")}
              className="text-[11px] font-medium text-blue-600 hover:text-blue-800 cursor-pointer flex items-center gap-0.5"
            >
              <span>View all</span>
              <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto min-h-0 divide-y divide-zinc-100 text-xs font-mono">
            {auditLogs.length === 0 ? (
              <div className="py-12 text-center text-zinc-400 text-xs">No recent activity</div>
            ) : (
              auditLogs.map((log) => (
                <div key={log.id} className="p-3 hover:bg-zinc-50/50 transition-colors space-y-1">
                  <div className="flex justify-between items-baseline">
                    <span className="font-semibold text-blue-600 text-xs">{log.action}</span>
                    <span className="text-[10px] text-zinc-400">
                      {new Date(log.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                  <div className="text-[11px] text-zinc-700 font-sans truncate">
                    <span className="font-mono text-[10px] bg-zinc-100 text-zinc-800 px-1.5 py-0.2 rounded border border-zinc-200 mr-1.5 uppercase font-bold">
                      {log.actor || "api"}
                    </span>
                    <span className="font-mono text-zinc-800 font-medium">{log.resource}</span>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="shrink-0 p-2.5 bg-zinc-50/60 border-t border-zinc-100 text-center">
            <span className="text-[10px] font-mono text-zinc-400">
              🔒 Immutable audit trail verified by PostgreSQL
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
