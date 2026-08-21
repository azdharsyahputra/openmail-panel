"use client";

import React, { useEffect, useState } from "react";
import { api, DomainItem, DomainDNSResponse, DKIMKeyItem } from "@/lib/api";
import { RefreshCw, Plus, Copy, Check, X } from "lucide-react";

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
    if (!confirm(`Delete domain ${domainName}? All associated mailboxes will be permanently removed.`)) {
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
    setTimeout(() => setCopiedKey(null), 1500);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Virtual Domains</h1>
          <p className="text-xs text-slate-500 mt-0.5">DNS guidance, DKIM cryptographic keys, and domain health</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadDomains}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white hover:bg-slate-50 border border-slate-200 rounded-full text-slate-700 shadow-2xs transition-all cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Domain</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 text-xs font-medium rounded-xl">
          {error}
        </div>
      )}

      {/* Table Container */}
      <div className="rounded-2xl border border-slate-200/80 overflow-hidden shadow-2xs">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#f8fafd] border-b border-slate-200 font-mono text-slate-600 uppercase text-[10px]">
            <tr>
              <th className="py-3 px-5">Domain Name</th>
              <th className="py-3 px-5">Status</th>
              <th className="py-3 px-5">Created Date</th>
              <th className="py-3 px-5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {domains.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-10 text-center text-slate-400 text-xs font-sans">
                  No domains configured. Click &quot;Add Domain&quot; to begin.
                </td>
              </tr>
            ) : (
              domains.map((dom) => (
                <tr key={dom.id} className="hover:bg-[#f8fafd] transition-colors">
                  <td className="py-3 px-5 font-semibold text-slate-900 font-mono text-xs">{dom.name}</td>
                  <td className="py-3 px-5">
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {dom.status}
                    </span>
                  </td>
                  <td className="py-3 px-5 text-slate-500 font-mono text-[11px]">
                    {new Date(dom.created_at).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-5 text-right">
                    <div className="flex items-center justify-end gap-2 text-xs">
                      <button
                        onClick={() => openDomainDetails(dom.name, "dns")}
                        className="text-blue-600 hover:text-blue-700 font-medium cursor-pointer"
                      >
                        DNS Records
                      </button>
                      <span className="text-slate-300">·</span>
                      <button
                        onClick={() => openDomainDetails(dom.name, "dkim")}
                        className="text-blue-600 hover:text-blue-700 font-medium cursor-pointer"
                      >
                        DKIM Keys
                      </button>
                      <span className="text-slate-300">·</span>
                      <button
                        onClick={() => openDomainDetails(dom.name, "doctor")}
                        className="text-blue-600 hover:text-blue-700 font-medium cursor-pointer"
                      >
                        Doctor
                      </button>
                      <span className="text-slate-300">·</span>
                      <button
                        onClick={() => handleDelete(dom.name)}
                        className="text-red-600 hover:text-red-700 font-medium cursor-pointer"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add Domain Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/30 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">Add Virtual Domain</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Fully Qualified Domain Name
                </label>
                <input
                  type="text"
                  placeholder="example.com"
                  value={newDomainName}
                  onChange={(e) => setNewDomainName(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-blue-600 font-mono"
                  autoFocus
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs border border-slate-200 rounded-full text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating || !newDomainName}
                  className="px-5 py-2 text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  {creating ? "Adding..." : "Add Domain"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Domain Details Modal */}
      {selectedDomain && (
        <div className="fixed inset-0 z-50 bg-slate-900/30 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-2xl w-full p-6 shadow-2xl max-h-[85vh] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
                <div>
                  <h3 className="font-bold text-slate-900 text-base font-mono">{selectedDomain}</h3>
                  <p className="text-xs text-slate-400">DNS & Cryptographic Management</p>
                </div>
                <button onClick={() => setSelectedDomain(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer p-1">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-slate-200 mb-4 gap-6 text-xs font-medium">
                <button
                  onClick={() => setActiveTab("dns")}
                  className={`pb-2.5 cursor-pointer transition-colors ${
                    activeTab === "dns" ? "text-blue-600 border-b-2 border-blue-600 font-bold" : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  DNS Guidance (SPF / DMARC / MX)
                </button>
                <button
                  onClick={() => setActiveTab("dkim")}
                  className={`pb-2.5 cursor-pointer transition-colors ${
                    activeTab === "dkim" ? "text-blue-600 border-b-2 border-blue-600 font-bold" : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  DKIM Key Manager
                </button>
                <button
                  onClick={() => setActiveTab("doctor")}
                  className={`pb-2.5 cursor-pointer transition-colors ${
                    activeTab === "doctor" ? "text-blue-600 border-b-2 border-blue-600 font-bold" : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  Domain Doctor
                </button>
              </div>

              {/* DNS Tab */}
              {activeTab === "dns" && (
                <div className="space-y-3 overflow-y-auto max-h-[45vh] pr-1 font-mono text-xs">
                  <div className="p-3.5 bg-[#f8fafd] border border-slate-200 rounded-xl space-y-1.5">
                    <div className="flex justify-between font-bold text-slate-800">
                      <span>MX Record:</span>
                      <button
                        onClick={() => copyToClipboard(`10 mail.${selectedDomain}`, "mx")}
                        className="text-blue-600 hover:underline cursor-pointer text-[11px] flex items-center gap-1"
                      >
                        {copiedKey === "mx" ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedKey === "mx" ? "Copied" : "Copy"}</span>
                      </button>
                    </div>
                    <code className="block p-2 bg-white rounded border border-slate-200 text-[11px]">
                      @ IN MX 10 mail.{selectedDomain}.
                    </code>
                  </div>

                  <div className="p-3.5 bg-[#f8fafd] border border-slate-200 rounded-xl space-y-1.5">
                    <div className="flex justify-between font-bold text-slate-800">
                      <span>SPF Record (TXT):</span>
                      <button
                        onClick={() => copyToClipboard("v=spf1 mx ~all", "spf")}
                        className="text-blue-600 hover:underline cursor-pointer text-[11px] flex items-center gap-1"
                      >
                        {copiedKey === "spf" ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedKey === "spf" ? "Copied" : "Copy"}</span>
                      </button>
                    </div>
                    <code className="block p-2 bg-white rounded border border-slate-200 text-[11px]">
                      @ IN TXT &quot;v=spf1 mx ~all&quot;
                    </code>
                  </div>

                  <div className="p-3.5 bg-[#f8fafd] border border-slate-200 rounded-xl space-y-1.5">
                    <div className="flex justify-between font-bold text-slate-800">
                      <span>DMARC Record (TXT):</span>
                      <button
                        onClick={() => copyToClipboard(`v=DMARC1; p=quarantine; rua=mailto:dmarc@${selectedDomain}`, "dmarc")}
                        className="text-blue-600 hover:underline cursor-pointer text-[11px] flex items-center gap-1"
                      >
                        {copiedKey === "dmarc" ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedKey === "dmarc" ? "Copied" : "Copy"}</span>
                      </button>
                    </div>
                    <code className="block p-2 bg-white rounded border border-slate-200 text-[11px]">
                      _dmarc.{selectedDomain}. IN TXT &quot;v=DMARC1; p=quarantine; rua=mailto:dmarc@{selectedDomain}&quot;
                    </code>
                  </div>
                </div>
              )}

              {/* DKIM Tab */}
              {activeTab === "dkim" && (
                <div className="space-y-3 overflow-y-auto max-h-[45vh] pr-1 font-mono text-xs">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newSelector}
                      onChange={(e) => setNewSelector(e.target.value)}
                      placeholder="Selector (default)"
                      className="px-3.5 py-1.5 text-xs border border-slate-300 rounded-xl focus:outline-none"
                    />
                    <button
                      onClick={handleGenerateDKIM}
                      disabled={generatingDKIM || !newSelector}
                      className="px-4 py-1.5 text-xs bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 cursor-pointer shadow-2xs font-medium"
                    >
                      {generatingDKIM ? "Generating..." : "Generate 2048-bit Key"}
                    </button>
                  </div>

                  <div className="space-y-2">
                    {dkimKeys.length === 0 ? (
                      <div className="py-6 text-center text-slate-400">No DKIM keys generated.</div>
                    ) : (
                      dkimKeys.map((k) => (
                        <div key={k.id} className="p-3.5 bg-[#f8fafd] border border-slate-200 rounded-xl space-y-1.5">
                          <div className="flex justify-between items-center font-bold">
                            <span>Selector: {k.selector}</span>
                            <span className="text-[10px] uppercase font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                              {k.status}
                            </span>
                          </div>
                          {k.dns_record && (
                            <code className="block p-2 bg-white rounded border border-slate-200 text-[10px] break-all">
                              {k.selector}._domainkey.{selectedDomain}. IN TXT &quot;{k.dns_record}&quot;
                            </code>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* Doctor Tab */}
              {activeTab === "doctor" && (
                <pre className="p-4 bg-slate-900 text-slate-100 rounded-xl text-xs font-mono max-h-[45vh] overflow-y-auto whitespace-pre-wrap">
                  {doctorReport ? JSON.stringify(doctorReport, null, 2) : "Checking domain configuration..."}
                </pre>
              )}
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setSelectedDomain(null)}
                className="px-4 py-1.5 text-xs border border-slate-200 rounded-full hover:bg-slate-50 cursor-pointer text-slate-700"
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
