"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from "lucide-react";

export type ToastType = "success" | "error" | "info" | "warning";

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastContextType {
  toasts: Toast[];
  addToast: (type: ToastType, title: string, message?: string, duration?: number) => void;
  removeToast: (id: string) => void;
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
  warning: (title: string, message?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (type: ToastType, title: string, message?: string, duration = 4000) => {
      const id = Math.random().toString(36).substring(2, 9);
      const newToast: Toast = { id, type, title, message, duration };
      setToasts((prev) => [...prev, newToast]);

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
    },
    [removeToast]
  );

  const success = useCallback((title: string, message?: string) => addToast("success", title, message), [addToast]);
  const error = useCallback((title: string, message?: string) => addToast("error", title, message), [addToast]);
  const info = useCallback((title: string, message?: string) => addToast("info", title, message), [addToast]);
  const warning = useCallback((title: string, message?: string) => addToast("warning", title, message), [addToast]);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, success, error, info, warning }}>
      {children}
      {/* Floating Toast Container */}
      <div className="fixed bottom-6 right-6 z-100 flex flex-col gap-3 max-w-sm w-full pointer-events-none select-none">
        {toasts.map((toast) => {
          const isSuccess = toast.type === "success";
          const isError = toast.type === "error";
          const isWarning = toast.type === "warning";

          return (
            <div
              key={toast.id}
              className={`toast-animate-in pointer-events-auto p-4 rounded-2xl border shadow-2xl bg-white/95 backdrop-blur-md flex items-start gap-3 transition-all ${
                isSuccess
                  ? "border-emerald-500/20 text-zinc-900 shadow-emerald-500/5"
                  : isError
                  ? "border-red-500/20 text-zinc-900 shadow-red-500/5"
                  : isWarning
                  ? "border-amber-500/20 text-zinc-900 shadow-amber-500/5"
                  : "border-zinc-200 text-zinc-900 shadow-zinc-500/5"
              }`}
            >
              {isSuccess && <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />}
              {isError && <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />}
              {isWarning && <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />}
              {!isSuccess && !isError && !isWarning && <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />}

              <div className="flex-1 min-w-0">
                <h4 className="text-xs font-semibold text-zinc-950 tracking-tight leading-tight">{toast.title}</h4>
                {toast.message && (
                  <p className="text-[11px] text-zinc-500 mt-1 font-mono break-all leading-normal">
                    {toast.message}
                  </p>
                )}
              </div>

              <button
                onClick={() => removeToast(toast.id)}
                className="text-zinc-400 hover:text-zinc-700 p-0.5 rounded cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
