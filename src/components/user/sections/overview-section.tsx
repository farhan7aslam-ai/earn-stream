"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  ArrowUpRight,
  CalendarClock,
  Crown,
  Gift,
  ListChecks,
  Lock,
  Sparkles,
  TrendingUp,
  Wallet as WalletIcon,
  Zap,
} from "lucide-react";
import {
  GlassCard,
  GlowButton,
  PremiumBadge,
  SectionHeading,
  StatCard,
  EmptyState,
} from "@/components/premium";
import { formatDate, formatDateTime, timeAgo } from "@/lib/client";
import { useCurrency } from "@/lib/currency";
import type {
  Payment,
  PlatformSettings,
  SafeUser,
  TaskRow,
  WalletSummary,
} from "@/lib/types";
import { PaymentDialog } from "../payment-dialog";
import { ColoredAmount, TypePill } from "../shared";

type Section = "overview" | "tasks" | "wallet" | "referrals" | "withdraw";

interface OverviewSectionProps {
  user: SafeUser;
  settings: PlatformSettings;
  wallet: WalletSummary | null;
  ledger: Payment[];
  tasks: TaskRow[];
  onNavigate: (s: Section) => void;
  onUserUpdate: (u: SafeUser) => void;
  refresh: () => void;
}

export function OverviewSection({
  user,
  settings,
  wallet,
  ledger,
  tasks,
  onNavigate,
  onUserUpdate,
}: OverviewSectionProps) {
  const { money } = useCurrency();
  const [payMode, setPayMode] = React.useState<
    "joining_fee" | "subscription" | null
  >(null);

  const balance = wallet?.balance ?? user.balance;
  const pending = wallet?.pending_earnings ?? user.pending_earnings;
  const withdrawn = wallet?.total_withdrawn ?? user.total_withdrawn;

  const subEnd = user.subscription_end_date;
  const daysLeft = subEnd
    ? Math.ceil((new Date(subEnd).getTime() - Date.now()) / 86400000)
    : null;
  const showRenew =
    !user.joining_fee_paid
      ? false
      : daysLeft === null || daysLeft < 5;

  const recentLedger = ledger.slice(0, 5);
  const pendingTasks = tasks.filter((t) => t.status === "pending").length;
  const approvedTasks = tasks.filter((t) => t.status === "approved").length;

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow={<><Zap className="h-3 w-3" /> Dashboard</>}
        title={`Welcome back, ${user.full_name?.split(" ")[0] || user.email.split("@")[0]}.`}
        description="Track your earnings, complete tasks, and cash out — all from one premium dashboard."
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
            value={<span className="text-emerald-300">{money(balance)}</span>}
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
            value={<span className="text-amber-300">{money(pending)}</span>}
            icon={<TrendingUp className="h-5 w-5" />}
            accent="amber"
            hint="Awaiting task approval"
          />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <StatCard
            label="Total Withdrawn"
            value={<span className="text-violet-300">{money(withdrawn)}</span>}
            icon={<ArrowUpRight className="h-5 w-5" />}
            accent="violet"
            hint="Lifetime cashouts"
          />
        </motion.div>
      </div>

      {/* Joining fee / subscription row */}
      {!user.joining_fee_paid ? (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <GlassCard
            variant="panel"
            border="gradient"
            glow="soft"
            className="overflow-hidden p-0"
          >
            <div className="relative grid grid-cols-1 gap-6 p-6 sm:p-7 md:grid-cols-[1fr_auto] md:items-center">
              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400/30 to-orange-500/10 text-amber-300 ring-1 ring-white/10">
                  <Lock className="h-7 w-7" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-lg font-bold text-white">
                      {user.joining_fee_status === "rejected"
                        ? "Joining fee rejected — resubmit"
                        : "Pay your joining fee to unlock earning"}
                    </h3>
                    <PremiumBadge tone={user.joining_fee_status === "rejected" ? "rose" : "amber"}>
                      {user.joining_fee_status === "rejected" ? "Rejected" : "Required"}
                    </PremiumBadge>
                  </div>
                  <p className="mt-1 text-sm leading-relaxed text-violet-100/55">
                    {user.joining_fee_status === "rejected" ? (
                      <>
                        Your previous payment screenshot was rejected by an
                        admin. Please send{" "}
                        <span className="font-semibold text-amber-300">
                          {money(settings.joining_fee)}
                        </span>{" "}
                        again and upload a valid screenshot for re-verification.
                      </>
                    ) : (
                      <>
                        A one-time fee of{" "}
                        <span className="font-semibold text-amber-300">
                          {money(settings.joining_fee)}
                        </span>{" "}
                        unlocks task submissions, withdrawals, and the referral
                        program. Upload your payment screenshot for admin
                        verification.
                      </>
                    )}
                  </p>
                </div>
              </div>
              <div className="flex flex-col items-stretch gap-2 md:items-end">
                <GlowButton
                  variant="gold"
                  size="lg"
                  onClick={() => setPayMode("joining_fee")}
                  className="w-full md:w-auto"
                >
                  <Sparkles className="h-4 w-4" />
                  {user.joining_fee_status === "rejected"
                    ? "Resubmit Payment"
                    : `Pay ${money(settings.joining_fee)}`}
                  <ArrowRight className="h-4 w-4" />
                </GlowButton>
                <p className="text-[11px] text-violet-100/40">
                  EasyPaisa · JazzCash · Binance · Screenshot required
                </p>
              </div>
            </div>
          </GlassCard>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <GlassCard variant="panel" border="gradient" className="p-5 sm:p-6">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500/30 to-fuchsia-500/10 text-violet-300 ring-1 ring-white/10">
                  <Crown className="h-6 w-6" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-base font-bold text-white">
                      Subscription Status
                    </h3>
                    <PremiumBadge tone={daysLeft !== null && daysLeft < 5 ? "amber" : "emerald"}>
                      <CalendarClock className="h-3 w-3" />
                      {daysLeft !== null && daysLeft < 0
                        ? "Expired"
                        : daysLeft !== null
                          ? `${daysLeft} days left`
                          : "Lifetime"}
                    </PremiumBadge>
                  </div>
                  <p className="mt-1 text-sm text-violet-100/55">
                    {subEnd ? (
                      <>
                        Active until{" "}
                        <span className="font-semibold text-violet-200">
                          {formatDate(subEnd)}
                        </span>
                        . {daysLeft !== null && daysLeft < 5 && daysLeft >= 0
                          ? "Renew soon to keep earning."
                          : daysLeft !== null && daysLeft < 0
                            ? "Your subscription has expired — renew now."
                            : "You're all set."}
                      </>
                    ) : (
                      "Lifetime access — no renewal needed."
                    )}
                  </p>
                </div>
              </div>
              {showRenew && (
                <GlowButton
                  variant="primary"
                  onClick={() => setPayMode("subscription")}
                  className="w-full sm:w-auto"
                >
                  <Crown className="h-4 w-4" />
                  Renew Subscription
                </GlowButton>
              )}
            </div>
          </GlassCard>
        </motion.div>
      )}

      {/* Quick actions */}
      <div>
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-violet-100/40">
          Quick Actions
        </p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <QuickAction
            icon={<ListChecks className="h-5 w-5" />}
            label="Submit a Task"
            description={`Earn ${money(settings.gmail_task_rate)}+ per task`}
            tone="violet"
            onClick={() => onNavigate("tasks")}
          />
          <QuickAction
            icon={<Gift className="h-5 w-5" />}
            label="Refer a Friend"
            description={`${settings.referral_bonus_percent}% bonus per referral`}
            tone="fuchsia"
            onClick={() => onNavigate("referrals")}
          />
          <QuickAction
            icon={<ArrowUpRight className="h-5 w-5" />}
            label="Withdraw Earnings"
            description={`${money(balance)} available`}
            tone="emerald"
            onClick={() => onNavigate("withdraw")}
          />
        </div>
      </div>

      {/* Recent activity */}
      <GlassCard className="p-5 sm:p-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white">Recent Activity</h3>
            <p className="mt-0.5 text-xs text-violet-100/45">
              Your last 5 wallet transactions
            </p>
          </div>
          <GlowButton
            variant="ghost"
            size="sm"
            onClick={() => onNavigate("wallet")}
          >
            View all
            <ArrowRight className="h-3.5 w-3.5" />
          </GlowButton>
        </div>

        {recentLedger.length === 0 ? (
          <EmptyState
            icon={<WalletIcon className="h-6 w-6" />}
            title="No transactions yet"
            description="Once you submit tasks or refer friends, your wallet activity will show up here."
            action={
              <GlowButton size="sm" onClick={() => onNavigate("tasks")}>
                <ListChecks className="h-4 w-4" />
                Start your first task
              </GlowButton>
            }
          />
        ) : (
          <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
            {recentLedger.map((p, i) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.25, delay: i * 0.04 }}
                className="flex items-center gap-3 rounded-xl bg-white/[0.02] px-3 py-2.5 ring-1 ring-inset ring-white/5 transition hover:bg-white/[0.04]"
              >
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <TypePill type={p.type} />
                    {p.note && (
                      <span className="truncate text-[11px] text-violet-100/40">
                        {p.note}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-violet-100/40">
                    {formatDateTime(p.created_at)} · {timeAgo(p.created_at)}
                  </p>
                </div>
                <ColoredAmount amount={p.amount} className="text-sm" />
              </motion.div>
            ))}
          </div>
        )}
      </GlassCard>

      {/* Mini summary */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <MiniStat
          label="Total Tasks"
          value={tasks.length}
          tone="violet"
          icon={<ListChecks className="h-4 w-4" />}
        />
        <MiniStat
          label="Pending"
          value={pendingTasks}
          tone="amber"
          icon={<CalendarClock className="h-4 w-4" />}
        />
        <MiniStat
          label="Approved"
          value={approvedTasks}
          tone="emerald"
          icon={<Sparkles className="h-4 w-4" />}
        />
        <MiniStat
          label="Lifetime Earnings"
          value={money(balance + pending + withdrawn)}
          tone="fuchsia"
          icon={<TrendingUp className="h-4 w-4" />}
        />
      </div>

      {payMode && (
        <PaymentDialog
          open={payMode !== null}
          onOpenChange={(o) => !o && setPayMode(null)}
          mode={payMode}
          settings={settings}
          onPaid={(u) => onUserUpdate(u)}
        />
      )}
    </div>
  );
}

function QuickAction({
  icon,
  label,
  description,
  tone,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  description: string;
  tone: "violet" | "fuchsia" | "emerald";
  onClick: () => void;
}) {
  const toneMap = {
    violet: "from-violet-500/20 to-fuchsia-500/5 text-violet-300 group-hover:glow-violet",
    fuchsia: "from-fuchsia-500/20 to-rose-500/5 text-fuchsia-300",
    emerald: "from-emerald-500/20 to-teal-500/5 text-emerald-300 group-hover:glow-emerald",
  } as const;
  return (
    <GlassCard interactive className="group p-5" onClick={onClick}>
      <div
        className={`mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ring-1 ring-white/10 ${toneMap[tone]}`}
      >
        {icon}
      </div>
      <p className="text-sm font-semibold text-white">{label}</p>
      <p className="mt-1 text-xs text-violet-100/50">{description}</p>
      <div className="mt-3 flex items-center gap-1 text-xs font-medium text-violet-300 transition group-hover:gap-2">
        Open <ArrowRight className="h-3 w-3" />
      </div>
    </GlassCard>
  );
}

function MiniStat({
  label,
  value,
  tone,
  icon,
}: {
  label: string;
  value: React.ReactNode;
  tone: "violet" | "fuchsia" | "emerald" | "amber";
  icon: React.ReactNode;
}) {
  const toneMap = {
    violet: "text-violet-300 bg-violet-500/10 ring-violet-400/20",
    fuchsia: "text-fuchsia-300 bg-fuchsia-500/10 ring-fuchsia-400/20",
    emerald: "text-emerald-300 bg-emerald-500/10 ring-emerald-400/20",
    amber: "text-amber-300 bg-amber-500/10 ring-amber-400/20",
  } as const;
  return (
    <GlassCard className="p-4">
      <div className="flex items-center gap-2">
        <span
          className={`flex h-7 w-7 items-center justify-center rounded-lg ring-1 ring-inset ${toneMap[tone]}`}
        >
          {icon}
        </span>
        <p className="text-[10px] font-semibold uppercase tracking-wider text-violet-100/45">
          {label}
        </p>
      </div>
      <p className="mt-2 text-lg font-bold text-white tabular-nums">{value}</p>
    </GlassCard>
  );
}
