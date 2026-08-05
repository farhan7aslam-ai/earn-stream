"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * GlassCard — the signature premium surface.
 * backdrop-blur(16px) + 1px crisp border + optional gradient hairline.
 */
export interface GlassCardProps
  extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "strong" | "panel";
  glow?: "none" | "violet" | "fuchsia" | "emerald" | "soft";
  border?: "solid" | "gradient";
  interactive?: boolean;
  as?: React.ElementType;
}

export const GlassCard = React.forwardRef<HTMLDivElement, GlassCardProps>(
  function GlassCard(
    {
      className,
      variant = "default",
      glow = "none",
      border = "solid",
      interactive = false,
      as: Comp = "div",
      children,
      ...props
    },
    ref
  ) {
    const surface =
      variant === "strong"
        ? "glass-strong"
        : variant === "panel"
          ? "glass-panel"
          : "glass";
    const glowCls =
      glow === "violet"
        ? "glow-violet"
        : glow === "fuchsia"
          ? "glow-fuchsia"
          : glow === "emerald"
            ? "glow-emerald"
            : glow === "soft"
              ? "glow-soft"
              : "";
    return (
      <Comp
        ref={ref}
        className={cn(
          "rounded-2xl",
          surface,
          border === "gradient" && "border-gradient",
          glowCls,
          interactive && "lift cursor-pointer hover:border-white/20",
          className
        )}
        {...props}
      >
        {children}
      </Comp>
    );
  }
);
