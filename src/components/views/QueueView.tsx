"use client";

import React, { useEffect, useState } from "react";
import { api, QueueSummary, QueueMessage } from "@/lib/api";
import {
  Layers,
  RefreshCw,
  Send,
  Trash2,
  PauseCircle,
  PlayCircle,
  RotateCcw,
  Eye,
  AlertCircle,
  X,
  FileText,
} from "lucide-react";

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
    if (!confirm("Are you sure you want to flush all mail queues? Postfix will attempt immediate delivery for all deferred messages.")) {
      return;
    }
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
    if (!confirm(`Are you sure you want to remove queue message ${id}?`)) return;
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
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Mail Transport Queue</h1>
          <p className="text-sm text-slate-500">Monitor and manage Postfix active, deferred, and hold queues</p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={loadData}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 shadow-2xs transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>
          <button
            onClick={handleFlush}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-amber-600 hover:bg-amber-700 text-white shadow-sm shadow-amber-500/20 transition-all cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Flush Queue</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 font-mono">
        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-2xs text-center">
          <div className="text-xs text-slate-500 font-medium">Total Queue</div>
          <div className="text-xl font-bold text-slate-900 mt-1">{summary?.total || 0}</div>
        </div>
        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-2xs text-center">
          <div className="text-xs text-emerald-600 font-medium">Active</div>
          <div className="text-xl font-bold text-emerald-600 mt-1">{summary?.active || 0}</div>
        </div>
        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-2xs text-center">
          <div className="text-xs text-amber-600 font-medium">Deferred</div>
          <div className="text-xl font-bold text-amber-600 mt-1">{summary?.deferred || 0}</div>
        </div>
        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-2xs text-center">
          <div className="text-xs text-blue-600 font-medium">Hold</div>
          <div className="text-xl font-bold text-blue-600 mt-1">{summary?.hold || 0}</div>
        </div>
        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-2xs text-center">
          <div className="text-xs text-red-600 font-medium">Corrupt</div>
          <div className="text-xl font-bold text-red-600 mt-1">{summary?.corrupt || 0}</div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b border-slate-200 pb-2 text-xs font-semibold">
        {["all", "active", "deferred", "hold", "corrupt"].map((f) => (
          <button
            key={f}
            onClick={() => setActiveFilter(f)}
            className={`px-3 py-1.5 rounded-lg uppercase tracking-wider transition-colors cursor-pointer ${
              activeFilter === f
                ? "bg-blue-50 text-blue-700 font-bold"
                : "text-slate-500 hover:text-slate-800 hover:bg-slate-100"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Messages Table */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider font-mono">
              <tr>
                <th className="py-3 px-4">Queue ID</th>
                <th className="py-3 px-4">Sender</th>
                <th className="py-3 px-4">Recipient</th>
                <th className="py-3 px-4">Size</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-xs">
              {messages.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400 font-sans">
                    No messages currently queued in this category.
                  </td>
                </tr>
              ) : (
                messages.map((msg) => (
                  <tr key={msg.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900">{msg.id}</td>
                    <td className="py-3.5 px-4 text-slate-700 truncate max-w-40">{msg.sender || "<empty>"}</td>
                    <td className="py-3.5 px-4 text-slate-700 truncate max-w-40">{msg.recipient}</td>
                    <td className="py-3.5 px-4 text-slate-500">{(msg.size_bytes / 1024).toFixed(1)} KB</td>
                    <td className="py-3.5 px-4 font-sans">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                          msg.status === "active"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : msg.status === "deferred"
                            ? "bg-amber-50 text-amber-700 border border-amber-200"
                            : msg.status === "hold"
                            ? "bg-blue-50 text-blue-700 border border-blue-200"
                            : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {msg.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-sans">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleInspect(msg.id)}
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                          title="Inspect Envelope & Content"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleRetry(msg.id)}
                          className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                          title="Retry Delivery"
                        >
                          <RotateCcw className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => (msg.status === "hold" ? handleRelease(msg.id) : handleHold(msg.id))}
                          className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                          title={msg.status === "hold" ? "Release" : "Hold"}
                        >
                          {msg.status === "hold" ? <PlayCircle className="w-4 h-4" /> : <PauseCircle className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => handleDelete(msg.id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                          title="Delete from Queue"
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

      {/* Inspect Message Modal */}
      {inspectingId && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full p-6 max-h-[85vh] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  <h3 className="font-bold text-slate-900 text-base">Inspect Queue ID: {inspectingId}</h3>
                </div>
                <button onClick={() => setInspectingId(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-4 bg-slate-900 text-slate-100 rounded-xl overflow-y-auto max-h-[50vh] font-mono text-xs whitespace-pre-wrap">
                {loadingInspect ? "Reading queue envelope from disk..." : inspectContent}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setInspectingId(null)}
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
