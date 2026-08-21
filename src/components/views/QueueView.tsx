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

  return (
    <div className="h-full flex flex-col space-y-4 max-w-6xl mx-auto">
      {/* Header - Fixed top */}
      <div className="shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200/80 pb-3">
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
            onClick={() => setShowFlushModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium bg-amber-600 hover:bg-amber-700 text-white rounded-lg shadow-xs transition-all cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Flush Queue</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="shrink-0 p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-mono rounded-lg">
          {error}
        </div>
      )}

      {/* Summary Row - Fixed */}
      <div className="shrink-0 grid grid-cols-2 sm:grid-cols-5 gap-3 font-mono text-xs text-center">
        <div className="p-3 bg-white rounded-xl border border-zinc-200/80 shadow-2xs">
          <div className="text-[10px] text-zinc-400 uppercase tracking-wider">Total</div>
          <div className="text-xl font-bold text-zinc-950 mt-0.5">{summary?.total || 0}</div>
        </div>
        <div className="p-3 bg-white rounded-xl border border-zinc-200/80 shadow-2xs">
          <div className="text-[10px] text-emerald-600 uppercase tracking-wider">Active</div>
          <div className="text-xl font-bold text-emerald-600 mt-0.5">{summary?.active || 0}</div>
        </div>
        <div className="p-3 bg-white rounded-xl border border-zinc-200/80 shadow-2xs">
          <div className="text-[10px] text-amber-600 uppercase tracking-wider">Deferred</div>
          <div className="text-xl font-bold text-amber-600 mt-0.5">{summary?.deferred || 0}</div>
        </div>
        <div className="p-3 bg-white rounded-xl border border-zinc-200/80 shadow-2xs">
          <div className="text-[10px] text-blue-600 uppercase tracking-wider">Hold</div>
          <div className="text-xl font-bold text-blue-600 mt-0.5">{summary?.hold || 0}</div>
        </div>
        <div className="p-3 bg-white rounded-xl border border-zinc-200/80 shadow-2xs">
          <div className="text-[10px] text-red-600 uppercase tracking-wider">Corrupt</div>
          <div className="text-xl font-bold text-red-600 mt-0.5">{summary?.corrupt || 0}</div>
        </div>
      </div>

      {/* Filter Tabs - Fixed */}
      <div className="shrink-0 flex gap-1.5 border-b border-zinc-200/80 pb-2 text-xs font-mono">
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

      {/* Messages Table - Fills height */}
      <div className="flex-1 min-h-0 rounded-xl border border-zinc-200/80 bg-white overflow-hidden shadow-2xs flex flex-col justify-between">
        <div className="flex-1 overflow-y-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-zinc-50/80 border-b border-zinc-200 text-zinc-500 uppercase text-[10px] sticky top-0 z-10 backdrop-blur-xs">
              <tr>
                <th className="py-3 px-4 w-32">Queue ID</th>
                <th className="py-3 px-4">Sender</th>
                <th className="py-3 px-4">Recipient</th>
                <th className="py-3 px-4 w-24 text-center">Size</th>
                <th className="py-3 px-4 w-28 text-center">Status</th>
                <th className="py-3 px-4 text-right w-64">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {messages.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-zinc-400 font-sans text-xs">
                    No messages queued in this category.
                  </td>
                </tr>
              ) : (
                paginatedMessages.map((msg) => {
                  const qId = msg.queue_id || msg.id || "";
                  return (
                    <tr key={qId} className="hover:bg-zinc-50/50 transition-colors">
                      <td className="py-2.5 px-4 font-bold text-zinc-950">{qId}</td>
                      <td className="py-2.5 px-4 text-zinc-700 truncate max-w-44">{msg.sender || "<empty>"}</td>
                      <td className="py-2.5 px-4 text-zinc-700 truncate max-w-44">{msg.recipient}</td>
                      <td className="py-2.5 px-4 text-center text-zinc-500">{formatSize(msg.size || msg.size_bytes)}</td>
                      <td className="py-2.5 px-4 text-center">
                        <span className="px-2 py-0.5 rounded-md text-[10px] uppercase font-semibold bg-zinc-100 text-zinc-700 border border-zinc-200">
                          {msg.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5 text-xs font-sans">
                          <button
                            onClick={() => handleInspect(qId)}
                            className="px-2.5 py-1 text-[11px] font-medium bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 rounded-md text-zinc-800 shadow-2xs hover:border-zinc-300 transition-all cursor-pointer"
                          >
                            Inspect
                          </button>
                          <button
                            onClick={() => handleRetry(qId)}
                            className="px-2.5 py-1 text-[11px] font-medium bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/80 rounded-md text-emerald-700 shadow-2xs hover:border-emerald-300 transition-all cursor-pointer"
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
                            className="px-2.5 py-1 text-[11px] font-medium bg-red-50 hover:bg-red-100 border border-red-200/80 rounded-md text-red-700 shadow-2xs hover:border-red-300 transition-all cursor-pointer"
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

      {/* Inspect Modal */}
      {inspectingId && (
        <div className="fixed inset-0 z-50 bg-zinc-950/20 backdrop-blur-xs flex items-center justify-center p-4 select-none">
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

      {/* Flush Queue Modal */}
      <ConfirmModal
        isOpen={showFlushModal}
        title="Flush Mail Queue"
        message="Are you sure you want to trigger an immediate delivery attempt for all deferred and active messages currently in the Postfix queue?"
        confirmLabel="Flush Queue"
        variant="warning"
        loading={flushing}
        onConfirm={confirmFlushQueue}
        onCancel={() => setShowFlushModal(false)}
      />

      {/* Delete Queue Message Modal */}
      <ConfirmModal
        isOpen={Boolean(messageToDelete)}
        title="Delete Queued Message"
        message={`Are you sure you want to permanently delete message "${messageToDelete}" from the Postfix transport queue?`}
        confirmLabel="Delete Message"
        variant="danger"
        loading={deletingMsg}
        onConfirm={confirmDeleteMessage}
        onCancel={() => setMessageToDelete(null)}
      />
    </div>
  );
}
