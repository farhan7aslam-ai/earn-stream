"use client";

import * as React from "react";
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  ImageIcon,
  ListChecks,
  Loader2,
  Maximize2,
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
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group";
import { apiFetch, formatDateTime, formatMoney, timeAgo } from "@/lib/client";
import { toast } from "sonner";
import type {
  SafeUser,
  TaskRow,
  TaskStatus,
  TaskType,
} from "@/lib/types";
import { TaskTypePill, taskTypeLabel } from "../shared";

interface TaskVerificationSectionProps {
  pendingCount: number;
  onCountChange: (n: number) => void;
  tick: number;
}

type StatusFilter = "pending" | "approved" | "rejected";
type TypeFilter = "all" | TaskType;

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
];

const TYPE_OPTIONS: { value: TypeFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "gmail", label: "Gmail" },
  { value: "tiktok", label: "TikTok" },
];

export function TaskVerificationSection({
  pendingCount,
  onCountChange,
  tick,
}: TaskVerificationSectionProps) {
  const [status, setStatus] = React.useState<StatusFilter>("pending");
  const [type, setType] = React.useState<TypeFilter>("all");
  const [tasks, setTasks] = React.useState<TaskRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [index, setIndex] = React.useState(0);
  const [zoomUrl, setZoomUrl] = React.useState<string | null>(null);

  // Lazily fetched user details per task user_id.
  const [userCache, setUserCache] = React.useState<
    Record<string, SafeUser | null>
  >({});

  const refresh = React.useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ status });
      if (type !== "all") params.set("type", type);
      const { tasks: list } = await apiFetch<{ tasks: TaskRow[] }>(
        `/api/admin/tasks?${params.toString()}`
      );
      // Sort: newest first
      list.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      setTasks(list);
      setIndex((prev) => Math.min(prev, Math.max(0, list.length - 1)));
      if (status === "pending" && type === "all") {
        onCountChange(list.length);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load tasks");
    } finally {
      setLoading(false);
    }
  }, [status, type, onCountChange]);

  React.useEffect(() => {
    refresh();
  }, [status, type, tick]);

  // Clamp index when tasks change
  React.useEffect(() => {
    setIndex((i) => Math.min(i, Math.max(0, tasks.length - 1)));
  }, [tasks.length]);

  const current = tasks[index];

  // Lazy-load the current task's user info
  React.useEffect(() => {
    if (!current) return;
    const uid = current.user_id;
    if (uid in userCache) return;
    let cancelled = false;
    setUserCache((prev) => ({ ...prev, [uid]: prev[uid] ?? null }));
    (async () => {
      try {
        const { user } = await apiFetch<{ user: SafeUser }>(
          `/api/admin/users?id=${encodeURIComponent(uid)}`
        );
        if (!cancelled) {
          setUserCache((prev) => ({ ...prev, [uid]: user }));
        }
      } catch {
        if (!cancelled) {
          setUserCache((prev) => ({ ...prev, [uid]: null }));
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [current, userCache]);

  async function actOnTask(
    task: TaskRow,
    action: "approve" | "reject",
    note?: string
  ) {
    // Optimistic removal
    const prev = tasks;
    const next = tasks.filter((t) => t.id !== task.id);
    setTasks(next);
    setIndex((i) => Math.min(i, Math.max(0, next.length - 1)));
    if (status === "pending" && type === "all") {
      onCountChange(next.length);
    }
    try {
      await apiFetch<{ task: TaskRow }>("/api/admin/tasks", {
        method: "POST",
        body: JSON.stringify({ id: task.id, action, note: note || undefined }),
      });
      toast.success(
        action === "approve"
          ? `Task approved · Rs ${formatMoney(task.reward)} credited`
          : "Task rejected"
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Action failed");
      setTasks(prev); // rollback
    }
  }

  const goPrev = () => setIndex((i) => Math.max(0, i - 1));
  const goNext = () => setIndex((i) => Math.min(tasks.length - 1, i + 1));

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow={
          <>
            <ListChecks className="h-3 w-3" /> Task Verification
          </>
        }
        title="Review submissions side-by-side"
        description="Approve or reject task screenshots at a glance. Click any image to zoom full-size. Decisions credit or debit the user's wallet instantly."
      />

      {/* Filter bar */}
      <GlassCard className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-violet-100/45">
            Status
          </span>
          <ToggleGroup
            type="single"
            value={status}
            onValueChange={(v) => v && setStatus(v as StatusFilter)}
            className="rounded-xl bg-white/5 p-1 ring-1 ring-inset ring-white/10"
          >
            {STATUS_OPTIONS.map((opt) => (
              <ToggleGroupItem
                key={opt.value}
                value={opt.value}
                className="rounded-lg px-3 py-1.5 text-xs font-medium data-[state=on]:bg-gradient-to-br data-[state=on]:from-violet-500 data-[state=on]:to-fuchsia-500 data-[state=on]:text-white data-[state=on]:shadow-[0_4px_16px_-6px_rgba(139,92,246,0.6)]"
              >
                {opt.label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-violet-100/45">
            Type
          </span>
          <ToggleGroup
            type="single"
            value={type}
            onValueChange={(v) => v && setType(v as TypeFilter)}
            className="rounded-xl bg-white/5 p-1 ring-1 ring-inset ring-white/10"
          >
            {TYPE_OPTIONS.map((opt) => (
              <ToggleGroupItem
                key={opt.value}
                value={opt.value}
                className="rounded-lg px-3 py-1.5 text-xs font-medium data-[state=on]:bg-gradient-to-br data-[state=on]:from-violet-500 data-[state=on]:to-fuchsia-500 data-[state=on]:text-white data-[state=on]:shadow-[0_4px_16px_-6px_rgba(139,92,246,0.6)]"
              >
                {opt.label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>

          <GlowButton
            variant="ghost"
            size="sm"
            onClick={refresh}
            disabled={loading}
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </GlowButton>
        </div>
      </GlassCard>

      {/* Hero reviewer */}
      {loading && tasks.length === 0 ? (
        <ReviewerSkeleton />
      ) : tasks.length === 0 ? (
        <EmptyState
          icon={<CheckCircle2 className="h-6 w-6" />}
          title="All caught up!"
          description={
            status === "pending"
              ? "No pending tasks to review. New submissions will appear here automatically."
              : `No ${status} tasks match this filter.`
          }
          className="py-16"
        />
      ) : (
        current && (
          <TaskReviewCard
            task={current}
            index={index}
            total={tasks.length}
            user={userCache[current.user_id] ?? undefined}
            onPrev={goPrev}
            onNext={goNext}
            onApprove={() => actOnTask(current, "approve")}
            onReject={(note) => actOnTask(current, "reject", note)}
            onZoom={() => setZoomUrl(current.screenshot_url)}
          />
        )
      )}

      {/* Compact queue list */}
      {tasks.length > 1 && (
        <GlassCard className="p-4 sm:p-5">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-white">Queue</h3>
              <p className="text-[11px] text-violet-100/45">
                {tasks.length} {status} tasks · click to jump
              </p>
            </div>
            <PremiumBadge tone="violet">
              {pendingCount} pending overall
            </PremiumBadge>
          </div>
          <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
            {tasks.map((t, i) => {
              const active = i === index;
              return (
                <button
                  key={t.id}
                  onClick={() => setIndex(i)}
                  className={`group relative flex h-16 w-24 shrink-0 items-center justify-center overflow-hidden rounded-lg ring-1 transition ${
                    active
                      ? "ring-2 ring-violet-400"
                      : "ring-white/10 hover:ring-white/30"
                  }`}
                  title={`${taskTypeLabel[t.type]} · ${timeAgo(t.created_at)}`}
                >
                  {t.screenshot_url ? (
                    <img
                      src={t.screenshot_url}
                      alt={`Submission ${i + 1}`}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-white/[0.04] text-violet-100/30">
                      <ImageIcon className="h-4 w-4" />
                    </div>
                  )}
                  <span className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent px-1 py-0.5 text-left text-[9px] font-semibold text-white">
                    #{i + 1}
                  </span>
                </button>
              );
            })}
          </div>
        </GlassCard>
      )}

      {/* Zoom dialog */}
      <Dialog open={zoomUrl !== null} onOpenChange={(o) => !o && setZoomUrl(null)}>
        <DialogContent
          showCloseButton
          className="max-h-[92vh] max-w-[min(95vw,1100px)] border-white/10 bg-[rgba(9,7,15,0.95)] p-2 backdrop-blur-xl"
        >
          <DialogTitle className="sr-only">Screenshot preview</DialogTitle>
          {zoomUrl && (
            <div className="flex h-[80vh] w-full items-center justify-center overflow-auto rounded-lg">
              <img
                src={zoomUrl}
                alt="Submission screenshot full size"
                className="max-h-full max-w-full object-contain"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface TaskReviewCardProps {
  task: TaskRow;
  index: number;
  total: number;
  user?: SafeUser;
  onPrev: () => void;
  onNext: () => void;
  onApprove: () => void;
  onReject: (note: string) => void;
  onZoom: () => void;
}

function TaskReviewCard({
  task,
  index,
  total,
  user,
  onPrev,
  onNext,
  onApprove,
  onReject,
  onZoom,
}: TaskReviewCardProps) {
  const [note, setNote] = React.useState("");
  const [approving, setApproving] = React.useState(false);
  const [rejecting, setRejecting] = React.useState(false);

  // Clear note when task changes
  React.useEffect(() => {
    setNote("");
  }, [task.id]);

  const userName = user
    ? user.full_name || user.email
    : `User ${task.user_id.slice(0, 8)}`;

  async function approve() {
    setApproving(true);
    try {
      await onApprove();
    } finally {
      setApproving(false);
    }
  }

  async function reject() {
    setRejecting(true);
    try {
      await onReject(note.trim());
    } finally {
      setRejecting(false);
    }
  }

  return (
    <GlassCard variant="panel" border="gradient" className="overflow-hidden p-0">
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/8 px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500/30 to-fuchsia-500/10 text-violet-300 ring-1 ring-white/10">
            <ShieldCheck className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-bold text-white">
              Task {index + 1} of {total}
            </p>
            <p className="text-[11px] text-violet-100/45">
              Submitted {timeAgo(task.created_at)} ·{" "}
              {formatDateTime(task.created_at)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <GlowButton
            variant="ghost"
            size="icon"
            onClick={onPrev}
            disabled={index === 0}
            aria-label="Previous task"
          >
            <ChevronLeft className="h-4 w-4" />
          </GlowButton>
          <GlowButton
            variant="ghost"
            size="icon"
            onClick={onNext}
            disabled={index >= total - 1}
            aria-label="Next task"
          >
            <ChevronRight className="h-4 w-4" />
          </GlowButton>
        </div>
      </div>

      {/* Side-by-side body */}
      <div className="grid grid-cols-1 lg:grid-cols-2">
        {/* LEFT — screenshot */}
        <div className="border-b border-white/8 p-4 lg:border-b-0 lg:border-r">
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-violet-100/55">
              Submitted Screenshot
            </p>
            {task.screenshot_url && (
              <button
                onClick={onZoom}
                className="flex items-center gap-1.5 rounded-lg bg-white/5 px-2 py-1 text-[11px] font-medium text-violet-200 ring-1 ring-inset ring-white/10 transition hover:bg-white/10 hover:text-white"
              >
                <Maximize2 className="h-3 w-3" />
                Zoom
              </button>
            )}
          </div>
          <button
            onClick={task.screenshot_url ? onZoom : undefined}
            className={`group relative flex h-[28rem] w-full items-center justify-center overflow-hidden rounded-xl border border-white/8 bg-black/40 ${
              task.screenshot_url ? "cursor-zoom-in" : "cursor-default"
            }`}
          >
            {task.screenshot_url ? (
              <>
                <img
                  src={task.screenshot_url}
                  alt="Submitted task screenshot"
                  className="h-full w-full object-contain"
                />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 transition group-hover:opacity-100" />
              </>
            ) : (
              <div className="flex flex-col items-center gap-2 text-violet-100/30">
                <ImageIcon className="h-10 w-10" />
                <p className="text-xs">No screenshot attached</p>
              </div>
            )}
          </button>
        </div>

        {/* RIGHT — details */}
        <div className="flex flex-col gap-4 p-5">
          {/* Task meta */}
          <div className="flex flex-wrap items-center gap-2">
            <TaskTypePill type={task.type} />
            <PremiumBadge tone="amber">
              Reward · Rs {formatMoney(task.reward)}
            </PremiumBadge>
            {task.status !== "pending" && (
              <PremiumBadge
                tone={task.status === "approved" ? "emerald" : "rose"}
              >
                {task.status === "approved" ? (
                  <>
                    <CheckCircle2 className="h-3 w-3" /> Approved
                  </>
                ) : (
                  <>
                    <XCircle className="h-3 w-3" /> Rejected
                  </>
                )}
              </PremiumBadge>
            )}
          </div>

          {/* User info */}
          <div className="rounded-xl border border-white/8 bg-white/[0.02] p-3">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-violet-100/45">
              Submitted by
            </p>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 text-sm font-bold text-white">
                {(userName[0] || "?").toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-white">
                  {userName}
                </p>
                <p className="truncate text-[11px] text-violet-100/45">
                  {user?.email ?? task.user_id}
                </p>
              </div>
            </div>
          </div>

          {/* Task URL */}
          <div>
            <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-violet-100/45">
              Task URL
            </p>
            <a
              href={task.task_url}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-2 rounded-lg border border-white/8 bg-white/[0.02] px-3 py-2 text-xs text-violet-200 transition hover:border-white/15 hover:bg-white/[0.04] hover:text-white"
            >
              <ExternalLink className="h-3.5 w-3.5 shrink-0 text-violet-300" />
              <span className="truncate">{task.task_url}</span>
            </a>
          </div>

          {/* Rejection note */}
          <div>
            <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-violet-100/45">
              Rejection note <span className="text-violet-100/30">(optional)</span>
            </p>
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Screenshot does not show the required timestamp…"
              className="min-h-[72px] resize-y border-white/10 bg-white/5 text-sm text-white placeholder:text-violet-100/30"
            />
          </div>

          {/* Actions */}
          <div className="mt-auto flex flex-col gap-2 sm:flex-row">
            <GlowButton
              variant="success"
              onClick={approve}
              disabled={approving || rejecting}
              className="flex-1"
            >
              {approving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Approving…
                </>
              ) : (
                <>
                  <ThumbsUp className="h-4 w-4" />
                  Approve · Rs {formatMoney(task.reward)}
                </>
              )}
            </GlowButton>
            <GlowButton
              variant="danger"
              onClick={reject}
              disabled={approving || rejecting}
              className="flex-1"
            >
              {rejecting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Rejecting…
                </>
              ) : (
                <>
                  <ThumbsDown className="h-4 w-4" />
                  Reject
                </>
              )}
            </GlowButton>
          </div>
        </div>
      </div>
    </GlassCard>
  );
}

function ReviewerSkeleton() {
  return (
    <GlassCard variant="panel" border="gradient" className="overflow-hidden p-0">
      <div className="flex items-center justify-between border-b border-white/8 px-5 py-4">
        <Skeleton className="h-9 w-40 rounded-lg" />
        <Skeleton className="h-9 w-20 rounded-lg" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2">
        <div className="border-b border-white/8 p-4 lg:border-b-0 lg:border-r">
          <Skeleton className="mb-3 h-4 w-32" />
          <Skeleton className="h-[28rem] w-full rounded-xl" />
        </div>
        <div className="space-y-4 p-5">
          <Skeleton className="h-6 w-40 rounded-full" />
          <Skeleton className="h-16 w-full rounded-xl" />
          <Skeleton className="h-10 w-full rounded-lg" />
          <Skeleton className="h-24 w-full rounded-lg" />
          <div className="flex gap-2 pt-2">
            <Skeleton className="h-11 flex-1 rounded-xl" />
            <Skeleton className="h-11 flex-1 rounded-xl" />
          </div>
        </div>
      </div>
    </GlassCard>
  );
}
