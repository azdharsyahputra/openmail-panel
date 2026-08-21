"use client";

import React, { useEffect, useState } from "react";
import { api, QueueSummary, QueueMessage } from "@/lib/api";
import { RefreshCw, Send, X, ChevronLeft, ChevronRight } from "lucide-react";

export function QueueView() {
  const [summary, setSummary] = useState<QueueSummary | null>(null);
  const [messages, setMessages] = useState<QueueMessage[]>([]);
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination State
  const [page, setPage] = useState(1);
  const pageSize = 8;

  // Inspector Modal
  const [inspectingId, setInspectingId] = useState<string | null>(null);
  const [inspectContent, setInspectContent] = useState<string | null>(null);
  const [loadingInspect, setLoadingInspect] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [sum, msgs] = await Promise.all([
        api.getQueueSummary().catch(() => ({ active: 0, deferred: 0, hold: 0, corrupt: 0, total: 0 })),
        api.getQueueMessages(activeFilter === "all" ? undefined : activeFilter).catch(() => []),
      ]);
      setSummary(sum);
      setMessages(msgs);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load mail queue");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
    loadData();
  }, [activeFilter]);

  const handleFlush = async () => {
    if (!confirm("Flush all mail queues immediately?")) return;
    try {
      await api.flushQueue();
      alert("Queue flush triggered successfully.");
      await loadData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to flush queue");
    }
  };

  const handleRetry = async (id: string) => {
    try {
      await api.retryQueueMessage(id);
      await loadData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to retry message");
    }
  };

  const handleHold = async (id: string) => {
    try {
      await api.holdQueueMessage(id);
      await loadData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to hold message");
    }
  };

  const handleRelease = async (id: string) => {
    try {
      await api.releaseQueueMessage(id);
      await loadData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to release message");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(`Delete message ${id} from queue?`)) return;
    try {
      await api.deleteQueueMessage(id);
      await loadData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to delete queue message");
    }
  };

  const handleInspect = async (id: string) => {
    setInspectingId(id);
    setInspectContent(null);
    try {
      setLoadingInspect(true);
      const res = await api.inspectQueueMessage(id);
      setInspectContent(res.content);
    } catch (err: unknown) {
      setInspectContent(`Failed to inspect message: ${err instanceof Error ? err.message : "Unknown error"}`);
    } finally {
      setLoadingInspect(false);
    }
  };

  // Pagination Calculations
  const totalPages = Math.ceil(messages.length / pageSize) || 1;
  const paginatedMessages = messages.slice((page - 1) * pageSize, page * pageSize);
  const startIdx = messages.length > 0 ? (page - 1) * pageSize + 1 : 0;
  const endIdx = Math.min(page * pageSize, messages.length);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200/80 pb-4">
        <div>
          <h1 className="text-xl font-semibold text-zinc-950 tracking-tight">Mail Transport Queue</h1>
          <p className="text-xs text-zinc-500 mt-0.5">Monitor and manage Postfix active, deferred, and hold queues</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white hover:bg-zinc-50 border border-zinc-200/80 rounded-lg text-zinc-700 shadow-2xs transition-all cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-zinc-400" : "text-zinc-500"}`} />
            <span>Refresh</span>
          </button>
          <button
            onClick={handleFlush}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium bg-amber-600 hover:bg-amber-700 text-white rounded-lg shadow-xs transition-all cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Flush Queue</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-mono rounded-lg">
          {error}
        </div>
      )}

      {/* Summary Row */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 font-mono text-xs text-center">
        <div className="p-3.5 bg-white rounded-xl border border-zinc-200/80 shadow-2xs">
          <div className="text-[10px] text-zinc-400 uppercase tracking-wider">Total</div>
          <div className="text-xl font-bold text-zinc-950 mt-0.5">{summary?.total || 0}</div>
        </div>
        <div className="p-3.5 bg-white rounded-xl border border-zinc-200/80 shadow-2xs">
          <div className="text-[10px] text-emerald-600 uppercase tracking-wider">Active</div>
          <div className="text-xl font-bold text-emerald-600 mt-0.5">{summary?.active || 0}</div>
        </div>
        <div className="p-3.5 bg-white rounded-xl border border-zinc-200/80 shadow-2xs">
          <div className="text-[10px] text-amber-600 uppercase tracking-wider">Deferred</div>
          <div className="text-xl font-bold text-amber-600 mt-0.5">{summary?.deferred || 0}</div>
        </div>
        <div className="p-3.5 bg-white rounded-xl border border-zinc-200/80 shadow-2xs">
          <div className="text-[10px] text-blue-600 uppercase tracking-wider">Hold</div>
          <div className="text-xl font-bold text-blue-600 mt-0.5">{summary?.hold || 0}</div>
        </div>
        <div className="p-3.5 bg-white rounded-xl border border-zinc-200/80 shadow-2xs">
          <div className="text-[10px] text-red-600 uppercase tracking-wider">Corrupt</div>
          <div className="text-xl font-bold text-red-600 mt-0.5">{summary?.corrupt || 0}</div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-1.5 border-b border-zinc-200/80 pb-2 text-xs font-mono">
        {["all", "active", "deferred", "hold", "corrupt"].map((f) => (
          <button
            key={f}
            onClick={() => setActiveFilter(f)}
            className={`px-3 py-1 rounded-lg uppercase tracking-wider transition-all cursor-pointer ${
              activeFilter === f
                ? "bg-zinc-950 text-white font-medium shadow-xs"
                : "text-zinc-500 hover:text-zinc-950 hover:bg-zinc-100"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Messages Table */}
      <div className="rounded-xl border border-zinc-200/80 bg-white overflow-hidden shadow-2xs">
        <table className="w-full text-left text-xs font-mono">
          <thead className="bg-zinc-50/70 border-b border-zinc-200 text-zinc-500 uppercase text-[10px]">
            <tr>
              <th className="py-3 px-4">Queue ID</th>
              <th className="py-3 px-4">Sender</th>
              <th className="py-3 px-4">Recipient</th>
              <th className="py-3 px-4">Size</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right font-sans">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {messages.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-10 text-center text-zinc-400 font-sans text-xs">
                  No messages queued in this category.
                </td>
              </tr>
            ) : (
              paginatedMessages.map((msg) => (
                <tr key={msg.id} className="hover:bg-zinc-50/50 transition-colors">
                  <td className="py-2.5 px-4 font-bold text-zinc-950">{msg.id}</td>
                  <td className="py-2.5 px-4 text-zinc-700 truncate max-w-40">{msg.sender || "<empty>"}</td>
                  <td className="py-2.5 px-4 text-zinc-700 truncate max-w-40">{msg.recipient}</td>
                  <td className="py-2.5 px-4 text-zinc-500">{(msg.size_bytes / 1024).toFixed(1)} KB</td>
                  <td className="py-2.5 px-4">
                    <span className="px-2 py-0.5 rounded-md text-[10px] uppercase font-semibold bg-zinc-100 text-zinc-700 border border-zinc-200">
                      {msg.status}
                    </span>
                  </td>
                  <td className="py-2.5 px-4 text-right font-sans">
                    <div className="flex items-center justify-end gap-1 text-xs">
                      <button
                        onClick={() => handleInspect(msg.id)}
                        className="px-2 py-1 rounded-md text-zinc-700 hover:bg-zinc-100 font-medium cursor-pointer transition-colors"
                      >
                        Inspect
                      </button>
                      <button
                        onClick={() => handleRetry(msg.id)}
                        className="px-2 py-1 rounded-md text-emerald-600 hover:bg-emerald-50 font-medium cursor-pointer transition-colors"
                      >
                        Retry
                      </button>
                      <button
                        onClick={() => (msg.status === "hold" ? handleRelease(msg.id) : handleHold(msg.id))}
                        className="px-2 py-1 rounded-md text-zinc-700 hover:bg-zinc-100 font-medium cursor-pointer transition-colors"
                      >
                        {msg.status === "hold" ? "Release" : "Hold"}
                      </button>
                      <button
                        onClick={() => handleDelete(msg.id)}
                        className="px-2 py-1 rounded-md text-red-600 hover:bg-red-50 font-medium cursor-pointer transition-colors"
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

        {/* Pagination Footer */}
        {messages.length > 0 && (
          <div className="px-4 py-2.5 bg-zinc-50/60 border-t border-zinc-200 flex items-center justify-between text-xs text-zinc-500 font-mono">
            <div>
              Showing <span className="font-semibold text-zinc-900">{startIdx}</span> to{" "}
              <span className="font-semibold text-zinc-900">{endIdx}</span> of{" "}
              <span className="font-semibold text-zinc-900">{messages.length}</span> messages
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

      {/* Inspect Modal */}
      {inspectingId && (
        <div className="fixed inset-0 z-50 bg-zinc-950/20 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-zinc-200 max-w-2xl w-full p-6 shadow-2xl max-h-[85vh] flex flex-col justify-between space-y-4">
            <div>
              <div className="flex justify-between items-center pb-3 border-b border-zinc-100 mb-3">
                <h3 className="font-semibold text-zinc-950 text-sm font-mono">Queue Message ID: {inspectingId}</h3>
                <button onClick={() => setInspectingId(null)} className="text-zinc-400 hover:text-zinc-600 cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <pre className="p-4 bg-zinc-950 text-zinc-100 rounded-xl font-mono text-xs max-h-[50vh] overflow-y-auto whitespace-pre-wrap">
                {loadingInspect ? "Reading queue envelope..." : inspectContent}
              </pre>
            </div>
            <div className="pt-3 border-t border-zinc-100 flex justify-end">
              <button
                onClick={() => setInspectingId(null)}
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
