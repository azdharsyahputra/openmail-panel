"use client";

import React, { useState } from "react";
import { useAuth } from "@/lib/auth";

export function LoginView() {
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setError("Please enter your username or email and password");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await login({ username, password });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Authentication failed";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen w-screen bg-[#f8fafc] flex items-center justify-center p-4 overflow-hidden select-none">
      <div className="w-full max-w-sm bg-white border border-zinc-200/80 rounded-2xl p-8 shadow-xs">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="w-9 h-9 rounded-lg bg-zinc-950 flex items-center justify-center text-white font-semibold text-sm mx-auto mb-3 shadow-xs tracking-tight">
            M
          </div>
          <h1 className="text-lg font-semibold text-zinc-950 tracking-tight">MailOpen Control Plane</h1>
          <p className="text-xs text-zinc-500 mt-0.5">Authenticate with local database or LDAP directory</p>
        </div>

        {error && (
          <div className="mb-4 p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs font-mono">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-medium text-zinc-700 mb-1">
              Email / Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="admin@example.com"
              disabled={loading}
              className="w-full px-3 py-2 text-xs bg-zinc-50/50 hover:bg-zinc-50 focus:bg-white border border-zinc-300 rounded-lg focus:outline-none focus:border-zinc-950 focus:ring-1 focus:ring-zinc-950 transition-all text-zinc-950 font-mono"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-700 mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              disabled={loading}
              className="w-full px-3 py-2 text-xs bg-zinc-50/50 hover:bg-zinc-50 focus:bg-white border border-zinc-300 rounded-lg focus:outline-none focus:border-zinc-950 focus:ring-1 focus:ring-zinc-950 transition-all text-zinc-950 font-mono"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-2 px-4 rounded-lg bg-zinc-950 hover:bg-zinc-800 active:bg-black text-white font-medium text-xs shadow-xs transition-all disabled:opacity-50 cursor-pointer"
          >
            {loading ? "Authenticating..." : "Sign In"}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-zinc-100 flex items-center justify-between text-[11px] text-zinc-400 font-mono">
          <span>Local & OpenLDAP</span>
          <span>TLS 1.2+ Protected</span>
        </div>
      </div>
    </div>
  );
}
