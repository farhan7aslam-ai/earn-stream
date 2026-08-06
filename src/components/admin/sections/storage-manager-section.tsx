"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  Database,
  FileImage,
  FileText,
  FolderOpen,
  HardDrive,
  Image as ImageIcon,
  Mail,
  UserCircle,
} from "lucide-react";
import {
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

interface BucketDef {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  tone: "violet" | "fuchsia" | "emerald" | "amber" | "rose";
}

const BUCKETS: BucketDef[] = [
  {
    id: "task-screenshots",
    name: "task-screenshots",
    description: "User-submitted screenshots for TikTok task verification",
    icon: <ImageIcon className="h-4 w-4" />,
    tone: "violet",
  },
  {
    id: "payment-screenshots",
    name: "payment-screenshots",
    description: "Receipts for withdrawal and subscription payments",
    icon: <FileImage className="h-4 w-4" />,
    tone: "fuchsia",
  },
  {
    id: "joining-fees",
    name: "joining-fees",
    description: "Joining-fee payment proof uploads",
    icon: <FileText className="h-4 w-4" />,
    tone: "amber",
  },
  {
    id: "gmail-submissions",
    name: "gmail-submissions",
    description: "Verification attachments for Gmail account sales",
    icon: <Mail className="h-4 w-4" />,
    tone: "emerald",
  },
  {
    id: "avatars",
    name: "avatars",
    description: "User profile avatars",
    icon: <UserCircle className="h-4 w-4" />,
    tone: "violet",
  },
  {
    id: "logos",
    name: "logos",
    description: "Brand logos and nav badges",
    icon: <ImageIcon className="h-4 w-4" />,
    tone: "fuchsia",
  },
  {
    id: "banners",
    name: "banners",
    description: "Hero banners, promotional imagery and OG images",
    icon: <FolderOpen className="h-4 w-4" />,
    tone: "rose",
  },
  {
    id: "documents",
    name: "documents",
    description: "Terms, policies and downloadable contracts",
    icon: <FileText className="h-4 w-4" />,
    tone: "amber",
  },
];

function toneRing(tone: BucketDef["tone"]): string {
  switch (tone) {
    case "violet":
      return "from-violet-500/20 to-violet-500/5 text-violet-300 ring-violet-400/20";
    case "fuchsia":
      return "from-fuchsia-500/20 to-fuchsia-500/5 text-fuchsia-300 ring-fuchsia-400/20";
    case "emerald":
      return "from-emerald-500/20 to-emerald-500/5 text-emerald-300 ring-emerald-400/20";
    case "amber":
      return "from-amber-500/20 to-amber-500/5 text-amber-300 ring-amber-400/20";
    case "rose":
      return "from-rose-500/20 to-rose-500/5 text-rose-300 ring-rose-400/20";
  }
}

export function StorageManagerSection() {
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
      toast.error(err instanceof Error ? err.message : "Failed to load storage info");
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
            <HardDrive className="h-3 w-3" /> Storage
          </>
        }
        title="Storage Manager"
        description="View and manage all Supabase storage buckets used by EarnStream. Health, capacity and bucket-level activity at a glance."
      />

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="Buckets"
          value={
            loading ? (
              <Skeleton className="h-8 w-12" />
            ) : (
              health?.storage_buckets ?? BUCKETS.length
            )
          }
          icon={<Database className="h-5 w-5" />}
          accent="violet"
          hint="Configured storage buckets"
        />
        <StatCard
          label="Storage Health"
          value={
            loading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <PremiumBadge
                tone={
                  health?.storage === "healthy"
                    ? "emerald"
                    : health?.storage === "degraded"
                      ? "amber"
                      : "rose"
                }
              >
                {health?.storage ?? "—"}
              </PremiumBadge>
            )
          }
          icon={<HardDrive className="h-5 w-5" />}
          accent="emerald"
          hint="Live status from system check"
        />
        <StatCard
          label="Total Files"
          value={
            loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <span className="text-amber-300">
                {(health?.total_tasks ?? 0) + (health?.total_payments ?? 0)}
              </span>
            )
          }
          icon={<FolderOpen className="h-5 w-5" />}
          accent="amber"
          hint="Estimated across buckets"
        />
      </div>

      {/* Bucket grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {BUCKETS.map((b, i) => (
          <motion.div
            key={b.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: Math.min(i * 0.03, 0.25) }}
          >
            <GlassCard className="flex h-full flex-col p-5">
              <div
                className={`mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ring-1 ring-inset ${toneRing(
                  b.tone
                )}`}
              >
                {b.icon}
              </div>
              <code className="text-xs font-mono text-violet-200">{b.name}</code>
              <p className="mt-1 mb-4 line-clamp-3 text-[11px] leading-relaxed text-violet-100/50">
                {b.description}
              </p>
              <div className="mt-auto">
                <PremiumBadge tone={health?.storage === "healthy" ? "emerald" : "amber"}>
                  {health?.storage === "healthy" ? "Operational" : "Check status"}
                </PremiumBadge>
              </div>
            </GlassCard>
          </motion.div>
        ))}
      </div>

      <GlassCard className="p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500/30 to-fuchsia-500/10 text-violet-300 ring-1 ring-white/10">
            <Database className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">About Supabase Storage</h3>
            <p className="mt-1 text-xs leading-relaxed text-violet-100/55">
              All file uploads go through Supabase Storage. Public buckets serve
              avatars, logos and banners via CDN. Private buckets (task-screenshots,
              payment-screenshots, joining-fees) generate signed URLs on demand.
              Bucket policies are managed in the Supabase dashboard.
            </p>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
