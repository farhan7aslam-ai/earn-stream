"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  ArrowDownToLine,
  ArrowUpRight,
  Banknote,
  CheckCircle2,
  Clock,
  Info,
  Send,
  ShieldCheck,
  Wallet as WalletIcon,
  XCircle,
} from "lucide-react";
import {
  EmptyState,
  GlassCard,
  GlowButton,
  PremiumBadge,
  SectionHeading,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { apiFetch, formatDateTime, timeAgo } from "@/lib/client";
import { useCurrency } from "@/lib/currency";
import { toast } from "sonner";
import type {
  Payment,
  PaymentMethod,
  PaymentStatus,
  PlatformSettings,
  SafeUser,
  WalletSummary,
} from "@/lib/types";
import { ColoredAmount, methodLabel, statusTone } from "../shared";

interface WithdrawSectionProps {
  user: SafeUser;
  settings: PlatformSettings;
  wallet: WalletSummary | null;
  ledger: Payment[];
  refresh: () => void;
}

const MIN_WITHDRAWAL = 50;

export function WithdrawSection({
  user,
  settings,
  wallet,
  ledger,
  refresh,
}: WithdrawSectionProps) {
  const { money, symbol } = useCurrency();
  const [amount, setAmount] = React.useState("");
  const [method, setMethod] = React.useState<PaymentMethod>("easypaisa");
  const [account, setAccount] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  const balance = wallet?.balance ?? user.balance;
  const amt = Number(amount) || 0;
  const tooLow = amt < MIN_WITHDRAWAL;
  const tooHigh = amt > balance;
  const canSubmit =
    amt > 0 && !tooLow && !tooHigh && account.trim().length >= 4 && !loading;

  const merchantNumber =
    method === "easypaisa"
      ? settings.easypaisa_number
      : method === "jazzcash"
        ? settings.jazzcash_number
        : settings.binance_id;

  const withdrawals = ledger
    .filter((p) => p.type === "withdrawal")
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

  const pendingWithdrawals = withdrawals.filter(
    (p) => p.status === "pending"
  ).length;
  const approvedWithdrawals = withdrawals.filter(
    (p) => p.status === "approved"
  ).length;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setLoading(true);
    try {
      await apiFetch<{ payment: Payment }>("/api/wallet/withdraw", {
        method: "POST",
        body: JSON.stringify({
          amount: amt,
          method,
          account: account.trim(),
        }),
      });
      toast.success("Withdrawal requested! Admin will process it shortly.");
      setAmount("");
      setAccount("");
      refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Withdrawal failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow={<><ArrowDownToLine className="h-3 w-3" /> Cashout</>}
        title="Withdrawal Portal"
        description="Cash out your available balance to EasyPaisa, JazzCash, or Binance. Requests are reviewed and processed by our admin team."
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_0.85fr]">
        {/* Form */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <GlassCard
            variant="panel"
            border="gradient"
            glow="soft"
            className="p-6 sm:p-7"
          >
            <div className="mb-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500/30 to-teal-500/10 text-emerald-300 ring-1 ring-white/10">
                  <WalletIcon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-medium text-violet-100/55">
                    Available to withdraw
                  </p>
                  <p className="text-2xl font-bold text-emerald-300">
                    {money(balance)}
                  </p>
                </div>
              </div>
              <PremiumBadge tone="emerald">
                <ShieldCheck className="h-3 w-3" />
                Secured
              </PremiumBadge>
            </div>

            <form onSubmit={submit} className="space-y-4">
              <div className="space-y-1.5">
                <Label className="flex items-center justify-between text-xs font-medium text-violet-100/70">
                  <span className="flex items-center gap-1.5">
                    <Banknote className="h-3.5 w-3.5" />
                    Amount ({symbol})
                  </span>
                  <button
                    type="button"
                    onClick={() => setAmount(String(balance))}
                    className="text-[11px] font-semibold text-violet-300 transition hover:text-violet-200"
                  >
                    Max: {money(balance)}
                  </button>
                </Label>
                <Input
                  type="number"
                  min={MIN_WITHDRAWAL}
                  max={balance}
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder={`Min ${symbol} ${MIN_WITHDRAWAL}`}
                  className="border-white/10 bg-white/5 text-white placeholder:text-violet-100/30"
                />
                {amt > 0 && tooLow && (
                  <p className="text-[11px] text-amber-300/80">
                    Minimum withdrawal is {symbol} {MIN_WITHDRAWAL}.
                  </p>
                )}
                {tooHigh && (
                  <p className="text-[11px] text-rose-300/80">
                    Exceeds your available balance.
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-violet-100/70">
                  Payment Method
                </Label>
                <Select
                  value={method}
                  onValueChange={(v) => setMethod(v as PaymentMethod)}
                >
                  <SelectTrigger className="w-full border-white/10 bg-white/5 text-white">
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

              {/* Merchant helper */}
              <div className="rounded-xl border border-white/8 bg-white/[0.02] p-3">
                <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-violet-100/40">
                  Send your cashout to
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-violet-100/55">
                    {methodLabel(method)}{" "}
                    {method === "binance" ? "ID" : "number"}
                  </span>
                  <span className="font-mono text-sm font-semibold text-violet-100">
                    {merchantNumber || "—"}
                  </span>
                </div>
              </div>

              <GlowButton
                type="submit"
                size="lg"
                variant="success"
                className="w-full"
                disabled={!canSubmit}
              >
                {loading ? (
                  "Processing…"
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Request Withdrawal{amt > 0 && !tooHigh && !tooLow ? ` · ${money(amt)}` : ""}
                  </>
                )}
              </GlowButton>

              <p className="flex items-center justify-center gap-1.5 text-[11px] text-violet-100/40">
                <Info className="h-3 w-3" />
                Minimum {symbol} {MIN_WITHDRAWAL} · Processed within 24 hours
              </p>
            </form>
          </GlassCard>
        </motion.div>

        {/* Summary */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.06 }}
          className="space-y-4"
        >
          <GlassCard className="p-5">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-violet-100/45">
              Withdrawal summary
            </p>
            <div className="mt-3 space-y-3">
              <SummaryRow
                icon={<Clock className="h-4 w-4" />}
                label="Pending"
                value={pendingWithdrawals}
                tone="amber"
              />
              <SummaryRow
                icon={<CheckCircle2 className="h-4 w-4" />}
                label="Approved"
                value={approvedWithdrawals}
                tone="emerald"
              />
              <SummaryRow
                icon={<ArrowUpRight className="h-4 w-4" />}
                label="Total cashed out"
                value={money(user.total_withdrawn)}
                tone="violet"
              />
            </div>
          </GlassCard>

          <GlassCard className="p-5">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-500/12 text-violet-300 ring-1 ring-inset ring-violet-400/25">
                <Info className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">
                  How withdrawals work
                </p>
                <p className="mt-1 text-xs leading-relaxed text-violet-100/55">
                  Requests are sent to admin for approval. Once approved, the
                  amount is debited from your balance and transferred to your
                  payment account. Most requests complete within 24 hours.
                </p>
              </div>
            </div>
          </GlassCard>
        </motion.div>
      </div>

      {/* Withdrawal history */}
      <GlassCard className="p-5 sm:p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-white">
              Withdrawal History
            </h3>
            <p className="mt-0.5 text-xs text-violet-100/45">
              All your cashout requests, newest first
            </p>
          </div>
          <PremiumBadge tone="violet">
            <ArrowUpRight className="h-3 w-3" />
            {withdrawals.length}{" "}
            {withdrawals.length === 1 ? "request" : "requests"}
          </PremiumBadge>
        </div>

        {withdrawals.length === 0 ? (
          <EmptyState
            icon={<ArrowDownToLine className="h-6 w-6" />}
            title="No active logs found"
            description="Your withdrawal history will appear here once you request a cashout."
          />
        ) : (
          <div className="max-h-[28rem] overflow-y-auto pr-1">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="sticky top-0 z-10 bg-[rgba(20,16,32,0.95)] backdrop-blur-xl">
                  <TableRow className="border-white/8 hover:bg-transparent">
                    <TableHead className="text-violet-100/50">Date</TableHead>
                    <TableHead className="text-violet-100/50">Amount</TableHead>
                    <TableHead className="text-violet-100/50">Method</TableHead>
                    <TableHead className="text-violet-100/50">Account</TableHead>
                    <TableHead className="text-violet-100/50">Status</TableHead>
                    <TableHead className="text-violet-100/50">Processed</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {withdrawals.map((p) => (
                    <WithdrawRow key={p.id} payment={p} />
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </GlassCard>
    </div>
  );
}

function WithdrawRow({ payment }: { payment: Payment }) {
  const tone = statusTone(payment.status);
  return (
    <TableRow className="border-white/5 hover:bg-white/[0.03]">
      <TableCell>
        <p className="text-xs text-violet-100/70">
          {formatDateTime(payment.created_at)}
        </p>
        <p className="text-[10px] text-violet-100/40">
          {timeAgo(payment.created_at)}
        </p>
      </TableCell>
      <TableCell>
        <ColoredAmount amount={payment.amount} className="text-sm" />
      </TableCell>
      <TableCell>
        <span className="text-xs text-violet-100/55">
          {methodLabel(payment.method)}
        </span>
      </TableCell>
      <TableCell>
        <span className="font-mono text-[11px] text-violet-100/55">
          {payment.account}
        </span>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-1.5">
          {payment.status === "pending" && (
            <Clock className="h-3 w-3 text-amber-300" />
          )}
          {payment.status === "approved" && (
            <CheckCircle2 className="h-3 w-3 text-emerald-300" />
          )}
          {payment.status === "rejected" && (
            <XCircle className="h-3 w-3 text-rose-300" />
          )}
          <PremiumBadge tone={tone}>
            {payment.status[0].toUpperCase() + payment.status.slice(1)}
          </PremiumBadge>
        </div>
      </TableCell>
      <TableCell>
        <p className="text-xs text-violet-100/70">
          {payment.processed_at ? formatDateTime(payment.processed_at) : "—"}
        </p>
      </TableCell>
    </TableRow>
  );
}

function SummaryRow({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  tone: "amber" | "emerald" | "violet";
}) {
  const toneMap = {
    amber: "text-amber-300 bg-amber-500/10 ring-amber-400/20",
    emerald: "text-emerald-300 bg-emerald-500/10 ring-emerald-400/20",
    violet: "text-violet-300 bg-violet-500/10 ring-violet-400/20",
  } as const;
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span
          className={`flex h-7 w-7 items-center justify-center rounded-lg ring-1 ring-inset ${toneMap[tone]}`}
        >
          {icon}
        </span>
        <span className="text-xs text-violet-100/55">{label}</span>
      </div>
      <span className="text-sm font-bold text-white tabular-nums">{value}</span>
    </div>
  );
}
