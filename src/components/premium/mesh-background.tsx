import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Fixed full-screen mesh-glow background. Place once near the root.
 */
export function MeshBackground({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn("mesh-bg", className)}
    >
      <div className="absolute -top-32 -left-24 h-[36rem] w-[36rem] rounded-full bg-violet-600/20 blur-[120px] aurora" />
      <div className="absolute top-1/3 -right-24 h-[32rem] w-[32rem] rounded-full bg-fuchsia-500/15 blur-[120px] aurora" />
      <div className="absolute -bottom-40 left-1/4 h-[34rem] w-[34rem] rounded-full bg-emerald-500/12 blur-[130px] aurora" />
    </div>
  );
}
