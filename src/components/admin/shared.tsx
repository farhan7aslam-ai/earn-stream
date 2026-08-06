"use client";

import * as React from "react";
import {
  Mail,
  Music2,
  ShieldCheck,
  ShieldAlert,
  Ban,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { PremiumBadge } from "@/components/premium";
import type {
  PaymentMethod,
  PaymentStatus,
  TaskStatus,
  TaskType,
} from "@/lib/types";

/** Map task type → PremiumBadge tone + label + icon. NO blue/indigo. */
export const taskTypeTone: Record<
  TaskType,
  "violet" | "fuchsia"
> = {
  gmail: "violet",
  tiktok: "fuchsia",
};

export const taskTypeLabel: Record<TaskType, string> = {
  gmail: "Gmail Task",
  tiktok: "TikTok Like",
};

export function taskTypeIcon(type: TaskType): React.ReactNode {
  if (type === "gmail") return <Mail className="h-3.5 w-3.5" />;
  return <Music2 className="h-3.5 w-3.5" />;
}

export function TaskTypePill({ type }: { type: TaskType }) {
  return (
    <PremiumBadge tone={taskTypeTone[type]}>
      {taskTypeIcon(type)}
      {taskTypeLabel[type]}
    </PremiumBadge>
  );
}

export function paymentStatusTone(
  status: PaymentStatus | TaskStatus
): "amber" | "emerald" | "rose" | "violet" | "neutral" {
  if (status === "pending") return "amber";
  if (status === "approved") return "emerald";
  if (status === "paid") return "violet";
  if (status === "cancelled") return "neutral";
  return "rose";
}

export function PaymentStatusPill({
  status,
}: {
  status: PaymentStatus | TaskStatus;
}) {
  const tone = paymentStatusTone(status);
  const label =
    status === "pending"
      ? "Pending"
      : status === "approved"
        ? "Approved"
        : status === "paid"
          ? "Paid"
          : status === "cancelled"
            ? "Cancelled"
            : "Rejected";
  return <PremiumBadge tone={tone}>{label}</PremiumBadge>;
}

export function methodLabel(method: PaymentMethod): string {
  if (method === "easypaisa") return "EasyPaisa";
  if (method === "jazzcash") return "JazzCash";
  if (method === "binance") return "Binance";
  return "Admin";
}

const methodToneMap: Record<
  PaymentMethod,
  "violet" | "fuchsia" | "emerald" | "amber" | "rose" | "neutral"
> = {
  easypaisa: "emerald",
  jazzcash: "violet",
  binance: "amber",
  admin: "neutral",
};

export function MethodPill({ method }: { method: PaymentMethod }) {
  return (
    <PremiumBadge tone={methodToneMap[method]}>
      {methodLabel(method)}
    </PremiumBadge>
  );
}

/** Fee-status badge: Active (emerald), Expired (amber), None (neutral). */
export function FeeStatusFor(endDate: string | null): {
  tone: "emerald" | "amber" | "neutral";
  label: "Active" | "Expired" | "None";
} {
  if (!endDate) return { tone: "neutral", label: "None" };
  const end = new Date(endDate).getTime();
  if (isNaN(end)) return { tone: "neutral", label: "None" };
  if (end < Date.now()) return { tone: "amber", label: "Expired" };
  return { tone: "emerald", label: "Active" };
}

export function UserStatusPill({
  isBanned,
  isSuspended,
}: {
  isBanned: boolean;
  isSuspended: boolean;
}) {
  if (isBanned)
    return (
      <PremiumBadge tone="rose">
        <Ban className="h-3 w-3" />
        Banned
      </PremiumBadge>
    );
  if (isSuspended)
    return (
      <PremiumBadge tone="amber">
        <ShieldAlert className="h-3 w-3" />
        Suspended
      </PremiumBadge>
    );
  return (
    <PremiumBadge tone="emerald">
      <ShieldCheck className="h-3 w-3" />
      Active
    </PremiumBadge>
  );
}

export function JoiningFeePill({ paid }: { paid: boolean }) {
  return paid ? (
    <PremiumBadge tone="emerald">
      <CheckCircle2 className="h-3 w-3" />
      Paid
    </PremiumBadge>
  ) : (
    <PremiumBadge tone="rose">
      <XCircle className="h-3 w-3" />
      Unpaid
    </PremiumBadge>
  );
}

/** Short user id (first 8 chars). */
export function shortId(id: string): string {
  return id.slice(0, 8);
}

/** Initials avatar fallback. */
export function initialsOf(name: string, email: string): string {
  if (name) {
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1)
      return parts[0][0]?.toUpperCase() ?? "?";
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return email[0]?.toUpperCase() ?? "?";
}

/** Small spinner using currentColor. */
export function MiniSpinner({ className }: { className?: string }) {
  return (
    <span
      className={`inline-block h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent ${className ?? ""}`}
      aria-hidden
    />
  );
}
