"use client";

import React, { useEffect, useState } from "react";

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
      setMetricsText("# Metrics endpoint offline or connecting to backend...");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMetrics();
  }, []);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
        <div>
          <h1 className="text-base font-bold text-slate-900">System Telemetry & Metrics</h1>
          <p className="text-xs text-slate-500">Prometheus scrapers, cluster load, and message throughput</p>
        </div>
        <button
          onClick={loadMetrics}
          disabled={loading}
          className="px-3 py-1 text-xs font-medium bg-white hover:bg-slate-50 border border-slate-300 rounded text-slate-700 cursor-pointer"
        >
          {loading ? "Scraping..." : "Scrape Metrics"}
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-4 gap-3 font-mono text-xs text-center">
        <div className="p-3 bg-white border border-slate-200 rounded">
          <div className="text-[10px] text-slate-400 uppercase">SMTP p99 Latency</div>
          <div className="text-xl font-bold text-slate-900 mt-1">1.2 ms</div>
        </div>
        <div className="p-3 bg-white border border-slate-200 rounded">
          <div className="text-[10px] text-slate-400 uppercase">Goroutines</div>
          <div className="text-xl font-bold text-slate-900 mt-1">34</div>
        </div>
        <div className="p-3 bg-white border border-slate-200 rounded">
          <div className="text-[10px] text-slate-400 uppercase">DB Pool (Max 50)</div>
          <div className="text-xl font-bold text-slate-900 mt-1">6 / 50</div>
        </div>
        <div className="p-3 bg-white border border-slate-200 rounded">
          <div className="text-[10px] text-slate-400 uppercase">Runtime Heap</div>
          <div className="text-xl font-bold text-slate-900 mt-1">18.4 MB</div>
        </div>
      </div>

      {/* Prometheus Raw Stream */}
      <div className="bg-white border border-slate-200 rounded overflow-hidden">
        <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 text-xs font-mono font-bold text-slate-700 uppercase">
          Prometheus Metrics Stream (/metrics)
        </div>
        <pre className="p-4 bg-slate-900 text-slate-100 font-mono text-xs max-h-[55vh] overflow-y-auto whitespace-pre-wrap">
          {metricsText || "Loading Prometheus registry..."}
        </pre>
      </div>
    </div>
  );
}
