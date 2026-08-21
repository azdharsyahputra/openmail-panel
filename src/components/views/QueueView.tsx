"use client";

import React, { useEffect, useState } from "react";
import { api, QueueSummary, QueueMessage } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { RefreshCw, Send, X, ChevronLeft, ChevronRight } from "lucide-react";

export function QueueView() {
  const toast = useToast();
  const [summary, setSummary] = useState<QueueSummary | null>(null);
  const [messages, setMessages] = useState<QueueMessage[]>([]);
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination State
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Modals State
  const [showFlushModal, setShowFlushModal] = useState(false);
  const [flushing, setFlushing] = useState(false);

  const [messageToDelete, setMessageToDelete] = useState<string | null>(null);
  const [deletingMsg, setDeletingMsg] = useState(false);

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
      const msg = err instanceof Error ? err.message : "Failed to load mail queue";
      setError(msg);
      toast.error("Queue Error", msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
    loadData();
  }, [activeFilter]);

  const confirmFlushQueue = async () => {
    try {
      setFlushing(true);
      await api.flushQueue();
      toast.success("Queue Flushed", "Triggered immediate delivery attempt for all queued mail.");
      setShowFlushModal(false);
      await loadData();
    } catch (err: unknown) {
      toast.error("Flush Failed", err instanceof Error ? err.message : "Failed to flush queue");
    } finally {
      setFlushing(false);
    }
  };

  const handleRetry = async (id: string) => {
    try {
      await api.retryQueueMessage(id);
      toast.success("Message Retrying", `Message ${id} scheduled for immediate retry.`);
      await loadData();
    } catch (err: unknown) {
      toast.error("Retry Failed", err instanceof Error ? err.message : "Failed to retry message");
    }
  };

  const handleHold = async (id: string) => {
    try {
      await api.holdQueueMessage(id);
      toast.warning("Message Held", `Message ${id} placed on administrative hold.`);
      await loadData();
    } catch (err: unknown) {
      toast.error("Hold Failed", err instanceof Error ? err.message : "Failed to hold message");
    }
  };

  const handleRelease = async (id: string) => {
    try {
      await api.releaseQueueMessage(id);
      toast.success("Message Released", `Message ${id} released from hold back to active queue.`);
      await loadData();
    } catch (err: unknown) {
      toast.error("Release Failed", err instanceof Error ? err.message : "Failed to release message");
    }
  };

  const confirmDeleteMessage = async () => {
    if (!messageToDelete) return;
    try {
      setDeletingMsg(true);
      await api.deleteQueueMessage(messageToDelete);
      toast.success("Message Purged", `Message ${messageToDelete} deleted from Postfix queue.`);
      setMessageToDelete(null);
      await loadData();
    } catch (err: unknown) {
      toast.error("Delete Failed", err instanceof Error ? err.message : "Failed to delete message");
    } finally {
      setDeletingMsg(false);
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

  const formatSize = (bytes?: number) => {
    if (bytes === undefined || bytes === null || isNaN(bytes)) return "0 B";
    if (bytes < 1024) return `${bytes} B`;
    return `${(bytes / 1024).toFixed(1)} KB`;
  };

  // Pagination Calculations
  const totalPages = Math.ceil(messages.length / pageSize) || 1;
  const paginatedMessages = messages.slice((page - 1) * pageSize, page * pageSize);
  const startIdx = messages.length > 0 ? (page - 1) * pageSize + 1 : 0;
  const endIdx = Math.min(page * pageSize, messages.length);

  const getFilterCount = (filterName: string) => {
    if (!summary) return 0;
    if (filterName === "all") return summary.total || 0;
    if (filterName === "active") return summary.active || 0;
    if (filterName === "deferred") return summary.deferred || 0;
    if (filterName === "hold") return summary.hold || 0;
    if (filterName === "corrupt") return summary.corrupt || 0;
    return 0;
  };

  return (
    <div className="h-full flex flex-col space-y-4 max-w-6xl mx-auto min-h-0">
      {/* Crisp, Direct Header Bar */}
      <div className="shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200/80 pb-3">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-xl font-semibold text-zinc-950 tracking-tight">Mail Transport Queue</h1>
            <p className="text-xs text-zinc-500 mt-0.5">
              Monitor and manage Postfix active, deferred, and hold message spools
            </p>
          </div>
          <div className="hidden sm:flex items-center gap-2 shrink-0 font-mono text-xs">
            <span className="px-2.5 py-0.5 rounded-full font-medium bg-zinc-100 text-zinc-800 border border-zinc-200">
              {summary?.total || 0} Total
            </span>
            {(summary?.deferred || 0) > 0 && (
              <span className="px-2.5 py-0.5 rounded-full font-medium bg-amber-50 text-amber-800 border border-amber-200">
                {summary?.deferred} Deferred
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white hover:bg-zinc-50 border border-zinc-200/80 rounded-lg text-zinc-700 shadow-2xs transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-zinc-400" : "text-zinc-500"}`} />
            <span>Refresh</span>
          </button>
          <button
            onClick={() => setShowFlushModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium bg-zinc-950 hover:bg-zinc-800 text-white rounded-lg shadow-xs transition-all cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Flush Queue</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="shrink-0 p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-mono rounded-xl">
          {error}
        </div>
      )}

      {/* Main Table Container with Integrated Filter Header */}
      <div className="flex-1 min-h-0 rounded-2xl border border-zinc-200/80 bg-white overflow-hidden shadow-2xs flex flex-col justify-between">
        {/* Integrated Category Filter Bar */}
        <div className="shrink-0 px-4 py-3 bg-zinc-50/80 border-b border-zinc-200 flex items-center gap-1.5 text-xs font-mono">
          {["all", "active", "deferred", "hold", "corrupt"].map((f) => {
            const count = getFilterCount(f);
            return (
              <button
                key={f}
                onClick={() => setActiveFilter(f)}
                className={`px-3 py-1 rounded-lg uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeFilter === f
                    ? "bg-zinc-950 text-white font-semibold shadow-xs"
                    : "text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100"
                }`}
              >
                <span>{f}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    activeFilter === f
                      ? "bg-zinc-800 text-zinc-200"
                      : "bg-zinc-200/80 text-zinc-700"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Messages Table */}
        <div className="flex-1 overflow-y-auto min-h-0">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-zinc-50/80 border-b border-zinc-200 text-zinc-500 uppercase text-[10px] sticky top-0 z-10 backdrop-blur-xs">
              <tr>
                <th className="py-3.5 px-4 w-36 text-center">Queue ID</th>
                <th className="py-3.5 px-4 text-left">Sender</th>
                <th className="py-3.5 px-4 text-left">Recipient</th>
                <th className="py-3.5 px-4 w-28 text-center">Size</th>
                <th className="py-3.5 px-4 w-32 text-center">Status</th>
                <th className="py-3.5 px-6 w-72 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {messages.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-zinc-400 font-sans text-xs">
                    No messages queued in &quot;{activeFilter}&quot; category.
                  </td>
                </tr>
              ) : (
                paginatedMessages.map((msg) => {
                  const qId = msg.queue_id || msg.id || "";
                  const st = (msg.status || "active").toLowerCase();
                  const statusClass =
                    st === "active"
                      ? "bg-emerald-500/10 text-emerald-700 border-emerald-500/20"
                      : st === "deferred"
                      ? "bg-amber-500/10 text-amber-800 border-amber-500/20"
                      : st === "corrupt" || st === "bounce"
                      ? "bg-red-500/10 text-red-700 border-red-500/20"
                      : "bg-zinc-100 text-zinc-700 border-zinc-200";

                  return (
                    <tr key={qId} className="hover:bg-zinc-50/50 transition-colors">
                      <td className="py-2.5 px-4 font-bold text-zinc-950 text-center">{qId}</td>
                      <td className="py-2.5 px-4 text-zinc-700 truncate max-w-44 text-left">{msg.sender || "<empty>"}</td>
                      <td className="py-2.5 px-4 text-zinc-700 truncate max-w-44 text-left">{msg.recipient}</td>
                      <td className="py-2.5 px-4 text-center text-zinc-500">{formatSize(msg.size || msg.size_bytes)}</td>
                      <td className="py-2.5 px-4 text-center">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] uppercase font-semibold border ${statusClass}`}>
                          {msg.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-6 text-center">
                        <div className="flex items-center justify-center gap-1.5 text-xs font-sans">
                          <button
                            onClick={() => handleInspect(qId)}
                            className="px-2.5 py-1 text-[11px] font-medium bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 rounded-md text-zinc-800 shadow-2xs hover:border-zinc-300 transition-all cursor-pointer"
                          >
                            Inspect
                          </button>
                          <button
                            onClick={() => handleRetry(qId)}
                            className="px-2.5 py-1 text-[11px] font-medium bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 rounded-md text-zinc-800 shadow-2xs hover:border-zinc-300 transition-all cursor-pointer"
                          >
                            Retry
                          </button>
                          <button
                            onClick={() => (msg.status === "hold" ? handleRelease(qId) : handleHold(qId))}
                            className="px-2.5 py-1 text-[11px] font-medium bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 rounded-md text-zinc-800 shadow-2xs hover:border-zinc-300 transition-all cursor-pointer"
                          >
                            {msg.status === "hold" ? "Release" : "Hold"}
                          </button>
                          <button
                            onClick={() => setMessageToDelete(qId)}
                            className="px-2.5 py-1 text-[11px] font-medium bg-zinc-50 hover:bg-red-50 hover:text-red-700 hover:border-red-200 border border-zinc-200 rounded-md text-zinc-800 shadow-2xs transition-all cursor-pointer"
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

        {/* Pagination Footer */}
        {messages.length > 0 && (
          <div className="shrink-0 px-4 py-2.5 bg-zinc-50/80 border-t border-zinc-200 flex items-center justify-between text-xs text-zinc-500 font-mono">
            <div className="flex items-center gap-3">
              <span>
                Showing <span className="font-semibold text-zinc-900">{startIdx}</span> to{" "}
                <span className="font-semibold text-zinc-900">{endIdx}</span> of{" "}
                <span className="font-semibold text-zinc-900">{messages.length}</span> messages
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

      {/* Flush Queue Modal */}
      <ConfirmModal
        isOpen={showFlushModal}
        title="Flush Transport Queue"
        message="Are you sure you want to flush the mail queue? Postfix will immediately attempt delivery for all active and deferred messages."
        confirmLabel="Flush Queue"
        variant="default"
        loading={flushing}
        onConfirm={confirmFlushQueue}
        onCancel={() => setShowFlushModal(false)}
      />

      {/* Delete Message Modal */}
      <ConfirmModal
        isOpen={Boolean(messageToDelete)}
        title="Delete Queued Message"
        message={`Are you sure you want to purge message "${messageToDelete}" from the spool queue? This action cannot be undone.`}
        confirmLabel="Purge Message"
        variant="danger"
        loading={deletingMsg}
        onConfirm={confirmDeleteMessage}
        onCancel={() => setMessageToDelete(null)}
      />

      {/* Message Content Inspector Modal */}
      {inspectingId && (
        <div className="fixed inset-0 z-50 bg-zinc-950/20 backdrop-blur-xs flex items-center justify-center p-4 select-none">
          <div className="bg-white rounded-2xl border border-zinc-200 max-w-2xl w-full p-6 shadow-xl space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex justify-between items-center pb-2 border-b border-zinc-100 shrink-0">
              <div>
                <h3 className="font-semibold text-zinc-950 text-sm font-mono">Message Inspection</h3>
                <p className="text-xs text-zinc-500 font-mono">Queue ID: {inspectingId}</p>
              </div>
              <button onClick={() => setInspectingId(null)} className="text-zinc-400 hover:text-zinc-600 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto bg-zinc-950 text-zinc-100 p-4 rounded-xl font-mono text-xs leading-relaxed whitespace-pre-wrap select-text">
              {loadingInspect ? "Fetching message raw headers and body..." : inspectContent}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
