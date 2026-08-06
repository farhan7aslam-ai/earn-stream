"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  Activity,
  ArrowDownToLine,
  DollarSign,
  Loader2,
  RefreshCw,
  TrendingUp,
  UserPlus,
  Users,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  EmptyState,
  GlassCard,
  GlowButton,
  PremiumBadge,
  SectionHeading,
  StatCard,
} from "@/components/premium";
import { Skeleton } from "@/components/ui/skeleton";
import { apiFetch, timeAgo } from "@/lib/client";
import { useCurrency } from "@/lib/currency";
import { toast } from "sonner";
import type { DashboardAnalytics } from "@/lib/types";

interface ActivityItem {
  type: string;
  description: string;
  time: string;
  user_email?: string;
}

function activityTone(type: string): "violet" | "fuchsia" | "emerald" | "amber" | "rose" {
  if (type.includes("signup") || type.includes("register")) return "emerald";
  if (type.includes("withdraw")) return "rose";
  if (type.includes("task") || type.includes("submission")) return "violet";
  if (type.includes("gmail")) return "fuchsia";
  return "amber";
}

export function AnalyticsSection() {
  const { money } = useCurrency();
  const [data, setData] = React.useState<DashboardAnalytics | null>(null);
  const [loading, setLoading] = React.useState(true);

  const refresh = React.useCallback(async () => {
    setLoading(true);
    try {
      const { analytics } = await apiFetch<{ analytics: DashboardAnalytics }>(
        "/api/admin/analytics"
      );
      setData(analytics);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load analytics");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    refresh();
  }, [refresh]);

  const totalRevenue = (data?.daily_revenue ?? []).reduce((s, p) => s + p.value, 0);
  const totalSignups = (data?.daily_signups ?? []).reduce((s, p) => s + p.value, 0);
  const totalWithdrawals = (data?.daily_withdrawals ?? []).reduce((s, p) => s + p.value, 0);

  const chartData = React.useMemo(() => {
    if (!data) return [];
    const map = new Map<string, { date: string; revenue: number; signups: number; withdrawals: number }>();
    for (const r of data.daily_revenue) {
      const k = r.date;
      map.set(k, { date: k, revenue: r.value, signups: 0, withdrawals: 0 });
    }
    for (const s of data.daily_signups) {
      const k = s.date;
      const e = map.get(k) ?? { date: k, revenue: 0, signups: 0, withdrawals: 0 };
      e.signups = s.value;
      map.set(k, e);
    }
    for (const w of data.daily_withdrawals) {
      const k = w.date;
      const e = map.get(k) ?? { date: k, revenue: 0, signups: 0, withdrawals: 0 };
      e.withdrawals = w.value;
      map.set(k, e);
    }
    return Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date));
  }, [data]);

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow={
          <>
            <Activity className="h-3 w-3" /> Analytics
          </>
        }
        title="30-Day Pulse"
        description="Daily revenue, signups and withdrawals across the platform — with a live recent activity feed."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          <StatCard
            label="Revenue (30d)"
            value={
              loading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <span className="text-amber-300">{money(totalRevenue)}</span>
              )
            }
            icon={<DollarSign className="h-5 w-5" />}
            accent="amber"
            hint="Total processed credits"
          />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.05 }}>
          <StatCard
            label="Signups (30d)"
            value={
              loading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <span className="text-emerald-300">{totalSignups}</span>
              )
            }
            icon={<UserPlus className="h-5 w-5" />}
            accent="emerald"
            hint="New accounts created"
          />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.1 }}>
          <StatCard
            label="Withdrawals (30d)"
            value={
              loading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <span className="text-fuchsia-300">{money(totalWithdrawals)}</span>
              )
            }
            icon={<ArrowDownToLine className="h-5 w-5" />}
            accent="fuchsia"
            hint="Total paid out"
          />
        </motion.div>
      </div>

      <div className="flex items-center justify-end">
        <GlowButton variant="ghost" size="sm" onClick={refresh} disabled={loading}>
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </GlowButton>
      </div>

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-64 w-full rounded-2xl" />
          ))}
        </div>
      ) : !data ? (
        <GlassCard className="p-6">
          <EmptyState
            icon={<Activity className="h-6 w-6" />}
            title="No analytics available"
            description="Analytics will appear here once data starts flowing."
            className="py-12"
          />
        </GlassCard>
      ) : (
        <div className="space-y-4">
          <ChartCard
            title="Daily Revenue"
            icon={<DollarSign className="h-4 w-4" />}
            tone="amber"
            data={chartData}
            dataKey="revenue"
            stroke="#fbbf24"
            gradientStops={[
              { offset: "0%", color: "#fbbf24", opacity: 0.4 },
              { offset: "100%", color: "#fbbf24", opacity: 0 },
            ]}
            formatValue={(v) => money(Number(v))}
          />
          <ChartCard
            title="Daily Signups"
            icon={<UserPlus className="h-4 w-4" />}
            tone="emerald"
            data={chartData}
            dataKey="signups"
            stroke="#34d399"
            gradientStops={[
              { offset: "0%", color: "#34d399", opacity: 0.4 },
              { offset: "100%", color: "#34d399", opacity: 0 },
            ]}
          />
          <ChartCard
            title="Daily Withdrawals"
            icon={<ArrowDownToLine className="h-4 w-4" />}
            tone="fuchsia"
            data={chartData}
            dataKey="withdrawals"
            stroke="#e879f9"
            gradientStops={[
              { offset: "0%", color: "#e879f9", opacity: 0.4 },
              { offset: "100%", color: "#e879f9", opacity: 0 },
            ]}
            formatValue={(v) => money(Number(v))}
          />
        </div>
      )}

      {/* Recent Activity */}
      <GlassCard className="p-5 sm:p-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500/30 to-fuchsia-500/10 text-violet-300 ring-1 ring-white/10">
              <TrendingUp className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Recent Activity</h3>
              <p className="text-[11px] text-violet-100/45">Last events across the platform</p>
            </div>
          </div>
          <PremiumBadge tone="violet">Live</PremiumBadge>
        </div>

        {!data || data.recent_activity.length === 0 ? (
          <EmptyState
            icon={<Users className="h-6 w-6" />}
            title="No recent activity"
            description="Activity will appear here once users start interacting with the platform."
            className="py-8"
          />
        ) : (
          <div className="max-h-96 space-y-2 overflow-y-auto pr-1">
            {data.recent_activity.map((item, i) => (
              <motion.div
                key={`${item.time}-${i}`}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2, delay: Math.min(i * 0.03, 0.25) }}
                className="flex items-start gap-3 rounded-xl bg-white/[0.02] px-3 py-2.5 ring-1 ring-inset ring-white/5"
              >
                <div className="mt-0.5 shrink-0">
                  <PremiumBadge tone={activityTone(item.type)}>{item.type}</PremiumBadge>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-white">{item.description}</p>
                  {item.user_email && (
                    <p className="mt-0.5 text-[10px] text-violet-100/40">{item.user_email}</p>
                  )}
                </div>
                <span className="shrink-0 text-[10px] text-violet-100/40">
                  {timeAgo(item.time)}
                </span>
              </motion.div>
            ))}
          </div>
        )}
      </GlassCard>
    </div>
  );
}

interface ChartCardProps {
  title: string;
  icon: React.ReactNode;
  tone: "amber" | "emerald" | "fuchsia";
  data: Array<{ date: string; revenue: number; signups: number; withdrawals: number }>;
  dataKey: "revenue" | "signups" | "withdrawals";
  stroke: string;
  gradientStops: Array<{ offset: string; color: string; opacity: number }>;
  formatValue?: (v: number) => string;
}

function ChartCard({
  title,
  icon,
  tone,
  data,
  dataKey,
  stroke,
  gradientStops,
  formatValue,
}: ChartCardProps) {
  const gradId = `${dataKey}-grad`;
  const toneRing =
    tone === "amber"
      ? "from-amber-500/15 to-amber-500/5 text-amber-300"
      : tone === "emerald"
        ? "from-emerald-500/15 to-emerald-500/5 text-emerald-300"
        : "from-fuchsia-500/15 to-fuchsia-500/5 text-fuchsia-300";

  return (
    <GlassCard className="p-5 sm:p-6">
      <div className="mb-4 flex items-center gap-2">
        <div
          className={`flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br ring-1 ring-inset ring-white/10 ${toneRing}`}
        >
          {icon}
        </div>
        <div>
          <h3 className="text-base font-bold text-white">{title}</h3>
          <p className="text-[11px] text-violet-100/45">Last 30 days</p>
        </div>
      </div>
      <div className="h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                {gradientStops.map((s) => (
                  <stop
                    key={s.offset}
                    offset={s.offset}
                    stopColor={s.color}
                    stopOpacity={s.opacity}
                  />
                ))}
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis
              dataKey="date"
              tickFormatter={(v) => String(v).slice(5)}
              tick={{ fill: "rgba(196,181,253,0.45)", fontSize: 10 }}
              stroke="rgba(255,255,255,0.08)"
            />
            <YAxis
              tick={{ fill: "rgba(196,181,253,0.45)", fontSize: 10 }}
              stroke="rgba(255,255,255,0.08)"
              tickFormatter={(v) =>
                formatValue ? formatValue(Number(v)).replace(/\.\d+/, "") : String(v)
              }
              width={48}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "rgba(15,11,24,0.95)",
                border: "1px solid rgba(139,92,246,0.3)",
                borderRadius: 12,
                fontSize: 11,
                color: "#fff",
              }}
              labelStyle={{ color: "rgba(196,181,253,0.7)" }}
              formatter={(value: number) =>
                formatValue ? formatValue(Number(value)) : String(value)
              }
            />
            <Area
              type="monotone"
              dataKey={dataKey}
              stroke={stroke}
              strokeWidth={2}
              fill={`url(#${gradId})`}
              activeDot={{ r: 4, strokeWidth: 0 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </GlassCard>
  );
}
