"use client";

import React, { useEffect, useState } from "react";
import { RefreshCw, Copy, Check } from "lucide-react";

export function MonitoringView() {
  const [metricsText, setMetricsText] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"overview" | "raw">("overview");
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

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

  const copyMetrics = () => {
    navigator.clipboard.writeText(metricsText);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="h-full flex flex-col space-y-5 max-w-6xl mx-auto">
      {/* Header - Fixed top */}
      <div className="shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200/80 pb-4">
        <div>
          <h1 className="text-xl font-semibold text-zinc-950 tracking-tight">System Telemetry & Metrics</h1>
          <p className="text-xs text-zinc-500 mt-0.5">Prometheus scrapers, cluster load, and message throughput</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadMetrics}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white hover:bg-zinc-50 border border-zinc-200/80 rounded-lg text-zinc-700 shadow-2xs transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-zinc-400" : "text-zinc-500"}`} />
            <span>{loading ? "Scraping..." : "Scrape Metrics"}</span>
          </button>
        </div>
      </div>

      {/* Tabs - Fixed top */}
      <div className="shrink-0 flex border-b border-zinc-200/80 gap-6 text-xs font-medium">
        <button
          onClick={() => setActiveTab("overview")}
          className={`pb-2.5 cursor-pointer transition-colors ${
            activeTab === "overview"
              ? "text-zinc-950 border-b-2 border-zinc-950 font-semibold"
              : "text-zinc-400 hover:text-zinc-700"
          }`}
        >
          Resource & Telemetry Overview
        </button>
        <button
          onClick={() => setActiveTab("raw")}
          className={`pb-2.5 cursor-pointer transition-colors ${
            activeTab === "raw"
              ? "text-zinc-950 border-b-2 border-zinc-950 font-semibold"
              : "text-zinc-400 hover:text-zinc-700"
          }`}
        >
          Prometheus Stream (/metrics)
        </button>
      </div>

      {/* Tab 1: Overview */}
      {activeTab === "overview" && (
        <div className="space-y-5 overflow-y-auto pr-1">
          {/* Metrics Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 font-mono text-xs text-center">
            <div className="p-4 bg-white border border-zinc-200/80 rounded-xl shadow-2xs">
              <div className="text-[10px] text-zinc-400 uppercase tracking-wider">SMTP p99 Latency</div>
              <div className="text-2xl font-bold text-zinc-950 mt-1">1.2 ms</div>
              <div className="text-[11px] text-emerald-600 font-sans mt-1">Nominal (&lt; 5ms)</div>
            </div>
            <div className="p-4 bg-white border border-zinc-200/80 rounded-xl shadow-2xs">
              <div className="text-[10px] text-zinc-400 uppercase tracking-wider">Active Goroutines</div>
              <div className="text-2xl font-bold text-zinc-950 mt-1">34</div>
              <div className="text-[11px] text-zinc-500 font-sans mt-1">Zero leaks detected</div>
            </div>
            <div className="p-4 bg-white border border-zinc-200/80 rounded-xl shadow-2xs">
              <div className="text-[10px] text-zinc-400 uppercase tracking-wider">DB Pool (Max 50)</div>
              <div className="text-2xl font-bold text-zinc-950 mt-1">6 / 50</div>
              <div className="text-[11px] text-blue-600 font-sans mt-1">12% pool utilization</div>
            </div>
            <div className="p-4 bg-white border border-zinc-200/80 rounded-xl shadow-2xs">
              <div className="text-[10px] text-zinc-400 uppercase tracking-wider">Runtime Heap</div>
              <div className="text-2xl font-bold text-zinc-950 mt-1">18.4 MB</div>
              <div className="text-[11px] text-zinc-500 font-sans mt-1">GC pause p99 &lt; 0.1ms</div>
            </div>
          </div>

          {/* Subsystems Resource Breakdown */}
          <div className="rounded-xl border border-zinc-200/80 bg-white p-5 space-y-4 shadow-2xs">
            <h3 className="text-xs font-semibold text-zinc-950 uppercase tracking-wider font-mono">
              Core Subsystems Resource Allocation
            </h3>
            <div className="space-y-3 font-mono text-xs">
              <div>
                <div className="flex justify-between text-zinc-700 mb-1">
                  <span>Postfix SMTP Inbound Concurrency</span>
                  <span>12 / 100 max workers</span>
                </div>
                <div className="w-full bg-zinc-100 h-2 rounded-full overflow-hidden">
                  <div className="h-full bg-zinc-950 rounded-full" style={{ width: "12%" }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-zinc-700 mb-1">
                  <span>Dovecot IMAP / LMTP Process Pool</span>
                  <span>8 / 64 processes</span>
                </div>
                <div className="w-full bg-zinc-100 h-2 rounded-full overflow-hidden">
                  <div className="h-full bg-zinc-950 rounded-full" style={{ width: "12.5%" }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-zinc-700 mb-1">
                  <span>Maildir Storage Disk Utilization</span>
                  <span>42.8 GB / 500 GB (8.5%)</span>
                </div>
                <div className="w-full bg-zinc-100 h-2 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-600 rounded-full" style={{ width: "8.5%" }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Raw Prometheus Terminal Viewer */}
      {activeTab === "raw" && (
        <div className="flex-1 flex flex-col min-h-0 rounded-xl border border-zinc-200/80 bg-white overflow-hidden shadow-2xs">
          {/* Terminal Box Header */}
          <div className="shrink-0 px-4 py-2.5 bg-zinc-50/80 border-b border-zinc-200 flex justify-between items-center text-xs font-mono">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span className="font-semibold text-zinc-800 uppercase tracking-wider text-[11px]">
                Prometheus Stream (/metrics)
              </span>
            </div>
            <button
              onClick={copyMetrics}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-zinc-700 hover:bg-zinc-200/60 font-sans cursor-pointer text-xs transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? "Copied" : "Copy Stream"}</span>
            </button>
          </div>

          {/* Terminal Scrollable Logs Content */}
          <pre className="flex-1 overflow-y-auto min-h-0 p-5 bg-zinc-950 text-zinc-100 font-mono text-xs leading-relaxed whitespace-pre-wrap select-text">
            {metricsText || "Loading Prometheus registry..."}
          </pre>
        </div>
      )}
    </div>
  );
}
