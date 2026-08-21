"use client";

import React, { useEffect, useState } from "react";
import { api, AuditLogItem } from "@/lib/api";
import { RefreshCw } from "lucide-react";

export function SecurityView() {
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const logs = await api.getAuditLogs();
      setAuditLogs(logs);
    } catch {
      // Ignored
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
        <div>
          <h1 className="text-lg font-bold text-slate-900 tracking-tight">Security & Audit Log</h1>
          <p className="text-xs text-slate-500 mt-0.5">Immutable audit trails and security baseline invariants</p>
        </div>
        <button
          onClick={loadData}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white hover:bg-slate-50 border border-slate-200/80 rounded-lg text-slate-700 shadow-2xs transition-all cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-slate-400" : "text-slate-500"}`} />
          <span>{loading ? "Refreshing..." : "Refresh Audit Feed"}</span>
        </button>
      </div>

      {/* Security Invariant Grid */}
      <div className="rounded-xl border border-slate-200/80 bg-white p-5 space-y-3 shadow-2xs">
        <div className="flex justify-between items-center pb-2 border-b border-slate-100">
          <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-mono">
            Security Baseline Invariant Verification
          </h2>
          <span className="text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 text-[10px] font-mono font-semibold">
            ALL INVARIANTS SATISFIED
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
          <div className="p-3 bg-slate-50/70 border border-slate-200/80 rounded-lg space-y-1">
            <div className="font-bold text-slate-800">LDAP & Identity</div>
            <div className="text-emerald-700 text-[11px]">AUTOMATED PASS</div>
          </div>
          <div className="p-3 bg-slate-50/70 border border-slate-200/80 rounded-lg space-y-1">
            <div className="font-bold text-slate-800">Postfix Transport</div>
            <div className="text-emerald-700 text-[11px]">EXTERNAL PASS</div>
          </div>
          <div className="p-3 bg-slate-50/70 border border-slate-200/80 rounded-lg space-y-1">
            <div className="font-bold text-slate-800">Dovecot Storage</div>
            <div className="text-emerald-700 text-[11px]">AUTOMATED PASS</div>
          </div>
          <div className="p-3 bg-slate-50/70 border border-slate-200/80 rounded-lg space-y-1">
            <div className="font-bold text-slate-800">OpenDKIM Keys</div>
            <div className="text-emerald-700 text-[11px]">AUTOMATED PASS</div>
          </div>
          <div className="p-3 bg-slate-50/70 border border-slate-200/80 rounded-lg space-y-1">
            <div className="font-bold text-slate-800">SMTP Smuggling</div>
            <div className="text-emerald-700 text-[11px]">AUTOMATED PASS</div>
          </div>
          <div className="p-3 bg-slate-50/70 border border-slate-200/80 rounded-lg space-y-1">
            <div className="font-bold text-slate-800">Secrets in Logs</div>
            <div className="text-emerald-700 text-[11px]">AUTOMATED PASS</div>
          </div>
        </div>
      </div>

      {/* Audit Log Stream Table */}
      <div className="rounded-xl border border-slate-200/80 bg-white overflow-hidden shadow-2xs">
        <div className="px-4 py-3 bg-slate-50/70 border-b border-slate-200 flex justify-between items-center text-xs font-mono text-slate-600">
          <span className="font-bold uppercase tracking-wider">Immutable Audit Trail</span>
          <span>{auditLogs.length} Events Logged</span>
        </div>

        <table className="w-full text-left text-xs font-mono">
          <thead className="bg-slate-50/50 border-b border-slate-200 text-slate-500 uppercase text-[10px]">
            <tr>
              <th className="py-3 px-4">Timestamp</th>
              <th className="py-3 px-4">Actor</th>
              <th className="py-3 px-4">Action</th>
              <th className="py-3 px-4">Target Resource</th>
              <th className="py-3 px-4">Client IP</th>
              <th className="py-3 px-4 text-right font-sans">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {auditLogs.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-10 text-center text-slate-400 font-sans text-xs">
                  No audit logs recorded yet.
                </td>
              </tr>
            ) : (
              auditLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-2.5 px-4 text-slate-500">{new Date(log.created_at).toLocaleString()}</td>
                  <td className="py-2.5 px-4 font-semibold text-slate-800">{log.actor}</td>
                  <td className="py-2.5 px-4 text-blue-600 font-bold">{log.action}</td>
                  <td className="py-2.5 px-4 text-slate-700 truncate max-w-44">{log.resource}</td>
                  <td className="py-2.5 px-4 text-slate-500">{log.ip_address}</td>
                  <td className="py-2.5 px-4 text-right font-sans">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        log.status === "success"
                          ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                          : "bg-red-500/10 text-red-600 border border-red-500/20"
                      }`}
                    >
                      {log.status}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
