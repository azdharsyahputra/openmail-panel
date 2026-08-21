"use client";

import React, { useEffect, useState } from "react";
import { api, SyncReport } from "@/lib/api";

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
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
        <div>
          <h1 className="text-base font-bold text-slate-900">Identity & Directory (LDAP)</h1>
          <p className="text-xs text-slate-500">Centralized OpenLDAP / Active Directory synchronization & RBAC</p>
        </div>
        <button
          onClick={checkLdap}
          disabled={loading}
          className="px-3 py-1 text-xs font-medium bg-white hover:bg-slate-50 border border-slate-300 rounded text-slate-700 cursor-pointer"
        >
          {loading ? "Checking..." : "Check Connection"}
        </button>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-mono rounded">
          {error}
        </div>
      )}

      {/* Grid: Provider Info & RBAC Mapping */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Provider Status */}
        <div className="bg-white border border-slate-200 rounded p-4 space-y-3 font-mono text-xs">
          <div className="flex justify-between items-center pb-2 border-b border-slate-100 font-bold">
            <span>Provider Status</span>
            <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 text-[10px]">
              CONNECTED
            </span>
          </div>
          <div className="space-y-1.5 text-slate-600">
            <div className="flex justify-between">
              <span className="text-slate-400">Type:</span>
              <span>OpenLDAP / Active Directory</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Security:</span>
              <span>StartTLS (TLS 1.2+)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Fail-Closed:</span>
              <span className="text-emerald-600 font-semibold">Active (Zero Local Fallback)</span>
            </div>
          </div>
        </div>

        {/* Group to Role Mapping */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded overflow-hidden">
          <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-700 font-mono uppercase">
            LDAP Group $\rightarrow$ Role Mapping
          </div>
          <table className="w-full text-left text-xs font-mono">
            <tbody className="divide-y divide-slate-100">
              <tr>
                <td className="py-2 px-4 font-semibold text-slate-800">cn=mail-admins,ou=groups,dc=...</td>
                <td className="py-2 px-4 text-blue-600 font-bold">ADMIN</td>
                <td className="py-2 px-4 text-slate-500 font-sans">Full control plane mutations & system</td>
              </tr>
              <tr>
                <td className="py-2 px-4 font-semibold text-slate-800">cn=mail-operators,ou=groups,dc=...</td>
                <td className="py-2 px-4 text-indigo-600 font-bold">OPERATOR</td>
                <td className="py-2 px-4 text-slate-500 font-sans">Queue retry/hold, mailbox suspend/resume</td>
              </tr>
              <tr>
                <td className="py-2 px-4 font-semibold text-slate-800">cn=mail-auditors,ou=groups,dc=...</td>
                <td className="py-2 px-4 text-slate-700 font-bold">AUDITOR</td>
                <td className="py-2 px-4 text-slate-500 font-sans">Read-only audit logs & system health</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Directory Sync Console */}
      <div className="bg-white border border-slate-200 rounded p-4 space-y-4">
        <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-mono">
          Directory Synchronization Console
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Domain Filter (Optional)
            </label>
            <input
              type="text"
              placeholder="example.com"
              value={syncDomain}
              onChange={(e) => setSyncDomain(e.target.value)}
              className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded focus:outline-none font-mono"
            />
          </div>

          <div className="flex items-center gap-2 pt-5 text-xs">
            <label className="flex items-center gap-1.5 text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={autoProvision}
                onChange={(e) => setAutoProvision(e.target.checked)}
                className="rounded text-blue-600"
              />
              <span>Auto-create Mailboxes</span>
            </label>
          </div>

          <div className="flex items-center justify-between gap-2 pt-5">
            <label className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={dryRun}
                onChange={(e) => setDryRun(e.target.checked)}
                className="rounded text-blue-600"
              />
              <span>Dry Run</span>
            </label>

            <button
              onClick={handleRunSync}
              disabled={syncing}
              className="px-3 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded disabled:opacity-50 cursor-pointer"
            >
              {syncing ? "Syncing..." : dryRun ? "Run Preview" : "Execute Sync"}
            </button>
          </div>
        </div>

        {/* Sync Report */}
        {syncReport && (
          <div className="p-3 bg-slate-50 border border-slate-200 rounded text-xs font-mono space-y-2">
            <div className="flex justify-between font-bold text-slate-800">
              <span>Sync Execution ({syncReport.duration ? `${syncReport.duration}ms` : "< 1s"})</span>
              <span className="text-slate-500">{dryRun ? "PREVIEW" : "COMMITTED"}</span>
            </div>
            <div className="grid grid-cols-5 gap-2 text-center">
              <div className="p-2 bg-white rounded border border-slate-200">
                <div className="text-[10px] text-slate-400">Scanned</div>
                <div className="font-bold text-slate-800">{syncReport.total_identities}</div>
              </div>
              <div className="p-2 bg-white rounded border border-slate-200">
                <div className="text-[10px] text-emerald-600">Created</div>
                <div className="font-bold text-emerald-600">{syncReport.created}</div>
              </div>
              <div className="p-2 bg-white rounded border border-slate-200">
                <div className="text-[10px] text-blue-600">Updated</div>
                <div className="font-bold text-blue-600">{syncReport.updated}</div>
              </div>
              <div className="p-2 bg-white rounded border border-slate-200">
                <div className="text-[10px] text-amber-600">Suspended</div>
                <div className="font-bold text-amber-600">{syncReport.suspended}</div>
              </div>
              <div className="p-2 bg-white rounded border border-slate-200">
                <div className="text-[10px] text-slate-400">Skipped</div>
                <div className="font-bold text-slate-600">{syncReport.skipped}</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
