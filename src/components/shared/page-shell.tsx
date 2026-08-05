"use client";

import * as React from "react";
import { Sparkles, Heart } from "lucide-react";
import { MeshBackground } from "@/components/premium";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-white/5 bg-[rgba(9,7,15,0.5)] backdrop-blur-sm">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-5 py-5 text-xs text-violet-100/40 sm:flex-row">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-gradient-to-br from-violet-500 to-fuchsia-500">
            <Sparkles className="h-3.5 w-3.5 text-white" />
          </div>
          <span>© {new Date().getFullYear()} EarnStream · Premium Micro-Task Network</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span>Secured payouts · Verified tasks</span>
          <Heart className="h-3 w-3 text-fuchsia-400" />
        </div>
      </div>
    </footer>
  );
}

export function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen flex-col">
      <MeshBackground />
      <div className="relative z-10 flex min-h-screen flex-col">{children}</div>
    </div>
  );
}
