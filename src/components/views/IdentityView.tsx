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
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200/80 pb-4">
        <div>
          <h1 className="text-xl font-semibold text-zinc-950 tracking-tight">Identity & Directory (LDAP)</h1>
          <p className="text-xs text-zinc-500 mt-0.5">Centralized OpenLDAP / Active Directory synchronization & RBAC</p>
        </div>
        <button
          onClick={checkLdap}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white hover:bg-zinc-50 border border-zinc-200/80 rounded-lg text-zinc-700 shadow-2xs transition-all cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-zinc-400" : "text-zinc-500"}`} />
          <span>{loading ? "Checking..." : "Check LDAP State"}</span>
        </button>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-mono rounded-lg">
          {error}
        </div>
      )}

      {/* Grid: Provider Info & RBAC Mapping */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Provider Status */}
        <div className="rounded-xl border border-zinc-200/80 bg-white p-5 space-y-3 font-mono text-xs shadow-2xs">
          <div className="flex justify-between items-center pb-2 border-b border-zinc-100 font-bold">
            <span className="text-zinc-950">Provider Status</span>
            <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 text-[10px]">
              CONNECTED
            </span>
          </div>
          <div className="space-y-2 text-zinc-600">
            <div className="flex justify-between">
              <span className="text-zinc-400">Type:</span>
              <span className="text-zinc-950">OpenLDAP / Active Directory</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">Security:</span>
              <span className="text-zinc-950">StartTLS (TLS 1.2+)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">Fail-Closed:</span>
              <span className="text-emerald-600 font-semibold">Enforced (No fallback)</span>
            </div>
          </div>
        </div>

        {/* Group to Role Mapping */}
        <div className="lg:col-span-2 rounded-xl border border-zinc-200/80 bg-white overflow-hidden shadow-2xs">
          <div className="px-4 py-3 bg-zinc-50/70 border-b border-zinc-100 text-xs font-semibold text-zinc-800 font-mono uppercase tracking-wider">
            LDAP Group $\rightarrow$ Role Mapping
          </div>
          <table className="w-full text-left text-xs font-mono">
            <tbody className="divide-y divide-zinc-100">
              <tr className="hover:bg-zinc-50/50 transition-colors">
                <td className="py-2.5 px-4 font-medium text-zinc-950">cn=mail-admins,ou=groups,dc=...</td>
                <td className="py-2.5 px-4 text-blue-600 font-bold">ADMIN</td>
                <td className="py-2.5 px-4 text-zinc-500 font-sans">Full control plane mutations & system</td>
              </tr>
              <tr className="hover:bg-zinc-50/50 transition-colors">
                <td className="py-2.5 px-4 font-medium text-zinc-950">cn=mail-operators,ou=groups,dc=...</td>
                <td className="py-2.5 px-4 text-indigo-600 font-bold">OPERATOR</td>
                <td className="py-2.5 px-4 text-zinc-500 font-sans">Queue retry/hold, mailbox suspend/resume</td>
              </tr>
              <tr className="hover:bg-zinc-50/50 transition-colors">
                <td className="py-2.5 px-4 font-medium text-zinc-950">cn=mail-auditors,ou=groups,dc=...</td>
                <td className="py-2.5 px-4 text-zinc-700 font-bold">AUDITOR</td>
                <td className="py-2.5 px-4 text-zinc-500 font-sans">Read-only audit logs & system health</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Directory Sync Console */}
      <div className="rounded-xl border border-zinc-200/80 bg-white p-5 space-y-4 shadow-2xs">
        <h2 className="text-xs font-semibold text-zinc-950 uppercase tracking-wider font-mono">
          Directory Synchronization Console
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-zinc-700 mb-1">
              Domain Scope Filter (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. example.com"
              value={syncDomain}
              onChange={(e) => setSyncDomain(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-zinc-50 border border-zinc-300 rounded-lg focus:outline-none focus:bg-white focus:border-zinc-950 font-mono text-zinc-950"
            />
          </div>

          <div className="flex items-center gap-2 pt-6 text-xs">
            <label className="flex items-center gap-2 text-zinc-700 cursor-pointer">
              <input
                type="checkbox"
                checked={autoProvision}
                onChange={(e) => setAutoProvision(e.target.checked)}
                className="w-4 h-4 rounded text-zinc-950"
              />
              <span>Auto-create Mailboxes</span>
            </label>
          </div>

          <div className="flex items-center justify-between gap-3 pt-6">
            <label className="flex items-center gap-2 text-xs text-zinc-700 cursor-pointer">
              <input
                type="checkbox"
                checked={dryRun}
                onChange={(e) => setDryRun(e.target.checked)}
                className="w-4 h-4 rounded text-zinc-950"
              />
              <span>Dry Run Mode</span>
            </label>

            <button
              onClick={handleRunSync}
              disabled={syncing}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium bg-zinc-950 hover:bg-zinc-800 text-white rounded-lg disabled:opacity-50 cursor-pointer shadow-xs"
            >
              <Play className="w-3 h-3 fill-current" />
              <span>{syncing ? "Syncing..." : dryRun ? "Run Preview" : "Execute Sync"}</span>
            </button>
          </div>
        </div>

        {/* Sync Report */}
        {syncReport && (
          <div className="p-4 bg-zinc-50/70 border border-zinc-200/80 rounded-xl text-xs font-mono space-y-3 mt-4">
            <div className="flex justify-between font-bold text-zinc-800 border-b border-zinc-200 pb-2">
              <span>Sync Execution ({syncReport.duration ? `${syncReport.duration}ms` : "< 1s"})</span>
              <span className="text-zinc-500">{dryRun ? "PREVIEW ONLY" : "COMMITTED TO DATABASE"}</span>
            </div>
            <div className="grid grid-cols-5 gap-3 text-center">
              <div className="p-2.5 bg-white rounded-lg border border-zinc-200 shadow-2xs">
                <div className="text-[10px] text-zinc-400">Scanned</div>
                <div className="text-sm font-bold text-zinc-950 mt-0.5">{syncReport.total_identities}</div>
              </div>
              <div className="p-2.5 bg-white rounded-lg border border-zinc-200 shadow-2xs">
                <div className="text-[10px] text-emerald-600">Created</div>
                <div className="text-sm font-bold text-emerald-600 mt-0.5">{syncReport.created}</div>
              </div>
              <div className="p-2.5 bg-white rounded-lg border border-zinc-200 shadow-2xs">
                <div className="text-[10px] text-blue-600">Updated</div>
                <div className="text-sm font-bold text-blue-600 mt-0.5">{syncReport.updated}</div>
              </div>
              <div className="p-2.5 bg-white rounded-lg border border-zinc-200 shadow-2xs">
                <div className="text-[10px] text-amber-600">Suspended</div>
                <div className="text-sm font-bold text-amber-600 mt-0.5">{syncReport.suspended}</div>
              </div>
              <div className="p-2.5 bg-white rounded-lg border border-zinc-200 shadow-2xs">
                <div className="text-[10px] text-zinc-400">Skipped</div>
                <div className="text-sm font-bold text-zinc-600 mt-0.5">{syncReport.skipped}</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
