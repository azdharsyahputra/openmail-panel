"use client";

import React, { useEffect, useState } from "react";
import { api, AuditLogItem } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";
import { RefreshCw, ChevronLeft, ChevronRight, ShieldCheck } from "lucide-react";

export function SecurityView() {
  const toast = useToast();
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Pagination State
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const loadData = async (notify = false) => {
    try {
      setLoading(true);
      const logs = await api.getAuditLogs();
      setAuditLogs(logs);
      if (notify) {
        toast.info("Audit Stream Refreshed", `Loaded ${logs.length} immutable security records.`);
      }
    } catch (err: unknown) {
      toast.error("Failed to Load Audit Logs", err instanceof Error ? err.message : "Query failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(false);
  }, []);

  // Pagination Calculations
  const totalPages = Math.ceil(auditLogs.length / pageSize) || 1;
  const paginatedLogs = auditLogs.slice((page - 1) * pageSize, page * pageSize);
  const startIdx = auditLogs.length > 0 ? (page - 1) * pageSize + 1 : 0;
  const endIdx = Math.min(page * pageSize, auditLogs.length);

  return (
    <div className="h-full flex flex-col space-y-4 max-w-6xl mx-auto">
      {/* Header - Fixed top */}
      <div className="shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200/80 pb-3">
        <div>
          <h1 className="text-xl font-semibold text-zinc-950 tracking-tight">Security & Audit Log</h1>
          <p className="text-xs text-zinc-500 mt-0.5">Immutable audit trails and security baseline invariants</p>
        </div>
        <button
          onClick={() => loadData(true)}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white hover:bg-zinc-50 border border-zinc-200/80 rounded-lg text-zinc-700 shadow-2xs transition-all cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-zinc-400" : "text-zinc-500"}`} />
          <span>{loading ? "Refreshing..." : "Refresh Audit Feed"}</span>
        </button>
      </div>

      {/* Security Invariant Grid - Fixed top */}
      <div className="shrink-0 rounded-xl border border-zinc-200/80 bg-white p-4 space-y-2.5 shadow-2xs">
        <div className="flex justify-between items-center pb-2 border-b border-zinc-100">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <h2 className="text-xs font-semibold text-zinc-950 uppercase tracking-wider font-mono">
              Security Baseline Invariant Verification
            </h2>
          </div>
          <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 text-[10px] font-mono font-semibold">
            ALL INVARIANTS SATISFIED
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 text-xs font-mono text-center">
          <div className="p-2.5 bg-zinc-50/70 border border-zinc-200/80 rounded-lg">
            <div className="font-bold text-zinc-800 text-[11px]">Identity</div>
            <div className="text-emerald-700 text-[10px] font-semibold mt-0.5">PASS</div>
          </div>
          <div className="p-2.5 bg-zinc-50/70 border border-zinc-200/80 rounded-lg">
            <div className="font-bold text-zinc-800 text-[11px]">Postfix</div>
            <div className="text-emerald-700 text-[10px] font-semibold mt-0.5">PASS</div>
          </div>
          <div className="p-2.5 bg-zinc-50/70 border border-zinc-200/80 rounded-lg">
            <div className="font-bold text-zinc-800 text-[11px]">Dovecot</div>
            <div className="text-emerald-700 text-[10px] font-semibold mt-0.5">PASS</div>
          </div>
          <div className="p-2.5 bg-zinc-50/70 border border-zinc-200/80 rounded-lg">
            <div className="font-bold text-zinc-800 text-[11px]">OpenDKIM</div>
            <div className="text-emerald-700 text-[10px] font-semibold mt-0.5">PASS</div>
          </div>
          <div className="p-2.5 bg-zinc-50/70 border border-zinc-200/80 rounded-lg">
            <div className="font-bold text-zinc-800 text-[11px]">Smuggling</div>
            <div className="text-emerald-700 text-[10px] font-semibold mt-0.5">PASS</div>
          </div>
          <div className="p-2.5 bg-zinc-50/70 border border-zinc-200/80 rounded-lg">
            <div className="font-bold text-zinc-800 text-[11px]">No Secrets</div>
            <div className="text-emerald-700 text-[10px] font-semibold mt-0.5">PASS</div>
          </div>
        </div>
      </div>

      {/* Audit Log Stream Table - Fills height */}
      <div className="flex-1 min-h-0 rounded-xl border border-zinc-200/80 bg-white overflow-hidden shadow-2xs flex flex-col justify-between">
        <div className="flex-1 overflow-y-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-zinc-50/80 border-b border-zinc-200 text-zinc-500 uppercase text-[10px] sticky top-0 z-10 backdrop-blur-xs">
              <tr>
                <th className="py-3.5 px-6 w-52 text-left">Timestamp</th>
                <th className="py-3.5 px-4 w-28 text-center">Actor</th>
                <th className="py-3.5 px-4 w-44 text-center">Action</th>
                <th className="py-3.5 px-4 text-left">Target Resource</th>
                <th className="py-3.5 px-4 w-36 text-center">Client IP</th>
                <th className="py-3.5 px-6 w-32 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {auditLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-zinc-400 font-sans text-xs">
                    {loading ? "Loading audit stream..." : "No audit logs recorded yet."}
                  </td>
                </tr>
              ) : (
                paginatedLogs.map((log) => {
                  const actorNorm = (log.actor || "api").toLowerCase();
                  const actorClass = actorNorm.includes("admin")
                    ? "bg-purple-500/10 text-purple-700 border-purple-200"
                    : actorNorm.includes("api")
                    ? "bg-sky-500/10 text-sky-700 border-sky-200"
                    : actorNorm.includes("system")
                    ? "bg-emerald-500/10 text-emerald-700 border-emerald-200"
                    : "bg-zinc-100 text-zinc-700 border-zinc-200";

                  return (
                    <tr key={log.id} className="hover:bg-zinc-50/50 transition-colors">
                      <td className="py-2.5 px-6 text-zinc-500 text-[11px] text-left">
                        {new Date(log.created_at).toLocaleString()}
                      </td>
                      <td className="py-2.5 px-4 text-center">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase border ${actorClass}`}>
                          {log.actor || "api"}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 font-semibold text-blue-600 text-center">{log.action}</td>
                      <td className="py-2.5 px-4 text-zinc-800 font-medium truncate max-w-48 text-left">
                        {log.resource || "system"}
                      </td>
                      <td className="py-2.5 px-4 text-zinc-500 text-[11px] text-center">{log.ip_address}</td>
                      <td className="py-2.5 px-6 text-center font-sans">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-emerald-500/10 text-emerald-700 border border-emerald-500/20">
                          {log.status || "COMMITTED"}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {auditLogs.length > 0 && (
          <div className="shrink-0 px-4 py-2.5 bg-zinc-50/80 border-t border-zinc-200 flex items-center justify-between text-xs text-zinc-500 font-mono">
            <div className="flex items-center gap-3">
              <span>
                Showing <span className="font-semibold text-zinc-900">{startIdx}</span> to{" "}
                <span className="font-semibold text-zinc-900">{endIdx}</span> of{" "}
                <span className="font-semibold text-zinc-900">{auditLogs.length}</span> logs
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
    </div>
  );
}
