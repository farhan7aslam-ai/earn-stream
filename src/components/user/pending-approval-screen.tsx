"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  Clock,
  Hourglass,
  ShieldCheck,
  RefreshCw,
  Image as ImageIcon,
} from "lucide-react";
import { GlassCard, GlowButton, PremiumBadge } from "@/components/premium";
import { formatDateTime, timeAgo } from "@/lib/client";
import type { SafeUser } from "@/lib/types";

interface PendingApprovalScreenProps {
  user: SafeUser;
  onRefresh: () => void;
  onLogout: () => void;
}

/**
 * Full-section glassmorphism screen shown to users whose joining-fee payment
 * is pending admin verification. Tasks / withdrawals / referrals stay locked.
 */
export function PendingApprovalScreen({
  user,
  onRefresh,
  onLogout,
}: PendingApprovalScreenProps) {
  const submittedAt = user.joining_fee_submitted_at;

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-10">
      <motion.div
        initial={{ opacity: 0, y: 14, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-xl"
      >
        <GlassCard
          variant="panel"
          border="gradient"
          glow="soft"
          className="overflow-hidden p-7 sm:p-10"
        >
          {/* animated pending emblem */}
          <div className="flex flex-col items-center text-center">
            <div className="relative mb-5">
              <div className="absolute inset-0 animate-ping rounded-2xl bg-amber-400/30" />
              <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400/30 to-orange-500/10 text-amber-300 ring-1 ring-white/10">
                <Hourglass className="h-8 w-8" />
              </div>
            </div>
            <PremiumBadge tone="amber" className="mb-3">
              <Clock className="h-3 w-3" /> Pending Verification
            </PremiumBadge>
            <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
              Payment Pending Admin Approval
            </h2>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-violet-100/55">
              Thank you! Your joining-fee payment screenshot has been submitted
              and is now awaiting admin verification. Your tasks, wallet, and
              referrals will unlock the moment an admin approves your payment.
            </p>
          </div>

          {/* submission summary */}
          <div className="mt-7 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <SummaryTile
              label="Submitted"
              value={submittedAt ? timeAgo(submittedAt) : "—"}
              hint={submittedAt ? formatDateTime(submittedAt) : ""}
              icon={<Clock className="h-4 w-4" />}
              tone="amber"
            />
            <SummaryTile
              label="Status"
              value="Awaiting review"
              hint="Admin will verify shortly"
              icon={<ShieldCheck className="h-4 w-4" />}
              tone="violet"
            />
            <SummaryTile
              label="Screenshot"
              value="Uploaded"
              hint="Reviewable by admin"
              icon={<ImageIcon className="h-4 w-4" />}
              tone="emerald"
            />
          </div>

          {/* screenshot preview */}
          {user.joining_fee_screenshot ? (
            <div className="mt-6">
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-violet-100/40">
                Your submitted screenshot
              </p>
              <div className="overflow-hidden rounded-xl border border-white/10 ring-1 ring-white/5">
                <img
                  src={user.joining_fee_screenshot}
                  alt="Your joining fee payment screenshot"
                  className="max-h-64 w-full object-contain bg-black/40"
                />
              </div>
            </div>
          ) : null}

          {/* actions */}
          <div className="mt-7 flex flex-col items-center gap-3">
            <GlowButton
              variant="secondary"
              onClick={onRefresh}
              className="w-full sm:w-auto"
            >
              <RefreshCw className="h-4 w-4" />
              Check for updates
            </GlowButton>
            <button
              onClick={onLogout}
              className="text-xs text-violet-100/40 transition hover:text-violet-100/70"
            >
              Sign out
            </button>
          </div>

          <div className="mt-5 flex items-center justify-center gap-2 text-[11px] text-violet-100/40">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
            You&apos;ll receive a notification the moment your payment is verified.
          </div>
        </GlassCard>
      </motion.div>
    </div>
  );
}

function SummaryTile({
  label,
  value,
  hint,
  icon,
  tone,
}: {
  label: string;
  value: string;
  hint?: string;
  icon: React.ReactNode;
  tone: "amber" | "violet" | "emerald";
}) {
  const toneMap = {
    amber: "from-amber-500/15 to-amber-500/5 text-amber-200",
    violet: "from-violet-500/15 to-violet-500/5 text-violet-200",
    emerald: "from-emerald-500/15 to-emerald-500/5 text-emerald-200",
  } as const;
  return (
    <div
      className={`rounded-xl bg-gradient-to-br ${toneMap[tone]} p-3 ring-1 ring-inset ring-white/8`}
    >
      <div className="mb-1.5 flex items-center gap-1.5">
        {icon}
        <span className="text-[10px] uppercase tracking-wider opacity-70">
          {label}
        </span>
      </div>
      <p className="text-sm font-bold">{value}</p>
      {hint ? (
        <p className="mt-0.5 text-[10px] opacity-60">{hint}</p>
      ) : null}
    </div>
  );
}
