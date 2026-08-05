"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  Activity,
  ArrowRight,
  Ban,
  CalendarClock,
  ClipboardCheck,
  DollarSign,
  Gauge,
  ListChecks,
  PauseCircle,
  Settings as SettingsIcon,
  ShieldCheck,
  TrendingUp,
  UserCheck,
  Users,
  Wallet,
} from "lucide-react";
import {
  EmptyState,
  GlassCard,
  GlowButton,
  PremiumBadge,
  SectionHeading,
  StatCard,
} from "@/components/premium";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { apiFetch, timeAgo } from "@/lib/client";
import { useCurrency } from "@/lib/currency";
import type {
  AdminStats,
  PlatformSettings,
  SafeUser,
} from "@/lib/types";

type AdminSection =
  | "dashboard"
  | "tasks"
  | "joining_fees"
  | "users"
  | "withdrawals"
  | "settings";

interface DashboardSectionProps {
  user: SafeUser;
  settings: PlatformSettings;
  stats: AdminStats | null;
  loadingStats: boolean;
  onNavigate: (s: AdminSection) => void;
}

export function DashboardSection({
  user,
  settings,
  stats,
  loadingStats,
  onNavigate,
}: DashboardSectionProps) {
  const { money } = useCurrency();
  const monthlyLimit = settings.monthly_signup_limit;
  const used = stats?.monthly_signups ?? 0;
  const pct =
    monthlyLimit > 0
      ? Math.min(100, Math.round((used / monthlyLimit) * 100))
      : null;

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow={
          <>
            <Activity className="h-3 w-3" /> Admin Dashboard
          </>
        }
        title={`Console overview, ${user.full_name?.split(" ")[0] || user.email.split("@")[0]}.`}
        description="Real-time pulse of your platform — revenue, signups, pending reviews, and wallet exposure. Numbers refresh every 12 seconds."
      />

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <StatCard
            label="Total Users"
            value={
              loadingStats ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                stats?.total_users ?? 0
              )
            }
            icon={<Users className="h-5 w-5" />}
            accent="violet"
            hint="Registered accounts"
          />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.05 }}
        >
          <StatCard
            label="Active Users"
            value={
              loadingStats ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                stats?.active_users ?? 0
              )
            }
            icon={<UserCheck className="h-5 w-5" />}
            accent="emerald"
            hint="In good standing"
          />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <StatCard
            label="Total Revenue"
            value={
              loadingStats ? (
                <Skeleton className="h-8 w-28" />
              ) : (
                <span className="text-amber-300">
                  {money(stats?.total_revenue ?? 0)}
                </span>
              )
            }
            icon={<DollarSign className="h-5 w-5" />}
            accent="amber"
            hint="Lifetime processed"
          />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.15 }}
        >
          <StatCard
            label="Pending Withdrawals"
            value={
              loadingStats ? (
                <Skeleton className="h-8 w-28" />
              ) : (
                <span className="text-fuchsia-300">
                  {money(stats?.pending_withdrawals ?? 0)}
                </span>
              )
            }
            icon={<Wallet className="h-5 w-5" />}
            accent="fuchsia"
            hint={`${stats?.pending_withdrawals_count ?? 0} awaiting review`}
          />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <StatCard
            label="Pending Tasks"
            value={
              loadingStats ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <span className="text-rose-300">
                  {stats?.pending_tasks_count ?? 0}
                </span>
              )
            }
            icon={<ListChecks className="h-5 w-5" />}
            accent="rose"
            hint="Awaiting verification"
          />
        </motion.div>
      </div>

      {/* System health + Quick actions */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* System health — takes 2 cols */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="lg:col-span-2"
        >
          <GlassCard variant="panel" border="gradient" className="p-5 sm:p-6">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500/30 to-fuchsia-500/10 text-violet-300 ring-1 ring-white/10">
                  <Gauge className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    System Health
                  </h3>
                  <p className="text-[11px] text-violet-100/45">
                    Monthly capacity & risk exposure
                  </p>
                </div>
              </div>
              <PremiumBadge tone="violet">
                <CalendarClock className="h-3 w-3" />
                Live
              </PremiumBadge>
            </div>

            {/* Monthly signup capacity */}
            <div className="mb-5 rounded-2xl border border-white/8 bg-white/[0.02] p-4">
              <div className="mb-2 flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-violet-100/55">
                    Monthly Signups
                  </p>
                  <p className="mt-0.5 text-[11px] text-violet-100/40">
                    {monthlyLimit === 0
                      ? "Unlimited capacity"
                      : "Resets monthly · enforced at signup"}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-white tabular-nums">
                    {used}
                    <span className="text-base font-medium text-violet-100/40">
                      {monthlyLimit === 0 ? " / ∞" : ` / ${monthlyLimit}`}
                    </span>
                  </p>
                  {monthlyLimit > 0 && (
                    <p className="text-[11px] text-violet-100/45">
                      {pct}% used
                    </p>
                  )}
                </div>
              </div>
              {monthlyLimit > 0 ? (
                <Progress
                  value={pct ?? 0}
                  className="h-2 bg-white/10 [&>div]:bg-gradient-to-r [&>div]:from-violet-400 [&>div]:to-fuchsia-500"
                />
              ) : (
                <div className="h-2 w-full rounded-full bg-gradient-to-r from-emerald-500/40 to-teal-500/30" />
              )}
            </div>

            {/* Risk tiles */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <HealthTile
                icon={<PauseCircle className="h-4 w-4" />}
                label="Suspended"
                tone="amber"
                value={stats?.suspended_users ?? 0}
              />
              <HealthTile
                icon={<Ban className="h-4 w-4" />}
                label="Banned"
                tone="rose"
                value={stats?.banned_users ?? 0}
              />
              <HealthTile
                icon={<TrendingUp className="h-4 w-4" />}
                label="Balance Owed"
                tone="emerald"
                value={money(stats?.total_balance_owed ?? 0)}
              />
            </div>
          </GlassCard>
        </motion.div>

        {/* Quick actions */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.05 }}
        >
          <GlassCard className="p-5 sm:p-6">
            <div className="mb-4 flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500/30 to-orange-500/10 text-amber-300 ring-1 ring-white/10">
                <ClipboardCheck className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  Quick Actions
                </h3>
                <p className="text-[11px] text-violet-100/45">
                  Jump straight into reviews
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <QuickActionRow
                icon={<ListChecks className="h-4 w-4" />}
                title="Verify tasks"
                subtitle={`${stats?.pending_tasks_count ?? 0} pending submissions`}
                tone="violet"
                onClick={() => onNavigate("tasks")}
              />
              <QuickActionRow
                icon={<ShieldCheck className="h-4 w-4" />}
                title="Verify joining fees"
                subtitle={`${stats?.pending_joining_fees_count ?? 0} awaiting review`}
                tone="amber"
                onClick={() => onNavigate("joining_fees")}
              />
              <QuickActionRow
                icon={<Wallet className="h-4 w-4" />}
                title="Review withdrawals"
                subtitle={`${stats?.pending_withdrawals_count ?? 0} awaiting payout`}
                tone="fuchsia"
                onClick={() => onNavigate("withdrawals")}
              />
              <QuickActionRow
                icon={<Users className="h-4 w-4" />}
                title="Manage users"
                subtitle="Balances, bans, subscriptions"
                tone="emerald"
                onClick={() => onNavigate("users")}
              />
              <QuickActionRow
                icon={<SettingsIcon className="h-4 w-4" />}
                title="Platform settings"
                subtitle="Limits, fees, task rates"
                tone="amber"
                onClick={() => onNavigate("settings")}
              />
            </div>
          </GlassCard>
        </motion.div>
      </div>

      {/* Recent Signups preview */}
      <RecentSignupsCard onNavigate={onNavigate} />
    </div>
  );
}

function HealthTile({
  icon,
  label,
  tone,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  tone: "amber" | "rose" | "emerald";
  value: React.ReactNode;
}) {
  const toneMap = {
    amber: "from-amber-500/15 to-amber-500/5 text-amber-300 ring-amber-400/20",
    rose: "from-rose-500/15 to-rose-500/5 text-rose-300 ring-rose-400/20",
    emerald:
      "from-emerald-500/15 to-emerald-500/5 text-emerald-300 ring-emerald-400/20",
  } as const;
  return (
    <div className="rounded-xl border border-white/8 bg-white/[0.02] p-3">
      <div
        className={`mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br ring-1 ring-inset ${toneMap[tone]}`}
      >
        {icon}
      </div>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-violet-100/45">
        {label}
      </p>
      <p className="mt-0.5 text-lg font-bold text-white tabular-nums">{value}</p>
    </div>
  );
}

function QuickActionRow({
  icon,
  title,
  subtitle,
  tone,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  tone: "violet" | "fuchsia" | "emerald" | "amber";
  onClick: () => void;
}) {
  const toneMap = {
    violet: "from-violet-500/15 to-fuchsia-500/5 text-violet-300",
    fuchsia: "from-fuchsia-500/15 to-rose-500/5 text-fuchsia-300",
    emerald: "from-emerald-500/15 to-teal-500/5 text-emerald-300",
    amber: "from-amber-500/15 to-orange-500/5 text-amber-300",
  } as const;
  return (
    <button
      onClick={onClick}
      className="group flex w-full items-center gap-3 rounded-xl border border-white/8 bg-white/[0.02] p-3 text-left transition hover:border-white/15 hover:bg-white/[0.04]"
    >
      <div
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ring-1 ring-inset ring-white/10 ${toneMap[tone]}`}
      >
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-white">{title}</p>
        <p className="truncate text-[11px] text-violet-100/45">{subtitle}</p>
      </div>
      <ArrowRight className="h-4 w-4 shrink-0 text-violet-300 transition group-hover:translate-x-0.5" />
    </button>
  );
}

interface SignupPreview {
  id: string;
  full_name: string;
  email: string;
  created_at: string;
  joining_fee_paid: boolean;
}

function RecentSignupsCard({
  onNavigate,
}: {
  onNavigate: (s: AdminSection) => void;
}) {
  const [users, setUsers] = React.useState<SignupPreview[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { users: list } = await apiFetch<{ users: SignupPreview[] }>(
          "/api/admin/users/list?search="
        );
        if (cancelled) return;
        const recent = [...list]
          .sort(
            (a, b) =>
              new Date(b.created_at).getTime() -
              new Date(a.created_at).getTime()
          )
          .slice(0, 5);
        setUsers(recent);
      } catch {
        /* ignore */
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <GlassCard className="p-5 sm:p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-white">Recent Signups</h3>
          <p className="mt-0.5 text-xs text-violet-100/45">
            Newest members to join the platform
          </p>
        </div>
        <GlowButton
          variant="ghost"
          size="sm"
          onClick={() => onNavigate("users")}
        >
          View all
          <ArrowRight className="h-3.5 w-3.5" />
        </GlowButton>
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full rounded-lg" />
          ))}
        </div>
      ) : users.length === 0 ? (
        <EmptyState
          icon={<Users className="h-6 w-6" />}
          title="No users yet"
          description="The first signup will appear here once it lands."
        />
      ) : (
        <div className="space-y-2">
          {users.map((u, i) => (
            <motion.div
              key={u.id}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.25, delay: i * 0.04 }}
              className="flex items-center gap-3 rounded-xl bg-white/[0.02] px-3 py-2.5 ring-1 ring-inset ring-white/5 transition hover:bg-white/[0.04]"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 text-xs font-bold text-white">
                {(u.full_name?.[0] || u.email[0] || "?").toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-white">
                  {u.full_name || u.email}
                </p>
                <p className="truncate text-[11px] text-violet-100/45">
                  {u.email}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {u.joining_fee_paid ? (
                  <PremiumBadge tone="emerald">Paid</PremiumBadge>
                ) : (
                  <PremiumBadge tone="rose">Unpaid</PremiumBadge>
                )}
                <span className="hidden text-[11px] text-violet-100/40 sm:inline">
                  {timeAgo(u.created_at)}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </GlassCard>
  );
}
