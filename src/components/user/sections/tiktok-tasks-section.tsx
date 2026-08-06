"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  Clock,
  ExternalLink,
  ImagePlus,
  ListChecks,
  Loader2,
  Lock,
  Music2,
  Send,
  Sparkles,
  X,
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
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { apiFetch, formatDateTime, timeAgo } from "@/lib/client";
import { useCurrency } from "@/lib/currency";
import { toast } from "sonner";
import type {
  PlatformSettings,
  SafeUser,
  TaskSubmission,
  TikTokTask,
  TikTokTaskType,
} from "@/lib/types";

interface TikTokTasksSectionProps {
  user: SafeUser;
  settings: PlatformSettings;
}

function typeTone(type: TikTokTaskType): "violet" | "fuchsia" | "emerald" | "amber" {
  switch (type) {
    case "LIKE":
      return "fuchsia";
    case "FOLLOW":
      return "violet";
    case "COMMENT":
      return "amber";
    case "SHARE":
      return "emerald";
  }
}

function statusTone(status: TaskSubmission["status"]): "amber" | "emerald" | "rose" {
  switch (status) {
    case "pending":
      return "amber";
    case "approved":
      return "emerald";
    case "rejected":
      return "rose";
  }
}

export function TikTokTasksSection({ user, settings }: TikTokTasksSectionProps) {
  const { money } = useCurrency();
  const [tasks, setTasks] = React.useState<TikTokTask[]>([]);
  const [submissions, setSubmissions] = React.useState<TaskSubmission[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [activeTask, setActiveTask] = React.useState<TikTokTask | null>(null);
  const [screenshot, setScreenshot] = React.useState<File | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  const refresh = React.useCallback(async () => {
    setLoading(true);
    try {
      const [t, s] = await Promise.all([
        apiFetch<{ tasks: TikTokTask[] }>("/api/tasks-cms"),
        apiFetch<{ submissions: TaskSubmission[] }>(
          "/api/tasks-cms/my-submissions"
        ),
      ]);
      setTasks(t.tasks);
      setSubmissions(s.submissions);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load tasks");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    refresh();
  }, [refresh]);

  function openTask(t: TikTokTask) {
    setActiveTask(t);
    setScreenshot(null);
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    setScreenshot(e.target.files?.[0] ?? null);
  }

  async function submit() {
    if (!activeTask || !screenshot) {
      toast.error("Please attach a screenshot");
      return;
    }
    setSubmitting(true);
    try {
      const form = new FormData();
      form.append("task_id", activeTask.id);
      form.append("screenshot", screenshot);
      await apiFetch("/api/tasks-cms", { method: "POST", body: form });
      toast.success("Submission sent for review");
      setActiveTask(null);
      setScreenshot(null);
      refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Submission failed");
    } finally {
      setSubmitting(false);
    }
  }

  const canSubmit =
    user.joining_fee_paid && !user.is_suspended && user.joining_fee_status !== "pending_approval";

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow={
          <>
            <Music2 className="h-3 w-3" /> TikTok Tasks
          </>
        }
        title="Micro-Task Marketplace"
        description="Complete TikTok actions — likes, follows, comments and shares — to earn instant rewards. Each approved submission credits your wallet."
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
                    ? "Please pay the joining fee to unlock tasks."
                    : "Your joining fee is awaiting admin approval."}
              </p>
              <p className="text-[11px] text-amber-200/70">
                Task submissions are locked until your account is fully active.
              </p>
            </div>
          </div>
        </GlassCard>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <GlassCard className="p-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-violet-100/45">
            Available Tasks
          </p>
          <p className="mt-1 text-2xl font-bold text-white">
            {loading ? <Skeleton className="h-8 w-12" /> : tasks.length}
          </p>
        </GlassCard>
        <GlassCard className="p-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-violet-100/45">
            Pending Submissions
          </p>
          <p className="mt-1 text-2xl font-bold text-amber-300">
            {loading ? (
              <Skeleton className="h-8 w-12" />
            ) : (
              submissions.filter((s) => s.status === "pending").length
            )}
          </p>
        </GlassCard>
        <GlassCard className="p-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-violet-100/45">
            Approved Rewards
          </p>
          <p className="mt-1 text-2xl font-bold text-emerald-300">
            {loading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              money(
                submissions
                  .filter((s) => s.status === "approved")
                  .reduce((sum, s) => sum + s.reward, 0)
              )
            )}
          </p>
        </GlassCard>
      </div>

      {/* Tasks grid */}
      {loading && tasks.length === 0 ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-44 w-full rounded-2xl" />
          ))}
        </div>
      ) : tasks.length === 0 ? (
        <GlassCard className="p-6">
          <EmptyState
            icon={<ListChecks className="h-6 w-6" />}
            title="No active tasks right now"
            description="Check back soon — admins publish new TikTok tasks regularly."
            className="py-12"
          />
        </GlassCard>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {tasks.map((t, i) => {
            const slotsPct =
              t.max_participants > 0
                ? Math.min(
                    100,
                    Math.round((t.completed_count / t.max_participants) * 100)
                  )
                : 0;
            return (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: Math.min(i * 0.04, 0.25) }}
              >
                <GlassCard className="flex h-full flex-col p-5">
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500/30 to-fuchsia-500/10 text-violet-300 ring-1 ring-white/10">
                        <Music2 className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-base font-bold text-white">
                          {t.title}
                        </h3>
                        {t.tiktok_username && (
                          <p className="text-[11px] text-violet-100/45">
                            @{t.tiktok_username}
                          </p>
                        )}
                      </div>
                    </div>
                    <PremiumBadge tone={typeTone(t.task_type)}>
                      {t.task_type}
                    </PremiumBadge>
                  </div>

                  <p className="mb-4 line-clamp-2 text-xs leading-relaxed text-violet-100/55">
                    {t.description || t.instructions || "Complete this TikTok action and submit a screenshot."}
                  </p>

                  {t.task_type === "COMMENT" && t.comment_text && (
                    <div className="mb-3 rounded-lg bg-amber-500/8 p-2.5 ring-1 ring-inset ring-amber-400/20">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-300/80">
                        Comment to post
                      </p>
                      <p className="mt-0.5 text-xs text-amber-100">
                        “{t.comment_text}”
                      </p>
                    </div>
                  )}

                  <div className="mb-4 grid grid-cols-2 gap-3 text-xs">
                    <div className="rounded-lg bg-white/[0.02] p-2.5 ring-1 ring-inset ring-white/5">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-violet-100/45">
                        Reward
                      </p>
                      <p className="mt-0.5 font-bold text-emerald-300 tabular-nums">
                        {money(t.reward_per_user)}
                      </p>
                    </div>
                    <div className="rounded-lg bg-white/[0.02] p-2.5 ring-1 ring-inset ring-white/5">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-violet-100/45">
                        Slots
                      </p>
                      <p className="mt-0.5 font-bold text-white tabular-nums">
                        {t.remaining_slots}/{t.max_participants || "∞"}
                      </p>
                    </div>
                  </div>

                  <div className="mb-4">
                    <Progress
                      value={slotsPct}
                      className="h-1.5 bg-white/10 [&>div]:bg-gradient-to-r [&>div]:from-violet-400 [&>div]:to-fuchsia-500"
                    />
                  </div>

                  <div className="mt-auto flex items-center gap-2">
                    <GlowButton
                      variant="primary"
                      size="sm"
                      onClick={() => openTask(t)}
                      disabled={!canSubmit}
                      className="flex-1"
                    >
                      <Sparkles className="h-3.5 w-3.5" />
                      Start Task
                    </GlowButton>
                    {t.tiktok_video_url && (
                      <GlowButton
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9"
                        asChild
                      >
                        <a
                          href={t.tiktok_video_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label="Open TikTok video"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </GlowButton>
                    )}
                  </div>
                </GlassCard>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* My submissions */}
      <GlassCard className="p-5 sm:p-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500/30 to-fuchsia-500/10 text-violet-300 ring-1 ring-white/10">
              <ListChecks className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">My Submissions</h3>
              <p className="text-[11px] text-violet-100/45">
                Track review status of your submissions
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
            icon={<ListChecks className="h-6 w-6" />}
            title="No submissions yet"
            description="Submit a screenshot for any task above to see it here."
            className="py-8"
          />
        ) : (
          <div className="max-h-96 overflow-y-auto pr-1">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="sticky top-0 z-10 bg-[rgba(20,16,32,0.95)] backdrop-blur-xl">
                  <TableRow className="border-white/8 hover:bg-transparent">
                    <TableHead className="text-violet-100/50">Task</TableHead>
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
                        <div className="min-w-0">
                          <p className="truncate text-xs font-medium text-white">
                            {s.task_title ?? "Task"}
                          </p>
                          {s.task_type && (
                            <p className="text-[10px] text-violet-100/45">
                              {s.task_type}
                            </p>
                          )}
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
                          {s.status === "rejected" && <XCircle className="h-3 w-3" />}
                          {s.status}
                        </PremiumBadge>
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

      {/* Submit dialog */}
      <Dialog open={!!activeTask} onOpenChange={(o) => !o && setActiveTask(null)}>
        <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto border-white/10 bg-[rgba(15,11,24,0.95)] backdrop-blur-2xl">
          <DialogHeader>
            <DialogTitle className="text-white">
              {activeTask?.title ?? "Task"}
            </DialogTitle>
            <DialogDescription>
              Follow the instructions, then attach a screenshot showing completion.
            </DialogDescription>
          </DialogHeader>

          {activeTask && (
            <div className="space-y-4">
              {activeTask.instructions && (
                <div className="rounded-lg bg-white/[0.02] p-3 ring-1 ring-inset ring-white/5">
                  <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-violet-100/45">
                    Instructions
                  </p>
                  <p className="text-xs leading-relaxed text-violet-100/80">
                    {activeTask.instructions}
                  </p>
                </div>
              )}

              {activeTask.task_type === "COMMENT" && activeTask.comment_text && (
                <div className="rounded-lg bg-amber-500/8 p-3 ring-1 ring-inset ring-amber-400/20">
                  <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-amber-300/80">
                    Comment to post
                  </p>
                  <p className="text-xs text-amber-100">
                    “{activeTask.comment_text}”
                  </p>
                </div>
              )}

              {activeTask.tiktok_video_url && (
                <div className="flex items-center justify-between rounded-lg bg-white/[0.02] p-3 ring-1 ring-inset ring-white/5">
                  <div className="min-w-0">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-violet-100/45">
                      Video URL
                    </p>
                    <code className="truncate text-[11px] text-violet-200">
                      {activeTask.tiktok_video_url}
                    </code>
                  </div>
                  <GlowButton variant="ghost" size="icon" className="h-8 w-8" asChild>
                    <a
                      href={activeTask.tiktok_video_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Open video"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </GlowButton>
                </div>
              )}

              <div className="rounded-lg bg-emerald-500/8 p-3 ring-1 ring-inset ring-emerald-400/20">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-300/80">
                  Reward on approval
                </p>
                <p className="mt-0.5 text-lg font-bold text-emerald-300">
                  {money(activeTask.reward_per_user)}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="screenshot">Screenshot *</Label>
                <label
                  htmlFor="screenshot"
                  className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-white/15 bg-white/[0.02] px-4 py-8 text-center transition hover:border-violet-400/40 hover:bg-white/[0.04]"
                >
                  {screenshot ? (
                    <>
                      <CheckCircle2 className="h-6 w-6 text-emerald-300" />
                      <p className="text-xs font-medium text-white">
                        {screenshot.name}
                      </p>
                      <p className="text-[10px] text-violet-100/45">
                        {(screenshot.size / 1024).toFixed(1)} KB · click to replace
                      </p>
                    </>
                  ) : (
                    <>
                      <ImagePlus className="h-6 w-6 text-violet-300" />
                      <p className="text-xs font-medium text-white">
                        Click to upload screenshot
                      </p>
                      <p className="text-[10px] text-violet-100/45">
                        PNG, JPG up to ~5 MB
                      </p>
                    </>
                  )}
                  <input
                    id="screenshot"
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={onFileChange}
                    className="sr-only"
                  />
                </label>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <GlowButton
              variant="ghost"
              size="sm"
              onClick={() => setActiveTask(null)}
            >
              <X className="h-3.5 w-3.5" /> Cancel
            </GlowButton>
            <GlowButton
              variant="primary"
              size="sm"
              onClick={submit}
              disabled={submitting || !screenshot}
            >
              {submitting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Send className="h-3.5 w-3.5" />
              )}
              Submit for Review
            </GlowButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* settings reference (used implicitly via currency) */}
      <p className="text-[11px] text-violet-100/40">
        Reward rate configured at {money(settings.tiktok_like_rate)} per like ·
        auto-approve: {settings.task_review_auto_approve ? "on" : "off"}
      </p>
    </div>
  );
}
