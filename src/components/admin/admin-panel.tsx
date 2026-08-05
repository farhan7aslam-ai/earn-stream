"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Gauge,
  ListChecks,
  Settings as SettingsIcon,
  ShieldCheck,
  Users,
  Wallet,
} from "lucide-react";
import { AppTopbar } from "@/components/shared/app-topbar";
import { Footer } from "@/components/shared/page-shell";
import { GlassCard, PremiumBadge } from "@/components/premium";
import { apiFetch, usePoll } from "@/lib/client";
import { useCurrency } from "@/lib/currency";
import type {
  AdminStats,
  PlatformSettings,
  SafeUser,
} from "@/lib/types";
import { DashboardSection } from "./sections/dashboard-section";
import { TaskVerificationSection } from "./sections/task-verification-section";
import { UsersSection } from "./sections/users-section";
import { WithdrawalsSection } from "./sections/withdrawals-section";
import { SettingsSection } from "./sections/settings-section";
import { JoiningFeeVerificationSection } from "./sections/joining-fee-verification-section";

type AdminSection =
  | "dashboard"
  | "tasks"
  | "joining_fees"
  | "users"
  | "withdrawals"
  | "settings";

interface AdminPanelProps {
  user: SafeUser;
  settings: PlatformSettings;
  onSettingsChange: (s: PlatformSettings) => void;
  onLogout: () => void;
  onUserUpdate: (u: SafeUser) => void;
}

const NAV: {
  id: AdminSection;
  label: string;
  icon: React.ElementType;
}[] = [
  { id: "dashboard", label: "Dashboard", icon: Gauge },
  { id: "tasks", label: "Task Verification", icon: ListChecks },
  { id: "joining_fees", label: "Joining Fees", icon: ShieldCheck },
  { id: "users", label: "Users", icon: Users },
  { id: "withdrawals", label: "Withdrawals", icon: Wallet },
  { id: "settings", label: "Settings", icon: SettingsIcon },
];

export function AdminPanel({
  user,
  settings,
  onSettingsChange,
  onLogout,
  onUserUpdate,
}: AdminPanelProps) {
  const { money } = useCurrency();
  const [section, setSection] = React.useState<AdminSection>("dashboard");

  // Polled metrics — refresh every 12s for live feel
  const tick = usePoll(12000);
  const [stats, setStats] = React.useState<AdminStats | null>(null);
  const [loadingStats, setLoadingStats] = React.useState(true);
  const [pendingTasks, setPendingTasks] = React.useState(0);
  const [pendingJoiningFees, setPendingJoiningFees] = React.useState(0);
  const [pendingWithdrawals, setPendingWithdrawals] = React.useState(0);
  const [pendingWithdrawalsTotal, setPendingWithdrawalsTotal] = React.useState(0);

  const refresh = React.useCallback(async () => {
    try {
      const [statsRes, tasksRes, withdrawalsRes] = await Promise.all([
        apiFetch<{ stats: AdminStats }>("/api/admin/stats"),
        apiFetch<{ tasks: unknown[] }>(
          "/api/admin/tasks?status=pending&type="
        ).catch(() => ({ tasks: [] as unknown[] })),
        apiFetch<{ payments: Array<{ amount: number; status: string }> }>(
          "/api/admin/payments?type=withdrawal&status=pending"
        ).catch(() => ({ payments: [] })),
      ]);
      setStats(statsRes.stats);
      setPendingTasks(tasksRes.tasks.length);
      setPendingJoiningFees(statsRes.stats.pending_joining_fees_count ?? 0);
      const pendings = withdrawalsRes.payments.filter((p) => p.status === "pending");
      setPendingWithdrawals(pendings.length);
      setPendingWithdrawalsTotal(
        pendings.reduce((s, p) => s + Math.abs(p.amount), 0)
      );
    } catch {
      /* ignore polling errors — topbar handles auth */
    } finally {
      setLoadingStats(false);
    }
  }, []);

  React.useEffect(() => {
    refresh();
  }, [refresh, tick]);

  const navigate = React.useCallback((s: AdminSection) => {
    setSection(s);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, []);

  // Mobile horizontal pill nav (rendered in topbar leftSlot)
  const mobileNav = (
    <nav
      aria-label="Admin sections"
      className="no-scrollbar ml-auto flex w-full max-w-full gap-1 overflow-x-auto lg:hidden"
    >
      {NAV.map((item) => {
        const active = section === item.id;
        const badge =
          item.id === "tasks"
            ? pendingTasks
            : item.id === "joining_fees"
              ? pendingJoiningFees
              : item.id === "withdrawals"
                ? pendingWithdrawals
                : 0;
        return (
          <button
            key={item.id}
            onClick={() => navigate(item.id)}
            aria-current={active ? "page" : undefined}
            className={`relative flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition ${
              active
                ? "bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white shadow-[0_4px_16px_-6px_rgba(139,92,246,0.6)]"
                : "bg-white/5 text-violet-100/60 hover:bg-white/10 hover:text-white"
            }`}
          >
            <item.icon className="h-3.5 w-3.5" />
            {item.label}
            {badge > 0 && (
              <span
                className={`flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[9px] font-bold ${
                  active
                    ? "bg-white/30 text-white"
                    : "bg-fuchsia-500/30 text-fuchsia-200"
                }`}
              >
                {badge > 9 ? "9+" : badge}
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );

  return (
    <>
      <AppTopbar
        user={user}
        siteName={settings.site_name}
        onLogout={onLogout}
        leftSlot={mobileNav}
      />

      <div className="mx-auto flex w-full max-w-7xl flex-1 gap-6 px-4 py-6 sm:px-5 sm:py-8">
        {/* Desktop sidebar */}
        <aside className="hidden w-60 shrink-0 lg:block">
          <GlassCard className="sticky top-24 p-3">
            <div className="mb-2 flex items-center justify-between px-3 pt-1">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-violet-100/40">
                Console
              </p>
              <PremiumBadge tone="fuchsia">Admin</PremiumBadge>
            </div>
            <nav aria-label="Admin sections" className="space-y-1">
              {NAV.map((item) => {
                const active = section === item.id;
                const badge =
                  item.id === "tasks"
                    ? pendingTasks
                    : item.id === "joining_fees"
                      ? pendingJoiningFees
                      : item.id === "withdrawals"
                        ? pendingWithdrawals
                        : 0;
                return (
                  <button
                    key={item.id}
                    onClick={() => navigate(item.id)}
                    aria-current={active ? "page" : undefined}
                    className={`group relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                      active
                        ? "bg-gradient-to-br from-violet-500/20 to-fuchsia-500/10 text-white ring-1 ring-inset ring-violet-400/30"
                        : "text-violet-100/60 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    {active && (
                      <motion.span
                        layoutId="admin-nav-active-bar"
                        className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-gradient-to-b from-violet-400 to-fuchsia-500"
                      />
                    )}
                    <item.icon
                      className={`h-4 w-4 ${
                        active
                          ? "text-violet-300"
                          : "text-violet-100/50 group-hover:text-violet-200"
                      }`}
                    />
                    {item.label}
                    {badge > 0 && (
                      <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-fuchsia-500/30 px-1.5 text-[10px] font-bold text-fuchsia-200">
                        {badge > 9 ? "9+" : badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>

            {/* Live metrics tile */}
            <div className="mt-4 rounded-xl bg-white/[0.02] p-3 ring-1 ring-inset ring-white/5">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-violet-100/40">
                Live · refreshes 12s
              </p>
              <div className="mt-2 space-y-1.5 text-xs">
                <MetricLine
                  label="Pending tasks"
                  value={pendingTasks}
                  tone="rose"
                />
                <MetricLine
                  label="Pending joining fees"
                  value={pendingJoiningFees}
                  tone="amber"
                />
                <MetricLine
                  label="Pending payouts"
                  value={pendingWithdrawals}
                  tone="fuchsia"
                />
                <MetricLine
                  label="Total users"
                  value={stats?.total_users ?? 0}
                  tone="violet"
                />
                <MetricLine
                  label="Revenue"
                  value={money(stats?.total_revenue ?? 0)}
                  tone="amber"
                />
              </div>
            </div>
          </GlassCard>
        </aside>

        {/* Main content */}
        <main className="min-w-0 flex-1">
          <AnimatePresence mode="wait">
            <motion.div
              key={section}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            >
              {section === "dashboard" && (
                <DashboardSection
                  user={user}
                  settings={settings}
                  stats={stats}
                  loadingStats={loadingStats}
                  onNavigate={navigate}
                />
              )}
              {section === "tasks" && (
                <TaskVerificationSection
                  pendingCount={pendingTasks}
                  onCountChange={setPendingTasks}
                  tick={tick}
                />
              )}
              {section === "joining_fees" && (
                <JoiningFeeVerificationSection
                  pendingCount={pendingJoiningFees}
                  onCountChange={setPendingJoiningFees}
                  tick={tick}
                />
              )}
              {section === "users" && <UsersSection tick={tick} />}
              {section === "withdrawals" && (
                <WithdrawalsSection
                  pendingCount={pendingWithdrawals}
                  pendingTotal={pendingWithdrawalsTotal}
                  onCountChange={(c, t) => {
                    setPendingWithdrawals(c);
                    setPendingWithdrawalsTotal(t);
                  }}
                  tick={tick}
                />
              )}
              {section === "settings" && (
                <SettingsSection
                  settings={settings}
                  adminUser={user}
                  onSettingsChange={onSettingsChange}
                  onAdminUserChange={onUserUpdate}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      <Footer />
    </>
  );
}

function MetricLine({
  label,
  value,
  tone,
}: {
  label: string;
  value: React.ReactNode;
  tone: "violet" | "fuchsia" | "emerald" | "amber" | "rose";
}) {
  const toneMap = {
    violet: "text-violet-300",
    fuchsia: "text-fuchsia-300",
    emerald: "text-emerald-300",
    amber: "text-amber-300",
    rose: "text-rose-300",
  } as const;
  return (
    <div className="flex items-center justify-between">
      <span className="text-violet-100/50">{label}</span>
      <span className={`font-semibold tabular-nums ${toneMap[tone]}`}>
        {value}
      </span>
    </div>
  );
}
