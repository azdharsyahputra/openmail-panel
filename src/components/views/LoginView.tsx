"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { Lock, ShieldCheck, KeyRound, Check } from "lucide-react";

export function LoginView() {
  const { login } = useAuth();
  const [username, setUsername] = useState("admin@example.com");
  const [password, setPassword] = useState("Password123!");
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedUser = localStorage.getItem("openmail_saved_username");
      const savedPass = localStorage.getItem("openmail_saved_password");
      const savedRemember = localStorage.getItem("openmail_remember_me");
      if (savedRemember === "true") {
        setRememberMe(true);
        if (savedUser) setUsername(savedUser);
        if (savedPass) setPassword(savedPass);
      }
    }
  }, []);

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

      if (typeof window !== "undefined") {
        if (rememberMe) {
          localStorage.setItem("openmail_remember_me", "true");
          localStorage.setItem("openmail_saved_username", username);
          localStorage.setItem("openmail_saved_password", password);
        } else {
          localStorage.removeItem("openmail_remember_me");
          localStorage.removeItem("openmail_saved_username");
          localStorage.removeItem("openmail_saved_password");
        }
      }
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : typeof err === "object" && err !== null && "message" in err
          ? String((err as { message: unknown }).message)
          : "Invalid username or password";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleFillDemo = () => {
    setUsername("admin@example.com");
    setPassword("Password123!");
    setError(null);
  };

  return (
    <div className="h-screen w-screen bg-[#f8fafc] flex items-center justify-center p-4 overflow-hidden select-none">
      <div className="w-full max-w-sm bg-white border border-zinc-200/80 rounded-2xl p-8 shadow-xs">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="w-10 h-10 rounded-xl bg-zinc-950 flex items-center justify-center text-white font-bold text-sm mx-auto mb-3 shadow-xs tracking-tight">
            M
          </div>
          <h1 className="text-lg font-semibold text-zinc-950 tracking-tight">MailOpen Control Plane</h1>
          <p className="text-xs text-zinc-500 mt-0.5">Authenticate with local database or LDAP directory</p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-mono">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
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
            <div className="flex justify-between items-center mb-1">
              <label className="block text-xs font-medium text-zinc-700">
                Password
              </label>
              <button
                type="button"
                onClick={handleFillDemo}
                className="text-[11px] font-mono text-zinc-600 hover:text-zinc-950 cursor-pointer"
              >
                Fill default
              </button>
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              disabled={loading}
              className="w-full px-3 py-2 text-xs bg-zinc-50/50 hover:bg-zinc-50 focus:bg-white border border-zinc-300 rounded-lg focus:outline-none focus:border-zinc-950 focus:ring-1 focus:ring-zinc-950 transition-all text-zinc-950 font-mono"
            />
          </div>

          {/* Remember Me & Security Status */}
          <div className="flex items-center justify-between text-xs pt-1">
            <label className="flex items-center gap-2 text-zinc-700 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded text-zinc-950 accent-zinc-950 cursor-pointer"
              />
              <span className="font-medium">Remember me</span>
            </label>

            <span className="text-[11px] text-zinc-400 font-mono flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>TLS 1.2+</span>
            </span>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-2.5 px-4 rounded-xl bg-zinc-950 hover:bg-zinc-800 active:bg-black text-white font-medium text-xs shadow-xs transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1.5"
          >
            {loading ? (
              <span>Authenticating...</span>
            ) : (
              <>
                <KeyRound className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </>
            )}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-zinc-100 flex items-center justify-between text-[11px] text-zinc-400 font-mono">
          <span>Local & OpenLDAP</span>
          <span>Zero-Trust Auth</span>
        </div>
      </div>
    </div>
  );
}
