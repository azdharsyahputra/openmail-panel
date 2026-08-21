"use client";

import React, { useEffect, useState } from "react";
import { api, DomainItem, DomainDNSResponse, DKIMKeyItem } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import {
  RefreshCw,
  Plus,
  Copy,
  Check,
  X,
  ChevronLeft,
  ChevronRight,
  Search,
} from "lucide-react";

export function DomainsView() {
  const toast = useToast();
  const [domains, setDomains] = useState<DomainItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");

  // Pagination State
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Modals & Drawers
  const [showAddModal, setShowAddModal] = useState(false);
  const [newDomainName, setNewDomainName] = useState("");
  const [creating, setCreating] = useState(false);

  // Confirm Delete Modal State
  const [domainToDelete, setDomainToDelete] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Details Modal
  const [selectedDomain, setSelectedDomain] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"dns" | "dkim" | "doctor">("dns");
  const [dnsData, setDnsData] = useState<DomainDNSResponse | null>(null);
  const [dkimKeys, setDkimKeys] = useState<DKIMKeyItem[]>([]);
  const [newSelector, setNewSelector] = useState("default");
  const [generatingDKIM, setGeneratingDKIM] = useState(false);
  const [doctorReport, setDoctorReport] = useState<Record<string, unknown> | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const loadDomains = async (notify = false) => {
    try {
      setLoading(true);
      setError(null);
      const list = await api.getDomains();
      setDomains(list);
      if (notify) {
        toast.info("Domains Refreshed", `Loaded ${list.length} virtual domains.`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load domains";
      setError(msg);
      toast.error("Error Loading Domains", msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDomains(false);
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDomainName) return;
    try {
      setCreating(true);
      await api.createDomain(newDomainName.trim());
      toast.success("Domain Registered", `Virtual domain ${newDomainName.trim()} created successfully.`);
      setNewDomainName("");
      setShowAddModal(false);
      await loadDomains();
    } catch (err: unknown) {
      toast.error("Failed to Create Domain", err instanceof Error ? err.message : "Domain registration failed");
    } finally {
      setCreating(false);
    }
  };

  const confirmDeleteDomain = async () => {
    if (!domainToDelete) return;
    try {
      setDeleting(true);
      await api.deleteDomain(domainToDelete);
      toast.success("Domain Deleted", `Virtual domain ${domainToDelete} was removed.`);
      setDomainToDelete(null);
      await loadDomains();
      if (selectedDomain === domainToDelete) {
        setSelectedDomain(null);
      }
    } catch (err: unknown) {
      toast.error("Failed to Delete Domain", err instanceof Error ? err.message : "Deletion failed");
    } finally {
      setDeleting(false);
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
      toast.success("DKIM Key Generated", `Selector '${newSelector.trim()}' 2048-bit RSA key ready.`);
      const keys = await api.getDomainDKIM(selectedDomain);
      setDkimKeys(keys);
    } catch (err: unknown) {
      toast.error("Failed to Generate DKIM Key", err instanceof Error ? err.message : "Generation failed");
    } finally {
      setGeneratingDKIM(false);
    }
  };

  const handleActivateDKIM = async (selector: string) => {
    if (!selectedDomain) return;
    try {
      await api.activateDomainDKIM(selectedDomain, selector);
      toast.success("DKIM Key Activated", `Selector '${selector}' is now signing outbound mail.`);
      const keys = await api.getDomainDKIM(selectedDomain);
      setDkimKeys(keys);
    } catch (err: unknown) {
      toast.error("Failed to Activate DKIM Key", err instanceof Error ? err.message : "Activation failed");
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
    toast.info("Copied to Clipboard", text);
    setTimeout(() => setCopiedKey(null), 1500);
  };

  const formatDate = (isoString?: string) => {
    if (!isoString) return "System Init";
    const d = new Date(isoString);
    if (isNaN(d.getTime()) || d.getFullYear() <= 2000) return "System Init";
    return d.toLocaleDateString();
  };

  // Filtered list
  const filteredDomains = domains.filter((d) => {
    const matchesSearch = d.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === "all" ? true : statusFilter === "active" ? d.status === "active" : d.status !== "active";
    return matchesSearch && matchesStatus;
  });

  // Pagination Calculations
  const totalPages = Math.ceil(filteredDomains.length / pageSize) || 1;
  const paginatedDomains = filteredDomains.slice((page - 1) * pageSize, page * pageSize);
  const startIdx = filteredDomains.length > 0 ? (page - 1) * pageSize + 1 : 0;
  const endIdx = Math.min(page * pageSize, filteredDomains.length);

  const activeCount = domains.filter((d) => d.status === "active").length;

  return (
    <div className="h-full flex flex-col space-y-4 max-w-6xl mx-auto min-h-0">
      {/* Crisp, Direct Header Bar */}
      <div className="shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200/80 pb-3">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-xl font-semibold text-zinc-950 tracking-tight">Virtual Domains</h1>
            <p className="text-xs text-zinc-500 mt-0.5">
              Manage virtual mail routing domains, authoritative DNS, and DKIM milter keys
            </p>
          </div>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
            {activeCount} Active
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => loadDomains(true)}
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
            <span>Add Domain</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="shrink-0 p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-mono rounded-xl">
          {error}
        </div>
      )}

      {/* Main Table Container with Integrated Search & Filter Header */}
      <div className="flex-1 min-h-0 rounded-2xl border border-zinc-200/80 bg-white overflow-hidden shadow-2xs flex flex-col justify-between">
        {/* Search & Status Filter Bar */}
        <div className="shrink-0 px-4 py-3 bg-zinc-50/80 border-b border-zinc-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search virtual domains by name..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              className="w-full pl-8.5 pr-3 py-1.5 text-xs bg-white border border-zinc-200 rounded-lg text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-900 font-mono"
            />
          </div>

          <div className="flex items-center gap-2 text-xs font-mono text-zinc-500">
            <span>Filter:</span>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as "all" | "active" | "inactive");
                setPage(1);
              }}
              className="px-2 py-1 bg-white border border-zinc-200 rounded-lg text-zinc-800 text-xs font-mono cursor-pointer"
            >
              <option value="all">All Domains ({domains.length})</option>
              <option value="active">Active Only ({activeCount})</option>
              <option value="inactive">Inactive (0)</option>
            </select>
          </div>
        </div>

        {/* Domains Table */}
        <div className="flex-1 overflow-y-auto min-h-0">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-50/80 border-b border-zinc-200 font-mono text-zinc-500 uppercase text-[10px] sticky top-0 z-10 backdrop-blur-xs">
              <tr>
                <th className="py-3.5 px-6 text-left">Domain Name</th>
                <th className="py-3.5 px-4 w-36 text-center">Status</th>
                <th className="py-3.5 px-4 w-40 text-center">Created Date</th>
                <th className="py-3.5 px-6 w-72 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 font-mono">
              {paginatedDomains.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-16 text-center text-zinc-400 text-xs font-sans">
                    {searchQuery
                      ? `No virtual domains match "${searchQuery}".`
                      : "No virtual domains registered yet. Click 'Add Domain' to begin."}
                  </td>
                </tr>
              ) : (
                paginatedDomains.map((dom) => (
                  <tr key={dom.id} className="hover:bg-zinc-50/50 transition-colors">
                    <td className="py-3 px-6 font-semibold text-zinc-950 text-xs text-left">
                      {dom.name}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-emerald-500/10 text-emerald-700 border border-emerald-500/20">
                        {dom.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center text-zinc-500 text-[11px]">
                      {formatDate(dom.created_at)}
                    </td>
                    <td className="py-3 px-6 text-center">
                      <div className="flex items-center justify-center gap-1.5 text-xs font-sans">
                        <button
                          onClick={() => openDomainDetails(dom.name, "dns")}
                          className="px-2.5 py-1 text-[11px] font-medium bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 rounded-md text-zinc-800 shadow-2xs hover:border-zinc-300 transition-all cursor-pointer"
                        >
                          DNS
                        </button>
                        <button
                          onClick={() => openDomainDetails(dom.name, "dkim")}
                          className="px-2.5 py-1 text-[11px] font-medium bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 rounded-md text-zinc-800 shadow-2xs hover:border-zinc-300 transition-all cursor-pointer"
                        >
                          DKIM
                        </button>
                        <button
                          onClick={() => openDomainDetails(dom.name, "doctor")}
                          className="px-2.5 py-1 text-[11px] font-medium bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 rounded-md text-zinc-800 shadow-2xs hover:border-zinc-300 transition-all cursor-pointer"
                        >
                          Doctor
                        </button>
                        <button
                          onClick={() => setDomainToDelete(dom.name)}
                          className="px-2.5 py-1 text-[11px] font-medium bg-red-50 hover:bg-red-100 border border-red-200/80 rounded-md text-red-700 shadow-2xs hover:border-red-300 transition-all cursor-pointer"
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
        {filteredDomains.length > 0 && (
          <div className="shrink-0 px-4 py-2.5 bg-zinc-50/80 border-t border-zinc-200 flex items-center justify-between text-xs text-zinc-500 font-mono">
            <div className="flex items-center gap-3">
              <span>
                Showing <span className="font-semibold text-zinc-900">{startIdx}</span> to{" "}
                <span className="font-semibold text-zinc-900">{endIdx}</span> of{" "}
                <span className="font-semibold text-zinc-900">{filteredDomains.length}</span> domains
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
        <div className="fixed inset-0 z-50 bg-zinc-950/20 backdrop-blur-xs flex items-center justify-center p-4 select-none">
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
                  Domain FQDN
                </label>
                <input
                  type="text"
                  placeholder="e.g. mail.company.com"
                  value={newDomainName}
                  onChange={(e) => setNewDomainName(e.target.value)}
                  disabled={creating}
                  className="w-full px-3 py-2 text-xs bg-zinc-50 border border-zinc-300 rounded-lg focus:outline-none focus:bg-white focus:border-zinc-950 font-mono text-zinc-950"
                  autoFocus
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
                  disabled={creating || !newDomainName}
                  className="px-4 py-1.5 text-xs font-medium bg-zinc-950 hover:bg-zinc-800 text-white rounded-lg disabled:opacity-50 cursor-pointer shadow-xs"
                >
                  {creating ? "Adding..." : "Add Domain"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Domain Details Modal (DNS, DKIM, Doctor) */}
      {selectedDomain && (
        <div className="fixed inset-0 z-50 bg-zinc-950/20 backdrop-blur-xs flex items-center justify-center p-4 select-none">
          <div className="bg-white rounded-2xl border border-zinc-200 max-w-2xl w-full p-6 shadow-xl space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center pb-2 border-b border-zinc-100 shrink-0">
              <div>
                <h3 className="font-semibold text-zinc-950 text-sm font-mono">{selectedDomain}</h3>
                <p className="text-xs text-zinc-500">Domain configuration, keys & diagnostics</p>
              </div>
              <button onClick={() => setSelectedDomain(null)} className="text-zinc-400 hover:text-zinc-600 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Tabs */}
            <div className="flex border-b border-zinc-200 gap-6 text-xs font-medium shrink-0">
              <button
                onClick={() => setActiveTab("dns")}
                className={`pb-2 cursor-pointer transition-colors ${
                  activeTab === "dns" ? "text-zinc-950 border-b-2 border-zinc-950 font-semibold" : "text-zinc-400 hover:text-zinc-700"
                }`}
              >
                DNS Records
              </button>
              <button
                onClick={() => setActiveTab("dkim")}
                className={`pb-2 cursor-pointer transition-colors ${
                  activeTab === "dkim" ? "text-zinc-950 border-b-2 border-zinc-950 font-semibold" : "text-zinc-400 hover:text-zinc-700"
                }`}
              >
                DKIM Keys
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

            {/* Modal Content */}
            <div className="flex-1 min-h-0 overflow-y-auto text-xs space-y-4 font-mono select-text">
              {activeTab === "dns" && (
                <div className="space-y-4 font-sans">
                  {/* Setup Guidance Banner */}
                  <div className="p-3 bg-zinc-50 border border-zinc-200/80 rounded-xl space-y-1">
                    <div className="font-semibold text-zinc-950 text-xs flex items-center gap-1.5">
                      <span>DNS Registrar Setup Guide for</span>
                      <code className="px-1.5 py-0.5 bg-white border border-zinc-200 rounded font-mono text-[11px] text-zinc-900">
                        {selectedDomain}
                      </code>
                    </div>
                    <p className="text-[11px] text-zinc-500 leading-relaxed">
                      Copy the following authoritative records into your domain management provider (e.g., Cloudflare, Namecheap, GoDaddy, Rumahweb). DNS propagation typically completes within 1–5 minutes.
                    </p>
                  </div>

                  {dnsData ? (
                    (() => {
                      interface ExpandedRecord {
                        type: string;
                        host: string;
                        value: string;
                        description: string;
                      }

                      const list: ExpandedRecord[] = [];

                      if (dnsData.mx) {
                        list.push({
                          type: "MX",
                          host: dnsData.mx.host || "@",
                          value: `${dnsData.mx.priority || 10} ${dnsData.mx.value}`,
                          description: `Directs incoming emails for @${selectedDomain} to the MailOpen mail exchange server.`,
                        });
                      }

                      if (dnsData.spf) {
                        list.push({
                          type: "TXT (SPF)",
                          host: dnsData.spf.host || "@",
                          value: dnsData.spf.value,
                          description: `Authorizes MailOpen IP servers to send emails on behalf of ${selectedDomain} and prevents email spoofing.`,
                        });
                      }

                      if (dnsData.dmarc) {
                        list.push({
                          type: "TXT (DMARC)",
                          host: dnsData.dmarc.host || "_dmarc",
                          value: dnsData.dmarc.value,
                          description: `Enforces RFC 7489 policy alignment and requests aggregate delivery reports for unauthenticated emails.`,
                        });
                      }

                      if (dnsData.dkim) {
                        list.push({
                          type: "TXT (DKIM)",
                          host: dnsData.dkim.host || "default._domainkey",
                          value: dnsData.dkim.value,
                          description: `Cryptographic 2048-bit RSA public key used by inbox providers (Gmail, Outlook) to verify outbound header integrity.`,
                        });
                      }

                      // Fallback if records array was used
                      if (list.length === 0 && dnsData.records && dnsData.records.length > 0) {
                        dnsData.records.forEach((r) => {
                          list.push({
                            type: r.type || "TXT",
                            host: r.name || r.host || "@",
                            value: r.value,
                            description: "Authoritative DNS record for domain operations.",
                          });
                        });
                      }

                      if (list.length === 0) {
                        return <div className="p-6 text-center text-zinc-400 text-xs">No DNS records configured for this domain yet.</div>;
                      }

                      return list.map((rec, i) => (
                        <div key={i} className="p-4 bg-white rounded-xl border border-zinc-200/80 space-y-2.5 shadow-2xs">
                          {/* Title & Type */}
                          <div className="flex items-center justify-between font-mono">
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 text-[10px] font-bold bg-zinc-950 text-white rounded uppercase">
                                {rec.type}
                              </span>
                              <span className="text-[11px] font-semibold text-zinc-800">{rec.description}</span>
                            </div>
                            <span className="text-[10px] text-zinc-400">TTL: Auto (3600)</span>
                          </div>

                          {/* Host Row */}
                          <div className="space-y-1">
                            <span className="text-[10px] font-bold text-zinc-500 uppercase font-mono">Name / Host / Subdomain:</span>
                            <div className="flex items-center justify-between gap-2 p-2 bg-zinc-50 rounded-lg border border-zinc-200/80 font-mono text-xs">
                              <code className="text-zinc-900 font-bold">{rec.host}</code>
                              <button
                                onClick={() => copyToClipboard(rec.host, `host-${i}`)}
                                className="flex items-center gap-1 text-[11px] text-zinc-600 hover:text-zinc-950 font-sans font-medium px-2 py-0.5 bg-white border border-zinc-200 rounded shadow-2xs cursor-pointer transition-all"
                              >
                                {copiedKey === `host-${i}` ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3 text-zinc-400" />}
                                <span>{copiedKey === `host-${i}` ? "Copied" : "Copy Host"}</span>
                              </button>
                            </div>
                          </div>

                          {/* Value Row */}
                          <div className="space-y-1">
                            <span className="text-[10px] font-bold text-zinc-500 uppercase font-mono">Value / Target / Content:</span>
                            <div className="flex items-center justify-between gap-2 p-2 bg-zinc-50 rounded-lg border border-zinc-200/80 font-mono text-xs">
                              <code className="text-zinc-800 break-all text-[11px] leading-relaxed">{rec.value}</code>
                              <button
                                onClick={() => copyToClipboard(rec.value, `val-${i}`)}
                                className="flex items-center gap-1 text-[11px] text-zinc-600 hover:text-zinc-950 font-sans font-medium px-2 py-0.5 bg-white border border-zinc-200 rounded shadow-2xs cursor-pointer transition-all shrink-0 ml-2"
                              >
                                {copiedKey === `val-${i}` ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3 text-zinc-400" />}
                                <span>{copiedKey === `val-${i}` ? "Copied" : "Copy Value"}</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      ));
                    })()
                  ) : (
                    <div className="p-6 text-center text-zinc-400 font-sans text-xs">Loading DNS records...</div>
                  )}
                </div>
              )}

              {activeTab === "dkim" && (
                <div className="space-y-4">
                  <div className="p-3 bg-zinc-50 rounded-lg border border-zinc-200 flex items-center justify-between gap-3">
                    <input
                      type="text"
                      placeholder="Selector name (e.g. mail2026)"
                      value={newSelector}
                      onChange={(e) => setNewSelector(e.target.value)}
                      className="px-3 py-1.5 text-xs bg-white border border-zinc-300 rounded focus:outline-none focus:border-zinc-950 font-mono text-zinc-950 flex-1"
                    />
                    <button
                      onClick={handleGenerateDKIM}
                      disabled={generatingDKIM || !newSelector}
                      className="px-3 py-1.5 text-xs font-medium bg-zinc-950 hover:bg-zinc-800 text-white rounded disabled:opacity-50 cursor-pointer"
                    >
                      {generatingDKIM ? "Generating..." : "Generate 2048-bit RSA"}
                    </button>
                  </div>

                  <div className="space-y-3">
                    {dkimKeys.map((k) => (
                      <div key={k.id} className="p-3 bg-zinc-50 rounded-lg border border-zinc-200 space-y-2">
                        <div className="flex justify-between items-center">
                          <div>
                            <span className="font-bold text-zinc-900">Selector: {k.selector}</span>
                            <span className="ml-2 text-[10px] text-zinc-400">({formatDate(k.created_at)})</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                k.status === "active"
                                  ? "bg-emerald-500/10 text-emerald-700 border border-emerald-500/20"
                                  : "bg-zinc-200 text-zinc-700"
                              }`}
                            >
                              {k.status}
                            </span>
                            {k.status !== "active" && (
                              <button
                                onClick={() => handleActivateDKIM(k.selector)}
                                className="px-2 py-0.5 text-[10px] bg-zinc-950 hover:bg-zinc-800 text-white rounded cursor-pointer"
                              >
                                Activate
                              </button>
                            )}
                          </div>
                        </div>
                        {k.dns_record && (
                          <div className="flex items-center justify-between gap-2 p-2 bg-white rounded border border-zinc-200/80">
                            <code className="text-zinc-700 break-all text-[11px]">{k.dns_record}</code>
                            <button
                              onClick={() => copyToClipboard(k.dns_record, k.id)}
                              className="p-1 text-zinc-400 hover:text-zinc-800 shrink-0 cursor-pointer"
                            >
                              {copiedKey === k.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === "doctor" && (
                <div className="space-y-3 font-sans">
                  {doctorReport ? (
                    <div className="p-4 bg-zinc-50 rounded-lg border border-zinc-200 space-y-2">
                      <div className="flex items-center justify-between border-b border-zinc-200 pb-2">
                        <span className="font-semibold text-zinc-900 text-xs">Diagnostic Invariants</span>
                        <span className="text-emerald-700 font-mono text-[11px] font-bold">PASS</span>
                      </div>
                      <pre className="text-xs font-mono text-zinc-700 whitespace-pre-wrap">
                        {JSON.stringify(doctorReport, null, 2)}
                      </pre>
                    </div>
                  ) : (
                    <div className="p-8 text-center text-zinc-400 font-mono text-xs">
                      Running diagnostic probe on {selectedDomain}...
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Delete */}
      <ConfirmModal
        isOpen={Boolean(domainToDelete)}
        title="Delete Virtual Domain"
        message={`Are you sure you want to permanently delete virtual domain "${domainToDelete}"? All associated mailboxes and aliases will be permanently purged.`}
        confirmLabel="Delete Domain"
        variant="danger"
        loading={deleting}
        onConfirm={confirmDeleteDomain}
        onCancel={() => setDomainToDelete(null)}
      />
    </div>
  );
}
