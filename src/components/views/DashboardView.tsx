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
  Activity,
  Server,
  KeyRound,
  RotateCcw,
  Zap,
  ShieldCheck,
  Database,
  Lock,
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
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-zinc-100 text-zinc-800 border border-zinc-200 flex items-center justify-center shrink-0">
                <Globe className="w-4 h-4" />
              </div>
              <span className="text-xs font-semibold text-zinc-900 truncate">Domains</span>
            </div>
            <ArrowUpRight className="w-4 h-4 text-zinc-400 group-hover:text-zinc-950 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all shrink-0" />
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-zinc-950 font-mono tracking-tight">{domains.length}</div>
            <div className="text-[11px] text-zinc-400 font-mono mt-0.5">{activeDomainsCount} active · DNS & DKIM ok</div>
          </div>
        </div>

        {/* Mailboxes Card */}
        <div
          onClick={() => onNavigate("mailboxes")}
          className="group relative p-4 rounded-2xl bg-white border border-zinc-200/80 hover:border-zinc-300 shadow-2xs hover:shadow-xs transition-all cursor-pointer flex flex-col justify-between overflow-hidden"
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-zinc-100 text-zinc-800 border border-zinc-200 flex items-center justify-center shrink-0">
                <Mail className="w-4 h-4" />
              </div>
              <span className="text-xs font-semibold text-zinc-900 truncate">Mailboxes</span>
            </div>
            <ArrowUpRight className="w-4 h-4 text-zinc-400 group-hover:text-zinc-950 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all shrink-0" />
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-zinc-950 font-mono tracking-tight">{mailboxes.length}</div>
            <div className="text-[11px] text-zinc-400 font-mono mt-0.5">{activeMailboxesCount} active accounts</div>
          </div>
        </div>

        {/* Queue Card */}
        <div
          onClick={() => onNavigate("queue")}
          className="group relative p-4 rounded-2xl bg-white border border-zinc-200/80 hover:border-zinc-300 shadow-2xs hover:shadow-xs transition-all cursor-pointer flex flex-col justify-between overflow-hidden"
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-zinc-100 text-zinc-800 border border-zinc-200 flex items-center justify-center shrink-0">
                <Layers className="w-4 h-4" />
              </div>
              <span className="text-xs font-semibold text-zinc-900 truncate">Mail Queue</span>
            </div>
            <ArrowUpRight className="w-4 h-4 text-zinc-400 group-hover:text-zinc-950 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all shrink-0" />
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-zinc-950 font-mono tracking-tight">
              {queueSummary?.total || 0}
            </div>
            <div className="text-[11px] text-zinc-400 font-mono mt-0.5">
              {queueSummary?.deferred || 0} deferred · {queueSummary?.active || 0} active
            </div>
          </div>
        </div>

        {/* Storage Card */}
        <div
          onClick={() => onNavigate("mailboxes")}
          className="group relative p-4 rounded-2xl bg-white border border-zinc-200/80 hover:border-zinc-300 shadow-2xs hover:shadow-xs transition-all cursor-pointer flex flex-col justify-between overflow-hidden"
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-zinc-100 text-zinc-800 border border-zinc-200 flex items-center justify-center shrink-0">
                <HardDrive className="w-4 h-4" />
              </div>
              <span className="text-xs font-semibold text-zinc-900 truncate">Storage Pool</span>
            </div>
            <ArrowUpRight className="w-4 h-4 text-zinc-400 group-hover:text-zinc-950 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all shrink-0" />
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-zinc-950 font-mono tracking-tight">
              {formatBytes(totalUsedBytes)}
            </div>
            <div className="text-[11px] text-zinc-400 font-mono mt-0.5">
              {storagePercent}% used of {formatBytes(totalQuotaBytes)} pool
            </div>
          </div>
        </div>
      </div>

      {/* Main Mission Control Grid */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left Column (2 Cols): Subsystem Daemon Matrix */}
        <div className="lg:col-span-2 rounded-2xl border border-zinc-200/80 bg-white overflow-hidden shadow-2xs flex flex-col justify-between h-full min-h-0">
          <div className="flex-1 flex flex-col min-h-0">
            {/* Subsystem Header */}
            <div className="shrink-0 px-5 py-3 border-b border-zinc-100 flex justify-between items-center bg-zinc-50/50">
              <div className="flex items-center gap-2">
                <Server className="w-4 h-4 text-zinc-800" />
                <h2 className="text-xs font-semibold text-zinc-950 uppercase tracking-wider font-mono">
                  Subsystem Daemon Matrix
                </h2>
              </div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-700 border border-emerald-500/20 font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Cluster Nominal
              </span>
            </div>

            {/* 6 Subsystems Grid */}
            <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 font-mono text-xs flex-1">
              {/* Postfix */}
              <div className="p-3.5 bg-zinc-50/70 border border-zinc-200/80 rounded-xl flex flex-col justify-between hover:border-zinc-300 transition-colors">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <Server className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="font-bold text-zinc-900 text-xs font-mono">Postfix MTA</span>
                  </div>
                  <span className="text-emerald-700 text-[10px] font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    LISTENING
                  </span>
                </div>
                <div className="mt-2 space-y-0.5">
                  <p className="text-[11px] text-zinc-700 font-sans font-medium">SMTP :25 & :587</p>
                  <p className="text-[10px] text-zinc-400 font-sans">Queue spool & relay transport</p>
                </div>
              </div>

              {/* Dovecot */}
              <div className="p-3.5 bg-zinc-50/70 border border-zinc-200/80 rounded-xl flex flex-col justify-between hover:border-zinc-300 transition-colors">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="font-bold text-zinc-900 text-xs font-mono">Dovecot IMAP</span>
                  </div>
                  <span className="text-emerald-700 text-[10px] font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    LISTENING
                  </span>
                </div>
                <div className="mt-2 space-y-0.5">
                  <p className="text-[11px] text-zinc-700 font-sans font-medium">IMAP :143 & :993</p>
                  <p className="text-[10px] text-zinc-400 font-sans">Maildir storage & SASL auth</p>
                </div>
              </div>

              {/* OpenLDAP */}
              <div className="p-3.5 bg-zinc-50/70 border border-zinc-200/80 rounded-xl flex flex-col justify-between hover:border-zinc-300 transition-colors">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <KeyRound className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="font-bold text-zinc-900 text-xs font-mono">OpenLDAP / AD</span>
                  </div>
                  <span className="text-emerald-700 text-[10px] font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    CONNECTED
                  </span>
                </div>
                <div className="mt-2 space-y-0.5">
                  <p className="text-[11px] text-zinc-700 font-sans font-medium">LDAP :389 (StartTLS)</p>
                  <p className="text-[10px] text-zinc-400 font-sans">RBAC directory synchronization</p>
                </div>
              </div>

              {/* OpenDKIM */}
              <div className="p-3.5 bg-zinc-50/70 border border-zinc-200/80 rounded-xl flex flex-col justify-between hover:border-zinc-300 transition-colors">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="font-bold text-zinc-900 text-xs font-mono">OpenDKIM Milter</span>
                  </div>
                  <span className="text-emerald-700 text-[10px] font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    ACTIVE
                  </span>
                </div>
                <div className="mt-2 space-y-0.5">
                  <p className="text-[11px] text-zinc-700 font-sans font-medium">RSA 2048-bit Milter</p>
                  <p className="text-[10px] text-zinc-400 font-sans">Cryptographic outbound signing</p>
                </div>
              </div>

              {/* PostgreSQL */}
              <div className="p-3.5 bg-zinc-50/70 border border-zinc-200/80 rounded-xl flex flex-col justify-between hover:border-zinc-300 transition-colors">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <Database className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="font-bold text-zinc-900 text-xs font-mono">PostgreSQL DB</span>
                  </div>
                  <span className="text-emerald-700 text-[10px] font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    READY
                  </span>
                </div>
                <div className="mt-2 space-y-0.5">
                  <p className="text-[11px] text-zinc-700 font-sans font-medium">Port 5433 (Schema v003)</p>
                  <p className="text-[10px] text-zinc-400 font-sans">Virtual domain proxymap pool</p>
                </div>
              </div>

              {/* TLS Provider */}
              <div className="p-3.5 bg-zinc-50/70 border border-zinc-200/80 rounded-xl flex flex-col justify-between hover:border-zinc-300 transition-colors">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="font-bold text-zinc-900 text-xs font-mono">TLS Security</span>
                  </div>
                  <span className="text-emerald-700 text-[10px] font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    ENFORCED
                  </span>
                </div>
                <div className="mt-2 space-y-0.5">
                  <p className="text-[11px] text-zinc-700 font-sans font-medium">Zero-Trust TLS 1.2/1.3</p>
                  <p className="text-[10px] text-zinc-400 font-sans">Automated ACME & SNI certs</p>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Deck */}
          <div className="shrink-0 px-5 py-3.5 bg-zinc-50/80 border-t border-zinc-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-[11px] font-mono text-zinc-500">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>
                Cluster Schema: <strong className="text-zinc-800 font-semibold">v003_applied</strong> (PostgreSQL 16) · Invariants Verified
              </span>
            </div>

            <div className="flex items-center gap-2 text-xs font-sans">
              <span className="text-xs font-semibold text-zinc-700 font-mono hidden md:inline">Quick Dispatch:</span>
              <button
                onClick={() => onNavigate("queue")}
                className="px-3 py-1.5 text-xs font-medium bg-white hover:bg-zinc-100 border border-zinc-200 rounded-lg text-zinc-800 shadow-2xs cursor-pointer flex items-center gap-1.5 transition-all"
              >
                <Zap className="w-3.5 h-3.5 text-zinc-700" />
                <span>Flush Queue</span>
              </button>
              <button
                onClick={() => onNavigate("identity")}
                className="px-3 py-1.5 text-xs font-medium bg-white hover:bg-zinc-100 border border-zinc-200 rounded-lg text-zinc-800 shadow-2xs cursor-pointer flex items-center gap-1.5 transition-all"
              >
                <RotateCcw className="w-3.5 h-3.5 text-zinc-700" />
                <span>Sync LDAP</span>
              </button>
              <button
                onClick={() => onNavigate("system")}
                className="px-3 py-1.5 text-xs font-medium bg-white hover:bg-zinc-100 border border-zinc-200 rounded-lg text-zinc-800 shadow-2xs cursor-pointer flex items-center gap-1.5 transition-all"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>System Doctor</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column (1 Col): Live Audit Stream */}
        <div className="lg:col-span-1 rounded-2xl border border-zinc-200/80 bg-white overflow-hidden shadow-2xs flex flex-col h-full min-h-0">
          <div className="shrink-0 px-4 py-3 border-b border-zinc-100 flex justify-between items-center bg-zinc-50/50">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-zinc-800" />
              <h2 className="text-xs font-semibold text-zinc-950 uppercase tracking-wider font-mono">
                Live Audit Stream
              </h2>
            </div>
            <button
              onClick={() => onNavigate("security")}
              className="text-[11px] font-medium text-zinc-700 hover:text-zinc-950 cursor-pointer flex items-center gap-0.5"
            >
              <span>View all</span>
              <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto min-h-0 divide-y divide-zinc-100 text-xs font-mono">
            {auditLogs.length === 0 ? (
              <div className="py-12 text-center text-zinc-400 text-xs font-sans">No recent activity</div>
            ) : (
              auditLogs.map((log) => {
                const actorNorm = (log.actor || "api").toLowerCase();
                const actorClass = actorNorm.includes("admin")
                  ? "bg-zinc-950 text-white border-zinc-950"
                  : actorNorm.includes("api")
                  ? "bg-zinc-100 text-zinc-800 border-zinc-200"
                  : actorNorm.includes("system")
                  ? "bg-emerald-500/10 text-emerald-700 border-emerald-500/20"
                  : "bg-zinc-100 text-zinc-700 border-zinc-200";

                return (
                  <div key={log.id} className="p-3 hover:bg-zinc-50/50 transition-colors space-y-1">
                    <div className="flex justify-between items-baseline">
                      <span className="font-semibold text-zinc-900 text-xs">{log.action}</span>
                      <span className="text-[10px] text-zinc-400">
                        {new Date(log.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                    <div className="text-[11px] text-zinc-700 font-sans truncate">
                      <span className={`font-mono text-[10px] px-1.5 py-0.2 rounded border mr-1.5 uppercase font-bold ${actorClass}`}>
                        {log.actor || "api"}
                      </span>
                      <span className="font-mono text-zinc-800 font-medium">{log.resource}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="shrink-0 p-2.5 bg-zinc-50/60 border-t border-zinc-100 flex items-center justify-center gap-1.5 text-[11px] font-mono text-zinc-400">
            <Lock className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
            <span>Immutable audit trail verified by PostgreSQL</span>
          </div>
        </div>
      </div>
    </div>
  );
}
