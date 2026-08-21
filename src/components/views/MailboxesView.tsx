"use client";

import React, { useEffect, useState } from "react";
import { api, MailboxItem, AliasItem, DomainItem } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import {
  RefreshCw,
  Plus,
  X,
  ChevronLeft,
  ChevronRight,
  Search,
  Mail,
  HardDrive,
  UserCheck,
} from "lucide-react";

export function MailboxesView() {
  const toast = useToast();
  const [mailboxes, setMailboxes] = useState<MailboxItem[]>([]);
  const [domains, setDomains] = useState<DomainItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [domainFilter, setDomainFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "suspended">("all");

  // Pagination State
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newQuotaMB, setNewQuotaMB] = useState(1024);
  const [creating, setCreating] = useState(false);

  // Delete Modal State
  const [mailboxToDelete, setMailboxToDelete] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Password Reset Modal
  const [pwResetMailbox, setPwResetMailbox] = useState<string | null>(null);
  const [resetPasswordVal, setResetPasswordVal] = useState("");
  const [resettingPw, setResettingPw] = useState(false);

  // Alias Manager Drawer
  const [aliasMailbox, setAliasMailbox] = useState<string | null>(null);
  const [aliases, setAliases] = useState<AliasItem[]>([]);
  const [newAlias, setNewAlias] = useState("");
  const [addingAlias, setAddingAlias] = useState(false);

  const loadData = async (notify = false) => {
    try {
      setLoading(true);
      setError(null);
      const [mbs, doms] = await Promise.all([
        api.getMailboxes(),
        api.getDomains().catch(() => []),
      ]);
      setMailboxes(mbs);
      setDomains(doms);
      if (notify) {
        toast.info("Mailboxes Refreshed", `Loaded ${mbs.length} accounts across ${doms.length} domains.`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load mailboxes";
      setError(msg);
      toast.error("Error Loading Mailboxes", msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(false);
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail || !newPassword) return;
    try {
      setCreating(true);
      const quotaBytes = newQuotaMB * 1024 * 1024;
      await api.createMailbox(newEmail.trim(), newPassword, quotaBytes);
      await api.provisionMailbox(newEmail.trim()).catch(() => {});
      toast.success("Mailbox Created", `Account ${newEmail.trim()} provisioned with ${newQuotaMB}MB quota.`);
      setNewEmail("");
      setNewPassword("");
      setShowAddModal(false);
      await loadData();
    } catch (err: unknown) {
      toast.error("Failed to Create Mailbox", err instanceof Error ? err.message : "Mailbox creation failed");
    } finally {
      setCreating(false);
    }
  };

  const handleToggleStatus = async (mb: MailboxItem) => {
    try {
      if (mb.status === "active") {
        await api.suspendMailbox(mb.email);
        toast.warning("Mailbox Suspended", `Account ${mb.email} is now suspended.`);
      } else {
        await api.resumeMailbox(mb.email);
        toast.success("Mailbox Resumed", `Account ${mb.email} is now active.`);
      }
      await loadData();
    } catch (err: unknown) {
      toast.error("Status Update Failed", err instanceof Error ? err.message : "Failed to update mailbox status");
    }
  };

  const confirmDeleteMailbox = async () => {
    if (!mailboxToDelete) return;
    try {
      setDeleting(true);
      await api.deleteMailbox(mailboxToDelete);
      toast.success("Mailbox Deleted", `Account ${mailboxToDelete} and associated Maildir data purged.`);
      setMailboxToDelete(null);
      await loadData();
    } catch (err: unknown) {
      toast.error("Failed to Delete Mailbox", err instanceof Error ? err.message : "Deletion failed");
    } finally {
      setDeleting(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pwResetMailbox || !resetPasswordVal) return;
    try {
      setResettingPw(true);
      await api.setMailboxPassword(pwResetMailbox, resetPasswordVal);
      toast.success("Password Updated", `Credentials for ${pwResetMailbox} updated successfully.`);
      setPwResetMailbox(null);
      setResetPasswordVal("");
    } catch (err: unknown) {
      toast.error("Password Reset Failed", err instanceof Error ? err.message : "Failed to reset password");
    } finally {
      setResettingPw(false);
    }
  };

  const openAliasDrawer = async (email: string) => {
    setAliasMailbox(email);
    setAliases([]);
    setNewAlias("");
    try {
      const list = await api.getAliases(email);
      setAliases(list);
    } catch {
      // Ignored
    }
  };

  const handleAddAlias = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aliasMailbox || !newAlias) return;
    try {
      setAddingAlias(true);
      await api.createAlias(aliasMailbox, newAlias.trim());
      toast.success("Alias Added", `Forwarding from ${newAlias.trim()} $\rightarrow$ ${aliasMailbox}`);
      setNewAlias("");
      const list = await api.getAliases(aliasMailbox);
      setAliases(list);
    } catch (err: unknown) {
      toast.error("Failed to Add Alias", err instanceof Error ? err.message : "Alias creation failed");
    } finally {
      setAddingAlias(false);
    }
  };

  const handleDeleteAlias = async (aliasEmail: string) => {
    if (!aliasMailbox) return;
    try {
      await api.deleteAlias(aliasMailbox, aliasEmail);
      toast.success("Alias Deleted", `Forwarding for ${aliasEmail} removed.`);
      const list = await api.getAliases(aliasMailbox);
      setAliases(list);
    } catch (err: unknown) {
      toast.error("Failed to Delete Alias", err instanceof Error ? err.message : "Alias deletion failed");
    }
  };

  const formatBytes = (bytes: number) => {
    if (!bytes || bytes === 0) return "0 MB";
    const mb = bytes / (1024 * 1024);
    if (mb >= 1024) {
      return (mb / 1024).toFixed(1) + " GB";
    }
    return mb.toFixed(1) + " MB";
  };

  // Filtered Mailboxes
  const filteredMailboxes = mailboxes.filter((mb) => {
    const matchesSearch = mb.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDomain = domainFilter === "all" ? true : mb.email.endsWith(`@${domainFilter}`);
    const matchesStatus =
      statusFilter === "all" ? true : statusFilter === "active" ? mb.status === "active" : mb.status !== "active";
    return matchesSearch && matchesDomain && matchesStatus;
  });

  // Pagination Calculations
  const totalPages = Math.ceil(filteredMailboxes.length / pageSize) || 1;
  const paginatedMailboxes = filteredMailboxes.slice((page - 1) * pageSize, page * pageSize);
  const startIdx = filteredMailboxes.length > 0 ? (page - 1) * pageSize + 1 : 0;
  const endIdx = Math.min(page * pageSize, filteredMailboxes.length);

  const activeCount = mailboxes.filter((m) => m.status === "active").length;
  const totalUsed = mailboxes.reduce((acc, m) => acc + (m.used_bytes || 0), 0);
  const totalQuota = mailboxes.reduce((acc, m) => acc + (m.quota_bytes || 0), 0);

  return (
    <div className="h-full flex flex-col space-y-4 max-w-6xl mx-auto min-h-0">
      {/* Header Bar */}
      <div className="shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200/80 pb-3">
        <div>
          <h1 className="text-xl font-semibold text-zinc-950 tracking-tight">Mailbox Accounts</h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            Dovecot Maildir storage accounts, quotas, authentication, and virtual alias routing
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => loadData(true)}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white hover:bg-zinc-50 border border-zinc-200/80 rounded-lg text-zinc-700 shadow-2xs transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-zinc-400" : "text-zinc-500"}`} />
            <span>Refresh</span>
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium bg-zinc-950 hover:bg-zinc-800 text-white rounded-lg shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Mailbox</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="shrink-0 p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-mono rounded-xl">
          {error}
        </div>
      )}

      {/* Top 3 KPI Summary Cards */}
      <div className="shrink-0 grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="p-4 bg-white border border-zinc-200/80 rounded-2xl shadow-2xs space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-[10px] text-zinc-400 font-mono uppercase tracking-wider">Mailbox Accounts</span>
            <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 text-[10px] font-mono font-semibold">
              {activeCount} ACTIVE
            </span>
          </div>
          <div className="text-2xl font-bold text-zinc-950 font-mono">{mailboxes.length}</div>
          <div className="text-[11px] text-zinc-500 font-sans">Active Dovecot Maildir virtual accounts</div>
        </div>

        <div className="p-4 bg-white border border-zinc-200/80 rounded-2xl shadow-2xs space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-[10px] text-zinc-400 font-mono uppercase tracking-wider">Storage Pool</span>
            <span className="text-zinc-800 bg-zinc-100 px-2 py-0.5 rounded-md border border-zinc-200 text-[10px] font-mono font-semibold">
              {formatBytes(totalQuota)} POOL
            </span>
          </div>
          <div className="text-2xl font-bold text-zinc-950 font-mono">{formatBytes(totalUsed)}</div>
          <div className="text-[11px] text-zinc-500 font-sans">Total storage used across all mailboxes</div>
        </div>

        <div className="p-4 bg-white border border-zinc-200/80 rounded-2xl shadow-2xs space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-[10px] text-zinc-400 font-mono uppercase tracking-wider">Protocols & Auth</span>
            <span className="text-zinc-800 bg-zinc-100 px-2 py-0.5 rounded-md border border-zinc-200 text-[10px] font-mono font-semibold">
              SASL / TLS
            </span>
          </div>
          <div className="text-2xl font-bold text-zinc-950 font-mono">IMAP / IMAPS</div>
          <div className="text-[11px] text-zinc-500 font-sans">Ports 143 & 993 with StartTLS encryption</div>
        </div>
      </div>

      {/* Table Container with Integrated Search & Filters */}
      <div className="flex-1 min-h-0 rounded-2xl border border-zinc-200/80 bg-white overflow-hidden shadow-2xs flex flex-col justify-between">
        {/* Search & Filter Bar */}
        <div className="shrink-0 px-4 py-3 bg-zinc-50/80 border-b border-zinc-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by email address..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              className="w-full pl-8.5 pr-3 py-1.5 text-xs bg-white border border-zinc-200 rounded-lg text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-900 font-mono"
            />
          </div>

          <div className="flex items-center gap-3 text-xs font-mono text-zinc-500">
            <div className="flex items-center gap-1.5">
              <span>Domain:</span>
              <select
                value={domainFilter}
                onChange={(e) => {
                  setDomainFilter(e.target.value);
                  setPage(1);
                }}
                className="px-2 py-1 bg-white border border-zinc-200 rounded-lg text-zinc-800 text-xs font-mono cursor-pointer"
              >
                <option value="all">All Domains ({domains.length})</option>
                {domains.map((d) => (
                  <option key={d.id} value={d.name}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <span>Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value as "all" | "active" | "suspended");
                  setPage(1);
                }}
                className="px-2 py-1 bg-white border border-zinc-200 rounded-lg text-zinc-800 text-xs font-mono cursor-pointer"
              >
                <option value="all">All ({mailboxes.length})</option>
                <option value="active">Active ({activeCount})</option>
                <option value="suspended">Suspended ({mailboxes.length - activeCount})</option>
              </select>
            </div>
          </div>
        </div>

        {/* Mailboxes Table */}
        <div className="flex-1 overflow-y-auto min-h-0">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-50/80 border-b border-zinc-200 font-mono text-zinc-500 uppercase text-[10px] sticky top-0 z-10 backdrop-blur-xs">
              <tr>
                <th className="py-3.5 px-6 text-left">Mailbox Account</th>
                <th className="py-3.5 px-4 w-32 text-center">Provider</th>
                <th className="py-3.5 px-4 w-48 text-center">Storage Quota</th>
                <th className="py-3.5 px-4 w-32 text-center">Status</th>
                <th className="py-3.5 px-6 w-72 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {paginatedMailboxes.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-16 text-center text-zinc-400 text-xs font-sans">
                    {searchQuery || domainFilter !== "all"
                      ? "No mailboxes match the current search filters."
                      : "No mailboxes created yet. Click 'New Mailbox' to provision an account."}
                  </td>
                </tr>
              ) : (
                paginatedMailboxes.map((mb) => {
                  const percent = mb.quota_bytes > 0 ? Math.min(100, Math.round(((mb.used_bytes || 0) / mb.quota_bytes) * 100)) : 0;
                  return (
                    <tr key={mb.id} className="hover:bg-zinc-50/50 transition-colors">
                      <td className="py-3 px-6 text-left">
                        <span className="font-semibold text-zinc-950 font-mono text-xs block">{mb.email}</span>
                        <span className="text-[10px] text-zinc-400 font-mono">
                          Provision: {mb.provisioning_status || "ready"}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-medium bg-zinc-100 text-zinc-700 border border-zinc-200 uppercase">
                          {mb.identity_provider || "local"}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="space-y-1 max-w-36 mx-auto font-mono text-[11px]">
                          <div className="flex justify-between text-zinc-600 text-[10px]">
                            <span>{formatBytes(mb.used_bytes || 0)}</span>
                            <span className="text-zinc-400">/ {formatBytes(mb.quota_bytes)}</span>
                          </div>
                          <div className="w-full bg-zinc-100 h-1.5 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${percent > 85 ? "bg-red-500" : "bg-zinc-950"}`}
                              style={{ width: `${Math.max(percent, 2)}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-medium ${
                            mb.status === "active"
                              ? "bg-emerald-500/10 text-emerald-700 border border-emerald-500/20"
                              : "bg-red-500/10 text-red-700 border border-red-500/20"
                          }`}
                        >
                          {mb.status}
                        </span>
                      </td>
                      <td className="py-3 px-6 text-center">
                        <div className="flex items-center justify-center gap-1.5 text-xs font-sans">
                          <button
                            onClick={() => openAliasDrawer(mb.email)}
                            className="px-2.5 py-1 text-[11px] font-medium bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 rounded-md text-zinc-800 shadow-2xs hover:border-zinc-300 transition-all cursor-pointer"
                          >
                            Aliases
                          </button>
                          <button
                            onClick={() => setPwResetMailbox(mb.email)}
                            className="px-2.5 py-1 text-[11px] font-medium bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 rounded-md text-zinc-800 shadow-2xs hover:border-zinc-300 transition-all cursor-pointer"
                          >
                            Password
                          </button>
                          <button
                            onClick={() => handleToggleStatus(mb)}
                            className="px-2.5 py-1 text-[11px] font-medium bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 rounded-md text-zinc-800 shadow-2xs hover:border-zinc-300 transition-all cursor-pointer"
                          >
                            {mb.status === "active" ? "Suspend" : "Resume"}
                          </button>
                          <button
                            onClick={() => setMailboxToDelete(mb.email)}
                            className="px-2.5 py-1 text-[11px] font-medium bg-red-50 hover:bg-red-100 border border-red-200/80 rounded-md text-red-700 shadow-2xs hover:border-red-300 transition-all cursor-pointer"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {filteredMailboxes.length > 0 && (
          <div className="shrink-0 px-4 py-2.5 bg-zinc-50/80 border-t border-zinc-200 flex items-center justify-between text-xs text-zinc-500 font-mono">
            <div className="flex items-center gap-3">
              <span>
                Showing <span className="font-semibold text-zinc-900">{startIdx}</span> to{" "}
                <span className="font-semibold text-zinc-900">{endIdx}</span> of{" "}
                <span className="font-semibold text-zinc-900">{filteredMailboxes.length}</span> mailboxes
              </span>
              <div className="hidden sm:flex items-center gap-1 text-[11px] text-zinc-400">
                <span>Per page:</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setPage(1);
                  }}
                  className="px-1.5 py-0.5 bg-white border border-zinc-200 rounded text-zinc-700 text-xs font-mono cursor-pointer"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px]">
                Page {page} of {totalPages}
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="p-1 rounded bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-50 disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="p-1 rounded bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-50 disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* New Mailbox Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-zinc-950/20 backdrop-blur-xs flex items-center justify-center p-4 select-none">
          <div className="bg-white rounded-2xl border border-zinc-200 max-w-sm w-full p-6 shadow-xl space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-zinc-100">
              <h3 className="font-semibold text-zinc-950 text-sm">Create New Mailbox</h3>
              <button onClick={() => setShowAddModal(false)} className="text-zinc-400 hover:text-zinc-600 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1">Email Address</label>
                <input
                  type="email"
                  placeholder="user@example.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  disabled={creating}
                  className="w-full px-3 py-2 text-xs bg-zinc-50 border border-zinc-300 rounded-lg focus:outline-none focus:bg-white focus:border-zinc-950 font-mono text-zinc-950"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1">Initial Password</label>
                <input
                  type="password"
                  placeholder="••••••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={creating}
                  className="w-full px-3 py-2 text-xs bg-zinc-50 border border-zinc-300 rounded-lg focus:outline-none focus:bg-white focus:border-zinc-950 font-mono text-zinc-950"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1">Storage Quota (MB)</label>
                <input
                  type="number"
                  min={50}
                  max={50000}
                  value={newQuotaMB}
                  onChange={(e) => setNewQuotaMB(Number(e.target.value))}
                  disabled={creating}
                  className="w-full px-3 py-2 text-xs bg-zinc-50 border border-zinc-300 rounded-lg focus:outline-none focus:bg-white focus:border-zinc-950 font-mono text-zinc-950"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  disabled={creating}
                  className="px-3 py-1.5 text-xs text-zinc-700 bg-zinc-100 hover:bg-zinc-200 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating || !newEmail || !newPassword}
                  className="px-4 py-1.5 text-xs font-medium bg-zinc-950 hover:bg-zinc-800 text-white rounded-lg disabled:opacity-50 cursor-pointer shadow-xs"
                >
                  {creating ? "Provisioning..." : "Create Account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Password Reset Modal */}
      {pwResetMailbox && (
        <div className="fixed inset-0 z-50 bg-zinc-950/20 backdrop-blur-xs flex items-center justify-center p-4 select-none">
          <div className="bg-white rounded-2xl border border-zinc-200 max-w-sm w-full p-6 shadow-xl space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-zinc-100">
              <div>
                <h3 className="font-semibold text-zinc-950 text-sm">Reset Password</h3>
                <p className="text-xs text-zinc-500 font-mono">{pwResetMailbox}</p>
              </div>
              <button onClick={() => setPwResetMailbox(null)} className="text-zinc-400 hover:text-zinc-600 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleResetPassword} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1">New Secure Password</label>
                <input
                  type="password"
                  placeholder="••••••••••••"
                  value={resetPasswordVal}
                  onChange={(e) => setResetPasswordVal(e.target.value)}
                  disabled={resettingPw}
                  className="w-full px-3 py-2 text-xs bg-zinc-50 border border-zinc-300 rounded-lg focus:outline-none focus:bg-white focus:border-zinc-950 font-mono text-zinc-950"
                  autoFocus
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setPwResetMailbox(null)}
                  disabled={resettingPw}
                  className="px-3 py-1.5 text-xs text-zinc-700 bg-zinc-100 hover:bg-zinc-200 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={resettingPw || !resetPasswordVal}
                  className="px-4 py-1.5 text-xs font-medium bg-zinc-950 hover:bg-zinc-800 text-white rounded-lg disabled:opacity-50 cursor-pointer shadow-xs"
                >
                  {resettingPw ? "Updating..." : "Update Password"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Alias Drawer */}
      {aliasMailbox && (
        <div className="fixed inset-0 z-50 bg-zinc-950/20 backdrop-blur-xs flex items-center justify-center p-4 select-none">
          <div className="bg-white rounded-2xl border border-zinc-200 max-w-md w-full p-6 shadow-xl space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex justify-between items-center pb-2 border-b border-zinc-100 shrink-0">
              <div>
                <h3 className="font-semibold text-zinc-950 text-sm">Virtual Email Aliases</h3>
                <p className="text-xs text-zinc-500 font-mono">Recipient: {aliasMailbox}</p>
              </div>
              <button onClick={() => setAliasMailbox(null)} className="text-zinc-400 hover:text-zinc-600 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Add Alias Form */}
            <form onSubmit={handleAddAlias} className="flex gap-2 shrink-0">
              <input
                type="email"
                placeholder="alias@example.com"
                value={newAlias}
                onChange={(e) => setNewAlias(e.target.value)}
                disabled={addingAlias}
                className="flex-1 px-3 py-1.5 text-xs bg-zinc-50 border border-zinc-300 rounded-lg focus:outline-none focus:bg-white focus:border-zinc-950 font-mono text-zinc-950"
              />
              <button
                type="submit"
                disabled={addingAlias || !newAlias}
                className="px-3 py-1.5 text-xs font-medium bg-zinc-950 hover:bg-zinc-800 text-white rounded-lg disabled:opacity-50 cursor-pointer shadow-xs"
              >
                {addingAlias ? "Adding..." : "Add Alias"}
              </button>
            </form>

            {/* Alias List */}
            <div className="flex-1 overflow-y-auto min-h-0 space-y-2 text-xs font-mono">
              {aliases.length === 0 ? (
                <div className="py-8 text-center text-zinc-400 font-sans">
                  No alias forwarders mapped to this mailbox yet.
                </div>
              ) : (
                aliases.map((al) => {
                  const aliasAddr = al.source || al.alias || "";
                  return (
                    <div key={al.id} className="p-2.5 bg-zinc-50 rounded-lg border border-zinc-200 flex items-center justify-between">
                      <span className="font-medium text-zinc-900">{aliasAddr}</span>
                      <button
                        onClick={() => handleDeleteAlias(aliasAddr)}
                        className="text-red-600 hover:text-red-800 text-[11px] font-sans font-medium cursor-pointer"
                      >
                        Delete
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Delete Mailbox */}
      <ConfirmModal
        isOpen={Boolean(mailboxToDelete)}
        title="Delete Mailbox Account"
        message={`Are you sure you want to permanently delete account "${mailboxToDelete}"? All Maildir messages, quota records, and aliases will be purged.`}
        confirmLabel="Delete Account"
        variant="danger"
        loading={deleting}
        onConfirm={confirmDeleteMailbox}
        onCancel={() => setMailboxToDelete(null)}
      />
    </div>
  );
}
