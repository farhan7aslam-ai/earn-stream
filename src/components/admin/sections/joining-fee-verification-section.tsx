"use client";

import * as React from "react";
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Hourglass,
  Loader2,
  Mail,
  Maximize2,
  Phone,
  RefreshCw,
  ShieldCheck,
  ThumbsDown,
  ThumbsUp,
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
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { apiFetch, formatDateTime, timeAgo } from "@/lib/client";
import { useCurrency } from "@/lib/currency";
import { toast } from "sonner";
import type { Payment, SafeUser } from "@/lib/types";
import {
  MethodPill,
  MiniSpinner,
  initialsOf,
  methodLabel,
} from "../shared";

interface JoiningFeeVerificationSectionProps {
  pendingCount: number;
  onCountChange: (n: number) => void;
  tick: number;
}

interface JoiningFeeRequest {
  user: SafeUser;
  payment: Payment | null;
}

export function JoiningFeeVerificationSection({
  pendingCount,
  onCountChange,
  tick,
}: JoiningFeeVerificationSectionProps) {
  const { money } = useCurrency();
  const [requests, setRequests] = React.useState<JoiningFeeRequest[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [index, setIndex] = React.useState(0);
  const [zoom, setZoom] = React.useState(false);
  const [rejectNote, setRejectNote] = React.useState("");
  const [actionLoading, setActionLoading] = React.useState<
    null | "approve" | "reject"
  >(null);

  const load = React.useCallback(async () => {
    try {
      const { requests } = await apiFetch<{ requests: JoiningFeeRequest[] }>(
        "/api/admin/joining-fees"
      );
      setRequests(requests);
      onCountChange(requests.length);
    } catch {
      /* ignore — topbar handles auth */
    } finally {
      setLoading(false);
    }
  }, [onCountChange]);

  React.useEffect(() => {
    load();
  }, [load, tick]);

  // keep index in range when list shrinks
  React.useEffect(() => {
    if (index > requests.length - 1) setIndex(Math.max(0, requests.length - 1));
  }, [requests.length, index]);

  const current = requests[index];

  async function act(action: "approve" | "reject") {
    if (!current) return;
    setActionLoading(action);
    try {
      await apiFetch("/api/admin/joining-fees", {
        method: "POST",
        body: JSON.stringify({
          user_id: current.user.id,
          action,
          reason: action === "reject" ? rejectNote.trim() || undefined : undefined,
        }),
      });
      toast.success(
        action === "approve"
          ? `Joining fee approved · ${current.user.full_name || current.user.email} unlocked`
          : "Joining fee rejected · user notified"
      );
      setRejectNote("");
      // remove from list
      setRequests((prev) => prev.filter((_, i) => i !== index));
      onCountChange(Math.max(0, requests.length - 1));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Action failed");
    } finally {
      setActionLoading(null);
    }
  }

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow={<><ShieldCheck className="h-3 w-3" /> Verification</>}
        title="Joining Fee Verification"
        description="Review payment screenshots submitted by new users. Approve to unlock their account, or reject to request a resubmission."
      />

      {/* summary + refresh */}
      <GlassCard className="flex flex-col items-start justify-between gap-3 p-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400/25 to-orange-500/10 text-amber-300 ring-1 ring-white/10">
            <Hourglass className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">
              {pendingCount} pending{pendingCount === 1 ? " request" : " requests"}
            </p>
            <p className="text-xs text-violet-100/45">
              Awaiting your verification
            </p>
          </div>
        </div>
        <GlowButton variant="secondary" size="sm" onClick={load}>
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh
        </GlowButton>
      </GlassCard>

      {loading ? (
        <Skeleton className="h-[32rem] w-full rounded-2xl" />
      ) : requests.length === 0 ? (
        <EmptyState
          icon={<CheckCircle2 className="h-6 w-6" />}
          title="All caught up!"
          description="No joining-fee payments are pending verification right now."
        />
      ) : (
        current && (
          <>
            {/* queue navigator */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <GlowButton
                  variant="ghost"
                  size="icon"
                  onClick={() => setIndex((i) => Math.max(0, i - 1))}
                  disabled={index === 0}
                  aria-label="Previous request"
                >
                  <ChevronLeft className="h-4 w-4" />
                </GlowButton>
                <span className="text-xs font-medium text-violet-100/60">
                  Request{" "}
                  <span className="font-bold text-white">{index + 1}</span> of{" "}
                  <span className="font-bold text-white">{requests.length}</span>
                </span>
                <GlowButton
                  variant="ghost"
                  size="icon"
                  onClick={() =>
                    setIndex((i) => Math.min(requests.length - 1, i + 1))
                  }
                  disabled={index >= requests.length - 1}
                  aria-label="Next request"
                >
                  <ChevronRight className="h-4 w-4" />
                </GlowButton>
              </div>
              <PremiumBadge tone="amber">
                <Hourglass className="h-3 w-3" /> Pending
              </PremiumBadge>
            </div>

            {/* side-by-side viewer */}
            <GlassCard variant="panel" border="gradient" className="overflow-hidden p-0">
              <div className="grid grid-cols-1 lg:grid-cols-2">
                {/* LEFT — screenshot */}
                <div className="relative border-b border-white/8 bg-black/30 p-3 lg:border-b-0 lg:border-r">
                  <div className="mb-2 flex items-center justify-between px-1">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-violet-100/45">
                      Payment screenshot
                    </p>
                    <button
                      onClick={() => setZoom(true)}
                      className="flex items-center gap-1 text-[10px] text-violet-300 transition hover:text-violet-200"
                    >
                      <Maximize2 className="h-3 w-3" /> Zoom
                    </button>
                  </div>
                  <button
                    onClick={() => setZoom(true)}
                    className="block w-full"
                    aria-label="Zoom screenshot"
                  >
                    {current.user.joining_fee_screenshot ? (
                      <img
                        src={current.user.joining_fee_screenshot}
                        alt="Payment screenshot"
                        className="h-[24rem] w-full rounded-xl object-contain bg-black/40 ring-1 ring-white/8 lg:h-[28rem]"
                      />
                    ) : (
                      <div className="flex h-[24rem] w-full items-center justify-center rounded-xl bg-white/[0.02] text-xs text-violet-100/40 ring-1 ring-inset ring-white/8 lg:h-[28rem]">
                        No screenshot attached
                      </div>
                    )}
                  </button>
                </div>

                {/* RIGHT — details + actions */}
                <div className="flex flex-col gap-4 p-5">
                  {/* user */}
                  <div>
                    <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-violet-100/45">
                      Submitted by
                    </p>
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 text-sm font-bold text-white">
                        {initialsOf(current.user.full_name, current.user.email)}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-white">
                          {current.user.full_name || "—"}
                        </p>
                        <p className="flex items-center gap-1 truncate text-[11px] text-violet-100/45">
                          <Mail className="h-3 w-3" />
                          {current.user.email}
                        </p>
                      </div>
                    </div>
                    {current.user.phone ? (
                      <p className="mt-2 flex items-center gap-1.5 text-[11px] text-violet-100/45">
                        <Phone className="h-3 w-3" />
                        {current.user.phone}
                      </p>
                    ) : null}
                  </div>

                  {/* payment details */}
                  <div className="rounded-xl border border-white/8 bg-white/[0.02] p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-violet-100/55">Amount</span>
                      <span className="text-base font-bold text-amber-300">
                        {money(current.payment ? Math.abs(current.payment.amount) : 0)}
                      </span>
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-xs text-violet-100/55">Method</span>
                      {current.payment ? (
                        <MethodPill method={current.payment.method} />
                      ) : (
                        <span className="text-xs text-violet-100/40">—</span>
                      )}
                    </div>
                    {current.payment?.account ? (
                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-xs text-violet-100/55">
                          Sender account
                        </span>
                        <span className="font-mono text-xs font-semibold text-violet-100">
                          {current.payment.account}
                        </span>
                      </div>
                    ) : null}
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-xs text-violet-100/55">Submitted</span>
                      <span className="text-xs text-violet-100/70">
                        {current.user.joining_fee_submitted_at
                          ? timeAgo(current.user.joining_fee_submitted_at)
                          : "—"}
                      </span>
                    </div>
                    {current.user.joining_fee_submitted_at ? (
                      <p className="mt-1 text-[10px] text-violet-100/35">
                        {formatDateTime(current.user.joining_fee_submitted_at)}
                      </p>
                    ) : null}
                  </div>

                  {/* reject reason */}
                  <div>
                    <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-violet-100/45">
                      Rejection reason (optional)
                    </p>
                    <Textarea
                      value={rejectNote}
                      onChange={(e) => setRejectNote(e.target.value)}
                      placeholder="e.g. Screenshot does not match the merchant number / amount…"
                      rows={2}
                      className="resize-none border-white/10 bg-white/5 text-xs text-white placeholder:text-violet-100/30"
                    />
                  </div>

                  {/* actions */}
                  <div className="mt-auto flex flex-col gap-2 sm:flex-row">
                    <GlowButton
                      variant="success"
                      onClick={() => act("approve")}
                      disabled={actionLoading !== null}
                      className="flex-1"
                    >
                      {actionLoading === "approve" ? (
                        <MiniSpinner className="mr-1" />
                      ) : (
                        <ThumbsUp className="h-4 w-4" />
                      )}
                      Approve &amp; Unlock
                    </GlowButton>
                    <GlowButton
                      variant="danger"
                      onClick={() => act("reject")}
                      disabled={actionLoading !== null}
                      className="flex-1"
                    >
                      {actionLoading === "reject" ? (
                        <MiniSpinner className="mr-1" />
                      ) : (
                        <ThumbsDown className="h-4 w-4" />
                      )}
                      Reject
                    </GlowButton>
                  </div>
                </div>
              </div>
            </GlassCard>

            {/* compact queue list */}
            {requests.length > 1 && (
              <GlassCard className="p-4">
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-violet-100/45">
                  Queue
                </p>
                <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                  {requests.map((req, i) => (
                    <button
                      key={req.user.id}
                      onClick={() => setIndex(i)}
                      className={`flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-xs transition ${
                        i === index
                          ? "bg-gradient-to-br from-violet-500/25 to-fuchsia-500/10 text-white ring-1 ring-inset ring-violet-400/40"
                          : "bg-white/[0.02] text-violet-100/60 hover:bg-white/[0.05]"
                      }`}
                    >
                      <span className="flex h-6 w-6 items-center justify-center rounded-md bg-gradient-to-br from-violet-500 to-fuchsia-500 text-[10px] font-bold text-white">
                        {initialsOf(req.user.full_name, req.user.email)}
                      </span>
                      <span className="max-w-[120px] truncate font-medium">
                        {req.user.full_name || req.user.email}
                      </span>
                    </button>
                  ))}
                </div>
              </GlassCard>
            )}
          </>
        )
      )}

      {/* zoom dialog */}
      <Dialog open={zoom} onOpenChange={setZoom}>
        <DialogContent className="max-w-4xl border-white/10 bg-[rgba(9,7,15,0.96)] p-2 backdrop-blur-xl">
          <DialogTitle className="sr-only">Payment screenshot</DialogTitle>
          {current?.user.joining_fee_screenshot ? (
            <img
              src={current.user.joining_fee_screenshot}
              alt="Payment screenshot"
              className="max-h-[85vh] w-full rounded-lg object-contain"
            />
          ) : (
            <div className="flex h-64 items-center justify-center text-sm text-violet-100/40">
              No screenshot
            </div>
          )}
        </DialogContent>
      </Dialog>

      {actionLoading && (
        <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="flex items-center gap-2 rounded-xl bg-[rgba(20,16,32,0.9)] px-4 py-3 text-sm text-white ring-1 ring-white/10">
            <Loader2 className="h-4 w-4 animate-spin" />
            {actionLoading === "approve" ? "Approving…" : "Rejecting…"}
          </div>
        </div>
      )}
    </div>
  );
}
