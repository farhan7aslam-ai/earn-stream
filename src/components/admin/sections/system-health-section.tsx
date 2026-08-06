"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  Activity,
  Cpu,
  Database,
  HardDrive,
  Loader2,
  RefreshCw,
  Server,
  Wifi,
} from "lucide-react";
import {
  EmptyState,
  GlassCard,
  GlowButton,
  PremiumBadge,
  SectionHeading,
  StatCard,
} from "@/components/premium";
import { Skeleton } from "@/components/ui/skeleton";
import { apiFetch } from "@/lib/client";
import { toast } from "sonner";
import type { SystemHealth } from "@/lib/types";

type HealthStatus = SystemHealth["database"];

function healthTone(s: HealthStatus | undefined): "emerald" | "amber" | "rose" | "neutral" {
  if (!s) return "neutral";
  if (s === "healthy") return "emerald";
  if (s === "degraded") return "amber";
  return "rose";
}

function healthLabel(s: HealthStatus | undefined): string {
  if (!s) return "—";
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function SystemHealthSection() {
  const [health, setHealth] = React.useState<SystemHealth | null>(null);
  const [loading, setLoading] = React.useState(true);

  const refresh = React.useCallback(async () => {
    setLoading(true);
    try {
      const { health: h } = await apiFetch<{ health: SystemHealth }>(
        "/api/admin/system-health"
      );
      setHealth(h);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load health");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow={
          <>
            <Activity className="h-3 w-3" /> System Health
          </>
        }
        title="Live Platform Status"
        description="Real-time status of database connectivity, object storage and API responsiveness — plus global uptime and core counters."
      />

      <div className="flex items-center justify-end">
        <GlowButton variant="ghost" size="sm" onClick={refresh} disabled={loading}>
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </GlowButton>
      </div>

      {/* Status cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatusCard
          title="Database"
          icon={<Database className="h-5 w-5" />}
          status={health?.database}
          detail="Supabase Postgres · pool: 10"
          loading={loading}
        />
        <StatusCard
          title="Storage"
          icon={<HardDrive className="h-5 w-5" />}
          status={health?.storage}
          detail={`${health?.storage_buckets ?? "—"} buckets active`}
          loading={loading}
        />
        <StatusCard
          title="API"
          icon={<Wifi className="h-5 w-5" />}
          status={health?.api}
          detail="Next.js Route Handlers"
          loading={loading}
        />
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Users"
          value={
            loading ? <Skeleton className="h-8 w-16" /> : health?.total_users ?? 0
          }
          icon={<Server className="h-5 w-5" />}
          accent="violet"
          hint="Registered accounts"
        />
        <StatCard
          label="Total Tasks"
          value={
            loading ? <Skeleton className="h-8 w-16" /> : health?.total_tasks ?? 0
          }
          icon={<Cpu className="h-5 w-5" />}
          accent="fuchsia"
          hint="TikTok tasks created"
        />
        <StatCard
          label="Total Payments"
          value={
            loading ? <Skeleton className="h-8 w-16" /> : health?.total_payments ?? 0
          }
          icon={<Database className="h-5 w-5" />}
          accent="amber"
          hint="Ledger entries"
        />
        <StatCard
          label="Storage Buckets"
          value={
            loading ? <Skeleton className="h-8 w-12" /> : health?.storage_buckets ?? 0
          }
          icon={<HardDrive className="h-5 w-5" />}
          accent="emerald"
          hint="Supabase buckets"
        />
      </div>

      {/* Uptime */}
      <GlassCard className="p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500/30 to-teal-500/10 text-emerald-300 ring-1 ring-white/10">
              <Activity className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-violet-100/45">
                Platform Uptime
              </p>
              <p className="text-2xl font-bold text-white tabular-nums">
                {loading ? <Skeleton className="h-8 w-32" /> : health?.uptime ?? "—"}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <PremiumBadge tone={healthTone(health?.database)}>
              DB {healthLabel(health?.database)}
            </PremiumBadge>
            <PremiumBadge tone={healthTone(health?.storage)}>
              Storage {healthLabel(health?.storage)}
            </PremiumBadge>
            <PremiumBadge tone={healthTone(health?.api)}>
              API {healthLabel(health?.api)}
            </PremiumBadge>
          </div>
        </div>
      </GlassCard>

      {loading && !health && (
        <GlassCard className="p-6">
          <EmptyState
            icon={<Activity className="h-6 w-6" />}
            title="Loading system health…"
            description="Fetching live metrics from the platform."
            className="py-12"
          />
        </GlassCard>
      )}
    </div>
  );
}

function StatusCard({
  title,
  icon,
  status,
  detail,
  loading,
}: {
  title: string;
  icon: React.ReactNode;
  status: HealthStatus | undefined;
  detail: string;
  loading: boolean;
}) {
  const tone = healthTone(status);
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      <GlassCard className="p-5">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500/30 to-fuchsia-500/10 text-violet-300 ring-1 ring-white/10">
            {icon}
          </div>
          {loading ? (
            <Skeleton className="h-6 w-16 rounded-full" />
          ) : (
            <PremiumBadge tone={tone}>
              {tone === "emerald" && <RefreshCw className="h-3 w-3" />}
              {tone === "amber" && <Loader2 className="h-3 w-3" />}
              {tone === "rose" && <Activity className="h-3 w-3" />}
              {healthLabel(status)}
            </PremiumBadge>
          )}
        </div>
        <p className="text-[10px] font-semibold uppercase tracking-wider text-violet-100/45">
          {title}
        </p>
        <p className="mt-0.5 text-sm font-bold text-white">{detail}</p>
      </GlassCard>
    </motion.div>
  );
}
