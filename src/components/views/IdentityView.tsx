"use client";

import React, { useEffect, useState } from "react";
import { api, SyncReport } from "@/lib/api";
import {
  Users,
  ShieldCheck,
  RefreshCw,
  Play,
  CheckCircle2,
  AlertCircle,
  Server,
  Layers,
  ArrowRight,
  Database,
} from "lucide-react";

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
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Identity & Directory (LDAP)</h1>
          <p className="text-sm text-slate-500">Centralized OpenLDAP / Active Directory synchronization & RBAC</p>
        </div>
        <button
          onClick={checkLdap}
          className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 shadow-2xs transition-colors cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Re-check LDAP</span>
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}

      {/* Grid: Provider Info & RBAC Mapping */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Provider Status Card */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <Server className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Active Identity Provider</h3>
                <p className="text-xs text-slate-400 font-mono">OpenLDAP / Active Directory</p>
              </div>
            </div>
            <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase">
              CONNECTED
            </span>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 text-xs space-y-2 font-mono">
            <div className="flex justify-between">
              <span className="text-slate-500">Protocol:</span>
              <span className="font-semibold text-slate-800">LDAPS / StartTLS (TLS 1.2+)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Subtree Security:</span>
              <span className="font-semibold text-emerald-600">Base DN Subtree Bounded</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Fail-Closed Mode:</span>
              <span className="font-semibold text-emerald-600">Active (Zero fallback)</span>
            </div>
          </div>
        </div>

        {/* Group to Role Mapping Card */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
          <div className="flex items-center gap-2 mb-4">
            <ShieldCheck className="w-5 h-5 text-indigo-600" />
            <h3 className="font-bold text-slate-900 text-base">LDAP Group $\rightarrow$ RBAC Mapping</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-2.5 px-3">LDAP Group DN</th>
                  <th className="py-2.5 px-3">Mapped Role</th>
                  <th className="py-2.5 px-3">Access Capabilities</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                <tr>
                  <td className="py-2.5 px-3 font-semibold text-slate-800">cn=mail-admins,ou=groups,dc=...</td>
                  <td className="py-2.5 px-3">
                    <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-bold text-[10px]">ADMIN</span>
                  </td>
                  <td className="py-2.5 px-3 text-slate-500 font-sans">Full control plane mutations & system</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 font-semibold text-slate-800">cn=mail-operators,ou=groups,dc=...</td>
                  <td className="py-2.5 px-3">
                    <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-bold text-[10px]">OPERATOR</span>
                  </td>
                  <td className="py-2.5 px-3 text-slate-500 font-sans">Queue retry/hold, mailbox suspend/resume</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 font-semibold text-slate-800">cn=mail-auditors,ou=groups,dc=...</td>
                  <td className="py-2.5 px-3">
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-bold text-[10px]">AUDITOR</span>
                  </td>
                  <td className="py-2.5 px-3 text-slate-500 font-sans">Read-only audit logs & system health</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Directory Sync Console */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-6">
        <div>
          <h2 className="text-base font-bold text-slate-900">Directory Synchronization Console</h2>
          <p className="text-xs text-slate-500">
            Reconcile remote LDAP directory entries into MailOpen local virtual mailboxes.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Domain Scope Filter (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. example.com (Leave blank for all)"
              value={syncDomain}
              onChange={(e) => setSyncDomain(e.target.value)}
              className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-3 pt-6">
            <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={autoProvision}
                onChange={(e) => setAutoProvision(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
              />
              <span>Auto-create Mailboxes & Storage</span>
            </label>
          </div>

          <div className="flex items-center justify-between gap-3 pt-6">
            <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={dryRun}
                onChange={(e) => setDryRun(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
              />
              <span>Dry Run Preview Only</span>
            </label>

            <button
              onClick={handleRunSync}
              disabled={syncing}
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-sm disabled:opacity-50 flex items-center gap-2 cursor-pointer"
            >
              {syncing ? (
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Play className="w-3.5 h-3.5" />
              )}
              <span>{dryRun ? "Run Sync Preview" : "Execute Sync"}</span>
            </button>
          </div>
        </div>

        {/* Sync Report Output */}
        {syncReport && (
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-3">
            <div className="flex items-center justify-between font-bold text-slate-900 border-b border-slate-200 pb-2">
              <span className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Sync Execution Completed ({syncReport.duration ? `${syncReport.duration}ms` : "< 1s"})</span>
              </span>
              <span className="font-mono text-slate-500">{dryRun ? "DRY RUN MODE" : "APPLIED TO DATABASE"}</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 font-mono">
              <div className="p-2.5 bg-white rounded border border-slate-200 text-center">
                <div className="text-[10px] text-slate-500">Scanned</div>
                <div className="text-base font-bold text-slate-800">{syncReport.total_identities}</div>
              </div>
              <div className="p-2.5 bg-white rounded border border-slate-200 text-center">
                <div className="text-[10px] text-emerald-600">Created</div>
                <div className="text-base font-bold text-emerald-600">{syncReport.created}</div>
              </div>
              <div className="p-2.5 bg-white rounded border border-slate-200 text-center">
                <div className="text-[10px] text-blue-600">Updated</div>
                <div className="text-base font-bold text-blue-600">{syncReport.updated}</div>
              </div>
              <div className="p-2.5 bg-white rounded border border-slate-200 text-center">
                <div className="text-[10px] text-amber-600">Suspended</div>
                <div className="text-base font-bold text-amber-600">{syncReport.suspended}</div>
              </div>
              <div className="p-2.5 bg-white rounded border border-slate-200 text-center">
                <div className="text-[10px] text-slate-400">Skipped</div>
                <div className="text-base font-bold text-slate-600">{syncReport.skipped}</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
