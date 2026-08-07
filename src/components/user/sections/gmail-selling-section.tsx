"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Eye,
  EyeOff,
  Info,
  KeyRound,
  Loader2,
  Lock,
  Mail,
  MailCheck,
  Send,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import {
  EmptyState,
  GlassCard,
  GlowButton,
  PremiumBadge,
  SectionHeading,
} from "@/components/premium";
import { Skeleton } from "@/components/ui/skeleton";
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
import { apiFetch, formatDateTime, timeAgo } from "@/lib/client";
import { useCurrency } from "@/lib/currency";
import { toast } from "sonner";
import type {
  GmailSubmission,
  PlatformSettings,
  SafeUser,
} from "@/lib/types";

interface GmailSellingSectionProps {
  user: SafeUser;
  settings: PlatformSettings;
}

function statusTone(status: GmailSubmission["status"]): "amber" | "emerald" | "rose" | "violet" {
  switch (status) {
    case "pending":
      return "amber";
    case "approved":
      return "emerald";
    case "rejected":
    case "cancelled":
      return "rose";
    case "sold":
      return "violet";
  }
}

export function GmailSellingSection({ user, settings }: GmailSellingSectionProps) {
  const { money } = useCurrency();
  const [submissions, setSubmissions] = React.useState<GmailSubmission[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [gmailAddress, setGmailAddress] = React.useState("");
  const [recoveryEmail, setRecoveryEmail] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [revealed, setRevealed] = React.useState<Set<string>>(new Set());

  const refresh = React.useCallback(async () => {
    setLoading(true);
    try {
      const payload = await apiFetch<{ submissions?: GmailSubmission[] }>(
        "/api/gmail/my-gmail"
      );
      const list = Array.isArray(payload?.submissions) ? payload.submissions : [];
      list.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      setSubmissions(list);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    refresh();
  }, [refresh]);

  function toggleReveal(id: string) {
    setRevealed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function submit() {
    const addr = gmailAddress.trim().toLowerCase();
    if (!addr || !/^[^@\s]+@gmail\.com$/i.test(addr)) {
      toast.error("A valid @gmail.com address is required");
      return;
    }
    setSubmitting(true);
    try {
      await apiFetch("/api/gmail/my-gmail", {
        method: "POST",
        body: JSON.stringify({
          gmail_address: addr,
          recovery_email: recoveryEmail.trim() || null,
        }),
      });
      toast.success("Gmail submitted for review");
      setGmailAddress("");
      setRecoveryEmail("");
      refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Submission failed");
    } finally {
      setSubmitting(false);
    }
  }

  const canSubmit =
    user.joining_fee_paid && !user.is_suspended && user.joining_fee_status !== "pending_approval";

  const pending = submissions.filter((s) => s.status === "pending").length;
  const approved = submissions.filter((s) => s.status === "approved" || s.status === "sold").length;
  const totalEarned = submissions
    .filter((s) => s.status === "approved" || s.status === "sold")
    .reduce((s, x) => s + x.reward, 0);

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow={
          <>
            <Mail className="h-3 w-3" /> Gmail Selling
          </>
        }
        title="Sell Gmail Accounts"
        description="Submit Gmail accounts for admin review. Each approved account earns you the configured reward, credited to your wallet."
      />

      {/* Lock banner */}
      {!canSubmit && (
        <GlassCard className="border-amber-400/20 bg-amber-500/5 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/15 text-amber-300 ring-1 ring-amber-400/20">
              <Lock className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-semibold text-amber-100">
                {user.is_suspended
                  ? "Your subscription has expired."
                  : !user.joining_fee_paid
                    ? "Please pay the joining fee to submit Gmails."
                    : "Your joining fee is awaiting admin approval."}
              </p>
              <p className="text-[11px] text-amber-200/70">
                Gmail submissions are locked until your account is fully active.
              </p>
            </div>
          </div>
        </GlassCard>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <GlassCard className="p-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-violet-100/45">
            Pending
          </p>
          <p className="mt-1 text-2xl font-bold text-amber-300">
            {loading ? <Skeleton className="h-8 w-12" /> : pending}
          </p>
        </GlassCard>
        <GlassCard className="p-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-violet-100/45">
            Approved
          </p>
          <p className="mt-1 text-2xl font-bold text-emerald-300">
            {loading ? <Skeleton className="h-8 w-12" /> : approved}
          </p>
        </GlassCard>
        <GlassCard className="p-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-violet-100/45">
            Total Earned
          </p>
          <p className="mt-1 text-2xl font-bold text-violet-300">
            {loading ? <Skeleton className="h-8 w-20" /> : money(totalEarned)}
          </p>
        </GlassCard>
      </div>

      {/* Submit form */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
      >
        <GlassCard className="p-5 sm:p-6">
          <div className="mb-4 flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500/30 to-fuchsia-500/10 text-violet-300 ring-1 ring-white/10">
              <MailCheck className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Submit a Gmail</h3>
              <p className="text-[11px] text-violet-100/45">
                Each approved submission earns {money(settings.gmail_reward || settings.gmail_task_rate)}
              </p>
            </div>
          </div>

          {/* Default password info banner */}
          {settings.gmail_default_password && (
            <div className="mb-4 flex items-start gap-2 rounded-lg bg-violet-500/8 p-3 ring-1 ring-inset ring-violet-400/20">
              <KeyRound className="mt-0.5 h-4 w-4 shrink-0 text-violet-300" />
              <div>
                <p className="text-xs font-semibold text-violet-100">
                  Use this password when creating new Gmail accounts:
                </p>
                <code className="mt-0.5 block rounded bg-black/30 px-2 py-1 text-xs font-mono text-violet-200">
                  {settings.gmail_default_password}
                </code>
                <p className="mt-1 text-[10px] text-violet-100/50">
                  Admin requires all submitted Gmails to use this exact password.
                </p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="gmail-addr">Gmail Address *</Label>
              <Input
                id="gmail-addr"
                type="email"
                value={gmailAddress}
                onChange={(e) => setGmailAddress(e.target.value)}
                placeholder="yournewaccount@gmail.com"
                className="border-white/10 bg-white/5"
                disabled={!canSubmit}
              />
              <p className="text-[10px] text-violet-100/40">
                Must end with @gmail.com
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="recovery">Recovery Email (optional)</Label>
              <Input
                id="recovery"
                type="email"
                value={recoveryEmail}
                onChange={(e) => setRecoveryEmail(e.target.value)}
                placeholder="recovery@example.com"
                className="border-white/10 bg-white/5"
                disabled={!canSubmit}
              />
              <p className="text-[10px] text-violet-100/40">
                Helps admin verify account ownership.
              </p>
            </div>
          </div>

          <div className="mt-5 flex items-center justify-between gap-2">
            <div className="flex items-start gap-2 text-[11px] text-violet-100/45">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>
                By submitting you confirm the account was created by you and uses
                the platform's required password.
              </span>
            </div>
            <GlowButton
              variant="primary"
              size="md"
              onClick={submit}
              disabled={submitting || !canSubmit}
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              Submit Gmail
            </GlowButton>
          </div>
        </GlassCard>
      </motion.div>

      {/* Submission history */}
      <GlassCard className="p-5 sm:p-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-fuchsia-500/30 to-rose-500/10 text-fuchsia-300 ring-1 ring-white/10">
              <Mail className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">My Submissions</h3>
              <p className="text-[11px] text-violet-100/45">
                Review status and rewards
              </p>
            </div>
          </div>
          <PremiumBadge tone="violet">{submissions.length}</PremiumBadge>
        </div>

        {loading && submissions.length === 0 ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full rounded-lg" />
            ))}
          </div>
        ) : submissions.length === 0 ? (
          <EmptyState
            icon={<Mail className="h-6 w-6" />}
            title="No submissions yet"
            description="Use the form above to submit your first Gmail account."
            className="py-8"
          />
        ) : (
          <div className="max-h-96 overflow-y-auto pr-1">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="sticky top-0 z-10 bg-[rgba(20,16,32,0.95)] backdrop-blur-xl">
                  <TableRow className="border-white/8 hover:bg-transparent">
                    <TableHead className="text-violet-100/50">Gmail</TableHead>
                    <TableHead className="text-violet-100/50">Password</TableHead>
                    <TableHead className="text-violet-100/50">Reward</TableHead>
                    <TableHead className="text-violet-100/50">Status</TableHead>
                    <TableHead className="text-violet-100/50">Submitted</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {submissions.map((s, i) => (
                    <motion.tr
                      key={s.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{
                        duration: 0.2,
                        delay: Math.min(i * 0.015, 0.25),
                      }}
                      className="border-white/5 hover:bg-white/[0.03]"
                    >
                      <TableCell>
                        <code className="rounded bg-white/5 px-1.5 py-0.5 text-[11px] font-mono text-violet-100 ring-1 ring-inset ring-white/10">
                          {s.gmail_address}
                        </code>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <code className="rounded bg-white/5 px-1.5 py-0.5 text-[11px] font-mono text-violet-100 ring-1 ring-inset ring-white/10">
                            {revealed.has(s.id)
                              ? s.gmail_password || "—"
                              : "•".repeat(
                                  Math.min(10, (s.gmail_password || "").length || 8)
                                )}
                          </code>
                          <button
                            onClick={() => toggleReveal(s.id)}
                            className="flex h-7 w-7 items-center justify-center rounded-md text-violet-200/70 transition hover:bg-white/5 hover:text-white"
                            aria-label={revealed.has(s.id) ? "Hide password" : "Show password"}
                          >
                            {revealed.has(s.id) ? (
                              <EyeOff className="h-3.5 w-3.5" />
                            ) : (
                              <Eye className="h-3.5 w-3.5" />
                            )}
                          </button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm font-bold text-emerald-300 tabular-nums">
                          {money(s.reward)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <PremiumBadge tone={statusTone(s.status)}>
                          {s.status === "pending" && <Clock className="h-3 w-3" />}
                          {s.status === "approved" && (
                            <CheckCircle2 className="h-3 w-3" />
                          )}
                          {s.status === "sold" && <ShieldCheck className="h-3 w-3" />}
                          {(s.status === "rejected" || s.status === "cancelled") && (
                            <XCircle className="h-3 w-3" />
                          )}
                          {s.status}
                        </PremiumBadge>
                        {s.reject_reason && (
                          <p className="mt-1 text-[10px] text-rose-300/80">
                            <AlertTriangle className="mr-1 inline h-2.5 w-2.5" />
                            {s.reject_reason}
                          </p>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-[11px] text-violet-100/70">
                            {formatDateTime(s.created_at)}
                          </span>
                          <span className="text-[10px] text-violet-100/40">
                            {timeAgo(s.created_at)}
                          </span>
                        </div>
                      </TableCell>
                    </motion.tr>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </GlassCard>

      <p className="text-[11px] text-violet-100/40">
        Tip: Submit Gmails created with the platform-required password to speed up
        review.
      </p>
    </div>
  );
}
