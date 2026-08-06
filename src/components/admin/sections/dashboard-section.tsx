"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  Activity,
  ArrowRight,
  ArrowUpRight,
  Ban,
  CalendarClock,
  ClipboardCheck,
  Database,
  DollarSign,
  Gauge,
  Gift,
  ListChecks,
  Loader2,
  Mail,
  PauseCircle,
  Settings as SettingsIcon,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  UserCheck,
  Users,
  Wallet,
  Wifi,
  type LucideIcon,
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
  DashboardAnalytics,
  PlatformSettings,
  SafeUser,
  SystemHealth,
} from "@/lib/types";

type AdminSection =
  | "dashboard"
  | "users"
  | "tasks_cms"
  | "tasks"
  | "gmail"
  | "gmail_campaigns"
  | "wallet"
  | "withdrawals"
  | "joining_fees"
  | "subscriptions"
  | "referral"
  | "announcements"
  | "notifications"
  | "reports"
  | "analytics"
  | "audit_logs"
  | "storage"
  | "cms"
  | "seo"
  | "settings"
  | "security"
  | "system_health"
  | "admin_profile";

interface DashboardSectionProps {
  user: SafeUser;
  settings: PlatformSettings;
  stats: AdminStats | null;
  loadingStats: boolean;
  onNavigate: (s: AdminSection) => void;
}

type Accent = "violet" | "fuchsia" | "emerald" | "amber" | "rose";

interface StatSpec {
  label: string;
  value: React.ReactNode;
  icon: React.ReactNode;
  accent: Accent;
  hint?: React.ReactNode;
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

  // Build the 15-card grid spec.
  const num = (n: number | undefined) => (n ?? 0) as number;
  const rows: StatSpec[][] = [
    [
      {
        label: "Total Users",
        value: num(stats?.total_users),
        icon: <Users className="h-5 w-5" />,
        accent: "violet",
        hint: "Registered accounts",
      },
      {
        label: "Active Users",
        value: num(stats?.active_users),
        icon: <UserCheck className="h-5 w-5" />,
        accent: "emerald",
        hint: "In good standing",
      },
      {
        label: "Today's Signups",
        value: num(stats?.today_signups),
        icon: <Sparkles className="h-5 w-5" />,
        accent: "fuchsia",
        hint: "Joined in last 24h",
      },
      {
        label: "Monthly Signups",
        value: num(stats?.monthly_signups),
        icon: <CalendarClock className="h-5 w-5" />,
        accent: "amber",
        hint: "This calendar month",
      },
    ],
    [
      {
        label: "Pending Tasks",
        value: (
          <span className="text-rose-300">{num(stats?.pending_tasks_count)}</span>
        ),
        icon: <ListChecks className="h-5 w-5" />,
        accent: "rose",
        hint: "Awaiting verification",
      },
      {
        label: "Pending Gmail",
        value: (
          <span className="text-amber-300">{num(stats?.pending_gmail_count)}</span>
        ),
        icon: <Mail className="h-5 w-5" />,
        accent: "amber",
        hint: "Gmail submissions",
      },
      {
        label: "Pending Withdrawals",
        value: (
          <span className="text-fuchsia-300">
            {num(stats?.pending_withdrawals_count)}
          </span>
        ),
        icon: <Wallet className="h-5 w-5" />,
        accent: "fuchsia",
        hint: money(stats?.pending_withdrawals ?? 0) + " exposure",
      },
      {
        label: "Pending Joining Fees",
        value: (
          <span className="text-violet-300">
            {num(stats?.pending_joining_fees_count)}
          </span>
        ),
        icon: <ShieldCheck className="h-5 w-5" />,
        accent: "violet",
        hint: "Awaiting review",
      },
    ],
    [
      {
        label: "Wallet Liability",
        value: (
          <span className="text-rose-300">
            {money(stats?.total_balance_owed ?? 0)}
          </span>
        ),
        icon: <Wallet className="h-5 w-5" />,
        accent: "rose",
        hint: "Total owed to users",
      },
      {
        label: "Today's Revenue",
        value: (
          <span className="text-emerald-300">
            {money(stats?.today_revenue ?? 0)}
          </span>
        ),
        icon: <DollarSign className="h-5 w-5" />,
        accent: "emerald",
        hint: "Last 24h intake",
      },
      {
        label: "Monthly Revenue",
        value: (
          <span className="text-violet-300">
            {money(stats?.monthly_revenue ?? 0)}
          </span>
        ),
        icon: <TrendingUp className="h-5 w-5" />,
        accent: "violet",
        hint: "This calendar month",
      },
      {
        label: "Total Revenue",
        value: (
          <span className="text-amber-300">
            {money(stats?.total_revenue ?? 0)}
          </span>
        ),
        icon: <DollarSign className="h-5 w-5" />,
        accent: "amber",
        hint: "Lifetime processed",
      },
    ],
    [
      {
        label: "Task Expense",
        value: (
          <span className="text-rose-300">{money(stats?.task_expense ?? 0)}</span>
        ),
        icon: <ListChecks className="h-5 w-5" />,
        accent: "rose",
        hint: "Rewards paid out",
      },
      {
        label: "Referral Expense",
        value: (
          <span className="text-amber-300">
            {money(stats?.referral_expense ?? 0)}
          </span>
        ),
        icon: <Gift className="h-5 w-5" />,
        accent: "amber",
        hint: "Referral bonuses",
      },
      {
        label: "Current Profit",
        value: (
          <span className="text-emerald-300">
            {money(stats?.current_profit ?? 0)}
          </span>
        ),
        icon: <ArrowUpRight className="h-5 w-5" />,
        accent: "emerald",
        hint: "Revenue minus payouts",
      },
    ],
  ];

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

      {/* Stat cards — 4 rows of 4 (last row has 3) */}
      <div className="space-y-4">
        {rows.map((row, ri) => (
          <div
            key={ri}
            className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
          >
            {row.map((spec, ci) => (
              <motion.div
                key={spec.label}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.3,
                  delay: Math.min(ri * 0.04 + ci * 0.05, 0.4),
                }}
              >
                <StatCard
                  label={spec.label}
                  value={
                    loadingStats ? (
                      <Skeleton className="h-8 w-24" />
                    ) : (
                      spec.value
                    )
                  }
                  icon={spec.icon}
                  accent={spec.accent}
                  hint={spec.hint}
                />
              </motion.div>
            ))}
          </div>
        ))}
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
                    Monthly capacity, risk exposure & service status
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
                    <p className="text-[11px] text-violet-100/45">{pct}% used</p>
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

            {/* Service status badges — fetched live from /api/admin/system-health */}
            <SystemStatusBadges />
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
                <h3 className="text-base font-bold text-white">Quick Actions</h3>
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
                icon={<Mail className="h-4 w-4" />}
                title="Review gmail"
                subtitle={`${stats?.pending_gmail_count ?? 0} awaiting review`}
                tone="violet"
                onClick={() => onNavigate("gmail")}
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

      {/* Recent Activity + Recent Signups */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="lg:col-span-2"
        >
          <RecentActivityCard />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.05 }}
        >
          <RecentSignupsCard onNavigate={onNavigate} />
        </motion.div>
      </div>
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

/** Live system status badges (database / storage / API) fetched from
 *  /api/admin/system-health. Renders inline at the bottom of the System
 *  Health card. */
function SystemStatusBadges() {
  const [health, setHealth] = React.useState<SystemHealth | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { health: h } = await apiFetch<{ health: SystemHealth }>(
          "/api/admin/system-health"
        );
        if (cancelled) return;
        setHealth(h);
      } catch {
        /* leave null */
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="mt-5 rounded-2xl border border-white/8 bg-white/[0.02] p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-violet-100/55">
          Service Status
        </p>
        <span className="text-[11px] text-violet-100/40">
          {loading
            ? "checking…"
            : health
              ? `uptime ${health.uptime}`
              : "unavailable"}
        </span>
      </div>
      {loading ? (
        <div className="flex gap-2">
          <Skeleton className="h-7 w-28 rounded-full" />
          <Skeleton className="h-7 w-28 rounded-full" />
          <Skeleton className="h-7 w-28 rounded-full" />
        </div>
      ) : health ? (
        <div className="flex flex-wrap gap-2">
          <StatusBadge icon={Database} label="Database" status={health.database} />
          <StatusBadge icon={Wifi} label="Storage" status={health.storage} />
          <StatusBadge icon={Activity} label="API" status={health.api} />
        </div>
      ) : (
        <p className="text-[11px] text-rose-300">
          Health endpoint unreachable.
        </p>
      )}
    </div>
  );
}

function StatusBadge({
  icon: Icon,
  label,
  status,
}: {
  icon: LucideIcon;
  label: string;
  status: "healthy" | "degraded" | "down";
}) {
  const tone =
    status === "healthy"
      ? "emerald"
      : status === "degraded"
        ? "amber"
        : "rose";
  const dot =
    status === "healthy"
      ? "bg-emerald-400"
      : status === "degraded"
        ? "bg-amber-400"
        : "bg-rose-400";
  return (
    <PremiumBadge tone={tone}>
      <Icon className="h-3 w-3" />
      {label}
      <span className={`ml-1 inline-block h-1.5 w-1.5 rounded-full ${dot}`} />
    </PremiumBadge>
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
        <div className="max-h-96 space-y-2 overflow-y-auto pr-1">
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

interface RecentActivityItem {
  type: string;
  description: string;
  time: string;
  user_email?: string;
}

/** Live recent-activity feed fetched from /api/admin/analytics. Shows the
 *  most recent platform events (signups, withdrawals, task approvals, gmail
 *  submissions, etc.) with a type icon, description, user email, and
 *  timeAgo. */
function RecentActivityCard() {
  const [items, setItems] = React.useState<RecentActivityItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { analytics } = await apiFetch<{ analytics: DashboardAnalytics }>(
        "/api/admin/analytics"
      );
      setItems(analytics?.recent_activity ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load activity");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  return (
    <GlassCard variant="panel" border="gradient" className="p-5 sm:p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-fuchsia-500/30 to-rose-500/10 text-fuchsia-300 ring-1 ring-white/10">
            <Activity className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Recent Activity</h3>
            <p className="mt-0.5 text-xs text-violet-100/45">
              Latest signups, payouts, reviews & submissions
            </p>
          </div>
        </div>
        <GlowButton variant="ghost" size="sm" onClick={load} disabled={loading}>
          {loading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Activity className="h-3.5 w-3.5" />
          )}
          Refresh
        </GlowButton>
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full rounded-lg" />
          ))}
        </div>
      ) : error ? (
        <EmptyState
          icon={<Activity className="h-6 w-6" />}
          title="Couldn't load activity"
          description={error}
        />
      ) : items.length === 0 ? (
        <EmptyState
          icon={<Activity className="h-6 w-6" />}
          title="No recent activity"
          description="Events will appear here as users sign up, withdraw, and submit tasks."
        />
      ) : (
        <div className="max-h-96 space-y-1.5 overflow-y-auto pr-1">
          {items.map((it, i) => (
            <motion.div
              key={`${it.type}-${i}-${it.time}`}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.25, delay: Math.min(i * 0.04, 0.4) }}
              className="flex items-start gap-3 rounded-xl bg-white/[0.02] px-3 py-2.5 ring-1 ring-inset ring-white/5 transition hover:bg-white/[0.04]"
            >
              <ActivityIcon type={it.type} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-white">
                  {it.description}
                </p>
                <p className="truncate text-[11px] text-violet-100/45">
                  {it.user_email ?? "system"}
                </p>
              </div>
              <span className="shrink-0 text-[11px] text-violet-100/40">
                {timeAgo(it.time)}
              </span>
            </motion.div>
          ))}
        </div>
      )}
    </GlassCard>
  );
}

function ActivityIcon({ type }: { type: string }) {
  const map: Record<string, { icon: LucideIcon; tone: Accent }> = {
    signup: { icon: Users, tone: "violet" },
    user: { icon: Users, tone: "violet" },
    withdrawal: { icon: Wallet, tone: "fuchsia" },
    payment: { icon: DollarSign, tone: "emerald" },
    task: { icon: ListChecks, tone: "rose" },
    gmail: { icon: Mail, tone: "amber" },
    referral: { icon: Gift, tone: "amber" },
    joining_fee: { icon: ShieldCheck, tone: "violet" },
    revenue: { icon: TrendingUp, tone: "emerald" },
  };
  const spec = map[type.toLowerCase()] ?? { icon: Activity, tone: "violet" as Accent };
  const Icon = spec.icon;
  const toneMap: Record<Accent, string> = {
    violet: "from-violet-500/30 to-fuchsia-500/10 text-violet-300",
    fuchsia: "from-fuchsia-500/30 to-rose-500/10 text-fuchsia-300",
    emerald: "from-emerald-500/30 to-teal-500/10 text-emerald-300",
    amber: "from-amber-500/30 to-orange-500/10 text-amber-300",
    rose: "from-rose-500/30 to-red-500/10 text-rose-300",
  };
  return (
    <div
      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ring-1 ring-inset ring-white/10 ${toneMap[spec.tone]}`}
    >
      <Icon className="h-3.5 w-3.5" />
    </div>
  );
}
