"use client";

import React, { useEffect, useState } from "react";
import { api, SyncReport } from "@/lib/api";
import { RefreshCw, Play } from "lucide-react";

export function IdentityView() {
  const [loading, setLoading] = useState(false);
  const [ldapStatus, setLdapStatus] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Sync Parameters
  const [syncDomain, setSyncDomain] = useState("");
  const [autoProvision, setAutoProvision] = useState(true);
  const [dryRun, setDryRun] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncReport, setSyncReport] = useState<SyncReport | null>(null);

  const checkLdap = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getLDAPStatus();
      setLdapStatus(res);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to query LDAP provider");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkLdap();
  }, []);

  const handleRunSync = async () => {
    try {
      setSyncing(true);
      setError(null);
      const report = await api.syncLDAP({
        domain_name: syncDomain ? syncDomain.trim() : undefined,
        auto_create_mailbox: autoProvision,
        dry_run: dryRun,
      });
      setSyncReport(report);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Directory synchronization failed");
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Identity & Directory (LDAP)</h1>
          <p className="text-xs text-slate-500 mt-0.5">Centralized OpenLDAP / Active Directory synchronization & RBAC</p>
        </div>
        <button
          onClick={checkLdap}
          disabled={loading}
          className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium bg-white hover:bg-slate-50 border border-slate-200 rounded-full text-slate-700 shadow-2xs transition-all cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>{loading ? "Checking..." : "Check LDAP State"}</span>
        </button>
      </div>

      {error && (
        <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 text-xs font-medium rounded-xl">
          {error}
        </div>
      )}

      {/* Grid: Provider Info & RBAC Mapping */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Provider Status */}
        <div className="rounded-2xl border border-slate-200/80 p-5 space-y-4 font-mono text-xs shadow-2xs">
          <div className="flex justify-between items-center pb-2 border-b border-slate-100 font-bold">
            <span className="text-slate-900">Provider Status</span>
            <span className="text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 text-[10px]">
              CONNECTED
            </span>
          </div>
          <div className="space-y-2 text-slate-600">
            <div className="flex justify-between">
              <span className="text-slate-400">Type:</span>
              <span className="text-slate-800">OpenLDAP / Active Directory</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Security:</span>
              <span className="text-slate-800">StartTLS (TLS 1.2+)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Fail-Closed:</span>
              <span className="text-emerald-600 font-semibold">Enforced (No local fallback)</span>
            </div>
          </div>
        </div>

        {/* Group to Role Mapping */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-200/80 overflow-hidden shadow-2xs">
          <div className="px-5 py-3 bg-[#f8fafd] border-b border-slate-200 text-xs font-bold text-slate-800 font-mono uppercase tracking-wider">
            LDAP Group $\rightarrow$ Role Mapping
          </div>
          <table className="w-full text-left text-xs font-mono">
            <tbody className="divide-y divide-slate-100">
              <tr className="hover:bg-[#f8fafd] transition-colors">
                <td className="py-2.5 px-5 font-semibold text-slate-800">cn=mail-admins,ou=groups,dc=...</td>
                <td className="py-2.5 px-5 text-blue-600 font-bold">ADMIN</td>
                <td className="py-2.5 px-5 text-slate-500 font-sans">Full control plane mutations & system</td>
              </tr>
              <tr className="hover:bg-[#f8fafd] transition-colors">
                <td className="py-2.5 px-5 font-semibold text-slate-800">cn=mail-operators,ou=groups,dc=...</td>
                <td className="py-2.5 px-5 text-indigo-600 font-bold">OPERATOR</td>
                <td className="py-2.5 px-5 text-slate-500 font-sans">Queue retry/hold, mailbox suspend/resume</td>
              </tr>
              <tr className="hover:bg-[#f8fafd] transition-colors">
                <td className="py-2.5 px-5 font-semibold text-slate-800">cn=mail-auditors,ou=groups,dc=...</td>
                <td className="py-2.5 px-5 text-slate-700 font-bold">AUDITOR</td>
                <td className="py-2.5 px-5 text-slate-500 font-sans">Read-only audit logs & system health</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Directory Sync Console */}
      <div className="rounded-2xl border border-slate-200/80 p-6 space-y-4 shadow-2xs">
        <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-mono">
          Directory Synchronization Console
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Domain Scope Filter (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. example.com"
              value={syncDomain}
              onChange={(e) => setSyncDomain(e.target.value)}
              className="w-full px-3.5 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-blue-600 font-mono"
            />
          </div>

          <div className="flex items-center gap-2 pt-6 text-xs">
            <label className="flex items-center gap-2 text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={autoProvision}
                onChange={(e) => setAutoProvision(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600"
              />
              <span>Auto-create Mailboxes</span>
            </label>
          </div>

          <div className="flex items-center justify-between gap-3 pt-6">
            <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={dryRun}
                onChange={(e) => setDryRun(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600"
              />
              <span>Dry Run Mode</span>
            </label>

            <button
              onClick={handleRunSync}
              disabled={syncing}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-full disabled:opacity-50 cursor-pointer shadow-xs"
            >
              <Play className="w-3 h-3 fill-current" />
              <span>{syncing ? "Syncing..." : dryRun ? "Run Preview" : "Execute Sync"}</span>
            </button>
          </div>
        </div>

        {/* Sync Report */}
        {syncReport && (
          <div className="p-4 bg-[#f8fafd] border border-slate-200 rounded-2xl text-xs font-mono space-y-3 mt-4">
            <div className="flex justify-between font-bold text-slate-800 border-b border-slate-200 pb-2">
              <span>Sync Execution ({syncReport.duration ? `${syncReport.duration}ms` : "< 1s"})</span>
              <span className="text-slate-500">{dryRun ? "PREVIEW ONLY" : "COMMITTED TO DATABASE"}</span>
            </div>
            <div className="grid grid-cols-5 gap-3 text-center">
              <div className="p-2.5 bg-white rounded-xl border border-slate-200 shadow-2xs">
                <div className="text-[10px] text-slate-400">Scanned</div>
                <div className="text-base font-bold text-slate-800 mt-0.5">{syncReport.total_identities}</div>
              </div>
              <div className="p-2.5 bg-white rounded-xl border border-slate-200 shadow-2xs">
                <div className="text-[10px] text-emerald-600">Created</div>
                <div className="text-base font-bold text-emerald-600 mt-0.5">{syncReport.created}</div>
              </div>
              <div className="p-2.5 bg-white rounded-xl border border-slate-200 shadow-2xs">
                <div className="text-[10px] text-blue-600">Updated</div>
                <div className="text-base font-bold text-blue-600 mt-0.5">{syncReport.updated}</div>
              </div>
              <div className="p-2.5 bg-white rounded-xl border border-slate-200 shadow-2xs">
                <div className="text-[10px] text-amber-600">Suspended</div>
                <div className="text-base font-bold text-amber-600 mt-0.5">{syncReport.suspended}</div>
              </div>
              <div className="p-2.5 bg-white rounded-xl border border-slate-200 shadow-2xs">
                <div className="text-[10px] text-slate-400">Skipped</div>
                <div className="text-base font-bold text-slate-600 mt-0.5">{syncReport.skipped}</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
