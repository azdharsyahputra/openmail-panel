"use client";

import React, { useEffect, useState } from "react";
import { api, DomainItem, DomainDNSResponse, DKIMKeyItem } from "@/lib/api";
import {
  Globe,
  Plus,
  RefreshCw,
  Trash2,
  Key,
  FileCheck,
  Copy,
  Check,
  AlertCircle,
  X,
  Stethoscope,
  ShieldCheck,
} from "lucide-react";

export function DomainsView() {
  const [domains, setDomains] = useState<DomainItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals & Drawers
  const [showAddModal, setShowAddModal] = useState(false);
  const [newDomainName, setNewDomainName] = useState("");
  const [creating, setCreating] = useState(false);

  // Details Modal
  const [selectedDomain, setSelectedDomain] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"dns" | "dkim" | "doctor">("dns");
  const [dnsData, setDnsData] = useState<DomainDNSResponse | null>(null);
  const [dkimKeys, setDkimKeys] = useState<DKIMKeyItem[]>([]);
  const [newSelector, setNewSelector] = useState("default");
  const [generatingDKIM, setGeneratingDKIM] = useState(false);
  const [doctorReport, setDoctorReport] = useState<Record<string, unknown> | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const loadDomains = async () => {
    try {
      setLoading(true);
      setError(null);
      const list = await api.getDomains();
      setDomains(list);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load domains");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDomains();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDomainName) return;
    try {
      setCreating(true);
      await api.createDomain(newDomainName.trim());
      setNewDomainName("");
      setShowAddModal(false);
      await loadDomains();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to create domain");
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (domainName: string) => {
    if (!confirm(`Are you sure you want to delete domain ${domainName}? All associated mailboxes and configurations will be removed.`)) {
      return;
    }
    try {
      await api.deleteDomain(domainName);
      await loadDomains();
      if (selectedDomain === domainName) {
        setSelectedDomain(null);
      }
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to delete domain");
    }
  };

  const openDomainDetails = async (name: string, tab: "dns" | "dkim" | "doctor" = "dns") => {
    setSelectedDomain(name);
    setActiveTab(tab);
    setDnsData(null);
    setDkimKeys([]);
    setDoctorReport(null);

    try {
      const [dns, dkim, doc] = await Promise.all([
        api.getDomainDNS(name).catch(() => null),
        api.getDomainDKIM(name).catch(() => []),
        api.getDomainDoctor(name).catch(() => null),
      ]);
      setDnsData(dns);
      setDkimKeys(dkim);
      setDoctorReport(doc);
    } catch {
      // Ignored
    }
  };

  const handleGenerateDKIM = async () => {
    if (!selectedDomain || !newSelector) return;
    try {
      setGeneratingDKIM(true);
      await api.generateDomainDKIM(selectedDomain, newSelector.trim());
      const keys = await api.getDomainDKIM(selectedDomain);
      setDkimKeys(keys);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to generate DKIM key");
    } finally {
      setGeneratingDKIM(false);
    }
  };

  const handleActivateDKIM = async (selector: string) => {
    if (!selectedDomain) return;
    try {
      await api.activateDomainDKIM(selectedDomain, selector);
      const keys = await api.getDomainDKIM(selectedDomain);
      setDkimKeys(keys);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to activate DKIM key");
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Domain Management</h1>
          <p className="text-sm text-slate-500">Virtual domains, DNS records, DKIM signing, and deliverability</p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={loadDomains}
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
            <span>Add Domain</span>
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
                <th className="py-3 px-4">Domain Name</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Created Date</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {domains.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-xs text-slate-400">
                    No domains registered yet. Click &quot;Add Domain&quot; to configure your first domain.
                  </td>
                </tr>
              ) : (
                domains.map((dom) => (
                  <tr key={dom.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-slate-900 flex items-center gap-2.5">
                      <Globe className="w-4 h-4 text-blue-600" />
                      <span>{dom.name}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {dom.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-500 font-mono">
                      {new Date(dom.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openDomainDetails(dom.name, "dns")}
                          className="px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                        >
                          DNS Records
                        </button>
                        <button
                          onClick={() => openDomainDetails(dom.name, "dkim")}
                          className="px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer flex items-center gap-1"
                        >
                          <Key className="w-3 h-3 text-slate-500" />
                          <span>DKIM</span>
                        </button>
                        <button
                          onClick={() => openDomainDetails(dom.name, "doctor")}
                          className="px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer flex items-center gap-1"
                        >
                          <Stethoscope className="w-3 h-3 text-blue-600" />
                          <span>Doctor</span>
                        </button>
                        <button
                          onClick={() => handleDelete(dom.name)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                          title="Delete Domain"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Domain Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <h3 className="font-bold text-slate-900 text-base">Add New Virtual Domain</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Fully Qualified Domain Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. example.com"
                  value={newDomainName}
                  onChange={(e) => setNewDomainName(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none"
                  autoFocus
                />
                <p className="text-[11px] text-slate-400 mt-1.5">
                  MailOpen will automatically provision DNS guidance, DKIM keys, and storage directory.
                </p>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating || !newDomainName}
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-sm disabled:opacity-50"
                >
                  {creating ? "Creating..." : "Create Domain"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Domain Details Drawer/Modal */}
      {selectedDomain && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full p-6 max-h-[90vh] flex flex-col justify-between">
            <div>
              {/* Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                    <Globe className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">{selectedDomain}</h3>
                    <p className="text-xs text-slate-400 font-mono">DNS, DKIM & Deliverability Console</p>
                  </div>
                </div>
                <button onClick={() => setSelectedDomain(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-slate-200 mb-4 gap-4 text-xs font-semibold">
                <button
                  onClick={() => setActiveTab("dns")}
                  className={`pb-2.5 transition-colors cursor-pointer ${
                    activeTab === "dns" ? "text-blue-600 border-b-2 border-blue-600" : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  DNS Guidance (SPF / DKIM / DMARC / MX)
                </button>
                <button
                  onClick={() => setActiveTab("dkim")}
                  className={`pb-2.5 transition-colors cursor-pointer ${
                    activeTab === "dkim" ? "text-blue-600 border-b-2 border-blue-600" : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  DKIM Key Manager
                </button>
                <button
                  onClick={() => setActiveTab("doctor")}
                  className={`pb-2.5 transition-colors cursor-pointer ${
                    activeTab === "doctor" ? "text-blue-600 border-b-2 border-blue-600" : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  Domain Doctor
                </button>
              </div>

              {/* Tab Contents */}
              {activeTab === "dns" && (
                <div className="space-y-3 overflow-y-auto max-h-[50vh] pr-1">
                  <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl text-xs text-blue-700">
                    Add these DNS records at your domain registrar/DNS provider to ensure high inbox deliverability.
                  </div>

                  {/* Standard Records */}
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5">
                    <div className="flex items-center justify-between font-semibold text-slate-800">
                      <span>MX Record (Mail Exchange)</span>
                      <button
                        onClick={() => copyToClipboard(`10 mail.${selectedDomain}`, "mx")}
                        className="text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
                      >
                        {copiedKey === "mx" ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                        <span>Copy</span>
                      </button>
                    </div>
                    <code className="block p-2 bg-white rounded border border-slate-200 font-mono text-[11px] break-all">
                      @ IN MX 10 mail.{selectedDomain}.
                    </code>
                  </div>

                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5">
                    <div className="flex items-center justify-between font-semibold text-slate-800">
                      <span>SPF Record (TXT)</span>
                      <button
                        onClick={() => copyToClipboard("v=spf1 mx ~all", "spf")}
                        className="text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
                      >
                        {copiedKey === "spf" ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                        <span>Copy</span>
                      </button>
                    </div>
                    <code className="block p-2 bg-white rounded border border-slate-200 font-mono text-[11px] break-all">
                      @ IN TXT &quot;v=spf1 mx ~all&quot;
                    </code>
                  </div>

                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5">
                    <div className="flex items-center justify-between font-semibold text-slate-800">
                      <span>DMARC Record (TXT)</span>
                      <button
                        onClick={() => copyToClipboard(`v=DMARC1; p=quarantine; rua=mailto:dmarc@${selectedDomain}`, "dmarc")}
                        className="text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
                      >
                        {copiedKey === "dmarc" ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                        <span>Copy</span>
                      </button>
                    </div>
                    <code className="block p-2 bg-white rounded border border-slate-200 font-mono text-[11px] break-all">
                      _dmarc.{selectedDomain}. IN TXT &quot;v=DMARC1; p=quarantine; rua=mailto:dmarc@{selectedDomain}&quot;
                    </code>
                  </div>
                </div>
              )}

              {activeTab === "dkim" && (
                <div className="space-y-4 overflow-y-auto max-h-[50vh] pr-1">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={newSelector}
                      onChange={(e) => setNewSelector(e.target.value)}
                      placeholder="Selector (e.g. default or 202608)"
                      className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
                    />
                    <button
                      onClick={handleGenerateDKIM}
                      disabled={generatingDKIM || !newSelector}
                      className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 cursor-pointer"
                    >
                      {generatingDKIM ? "Generating 2048-bit Key..." : "Generate Key"}
                    </button>
                  </div>

                  <div className="space-y-2">
                    {dkimKeys.length === 0 ? (
                      <div className="py-6 text-center text-xs text-slate-400">No DKIM keys generated yet.</div>
                    ) : (
                      dkimKeys.map((k) => (
                        <div key={k.id} className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-800 font-mono">Selector: {k.selector}</span>
                            <div className="flex items-center gap-2">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                  k.status === "active" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                                }`}
                              >
                                {k.status}
                              </span>
                              {k.status !== "active" && (
                                <button
                                  onClick={() => handleActivateDKIM(k.selector)}
                                  className="px-2 py-0.5 text-xs font-semibold rounded bg-blue-600 text-white hover:bg-blue-700 cursor-pointer"
                                >
                                  Activate
                                </button>
                              )}
                            </div>
                          </div>
                          {k.dns_record && (
                            <code className="block p-2 bg-white rounded border border-slate-200 font-mono text-[10px] break-all">
                              {k.selector}._domainkey.{selectedDomain}. IN TXT &quot;{k.dns_record}&quot;
                            </code>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {activeTab === "doctor" && (
                <div className="space-y-3 overflow-y-auto max-h-[50vh] pr-1">
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                    <div className="flex items-center gap-2 mb-2 font-bold text-slate-900">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      <span>Domain Doctor Verification</span>
                    </div>
                    <pre className="p-3 bg-white rounded border border-slate-200 font-mono text-[11px] text-slate-700 whitespace-pre-wrap">
                      {doctorReport ? JSON.stringify(doctorReport, null, 2) : "Inspecting DNS and DKIM certificates..."}
                    </pre>
                  </div>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setSelectedDomain(null)}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
