"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { LoginView } from "@/components/views/LoginView";

export default function LoginPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.replace("/");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="h-screen w-screen bg-[#f8fafc] flex items-center justify-center overflow-hidden">
        <div className="flex flex-col items-center gap-3">
          <div className="w-7 h-7 border-2 border-zinc-300 border-t-zinc-950 rounded-full animate-spin" />
          <span className="text-xs font-medium text-zinc-500 font-mono">
            Checking session...
          </span>
        </div>
      </div>
    );
  }

  return <LoginView />;
}
