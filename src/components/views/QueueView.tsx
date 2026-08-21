"use client";

import React, { useEffect, useState } from "react";
import { api, QueueSummary, QueueMessage } from "@/lib/api";
import { RefreshCw, Send, X } from "lucide-react";

export function QueueView() {
  const [summary, setSummary] = useState<QueueSummary | null>(null);
  const [messages, setMessages] = useState<QueueMessage[]>([]);
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Mail Transport Queue</h1>
          <p className="text-xs text-slate-500 mt-0.5">Monitor and manage Postfix active, deferred, and hold queues</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white hover:bg-slate-50 border border-slate-200 rounded-full text-slate-700 shadow-2xs transition-all cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>
          <button
            onClick={handleFlush}
            className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium bg-amber-600 hover:bg-amber-700 text-white rounded-full shadow-xs transition-all cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Flush Queue</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 text-xs font-medium rounded-xl">
          {error}
        </div>
      )}

      {/* Summary Row */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 font-mono text-xs text-center">
        <div className="p-3.5 bg-[#f8fafd] rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="text-[10px] text-slate-400 uppercase tracking-wider">Total</div>
          <div className="text-xl font-bold text-slate-900 mt-0.5">{summary?.total || 0}</div>
        </div>
        <div className="p-3.5 bg-[#f8fafd] rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="text-[10px] text-emerald-600 uppercase tracking-wider">Active</div>
          <div className="text-xl font-bold text-emerald-600 mt-0.5">{summary?.active || 0}</div>
        </div>
        <div className="p-3.5 bg-[#f8fafd] rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="text-[10px] text-amber-600 uppercase tracking-wider">Deferred</div>
          <div className="text-xl font-bold text-amber-600 mt-0.5">{summary?.deferred || 0}</div>
        </div>
        <div className="p-3.5 bg-[#f8fafd] rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="text-[10px] text-blue-600 uppercase tracking-wider">Hold</div>
          <div className="text-xl font-bold text-blue-600 mt-0.5">{summary?.hold || 0}</div>
        </div>
        <div className="p-3.5 bg-[#f8fafd] rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="text-[10px] text-red-600 uppercase tracking-wider">Corrupt</div>
          <div className="text-xl font-bold text-red-600 mt-0.5">{summary?.corrupt || 0}</div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b border-slate-200 pb-2 text-xs font-mono">
        {["all", "active", "deferred", "hold", "corrupt"].map((f) => (
          <button
            key={f}
            onClick={() => setActiveFilter(f)}
            className={`px-3 py-1 rounded-full uppercase tracking-wider transition-all cursor-pointer ${
              activeFilter === f
                ? "bg-slate-900 text-white font-bold shadow-2xs"
                : "text-slate-500 hover:text-slate-800 hover:bg-slate-100"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Messages Table */}
      <div className="rounded-2xl border border-slate-200/80 overflow-hidden shadow-2xs">
        <table className="w-full text-left text-xs font-mono">
          <thead className="bg-[#f8fafd] border-b border-slate-200 text-slate-600 uppercase text-[10px]">
            <tr>
              <th className="py-3 px-5">Queue ID</th>
              <th className="py-3 px-5">Sender</th>
              <th className="py-3 px-5">Recipient</th>
              <th className="py-3 px-5">Size</th>
              <th className="py-3 px-5">Status</th>
              <th className="py-3 px-5 text-right font-sans">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {messages.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-10 text-center text-slate-400 font-sans">
                  No messages queued in this category.
                </td>
              </tr>
            ) : (
              messages.map((msg) => (
                <tr key={msg.id} className="hover:bg-[#f8fafd] transition-colors">
                  <td className="py-2.5 px-5 font-bold text-slate-900">{msg.id}</td>
                  <td className="py-2.5 px-5 text-slate-700 truncate max-w-40">{msg.sender || "<empty>"}</td>
                  <td className="py-2.5 px-5 text-slate-700 truncate max-w-40">{msg.recipient}</td>
                  <td className="py-2.5 px-5 text-slate-500">{(msg.size_bytes / 1024).toFixed(1)} KB</td>
                  <td className="py-2.5 px-5">
                    <span className="px-2 py-0.5 rounded-full text-[10px] uppercase font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                      {msg.status}
                    </span>
                  </td>
                  <td className="py-2.5 px-5 text-right font-sans">
                    <div className="flex items-center justify-end gap-2 text-xs">
                      <button
                        onClick={() => handleInspect(msg.id)}
                        className="text-blue-600 hover:text-blue-700 font-medium cursor-pointer"
                      >
                        Inspect
                      </button>
                      <span className="text-slate-300">·</span>
                      <button
                        onClick={() => handleRetry(msg.id)}
                        className="text-emerald-600 hover:text-emerald-700 font-medium cursor-pointer"
                      >
                        Retry
                      </button>
                      <span className="text-slate-300">·</span>
                      <button
                        onClick={() => (msg.status === "hold" ? handleRelease(msg.id) : handleHold(msg.id))}
                        className="text-slate-700 hover:text-slate-900 font-medium cursor-pointer"
                      >
                        {msg.status === "hold" ? "Release" : "Hold"}
                      </button>
                      <span className="text-slate-300">·</span>
                      <button
                        onClick={() => handleDelete(msg.id)}
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

      {/* Inspect Modal */}
      {inspectingId && (
        <div className="fixed inset-0 z-50 bg-slate-900/30 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-2xl w-full p-6 shadow-2xl max-h-[85vh] flex flex-col justify-between space-y-4">
            <div>
              <div className="flex justify-between items-center pb-3 border-b border-slate-200 mb-3">
                <h3 className="font-bold text-slate-900 text-sm font-mono">Queue Message ID: {inspectingId}</h3>
                <button onClick={() => setInspectingId(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <pre className="p-4 bg-slate-900 text-slate-100 rounded-2xl font-mono text-xs max-h-[50vh] overflow-y-auto whitespace-pre-wrap">
                {loadingInspect ? "Reading queue envelope..." : inspectContent}
              </pre>
            </div>
            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setInspectingId(null)}
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
