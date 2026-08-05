import * as React from "react";
import { cn } from "@/lib/utils";

type Tone = "violet" | "fuchsia" | "emerald" | "amber" | "rose" | "neutral";

const toneMap: Record<Tone, string> = {
  violet:
    "bg-violet-500/12 text-violet-200 ring-1 ring-inset ring-violet-400/25",
  fuchsia:
    "bg-fuchsia-500/12 text-fuchsia-200 ring-1 ring-inset ring-fuchsia-400/25",
  emerald:
    "bg-emerald-500/12 text-emerald-200 ring-1 ring-inset ring-emerald-400/25",
  amber: "bg-amber-500/12 text-amber-200 ring-1 ring-inset ring-amber-400/25",
  rose: "bg-rose-500/12 text-rose-200 ring-1 ring-inset ring-rose-400/25",
  neutral:
    "bg-white/8 text-violet-100/70 ring-1 ring-inset ring-white/10",
};

export function PremiumBadge({
  children,
  tone = "neutral",
  className,
}: {
  children: React.ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold tracking-wide",
        toneMap[tone],
        className
      )}
    >
      {children}
    </span>
  );
}
