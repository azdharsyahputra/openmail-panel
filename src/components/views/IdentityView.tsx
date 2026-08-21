"use client";

import React, { useEffect, useState } from "react";
import { api, SyncReport } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";
import {
  RefreshCw,
  Play,
  KeyRound,
  ShieldCheck,
  Users,
  CheckCircle2,
  Lock,
  ArrowRight,
  Shield,
  Layers,
  Sparkles,
} from "lucide-react";

export function IdentityView() {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [ldapStatus, setLdapStatus] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Sync Parameters
  const [syncDomain, setSyncDomain] = useState("");
  const [autoProvision, setAutoProvision] = useState(true);
  const [dryRun, setDryRun] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncReport, setSyncReport] = useState<SyncReport | null>(null);

  const checkLdap = async (notify = false) => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getLDAPStatus();
      setLdapStatus(res);
      if (notify) {
        toast.info("LDAP Status Checked", "Directory provider status refreshed.");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to query LDAP provider";
      setError(msg);
      toast.error("LDAP Query Error", msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkLdap(false);
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
      toast.success(
        dryRun ? "Directory Sync Preview Complete" : "Directory Sync Executed",
        `Scanned ${report.total_identities || 0} identities, ${report.created || 0} created, ${report.updated || 0} updated.`
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Directory synchronization failed";
      setError(msg);
      toast.error("Directory Sync Failed", msg);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="h-full flex flex-col space-y-4 max-w-6xl mx-auto overflow-y-auto pr-1">
      {/* Header Bar */}
      <div className="shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200/80 pb-3">
        <div>
          <h1 className="text-xl font-semibold text-zinc-950 tracking-tight">Identity & Directory (LDAP)</h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            Centralized OpenLDAP / Active Directory identity synchronization & Role-Based Access Control
          </p>
        </div>
        <button
          onClick={() => checkLdap(true)}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white hover:bg-zinc-50 border border-zinc-200/80 rounded-lg text-zinc-700 shadow-2xs transition-all cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-zinc-400" : "text-zinc-500"}`} />
          <span>{loading ? "Probing LDAP..." : "Check LDAP State"}</span>
        </button>
      </div>

      {error && (
        <div className="shrink-0 p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-mono rounded-xl">
          {error}
        </div>
      )}

      {/* Top 3 Identity Cards Grid */}
      <div className="shrink-0 grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Directory Provider */}
        <div className="p-4 rounded-2xl bg-white border border-zinc-200/80 shadow-2xs flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center">
                <KeyRound className="w-4 h-4" />
              </div>
              <span className="text-xs font-semibold text-zinc-950">Directory Provider</span>
            </div>
            <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 text-[10px] font-mono font-semibold">
              CONNECTED
            </span>
          </div>

          <div className="space-y-1.5 font-mono text-xs text-zinc-600">
            <div className="flex justify-between">
              <span className="text-zinc-400">Server:</span>
              <span className="text-zinc-900 font-semibold">OpenLDAP / AD</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">Port & Transport:</span>
              <span className="text-zinc-900">Port 389 (StartTLS)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">Security Invariant:</span>
              <span className="text-emerald-700 font-semibold">Fail-Closed Enforced</span>
            </div>
          </div>
        </div>

        {/* Card 2: Security & RBAC Scopes */}
        <div className="p-4 rounded-2xl bg-white border border-zinc-200/80 shadow-2xs flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 border border-purple-100 flex items-center justify-center">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <span className="text-xs font-semibold text-zinc-950">RBAC Hierarchy</span>
            </div>
            <span className="text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200 text-[10px] font-mono font-semibold">
              3 ROLES ACTIVE
            </span>
          </div>

          <div className="space-y-1.5 font-mono text-xs text-zinc-600">
            <div className="flex justify-between items-center">
              <span className="text-zinc-400">Admin Scope:</span>
              <span className="px-1.5 py-0.2 rounded border bg-purple-50 text-purple-700 border-purple-200 text-[10px] font-bold">
                FULL ACCESS
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-zinc-400">Operator Scope:</span>
              <span className="px-1.5 py-0.2 rounded border bg-indigo-50 text-indigo-700 border-indigo-200 text-[10px] font-bold">
                QUEUE & MAILBOX
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-zinc-400">Auditor Scope:</span>
              <span className="px-1.5 py-0.2 rounded border bg-zinc-100 text-zinc-700 border-zinc-200 text-[10px] font-bold">
                READ-ONLY AUDIT
              </span>
            </div>
          </div>
        </div>

        {/* Card 3: Auto-Provisioning Engine */}
        <div className="p-4 rounded-2xl bg-white border border-zinc-200/80 shadow-2xs flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
              <span className="text-xs font-semibold text-zinc-950">Provisioning Engine</span>
            </div>
            <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 text-[10px] font-mono font-semibold">
              AUTO-PROVISION
            </span>
          </div>

          <div className="space-y-1.5 font-mono text-xs text-zinc-600">
            <div className="flex justify-between">
              <span className="text-zinc-400">Dovecot Sync:</span>
              <span className="text-zinc-900 font-semibold">Maildir On-Demand</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">Default Quota:</span>
              <span className="text-zinc-900">1024 MB (Configurable)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">Account Lifecycle:</span>
              <span className="text-emerald-700 font-semibold">Auto-Suspend on Deletion</span>
            </div>
          </div>
        </div>
      </div>

      {/* RBAC Group Mapping Matrix Card */}
      <div className="shrink-0 rounded-2xl border border-zinc-200/80 bg-white overflow-hidden shadow-2xs">
        <div className="px-5 py-3 border-b border-zinc-100 flex justify-between items-center bg-zinc-50/50">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-zinc-700" />
            <h2 className="text-xs font-semibold text-zinc-950 uppercase tracking-wider font-mono">
              LDAP Group $\rightarrow$ Control Plane Role Mapping
            </h2>
          </div>
          <span className="text-zinc-400 text-[11px] font-mono">Real-time Group Evaluation</span>
        </div>

        <table className="w-full text-left text-xs font-mono">
          <thead className="bg-zinc-50/80 border-b border-zinc-200 text-zinc-500 uppercase text-[10px]">
            <tr>
              <th className="py-3 px-6 text-left">Directory Distinguished Name (DN)</th>
              <th className="py-3 px-4 w-36 text-center">Assigned Role</th>
              <th className="py-3 px-6 text-left">Authorized Scope & Permissions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            <tr className="hover:bg-zinc-50/50 transition-colors">
              <td className="py-3 px-6 font-semibold text-zinc-900 text-left">
                cn=mail-admins,ou=groups,dc=mailopen,dc=internal
              </td>
              <td className="py-3 px-4 text-center">
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-purple-500/10 text-purple-700 border border-purple-200">
                  ADMIN
                </span>
              </td>
              <td className="py-3 px-6 text-zinc-600 font-sans text-left">
                Full control plane mutations, domain DNS/DKIM keys, backups, and security doctor
              </td>
            </tr>
            <tr className="hover:bg-zinc-50/50 transition-colors">
              <td className="py-3 px-6 font-semibold text-zinc-900 text-left">
                cn=mail-operators,ou=groups,dc=mailopen,dc=internal
              </td>
              <td className="py-3 px-4 text-center">
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-indigo-500/10 text-indigo-700 border border-indigo-200">
                  OPERATOR
                </span>
              </td>
              <td className="py-3 px-6 text-zinc-600 font-sans text-left">
                Mailbox password resets, suspend/resume, and transport queue retry/flush operations
              </td>
            </tr>
            <tr className="hover:bg-zinc-50/50 transition-colors">
              <td className="py-3 px-6 font-semibold text-zinc-900 text-left">
                cn=mail-auditors,ou=groups,dc=mailopen,dc=internal
              </td>
              <td className="py-3 px-4 text-center">
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-zinc-100 text-zinc-700 border border-zinc-200">
                  AUDITOR
                </span>
              </td>
              <td className="py-3 px-6 text-zinc-600 font-sans text-left">
                Read-only access to immutable security audit logs, Prometheus metrics, and system diagnostics
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Directory Synchronization Console Card */}
      <div className="shrink-0 rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-2xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-600" />
            <h2 className="text-xs font-semibold text-zinc-950 uppercase tracking-wider font-mono">
              Directory Synchronization Console
            </h2>
          </div>
          <span className="text-zinc-500 text-[11px] font-mono">LDAP $\rightarrow$ PostgreSQL Sync Engine</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
          {/* Domain Scope Input */}
          <div className="md:col-span-5 space-y-1">
            <label className="block text-xs font-medium text-zinc-700">
              Domain Scope Filter (Optional)
            </label>
            <input
              type="text"
              placeholder="Leave empty for all domains or e.g. example.com"
              value={syncDomain}
              onChange={(e) => setSyncDomain(e.target.value)}
              className="w-full px-3.5 py-2 text-xs bg-zinc-50 border border-zinc-300 rounded-xl focus:outline-none focus:bg-white focus:border-zinc-950 font-mono text-zinc-950"
            />
          </div>

          {/* Checkbox Options */}
          <div className="md:col-span-4 flex items-center gap-4 text-xs">
            <label className="flex items-center gap-2 text-zinc-700 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={autoProvision}
                onChange={(e) => setAutoProvision(e.target.checked)}
                className="w-4 h-4 rounded text-zinc-950 cursor-pointer"
              />
              <span className="font-medium">Auto-create Mailboxes</span>
            </label>

            <label className="flex items-center gap-2 text-zinc-700 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={dryRun}
                onChange={(e) => setDryRun(e.target.checked)}
                className="w-4 h-4 rounded text-zinc-950 cursor-pointer"
              />
              <span className="font-medium">Dry Run (Preview)</span>
            </label>
          </div>

          {/* Run Button */}
          <div className="md:col-span-3 flex justify-end">
            <button
              onClick={handleRunSync}
              disabled={syncing}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-medium bg-zinc-950 hover:bg-zinc-800 text-white rounded-xl disabled:opacity-50 cursor-pointer shadow-xs transition-all"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>{syncing ? "Synchronizing..." : dryRun ? "Run Preview" : "Execute Sync"}</span>
            </button>
          </div>
        </div>

        {/* Sync Report Results Card */}
        {syncReport && (
          <div className="p-4 bg-zinc-50/70 border border-zinc-200/80 rounded-2xl text-xs font-mono space-y-3 mt-4">
            <div className="flex justify-between items-center font-bold text-zinc-800 border-b border-zinc-200 pb-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Sync Execution Completed ({syncReport.duration ? `${syncReport.duration}ms` : "< 1s"})</span>
              </div>
              <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                dryRun ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"
              }`}>
                {dryRun ? "DRY RUN PREVIEW" : "COMMITTED TO DATABASE"}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
              <div className="p-3 bg-white rounded-xl border border-zinc-200 shadow-2xs">
                <div className="text-[10px] text-zinc-400 uppercase">Identities Scanned</div>
                <div className="text-lg font-bold text-zinc-950 mt-0.5">{syncReport.total_identities}</div>
              </div>
              <div className="p-3 bg-white rounded-xl border border-zinc-200 shadow-2xs">
                <div className="text-[10px] text-emerald-600 uppercase">Created</div>
                <div className="text-lg font-bold text-emerald-600 mt-0.5">+{syncReport.created}</div>
              </div>
              <div className="p-3 bg-white rounded-xl border border-zinc-200 shadow-2xs">
                <div className="text-[10px] text-blue-600 uppercase">Updated</div>
                <div className="text-lg font-bold text-blue-600 mt-0.5">{syncReport.updated}</div>
              </div>
              <div className="p-3 bg-white rounded-xl border border-zinc-200 shadow-2xs">
                <div className="text-[10px] text-amber-600 uppercase">Suspended</div>
                <div className="text-lg font-bold text-amber-600 mt-0.5">{syncReport.suspended}</div>
              </div>
              <div className="p-3 bg-white rounded-xl border border-zinc-200 shadow-2xs">
                <div className="text-[10px] text-zinc-400 uppercase">Skipped</div>
                <div className="text-lg font-bold text-zinc-600 mt-0.5">{syncReport.skipped}</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
