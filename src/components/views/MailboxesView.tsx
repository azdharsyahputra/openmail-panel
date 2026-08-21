"use client";

import React, { useEffect, useState } from "react";
import { api, MailboxItem, AliasItem, DomainItem } from "@/lib/api";

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
    if (!confirm(`Delete mailbox ${email}? All emails will be permanently removed.`)) {
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
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
        <div>
          <h1 className="text-base font-bold text-slate-900">Mailboxes</h1>
          <p className="text-xs text-slate-500">Virtual mailboxes, storage quotas, and forwarding aliases</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            className="px-3 py-1 text-xs font-medium bg-white hover:bg-slate-50 border border-slate-300 rounded text-slate-700 cursor-pointer"
          >
            Refresh
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-3 py-1 text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white rounded cursor-pointer"
          >
            New Mailbox
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-mono rounded">
          {error}
        </div>
      )}

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 font-mono text-slate-600 uppercase text-[10px]">
            <tr>
              <th className="py-2.5 px-4">Account Email</th>
              <th className="py-2.5 px-4">Quota Usage</th>
              <th className="py-2.5 px-4">Provider</th>
              <th className="py-2.5 px-4">Status</th>
              <th className="py-2.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {mailboxes.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-slate-400">
                  No mailboxes found. Click &quot;New Mailbox&quot; to provision an account.
                </td>
              </tr>
            ) : (
              mailboxes.map((mb) => {
                const storage = formatStorage(mb.used_bytes || 0, mb.quota_bytes || 0);
                const isSuspended = mb.status === "suspended";
                return (
                  <tr key={mb.id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-4 font-semibold text-slate-900 font-mono">
                      {mb.email}
                    </td>
                    <td className="py-2.5 px-4 min-w-44 font-mono text-[11px]">
                      <div className="flex justify-between text-slate-500 mb-1">
                        <span>{storage.usedMB} MB</span>
                        <span>{storage.quotaMB} MB ({storage.percent}%)</span>
                      </div>
                      <div className="w-full bg-slate-100 h-1.5 rounded overflow-hidden">
                        <div
                          className={`h-full ${
                            storage.percent > 90 ? "bg-red-500" : storage.percent > 75 ? "bg-amber-500" : "bg-blue-600"
                          }`}
                          style={{ width: `${storage.percent}%` }}
                        />
                      </div>
                    </td>
                    <td className="py-2.5 px-4 font-mono text-[11px]">
                      <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                        {mb.identity_provider === "ldap" ? "LDAP" : "LOCAL"}
                      </span>
                    </td>
                    <td className="py-2.5 px-4">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold ${
                          isSuspended
                            ? "bg-amber-50 text-amber-700 border border-amber-200"
                            : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        }`}
                      >
                        {mb.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openAliasDrawer(mb.email)}
                          className="text-blue-600 hover:underline cursor-pointer"
                        >
                          Aliases
                        </button>
                        <span className="text-slate-300">·</span>
                        <button
                          onClick={() => setPwResetMailbox(mb.email)}
                          className="text-blue-600 hover:underline cursor-pointer"
                        >
                          Password
                        </button>
                        <span className="text-slate-300">·</span>
                        <button
                          onClick={() => handleToggleStatus(mb)}
                          className="text-slate-700 hover:underline cursor-pointer"
                        >
                          {isSuspended ? "Resume" : "Suspend"}
                        </button>
                        <span className="text-slate-300">·</span>
                        <button
                          onClick={() => handleDelete(mb.email)}
                          className="text-red-600 hover:underline cursor-pointer"
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
        <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg border border-slate-300 max-w-sm w-full p-5 shadow-lg">
            <h3 className="font-bold text-slate-900 text-sm mb-3">Create Mailbox</h3>
            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  placeholder="user@example.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded focus:outline-none focus:border-blue-600 font-mono"
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
                  className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded focus:outline-none focus:border-blue-600 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Quota (MB)
                </label>
                <input
                  type="number"
                  min={100}
                  step={100}
                  value={newQuotaMB}
                  onChange={(e) => setNewQuotaMB(Number(e.target.value))}
                  className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded focus:outline-none font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1 text-xs border border-slate-300 rounded text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating || !newEmail || !newPassword}
                  className="px-3 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded disabled:opacity-50"
                >
                  {creating ? "Creating..." : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {pwResetMailbox && (
        <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg border border-slate-300 max-w-sm w-full p-5 shadow-lg">
            <h3 className="font-bold text-slate-900 text-sm mb-1">Reset Password</h3>
            <p className="text-xs text-slate-500 font-mono mb-3">{pwResetMailbox}</p>
            <form onSubmit={handleResetPassword} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  placeholder="••••••••••••"
                  value={resetPasswordVal}
                  onChange={(e) => setResetPasswordVal(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded focus:outline-none focus:border-blue-600 font-mono"
                  autoFocus
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setPwResetMailbox(null)}
                  className="px-3 py-1 text-xs border border-slate-300 rounded text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={resettingPw || !resetPasswordVal}
                  className="px-3 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded disabled:opacity-50"
                >
                  {resettingPw ? "Saving..." : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Aliases Drawer */}
      {aliasMailbox && (
        <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg border border-slate-300 max-w-md w-full p-5 shadow-lg">
            <h3 className="font-bold text-slate-900 text-sm mb-1">Forwarding Aliases</h3>
            <p className="text-xs text-slate-500 font-mono mb-3">{aliasMailbox}</p>

            <form onSubmit={handleAddAlias} className="flex gap-2 mb-3">
              <input
                type="email"
                placeholder="alias@domain.com"
                value={newAlias}
                onChange={(e) => setNewAlias(e.target.value)}
                className="flex-1 px-3 py-1 text-xs border border-slate-300 rounded focus:outline-none font-mono"
              />
              <button
                type="submit"
                disabled={addingAlias || !newAlias}
                className="px-3 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded disabled:opacity-50 cursor-pointer"
              >
                Add
              </button>
            </form>

            <div className="space-y-1 max-h-48 overflow-y-auto font-mono text-xs divide-y divide-slate-100">
              {aliases.length === 0 ? (
                <div className="py-4 text-center text-slate-400">No aliases configured.</div>
              ) : (
                aliases.map((al) => (
                  <div key={al.id} className="py-1.5 flex justify-between items-center">
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

            <div className="pt-3 border-t border-slate-200 flex justify-end mt-3">
              <button
                onClick={() => setAliasMailbox(null)}
                className="px-3 py-1 text-xs border border-slate-300 rounded hover:bg-slate-50"
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
