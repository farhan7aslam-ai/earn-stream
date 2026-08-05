"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  CreditCard,
  Lock,
  CheckCircle2,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { apiFetch, formatDate } from "@/lib/client";
import { useCurrency } from "@/lib/currency";
import {
  GlassCard,
  GlowButton,
  PremiumBadge,
} from "@/components/premium";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import type { PlatformSettings, SafeUser, PaymentMethod } from "@/lib/types";

interface PaymentRequiredProps {
  user: SafeUser;
  settings: PlatformSettings;
  onPaid: (user: SafeUser) => void;
  onLogout: () => void;
}

export function PaymentRequired({
  user,
  settings,
  onPaid,
  onLogout,
}: PaymentRequiredProps) {
  const { money } = useCurrency();
  const [method, setMethod] = React.useState<PaymentMethod>("easypaisa");
  const [account, setAccount] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  const merchantNumber =
    method === "easypaisa"
      ? settings.easypaisa_number
      : method === "jazzcash"
        ? settings.jazzcash_number
        : settings.binance_id;

  async function pay() {
    if (!account.trim()) {
      toast.error("Enter your account number / ID");
      return;
    }
    setLoading(true);
    try {
      const { user: updated } = await apiFetch<{ user: SafeUser }>(
        "/api/subscription/pay",
        {
          method: "POST",
          body: JSON.stringify({ method, account: account.trim() }),
        }
      );
      toast.success("Subscription activated! Redirecting…");
      onPaid(updated);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Payment failed");
    } finally {
      setLoading(false);
    }
  }

  const daysOverdue = user.subscription_end_date
    ? Math.max(
        0,
        Math.floor(
          (Date.now() - new Date(user.subscription_end_date).getTime()) /
            86400000
        )
      )
    : null;

  return (
    <div className="relative flex min-h-screen items-center justify-center px-5 py-10">
      <motion.div
        initial={{ opacity: 0, y: 14, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-2xl"
      >
        <GlassCard variant="panel" border="gradient" glow="fuchsia" className="p-7 sm:p-10">
          <div className="flex flex-col items-center text-center">
            <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-fuchsia-500/30 to-rose-500/10 text-fuchsia-300 ring-1 ring-white/10">
              <Lock className="h-8 w-8" />
            </div>
            <PremiumBadge tone="rose" className="mb-3">
              Account Suspended
            </PremiumBadge>
            <h1 className="text-3xl font-bold tracking-tight text-white">
              Subscription Renewal Required
            </h1>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-violet-100/55">
              {daysOverdue !== null ? (
                <>
                  Your subscription expired{" "}
                  <span className="font-semibold text-rose-300">
                    {daysOverdue === 0 ? "today" : `${daysOverdue} days ago`}
                  </span>{" "}
                  ({formatDate(user.subscription_end_date)}). Renew now to
                  restore full access to your wallet, tasks, and withdrawals.
                </>
              ) : (
                <>
                  Activate your monthly subscription to unlock tasks,
                  withdrawals, and the referral program.
                </>
              )}
            </p>
          </div>

          {/* fee breakdown */}
          <div className="mt-7 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <FeeLine
              label="Monthly Fee"
              value={money(settings.subscription_fee)}
              accent="violet"
            />
            <FeeLine
              label="Duration"
              value={`${settings.subscription_duration_days} days`}
              accent="emerald"
            />
            <FeeLine
              label="Status"
              value={user.subscription_end_date ? "Expired" : "Inactive"}
              accent="rose"
            />
          </div>

          {/* payment instructions */}
          <div className="mt-6 rounded-2xl border border-white/8 bg-white/[0.02] p-5">
            <div className="mb-3 flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-violet-300" />
              <h3 className="text-sm font-semibold text-white">
                Payment Instructions
              </h3>
            </div>
            <ol className="space-y-2 text-xs leading-relaxed text-violet-100/60">
              <li className="flex gap-2">
                <span className="font-semibold text-violet-300">1.</span>
                Send{" "}
                <span className="font-semibold text-white">
                  {money(settings.subscription_fee)}
                </span>{" "}
                to the merchant{" "}
                <span className="font-semibold text-fuchsia-300">
                  {method === "binance" ? "Binance ID" : "number"}
                </span>{" "}
                below.
              </li>
              <li className="flex gap-2">
                <span className="font-semibold text-violet-300">2.</span>
                Enter <em>your</em> {method} account that you paid from.
              </li>
              <li className="flex gap-2">
                <span className="font-semibold text-violet-300">3.</span>
                Click <span className="font-semibold text-white">Activate</span>{" "}
                — your account is restored instantly.
              </li>
            </ol>
            <div className="mt-3 rounded-lg bg-violet-500/8 px-3 py-2 text-xs ring-1 ring-inset ring-violet-400/20">
              <span className="text-violet-200/60">
                Merchant {method === "binance" ? "Binance ID" : "Number"}:{" "}
              </span>
              <span className="font-mono font-semibold text-violet-100">
                {merchantNumber || "—"}
              </span>
            </div>
          </div>

          {/* form */}
          <div className="mt-6 space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-violet-100/70">
                Payment Method
              </Label>
              <Select value={method} onValueChange={(v) => setMethod(v as PaymentMethod)}>
                <SelectTrigger className="border-white/10 bg-white/5 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="border-white/10 bg-[rgba(20,16,32,0.95)] backdrop-blur-xl">
                  <SelectItem value="easypaisa">EasyPaisa</SelectItem>
                  <SelectItem value="jazzcash">JazzCash</SelectItem>
                  <SelectItem value="binance">Binance</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-violet-100/70">
                Your {method === "binance" ? "Binance ID" : "Account Number"}
              </Label>
              <Input
                value={account}
                onChange={(e) => setAccount(e.target.value)}
                placeholder={
                  method === "binance" ? "Your Binance ID" : "03XX-XXXXXXX"
                }
                className="border-white/10 bg-white/5 text-white placeholder:text-violet-100/30"
              />
            </div>
            <GlowButton
              onClick={pay}
              size="lg"
              variant="gold"
              className="w-full"
              disabled={loading}
            >
              <Sparkles className="h-4 w-4" />
              {loading
                ? "Activating…"
                : `Activate — ${money(settings.subscription_fee)}`}
              {!loading && <ArrowRight className="h-4 w-4" />}
            </GlowButton>
            <button
              onClick={onLogout}
              className="block w-full text-center text-xs text-violet-100/40 transition hover:text-violet-100/70"
            >
              Sign out instead
            </button>
          </div>

          <div className="mt-5 flex items-center justify-center gap-2 text-[11px] text-violet-100/40">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
            Secure, instant activation · Wallet restored immediately
          </div>
        </GlassCard>
      </motion.div>
    </div>
  );
}

function FeeLine({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent: "violet" | "emerald" | "rose";
}) {
  const tone =
    accent === "violet"
      ? "from-violet-500/15 to-violet-500/5 text-violet-200"
      : accent === "emerald"
        ? "from-emerald-500/15 to-emerald-500/5 text-emerald-200"
        : "from-rose-500/15 to-rose-500/5 text-rose-200";
  return (
    <div
      className={`rounded-xl bg-gradient-to-br ${tone} p-3 text-center ring-1 ring-inset ring-white/8`}
    >
      <p className="text-[10px] uppercase tracking-wider opacity-70">{label}</p>
      <p className="mt-1 text-sm font-bold">{value}</p>
    </div>
  );
}
