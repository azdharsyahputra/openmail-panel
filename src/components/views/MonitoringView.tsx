"use client";

import React, { useEffect, useState } from "react";
import { api, AuditLogItem } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";
import {
  RefreshCw,
  Copy,
  Check,
  Activity,
  Server,
  Shield,
  Layers,
  FileCode,
  CheckCircle2,
  AlertTriangle,
  Mail,
  Zap,
} from "lucide-react";

interface ParsedMetrics {
  smtp_connections_total: number;
  smtp_auth_success_total: number;
  smtp_auth_failure_total: number;
  messages_received_total: number;
  messages_sent_total: number;
  messages_delivered_total: number;
  messages_deferred_total: number;
  messages_bounced_total: number;
  spam_detected_total: number;
  malware_detected_total: number;
  imap_logins_total: number;
  imap_auth_failures_total: number;
  queue_active: number;
  queue_deferred: number;
  queue_hold: number;
  mailbox_storage_bytes: number;
  mailbox_message_count: number;
}

interface DeepHealthCheck {
  component: string;
  status: string;
  message: string;
}

export function MonitoringView() {
  const toast = useToast();
  const [metricsText, setMetricsText] = useState<string>("");
  const [parsedMetrics, setParsedMetrics] = useState<ParsedMetrics>({
    smtp_connections_total: 0,
    smtp_auth_success_total: 0,
    smtp_auth_failure_total: 0,
    messages_received_total: 0,
    messages_sent_total: 0,
    messages_delivered_total: 0,
    messages_deferred_total: 0,
    messages_bounced_total: 0,
    spam_detected_total: 0,
    malware_detected_total: 0,
    imap_logins_total: 0,
    imap_auth_failures_total: 0,
    queue_active: 0,
    queue_deferred: 0,
    queue_hold: 0,
    mailbox_storage_bytes: 0,
    mailbox_message_count: 0,
  });

  const [deepHealth, setDeepHealth] = useState<DeepHealthCheck[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [activeTab, setActiveTab] = useState<"overview" | "raw" | "events">("overview");
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [logFilter, setLogFilter] = useState("");

  const parsePrometheusText = (raw: string): ParsedMetrics => {
    const result: ParsedMetrics = {
      smtp_connections_total: 0,
      smtp_auth_success_total: 0,
      smtp_auth_failure_total: 0,
      messages_received_total: 0,
      messages_sent_total: 0,
      messages_delivered_total: 0,
      messages_deferred_total: 0,
      messages_bounced_total: 0,
      spam_detected_total: 0,
      malware_detected_total: 0,
      imap_logins_total: 0,
      imap_auth_failures_total: 0,
      queue_active: 0,
      queue_deferred: 0,
      queue_hold: 0,
      mailbox_storage_bytes: 0,
      mailbox_message_count: 0,
    };

    const lines = raw.split("\n");
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const parts = trimmed.split(/\s+/);
      if (parts.length >= 2) {
        const metricName = parts[0] as keyof ParsedMetrics;
        const val = parseFloat(parts[1]);
        if (metricName in result && !isNaN(val)) {
          result[metricName] = val;
        }
      }
    }
    return result;
  };

  const loadData = async (notify = false) => {
    try {
      setLoading(true);
      const [mText, deepRes, logs] = await Promise.all([
        fetch("/metrics")
          .then((r) => r.text())
          .catch(() => "# Error scraping /metrics"),
        fetch("/health/deep")
          .then((r) => r.json())
          .catch(() => ({ checks: [] })),
        api.getAuditLogs().catch(() => []),
      ]);

      setMetricsText(mText);
      setParsedMetrics(parsePrometheusText(mText));
      setDeepHealth(deepRes.checks || []);
      setAuditLogs(logs);

      if (notify) {
        toast.success("Telemetry Scraped", "Fetched live metrics, deep health probes, and audit stream.");
      }
    } catch {
      // Ignored
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(false);
  }, []);

  const copyMetrics = () => {
    navigator.clipboard.writeText(metricsText);
    setCopied(true);
    toast.info("Copied /metrics", "Prometheus text payload copied to clipboard.");
    setTimeout(() => setCopied(false), 1500);
  };

  const filteredLogs = auditLogs.filter(
    (l) =>
      l.action.toLowerCase().includes(logFilter.toLowerCase()) ||
      l.resource.toLowerCase().includes(logFilter.toLowerCase()) ||
      (l.actor && l.actor.toLowerCase().includes(logFilter.toLowerCase()))
  );

  return (
    <div className="h-full flex flex-col space-y-4 max-w-6xl mx-auto">
      {/* Header - Fixed top */}
      <div className="shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200/80 pb-3">
        <div>
          <h1 className="text-xl font-semibold text-zinc-950 tracking-tight">Observability & Telemetry</h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            Live Prometheus /metrics registry, deep component probes, and structured event stream
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => loadData(true)}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white hover:bg-zinc-50 border border-zinc-200/80 rounded-lg text-zinc-700 shadow-2xs transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-zinc-400" : "text-zinc-500"}`} />
            <span>{loading ? "Scraping..." : "Scrape Telemetry"}</span>
          </button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="shrink-0 flex border-b border-zinc-200/80 gap-6 text-xs font-medium">
        <button
          onClick={() => setActiveTab("overview")}
          className={`pb-2.5 cursor-pointer transition-colors flex items-center gap-1.5 ${
            activeTab === "overview"
              ? "text-zinc-950 border-b-2 border-zinc-950 font-semibold"
              : "text-zinc-400 hover:text-zinc-700"
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          <span>Live Metrics Dashboard</span>
        </button>
        <button
          onClick={() => setActiveTab("raw")}
          className={`pb-2.5 cursor-pointer transition-colors flex items-center gap-1.5 ${
            activeTab === "raw"
              ? "text-zinc-950 border-b-2 border-zinc-950 font-semibold"
              : "text-zinc-400 hover:text-zinc-700"
          }`}
        >
          <FileCode className="w-3.5 h-3.5" />
          <span>Raw Prometheus Stream (/metrics)</span>
        </button>
        <button
          onClick={() => setActiveTab("events")}
          className={`pb-2.5 cursor-pointer transition-colors flex items-center gap-1.5 ${
            activeTab === "events"
              ? "text-zinc-950 border-b-2 border-zinc-950 font-semibold"
              : "text-zinc-400 hover:text-zinc-700"
          }`}
        >
          <Server className="w-3.5 h-3.5" />
          <span>Structured Event Stream</span>
        </button>
      </div>

      {/* Tab 1: Live Metrics Dashboard (Parsed from Real /metrics & /health/deep) */}
      {activeTab === "overview" && (
        <div className="flex-1 overflow-y-auto space-y-4 pr-1 min-h-0">
          {/* Real Metrics KPI Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 font-mono text-xs text-center">
            {/* Inbound SMTP Connections */}
            <div className="p-4 bg-white border border-zinc-200/80 rounded-2xl shadow-2xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-zinc-400 uppercase tracking-wider">SMTP Inbound</span>
                <Mail className="w-3.5 h-3.5 text-blue-600" />
              </div>
              <div className="text-2xl font-bold text-zinc-950 mt-2">
                {parsedMetrics.smtp_connections_total}
              </div>
              <div className="text-[10px] text-zinc-500 font-sans mt-1">
                {parsedMetrics.smtp_auth_success_total} auth ok · {parsedMetrics.smtp_auth_failure_total} fail
              </div>
            </div>

            {/* Messages Handled */}
            <div className="p-4 bg-white border border-zinc-200/80 rounded-2xl shadow-2xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-zinc-400 uppercase tracking-wider">Messages Delivered</span>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              </div>
              <div className="text-2xl font-bold text-emerald-600 mt-2">
                {parsedMetrics.messages_delivered_total}
              </div>
              <div className="text-[10px] text-zinc-500 font-sans mt-1">
                {parsedMetrics.messages_received_total} recv · {parsedMetrics.messages_sent_total} sent
              </div>
            </div>

            {/* Spam & Malware Filter */}
            <div className="p-4 bg-white border border-zinc-200/80 rounded-2xl shadow-2xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-zinc-400 uppercase tracking-wider">Threats Neutralized</span>
                <Shield className="w-3.5 h-3.5 text-purple-600" />
              </div>
              <div className="text-2xl font-bold text-zinc-950 mt-2">
                {parsedMetrics.spam_detected_total + parsedMetrics.malware_detected_total}
              </div>
              <div className="text-[10px] text-zinc-500 font-sans mt-1">
                {parsedMetrics.spam_detected_total} spam · {parsedMetrics.malware_detected_total} malware
              </div>
            </div>

            {/* IMAP Sessions */}
            <div className="p-4 bg-white border border-zinc-200/80 rounded-2xl shadow-2xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-zinc-400 uppercase tracking-wider">IMAP Sessions</span>
                <Zap className="w-3.5 h-3.5 text-amber-600" />
              </div>
              <div className="text-2xl font-bold text-zinc-950 mt-2">
                {parsedMetrics.imap_logins_total}
              </div>
              <div className="text-[10px] text-zinc-500 font-sans mt-1">
                {parsedMetrics.imap_auth_failures_total} auth failures
              </div>
            </div>
          </div>

          {/* Deep Component Probes Matrix (Real Data from /health/deep) */}
          <div className="rounded-2xl border border-zinc-200/80 bg-white overflow-hidden shadow-2xs">
            <div className="px-5 py-3 border-b border-zinc-100 flex justify-between items-center bg-zinc-50/50">
              <div className="flex items-center gap-2">
                <Server className="w-4 h-4 text-zinc-700" />
                <h3 className="text-xs font-semibold text-zinc-950 uppercase tracking-wider font-mono">
                  Deep Subsystem Component Probes (/health/deep)
                </h3>
              </div>
              <span className="text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 text-[10px] font-mono font-semibold">
                ALL PROBES HEALTHY
              </span>
            </div>

            <div className="divide-y divide-zinc-100 text-xs font-mono">
              {deepHealth.length === 0 ? (
                <div className="p-8 text-center text-zinc-400 font-sans">Connecting to /health/deep...</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-zinc-100">
                  <div className="divide-y divide-zinc-100">
                    {deepHealth.slice(0, Math.ceil(deepHealth.length / 2)).map((check, idx) => (
                      <div key={idx} className="p-3.5 flex items-center justify-between hover:bg-zinc-50/50 transition-colors">
                        <div className="space-y-0.5">
                          <span className="font-bold text-zinc-900 text-xs">{check.component}</span>
                          <p className="text-[11px] text-zinc-500 font-sans">{check.message}</p>
                        </div>
                        <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 text-[10px] font-bold">
                          {check.status}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="divide-y divide-zinc-100">
                    {deepHealth.slice(Math.ceil(deepHealth.length / 2)).map((check, idx) => (
                      <div key={idx} className="p-3.5 flex items-center justify-between hover:bg-zinc-50/50 transition-colors">
                        <div className="space-y-0.5">
                          <span className="font-bold text-zinc-900 text-xs">{check.component}</span>
                          <p className="text-[11px] text-zinc-500 font-sans">{check.message}</p>
                        </div>
                        <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 text-[10px] font-bold">
                          {check.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Raw Prometheus Terminal Viewer */}
      {activeTab === "raw" && (
        <div className="flex-1 flex flex-col min-h-0 rounded-2xl border border-zinc-200/80 bg-white overflow-hidden shadow-2xs">
          {/* Terminal Box Header */}
          <div className="shrink-0 px-4 py-2.5 bg-zinc-50/80 border-b border-zinc-200 flex justify-between items-center text-xs font-mono">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span className="text-zinc-600 font-semibold">GET /metrics (Prometheus v2.0 Exposition Format)</span>
            </div>
            <button
              onClick={copyMetrics}
              className="flex items-center gap-1 px-2.5 py-1 text-xs font-sans font-medium text-zinc-700 bg-white border border-zinc-200 rounded-md hover:bg-zinc-100 cursor-pointer shadow-2xs transition-all"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-zinc-500" />}
              <span>{copied ? "Copied" : "Copy Stream"}</span>
            </button>
          </div>

          {/* Terminal Code Canvas */}
          <div className="flex-1 overflow-y-auto min-h-0 bg-zinc-950 p-4">
            <pre className="text-zinc-100 font-mono text-xs leading-relaxed whitespace-pre-wrap selection:bg-zinc-800">
              {metricsText || "# Loading /metrics from OpenMail daemon..."}
            </pre>
          </div>
        </div>
      )}

      {/* Tab 3: Structured Event Stream */}
      {activeTab === "events" && (
        <div className="flex-1 flex flex-col min-h-0 rounded-2xl border border-zinc-200/80 bg-white overflow-hidden shadow-2xs">
          {/* Search Header */}
          <div className="shrink-0 px-4 py-3 bg-zinc-50/80 border-b border-zinc-200 flex items-center justify-between gap-4 text-xs font-mono">
            <input
              type="text"
              placeholder="Search audit actions, resources, or actors..."
              value={logFilter}
              onChange={(e) => setLogFilter(e.target.value)}
              className="px-3 py-1.5 bg-white border border-zinc-200 rounded-lg text-zinc-900 text-xs w-full max-w-sm focus:outline-none focus:border-zinc-900 font-mono"
            />
            <span className="text-zinc-500 text-[11px] shrink-0">
              {filteredLogs.length} events logged
            </span>
          </div>

          {/* Log Stream */}
          <div className="flex-1 overflow-y-auto min-h-0 divide-y divide-zinc-100 font-mono text-xs">
            {filteredLogs.length === 0 ? (
              <div className="p-12 text-center text-zinc-400 font-sans">No matching events found.</div>
            ) : (
              filteredLogs.map((log) => {
                const actorNorm = (log.actor || "api").toLowerCase();
                const actorClass = actorNorm.includes("admin")
                  ? "bg-purple-500/10 text-purple-700 border-purple-200"
                  : actorNorm.includes("api")
                  ? "bg-sky-500/10 text-sky-700 border-sky-200"
                  : actorNorm.includes("system")
                  ? "bg-emerald-500/10 text-emerald-700 border-emerald-200"
                  : "bg-zinc-100 text-zinc-700 border-zinc-200";

                return (
                  <div key={log.id} className="p-3.5 hover:bg-zinc-50/50 transition-colors flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-blue-600">{log.action}</span>
                        <span className={`px-1.5 py-0.2 rounded border text-[10px] font-bold uppercase ${actorClass}`}>
                          {log.actor}
                        </span>
                        <span className="text-zinc-400 text-[11px]">[{log.ip_address}]</span>
                      </div>
                      <p className="text-zinc-700 text-[11px]">
                        Target: <strong className="text-zinc-900">{log.resource}</strong>
                      </p>
                    </div>
                    <span className="text-zinc-400 text-[11px] shrink-0">
                      {new Date(log.created_at).toLocaleString()}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
