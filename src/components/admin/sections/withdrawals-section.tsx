"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  ArrowDownToLine,
  CheckCircle2,
  Clock,
  Loader2,
  RefreshCw,
  ThumbsDown,
  ThumbsUp,
  Wallet as WalletIcon,
  XCircle,
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
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  apiFetch,
  formatDateTime,
  timeAgo,
} from "@/lib/client";
import { useCurrency } from "@/lib/currency";
import { toast } from "sonner";
import type { Payment, SafeUser } from "@/lib/types";
import {
  MethodPill,
  PaymentStatusPill,
  initialsOf,
} from "../shared";

interface WithdrawalsSectionProps {
  pendingCount: number;
  pendingTotal: number;
  onCountChange: (count: number, total: number) => void;
  tick: number;
}

type Tab = "pending" | "all";

export function WithdrawalsSection({
  pendingCount,
  pendingTotal,
  onCountChange,
  tick,
}: WithdrawalsSectionProps) {
  const { money } = useCurrency();
  const [tab, setTab] = React.useState<Tab>("pending");
  const [payments, setPayments] = React.useState<Payment[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [userCache, setUserCache] = React.useState<
    Record<string, SafeUser | null>
  >({});
  const [busyId, setBusyId] = React.useState<string | null>(null);

  const refresh = React.useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ type: "withdrawal" });
      if (tab === "pending") params.set("status", "pending");
      const { payments: list } = await apiFetch<{ payments: Payment[] }>(
        `/api/admin/payments?${params.toString()}`
      );
      list.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      setPayments(list);
      if (tab === "pending") onCountChange(list.length, pendingTotalFromList(list));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [tab, onCountChange]);

  React.useEffect(() => {
    refresh();
  }, [tab, tick]);

  // Refresh pending total when list changes
  React.useEffect(() => {
    if (tab === "pending") {
      onCountChange(payments.length, pendingTotalFromList(payments));
    }
  }, [payments, tab, onCountChange]);

  // Lazy-load user names
  React.useEffect(() => {
    payments.forEach((p) => {
      const uid = p.user_id;
      if (uid in userCache) return;
      setUserCache((prev) => ({ ...prev, [uid]: prev[uid] ?? null }));
      (async () => {
        try {
          const { user } = await apiFetch<{ user: SafeUser }>(
            `/api/admin/users?id=${encodeURIComponent(uid)}`
          );
          setUserCache((prev) => ({ ...prev, [uid]: user }));
        } catch {
          setUserCache((prev) => ({ ...prev, [uid]: null }));
        }
      })();
    });
  }, [payments, userCache]);

  async function act(payment: Payment, action: "approve" | "reject") {
    setBusyId(payment.id);
    const prev = payments;
    // Optimistic removal for pending tab
    const next: Payment[] =
      tab === "pending"
        ? payments.filter((p) => p.id !== payment.id)
        : payments.map((p) =>
            p.id === payment.id
              ? {
                  ...p,
                  status: (action === "approve" ? "approved" : "rejected") as Payment["status"],
                  processed_at: new Date().toISOString(),
                }
              : p
          );
    setPayments(next);
    try {
      await apiFetch<{ payment: Payment }>("/api/admin/payments", {
        method: "POST",
        body: JSON.stringify({ id: payment.id, action }),
      });
      toast.success(
        action === "approve"
          ? `Withdrawal approved · ${money(Math.abs(payment.amount))} released`
          : "Withdrawal rejected"
      );
    } catch (err) {
      setPayments(prev);
      toast.error(err instanceof Error ? err.message : "Action failed");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow={
          <>
            <ArrowDownToLine className="h-3 w-3" /> Withdrawals
          </>
        }
        title="Payout requests"
        description="Approve or reject member withdrawal requests. Approved payouts are released from the user's balance; rejected ones refund it."
      />

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <StatCard
            label="Pending Count"
            value={
              loading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <span className="text-fuchsia-300">{pendingCount}</span>
              )
            }
            icon={<Clock className="h-5 w-5" />}
            accent="fuchsia"
            hint="Awaiting review"
          />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.05 }}
        >
          <StatCard
            label="Pending Total"
            value={
              loading ? (
                <Skeleton className="h-8 w-28" />
              ) : (
                <span className="text-amber-300">{money(pendingTotal)}</span>
              )
            }
            icon={<WalletIcon className="h-5 w-5" />}
            accent="amber"
            hint="Combined exposure"
          />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <StatCard
            label="This View"
            value={
              loading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <span className="text-violet-300">{payments.length}</span>
              )
            }
            icon={<ArrowDownToLine className="h-5 w-5" />}
            accent="violet"
            hint={tab === "pending" ? "Pending only" : "All statuses"}
          />
        </motion.div>
      </div>

      {/* Tabs */}
      <GlassCard className="flex flex-wrap items-center justify-between gap-3 p-4">
        <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)}>
          <TabsList className="bg-white/5">
            <TabsTrigger
              value="pending"
              className="data-[state=active]:bg-gradient-to-br data-[state=active]:from-violet-500 data-[state=active]:to-fuchsia-500 data-[state=active]:text-white"
            >
              <Clock className="h-3.5 w-3.5" />
              Pending
              {pendingCount > 0 && (
                <span className="ml-1 rounded-full bg-fuchsia-500/30 px-1.5 text-[10px] font-bold text-fuchsia-200">
                  {pendingCount}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger
              value="all"
              className="data-[state=active]:bg-gradient-to-br data-[state=active]:from-violet-500 data-[state=active]:to-fuchsia-500 data-[state=active]:text-white"
            >
              All
            </TabsTrigger>
          </TabsList>
        </Tabs>
        <GlowButton
          variant="ghost"
          size="sm"
          onClick={refresh}
          disabled={loading}
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </GlowButton>
      </GlassCard>

      {/* Table */}
      <GlassCard className="p-5 sm:p-6">
        {loading && payments.length === 0 ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full rounded-lg" />
            ))}
          </div>
        ) : payments.length === 0 ? (
          <EmptyState
            icon={
              tab === "pending" ? (
                <CheckCircle2 className="h-6 w-6" />
              ) : (
                <ArrowDownToLine className="h-6 w-6" />
              )
            }
            title={tab === "pending" ? "No active logs found" : "No active logs found"}
            description={
              tab === "pending"
                ? "All caught up. New withdrawal requests will appear here automatically."
                : "No withdrawal requests match this view yet."
            }
            className="py-12"
          />
        ) : (
          <div className="max-h-[34rem] overflow-y-auto pr-1">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="sticky top-0 z-10 bg-[rgba(20,16,32,0.95)] backdrop-blur-xl">
                  <TableRow className="border-white/8 hover:bg-transparent">
                    <TableHead className="text-violet-100/50">User</TableHead>
                    <TableHead className="text-violet-100/50">Amount</TableHead>
                    <TableHead className="text-violet-100/50">Method</TableHead>
                    <TableHead className="text-violet-100/50">Account</TableHead>
                    <TableHead className="text-violet-100/50">Requested</TableHead>
                    {tab === "all" && (
                      <TableHead className="text-violet-100/50">Status</TableHead>
                    )}
                    <TableHead className="text-right text-violet-100/50">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map((p, i) => {
                    const u = userCache[p.user_id];
                    const name = u
                      ? u.full_name || u.email
                      : `User ${p.user_id.slice(0, 8)}`;
                    return (
                      <motion.tr
                        key={p.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{
                          duration: 0.2,
                          delay: Math.min(i * 0.015, 0.25),
                        }}
                        className="border-white/5 hover:bg-white/[0.03]"
                      >
                        <TableCell>
                          <div className="flex items-center gap-2.5">
                            <Avatar className="h-8 w-8 ring-1 ring-inset ring-white/10">
                              <AvatarFallback className="bg-gradient-to-br from-violet-500 to-fuchsia-500 text-[10px] font-bold text-white">
                                {initialsOf(u?.full_name ?? "", u?.email ?? name)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <p className="truncate text-xs font-semibold text-white">
                                {name}
                              </p>
                              <p className="truncate text-[10px] text-violet-100/40">
                                {u?.email ?? p.user_id}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm font-bold text-rose-300 tabular-nums">
                            {money(Math.abs(p.amount))}
                          </span>
                        </TableCell>
                        <TableCell>
                          <MethodPill method={p.method} />
                        </TableCell>
                        <TableCell>
                          <code className="rounded bg-white/5 px-1.5 py-0.5 text-[11px] font-mono text-violet-200 ring-1 ring-inset ring-white/10">
                            {p.account || "—"}
                          </code>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="text-[11px] text-violet-100/70">
                              {formatDateTime(p.created_at)}
                            </span>
                            <span className="text-[10px] text-violet-100/40">
                              {timeAgo(p.created_at)}
                            </span>
                          </div>
                        </TableCell>
                        {tab === "all" && (
                          <TableCell>
                            <PaymentStatusPill status={p.status} />
                          </TableCell>
                        )}
                        <TableCell className="text-right">
                          {p.status === "pending" ? (
                            <div className="flex justify-end gap-1.5">
                              <GlowButton
                                variant="success"
                                size="sm"
                                onClick={() => act(p, "approve")}
                                disabled={busyId === p.id}
                              >
                                {busyId === p.id ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <ThumbsUp className="h-3.5 w-3.5" />
                                )}
                                Approve
                              </GlowButton>
                              <GlowButton
                                variant="danger"
                                size="sm"
                                onClick={() => act(p, "reject")}
                                disabled={busyId === p.id}
                              >
                                <ThumbsDown className="h-3.5 w-3.5" />
                                Reject
                              </GlowButton>
                            </div>
                          ) : (
                            <div className="flex justify-end">
                              {p.status === "approved" ? (
                                <PremiumBadge tone="emerald">
                                  <CheckCircle2 className="h-3 w-3" />
                                  Approved
                                </PremiumBadge>
                              ) : (
                                <PremiumBadge tone="rose">
                                  <XCircle className="h-3 w-3" />
                                  Rejected
                                </PremiumBadge>
                              )}
                            </div>
                          )}
                        </TableCell>
                      </motion.tr>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </GlassCard>
    </div>
  );
}

function pendingTotalFromList(list: Payment[]): number {
  return list
    .filter((p) => p.status === "pending")
    .reduce((s, p) => s + Math.abs(p.amount), 0);
}
