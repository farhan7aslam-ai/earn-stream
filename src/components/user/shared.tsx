"use client";

import * as React from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  CreditCard,
  Gift,
  Sparkles,
  Wallet,
  Crown,
  ShieldAlert,
} from "lucide-react";
import { PremiumBadge } from "@/components/premium";
import { formatMoney } from "@/lib/client";
import { useCurrency } from "@/lib/currency";
import type {
  Payment,
  PaymentMethod,
  PaymentStatus,
  PaymentType,
  TaskStatus,
  TaskType,
} from "@/lib/types";

/** Map a payment type → PremiumBadge tone. NO blue/indigo. */
export function paymentTypeTone(
  type: PaymentType
): "violet" | "fuchsia" | "emerald" | "amber" | "rose" {
  switch (type) {
    case "withdrawal":
      return "rose";
    case "subscription":
      return "violet";
    case "joining_fee":
      return "amber";
    case "task_reward":
      return "emerald";
    case "referral_bonus":
      return "fuchsia";
    case "admin_credit":
      return "emerald";
    case "admin_debit":
      return "rose";
  }
}

export function paymentTypeLabel(type: PaymentType): string {
  switch (type) {
    case "withdrawal":
      return "Withdrawal";
    case "subscription":
      return "Subscription";
    case "joining_fee":
      return "Joining Fee";
    case "task_reward":
      return "Task Reward";
    case "referral_bonus":
      return "Referral Bonus";
    case "admin_credit":
      return "Admin Credit";
    case "admin_debit":
      return "Admin Debit";
  }
}

export function paymentTypeIcon(type: PaymentType): React.ReactNode {
  switch (type) {
    case "withdrawal":
      return <ArrowUpRight className="h-3.5 w-3.5" />;
    case "subscription":
      return <Crown className="h-3.5 w-3.5" />;
    case "joining_fee":
      return <Sparkles className="h-3.5 w-3.5" />;
    case "task_reward":
      return <Wallet className="h-3.5 w-3.5" />;
    case "referral_bonus":
      return <Gift className="h-3.5 w-3.5" />;
    case "admin_credit":
      return <ArrowDownLeft className="h-3.5 w-3.5" />;
    case "admin_debit":
      return <ShieldAlert className="h-3.5 w-3.5" />;
  }
}

export function statusTone(
  status: PaymentStatus | TaskStatus
): "amber" | "emerald" | "rose" {
  if (status === "pending") return "amber";
  if (status === "approved") return "emerald";
  return "rose";
}

export function methodLabel(method: PaymentMethod): string {
  if (method === "easypaisa") return "EasyPaisa";
  if (method === "jazzcash") return "JazzCash";
  if (method === "binance") return "Binance";
  return "Admin";
}

/** Colored amount cell: credits emerald (+), debits rose (-). */
export function ColoredAmount({
  amount,
  className,
}: {
  amount: number;
  className?: string;
}) {
  const { money } = useCurrency();
  const credit = amount >= 0;
  return (
    <span
      className={
        "font-semibold tabular-nums " +
        (credit ? "text-emerald-300" : "text-rose-300") +
        (className ? " " + className : "")
      }
    >
      {credit ? "+" : "−"} {money(Math.abs(amount))}
    </span>
  );
}

/** Realistic example task URLs per task type. */
export const TASK_URLS: Record<TaskType, string> = {
  gmail:
    "https://www.google.com/search?q=earnstream+micro+tasks+reviews",
  tiktok:
    "https://www.tiktok.com/@earnstream.official/video/7298745612345678901",
};

export const TASK_DESCRIPTIONS: Record<TaskType, string> = {
  gmail:
    "Visit our Gmail search page, take a screenshot showing the search results and your inbox preview. We verify by checking the timestamp and unique session signature.",
  tiktok:
    "Open the TikTok post, watch it fully (the 15s timer enforces this), like the video, and screenshot the liked state with the like button highlighted.",
};

/** Filter ledger entries by payment type. */
export function filterLedger(
  ledger: Payment[],
  type: PaymentType
): Payment[] {
  return ledger
    .filter((p) => p.type === type)
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
}

/** Compute days remaining on a subscription. Returns null if no end date. */
export function daysRemaining(endDate: string | null): number | null {
  if (!endDate) return null;
  const end = new Date(endDate).getTime();
  if (isNaN(end)) return null;
  const diff = end - Date.now();
  return Math.ceil(diff / 86400000);
}

/** Status pill for ledger rows. */
export function StatusPill({ status }: { status: PaymentStatus | TaskStatus }) {
  const tone = statusTone(status);
  const label =
    status === "pending" ? "Pending" : status === "approved" ? "Approved" : "Rejected";
  return <PremiumBadge tone={tone}>{label}</PremiumBadge>;
}

/** Type pill for ledger rows. */
export function TypePill({ type }: { type: PaymentType }) {
  return (
    <PremiumBadge tone={paymentTypeTone(type)}>
      {paymentTypeIcon(type)}
      {paymentTypeLabel(type)}
    </PremiumBadge>
  );
}
