"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const glowButtonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/60 focus-visible:ring-offset-0 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.97] [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary:
          "text-white bg-gradient-to-br from-violet-500 via-fuchsia-500 to-violet-600 shadow-[0_8px_30px_-8px_rgba(139,92,246,0.7)] hover:shadow-[0_12px_40px_-8px_rgba(217,70,239,0.8)] hover:brightness-110",
        secondary:
          "text-violet-50 glass-strong hover:bg-white/10 hover:border-white/20",
        ghost:
          "text-violet-100/80 hover:text-white hover:bg-white/5",
        outline:
          "text-violet-100 border border-violet-400/30 bg-violet-500/5 hover:bg-violet-500/15 hover:border-violet-400/50",
        gold:
          "text-amber-950 bg-gradient-to-br from-amber-300 via-amber-400 to-orange-400 shadow-[0_8px_30px_-8px_rgba(245,158,11,0.7)] hover:brightness-105",
        danger:
          "text-white bg-gradient-to-br from-rose-500 to-red-600 shadow-[0_8px_30px_-8px_rgba(244,63,94,0.6)] hover:brightness-110",
        success:
          "text-white bg-gradient-to-br from-emerald-500 to-teal-600 shadow-[0_8px_30px_-8px_rgba(16,185,129,0.6)] hover:brightness-110",
      },
      size: {
        sm: "h-9 px-4 text-xs",
        md: "h-11 px-5",
        lg: "h-12 px-7 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

export interface GlowButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof glowButtonVariants> {
  asChild?: boolean;
}

export const GlowButton = React.forwardRef<
  HTMLButtonElement,
  GlowButtonProps
>(function GlowButton(
  { className, variant, size, asChild = false, ...props },
  ref
) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      ref={ref}
      className={cn(glowButtonVariants({ variant, size }), className)}
      {...props}
    />
  );
});
