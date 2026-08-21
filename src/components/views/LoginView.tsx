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
      setError("Please enter your username/email and password");
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
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Simple Brand */}
        <div className="text-center mb-6">
          <div className="w-9 h-9 rounded bg-blue-600 flex items-center justify-center text-white font-bold text-base mx-auto mb-3">
            M
          </div>
          <h1 className="text-lg font-bold text-slate-900 tracking-tight">MailOpen Admin Console</h1>
          <p className="text-xs text-slate-500 mt-0.5">Control Plane & Identity Access</p>
        </div>

        {/* Card */}
        <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-2xs">
          {error && (
            <div className="mb-4 p-2.5 rounded bg-red-50 border border-red-200 text-red-700 text-xs font-mono">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Email / Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin@example.com"
                disabled={loading}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-colors text-slate-900 font-mono"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                disabled={loading}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-colors text-slate-900 font-mono"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-2 px-4 rounded bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-medium text-xs transition-colors disabled:opacity-50 cursor-pointer"
            >
              {loading ? "Authenticating..." : "Sign In"}
            </button>
          </form>

          <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-600 font-mono">
            <span>Local & LDAP Auth</span>
            <span>TLS 1.2+</span>
          </div>
        </div>
      </div>
    </div>
  );
}
