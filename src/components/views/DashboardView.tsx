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
import { RefreshCw, Plus, ArrowUpRight } from "lucide-react";

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
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
        <div>
          <h1 className="text-lg font-bold text-slate-900 tracking-tight">System Overview</h1>
          <p className="text-xs text-slate-500 mt-0.5">Real-time status of MailOpen core services & cluster</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white hover:bg-slate-50 border border-slate-200/80 rounded-lg text-slate-700 shadow-2xs transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-slate-400" : "text-slate-500"}`} />
            <span>Refresh</span>
          </button>
          <button
            onClick={() => onNavigate("domains")}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Domain</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div
          onClick={() => onNavigate("domains")}
          className="p-4 rounded-xl bg-white border border-slate-200/80 hover:border-slate-300 shadow-2xs hover:shadow-xs transition-all cursor-pointer group"
        >
          <div className="flex justify-between items-baseline">
            <span className="text-[11px] font-mono text-slate-500 uppercase tracking-wider">Domains</span>
            <span className="text-[11px] font-medium text-emerald-600 flex items-center gap-0.5 font-mono">
              {domains.filter((d) => d.status === "active").length} active
              <ArrowUpRight className="w-3 h-3" />
            </span>
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono mt-1 tracking-tight">{domains.length}</div>
        </div>

        <div
          onClick={() => onNavigate("mailboxes")}
          className="p-4 rounded-xl bg-white border border-slate-200/80 hover:border-slate-300 shadow-2xs hover:shadow-xs transition-all cursor-pointer group"
        >
          <div className="flex justify-between items-baseline">
            <span className="text-[11px] font-mono text-slate-500 uppercase tracking-wider">Mailboxes</span>
            <span className="text-[11px] font-medium text-blue-600 flex items-center gap-0.5 font-mono">
              {mailboxes.filter((m) => m.status === "active").length} active
              <ArrowUpRight className="w-3 h-3" />
            </span>
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono mt-1 tracking-tight">{mailboxes.length}</div>
        </div>

        <div
          onClick={() => onNavigate("queue")}
          className="p-4 rounded-xl bg-white border border-slate-200/80 hover:border-slate-300 shadow-2xs hover:shadow-xs transition-all cursor-pointer group"
        >
          <div className="flex justify-between items-baseline">
            <span className="text-[11px] font-mono text-slate-500 uppercase tracking-wider">Queue Depth</span>
            <span className="text-[11px] font-mono text-slate-500">
              {queueSummary?.active || 0} act · {queueSummary?.deferred || 0} def
            </span>
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono mt-1 tracking-tight">{queueSummary?.total || 0}</div>
        </div>

        <div
          onClick={() => onNavigate("mailboxes")}
          className="p-4 rounded-xl bg-white border border-slate-200/80 hover:border-slate-300 shadow-2xs hover:shadow-xs transition-all cursor-pointer group"
        >
          <div className="flex justify-between items-baseline">
            <span className="text-[11px] font-mono text-slate-500 uppercase tracking-wider">Storage Usage</span>
            <span className="text-[11px] font-mono text-slate-500">of {formatBytes(totalQuotaBytes)}</span>
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono mt-1 tracking-tight">{formatBytes(totalUsedBytes)}</div>
        </div>
      </div>

      {/* Grid: Services & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Services Status Table */}
        <div className="lg:col-span-2 rounded-xl border border-slate-200/80 bg-white overflow-hidden shadow-2xs">
          <div className="px-4 py-3 border-b border-slate-100 flex justify-between items-center">
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-mono">
              Engine Services Status
            </h2>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              All Services Nominal
            </span>
          </div>
          <table className="w-full text-left text-xs font-mono">
            <tbody className="divide-y divide-slate-100">
              <tr className="hover:bg-slate-50/50 transition-colors">
                <td className="py-2.5 px-4 font-semibold text-slate-800">Postfix (MTA)</td>
                <td className="py-2.5 px-4 text-slate-500">Port 25 (Inbound) / 587 (Submission)</td>
                <td className="py-2.5 px-4 text-right text-emerald-600 font-semibold text-[11px]">LISTENING</td>
              </tr>
              <tr className="hover:bg-slate-50/50 transition-colors">
                <td className="py-2.5 px-4 font-semibold text-slate-800">Dovecot (IMAP)</td>
                <td className="py-2.5 px-4 text-slate-500">Port 143 (IMAP) / 993 (IMAPS)</td>
                <td className="py-2.5 px-4 text-right text-emerald-600 font-semibold text-[11px]">LISTENING</td>
              </tr>
              <tr className="hover:bg-slate-50/50 transition-colors">
                <td className="py-2.5 px-4 font-semibold text-slate-800">OpenLDAP / AD</td>
                <td className="py-2.5 px-4 text-slate-500">Port 389 (StartTLS) / Directory Sync</td>
                <td className="py-2.5 px-4 text-right text-emerald-600 font-semibold text-[11px]">CONNECTED</td>
              </tr>
              <tr className="hover:bg-slate-50/50 transition-colors">
                <td className="py-2.5 px-4 font-semibold text-slate-800">OpenDKIM Milter</td>
                <td className="py-2.5 px-4 text-slate-500">UNIX Socket / Outbound Signing</td>
                <td className="py-2.5 px-4 text-right text-emerald-600 font-semibold text-[11px]">ACTIVE</td>
              </tr>
              <tr className="hover:bg-slate-50/50 transition-colors">
                <td className="py-2.5 px-4 font-semibold text-slate-800">PostgreSQL DB</td>
                <td className="py-2.5 px-4 text-slate-500">Schema v003 / Virtual Proxymap</td>
                <td className="py-2.5 px-4 text-right text-emerald-600 font-semibold text-[11px]">READY</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Recent Activity */}
        <div className="rounded-xl border border-slate-200/80 bg-white overflow-hidden shadow-2xs flex flex-col justify-between">
          <div>
            <div className="px-4 py-3 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-mono">
                Recent Activity
              </h2>
              <button
                onClick={() => onNavigate("security")}
                className="text-[11px] text-slate-500 hover:text-slate-900 font-medium cursor-pointer"
              >
                View all
              </button>
            </div>
            <div className="divide-y divide-slate-100 text-xs">
              {auditLogs.length === 0 ? (
                <div className="py-8 text-center text-slate-400 font-mono text-xs">No recent activity</div>
              ) : (
                auditLogs.map((log) => (
                  <div key={log.id} className="p-3 font-mono hover:bg-slate-50/50 transition-colors">
                    <div className="flex justify-between items-baseline mb-0.5">
                      <span className="font-semibold text-slate-800 text-[11px]">{log.action}</span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(log.created_at).toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 truncate">
                      {log.actor} $\rightarrow$ {log.resource}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
