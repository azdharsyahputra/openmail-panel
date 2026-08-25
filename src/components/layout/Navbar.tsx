"use client";

import React, { useEffect, useState, useRef } from "react";
import { useAuth } from "@/lib/auth";
import { api, HealthReport, DomainItem, MailboxItem } from "@/lib/api";
import { NavTab } from "@/components/layout/Sidebar";
import {
  Search,
  LogOut,
  Command,
  LayoutDashboard,
  Globe,
  Inbox,
  Users,
  Layers,
  ShieldCheck,
  Activity,
  Server,
  SlidersHorizontal,
  X,
  ArrowRight,
} from "lucide-react";

const NAV_ITEMS: { id: NavTab; label: string; group: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "dashboard", label: "Overview & Health", group: "General", icon: LayoutDashboard },
  { id: "domains", label: "Virtual Domains & DNS", group: "Core", icon: Globe },
  { id: "mailboxes", label: "Mailboxes & Aliases", group: "Core", icon: Inbox },
  { id: "identity", label: "Identity & LDAP", group: "Control", icon: Users },
  { id: "queue", label: "Mail Queue (Postfix)", group: "Control", icon: Layers },
  { id: "security", label: "Security & TLS Doctor", group: "Operations", icon: ShieldCheck },
  { id: "monitoring", label: "Telemetry & Logs", group: "Operations", icon: Activity },
  { id: "system", label: "System Diagnostics", group: "Operations", icon: Server },
  { id: "configurations", label: "Server Configurations", group: "Operations", icon: SlidersHorizontal },
];

export function Navbar({ onNavigate }: { onNavigate?: (tab: NavTab) => void }) {
  const { user, logout } = useAuth();
  const [health, setHealth] = useState<HealthReport | null>(null);

  // Search Palette State
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [domains, setDomains] = useState<DomainItem[]>([]);
  const [mailboxes, setMailboxes] = useState<MailboxItem[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const checkLiveHealth = async () => {
    try {
      const res = await api.getLiveHealth();
      setHealth(res);
    } catch {
      setHealth({ status: "offline" });
    }
  };

  useEffect(() => {
    checkLiveHealth();
    const interval = setInterval(checkLiveHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  // Global ⌘K / Ctrl+K keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      } else if (e.key === "Escape") {
        setIsSearchOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Preload searchable resources when search modal opens
  useEffect(() => {
    if (isSearchOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setLoadingData(true);
      Promise.all([api.getDomains().catch(() => []), api.getMailboxes().catch(() => [])])
        .then(([d, m]) => {
          setDomains(d);
          setMailboxes(m);
        })
        .finally(() => setLoadingData(false));
    } else {
      setQuery("");
    }
  }, [isSearchOpen]);

  const normalizedStatus = (health?.status || "").toLowerCase();
  const isOnline = ["ok", "healthy", "live", "up"].includes(normalizedStatus);
  const userInitial = (user?.display_name || user?.email || user?.username || "A").charAt(0).toUpperCase();

  const q = query.trim().toLowerCase();

  const filteredNav = NAV_ITEMS.filter(
    (item) => item.label.toLowerCase().includes(q) || item.id.toLowerCase().includes(q)
  );

  const filteredDomains = domains.filter((d) => d.name.toLowerCase().includes(q));
  const filteredMailboxes = mailboxes.filter((m) => m.email.toLowerCase().includes(q));

  const handleSelectTab = (tab: NavTab) => {
    onNavigate?.(tab);
    setIsSearchOpen(false);
  };

  return (
    <>
      <header className="h-16 border-b border-zinc-200/80 bg-white px-6 flex items-center justify-between sticky top-0 z-30 select-none">
        {/* Brand & Organization */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-zinc-950 flex items-center justify-center text-white font-bold text-sm tracking-tight shadow-xs">
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
              </svg>
            </div>
            <div className="flex items-baseline gap-2.5">
              <span className="font-bold text-zinc-950 text-base tracking-tight">OpenMail</span>
              <span className="text-zinc-300 font-light text-sm">/</span>
              <span className="text-xs text-zinc-500 font-medium font-mono">Control Plane</span>
            </div>
          </div>
        </div>

        {/* Global Search Bar (Trigger) */}
        <div className="flex-1 max-w-lg mx-8 hidden md:block">
          <div
            onClick={() => setIsSearchOpen(true)}
            className="relative flex items-center cursor-pointer group"
          >
            <Search className="w-4 h-4 text-zinc-400 group-hover:text-zinc-600 absolute left-3.5 pointer-events-none transition-colors" />
            <input
              type="text"
              readOnly
              placeholder="Search mailboxes, virtual domains, navigation... (⌘K)"
              className="w-full pl-10 pr-12 py-2 text-xs bg-zinc-100/80 hover:bg-zinc-100 border border-transparent hover:border-zinc-200 rounded-xl focus:outline-none transition-all text-zinc-800 placeholder:text-zinc-400 cursor-pointer shadow-2xs"
            />
            <div className="absolute right-3 flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-white border border-zinc-200 text-[10px] text-zinc-400 font-mono shadow-2xs group-hover:border-zinc-300">
              <Command className="w-3 h-3" />
              <span>K</span>
            </div>
          </div>
        </div>

        {/* Cluster Health & Account */}
        <div className="flex items-center gap-4">
          {/* Status Badge (Real Live Status) */}
          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium font-mono border transition-all ${
              isOnline
                ? "bg-emerald-500/10 text-emerald-800 border-emerald-500/20"
                : "bg-red-500/10 text-red-700 border-red-500/20"
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isOnline ? "bg-emerald-600 animate-pulse" : "bg-red-500"
              }`}
            />
            <span>{isOnline ? "Engine Operational" : "Degraded"}</span>
          </div>

          {/* User Account */}
          {user && (
            <div className="flex items-center gap-3 pl-3.5 border-l border-zinc-200">
              <div className="w-8 h-8 rounded-full bg-zinc-100 text-zinc-900 font-bold text-xs flex items-center justify-center border border-zinc-200/80 font-mono">
                {userInitial}
              </div>
              <div className="text-left hidden sm:block">
                <span className="font-semibold text-zinc-900 text-xs block leading-tight truncate max-w-40 font-mono">
                  {user.email || user.username}
                </span>
                <span className="text-[10px] text-zinc-500 font-mono uppercase leading-tight">
                  {user.roles?.[0] || "Admin"}
                </span>
              </div>
              <button
                onClick={() => logout()}
                title="Sign Out"
                className="p-1.5 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer ml-1"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Global Command Palette / Spotlight Modal */}
      {isSearchOpen && (
        <div className="fixed inset-0 z-50 bg-zinc-950/40 backdrop-blur-xs flex items-start justify-center pt-20 p-4 select-none animate-in fade-in duration-150">
          <div
            className="bg-white rounded-2xl border border-zinc-200/90 max-w-xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[75vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Search Input Bar */}
            <div className="p-3.5 border-b border-zinc-100 flex items-center gap-3 bg-zinc-50/50">
              <Search className="w-4 h-4 text-zinc-400 shrink-0 ml-1" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Type a command, domain, or mailbox address..."
                className="flex-1 text-sm bg-transparent border-none focus:outline-none text-zinc-900 placeholder:text-zinc-400 font-sans"
              />
              {query && (
                <button onClick={() => setQuery("")} className="text-zinc-400 hover:text-zinc-600 p-1 cursor-pointer">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
              <div className="px-1.5 py-0.5 rounded bg-zinc-200/70 text-[10px] font-mono text-zinc-500">ESC</div>
            </div>

            {/* Results List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-4 text-xs">
              {/* Navigation Items */}
              {filteredNav.length > 0 && (
                <div className="space-y-1">
                  <span className="px-2 text-[10px] font-bold text-zinc-400 uppercase tracking-wider font-mono">
                    Navigation
                  </span>
                  <div className="space-y-0.5">
                    {filteredNav.map((item) => {
                      const Icon = item.icon;
                      return (
                        <button
                          key={item.id}
                          onClick={() => handleSelectTab(item.id)}
                          className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-left hover:bg-zinc-100 transition-colors group cursor-pointer"
                        >
                          <div className="flex items-center gap-2.5">
                            <div className="p-1.5 rounded-lg bg-zinc-100 group-hover:bg-white text-zinc-700 transition-colors border border-zinc-200/50">
                              <Icon className="w-3.5 h-3.5" />
                            </div>
                            <span className="font-medium text-zinc-800 text-xs font-sans">{item.label}</span>
                          </div>
                          <div className="flex items-center gap-1 text-[11px] text-zinc-400 group-hover:text-zinc-700 font-mono">
                            <span>Go to {item.id}</span>
                            <ArrowRight className="w-3 h-3" />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Virtual Domains Section */}
              {filteredDomains.length > 0 && (
                <div className="space-y-1">
                  <span className="px-2 text-[10px] font-bold text-zinc-400 uppercase tracking-wider font-mono">
                    Virtual Domains ({filteredDomains.length})
                  </span>
                  <div className="space-y-0.5">
                    {filteredDomains.slice(0, 5).map((dom) => (
                      <button
                        key={dom.name}
                        onClick={() => handleSelectTab("domains")}
                        className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-left hover:bg-zinc-100 transition-colors group cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="p-1.5 rounded-lg bg-zinc-100 group-hover:bg-white text-zinc-700 transition-colors border border-zinc-200/50">
                            <Globe className="w-3.5 h-3.5" />
                          </div>
                          <span className="font-mono font-medium text-zinc-900 text-xs">{dom.name}</span>
                        </div>
                        <span className="text-[10px] px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded font-mono">
                          {dom.status}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Mailbox Accounts Section */}
              {filteredMailboxes.length > 0 && (
                <div className="space-y-1">
                  <span className="px-2 text-[10px] font-bold text-zinc-400 uppercase tracking-wider font-mono">
                    Mailboxes ({filteredMailboxes.length})
                  </span>
                  <div className="space-y-0.5">
                    {filteredMailboxes.slice(0, 5).map((mb) => (
                      <button
                        key={mb.email}
                        onClick={() => handleSelectTab("mailboxes")}
                        className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-left hover:bg-zinc-100 transition-colors group cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="p-1.5 rounded-lg bg-zinc-100 group-hover:bg-white text-zinc-700 transition-colors border border-zinc-200/50">
                            <Inbox className="w-3.5 h-3.5" />
                          </div>
                          <span className="font-mono text-zinc-900 text-xs">{mb.email}</span>
                        </div>
                        <span className="text-[11px] text-zinc-400 font-mono">
                          {mb.domain_name || "virtual"}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Empty State */}
              {filteredNav.length === 0 && filteredDomains.length === 0 && filteredMailboxes.length === 0 && (
                <div className="p-8 text-center text-zinc-400 space-y-1">
                  <p className="text-xs font-medium text-zinc-600">No matching results for &ldquo;{query}&rdquo;</p>
                  <p className="text-[11px] text-zinc-400">Try searching for domains, mailboxes, or navigation tabs.</p>
                </div>
              )}
            </div>

            {/* Footer Shortcut Hints */}
            <div className="p-2.5 bg-zinc-50 border-t border-zinc-100 flex items-center justify-between text-[11px] text-zinc-500 font-sans px-4">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 bg-white border border-zinc-200 rounded font-mono text-[10px] text-zinc-600">↵</kbd>
                  to select
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 bg-white border border-zinc-200 rounded font-mono text-[10px] text-zinc-600">esc</kbd>
                  to close
                </span>
              </div>
              <span className="font-mono text-[10px] text-zinc-400">OpenMail Global Index</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
