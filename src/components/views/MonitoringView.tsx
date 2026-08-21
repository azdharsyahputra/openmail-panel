"use client";

import React, { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";

export function MonitoringView() {
  const [metricsText, setMetricsText] = useState<string>("");
  const [loading, setLoading] = useState(true);

  const loadMetrics = async () => {
    try {
      setLoading(true);
      const res = await fetch("/metrics");
      if (res.ok) {
        const text = await res.text();
        setMetricsText(text);
      }
    } catch {
      setMetricsText("# Metrics endpoint connecting to backend...");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMetrics();
  }, []);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200/80 pb-4">
        <div>
          <h1 className="text-xl font-semibold text-zinc-950 tracking-tight">System Telemetry & Metrics</h1>
          <p className="text-xs text-zinc-500 mt-0.5">Prometheus scrapers, cluster load, and message throughput</p>
        </div>
        <button
          onClick={loadMetrics}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white hover:bg-zinc-50 border border-zinc-200/80 rounded-lg text-zinc-700 shadow-2xs transition-all cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-zinc-400" : "text-zinc-500"}`} />
          <span>{loading ? "Scraping..." : "Scrape Metrics"}</span>
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 font-mono text-xs text-center">
        <div className="p-4 bg-white border border-zinc-200/80 rounded-xl shadow-2xs">
          <div className="text-[10px] text-zinc-400 uppercase tracking-wider">SMTP p99 Latency</div>
          <div className="text-2xl font-bold text-zinc-950 mt-1">1.2 ms</div>
        </div>
        <div className="p-4 bg-white border border-zinc-200/80 rounded-xl shadow-2xs">
          <div className="text-[10px] text-zinc-400 uppercase tracking-wider">Goroutines</div>
          <div className="text-2xl font-bold text-zinc-950 mt-1">34</div>
        </div>
        <div className="p-4 bg-white border border-zinc-200/80 rounded-xl shadow-2xs">
          <div className="text-[10px] text-zinc-400 uppercase tracking-wider">DB Pool (Max 50)</div>
          <div className="text-2xl font-bold text-zinc-950 mt-1">6 / 50</div>
        </div>
        <div className="p-4 bg-white border border-zinc-200/80 rounded-xl shadow-2xs">
          <div className="text-[10px] text-zinc-400 uppercase tracking-wider">Runtime Heap</div>
          <div className="text-2xl font-bold text-zinc-950 mt-1">18.4 MB</div>
        </div>
      </div>

      {/* Prometheus Raw Stream */}
      <div className="rounded-xl border border-zinc-200/80 bg-white overflow-hidden shadow-2xs">
        <div className="px-4 py-3 bg-zinc-50/70 border-b border-zinc-200 text-xs font-mono font-semibold text-zinc-800 uppercase tracking-wider">
          Prometheus Metrics Stream (/metrics)
        </div>
        <pre className="p-5 bg-zinc-950 text-zinc-100 font-mono text-xs max-h-[55vh] overflow-y-auto whitespace-pre-wrap leading-relaxed">
          {metricsText || "Loading Prometheus registry..."}
        </pre>
      </div>
    </div>
  );
}
