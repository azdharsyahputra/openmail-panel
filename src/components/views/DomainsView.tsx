"use client";

import React, { useEffect, useState } from "react";
import { api, DomainItem, DomainDNSResponse, DKIMKeyItem } from "@/lib/api";

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
    if (!confirm(`Delete domain ${domainName}? This removes all mailboxes under this domain.`)) {
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
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
        <div>
          <h1 className="text-base font-bold text-slate-900">Domains</h1>
          <p className="text-xs text-slate-500">Virtual domains, DNS records, and DKIM key management</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadDomains}
            className="px-3 py-1 text-xs font-medium bg-white hover:bg-slate-50 border border-slate-300 rounded text-slate-700 cursor-pointer"
          >
            Refresh
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-3 py-1 text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white rounded cursor-pointer"
          >
            Add Domain
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
              <th className="py-2.5 px-4">Domain Name</th>
              <th className="py-2.5 px-4">Status</th>
              <th className="py-2.5 px-4">Created Date</th>
              <th className="py-2.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {domains.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-8 text-center text-slate-400">
                  No domains configured. Click &quot;Add Domain&quot; to begin.
                </td>
              </tr>
            ) : (
              domains.map((dom) => (
                <tr key={dom.id} className="hover:bg-slate-50">
                  <td className="py-2.5 px-4 font-semibold text-slate-900 font-mono">{dom.name}</td>
                  <td className="py-2.5 px-4">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {dom.status}
                    </span>
                  </td>
                  <td className="py-2.5 px-4 text-slate-500 font-mono text-[11px]">
                    {new Date(dom.created_at).toLocaleDateString()}
                  </td>
                  <td className="py-2.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openDomainDetails(dom.name, "dns")}
                        className="text-blue-600 hover:underline cursor-pointer"
                      >
                        DNS Records
                      </button>
                      <span className="text-slate-300">·</span>
                      <button
                        onClick={() => openDomainDetails(dom.name, "dkim")}
                        className="text-blue-600 hover:underline cursor-pointer"
                      >
                        DKIM Keys
                      </button>
                      <span className="text-slate-300">·</span>
                      <button
                        onClick={() => openDomainDetails(dom.name, "doctor")}
                        className="text-blue-600 hover:underline cursor-pointer"
                      >
                        Doctor
                      </button>
                      <span className="text-slate-300">·</span>
                      <button
                        onClick={() => handleDelete(dom.name)}
                        className="text-red-600 hover:underline cursor-pointer"
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
        <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg border border-slate-300 max-w-sm w-full p-5 shadow-lg">
            <h3 className="font-bold text-slate-900 text-sm mb-3">Add Virtual Domain</h3>
            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Domain Name
                </label>
                <input
                  type="text"
                  placeholder="example.com"
                  value={newDomainName}
                  onChange={(e) => setNewDomainName(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded focus:outline-none focus:border-blue-600 font-mono"
                  autoFocus
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
                  disabled={creating || !newDomainName}
                  className="px-3 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded disabled:opacity-50"
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
        <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg border border-slate-300 max-w-2xl w-full p-6 shadow-xl max-h-[85vh] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
                <h3 className="font-bold text-slate-900 text-sm font-mono">{selectedDomain}</h3>
                <button onClick={() => setSelectedDomain(null)} className="text-slate-400 hover:text-slate-600 text-xs">
                  ✕
                </button>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-slate-200 mb-4 gap-4 text-xs font-medium">
                <button
                  onClick={() => setActiveTab("dns")}
                  className={`pb-2 cursor-pointer ${
                    activeTab === "dns" ? "text-blue-600 border-b-2 border-blue-600 font-semibold" : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  DNS Guidance
                </button>
                <button
                  onClick={() => setActiveTab("dkim")}
                  className={`pb-2 cursor-pointer ${
                    activeTab === "dkim" ? "text-blue-600 border-b-2 border-blue-600 font-semibold" : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  DKIM Keys
                </button>
                <button
                  onClick={() => setActiveTab("doctor")}
                  className={`pb-2 cursor-pointer ${
                    activeTab === "doctor" ? "text-blue-600 border-b-2 border-blue-600 font-semibold" : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  Domain Doctor
                </button>
              </div>

              {/* DNS Tab */}
              {activeTab === "dns" && (
                <div className="space-y-3 overflow-y-auto max-h-[45vh] pr-1 font-mono text-xs">
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded space-y-1">
                    <div className="flex justify-between font-bold text-slate-800">
                      <span>MX Record:</span>
                      <button
                        onClick={() => copyToClipboard(`10 mail.${selectedDomain}`, "mx")}
                        className="text-blue-600 hover:underline cursor-pointer text-[11px]"
                      >
                        {copiedKey === "mx" ? "Copied!" : "Copy"}
                      </button>
                    </div>
                    <code className="block p-2 bg-white rounded border border-slate-200 text-[11px]">
                      @ IN MX 10 mail.{selectedDomain}.
                    </code>
                  </div>

                  <div className="p-3 bg-slate-50 border border-slate-200 rounded space-y-1">
                    <div className="flex justify-between font-bold text-slate-800">
                      <span>SPF Record (TXT):</span>
                      <button
                        onClick={() => copyToClipboard("v=spf1 mx ~all", "spf")}
                        className="text-blue-600 hover:underline cursor-pointer text-[11px]"
                      >
                        {copiedKey === "spf" ? "Copied!" : "Copy"}
                      </button>
                    </div>
                    <code className="block p-2 bg-white rounded border border-slate-200 text-[11px]">
                      @ IN TXT &quot;v=spf1 mx ~all&quot;
                    </code>
                  </div>

                  <div className="p-3 bg-slate-50 border border-slate-200 rounded space-y-1">
                    <div className="flex justify-between font-bold text-slate-800">
                      <span>DMARC Record (TXT):</span>
                      <button
                        onClick={() => copyToClipboard(`v=DMARC1; p=quarantine; rua=mailto:dmarc@${selectedDomain}`, "dmarc")}
                        className="text-blue-600 hover:underline cursor-pointer text-[11px]"
                      >
                        {copiedKey === "dmarc" ? "Copied!" : "Copy"}
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
                      className="px-3 py-1 text-xs border border-slate-300 rounded focus:outline-none"
                    />
                    <button
                      onClick={handleGenerateDKIM}
                      disabled={generatingDKIM || !newSelector}
                      className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 cursor-pointer"
                    >
                      {generatingDKIM ? "Generating..." : "Generate 2048-bit Key"}
                    </button>
                  </div>

                  <div className="space-y-2">
                    {dkimKeys.length === 0 ? (
                      <div className="py-6 text-center text-slate-400">No DKIM keys generated.</div>
                    ) : (
                      dkimKeys.map((k) => (
                        <div key={k.id} className="p-3 bg-slate-50 border border-slate-200 rounded space-y-1">
                          <div className="flex justify-between items-center font-bold">
                            <span>Selector: {k.selector}</span>
                            <span className="text-[10px] uppercase font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
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
                <pre className="p-3 bg-slate-900 text-slate-100 rounded text-xs font-mono max-h-[45vh] overflow-y-auto whitespace-pre-wrap">
                  {doctorReport ? JSON.stringify(doctorReport, null, 2) : "Checking domain configuration..."}
                </pre>
              )}
            </div>

            <div className="pt-4 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setSelectedDomain(null)}
                className="px-3 py-1 text-xs border border-slate-300 rounded hover:bg-slate-50 cursor-pointer"
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
