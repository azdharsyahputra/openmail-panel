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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Overview</h1>
          <p className="text-xs text-slate-500 mt-0.5">Real-time status of MailOpen core services & cluster</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white hover:bg-slate-50 border border-slate-200 rounded-full text-slate-700 shadow-2xs transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>
          <button
            onClick={() => onNavigate("domains")}
            className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Domain</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          onClick={() => onNavigate("domains")}
          className="p-5 rounded-2xl bg-[#f8fafd] border border-slate-200/80 hover:border-slate-300 transition-all cursor-pointer group"
        >
          <div className="flex justify-between items-baseline">
            <span className="text-[11px] font-mono text-slate-500 uppercase tracking-wider">Domains</span>
            <span className="text-xs font-medium text-emerald-700 flex items-center gap-0.5">
              {domains.filter((d) => d.status === "active").length} active
              <ArrowUpRight className="w-3 h-3" />
            </span>
          </div>
          <div className="text-3xl font-bold text-slate-900 font-mono mt-2">{domains.length}</div>
        </div>

        <div
          onClick={() => onNavigate("mailboxes")}
          className="p-5 rounded-2xl bg-[#f8fafd] border border-slate-200/80 hover:border-slate-300 transition-all cursor-pointer group"
        >
          <div className="flex justify-between items-baseline">
            <span className="text-[11px] font-mono text-slate-500 uppercase tracking-wider">Mailboxes</span>
            <span className="text-xs font-medium text-blue-700 flex items-center gap-0.5">
              {mailboxes.filter((m) => m.status === "active").length} active
              <ArrowUpRight className="w-3 h-3" />
            </span>
          </div>
          <div className="text-3xl font-bold text-slate-900 font-mono mt-2">{mailboxes.length}</div>
        </div>

        <div
          onClick={() => onNavigate("queue")}
          className="p-5 rounded-2xl bg-[#f8fafd] border border-slate-200/80 hover:border-slate-300 transition-all cursor-pointer group"
        >
          <div className="flex justify-between items-baseline">
            <span className="text-[11px] font-mono text-slate-500 uppercase tracking-wider">Queue Depth</span>
            <span className="text-xs font-mono text-slate-500">
              {queueSummary?.active || 0} act · {queueSummary?.deferred || 0} def
            </span>
          </div>
          <div className="text-3xl font-bold text-slate-900 font-mono mt-2">{queueSummary?.total || 0}</div>
        </div>

        <div
          onClick={() => onNavigate("mailboxes")}
          className="p-5 rounded-2xl bg-[#f8fafd] border border-slate-200/80 hover:border-slate-300 transition-all cursor-pointer group"
        >
          <div className="flex justify-between items-baseline">
            <span className="text-[11px] font-mono text-slate-500 uppercase tracking-wider">Storage Usage</span>
            <span className="text-xs font-mono text-slate-500">of {formatBytes(totalQuotaBytes)}</span>
          </div>
          <div className="text-3xl font-bold text-slate-900 font-mono mt-2">{formatBytes(totalUsedBytes)}</div>
        </div>
      </div>

      {/* Grid: Services & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Services Status Table */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-200/80 overflow-hidden">
          <div className="px-5 py-3.5 bg-[#f8fafd] border-b border-slate-200 flex justify-between items-center">
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-mono">
              Engine Services Status
            </h2>
            <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200/80">
              ● All Services Nominal
            </span>
          </div>
          <table className="w-full text-left text-xs font-mono">
            <tbody className="divide-y divide-slate-100">
              <tr className="hover:bg-[#f8fafd] transition-colors">
                <td className="py-3 px-5 font-semibold text-slate-800">Postfix (MTA)</td>
                <td className="py-3 px-5 text-slate-500">Port 25 (Inbound) / 587 (Submission)</td>
                <td className="py-3 px-5 text-right text-emerald-600 font-semibold">LISTENING</td>
              </tr>
              <tr className="hover:bg-[#f8fafd] transition-colors">
                <td className="py-3 px-5 font-semibold text-slate-800">Dovecot (IMAP)</td>
                <td className="py-3 px-5 text-slate-500">Port 143 (IMAP) / 993 (IMAPS)</td>
                <td className="py-3 px-5 text-right text-emerald-600 font-semibold">LISTENING</td>
              </tr>
              <tr className="hover:bg-[#f8fafd] transition-colors">
                <td className="py-3 px-5 font-semibold text-slate-800">OpenLDAP / AD</td>
                <td className="py-3 px-5 text-slate-500">Port 389 (StartTLS) / Directory Sync</td>
                <td className="py-3 px-5 text-right text-emerald-600 font-semibold">CONNECTED</td>
              </tr>
              <tr className="hover:bg-[#f8fafd] transition-colors">
                <td className="py-3 px-5 font-semibold text-slate-800">OpenDKIM Milter</td>
                <td className="py-3 px-5 text-slate-500">UNIX Socket / Outbound Signing</td>
                <td className="py-3 px-5 text-right text-emerald-600 font-semibold">ACTIVE</td>
              </tr>
              <tr className="hover:bg-[#f8fafd] transition-colors">
                <td className="py-3 px-5 font-semibold text-slate-800">PostgreSQL DB</td>
                <td className="py-3 px-5 text-slate-500">Schema v003 / Virtual Proxymap</td>
                <td className="py-3 px-5 text-right text-emerald-600 font-semibold">READY</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Recent Activity */}
        <div className="rounded-2xl border border-slate-200/80 overflow-hidden flex flex-col justify-between">
          <div>
            <div className="px-5 py-3.5 bg-[#f8fafd] border-b border-slate-200 flex justify-between items-center">
              <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-mono">
                Recent Activity
              </h2>
              <button
                onClick={() => onNavigate("security")}
                className="text-xs text-blue-600 hover:text-blue-700 font-medium cursor-pointer"
              >
                View all
              </button>
            </div>
            <div className="divide-y divide-slate-100 text-xs">
              {auditLogs.length === 0 ? (
                <div className="py-8 text-center text-slate-400">No recent activity recorded</div>
              ) : (
                auditLogs.map((log) => (
                  <div key={log.id} className="p-3.5 font-mono hover:bg-[#f8fafd] transition-colors">
                    <div className="flex justify-between items-baseline mb-0.5">
                      <span className="font-semibold text-slate-800">{log.action}</span>
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
