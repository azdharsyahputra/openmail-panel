"use client";

import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { copyTextToClipboard } from "@/lib/clipboard";
import { useToast } from "@/components/ui/Toast";
import {
  Save,
  RotateCcw,
  Mail,
  Shield,
  Network,
  Activity,
  Copy,
  Check,
  Code2,
} from "lucide-react";

export function ConfigurationsView() {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [initialSettings, setInitialSettings] = useState<Record<string, string>>({});
  const [activeSection, setActiveSection] = useState<"mailbox" | "network" | "security" | "observability">("mailbox");
  const [copiedYAML, setCopiedYAML] = useState(false);

  const loadConfig = async () => {
    try {
      setLoading(true);
      const res = await api.getSystemConfig();
      const mapped: Record<string, string> = {};
      Object.entries(res).forEach(([k, item]) => {
        mapped[k] = item.value;
      });
      setSettings(mapped);
      setInitialSettings(mapped);
    } catch (err: unknown) {
      toast.error("Failed to Load Config", err instanceof Error ? err.message : "Could not retrieve settings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConfig();
  }, []);

  const handleChange = (key: string, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const isDirty = JSON.stringify(settings) !== JSON.stringify(initialSettings);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      const updated = await api.updateSystemConfig(settings);
      const mapped: Record<string, string> = {};
      Object.entries(updated).forEach(([k, item]) => {
        mapped[k] = item.value;
      });
      setSettings(mapped);
      setInitialSettings(mapped);
      toast.success("Settings Saved", "System configuration parameters updated and applied.");
    } catch (err: unknown) {
      toast.error("Save Failed", err instanceof Error ? err.message : "Could not update settings");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setSettings(initialSettings);
    toast.info("Changes Discarded", "Reverted unsaved configuration edits.");
  };

  const prometheusSnippet = `scrape_configs:
  - job_name: 'openmail'
    scrape_interval: 15s
    static_configs:
      - targets: ['${settings.public_ip_override || "localhost"}:8085']`;

  const copyPrometheusConfig = async () => {
    const ok = await copyTextToClipboard(prometheusSnippet);
    if (ok) {
      setCopiedYAML(true);
      toast.success("Copied to Clipboard", "Prometheus YAML scrape configuration copied.");
      setTimeout(() => setCopiedYAML(false), 2000);
    } else {
      toast.error("Copy Failed", "Could not copy text to clipboard.");
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200/80 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold text-zinc-950 tracking-tight">System Configurations</h1>
            {isDirty && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-500/10 text-amber-700 border border-amber-500/20 font-mono">
                Unsaved Edits
              </span>
            )}
          </div>
          <p className="text-xs text-zinc-500 mt-0.5">
            Manage global mail server defaults, network parameters, crypto policies, and telemetry
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isDirty && (
            <button
              type="button"
              onClick={handleReset}
              disabled={saving}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white hover:bg-zinc-50 border border-zinc-200/80 rounded-lg text-zinc-700 shadow-2xs transition-all cursor-pointer disabled:opacity-50"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Discard</span>
            </button>
          )}
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !isDirty}
            className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium bg-zinc-950 hover:bg-zinc-800 text-white rounded-lg shadow-xs transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{saving ? "Saving..." : "Save Changes"}</span>
          </button>
        </div>
      </div>

      {/* Top Horizontal Sub-Tabs Bar (Clean, No Double Sidebar) */}
      <div className="flex items-center gap-1 border-b border-zinc-200/80 pb-px overflow-x-auto select-none">
        <button
          type="button"
          onClick={() => setActiveSection("mailbox")}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-medium border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeSection === "mailbox"
              ? "border-zinc-950 text-zinc-950 font-semibold"
              : "border-transparent text-zinc-500 hover:text-zinc-800 hover:border-zinc-300"
          }`}
        >
          <Mail className="w-3.5 h-3.5 shrink-0" />
          <span>Mail & Mailboxes</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSection("network")}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-medium border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeSection === "network"
              ? "border-zinc-950 text-zinc-950 font-semibold"
              : "border-transparent text-zinc-500 hover:text-zinc-800 hover:border-zinc-300"
          }`}
        >
          <Network className="w-3.5 h-3.5 shrink-0" />
          <span>Network & Host</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSection("security")}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-medium border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeSection === "security"
              ? "border-zinc-950 text-zinc-950 font-semibold"
              : "border-transparent text-zinc-500 hover:text-zinc-800 hover:border-zinc-300"
          }`}
        >
          <Shield className="w-3.5 h-3.5 shrink-0" />
          <span>Security & Spam</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSection("observability")}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-medium border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeSection === "observability"
              ? "border-zinc-950 text-zinc-950 font-semibold"
              : "border-transparent text-zinc-500 hover:text-zinc-800 hover:border-zinc-300"
          }`}
        >
          <Activity className="w-3.5 h-3.5 shrink-0" />
          <span>Observability & Prometheus</span>
        </button>
      </div>

      {/* Main Content Panels */}
      <form onSubmit={handleSave} className="space-y-6">
        {/* Section 1: Mail & Mailboxes */}
        {activeSection === "mailbox" && (
          <div className="bg-white border border-zinc-200/80 rounded-2xl p-6 shadow-2xs space-y-6">
            <div>
              <h2 className="text-sm font-semibold text-zinc-950 tracking-tight">Mail Server Defaults</h2>
              <p className="text-xs text-zinc-500 mt-0.5">Control default mailbox allocations and transport limits</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-sans text-xs">
              {/* Default Mailbox Quota */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="font-semibold text-zinc-800">Default Mailbox Quota (MB)</label>
                  <span className="text-[11px] text-zinc-400 font-mono">0 = Unlimited</span>
                </div>
                <input
                  type="number"
                  min="0"
                  value={settings.default_mailbox_quota_mb || ""}
                  onChange={(e) => handleChange("default_mailbox_quota_mb", e.target.value)}
                  placeholder="1024"
                  className="w-full px-3.5 py-2 rounded-xl bg-zinc-50/70 border border-zinc-200 focus:bg-white focus:outline-none focus:ring-1 focus:ring-zinc-900 font-mono text-zinc-900"
                />
                <p className="text-[11px] text-zinc-400">
                  Standard storage limit assigned to newly created user mailboxes.
                </p>
              </div>

              {/* Max Message Size */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="font-semibold text-zinc-800">Max Message & Attachment Size (MB)</label>
                  <span className="text-[11px] text-zinc-400 font-mono">Postfix message_size_limit</span>
                </div>
                <input
                  type="number"
                  min="1"
                  value={settings.max_message_size_mb || ""}
                  onChange={(e) => handleChange("max_message_size_mb", e.target.value)}
                  placeholder="50"
                  className="w-full px-3.5 py-2 rounded-xl bg-zinc-50/70 border border-zinc-200 focus:bg-white focus:outline-none focus:ring-1 focus:ring-zinc-900 font-mono text-zinc-900"
                />
                <p className="text-[11px] text-zinc-400">
                  Maximum allowed MIME message payload including all attachments.
                </p>
              </div>

              {/* Max Recipients */}
              <div className="space-y-1.5 md:col-span-2 pt-3 border-t border-zinc-100">
                <div className="flex justify-between items-center">
                  <label className="font-semibold text-zinc-800">Max Recipients per Outbound Email</label>
                  <span className="text-[11px] text-zinc-400 font-mono">Anti-abuse safeguard</span>
                </div>
                <input
                  type="number"
                  min="1"
                  value={settings.max_recipients_per_email || ""}
                  onChange={(e) => handleChange("max_recipients_per_email", e.target.value)}
                  placeholder="50"
                  className="w-full max-w-md px-3.5 py-2 rounded-xl bg-zinc-50/70 border border-zinc-200 focus:bg-white focus:outline-none focus:ring-1 focus:ring-zinc-900 font-mono text-zinc-900"
                />
                <p className="text-[11px] text-zinc-400">
                  Restricts the number of RCPT TO addresses accepted in a single SMTP session.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Section 2: Network & Host */}
        {activeSection === "network" && (
          <div className="bg-white border border-zinc-200/80 rounded-2xl p-6 shadow-2xs space-y-6">
            <div>
              <h2 className="text-sm font-semibold text-zinc-950 tracking-tight">Network & Host Binding</h2>
              <p className="text-xs text-zinc-500 mt-0.5">Configure mail exchanger hostnames and public IP resolution</p>
            </div>

            <div className="space-y-4 font-sans text-xs">
              {/* Server Hostname */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="font-semibold text-zinc-800">Server Hostname (myhostname)</label>
                  <span className="text-[11px] text-zinc-400 font-mono">FQDN</span>
                </div>
                <input
                  type="text"
                  value={settings.server_hostname || ""}
                  onChange={(e) => handleChange("server_hostname", e.target.value)}
                  placeholder="mail.domain.com"
                  className="w-full px-3.5 py-2 rounded-xl bg-zinc-50/70 border border-zinc-200 focus:bg-white focus:outline-none focus:ring-1 focus:ring-zinc-900 font-mono text-zinc-900"
                />
                <p className="text-[11px] text-zinc-400">
                  Primary server hostname advertised in Postfix SMTP HELO/EHLO greetings.
                </p>
              </div>

              {/* Public IP Override */}
              <div className="space-y-1.5 pt-3 border-t border-zinc-100">
                <div className="flex justify-between items-center">
                  <label className="font-semibold text-zinc-800">Public WAN IP Override</label>
                  <span className="text-[11px] text-zinc-400 font-mono">Optional</span>
                </div>
                <input
                  type="text"
                  value={settings.public_ip_override || ""}
                  onChange={(e) => handleChange("public_ip_override", e.target.value)}
                  placeholder="Leave blank for automatic public IP detection"
                  className="w-full px-3.5 py-2 rounded-xl bg-zinc-50/70 border border-zinc-200 focus:bg-white focus:outline-none focus:ring-1 focus:ring-zinc-900 font-mono text-zinc-900"
                />
                <p className="text-[11px] text-zinc-400">
                  If your server is behind NAT/proxy, enter your static public IPv4 here. If empty, the engine automatically detects your WAN IP.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Section 3: Security & Cryptography */}
        {activeSection === "security" && (
          <div className="bg-white border border-zinc-200/80 rounded-2xl p-6 shadow-2xs space-y-6">
            <div>
              <h2 className="text-sm font-semibold text-zinc-950 tracking-tight">Security & Spam Policies</h2>
              <p className="text-xs text-zinc-500 mt-0.5">Configure TLS enforcement, DKIM key strength, and spam thresholds</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-sans text-xs">
              {/* TLS Enforcement Level */}
              <div className="space-y-1.5">
                <label className="font-semibold text-zinc-800">TLS Enforcement Mode</label>
                <select
                  value={settings.tls_enforce_level || "opportunistic"}
                  onChange={(e) => handleChange("tls_enforce_level", e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-zinc-50/70 border border-zinc-200 focus:bg-white focus:outline-none focus:ring-1 focus:ring-zinc-900 font-sans text-zinc-900 cursor-pointer"
                >
                  <option value="opportunistic">Opportunistic STARTTLS (Standard RFC 3207)</option>
                  <option value="strict">Strict Mandatory TLS (Reject unencrypted SMTP/IMAP)</option>
                </select>
                <p className="text-[11px] text-zinc-400">
                  Opportunistic ensures backwards compatibility; Strict enforces zero-trust transit.
                </p>
              </div>

              {/* DKIM Key Size */}
              <div className="space-y-1.5">
                <label className="font-semibold text-zinc-800">Default DKIM Key Strength</label>
                <select
                  value={settings.dkim_default_bits || "2048"}
                  onChange={(e) => handleChange("dkim_default_bits", e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-zinc-50/70 border border-zinc-200 focus:bg-white focus:outline-none focus:ring-1 focus:ring-zinc-900 font-sans text-zinc-900 cursor-pointer"
                >
                  <option value="2048">RSA 2048-bit (Recommended Industry Standard)</option>
                  <option value="4096">RSA 4096-bit (Maximum Security)</option>
                </select>
                <p className="text-[11px] text-zinc-400">
                  Key length generated when creating new cryptographic signatures for domains.
                </p>
              </div>

              {/* Spam Reject Score */}
              <div className="space-y-1.5 pt-3 border-t border-zinc-100">
                <label className="font-semibold text-zinc-800">Spam Reject Threshold</label>
                <input
                  type="number"
                  step="0.5"
                  value={settings.spam_reject_score || "15.0"}
                  onChange={(e) => handleChange("spam_reject_score", e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-zinc-50/70 border border-zinc-200 focus:bg-white focus:outline-none focus:ring-1 focus:ring-zinc-900 font-mono text-zinc-900"
                />
                <p className="text-[11px] text-zinc-400">Rspamd score &ge; this value will be dropped/rejected.</p>
              </div>

              {/* Spam Greylist Score */}
              <div className="space-y-1.5 pt-3 border-t border-zinc-100">
                <label className="font-semibold text-zinc-800">Spam Greylist Threshold</label>
                <input
                  type="number"
                  step="0.5"
                  value={settings.spam_greylist_score || "6.0"}
                  onChange={(e) => handleChange("spam_greylist_score", e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-zinc-50/70 border border-zinc-200 focus:bg-white focus:outline-none focus:ring-1 focus:ring-zinc-900 font-mono text-zinc-900"
                />
                <p className="text-[11px] text-zinc-400">Score &ge; this value triggers temporary delivery delay.</p>
              </div>
            </div>
          </div>
        )}

        {/* Section 4: Observability & Prometheus */}
        {activeSection === "observability" && (
          <div className="space-y-6">
            <div className="bg-white border border-zinc-200/80 rounded-2xl p-6 shadow-2xs space-y-6">
              <div>
                <h2 className="text-sm font-semibold text-zinc-950 tracking-tight">Observability & Retention</h2>
                <p className="text-xs text-zinc-500 mt-0.5">Control audit trail life cycle and Prometheus exporter metrics</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-sans text-xs">
                {/* Audit Retention */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="font-semibold text-zinc-800">Audit Log Retention (Days)</label>
                    <span className="text-[11px] text-zinc-400 font-mono">Auto-prune</span>
                  </div>
                  <input
                    type="number"
                    min="7"
                    value={settings.audit_retention_days || "90"}
                    onChange={(e) => handleChange("audit_retention_days", e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-zinc-50/70 border border-zinc-200 focus:bg-white focus:outline-none focus:ring-1 focus:ring-zinc-900 font-mono text-zinc-900"
                  />
                  <p className="text-[11px] text-zinc-400">
                    Audit trail logs older than this duration will be archived and purged automatically.
                  </p>
                </div>

                {/* Prometheus Exporter Toggle */}
                <div className="space-y-1.5">
                  <label className="font-semibold text-zinc-800">Prometheus /metrics Endpoint</label>
                  <select
                    value={settings.prometheus_enabled || "true"}
                    onChange={(e) => handleChange("prometheus_enabled", e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-zinc-50/70 border border-zinc-200 focus:bg-white focus:outline-none focus:ring-1 focus:ring-zinc-900 font-sans text-zinc-900 cursor-pointer"
                  >
                    <option value="true">Enabled (Expose /metrics for Prometheus & Grafana)</option>
                    <option value="false">Disabled</option>
                  </select>
                  <p className="text-[11px] text-zinc-400">
                    When enabled, OpenMail provides OpenMetrics telemetry data on port 8085.
                  </p>
                </div>
              </div>
            </div>

            {/* Prometheus Integration Snippet Card */}
            <div className="bg-white border border-zinc-200/80 rounded-2xl p-6 shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Code2 className="w-4 h-4 text-zinc-800" />
                  <h3 className="text-xs font-semibold text-zinc-950 font-mono uppercase tracking-wider">
                    Prometheus Scrape Configuration (prometheus.yml)
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={copyPrometheusConfig}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-zinc-100 hover:bg-zinc-200 text-zinc-800 rounded-lg transition-colors cursor-pointer"
                >
                  {copiedYAML ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-700 font-mono">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-zinc-600" />
                      <span>Copy YAML</span>
                    </>
                  )}
                </button>
              </div>

              <div className="relative">
                <pre className="p-4 bg-zinc-950 text-zinc-100 rounded-xl font-mono text-xs overflow-x-auto leading-relaxed border border-zinc-800">
                  {prometheusSnippet}
                </pre>
              </div>
              <p className="text-[11px] text-zinc-500 font-sans">
                Paste this snippet into your external Prometheus server configuration file (`prometheus.yml`) to automatically collect mail server metrics into Grafana.
              </p>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
