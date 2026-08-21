"use client";

import React, { useEffect, useState } from "react";
import {
  Activity,
  Cpu,
  HardDrive,
  RefreshCw,
  Server,
  Zap,
  Clock,
  TrendingUp,
} from "lucide-react";

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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">System Telemetry & Metrics</h1>
          <p className="text-sm text-slate-500">Prometheus scrapers, cluster load, and message throughput</p>
        </div>
        <button
          onClick={loadMetrics}
          className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 shadow-2xs transition-colors cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Refresh Metrics</span>
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">SMTP Latency</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono">1.2 ms</div>
          <p className="text-xs text-slate-400 mt-1">p99 Inbound Pipeline</p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Goroutines</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono">34</div>
          <p className="text-xs text-emerald-600 font-medium mt-1">Bounded Lifecycle</p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Database Conns</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <Server className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono">6 / 50</div>
          <p className="text-xs text-slate-400 mt-1">PostgreSQL Max 50 Pool</p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Memory Alloc</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Cpu className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono">18.4 MB</div>
          <p className="text-xs text-slate-400 mt-1">Go Runtime Heap</p>
        </div>
      </div>

      {/* Prometheus Raw Stream */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-2xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-slate-500" />
            <h3 className="font-bold text-slate-900 text-sm">Prometheus Metrics Stream (/metrics)</h3>
          </div>
          <span className="text-xs text-slate-400 font-mono">OpenMetrics 1.0 Format</span>
        </div>

        <div className="p-4 bg-slate-900 text-slate-100 overflow-x-auto max-h-[50vh] font-mono text-xs whitespace-pre-wrap">
          {metricsText || "Loading Prometheus registry..."}
        </div>
      </div>
    </div>
  );
}
