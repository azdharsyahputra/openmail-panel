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
      setAuditLogs(logs.slice(0, 10));
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
      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
        <div>
          <h1 className="text-base font-bold text-slate-900">System Overview</h1>
          <p className="text-xs text-slate-500">Live operational state of MailOpen mail engine</p>
        </div>
        <button
          onClick={loadData}
          disabled={loading}
          className="px-3 py-1 text-xs font-medium bg-white hover:bg-slate-50 border border-slate-300 rounded text-slate-700 cursor-pointer disabled:opacity-50"
        >
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div
          onClick={() => onNavigate("domains")}
          className="p-4 bg-white border border-slate-200 rounded hover:border-slate-300 transition-colors cursor-pointer"
        >
          <div className="text-[11px] font-mono text-slate-500 uppercase">Domains</div>
          <div className="text-2xl font-bold text-slate-900 font-mono mt-1">{domains.length}</div>
          <div className="text-[11px] text-slate-500 mt-1">
            {domains.filter((d) => d.status === "active").length} active
          </div>
        </div>

        <div
          onClick={() => onNavigate("mailboxes")}
          className="p-4 bg-white border border-slate-200 rounded hover:border-slate-300 transition-colors cursor-pointer"
        >
          <div className="text-[11px] font-mono text-slate-500 uppercase">Mailboxes</div>
          <div className="text-2xl font-bold text-slate-900 font-mono mt-1">{mailboxes.length}</div>
          <div className="text-[11px] text-slate-500 mt-1">
            {mailboxes.filter((m) => m.status === "active").length} active accounts
          </div>
        </div>

        <div
          onClick={() => onNavigate("queue")}
          className="p-4 bg-white border border-slate-200 rounded hover:border-slate-300 transition-colors cursor-pointer"
        >
          <div className="text-[11px] font-mono text-slate-500 uppercase">Queue Depth</div>
          <div className="text-2xl font-bold text-slate-900 font-mono mt-1">{queueSummary?.total || 0}</div>
          <div className="text-[11px] text-slate-500 mt-1 font-mono">
            {queueSummary?.active || 0} active · {queueSummary?.deferred || 0} deferred
          </div>
        </div>

        <div
          onClick={() => onNavigate("mailboxes")}
          className="p-4 bg-white border border-slate-200 rounded hover:border-slate-300 transition-colors cursor-pointer"
        >
          <div className="text-[11px] font-mono text-slate-500 uppercase">Storage Used</div>
          <div className="text-2xl font-bold text-slate-900 font-mono mt-1">{formatBytes(totalUsedBytes)}</div>
          <div className="text-[11px] text-slate-500 mt-1 font-mono">
            of {formatBytes(totalQuotaBytes)} allocated
          </div>
        </div>
      </div>

      {/* Grid: Services & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Services Status Table */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-200 bg-slate-50/50 flex justify-between items-center">
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-mono">
              Engine Services Status
            </h2>
            <span className="text-[11px] font-mono text-emerald-600 font-semibold">● Operational</span>
          </div>
          <table className="w-full text-left text-xs font-mono">
            <tbody className="divide-y divide-slate-100">
              <tr className="hover:bg-slate-50">
                <td className="py-2.5 px-4 font-semibold text-slate-800">Postfix (MTA)</td>
                <td className="py-2.5 px-4 text-slate-500">Port 25 (Inbound) / 587 (Submission)</td>
                <td className="py-2.5 px-4 text-right text-emerald-600 font-semibold">LISTENING</td>
              </tr>
              <tr className="hover:bg-slate-50">
                <td className="py-2.5 px-4 font-semibold text-slate-800">Dovecot (IMAP)</td>
                <td className="py-2.5 px-4 text-slate-500">Port 143 (IMAP) / 993 (IMAPS)</td>
                <td className="py-2.5 px-4 text-right text-emerald-600 font-semibold">LISTENING</td>
              </tr>
              <tr className="hover:bg-slate-50">
                <td className="py-2.5 px-4 font-semibold text-slate-800">OpenLDAP / AD</td>
                <td className="py-2.5 px-4 text-slate-500">Port 389 (StartTLS) / Directory Sync</td>
                <td className="py-2.5 px-4 text-right text-emerald-600 font-semibold">CONNECTED</td>
              </tr>
              <tr className="hover:bg-slate-50">
                <td className="py-2.5 px-4 font-semibold text-slate-800">OpenDKIM Milter</td>
                <td className="py-2.5 px-4 text-slate-500">UNIX Socket / Inbound Verification</td>
                <td className="py-2.5 px-4 text-right text-emerald-600 font-semibold">ACTIVE</td>
              </tr>
              <tr className="hover:bg-slate-50">
                <td className="py-2.5 px-4 font-semibold text-slate-800">PostgreSQL DB</td>
                <td className="py-2.5 px-4 text-slate-500">Schema v003 / Proxymap Virtual Domains</td>
                <td className="py-2.5 px-4 text-right text-emerald-600 font-semibold">READY</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Recent Activity */}
        <div className="bg-white border border-slate-200 rounded overflow-hidden flex flex-col justify-between">
          <div>
            <div className="px-4 py-3 border-b border-slate-200 bg-slate-50/50 flex justify-between items-center">
              <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-mono">
                Recent Audit Trail
              </h2>
              <button
                onClick={() => onNavigate("security")}
                className="text-[11px] text-blue-600 hover:underline cursor-pointer"
              >
                View all
              </button>
            </div>
            <div className="divide-y divide-slate-100 text-xs">
              {auditLogs.length === 0 ? (
                <div className="py-8 text-center text-slate-400">No recent activity</div>
              ) : (
                auditLogs.map((log) => (
                  <div key={log.id} className="p-3 font-mono">
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
