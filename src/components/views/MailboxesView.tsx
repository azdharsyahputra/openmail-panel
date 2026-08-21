"use client";

import React, { useEffect, useState } from "react";
import { api, MailboxItem, AliasItem, DomainItem } from "@/lib/api";
import {
  Inbox,
  Plus,
  RefreshCw,
  Trash2,
  Lock,
  PauseCircle,
  PlayCircle,
  Users,
  Copy,
  Check,
  AlertCircle,
  X,
  Shield,
  Layers,
} from "lucide-react";

export function MailboxesView() {
  const [mailboxes, setMailboxes] = useState<MailboxItem[]>([]);
  const [domains, setDomains] = useState<DomainItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newQuotaMB, setNewQuotaMB] = useState(1024);
  const [creating, setCreating] = useState(false);

  // Password Reset Modal
  const [pwResetMailbox, setPwResetMailbox] = useState<string | null>(null);
  const [resetPasswordVal, setResetPasswordVal] = useState("");
  const [resettingPw, setResettingPw] = useState(false);

  // Alias Manager Drawer
  const [aliasMailbox, setAliasMailbox] = useState<string | null>(null);
  const [aliases, setAliases] = useState<AliasItem[]>([]);
  const [newAlias, setNewAlias] = useState("");
  const [addingAlias, setAddingAlias] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [mbs, doms] = await Promise.all([
        api.getMailboxes(),
        api.getDomains().catch(() => []),
      ]);
      setMailboxes(mbs);
      setDomains(doms);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load mailboxes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail || !newPassword) return;
    try {
      setCreating(true);
      const quotaBytes = newQuotaMB * 1024 * 1024;
      await api.createMailbox(newEmail.trim(), newPassword, quotaBytes);
      await api.provisionMailbox(newEmail.trim()).catch(() => {});
      setNewEmail("");
      setNewPassword("");
      setShowAddModal(false);
      await loadData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to create mailbox");
    } finally {
      setCreating(false);
    }
  };

  const handleToggleStatus = async (mb: MailboxItem) => {
    try {
      if (mb.status === "active") {
        await api.suspendMailbox(mb.email);
      } else {
        await api.resumeMailbox(mb.email);
      }
      await loadData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to update mailbox status");
    }
  };

  const handleDelete = async (email: string) => {
    if (!confirm(`Are you sure you want to delete mailbox ${email}? All emails and data will be permanently purged.`)) {
      return;
    }
    try {
      await api.deleteMailbox(email);
      await loadData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to delete mailbox");
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pwResetMailbox || !resetPasswordVal) return;
    try {
      setResettingPw(true);
      await api.setMailboxPassword(pwResetMailbox, resetPasswordVal);
      setPwResetMailbox(null);
      setResetPasswordVal("");
      alert("Password updated successfully.");
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to reset password");
    } finally {
      setResettingPw(false);
    }
  };

  const openAliasDrawer = async (email: string) => {
    setAliasMailbox(email);
    setAliases([]);
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
      setNewAlias("");
      const list = await api.getAliases(aliasMailbox);
      setAliases(list);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to add alias");
    } finally {
      setAddingAlias(false);
    }
  };

  const handleDeleteAlias = async (alias: string) => {
    if (!aliasMailbox) return;
    try {
      await api.deleteAlias(aliasMailbox, alias);
      const list = await api.getAliases(aliasMailbox);
      setAliases(list);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to delete alias");
    }
  };

  const formatStorage = (used: number, quota: number) => {
    const usedMB = (used / (1024 * 1024)).toFixed(1);
    const quotaMB = (quota / (1024 * 1024)).toFixed(0);
    const percent = quota > 0 ? Math.min(100, Math.round((used / quota) * 100)) : 0;
    return { usedMB, quotaMB, percent };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Mailboxes & Aliases</h1>
          <p className="text-sm text-slate-500">Manage user inboxes, quotas, passwords, and forwarding aliases</p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={loadData}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 shadow-2xs transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-sm shadow-blue-500/20 transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Mailbox</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}

      {/* Table Card */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Email Address</th>
                <th className="py-3 px-4">Storage Usage</th>
                <th className="py-3 px-4">Provider</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {mailboxes.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-xs text-slate-400">
                    No mailboxes found. Click &quot;New Mailbox&quot; to provision a mailbox.
                  </td>
                </tr>
              ) : (
                mailboxes.map((mb) => {
                  const storage = formatStorage(mb.used_bytes || 0, mb.quota_bytes || 0);
                  const isSuspended = mb.status === "suspended";
                  return (
                    <tr key={mb.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-slate-900 flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                          <Inbox className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <span>{mb.email}</span>
                          <div className="text-[11px] font-normal text-slate-400 font-mono">
                            Provisioning: {mb.provisioning_status}
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 min-w-48">
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs font-mono text-slate-600">
                            <span>{storage.usedMB} MB</span>
                            <span>{storage.quotaMB} MB ({storage.percent}%)</span>
                          </div>
                          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                storage.percent > 90
                                  ? "bg-red-500"
                                  : storage.percent > 75
                                  ? "bg-amber-500"
                                  : "bg-blue-600"
                              }`}
                              style={{ width: `${storage.percent}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                            mb.identity_provider === "ldap"
                              ? "bg-purple-50 text-purple-700 border border-purple-200"
                              : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {mb.identity_provider === "ldap" ? "LDAP Synced" : "Local DB"}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                            isSuspended
                              ? "bg-amber-50 text-amber-700 border border-amber-200"
                              : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          }`}
                        >
                          {mb.status}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openAliasDrawer(mb.email)}
                            className="px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                          >
                            Aliases
                          </button>
                          <button
                            onClick={() => setPwResetMailbox(mb.email)}
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                            title="Reset Password"
                          >
                            <Lock className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleToggleStatus(mb)}
                            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                              isSuspended
                                ? "text-emerald-600 hover:bg-emerald-50"
                                : "text-amber-600 hover:bg-amber-50"
                            }`}
                            title={isSuspended ? "Resume Mailbox" : "Suspend Mailbox"}
                          >
                            {isSuspended ? <PlayCircle className="w-4 h-4" /> : <PauseCircle className="w-4 h-4" />}
                          </button>
                          <button
                            onClick={() => handleDelete(mb.email)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                            title="Delete Mailbox"
                          >
                            <Trash2 className="w-4 h-4" />
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
      </div>

      {/* Add Mailbox Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <h3 className="font-bold text-slate-900 text-base">Create New Mailbox</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Email Address
                </label>
                <input
                  type="email"
                  placeholder="user@example.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Initial Password
                </label>
                <input
                  type="password"
                  placeholder="••••••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Storage Quota (MB)
                </label>
                <input
                  type="number"
                  min={100}
                  step={100}
                  value={newQuotaMB}
                  onChange={(e) => setNewQuotaMB(Number(e.target.value))}
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none font-mono"
                />
                <div className="flex gap-2 mt-2">
                  {[512, 1024, 2048, 5120].map((mb) => (
                    <button
                      key={mb}
                      type="button"
                      onClick={() => setNewQuotaMB(mb)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-mono font-medium border ${
                        newQuotaMB === mb
                          ? "bg-blue-50 border-blue-300 text-blue-700"
                          : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      {mb >= 1024 ? `${mb / 1024} GB` : `${mb} MB`}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating || !newEmail || !newPassword}
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-sm disabled:opacity-50"
                >
                  {creating ? "Provisioning Mailbox..." : "Create & Provision"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Password Reset Modal */}
      {pwResetMailbox && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-sm w-full p-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Reset Password</h3>
                <p className="text-xs text-slate-400 font-mono truncate">{pwResetMailbox}</p>
              </div>
              <button onClick={() => setPwResetMailbox(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  placeholder="••••••••••••"
                  value={resetPasswordVal}
                  onChange={(e) => setResetPasswordVal(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none"
                  autoFocus
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setPwResetMailbox(null)}
                  className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={resettingPw || !resetPasswordVal}
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-sm disabled:opacity-50"
                >
                  {resettingPw ? "Updating..." : "Save Password"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Aliases Drawer */}
      {aliasMailbox && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Forwarding Aliases</h3>
                <p className="text-xs text-slate-400 font-mono truncate">{aliasMailbox}</p>
              </div>
              <button onClick={() => setAliasMailbox(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddAlias} className="flex gap-2 mb-4">
              <input
                type="email"
                placeholder="alias@domain.com"
                value={newAlias}
                onChange={(e) => setNewAlias(e.target.value)}
                className="flex-1 px-3.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
              />
              <button
                type="submit"
                disabled={addingAlias || !newAlias}
                className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 cursor-pointer"
              >
                Add Alias
              </button>
            </form>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {aliases.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-400">No aliases configured.</div>
              ) : (
                aliases.map((al) => (
                  <div key={al.id} className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between text-xs">
                    <span className="font-mono text-slate-800">{al.alias}</span>
                    <button
                      onClick={() => handleDeleteAlias(al.alias)}
                      className="p-1 text-slate-400 hover:text-red-600 rounded transition-colors cursor-pointer"
                      title="Delete alias"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end mt-4">
              <button
                onClick={() => setAliasMailbox(null)}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
