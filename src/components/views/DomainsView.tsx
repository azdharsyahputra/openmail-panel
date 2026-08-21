"use client";

import React, { useEffect, useState } from "react";
import { api, DomainItem, DomainDNSResponse, DKIMKeyItem } from "@/lib/api";
import { RefreshCw, Plus, Copy, Check, X, ChevronLeft, ChevronRight } from "lucide-react";

export function DomainsView() {
  const [domains, setDomains] = useState<DomainItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination State
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

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
    if (!confirm(`Delete domain ${domainName}? This will purge all associated mailboxes.`)) {
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

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(null), 1500);
  };

  const formatDate = (isoString?: string) => {
    if (!isoString) return "—";
    const d = new Date(isoString);
    if (isNaN(d.getTime()) || d.getFullYear() <= 2000) return "—";
    return d.toLocaleDateString();
  };

  // Pagination Calculations
  const totalPages = Math.ceil(domains.length / pageSize) || 1;
  const paginatedDomains = domains.slice((page - 1) * pageSize, page * pageSize);
  const startIdx = domains.length > 0 ? (page - 1) * pageSize + 1 : 0;
  const endIdx = Math.min(page * pageSize, domains.length);

  return (
    <div className="h-full flex flex-col space-y-4 max-w-6xl mx-auto">
      {/* Header - Fixed top */}
      <div className="shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200/80 pb-3">
        <div>
          <h1 className="text-xl font-semibold text-zinc-950 tracking-tight">Virtual Domains</h1>
          <p className="text-xs text-zinc-500 mt-0.5">DNS records, DKIM cryptographic keys, and domain health</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadDomains}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white hover:bg-zinc-50 border border-zinc-200/80 rounded-lg text-zinc-700 shadow-2xs transition-all cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-zinc-400" : "text-zinc-500"}`} />
            <span>Refresh</span>
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium bg-zinc-950 hover:bg-zinc-800 text-white rounded-lg shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Domain</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="shrink-0 p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-mono rounded-lg">
          {error}
        </div>
      )}

      {/* Table Container - Fills available height */}
      <div className="flex-1 min-h-0 rounded-xl border border-zinc-200/80 bg-white overflow-hidden shadow-2xs flex flex-col justify-between">
        <div className="flex-1 overflow-y-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-50/80 border-b border-zinc-200 font-mono text-zinc-500 uppercase text-[10px] sticky top-0 z-10 backdrop-blur-xs">
              <tr>
                <th className="py-3 px-4">Domain Name</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Created Date</th>
                <th className="py-3 px-4 text-right font-sans">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {domains.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-16 text-center text-zinc-400 text-xs font-sans">
                    No virtual domains registered yet. Click &quot;Add Domain&quot; to begin.
                  </td>
                </tr>
              ) : (
                paginatedDomains.map((dom) => (
                  <tr key={dom.id} className="hover:bg-zinc-50/50 transition-colors">
                    <td className="py-3 px-4 font-medium text-zinc-950 font-mono text-xs">{dom.name}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-medium bg-emerald-500/10 text-emerald-700 border border-emerald-500/20">
                        {dom.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-zinc-500 font-mono text-[11px]">
                      {formatDate(dom.created_at)}
                    </td>
                    <td className="py-3 px-4 text-right font-sans">
                      <div className="flex items-center justify-end gap-1.5 text-xs">
                        <button
                          onClick={() => openDomainDetails(dom.name, "dns")}
                          className="px-2.5 py-1 rounded-md text-zinc-700 hover:bg-zinc-100 font-medium cursor-pointer transition-colors"
                        >
                          DNS
                        </button>
                        <button
                          onClick={() => openDomainDetails(dom.name, "dkim")}
                          className="px-2.5 py-1 rounded-md text-zinc-700 hover:bg-zinc-100 font-medium cursor-pointer transition-colors"
                        >
                          DKIM
                        </button>
                        <button
                          onClick={() => openDomainDetails(dom.name, "doctor")}
                          className="px-2.5 py-1 rounded-md text-zinc-700 hover:bg-zinc-100 font-medium cursor-pointer transition-colors"
                        >
                          Doctor
                        </button>
                        <button
                          onClick={() => handleDelete(dom.name)}
                          className="px-2.5 py-1 rounded-md text-red-600 hover:bg-red-50 font-medium cursor-pointer transition-colors"
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

        {/* Pagination Footer */}
        {domains.length > 0 && (
          <div className="shrink-0 px-4 py-2.5 bg-zinc-50/80 border-t border-zinc-200 flex items-center justify-between text-xs text-zinc-500 font-mono">
            <div className="flex items-center gap-3">
              <span>
                Showing <span className="font-semibold text-zinc-900">{startIdx}</span> to{" "}
                <span className="font-semibold text-zinc-900">{endIdx}</span> of{" "}
                <span className="font-semibold text-zinc-900">{domains.length}</span> domains
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

      {/* Add Domain Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-zinc-950/20 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-zinc-200 max-w-sm w-full p-6 shadow-xl space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-zinc-100">
              <h3 className="font-semibold text-zinc-950 text-sm">Add Virtual Domain</h3>
              <button onClick={() => setShowAddModal(false)} className="text-zinc-400 hover:text-zinc-600 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1">
                  Fully Qualified Domain Name
                </label>
                <input
                  type="text"
                  placeholder="example.com"
                  value={newDomainName}
                  onChange={(e) => setNewDomainName(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-zinc-50 border border-zinc-300 rounded-lg focus:outline-none focus:border-zinc-950 focus:bg-white font-mono text-zinc-950"
                  autoFocus
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3.5 py-1.5 text-xs border border-zinc-200 rounded-lg text-zinc-700 hover:bg-zinc-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating || !newDomainName}
                  className="px-4 py-1.5 text-xs font-medium bg-zinc-950 hover:bg-zinc-800 text-white rounded-lg shadow-xs disabled:opacity-50 cursor-pointer"
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
        <div className="fixed inset-0 z-50 bg-zinc-950/20 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-zinc-200 max-w-2xl w-full p-6 shadow-2xl max-h-[85vh] flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-zinc-100 mb-3">
                <div>
                  <h3 className="font-semibold text-zinc-950 text-base font-mono">{selectedDomain}</h3>
                  <p className="text-xs text-zinc-400">DNS & Cryptographic Management</p>
                </div>
                <button onClick={() => setSelectedDomain(null)} className="text-zinc-400 hover:text-zinc-600 cursor-pointer p-1">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-zinc-100 mb-4 gap-4 text-xs font-medium">
                <button
                  onClick={() => setActiveTab("dns")}
                  className={`pb-2 cursor-pointer transition-colors ${
                    activeTab === "dns" ? "text-zinc-950 border-b-2 border-zinc-950 font-semibold" : "text-zinc-400 hover:text-zinc-700"
                  }`}
                >
                  DNS Guidance (SPF / DMARC / MX)
                </button>
                <button
                  onClick={() => setActiveTab("dkim")}
                  className={`pb-2 cursor-pointer transition-colors ${
                    activeTab === "dkim" ? "text-zinc-950 border-b-2 border-zinc-950 font-semibold" : "text-zinc-400 hover:text-zinc-700"
                  }`}
                >
                  DKIM Key Manager
                </button>
                <button
                  onClick={() => setActiveTab("doctor")}
                  className={`pb-2 cursor-pointer transition-colors ${
                    activeTab === "doctor" ? "text-zinc-950 border-b-2 border-zinc-950 font-semibold" : "text-zinc-400 hover:text-zinc-700"
                  }`}
                >
                  Domain Doctor
                </button>
              </div>

              {/* DNS Tab */}
              {activeTab === "dns" && (
                <div className="space-y-3 overflow-y-auto max-h-[45vh] pr-1 font-mono text-xs">
                  <div className="p-3.5 bg-zinc-50/70 border border-zinc-200/80 rounded-xl space-y-1.5">
                    <div className="flex justify-between font-bold text-zinc-800">
                      <span>MX Record:</span>
                      <button
                        onClick={() => copyToClipboard(`10 mail.${selectedDomain}`, "mx")}
                        className="text-zinc-700 hover:text-zinc-950 cursor-pointer text-[11px] flex items-center gap-1 font-sans"
                      >
                        {copiedKey === "mx" ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedKey === "mx" ? "Copied" : "Copy"}</span>
                      </button>
                    </div>
                    <code className="block p-2 bg-white rounded-lg border border-zinc-200 text-[11px]">
                      @ IN MX 10 mail.{selectedDomain}.
                    </code>
                  </div>

                  <div className="p-3.5 bg-zinc-50/70 border border-zinc-200/80 rounded-xl space-y-1.5">
                    <div className="flex justify-between font-bold text-zinc-800">
                      <span>SPF Record (TXT):</span>
                      <button
                        onClick={() => copyToClipboard("v=spf1 mx ~all", "spf")}
                        className="text-zinc-700 hover:text-zinc-950 cursor-pointer text-[11px] flex items-center gap-1 font-sans"
                      >
                        {copiedKey === "spf" ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedKey === "spf" ? "Copied" : "Copy"}</span>
                      </button>
                    </div>
                    <code className="block p-2 bg-white rounded-lg border border-zinc-200 text-[11px]">
                      @ IN TXT &quot;v=spf1 mx ~all&quot;
                    </code>
                  </div>

                  <div className="p-3.5 bg-zinc-50/70 border border-zinc-200/80 rounded-xl space-y-1.5">
                    <div className="flex justify-between font-bold text-zinc-800">
                      <span>DMARC Record (TXT):</span>
                      <button
                        onClick={() => copyToClipboard(`v=DMARC1; p=quarantine; rua=mailto:dmarc@${selectedDomain}`, "dmarc")}
                        className="text-zinc-700 hover:text-zinc-950 cursor-pointer text-[11px] flex items-center gap-1 font-sans"
                      >
                        {copiedKey === "dmarc" ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedKey === "dmarc" ? "Copied" : "Copy"}</span>
                      </button>
                    </div>
                    <code className="block p-2 bg-white rounded-lg border border-zinc-200 text-[11px]">
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
                      className="px-3 py-1.5 text-xs bg-zinc-50 border border-zinc-300 rounded-lg focus:outline-none focus:bg-white text-zinc-950"
                    />
                    <button
                      onClick={handleGenerateDKIM}
                      disabled={generatingDKIM || !newSelector}
                      className="px-3.5 py-1.5 text-xs bg-zinc-950 text-white rounded-lg hover:bg-zinc-800 disabled:opacity-50 cursor-pointer shadow-xs font-sans font-medium"
                    >
                      {generatingDKIM ? "Generating..." : "Generate Key"}
                    </button>
                  </div>

                  <div className="space-y-2">
                    {dkimKeys.length === 0 ? (
                      <div className="py-6 text-center text-zinc-400 font-sans text-xs">No DKIM keys generated.</div>
                    ) : (
                      dkimKeys.map((k) => (
                        <div key={k.id} className="p-3.5 bg-zinc-50/70 border border-zinc-200/80 rounded-xl space-y-1.5">
                          <div className="flex justify-between items-center font-bold">
                            <span>Selector: {k.selector}</span>
                            <span className="text-[10px] uppercase font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                              {k.status}
                            </span>
                          </div>
                          {k.dns_record && (
                            <code className="block p-2 bg-white rounded-lg border border-zinc-200 text-[10px] break-all">
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
                <pre className="p-4 bg-zinc-950 text-zinc-100 rounded-xl text-xs font-mono max-h-[45vh] overflow-y-auto whitespace-pre-wrap">
                  {doctorReport ? JSON.stringify(doctorReport, null, 2) : "Checking domain configuration..."}
                </pre>
              )}
            </div>

            <div className="pt-3 border-t border-zinc-100 flex justify-end">
              <button
                onClick={() => setSelectedDomain(null)}
                className="px-3.5 py-1.5 text-xs border border-zinc-200 rounded-lg hover:bg-zinc-50 cursor-pointer text-zinc-700"
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
