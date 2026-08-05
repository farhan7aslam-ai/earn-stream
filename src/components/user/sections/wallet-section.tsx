"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Info,
  RefreshCw,
  TrendingUp,
  Wallet as WalletIcon,
} from "lucide-react";
import {
  EmptyState,
  GlassCard,
  GlowButton,
  PremiumBadge,
  SectionHeading,
  StatCard,
} from "@/components/premium";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDateTime } from "@/lib/client";
import { useCurrency } from "@/lib/currency";
import type { Payment, WalletSummary } from "@/lib/types";
import {
  ColoredAmount,
  StatusPill,
  TypePill,
  methodLabel,
} from "../shared";

interface WalletSectionProps {
  wallet: WalletSummary | null;
  ledger: Payment[];
  loading?: boolean;
}

export function WalletSection({
  wallet,
  ledger,
  loading,
}: WalletSectionProps) {
  const { money } = useCurrency();
  const balance = wallet?.balance ?? 0;
  const pending = wallet?.pending_earnings ?? 0;
  const withdrawn = wallet?.total_withdrawn ?? 0;

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow={<><WalletIcon className="h-3 w-3" /> Wallet</>}
        title="Wallet Ledger"
        description="Every credit and debit on your account, fully transparent. Pending earnings clear to Available when admin approves your task submissions."
      />

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <StatCard
            label="Available Balance"
            value={
              loading ? (
                <Skeleton className="h-8 w-28" />
              ) : (
                <span className="text-emerald-300">{money(balance)}</span>
              )
            }
            icon={<WalletIcon className="h-5 w-5" />}
            accent="emerald"
            hint="Ready to withdraw"
          />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.05 }}
        >
          <StatCard
            label="Pending Earnings"
            value={
              loading ? (
                <Skeleton className="h-8 w-28" />
              ) : (
                <span className="text-amber-300">{money(pending)}</span>
              )
            }
            icon={<TrendingUp className="h-5 w-5" />}
            accent="amber"
            hint="Awaiting approval"
          />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <StatCard
            label="Total Withdrawn"
            value={
              loading ? (
                <Skeleton className="h-8 w-28" />
              ) : (
                <span className="text-violet-300">{money(withdrawn)}</span>
              )
            }
            icon={<ArrowUpRight className="h-5 w-5" />}
            accent="violet"
            hint="Lifetime cashouts"
          />
        </motion.div>
      </div>

      {/* Pending explainer */}
      <GlassCard className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-500/12 text-amber-300 ring-1 ring-inset ring-amber-400/25">
            <Info className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">
              Pending → Available
            </p>
            <p className="mt-0.5 text-xs leading-relaxed text-violet-100/55">
              Pending earnings move to Available when admin approves your task
              submissions. Most reviews complete within 24 hours. Withdrawals
              are processed to EasyPaisa, JazzCash, or Binance after admin
              approval.
            </p>
          </div>
        </div>
      </GlassCard>

      {/* Ledger table */}
      <GlassCard className="p-5 sm:p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-white">
              Transaction History
            </h3>
            <p className="mt-0.5 text-xs text-violet-100/45">
              {ledger.length}{" "}
              {ledger.length === 1 ? "entry" : "entries"} · sorted by date
            </p>
          </div>
          <PremiumBadge tone="violet">
            <RefreshCw className="h-3 w-3" />
            Live · refreshes every 15s
          </PremiumBadge>
        </div>

        {loading && ledger.length === 0 ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded-lg" />
            ))}
          </div>
        ) : ledger.length === 0 ? (
          <EmptyState
            icon={<WalletIcon className="h-6 w-6" />}
            title="No active logs found"
            description="Your wallet transactions will appear here once you submit tasks, refer friends, or request withdrawals."
          />
        ) : (
          <div className="max-h-[28rem] overflow-y-auto pr-1">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="sticky top-0 z-10 bg-[rgba(20,16,32,0.95)] backdrop-blur-xl">
                  <TableRow className="border-white/8 hover:bg-transparent">
                    <TableHead className="text-violet-100/50">Date</TableHead>
                    <TableHead className="text-violet-100/50">Type</TableHead>
                    <TableHead className="text-violet-100/50">Method</TableHead>
                    <TableHead className="text-violet-100/50">Amount</TableHead>
                    <TableHead className="text-violet-100/50">Status</TableHead>
                    <TableHead className="text-violet-100/50">Balance After</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ledger.map((p, i) => (
                    <motion.tr
                      key={p.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.2, delay: Math.min(i * 0.02, 0.3) }}
                      className="border-white/5 hover:bg-white/[0.03]"
                    >
                      <TableCell>
                        <p className="text-xs text-violet-100/70">
                          {formatDateTime(p.created_at)}
                        </p>
                      </TableCell>
                      <TableCell>
                        <TypePill type={p.type} />
                      </TableCell>
                      <TableCell>
                        <span className="text-xs text-violet-100/55">
                          {methodLabel(p.method)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <ColoredAmount amount={p.amount} className="text-sm" />
                      </TableCell>
                      <TableCell>
                        <StatusPill status={p.status} />
                      </TableCell>
                      <TableCell>
                        <span className="text-xs font-medium text-violet-100/70 tabular-nums">
                          {p.balance_after !== null
                            ? money(p.balance_after)
                            : "—"}
                        </span>
                      </TableCell>
                    </motion.tr>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </GlassCard>

      {/* Mini summary tiles */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <SummaryTile
          icon={<ArrowDownLeft className="h-4 w-4" />}
          label="Total Credits"
          tone="emerald"
          value={ledger
            .filter((p) => p.amount >= 0 && p.status === "approved")
            .reduce((s, p) => s + p.amount, 0)}
        />
        <SummaryTile
          icon={<ArrowUpRight className="h-4 w-4" />}
          label="Total Debits"
          tone="rose"
          value={Math.abs(
            ledger
              .filter((p) => p.amount < 0 && p.status === "approved")
              .reduce((s, p) => s + p.amount, 0)
          )}
        />
        <SummaryTile
          icon={<RefreshCw className="h-4 w-4" />}
          label="Pending Transactions"
          tone="amber"
          count={ledger.filter((p) => p.status === "pending").length}
        />
      </div>
    </div>
  );
}

function SummaryTile({
  icon,
  label,
  tone,
  value,
  count,
}: {
  icon: React.ReactNode;
  label: string;
  tone: "emerald" | "rose" | "amber";
  value?: number;
  count?: number;
}) {
  const { money } = useCurrency();
  const toneMap = {
    emerald: "text-emerald-300 bg-emerald-500/10 ring-emerald-400/20",
    rose: "text-rose-300 bg-rose-500/10 ring-rose-400/20",
    amber: "text-amber-300 bg-amber-500/10 ring-amber-400/20",
  } as const;
  return (
    <GlassCard className="p-4">
      <div className="flex items-center gap-3">
        <span
          className={`flex h-9 w-9 items-center justify-center rounded-lg ring-1 ring-inset ${toneMap[tone]}`}
        >
          {icon}
        </span>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-violet-100/45">
            {label}
          </p>
          <p className="mt-0.5 text-lg font-bold text-white tabular-nums">
            {count !== undefined ? count : money(value ?? 0)}
          </p>
        </div>
      </div>
    </GlassCard>
  );
}
