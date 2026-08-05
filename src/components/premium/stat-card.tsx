"use client";

import * as React from "react";
import { GlassCard } from "./glass-card";
import { cn } from "@/lib/utils";

export interface StatCardProps {
  label: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
  hint?: React.ReactNode;
  accent?: "violet" | "fuchsia" | "emerald" | "amber" | "rose";
  className?: string;
}

const accentMap = {
  violet: {
    icon: "from-violet-500/30 to-violet-500/5 text-violet-300",
    ring: "group-hover:glow-violet",
  },
  fuchsia: {
    icon: "from-fuchsia-500/30 to-fuchsia-500/5 text-fuchsia-300",
    ring: "group-hover:glow-fuchsia",
  },
  emerald: {
    icon: "from-emerald-500/30 to-emerald-500/5 text-emerald-300",
    ring: "group-hover:glow-emerald",
  },
  amber: {
    icon: "from-amber-500/30 to-amber-500/5 text-amber-300",
    ring: "",
  },
  rose: {
    icon: "from-rose-500/30 to-rose-500/5 text-rose-300",
    ring: "",
  },
} as const;

export function StatCard({
  label,
  value,
  icon,
  hint,
  accent = "violet",
  className,
}: StatCardProps) {
  const a = accentMap[accent];
  return (
    <GlassCard
      interactive
      className={cn("group p-5 lift", a.ring, className)}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-violet-100/50">
            {label}
          </p>
          <div className="mt-2 text-2xl font-bold tracking-tight text-white tabular-nums">
            {value}
          </div>
          {hint ? (
            <div className="mt-1 text-xs text-violet-100/40">{hint}</div>
          ) : null}
        </div>
        {icon ? (
          <div
            className={cn(
              "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ring-1 ring-white/10",
              a.icon
            )}
          >
            {icon}
          </div>
        ) : null}
      </div>
    </GlassCard>
  );
}
