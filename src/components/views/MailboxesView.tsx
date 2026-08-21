"use client";

import React, { useEffect, useState } from "react";
import { api, MailboxItem, AliasItem, DomainItem } from "@/lib/api";
import { RefreshCw, Plus, X } from "lucide-react";

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
    if (!confirm(`Delete mailbox ${email}? All email messages will be permanently purged.`)) {
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
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
        <div>
          <h1 className="text-lg font-bold text-slate-900 tracking-tight">Mailbox Accounts</h1>
          <p className="text-xs text-slate-500 mt-0.5">User mailboxes, storage quotas, and forwarding aliases</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white hover:bg-slate-50 border border-slate-200/80 rounded-lg text-slate-700 shadow-2xs transition-all cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-slate-400" : "text-slate-500"}`} />
            <span>Refresh</span>
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Mailbox</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-mono rounded-lg">
          {error}
        </div>
      )}

      {/* Table Container */}
      <div className="rounded-xl border border-slate-200/80 bg-white overflow-hidden shadow-2xs">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50/70 border-b border-slate-200 font-mono text-slate-500 uppercase text-[10px]">
            <tr>
              <th className="py-3 px-4">Account Email</th>
              <th className="py-3 px-4">Storage Usage</th>
              <th className="py-3 px-4">Provider</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {mailboxes.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-10 text-center text-slate-400 text-xs">
                  No mailboxes found. Click &quot;New Mailbox&quot; to provision an account.
                </td>
              </tr>
            ) : (
              mailboxes.map((mb) => {
                const storage = formatStorage(mb.used_bytes || 0, mb.quota_bytes || 0);
                const isSuspended = mb.status === "suspended";
                return (
                  <tr key={mb.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-2.5 px-4 font-semibold text-slate-900 font-mono text-xs">
                      {mb.email}
                    </td>
                    <td className="py-2.5 px-4 min-w-44 font-mono text-[11px]">
                      <div className="flex justify-between text-slate-500 mb-1">
                        <span>{storage.usedMB} MB</span>
                        <span>{storage.quotaMB} MB ({storage.percent}%)</span>
                      </div>
                      <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            storage.percent > 90 ? "bg-red-500" : storage.percent > 75 ? "bg-amber-500" : "bg-blue-600"
                          }`}
                          style={{ width: `${storage.percent}%` }}
                        />
                      </div>
                    </td>
                    <td className="py-2.5 px-4 font-mono text-[11px]">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                        {mb.identity_provider === "ldap" ? "LDAP" : "LOCAL"}
                      </span>
                    </td>
                    <td className="py-2.5 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-medium ${
                          isSuspended
                            ? "bg-amber-500/10 text-amber-600 border border-amber-500/20"
                            : "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                        }`}
                      >
                        {mb.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-right font-sans">
                      <div className="flex items-center justify-end gap-1 text-xs">
                        <button
                          onClick={() => openAliasDrawer(mb.email)}
                          className="px-2.5 py-1 rounded-md text-slate-700 hover:bg-slate-100 font-medium cursor-pointer transition-colors"
                        >
                          Aliases
                        </button>
                        <button
                          onClick={() => setPwResetMailbox(mb.email)}
                          className="px-2.5 py-1 rounded-md text-slate-700 hover:bg-slate-100 font-medium cursor-pointer transition-colors"
                        >
                          Password
                        </button>
                        <button
                          onClick={() => handleToggleStatus(mb)}
                          className="px-2.5 py-1 rounded-md text-slate-700 hover:bg-slate-100 font-medium cursor-pointer transition-colors"
                        >
                          {isSuspended ? "Resume" : "Suspend"}
                        </button>
                        <button
                          onClick={() => handleDelete(mb.email)}
                          className="px-2.5 py-1 rounded-md text-red-600 hover:bg-red-50 font-medium cursor-pointer transition-colors"
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

      {/* Add Mailbox Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/20 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-sm w-full p-6 shadow-xl space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">Create Virtual Mailbox</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  placeholder="user@example.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:border-zinc-900 focus:bg-white font-mono"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  placeholder="••••••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:border-zinc-900 focus:bg-white font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Storage Quota (MB)
                </label>
                <input
                  type="number"
                  min={100}
                  step={100}
                  value={newQuotaMB}
                  onChange={(e) => setNewQuotaMB(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3.5 py-1.5 text-xs border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating || !newEmail || !newPassword}
                  className="px-4 py-1.5 text-xs font-medium bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  {creating ? "Creating..." : "Create Mailbox"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {pwResetMailbox && (
        <div className="fixed inset-0 z-50 bg-slate-900/20 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-sm w-full p-6 shadow-xl space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Reset Password</h3>
                <p className="text-xs text-slate-500 font-mono mt-0.5">{pwResetMailbox}</p>
              </div>
              <button onClick={() => setPwResetMailbox(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleResetPassword} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  placeholder="••••••••••••"
                  value={resetPasswordVal}
                  onChange={(e) => setResetPasswordVal(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:border-zinc-900 focus:bg-white font-mono"
                  autoFocus
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setPwResetMailbox(null)}
                  className="px-3.5 py-1.5 text-xs border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={resettingPw || !resetPasswordVal}
                  className="px-4 py-1.5 text-xs font-medium bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  {resettingPw ? "Saving..." : "Save Password"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Aliases Drawer */}
      {aliasMailbox && (
        <div className="fixed inset-0 z-50 bg-slate-900/20 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Forwarding Aliases</h3>
                <p className="text-xs text-slate-500 font-mono mt-0.5">{aliasMailbox}</p>
              </div>
              <button onClick={() => setAliasMailbox(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddAlias} className="flex gap-2">
              <input
                type="email"
                placeholder="alias@domain.com"
                value={newAlias}
                onChange={(e) => setNewAlias(e.target.value)}
                className="flex-1 px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:bg-white font-mono"
              />
              <button
                type="submit"
                disabled={addingAlias || !newAlias}
                className="px-3.5 py-1.5 text-xs bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg font-medium disabled:opacity-50 cursor-pointer shadow-xs"
              >
                Add
              </button>
            </form>

            <div className="space-y-1.5 max-h-48 overflow-y-auto font-mono text-xs divide-y divide-slate-100">
              {aliases.length === 0 ? (
                <div className="py-6 text-center text-slate-400 font-sans text-xs">No aliases configured.</div>
              ) : (
                aliases.map((al) => (
                  <div key={al.id} className="py-2 flex justify-between items-center">
                    <span>{al.alias}</span>
                    <button
                      onClick={() => handleDeleteAlias(al.alias)}
                      className="text-red-600 hover:underline text-[11px] cursor-pointer"
                    >
                      Delete
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setAliasMailbox(null)}
                className="px-3.5 py-1.5 text-xs border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer text-slate-700"
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
