"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  Check,
  Copy,
  Gift,
  Link2,
  Share2,
  Sparkles,
  TrendingUp,
  UserPlus,
  Users,
} from "lucide-react";
import {
  EmptyState,
  GlassCard,
  GlowButton,
  PremiumBadge,
  SectionHeading,
  StatCard,
} from "@/components/premium";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { apiFetch, formatDateTime, timeAgo } from "@/lib/client";
import { useCurrency } from "@/lib/currency";
import { toast } from "sonner";
import type {
  PlatformSettings,
  Referral,
  SafeUser,
} from "@/lib/types";

interface ReferralsSectionProps {
  user: SafeUser;
  settings: PlatformSettings;
}

export function ReferralsSection({
  user,
  settings,
}: ReferralsSectionProps) {
  const { money } = useCurrency();
  const [loading, setLoading] = React.useState(true);
  const [referralCode, setReferralCode] = React.useState(user.referral_code);
  const [referrals, setReferrals] = React.useState<Referral[]>([]);
  const [bonusPercent, setBonusPercent] = React.useState(
    settings.referral_bonus_percent
  );
  const [origin, setOrigin] = React.useState("");
  const [copied, setCopied] = React.useState<"link" | "code" | null>(null);

  React.useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const load = React.useCallback(async () => {
    try {
      const data = await apiFetch<{
        referral_code: string;
        bonus_percent: number;
        referrals: Referral[];
      }>("/api/referrals");
      setReferralCode(data.referral_code);
      setBonusPercent(data.bonus_percent);
      setReferrals(data.referrals);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  const referralLink = origin
    ? `${origin}/?ref=${referralCode}`
    : `/?ref=${referralCode}`;

  const totalReferrals = referrals.length;
  const activeReferrals = referrals.filter((r) => r.status === "credited").length;
  const totalBonus = referrals.reduce((s, r) => s + r.bonus_amount, 0);

  async function copy(text: string, kind: "link" | "code") {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(kind);
      toast.success(kind === "link" ? "Referral link copied!" : "Code copied!");
      setTimeout(() => setCopied(null), 2000);
    } catch {
      toast.error("Could not copy — try selecting manually");
    }
  }

  async function share() {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Join me on EarnStream",
          text: `Earn real money completing micro-tasks. Use my referral code ${referralCode} when you sign up!`,
          url: referralLink,
        });
      } catch {
        /* user cancelled */
      }
    } else {
      copy(referralLink, "link");
    }
  }

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow={<><Gift className="h-3 w-3" /> Referrals</>}
        title="Invite & Earn"
        description={`Share your link with friends. Earn ${bonusPercent}% of their first task reward the moment they're approved.`}
      />

      {/* Hero — referral link */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <GlassCard
          variant="panel"
          border="gradient"
          glow="soft"
          className="overflow-hidden p-6 sm:p-7"
        >
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <div className="mb-3 flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-fuchsia-500/30 to-rose-500/10 text-fuchsia-300 ring-1 ring-white/10">
                  <Share2 className="h-5 w-5" />
                </div>
                <PremiumBadge tone="fuchsia">
                  <Sparkles className="h-3 w-3" />
                  Your referral link
                </PremiumBadge>
              </div>

              <div className="space-y-3">
                <div>
                  <Label className="mb-1.5 flex items-center gap-1.5 text-[11px] font-medium text-violet-100/55">
                    <Link2 className="h-3 w-3" />
                    Shareable link
                  </Label>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Input
                      readOnly
                      value={referralLink}
                      onFocus={(e) => e.currentTarget.select()}
                      className="flex-1 border-white/10 bg-white/5 font-mono text-xs text-violet-100"
                    />
                    <GlowButton
                      variant={copied === "link" ? "success" : "primary"}
                      onClick={() => copy(referralLink, "link")}
                      className="shrink-0"
                    >
                      {copied === "link" ? (
                        <>
                          <Check className="h-4 w-4" /> Copied
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4" /> Copy Link
                        </>
                      )}
                    </GlowButton>
                  </div>
                </div>

                <div>
                  <Label className="mb-1.5 flex items-center gap-1.5 text-[11px] font-medium text-violet-100/55">
                    <Gift className="h-3 w-3" />
                    Your referral code
                  </Label>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 rounded-md border border-white/10 bg-white/5 px-3 py-2">
                      <span className="font-mono text-base font-bold tracking-[0.2em] text-fuchsia-200">
                        {referralCode}
                      </span>
                    </div>
                    <GlowButton
                      variant={copied === "code" ? "success" : "secondary"}
                      size="icon"
                      onClick={() => copy(referralCode, "code")}
                      aria-label="Copy code"
                    >
                      {copied === "code" ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </GlowButton>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-stretch gap-2 lg:w-48">
              <GlowButton variant="gold" size="lg" onClick={share}>
                <Share2 className="h-4 w-4" />
                Share
              </GlowButton>
              <p className="text-center text-[11px] leading-relaxed text-violet-100/45">
                Earn{" "}
                <span className="font-semibold text-fuchsia-300">
                  {bonusPercent}%
                </span>{" "}
                per friend
              </p>
            </div>
          </div>
        </GlassCard>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="Total Referrals"
          value={loading ? <Skeleton className="h-8 w-16" /> : totalReferrals}
          icon={<Users className="h-5 w-5" />}
          accent="violet"
          hint="Friends you've invited"
        />
        <StatCard
          label="Active Referrals"
          value={loading ? <Skeleton className="h-8 w-16" /> : activeReferrals}
          icon={<UserPlus className="h-5 w-5" />}
          accent="emerald"
          hint="Credited bonuses"
        />
        <StatCard
          label="Bonus Earned"
          value={
            loading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <span className="text-fuchsia-300">{money(totalBonus)}</span>
            )
          }
          icon={<TrendingUp className="h-5 w-5" />}
          accent="fuchsia"
          hint="Lifetime referral income"
        />
      </div>

      {/* How it works */}
      <GlassCard className="p-5 sm:p-6">
        <h3 className="mb-4 text-base font-bold text-white">How it works</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Step
            n={1}
            icon={<Share2 className="h-4 w-4" />}
            title="Share your link"
            description="Send your unique referral link or code to friends via WhatsApp, social media, or text."
          />
          <Step
            n={2}
            icon={<UserPlus className="h-4 w-4" />}
            title="Friend joins & earns"
            description="When they sign up with your code and pay the joining fee, they become an active referral."
          />
          <Step
            n={3}
            icon={<Gift className="h-4 w-4" />}
            title="You get a bonus"
            description={`Earn ${bonusPercent}% of their first task reward, credited instantly to your wallet.`}
          />
        </div>
      </GlassCard>

      {/* Referrals table */}
      <GlassCard className="p-5 sm:p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-white">Your Referrals</h3>
            <p className="mt-0.5 text-xs text-violet-100/45">
              Friends who joined with your code
            </p>
          </div>
          <PremiumBadge tone="violet">
            <Users className="h-3 w-3" />
            {totalReferrals} total
          </PremiumBadge>
        </div>

        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded-lg" />
            ))}
          </div>
        ) : referrals.length === 0 ? (
          <EmptyState
            icon={<Users className="h-6 w-6" />}
            title="No active logs found"
            description="Share your referral link above. Friends who join with it will appear here."
            action={
              <GlowButton size="sm" onClick={() => copy(referralLink, "link")}>
                <Copy className="h-4 w-4" />
                Copy my link
              </GlowButton>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-white/8 hover:bg-transparent">
                  <TableHead className="text-violet-100/50">Referred User</TableHead>
                  <TableHead className="text-violet-100/50">Status</TableHead>
                  <TableHead className="text-violet-100/50">Bonus</TableHead>
                  <TableHead className="text-violet-100/50">Joined</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {referrals.map((r) => (
                  <TableRow
                    key={r.id}
                    className="border-white/5 hover:bg-white/[0.03]"
                  >
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500/30 to-fuchsia-500/10 text-xs font-bold text-violet-200 ring-1 ring-white/10">
                          {r.referred_id.slice(0, 2).toUpperCase()}
                        </span>
                        <div>
                          <p className="text-sm font-semibold text-white">
                            User {r.referred_id.slice(0, 8)}
                          </p>
                          <p className="font-mono text-[10px] text-violet-100/40">
                            ID: {r.referred_id.slice(0, 12)}…
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {r.status === "credited" ? (
                        <PremiumBadge tone="emerald">
                          <Check className="h-3 w-3" />
                          Credited
                        </PremiumBadge>
                      ) : (
                        <PremiumBadge tone="amber">Pending</PremiumBadge>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm font-semibold text-fuchsia-300">
                        +{money(r.bonus_amount)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <p className="text-xs text-violet-100/70">
                        {formatDateTime(r.created_at)}
                      </p>
                      <p className="text-[10px] text-violet-100/40">
                        {timeAgo(r.created_at)}
                      </p>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </GlassCard>
    </div>
  );
}

function Step({
  n,
  icon,
  title,
  description,
}: {
  n: number;
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: n * 0.06 }}
      className="relative rounded-xl bg-white/[0.02] p-4 ring-1 ring-inset ring-white/5"
    >
      <div className="mb-2 flex items-center gap-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 text-xs font-bold text-white">
          {n}
        </span>
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/5 text-violet-300 ring-1 ring-inset ring-white/10">
          {icon}
        </span>
      </div>
      <p className="text-sm font-semibold text-white">{title}</p>
      <p className="mt-1 text-xs leading-relaxed text-violet-100/50">
        {description}
      </p>
    </motion.div>
  );
}
