"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowDownToLine,
  Gift,
  LayoutDashboard,
  ListChecks,
  Wallet as WalletIcon,
} from "lucide-react";
import { AppTopbar } from "@/components/shared/app-topbar";
import { Footer } from "@/components/shared/page-shell";
import { GlassCard, PremiumBadge } from "@/components/premium";
import { apiFetch, usePoll } from "@/lib/client";
import type {
  Payment,
  PlatformSettings,
  SafeUser,
  TaskRow,
  WalletSummary,
} from "@/lib/types";
import { OverviewSection } from "./sections/overview-section";
import { TasksSection } from "./sections/tasks-section";
import { WalletSection } from "./sections/wallet-section";
import { ReferralsSection } from "./sections/referrals-section";
import { WithdrawSection } from "./sections/withdraw-section";
import { PendingApprovalScreen } from "./pending-approval-screen";

type Section = "overview" | "tasks" | "wallet" | "referrals" | "withdraw";

interface UserPanelProps {
  user: SafeUser;
  settings: PlatformSettings;
  onUserUpdate: (u: SafeUser) => void;
  onLogout: () => void;
}

const NAV: { id: Section; label: string; icon: React.ElementType }[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "tasks", label: "Tasks", icon: ListChecks },
  { id: "wallet", label: "Wallet", icon: WalletIcon },
  { id: "referrals", label: "Referrals", icon: Gift },
  { id: "withdraw", label: "Withdraw", icon: ArrowDownToLine },
];

export function UserPanel({
  user,
  settings,
  onUserUpdate,
  onLogout,
}: UserPanelProps) {
  const [section, setSection] = React.useState<Section>("overview");
  const [wallet, setWallet] = React.useState<WalletSummary | null>(null);
  const [ledger, setLedger] = React.useState<Payment[]>([]);
  const [tasks, setTasks] = React.useState<TaskRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const tick = usePoll(15000);

  const refresh = React.useCallback(async () => {
    try {
      const [w, t] = await Promise.all([
        apiFetch<{ wallet: WalletSummary; ledger: Payment[] }>("/api/wallet"),
        apiFetch<{ tasks: TaskRow[] }>("/api/tasks"),
      ]);
      setWallet(w.wallet);
      setLedger(w.ledger);
      setTasks(t.tasks);
    } catch {
      /* ignore polling errors — topbar handles auth */
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    refresh();
  }, [refresh, tick]);

  const navigate = React.useCallback((s: Section) => {
    setSection(s);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, []);

  // SECURITY GATE: joining fee pending admin verification → lock the whole
  // dashboard behind the "Payment Pending Admin Approval" screen. Tasks,
  // withdrawals, and referrals remain server-locked too.
  if (user.joining_fee_status === "pending_approval") {
    return (
      <>
        <AppTopbar
          user={user}
          siteName={settings.site_name}
          onLogout={onLogout}
        />
        <div className="mx-auto flex w-full max-w-7xl flex-1 px-4 py-6 sm:px-5 sm:py-8">
          <main className="min-w-0 flex-1">
            <PendingApprovalScreen
              user={user}
              onRefresh={refresh}
              onLogout={onLogout}
            />
          </main>
        </div>
        <Footer />
      </>
    );
  }

  // Mobile horizontal pill nav (rendered in topbar leftSlot)
  const mobileNav = (
    <nav
      aria-label="Sections"
      className="no-scrollbar ml-auto flex w-full max-w-full gap-1 overflow-x-auto lg:hidden"
    >
      {NAV.map((item) => {
        const active = section === item.id;
        return (
          <button
            key={item.id}
            onClick={() => navigate(item.id)}
            aria-current={active ? "page" : undefined}
            className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition ${
              active
                ? "bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white shadow-[0_4px_16px_-6px_rgba(139,92,246,0.6)]"
                : "bg-white/5 text-violet-100/60 hover:bg-white/10 hover:text-white"
            }`}
          >
            <item.icon className="h-3.5 w-3.5" />
            {item.label}
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
                Sections
              </p>
              <PremiumBadge tone="violet">{NAV.length}</PremiumBadge>
            </div>
            <nav aria-label="Sections" className="space-y-1">
              {NAV.map((item) => {
                const active = section === item.id;
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
                        layoutId="nav-active-bar"
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
                  </button>
                );
              })}
            </nav>

            <div className="mt-4 rounded-xl bg-white/[0.02] p-3 ring-1 ring-inset ring-white/5">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-violet-100/40">
                Available balance
              </p>
              <p className="mt-1 text-lg font-bold text-emerald-300 tabular-nums">
                Rs {(wallet?.balance ?? user.balance).toFixed(2)}
              </p>
              <p className="mt-1 text-[10px] text-violet-100/40">
                Updates every 15s
              </p>
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
              {section === "overview" && (
                <OverviewSection
                  user={user}
                  settings={settings}
                  wallet={wallet}
                  ledger={ledger}
                  tasks={tasks}
                  onNavigate={navigate}
                  onUserUpdate={onUserUpdate}
                  refresh={refresh}
                />
              )}
              {section === "tasks" && (
                <TasksSection
                  user={user}
                  settings={settings}
                  tasks={tasks}
                  refresh={refresh}
                />
              )}
              {section === "wallet" && (
                <WalletSection
                  wallet={wallet}
                  ledger={ledger}
                  loading={loading}
                />
              )}
              {section === "referrals" && (
                <ReferralsSection user={user} settings={settings} />
              )}
              {section === "withdraw" && (
                <WithdrawSection
                  user={user}
                  settings={settings}
                  wallet={wallet}
                  ledger={ledger}
                  refresh={refresh}
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
